import { describe, it, expect } from "vitest";
import {
  Answers,
  calculateScore,
  grade,
  normalizeScale,
  scoreToBand,
  validateAnswers,
  MAX_SCORE,
} from "./scoring";

const bestCase: Answers = {
  q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 10, q7: 2,
};
const worstCase: Answers = {
  q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 1, q7: 0,
};
const middleCase: Answers = {
  q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 6, q7: 1,
};

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
    expect(MAX_SCORE).toBe(14);
  });
  it("da cero con todas las peores respuestas", () => {
    expect(calculateScore(worstCase)).toBe(0);
  });
  it("da 7 con todas las respuestas del medio", () => {
    expect(calculateScore(middleCase)).toBe(7);
  });
});

describe("scoreToBand", () => {
  it("11-14 → alto", () => {
    expect(scoreToBand(11)).toBe("alto");
    expect(scoreToBand(14)).toBe("alto");
  });
  it("6-10 → intermedio", () => {
    expect(scoreToBand(6)).toBe("intermedio");
    expect(scoreToBand(10)).toBe("intermedio");
  });
  it("0-5 → por_reforzar", () => {
    expect(scoreToBand(0)).toBe("por_reforzar");
    expect(scoreToBand(5)).toBe("por_reforzar");
  });
  it("bordes exactos", () => {
    expect(scoreToBand(10)).toBe("intermedio");
    expect(scoreToBand(11)).toBe("alto");
    expect(scoreToBand(5)).toBe("por_reforzar");
    expect(scoreToBand(6)).toBe("intermedio");
  });
});

describe("grade (end-to-end)", () => {
  it("caso mejor → alto", () => {
    expect(grade(bestCase).band).toBe("alto");
  });
  it("caso peor → por_reforzar", () => {
    expect(grade(worstCase).band).toBe("por_reforzar");
  });
  it("caso medio → intermedio", () => {
    expect(grade(middleCase).band).toBe("intermedio");
  });

  it("caso mixto realista: docs OK pero narrativa débil → intermedio", () => {
    const mixed: Answers = {
      q1: 2, q2: 2, q3: 1, q4: 0, q5: 1, q6: 5, q7: 1,
    };
    // 2+2+1+0+1+1+1 = 8
    expect(grade(mixed)).toEqual({ band: "intermedio", score: 8 });
  });

  it("caso mixto realista: muy preparado con un solo hueco → alto", () => {
    const mixed: Answers = {
      q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 6, q7: 0,
    };
    // 2+2+2+2+2+1+0 = 11
    expect(grade(mixed)).toEqual({ band: "alto", score: 11 });
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
  it("rechaza opción fuera de rango en Q1-Q5, Q7", () => {
    expect(validateAnswers({ ...bestCase, q1: 3 })).toBe("invalid_q1");
    expect(validateAnswers({ ...bestCase, q7: -1 })).toBe("invalid_q7");
    expect(validateAnswers({ ...bestCase, q3: "2" })).toBe("invalid_q3");
  });
  it("rechaza Q6 fuera de 1-10", () => {
    expect(validateAnswers({ ...bestCase, q6: 0 })).toBe("invalid_q6");
    expect(validateAnswers({ ...bestCase, q6: 11 })).toBe("invalid_q6");
    expect(validateAnswers({ ...bestCase, q6: 5.5 })).toBe("invalid_q6");
    expect(validateAnswers({ ...bestCase, q6: "8" })).toBe("invalid_q6");
  });
});

describe("compliance guard (score numérico permanece interno)", () => {
  it("grade() nunca devuelve texto que contenga porcentajes o promesas", () => {
    const cases = [bestCase, worstCase, middleCase];
    for (const c of cases) {
      const result = grade(c);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toMatch(/probabilidad/i);
      expect(serialized).not.toMatch(/%/);
      expect(serialized).not.toMatch(/garant/i);
      expect(serialized).not.toMatch(/vas a ganar/i);
    }
  });
  it("la banda es siempre uno de los 3 valores permitidos", () => {
    const cases = [bestCase, worstCase, middleCase];
    for (const c of cases) {
      expect(["alto", "intermedio", "por_reforzar"]).toContain(grade(c).band);
    }
  });
});
