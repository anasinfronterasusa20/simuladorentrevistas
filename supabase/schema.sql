-- =============================================================================
-- Sin Fronteras Global — Diagnóstico de preparación
-- Schema Supabase. Pégalo entero en el SQL Editor del dashboard de Supabase.
-- =============================================================================

-- Extensiones necesarias para uuid_generate_v4().
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Tabla principal: cada fila = un diagnóstico completo.
-- El score numérico interno (score_interno) se guarda para análisis editorial
-- pero JAMÁS se expone al usuario a través del endpoint /api/submit.
-- ---------------------------------------------------------------------------
create table if not exists public.diagnostics (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),

  -- Datos de contacto (capturados al final del flujo, antes del resultado).
  nombre            text not null,
  email             text not null,
  whatsapp          text not null,                    -- formato E.164 (+521234567890)

  -- Respuestas: jsonb con las 7 claves q1..q7.
  respuestas        jsonb not null,

  -- Resultado.
  banda             text not null check (banda in ('alto', 'intermedio', 'por_reforzar')),
  score_interno     smallint not null check (score_interno between 0 and 14),

  -- Consentimiento explícito de outreach (obligatorio para insertar).
  consent_outreach  boolean not null check (consent_outreach = true),

  -- Contexto opcional del origen (query param ?w=... del link post-webinar).
  webinar_source    text,

  -- Metadata del cliente (útil para diagnóstico de bugs, no PII sensible).
  user_agent        text,
  referrer          text
);

-- Índices para consultas de análisis.
create index if not exists diagnostics_created_at_idx on public.diagnostics (created_at desc);
create index if not exists diagnostics_banda_idx      on public.diagnostics (banda);
create index if not exists diagnostics_webinar_idx    on public.diagnostics (webinar_source);

-- ---------------------------------------------------------------------------
-- Row Level Security.
--
-- Estrategia: INSERT-only para el rol anon (que es el que usaría un cliente
-- desde el navegador si algún día quisiéramos exponer la tabla directo).
-- En este build el endpoint corre con SERVICE_ROLE, que ignora RLS — así que
-- las policies son un cinturón de seguridad extra.
--
-- Nada de SELECT, UPDATE ni DELETE para anon: la data solo se lee desde el
-- dashboard de Supabase o vía service role.
-- ---------------------------------------------------------------------------

alter table public.diagnostics enable row level security;

drop policy if exists "anon can insert diagnostics" on public.diagnostics;
create policy "anon can insert diagnostics"
  on public.diagnostics
  for insert
  to anon
  with check (true);

-- Sin policy de SELECT/UPDATE/DELETE para anon → queda denegado por default.
