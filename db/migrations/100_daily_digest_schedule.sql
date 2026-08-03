-- 100_daily_digest_schedule.sql
-- Pathways OI Trust — Contract 45 Unit D (D-643).
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Registers the 06:00 ET daily digest on pg_cron, POSTing to the
-- delivery-cycle-mcp internal endpoint via pg_net. Same shape as migration 078
-- (send-meeting-reminders), deliberately — one scheduled-job pattern, not two.
--
-- ── BEFORE RUNNING: substitute the two placeholders ──────────────────────────
--   <DELIVERY_CYCLE_MCP_URL>             e.g. https://delivery-cycle-mcp-xxxx.onrender.com
--   <DELIVERY_DIGEST_INTERNAL_CRON_KEY>  generated secret, ALSO set in Render env
--                                        on delivery-cycle-mcp
--
-- The key is per-job, matching TEAM_MEETINGS_INTERNAL_CRON_KEY and the naming
-- Phil set on 2026-07-20: one purpose, one key. The generic
-- RENDER_INTERNAL_API_KEY in Arch-4 is deliberately not used — one shared
-- secret across every job means rotating one rotates them all.
--
-- Until the env var is set on Render the endpoint returns 404, so running this
-- migration early is harmless: the cron fires and gets "not found".
--
-- ── Why 10:00 UTC ────────────────────────────────────────────────────────────
-- pg_cron schedules are UTC. 06:00 ET is 10:00 UTC during EDT (Mar–Nov) and
-- 11:00 UTC during EST. This registers 10:00 UTC, which means the digest
-- arrives at 05:00 ET through the winter.
--
-- That is a deliberate, reversible choice and it is FLAGGED: D-643 names 06:00
-- ET as a system constant, and a fixed UTC hour cannot honour that year-round.
-- The alternatives were two scheduled entries swapped at the DST boundary
-- (silently wrong whenever the swap is forgotten) or making the job itself
-- check the local hour and no-op (a job that usually does nothing is a job
-- whose failures are invisible). An hour early in winter is the smallest
-- honest error. Revisit if Design wants true 06:00 ET year-round.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent: drop any prior registration before re-adding.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'run-daily-digest') THEN
    PERFORM cron.unschedule('run-daily-digest');
  END IF;
END $$;

SELECT cron.schedule(
  'run-daily-digest',
  '0 10 * * *',                      -- 10:00 UTC = 06:00 ET (EDT) / 05:00 ET (EST)
  $$
  SELECT net.http_post(
    url     := '<DELIVERY_CYCLE_MCP_URL>/internal/run_daily_digest',
    headers := jsonb_build_object('x-internal-key', '<DELIVERY_DIGEST_INTERNAL_CRON_KEY>',
                                  'Content-Type',  'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

COMMIT;

-- ── Verification (read-only, safe post-apply) ────────────────────────────────
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'run-daily-digest';
--
-- Dry run against the endpoint without sending or stamping anything:
--   SELECT net.http_post(
--     url     := '<DELIVERY_CYCLE_MCP_URL>/internal/run_daily_digest',
--     headers := jsonb_build_object('x-internal-key', '<DELIVERY_DIGEST_INTERNAL_CRON_KEY>',
--                                   'Content-Type',  'application/json'),
--     body    := '{"dry_run": true}'::jsonb
--   );
--
-- Rollback of the cron entry if ever needed:
--   SELECT cron.unschedule('run-daily-digest');
