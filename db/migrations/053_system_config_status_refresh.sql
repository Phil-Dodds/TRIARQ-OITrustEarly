-- 053_system_config_status_refresh.sql
-- Pathways OI Trust — Contract 32 (Initiative Status Updates)
-- Governing decisions: D-476, D-482
--
-- Why this migration:
--   D-482 — the scheduled function records the timestamp of its last run so
--   the My Initiative Status screen can show "Status last calculated: …".
--
-- CC-32-2 (OI-2): system_config is a single-row, fixed-column table
--   (maintenance_mode, maintenance_message) per RLS migration 031 and the
--   AppComponent bootstrap read. Its CREATE TABLE is NOT in db/migrations
--   (created out-of-band) — logged as a CLAUDE.md candidate. Per spec §1.6
--   fixed-column branch, add a COLUMN (not a key-value row).
--
--   ⚠ BEFORE APPLYING: confirm the table shape with the inspection query
--   below. If system_config is instead key-value (key/value columns), do NOT
--   run this — tell Code and a row-insert variant will be issued.
--
--     SELECT column_name, data_type, is_nullable
--     FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'system_config'
--     ORDER BY ordinal_position;
--
-- ⚠ Do NOT execute via Code per Rule 22. Phil executes against Supabase.

BEGIN;

ALTER TABLE public.system_config
  ADD COLUMN IF NOT EXISTS status_refresh_last_run timestamptz NULL;

COMMENT ON COLUMN public.system_config.status_refresh_last_run IS
  'ISO timestamp of the last refresh_initiative_status_overdue() run (D-482). '
  'Surfaced on the My Initiative Status screen as "Status last calculated". '
  'NULL until the first scheduled or on-demand run. Source: D-482.';

COMMIT;
