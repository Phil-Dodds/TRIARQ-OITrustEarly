-- 049_division_status_config.sql
-- Pathways OI Trust — Contract 32 (Initiative Status Updates)
-- Governing decisions: D-476, D-480, D-481, D-353
--
-- Why this migration:
--   D-480 defines per-Division status update cadence (weekly / triweekly /
--   monthly). One config row per Division; initiatives resolve their cadence
--   by walking the Division parent chain (D-481, resolved in MCP).
--
-- Deviation from spec §1.1 — recorded as CC-32-7:
--   Spec writes `division_id ... REFERENCES divisions(division_id)`. The
--   divisions PK is `id` (migration 002_create_divisions.sql), not
--   division_id. Verbatim spec would fail FK creation. This migration
--   references public.divisions(id). Column name division_id retained on
--   this table for read clarity and to match delivery_cycles.division_id.
--
-- Deviation from spec §1.1 — recorded as CC-32-8:
--   CLAUDE.md requires created_at AND updated_at on every new table. Spec
--   table omits created_at. This is a mutable (upsert) table, so both
--   columns are added.
--
-- ⚠ Do NOT execute via Code per Rule 22. Phil executes against Supabase.
--   Migration ships in repo; deployment runs only after Phil confirms apply.

BEGIN;

CREATE TABLE IF NOT EXISTS public.division_status_config (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id       uuid        NOT NULL UNIQUE
                                REFERENCES public.divisions(id) ON DELETE CASCADE,
  cadence           text        NOT NULL
                                CHECK (cadence IN ('weekly', 'triweekly', 'monthly')),
  day_of_week       integer     NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  anchor_date       date        NULL,
  month_occurrence  text        NULL
                                CHECK (month_occurrence IN
                                  ('first', 'second', 'third', 'fourth', 'last')),
  updated_by        uuid        NOT NULL REFERENCES public.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT triweekly_requires_anchor
    CHECK (cadence != 'triweekly' OR anchor_date IS NOT NULL),
  CONSTRAINT monthly_requires_occurrence
    CHECK (cadence != 'monthly' OR month_occurrence IS NOT NULL),
  CONSTRAINT weekly_no_anchor
    CHECK (cadence != 'weekly' OR anchor_date IS NULL),
  CONSTRAINT weekly_no_occurrence
    CHECK (cadence != 'weekly' OR month_occurrence IS NULL)
);

COMMENT ON TABLE public.division_status_config IS
  'Per-Division initiative status update cadence (D-480). One row per Division. '
  'Initiatives resolve cadence by walking the Division parent chain (D-481, '
  'resolved in MCP). weekly: day_of_week only. triweekly: anchor_date + '
  'day_of_week. monthly: day_of_week + month_occurrence. Source: D-480, D-481.';

-- updated_at maintained by MCP on upsert (save_division_status_config).

-- ── RLS (D-353) ──────────────────────────────────────────────────────────
ALTER TABLE public.division_status_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "division_status_config_select"
  ON public.division_status_config FOR SELECT
  USING (
    division_id IN (SELECT public.user_division_ids())
    OR public.user_is_admin()
  );

CREATE POLICY "division_status_config_insert"
  ON public.division_status_config FOR INSERT
  WITH CHECK (public.user_is_admin());

CREATE POLICY "division_status_config_update"
  ON public.division_status_config FOR UPDATE
  USING (public.user_is_admin());

CREATE POLICY "division_status_config_delete"
  ON public.division_status_config FOR DELETE
  USING (public.user_is_admin());

COMMIT;

-- ── Verification (read-only, safe post-apply) ────────────────────────────
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.division_status_config'::regclass;
