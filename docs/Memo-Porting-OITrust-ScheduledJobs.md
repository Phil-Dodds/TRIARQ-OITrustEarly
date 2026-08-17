# Porting Memo — OI Trust Scheduled Jobs

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-17

Audience: TRIARQ engineers taking over the infrastructure layer at port.

## Summary

There are **three** scheduled jobs, not two. All three are **pg_cron** entries inside
the Supabase Postgres instance. There is no `render.yaml`, no GitHub Actions
schedule, and no `node-cron`/`setInterval` scheduler anywhere in `mcp/*/src`.

| Job name | Schedule (UTC) | Mechanism | Target |
|---|---|---|---|
| `refresh-initiative-status` | `*/30 * * * *` | in-database SQL | `public.refresh_initiative_status_overdue()` |
| `send-meeting-reminders` | `*/30 * * * *` | pg_cron → pg_net HTTP POST | `team-meetings-mcp` `/internal/send_meeting_reminders` |
| `run-daily-digest` | `0 10 * * *` | pg_cron → pg_net HTTP POST | `delivery-cycle-mcp` `/internal/run_daily_digest` |

Two extensions must be enabled per Supabase project: `pg_cron` and `pg_net`
(Database → Extensions). pg_cron schedules are evaluated in **UTC**.

---

## Job 1 — `refresh-initiative-status`

**Purpose.** Recalculates initiative status-update due dates and the
`status_overdue` flag from each division's status cadence config.

**Defined:** `db/migrations/054_refresh_initiative_status_overdue_fn.sql:194-215` —
**commented out in the repo.** The live job exists only because it was pasted into
the Supabase SQL editor. Treat this as a gap to close at port: commit the
registration.

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-initiative-status') THEN
    PERFORM cron.unschedule('refresh-initiative-status');
  END IF;
  PERFORM cron.schedule(
    'refresh-initiative-status',
    '*/30 * * * *',
    'SELECT public.refresh_initiative_status_overdue();'
  );
END $$;
```

**Invokes:** `public.refresh_initiative_status_overdue()` — body at migration 054
lines 97–183. Two helpers in the same migration:
`public.nth_weekday_of_month(date,int,text)` (IMMUTABLE, lines 33–62) and
`public.resolve_division_status_config(uuid)` (lines 72–90, walks
`parent_division_id` upward per D-481).

**Core loop:**

```sql
v_cfg := public.resolve_division_status_config(r_init.division_id);
IF v_cfg.id IS NULL THEN CONTINUE; END IF;   -- D-481: no cadence in chain -> exempt
IF v_cfg.cadence = 'weekly' THEN
  v_next_meeting := v_today + ((v_cfg.day_of_week - EXTRACT(DOW FROM v_today)::int + 7) % 7);
ELSIF v_cfg.cadence = 'triweekly' THEN
  -- 21-day stepping from aligned anchor_date
ELSE
  -- monthly: nth_weekday_of_month, roll to next month if past
END IF;
v_due_at := (v_next_meeting - 1)::timestamptz;
IF r_init.latest_status_update_id IS NULL THEN
  v_overdue := true;
ELSE
  v_overdue := NOT (v_latest_saved_at >= (v_next_meeting - 2)::timestamptz);
END IF;
UPDATE public.delivery_cycles
   SET status_overdue = v_overdue,
       status_due_at = v_due_at,
       status_last_calculated_at = now()
 WHERE delivery_cycle_id = r_init.delivery_cycle_id;
```

- **Reads:** `delivery_cycles` (where `deleted_at IS NULL AND current_lifecycle_stage NOT IN ('COMPLETE','CANCELLED')`), `divisions`, `division_status_config`, `initiative_status_updates.saved_at`.
- **Writes:** `delivery_cycles.status_overdue`, `.status_due_at`, `.status_last_calculated_at` (PK is `delivery_cycle_id`, not `id`); `system_config.status_refresh_last_run = now()`.
- **Auth:** none — runs in-database as the pg_cron job owner. Not user-scoped, does not interact with RLS.
- **Idempotency:** fully idempotent. Reads and overwrites four columns plus one timestamp; no inserts, deletes, or external calls. Safe to run any number of times.
- **Error handling:** none. No log table; failures surface only in `cron.job_run_details`. Returns `integer` = rows processed.
- **Env vars:** none.
- **On-demand equivalent:** MCP tool `trigger_status_refresh` (`mcp/delivery-cycle-mcp/src/tools/trigger_status_refresh.js:14`) calls `supabase.rpc('refresh_initiative_status_overdue')` under a normal user JWT. The schedule is a convenience, not a hard dependency.
- **Prior memo:** `docs/Memo-Porting-OITrust-StatusRefreshCron.md` covers three porting options and advises against a cadence below a few minutes. Note that memo predates jobs 2 and 3 and states this is the only scheduled job — that is now stale.

---

## Job 2 — `send-meeting-reminders`

**Purpose.** Emails meeting presenters ahead of their scheduled track meeting.

**Defined:** `db/migrations/078_meeting_reminders.sql:60-71` (live, inside
`BEGIN/COMMIT`; commit `3b7f184`). Same migration creates
`public.team_meeting_reminder_log` (RLS enabled, zero policies per Rule 38) and
adds `team_meeting_tracks.meeting_time`, `.reminder_lead_minutes`, `.reminder_note`.

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
SELECT cron.schedule(
  'send-meeting-reminders',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := '<TEAM_MEETINGS_MCP_URL>/internal/send_meeting_reminders',
    headers := jsonb_build_object('x-internal-key', '<TEAM_MEETINGS_INTERNAL_CRON_KEY>',
                                  'Content-Type',  'application/json'),
    body    := '{}'::jsonb
  );
  $$
);
```

Both placeholders are substituted at execution time and never committed (Arch-4).
The real Render URL and the secret exist only in the live `cron.job.command` string
and in Render's env. This registration has **no `cron.unschedule` guard** — unlike
jobs 1 and 3, re-running the migration duplicates the entry.

**Endpoint:** `mcp/team-meetings-mcp/src/index.js:95-115`, mounted **before**
`app.use(validateJwt)` (line 117) — a deliberate Arch-5 carve-out.

```js
app.post('/internal/send_meeting_reminders', async (req, res) => {
  const key = req.get('x-internal-key');
  if (!process.env.TEAM_MEETINGS_INTERNAL_CRON_KEY || key !== process.env.TEAM_MEETINGS_INTERNAL_CRON_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid internal key.' });
  }
  // ... await send_meeting_reminders();
  // console.log(JSON.stringify({ tool_name, user_id: 'internal-cron', duration_ms, ...summary }));
```

Two things to tighten at port: the comparison is a plain `!==` (not timing-safe —
job 3 does this correctly), and an unset env var returns 401 rather than 404, so
the route is never truly disabled.

**Handler:** `mcp/team-meetings-mcp/src/tools/send_meeting_reminders.js:164-311`,
`send_meeting_reminders(now = new Date())`. Never throws; returns
`{ tracks_in_window, skipped_off_schedule, reminders_sent, skipped_presence, skipped_already_sent, errors[] }`.

**Logic:**
1. Window check in `America/New_York` wall clock via `Intl.DateTimeFormat`. `occurrenceInWindow` checks both today and tomorrow so lead times over a day work.
2. Schedule gate `isScheduledOccurrence` — the target date must equal `suggestNextMeetingDate(cadence, lastMeetingDate)` from `../cadence`, or a real meeting instance must exist.
3. Presenters = distinct `presenter_user_id` across template sections.
4. Skip any presenter with a presence row (already in the meeting).
5. One-and-done via the log's unique key.

- **Reads:** `team_meeting_tracks` (`meeting_time IS NOT NULL`, `reminder_lead_minutes IS NOT NULL`, `deleted_at IS NULL`, `purged_at IS NULL`), `team_meetings`, `team_meeting_track_sections`, `team_meeting_reminder_log`, `team_meeting_presence`, `users`.
- **Writes:** one `team_meeting_reminder_log` insert per recipient (`track_id, meeting_id, meeting_date, user_id, delivery_error`).
- **Email:** `supabase.functions.invoke('send-notification-email', { to, subject, html_body, initiative_id: null })` — a Supabase **Edge Function** that lives outside this repo.
- **Auth:** `x-internal-key` = `TEAM_MEETINGS_INTERNAL_CRON_KEY` (Render env). Supabase access inside the handler uses the service key via `../db`.
- **Idempotency:** `UNIQUE (track_id, meeting_date, user_id)` on the log, and the row is inserted **whether or not delivery succeeded** — a flaky mail relay never re-nags the user. A second run in the same window sends nothing.
- **Error handling:** per-send try/catch writes `delivery_error`; one structured `console.log` line per send including recipient address and the Edge Function's raw response. Route-level catch returns `{ success: false, error: 'Reminder sweep failed.' }` with HTTP 200.
- **Env vars:** `TEAM_MEETINGS_INTERNAL_CRON_KEY`, `APP_BASE_URL` (defaults to `https://phil-dodds.github.io/TRIARQ-OITrustEarly` — must be repointed at port), plus `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`.

---

## Job 3 — `run-daily-digest`

**Purpose.** Assembles and sends each user's single daily notification digest, and
writes that morning's commitment-check findings first so they ride the same email.

**Defined:** `db/migrations/100_daily_digest_schedule.sql:47-58`, commit `430013b`.
Registration is idempotent (`cron.unschedule` guard at lines 40–45).

```sql
SELECT cron.schedule(
  'run-daily-digest',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url     := '<DELIVERY_CYCLE_MCP_URL>/internal/run_daily_digest',
    headers := jsonb_build_object('x-internal-key', '<DELIVERY_DIGEST_INTERNAL_CRON_KEY>',
                                  'Content-Type',  'application/json'),
    body    := '{}'::jsonb
  );
  $$
);
```

**Known DST defect, deliberately accepted.** `0 10 * * *` UTC is 06:00 ET only
during EDT; through EST winter the digest arrives at 05:00 ET. D-643 names 06:00 ET
as a system constant, which a fixed UTC hour cannot honour. Flagged in the
migration header and in the Contract 45 CodeClose §4. **This is the first thing to
fix at port** — a scheduler with timezone support, or two seasonal entries.

**Endpoint:** `mcp/delivery-cycle-mcp/src/index.js:329-348`, guarded by
`requireInternalKey`, mounted before `validateJwt`. Middleware at
`mcp/delivery-cycle-mcp/src/middleware/internal-key.js:51-73`: unset env var → **404**
(route disabled, never open), mismatch → 401 `'Unauthorized.'`, comparison via
`crypto.timingSafeEqual` with a length pre-check. Use this as the reference
implementation when hardening job 2.

**Handler:** `mcp/delivery-cycle-mcp/src/tools/run_daily_digest.js:245-389`,
`run_daily_digest(params)`. Accepts `{ dry_run: true }` — assembles and reports but
sends and stamps nothing. The migration header documents the equivalent curl.

**Flow:**
- (a) `writeCommitmentChecks(startedAt, dryRun)` (lines 127–236, D-649) runs **before** the queue claim so today's findings appear in today's digest. Wholly non-fatal, wrapped in try/catch.
- (b) Claim every `notification_queue` row where `delivery_class = 'digest' AND sent_at IS NULL AND suppressed_at IS NULL`, ordered by `created_at`.
- (c) `resolveSuppressions` (lines 73–111) re-checks the two state event types `['initiative_blocked','initiative_at_risk']` against current cycle state and suppresses rows whose condition has resolved (cycle missing / CANCELLED / COMPLETE, or `status_overdue !== true` for at-risk). On lookup error it **sends rather than drops**.
- (d) Group by recipient, `buildDigest` from `../lib/digest`; skip users that are missing, have no email, or have `is_active === false`; skip empty digests (rows are stamped anyway so they do not accumulate).
- (e) Send via `sendGateNotificationEmail` (`./helpers/notification-email`) with `email_type: 'daily_digest'`.
- (f) Stamp the processed rows.

- **Reads:** `notification_queue`, `delivery_cycles`, `cycle_milestone_dates`, `gate_records`, `users`. Gate labels and next-gate resolution come from `../lib/gate-resolution` `resolveNextGate` (Rule 36 — gate labels never come from `milestone_label`). Commitment logic from `../lib/commitment-checks` (`findingsForCycle`, `trioRecipientIds`, `INACTIVE_STAGES`).
- **Writes:** `notification_queue.sent_at` / `.suppressed_at` (bulk `.in(notification_id, …)`); new digest-class rows via `enqueueNotifications` (`./helpers/notification-queue`) for `no_commitment` / `weak_commitment` / `stale_commitment`.
- **Idempotency:** rows are stamped as processed and the claim only reads unstamped rows, so a double fire in the same morning sends nothing twice. Commitment-check re-queue is throttled by `STATE_LINE_REPEAT_DAYS = 7`, enforced against the queue itself — there is no separate last-emitted table.
- **Error handling:** queue read failure → `{ success: false, error }` → HTTP 400. Unexpected throw → 500 with a generic message. Stamp failures are `console.error`-logged loudly and deliberately **not** fatal: unstamped rows resend tomorrow, on the principle that a repeat beats a silent loss. Structured logs at both handler level (`recipients / sent / suppressed / skipped_empty / commitment_checks_written / dry_run / duration_ms`) and route level (`caller: 'scheduler'`).
- **Env vars:** `DELIVERY_DIGEST_INTERNAL_CRON_KEY`, `APP_BASE_URL`, plus service-key Supabase config. Note this is deliberately **not** `RENDER_INTERNAL_API_KEY` — per-job keys mean rotating one does not rotate all.

---

## Configured outside the repo — port risks

1. **`pg_cron` and `pg_net` extensions** are enabled per Supabase project via the dashboard, not by migration.
2. **Job 1's registration is repo-commented only.** No committed migration creates it; it lives solely in the live `cron.job` table. Close this gap at port.
3. **The real MCP base URLs and both cron keys** exist only inside the live `cron.job.command` strings and Render env vars. Recover them with `SELECT jobid, jobname, schedule, command FROM cron.job;` before tearing down the pre-port project.
4. **`send-notification-email` Supabase Edge Function** — the mail relay both email jobs depend on. Not in this repo.
5. **Render does not auto-deploy on push.** A manual redeploy is required after any MCP change, so an endpoint can 404 even when the cron entry is live and correct.

## Verification queries

```sql
SELECT jobid, jobname, schedule, active FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;
SELECT status_refresh_last_run FROM public.system_config;  -- job 1: should advance every ~30 min
```
