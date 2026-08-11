import { describe, it, expect } from "vitest";
import {
  getReinforcements,
  FALLBACK_BULLET,
  MAX_BULLETS,
} from "./reinforcements";
import { BAND_COPY, RESULT_COPY, UI_COPY } from "./content";
import {
  CHOICE_KEYS,
  grade,
  type Answers,
  type ChoiceAnswer,
  type ScaleAnswer,
} from "./scoring";

function uniform(choice: ChoiceAnswer, scale: ScaleAnswer): Answers {
  const a = { q6: scale } as Answers;
  for (const k of CHOICE_KEYS) a[k] = choice;
  return a;
}

const perfect = uniform(2, 10);
const worst = uniform(0, 1);

const BULLETS = {
  plazo: "Revisar si te aplica una excepción al plazo del primer año",
  amarre: "Conectar cada evidencia con el párrafo de tu declaración",
  contexto: "Sumar evidencia de contexto sobre lo que ocurre en tu país",
  cotejo: "Cotejar tu declaración con tu I-589 línea por línea",
  cambios: "Reportar los cambios ocurridos desde que presentaste tu caso",
  documentacion: "Completar y certificar tu documentación",
  fechas: "Fijar con precisión las fechas clave de tu caso",
  bloqueo: "Trabajar cómo contar tu historia sin bloquearte",
  vozAlta: "Practicar tu relato en voz alta antes de la entrevista",
  carpeta: "Actualizar tu carpeta de documentos y evidencias",
  presion: "Ganar seguridad para responder bajo presión",
  interprete: "Conseguir un intérprete para el día de tu entrevista",
} as const;

describe("getReinforcements — debilidades típicas (prioridad alta)", () => {
  it("fuera del plazo sin excepción (q8=0) activa el bullet del año", () => {
    expect(getReinforcements({ ...perfect, q8: 0 })).toContain(BULLETS.plazo);
  });
  it("con excepción argumentada (q8=1) NO lo activa", () => {
    expect(getReinforcements({ ...perfect, q8: 1 })).not.toContain(
      BULLETS.plazo,
    );
  });

  it("evidencias sin citar (q9<=1) activa el bullet del amarre", () => {
    expect(getReinforcements({ ...perfect, q9: 0 })).toContain(BULLETS.amarre);
    expect(getReinforcements({ ...perfect, q9: 1 })).toContain(BULLETS.amarre);
  });

  it("sin contexto de país (q10<=1) activa su bullet", () => {
    expect(getReinforcements({ ...perfect, q10: 0 })).toContain(
      BULLETS.contexto,
    );
    expect(getReinforcements({ ...perfect, q10: 1 })).toContain(
      BULLETS.contexto,
    );
  });

  it("declaración sin cotejar contra la I-589 (q11<=1) activa su bullet", () => {
    expect(getReinforcements({ ...perfect, q11: 0 })).toContain(BULLETS.cotejo);
    expect(getReinforcements({ ...perfect, q11: 1 })).toContain(BULLETS.cotejo);
  });

  it("cambios sin reportar (q12<=1) activa su bullet", () => {
    expect(getReinforcements({ ...perfect, q12: 0 })).toContain(
      BULLETS.cambios,
    );
    expect(getReinforcements({ ...perfect, q12: 1 })).toContain(
      BULLETS.cambios,
    );
  });
});

describe("getReinforcements — reglas de logística", () => {
  it("documentación incompleta (q2<=1) activa su bullet", () => {
    expect(getReinforcements({ ...perfect, q2: 0 })).toContain(
      BULLETS.documentacion,
    );
    expect(getReinforcements({ ...perfect, q2: 1 })).toContain(
      BULLETS.documentacion,
    );
  });

  it("fechas inciertas (q5<=1) activa el bullet de fechas", () => {
    expect(getReinforcements({ ...perfect, q5: 0 })).toContain(BULLETS.fechas);
    expect(getReinforcements({ ...perfect, q5: 1 })).toContain(BULLETS.fechas);
  });

  it("q4=0 activa 'sin bloquearte', no 'en voz alta'", () => {
    const r = getReinforcements({ ...perfect, q4: 0 });
    expect(r).toContain(BULLETS.bloqueo);
    expect(r).not.toContain(BULLETS.vozAlta);
  });

  it("q4=1 activa 'en voz alta', no 'sin bloquearte'", () => {
    const r = getReinforcements({ ...perfect, q4: 1 });
    expect(r).toContain(BULLETS.vozAlta);
    expect(r).not.toContain(BULLETS.bloqueo);
  });

  it("carpeta desactualizada (q3<=1) activa el bullet de expediente", () => {
    expect(getReinforcements({ ...perfect, q3: 0 })).toContain(BULLETS.carpeta);
    expect(getReinforcements({ ...perfect, q3: 1 })).toContain(BULLETS.carpeta);
  });

  it("escala <= 5 activa el bullet de seguridad bajo presión", () => {
    expect(getReinforcements({ ...perfect, q6: 5 })).toContain(BULLETS.presion);
    expect(getReinforcements({ ...perfect, q6: 1 })).toContain(BULLETS.presion);
  });

  it("escala >= 6 NO activa el bullet de seguridad", () => {
    expect(getReinforcements({ ...perfect, q6: 6 })).not.toContain(
      BULLETS.presion,
    );
  });

  it("no sabía del intérprete (q7=0) activa el bullet de intérprete", () => {
    expect(getReinforcements({ ...perfect, q7: 0 })).toContain(
      BULLETS.interprete,
    );
  });

  it("sí sabía del intérprete (q7=2) NO activa el bullet", () => {
    expect(getReinforcements({ ...perfect, q7: 2 })).not.toContain(
      BULLETS.interprete,
    );
  });
});

describe("getReinforcements — límite, prioridad y fallback", () => {
  it("nunca devuelve más de MAX_BULLETS", () => {
    expect(getReinforcements(worst).length).toBeLessThanOrEqual(MAX_BULLETS);
    expect(MAX_BULLETS).toBe(3);
  });

  it("cuando todo aplica, priorizan las debilidades típicas", () => {
    expect(getReinforcements(worst)).toEqual([
      BULLETS.plazo,
      BULLETS.amarre,
      BULLETS.contexto,
    ]);
  });

  it("las de logística aparecen solo si no hay debilidades típicas", () => {
    const soloLogistica: Answers = {
      ...perfect,
      q2: 0, q5: 0, q3: 0,
    };
    expect(getReinforcements(soloLogistica)).toEqual([
      BULLETS.documentacion,
      BULLETS.fechas,
      BULLETS.carpeta,
    ]);
  });

  it("usa el fallback cuando nada aplica (solo alcanzable en banda Alto)", () => {
    expect(getReinforcements(perfect)).toEqual([FALLBACK_BULLET]);
    expect(grade(perfect).band).toBe("alto");
  });

  it("nunca devuelve una lista vacía, para cualquier combinación", () => {
    const values = [0, 1, 2] as const;
    for (const q9 of values)
      for (const q10 of values)
        for (const q11 of values)
          for (const q12 of values)
            for (const q2 of values) {
              const r = getReinforcements({
                ...perfect, q2, q9, q10, q11, q12,
              });
              expect(r.length).toBeGreaterThan(0);
              expect(r.length).toBeLessThanOrEqual(MAX_BULLETS);
            }
  });
});

// ---------------------------------------------------------------------------
// Compliance: barrido sobre TODO el copy visible al usuario.
// ---------------------------------------------------------------------------

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

  // Todos los bullets posibles.
  strings.push(...Object.values(BULLETS), FALLBACK_BULLET);

  return strings;
}

describe("compliance — sin puntajes ni promesas de resultado legal", () => {
  const copy = allUserFacingCopy();

  it("ningún texto contiene un puntaje numérico", () => {
    for (const s of copy) {
      expect(s).not.toMatch(/\b\d+\s*(\/|de)\s*\d+\b/);
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

  it("ningún texto menciona precios ni productos del cliente", () => {
    for (const s of copy) {
      expect(s).not.toMatch(/\$\s*\d/);
      expect(s).not.toMatch(/\bUSD\b/);
      expect(s).not.toMatch(/\bprecio\b/i);
      expect(s).not.toMatch(/simulador/i);
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
