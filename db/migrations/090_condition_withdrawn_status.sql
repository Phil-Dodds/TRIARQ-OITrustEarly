-- 090_condition_withdrawn_status.sql
-- Conditions loop (Phil ruling 2026-07-26, supersedes the G6 return-wipe rule):
-- conditions are durable work items — they survive returns and resubmissions
-- until a human resolves them (work done) or WITHDRAWS them (no longer
-- applies, reason recorded). Never-delete posture: 'withdrawn' is a status.

BEGIN;

ALTER TABLE public.gate_conditions
  DROP CONSTRAINT IF EXISTS gate_conditions_condition_status_check;

ALTER TABLE public.gate_conditions
  ADD CONSTRAINT gate_conditions_condition_status_check
  CHECK (condition_status IN ('open', 'resolved', 'withdrawn'));

COMMIT;
