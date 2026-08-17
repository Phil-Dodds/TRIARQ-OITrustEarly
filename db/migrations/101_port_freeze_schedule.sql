-- 101_port_freeze_schedule.sql
--
-- Pre-arms the OITrustEarly write freeze so it executes unattended.
--
-- Registers a one-shot pg_cron job, 'port-freeze', that fires at
-- 03:00 UTC on 19 August 2026 (23:00 ET Tue 18 Aug / 08:30 IST Wed 19 Aug) and:
--   1. unschedules the three recurring jobs that write without a user present,
--   2. puts service_role into read-only, closing every application write path,
--   3. records what it did in port_freeze_log,
--   4. unschedules itself.
--
-- After this runs the application stays READABLE and every write fails.
-- Maintenance mode is deliberately NOT touched (posture decision, 2026-08-17):
-- it is a bootstrap-only gate and would blank the app for everyone.
--
-- Rule 48: this file is committed to master before execution.
-- Rule 20: Code does not execute this. Phil pastes it into the Supabase SQL
-- editor once, ahead of the window. Nothing is required at 23:00 ET.
--
-- Runbook: docs/Runbook-Port-Freeze-And-Cutover.md
-- Rollback: see Section 4 at the bottom of this file.

BEGIN;

-- ---------------------------------------------------------------------------
-- Section 1 — audit table
-- ---------------------------------------------------------------------------
-- The freeze runs while nobody is watching. This is the only record that it
-- fired, what it captured, and whether it succeeded. Rule 38: RLS enabled,
-- zero policies — service role bypasses RLS, so nothing in-app is affected.

-- PORT SAFETY GUARD.
-- This migration freezes writes for an entire deployment. Run against the NEW
-- myqone production database it would put production into read-only and stop
-- its digests — an outage that looks like a working app silently rejecting
-- every save.
--
-- So nothing here arms itself. Both the registration (Section 3) and the freeze
-- function (Section 2) refuse to act unless this sentinel row is present, and
-- the row is inserted BY HAND, only on the Early database:
--
--   INSERT INTO public.port_freeze_sentinel (confirm) VALUES ('FREEZE-EARLY-2026-08-19');
--
-- Run this file against a fresh production database and it creates two tables
-- and a function, schedules nothing, and freezes nothing.

CREATE TABLE IF NOT EXISTS public.port_freeze_sentinel (
  confirm     text        PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.port_freeze_sentinel ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.port_freeze_sentinel IS
  'Deliberate opt-in for the port freeze. Empty on every database except OITrustEarly. Never seed this in a migration.';

CREATE TABLE IF NOT EXISTS public.port_freeze_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  step          text        NOT NULL,
  detail        jsonb,
  succeeded     boolean     NOT NULL DEFAULT true,
  error_text    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.port_freeze_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.port_freeze_log IS
  'Audit trail for the 2026-08-19 port freeze. Written by the port-freeze pg_cron job.';

-- ---------------------------------------------------------------------------
-- Section 2 — the freeze procedure
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.execute_port_freeze()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $fn$
DECLARE
  v_jobs jsonb;
BEGIN
  -- Guard, re-checked at fire time as well as at registration. If this function
  -- ever reaches a database that is not Early — copied in a port delta, restored
  -- from a dump — it records the refusal and exits without touching anything.
  IF NOT EXISTS (
    SELECT 1 FROM public.port_freeze_sentinel
     WHERE confirm = 'FREEZE-EARLY-2026-08-19'
  ) THEN
    INSERT INTO public.port_freeze_log (step, succeeded, error_text)
    VALUES ('refused_no_sentinel', false,
            'Sentinel absent — this is not the Early database. No action taken.');
    RETURN;
  END IF;

  -- Capture every job definition BEFORE unscheduling. The command strings hold
  -- the only copy of the MCP base URLs and both internal cron keys — they are
  -- never committed (Arch-4). Losing them costs the port team the reference and
  -- costs us the rollback.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'jobid',    jobid,
           'jobname',  jobname,
           'schedule', schedule,
           'active',   active,
           'command',  command
         )), '[]'::jsonb)
    INTO v_jobs
    FROM cron.job;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('captured_cron_jobs', v_jobs);

  -- Step 1 — silence the three writers. Named explicitly, never
  -- "unschedule everything": this job must survive to finish its own work.
  -- These run as the job owner, not service_role, so Step 2 would not stop them.
  PERFORM cron.unschedule(j)
     FROM unnest(ARRAY[
            'refresh-initiative-status',
            'send-meeting-reminders',
            'run-daily-digest'
          ]) AS j
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = j);

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('unscheduled_writers',
          (SELECT COALESCE(jsonb_agg(jobname), '[]'::jsonb) FROM cron.job));

  -- Step 2 — the actual freeze. Closes open browser tabs, every MCP tool, and
  -- the Edge Function mail relay in one statement. Reads are unaffected.
  EXECUTE 'ALTER ROLE service_role SET default_transaction_read_only = on';

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('service_role_read_only', jsonb_build_object('enabled', true));

  -- Step 3 — retire this job. Last, so a failure above leaves it armed for
  -- inspection rather than silently consumed.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'port-freeze') THEN
    PERFORM cron.unschedule('port-freeze');
  END IF;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('freeze_complete', jsonb_build_object('completed_at', now()));

EXCEPTION WHEN OTHERS THEN
  -- pg_cron swallows errors into cron.job_run_details, which nobody reads at
  -- 03:00 UTC. Record the failure durably, then re-raise so the run is marked
  -- failed rather than appearing to have succeeded.
  INSERT INTO public.port_freeze_log (step, succeeded, error_text)
  VALUES ('freeze_failed', false, SQLERRM);
  RAISE;
END;
$fn$;

COMMENT ON FUNCTION public.execute_port_freeze() IS
  'One-shot port freeze: unschedules recurring writers, sets service_role read-only, self-retires.';

COMMIT;

-- ---------------------------------------------------------------------------
-- Section 3 — registration (run separately, outside the transaction above)
-- ---------------------------------------------------------------------------
-- pg_cron schedules are UTC. '0 3 19 8 *' = 03:00 UTC on 19 August
--   = 23:00 ET Tue 18 Aug (EDT, UTC-4)
--   = 08:30 IST Wed 19 Aug
--
-- NOTE ON THE IST MARGIN: 08:30 IST is shortly BEFORE the Mumbai working day,
-- not before people wake. For a wider margin, move the hour earlier:
--   '0 1 19 8 *'  = 21:00 ET Tue = 06:30 IST Wed
--   '0 0 19 8 *'  = 20:00 ET Tue = 05:30 IST Wed
-- Change the hour field here and the two GitHub Actions cron lines to match.

-- Insert the sentinel FIRST, and only on Early. Without it the block below
-- schedules nothing and reports that it declined.
--
--   INSERT INTO public.port_freeze_sentinel (confirm) VALUES ('FREEZE-EARLY-2026-08-19');

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.port_freeze_sentinel
     WHERE confirm = 'FREEZE-EARLY-2026-08-19'
  ) THEN
    RAISE NOTICE 'port-freeze NOT scheduled: sentinel absent. This is correct on any database other than OITrustEarly.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'port-freeze') THEN
    PERFORM cron.unschedule('port-freeze');
  END IF;

  PERFORM cron.schedule(
    'port-freeze',
    '0 3 19 8 *',
    'SELECT public.execute_port_freeze();'
  );

  RAISE NOTICE 'port-freeze armed for 03:00 UTC 19 Aug 2026.';
END $$;

-- Verify it is armed. Expect one row, active = true.
SELECT jobid, jobname, schedule, active
  FROM cron.job
 WHERE jobname = 'port-freeze';

-- ---------------------------------------------------------------------------
-- Section 4 — verification and rollback
-- ---------------------------------------------------------------------------

-- After the freeze has fired, confirm all four:
--   SELECT step, succeeded, error_text, created_at
--     FROM public.port_freeze_log ORDER BY created_at;
--   SELECT jobid, jobname, active FROM cron.job;            -- expect zero rows
--   SELECT max(updated_at) FROM public.delivery_cycles;     -- stable across 5 min
--   SELECT status_refresh_last_run FROM public.system_config; -- stops advancing

-- ROLLBACK — reversible until myqone takes its first live write:
--   ALTER ROLE service_role SET default_transaction_read_only = off;
--   -- then re-register the three jobs from the captured command strings:
--   SELECT detail FROM public.port_freeze_log WHERE step = 'captured_cron_jobs';
--
-- Pooled connections may retain the previous setting until they cycle. If a
-- write still succeeds (or still fails) a minute after the flip, restart both
-- Render services to force new connections.

-- DISARM before the date, if the port slips:
--   SELECT cron.unschedule('port-freeze');
