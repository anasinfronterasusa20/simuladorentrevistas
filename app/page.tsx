"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { BrandStrip } from "@/components/Brand";
import {
  BAND_COPY,
  CALENDLY_URL,
  CONSENT_COPY,
  QUESTIONS,
  RESULT_COPY,
  UI_COPY,
  type Question,
} from "@/lib/content";
import { getReinforcements } from "@/lib/reinforcements";
import { renderRich } from "@/lib/renderRich";
import type { Answers, Band, ChoiceAnswer, ScaleAnswer } from "@/lib/scoring";

type Step =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "optin" }
  | { kind: "result"; band: Band; nombre: string };

type PartialAnswers = Partial<Answers>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// iframe height auto-resize: comunica al padre (WordPress) la altura real.
// ---------------------------------------------------------------------------
function useIframeHeightBroadcast() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return;
    const send = () => {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage(
        { type: "sfg-diagnostico-height", height: h },
        "*",
      );
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);
}

// Scroll al top al cambiar de step (relevante para móvil, donde la altura
// crece y el usuario podría estar mirando el pie del step anterior).
function useScrollToTopOnStep(step: Step) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step.kind, step.kind === "question" ? step.index : null]);
}

// ---------------------------------------------------------------------------
// Página raíz.
//
// Render client-only tras montaje: extensiones del navegador (Bitdefender,
// Grammarly, LastPass) inyectan atributos en el DOM antes de que React hidrate
// y disparan warnings de hidratación imposibles de suprimir por elemento.
// Renderizando null en SSR y solo el contenido después de useEffect, evitamos
// que React vea el DOM modificado durante hidratación → cero warnings, cero
// overlay de "N issues" en dev.
// ---------------------------------------------------------------------------
export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="page" aria-hidden="true" />;
  return (
    <Suspense fallback={null}>
      <Diagnostico />
    </Suspense>
  );
}

function Diagnostico() {
  useIframeHeightBroadcast();

  const searchParams = useSearchParams();
  const webinarSource = searchParams.get("w");

  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [answers, setAnswers] = useState<PartialAnswers>({});

  useScrollToTopOnStep(step);

  const start = () => setStep({ kind: "question", index: 0 });

  const answerQuestion = (
    id: keyof Answers,
    value: ChoiceAnswer | ScaleAnswer,
  ) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const goNext = () => {
    if (step.kind !== "question") return;
    const nextIndex = step.index + 1;
    if (nextIndex >= QUESTIONS.length) {
      setStep({ kind: "optin" });
    } else {
      setStep({ kind: "question", index: nextIndex });
    }
  };

  const goBack = () => {
    if (step.kind === "question" && step.index > 0) {
      setStep({ kind: "question", index: step.index - 1 });
    } else if (step.kind === "question" && step.index === 0) {
      setStep({ kind: "intro" });
    } else if (step.kind === "optin") {
      setStep({ kind: "question", index: QUESTIONS.length - 1 });
    }
  };

  return (
    <div className="page">
      <main className="stage">
        {step.kind === "intro" && <IntroStep onStart={start} />}

        {step.kind === "question" && (
          <QuestionStep
            key={`q-${step.index}`}
            question={QUESTIONS[step.index]}
            index={step.index}
            total={QUESTIONS.length}
            value={answers[QUESTIONS[step.index].id]}
            onAnswer={answerQuestion}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step.kind === "optin" && (
          <OptInStep
            answers={answers as Answers}
            webinarSource={webinarSource}
            onBack={goBack}
            onDone={(band, nombre) =>
              setStep({ kind: "result", band, nombre })
            }
          />
        )}

        {step.kind === "result" && (
          <ResultStep
            band={step.band}
            nombre={step.nombre}
            answers={answers as Answers}
          />
        )}
      </main>

      <footer className="footer">
        <p>{UI_COPY.disclaimer}</p>
      </footer>
    </div>
  );
}

// ===========================================================================
// Steps
// ===========================================================================

function IntroStep({ onStart }: { onStart: () => void }) {
  return (
    <section className="surface surface--navy on-navy">
      <BrandStrip variant="on-navy" />
      <div className="surface__content">
        <p className="kicker">{UI_COPY.intro.kicker}</p>
        <h1 className="headline headline--hero">
          {UI_COPY.intro.titleLead}{" "}
          <span className="headline__accent">{UI_COPY.intro.titleAccent}</span>
        </h1>
        <p className="accent">{UI_COPY.intro.accent}</p>
        <p className="body">{renderRich(UI_COPY.intro.body)}</p>
      </div>
      <div className="btn-row btn-row--start">
        <button className="btn btn--gold" onClick={onStart}>
          {UI_COPY.intro.startCta}
        </button>
      </div>
    </section>
  );
}

function QuestionStep({
  question,
  index,
  total,
  value,
  onAnswer,
  onNext,
  onBack,
}: {
  question: Question;
  index: number;
  total: number;
  value: ChoiceAnswer | ScaleAnswer | undefined;
  onAnswer: (id: keyof Answers, v: ChoiceAnswer | ScaleAnswer) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const percent = ((index + 1) / total) * 100;
  const canAdvance = value !== undefined;

  return (
    <section className="surface surface--cream on-cream">
      <BrandStrip variant="on-cream" />

      <div className="progress">
        <div className="progress__track">
          <div className="progress__fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="progress__count">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Umbral empírico: por encima de ~100 caracteres el titular en
          Montserrat Black mayúsculas empieza a comerse el viewport móvil. */}
      <h2
        className={`headline headline--lg${
          question.text.length > 100 ? " headline--dense" : ""
        }`}
      >
        {question.text}
      </h2>

      <p className="question-context">{question.context}</p>

      {question.type === "choice" ? (
        <ChoiceOptions
          question={question}
          selectedValue={value as ChoiceAnswer | undefined}
          onSelect={(v) => onAnswer(question.id, v)}
        />
      ) : (
        <ScaleInput
          question={question}
          selectedValue={value as ScaleAnswer | undefined}
          onSelect={(v) => onAnswer(question.id, v)}
        />
      )}

      <div className="btn-row">
        <button className="btn btn--ghost" onClick={onBack} type="button">
          ← Atrás
        </button>
        <button
          className="btn btn--primary"
          onClick={onNext}
          disabled={!canAdvance}
          type="button"
        >
          {index === total - 1 ? "Continuar" : "Siguiente"}
        </button>
      </div>
    </section>
  );
}

function ChoiceOptions({
  question,
  selectedValue,
  onSelect,
}: {
  question: Extract<Question, { type: "choice" }>;
  selectedValue: ChoiceAnswer | undefined;
  onSelect: (v: ChoiceAnswer) => void;
}) {
  return (
    <div className="options" role="radiogroup" aria-label={question.text}>
      {question.options.map((opt) => {
        const isSelected = selectedValue === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`option ${isSelected ? "option--selected" : ""}`}
            onClick={() => onSelect(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ScaleInput({
  question,
  selectedValue,
  onSelect,
}: {
  question: Extract<Question, { type: "scale" }>;
  selectedValue: ScaleAnswer | undefined;
  onSelect: (v: ScaleAnswer) => void;
}) {
  const values = Array.from({ length: 10 }, (_, i) => (i + 1) as ScaleAnswer);
  return (
    <div className="scale" role="radiogroup" aria-label={question.text}>
      <div className="scale__grid">
        {values.map((v) => {
          const isSelected = selectedValue === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`scale__btn ${isSelected ? "scale__btn--selected" : ""}`}
              onClick={() => onSelect(v)}
            >
              {v}
            </button>
          );
        })}
      </div>
      <div className="scale__anchors">
        <span>1 · {question.minLabel}</span>
        <span>10 · {question.maxLabel}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Opt-in
// ---------------------------------------------------------------------------

function OptInStep({
  answers,
  webinarSource,
  onBack,
  onDone,
}: {
  answers: Answers;
  webinarSource: string | null;
  onBack: () => void;
  onDone: (band: Band, nombre: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!nombre.trim()) return setError(UI_COPY.errors.missingFields);
    if (!EMAIL_RE.test(email.trim()))
      return setError(UI_COPY.errors.invalidEmail);
    if (!whatsapp || !isValidPhoneNumber(whatsapp))
      return setError(UI_COPY.errors.invalidPhone);
    if (!consent) return setError(UI_COPY.errors.missingConsent);

    setSubmitting(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          whatsapp,
          consent_outreach: true,
          respuestas: answers,
          webinar_source: webinarSource,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        setError(UI_COPY.errors.generic);
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { band: Band };
      onDone(data.band, nombre.trim());
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError(UI_COPY.errors.generic);
      setSubmitting(false);
    }
  };

  return (
    <section className="surface surface--cream on-cream">
      <BrandStrip variant="on-cream" />
      <p className="kicker">Paso final</p>
      <h2 className="headline headline--lg">
        Un último paso{" "}
        <span className="headline__accent">antes de tu resultado</span>
      </h2>
      <p className="accent">{UI_COPY.optIn.accent}</p>

      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="nombre">
            {UI_COPY.optIn.nombreLabel}
          </label>
          <input
            id="nombre"
            className="input"
            type="text"
            autoComplete="given-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={UI_COPY.optIn.nombrePlaceholder}
            maxLength={120}
            disabled={submitting}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="email">
            {UI_COPY.optIn.emailLabel}
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={UI_COPY.optIn.emailPlaceholder}
            maxLength={200}
            disabled={submitting}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="whatsapp">
            {UI_COPY.optIn.whatsappLabel}
          </label>
          <PhoneInput
            id="whatsapp"
            defaultCountry="MX"
            value={whatsapp}
            onChange={setWhatsapp}
            countryCallingCodeEditable={false}
            disabled={submitting}
          />
          <span className="field__help">{UI_COPY.optIn.whatsappHelp}</span>
        </div>

        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={submitting}
          />
          <span className="consent__text">{CONSENT_COPY}</span>
        </label>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <div className="btn-row">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onBack}
            disabled={submitting}
          >
            ← Atrás
          </button>
          <button
            type="submit"
            className="btn btn--gold"
            disabled={submitting}
          >
            {submitting ? (
              <span className="loading">
                <span className="spinner" aria-hidden="true" />
                {UI_COPY.optIn.submitting}
              </span>
            ) : (
              UI_COPY.optIn.submitCta
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Result (navy hero)
// ---------------------------------------------------------------------------

function ResultStep({
  band,
  nombre,
  answers,
}: {
  band: Band;
  nombre: string;
  answers: Answers;
}) {
  const copy = BAND_COPY[band];
  const reinforcements = getReinforcements(answers);

  return (
    <section className="surface surface--navy on-navy">
      <BrandStrip variant="on-navy" />

      <p className="result-greeting">{RESULT_COPY.greeting(nombre)}</p>

      <h2 className="headline headline--hero headline--gold">{copy.title}</h2>

      <p className="body">{copy.paragraph}</p>

      <div className="reinforce">
        <h3 className="reinforce__title">
          {RESULT_COPY.reinforcementsTitle}
        </h3>
        <ul className="reinforce__list">
          {reinforcements.map((item) => (
            <li key={item} className="reinforce__item">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="body">{renderRich(copy.loop)}</p>

      <div className="result-cta-row">
        {/* target="_blank": la herramienta vive dentro de un iframe en
            WordPress — Calendly nunca debe abrirse dentro del iframe. */}
        <a
          className="btn btn--gold"
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.cta}
        </a>
        <p className="result-microcopy">{RESULT_COPY.ctaMicrocopy}</p>
      </div>
    </section>
  );
}
