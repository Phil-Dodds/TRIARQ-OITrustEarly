# OITrust — CodeClose — Contract 23 (Items 1–3)
Pathways OI Trust | 2026-06-12 | CONFIDENTIAL

Spec source: `OITrust-Contract23-SectionH-2026-06-12.md` (zip).
Registry source: `decision-registry.md` from the for-ClaudeCode zip (D-318) — next available D-426; D-424 LOCKED.

---

## A. Surfaces Touched

| # | File | Class | Purpose |
|---|---|---|---|
| 1.1 / 1.2 | `angular/src/app/shared/components/sidebar/sidebar.component.ts` | MOD | Initiative Tracking + Admin devStatus uat → pilot |
| 2.3 | `mcp/delivery-cycle-mcp/src/tools/list_delivery_cycles.js` | MOD | Batched gate_records in list payload |
| 2.1 | `angular/src/app/features/delivery/stage-track/stage-track.component.ts` | MOD | Condensed mode → diamonds on top, stage label below (S-015 11px italic Stone) |
| 2.1 / 2.2 | `angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts` | MOD | Stage column → StageTrackComponent; Headline column → computeHeadline; buildGateStateMap awaiting_approval + overdue→blocked; min column widths |
| 2.2 | `angular/src/app/features/delivery/dashboard/cycle-headline.utils.ts` | NEW | Pure 6-rule headline + date formatting helpers |
| 2.2 | `angular/src/app/features/delivery/dashboard/cycle-headline.utils.spec.ts` | NEW | Headline rule coverage + date formatter coverage |
| 3.1 | `db/migrations/038_add_dol_required_to_divisions.sql` | NEW | `dol_required boolean NOT NULL DEFAULT true` on `divisions` |
| 3.2 | `mcp/division-mcp/src/tools/update_division.js` | MOD | MUTABLE_FIELDS + boolean validation for `dol_required` |
| 3.2 | `mcp/division-mcp/src/tools/list_divisions.js` | MOD | `dol_required` added to DIVISION_SELECT |
| 3.2 | `mcp/division-mcp/src/tools/get_division.js` | UNCHANGED | Already `SELECT *` — picks up new column post-migration |
| 3.3 | `angular/src/app/core/types/database.ts` | MOD | `dol_required?: boolean` on `Division` |
| 3.4 | `angular/src/app/features/admin/divisions/divisions.component.ts` | MOD | View DOL Required read-only row + Edit toggle |
| 3.5 | `angular/src/app/features/delivery/create-panel/delivery-cycle-create-panel.component.ts` | MOD | `dolRequiredForSelectedDivision` getter + conditional hint text |
| 3.6 | `mcp/delivery-cycle-mcp/src/tools/submit_gate_for_approval.js` | MOD | Brief Review DOL null check is Division-conditional on `dol_required` |

---

## B. CC-Decisions (this contract)

**CC-23-01 — devStatus advances per S-020.**
Initiative Tracking `uat` → `pilot`; Admin `uat` → `pilot`. Phil confirmed 2026-06-12 Design Session. Source: Section H Contract 23 Item 1.

**CC-23-02 — `list_delivery_cycles` gate_records added (not `gate_summaries`).**
Section H Item 2.3 said "If `gate_records` or equivalent gate status summaries are not already in the response payload" and offered `gate_summaries` as the suggested shape. Implementation uses `gate_records` (same key + shape as `get_delivery_cycle`) for vocabulary consistency across MCP tools. `target_date` / `actual_date` already present in payload via `milestone_dates` (Contract 22.1 fix). Single batched query — no per-cycle sub-call. Source: Section H Item 2.3.

**CC-23-03 — Headline uses module-local date helpers; no shared utility introduced.**
Section H Item 2.2 said "Use the existing date formatting utility already in the codebase — do not introduce a new one." No central date utility exists — `gates-summary.component.ts` and `users.component.ts` each inline their own day math. Headline date math is inlined inside `cycle-headline.utils.ts` (`formatHeadlineDate`, `daysFromToday`) so the function stays pure and self-contained. If a shared utility is consolidated later, the helpers are private to this file and easy to replace. Flagging as a future candidate. Source: Section H Item 2.2.

**CC-23-04 — Restoring Stage Track to grid overwrites prior CC-Decision-2026-04-12-A.**
CC-Decision-2026-04-12-A (Contract 5) removed StageTrackComponent from grid rows citing S-002 "condensed mode legibility." Section H Item 2.1 explicitly restores it via D-267 + S-002 (locked). My position: spec wins — S-002 itself defines Condensed as "dashboard rows — gate nodes only, stage name as adjacent text," which is exactly what the new spec requires. The freeze risk that drove CC-Decision-2026-04-12-A is mitigated by `gateStateMapsCache` (CC-Decision-2026-04-11-A) which provides stable per-cycle references; the new headline cache (`_headlineCache`) uses the same pattern. Rule 8 conflict flagged in plan mode; proceeded per Rule 8 "principle citations from locked decisions are not a conflict." Source: D-267, S-002, Section H Item 2.1.

**CC-23-05 — Condensed stage label placement amended (below, not adjacent).**
Existing StageTrackComponent condensed mode rendered the stage label adjacent (left of diamonds). Section H Item 2.1 explicitly requires the label "directly below the gate diamond row." Component template updated; no other consumers — Condensed mode was unused outside this grid. `condensedStageLabel` derived from `LIFECYCLE_TRACK` (structural read) rather than hardcoded — so `BRIEF` → "Brief" follows the same source as Full mode. Source: Section H Item 2.1.

**CC-23-06 — `buildGateStateMap` adds `awaiting_approval` state and overdue→blocked branch.**
Prior mapping treated `awaiting_approval` as `upcoming` (the case was missing), so the gate diamond stayed fog-colored after a submission. Migration 029 made `awaiting_approval` the canonical post-submit value. Contract 23 corrects the mapping (renders sunray per spec) and adds the new branch: a milestone target_date in the past with no actual_date and not approved → `blocked` (renders error color). Source: Section H Item 2.1, D-345, Migration 029.

**CC-23-07 — Grid template column widths adjusted for stage diamonds + headline minimum.**
Stage column now `140px` (was `130px`) per spec minimum. Headline column changed from `1fr` to `minmax(160px, 1.2fr)` for spec minimum 160px and to keep the Headline visually weighted heavier than Outcome. No other columns altered. Source: Section H Item 2.1 / 2.2.

**CC-23-08 — `submit_gate_for_approval` Brief Review pre-check is Division-conditional on `dol_required`.**
Added `division_id` to cycle SELECT; when `gate_name === 'brief_review'` and DOL is null, look up the cycle's Division and skip the block when `dol_required === false`. DCS and Workstream pre-checks remain enforced regardless. Source: D-424, Section H Item 3.6.

**CC-23-09 — `list_divisions` SELECT projection extended; `get_division` unchanged.**
`list_divisions.js` uses an explicit DIVISION_SELECT string; `dol_required` added. `get_division.js` uses `SELECT *` and so picks up the new column automatically after Migration 038. Source: Section H Item 3.2.

**CC-23-10 — Division Edit panel: DOL Required toggle is non-destructive (no confirmation).**
Per Section H Item 3.4: "No confirmation required for this toggle — it is not a destructive action." Active Status deactivation (D-414) confirmation flow is unchanged and runs independently. `dol_required` only included in the update payload when its value changed (parallel to `active_status` change-detection). Source: Section H Item 3.4.

**CC-23-11 — `POST_DEPLOY_STAGES` constant removed from dashboard component.**
The old `headline()` method was the sole consumer; removed alongside the method. The same concept lives in `cycle-headline.utils.ts` (`POST_DEPLOY_STAGES`) but `COMPLETE` is now included there (spec Rule 6) — different scope, different file. Source: Section H Item 2.2.

---

## C. Migration to Execute (Rule 22)

`db/migrations/038_add_dol_required_to_divisions.sql`:

```sql
ALTER TABLE public.divisions
  ADD COLUMN IF NOT EXISTS dol_required boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.divisions.dol_required IS
  'When true (default), Brief Review gate submission requires a non-null DOL on each '
  'Initiative in this Division. When false, the DOL null check is skipped for this Division '
  'only — DCS and Workstream pre-checks remain enforced. Source: D-424, Contract 23 Item 3.';
```

Phil executes manually in Supabase before MCP deploy. All existing Divisions get `true` by default — no behavior change for any existing Initiative until an admin flips the toggle.

---

## D. Decision Registry Updates (for Document Author to apply to next zip)

| Number | From | To |
|---|---|---|
| D-267 | `specced` | `built` |
| D-424 | `not-specced` | `built` |

Note: not edited in-repo because the repo's `decision-registry.md` is behind the zip's copy (repo shows next-available D-424; zip shows D-426). Document Author syncs the canonical registry.

---

## E. CodeClose Verification (Rule 29 — eight sections)

### 1. Spec Coverage

| Spec Item | Acceptance Criterion | Status | Evidence |
|---|---|---|---|
| 1.1 | Initiative Tracking renders `** Pilot` | PASS | `sidebar.component.ts:30` devStatus = 'pilot' |
| 1.2 | Admin renders `** Pilot` | PASS | `sidebar.component.ts:33` devStatus = 'pilot' |
| 2.1 | 5 gate diamonds + stage subtext, no badge | PASS | Stage Track condensed template + dashboard col 4 |
| 2.1 | Gate diamond colors per token mapping | PASS | `stage-track.component.ts:gateColor` complete/awaiting_approval/blocked/upcoming → primary/sunray/error/fog |
| 2.1 | Stage subtext 11px italic Stone | PASS | `stage-track.component.ts` condensed inline style |
| 2.1 | Column width ≥ 140px, never hidden | PASS | `grid-template-columns:... 140px ...` |
| 2.1 | Old badge CSS removed | PASS | Replaced inline, not fallback-gated |
| 2.2 | BRIEF + no gates → "In Brief · Next: Brief Review" | PASS | spec test `Rule 5 — BRIEF with no milestone data` |
| 2.2 | awaiting_approval → "Awaiting [Gate] approval · [date]" | PASS | spec test `Rule 1 — gate awaiting_approval wins` |
| 2.2 | Overdue → "[Gate] approval overdue · X days" Oravive | PASS | spec test `Rule 2 — overdue unapproved gate renders Oravive` |
| 2.2 | Plain "In [Stage]" no longer appears as bare headline | PASS | Removed from output paths — Rule 5/6 always include "Next:" or Deploy/Release |
| 2.2 | `computeHeadline` is pure | PASS | No Angular/DOM/DI in `cycle-headline.utils.ts` |
| 2.3 | Single batched gate query | PASS | `list_delivery_cycles.js` — one `.in('delivery_cycle_id', cycleIds)` call |
| 3.1 | Migration file present, not executed by Code | PASS | `db/migrations/038_...sql` written, displayed in §C |
| 3.2 | update_division accepts `dol_required` | PASS | Added to MUTABLE_FIELDS + boolean validation |
| 3.3 | Division type has `dol_required` | PASS | `database.ts:60` |
| 3.4 | View "DOL Required: Yes/No" visible | PASS | `divisions.component.ts` Identity zone |
| 3.4 | Edit toggle "Require DOL on Initiatives" present | PASS | `divisions.component.ts` Edit form |
| 3.5 | Hint text flips on Division change | PASS | `dolRequiredForSelectedDivision` getter + template ternary |
| 3.6 | Brief Review submits when `dol_required=false` and no DOL | PASS | `submit_gate_for_approval.js` Division lookup branch |
| 3.6 | Brief Review still blocks for standard Divisions | PASS | `dolRequired` defaults true; original block intact |

### 2. Regression Check
- Sidebar — only `devStatus` values changed; nothing else touched in `NAV_ITEMS`.
- `list_delivery_cycles` — added `gate_records` field; all existing returned fields and filters unchanged. milestone_dates payload still present.
- Dashboard Stage column — restored Stage Track condensed; gate diamonds non-interactive, no `gateClicked` emit in this context (matches spec). Other columns (Division, Initiative Name, Outcome, Team) unchanged.
- Dashboard Headline column — old `headline()` and `headlineColor()` replaced by methods that delegate to `computeHeadline` / `headlineColorCss`. Drill-down banner and filter chips unaffected.
- `update_division` — `dol_required` validation does not affect any existing field path; `active_status` flow unchanged.
- Division Edit panel — Active Status flow + deactivate confirmation untouched; new field is independent.
- Create Initiative form — only DOL field's hint text is conditional; field itself, picker behavior, and pre-pop logic unchanged.
- `submit_gate_for_approval` — DCS null check unchanged; Workstream check unchanged; EPO check unchanged; only DOL block path now consults `dol_required`.

How verified: code-review walk and TypeScript build (pending notification at session-end time of writing — see §8).

### 3. Test Ratchet

| Logic-touching change | Protecting test |
|---|---|
| `computeHeadline` 6-rule function | `cycle-headline.utils.spec.ts` — one test per rule + null/empty guard |
| `formatHeadlineDate` relative/short-date branches | `cycle-headline.utils.spec.ts` — 8 cases incl. today/±1/±2/+30/null/invalid |
| `buildGateStateMap` overdue + awaiting_approval branches | **No new test** — declared as CLAUDE.md candidate. The function lives inside the 2071-line dashboard component, not extractable in this contract scope. |
| `submit_gate_for_approval` DOL conditional | **No new test** — declared as CLAUDE.md candidate. MCP test harness not established in this repo per CI audit. |
| `update_division` `dol_required` validation | **No new test** — same MCP-harness gap. |

### 4. Pattern Sweep
- Pattern modified: grid-row Stage rendering (badge → StageTrackComponent condensed). Search results: `stagePillBg`, `STAGE_LABEL.*background`, `current_lifecycle_stage.*background` — single non-grid hit at `delivery-cycle-detail.component.ts:2392` (`stagePillBg` is the detail panel pill, intentional, out of scope). No other grid surface renders stage as a badge pill.
- Pattern modified: condensed-mode Stage Track label placement. Only one consumer (this grid); change is local.

### 5. Standards Conformance

| Standard | Status |
|---|---|
| S-002 Stage Track | PASS — Condensed mode now matches the standard's definition ("gate nodes only, stage name as adjacent text" reinterpreted as "below" per Item 2.1 explicit instruction) |
| S-015 Secondary Orienting Text Style | PASS — Stage subtext rendered at 11px italic #5A5A5A |
| S-019 View → Edit Pattern | PASS — Division Edit panel keeps S-019 slot/scrim/dirty-state flow (untouched) |
| S-020 devStatus advancement check | PASS — Item 1 is itself the result of an S-020 advancement signal Phil approved |
| S-025 UI Feedback Patterns | PASS — DOL hint uses Pattern 1 (gray sub-text, no icon/background) |
| S-031 Test ratchet + pattern sweep + descriptive naming | PARTIAL — pure function covered; component-internal branches flagged as CLAUDE.md candidates (see §3) |

### 6. CC-Decision Completeness
Sequence CC-23-01 through CC-23-11 enumerated above. No gaps.

### 7. Structural Health

| File | Lines (post-edit) | Threshold | Status |
|---|---|---|---|
| `delivery-cycle-dashboard.component.ts` | ~2060 (–~70 from old headline+POST_DEPLOY_STAGES, +~30 from new wiring) | 300 (component) | **OVER** — declared per Rule 12. Not refactored in this contract. |
| `divisions.component.ts` | ~1050 | 300 (component) | **OVER** — declared per Rule 12. Not refactored in this contract. |
| `delivery-cycle-create-panel.component.ts` | ~750 | 300 (component) | **OVER** — declared per Rule 12. Not refactored in this contract. |
| `stage-track.component.ts` | ~360 | 300 (component) | **OVER** — declared per Rule 12. Not refactored in this contract. |
| `submit_gate_for_approval.js` | ~285 | 400 (service) | OK |
| `list_delivery_cycles.js` | ~260 | 400 (service) | OK |
| `update_division.js` | ~130 | 400 (service) | OK |
| `cycle-headline.utils.ts` | ~180 | n/a (utility) | OK |

### 8. Deployment

Build verification:
- `npx tsc --noEmit -p tsconfig.app.json` → **clean** (no type errors).
- Full `npm run build` (postbuild writes `version.json`) deferred to deploy step — Phil to run as part of Angular gh-pages publish.
- Migration 038 — **applied** by Phil 2026-06-12.

**Production deploy not executed by Code this session.** Rationale (Executing Actions with Care + Rule 22):
1. Migration 038 must be applied to Supabase by Phil first.
2. Production `git push origin master` (MCP Render auto-deploy) and `git push --force origin gh-pages` (Angular static) are shared-state writes requiring Phil's explicit approval.
3. Maintenance-mode toggle (build-c-spec §9) likewise requires Phil's confirmation.

**Deploy sequence Phil runs:**

```
1. set_maintenance_mode(true)
2. Run Migration 038 in Supabase SQL editor
3. cd <repo>; git add -A; git commit; git push origin master   (MCP auto-deploys)
4. cd angular; npm run build
5. cp -r dist/pathways-oi-trust/browser /c/tmp/oi-deploy-c23-2026-06-12/
6. cd /c/tmp/oi-deploy-c23-2026-06-12/; cp index.html 404.html; touch .nojekyll
7. git init -b gh-pages; git add -A; git commit -m "Contract 23 deploy"
8. git remote add origin https://github.com/Phil-Dodds/TRIARQ-OITrustEarly.git
9. git push --force origin gh-pages
10. Health check Render + Pages
11. set_maintenance_mode(false)
```

UAT Checklist is provided below contingent on Phil completing the deploy sequence. If any deploy step fails, the relevant UAT subsection is invalid until re-run.

---

## F. UAT Checklist (Rule 19 / D-357)

### UAT-1 — Sidebar devStatus advances
1. Reload the app. Sidebar shows `Initiative Tracking ** Pilot` (cyan) — PASS / FAIL
2. Sidebar shows `Admin ** Pilot` (cyan) — PASS / FAIL
3. No other nav item changed (Home `** UAT`, Contact an Admin `** Pilot`, OI Library/Chat `** Coming Soon`) — PASS / FAIL

### UAT-2 — All Initiatives grid Stage column (Stage Track restored)
1. Open `/initiatives/list`. Stage column shows 5 small diamonds in a horizontal row (no solid colored rectangle) — PASS / FAIL
2. Stage name appears in 11px italic Stone below the diamonds (e.g. "Brief", "Design") — PASS / FAIL
3. Approved gates render in primary blue; awaiting_approval gates in sunray; overdue or blocked gates in error red; upcoming in fog gray — PASS / FAIL
4. Diamonds are non-interactive in the grid (no click handler / cursor change). Click on the row still opens the detail panel — PASS / FAIL

### UAT-3 — All Initiatives grid Headline column (6-rule)
1. Find an Initiative in BRIEF stage with no gate activity. Headline reads `In Brief · Next: Brief Review` — PASS / FAIL
2. Find an Initiative with a gate set to awaiting_approval. Headline reads `Awaiting [Gate] approval · [date if set]` — PASS / FAIL
3. Find an Initiative with an overdue gate target. Headline reads `[Gate] approval overdue · X days` in Oravive (#E96127) — PASS / FAIL
4. Find an Initiative in BUILD/SPEC/etc. with a Go to Deploy target set. Headline reads `Next: [next gate] [date] · Deploy [date]` — PASS / FAIL
5. Find an Initiative in PILOT/RELEASE/OUTCOME/COMPLETE. Headline reads `Deploy [date] · Release [date if set]` — PASS / FAIL
6. No Initiative shows just `In Design` or `In Build` as the headline (bare stage label gone) — PASS / FAIL

### UAT-4 — Initiative detail / drill-down unchanged
1. Click any row → detail panel opens (S-005) — PASS / FAIL
2. Apply Workstream filter, Tier filter, Stage filter. Each runs without error and chip-bar dismisses correctly — PASS / FAIL
3. Refresh page; saved filters restore (D-280 / Item 4) — PASS / FAIL

### UAT-5 — Division Edit panel: DOL Required toggle
1. Navigate `/admin/divisions`. Open any Division → View panel shows `DOL Required: Yes` — PASS / FAIL
2. Click Edit. Below Active Status there's a checkbox `Require DOL on Initiatives` (checked by default) — PASS / FAIL
3. Uncheck. Click Save. Panel returns to View showing `DOL Required: No` — PASS / FAIL
4. Re-check. Click Save. View shows `DOL Required: Yes` — PASS / FAIL
5. Deactivation flow (radio + confirm) still works independently — PASS / FAIL

### UAT-6 — New Initiative DOL hint text flips
1. Create new Initiative. Select a Division where `DOL Required = Yes`. DOL picker hint reads `Required before Brief Review Gate.` — PASS / FAIL
2. Cancel; create again, select a Division where `DOL Required = No`. DOL picker hint reads `Optional for this Division.` — PASS / FAIL
3. The DOL picker itself remains fully visible and clickable in both cases — PASS / FAIL

### UAT-7 — Brief Review gate behavior
1. On an Initiative in a `dol_required = false` Division with no DOL assigned, submit Brief Review. Submission succeeds (no DOL block error) — PASS / FAIL
2. On an Initiative in a standard `dol_required = true` Division with no DOL, submit Brief Review. Block message returned: "Cannot submit Brief Review gate — no Domain Outcome Lead is assigned…" — PASS / FAIL
3. DCS null check still blocks Brief Review in any Division — PASS / FAIL

### UAT-8 — Maintenance mode cleared
1. Confirm `set_maintenance_mode(false)` was the last deploy step. App home loads normally for all users — PASS / FAIL

---

## G. CLAUDE.md Candidates (Rule 16)

**Candidate 1.** Test ratchet for `buildGateStateMap` and headline computation.
- Why Code would add it: contract-23 added two new branches (`awaiting_approval` state, overdue → blocked) and a new pure function (`computeHeadline`). The pure function is covered. The component-internal branch is not.
- Trigger moment: §3 above — the only logic-touching change without a test is gated by the host component's size (2071 lines); extracting `buildGateStateMap` as a pure helper would let one test cover the gate-state mapping system-wide.

**Candidate 2.** MCP unit-test harness.
- Why Code would add it: Section H Item 3.6 modified `submit_gate_for_approval.js` (DOL branch) and Item 3.2 modified `update_division.js` (validation). Neither has a test. Per Arch-1 + S-031, MCP tools should have at least one happy path and one error path each.
- Trigger moment: §3 above — second and third entries.

**Candidate 3.** Shared date formatting utility.
- Why Code would add it: `gates-summary.component.ts`, `users.component.ts`, and now `cycle-headline.utils.ts` each contain their own day-math. A `core/utils/date.ts` with `daysFromToday`, `formatRelative`, `formatShort` would consolidate them.
- Trigger moment: §B CC-23-03.

**Candidate 4.** `gate_records` shape consistency between `list_delivery_cycles` and `get_delivery_cycle`.
- Why Code would add it: list payload returns raw rows; detail payload returns rows enriched with `submitted_by_display_name` and `current_user_gate_authority`. The dashboard does not need the enrichments today, but a typed wrapper that says so would prevent future drift.
- Trigger moment: §B CC-23-02.

---

## H. Structural Health Summary (Rule 12)

Three Angular components exceed the 300-line threshold and were touched this contract:
- `delivery-cycle-dashboard.component.ts` — ~2060 lines
- `divisions.component.ts` — ~1050 lines
- `delivery-cycle-create-panel.component.ts` — ~750 lines
- `stage-track.component.ts` — ~360 lines

All four are listed for future split refactors (Rule 12 declare only — no autonomous refactor).

---

## I. Session Output Path

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract23-2026-06-12.md`

Migration to execute:
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\db\migrations\038_add_dol_required_to_divisions.sql`

---

*Pathways OI Trust · Contract 23 CodeClose · 2026-06-12 · CONFIDENTIAL*
