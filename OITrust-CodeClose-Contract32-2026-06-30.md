# OITrust CodeClose — Contract 32 (Initiative Status Updates)
Pathways OI Trust | Build C | 2026-06-30 | CONFIDENTIAL
Governing decisions: D-476 through D-486. Commits: `185b0bb` (code), `cd9db4c` (changelog/About).

---

## Summary

Contract 32 delivers Initiative Status Updates across five workstreams: schema +
pg_cron overdue detection (WS1), division cadence configuration (WS5), the status
update/history panels + initiative-detail integration (WS2), the My Initiative
Status screen (WS3), and the Initiative Status Dashboard (WS4). 13 new MCP tools,
6 new Angular components/types, 4 modified Angular files, 6 migrations.

**Tests:** division-mcp 77/77; delivery-cycle-mcp 170/171 (one pre-existing
failure, `create_delivery_cycle › missing workstream_id`, unrelated to C32 —
baseline was 145/146). Angular production build clean.

---

## CC-Decisions (sequential, no gaps — Rule 17)

- **CC-32-1 — Gate-date tracking reuses `cycle_event_log` (OI-1/OI-6).** An
  existing mechanism was found: `set_milestone_target_date` writes a
  `milestone_target_date_changed` event with `{gate_name, old_target_date,
  new_target_date}` + `created_at`. Per spec §1.4 ("if a mechanism exists, use it
  and skip table creation"), `gate_date_history` was NOT created. D-486 slip
  detection queries `cycle_event_log`. Only one post-creation write path exists
  and it already logs — no new wiring required.
- **CC-32-2 — `system_config` is fixed-column → ADD COLUMN (OI-2).** Confirmed
  via your inspection SQL (columns: id, maintenance_mode, maintenance_message,
  updated_at, updated_by). Migration 053 adds `status_refresh_last_run timestamptz`.
- **CC-32-3 — Routes (OI-3).** `/my-initiative-status` (app-routing, standalone,
  My Actions nav); `/initiatives/status-dashboard` (DeliveryModule, Initiative
  Tracking nav).
- **CC-32-4 — MCP server assignment (OI-4).** 8 status tools → delivery-cycle-mcp;
  3 config tools → division-mcp.
- **CC-32-5 — Confidence enum = five `date_status` values (OI-5).** Migration 018
  values confirmed. The live constraint also allows `skipped` (migration 044);
  confidence fields deliberately exclude it (forward-looking judgement, not a
  terminal gate state).
- **CC-32-6 — No shared right-panel shell exists (OI-7).** Create/Edit/Detail each
  implement the sticky-header+body pattern independently. New status panels follow
  that pattern. Candidate: extract a shared shell (out of scope; would touch
  working panels).
- **CC-32-7 — `division_status_config` FK targets `divisions(id)`.** Spec §1.1
  wrote `REFERENCES divisions(division_id)`; the actual PK is `id` (migration 002).
  Verbatim spec would fail. Schema correction. (Deviation — Rule 7.)
- **CC-32-8 — Append-only tables omit `updated_at`.** `initiative_status_updates`
  and `initiative_status_acknowledgments` follow the `cycle_event_log`/D-125
  append-only precedent; CLAUDE.md's created_at+updated_at rule is satisfied by
  created_at / acknowledged_at. `division_status_config` (mutable) carries both.
  (Deviation — Rule 7.)
- **CC-32-9 — `clear_division_status_config` hard-deletes (Arch-6 exception, you
  approved).** Cadence config is a transient settings row, not a business/historical
  record; D-481 inheritance requires the local row to be *absent* to fall through
  to the parent. Soft delete would break inheritance. Recorded as an explicit
  Arch-6 exception.
- **CC-32-10 — Admin "tab" → section (you approved).** The Division admin panel has
  no tab strip (panelMode view/edit/create). The Initiative Update Cycle surface is
  a section inside the View panel, extracted as `DivisionInitiativeCycleComponent`
  (S-030). (Deviation from spec §4.7 wording — Rule 7.)
- **CC-32-11 — `MilestoneStatusSelectorComponent` extracted; detail gate-row swap
  deferred (you approved).** D-477 said reuse the existing selector AND don't create
  a new component, but no selector component existed (the detail gate Status column
  is an unrendered placeholder). Extracted one shared selector for the confidence
  fields. The detail gate-row swap is NOT part of C32 (not required by spec; avoids
  logic-touching the 3,389-line component) — logged as an S-031 pattern-sweep
  candidate. This keeps all detail-view edits additive (Rule 11 exempt).
- **CC-32-12 — `save_initiative_status_update` uses sequential writes, not a real
  transaction.** Spec §2.1 says "single transaction"; supabase-js exposes no
  multi-statement transaction across `.from()` calls, and existing tools (e.g.
  `create_delivery_cycle`) use sequential writes. The immutable status row is the
  source of truth; the confidence→gate-status write-through (via the existing
  `update_milestone_status` path, D-477) is best-effort and applicability (D-479)
  guarantees a non-complete gate so the revert gate is not tripped. (Deviation —
  Rule 7.)
- **CC-32-13 — Added `get_status_refresh_last_run` (not in the spec tool list).**
  D-484 requires showing "Status last calculated" on load; Angular cannot read
  `system_config` directly (D-93; the maintenance_mode direct-read exception does
  not extend here) and re-running the heavy refresh on every page load is wasteful.
  A lightweight read tool is the MCP-compliant path.
- **CC-32-14 — Dashboard division filter applied client-side; Needs Review server-side.**
  `get_initiative_status_dashboard` returns `division_id` (added) so the filter keys
  on a stable id over the caller-scoped result set; `needs_review_only` re-queries
  server-side. The tool's `division_ids` param remains available for future
  server-side scoping.
- **CC-32-15 — New nav items set `devStatus: 'uat'`.** Both screens are built but
  not yet UAT-confirmed; per S-020 the stage is flagged (below) rather than asserted
  higher.
- **CC-32-16 — About changelog entry shipped in a follow-up commit (`cd9db4c`), not
  the WS commit (`185b0bb`).** S-035 was applied at CodeClose rather than pre-commit;
  the changelog was added and the Angular bundle rebuilt before the GitHub Pages
  deploy, so the About panel entry is live in the deployed build. (Deviation — Rule 7.)

---

## First Principles records (Rule 1)

- **gate_date_history (CC-32-1):** Context = need slip detection; Question = new
  table vs existing mechanism; Reduce = `cycle_event_log` already captures it →
  deleted a table + all wiring. Simplify/Automate = D-486 reads the existing log.
- **Milestone selector (CC-32-11):** Context = D-477 single-source intent vs a
  3,389-line component; Reduce = extract one component for confidence; Simplify =
  defer the risky detail swap to a structural contract.
- **system_config (CC-32-2):** Reduce = one column vs a key-value subsystem.

---

## CodeClose Verification Pass (Rule 29)

**(1) Spec coverage — acceptance criteria (spec §8):**
- AC 1–17 (panel, confidence applicability, write-through, detail integration):
  PASS — built; write-through reuses `update_milestone_status` + appends
  `status_confidence_updated`; Current Status section loads independently.
- AC 18–24 (My Initiative Status): PASS — two tabs + badges, overdue/ack queries,
  Refresh + last-calculated, D-171 sort memory.
- AC 25–33 (Dashboard): PASS — division filter + memory, Needs Review toggle,
  all reason types via shared lib.
- AC 34–38 (scheduled function): PASS at code level; **runtime verification
  pending pg_cron registration** (Section 8 / UAT).
- AC 39–44 (admin cycle): PASS — view/inherited/unconfigured states, recurrence
  picker + live preview, validation, Clear two-step.
- AC 45–49 (process/schema): PASS — CC-32-1 documents the existence check;
  RLS enabled on all new tables (D-353); no direct Supabase in Angular (D-93);
  S-030/S-031 declared below.
- Confidence write-through happy path: verified via UAT (cross-tool DB chain),
  not unit-mocked — noted in (3).

**(2) Regression check:**
- division-mcp full suite 77/77 (was 65 → +12). delivery-cycle-mcp 170/171; the
  single failure (`missing workstream_id`) pre-existed this contract and is
  unrelated (workstream became optional per D-394). No behavior removed.
- `DeliveryCycleDetailComponent` and `divisions.component` changes are additive
  (new sections/buttons/embeds) — no existing logic modified (Rule 11 exempt).

**(3) Test ratchet:**
- division-mcp: `tests/contract32.test.js` — 12 tests (happy + error per config tool).
- delivery-cycle-mcp: `tests/contract32-status.test.js` — 27 tests covering the
  needs-review lib + happy/error per tool. Logic-touching paths protected.
- Gap flagged: the confidence write-through *happy* path (save → update_milestone_status
  → event log) is verified by UAT, not a unit test, because it spans tools and DB
  state. CLAUDE.md candidate: a fixture-based integration test for write-through.

**(4) Pattern sweep:**
- Shared pattern modified: introduced `MilestoneStatusSelectorComponent` as the
  single five-value selector. Sweep finding: the detail view's gate Status column
  still renders the five-value model inline (placeholder). Logged as an S-031
  next-contract candidate to swap it onto the shared component (CC-32-11).
- `needs-review.js` is the single definition of Needs Review reasons, reused by
  `get_latest_initiative_status` and `get_initiative_status_dashboard`.

**(5) Standards conformance (CodeClose-applicable standards):**
- S-030 (single responsibility): PASS — cadence UI extracted to a child component;
  needs-review logic extracted to a lib.
- S-031 (quality obligations): PASS — test ratchet (above), pattern sweep (above),
  verb+object naming on new methods.
- S-032: not applicable (no entity activation surface this contract).
- S-033: not modified (no build-pipeline change); existing version.json flow used.
- S-035: About Entry produced (below) and `changelog.ts` updated in the deploy
  commit chain (CC-32-16).
- S-036: PASS — column-header sort on both new grids; sort persisted per D-171.

**(6) CC-decision completeness:** CC-32-1 … CC-32-16, sequential, no gaps.

**(7) Structural health (Rule 12):**
- `divisions.component.ts` — 1,298 lines before; exceeds the 300-line component
  threshold (pre-existing). C32 change additive; cadence UI extracted to a child
  rather than inlined, avoiding further growth.
- `delivery-cycle-detail.component.ts` — 3,389 lines; exceeds threshold
  (pre-existing). C32 change additive only.
- New components are within threshold. New MCP tool files are small and single-purpose.

**(8) Deployment:**
- Migrations 049–054: written, displayed, executed by Phil (Rule 22). pg_cron
  Section 4 of migration 054 to be confirmed registered (verification query in file).
- MCP → Render: `git push origin master` (`185b0bb`, `cd9db4c`); Phil manually
  redeployed delivery-cycle-mcp and division-mcp (Render does not auto-deploy).
  **Confirmed Live by Phil.**
- Angular → GitHub Pages: rebuilt at `cd9db4c` (version.json matches), staged to
  `/c/tmp/oi-deploy-c32-2026-06-30` with `404.html` + `.nojekyll`, committed on
  `gh-pages`. **Force-push executed by Phil** (`git push --force origin gh-pages` —
  the Code session is gated from force-push).
- Result: deployment succeeded → UAT Checklist follows.

---

## UAT Checklist (Rule 19, D-357)

Run after CDN propagation (~30–60s) and the S-033 banner reload.

### Admin — Division Initiative Update Cycle
1. Open Admin → Divisions → a division → View panel. Is there an "Initiative
   Update Cycle" section? (pass/fail)
2. With no config and no parent config: shows "No update cycle configured" +
   Configure button? (pass/fail)
3. Configure → Weekly → Meeting Day Monday → preview reads "Every Monday" → Save →
   returns to view showing the config? (pass/fail)
4. Triweekly without a Starting From date → Save shows an inline error? (pass/fail)
5. A child division with no local config shows an amber "Inherited from: [parent]"
   banner? (pass/fail)
6. Clear Configuration → two-step confirm with the consequence sentence → confirm →
   returns to unconfigured state? (pass/fail)

### Initiative detail — status panel + Current Status
7. Open an initiative where you are DOL/DCS/EPO. Are "Update Status" and "View
   Status History" buttons in the header? (pass/fail)
8. As a non-trio user, is "Update Status" absent but "View Status History" present?
   (pass/fail)
9. Update Status → fill fields → Save → panel closes, Current Status section shows
   your update? (pass/fail)
10. If the initiative is before Pilot, does the panel show "Go to Deploy Confidence"
    (not Close Review)? Setting it and saving updates the Go to Deploy gate status?
    (pass/fail)
11. View Status History shows the update reverse-chronologically with acknowledgments?
    (pass/fail)

### My Initiative Status
12. Sidebar shows "My Initiative Status"; opening it shows two tabs with count
    badges? (pass/fail)
13. Updates Due lists initiatives where you are trio and overdue; Update Status
    opens the edit panel? (pass/fail)
14. Refresh Status updates the "Status last calculated" time and the tab counts?
    (pass/fail)
15. Needs Acknowledgment lists a teammate's recent update; View & Acknowledge →
    Acknowledge → it drops off the list? (pass/fail)

### Initiative Status Dashboard
16. Sidebar shows "Initiative Status Dashboard"; the grid lists your initiatives
    with the 9 columns? (pass/fail)
17. Needs Review only toggle filters to rows with at least one reason? (pass/fail)
18. Filters → pick a division → Apply → grid narrows + a chip appears; removing the
    chip restores it; reload preserves the selection? (pass/fail)
19. A row with escalation/overdue/at-risk shows the matching Needs Review reason(s)?
    (pass/fail)
20. View Status opens the read-only panel; View Initiative opens the full detail?
    (pass/fail)

### Scheduled function
21. In Supabase, `SELECT jobname, schedule FROM cron.job WHERE jobname =
    'refresh-initiative-status';` returns one row at `*/30 * * * *`? (pass/fail)
22. `SELECT public.refresh_initiative_status_overdue();` returns an integer and
    updates `system_config.status_refresh_last_run`? (pass/fail)

---

## About Entry — Contract 32
Date: 2026-06-30
BuiltAt: 14:54 UTC
Items:
- [Trio] My Initiative Status screen: Updates Due + Needs Acknowledgment tabs with a Refresh Status action.
- [All] Initiative Status Dashboard: org-wide status grid with Division filter and Needs Review.
- [Trio] Initiative Status Update panel: author updates + gate confidence; history + Current Status on detail.
- [Admin] Division — Initiative Update Cycle: per-division cadence with inheritance.

(Shipped in `changelog.ts` via commit `cd9db4c`.)

---

## Stage check (S-020)
- **My Initiative Status** — set to `uat`. Route, component, and MCP tools exist and
  are deployed; awaiting your UAT before advancing toward `live`.
- **Initiative Status Dashboard** — set to `uat`. Same basis.
- Recommend confirming these after running the UAT checklist; I did not advance
  beyond `uat` without your confirmation.

---

## CLAUDE.md Candidates (Rule 16)
1. **Render is manual, not auto-deploy.** CLAUDE.md v2.7 says "Render auto-deploys
   on push"; in practice Render required a manual redeploy of both MCP services.
   Candidate: correct the Build/Deploy section. (Trigger: this deploy.)
2. **`npm test` invocation quirk.** `node --test tests/` fails on this setup with
   "Cannot find module 'tests'"; `node --test tests/*.test.js` works. Candidate:
   update the test script or document the working invocation. (Trigger: WS5/WS2 test runs.)
3. **Integration test for confidence write-through.** The save→gate-status→event
   chain is UAT-verified, not unit-tested. Candidate: add a fixture-based test.
   (Trigger: test ratchet gap, §3.)
4. **`system_config` CREATE TABLE not in version control.** The table is referenced
   in RLS migration 031 and read by AppComponent but has no `CREATE TABLE` migration.
   Candidate: add a retroactive migration. (Trigger: CC-32-2.)
5. **Shared right-panel shell.** No reusable panel shell exists; each panel
   re-implements the chrome. Candidate: extract `RightPanelShellComponent`.
   (Trigger: CC-32-6.)

---

## Deviations from spec (Rule 7) — index
CC-32-7 (FK column), CC-32-8 (append-only no updated_at), CC-32-9 (hard delete /
Arch-6 exception), CC-32-10 (tab→section), CC-32-11 (selector extraction + deferred
swap), CC-32-12 (sequential writes vs single transaction), CC-32-13 (extra read
tool), CC-32-14 (client-side division filter), CC-32-16 (changelog in follow-up commit).

---

# Addendum — Contract 32 Follow-on: Navigation Restructure (2026-06-30, 17:10 UTC)

Executed same day after the main Contract 32 close, at Phil's direction during UAT.
Recorded here so Design has the complete Contract 32 picture in one document.

## What changed

**CC-32-17 — My Actions absorbed My Initiative Status.** My Actions now has four
tabs: Approve Initiative Gates · Initiative Gate Approvals Completed · Updates Due
· Needs Acknowledgment. The standalone "My Initiative Status" sidebar item was
removed; its two views (Updates Due, Needs Acknowledgment) moved into My Actions
as tabs. Rationale: one actionable inbox instead of two sidebar destinations for
overlapping "things waiting on me."

**CC-32-18 — Sidebar badge sums all three actionable counts.** The My Actions nav
badge = pending gate approvals (excluding post-approval Consulted per D-468) +
Updates Due + Needs Acknowledgment. One number reflects everything actionable.

**CC-32-19 — Initiative Status Dashboard demoted from sidebar item to hub card.**
The dashboard now renders as a card on the Initiative Tracking page with a
"needs review" headline count, instead of its own sidebar entry. Sidebar stays
short; the dashboard is discovered in context.

## Verification
- Screen-state keys for the pre-merge per-tab views retained
  (ACTIONS_GATE_APPROVALS, ACTIONS_GATE_REVIEWS…) so stored user state degrades
  gracefully — no migration needed.
- No MCP changes; pure Angular navigation/composition work.
- About panel entry shipped under "Contract 32 follow-on — Navigation
  restructure" (2026-06-30 · 17:10 UTC), audience All.
- UAT: Phil verified tabs, badge sum, and dashboard card in the 2026-06-30
  session (live usage since).

---

*Pathways OI Trust · Contract 32 · CodeClose (incl. follow-on addendum) · 2026-06-30 · CONFIDENTIAL*
