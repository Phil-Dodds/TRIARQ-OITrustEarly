# Port Gap Report — OITrustEarly vs the myqone production repos

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-20

Compared: `Phil-Dodds/TRIARQ-OITrustEarly` @ `master` `2a147fe` (the app that was
live until the 19th) against `TriarqHealthOTC/OI-Trust-Frontend` @ `Developement`
`daf0e5d` and `TriarqHealthOTC/OI-Trust-Service` @ `development` `74b8fb0`.

Both new repos were confirmed as the production lines: the frontend's
`cloudbuild-prod.yaml` and `kubernetes.yaml` live on `Developement`, and
`master` differs from it by 3 files / 79 lines. The service's `development` is
`origin/HEAD`; `master` is 5 files behind, `main` 26 files behind (13 Aug).

## Verdict

**The backend is not behind. The frontend is behind by roughly three and a half
weeks of product work.**

- `OI-Trust-Service` is a Java/Spring reimplementation, not a copy. All **210 of
  210** registered MCP tools have a Java counterpart. Migrations are 1:1
  (`V001`–`V100`), not squashed. The port-freeze migrations 101–103 are correctly
  absent. Two behavioural gaps, listed below.
- `OI-Trust-Frontend` is the Angular app, and its `src/` was forked from a
  baseline snapshot around **late July 2026** — pre-Contract 39, pre-CC-38
  follow-ons 8–21 — then re-platformed onto the Java API. Only 5 non-spec files
  are missing outright, but **76 files differ, almost all of them older**:
  roughly **6,000 baseline lines removed against 5,300 lines of port work added**.

The frontend is internally consistent with the backend, so most of this does not
crash. It silently does less, or does an older thing. That is the harder failure
mode to notice from inside the running app.

---

## P1 — Live data-integrity defect

### D-458 participant arrays: split-brain, actively accruing

Migration 084 moved `other_consulted_user_ids` / `other_informed_user_ids` into
`participation_records` and **annotated the columns retired rather than dropping
them** ("drop timing is a Design decision at GEnd"). Baseline
`update_delivery_cycle.js` therefore declares `RETIRED_D458_FIELDS` and
**rejects** writes to them.

The new stack reverts all three layers:

| Layer | Behaviour |
|---|---|
| Frontend `edit-panel.component.ts` | Still renders the Other Consulted / Other Informed array editors |
| Frontend `delivery.service.ts` | Reintroduces `other_consulted_user_ids` / `other_informed_user_ids` params |
| Java `DeliveryToolService:417-421, 2514-2517` | Accepts them and writes `update delivery_cycles set other_consulted_user_ids=?` |

The cycle-update path in Java never touches `participation_records`. Because the
columns still exist, nothing errors.

**Consequence:** every participant added through the new UI since cutover lands
in a retired column, while RACI and participation surfaces read
`participation_records`. The data is not lost, it is invisible. It also diverges
further every day the UI stays as it is.

**Fix order:** stop the writes first (reject in Java, remove the array editors
from the frontend), then reconcile whatever accumulated since 19 August using
migration 084's own `unnest` query as the template.

---

## P2 — Whole capabilities missing end to end

### Gate assessments (Contract GA-1 / D-579) — dead on both sides

- **Backend:** `V089__gate_assessments.sql` ships the table. **No Java code reads
  or writes it.** The only hit for "assessment" is the string literal
  `"close_review_assessment_roster"` as an event-type case label. Baseline
  `helpers/gate-assessments.js` (`saveAssessment`, `clearActiveAssessments`,
  `fetchAssessments`, `filterForViewer`, `buildAssessmentRosterText`) is consumed
  by five tools — `submit_gate_for_approval`, `record_gate_decision`,
  `record_consultation_response`, `withdraw_gate_submission`,
  `get_delivery_cycle`. All five exist in Java by name; none carry the behaviour.
- **Frontend:** `gate-assessment-form.component.ts` is byte-identical to
  baseline, but `gate-consultation-section.component.ts` **no longer imports or
  renders it**. Dead code.

An empty table, an unrendered form, and five tools that respond without
collecting anything. Rule 39's collection-posture registry has no counterpart.

### Maintenance mode regressed to the pre-AC-29 design

`maintenance-mode.service.ts` exists but is the **older post-login version**,
reading via the `check_maintenance_mode` tool *after* auth. The baseline's
pre-auth read and the entire `APP_INITIALIZER` block in `app.module.ts` —
including `router.resetConfig([{ path: '**', children: [] }])` before initial
navigation — are **deleted**.

Net effect: maintenance mode can no longer hold users out when the backend is
down, which was its whole purpose (AC-29, D-MaintenanceMode). Note this also
removes the one authorised direct-Supabase read, so the Arch-1 exception no
longer applies — worth recording either way.

### Contract 45 reporting-zone UI removed

`my-team.service.ts` is intact, but the D-638 reporting-zone display and editable
manager relation are stripped from both the View and Edit panels of
`features/admin/users/users.component.ts`, along with `.oi-zone-note` /
`.oi-field-hint`. The backend supports it (`NotificationQueueHelper.appendManagerCopies`
honours `manager_user_id`); there is simply no UI to set it.

### The 2026-08-18 announcement channels

All three are absent from the frontend, and one from the backend:

| Channel | Status |
|---|---|
| `version.json` `message` → top banner | `VersionPayload.message`, the `message$` subject, and `versionMessage$` in `app.component.ts` all absent. Banner text is hardcoded again. |
| News-ticker `notice` kind | `NewsTickerItem` union has no `'notice'`. |
| `NEWS_TICKER_NOTICE` env var | No Java equivalent — zero hits for `NEWS_TICKER`, `notice:pinned`. |

So there is currently **no way to broadcast anything to users in the app.**

---

## P3 — Product behaviour silently older

Governance decisions that were implemented in Early and are absent here:

| Missing | Where it lived | Contract / decision |
|---|---|---|
| `is_initiative_executive` RoleFlag **deleted** | `core/constants/roles.ts` | Contract G8 / D-560 — the IE gate on All Pending Gates cannot resolve |
| `GATE_PURPOSES` rotating coaching text | `shared/constants/gate-coaching.constants.ts` | Contract G7 / D-555 |
| `Closed — outcome not met` marker | `delivery-cycle-detail.component.ts` | Contract 39 / D-585 |
| Tier retirement — `tier_classification` still **required** on create in Java, tier filter and `CREATE_DEFAULT_TIER = 'tier_3'` back in the UI | create-panel, dashboard, `DeliveryToolService:234` | Contract 39 / D-583 |
| AI Production Board half-diamond marker | `stage-track.component.ts` (−153 lines) | CC-38 |
| Headline bands + conflict ⚠ | `cycle-headline.utils.ts` — `HeadlineBand`, `bandFromDateStatus`, `headlineBandStyle`, `GATE_DISPLAY_NAMES` all gone | CC-38-27..31 |
| "Next Gates" rework incl. the third *No target date* section and dol_required exemption | `epo-schedule.component.ts` | CC-38-40 |
| EPO/DOL/DCS role switch | `epo-deploy.component.ts` — reverted to an older `groupBy` pivot | — |
| Outlook `.msg` drop-import | `tracks/outlook-import.ts` — **file absent**, consuming UI stripped | CC-38 f20 |
| Multi-select theme filter | dashboard — `filterThemes[]` → single `filterTheme` | — |
| Sticky create-panel Cancel/Create | create-panel — clipping fix reverted | Phil, 2026-07-24 |
| Division tree ordering | `orderDivisionsAsTree` → older `buildDivisionTreeRows` | Contract 38 f18 |
| Series-position cue, "start next meeting", coaching strip | `team-meetings-detail.component.ts` | CC-38 f21 |

Also: `mcp.service.ts` now replaces the server's real 401 text with a generic
"session expired". Good for OT-007 re-auth, but it discards the Decision-140
message the server sent — worth preserving both.

---

## P4 — Broken artefacts

1. **`src/assets/icons/triarq/triarq-q.svg` is missing** but
   `celebration-spray.component.ts:33` still references it — the TRIARQ-Q
   confetti particle 404s at runtime.
2. **`OI-Trust-Service` is committed inside the frontend repo as a bare gitlink**
   (`160000 commit ad565d8…`) with **no `.gitmodules` entry**. The directory is
   empty. Harmless to the Angular build, but it breaks
   `git clone --recurse-submodules` and any CI submodule step, and it makes
   `git status` permanently noisy. Someone cloned the backend inside the frontend
   tree and committed the pointer.
3. **The daily-digest DST defect was reproduced, not fixed.**
   `ScheduledJobs.java` carries `@Scheduled(cron = "0 0 10 * * *", zone = "UTC")`
   — 10:00 UTC is 06:00 ET only under EDT, so through winter the digest lands at
   05:00 ET against D-643's 06:00 ET constant. The porting memo flagged this
   explicitly. Spring makes it a one-line fix, unlike pg_cron:
   ```java
   @Scheduled(cron = "0 0 6 * * *", zone = "America/New_York")
   ```
   Note also that this scheduling wiring is only two days old — it exists on
   `development` but not on `main`, and its own javadoc records that the digest
   and reminder logic was never invoked until 19 August.

---

## What the new repos do better

Not everything is a regression, and these should not be reverted while
back-porting:

- **Secrets out of git.** `environment.production.ts` is gitignored; only
  `.example.ts` templates ship. Zero occurrences of `onrender.com`, zero of the
  old Supabase project ref `dpnkxrrtqfqkhuzbljbw`, and the anon key is gone from
  the tree entirely.
- **Correct `baseHref`** — `/OI-Trust/`, in both prod and dev configurations.
- **Content Security Policy** in `index.html` and `nginx.conf` — `frame-ancestors 'none'`,
  `object-src 'none'`, scoped `connect-src`. The baseline had none.
- **`admin.guard.ts`** on `/admin`. The baseline had only `auth.guard`.
- **Java auth** replacing the Supabase SDK, the hybrid storage adapter and the
  `navigator.locks` bypass — a genuine simplification.
- **Scheduling is explicit** — `@EnableScheduling` + `ScheduledJobs.java` with a
  test, rather than three pg_cron rows recoverable only from `cron.job.command`.
- **`check_maintenance_mode`** added as a first-class tool.
- Flyway per-migration scripts plus optional consolidated bundles for
  single-shot deploys.

---

## Recommended sequence

1. **Stop the D-458 writes** (Java reject + remove the UI editors), then
   reconcile the divergence since 19 August. Every day this waits costs more
   reconciliation.
2. **Decide GA-1's fate.** Either implement the assessment read/write path
   against the already-migrated table, or drop the table and remove the dead
   form. Leaving an empty table behind a live UI is the worst of the three.
3. **Restore the maintenance gate** to the AC-29 pre-auth design, or accept
   explicitly that maintenance mode no longer gates a backend outage.
4. **Back-port the governance decisions** in P3 as a batch — D-560, D-555, D-583,
   D-585 are all locked decisions currently unimplemented in production.
5. **Fix the DST hour and the two broken artefacts** — cheap, and the submodule
   gitlink will bite someone's CI.
6. **Re-point the announcement channels** if you want the ability to talk to
   users in-app again.

A note on method for whoever does the back-porting: the two repos share no git
history, so this cannot be cherry-picked. Work feature by feature from the table
above, using `TRIARQ-OITrustEarly` @ `2a147fe` as the reference. That repo is
still intact and its database is frozen read-only, so it remains a reliable
source of truth for behaviour — but see the note in
`Memo-Port-Delta-Hazards.md` about it being a public repo.
