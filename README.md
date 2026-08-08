# SFG — Diagnóstico de preparación

Herramienta de diagnóstico post-webinar para Sin Fronteras Global. 7 preguntas → banda cualitativa (Alto / Intermedio / Por Reforzar) → CTA a Calendly. Se embebe vía iframe en la landing de WordPress.

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
<iframe
  id="sfg-diagnostico"
  src="https://diagnostico.infosfg.com/"
  style="width:100%;border:0;min-height:800px"
  loading="lazy"
  title="Diagnóstico SFG"
></iframe>

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

## Próximos pasos (fuera de este build)

- Webhook a n8n → Kommo CRM: agregar POST a `CRM_WEBHOOK_URL` en `app/api/submit/route.ts` después del insert de Supabase.
- Calibración de umbrales: revisar `THRESHOLDS` en `lib/scoring.ts` con data real después de las primeras 50-100 respuestas.
