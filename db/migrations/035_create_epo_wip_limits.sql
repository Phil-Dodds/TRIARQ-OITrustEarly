-- 035_create_epo_wip_limits.sql
-- Pathways OI Trust — Build C Contract 20
-- Governing decisions: D-400 (EPO WIP Limit Model), D-401 (EPO WIP Limits Admin Screen),
--                      D-353 (RLS enabled all tables), CC-20-02 (workstream WIP drop skipped).
--
-- Replaces the prior workstream-scope WIP limit model with EPO-scope limits.
-- One row per user where is_epo = true. Defaults are 3 per zone (Pre-Build,
-- Build, Post-Deploy). Absence of a row is treated as 3/3/3 by all readers —
-- never as unlimited (system constant WIP_LIMIT_DEFAULT = 3, retained).
--
-- CC-20-02 — Workstream WIP column drop SKIPPED:
--   Contract 20 spec §1.2 step 3 instructs dropping wip_limit_pre_build,
--   wip_limit_build, and wip_limit_post_deploy from delivery_workstreams.
--   No prior migration ever added those columns to delivery_workstreams
--   (migration 015 created the table without WIP columns; no subsequent
--   migration added them). Drop step is omitted entirely — there are no
--   columns to remove. The tool-level WIP scope shift in
--   record_gate_decision and the response-shape change in
--   list_delivery_workstreams still apply, since they may reference these
--   columns in code regardless of whether the columns ever shipped to DB.
--
-- Must run after: 001_create_users.sql, 033_boolean_role_flags.sql.

BEGIN;

-- 1. Create epo_wip_limits table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.epo_wip_limits (
    user_id           uuid        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    pre_build_limit   integer     NOT NULL DEFAULT 3 CHECK (pre_build_limit   >= 1),
    build_limit       integer     NOT NULL DEFAULT 3 CHECK (build_limit       >= 1),
    post_deploy_limit integer     NOT NULL DEFAULT 3 CHECK (post_deploy_limit >= 1),
    updated_at        timestamptz,
    updated_by        uuid REFERENCES public.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.epo_wip_limits IS
    'Per-EPO WIP zone limits (D-400). One row per user with is_epo = true. '
    'No row = 3/3/3 default — readers must treat absent rows as default, not unlimited. '
    'Auto-created by get_epo_wip_limits MCP tool on read; managed via update_epo_wip_limits.';

COMMENT ON COLUMN public.epo_wip_limits.pre_build_limit IS
    'WIP cap for Pre-Build zone (Initiatives in DESIGN or SPEC stage). Min 1, no max.';
COMMENT ON COLUMN public.epo_wip_limits.build_limit IS
    'WIP cap for Build zone (Initiatives in BUILD, VALIDATE, or UAT stage). Min 1, no max.';
COMMENT ON COLUMN public.epo_wip_limits.post_deploy_limit IS
    'WIP cap for Post-Deploy zone (Initiatives in PILOT, RELEASE, or OUTCOME stage). Min 1, no max.';

-- 2. Seed rows for existing EPOs ──────────────────────────────────────────────
-- Insert one row per user with is_epo = true at 3/3/3. ON CONFLICT DO NOTHING
-- keeps the migration idempotent if rerun.
INSERT INTO public.epo_wip_limits (user_id, pre_build_limit, build_limit, post_deploy_limit)
SELECT id, 3, 3, 3
  FROM public.users
  WHERE is_epo = true
    AND deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. RLS — defense-in-depth per D-353 ────────────────────────────────────────
-- Reads gated to authenticated users (any role can read). Writes happen only
-- through update_epo_wip_limits MCP (Admin JWT enforced at MCP layer).
ALTER TABLE public.epo_wip_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY epo_wip_limits_read_all_authenticated
    ON public.epo_wip_limits
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY epo_wip_limits_admin_write
    ON public.epo_wip_limits
    FOR ALL
    TO authenticated
    USING (public.user_is_admin())
    WITH CHECK (public.user_is_admin());

COMMIT;

-- ── Verification queries (run after COMMIT to confirm) ─────────────────────
-- 1. Table created with expected shape:
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'epo_wip_limits'
--   ORDER BY ordinal_position;
--
-- 2. Seed row count matches active EPO count:
-- SELECT
--   (SELECT count(*) FROM public.users
--      WHERE is_epo = true AND deleted_at IS NULL) AS active_epos,
--   (SELECT count(*) FROM public.epo_wip_limits)   AS seeded_rows;
-- Expected: equal.
--
-- 3. All seeded rows at 3/3/3:
-- SELECT user_id, pre_build_limit, build_limit, post_deploy_limit
--   FROM public.epo_wip_limits
--   ORDER BY user_id;
-- Expected: every row 3/3/3, updated_at NULL.
--
-- 4. RLS policies in place:
-- SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'epo_wip_limits';
-- Expected: epo_wip_limits_read_all_authenticated (SELECT),
--           epo_wip_limits_admin_write (ALL).
