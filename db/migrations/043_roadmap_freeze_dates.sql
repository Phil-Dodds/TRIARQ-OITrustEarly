-- 043_roadmap_freeze_dates.sql
-- Pathways OI Trust — Contract 27 (Roadmap Planning Mode)
--
-- Why this migration:
--   D-444 introduces "Deploy Roadmap Baselines" — Admin-managed dated
--   snapshots used as baselines for prior-quarter Planned vs. Actual
--   analysis on the EPO Deploy and Workstream Deploy views.
--
-- Schema:
--   freeze_date_id      uuid PK, default gen_random_uuid()
--   freeze_date         date NOT NULL UNIQUE (filtered to non-deleted rows)
--   freeze_label        text NOT NULL, ≤100 chars
--   created_at          timestamptz NOT NULL DEFAULT now()
--   created_by_user_id  uuid NOT NULL → users(id)
--   deleted_at          timestamptz NULL — soft-delete column per Arch-6
--
-- Arch-6 reconciliation:
--   Spec (D-444 Tool 4) originally specified hard-delete. Arch-6 in CLAUDE.md
--   is non-negotiable and has no exception clause. CC-27-1 records the
--   resolution: add deleted_at column, soft-delete in delete_roadmap_freeze_date,
--   list_roadmap_freeze_dates filters WHERE deleted_at IS NULL. Unique constraint
--   on freeze_date is partial — applies only to non-deleted rows so a date can be
--   re-used after its prior baseline is removed.
--
-- RLS:
--   Enabled. SELECT authorized for any authenticated user (deploy views call
--   list_roadmap_freeze_dates for the selector). INSERT/UPDATE/DELETE go
--   through MCP service role (Admin JWT enforced in tool handler).
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.

BEGIN;

-- ── Step 1: Create roadmap_freeze_dates table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_freeze_dates (
    freeze_date_id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    freeze_date         date        NOT NULL,
    freeze_label        text        NOT NULL CHECK (char_length(freeze_label) <= 100),
    created_at          timestamptz NOT NULL DEFAULT now(),
    created_by_user_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    deleted_at          timestamptz NULL
);

-- ── Step 2: Partial unique index on freeze_date (non-deleted only) ───────
CREATE UNIQUE INDEX IF NOT EXISTS uq_roadmap_freeze_date_active
    ON public.roadmap_freeze_dates (freeze_date)
    WHERE deleted_at IS NULL;

-- ── Step 3: Enable RLS, authenticated SELECT only ─────────────────────────
ALTER TABLE public.roadmap_freeze_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read roadmap_freeze_dates"
    ON public.roadmap_freeze_dates;

CREATE POLICY "Authenticated users can read roadmap_freeze_dates"
    ON public.roadmap_freeze_dates FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- No INSERT/UPDATE/DELETE policies — all writes through MCP service role
-- (Admin JWT enforced in tool handler per D-444).

COMMENT ON TABLE public.roadmap_freeze_dates IS
    'Contract 27 / D-444: Deploy Roadmap Baselines registry. Admin-managed dated '
    'snapshots used as baselines for prior-quarter Planned vs. Actual analysis '
    'on EPO Deploy and Workstream Deploy views. Soft-delete via deleted_at per '
    'Arch-6 (CC-27-1).';

COMMENT ON COLUMN public.roadmap_freeze_dates.freeze_label IS
    'Human-readable label for the baseline, e.g. "Roadmap Q2 2026". ≤100 chars.';

COMMENT ON COLUMN public.roadmap_freeze_dates.deleted_at IS
    'Soft-delete timestamp. NULL = active row. Set by delete_roadmap_freeze_date '
    'MCP tool. Active-row uniqueness on freeze_date enforced via partial unique '
    'index uq_roadmap_freeze_date_active.';

COMMIT;

-- ── Verification queries (run separately) ────────────────────────────────
-- 1. Table + columns present:
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='roadmap_freeze_dates'
--    ORDER BY ordinal_position;
--    Expected: freeze_date_id, freeze_date, freeze_label, created_at,
--              created_by_user_id, deleted_at.
--
-- 2. Partial unique index registered:
--    SELECT indexname, indexdef FROM pg_indexes
--    WHERE schemaname='public' AND tablename='roadmap_freeze_dates';
--    Expected: uq_roadmap_freeze_date_active with WHERE deleted_at IS NULL.
--
-- 3. RLS enabled, policy in place:
--    SELECT polname, polcmd, polpermissive, polroles::regrole[]
--    FROM pg_policy
--    WHERE polrelid = 'public.roadmap_freeze_dates'::regclass;
--    Expected: one SELECT policy for the authenticated role.
--
-- 4. Empty table after migration:
--    SELECT count(*) FROM public.roadmap_freeze_dates;
--    Expected: 0.
