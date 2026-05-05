-- =============================================================================
-- Migration 031 — Enable RLS on all tables (SEC-01)
-- Pathways OI Trust | 2026-05-04 | CONFIDENTIAL
-- Governing decision: D-353 — Row Level Security Enabled for External User Access
-- Supersedes: Session 2026-03-30-A (RLS explicitly disabled for single-user closed system)
-- D-93 (MCP-only access) unchanged — service role bypasses RLS.
-- =============================================================================
--
-- AMENDMENTS TO sec-01-rls-spec-2026-05-04.md (Phil + Code, 2026-05-04):
--   1. auth.user_is_admin() predicate: role IN ('phil','admin') →
--      system_role = 'phil'. Schema rename (role → system_role) AND admin
--      model truth: admin not implemented at the data layer; only 'phil' is
--      super-admin today. Per session option (c).
--   2. auth.user_division_ids() filter: AND revoked_at IS NULL added alongside
--      AND deleted_at IS NULL. division_memberships is soft-revocable; revoked
--      memberships must not grant access.
--   3. users-table policies use id (PK) not user_id. Spec assumed user_id which
--      does not exist on public.users.
-- All three deviations are CodeClose candidates per D-332.
--
-- DEFERRED FROM SPEC (this migration):
--   user_screen_state — table does not exist in public schema. Spec §4
--   defines four RLS policies for it; those are intentionally OMITTED here.
--   When user_screen_state is built, a follow-up migration must enable RLS
--   and apply the policy block per spec §4. CodeClose candidate logged.
--
-- TABLES COVERED: 16 (spec listed 17; user_screen_state deferred per above).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS — must exist before policies reference them
-- ---------------------------------------------------------------------------

-- True iff the calling user holds the 'phil' system_role.
-- Function name retained for spec continuity; semantically: super-admin check.
-- SECURITY DEFINER prevents RLS recursion when other tables' policies call it.
CREATE OR REPLACE FUNCTION auth.user_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND system_role = 'phil'
      AND deleted_at IS NULL
  )
$$;

-- Division ids the calling user is a current member of.
-- revoked_at IS NULL excludes soft-revoked memberships.
-- SECURITY DEFINER prevents RLS recursion via division_memberships policy.
CREATE OR REPLACE FUNCTION auth.user_division_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT division_id
  FROM public.division_memberships
  WHERE user_id = auth.uid()
    AND deleted_at IS NULL
    AND revoked_at IS NULL
$$;

-- ---------------------------------------------------------------------------
-- BUILD A TABLES
-- ---------------------------------------------------------------------------

-- users (PK = id, not user_id)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR auth.user_is_admin());

CREATE POLICY "users_insert"
  ON public.users FOR INSERT
  WITH CHECK (auth.user_is_admin());

CREATE POLICY "users_update"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR auth.user_is_admin());

CREATE POLICY "users_delete"
  ON public.users FOR DELETE
  USING (auth.user_is_admin());

-- divisions
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divisions_select"
  ON public.divisions FOR SELECT
  USING (TRUE);

CREATE POLICY "divisions_insert"
  ON public.divisions FOR INSERT
  WITH CHECK (auth.user_is_admin());

CREATE POLICY "divisions_update"
  ON public.divisions FOR UPDATE
  USING (auth.user_is_admin());

CREATE POLICY "divisions_delete"
  ON public.divisions FOR DELETE
  USING (auth.user_is_admin());

-- division_memberships
ALTER TABLE public.division_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "division_memberships_select"
  ON public.division_memberships FOR SELECT
  USING (user_id = auth.uid() OR auth.user_is_admin());

CREATE POLICY "division_memberships_insert"
  ON public.division_memberships FOR INSERT
  WITH CHECK (auth.user_is_admin());

CREATE POLICY "division_memberships_update"
  ON public.division_memberships FOR UPDATE
  USING (auth.user_is_admin());

CREATE POLICY "division_memberships_delete"
  ON public.division_memberships FOR DELETE
  USING (auth.user_is_admin());

-- artifacts (Build B will refine; this is restrictive baseline)
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artifacts_select"
  ON public.artifacts FOR SELECT
  USING (
    division_id IN (SELECT auth.user_division_ids())
    OR auth.user_is_admin()
  );

CREATE POLICY "artifacts_insert"
  ON public.artifacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "artifacts_update"
  ON public.artifacts FOR UPDATE
  USING (submitted_by = auth.uid() OR auth.user_is_admin());

CREATE POLICY "artifacts_delete"
  ON public.artifacts FOR DELETE
  USING (auth.user_is_admin());

-- ---------------------------------------------------------------------------
-- BUILD C TABLES
-- ---------------------------------------------------------------------------

-- delivery_workstreams
ALTER TABLE public.delivery_workstreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_workstreams_select"
  ON public.delivery_workstreams FOR SELECT
  USING (TRUE);

CREATE POLICY "delivery_workstreams_insert"
  ON public.delivery_workstreams FOR INSERT
  WITH CHECK (auth.user_is_admin());

CREATE POLICY "delivery_workstreams_update"
  ON public.delivery_workstreams FOR UPDATE
  USING (auth.user_is_admin());

CREATE POLICY "delivery_workstreams_delete"
  ON public.delivery_workstreams FOR DELETE
  USING (auth.user_is_admin());

-- workstream_members
ALTER TABLE public.workstream_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workstream_members_select"
  ON public.workstream_members FOR SELECT
  USING (TRUE);

CREATE POLICY "workstream_members_insert"
  ON public.workstream_members FOR INSERT
  WITH CHECK (auth.user_is_admin());

CREATE POLICY "workstream_members_update"
  ON public.workstream_members FOR UPDATE
  USING (auth.user_is_admin());

CREATE POLICY "workstream_members_delete"
  ON public.workstream_members FOR DELETE
  USING (auth.user_is_admin());

-- delivery_cycles
ALTER TABLE public.delivery_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_cycles_select"
  ON public.delivery_cycles FOR SELECT
  USING (
    division_id IN (SELECT auth.user_division_ids())
    OR auth.user_is_admin()
  );

CREATE POLICY "delivery_cycles_insert"
  ON public.delivery_cycles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "delivery_cycles_update"
  ON public.delivery_cycles FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "delivery_cycles_delete"
  ON public.delivery_cycles FOR DELETE
  USING (auth.user_is_admin());

-- cycle_milestone_dates
ALTER TABLE public.cycle_milestone_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_milestone_dates_select"
  ON public.cycle_milestone_dates FOR SELECT
  USING (
    delivery_cycle_id IN (
      SELECT delivery_cycle_id FROM public.delivery_cycles
      WHERE division_id IN (SELECT auth.user_division_ids())
        AND deleted_at IS NULL
    )
    OR auth.user_is_admin()
  );
-- No INSERT/UPDATE policy — service role bypasses RLS; MCP writes these rows.

-- gate_records
ALTER TABLE public.gate_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate_records_select"
  ON public.gate_records FOR SELECT
  USING (
    delivery_cycle_id IN (
      SELECT delivery_cycle_id FROM public.delivery_cycles
      WHERE division_id IN (SELECT auth.user_division_ids())
        AND deleted_at IS NULL
    )
    OR auth.user_is_admin()
  );
-- No INSERT/UPDATE policy — service role bypasses RLS; MCP writes these rows.

-- cycle_event_log (append-only)
ALTER TABLE public.cycle_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_event_log_select"
  ON public.cycle_event_log FOR SELECT
  USING (
    delivery_cycle_id IN (
      SELECT delivery_cycle_id FROM public.delivery_cycles
      WHERE division_id IN (SELECT auth.user_division_ids())
        AND deleted_at IS NULL
    )
    OR auth.user_is_admin()
  );
-- No INSERT policy — MCP service role appends all events.

-- cycle_artifact_types (seed data — read-only)
ALTER TABLE public.cycle_artifact_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_artifact_types_select"
  ON public.cycle_artifact_types FOR SELECT
  USING (TRUE);

-- cycle_artifacts
ALTER TABLE public.cycle_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_artifacts_select"
  ON public.cycle_artifacts FOR SELECT
  USING (
    delivery_cycle_id IN (
      SELECT delivery_cycle_id FROM public.delivery_cycles
      WHERE division_id IN (SELECT auth.user_division_ids())
        AND deleted_at IS NULL
    )
    OR auth.user_is_admin()
  );

CREATE POLICY "cycle_artifacts_insert"
  ON public.cycle_artifacts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cycle_artifacts_update"
  ON public.cycle_artifacts FOR UPDATE
  USING (attached_by_user_id = auth.uid() OR auth.user_is_admin());

CREATE POLICY "cycle_artifacts_delete"
  ON public.cycle_artifacts FOR DELETE
  USING (auth.user_is_admin());

-- jira_links
ALTER TABLE public.jira_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jira_links_select"
  ON public.jira_links FOR SELECT
  USING (
    delivery_cycle_id IN (
      SELECT delivery_cycle_id FROM public.delivery_cycles
      WHERE division_id IN (SELECT auth.user_division_ids())
        AND deleted_at IS NULL
    )
    OR auth.user_is_admin()
  );
-- No INSERT/UPDATE policy — MCP writes these rows.

-- tier_gate_requirements (seed data — read-only)
ALTER TABLE public.tier_gate_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tier_gate_requirements_select"
  ON public.tier_gate_requirements FOR SELECT
  USING (TRUE);

-- division_gate_approvers
ALTER TABLE public.division_gate_approvers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "division_gate_approvers_select"
  ON public.division_gate_approvers FOR SELECT
  USING (TRUE);

CREATE POLICY "division_gate_approvers_insert"
  ON public.division_gate_approvers FOR INSERT
  WITH CHECK (auth.user_is_admin());

CREATE POLICY "division_gate_approvers_update"
  ON public.division_gate_approvers FOR UPDATE
  USING (auth.user_is_admin());

CREATE POLICY "division_gate_approvers_delete"
  ON public.division_gate_approvers FOR DELETE
  USING (auth.user_is_admin());

-- system_config
-- D-MaintenanceMode exception: SELECT TRUE so Angular bootstrap reads
-- maintenance_mode pre-auth. maintenance_message is therefore public —
-- accepted known limitation at deployment scale.
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_config_select"
  ON public.system_config FOR SELECT
  USING (TRUE);
-- No INSERT — single row seeded at bootstrap.
-- No UPDATE policy for authenticated role — service role only via MCP tool.
-- No DELETE.

COMMIT;
