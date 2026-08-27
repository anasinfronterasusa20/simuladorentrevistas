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

// `context`: una o dos líneas debajo de la pregunta que explican por qué
// importa. En las preguntas no obvias hace doble trabajo — da contexto y
// enseña algo que la persona quizá no sabía.
//
// COMPLIANCE: es texto informativo, no asesoría legal. Nada de plazos
// aplicados al caso de la persona, promesas de resultado, ni urgencia.

export type ChoiceQuestion = {
  id: "q1" | "q2" | "q3" | "q4" | "q5" | "q7"
    | "q8" | "q9" | "q10" | "q11" | "q12";
  type: "choice";
  text: string;
  context: string;
  options: { value: ChoiceAnswer; label: string }[];
};

export type ScaleQuestion = {
  id: "q6";
  type: "scale";
  text: string;
  context: string;
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
    context:
      "Saber en qué etapa estás define qué se puede trabajar todavía y con cuánto tiempo cuentas.",
    options: [
      { value: 2, label: "Ya tuve la entrevista ante USCIS y fui remitido a corte" },
      { value: 1, label: "Tengo ya fecha asignada para mi entrevista de asilo" },
      { value: 0, label: "Todavía no tengo ninguna fecha confirmada" },
    ],
  },
  {
    // Debilidad típica: "El año vencido sin excepción argumentada".
    id: "q8",
    type: "choice",
    text: "¿Presentaste tu solicitud de asilo dentro del primer año de haber llegado a EE.UU.?",
    context:
      "Existe un plazo de un año desde la llegada para presentar la solicitud. Hay excepciones reconocidas, pero no se aplican solas: hay que plantearlas de forma explícita.",
    options: [
      { value: 2, label: "Sí, la presenté dentro del primer año" },
      { value: 1, label: "La presenté después del año, y tengo argumentada una excepción" },
      { value: 0, label: "La presenté después del año, y no sé si me aplica alguna excepción" },
    ],
  },
  {
    id: "q2",
    type: "choice",
    text: "¿Cómo está tu documentación en este momento?",
    context:
      "Tenerlos no es lo mismo que tenerlos listos. Un documento sin traducir o que nadie puede ubicar dentro del expediente no termina sumando.",
    options: [
      { value: 2, label: "Todos los documentos actualizados, evidencias agregadas, organizadas y todo traducido" },
      { value: 1, label: "Tengo los documentos pero no los tengo traducidos, ni sé cómo organizarlos para presentarlos" },
      { value: 0, label: "Apenas estoy evaluando qué es lo que necesito" },
    ],
  },
  {
    // Debilidad típica: "Solo evidencia personal, sin contexto de país".
    id: "q10",
    type: "choice",
    text: "Además de tus documentos personales, ¿tienes evidencia sobre lo que está pasando hoy en tu país?",
    context:
      "Son dos pruebas distintas: tus documentos prueban tu historia, y la evidencia de país prueba el contexto en el que esa historia ocurrió. Una sola de las dos deja el caso a medias.",
    options: [
      { value: 2, label: "Sí, tengo un expediente de condiciones de país actualizado" },
      { value: 1, label: "Tengo algunas noticias o artículos sueltos que guardé" },
      { value: 0, label: "Solo tengo mis documentos personales" },
    ],
  },
  {
    // Debilidad típica: "Nada que amarre tu historia con lo que pasa hoy".
    // Es el punto que la presentación marca como LO MÁS IMPORTANTE:
    // si un exhibit no se cita en la declaración, nadie lo conecta.
    id: "q9",
    type: "choice",
    text: "Tu declaración personal, ¿cita tus evidencias párrafo por párrafo?",
    context:
      "Cada evidencia debería estar citada en el párrafo de tu declaración al que corresponde. Si no se cita, nadie va a hacer esa conexión por ti.",
    options: [
      { value: 2, label: "Sí, cada evidencia está citada en el párrafo que le corresponde" },
      { value: 1, label: "Tengo las dos cosas, pero por separado, sin conectarlas entre sí" },
      { value: 0, label: "No sabía que había que conectarlas" },
    ],
  },
  {
    id: "q3",
    type: "choice",
    text: "¿Cuándo fue la última vez que actualizaste tu carpeta de documentos y evidencias?",
    context:
      "Un expediente que lleva meses sin tocarse suele quedarse corto frente a todo lo que siguió pasando después.",
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
    context:
      "Tenerla en la cabeza y decirla en voz alta son dos cosas distintas. La primera vez que la digas completa no debería ser el día de la entrevista.",
    options: [
      { value: 2, label: "La he contado en voz alta varias veces, con calma" },
      { value: 1, label: "La tengo clara en mi cabeza, pero nunca la he dicho en voz alta" },
      { value: 0, label: "Me cuesta hasta pensarla completa sin sentirme mal" },
    ],
  },
  {
    // Debilidad típica: "Fechas que no cuadran entre declaración e I-589".
    id: "q11",
    type: "choice",
    text: "Si alguien comparara hoy tu declaración con tu I-589, ¿coincidirían?",
    context:
      "Las diferencias casi nunca están en lo grande: aparecen en fechas, nombres o en el orden en que ocurrieron los hechos.",
    options: [
      { value: 2, label: "Sí, las comparé y coinciden" },
      { value: 1, label: "Creo que sí, pero nunca las he comparado una al lado de la otra" },
      { value: 0, label: "Es probable que haya diferencias entre las dos" },
    ],
  },
  {
    id: "q5",
    type: "choice",
    text: "¿Qué tan claras tienes las fechas de tu caso: fecha en la que te sucedieron los eventos de tu historia, fecha de la I-589, fecha de cuándo presentaste tu solicitud de asilo?",
    context:
      "Las fechas están entre lo primero que se revisa. Tenerlas confirmadas evita contradecirte sin querer.",
    options: [
      { value: 2, label: "Las tengo todas claras y confirmadas" },
      { value: 1, label: "Algunas sí, otras no estoy segura/o" },
      { value: 0, label: "La verdad, no las tengo claras" },
    ],
  },
  {
    // Debilidad típica: "Cambios nunca reportados".
    id: "q12",
    type: "choice",
    text: "Desde que presentaste tu solicitud, ¿ha cambiado algo importante (dirección, estado civil, familiares, nuevos hechos)?",
    context:
      "Mudanzas, matrimonios, hijos, hechos nuevos en tu país. Varios de estos cambios deben informarse cuando ocurren, no al final.",
    options: [
      { value: 2, label: "No ha cambiado nada, o lo que cambió ya lo reporté" },
      { value: 1, label: "Sí cambió algo, pero no sé si había que reportarlo" },
      { value: 0, label: "Sí cambió algo y no lo he reportado" },
    ],
  },
  {
    id: "q6",
    type: "scale",
    text: "Del 1 al 10, ¿qué tan preparado te sientes hoy para responder preguntas difíciles sin bloquearte?",
    context:
      "Aquí no hay respuesta correcta. Nos sirve más saber cómo te sientes hoy que cómo crees que deberías sentirte.",
    min: 1,
    max: 10,
    minLabel: "Nada preparado",
    maxLabel: "Totalmente preparado",
  },
  {
    // Pregunta de sí/no: usa los extremos de la escala ordinal (2 = sabía,
    // 0 = no sabía) para no alterar el puntaje máximo ni los umbrales.
    id: "q7",
    type: "choice",
    text: "¿Sabías que debes llevar un intérprete el día de tu entrevista?",
    context:
      "En la entrevista de asilo ante USCIS, normalmente te corresponde a ti llevar tu propio intérprete si no vas a declarar en inglés.",
    options: [
      { value: 2, label: "Sí" },
      { value: 0, label: "No" },
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
    // El párrafo no afirma nada concreto sobre las respuestas de la persona:
    // eso lo hace la línea de fortalezas, que sí sale de lo que respondió.
    paragraph:
      "Vas bien. Tu caso tiene estructura y llegas a esta etapa con más terreno cubierto que la mayoría de las personas que se preparan para su entrevista.",
    // Sin afirmar que revisar esos detalles cambie el resultado del caso:
    // describimos qué se hace en la llamada, no qué se consigue con ella.
    loop:
      "Lo que sigue no es empezar de cero — es **afinar**. Hay detalles que cuesta ver desde adentro, y que alguien con experiencia en estos procesos sí alcanza a notar.",
    cta: "Afinar mi preparación",
  },
  intermedio: {
    title: "Nivel de Preparación: Intermedio",
    paragraph:
      "Tienes avanzado lo esencial, pero hay piezas sueltas. No es que estés mal preparado — es que todavía no tienes todo junto y en orden, y eso en una entrevista se nota.",
    // "revisamos contigo" en vez de "resolvemos": describe la conversación,
    // no promete que la brecha quede cerrada.
    loop:
      "Ya sabes en qué punto estás. Lo que todavía no tienes es el **orden exacto** para trabajar esas brechas antes de tu fecha. Eso es lo que revisamos contigo en una llamada.",
    cta: "Quiero que vean mi caso",
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
  strengthsPrefix: "A tu favor:",
  reinforcementsTitle: "Lo que conviene reforzar",
  ctaMicrocopy: "Sin costo. Hablas directamente con nuestro equipo.",
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
    // Nombra el país por defecto de forma explícita. Sin el código a la vista,
    // un número local de otro país puede pasar como válido en EE.UU. (por
    // ejemplo 414… es Milwaukee y también Venezuela) y guardarse mal en
    // silencio. Este texto es la única señal que tiene la persona.
    whatsappHelp:
      "Empieza en Estados Unidos. Si tu número es de otro país, toca la bandera para cambiarlo.",
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
