-- 044_gate_skip_status.sql
-- Pathways OI Trust — Contract 28 (Gate Skip Flow)
--
-- Why this migration:
--   D-447 introduces a new terminal gate state — 'skipped' — used when an
--   initiative is submitted past an unapproved gate (typical for cycles that
--   entered OI Trust after they had already passed earlier gates outside the
--   system). Two existing CHECK constraints need to accept the new value:
--     gate_records.gate_status               (set by confirm_gate_skip)
--     cycle_milestone_dates.date_status      (mirrored on the same gate row)
--
-- Deviation from spec §WS1 Schema Migration — recorded as CC-28-1:
--   Spec proposed:
--     gate_status IN ('pending','approved','returned','blocked','skipped')
--   That set drops 'not_started' (migration 028, D-282) and
--   'awaiting_approval' (migration 029, D-345) — both active states with
--   live rows. Applying the spec verbatim would fail the constraint on
--   the majority of existing gate_records and would break gate submission
--   in MCP. This migration preserves the full existing enum and appends
--   'skipped' only.
--
-- Final enums after this migration:
--   gate_records.gate_status:
--     not_started, pending, awaiting_approval, approved, returned, blocked, skipped
--   cycle_milestone_dates.date_status:
--     not_started, on_track, at_risk, behind, complete, skipped
--
-- Backward compatibility:
--   Pure additive enum expansion. No data rewrite. No new columns. No new
--   tables. No index changes. Read tools that return gate_status/date_status
--   as text are unaffected.
--
-- ⚠ Do NOT execute via Code per Rule 21 / Rule 18. Phil executes against
--   Supabase. Migration ships in repo; deployment runs only after Phil
--   confirms manual apply.

BEGIN;

-- ── Step 1: gate_records.gate_status — append 'skipped' ──────────────────
ALTER TABLE public.gate_records
  DROP CONSTRAINT IF EXISTS gate_records_gate_status_check;

ALTER TABLE public.gate_records
  ADD CONSTRAINT gate_records_gate_status_check
  CHECK (gate_status IN (
    'not_started',
    'pending',
    'awaiting_approval',
    'approved',
    'returned',
    'blocked',
    'skipped'
  ));

COMMENT ON COLUMN public.gate_records.gate_status IS
  'Gate lifecycle status. not_started = seeded state on new cycle; '
  'pending = legacy seed (pre-D-282); '
  'awaiting_approval = submitted, awaiting approver decision; '
  'approved = gate cleared; '
  'returned = sent back to submitter (approver_notes required); '
  'blocked = hard block (inactive workstream); '
  'skipped = initiative entered system past this gate, marked via '
  'confirm_gate_skip (system-only writer per D-447). '
  'Source: D-282, D-345, D-447.';

-- ── Step 2: cycle_milestone_dates.date_status — append 'skipped' ─────────
ALTER TABLE public.cycle_milestone_dates
  DROP CONSTRAINT IF EXISTS cycle_milestone_dates_date_status_check;

ALTER TABLE public.cycle_milestone_dates
  ADD CONSTRAINT cycle_milestone_dates_date_status_check
  CHECK (date_status IN (
    'not_started',
    'on_track',
    'at_risk',
    'behind',
    'complete',
    'skipped'
  ));

COMMENT ON COLUMN public.cycle_milestone_dates.date_status IS
  'Date state driving the UI color model. Set by milestone date tools and '
  'by gate decisions. skipped = paired with gate_records.gate_status = skipped '
  'per D-447 — cleared to complete when set_milestone_actual_date backdates '
  'the gate (D-449). Source: Session 2026-03-24-A, D-447, D-449.';

COMMIT;

-- ── Verification (read-only, safe to run post-apply) ─────────────────────
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conname IN (
--   'gate_records_gate_status_check',
--   'cycle_milestone_dates_date_status_check'
-- );
