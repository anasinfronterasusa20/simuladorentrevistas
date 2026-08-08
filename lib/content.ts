// Todo el contenido editable de la herramienta vive aquí.
// Cambios de copy no requieren tocar UI ni lógica.

import type { Band, ChoiceAnswer } from "./scoring";

export const CALENDLY_URL =
  "https://calendly.com/asesoriasinfronterasglobal03/diagnostico-de-viabilidad-webinar";

export const CONSENT_COPY =
  "Acepto que el equipo de Sin Fronteras Global me contacte por correo o WhatsApp para darle seguimiento a mi simulador. Tus respuestas nos ayudan a prepararte mejor — no se comparten con nadie más.";

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
  titleLead: string;      // Parte del título en cream (sobre navy).
  titleAccent: string;    // Palabra/frase que sale en gold.
  accent: string;         // Cormorant Garamond italic. Una línea emocional.
  body: string[];         // 2-3 líneas de cuerpo.
  cta: string;            // Texto del botón que lleva a Calendly.
};

// Bold inline con `**palabra**` — renderizado por `renderRich()`.
export const BAND_COPY: Record<Band, BandCopy> = {
  alto: {
    titleLead: "Nivel de preparación:",
    titleAccent: "Alto",
    accent: "Has hecho la tarea. Se nota.",
    body: [
      "Tu proceso tiene estructura y las señales apuntan a que llegas a tu entrevista con **base sólida**.",
      "Aún así, en esta etapa los **detalles pequeños** son los que marcan la diferencia — el tipo de cosas que solo un ojo experto detecta antes de que se conviertan en un problema.",
    ],
    cta: "Agendar mi llamada de revisión",
  },
  intermedio: {
    titleLead: "Nivel de preparación:",
    titleAccent: "Intermedio",
    accent: "Ya avanzaste. Falta ordenar el resto.",
    body: [
      "Tienes piezas importantes en su lugar y a la vez **piezas sueltas** que, si no se ordenan a tiempo, pueden terminar jugando en tu contra el día de la entrevista.",
      "El siguiente paso es **identificar exactamente qué falta cerrar** y en qué orden, antes de que el reloj apriete.",
    ],
    cta: "Agendar mi llamada de preparación",
  },
  por_reforzar: {
    titleLead: "Nivel de preparación:",
    titleAccent: "Por Reforzar",
    accent: "Estás al inicio. Eso también es un lugar válido.",
    body: [
      "La mayoría de personas que hoy tienen su caso resuelto **empezaron exactamente donde tú estás**. Lo importante es que no lo transites a ciegas.",
      "El siguiente paso es **trazar contigo el mapa completo** — qué va primero, qué puede esperar, y qué necesitas tener listo antes de tu próxima fecha.",
    ],
    cta: "Agendar mi llamada de orientación",
  },
};

// Copy transversal de la UI.
export const UI_COPY = {
  intro: {
    kicker: "Simulador para tu entrevista",
    titleLead: "Vamos a ver",
    titleAccent: "dónde estás parado hoy",
    accent:
      "Siete preguntas. Cinco minutos. Una lectura honesta de tu momento.",
    body:
      "Este simulador no evalúa tu caso legal ni predice resultados. Es una herramienta para que tú y nuestro equipo tengamos **claridad** sobre en qué punto de la **preparación** estás — y qué necesitas **priorizar antes de tu entrevista**.",
    startCta: "Comenzar simulador",
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
    "Este simulador es una herramienta orientativa. No sustituye asesoría legal ni predice el resultado de ningún proceso migratorio.",
  errors: {
    generic: "No pudimos guardar tu respuesta. Intenta de nuevo en un momento.",
    invalidEmail: "Revisa tu correo — el formato no parece correcto.",
    invalidPhone: "Revisa tu WhatsApp — falta el código de país o algún dígito.",
    missingConsent: "Necesitamos tu autorización para poder darte seguimiento.",
    missingFields: "Faltan datos por completar.",
  },
} as const;
