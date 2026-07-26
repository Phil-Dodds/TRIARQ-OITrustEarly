-- wipe_initiatives_2026-06-08.sql
-- Pathways OI Trust — one-off operational script
--
-- Soft-deletes every currently-active Initiative (delivery_cycle) and all
-- of its child records, so the database can be repopulated with real
-- (non-test) Initiatives starting from a clean state.
--
-- IMPORTANT
--   * Arch-6: only soft delete (UPDATE deleted_at = now()). No DELETE FROM.
--   * cycle_event_log is append-only (D-125). It is NOT soft-deleted; a
--     'cycle_deleted' event is appended per wiped Initiative for audit.
--   * Idempotent: re-running is a no-op once cycles are flagged deleted.
--   * Recovery: see RECOVERY block at the bottom of this file.
--
-- HOW TO RUN
--   1. Phil opens Supabase Studio → SQL editor.
--   2. Paste the entire DO $$ ... $$; block below (the WIPE block).
--   3. Execute. Read the NOTICE output to confirm row counts.
--   4. (Optional) Run the VERIFY query at the bottom to confirm no active
--      Initiatives remain.
--
-- Date: 2026-06-08
-- Author: Code session (Contract 20 post-close)
-- Reason: clear test Initiatives before real data entry begins.

-- ─────────────────────────────────────────────────────────────────────────
-- WIPE BLOCK — paste and run
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  now_ts          timestamptz := now();
  acting_user_id  uuid;
  cycle_count     int;
  rows_milestones int;
  rows_gates      int;
  rows_artifacts  int;
  rows_jira       int;
BEGIN
  -- Resolve the acting admin (Phil) from email. Avoids hardcoding a UUID.
  SELECT id INTO acting_user_id
    FROM public.users
   WHERE lower(email) = 'pdodds@triarqhealth.com'
     AND deleted_at IS NULL
   LIMIT 1;

  IF acting_user_id IS NULL THEN
    RAISE EXCEPTION
      'Acting admin (pdodds@triarqhealth.com) not found in public.users — '
      'edit the SELECT above to use a different admin email.';
  END IF;

  -- Capture the set of Initiatives to wipe in a temp table. Single source
  -- of truth for both the soft-delete UPDATEs and the audit-log INSERTs.
  CREATE TEMP TABLE _wipe_targets ON COMMIT DROP AS
    SELECT delivery_cycle_id, cycle_title
      FROM public.delivery_cycles
     WHERE deleted_at IS NULL;

  SELECT count(*) INTO cycle_count FROM _wipe_targets;

  IF cycle_count = 0 THEN
    RAISE NOTICE 'No active Initiatives to delete. Nothing to do.';
    RETURN;
  END IF;

  RAISE NOTICE 'Wiping % active Initiative(s)...', cycle_count;

  -- 1. Soft-delete child rows that carry deleted_at.
  --    cycle_milestone_dates — one row per gate per cycle.
  UPDATE public.cycle_milestone_dates
     SET deleted_at = now_ts
   WHERE delivery_cycle_id IN (SELECT delivery_cycle_id FROM _wipe_targets)
     AND deleted_at IS NULL;
  GET DIAGNOSTICS rows_milestones = ROW_COUNT;

  --    gate_records — submission / approval / return history.
  UPDATE public.gate_records
     SET deleted_at = now_ts
   WHERE delivery_cycle_id IN (SELECT delivery_cycle_id FROM _wipe_targets)
     AND deleted_at IS NULL;
  GET DIAGNOSTICS rows_gates = ROW_COUNT;

  --    cycle_artifacts — attached deliverables.
  UPDATE public.cycle_artifacts
     SET deleted_at = now_ts
   WHERE delivery_cycle_id IN (SELECT delivery_cycle_id FROM _wipe_targets)
     AND deleted_at IS NULL;
  GET DIAGNOSTICS rows_artifacts = ROW_COUNT;

  --    jira_links — sync metadata.
  UPDATE public.jira_links
     SET deleted_at = now_ts
   WHERE delivery_cycle_id IN (SELECT delivery_cycle_id FROM _wipe_targets)
     AND deleted_at IS NULL;
  GET DIAGNOSTICS rows_jira = ROW_COUNT;

  -- 2. Soft-delete the Initiatives themselves. Done last so any FK-side
  --    check we add later sees a clean child state first.
  UPDATE public.delivery_cycles
     SET deleted_at = now_ts
   WHERE delivery_cycle_id IN (SELECT delivery_cycle_id FROM _wipe_targets);

  -- 3. Append one 'cycle_deleted' audit row per wiped Initiative
  --    (D-125 cycle_event_log is append-only — no soft delete).
  INSERT INTO public.cycle_event_log
    (delivery_cycle_id, event_type, event_description, actor_user_id, event_metadata)
  SELECT
    delivery_cycle_id,
    'cycle_deleted',
    'Initiative soft-deleted via bulk wipe — clearing pre-production test data.',
    acting_user_id,
    jsonb_build_object(
      'deleted_at',      now_ts,
      'bulk_wipe',       true,
      'wiped_by_email',  'pdodds@triarqhealth.com',
      'script',          'wipe_initiatives_2026-06-08.sql'
    )
  FROM _wipe_targets;

  RAISE NOTICE
    'Wipe complete. cycles=% milestones=% gates=% artifacts=% jira=% audit_rows=%',
    cycle_count, rows_milestones, rows_gates, rows_artifacts, rows_jira, cycle_count;
END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- VERIFY — run after the WIPE BLOCK
-- ─────────────────────────────────────────────────────────────────────────

-- Expect: zero rows.
SELECT delivery_cycle_id, cycle_title, current_lifecycle_stage
  FROM public.delivery_cycles
 WHERE deleted_at IS NULL;

-- Expect: a row per Initiative that was deleted today.
SELECT delivery_cycle_id, event_description, created_at
  FROM public.cycle_event_log
 WHERE event_type = 'cycle_deleted'
   AND created_at::date = current_date
 ORDER BY created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────
-- RECOVERY — un-wipe everything done by this script
-- ─────────────────────────────────────────────────────────────────────────
-- Only runs against rows whose deleted_at matches the bulk-wipe timestamp.
-- Find that timestamp in the cycle_event_log first:
--
--   SELECT (event_metadata->>'deleted_at')::timestamptz AS bulk_ts
--     FROM public.cycle_event_log
--    WHERE event_type = 'cycle_deleted'
--      AND event_metadata->>'bulk_wipe' = 'true'
--    ORDER BY created_at DESC
--    LIMIT 1;
--
-- Then substitute that timestamp into the UPDATEs below.

/*
DO $$
DECLARE
  bulk_ts timestamptz := 'PASTE_BULK_WIPE_TIMESTAMP_HERE';
BEGIN
  UPDATE public.cycle_milestone_dates SET deleted_at = NULL WHERE deleted_at = bulk_ts;
  UPDATE public.gate_records          SET deleted_at = NULL WHERE deleted_at = bulk_ts;
  UPDATE public.cycle_artifacts       SET deleted_at = NULL WHERE deleted_at = bulk_ts;
  UPDATE public.jira_links            SET deleted_at = NULL WHERE deleted_at = bulk_ts;
  UPDATE public.delivery_cycles       SET deleted_at = NULL WHERE deleted_at = bulk_ts;
  -- cycle_event_log 'cycle_deleted' rows stay — they record what happened.
END $$;
*/
