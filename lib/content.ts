// Todo el contenido editable de la herramienta vive aquí.
// Cambios de copy no requieren tocar UI ni lógica.

import type { Band, ChoiceAnswer } from "./scoring";

// Configurable vía NEXT_PUBLIC_CALENDLY_URL en Vercel sin tocar código.
// El valor hardcodeado es el fallback: si la env var no está definida, el
// botón sigue funcionando con el link actual.
export const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  "https://calendly.com/asesoriasinfronterasglobal03/diagnostico-de-viabilidad-webinar";

export const CONSENT_COPY =
  "Acepto que el equipo de Sin Fronteras Global me contacte por correo o WhatsApp para darle seguimiento a mi diagnóstico. Tus respuestas nos ayudan a prepararte mejor — no se comparten con nadie más.";

// ---------------------------------------------------------------------------
// Preguntas — orden y texto fijos por instrucción del cliente.
// ---------------------------------------------------------------------------

export type ChoiceQuestion = {
  id: "q1" | "q2" | "q3" | "q4" | "q5" | "q7";
  type: "choice";
  text: string;
  options: { value: ChoiceAnswer; label: string }[];
};

export type ScaleQuestion = {
  id: "q6";
  type: "scale";
  text: string;
  min: 1;
  max: 10;
  minLabel: string;
  maxLabel: string;
};

export type Question = ChoiceQuestion | ScaleQuestion;

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "choice",
    text: "¿En qué momento de tu proceso estás hoy?",
    options: [
      { value: 2, label: "Ya tuve mi entrevista de miedo creíble y espero la del asilo" },
      { value: 1, label: "Tengo fecha para la entrevista de asilo, pero aún no he tenido la de miedo creíble" },
      { value: 0, label: "Todavía no tengo ninguna fecha confirmada" },
    ],
  },
  {
    id: "q2",
    type: "choice",
    text: "¿Cómo está tu documentación en este momento?",
    options: [
      { value: 2, label: "Todo organizado, traducido y certificado" },
      { value: 1, label: "Tengo los documentos, pero me falta traducirlos o certificarlos" },
      { value: 0, label: "Apenas estoy juntando lo que tengo" },
    ],
  },
  {
    id: "q3",
    type: "choice",
    text: "¿Cuándo fue la última vez que actualizaste tu carpeta de documentos y evidencias?",
    options: [
      { value: 2, label: "La actualicé hace poco (menos de un mes)" },
      { value: 1, label: "Tiene varios meses sin que le agregue nada" },
      { value: 0, label: "No recuerdo la última vez, o nunca la he actualizado" },
    ],
  },
  {
    id: "q4",
    type: "choice",
    text: "Cuando piensas en contar tu historia, ¿cómo te sientes?",
    options: [
      { value: 2, label: "La he contado en voz alta varias veces, con calma" },
      { value: 1, label: "La tengo clara en mi cabeza, pero nunca la he dicho en voz alta" },
      { value: 0, label: "Me cuesta hasta pensarla completa sin sentirme mal" },
    ],
  },
  {
    id: "q5",
    type: "choice",
    text: "¿Qué tan claras tienes las fechas clave de tu caso (cuándo entraste a EE.UU., cuándo presentaste tu I-589)?",
    options: [
      { value: 2, label: "Las tengo todas claras y confirmadas" },
      { value: 1, label: "Algunas sí, otras no estoy segura/o" },
      { value: 0, label: "La verdad, no las tengo claras" },
    ],
  },
  {
    id: "q6",
    type: "scale",
    text: "Del 1 al 10, ¿qué tan preparado te sientes hoy para responder preguntas difíciles sin bloquearte?",
    min: 1,
    max: 10,
    minLabel: "Nada preparado",
    maxLabel: "Totalmente preparado",
  },
  {
    id: "q7",
    type: "choice",
    text: "El día de tu entrevista, ¿quién va a estar contigo?",
    options: [
      { value: 2, label: "Ya sé exactamente quién me va a acompañar" },
      { value: 1, label: "Tengo a alguien en mente, pero no lo hemos hablado todavía" },
      { value: 0, label: "Todavía no sé quién podría acompañarme" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Resultado — copy de cada banda.
//
// Reglas duras (compliance):
//   - Sin puntajes numéricos.
//   - Sin porcentajes ni "probabilidad".
//   - Sin promesas legales ("vas a ganar", "garantizamos").
//   - Tono cálido y directo, sin lenguaje corporativo.
//
// La línea `accent` va en Cormorant Garamond italic (único uso permitido
// de esa tipografía). Es una línea emocional puntual, no un subtítulo
// funcional.
// ---------------------------------------------------------------------------

export type BandCopy = {
  title: string;      // Título grande de la banda. Gold, Montserrat 900.
  paragraph: string;  // Lectura del momento de la persona. 2-3 líneas.
  loop: string;       // Loop abierto: puente entre el resultado y la llamada.
  cta: string;        // Texto del botón que lleva a Calendly.
};

// Bold inline con `**palabra**` — renderizado por `renderRich()`.
export const BAND_COPY: Record<Band, BandCopy> = {
  alto: {
    title: "Nivel de Preparación: Alto",
    paragraph:
      "Vas bien. Tienes tu documentación en orden, tus fechas claras y ya has practicado contar tu historia. Eso te pone por delante de la mayoría de las personas que llegan a su entrevista.",
    loop:
      "Lo que sigue no es empezar de cero — es **afinar**. Los detalles que marcan la diferencia en una entrevista real no se ven desde adentro, se detectan con alguien que ya ha estado en cientos de estos procesos.",
    cta: "Afinar mi preparación",
  },
  intermedio: {
    title: "Nivel de Preparación: Intermedio",
    paragraph:
      "Tienes avanzado lo esencial, pero hay piezas sueltas. No es que estés mal preparado — es que todavía no tienes todo junto y en orden, y eso en una entrevista se nota.",
    loop:
      "Ya sabes en qué punto estás. Lo que todavía no tienes es el **plan exacto** para cerrar esas brechas antes de tu fecha. Eso es justo lo que resolvemos en una llamada.",
    cta: "Ver mi plan de preparación",
  },
  por_reforzar: {
    title: "Nivel de Preparación: Por Reforzar",
    paragraph:
      "Hay bastante por trabajar, y está bien que lo sepas ahora y no la semana antes de tu entrevista. Muchas personas llegan a este punto sin darse cuenta de todo lo que falta.",
    loop:
      "Este diagnóstico te muestra dónde estás parado. El siguiente paso es **armar el orden** en que hay que trabajar cada cosa — y ahí sí conviene hacerlo acompañado.",
    cta: "Empezar a prepararme",
  },
};

// Copy fijo de la pantalla de resultado (igual para las 3 bandas).
export const RESULT_COPY = {
  greeting: (nombre: string) => (nombre ? `Listo, ${nombre}.` : "Listo."),
  reinforcementsTitle: "Lo que conviene reforzar",
  ctaMicrocopy: "Sin costo. 20 minutos. Hablas directamente con nuestro equipo.",
} as const;

// Copy transversal de la UI.
export const UI_COPY = {
  intro: {
    kicker: "Diagnóstico Flash",
    titleLead: "Vamos a ver",
    titleAccent: "dónde estás parado hoy",
    accent:
      "Siete preguntas. Unos minutos. Una lectura honesta de tu momento.",
    body:
      "Este diagnóstico no evalúa tu caso legal ni predice resultados. Es una herramienta para que tú y nuestro equipo tengan **claridad** sobre en qué punto de tu **preparación** estás — y qué conviene **reforzar antes de tu entrevista**.",
    startCta: "Empezar mi diagnóstico",
  },
  optIn: {
    title: "Un último paso antes de tu resultado",
    accent: "Para que podamos darle seguimiento a tu resultado.",
    nombreLabel: "Nombre",
    nombrePlaceholder: "Tu nombre",
    emailLabel: "Correo",
    emailPlaceholder: "tucorreo@ejemplo.com",
    whatsappLabel: "WhatsApp",
    whatsappHelp: "Toca la bandera para elegir tu país.",
    submitCta: "Ver mi resultado",
    submitting: "Preparando tu resultado...",
  },
  disclaimer:
    "Este diagnóstico es una herramienta orientativa. No sustituye asesoría legal ni predice el resultado de ningún proceso migratorio.",
  errors: {
    generic: "No pudimos guardar tu respuesta. Intenta de nuevo en un momento.",
    invalidEmail: "Revisa tu correo — el formato no parece correcto.",
    invalidPhone: "Revisa tu WhatsApp — falta el código de país o algún dígito.",
    missingConsent: "Necesitamos tu autorización para poder darte seguimiento.",
    missingFields: "Faltan datos por completar.",
  },
} as const;
