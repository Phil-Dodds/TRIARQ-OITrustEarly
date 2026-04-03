-- verify_build_c_schema.sql
-- Pathways OI Trust — Build C
-- Paste and run in Supabase SQL Editor to confirm all 9 migrations ran correctly.
-- Expected: no failures, seed count = 26, all tables present.

-- ============================================================
-- 1. TABLE EXISTENCE CHECK
-- ============================================================
SELECT
    t.table_name,
    COUNT(c.column_name) AS column_count
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_name = t.table_name AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
  AND t.table_name IN (
      'delivery_workstreams',
      'workstream_members',
      'delivery_cycles',
      'cycle_milestone_dates',
      'gate_records',
      'cycle_event_log',
      'cycle_artifact_types',
      'cycle_artifacts',
      'jira_links'
  )
GROUP BY t.table_name
ORDER BY t.table_name;
-- Expected: 9 rows returned

-- ============================================================
-- 2. SEED ROW COUNT — cycle_artifact_types
-- ============================================================
SELECT COUNT(*) AS seed_row_count FROM public.cycle_artifact_types;
-- Expected: 26

-- ============================================================
-- 3. SEED ROWS BY STAGE
-- ============================================================
SELECT lifecycle_stage, COUNT(*) AS slot_count
FROM public.cycle_artifact_types
GROUP BY lifecycle_stage
ORDER BY lifecycle_stage;
-- Expected:
--   ANY      1
--   BRIEF    4
--   BUILD    4
--   DESIGN   3
--   OUTCOME  1
--   PILOT    2
--   RELEASE  1
--   SPEC     4
--   UAT      3
--   VALIDATE 3

-- ============================================================
-- 4. CHECK CONSTRAINT — tier_classification
-- Expect: ERROR "violates check constraint"
-- ============================================================
-- Uncomment to test; re-comment before saving
-- INSERT INTO public.delivery_cycles
--     (cycle_title, division_id, workstream_id, tier_classification, cycle_owner_user_id)
-- VALUES
--     ('Test', gen_random_uuid(), gen_random_uuid(), 'tier_99', gen_random_uuid());

-- ============================================================
-- 5. CHECK CONSTRAINT — current_lifecycle_stage
-- Expect: ERROR "violates check constraint"
-- ============================================================
-- INSERT INTO public.delivery_cycles
--     (cycle_title, division_id, workstream_id, tier_classification,
--      current_lifecycle_stage, cycle_owner_user_id)
-- VALUES
--     ('Test', gen_random_uuid(), gen_random_uuid(), 'tier_1', 'INVALID_STAGE', gen_random_uuid());

-- ============================================================
-- 6. CHECK CONSTRAINT — gate_name in gate_records
-- Expect: ERROR "violates check constraint"
-- ============================================================
-- INSERT INTO public.gate_records (delivery_cycle_id, gate_name)
-- VALUES (gen_random_uuid(), 'not_a_real_gate');

-- ============================================================
-- 7. UNIQUE CONSTRAINT — cycle_milestone_dates (cycle + gate_name)
-- ============================================================
-- INSERT INTO public.cycle_milestone_dates
--     (delivery_cycle_id, gate_name, milestone_label)
-- VALUES
--     (gen_random_uuid(), 'brief_review', 'Test 1'),
--     (gen_random_uuid(), 'brief_review', 'Test 2');  -- same cycle+gate = error

-- ============================================================
-- 8. TRIGGER CHECK — updated_at fires on update
-- Uses real division_id and user_id from existing rows to satisfy FK constraints.
-- ============================================================
DO $$
DECLARE
    v_id         uuid;
    v_div_id     uuid;
    v_user_id    uuid;
    v_created    timestamptz;
    v_updated    timestamptz;
BEGIN
    -- Look up real IDs to satisfy FK constraints
    SELECT id INTO v_div_id  FROM public.divisions WHERE deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_user_id FROM public.users    WHERE deleted_at IS NULL LIMIT 1;

    IF v_div_id IS NULL OR v_user_id IS NULL THEN
        RAISE WARNING 'SKIP: no divisions or users found — run Build A seed data first, then re-run this check';
        RETURN;
    END IF;

    INSERT INTO public.delivery_workstreams
        (workstream_name, home_division_id, workstream_lead_user_id)
    VALUES
        ('_verify_trigger_test_', v_div_id, v_user_id)
    RETURNING workstream_id, created_at, updated_at
    INTO v_id, v_created, v_updated;

    -- Soft-delete immediately (clean up test row)
    UPDATE public.delivery_workstreams
       SET deleted_at = now(),
           workstream_name = '_verify_trigger_test_deleted_'
     WHERE workstream_id = v_id;

    SELECT updated_at INTO v_updated
      FROM public.delivery_workstreams
     WHERE workstream_id = v_id;

    IF v_updated > v_created THEN
        RAISE NOTICE 'PASS: updated_at trigger is firing correctly on delivery_workstreams';
    ELSE
        RAISE WARNING 'FAIL: updated_at trigger did not fire — updated_at equals created_at after UPDATE';
    END IF;
END $$;

-- ============================================================
-- 9. CONFIRM NO HARD DELETE RISK — cycle_event_log has no deleted_at
-- ============================================================
SELECT
    CASE WHEN COUNT(*) = 0
         THEN 'PASS: cycle_event_log has no deleted_at column (append-only, correct)'
         ELSE 'FAIL: cycle_event_log unexpectedly has deleted_at column'
    END AS event_log_check
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cycle_event_log'
  AND column_name = 'deleted_at';
