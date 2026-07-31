-- 097_artifact_warning_on_open.sql
-- Pathways OI Trust — Contract 41 (Phil 2026-07-31)
--
-- Fixes the over-broad warning panel introduced by the Contract 40 follow-on.
--
-- What went wrong: migration 096 + the new read-path computation
-- (computeArtifactWarningsByGate) made missing-artifact warnings visible on
-- gate-modal OPEN. But ~12 artifact types have carried
-- gate_warning_behavior = 'primary_and_subsequent' since Contract 25
-- (migrations 040/041/076). Before the read path existed, those warnings only
-- appeared in the submit / decision RESPONSE — after the user had already
-- acted — so nobody ever saw the full set. Adding the read path exposed all of
-- them at once: Go to Build showed twelve bullets.
--
-- D-616 (CC-40-W) intended exactly two types to be loud: Context Brief and
-- Scenario Journeys. Phil 2026-07-31: "what was meant was a limited set:
-- Context Brief and Scenario Journeys, not all."
--
-- Why a new column rather than switching the other types off: setting
-- gate_warning_behavior = 'none' on the other ten would also silence their
-- D-438 post-submit advisory warnings, which are still wanted. The two
-- behaviours are genuinely different questions —
--
--   gate_warning_behavior — do we mention this artifact AFTER an action?  (D-438)
--   gate_warning_on_open  — is this artifact loud BEFORE the action?      (D-616)
--
-- so the second gets its own stored column instead of overloading the first or
-- inferring loudness from gate_warning_through being non-null (which happens to
-- be true of exactly these two rows today, but only by coincidence).
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.
-- Must run after: 096_artifact_warning_window.sql

BEGIN;

-- Default false: silence on open is the correct default. A type becomes loud
-- only by explicit Design decision, never by inheriting a D-438 setting.
ALTER TABLE public.cycle_artifact_types
    ADD COLUMN IF NOT EXISTS gate_warning_on_open boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cycle_artifact_types.gate_warning_on_open IS
    'When true, a missing artifact of this type is shown in the amber panel on gate-modal OPEN (before the user acts), within the gate_warning_behavior / gate_warning_through window. When false, the type still contributes D-438 warnings to the submit and decision RESPONSES but is silent on open. D-616 / Contract 41, Phil 2026-07-31.';

-- The two loud types per D-616 (CC-40-W). Their primary_gate /
-- gate_warning_behavior / gate_warning_through windows were set by migration
-- 096 and are deliberately not touched here:
--   Context Brief     — Brief Review → Go to Deploy
--   Scenario Journeys — Go to Build  → Go to Deploy
UPDATE public.cycle_artifact_types
   SET gate_warning_on_open = true
 WHERE artifact_type_name IN ('Context Brief', 'Scenario Journeys');

COMMIT;

-- Verification (run after COMMIT).
-- Expect exactly two rows, both true:
-- SELECT artifact_type_name, primary_gate, gate_warning_behavior,
--        gate_warning_through, gate_warning_on_open
--   FROM public.cycle_artifact_types
--  WHERE gate_warning_on_open = true
--  ORDER BY artifact_type_name;
--
-- Expect every other warning-configured type to be false (still advisory on
-- submit/decision, silent on open):
-- SELECT artifact_type_name, gate_warning_behavior, gate_warning_on_open
--   FROM public.cycle_artifact_types
--  WHERE gate_warning_behavior <> 'none' AND gate_warning_on_open = false
--  ORDER BY artifact_type_name;
