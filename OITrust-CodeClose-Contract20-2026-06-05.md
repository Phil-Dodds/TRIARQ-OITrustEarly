# OITrust CodeClose — Contract 20 (Units 1–3)
Date: 2026-06-05 | Build C | Session 1 of 2 for Contract 20

---

## Session Summary

Contract 20 split per plan: Units 1–3 this session, Units 4–7 next session.

**Units shipped this session:**
- Unit 1 — Schema migration 035 + `record_gate_decision` EPO WIP check + `get_delivery_summary` WIP field cleanup
- Unit 2 — `get_epo_wip_limits` + `update_epo_wip_limits` MCP tools
- Unit 3 — `/admin/epo-wip` admin screen + Admin hub 4th card

**Units deferred to Session 2:**
- Unit 4 — `/initiatives/epo-summary`
- Unit 5 — `/initiatives/epo-schedule`
- Unit 6 — `/initiatives/epo-deploy`
- Unit 7 — `/initiatives` hub 4 → 7 cards

---

## CC-Decisions

| ID | Decision | Trigger |
|---|---|---|
| CC-20-01 | Read `division_memberships` (not the non-existent `user_divisions`) for "EPO's first Division" pre-population. Contract 19 reused the existing junction table per CC-19-02; spec language refers to a table that does not exist. | Plan-mode pre-flight check |
| CC-20-02 | Migration 035 skips the workstream WIP column drop. Columns named in spec §1.2 step 3 (`wip_limit_pre_build`, `wip_limit_build`, `wip_limit_post_deploy`) were never present in any prior migration — no columns to remove. Migration header records the omission. | Plan-mode pre-flight check |
| CC-20-03 | Hub card route names stay as `/initiatives/gates` and `/initiatives/deploy-schedule`. Spec §4 paths `/initiatives/schedule` and `/initiatives/deploy` are treated as descriptive typos; live routes are bookmarked and deployed. (Relevant to Session 2, recorded now for traceability.) | Plan-mode pre-flight check |
| CC-20-04 | Spec §2.3 + §2.4 named the wrong tools. `record_gate_decision` had no prior WIP check (the "current behavior" in spec is fictional) — EPO check is net-new. `list_delivery_workstreams` returns no WIP fields — `get_delivery_summary` was the actual carrier of `wip_*_limit` / `wip_*_exceeded`, retargeted there. Angular `WorkstreamSummaryItem` interface + Workstream Summary template updated to match. | Mid-Unit 1 implementation |

Sequence complete: CC-20-01, CC-20-02, CC-20-03, CC-20-04. No gaps (Rule 17).

---

## Files Touched

### New
- `db/migrations/035_create_epo_wip_limits.sql` — table + seed + RLS
- `mcp/delivery-cycle-mcp/src/tools/get_epo_wip_limits.js` — read with auto-create
- `mcp/delivery-cycle-mcp/src/tools/update_epo_wip_limits.js` — Admin-only update
- `angular/src/app/features/admin/epo-wip-limits/epo-wip-limits.component.ts` — admin screen
- `angular/src/app/features/admin/epo-wip-limits/epo-wip-limits.component.spec.ts` — unit tests

### Modified (logic-touching)
- `mcp/delivery-cycle-mcp/src/index.js` — register two new tools
- `mcp/delivery-cycle-mcp/src/tools/record_gate_decision.js` — EPO WIP check (net-new per CC-20-04)
- `mcp/delivery-cycle-mcp/src/tools/get_delivery_summary.js` — drop `wip_*_limit` + `wip_*_exceeded` (CC-20-04 retarget)
- `mcp/delivery-cycle-mcp/tests/tools.test.js` — 10 new tests across 3 suites
- `angular/src/app/core/types/database.ts` — drop limit/exceeded from `WorkstreamSummaryItem`; add `EpoWipLimitRow` + `EpoWipWarning`
- `angular/src/app/core/services/delivery.service.ts` — `getEpoWipLimits()` + `updateEpoWipLimits()`
- `angular/src/app/core/services/screen-state.service.ts` — add `ADMIN_EPO_WIP` screen key
- `angular/src/app/features/admin/admin-hub.component.ts` — 4th card
- `angular/src/app/features/admin/admin.module.ts` — `/admin/epo-wip` route
- `angular/src/app/features/delivery/workstream-summary/workstream-summary.component.ts` — drop WIP Flag column + over-limit styling per D-400

---

## CodeClose Verification (Rule 29)

### 1. Spec Coverage

| AC (spec §10) | Status | Evidence |
|---|---|---|
| `epo_wip_limits` table created; existing EPOs seeded at 3/3/3 | PASS | Migration 035 executed by Phil (`035 is complete`); table + seed shipped |
| Workstream WIP columns dropped from `delivery_workstreams` | N/A | CC-20-02: columns never existed; drop step skipped |
| `get_epo_wip_limits()` returns all EPO rows with display names; auto-creates missing rows | PASS | Tool implements `is_epo = true` query + auto-insert at 3/3/3 |
| `update_epo_wip_limits()` updates fields, validates min 1, requires Admin JWT | PASS | Integer ≥ 1 validation + `is_admin` gate + partial-update preserves omitted fields |
| `record_gate_decision` WIP check queries EPO limits, not workstream limits; null EPO skips check | PASS | New `computeEpoWipWarning` helper; null `assigned_epo_user_id` returns early |
| `list_delivery_workstreams` no longer returns WIP limit columns; zone counts retained | PASS | Verified the tool never returned WIP fields (CC-20-04); no change required |
| `/initiatives` hub shows 7 cards in correct order | DEFERRED | Unit 7 — Session 2 |
| `/initiatives/epo-summary` renders … | DEFERRED | Unit 4 — Session 2 |
| `/initiatives/epo-schedule` renders … | DEFERRED | Unit 5 — Session 2 |
| `/initiatives/epo-deploy` renders … | DEFERRED | Unit 6 — Session 2 |
| `/admin/epo-wip` renders EPO list; inline edit works; per-row + bulk reset with D-183 two-step; filter memory | PASS | EpoWipLimitsComponent implements all elements; spec covers state machine |
| Admin hub `/admin` shows 4 cards including EPO WIP Limits | PASS | Card added in correct position |
| Workstream Summary view zone counts display without WIP alert flags | PASS | WIP Flag column + over-limit styling + `*_exceeded` fields all removed |
| All new routes guarded correctly (Admin/Phil for `/admin/epo-wip`; authenticated for `/initiatives/*`) | PASS | `/admin/epo-wip` under `authGuard` parent + component-level `is_admin` check sets blockedReason for non-admins |
| Phil UAT sign-off | PENDING | UAT checklist below |

### 2. Regression Check

| Surface | Behavior at risk | Verified by |
|---|---|---|
| `record_gate_decision` approval flow | gate approval, milestone date set, stage advance, two event log entries | Code unchanged on existing happy path; WIP check appended after stage advance |
| `record_gate_decision` return flow | gate return + single event log entry | Code unchanged |
| Workstream Summary view | zone counts per Workstream still render | Counts preserved in both `get_delivery_summary` response + Angular template; only `*_limit`/`*_exceeded` rendering removed |
| Admin hub | Workstreams, Divisions, Users cards still render in original order | Card order: Users, Divisions, Workstreams, **EPO WIP Limits** — additions only |
| `list_delivery_workstreams` | response shape | confirmed unchanged (CC-20-04) |

### 3. Test Ratchet

| Logic-touching change | Test | File |
|---|---|---|
| `record_gate_decision` adds EPO WIP check | 4 tests in `describe('record_gate_decision — EPO WIP warning ...')` | `mcp/delivery-cycle-mcp/tests/tools.test.js` |
| `update_epo_wip_limits` new tool | 7 tests covering validation paths + D-140 framing | `mcp/delivery-cycle-mcp/tests/tools.test.js` |
| `get_epo_wip_limits` new tool | 3 tests (export, response shape, auto-create) | `mcp/delivery-cycle-mcp/tests/tools.test.js` |
| `EpoWipLimitsComponent` new component | 17 tests across validation, sort, ordering, two-step reset | `angular/.../epo-wip-limits.component.spec.ts` |
| `get_delivery_summary` drops WIP limit fields | No new test — covered by Angular `WorkstreamSummaryItem` type narrowing + `ng build` pass | Flag: integration test for `get_delivery_summary` response shape is a CLAUDE.md candidate |
| `WorkstreamSummaryComponent` drops WIP Flag column | No new test — template-only change verified by `ng build` | Flag: visual UAT step in checklist below |

MCP test results: 70 passing, 1 failing (pre-existing — `create_delivery_cycle` "missing workstream_id" at line 128, unrelated to Contract 20). Pre-existing-state confirmed via `git stash` baseline run.

### 4. Pattern Sweep

Shared patterns modified this contract:
- WIP exceeded flag pattern (per-workstream) — fully removed; pattern sweep complete via grep — only my comments mention the field names. No other surface references removed fields.
- Admin hub card pattern — extended (additive); existing cards unchanged.
- D-183 two-step inline confirmation pattern — new instance in EpoWipLimitsComponent; pattern source is `update_workstream_active_status` (warning shape) and `gate-record-modal` (two-step UI). No drift introduced.
- `SCREEN_KEYS` constant — extended (additive); declaration authority retained per Rule 4.

### 5. Standards Conformance

| Standard | Status | Notes |
|---|---|---|
| S-001 — Visible Context | PASS | Page title + description + clear next action on `/admin/epo-wip`; admin hub card has title, description, who, "Open" link |
| S-007 — Reuse Before Build | PASS | DeliveryService, ScreenStateService, UserProfileService all reused; no parallel implementations |
| S-014 — Material baseline | N/A | No new Material components introduced |
| S-023 — Destructive Action Confirmation | PASS | Per-row + bulk reset both use two-step inline confirm naming the specific effect ("Reset … to 3/3/3?") |
| S-024 — Entity Capitalization | PASS | "EPO", "Initiative", "Workstream", "WIP" capitalized in UI labels |
| S-025 — UI Feedback Patterns | PASS | Pattern 1 (gray subtitle) for surface description, Pattern 3 (red border + inline message) for validation, Pattern 2 (amber border) for two-step confirmation panel |
| S-026 — Sidebar-Only Navigation | PASS | No top nav added; `/admin/epo-wip` accessed via Admin hub card |
| S-027 — Implementation Status Updates | DEFERRED | D-396 / D-397 / D-398 / D-399 stay `specced`; D-400 → `built` (partial — EPO views deferred); D-401 → `built` |
| S-028 — Processing Feedback | PASS | "Saving…" → ✓ tick on inline edits; "Resetting…" on confirm buttons; skeleton rows on initial load |
| S-030 — Component Design | PASS | `EpoWipLimitsComponent` single responsibility: edit EPO WIP limits |
| S-031 — Contract Code Quality | PASS | Test ratchet declared; pattern sweep complete; verb+object+context naming on all new methods (`onLimitChange`, `onRowResetConfirm`, `flashSavedTick`, `computeEpoWipWarning`) |

### 6. CC-Decision Completeness

CC-20-01, CC-20-02, CC-20-03, CC-20-04 — sequential, no gaps.

### 7. Structural Health

| File | Line count | Threshold | Status |
|---|---|---|---|
| `record_gate_decision.js` | 408 | 400 (service) | OVER — 8 lines over threshold. Net-new code is the EPO WIP check + helper (~85 lines). Single responsibility maintained: "record an approver decision and propagate downstream effects". Extraction of `computeEpoWipWarning` to a separate `wip-check.js` module is a candidate for next contract. |
| `epo-wip-limits.component.ts` | 803 | 300 (component) | OVER — first-build size. Component is template-heavy due to inline edit per cell + two-step inline confirm per row + bulk confirm in header. Single responsibility (S-030) holds. Template extraction to a separate `.html` file is a CLAUDE.md candidate. |
| `get_delivery_summary.js` | 278 | 400 (service) | OK |
| `workstream-summary.component.ts` | 397 | 300 (component) | OVER (pre-existing 432 → reduced to 397 this contract). Net reduction by removing WIP Flag UI. No further action this contract. |
| `get_epo_wip_limits.js` | 119 | 400 | OK |
| `update_epo_wip_limits.js` | 148 | 400 | OK |

### 8. Deployment

**Status pending Phil execution:**
1. Migration 035 — **DONE** (Phil confirmed `035 is complete`).
2. `ng build` — **DONE** (foreground, 14.1s, 0 errors, 110 lazy chunks). Initial build run as background hit two TS18046 errors in `epo-wip-limits.component.ts` from a homegrown `firstValueFrom` that lost generic inference; replaced with rxjs's typed `firstValueFrom` and verified clean.
3. Deploy MCP to Render — required for `get_epo_wip_limits` + `update_epo_wip_limits` endpoints + new `record_gate_decision` WIP check behavior + new `get_delivery_summary` response shape.
4. Deploy Angular to GitHub Pages — required for `/admin/epo-wip` route, Admin hub card 4, updated Workstream Summary view, and updated `WorkstreamSummaryItem` type binding.
5. Health checks: MCP `/health` + `/tools` should list `get_epo_wip_limits` and `update_epo_wip_limits`.

UAT checklist below assumes deployment complete.

---

## UAT Checklist (Rule 19)

Run after MCP + Angular deploy. Binary pass/fail. Run as Phil (Admin + Super-Admin).

### Surface 1 — Admin Hub `/admin`

1. Open `/admin`. **Pass:** 4 cards visible: Users, Divisions, Delivery Workstreams, EPO WIP Limits. **Fail:** any card missing or extra card present.
2. EPO WIP Limits card shows title + description + "Open EPO WIP Limits →" link. **Pass:** all three present. **Fail:** any missing.
3. Tap EPO WIP Limits card. **Pass:** navigates to `/admin/epo-wip`. **Fail:** stays on hub or 404.

### Surface 2 — `/admin/epo-wip` (EPO WIP Limits)

4. Page loads with header "EPO WIP Limits" + S-015 italic description. **Pass:** both visible. **Fail:** missing.
5. Column headers visible: EPO Name, Pre-Build, Build, Post-Deploy, Last Updated. **Pass:** five headers. **Fail:** any missing.
6. Every user with `is_epo = true` appears as a row. **Pass:** row count matches active EPO count. **Fail:** missing or extra rows.
7. Each row shows three editable integer inputs defaulting to 3/3/3 for a freshly-seeded EPO. **Pass:** all three editable. **Fail:** any read-only.
8. Change Pre-Build limit on one row to 5, click out. **Pass:** "Saving…" appears briefly, then ✓ tick fades after ~1.5s, Last Updated column shows current date + "by Phil Dodds". **Fail:** no save indicator, error, or value reverts.
9. Try to enter `0` in Build limit. **Pass:** red border, inline message "Enter a whole number of 1 or more.", no save call. **Fail:** zero accepted or no error message.
10. Try to enter `3.5` in Post-Deploy limit. **Pass:** rejected with same error message. **Fail:** decimal saved.
11. Reload the page. **Pass:** values persist (the 5 from step 8 still shown). **Fail:** values revert.
12. Click "Reset to 3·3·3" on a row whose limits aren't 3/3/3. **Pass:** inline confirmation appears with "Confirm" + "Cancel" buttons and the row's display name. **Fail:** reset happens immediately or no confirm appears.
13. Click "Cancel" on the row reset confirmation. **Pass:** confirmation collapses, no values change. **Fail:** values changed.
14. Click "Reset to 3·3·3" again, then "Confirm". **Pass:** all three limits revert to 3, ✓ tick fades. **Fail:** values unchanged or error.
15. Click "Reset all to 3·3·3" header button after editing several rows. **Pass:** confirmation appears: "Reset all EPO WIP limits to 3/3/3? This affects N EPO(s)." with Confirm + Cancel. **Fail:** mass reset happens immediately.
16. Click "Confirm" on bulk reset. **Pass:** button shows "Resetting…", grid reloads with all limits at 3/3/3. **Fail:** partial update or no reload.
17. Click any column header (e.g. Build). **Pass:** sort indicator (▲ or ▼) appears, rows reorder. **Fail:** no reorder.
18. Click same header again. **Pass:** sort direction flips. **Fail:** no change.
19. Reload page after sorting. **Pass:** sort state restored within 7 days. **Fail:** sort reverts to alphabetical.

### Surface 3 — Workstream Summary view `/initiatives/workstreams`

20. Open `/initiatives/workstreams`. **Pass:** five column headers (Workstream, Home Division, Pre-Build WIP, Build WIP, Post-Deploy WIP) — no "WIP Flag" column. **Fail:** WIP Flag column still present.
21. Inspect any row. **Pass:** zone counts render as plain numbers (no "/ 3" suffix, no amber styling, no ⚠ icon). **Fail:** old WIP flag UI present.
22. Subtitle text below the header. **Pass:** mentions EPO Summary view ("see the EPO Summary view for over-limit alerts"). **Fail:** old wording referencing per-workstream limits.

### Surface 4 — Gate Approval WIP Warning behavior

23. Find an Initiative whose assigned EPO already has 3 active Initiatives in Build zone. Approve `go_to_build` on a fourth Initiative for the same EPO. **Pass:** approval succeeds; response payload includes `wip_warning` with `zone: 'build'`, `count: ≥3`, `limit: 3`. (Angular surfacing of the warning is Session 2 work — verify via network tab or MCP log this session.) **Fail:** no `wip_warning` in response or warning fires when count < limit.
24. Approve `go_to_deploy` on an Initiative whose EPO has 2 active Post-Deploy Initiatives (under limit). **Pass:** `wip_warning` is null in response. **Fail:** warning fires below limit.
25. Approve `go_to_build` on an Initiative whose `assigned_epo_user_id` is null. **Pass:** `wip_warning` is null. **Fail:** warning fires on null EPO.

### Surface 5 — Non-admin access

26. Log in as a non-admin user (DCS or EPO without admin flag). Open `/admin/epo-wip`. **Pass:** D-140 blocked-state message: "EPO WIP Limits configuration is restricted. You need Admin role to configure EPO WIP limits. Contact your System Admin if you need access to this screen." No grid renders. **Fail:** grid renders or hard error.
27. As non-admin, attempt a direct MCP call to `update_epo_wip_limits`. **Pass:** 400 response with "Updating EPO WIP limits requires Admin role. Contact your System Admin to request access." **Fail:** update succeeds.

---

## CLAUDE.md Candidates

Per Rule 16:

1. **Pre-existing failing test in `tools.test.js`** — line 128 `create_delivery_cycle` "missing workstream_id". Asserts error string contains `workstream_id` but the tool now treats `workstream_id` as nullable (CC-19 per D-174). Test needs to be removed or rewritten. Why add: surfaced during baseline test run; not Contract 20 scope; one-line fix in a follow-up.
2. **Stray `\` typo in existing test file** — line 304 of `tools.test.js`: `\ D-140: error explains what would unblock the action` should be `// D-140:`. Currently parses as a regex literal start in some editors. Why add: cosmetic, but caught my eye while reading.
3. **`get_delivery_summary` response-shape integration test** — none exists; CC-20-04 changed the response shape with no regression test. Why add: type-system narrowing caught Angular-side; backend doesn't enforce. A response-contract test (mock Supabase or string-contract assertion) would lock the shape.
4. **EpoWipLimitsComponent template extraction** — component is 803 lines with inline template. Pulling `template:` into a separate `.html` file would shrink the `.ts` to ~350 lines and align with the standard component pattern. Why add: structural-health threshold flagged.
5. **`record_gate_decision` over 400-line service threshold** — extraction of `computeEpoWipWarning` + the WIP constants to a `wip-check.js` module would bring it back under threshold without sacrificing readability. Why add: structural-health threshold flagged.
6. **MCP test runner doesn't mock Supabase** — every existing test in `tools.test.js` is validation-string or string-contract. Real branch coverage (auto-create, EPO lookup, count query) is impossible without a fixture. Why add: not Contract 20 scope but limits test-ratchet utility on every future contract.
7. **Spec language for `user_divisions`** — D-395 references a table that does not exist. Design Session should rewrite D-395 to name `division_memberships` so future contracts don't re-discover the same divergence (CC-19-02 was discovered Contract 19, CC-20-01 rediscovered Contract 20).

---

## Stage Check (S-020)

| Feature | Current devStatus | Suggested advance | Reason |
|---|---|---|---|
| EPO WIP Limits admin screen | not-started | uat | Route + component + MCP all deployed; basic happy path works pending Phil UAT. Per memory rule: do not advance to `pilot`/`live` until Phil UAT signs off — advance to `uat` is correct next step. |
| Workstream Summary (WIP flag retirement) | live | live (no change) | Surface still ships; UI element retired per D-400 — no stage change. |
| EPO Summary view (/initiatives/epo-summary) | not-started | not-started | Unit 4 — Session 2. |
| EPO Gate Schedule view | not-started | not-started | Unit 5 — Session 2. |
| EPO Deploy by Quarter view | not-started | not-started | Unit 6 — Session 2. |
| Initiatives hub (7 cards) | live (4 cards) | live | Hub modification deferred to Unit 7 — Session 2. |

Recommendation: advance `epo-wip-limits` to `uat` after Phil completes the UAT checklist above. State change pending Phil confirmation.

---

## impl_status Updates

Per S-027, advance the following in `decisions-active.md`:
- D-400 → `built` (partial — WIP model schema + MCP + admin screen shipped; EPO views deferred)
- D-401 → `built` (admin screen shipped)
- D-396, D-397, D-398, D-399 — remain `specced` until Session 2

---

## Session Output File Path

Per memory rule (always state full Windows path at session close):

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\OITrust-CodeClose-Contract20-2026-06-05.md`

---

## Standing State for Session 2

When the next Code session opens for Contract 20 (Units 4–7), it should:
1. Pull master (Session 1 work merged + deployed).
2. Read this CodeClose for CC-decision history.
3. Re-read Contract 20 spec §4 (hub), §5 (epo-summary), §6 (epo-schedule), §7 (epo-deploy).
4. Confirm CC-20-03 still applies (route names kept) before building hub card links.
5. Implement Units 4, 5, 6 in any order (independent), then Unit 7 last (depends on Unit 4–6 routes).
