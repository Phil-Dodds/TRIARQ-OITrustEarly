# Runbook — OITrustEarly Freeze and Cutover to oi-trust.myqone.com

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-17
Target port date: 2026-08-19

## Decisions taken

- **Freeze posture: read-only.** Early stays visible and browsable through the window; every write fails. Maintenance mode stays **OFF** during the freeze so users can still consult their data.
- **Post-cutover: redirect page, database kept frozen.** The Supabase project stays alive and read-only as the rollback and reconciliation source. Nothing is deleted.

## Timetable — pre-armed, nothing required live

Every step below is scheduled ahead of time. No action is needed during the
window. All three clocks shown because the team spans US and India.

| UTC | ET | IST | Step | Fires via |
|---|---|---|---|---|
| Mon/Tue, any time | — | — | Arm the freeze: paste migration 101 into the Supabase SQL editor | **Phil, once, ahead of time** |
| Tue 18th, any time | — | — | Push the two workflows and the redirect page to master | Code |
| **Wed 03:00** | **Tue 23:00** | **Wed 08:30** | Freeze: unschedule 3 cron jobs, `service_role` read-only | pg_cron `port-freeze` |
| Wed 03:05 | Tue 23:05 | Wed 08:35 | Evict open tabs via `version.json` bump | Actions `port-evict-tabs` |
| Wed 03:05 → | Tue 23:05 → | Wed 08:35 → | Data migration to myqone | Port team |
| Wed 07:00, then hourly to 16:00 | Wed 03:00 → 12:00 | Wed 12:30 → 21:30 | Cutover redirect, once myqone passes its health check | Actions `port-cutover` |

**Two timezone facts worth checking against your intent.** 23:00 ET Tuesday is
**08:30 IST Wednesday** — shortly before the Mumbai working day, not before
people wake. And because the migration then runs through Mumbai's Wednesday
morning, the India team is read-only from 08:30 IST until cutover at ~12:30 IST
or later. If you want a wider margin, move the freeze earlier: 21:00 ET = 06:30
IST, or 20:00 ET = 05:30 IST. Changing it means editing the hour field in three
places — Section 3 of migration 101, and the `cron:` line in each workflow.

The cutover window opens 4 hours after the freeze, matching the under-4-hours
migration estimate, and retries every hour until the health check passes. If it
never passes, the redirect never ships and Early stays read-only — the failure
mode is "users see a frozen old system", never "users see a broken new one".

## What does and does not stop writes

Established by audit, 2026-08-17 — read this before relying on any lever:

| Lever | Stops writes? | Notes |
|---|---|---|
| `maintenance_mode = true` | **No** | Bootstrap-only gate. `resolveMaintenanceModeAtBootstrap()` is called once from the `APP_INITIALIZER` and cached; no guard, no interceptor, no poll. Open tabs are unaffected for the life of the tab. No MCP tool consults it. |
| `service_role` read-only | **No** | Rehearsed 2026-08-18, writes still succeeded. Role settings load at session login, but PostgREST logs in as `authenticator` and does `SET ROLE` per request; and PostgREST sets transaction access mode per HTTP method, overriding any default. **Abandoned as the freeze mechanism** — retained in migration 102 only as belt-and-braces for direct `psql` connections. |
| REVOKE write privileges | **Yes** | Enforced per statement, so it applies to already-open connections with no pool cycling and no Render redeploy. `SELECT` is not revoked, so reads keep working. This is the freeze. See `db/migrations/102_port_freeze_via_revoke.sql`. |
| Unscheduling pg_cron | **Yes, for the jobs** | Required separately: jobs run as the job owner, not `service_role`, so the role flag does not touch them. |
| Stopping Render services | Yes, but | Also kills reads. Rejected: incompatible with a read-only posture. |

The freeze is the database role flag plus the cron unschedule. Maintenance mode is not part of it.

## Pre-flight — T minus 1 day

1. **Rehearse the freeze.** Done 2026-08-18. The `ALTER ROLE` approach was rehearsed and **failed** — writes still succeeded, because PostgREST connects as `authenticator` and sets transaction mode per request. Replaced by the REVOKE in migration 102. Rehearse that instead, in a transaction you roll back:
   ```sql
   BEGIN;
   REVOKE INSERT, UPDATE, DELETE, TRUNCATE
       ON ALL TABLES IN SCHEMA public
     FROM service_role, anon, authenticated;
   -- attempt one save in the app: it must fail. Load a screen: it must render.
   ROLLBACK;
   ```
   The REVOKE holds locks until the `ROLLBACK`, so test one save and roll back promptly rather than exploring the UI with the transaction open.

2. **Capture the cron job definitions before touching them.** The live `command` strings hold the only copy of the MCP base URLs and both cron keys:
   ```sql
   SELECT jobid, jobname, schedule, active, command FROM cron.job;
   ```
   Save the output outside the database.

3. **Announce the freeze out of band** — email or Teams, not in-app. Under a read-only posture there is no clean in-app blocked message: failed writes surface as raw errors. Out-of-band comms is the mitigation, and it is the right one. State the window, that the system will be readable but not editable, and the new URL.

4. **Stage the redirect page** — `docs/port-redirect/index.html` in this repo. Do not push to gh-pages yet; the cutover workflow installs it.

5. **Arm the freeze.** Paste `db/migrations/101_port_freeze_schedule.sql` into the Supabase SQL editor — Sections 1–2 first, then Section 3 separately. Rule 48: the file must be committed to master first.

   Between the two, insert the opt-in sentinel. **On the Early database only** — this is what stops the same file freezing myqone production if the port team runs it:
   ```sql
   INSERT INTO public.port_freeze_sentinel (confirm) VALUES ('FREEZE-EARLY-2026-08-19');
   ```
   Section 3 then reports `port-freeze armed for 03:00 UTC 19 Aug 2026`. Without the sentinel it reports that it declined and schedules nothing. Confirm one row with `active = true` from the verification query.

6. **Push the automation** to master: both workflow files and the redirect page. Confirm Actions is enabled on `Phil-Dodds/TRIARQ-OITrustEarly` and that the two workflows appear in the Actions tab — a workflow that has never been seen by GitHub will not fire on schedule.

7. **Smoke-test both workflows now, while it is cheap.** Run each once via `workflow_dispatch` against a throwaway state, or at minimum run `port-evict-tabs` (its only effect is a `version.json` bump, which is harmless and reversible). A scheduled workflow that fails on a YAML or permissions error at 03:00 UTC fails silently as far as anyone present is concerned.
   ```bash
   gh workflow run port-evict-tabs.yml --ref master
   gh run list --workflow=port-evict-tabs.yml --limit 1
   ```

## Freeze — automatic, Wed 03:00 UTC

Executed by the pg_cron job `port-freeze`, armed by
`db/migrations/101_port_freeze_schedule.sql`, with the freeze mechanism itself
replaced by `db/migrations/102_port_freeze_via_revoke.sql`. The cron job calls
`public.execute_port_freeze()` by name, so 102 replacing the function body is
sufficient — no re-registration, Section 3 of 101 does not need re-running.

In order, unattended:

1. Captures all three cron job definitions to `port_freeze_log` — the `command`
   strings hold the only copy of the MCP URLs and both cron keys, so this
   happens before anything is unscheduled.
2. Unschedules `refresh-initiative-status`, `send-meeting-reminders`, and
   `run-daily-digest` by name. These write with no user present, and run as the
   job owner rather than `service_role`, so step 3 would not stop them.
3. Records every `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` privilege held by
   `service_role`, `anon`, and `authenticated` on `public` into
   `port_freeze_grants` — the sole basis for rollback.
4. **Revokes those privileges.** Enforced per statement, so it closes open tabs,
   every MCP tool, and the Edge Function mail relay immediately, with no pool
   cycling and no Render redeploy. `SELECT` is untouched, so reads keep working.
5. Revokes `EXECUTE` on `refresh_initiative_status_overdue()` — a
   `SECURITY DEFINER` function owned by `postgres` runs with the owner's
   privileges and would otherwise still write, and the app can reach it through
   the `trigger_status_refresh` tool.
6. Sets `service_role` read-only as belt-and-braces for direct `psql` sessions.
   Not load-bearing: PostgREST overrides it per request.
7. Unschedules itself, last, so a failure leaves it armed for inspection.

Failures are recorded in `port_freeze_log` and re-raised, because pg_cron
otherwise buries them in `cron.job_run_details` where nobody is reading at
03:00 UTC.

**Morning-after verification** — run these when you next sit down, not live:

```sql
SELECT step, succeeded, error_text, created_at
  FROM public.port_freeze_log ORDER BY created_at;   -- expect 4 rows, all true
SELECT jobid, jobname, active FROM cron.job;          -- expect zero rows
SELECT max(updated_at) FROM public.delivery_cycles;   -- stable across 5 min
SELECT status_refresh_last_run FROM public.system_config;  -- stopped advancing
```

Then attempt one known write in the app: it must fail, and reads must still
render.

## Cutover — automatic, from Wed 07:00 UTC hourly

Executed by `.github/workflows/port-cutover.yml`. Purges the built application
from `gh-pages`, installs `docs/port-redirect/index.html` as both `index.html`
and `404.html` (deep links into old Angular routes resolve through the latter),
recreates `.nojekyll`, bumps `version.json`, and writes `PORT_DONE`.

Three guards, all machine-checkable:

| Guard | Effect |
|---|---|
| `PORT_HOLD` on master | Aborts. The kill switch. |
| myqone health check | Aborts and retries next hour unless the site answers 200–399. |
| `PORT_DONE` on gh-pages | Aborts. Makes the hourly retries idempotent. |

Any remaining open tab raises the update banner within 5 minutes of the push and
lands on the redirect when reloaded.

### Manual control from a Claude Code session

Fire the cutover immediately, without waiting for the schedule:

```bash
gh workflow run port-cutover.yml --ref master
```

Stop all scheduled cutover attempts:

```bash
touch PORT_HOLD && git add PORT_HOLD && git commit -m "Port: HOLD cutover" && git push origin master
```

Release the hold:

```bash
git rm PORT_HOLD && git commit -m "Port: release hold" && git push origin master
```

Ship the redirect even though myqone is failing its health check — deliberately
awkward, since it points every user at a system known to be down:

```bash
gh workflow run port-cutover.yml --ref master -f skip_health_check=true
```

### After cutover

Leave the database read-only. Do **not** re-schedule the cron jobs on Early —
the three equivalents must be stood up on the myqone side instead. See
`Memo-Porting-OITrust-ScheduledJobs.md`, and note that `run-daily-digest`'s
fixed-UTC schedule carries a live DST defect that should be fixed there rather
than reproduced.

## Rollback

Reversible up to the moment users start writing on myqone:

```sql
ALTER ROLE service_role SET default_transaction_read_only = off;
-- re-register the three cron jobs from the captured command strings
```
Then restore the previous `index.html` and `version.json` on gh-pages. After myqone has taken live writes, rollback is no longer a flag flip — it becomes a reverse migration, so the go/no-go on step 1 of Cutover is the last cheap decision point.

## Known gaps, accepted

1. **No clean in-app blocked message during the freeze.** Read-only surfaces raw errors, not a Decision-140 message. Mitigated by out-of-band comms plus the version-banner eviction. Closing it properly would need a maintenance check in both MCP services and a Render redeploy of each — deliberately not attempted this close to the date.
2. **The news banner cannot carry an operational notice.** Its text is synthesized in `news_ticker.js` from activity templates, there is no content table, and dismissal persists indefinitely in `localStorage` under `oi.newsBanner.hidden`. Not a usable channel.
3. **A user who dismissed the news banner and never navigates** will still be reached by the version-check poll, which is interval-based and independent of the banner.

4. **GitHub Actions scheduled runs drift.** Commonly 5–15 minutes late, occasionally far worse, and on rare occasions a scheduled run is dropped entirely. Tolerable by design here: late eviction only prolongs a read-only tab, and the cutover retries hourly. But the freeze itself deliberately does **not** depend on Actions — it runs inside Postgres, where the timing is reliable.

5. **The `port-freeze` cron expression fires annually.** `'0 3 19 8 *'` means 19 August every year. It self-retires on success, so this only matters if the port slips past the date with the job still armed — disarm with `SELECT cron.unschedule('port-freeze');` rather than leaving it for next August.

6. **`ALTER ROLE` inside pg_cron is unrehearsed until you test it.** The job runs as the scheduling role, which in Supabase has the rights, but this is the single point of failure in the freeze. The T−1 rehearsal in Pre-flight step 1 is what de-risks it. If it cannot work, fall back to revoking write grants on `public` from `service_role` inside `execute_port_freeze()`.
