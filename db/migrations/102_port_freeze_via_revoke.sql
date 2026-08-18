-- 102_port_freeze_via_revoke.sql
--
-- Replaces the freeze mechanism in migration 101.
--
-- WHY: 101 used `ALTER ROLE service_role SET default_transaction_read_only = on`.
-- Rehearsed against the live database on 2026-08-18, writes still succeeded.
-- Two reasons, either of which is sufficient:
--   1. Role-level settings load at session LOGIN. PostgREST logs in as
--      `authenticator` and issues `SET ROLE service_role` per request, so a
--      default attached to service_role is never loaded.
--   2. PostgREST sets each request's transaction access mode explicitly from the
--      HTTP method, which overrides any default_transaction_read_only anywhere.
--
-- Transaction mode is advisory here. Privileges are not: a REVOKE is enforced
-- per statement, needs no session restart, no connection-pool cycling, and no
-- Render redeploy. That is what this migration switches to.
--
-- The cron job registered by 101 calls public.execute_port_freeze() by name, so
-- replacing the function body is sufficient. If 'port-freeze' is already armed
-- it picks this up with no re-registration. Section 3 of 101 does not need
-- re-running.
--
-- Rule 48: committed to master before execution.
-- Rule 34: column names verified against types/database.ts and migration 095.
--
-- Runbook: docs/Runbook-Port-Freeze-And-Cutover.md

BEGIN;

-- ---------------------------------------------------------------------------
-- Section 1 — grant capture table
-- ---------------------------------------------------------------------------
-- Rollback depends entirely on this. A blanket
-- `GRANT ALL ON ALL TABLES ... TO service_role` would restore access but would
-- also over-grant relative to what was there before, so record the exact set.

CREATE TABLE IF NOT EXISTS public.port_freeze_grants (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  grantee        text        NOT NULL,
  table_schema   text        NOT NULL,
  table_name     text        NOT NULL,
  privilege_type text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grantee, table_schema, table_name, privilege_type)
);

ALTER TABLE public.port_freeze_grants ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.port_freeze_grants IS
  'Write privileges as they existed immediately before the port freeze. Sole basis for rollback.';

-- ---------------------------------------------------------------------------
-- Section 2 — the freeze, by REVOKE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.execute_port_freeze()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $fn$
DECLARE
  v_jobs   jsonb;
  v_count  integer;
BEGIN
  -- Sentinel guard, checked here as well as at registration. If this function
  -- ever reaches a database that is not Early — copied in a port delta,
  -- restored from a dump — it records the refusal and touches nothing.
  IF NOT EXISTS (
    SELECT 1 FROM public.port_freeze_sentinel
     WHERE confirm = 'FREEZE-EARLY-2026-08-19'
  ) THEN
    INSERT INTO public.port_freeze_log (step, succeeded, error_text)
    VALUES ('refused_no_sentinel', false,
            'Sentinel absent — this is not the Early database. No action taken.');
    RETURN;
  END IF;

  -- Step 1 — capture cron definitions BEFORE unscheduling. The command strings
  -- hold the only copy of the MCP base URLs and both internal cron keys, which
  -- are never committed (Arch-4).
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'jobid', jobid, 'jobname', jobname, 'schedule', schedule,
           'active', active, 'command', command
         )), '[]'::jsonb)
    INTO v_jobs
    FROM cron.job;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('captured_cron_jobs', v_jobs);

  -- Step 2 — silence the three writers. Named explicitly, never "unschedule
  -- everything": this job must survive to finish its own work. They run as the
  -- job owner, so no privilege change would stop them.
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

  -- Step 3 — record every write privilege about to be removed.
  INSERT INTO public.port_freeze_grants
        (grantee, table_schema, table_name, privilege_type)
  SELECT grantee, table_schema, table_name, privilege_type
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND grantee IN ('service_role', 'anon', 'authenticated')
     AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  ON CONFLICT (grantee, table_schema, table_name, privilege_type) DO NOTHING;

  SELECT count(*) INTO v_count FROM public.port_freeze_grants;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('captured_grants', jsonb_build_object('privileges_recorded', v_count));

  -- Step 4 — THE FREEZE. Enforced per statement, so it applies to connections
  -- that are already open. Reads are untouched: SELECT is not revoked.
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE
      ON ALL TABLES IN SCHEMA public
    FROM service_role, anon, authenticated;

  -- Default privileges too, so a table created later does not arrive writable.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES
    FROM service_role, anon, authenticated;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('revoked_write_privileges',
          jsonb_build_object('roles', ARRAY['service_role','anon','authenticated'],
                             'schema', 'public'));

  -- Step 5 — close the SECURITY DEFINER back door. Functions owned by postgres
  -- execute with the owner's privileges, so they can still write after the
  -- REVOKE. refresh_initiative_status_overdue is the one the application can
  -- reach directly, via the trigger_status_refresh MCP tool.
  REVOKE EXECUTE ON FUNCTION public.refresh_initiative_status_overdue()
    FROM service_role, anon, authenticated;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('revoked_definer_rpc',
          jsonb_build_object('function', 'refresh_initiative_status_overdue'));

  -- Step 6 — belt and braces. Overridden by PostgREST per request, so it is not
  -- load-bearing; it catches anything connecting as service_role directly,
  -- e.g. a psql session or a script using the connection string.
  EXECUTE 'ALTER ROLE service_role SET default_transaction_read_only = on';

  -- Step 7 — retire this job. Last, so a failure above leaves it armed for
  -- inspection rather than silently consumed.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'port-freeze') THEN
    PERFORM cron.unschedule('port-freeze');
  END IF;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('freeze_complete', jsonb_build_object('completed_at', now()));

EXCEPTION WHEN OTHERS THEN
  -- pg_cron buries errors in cron.job_run_details, which nobody reads at
  -- 03:00 UTC. Record durably, then re-raise so the run is marked failed.
  INSERT INTO public.port_freeze_log (step, succeeded, error_text)
  VALUES ('freeze_failed', false, SQLERRM);
  RAISE;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- Section 3 — rollback
-- ---------------------------------------------------------------------------
-- Restores exactly the privileges captured at freeze time, nothing more.

CREATE OR REPLACE FUNCTION public.restore_port_freeze_grants()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r       record;
  v_count integer := 0;
BEGIN
  FOR r IN
    SELECT grantee, table_schema, table_name, privilege_type
      FROM public.port_freeze_grants
  LOOP
    EXECUTE format('GRANT %s ON %I.%I TO %I',
                   r.privilege_type, r.table_schema, r.table_name, r.grantee);
    v_count := v_count + 1;
  END LOOP;

  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT INSERT, UPDATE, DELETE, TRUNCATE ON TABLES
    TO service_role, anon, authenticated;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.refresh_initiative_status_overdue() TO service_role, anon, authenticated';
  EXECUTE 'ALTER ROLE service_role RESET default_transaction_read_only';

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('grants_restored', jsonb_build_object('privileges_restored', v_count));

  RETURN v_count;
END;
$fn$;

COMMENT ON FUNCTION public.restore_port_freeze_grants() IS
  'Undoes the port freeze by regranting exactly what port_freeze_grants recorded.';

COMMIT;

-- ---------------------------------------------------------------------------
-- Section 4 — REHEARSAL (run this today, then roll it back)
-- ---------------------------------------------------------------------------
-- Unlike the ALTER ROLE approach, this can be rehearsed honestly: the freeze
-- and the restore are the same code paths the cron job will run tonight.
--
-- 1. Freeze now:
--      SELECT public.execute_port_freeze();
--    This DOES unschedule the three cron jobs and retire 'port-freeze'.
--
-- 2. In the app: attempt a save -> must fail. Load a screen -> must render.
--
-- 3. Restore:
--      SELECT public.restore_port_freeze_grants();
--    Then re-arm by re-running Section 3 of migration 101, and re-register the
--    three cron jobs from the captured command strings:
--      SELECT detail FROM public.port_freeze_log WHERE step = 'captured_cron_jobs';
--
-- Because a full rehearsal costs a cron re-registration, the cheaper check is
-- to rehearse the REVOKE alone, in a transaction that is rolled back:
--
--      BEGIN;
--      REVOKE INSERT, UPDATE, DELETE, TRUNCATE
--          ON ALL TABLES IN SCHEMA public
--        FROM service_role, anon, authenticated;
--      -- now attempt a save in the app: it must fail
--      ROLLBACK;
--
--    NOTE: the REVOKE holds locks until the ROLLBACK, so do this in a window
--    where a few seconds of contention is acceptable, and do not leave the
--    transaction open while you go and test the UI at length. Test one save,
--    then roll back.

-- ---------------------------------------------------------------------------
-- Section 5 — verification after the freeze fires
-- ---------------------------------------------------------------------------
--   SELECT step, succeeded, error_text, created_at
--     FROM public.port_freeze_log ORDER BY created_at;   -- expect 7 rows, all true
--   SELECT jobid, jobname, active FROM cron.job;          -- expect zero rows
--   SELECT count(*) FROM public.port_freeze_grants;       -- expect > 0
--   SELECT count(*) FROM information_schema.role_table_grants
--    WHERE table_schema='public' AND grantee IN ('service_role','anon','authenticated')
--      AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE');   -- expect 0
