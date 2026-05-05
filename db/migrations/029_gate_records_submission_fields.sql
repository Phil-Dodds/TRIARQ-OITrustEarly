-- 029_gate_records_submission_fields.sql
-- Pathways OI Trust — Build C Contract 10 / Validator Close 2026-05-02
-- Adds submitted_at + submitted_by_user_id to gate_records and extends
-- gate_status CHECK constraint to include 'awaiting_approval'.
-- Source: D-345 (GateSubmissionFlow), gate-submission-flow-spec-2026-04-19 §1.1, §1.2.
--
-- submitted_at + submitted_by_user_id: set by submit_gate_for_approval, cleared by withdraw_gate_submission.
-- Cleared by withdraw_gate_submission so a re-submission overwrites with new identity/timestamp.
--
-- gate_status flow: not_started → awaiting_approval (on submit) → approved | returned (on decision)
--                                  └─ → not_started (on withdraw)
-- Existing valid set ('not_started','pending','approved','returned','blocked') retained.
-- 'pending' kept for legacy rows from earlier seed model (pre-D-282).

ALTER TABLE public.gate_records
  ADD COLUMN IF NOT EXISTS submitted_at         timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.gate_records
  DROP CONSTRAINT IF EXISTS gate_records_gate_status_check;

ALTER TABLE public.gate_records
  ADD CONSTRAINT gate_records_gate_status_check
  CHECK (gate_status IN ('not_started', 'pending', 'awaiting_approval', 'approved', 'returned', 'blocked'));

CREATE INDEX IF NOT EXISTS idx_gate_records_submitted_by
  ON public.gate_records (submitted_by_user_id)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.gate_records.submitted_at IS
  'Timestamp set by submit_gate_for_approval. Cleared on withdraw_gate_submission. Overwritten on re-submission. Source: D-345.';

COMMENT ON COLUMN public.gate_records.submitted_by_user_id IS
  'User identity (JWT) recorded by submit_gate_for_approval. Cleared on withdraw_gate_submission. Overwritten on re-submission. Source: D-345.';

COMMENT ON COLUMN public.gate_records.gate_status IS
  'Gate lifecycle status. not_started = seeded state on new cycle; pending = legacy seed (pre-D-282); '
  'awaiting_approval = submitted, awaiting approver decision; approved = gate cleared; '
  'returned = sent back to submitter (approver_notes required); blocked = hard block (inactive workstream). '
  'Source: D-282, D-345.';
