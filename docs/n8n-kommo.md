# Workflow de n8n: diagnóstico → Kommo

Este documento describe el workflow que recibe cada diagnóstico completado y
lo refleja en Kommo.

**Decisiones tomadas** (agosto 2026):

- Si la persona no existe en Kommo, **se crea** el lead.
- La información se guarda como **tags + una nota** con el detalle. No se usan
  campos personalizados, así no hay que crearlos ni mantener sus IDs.
- **No se mueve la fase.** Ver "Por qué no movemos de fase" al final.

---

## Lo que llega al webhook

La app hace `POST` al `CRM_WEBHOOK_URL` con este cuerpo:

| Campo | Ejemplo | Para qué sirve |
|---|---|---|
| `id` | `3f7c1e9a-…` | Clave de idempotencia. Si n8n reintenta, sirve para no duplicar |
| `created_at` | `2026-08-26T15:40:00.000Z` | UTC |
| `nombre` | `María Rodríguez` | |
| `email` | `maria@ejemplo.com` | Búsqueda primaria |
| `whatsapp` | `+584142190923` | Búsqueda secundaria. Ya en E.164 |
| `banda` | `intermedio` | Valor interno: `alto` / `intermedio` / `por_reforzar` |
| `banda_label` | `Intermedio` | Para mostrar en tags y notas |
| `score_interno` | `10` | **Interno.** Ver aviso abajo |
| `refuerzos` | `["El plazo del primer año…", …]` | Hasta 3 |
| `fortalezas` | `["tienes evidencia…", …]` | Hasta 3, puede venir vacío |
| `cta_mostrado` | `Ver mi plan de preparación` | Qué botón vio |
| `respuestas` | `{"q1":1,…}` | Crudas, para análisis |
| `respuestas_legibles` | `[{pregunta, respuesta}, …]` | Las 12 en español |
| `webinar_source` | `webinar-septiembre` | Del `?w=` de la URL. Puede ser `null` |
| `consent_outreach` | `true` | Siempre true; sin consentimiento no se envía |

> ⚠️ **`score_interno` nunca debe volver a la persona.** Es una señal interna
> para priorizar en ventas. No puede aparecer en un correo, un mensaje de
> WhatsApp, ni en ninguna plantilla que la persona llegue a ver. La misma regla
> que aplica en pantalla.

---

## Estructura del workflow

```
Webhook (POST)
   ↓
Buscar contacto por EMAIL
   ↓
¿Encontrado? ──no──> Buscar contacto por WHATSAPP
   │                        ↓
   │                  ¿Encontrado? ──no──> Crear lead + contacto
   │                        │
   └────────sí──────────────┴──sí──> Leer lead actual
                                          ↓
                                   Fusionar tags (ver trampa)
                                          ↓
                                     PATCH lead con tags
                                          ↓
                                   POST nota con el detalle
```

---

## Nodos, uno por uno

### 1. Webhook

- Método: `POST`
- Guarda la **Production URL** → va en Vercel como `CRM_WEBHOOK_URL`.
- Si defines `CRM_WEBHOOK_SECRET` en Vercel, la app manda el header
  `X-SFG-Signature`. Agrega un nodo **IF** justo después que compare ese header
  y corte si no coincide. Sin eso, cualquiera que descubra la URL puede
  inyectar leads falsos.

### 2. Autenticación con Kommo

Todas las llamadas usan el mismo header:

```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

El token se saca en Kommo → **Ajustes** → **Integraciones** → crear integración
→ *Token de larga duración*. Guárdalo en n8n como credencial, no pegado en cada
nodo.

Base de todas las URLs: `https://sinfronterasusa20.kommo.com/api/v4/`

### 3. Buscar por email

```
GET /api/v4/contacts?query={{ $json.email }}
```

Si no hay resultados, Kommo devuelve **204 sin cuerpo** (no un array vacío).
Configura el nodo HTTP para que no falle con 204, y evalúa
`_embedded.contacts` con cuidado — si asumes que siempre viene un array, el
workflow se rompe justo en el caso que más importa: la persona nueva.

### 4. Buscar por WhatsApp (solo si el email no dio resultado)

```
GET /api/v4/contacts?query={{ $json.whatsapp }}
```

Este paso es el que rescata a quien se registró al webinar con un correo y usó
otro en el diagnóstico. Vale la pena probar también sin el `+`, porque algunos
registros viejos pueden estar guardados sin él.

### 5a. Si NO existe: crear lead + contacto

```
POST /api/v4/leads/complex
```

```json
[
  {
    "name": "Diagnóstico Flash — {{ $json.nombre }}",
    "_embedded": {
      "contacts": [
        {
          "first_name": "{{ $json.nombre }}",
          "custom_fields_values": [
            { "field_code": "EMAIL",
              "values": [{ "value": "{{ $json.email }}" }] },
            { "field_code": "PHONE",
              "values": [{ "value": "{{ $json.whatsapp }}" }] }
          ]
        }
      ],
      "tags": [
        { "name": "USÓ DIAGNÓSTICO" },
        { "name": "DIAGNÓSTICO: {{ $json.banda_label }}" }
      ]
    }
  }
]
```

El cuerpo va **dentro de un array**, aunque sea un solo lead. Kommo lo exige.

Si quieres que caigan en un pipeline concreto, agrega `"pipeline_id"` y
`"status_id"` al objeto. Sin eso, entran al pipeline por defecto de la cuenta.

### 5b. Si SÍ existe: leer, fusionar tags, actualizar

**Esta es la trampa importante.** En la API de Kommo, un `PATCH` con
`_embedded.tags` **reemplaza toda la lista de tags** del lead. Si mandas solo
los dos tuyos, **borras todos los que ya tenía** — incluidos los que ponen tus
propias automatizaciones, como `CITA AGENDADA`.

Por eso hay que leer primero:

```
GET /api/v4/leads/{{ $json.lead_id }}?with=tags
```

Luego un nodo **Code** que fusione:

```javascript
const existentes = $json._embedded?.tags ?? [];
const nuevos = [
  { name: "USÓ DIAGNÓSTICO" },
  { name: `DIAGNÓSTICO: ${$('Webhook').item.json.banda_label}` },
];

// Deduplicar por nombre, conservando los existentes.
const porNombre = new Map();
for (const t of [...existentes, ...nuevos]) porNombre.set(t.name, t);

return [{ json: { tags: [...porNombre.values()] } }];
```

Y recién ahí:

```
PATCH /api/v4/leads/{{ lead_id }}
```

```json
{ "_embedded": { "tags": {{ JSON.stringify($json.tags) }} } }
```

Si alguien vuelve a hacer el diagnóstico y sale en otra banda, va a acumular
dos tags de banda. Si prefieres que quede solo el más reciente, filtra en el
Code los que empiecen con `DIAGNÓSTICO: ` antes de fusionar.

### 6. Agregar la nota con el detalle

```
POST /api/v4/leads/{{ lead_id }}/notes
```

```json
[
  {
    "note_type": "common",
    "params": {
      "text": "{{ $json.textoNota }}"
    }
  }
]
```

Arma `textoNota` en un nodo **Code** previo:

```javascript
const d = $('Webhook').item.json;

const texto = [
  `DIAGNÓSTICO FLASH — ${d.banda_label}`,
  d.webinar_source ? `Origen: ${d.webinar_source}` : null,
  ``,
  `LO QUE CONVIENE REFORZAR:`,
  ...d.refuerzos.map(r => `  • ${r}`),
  ``,
  d.fortalezas.length ? `A SU FAVOR:` : null,
  ...d.fortalezas.map(f => `  • ${f}`),
  ``,
  `RESPUESTAS:`,
  ...d.respuestas_legibles.map(r => `  ${r.pregunta}\n    → ${r.respuesta}`),
].filter(l => l !== null).join('\n');

return [{ json: { textoNota: texto } }];
```

Esa nota es lo que abre quien atiende la llamada. Llega sabiendo exactamente
qué respondió la persona, sin preguntárselo otra vez.

---

## Probar el workflow sin llenar el diagnóstico

Con n8n en modo *Listen for test event*, manda esto desde una terminal:

```bash
curl -X POST '<PRODUCTION_URL_DE_N8N>' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "prueba-001",
    "created_at": "2026-08-26T15:40:00.000Z",
    "nombre": "PRUEBA Diagnóstico",
    "email": "prueba@example.invalid",
    "whatsapp": "+13055551234",
    "banda": "intermedio",
    "banda_label": "Intermedio",
    "score_interno": 10,
    "refuerzos": ["El plazo del primer año para presentar tu solicitud"],
    "fortalezas": ["tus cambios están reportados"],
    "cta_mostrado": "Ver mi plan de preparación",
    "respuestas": {"q1":1},
    "respuestas_legibles": [
      {"pregunta": "¿En qué momento de tu proceso estás hoy?",
       "respuesta": "Tengo ya fecha asignada para mi entrevista de asilo"}
    ],
    "webinar_source": "prueba",
    "consent_outreach": true
  }'
```

Usa un email `@example.invalid` — es un dominio reservado que no existe, así
no hay riesgo de que un correo automático salga hacia una persona real.
Borra el lead de prueba de Kommo cuando termines.

---

## Por qué no movemos de fase

La fase dice **dónde está la persona en el embudo**; el tag dice **qué le ha
pasado**. Usar el diagnóstico es un hecho, no una posición.

En el pipeline *WEBINARS (ESP / USA)*, la fase "USARON HERRAMIENTA
DIAGNOSTICO" está antes de "AGENDARON CITA". Si alguien que ya agendó su cita
entra al diagnóstico —cosa habitual, es el público más comprometido— moverlo
lo devolvería a una fase anterior: se pierde su posición real y se pueden
volver a disparar automatizaciones de esa etapa, incluidos correos que esa
persona ya recibió.

Con tags no pasa: se acumulan sin destruir nada, y el kanban se puede filtrar
por tag cuando se quiera ver el grupo completo.
