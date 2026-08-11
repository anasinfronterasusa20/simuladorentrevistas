-- =============================================================================
-- Migración 001 — Ampliar el rango de score_interno de 0-14 a 0-24
-- =============================================================================
--
-- CONTEXTO
-- El diagnóstico pasó de 7 a 12 preguntas, así que el puntaje máximo subió
-- de 14 a 24. La restricción original de la tabla rechaza cualquier valor
-- por encima de 14.
--
-- SÍNTOMA SI NO SE CORRE
-- Toda persona que saque más de 14 puntos ve el error "No pudimos guardar
-- tu respuesta" y su registro NO llega a la base. Es decir: se pierden
-- justamente los leads mejor preparados.
--
-- CÓMO CORRERLA
-- Supabase → SQL Editor → pegar este archivo completo → Run.
-- Es idempotente: se puede correr más de una vez sin romper nada.
--
-- SOBRE LOS REGISTROS VIEJOS
-- Las filas creadas con las 7 preguntas originales quedan intactas. Sus
-- puntajes (0-14) siguen siendo válidos dentro del rango nuevo, pero NO son
-- comparables con los nuevos porque la escala cambió. Para separarlas al
-- analizar, usa la fecha de esta migración como corte.
-- =============================================================================

alter table public.diagnostics
  drop constraint if exists diagnostics_score_interno_check;

alter table public.diagnostics
  add constraint diagnostics_score_interno_check
  check (score_interno between 0 and 24);

-- Verificación: debe devolver la definición con "0 AND 24".
-- select pg_get_constraintdef(oid)
--   from pg_constraint
--  where conname = 'diagnostics_score_interno_check';
