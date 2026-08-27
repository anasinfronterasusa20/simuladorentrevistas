// Genera los bullets de "Lo que conviene reforzar" a partir de las respuestas
// reales de la persona.
//
// Función pura: sin DOM, sin red, sin score. Se calcula en el cliente a partir
// de las respuestas que ya tiene en memoria — el endpoint sigue devolviendo
// únicamente la banda, sin exponer nada numérico.
//
// COMPLIANCE: cada bullet describe una acción de preparación. Ninguno afirma
// ni insinúa un resultado legal, ni usa urgencia basada en miedo.

import type { Answers } from "./scoring";

export const MAX_BULLETS = 3;

// Fallback cuando ninguna regla se activa (solo alcanzable en banda Alto:
// con todas las dimensiones en su mejor opción el score siempre cae en Alto).
export const FALLBACK_BULLET = "Los detalles finos de tu relato";

// Cada regla devuelve la GRAVEDAD de la brecha según lo que respondió la
// persona: 2 = brecha abierta, 1 = brecha parcial, 0 = no aplica.
//
// La selección ordena por gravedad, no por un orden fijo de reglas. Ese es
// el punto: con orden fijo, las cinco preguntas difíciles —que casi nadie
// responde bien— copaban siempre los tres espacios, y dos personas con
// perfiles muy distintos leían exactamente los mismos refuerzos. Ordenando
// por gravedad, lo que aparece es lo que ESA persona respondió peor.
//
// El orden del array sigue importando, pero solo para desempatar entre
// brechas de la misma gravedad: ahí sí mandan primero las "debilidades
// típicas" de la presentación de ventas, que son las de mayor consecuencia.
//
// El texto NOMBRA el área que conviene revisar — no describe el paso a
// paso ni la técnica para resolverla. Eso es intencional: el "cómo" es
// justo lo que se trabaja en la llamada, no algo que la herramienta deba
// entregar en la pantalla de resultado.
type Severity = 0 | 1 | 2;

// Atajo para las preguntas ordinales: 0 → brecha abierta, 1 → parcial.
const ordinal = (v: number): Severity => (v === 0 ? 2 : v === 1 ? 1 : 0);

const RULES: { severity: (a: Answers) => Severity; text: string }[] = [
  {
    // Q8 — fuera del plazo. Solo es brecha si además no hay excepción
    // argumentada; con excepción planteada (valor 1) no cuenta.
    severity: (a) => (a.q8 === 0 ? 2 : 0),
    text: "El plazo del primer año para presentar tu solicitud",
  },
  {
    // Q9 — la declaración no cita las evidencias (el amarre).
    severity: (a) => ordinal(a.q9),
    text: "La conexión entre tu declaración y tus evidencias",
  },
  {
    // Q10 — sin expediente de condiciones de país.
    severity: (a) => ordinal(a.q10),
    text: "La evidencia de contexto sobre lo que pasa en tu país",
  },
  {
    // Q11 — posible inconsistencia entre declaración e I-589.
    severity: (a) => ordinal(a.q11),
    text: "La consistencia entre tu declaración y tu I-589",
  },
  {
    // Q12 — cambios sin reportar desde la solicitud.
    severity: (a) => ordinal(a.q12),
    text: "Los cambios sin reportar desde que presentaste tu caso",
  },
  {
    // Q2 — documentación incompleta o sin traducir/certificar.
    severity: (a) => ordinal(a.q2),
    text: "La traducción y organización de tu documentación",
  },
  {
    // Q5 — fechas clave inciertas (total o parcialmente).
    severity: (a) => ordinal(a.q5),
    text: "Las fechas clave de tu caso",
  },
  {
    // Q4 — le cuesta siquiera pensar la historia completa.
    severity: (a) => (a.q4 === 0 ? 2 : 0),
    text: "Qué tan lista tienes tu historia para contarla",
  },
  {
    // Q4 — la tiene clara pero nunca la ha dicho en voz alta.
    // Excluyente con la anterior: son estados distintos de la misma
    // pregunta, así que nunca pueden salir las dos.
    severity: (a) => (a.q4 === 1 ? 1 : 0),
    text: "La práctica de tu relato en voz alta",
  },
  {
    // Q3 — carpeta de evidencias desactualizada.
    severity: (a) => ordinal(a.q3),
    text: "Qué tan actualizada está tu carpeta de evidencias",
  },
  {
    // Q6 — baja confianza para responder bajo presión.
    // 1-3 es brecha abierta; 4-5 parcial; 6+ no aplica.
    severity: (a) => (a.q6 <= 3 ? 2 : a.q6 <= 5 ? 1 : 0),
    text: "Tu seguridad para responder bajo presión",
  },
  {
    // Q7 — no sabía que necesita intérprete. Es sí/no: o es brecha o no.
    severity: (a) => (a.q7 === 0 ? 2 : 0),
    text: "El intérprete para el día de tu entrevista",
  },
];

export function getReinforcements(answers: Answers): string[] {
  const matched = RULES
    .map((r, index) => ({ text: r.text, sev: r.severity(answers), index }))
    .filter((r) => r.sev > 0)
    // Gravedad primero; el orden del array solo desempata. `sort` en JS es
    // estable, pero comparamos el índice de forma explícita para no
    // depender de ese detalle.
    .sort((a, b) => b.sev - a.sev || a.index - b.index)
    .slice(0, MAX_BULLETS)
    .map((r) => r.text);

  return matched.length > 0 ? matched : [FALLBACK_BULLET];
}

// ---------------------------------------------------------------------------
// Fortalezas: el espejo de las reglas de arriba.
//
// Nombra lo que la persona SÍ tiene resuelto, para que dos personas de la
// misma banda no lean exactamente el mismo texto. Cada frase describe un
// hecho que la persona reportó — nunca una consecuencia sobre su caso.
// ---------------------------------------------------------------------------

export const MAX_STRENGTHS = 3;

// Orden = prioridad, igual que RULES: primero lo de mayor peso.
const STRENGTH_RULES: { applies: (a: Answers) => boolean; text: string }[] = [
  { applies: (a) => a.q9 === 2,  text: "tu declaración ya cita tus evidencias" },
  { applies: (a) => a.q10 === 2, text: "tienes evidencia del contexto de tu país" },
  { applies: (a) => a.q11 === 2, text: "tu declaración y tu I-589 coinciden" },
  { applies: (a) => a.q8 === 2,  text: "presentaste dentro del primer año" },
  { applies: (a) => a.q2 === 2,  text: "tu documentación está completa y traducida" },
  { applies: (a) => a.q12 === 2, text: "tus cambios están reportados" },
  { applies: (a) => a.q5 === 2,  text: "tienes tus fechas confirmadas" },
  { applies: (a) => a.q4 === 2,  text: "ya has contado tu historia en voz alta" },
  { applies: (a) => a.q3 === 2,  text: "tu carpeta está al día" },
  { applies: (a) => a.q6 >= 8,   text: "te sientes con seguridad para responder" },
  { applies: (a) => a.q7 === 2,  text: "ya sabías lo del intérprete" },
];

export function getStrengths(answers: Answers): string[] {
  return STRENGTH_RULES.filter((r) => r.applies(answers))
    .slice(0, MAX_STRENGTHS)
    .map((r) => r.text);
}

// Une las fortalezas en una frase natural: "a", "a y b", "a, b y c".
// Devuelve null si no hay ninguna — preferimos omitir la línea antes que
// inventarle un logro a quien todavía no tiene ninguno.
export function formatStrengths(strengths: string[]): string | null {
  if (strengths.length === 0) return null;
  if (strengths.length === 1) return strengths[0];
  return `${strengths.slice(0, -1).join(", ")} y ${strengths[strengths.length - 1]}`;
}
