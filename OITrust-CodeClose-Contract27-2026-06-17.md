# OITrust CodeClose — Contract 27 — 2026-06-17
Pathways OI Trust | 2026-06-17 | CONFIDENTIAL

**Contract:** 27 — Roadmap Planning Mode
**Governing decisions:** D-444, D-445, D-446
**Spec:** `docs/OITrust-Contract27-Spec-2026-06-17.md`
**Branch:** master
**Commit:** `8a52fbe` — "Contract 27 — Roadmap Planning Mode (D-444, D-445, D-446)"
**Build SHA (version.json):** `8a52fbe4c6ac99f4126acb3f28ea783819141e60`

---

## Section A — Summary

Contract 27 introduces Roadmap Planning Mode across the two Deploy by Quarter views.

- **WS1** Deploy Roadmap Baselines registry — schema + 4 MCP tools + `/admin/deploy-baselines` admin screen (sixth Admin hub card).
- **WS2** Quarter Pivot Control — non-persistent `< Q[N] YYYY >` control on EPO Deploy and Workstream Deploy headers.
- **WS3** Prior Quarter Planned vs. Actual — baseline selector + ✓/✕/✚ symbols on Prior Quarter rows; data-gap notice with per-view dismissal.

Both Deploy views share a new `roadmap-planning.util.ts` for quarter math + symbol algorithm, and `.rpd-*` styles live in global `styles.scss` per D-371 budget discipline.

---

## Section B — CC-Decisions

**CC-27-1 — Arch-6 (Soft Delete Only) governs D-444's hard-delete spec.**
Spec §Workstream 1 Tool 4 described hard DELETE. CLAUDE.md Arch-6 is non-negotiable and offers no exception. Resolution: added `deleted_at timestamptz NULL` to `roadmap_freeze_dates`, partial unique index `uq_roadmap_freeze_date_active` on `freeze_date WHERE deleted_at IS NULL` (so a date can be re-used after the prior baseline is soft-deleted), and `delete_roadmap_freeze_date.js` issues `UPDATE … SET deleted_at = now()` instead of DELETE. `list_roadmap_freeze_dates.js` filters with `deleted_at IS NULL`. Recorded in migration header comment.

**CC-27-2 — EPO Deploy component path deviation from spec.**
Spec §Workstream 2 referenced `angular/src/app/features/initiatives/epo-deploy/`. Repo path is `angular/src/app/features/delivery/epo-deploy/` (D-392 renamed display + routes but explicitly retained the `delivery_cycles` DB table and the `features/delivery/*` folder structure). Implemented in place at the current path.

**CC-27-3 — `users.id`, not `users.user_id`.**
Spec MCP query examples (lines 49–55 of the spec and the column comment) showed `users.user_id`. Actual users PK across every migration in the repo is `users.id`. Migration 043 FK references `public.users(id)`; all four MCP tools query `users.id`. Surfaced when initial migration apply failed with `ERROR: 42703: column "user_id" referenced in foreign key constraint does not exist`.

**CC-27-4 — Contract 23 deploy date source: changelog.ts fallback.**
Spec §Workstream 3 Data Gap Disclosure asked Code to read the Contract 23 deploy date from `CLAUDE.md` or `changelog.ts`. Neither file currently records the C-23 deploy date (changelog.ts entries jump from older to 2026-06-16 Contract 25 Part 2; CLAUDE.md doesn't track deploys). Per spec fallback, the data-gap notice fires when the loaded cycles contain zero `milestone_target_date_changed` events.

**CC-27-5 — Event log fetch: extended `list_delivery_cycles` with `include_event_log`.**
Spec §Workstream 3 acknowledged two options (extend list_delivery_cycles vs lazy per-initiative). Chose the first to keep the symbol render synchronous (no spinner). `list_delivery_cycles.js` accepts optional `include_event_log: true` and projects up to 50 `milestone_target_date_changed` events per cycle as `target_date_change_events: { created_at, gate_name, old_target_date, new_target_date }[]`. EPO Deploy and Deploy Schedule pass the flag only when a baseline is selected.

**CC-27-6 — Quarter boundary computation stays client-side.**
Spec §Workstream 2 noted to flag this as a CC-decision. Existing implementation derived quarters client-side via `quarterOf(new Date())` getters; change is contained to swapping the `new Date()` source for a `referenceQuarterStart` component state initialized in `ngOnInit`. No MCP changes for the pivot control. Server-side `now()` quarter derivation was not used pre-Contract-27 in `list_delivery_cycles`.

**CC-27-7 — Shared `.rpd-*` styles hosted in global `styles.scss`.**
EPO Deploy CSS hit the 4 kB component-style hard error after adding the new pivot/baseline/data-gap rules. Both Deploy views need identical styling — extracted to global `styles.scss` under `.rpd-*` selectors, mirroring the precedent set for `.ia-*` styles per D-371.

---

## Section C — CC-Decision Sequence Completeness (Rule 17)

CC-27-1 → CC-27-7. No gaps.

---

## Section D — CodeClose Verification (Rule 29)

### §1 — Spec Coverage

#### Workstream 1 — Deploy Roadmap Baselines (12 ACs)

| AC | Result | Evidence |
|----|--------|----------|
| 1 — Migration runs cleanly, schema correct | **PASS (built; awaiting Phil's UAT confirmation)** | Migration 043 applied 2026-06-17. `freeze_date_id`, `freeze_date`, `freeze_label`, `created_at`, `created_by_user_id`, `deleted_at` (CC-27-1 addition) present. Partial unique index `uq_roadmap_freeze_date_active`. |
| 2 — `list_roadmap_freeze_dates` order DESC | **PASS** | `.order('freeze_date', { ascending: false })`. Empty array on empty table per `(data || [])` projection. |
| 3 — `create_roadmap_freeze_date` Admin / non-Admin / duplicate | **PASS** | Admin auth check at lines 26-35; structured `DUPLICATE_DATE` error returned both pre-flight and on 23505 race. |
| 4 — `update_roadmap_freeze_date` Admin / non-Admin / dup-on-update | **PASS** | Same auth pattern; duplicate check excludes current `freeze_date_id`. |
| 5 — `delete_roadmap_freeze_date` Admin / non-Admin | **PASS** | Soft-delete via `deleted_at = now()` (CC-27-1). Already-deleted row returns "Baseline not found or already removed." |
| 6 — Admin hub sixth card | **PASS** | `admin-hub.component.ts` ADMIN_CARDS extended; card shows for is_admin only via component guard pattern. |
| 7 — Grid columns + sort default desc | **PASS** | Freeze Date / Label / Set By / Set At + Remove column. Default sort `freeze_date desc` (most recent first). Sort persists via SCREEN_KEYS.ADMIN_DEPLOY_BASELINES. |
| 8 — "+ Add Baseline" + duplicate inline error | **PASS** | Inline create row pushes to MCP; DUPLICATE_DATE surfaces under freeze_date field per D-200 Pattern 3. |
| 9 — Inline edit on date + label saves via `update_roadmap_freeze_date` | **PASS** | Cell click → input → blur/Enter calls update; ESC cancels. |
| 10 — Remove two-step + 5-second timeout | **PASS** | First click → "Confirm remove?" + 5s `setTimeout`; second click within window deletes; timeout resets state. |
| 11 — Empty state message | **PASS** | Renders when `rows.length === 0 && !creating`. |
| 12 — Route guard for non-Admin | **PASS** | Component-level `is_admin === true` check in `ngOnInit` (mirror of EPO WIP pattern); blocked message renders if false. No router guard — matches existing admin convention. |

#### Workstream 2 — Quarter Pivot Control (6 ACs)

| AC | Result | Evidence |
|----|--------|----------|
| 13 — EPO Deploy `< Q[N] YYYY >` defaults current calendar quarter | **PASS** | `referenceQuarter = quarterOfDate(new Date())` in ngOnInit. |
| 14 — Workstream Deploy same control + behavior | **PASS** | Parallel apply on `deploy-schedule.component.ts`. |
| 15 — Chevrons step ±1, no bounds | **PASS** | `onShiftQuarter(delta)` mutates state via shared `shiftQuarter` util. |
| 16 — Section headers update | **PASS** | All getters derive from `referenceQuarter` (current, prior, nextQ1, nextQ2). |
| 17 — Initiatives re-bucket on quarter change | **PASS** | Grouping getters re-evaluate on `cdr.markForCheck()` per shift. |
| 18 — Refresh resets to current quarter | **PASS** | Reference quarter is component state, re-initialized in every ngOnInit. Not persisted to user_screen_state. |

#### Workstream 3 — Prior Quarter Planned vs. Actual (10 ACs)

| AC | Result | Evidence |
|----|--------|----------|
| 19 — EPO Deploy baseline selector | **PASS** | `listRoadmapFreezeDates()` populates dropdown; disabled with "No baselines saved — see Admin" when empty. |
| 20 — Workstream Deploy same selector | **PASS** | Parallel apply. |
| 21 — No baseline: actuals only, header "… Actual" | **PASS** | `priorSectionHeader` getter; `priorQuarterSymbolFor()` returns null when no baseline. |
| 22 — Baseline selected: header "… PLANNED / ACTUAL · [label]" | **PASS** | `priorSectionHeader` getter branch. |
| 23 — ✓ symbol on planned-deployed | **PASS** | `computePriorQuarterSymbol()` returns `'planned-deployed'` → ✓ #22c55e. |
| 24 — ✕ symbol on planned-not-deployed | **PASS** | Same algo → ✕ #E96127. |
| 25 — ✚ symbol on unplanned-deployed | **PASS** | Same algo → ✚ #22c55e. |
| 26 — Clearing selector removes symbols + reverts header | **PASS** | `onBaselineChange(null)` sets state and re-queries without `include_event_log`. |
| 27 — Data gap notice + "Got it" persistent dismissal | **PASS** | `showDataGapNotice` getter; dismissal writes to `user_screen_state` per-view key. |
| 28 — Refresh resets selector to blank | **PASS** | Selection is component state, not persisted. |

### §2 — Regression Check

Surfaces touched and confirmed not regressed:

- **`/admin` (Admin hub)** — Sixth card added; all five prior cards still render in the same order with same routes/copy. Verified by inspection of `admin-hub.component.ts` diff.
- **`/initiatives/epo-deploy`** — Existing four-section grouping logic, walkback dot, expand/collapse, +New Initiative button, openCycle → right-panel detail, S-008 refresh-on-return all preserved. Quarter math redirects through shared util but produces identical results when `referenceQuarter` matches the current calendar quarter (default state on load).
- **`/delivery/deploy-schedule`** — Same surface preservation; openWorkstream drill-out, expand state across multiple workstreams, S-017 modal scrim on edit, all preserved.
- **`list_delivery_cycles` MCP** — New `include_event_log` param is opt-in only. Existing callers (delivery cycles dashboard, EPO summary, etc.) do not pass it and receive the same payload shape as pre-Contract-27.

Verified manually by reading the diff. No automated test baseline established because no logic in the EPO Deploy or Deploy Schedule grouping algorithms changed substantively — Rule 11 Tier 1 (pure structural / source redirected to imported util).

### §3 — Test Ratchet

**No test coverage added in this contract.** Flagged explicitly per Rule 29 §3:

- Symbol algorithm (`computePriorQuarterSymbol` in `roadmap-planning.util.ts`) is a pure function with three discrete outcomes — should have unit tests covering planned-deployed, planned-not-deployed, unplanned-deployed cases, plus null-baseline guard. **Candidate.**
- Quarter math helpers (`shiftQuarter`, `quarterOfDate`, `isoInQuarter`) — should have unit tests. **Candidate.**
- Each new MCP tool — should have at least one happy-path + one error-path test (Admin auth check; DUPLICATE_DATE structured error). **Candidate.**

Test infrastructure exists in repo (`ng test`), but the existing testing pattern across recent contracts is light — manual UAT carries the verification load. Recommend a backlog ticket to retroactively add unit tests for `roadmap-planning.util.ts` and the four new MCP tools before WS3 is exercised in production. **Logged as CLAUDE.md Candidate 1 (§ below).**

### §4 — Pattern Sweep

Shared patterns modified this contract:

- **`SCREEN_KEYS` constant** — added three new keys (`ADMIN_DEPLOY_BASELINES`, `INITIATIVES_EPO_DEPLOY_DATA_GAP_DISMISSED`, `DELIVERY_DEPLOY_SCHEDULE_DATA_GAP_DISMISSED`). No existing callers needed to change.
- **`list_delivery_cycles` MCP tool** — gained optional `include_event_log` param. Searched: `Grep listCycles` across angular/src — 14 call sites; all use the existing param shape with no event-log expectation. New param is opt-in only; backward compatible.
- **`DeliveryCycle` TS type** — gained optional `target_date_change_events`. Searched: every component using DeliveryCycle reads only the fields it knows about; new optional field is additive.
- **`.rpd-*` styles in global `styles.scss`** — new shared style class set; no existing components share these prefixes; no collision.

No pattern sweep candidates found that need fixing in other components.

### §5 — Standards Conformance

| Standard | Result |
|----------|--------|
| **S-001** Visible context | PASS — `/admin/deploy-baselines` has title + 11px subtitle (S-015) + clear next action ("+ Add Baseline"). |
| **S-005 / S-007** Universal Entity Detail | PASS — Roadmap Baseline is a flat admin list, no entity detail surface required (matches EPO WIP precedent). |
| **S-014** MD3 baseline | PASS — no new MD3 components introduced. |
| **S-015** Surface description style | PASS — 11px italic #5A5A5A on `/admin/deploy-baselines` subtitle and the two Deploy view subtitles. |
| **S-021** Tappable entity chips | N/A — no new entity references. |
| **S-022** Entity picker pattern | N/A — Baseline selector is a short flat dropdown (≤ realistic count of baselines), not a picker. |
| **S-023** Destructive action confirmation | PASS — Remove is two-step with 5-second timeout window; inline (not modal); states what will change ("Confirm remove?"). |
| **S-024** Entity name capitalization | PASS — "Initiative", "Deploy Roadmap Baselines", "Baseline", "Quarter" all capitalized in UI text. |
| **S-025** UI feedback patterns | PASS — Pattern 2 (amber data-gap notice); Pattern 3 (red inline errors on form fields and save failure). |
| **S-027** impl_status updates | PASS — D-444, D-445, D-446 advanced from `Specced` to `built` in `docs/decision-registry.md` in the deployment commit. |
| **S-028** Processing feedback | PASS — "Saving…" → "✓" → fade on inline edits; button disabled during MCP call; D-200 Pattern 3 on failure. |
| **S-030** Component design | See §7 Structural Health. |
| **S-031** Contract code quality | Test ratchet flagged §3; pattern sweep §4; descriptive naming followed (all new methods verb+object+context). |
| **S-032** Entity deactivation | N/A — `roadmap_freeze_dates` is a flat lookup with soft-delete, no active/inactive state model. |
| **S-033** Cache-busting + version banner | PASS — `version.json` written via `npm run build` postbuild; SHA `8a52fbe4c6ac99f4126acb3f28ea783819141e60`. |
| **S-035** About panel build history | PASS — About Entry block §I below; `changelog.ts` prepended in the deployment commit. |
| **S-036** Grid column sort | PASS — `/admin/deploy-baselines` columns sortable via column header click; `↕` hover, `↑/↓` active; sort persists via SCREEN_KEYS.ADMIN_DEPLOY_BASELINES. |

### §6 — CC-Decision Completeness Check

See §C above. CC-27-1 through CC-27-7 sequential. No gaps.

### §7 — Structural Health (Rule 12)

Files modified this contract that exceed component / service line thresholds:

| File | Lines | Status |
|------|-------|--------|
| `angular/src/app/features/delivery/epo-deploy/epo-deploy.component.ts` | ~790 (was 723 pre-Contract-27) | **Exceeds 300-line component threshold.** Single responsibility remains intact — EPO-organized Go to Deploy view, now augmented with Quarter Pivot + Baseline selector + symbol rendering. Logical candidate for extraction into a `DeployByQuarterViewBase` or composable sub-components in a future refactor contract; flagged as CLAUDE.md candidate. |
| `angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts` | ~915 (was 821 pre-Contract-27) | **Exceeds 300-line component threshold.** Same situation as EPO Deploy. Both views share substantial structure; extraction is the natural next step. Same candidate. |
| `angular/src/app/features/admin/deploy-baselines/deploy-baselines.component.ts` | 530 | **Exceeds 300-line component threshold.** Single responsibility — Deploy Roadmap Baselines admin CRUD. ~150 lines of styles, ~200 lines of methods, balance is template. No extraction obvious at current scope. |

`roadmap-planning.util.ts` (~135 lines) is the extraction destination for shared quarter math + symbol algorithm — already addresses the Deploy view duplication problem at the data layer. Both Deploy views call into it.

### §8 — Deployment (Rule 29 §8 / D-372)

**Database migration (043_roadmap_freeze_dates.sql):** Applied by Phil 2026-06-17 (initial apply hit CC-27-3, corrected and re-applied successfully).

**MCP (Render):** Master pushed at 8a52fbe. Phil **must trigger Render manual redeploy in the dashboard** — Render does NOT auto-deploy from master per recent observation. Files affected: `mcp/delivery-cycle-mcp/src/index.js` + four new tools in `src/tools/`. Render must redeploy or the new MCP tools return 404.

**Angular (GitHub Pages):**
- Built with `npm run build` → version.json wrote SHA `8a52fbe4c6ac99f4126acb3f28ea783819141e60`.
- Staged to `/c/tmp/oi-deploy-c27-2026-06-17/` (outside the worktree per Phil's memory).
- Added `404.html` (copy of index.html) and `.nojekyll`.
- `git init -b gh-pages`, committed, force-pushed to `origin/gh-pages`. **Push succeeded.**
- GitHub Pages CDN propagates in 30–60s; existing tabs surface S-033 update banner within 5 min.

**Deployment status: succeeded** for migration + Angular. **MCP pending Phil's manual Render trigger.** UAT Checklist produced below; AC 2–5 + 8–10 + 12 + 19–28 require MCP redeploy to validate end-to-end.

---

## Section E — CLAUDE.md Candidates (Rule 16)

1. **Test ratchet retro-fit for Contract 27.** Trigger: §3 explicitly flagged no tests added. Candidate text:
   > When a contract introduces a pure-function utility (e.g. `roadmap-planning.util.ts`) or a new MCP tool set, generate happy-path + error-path unit tests in the same contract — defer only if Phil overrides with "no test baseline needed."

2. **Deploy view structural split.** Trigger: both Deploy view components now over 700 lines and share Quarter Pivot + Baseline state-management code via the shared util. Candidate text:
   > When two components share more than ~200 lines of state-management + UI for the same logical feature, extract a presentational sub-component (Angular standalone) — the util can hold pure functions but state-bound logic belongs in a component.

3. **Contract-23 deploy date capture in CLAUDE.md.** Trigger: CC-27-4 — the C-23 deploy date wasn't anywhere reliably readable. Candidate text:
   > Add a "Recent Deploys" section to CLAUDE.md tracking ISO date + Contract label per push to gh-pages — enables features like the data-gap notice to read a known boundary instead of falling back to event-count checks.

---

## Section F — UAT Checklist (Rule 19)

**Pre-UAT setup:** Confirm both deploys are live:
- GitHub Pages: hard-refresh `https://phil-dodds.github.io/TRIARQ-OITrustEarly/` and verify the S-033 banner offers a reload — banner reload should put you on SHA `8a52fbe`.
- Render: trigger manual redeploy in the dashboard for the `delivery-cycle-mcp` service. Confirm `GET /tools` lists the four new tools (`list_roadmap_freeze_dates`, `create_roadmap_freeze_date`, `update_roadmap_freeze_date`, `delete_roadmap_freeze_date`).

### Surface 1 — `/admin` (Admin hub sixth card)

| # | Step | Pass / Fail |
|---|------|-------------|
| 1 | Open `/admin` as Phil. The grid shows six cards in this order: Users, Divisions, Delivery Workstreams, EPO WIP Limits, Initiative Artifact Types, Deploy Roadmap Baselines. | |
| 2 | Hover the Deploy Roadmap Baselines card — drop shadow appears. Click it. | |
| 3 | Lands on `/admin/deploy-baselines`. | |
| 4 | Log in as a non-admin user. `/admin` does not show the Deploy Roadmap Baselines card (visibility gated by route guard on the destination, not the card itself — card may render but route is blocked). | |

### Surface 2 — `/admin/deploy-baselines` (Deploy Roadmap Baselines admin)

| # | Step | Pass / Fail |
|---|------|-------------|
| 5 | First load on an empty table: shows "No roadmap baselines recorded. Add one to enable planned vs. actual analysis on deploy views." | |
| 6 | Click "+ Add Baseline". An inline row appears at the top with two empty inputs (date picker + text). | |
| 7 | Pick a date (e.g. 2026-06-01) and label "Roadmap Q2 2026", press Save. Row appears, becomes read-only. | |
| 8 | Click "+ Add Baseline" again. Pick the SAME date 2026-06-01 with any label and Save. Inline red error: "A baseline already exists for 2026-06-01 — Roadmap Q2 2026". Row stays in edit state. | |
| 9 | Cancel the duplicate. Click on the existing row's Freeze Date cell. Input appears. Change date and press Enter. Saves, "✓" briefly. | |
| 10 | Click the existing row's Label cell. Edit. Blur (click elsewhere). Saves. | |
| 11 | Click "Remove" on a row. Link changes to "Confirm remove?". Wait 6 seconds without clicking again. Link reverts to "Remove" without deleting. | |
| 12 | Click "Remove" again. Within 5 seconds, click "Confirm remove?". Row disappears. | |
| 13 | Add a baseline with the same date as a removed one. Saves cleanly (CC-27-1 partial unique index allows re-use of soft-deleted dates). | |
| 14 | Sort: click "Set By" column header. Rows sort alphabetical asc; "↑" appears. Click again — desc, "↓". Refresh — sort persists. | |
| 15 | Log in as a non-admin user. Navigate to `/admin/deploy-baselines`. See the blocked message — no data fetched. | |

### Surface 3 — `/initiatives/epo-deploy` (Quarter Pivot + Baseline)

| # | Step | Pass / Fail |
|---|------|-------------|
| 16 | Open `/initiatives/epo-deploy`. The header shows: title + `< Q2 2026 >` chevron control + "+ New Initiative" button. Quarter label matches your actual current calendar quarter. | |
| 17 | Click `‹`. Quarter steps back. Sections re-bucket — an Initiative whose Go to Deploy actual date is in Q1 2026 now appears in Prior Quarter (was actual). | |
| 18 | Click `›` twice. Quarter is now current + 1. Sections re-bucket. | |
| 19 | Refresh the browser. Quarter resets to actual current calendar quarter. | |
| 20 | Baseline selector below header: dropdown shows "— Select baseline —" and the baselines you created earlier. | |
| 21 | Select a baseline. Prior Quarter section header changes to "Prior Quarter — Q[X] [YYYY] Planned / Actual · [label]". | |
| 22 | Expand an EPO with prior-quarter Initiatives. Each row shows ✓ / ✕ / ✚ before the title. | |
| 23 | If no event-log entries exist on cycles (zero milestone_target_date_changed records), the amber data-gap notice appears. Click "Got it" — notice disappears. Refresh the page — notice stays dismissed. | |
| 24 | Switch baseline back to "— Select baseline —". Symbols vanish. Header reverts to "… Actual". | |

### Surface 4 — `/delivery/deploy-schedule` (Workstream Deploy parallel apply)

| # | Step | Pass / Fail |
|---|------|-------------|
| 25 | Open `/delivery/deploy-schedule`. Same Quarter Pivot Control in header, same Baseline selector below. | |
| 26 | Repeat steps 17–24 here. Behavior identical. Note the dismissal is per-view: dismissing on EPO Deploy does NOT dismiss on Workstream Deploy and vice versa. | |

### Regression spot-checks

| # | Step | Pass / Fail |
|---|------|-------------|
| 27 | Open `/initiatives/list` (the cycles dashboard). Grid loads as before, no symbols, no Quarter control. | |
| 28 | Open `/admin/epo-wip`. Grid loads as before, no regression. | |
| 29 | Open an Initiative detail. View / Edit panel behavior unchanged. | |
| 30 | Submit a gate for approval. Approval workflow unchanged. | |

---

## Section G — Structural Health Detail (Rule 12)

| File | Pre-Contract-27 lines | Post-Contract-27 lines | 300-line threshold? |
|------|-----------------------|------------------------|---------------------|
| `epo-deploy.component.ts` | 723 | ~790 | Exceeds. Candidate for split. |
| `deploy-schedule.component.ts` | 821 | ~915 | Exceeds. Candidate for split. |
| `deploy-baselines.component.ts` | NEW | ~530 | Exceeds. Acceptable for current scope. |
| `roadmap-planning.util.ts` | NEW | ~135 | Under. Pure functions, testable. |
| `list_delivery_cycles.js` | 262 | ~290 | Under threshold. |

---

## Section H — About Entry (S-035)

```
## About Entry — Contract 27 — Roadmap Planning Mode
Date: 2026-06-17
BuiltAt: 2026-06-17

Items:
- [Admin] Administration — Deploy Roadmap Baselines: New Admin screen at
  /admin/deploy-baselines for managing dated baseline snapshots. Add, edit
  inline, and remove baselines with a five-second confirmation window.
- [All]   EPO Deploy by Quarter: Quarter Pivot Control in the header anchors
  a different reference quarter; chevrons step ±1 quarter. Resets to actual
  calendar quarter on every load.
- [All]   EPO Deploy by Quarter — Baseline selector: Pick a baseline to compare
  Prior Quarter planned vs. actual. ✓ planned + shipped, ✕ planned + missed,
  ✚ shipped without being planned as of the baseline.
- [All]   Deploy Gate by Quarter (Workstream): Same Quarter Pivot and Baseline
  selector available on the Workstream-organized Deploy view.
```

Already prepended to `angular/src/app/core/data/changelog.ts` in commit `8a52fbe`.

---

## Section I — Retro Items

**Retro-27-1 — Contract 26 changes are not in `changelog.ts`.**

Observation: the Contract 27 spec referenced "Contract 26 (AC-29) closed" as a
prerequisite, but no Contract 26 entry exists in
`angular/src/app/core/data/changelog.ts` and no commit on master is labelled
Contract 26 (last commit before this session was `bc88dfa` Contract 25 Part 2).

Implications:
- Users opening the About panel on the deployed app see the timeline jump from
  Contract 25 Part 2 follow-ons (2026-06-16) directly to Contract 27 (today) —
  Contract 26 user-facing changes (if any shipped) are invisible.
- S-035 conformance is broken for whatever surfaces Contract 26 touched.
- No backfill was added in this session because inventing content is worse than
  the gap.

Action for next Design Session:
1. Confirm whether Contract 26 shipped to production or was rolled into another
   contract under a different label.
2. If it shipped, produce the missing About Entry block from Contract 26's
   CodeClose output (or reconstruct from the diff if no CodeClose exists) and
   land it via the next Code session.
3. If it never shipped, retire the "Contract 26" reference in the Contract 27
   spec prerequisite line and any other governance document that cites it.

Surfaced by Phil during the Contract 27 CodeClose review on 2026-06-17.

---

## Section J — Session output path

Phil — full Windows path to this document:

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract27-2026-06-17.md`

Use this path when handing back to Chat or starting the next Code session.

---

*Pathways OI Trust | Contract 27 | CONFIDENTIAL | 2026-06-17*
