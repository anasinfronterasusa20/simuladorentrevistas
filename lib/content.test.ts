import { describe, it, expect } from "vitest";
import { QUESTIONS } from "./content";
import { MAX_SCORE, THRESHOLDS } from "./scoring";

// Guardas estructurales sobre el set de preguntas.
//
// El copy de las opciones cambia seguido; los valores ordinales que las
// respaldan NO deben cambiar sin querer. Estos tests fallan si una edición
// de copy rompe la coherencia del scoring.

describe("QUESTIONS — estructura", () => {
  it("tiene exactamente 7 preguntas, en orden q1..q7", () => {
    expect(QUESTIONS).toHaveLength(7);
    expect(QUESTIONS.map((q) => q.id)).toEqual([
      "q1", "q2", "q3", "q4", "q5", "q6", "q7",
    ]);
  });

  it("solo q6 es escala; el resto son de opciones", () => {
    for (const q of QUESTIONS) {
      expect(q.type).toBe(q.id === "q6" ? "scale" : "choice");
    }
  });

  it("cada pregunta de opciones ofrece el mejor valor (2) y el peor (0)", () => {
    for (const q of QUESTIONS) {
      if (q.type !== "choice") continue;
      const values = q.options.map((o) => o.value);
      expect(values, `${q.id} debe permitir el máximo`).toContain(2);
      expect(values, `${q.id} debe permitir el mínimo`).toContain(0);
    }
  });

  it("ninguna pregunta repite un valor entre sus opciones", () => {
    for (const q of QUESTIONS) {
      if (q.type !== "choice") continue;
      const values = q.options.map((o) => o.value);
      expect(new Set(values).size, `${q.id} tiene valores duplicados`).toBe(
        values.length,
      );
    }
  });

  it("las opciones van de mejor a peor (orden descendente)", () => {
    for (const q of QUESTIONS) {
      if (q.type !== "choice") continue;
      const values = q.options.map((o) => o.value);
      const sorted = [...values].sort((a, b) => b - a);
      expect(values, `${q.id} no está ordenada de mejor a peor`).toEqual(sorted);
    }
  });

  it("ninguna opción tiene texto vacío", () => {
    for (const q of QUESTIONS) {
      expect(q.text.trim().length).toBeGreaterThan(0);
      if (q.type !== "choice") continue;
      for (const o of q.options) {
        expect(o.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("el puntaje máximo alcanzable coincide con MAX_SCORE", () => {
    // 7 preguntas × 2 puntos. Si se agrega o quita una pregunta, este test
    // falla y obliga a recalibrar MAX_SCORE y THRESHOLDS a la vez.
    expect(QUESTIONS.length * 2).toBe(MAX_SCORE);
    expect(THRESHOLDS.alto).toBeLessThanOrEqual(MAX_SCORE);
    expect(THRESHOLDS.intermedio).toBeLessThan(THRESHOLDS.alto);
  });
});
