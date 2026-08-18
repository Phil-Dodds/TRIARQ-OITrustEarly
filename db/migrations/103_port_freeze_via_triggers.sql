-- 103_port_freeze_via_triggers.sql
--
-- Third and final freeze mechanism. Supersedes 101 (ALTER ROLE) and the REVOKE
-- in 102. Both earlier attempts are retained in 102 as secondary layers.
--
-- WHY, in order of what was learned:
--   101 — `ALTER ROLE service_role SET default_transaction_read_only = on`.
--         Rehearsed 2026-08-18: the setting was present in pg_roles.rolconfig
--         and writes still succeeded. Role settings load at session LOGIN;
--         PostgREST logs in as `authenticator` and issues SET ROLE per request.
--         PostgREST also sets each request's transaction access mode from the
--         HTTP method, overriding any default. Transaction mode is advisory here.
--   102 — REVOKE of write privileges. Rehearsed inside an uncommitted
--         transaction, which no other session can observe, so the rehearsal
--         proved nothing either way. REVOKE may well work; it is kept as a
--         secondary layer. But it depends on assumptions about grant
--         inheritance and on no SECURITY DEFINER path existing.
--   103 — a BEFORE trigger that raises. Fires irrespective of privileges,
--         transaction access mode, connecting role, grant inheritance, or
--         function ownership. Nothing in the request path can talk it out of
--         firing, and one table can be tested in isolation before the rest.
--
-- Reads are untouched: no trigger fires on SELECT.
--
-- The cron job registered by 101 calls public.execute_port_freeze() by name, so
-- replacing the body here is sufficient. Section 3 of 101 does not need
-- re-running.
--
-- Rule 48: committed to master before execution.
--
-- Runbook: docs/Runbook-Port-Freeze-And-Cutover.md

BEGIN;

-- ---------------------------------------------------------------------------
-- Section 1 — the block itself
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.port_freeze_block()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- Surfaces through PostgREST as a 4xx with this message, so anyone who does
  -- attempt a save during the window sees the reason rather than a bare 500.
  RAISE EXCEPTION
    'OI Trust is frozen for migration to oi-trust.myqone.com. Data is readable but cannot be changed.'
    USING ERRCODE = 'read_only_sql_transaction';
END;
$fn$;

COMMENT ON FUNCTION public.port_freeze_block() IS
  'Raises on any write. Attached to every public table during the port freeze.';

-- ---------------------------------------------------------------------------
-- Section 2 — apply and remove
-- ---------------------------------------------------------------------------
-- Statement-level triggers: one fire per statement rather than per row, and
-- they still fire for statements that match zero rows.
--
-- The port_freeze_* tables are deliberately excluded — the freeze function must
-- keep writing its own audit trail after the triggers are in place.

CREATE OR REPLACE FUNCTION public.apply_port_freeze_triggers()
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
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relname NOT LIKE 'port_freeze_%'
     ORDER BY c.relname
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS zzz_port_freeze ON public.%I', r.relname);
    EXECUTE format(
      'CREATE TRIGGER zzz_port_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH STATEMENT EXECUTE FUNCTION public.port_freeze_block()', r.relname);

    -- TRUNCATE cannot share a trigger with INSERT/UPDATE/DELETE.
    EXECUTE format(
      'DROP TRIGGER IF EXISTS zzz_port_freeze_truncate ON public.%I', r.relname);
    EXECUTE format(
      'CREATE TRIGGER zzz_port_freeze_truncate BEFORE TRUNCATE ON public.%I
         FOR EACH STATEMENT EXECUTE FUNCTION public.port_freeze_block()', r.relname);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.drop_port_freeze_triggers()
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
    SELECT DISTINCT c.relname
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND t.tgname IN ('zzz_port_freeze', 'zzz_port_freeze_truncate')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zzz_port_freeze ON public.%I', r.relname);
    EXECUTE format('DROP TRIGGER IF EXISTS zzz_port_freeze_truncate ON public.%I', r.relname);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- Section 3 — the freeze, rebuilt around the triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.execute_port_freeze()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $fn$
DECLARE
  v_jobs   jsonb;
  v_tables integer;
  v_count  integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.port_freeze_sentinel
     WHERE confirm = 'FREEZE-EARLY-2026-08-19'
  ) THEN
    INSERT INTO public.port_freeze_log (step, succeeded, error_text)
    VALUES ('refused_no_sentinel', false,
            'Sentinel absent — this is not the Early database. No action taken.');
    RETURN;
  END IF;

  -- Step 1 — capture cron definitions before unscheduling. The command strings
  -- hold the only copy of the MCP base URLs and both cron keys (Arch-4).
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'jobid', jobid, 'jobname', jobname, 'schedule', schedule,
           'active', active, 'command', command
         )), '[]'::jsonb)
    INTO v_jobs
    FROM cron.job;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('captured_cron_jobs', v_jobs);

  -- Step 2 — silence the three writers. Named explicitly: this job must survive
  -- to finish. They run as the job owner, so no privilege change would stop them
  -- — though the triggers in step 4 now would.
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

  -- Step 3 — record write privileges, for the secondary REVOKE's rollback.
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

  -- Step 4 — THE FREEZE. Primary mechanism.
  SELECT public.apply_port_freeze_triggers() INTO v_tables;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('applied_freeze_triggers', jsonb_build_object('tables_frozen', v_tables));

  -- Step 5 — secondary layer. Independent of the triggers; if some path exists
  -- that a trigger somehow does not cover, this is the backstop.
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE
      ON ALL TABLES IN SCHEMA public
    FROM service_role, anon, authenticated;

  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES
    FROM service_role, anon, authenticated;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('revoked_write_privileges',
          jsonb_build_object('roles', ARRAY['service_role','anon','authenticated']));

  -- Step 6 — tertiary. Catches a direct psql session connecting as service_role.
  EXECUTE 'ALTER ROLE service_role SET default_transaction_read_only = on';

  -- Step 7 — retire this job, last.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'port-freeze') THEN
    PERFORM cron.unschedule('port-freeze');
  END IF;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('freeze_complete', jsonb_build_object('completed_at', now()));

EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.port_freeze_log (step, succeeded, error_text)
  VALUES ('freeze_failed', false, SQLERRM);
  RAISE;
END;
$fn$;

-- ---------------------------------------------------------------------------
-- Section 4 — unfreeze
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.execute_port_unfreeze()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_tables integer;
  v_grants integer;
BEGIN
  SELECT public.drop_port_freeze_triggers() INTO v_tables;
  SELECT public.restore_port_freeze_grants() INTO v_grants;

  INSERT INTO public.port_freeze_log (step, detail)
  VALUES ('unfrozen', jsonb_build_object('tables_unfrozen', v_tables,
                                         'privileges_restored', v_grants));
END;
$fn$;

COMMENT ON FUNCTION public.execute_port_unfreeze() IS
  'Full reversal of the port freeze: drops the triggers and restores captured grants.';

COMMIT;

-- ---------------------------------------------------------------------------
-- Section 5 — REHEARSAL. Conclusive, and blast radius of one table.
-- ---------------------------------------------------------------------------
-- The earlier rehearsals were inconclusive because the change was never
-- committed and so was invisible to the application's session. This one commits.
--
-- 1. Freeze ONE table:
--      CREATE TRIGGER zzz_port_freeze
--        BEFORE INSERT OR UPDATE OR DELETE ON public.delivery_cycles
--        FOR EACH STATEMENT EXECUTE FUNCTION public.port_freeze_block();
--
-- 2. In the app, edit an initiative and save. It MUST fail. Loading initiative
--    screens must still work — SELECT is unaffected.
--
-- 3. Unfreeze that table:
--      DROP TRIGGER zzz_port_freeze ON public.delivery_cycles;
--
-- 4. Confirm saving works again.
--
-- If step 2 saves successfully, stop and escalate — at that point the write is
-- not reaching public.delivery_cycles at all and the whole model of where writes
-- land is wrong.

-- ---------------------------------------------------------------------------
-- Section 6 — verification after the freeze fires
-- ---------------------------------------------------------------------------
--   SELECT step, succeeded, error_text, created_at
--     FROM public.port_freeze_log ORDER BY created_at;    -- expect 7 rows, all true
--   SELECT jobid, jobname, active FROM cron.job;           -- expect zero rows
--   SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
--     JOIN pg_namespace n ON n.oid = c.relnamespace
--    WHERE n.nspname='public' AND t.tgname LIKE 'zzz_port_freeze%';  -- expect 2x table count
--
-- FULL ROLLBACK, reversible until myqone takes its first live write:
--   SELECT public.execute_port_unfreeze();
--   -- then re-register the three cron jobs from the captured command strings:
--   SELECT detail FROM public.port_freeze_log WHERE step = 'captured_cron_jobs';
