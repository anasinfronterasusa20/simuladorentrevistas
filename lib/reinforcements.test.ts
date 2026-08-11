import { describe, it, expect } from "vitest";
import {
  getReinforcements,
  FALLBACK_BULLET,
  MAX_BULLETS,
} from "./reinforcements";
import { BAND_COPY, RESULT_COPY, UI_COPY } from "./content";
import { grade, type Answers } from "./scoring";

const perfect: Answers = { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 10, q7: 2 };
const worst: Answers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 1, q7: 0 };

describe("getReinforcements — reglas de mapeo", () => {
  it("documentación incompleta (q2=0) activa el bullet de documentación", () => {
    const r = getReinforcements({ ...perfect, q2: 0 });
    expect(r).toContain("Completar y certificar tu documentación");
  });

  it("documentación sin traducir (q2=1) también lo activa", () => {
    const r = getReinforcements({ ...perfect, q2: 1 });
    expect(r).toContain("Completar y certificar tu documentación");
  });

  it("fechas inciertas (q5<=1) activa el bullet de fechas", () => {
    expect(getReinforcements({ ...perfect, q5: 0 })).toContain(
      "Fijar con precisión las fechas clave de tu caso",
    );
    expect(getReinforcements({ ...perfect, q5: 1 })).toContain(
      "Fijar con precisión las fechas clave de tu caso",
    );
  });

  it("q4=0 activa 'sin bloquearte', no 'en voz alta'", () => {
    const r = getReinforcements({ ...perfect, q4: 0 });
    expect(r).toContain("Trabajar cómo contar tu historia sin bloquearte");
    expect(r).not.toContain(
      "Practicar tu relato en voz alta antes de la entrevista",
    );
  });

  it("q4=1 activa 'en voz alta', no 'sin bloquearte'", () => {
    const r = getReinforcements({ ...perfect, q4: 1 });
    expect(r).toContain(
      "Practicar tu relato en voz alta antes de la entrevista",
    );
    expect(r).not.toContain("Trabajar cómo contar tu historia sin bloquearte");
  });

  it("carpeta desactualizada (q3<=1) activa el bullet de expediente", () => {
    expect(getReinforcements({ ...perfect, q3: 0 })).toContain(
      "Actualizar tu carpeta de documentos y evidencias",
    );
    expect(getReinforcements({ ...perfect, q3: 1 })).toContain(
      "Actualizar tu carpeta de documentos y evidencias",
    );
  });

  it("escala <= 5 activa el bullet de seguridad bajo presión", () => {
    expect(getReinforcements({ ...perfect, q6: 5 })).toContain(
      "Ganar seguridad para responder bajo presión",
    );
    expect(getReinforcements({ ...perfect, q6: 1 })).toContain(
      "Ganar seguridad para responder bajo presión",
    );
  });

  it("escala >= 6 NO activa el bullet de seguridad", () => {
    expect(getReinforcements({ ...perfect, q6: 6 })).not.toContain(
      "Ganar seguridad para responder bajo presión",
    );
  });

  it("no sabía del intérprete (q7=0) activa el bullet de intérprete", () => {
    expect(getReinforcements({ ...perfect, q7: 0 })).toContain(
      "Conseguir un intérprete para el día de tu entrevista",
    );
  });

  it("sí sabía del intérprete (q7=2) NO activa el bullet", () => {
    expect(getReinforcements({ ...perfect, q7: 2 })).not.toContain(
      "Conseguir un intérprete para el día de tu entrevista",
    );
  });
});

describe("getReinforcements — límite y fallback", () => {
  it("nunca devuelve más de MAX_BULLETS", () => {
    expect(getReinforcements(worst).length).toBeLessThanOrEqual(MAX_BULLETS);
    expect(MAX_BULLETS).toBe(3);
  });

  it("respeta el orden de prioridad cuando todo aplica", () => {
    expect(getReinforcements(worst)).toEqual([
      "Completar y certificar tu documentación",
      "Fijar con precisión las fechas clave de tu caso",
      "Trabajar cómo contar tu historia sin bloquearte",
    ]);
  });

  it("usa el fallback cuando nada aplica (solo alcanzable en banda Alto)", () => {
    const r = getReinforcements(perfect);
    expect(r).toEqual([FALLBACK_BULLET]);
    expect(grade(perfect).band).toBe("alto");
  });

  it("nunca devuelve una lista vacía, para cualquier combinación", () => {
    const values = [0, 1, 2] as const;
    for (const q2 of values)
      for (const q3 of values)
        for (const q4 of values)
          for (const q5 of values)
            for (const q7 of values) {
              const r = getReinforcements({
                q1: 2, q2, q3, q4, q5, q6: 10, q7,
              });
              expect(r.length).toBeGreaterThan(0);
              expect(r.length).toBeLessThanOrEqual(MAX_BULLETS);
            }
  });
});

// ---------------------------------------------------------------------------
// Compliance: barrido sobre TODO el copy visible al usuario.
// ---------------------------------------------------------------------------

// Reúne cada string que puede terminar en pantalla.
function allUserFacingCopy(): string[] {
  const strings: string[] = [];

  for (const band of ["alto", "intermedio", "por_reforzar"] as const) {
    const c = BAND_COPY[band];
    strings.push(c.title, c.paragraph, c.loop, c.cta);
  }

  strings.push(
    RESULT_COPY.greeting("Ana"),
    RESULT_COPY.reinforcementsTitle,
    RESULT_COPY.ctaMicrocopy,
  );

  strings.push(
    UI_COPY.intro.kicker,
    UI_COPY.intro.titleLead,
    UI_COPY.intro.titleAccent,
    UI_COPY.intro.accent,
    UI_COPY.intro.body,
    UI_COPY.intro.startCta,
    UI_COPY.disclaimer,
  );

  // Todos los bullets posibles, activados por fuerza bruta.
  const values = [0, 1, 2] as const;
  for (const q2 of values)
    for (const q3 of values)
      for (const q4 of values)
        for (const q5 of values)
          for (const q7 of values)
            for (const q6 of [1, 5, 6, 10] as const)
              strings.push(
                ...getReinforcements({ q1: 2, q2, q3, q4, q5, q6, q7 }),
              );

  return strings;
}

describe("compliance — sin puntajes ni promesas de resultado legal", () => {
  const copy = allUserFacingCopy();

  it("ningún texto contiene un puntaje numérico", () => {
    // Excepción: "20 minutos" del microcopy y "Siete preguntas" son duración,
    // no puntaje. Buscamos patrones de score explícito.
    for (const s of copy) {
      expect(s).not.toMatch(/\b\d+\s*(\/|de)\s*\d+\b/); // "8/14", "8 de 14"
      expect(s).not.toMatch(/\bpuntaje\b/i);
      expect(s).not.toMatch(/\bpuntuaci[oó]n\b/i);
      expect(s).not.toMatch(/\bscore\b/i);
      expect(s).not.toMatch(/%/);
    }
  });

  it("ningún texto promete un resultado legal", () => {
    const forbidden = [
      /probabilidad/i,
      /garantiz/i,
      /vas a ganar/i,
      /ganar[aá]s/i,
      /ser[aá] aprobad/i,
      /aprobaci[oó]n asegurad/i,
      /te aseguramos/i,
      /\b[eé]xito asegurad/i,
    ];
    for (const s of copy) {
      for (const re of forbidden) {
        expect(s, `texto: "${s}"`).not.toMatch(re);
      }
    }
  });

  it("ningún texto usa urgencia basada en miedo o escasez artificial", () => {
    const forbidden = [
      /en riesgo/i,
      /podr[ií]as perder/i,
      /[uú]ltima oportunidad/i,
      /[uú]ltimos cupos/i,
      /cupos limitados/i,
      /se agota/i,
      /antes de que sea (demasiado )?tarde/i,
      /deportaci[oó]n/i,
    ];
    for (const s of copy) {
      for (const re of forbidden) {
        expect(s, `texto: "${s}"`).not.toMatch(re);
      }
    }
  });

  it("ningún texto menciona precios", () => {
    for (const s of copy) {
      expect(s).not.toMatch(/\$\s*\d/);
      expect(s).not.toMatch(/\bUSD\b/);
      expect(s).not.toMatch(/\bprecio\b/i);
    }
  });

  it("las 3 bandas tienen los 4 campos con contenido", () => {
    for (const band of ["alto", "intermedio", "por_reforzar"] as const) {
      const c = BAND_COPY[band];
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.paragraph.length).toBeGreaterThan(0);
      expect(c.loop.length).toBeGreaterThan(0);
      expect(c.cta.length).toBeGreaterThan(0);
    }
  });
});

describe("RESULT_COPY.greeting", () => {
  it("incluye el nombre cuando existe", () => {
    expect(RESULT_COPY.greeting("María")).toBe("Listo, María.");
  });
  it("degrada limpio cuando el nombre viene vacío", () => {
    expect(RESULT_COPY.greeting("")).toBe("Listo.");
  });
});
