-- 095_system_config_rescued.sql
-- RESCUED 2026-07-30 from an orphaned worktree. Originally authored as
-- "027_system_config.sql" (Build C, April 2026, D-MaintenanceMode) but never
-- committed to any git ref; its worktree git metadata was later deleted.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- READ BEFORE RUNNING — this migration is very likely ALREADY APPLIED.
-- ─────────────────────────────────────────────────────────────────────────────
-- Evidence that public.system_config already exists in production:
--   * 031_enable_rls_all_tables.sql (on master, applied) runs
--     `ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY` and creates
--     the `system_config_select` policy, citing D-MaintenanceMode by name.
--   * 053_system_config_status_refresh.sql (on master, applied) runs
--     `ALTER TABLE public.system_config ADD ... status_refresh_last_run`.
--   * 054 and 062 also reference the table.
-- All of those would have failed if the table did not exist. So the original
-- 027 was executed manually against Supabase at Build C time, even though the
-- file never reached the repo.
--
-- WHY THIS FILE IS COMMITTED ANYWAY: without it, no migration in db/migrations/
-- creates public.system_config, so the migration set cannot rebuild the
-- database from scratch — migration 031 would fail on a fresh environment.
-- This file closes that hole. It is rebuild-completeness, not a pending change.
--
-- CHANGE FROM THE ORIGINAL (deliberate, flagged for review): the original
-- seed was an unguarded `INSERT INTO system_config (maintenance_mode)
-- VALUES (false);`. Re-running that against the live database would insert a
-- SECOND config row, and get_maintenance_mode() reads with `.limit(1).single()`
-- — a duplicate row makes the flag nondeterministic. The INSERT below is
-- guarded with NOT EXISTS so the file is safe to run in any environment.
-- Nothing else was altered. Note that 053 later added status_refresh_last_run
-- to this table; that column stays owned by 053, not by this file.
--
-- Source: D-MaintenanceMode. Build C §12 AC-29. See RESCUE-NOTES-AC29.md.

CREATE TABLE IF NOT EXISTS system_config (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_mode     boolean     NOT NULL DEFAULT false,
  maintenance_message  text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  updated_by           text
);

-- Seed the single config row (maintenance off by default).
-- Guarded: no-op when a row already exists. See CHANGE FROM THE ORIGINAL above.
INSERT INTO system_config (maintenance_mode)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM system_config);
