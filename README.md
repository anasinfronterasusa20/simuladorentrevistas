# SFG — Diagnóstico Flash

Herramienta gratuita de diagnóstico post-webinar para Sin Fronteras Global. 7 preguntas → banda cualitativa (Alto / Intermedio / Por Reforzar) → CTA a Calendly. Se embebe vía iframe en la landing de WordPress.

> Nota de branding: "Diagnóstico Flash" es el nombre de esta herramienta gratuita. NO usar el nombre del producto pagado de SFG (el que empieza con S y termina en R) en ningún texto ni metadata de este proyecto — está reservado para el producto de pago.

## Setup local

```bash
npm install
cp .env.example .env.local   # completa las 2 vars
npm run dev
```

Abrir http://localhost:3000

## Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` + Vercel | Service role key. **NUNCA** en cliente. |

Ambas van en `Project Settings → API` del dashboard de Supabase.

## Supabase — crear tabla

En el dashboard de Supabase → SQL Editor → pega y ejecuta [`supabase/schema.sql`](supabase/schema.sql). Crea la tabla `public.diagnostics` con RLS anon-INSERT-only.

## Supabase — migraciones

Los cambios de esquema posteriores a la creación de la tabla viven en [`supabase/migrations/`](supabase/migrations/), numerados. Se corren en orden, en el SQL Editor, y son idempotentes.

| Migración | Qué hace | Obligatoria antes de |
|---|---|---|
| `001_expand_score_range_to_24.sql` | Amplía `score_interno` de 0-14 a 0-24 | Desplegar el set de 12 preguntas |

**Orden correcto: primero la migración, después el deploy.** Ampliar el rango es compatible hacia atrás (los puntajes viejos de 0-14 siguen siendo válidos), así que se puede correr con la versión anterior todavía en producción. Al revés no: si el código de 12 preguntas llega antes que la migración, toda persona que supere 14 puntos recibe un error al guardar y su registro se pierde.

## Tests

```bash
npm test
```

Cubren el motor de scoring, los umbrales de bandas y guardas de compliance (que la respuesta pública nunca filtre score numérico).

## Deploy a Vercel

1. `git push` a un repo en GitHub (yo no lo hago automáticamente).
2. En Vercel → Import Project → apuntar al repo.
3. Agregar las 2 env vars de arriba en Vercel → Project Settings → Environment Variables.
4. Deploy.
5. Conectar el subdominio `diagnostico.infosfg.com` (u otro) en Vercel → Domains.

## Embed en WordPress

En una página de Elementor, agrega un widget HTML con este código:

```html
<div style="display:block;width:100%;">
  <iframe
    id="sfg-diagnostico"
    src="https://diagnostico.infosfg.com/"
    width="100%"
    style="display:block;width:100%;border:0;min-height:800px"
    title="Diagnóstico SFG"
  ></iframe>
</div>

<script>
  // Auto-resize del iframe según altura real del contenido.
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "sfg-diagnostico-height") return;
    var f = document.getElementById("sfg-diagnostico");
    if (f && typeof e.data.height === "number") {
      f.style.height = e.data.height + "px";
    }
  });
</script>
```

Cambios respecto a una versión anterior de este snippet: se quitó `loading="lazy"` (el widget es contenido principal de la página, no hay razón para diferir su carga, y algunos navegadores calculan mal el ancho de un iframe lazy dentro de contenedores flex de Elementor) y se envolvió en un `<div>` de bloque explícito con `width="100%"` también como atributo HTML, no solo como estilo — esto evita que el iframe, al ser un elemento reemplazado dentro de un contenedor `display:flex` de Elementor (`.e-con`), herede un ancho intrínseco en vez del 100% esperado.

### Si el widget se ve "achicado" o como versión de escritorio en un celular real

1. **Primero, borra caché / prueba en incógnito** en ese mismo celular, en la página de WordPress. Es la causa más común: el CDN de Vercel cachea la página en distintos servidores según la región, y un dispositivo puede estar viendo una versión anterior hasta que esa caché expire (normalmente minutos, a veces más).
2. Si con caché limpia el problema persiste, revisa si Chrome tiene activado **"Ver sitio de escritorio"** para `infosfg.com` (menú ⋮ → checkbox) — actívalo/desactívalo y recarga.
3. Si nada de eso resuelve, es un bug real del embed — reporta con captura + modelo de teléfono + navegador exacto.

El link post-webinar puede llevar un parámetro opcional para trackear la fuente:

```
https://infosfg.com/diagnostico?w=webinar-2025-06
```

Se guarda como `webinar_source` en Supabase.

## Compliance — no negociable

- El endpoint `/api/submit` devuelve **solo** la banda cualitativa (`{ band: "alto" | "intermedio" | "por_reforzar" }`). Nunca el score numérico.
- El score numérico se persiste en Supabase (`score_interno`) exclusivamente para análisis editorial interno. Nunca se expone al usuario.
- El copy de las 3 bandas está en `lib/content.ts` → `BAND_COPY`. Se prohibe agregar puntajes, porcentajes, "probabilidad" o promesas de resultado legal. Los tests fallan si aparecen.

## Editar contenido

Todo el copy vive en [`lib/content.ts`](lib/content.ts):

- `QUESTIONS` — las 7 preguntas y sus opciones.
- `BAND_COPY` — títulos, líneas de acento (italic) y cuerpo por banda.
- `UI_COPY` — copy transversal (intro, opt-in, errores).
- `CALENDLY_URL` — link único de Calendly.
- `CONSENT_COPY` — texto del checkbox de consentimiento.

Cambios de copy no requieren tocar UI ni scoring.

## Sistema de diseño

- Colores: Navy `#1B2E48`, Gold `#D4A234`, Cream `#EDE5CA` (en `app/globals.css` → `:root`).
- Tipografía: Montserrat Black 900 uppercase para títulos; Cormorant Garamond 400 italic **solo** para líneas de acento emocional.
- Prohibido: gradientes, texturas, patrones, emojis.

## Estructura

```
app/
  layout.tsx              # fuentes, metadata, root HTML
  globals.css             # tokens de marca + estilos
  page.tsx                # SPA state machine
  api/submit/route.ts     # POST endpoint (Supabase insert)
lib/
  content.ts              # todo el copy editable
  scoring.ts              # función pura de scoring
  scoring.test.ts         # tests Vitest
  supabase.ts             # cliente server-side
supabase/
  schema.sql              # SQL a correr en el dashboard
next.config.ts            # CSP frame-ancestors para iframe
```

## CRM (Kommo vía n8n)

Cada diagnóstico completado dispara un `POST` a `CRM_WEBHOOK_URL` con el
resultado, las respuestas legibles y los refuerzos. El envío no es bloqueante:
si n8n falla, la fila ya quedó en Supabase y la persona ve su resultado igual.

El workflow de n8n está especificado paso a paso en
[`docs/n8n-kommo.md`](docs/n8n-kommo.md), incluida una trampa de la API de
Kommo que puede borrar tags existentes si se actualiza mal.

## Próximos pasos

- Calibración de umbrales: revisar `THRESHOLDS` en `lib/scoring.ts` con data real después de las primeras 50-100 respuestas.
- Supabase en plan gratuito pausa el proyecto por inactividad. Antes de un webinar en vivo, verificar que esté activo.
