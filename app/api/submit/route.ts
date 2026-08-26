import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isValidPhoneNumber } from "libphonenumber-js";
import { buildCrmPayload, sendToCrm } from "@/lib/crm";
import { grade, validateAnswers, type Answers } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitPayload = {
  nombre?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  consent_outreach?: unknown;
  respuestas?: unknown;
  webinar_source?: unknown;
};

export async function POST(req: NextRequest) {
  let body: SubmitPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // -- Validación de campos de contacto --------------------------------------
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const whatsapp =
    typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
  const consent = body.consent_outreach === true;

  if (!nombre || nombre.length > 120) {
    return NextResponse.json({ error: "invalid_nombre" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!whatsapp || !isValidPhoneNumber(whatsapp)) {
    return NextResponse.json({ error: "invalid_whatsapp" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "missing_consent" }, { status: 400 });
  }

  // -- Validación de respuestas ----------------------------------------------
  const answersError = validateAnswers(body.respuestas);
  if (answersError) {
    return NextResponse.json({ error: answersError }, { status: 400 });
  }
  const answers = body.respuestas as Answers;

  // -- Scoring ---------------------------------------------------------------
  const { band, score } = grade(answers);

  // -- Persistencia ----------------------------------------------------------
  const webinarSource =
    typeof body.webinar_source === "string" && body.webinar_source.length < 60
      ? body.webinar_source
      : null;

  const userAgent = req.headers.get("user-agent") ?? null;
  const referrer = req.headers.get("referer") ?? null;

  // Generamos el id acá para poder mandárselo al CRM como clave de
  // idempotencia sin tener que hacer un SELECT de vuelta contra una tabla
  // que es solo-INSERT.
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("diagnostics").insert({
      id,
      created_at: createdAt,
      nombre,
      email,
      whatsapp,
      respuestas: answers,
      banda: band,
      score_interno: score,
      consent_outreach: true,
      webinar_source: webinarSource,
      user_agent: userAgent,
      referrer,
    });
    if (error) {
      console.error("[submit] supabase insert error", error);
      return NextResponse.json({ error: "storage_failure" }, { status: 500 });
    }
  } catch (err) {
    console.error("[submit] unexpected error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  // -- CRM (Kommo vía n8n) ---------------------------------------------------
  // Deliberadamente NO bloqueante para el resultado: el diagnóstico ya está
  // guardado. Si el webhook falla, queda registrado en el log y la fila de
  // Supabase permite reconciliar después. Nunca le negamos su resultado a
  // alguien porque el CRM esté caído.
  const crm = await sendToCrm(
    buildCrmPayload({
      id,
      nombre,
      email,
      whatsapp,
      band,
      score,
      answers,
      webinarSource,
      createdAt,
    }),
  );
  if (!crm.ok && crm.reason !== "webhook_no_configurado") {
    console.error(`[submit] fallo el webhook del CRM (${crm.reason}) id=${id}`);
  }

  // -- Respuesta al cliente --------------------------------------------------
  // COMPLIANCE: solo devolvemos la banda. Nunca el score numérico.
  return NextResponse.json({ band }, { status: 200 });
}
