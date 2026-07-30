-- 096_artifact_warning_window.sql
-- Pathways OI Trust — Contract 40 follow-on (Phil 2026-07-30)
--
-- Two changes:
--
-- 1. Adds gate_warning_through — an optional UPPER bound on the gate range a
--    missing-artifact warning fires across. D-438 only modelled 'primary_only'
--    (exactly one gate) or 'primary_and_subsequent' (that gate and every gate
--    forever after). Phil asked for a bounded window — warn from gate X through
--    gate Y and then stop — because nagging about a Brief-stage artifact at
--    Close Review is the same ceremony CC-40-J removed. NULL = no upper bound
--    (existing 'primary_and_subsequent' rows keep their current behaviour).
--
-- 2. Reconfigures Context Brief and Scenario Journeys as LOUD SUGGESTIONS
--    across a window, replacing the hard stop that blocked Go to Build:
--      Context Brief      — Brief Review → Go to Deploy
--      Scenario Journeys  — Go to Build  → Go to Deploy
--    The Context Brief hard stop in submit_gate_for_approval.js (added
--    2026-07-17) is removed in the same change. Phil's ruling 2026-07-30:
--    a missing framing document should be loudly visible to both submitter and
--    approver at the gates where it still matters, not a wall at one gate.
--
-- Both artifact types keep gate_required = false; enforcement is advisory.
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.

BEGIN;

-- Step 1: upper-bound column. NULL = unbounded (prior behaviour preserved).
ALTER TABLE public.cycle_artifact_types
    ADD COLUMN IF NOT EXISTS gate_warning_through text;

ALTER TABLE public.cycle_artifact_types
    DROP CONSTRAINT IF EXISTS cycle_artifact_types_gate_warning_through_check;
ALTER TABLE public.cycle_artifact_types
    ADD CONSTRAINT cycle_artifact_types_gate_warning_through_check
    CHECK (gate_warning_through IS NULL OR gate_warning_through IN
        ('brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'));

COMMENT ON COLUMN public.cycle_artifact_types.gate_warning_through IS
    'Optional upper bound for gate_warning_behavior=primary_and_subsequent: the last gate at which the missing-artifact warning fires. NULL = through the final gate. Contract 40 follow-on, Phil 2026-07-30.';

-- Step 2: Context Brief — loud from Brief Review through Go to Deploy.
UPDATE public.cycle_artifact_types
   SET primary_gate          = 'brief_review',
       gate_warning_behavior = 'primary_and_subsequent',
       gate_warning_through  = 'go_to_deploy'
 WHERE artifact_type_name = 'Context Brief';

-- Step 3: Scenario Journeys — loud from Go to Build through Go to Deploy.
-- (Deliberately NOT warned at Brief Review — Phil 2026-07-30.)
UPDATE public.cycle_artifact_types
   SET primary_gate          = 'go_to_build',
       gate_warning_behavior = 'primary_and_subsequent',
       gate_warning_through  = 'go_to_deploy'
 WHERE artifact_type_name = 'Scenario Journeys';

COMMIT;

-- Verification (run after COMMIT; expect exactly the two rows above):
-- SELECT artifact_type_name, primary_gate, gate_warning_behavior, gate_warning_through
--   FROM public.cycle_artifact_types
--  WHERE artifact_type_name IN ('Context Brief', 'Scenario Journeys');
