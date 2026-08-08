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
const RULES: { applies: (a: Answers) => boolean; text: string }[] = [
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
    // Q7 — acompañamiento sin confirmar.
    applies: (a) => a.q7 <= 1,
    text: "Definir quién te acompañará el día de tu entrevista",
  },
];

export function getReinforcements(answers: Answers): string[] {
  const matched = RULES.filter((r) => r.applies(answers))
    .slice(0, MAX_BULLETS)
    .map((r) => r.text);

  return matched.length > 0 ? matched : [FALLBACK_BULLET];
}
