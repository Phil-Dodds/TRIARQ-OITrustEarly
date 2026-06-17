-- 041_artifact_types_stage_to_gate.sql
-- Pathways OI Trust — Contract 25 · D-438 Amendment 1
--
-- Why a new file rather than amending 040:
--   Migration 040 assumed Contract 24 had shipped a `required_at_gate`
--   column on `cycle_artifact_types`. That column never existed in
--   Supabase. 040 ran statement-by-statement (the editor auto-commits),
--   so Steps 1–2 (ADD COLUMN primary_gate, gate_warning_behavior +
--   CHECK constraints) landed before Step 3's UPDATE … WHERE
--   required_at_gate IS NULL failed with 42703. 040 is left as the
--   historical record of that attempt; 041 supersedes it.
--
-- What this migration does (D-438 Amendment 1 — stage → gate swap):
--   • Idempotently re-asserts CHECK constraints on primary_gate and
--     gate_warning_behavior in case the partial 040 run didn't add them.
--   • Backfills primary_gate from lifecycle_stage using the Amendment 1
--     mapping table.
--   • Backfills gate_warning_behavior to 'primary_only' for rows whose
--     lifecycle_stage maps to a gate; leaves 'none' for 'ANY' rows.
--   • Re-sequences sort_order within each primary_gate group, ordering
--     by former lifecycle_stage sequence then existing sort_order, then
--     artifact_type_name as a final tiebreaker.
--   • Drops cycle_artifact_types.lifecycle_stage.
--
-- delivery_cycles.current_lifecycle_stage is a SEPARATE column on a
-- DIFFERENT table and is NOT touched by this migration. Amendment 1
-- explicitly preserves it.
--
-- Source: OITrust-Contract25-D438-Amendment1-for-Code.md (Steps 5–8).
--
-- ⚠ Do NOT execute via Code per Rule 21. Phil executes against Supabase.

BEGIN;

-- ── Step 1: Re-assert CHECK constraints (idempotent) ──────────────────
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
    CHECK (gate_warning_behavior IN (
        'none',
        'primary_only',
        'primary_and_subsequent'
    ));

-- ── Step 2: Backfill primary_gate + gate_warning_behavior ─────────────
-- Only updates rows whose primary_gate is still NULL — idempotent.
UPDATE public.cycle_artifact_types
SET primary_gate = CASE lifecycle_stage
        WHEN 'BRIEF'    THEN 'brief_review'
        WHEN 'DESIGN'   THEN 'go_to_build'
        WHEN 'SPEC'     THEN 'go_to_build'
        WHEN 'BUILD'    THEN 'go_to_deploy'
        WHEN 'VALIDATE' THEN 'go_to_deploy'
        WHEN 'UAT'      THEN 'go_to_deploy'
        WHEN 'PILOT'    THEN 'go_to_release'
        WHEN 'RELEASE'  THEN 'close_review'
        WHEN 'OUTCOME'  THEN 'close_review'
        ELSE NULL  -- 'ANY' and any unknown value → NULL (Unscheduled)
    END,
    gate_warning_behavior = CASE
        WHEN lifecycle_stage IN (
            'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME'
        ) THEN 'primary_only'
        ELSE 'none'
    END
WHERE primary_gate IS NULL;

-- ── Step 3: Re-sequence sort_order within each gate group ────────────
-- Primary sort: former lifecycle_stage sequence.
-- Secondary:    existing sort_order (preserve relative order within stage).
-- Tertiary:     artifact_type_name (stable tiebreaker).
WITH stage_priority(stage, p) AS (VALUES
    ('BRIEF',    1),
    ('DESIGN',   2),
    ('SPEC',     3),
    ('BUILD',    4),
    ('VALIDATE', 5),
    ('UAT',      6),
    ('PILOT',    7),
    ('RELEASE',  8),
    ('OUTCOME',  9),
    ('ANY',     10)
),
ranked AS (
    SELECT
        t.artifact_type_id,
        ROW_NUMBER() OVER (
            PARTITION BY t.primary_gate
            ORDER BY COALESCE(sp.p, 99),
                     t.sort_order,
                     t.artifact_type_name
        ) AS new_order
    FROM public.cycle_artifact_types t
    LEFT JOIN stage_priority sp ON sp.stage = t.lifecycle_stage
)
UPDATE public.cycle_artifact_types t
SET sort_order = r.new_order
FROM ranked r
WHERE t.artifact_type_id = r.artifact_type_id;

-- ── Step 4: Drop lifecycle_stage column ──────────────────────────────
-- NOT NULL constraint goes with the column. delivery_cycles.current_lifecycle_stage
-- (different table, different column) is NOT affected.
ALTER TABLE public.cycle_artifact_types
    DROP COLUMN IF EXISTS lifecycle_stage;

COMMIT;

-- ── Verification queries (run separately after migration) ─────────────
-- 1. Confirm lifecycle_stage gone, primary_gate + gate_warning_behavior present:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='cycle_artifact_types'
--      AND column_name IN ('lifecycle_stage','primary_gate','gate_warning_behavior')
--    ORDER BY column_name;
--
-- 2. Backfill distribution — expect rows clustered around gate values:
--    SELECT primary_gate, gate_warning_behavior, count(*)
--    FROM public.cycle_artifact_types
--    GROUP BY 1,2 ORDER BY 1 NULLS LAST, 2;
--
-- 3. sort_order is 1..N within each gate group:
--    SELECT primary_gate,
--           array_agg(sort_order ORDER BY sort_order) AS orders,
--           array_agg(artifact_type_name ORDER BY sort_order) AS names
--    FROM public.cycle_artifact_types
--    GROUP BY primary_gate
--    ORDER BY primary_gate NULLS LAST;
--
-- 4. delivery_cycles.current_lifecycle_stage untouched:
--    SELECT column_name FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='delivery_cycles'
--      AND column_name='current_lifecycle_stage';
