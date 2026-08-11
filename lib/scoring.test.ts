import { describe, it, expect } from "vitest";
import {
  Answers,
  CHOICE_KEYS,
  calculateScore,
  grade,
  normalizeScale,
  scoreToBand,
  validateAnswers,
  MAX_SCORE,
  THRESHOLDS,
  type ChoiceAnswer,
  type ScaleAnswer,
} from "./scoring";

// Construye un set de respuestas con el mismo valor en todas las de opción.
function uniform(choice: ChoiceAnswer, scale: ScaleAnswer): Answers {
  const a = { q6: scale } as Answers;
  for (const k of CHOICE_KEYS) a[k] = choice;
  return a;
}

const bestCase = uniform(2, 10);
const worstCase = uniform(0, 1);
const middleCase = uniform(1, 6);

describe("normalizeScale (Q6 1-10 → 0-2)", () => {
  it("mapea 8, 9, 10 a 2 (más preparado)", () => {
    expect(normalizeScale(8)).toBe(2);
    expect(normalizeScale(9)).toBe(2);
    expect(normalizeScale(10)).toBe(2);
  });
  it("mapea 5, 6, 7 a 1 (intermedio)", () => {
    expect(normalizeScale(5)).toBe(1);
    expect(normalizeScale(6)).toBe(1);
    expect(normalizeScale(7)).toBe(1);
  });
  it("mapea 1-4 a 0 (menos preparado)", () => {
    expect(normalizeScale(1)).toBe(0);
    expect(normalizeScale(4)).toBe(0);
  });
});

describe("calculateScore", () => {
  it("da el máximo con todas las mejores respuestas", () => {
    expect(calculateScore(bestCase)).toBe(MAX_SCORE);
    expect(MAX_SCORE).toBe(24);
  });
  it("da cero con todas las peores respuestas", () => {
    expect(calculateScore(worstCase)).toBe(0);
  });
  it("da 12 con todas las respuestas del medio", () => {
    // 11 opciones × 1 punto + escala 6 → 1 punto.
    expect(calculateScore(middleCase)).toBe(12);
  });
  it("MAX_SCORE equivale a 2 puntos por cada una de las 12 preguntas", () => {
    expect(MAX_SCORE).toBe((CHOICE_KEYS.length + 1) * 2);
  });
});

describe("scoreToBand", () => {
  it("19-24 → alto", () => {
    expect(scoreToBand(19)).toBe("alto");
    expect(scoreToBand(24)).toBe("alto");
  });
  it("10-18 → intermedio", () => {
    expect(scoreToBand(10)).toBe("intermedio");
    expect(scoreToBand(18)).toBe("intermedio");
  });
  it("0-9 → por_reforzar", () => {
    expect(scoreToBand(0)).toBe("por_reforzar");
    expect(scoreToBand(9)).toBe("por_reforzar");
  });
  it("bordes exactos alrededor de los umbrales", () => {
    expect(scoreToBand(THRESHOLDS.alto - 1)).toBe("intermedio");
    expect(scoreToBand(THRESHOLDS.alto)).toBe("alto");
    expect(scoreToBand(THRESHOLDS.intermedio - 1)).toBe("por_reforzar");
    expect(scoreToBand(THRESHOLDS.intermedio)).toBe("intermedio");
  });
});

describe("grade (end-to-end)", () => {
  it("caso mejor → alto", () => {
    expect(grade(bestCase)).toEqual({ band: "alto", score: 24 });
  });
  it("caso peor → por_reforzar", () => {
    expect(grade(worstCase)).toEqual({ band: "por_reforzar", score: 0 });
  });
  it("caso medio → intermedio", () => {
    expect(grade(middleCase)).toEqual({ band: "intermedio", score: 12 });
  });

  it("fuerte en logística pero flojo en las debilidades típicas → intermedio", () => {
    // Documentación y fechas en orden, pero sin amarre, sin contexto de país
    // y con posible inconsistencia: el perfil que la presentación describe
    // como el más común.
    const a: Answers = {
      ...bestCase,
      q9: 0,   // no conectó evidencias con la declaración
      q10: 0,  // sin contexto de país
      q11: 1,  // nunca comparó declaración con I-589
      q12: 1,  // cambios sin reportar con certeza
    };
    // 24 - 2 - 2 - 1 - 1 = 18
    expect(grade(a)).toEqual({ band: "intermedio", score: 18 });
  });

  it("un solo hueco sobre un caso fuerte se mantiene en alto", () => {
    const a: Answers = { ...bestCase, q7: 0 };
    expect(grade(a)).toEqual({ band: "alto", score: 22 });
  });
});

describe("validateAnswers", () => {
  it("acepta un payload válido", () => {
    expect(validateAnswers(bestCase)).toBeNull();
    expect(validateAnswers(worstCase)).toBeNull();
    expect(validateAnswers(middleCase)).toBeNull();
  });
  it("rechaza payload que no es objeto", () => {
    expect(validateAnswers(null)).toBe("invalid_payload");
    expect(validateAnswers("string")).toBe("invalid_payload");
    expect(validateAnswers(42)).toBe("invalid_payload");
  });
  it("exige que estén TODAS las preguntas de opción", () => {
    for (const k of CHOICE_KEYS) {
      const incomplete = { ...bestCase } as Record<string, unknown>;
      delete incomplete[k];
      expect(validateAnswers(incomplete)).toBe(`invalid_${k}`);
    }
  });
  it("rechaza opción fuera de rango", () => {
    expect(validateAnswers({ ...bestCase, q1: 3 })).toBe("invalid_q1");
    expect(validateAnswers({ ...bestCase, q9: -1 })).toBe("invalid_q9");
    expect(validateAnswers({ ...bestCase, q12: "2" })).toBe("invalid_q12");
  });
  it("rechaza Q6 fuera de 1-10", () => {
    expect(validateAnswers({ ...bestCase, q6: 0 })).toBe("invalid_q6");
    expect(validateAnswers({ ...bestCase, q6: 11 })).toBe("invalid_q6");
    expect(validateAnswers({ ...bestCase, q6: 5.5 })).toBe("invalid_q6");
    expect(validateAnswers({ ...bestCase, q6: "8" })).toBe("invalid_q6");
  });
});

describe("compliance (score numérico permanece interno)", () => {
  it("grade() nunca devuelve texto con porcentajes ni promesas", () => {
    for (const c of [bestCase, worstCase, middleCase]) {
      const serialized = JSON.stringify(grade(c));
      expect(serialized).not.toMatch(/probabilidad/i);
      expect(serialized).not.toMatch(/%/);
      expect(serialized).not.toMatch(/garant/i);
      expect(serialized).not.toMatch(/vas a ganar/i);
    }
  });
  it("la banda es siempre uno de los 3 valores permitidos", () => {
    for (let s = 0; s <= MAX_SCORE; s++) {
      expect(["alto", "intermedio", "por_reforzar"]).toContain(scoreToBand(s));
    }
  });
});
