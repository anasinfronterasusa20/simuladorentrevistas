// Envío del diagnóstico al CRM (Kommo) a través de un webhook de n8n.
//
// Diseño:
//   - Toda la lógica de Kommo vive en n8n, no aquí. Esta app solo entrega los
//     datos; qué hacer con ellos (buscar, actualizar, crear, etiquetar) se
//     decide y se cambia en n8n sin tocar código ni redesplegar.
//   - El envío NUNCA rompe la experiencia de la persona. Si n8n está caído o
//     lento, el diagnóstico ya quedó guardado en Supabase y el resultado se
//     muestra igual. El CRM se puede reconciliar después desde la tabla.
//
// COMPLIANCE: `score_interno` viaja al CRM porque es una herramienta interna
// del equipo de ventas y sirve para priorizar. NUNCA debe volver a la persona
// —ni en pantalla, ni en un correo, ni en un mensaje de WhatsApp.

import { BAND_COPY, QUESTIONS } from "./content";
import { getReinforcements, getStrengths } from "./reinforcements";
import type { Answers, Band } from "./scoring";

// Tope de espera al webhook. La persona ya esperó el insert en Supabase;
// más allá de esto preferimos devolverle su resultado y reconciliar luego.
const WEBHOOK_TIMEOUT_MS = 4000;

const BAND_LABEL: Record<Band, string> = {
  alto: "Alto",
  intermedio: "Intermedio",
  por_reforzar: "Por Reforzar",
};

export type CrmPayload = ReturnType<typeof buildCrmPayload>;

// Traduce las respuestas numéricas a texto legible.
// Es lo más útil del payload para quien atiende la llamada: puede abrir el
// lead en Kommo y leer exactamente qué respondió la persona, sin descifrar
// un JSON de números.
function readableAnswers(answers: Answers) {
  return QUESTIONS.map((q) => {
    const value = answers[q.id];
    if (q.type === "scale") {
      return {
        pregunta: q.text,
        respuesta: `${value} de 10`,
      };
    }
    const option = q.options.find((o) => o.value === value);
    return {
      pregunta: q.text,
      respuesta: option?.label ?? `(valor ${value})`,
    };
  });
}

export function buildCrmPayload(input: {
  id: string;
  nombre: string;
  email: string;
  whatsapp: string;
  band: Band;
  score: number;
  answers: Answers;
  webinarSource: string | null;
  createdAt: string;
}) {
  const { band, answers } = input;
  return {
    // Clave de idempotencia: si n8n reintenta, puede detectar el duplicado
    // en vez de crear dos leads.
    id: input.id,
    created_at: input.createdAt,

    // Contacto. El teléfono ya viene normalizado a E.164 (+58412…), que es
    // el formato con el que Kommo puede hacer match contra WhatsApp.
    nombre: input.nombre,
    email: input.email,
    whatsapp: input.whatsapp,

    // Resultado.
    banda: band,
    banda_label: BAND_LABEL[band],

    // INTERNO — no exponer a la persona.
    score_interno: input.score,

    // Material para la llamada.
    refuerzos: getReinforcements(answers),
    fortalezas: getStrengths(answers),
    cta_mostrado: BAND_COPY[band].cta,

    // Respuestas: crudas para análisis, legibles para el equipo.
    respuestas: answers,
    respuestas_legibles: readableAnswers(answers),

    // Origen.
    webinar_source: input.webinarSource,
    consent_outreach: true,
  };
}

// Envía el payload. Devuelve el resultado en vez de lanzar: el llamador
// decide qué hacer, y en la práctica solo lo registra en el log.
export async function sendToCrm(
  payload: CrmPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return { ok: false, reason: "webhook_no_configurado" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Secreto compartido opcional: permite que n8n rechace peticiones que no
    // vengan de esta app. Si la variable no está definida, no se envía.
    const secret = process.env.CRM_WEBHOOK_SECRET;
    if (secret) headers["X-SFG-Signature"] = secret;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return { ok: false, reason: name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}
