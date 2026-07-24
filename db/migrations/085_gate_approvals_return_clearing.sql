-- 085_gate_approvals_return_clearing.sql
-- Pathways OI Trust — Contract G5 (governance redesign, D-557 L1 consensus)
-- Checkpoint 2026-07-23 ruling 1 (resolves CC-G1-15): a return marks the
-- gate's collected approvals CLEARED — rows are never deleted (Arch-6 /
-- append-only history). Current approval set = rows WHERE
-- cleared_by_return_at IS NULL. Re-collection inserts new rows; no unique
-- constraint blocks re-collection.
-- CC-G5 mechanics: timestamp + reference to the gate_returned event row.
-- ⚠ Do NOT execute via Code. Phil executes (preview env only until GEnd).
-- Must run after: 083_gate_event_tables.sql

BEGIN;

ALTER TABLE public.gate_approvals
    ADD COLUMN IF NOT EXISTS cleared_by_return_at timestamptz NULL,
    ADD COLUMN IF NOT EXISTS cleared_by_event_id  uuid NULL
        REFERENCES public.cycle_event_log(event_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gate_approvals_active
    ON public.gate_approvals (gate_record_id)
    WHERE cleared_by_return_at IS NULL;

COMMENT ON COLUMN public.gate_approvals.cleared_by_return_at IS
    'Contract G5 (Checkpoint ruling 1): set on every collected approval when '
    'the gate is returned — any-return-returns-all (S-A2/S-A4). Rows are never '
    'deleted; the current approval set is WHERE cleared_by_return_at IS NULL.';
COMMENT ON COLUMN public.gate_approvals.cleared_by_event_id IS
    'The cycle_event_log gate_returned event that cleared this approval.';

COMMIT;
