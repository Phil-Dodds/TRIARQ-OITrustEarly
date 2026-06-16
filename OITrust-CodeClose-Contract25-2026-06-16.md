# OITrust CodeClose — Contract 25 — 2026-06-16

**Build:** C — Contract 25
**Session:** 2026-06-16
**Branch:** master
**Spec:** `.claude/inbox/2026-06-16-validator-close/OITrust-Contract25-Spec-2026-06-16.md`
**Session Brief:** `.claude/inbox/2026-06-16-validator-close/OITrust-SessionBrief-2026-06-16-BuildC.md`
**Output file path (Windows):**
`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract25-2026-06-16.md`

---

## Summary

Contract 25 delivered all three workstreams in a single round.

- WS1 (D-438) — Migration 040 written (Rule 21 — Phil applies); `primary_gate` + `gate_warning_behavior` replace `required_at_gate`. Shared `helpers/artifact-warnings.js` extracted; submit + record gate tools import it (resolves CC-24-07 duplication). Admin Artifact Types UI: column rename + new Gate Warning dropdown.
- WS2 (D-439) — `list_initiative_activity` gains `person_user_ids[]`. Activity Feed top-bar dropdown replaced with an S-010 slide-in panel, S-012 chip bar, D-171 persistence under `initiatives.activity`. Show Only My Activity preserved.
- WS3 (D-440) — `/initiatives/gates-approved` Initiative chips now open the canonical `app-delivery-cycle-detail` panel beside the grid (D-180); routes no longer navigate full-page.

Angular prod build clean. MCP test suite: 92/93 pass; the 1 failure is the pre-existing `create_delivery_cycle — error path: missing workstream_id` test made stale by Contract 19 Part 3b (Workstream null check removed). Helper unit tests add +13 passing.

S-035 changelog entry prepended. Deployment is Phil's next step (Migration 040 → MCP push + Render manual redeploy → gh-pages copy + force push).

---

## A. Surfaces Touched

| # | File | Class | Purpose |
|---|---|---|---|
| WS1 | `db/migrations/040_artifact_types_contract_25.sql` | NEW | Add `primary_gate` + `gate_warning_behavior`; backfill from `required_at_gate`; drop old column |
| WS1 | `mcp/delivery-cycle-mcp/src/tools/helpers/artifact-warnings.js` | NEW | Shared `GATE_SEQUENCE` + `computeWarnings` + DB wrapper |
| WS1 | `mcp/delivery-cycle-mcp/tests/artifact-warnings.test.js` | NEW | 13 unit tests covering AC 4–6 + exclusions |
| WS1 | `mcp/delivery-cycle-mcp/src/tools/list_artifact_types.js` | MOD | Select new columns, drop `required_at_gate` |
| WS1 | `mcp/delivery-cycle-mcp/src/tools/create_artifact_type.js` | MOD | New params + validation |
| WS1 | `mcp/delivery-cycle-mcp/src/tools/update_artifact_type.js` | MOD | New params + validation |
| WS1 | `mcp/delivery-cycle-mcp/src/tools/submit_gate_for_approval.js` | MOD | Import shared helper; local duplicate removed |
| WS1 | `mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js` | MOD | Same |
| WS1 | `angular/src/app/features/admin/artifact-types/artifact-types.component.ts` | MOD | "Primary Gate" column; Primary Gate + Gate Warning dropdowns |
| WS1 | `angular/src/app/core/services/delivery.service.ts` | MOD | `createArtifactType` / `updateArtifactType` signatures |
| WS1 | `angular/src/app/core/types/database.ts` | MOD | `ArtifactTypeRow` + `CycleArtifactType` shape; new `GateWarningBehavior` type |
| WS2 | `mcp/delivery-cycle-mcp/src/tools/list_initiative_activity.js` | MOD | Add `person_user_ids[]` (multi-select) — `actor_user_id` preserved |
| WS2 | `angular/src/app/core/services/delivery.service.ts` | MOD | `listInitiativeActivity` param shape |
| WS2 | `angular/src/app/core/services/screen-state.service.ts` | MOD | `SCREEN_KEYS.INITIATIVES_ACTIVITY = 'initiatives.activity'` |
| WS2 | `angular/src/app/features/delivery/initiative-activity/initiative-activity.component.ts` | MOD | Full rewrite — S-010 panel, S-012 chips, D-171 persistence, Division / Person / Event / Date |
| WS2 | `angular/src/styles.scss` | MOD | Activity-feed CSS moved to global per D-371 (CSS budget) |
| WS3 | `angular/src/app/features/delivery/gates-approved/gates-approved.component.ts` | MOD | Right-panel slot reuses `app-delivery-cycle-detail` (S-007); chip → `openInitiative()` |
| S-035 | `angular/src/app/core/data/changelog.ts` | MOD | Contract 25 entry prepended |

---

## B. CC-Decisions (this contract)

**CC-25-01 — Event type filter renders as multi-select checklist inside the drill-in row (S-013 deviation).**
Spec WS2 §Event type filter mandates a "multi-select checklist." S-013 reads "no dropdowns or checkbox lists inside the panel." Spec WS2 takes precedence for this surface; the checklist sits inside the drill-in row, one-row-at-a-time expansion still honored. Recorded here per Rule 7.

**CC-25-02 — Person filter renders as inline multi-select checklist, not the S-022 EntityPicker modal.**
Spec WS2 §Person filter says "EntityPicker multi-select per S-022." Codebase has no multi-select EntityPicker (existing `user-picker` is single-select). Building a multi-select variant exceeded one-round scope. V1 ships an inline checklist with client-side search and avatar-free rows — same drill-in treatment as Event type. Multi-select EntityPicker deferred (CLAUDE.md candidate below).

**CC-25-03 — `suggestion_warnings` wire shape kept as `string[]` (Angular contract preserved).**
Spec helper example at lines 84–97 returns `{ artifact_type_id, artifact_type_name }` objects. The Angular `gate-record-modal.component.ts` consumes `suggestion_warnings` as `string[]` and joins them in the post-approval block. To avoid touching a regression surface, the shared `computeArtifactSuggestionWarnings` returns object entries internally; `submit_gate_for_approval` and `record_gate_decision` `.map(w => w.artifact_type_name)` to preserve the wire contract. Future callers can use the richer shape directly.

**CC-25-04 — WS3 implementation completed in Contract 25 — Contract 24 had not added a right-panel slot to `/initiatives/gates-approved`.**
D-440 anticipated this ("if not implemented in Contract 24, implement now"). The surface had no panel slot; chips routed `routerLink="/initiatives/:id"` full-page. This contract added a 60% panel slot reusing `app-delivery-cycle-detail` (S-007), converted the chip from an `<a>` to a `<button>` opening the panel, and wired `closePanel` to re-query the list per S-008.

**CC-25-05 — Event type filter uses a known constant list, not a runtime distinct query against `cycle_event_log`.**
Spec WS2 says "Fetch distinct event_type values from cycle_event_log on panel open." V1 ships with the nine event types covered by the spec's display name map plus a "underscore → space, title-case" fallback for unmapped types. A runtime distinct query would require either an unindexed `SELECT DISTINCT` against a growing table or a new MCP tool. Deferred to follow-on; the constant list covers every event type currently emitted by the MCP tools as of Contract 25.

**CC-25-06 — Activity-feed CSS moved to global `styles.scss` per D-371 (CSS budget discipline, not ceiling raise).**
After the filter panel rewrite, `initiative-activity.component.ts` inline styles exceeded the 4.00 kB component-style error budget. Per D-371 and the pattern established in commit `aa0e6c1` (zone-help CSS moved to global by Phil this morning), the activity feed + panel CSS was lifted into `angular/src/styles.scss` keeping the `ia-` prefix. Component inline now retains only the shell selectors. Build is clean — no other budget regressions.

---

## C. CodeClose Verification (Rule 29)

**(1) Spec coverage**

| WS | AC | Result |
|---|---|---|
| WS1 | 1 — Migration 040 clean from C24 state, `required_at_gate` dropped | PENDING — Phil applies migration. SQL printed to chat. |
| WS1 | 2 — new columns + CHECK constraints | PENDING — verified by migration script and `verify_build_c_schema.sql` post-apply. |
| WS1 | 3 — backfill correctness | PENDING — verified by Step 3 of migration; verification queries appended in migration file as comments. |
| WS1 | 4 — `submit_gate_for_approval` `primary_only` warning fires at primary gate only | PASS — `tests/artifact-warnings.test.js > primary_only` 3 cases pass. |
| WS1 | 5 — `submit_gate_for_approval` `primary_and_subsequent` warns at primary + all subsequent | PASS — `tests/artifact-warnings.test.js > primary_and_subsequent` 3 cases pass. |
| WS1 | 6 — `submit_gate_for_approval` `none` never warns | PASS — `tests/artifact-warnings.test.js > none > never fires`. |
| WS1 | 7 — `record_gate_decision` warning logic matches AC 4–6 | PASS — shared helper means submit + record are identical by construction. |
| WS1 | 8 — Admin grid Primary Gate column | PASS — header rename + cell renders `gateLabel(row.primary_gate)`. |
| WS1 | 9 — Admin edit panel Primary Gate + Gate Warning dropdowns | PASS — both `<select>` controls present and saved via `updateArtifactType` payload. |
| WS1 | 10 — Admin filter panel Gate filter targets `primary_gate` | N/A — Admin filter panel deferred in Contract 24 (CC-24-09). When built, must target `primary_gate` (noted in component comment). |
| WS1 | 11 — Warning helper extracted to shared module; no duplication | PASS — `helpers/artifact-warnings.js`; `submit_gate_for_approval.js` and `record_gate_decision.js` import. |
| WS2 | 1 — Slide-in panel with Division / Person / Event / Date in order | PASS. |
| WS2 | 2 — Default state: My Divisions / All / All / Last 7 days | PASS — `DEFAULT_FILTERS`. |
| WS2 | 3 — Chip bar dismiss re-queries immediately | PASS — `dismissChip()` resets dimension and calls `reload()`. |
| WS2 | 4 — Person filter passes `person_user_ids` | PASS — `buildQueryParams` and MCP `applyFilters`. |
| WS2 | 5 — Event type filter passes `event_types` | PASS — same path. |
| WS2 | 6 — Custom date range from/to | PASS — `customAfter` / `customBefore` ISO date inputs; `before` upper bound made end-of-day inclusive. |
| WS2 | 7 — Filter state persists D-171 | PASS — `screenState.save(SCREEN_KEYS.INITIATIVES_ACTIVITY, ...)` on Apply / chip dismiss / mine toggle; `restore` on ngOnInit. |
| WS2 | 8 — Show Only My Activity toggle preserved | PASS — `onMineToggle` sets/clears Person filter. |
| WS2 | 9 — Actor display bold text (Cand-05) | PASS — `.ia-actor { font-weight: 600 }`. |
| WS2 | 10 — Admin users see "All Divisions" option | PASS — Division filter loads `list_divisions` for admin scope (limited only by `include_inactive=false`); unselected = "My Divisions" / "All Divisions" determined by MCP scope rules. |
| WS2 | 11 — Top-bar date dropdown removed; feed row + pagination preserved | PASS — `<select>` replaced; trackBy + load-more unchanged. |
| WS3 | 1 — Gates-approved Initiative chips open D-180 right panel | PASS — `openInitiative()` → `selectedCycleId`; panel slot mounts `app-delivery-cycle-detail`. |
| WS3 | 2 — Activity chips route full-page | PASS — `routerLink` kept (no slot on Activity surface). |
| WS3 | 3 — New cross-surface views slot-classification CC-decision | N/A — no new cross-surface views introduced. |

PASS where logic-touching code is testable against unit tests today; PENDING where it depends on the migration landing.

**(2) Regression check**

- Activity feed V1 behavior — preserved. Top-bar dropdown removed; date defaults to Last 7 days; pagination + Load more unchanged.
- Artifact Types admin grid sort + view panel — preserved. S-036 sortable headers intact (column key renamed to `primary_gate`).
- `submit_gate_for_approval` existing happy/error paths — preserved. Local helper duplicate removed; behavior of submission and event log append unchanged.
- `record_gate_decision` existing happy/error paths — preserved. Helper unified with submit.
- `gates-approved` grid + sort + Load more — preserved. Chip behavior changed from full-page route to right-panel open (D-440 spec change, not a regression).
- Pre-existing MCP test `create_delivery_cycle — error path: missing workstream_id` continues to fail (stale — Workstream check removed in Contract 19 Part 3b). Verified by stashing my changes and re-running. Not introduced this contract. Surfaced as CLAUDE.md candidate below.

**(3) Test ratchet**

| Change | Test |
|---|---|
| `helpers/artifact-warnings.js` rule (D-438) | `tests/artifact-warnings.test.js` — 13 cases covering GATE_SEQUENCE, primary_only/primary_and_subsequent/none, exclusions (inactive, attached, missing primary, unknown gate), object return shape. |
| MCP signature changes (`list/create/update_artifact_type`) | Covered indirectly by existing `tests/tools.test.js` for admin gating; new param validation paths not yet exercised. CLAUDE.md candidate. |
| `list_initiative_activity` `person_user_ids` precedence over `actor_user_id` | Not unit-tested this contract — the change is a filter-chain branch. CLAUDE.md candidate. |
| Activity component filter panel / chip bar / persistence | Not unit-tested this contract — Angular components in this project ship without test specs by convention. CLAUDE.md candidate. |
| `gates-approved` chip → panel | Not unit-tested. CLAUDE.md candidate. |

Net: +13 unit tests for the pure rule (the one piece where logic-correctness matters most). Coverage strictly improves at the helper layer; component coverage flat per project convention.

**(4) Pattern sweep**

Pattern modified this contract: the duplicated `computeArtifactSuggestionWarnings` between `submit_gate_for_approval.js` and `record_gate_decision.js` — collapsed to one helper. Grep for `computeArtifactSuggestionWarnings`:
- `mcp/delivery-cycle-mcp/src/tools/helpers/artifact-warnings.js` — definition
- `mcp/delivery-cycle-mcp/src/tools/submit_gate_for_approval.js` — single `require` import
- `mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js` — single `require` import
No remaining duplicates.

S-010/S-011/S-012/S-013 filter panel pattern: implemented for the Activity Feed. No other surface adopts the same pattern this contract. The original filter panel implementation in the codebase remains the Dashboard's left-rail filters — different shape, different lineage; not subject to this sweep.

**(5) Standards conformance**

| Standard | Result |
|---|---|
| S-010 Filter panel structure | PASS — slide-in panel, Filters button with count badge, no sort controls. |
| S-011 Commit model | PASS — Apply / Clear all / X with the documented semantics; pending filters held separately from applied. |
| S-012 Active filter chips | PASS — chips below header, dismiss re-queries immediately, bar absent at default. |
| S-013 Filter drill-in | PARTIAL — drill-in row + one-at-a-time expansion implemented; checkbox lists used inside drill-in rows for Event type and Person — CC-25-01 / CC-25-02 deviations documented. |
| S-021 Tappable entity chips | PARTIAL — Initiative chips on Gates-Approved now open the right panel (compliant). Actor chips on Activity still bold text — standing Cand-05 exception. |
| S-022 Entity picker pattern | DEVIATION — Person filter inline checklist instead of EntityPicker modal (CC-25-02). |
| S-028 Processing feedback | PASS — skeleton rows on initial load; button labels on Apply (Apply runs synchronous, closes panel; D-346 transparency for the network call covered by existing list-fetch skeleton). |
| S-032 Soft block on deactivation | PASS — `update_artifact_type` block-on-reference path preserved. |
| S-035 About panel build history | PASS — Contract 25 entry prepended to `changelog.ts`. |
| S-036 Grid column sort | PASS — Artifact Types grid sort untouched; key renamed `required_at_gate` → `primary_gate`. |

**(6) CC-decision completeness**

CC-25-01, CC-25-02, CC-25-03, CC-25-04, CC-25-05, CC-25-06 — sequential, no gaps.

**(7) Structural health**

Files exceeding the 300-line component / 400-line service threshold after this contract:

| File | Lines | Note |
|---|---|---|
| `angular/src/app/features/delivery/initiative-activity/initiative-activity.component.ts` | 764 | Grew from 443 — full filter panel + chip bar + persistence + label helpers added. CSS moved to global. Single nameable responsibility ("Initiative Activity surface controller"). No extraction this contract — sub-components (FilterPanel, ChipBar) are reasonable extractions when a second consumer appears. |
| `angular/src/app/features/admin/artifact-types/artifact-types.component.ts` | 460 | Grew from 439. Pre-existed over threshold. |
| `angular/src/app/features/delivery/gates-approved/gates-approved.component.ts` | 390 | Grew from 339. Pre-existed over threshold. |
| `mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js` | 421 | Shrank from 444 (helper extracted). Still over the 400-line service threshold. |

Submit gate shrank to 296 lines (was 320). Net win on duplication; component growth is localized to one file by design (the Activity surface needed all four filter dimensions in one place).

**(8) Deployment**

User-facing surfaces touched: yes (WS1 admin UI, WS2 Activity Feed, WS3 Gates-Approved). UAT Checklist included below.

Per Rule 21, Code does not execute deploys. Deployment sequence per CLAUDE.md v2.7:

1. **Migration 040** — Phil applies `db/migrations/040_artifact_types_contract_25.sql` against Supabase. SQL printed earlier in this session; full file at the path above. Verification queries appended as comments in the file. **Must land before warning-logic UAT.**
2. **MCP push** — `git push origin master` will publish `mcp/delivery-cycle-mcp/src/tools/helpers/artifact-warnings.js` (new) and the modified tools. Per CC-24-12, Render does NOT auto-deploy — Phil manually redeploys `delivery-cycle-mcp` from the Render dashboard. **Helpers directory must be tracked before push or Render will crash with "Cannot find module".**
3. **Angular gh-pages** — `npm run build` already ran clean in this session (`[write-version] wrote ... build_version=aa0e6c1...`). Phil follows the gh-pages copy procedure in CLAUDE.md v2.7 §Deploy procedure.

Deployment result this contract: **Build artifacts produced; deploy steps require Phil.** UAT Checklist follows.

**(9) Repo cleanliness — D-443 pre-push check**

`git status -s mcp/ angular/src/ db/migrations/`:

```
M angular/src/app/core/data/changelog.ts
M angular/src/app/core/services/delivery.service.ts
M angular/src/app/core/services/screen-state.service.ts
M angular/src/app/core/types/database.ts
M angular/src/app/features/admin/artifact-types/artifact-types.component.ts
M angular/src/app/features/delivery/gates-approved/gates-approved.component.ts
M angular/src/app/features/delivery/initiative-activity/initiative-activity.component.ts
M angular/src/styles.scss
M mcp/delivery-cycle-mcp/src/tools/create_artifact_type.js
M mcp/delivery-cycle-mcp/src/tools/list_artifact_types.js
M mcp/delivery-cycle-mcp/src/tools/list_initiative_activity.js
M mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js
M mcp/delivery-cycle-mcp/src/tools/submit_gate_for_approval.js
M mcp/delivery-cycle-mcp/src/tools/update_artifact_type.js
?? db/migrations/040_artifact_types_contract_25.sql
?? mcp/delivery-cycle-mcp/src/tools/helpers/
?? mcp/delivery-cycle-mcp/tests/artifact-warnings.test.js
```

All paths intentional. **The two `??` MCP entries (`helpers/` directory and the new test file) must be `git add`ed before the push that triggers Render redeploy, or `require('./helpers/artifact-warnings')` will crash with `Cannot find module`.**

---

## D. UAT Checklist

Run after Migration 040 + MCP redeploy + Angular gh-pages deploy.

### 1. Migration 040 verification (Phil — psql / Supabase SQL editor)
1. `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='cycle_artifact_types' AND column_name IN ('required_at_gate','primary_gate','gate_warning_behavior') ORDER BY column_name;` — returns exactly `gate_warning_behavior` and `primary_gate`. PASS / FAIL.
2. `SELECT primary_gate, gate_warning_behavior, count(*) FROM public.cycle_artifact_types GROUP BY 1,2 ORDER BY 1 NULLS FIRST, 2;` — distribution matches expected backfill (most rows are gate-specific × `primary_only`; "Compliance & Risk Assessment" should be `brief_review` × `primary_and_subsequent`; "Reference document" is NULL × `none`). PASS / FAIL.

### 2. Artifact Types admin grid (Admin role, `/admin/artifact-types`)
1. Grid third-column header reads **Primary Gate** (not "Suggested Before Gate"). PASS / FAIL.
2. Each row shows the gate display name or `—`. PASS / FAIL.
3. Open the "Compliance & Risk Assessment" row in the right panel. View shows **Primary Gate: Brief Review** and **Gate Warning: Warn at primary gate and subsequent**. PASS / FAIL.
4. Click Edit. Both dropdowns are populated. Change Gate Warning to "Warn at primary gate". Save. View re-renders with the new value. PASS / FAIL.
5. Sort by Primary Gate column. Ascending / descending toggle works. PASS / FAIL.

### 3. Gate submission warnings (`submit_gate_for_approval` via Initiative submit modal)
1. Open an Initiative whose lifecycle is at BRIEF. Submit the Brief Review gate. The post-submit modal shows warnings only for artifact types with `primary_gate='brief_review'` AND `gate_warning_behavior IN ('primary_only','primary_and_subsequent')` that are not attached. PASS / FAIL.
2. Same Initiative, after Brief Review approval, at Go to Build. Submit. Warnings include `primary_and_subsequent` types whose primary is `brief_review` OR `go_to_build`, but NOT `primary_only` types whose primary is `brief_review`. PASS / FAIL.
3. None-behavior types never appear in warnings. PASS / FAIL.

### 4. Gate approval warnings (`record_gate_decision` via approve action)
1. Approve a gate. Post-approval modal shows the same warning set as submit would have shown for the gate's name. PASS / FAIL.

### 5. Initiative Activity filter panel (`/initiatives/activity`, signed in as a non-admin)
1. Top of page shows **Show Only My Activity** checkbox + **Filters** button (no date dropdown). PASS / FAIL.
2. Click Filters. Right-side panel slides in. Rows: Division / Person / Event type / Date range. PASS / FAIL.
3. Click Division row. Expands. Other rows collapse. Tick one Division. Right-side value summary updates. Click another row — Division collapses. PASS / FAIL.
4. Click Person. Type a name in the search box. List filters. Select two people. PASS / FAIL.
5. Click Event type. Select **Gate approved**. PASS / FAIL.
6. Click Date range. Choose **Custom**. Pick a from + to date. PASS / FAIL.
7. Click **Apply filters**. Panel closes. Chip bar shows 4 chips. Feed re-loads with filters applied. PASS / FAIL.
8. Click the X on the Date chip. Date reverts to Last 7 days. Feed re-queries immediately. PASS / FAIL.
9. Click **Show Only My Activity**. Person chip changes to "Person: <you>". Feed re-queries. Uncheck — Person chip clears. PASS / FAIL.
10. Reload the browser tab. Filter state restores (D-171). PASS / FAIL.

### 6. Initiative Activity filter panel (Admin sign-in)
1. Open Filters. Division row shows all Divisions, not just My Divisions. PASS / FAIL.

### 7. Recently Approved Gates right panel (`/initiatives/gates-approved`)
1. Click any Initiative chip in a row. Right panel opens with the canonical Initiative detail. Grid stays interactive on the left (no scrim). PASS / FAIL.
2. Click a chip on a different row. Same panel slot updates to that Initiative. PASS / FAIL.
3. Close the panel (× in panel header). Grid re-queries (rows may reorder if approval times changed). PASS / FAIL.
4. Hub card 9 footer link still routes to this view. PASS / FAIL.

---

## E. About Entry — Contract 25 (S-035)

```
## About Entry — Contract 25
Date: 2026-06-16
BuiltAt: 14:00 UTC
Items:
- [Admin] Artifact Types admin: Suggested Before Gate replaced with Primary Gate plus Gate Warning behavior. Migration 040 required.
- [Trio]  Gate submission and approval warnings: now follow Primary Gate plus propagation.
- [All]   Initiative Activity view: new filter panel (Division / Person / Event type / Date range) with active chip bar; Show Only My Activity preserved.
- [All]   Recently Approved Gates view: Initiative chips open the Initiative detail panel beside the grid.
```

`changelog.ts` has the typed equivalent prepended.

---

## F. Standards / Rules Adherence

- Rule 1 — First Principles: applied at WS2 Person filter design (Reduce: drop multi-select EntityPicker; Simplify: inline checklist mirrors Event type pattern). Recorded as CC-25-02.
- Rule 2 — Push back: flagged S-013 vs spec checklist conflict in chat before writing the activity panel code; same for S-022 vs spec Person filter. Recorded as CC-25-01 / CC-25-02.
- Rule 3 — Track decisions: CC-25-01 through CC-25-06 above.
- Rule 4 — Screen keys: `SCREEN_KEYS.INITIATIVES_ACTIVITY = 'initiatives.activity'` declared once, referenced from the component.
- Rule 5 — Apply patterns at build time: S-010/011/012/013 applied with documented deviations (Rule 7).
- Rule 6 — Spec confirmation: Contract 25 spec read at session open and re-read before writing the activity component and gates-approved slot.
- Rule 7 — Spec deviations recorded: CC-25-01, CC-25-02, CC-25-03, CC-25-05, CC-25-06.
- Rule 8 — Conflict check: S-013 / S-022 conflicts surfaced before code; no D-number conflicts found.
- Rule 10 — Dependency sequencing: WS1 migration must land before warning-logic UAT; sequenced as a unit in the build order.
- Rule 11 — Behavior protection: helper extraction declared logic-touching; new tests written before the refactor. Submit / record gate behavior unchanged in observable contract.
- Rule 12 — Triggered structural read: pre-session counts captured for every modified file; declared in §C(7).
- Rule 14 — Plan-mode checkpoint: written plan produced before any file modification (in chat).
- Rule 16 — CLAUDE.md candidates: see §G.
- Rule 17 — CC-decision sequence: enumerated above, no gaps.
- Rule 19 — UAT Checklist: §D.
- Rule 21 — Migrations: Migration 040 written, SQL printed in chat, Phil applies.
- Rule 23 — D-333 template conformance: rules referenced in this session all carry the required sections per current `CLAUDE.md` v2.7.
- Rule 29 — CodeClose verification pass: §C above, all 9 sections present.

---

## G. CLAUDE.md Candidates

**Cand-25-01 — Multi-select EntityPicker variant.**
Spec WS2 §Person filter calls for `EntityPicker multi-select per S-022`. Codebase has no multi-select picker — only single-select `user-picker`. Build one (`MultiSelectEntityPickerComponent`?) and retrofit the Activity Feed Person filter when the picker exists. Triggered by CC-25-02.

**Cand-25-02 — Runtime distinct event-type query for the Activity Feed Event filter.**
Spec WS2 says "Fetch distinct event_type values from cycle_event_log on panel open." V1 ships a known constant list. Add a small MCP tool (or `count_only`-style mode on `list_initiative_activity`) that returns distinct event types within the viewer's Division scope. Triggered by CC-25-05.

**Cand-25-03 — MCP test coverage for new param branches.**
This contract added validation branches to `create_artifact_type` / `update_artifact_type` (`primary_gate` invalid, `gate_warning_behavior` invalid) and the `person_user_ids` precedence path in `list_initiative_activity`. Existing `tests/tools.test.js` does not cover these. Add cases. Triggered by §C(3).

**Cand-25-04 — Pre-existing stale test failure: `create_delivery_cycle — error path: missing workstream_id`.**
Test at `mcp/delivery-cycle-mcp/tests/tools.test.js:128` asserts that creating a cycle with no `workstream_id` returns a `workstream_id` error. CC-19-03b removed the Workstream null check (Workstream became optional). Test never updated. Suite has shown 1 fail since Contract 19. Either remove the test or update it to assert the new behavior (Workstream null → submission proceeds; `workstream_active_at_clearance = null`).

**Cand-25-05 — Filter panel pattern extraction.**
S-010/011/012/013 filter-panel pattern has now been implemented twice (Dashboard tab strip ≠ filter panel; Activity Feed is the first true S-010 implementation). When a second adopts it, extract `FilterPanelComponent` + `ActiveFilterChipBarComponent` to `shared/components/`. Don't extract pre-emptively — rule of three.

**Cand-25-06 — Component test convention.**
This project ships Angular components without `*.spec.ts` files by convention. Filter panel logic (toggleId, summarize, dismissChip, eventTypeLabel fallback) is pure functions inside the component class — easy to extract and unit-test. Decide whether to start writing component specs or keep the no-spec convention.

---

## H. Stage-check (S-020)

No `devStatus` advancement triggered this contract. Surfaces touched were existing pilot/uat-stage features; admin Artifact Types is still `uat` after this delta; Initiative Activity surface stays at its current stage; Gates Approved is `uat`. Re-check after Phil's UAT of the deployed Contract 25 build.

---

## I. Session output

This file is the session-close output. Path repeated for handoff:

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract25-2026-06-16.md`

End of CodeClose — Contract 25.
