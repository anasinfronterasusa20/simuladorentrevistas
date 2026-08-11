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
export const FALLBACK_BULLET =
  "Repasar los detalles finos de tu relato antes de la cita";

// Orden = prioridad. Se toman los primeros MAX_BULLETS que apliquen.
//
// Las primeras cinco reglas corresponden a las "debilidades típicas" de la
// presentación de ventas: son las brechas de mayor consecuencia, así que
// desplazan a las de logística cuando ambas aplican.
const RULES: { applies: (a: Answers) => boolean; text: string }[] = [
  {
    // Q8 — presentó fuera del año sin excepción argumentada.
    applies: (a) => a.q8 === 0,
    text: "Revisar si te aplica una excepción al plazo del primer año",
  },
  {
    // Q9 — la declaración no cita las evidencias (el amarre).
    applies: (a) => a.q9 <= 1,
    text: "Conectar cada evidencia con el párrafo de tu declaración",
  },
  {
    // Q10 — sin expediente de condiciones de país.
    applies: (a) => a.q10 <= 1,
    text: "Sumar evidencia de contexto sobre lo que ocurre en tu país",
  },
  {
    // Q11 — posible inconsistencia entre declaración e I-589.
    applies: (a) => a.q11 <= 1,
    text: "Cotejar tu declaración con tu I-589 línea por línea",
  },
  {
    // Q12 — cambios sin reportar desde la solicitud.
    applies: (a) => a.q12 <= 1,
    text: "Reportar los cambios ocurridos desde que presentaste tu caso",
  },
  {
    // Q2 — documentación incompleta o sin traducir/certificar.
    applies: (a) => a.q2 <= 1,
    text: "Completar y certificar tu documentación",
  },
  {
    // Q5 — fechas clave inciertas (total o parcialmente).
    applies: (a) => a.q5 <= 1,
    text: "Fijar con precisión las fechas clave de tu caso",
  },
  {
    // Q4 — le cuesta siquiera pensar la historia completa.
    applies: (a) => a.q4 === 0,
    text: "Trabajar cómo contar tu historia sin bloquearte",
  },
  {
    // Q4 — la tiene clara pero nunca la ha dicho en voz alta.
    applies: (a) => a.q4 === 1,
    text: "Practicar tu relato en voz alta antes de la entrevista",
  },
  {
    // Q3 — carpeta de evidencias desactualizada.
    applies: (a) => a.q3 <= 1,
    text: "Actualizar tu carpeta de documentos y evidencias",
  },
  {
    // Q6 — baja confianza para responder bajo presión.
    applies: (a) => a.q6 <= 5,
    text: "Ganar seguridad para responder bajo presión",
  },
  {
    // Q7 — no sabía que necesita intérprete.
    applies: (a) => a.q7 === 0,
    text: "Conseguir un intérprete para el día de tu entrevista",
  },
];

export function getReinforcements(answers: Answers): string[] {
  const matched = RULES.filter((r) => r.applies(answers))
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
