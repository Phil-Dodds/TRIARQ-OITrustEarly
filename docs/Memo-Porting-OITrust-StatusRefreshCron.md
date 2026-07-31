# Porting Memo — Initiative Status Refresh Scheduled Job
Pathways OI Trust | 2026-06-30 | CONFIDENTIAL
Audience: TRIARQ engineers porting OI Trust off the pre-port infrastructure.
Governing decisions: D-480, D-481, D-482 (Contract 32).

---

## What it is

A Postgres scheduled job, registered via **pg_cron**:

```
jobname:  refresh-initiative-status
schedule: */30 * * * *        (every 30 minutes)
command:  SELECT public.refresh_initiative_status_overdue();
```

It is the **only scheduled background job in OI Trust** as of Contract 32. Everything
else in the system is request-driven through the MCP servers.

## Why we enabled it

Contract 32 (Initiative Status Updates) requires the system to know, without a user
present, whether each active Initiative is **overdue** for a recurring status update.
"Overdue" is a function of time and the Initiative's division cadence — it can become
true simply because a meeting date passed, with no user action to trigger a
recalculation. A scheduled job is the natural fit.

Each run, per active Initiative (`current_lifecycle_stage NOT IN
('COMPLETE','CANCELLED')`), the function:

1. Resolves the cadence by walking the division parent chain
   (`resolve_division_status_config`, D-481). No config anywhere in the chain → the
   Initiative is skipped (exempt from overdue flagging).
2. Computes the next meeting date from the recurrence rule (weekly / triweekly /
   monthly), sets `status_due_at = next_meeting − 1 day`.
3. Sets `status_overdue` from the valid window (a status saved within 2 days before
   the next meeting clears it).
4. Stamps `status_last_calculated_at`.

After the loop it stamps `system_config.status_refresh_last_run` (surfaced in the UI
as "Status last calculated").

## What it depends on

- Extension: **pg_cron** (enabled per-project).
- Functions (all `public` schema): `refresh_initiative_status_overdue()`,
  `resolve_division_status_config(uuid)`, `nth_weekday_of_month(date, int, text)` —
  migration `054`.
- Tables/columns: `division_status_config` (migration 049), `delivery_cycles`
  status columns (052), `system_config.status_refresh_last_run` (053).

## Properties that matter for porting

- **Idempotent and side-effect-light.** It only reads, then writes the four status
  columns + one timestamp. Safe to run more frequently, less frequently, or manually
  any number of times. No external calls, no row creation/deletion.
- **There is an on-demand path that does NOT depend on pg_cron.** The MCP tool
  `trigger_status_refresh` (delivery-cycle-mcp) calls the same function via RPC. The
  UI "Refresh Status" button uses it. This means the schedule is a convenience, not a
  hard dependency — the feature degrades to manual refresh if no scheduler exists.
- **Read-scoping is irrelevant here.** The job runs as the database owner over all
  active Initiatives; it is not user-scoped and does not touch RLS.

## Porting checklist

At port, the infrastructure layer changes but the Angular app, MCP contracts, and
schema do not. For this job, the porting team must re-establish the schedule on the
target Postgres / scheduler. Pick one:

1. **pg_cron on the managed Postgres** (simplest if available): enable the extension,
   run migration 054 Section 4 to register the job. Done.
2. **External scheduler → MCP** (preferred when pg_cron is unavailable, e.g. some
   managed Postgres tiers): a cloud scheduler (GCP Cloud Scheduler, cron, k8s
   CronJob) issues an authenticated POST to the `trigger_status_refresh` MCP tool
   every ~30 minutes. Requires a service identity/JWT for that call.
3. **Scheduler → RPC**: a scheduler calls `SELECT
   public.refresh_initiative_status_overdue();` directly against the database.

Whichever path: confirm with
`SELECT jobname, schedule FROM cron.job;` (path 1) or the scheduler's run history
(paths 2–3), and verify `system_config.status_refresh_last_run` advances each cycle.

**Do not** raise the cadence below a few minutes — there is no benefit; overdue state
changes at most once per day per Initiative. 30 minutes is chosen for timely UI
freshness, not correctness.

---

*Pathways OI Trust · Porting Memo · 2026-06-30 · CONFIDENTIAL*
