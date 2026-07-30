-- 094_division_approvers.sql
-- Contract 40 follow-on (picker-only approver eligibility; Phil 2026-07-29).
--
-- New concept: designated per-division Approvers. This is a CANDIDATE POOL for
-- the manual gate-approver picker only. It does NOT feed automatic gate
-- resolution — the D-557 resolution chain (oversight -> gate_approver_configs
-- -> division owner -> Phil) is unchanged.
--
-- Eligibility pool the picker shows for a cycle =
--   all Initiative Executives
--   + the cycle division's Leader (divisions.owner_user_id)
--   + every ancestor division's Leader (walk parent_division_id)
--   + the cycle division's designated Approvers (rows in this table)
--
-- Members-only: a designated Approver must belong to the division
-- (an active public.division_memberships row) — enforced in the MCP tool.

CREATE TABLE IF NOT EXISTS public.division_approvers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id  uuid NOT NULL REFERENCES public.divisions(id),
  user_id      uuid NOT NULL REFERENCES public.users(id),
  assigned_by  uuid REFERENCES public.users(id),
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- One active designation per (division, user). Soft-deleted rows are ignored so
-- a user can be re-designated after removal.
CREATE UNIQUE INDEX IF NOT EXISTS division_approvers_div_user_active
  ON public.division_approvers (division_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS division_approvers_division_idx
  ON public.division_approvers (division_id)
  WHERE deleted_at IS NULL;

-- Rule 38: RLS enabled. MCP-only table -> deny-all (zero policies). The service
-- role bypasses RLS (Arch-1), so the app is unaffected; no user JWT reads it.
ALTER TABLE public.division_approvers ENABLE ROW LEVEL SECURITY;
