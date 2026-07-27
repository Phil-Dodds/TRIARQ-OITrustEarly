-- 091_cast_confirmation_outcome_verdict.sql
-- Contract 39 (D-583 Tier Retirement, D-584 Cast Lifecycle, D-585 Close Review
-- Outcome Verification).
--
-- ⚠ Do NOT execute via Code. Phil executes.
-- Must run after: 090_condition_withdrawn_status.sql.
--
-- 1. gate_records — cast confirmation at Go to Build submission (D-584):
--    cast_confirmed_at/by record the submitter's one-tap confirmation of the
--    consultation set ("last cheap moment", same pattern as D-567 sizing).
-- 2. gate_records — Close Review outcome verdict (D-585): outcome_verdict
--    ('met' | 'not_met'), outcome_actual (actual result text), outcome_evidence
--    (where demonstrated / what happened). Not-met is a passing state (D-573
--    honesty posture) — never a blocked one.
-- 3. delivery_cycles.tier_classification — ANNOTATED RETIRED, not dropped
--    (D-583; Decision Severity Principle — physical drop joins the scheduled
--    GEnd+1 column-drop batch). Historical values kept; never written again.
--
-- RLS: gate_records already has ROW LEVEL SECURITY enabled (deny-all, MCP
-- service-role access only — D-547/Rule 38). No policy change required.

BEGIN;

ALTER TABLE public.gate_records
  ADD COLUMN IF NOT EXISTS cast_confirmed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cast_confirmed_by uuid NULL REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS outcome_verdict   text NULL,
  ADD COLUMN IF NOT EXISTS outcome_actual    text NULL,
  ADD COLUMN IF NOT EXISTS outcome_evidence  text NULL;

ALTER TABLE public.gate_records
  DROP CONSTRAINT IF EXISTS gate_records_outcome_verdict_check;

ALTER TABLE public.gate_records
  ADD CONSTRAINT gate_records_outcome_verdict_check
  CHECK (outcome_verdict IS NULL OR outcome_verdict IN ('met', 'not_met'));

COMMENT ON COLUMN public.gate_records.cast_confirmed_at IS
  'D-584 (Contract 39): timestamp of submitter cast confirmation at Go to Build submission.';
COMMENT ON COLUMN public.gate_records.cast_confirmed_by IS
  'D-584 (Contract 39): user who confirmed the consultation set at Go to Build submission.';
COMMENT ON COLUMN public.gate_records.outcome_verdict IS
  'D-585 (Contract 39): Close Review outcome verdict — met (demonstrated) | not_met (documented). Both are passing states.';
COMMENT ON COLUMN public.gate_records.outcome_actual IS
  'D-585 (Contract 39): actual result text; for null outcome_statement Initiatives this states the outcome retrospectively.';
COMMENT ON COLUMN public.gate_records.outcome_evidence IS
  'D-585 (Contract 39): evidence (met: where demonstrated) or explanation (not_met: what happened).';

COMMENT ON COLUMN public.delivery_cycles.tier_classification IS
  'RETIRED (D-583, Contract 39): historical values only — never written or displayed. Physical drop scheduled for the GEnd+1 column-drop batch.';

COMMIT;
