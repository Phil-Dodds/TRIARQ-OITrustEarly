-- 047_gate_approver_configs.sql
-- Pathways OI Trust — Contract 29 (Gate Approval, Consultation, and Notification System)
-- Governing decisions: D-463, D-464, D-465 — Approver Assignment and Phil Override (WS3)
--
-- Why this migration:
--   D-463 stores the resolved approver on the gate_record at submission time.
--   D-464 introduces a per-Division, per-gate approver configuration table
--   managed from the Phil-only Gate Approvers admin screen. submit_gate_for_approval
--   resolves the approver as: gate_approver_configs row → divisions.owner_user_id
--   → Phil (is_super_admin). D-465 lets Phil override at decision time.
--
-- ── Deviations from spec §WS3 Schema Migration — recorded as CC-decisions ──
--   (1) gate_records.approver_user_id ALTER DROPPED. Spec DDL adds the column:
--       "ALTER TABLE gate_records ADD COLUMN approver_user_id uuid REFERENCES users(id)".
--       That column already exists (migration 019, line 28) and is read/written
--       by record_gate_decision today. Re-adding it would fail. The existing
--       column is reused for WS3 storage-at-submission — no schema change to
--       gate_records is needed. → CC-29-3.
--   (2) created_at added to gate_approver_configs. Spec DDL lists updated_at but
--       not created_at. CLAUDE.md requires both on every new table. → CC-29-4.
--   All other spec-listed columns and constraints preserved.
--
-- Note (Design routing flag — not resolved here): an analogous unwired table
--   public.division_gate_approvers already exists (migration 026, column
--   accountable_user_id). It is referenced by no MCP tool. Contract 29 spec
--   explicitly mandates this new table + Phil-only admin screen, so it is built
--   as specced; the dead division_gate_approvers table is left for Design cleanup.
--
-- Backward compatibility:
--   gate_records unchanged (approver_user_id already present; existing rows keep
--   their current value — null on historical rows without a stored approver).
--   New gate_approver_configs table — no impact on existing rows.
--
-- RLS (D-353): enabled. SELECT TRUE (mirrors the analogous division_gate_approvers
--   policy); writes admin-only. MCP enforces Phil-only (is_super_admin) on the
--   set/delete tools; service role bypasses RLS regardless.
--
-- ⚠ Do NOT execute via Code per Rule 21 / Rule 18. Phil executes against
--   Supabase. Migration ships in repo; deployment runs only after Phil
--   confirms manual apply.

BEGIN;

-- WS3 stores the resolved approver on the EXISTING gate_records.approver_user_id
-- column (migration 019). No ALTER required — see deviation CC-29-3 above.

CREATE TABLE IF NOT EXISTS public.gate_approver_configs (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id         uuid        NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    gate_name           text        NOT NULL
                                    CHECK (gate_name IN (
                                        'brief_review', 'go_to_build', 'go_to_deploy',
                                        'go_to_release', 'close_review'
                                    )),
    approver_user_id    uuid        NOT NULL REFERENCES public.users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    updated_by_user_id  uuid        REFERENCES public.users(id),
    UNIQUE (division_id, gate_name)
);

CREATE INDEX IF NOT EXISTS idx_gate_approver_configs_division
    ON public.gate_approver_configs (division_id);

CREATE TRIGGER gate_approver_configs_set_updated_at
    BEFORE UPDATE ON public.gate_approver_configs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.gate_approver_configs IS
    'D-463/D-464 (Contract 29 WS3). Per-Division, per-gate Accountable approver. '
    'Managed from the Phil-only /admin/gate-approvers screen. Resolution order at '
    'submit_gate_for_approval: this table → divisions.owner_user_id → Phil '
    '(users.is_super_admin = true). UNIQUE (division_id, gate_name).';

COMMENT ON COLUMN public.gate_approver_configs.updated_by_user_id IS
    'User (Phil) who last wrote this config via set_gate_approver. Nullable for '
    'safety; set_gate_approver always supplies the JWT identity.';

-- RLS (D-353)
ALTER TABLE public.gate_approver_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate_approver_configs_select"
  ON public.gate_approver_configs FOR SELECT
  USING (TRUE);

CREATE POLICY "gate_approver_configs_insert"
  ON public.gate_approver_configs FOR INSERT
  WITH CHECK (public.user_is_admin());

CREATE POLICY "gate_approver_configs_update"
  ON public.gate_approver_configs FOR UPDATE
  USING (public.user_is_admin());

CREATE POLICY "gate_approver_configs_delete"
  ON public.gate_approver_configs FOR DELETE
  USING (public.user_is_admin());

COMMIT;

-- ── Verification (read-only, safe to run post-apply) ─────────────────────
-- SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE conrelid = 'public.gate_approver_configs'::regclass;
-- Confirm gate_records.approver_user_id still present (was NOT re-added):
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='gate_records'
--    AND column_name='approver_user_id';  -- expect 1 row.

-- ── Rollback (if needed) ──────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.gate_approver_configs;
-- (gate_records.approver_user_id is NOT dropped — it predates this contract.)
