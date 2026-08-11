// Motor de scoring del diagnóstico SFG.
//
// Función pura, sin dependencias de DOM ni de red — testeable en aislamiento.
//
// COMPLIANCE: el score numérico es INTERNO. Se persiste en Supabase para
// análisis editorial, pero jamás se expone al usuario en UI ni se devuelve
// desde el endpoint público. Solo la banda cualitativa viaja al cliente.

export type Band = "alto" | "intermedio" | "por_reforzar";

// Q1-Q5 y Q7 son opciones ordinales: 2 (más preparado), 1, 0.
export type ChoiceAnswer = 0 | 1 | 2;

// Q6 es una escala del 1 al 10.
export type ScaleAnswer =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Las claves q8..q12 se agregaron después de las 7 originales. El orden en
// que se MUESTRAN las preguntas vive en QUESTIONS (content.ts); estos ids
// se mantienen estables para que el JSON guardado en Supabase conserve el
// mismo significado por clave a lo largo del tiempo.
export type Answers = {
  q1: ChoiceAnswer;
  q2: ChoiceAnswer;
  q3: ChoiceAnswer;
  q4: ChoiceAnswer;
  q5: ChoiceAnswer;
  q6: ScaleAnswer;
  q7: ChoiceAnswer;
  q8: ChoiceAnswer;
  q9: ChoiceAnswer;
  q10: ChoiceAnswer;
  q11: ChoiceAnswer;
  q12: ChoiceAnswer;
};

// Todas las claves de opciones (todo menos q6, que es escala).
export const CHOICE_KEYS = [
  "q1", "q2", "q3", "q4", "q5", "q7",
  "q8", "q9", "q10", "q11", "q12",
] as const;

// Score máximo posible = 12 preguntas × 2 puntos = 24.
export const MAX_SCORE = 24;

// Umbrales: mantienen la proporción original (~79% / ~42%).
// Calibrables con data real más adelante.
export const THRESHOLDS = {
  alto: 19,        // 19-24
  intermedio: 10,  // 10-18
  // < 10 → por_reforzar
} as const;

// Normaliza la escala 1-10 de Q6 al mismo rango 0-2 que las demás.
export function normalizeScale(value: ScaleAnswer): 0 | 1 | 2 {
  if (value >= 8) return 2;
  if (value >= 5) return 1;
  return 0;
}

export function calculateScore(answers: Answers): number {
  const choiceTotal = CHOICE_KEYS.reduce((sum, k) => sum + answers[k], 0);
  return choiceTotal + normalizeScale(answers.q6);
}

export function scoreToBand(score: number): Band {
  if (score >= THRESHOLDS.alto) return "alto";
  if (score >= THRESHOLDS.intermedio) return "intermedio";
  return "por_reforzar";
}

export function grade(answers: Answers): { band: Band; score: number } {
  const score = calculateScore(answers);
  return { band: scoreToBand(score), score };
}

// Guarda de validación al llegar al endpoint. Devuelve el error o null.
export function validateAnswers(input: unknown): string | null {
  if (!input || typeof input !== "object") return "invalid_payload";
  const a = input as Record<string, unknown>;

  for (const k of CHOICE_KEYS) {
    const v = a[k];
    if (v !== 0 && v !== 1 && v !== 2) return `invalid_${k}`;
  }

  const q6 = a.q6;
  if (
    typeof q6 !== "number" ||
    !Number.isInteger(q6) ||
    q6 < 1 ||
    q6 > 10
  ) {
    return "invalid_q6";
  }

  return null;
}
