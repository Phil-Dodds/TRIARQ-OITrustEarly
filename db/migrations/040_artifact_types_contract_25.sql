-- 040_artifact_types_contract_25.sql
-- Pathways OI Trust — Contract 25 (D-438)
--
-- Supersedes the required_at_gate portions of Migration 039 (Contract 24). Adds
-- primary_gate (nullable gate enum value) and gate_warning_behavior (none /
-- primary_only / primary_and_subsequent). Backfills from the prior
-- required_at_gate column, then drops it.
--
-- Backfill rules (Contract 25 spec WS1 §Schema Migration):
--   NULL                                                    → primary_gate=NULL,         gate_warning_behavior='none'
--   brief_review/go_to_build/go_to_deploy/go_to_release/close_review
--                                                            → primary_gate=<same>,       gate_warning_behavior='primary_only'
--   'all'                                                    → primary_gate='brief_review', gate_warning_behavior='primary_and_subsequent'
--
-- Source: OITrust-Contract25-Spec-2026-06-16.md §WS1, D-438.
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.

BEGIN;

-- Step 1: Add new columns
ALTER TABLE public.cycle_artifact_types
    ADD COLUMN IF NOT EXISTS primary_gate           text,
    ADD COLUMN IF NOT EXISTS gate_warning_behavior  text NOT NULL DEFAULT 'none';

-- Step 2: CHECK constraints on the new columns
ALTER TABLE public.cycle_artifact_types
    DROP CONSTRAINT IF EXISTS cycle_artifact_types_primary_gate_check;
ALTER TABLE public.cycle_artifact_types
    ADD CONSTRAINT cycle_artifact_types_primary_gate_check
    CHECK (primary_gate IS NULL OR primary_gate IN (
        'brief_review',
        'go_to_build',
        'go_to_deploy',
        'go_to_release',
        'close_review'
    ));

ALTER TABLE public.cycle_artifact_types
    DROP CONSTRAINT IF EXISTS cycle_artifact_types_gate_warning_behavior_check;
ALTER TABLE public.cycle_artifact_types
    ADD CONSTRAINT cycle_artifact_types_gate_warning_behavior_check
    CHECK (gate_warning_behavior IN ('none', 'primary_only', 'primary_and_subsequent'));

-- Step 3: Backfill from required_at_gate
UPDATE public.cycle_artifact_types SET
    primary_gate          = NULL,
    gate_warning_behavior = 'none'
WHERE required_at_gate IS NULL;

UPDATE public.cycle_artifact_types SET
    primary_gate          = required_at_gate,
    gate_warning_behavior = 'primary_only'
WHERE required_at_gate IN ('brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review');

UPDATE public.cycle_artifact_types SET
    primary_gate          = 'brief_review',
    gate_warning_behavior = 'primary_and_subsequent'
WHERE required_at_gate = 'all';

-- Step 4: Drop required_at_gate column and its CHECK constraint
ALTER TABLE public.cycle_artifact_types
    DROP CONSTRAINT IF EXISTS cycle_artifact_types_required_at_gate_check;
ALTER TABLE public.cycle_artifact_types
    DROP COLUMN IF EXISTS required_at_gate;

COMMENT ON COLUMN public.cycle_artifact_types.primary_gate IS
    'D-438 (Contract 25): the principal gate this artifact informs. NULL = '
    'no gate association. Combined with gate_warning_behavior to fire a '
    'D-200 Pattern 2 warning in submit_gate_for_approval and '
    'record_gate_decision when the gate sequence position matches.';

COMMENT ON COLUMN public.cycle_artifact_types.gate_warning_behavior IS
    'D-438 (Contract 25): warning behavior — none / primary_only / '
    'primary_and_subsequent. ''primary_only'' fires only at the primary '
    'gate. ''primary_and_subsequent'' fires at the primary gate and every '
    'subsequent gate by sequence position.';

COMMIT;

-- ── Verification queries (run separately after migration) ──────────────────
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='cycle_artifact_types'
--     AND column_name IN ('required_at_gate','primary_gate','gate_warning_behavior')
--   ORDER BY column_name;
-- SELECT primary_gate, gate_warning_behavior, count(*)
--   FROM public.cycle_artifact_types
--   GROUP BY 1,2 ORDER BY 1 NULLS FIRST, 2;
