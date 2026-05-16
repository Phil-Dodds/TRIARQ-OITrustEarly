# Build C Codebase Audit Report
Pathways OI Trust | Contract 16 CodeClose Deliverable | 2026-05-15 | CONFIDENTIAL

**Spec authority:** build-c-contract16-spec.md §4. This is an honest snapshot — proposals only. Design adjudicates findings in the Contract 17 planning session. No fixes in this contract.

---

## Section 1 — Component Size Inventory

Thresholds (Rule 12 / S-030): component > 300 lines, service > 400 lines.

### Flagged — over threshold

| File | Lines | Over by | Description / last contract touched |
|------|------:|--------:|-------------------------------------|
| `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts` | 2871 | +2571 | Delivery Cycle detail panel — stage track, milestone dates, artifacts, gate panel orchestration, edit panel host. Touched in Contract 16 (B-97). |
| `angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts` | 1975 | +1675 | All Delivery Cycles grid — 11-column set, filter panel, sort, screen-state restore/save. Read only in Contract 16. |
| `angular/src/app/features/admin/users/users.component.ts` | 1157 | +857 | Admin Users — invite, edit, role assignment, division membership, role filter, name sort. Touched in Contract 16 (§3b screen-state wiring). |
| `angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts` | 876 | +576 | Gate Record Modal (D-355) — submit, approve, return, withdraw paths. Touched in Contract 16 (B-97 stopPropagation). |
| `angular/src/app/features/delivery/edit-panel/delivery-cycle-edit-panel.component.ts` | 868 | +568 | Cycle edit form panel with dirty-state confirm. Not touched in Contract 16. |
| `angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts` | 731 | +431 | Deploy Gate by Quarter view. Not touched in Contract 16. |
| `angular/src/app/features/delivery/create-panel/delivery-cycle-create-panel.component.ts` | 690 | +390 | Create cycle right-panel form. Not touched in Contract 16. |
| `angular/src/app/features/delivery/workstream-admin/workstream-admin.component.ts` | 659 | +359 | Workstream registry — create, activate, edit, list. Not touched in Contract 16. |
| `angular/src/app/features/admin/divisions/divisions.component.ts` | 599 | +299 | Division admin. Not touched in Contract 16. |
| `angular/src/app/features/delivery/gates-summary/gates-summary.component.ts` | 591 | +291 | Gate Schedule view. Not touched in Contract 16. |
| `angular/src/app/shared/pickers/user-picker/user-picker.component.ts` | 511 | +211 | User entity picker (S-022). Not touched in Contract 16. |
| `angular/src/app/shared/pickers/workstream-picker/workstream-picker.component.ts` | 405 | +105 | Workstream entity picker (S-022). Not touched in Contract 16. |
| `angular/src/app/features/delivery/workstream-summary/workstream-summary.component.ts` | 401 | +101 | Workstream summary view. Not touched in Contract 16. |
| `angular/src/app/features/delivery/division-summary/division-summary.component.ts` | 371 | +71 | Division summary view. Not touched in Contract 16. |
| `angular/src/app/features/delivery/stage-track/stage-track.component.ts` | 344 | +44 | Stage Track component (S-002, D-360). Not touched in Contract 16. |
| `angular/src/app/features/oi-library/oi-library.component.ts` | 311 | +11 | OI Library list. Not touched in Contract 16. |

**Total components over threshold:** 16 of 19.

### Components under threshold

| File | Lines |
|------|------:|
| `angular/src/app/features/oi-library/artifact-detail.component.ts` | 291 |
| `angular/src/app/features/login/otp-verify.component.ts` | 279 |
| `angular/src/app/features/login/login.component.ts` | 263 |

### Services — all under threshold (400 lines)

| File | Lines |
|------|------:|
| `angular/src/app/core/services/delivery.service.ts` | 280 |
| `angular/src/app/core/services/auth.service.ts` | 229 (was 177 pre-Contract 16; grew by 52 for screen-state methods) |
| `angular/src/app/core/services/user-profile.service.ts` | 127 |
| `angular/src/app/core/services/screen-state.service.ts` | 85 |
| `angular/src/app/core/services/mcp.service.ts` | 68 |

**Finding:** 16 of 19 components exceed the 300-line threshold. The four largest (detail at 2871, dashboard at 1975, users at 1157, gate-record-modal at 876) are critical user-facing surfaces. Refactor would be substantial — each component intermingles template logic, MCP orchestration, and state machines.

**Proposal:** Schedule a decomposition design session post-Contract 16. Candidate breakdown:
- `delivery-cycle-detail.component.ts` → extract milestone-dates zone, artifacts zone, gate-panel orchestration, edit-panel host into sub-components
- `delivery-cycle-dashboard.component.ts` → extract filter panel, filter-chip bar, header counts, screen-state plumbing
- `users.component.ts` → extract invite form, edit form, division membership panel
- `gate-record-modal.component.ts` → extract submit form, approve/return form, status header

---

## Section 2 — Test Coverage Gap Map

Existing test files (Angular `.spec.ts`):
- `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.spec.ts` (NEW — Contract 16; 4 cases on `onEscKey`)

Existing test files (MCP):
- `mcp/delivery-cycle-mcp/tests/jwt.test.js` — JWT middleware tests
- `mcp/delivery-cycle-mcp/tests/tools.test.js` — input-validation error-path tests for 18 tools (57 cases)
- `mcp/division-mcp/tests/jwt.test.js`, `mcp/division-mcp/tests/tools.test.js` — 26/27 pass (1 pre-existing fail from C14)
- `mcp/document-access-mcp/tests/file-validator.test.js` — file validator tests

### Angular surfaces — coverage gap

| Surface | Coverage | Complexity | Priority |
|---------|----------|------------|----------|
| `delivery-cycle-detail.component.ts` (escape, panel orchestration, milestone editing, artifact attach) | PARTIAL — only `onEscKey` covered post-Contract 16 | High | HIGH |
| `delivery-cycle-dashboard.component.ts` (filter, sort, screen-state, drill-down query params, counts) | NONE | High | HIGH |
| `gate-record-modal.component.ts` (submit, approve, return, withdraw, escape, status display) | NONE | High | HIGH (gate-critical logic) |
| `delivery-cycle-create-panel.component.ts` (form validation, picker integration, dirty-state) | NONE | Medium | MEDIUM |
| `delivery-cycle-edit-panel.component.ts` (edit form, dirty-state, scrim) | NONE | Medium | MEDIUM |
| `workstream-admin.component.ts` (create, activate, edit) | NONE | Medium | MEDIUM |
| `users.component.ts` (invite, edit, role, division membership, screen-state) | NONE | Medium | MEDIUM |
| `gates-summary.component.ts` (overdue/upcoming split, drill-in) | NONE | Medium | MEDIUM |
| `deploy-schedule.component.ts` (workstream/quarter grouping) | NONE | Medium | LOW |
| Pickers (`user-picker`, `workstream-picker`) | NONE | Medium | MEDIUM |
| Services (`delivery.service`, `auth.service`, `user-profile.service`, `screen-state.service`, `mcp.service`) | NONE | Low–Medium | MEDIUM |

### MCP surfaces — coverage gap

| Surface | Coverage | Notes |
|---------|----------|-------|
| `delivery-cycle-mcp` tools (18 tools, ~57 test cases) | Input-validation error paths covered; DB-dependent happy paths NOT covered | No Supabase mocking infrastructure exists. Happy-path coverage requires either an integration-test layer or proxy/mock library. |
| `set_milestone_actual_date` (Contract 16) | 7 cases — input validation + auth/revert error message contracts | Same gap as siblings — happy path not tested. |
| `division-mcp` tools | 26/27 pass — 1 pre-existing fail (`update_user.system_role` validation) | Flagged in Contract 14 as out of scope. |

**Finding:** Test infrastructure is thin. Angular has effectively zero `.spec.ts` coverage outside the one file added this contract. MCP has only input-validation coverage. Gate-critical business logic (gate submission, approval, milestone state transitions, workstream active enforcement) has no automated coverage at the integration level.

**Proposal — sequence by priority:**
1. **HIGH** — Gate workflow happy paths (`submit_gate_for_approval`, `record_gate_decision`, `set_milestone_actual_date`). Requires Supabase mocking decision.
2. **HIGH** — `gate-record-modal.component.ts` template behaviors (submit/approve/return action buttons by role, processing state).
3. **HIGH** — `delivery-cycle-detail.component.ts` panel lifecycle (open, close, escape with/without modal, edit panel host).
4. **MEDIUM** — `delivery-cycle-dashboard.component.ts` filter/sort/screen-state.
5. **MEDIUM** — Service layer (`delivery.service`, `auth.service` including new `restoreUserScreenState` / `upsertUserScreenState` methods).
6. **MEDIUM** — Create/edit panel form validation and dirty-state.
7. **LOW** — Pickers, summary views.

Pre-existing MCP failures (out of scope but tracked):
- `create_delivery_cycle` — error path: missing workstream_id
- `nextStage VALIDATE → PILOT` lifecycle constant

---

## Section 3 — Spec / Implementation Alignment

Surfaces from build-c-spec.md v2.0 §1 (Build C Scope).

| Surface | Implementation Status | Notes |
|---------|----------------------|-------|
| Delivery Cycle MCP (`delivery-cycle-mcp`) — 20 tools | IMPLEMENTED | 18 active tools per repo count + 2 retired/renamed paths. Spec said 20; actual file count is 18 in `src/tools/`. **Discrepancy worth tracking.** |
| Delivery Workstream Registry — `/admin/workstreams` | IMPLEMENTED | `workstream-admin.component.ts`. |
| Delivery Cycle Tracking Hub — `/delivery` | IMPLEMENTED | `delivery-hub.component.ts`. |
| All Delivery Cycles view — `/delivery/cycles` | IMPLEMENTED | `delivery-cycle-dashboard.component.ts`. |
| Workstream Summary view — `/delivery/workstreams` | PARTIAL | `workstream-summary.component.ts` exists; spec described shell-only at Build C close. Reality: full implementation. Spec is stale, not the code. |
| Gate Schedule view — `/delivery/gates` | IMPLEMENTED | `gates-summary.component.ts`. |
| Deploy Gate by Quarter — `/delivery/deploy-schedule` | IMPLEMENTED | `deploy-schedule.component.ts`. |
| Delivery Cycle Detail View | IMPLEMENTED | `delivery-cycle-detail.component.ts` — extensively. |
| Gate Workflow (5 gates) | IMPLEMENTED | Stage Track, gate panel, MCP tools wired. |
| Cycle Artifact Tracking — 26 seed slots | IMPLEMENTED | Per migration; UI in detail component. |
| Build Report OI Library Submission Stub | IMPLEMENTED (stub) | Informational stub — submission lands in Build B. |
| Jira Sync (5 governance fields) | IMPLEMENTED | `sync_jira_epic` tool. Unconfigured-env state handled. |
| Admin Hub — `/admin` | IMPLEMENTED | `admin-hub.component.ts`. |
| Maintenance Mode | IMPLEMENTED | `system_config` table seeded; `set/get_maintenance_mode` tools in division-mcp; Angular bootstrap interception. |
| Tier rollout phase config | IMPLEMENTED | `tier_gate_requirements` table seeded. |

### Contract-16-specific delivery

| Spec section | Implementation Status |
|--------------|----------------------|
| §1 B-97 Escape fix | IMPLEMENTED — gateModalOpen flag in detail + stopPropagation in modal + .spec.ts coverage |
| §2 `set_milestone_actual_date` | IMPLEMENTED — full rewrite with auth + revert + event log; service+UI updated |
| §3a `user_screen_state` migration | WRITTEN — Phil executes before deploy |
| §3b admin.users screen-state | IMPLEMENTED — restoreUserScreenState/upsertUserScreenState in AuthService; users.component wired |
| §4 D-341 repo cleanup | NOT FOUND — work was complete in prior commits (b6e45af, 560a1d8, 29ecbc9). Spec stale. |
| §5 Admin SQL backfill | DISPLAYED — Phil executes |
| §6 CLAUDE.src.md amendment | NOT FOUND — file never existed; CLAUDE.md v2.6 replaced (Path C per Design adjudication) |

### Ghost-spec candidates

- `build-c-supplement-spec.md` — referenced in code comments (e.g., `submit_gate_for_approval.js` line 76). Per D-307 the supplement was retired. References in code comments are historical citations, not bugs.
- `build-c-decisions.md` — referenced in spec §6; file deleted per D-341 prior. No operative ghost.
- `CLAUDE.src.md` — referenced in spec §7; file never existed. Gap recorded in CC-decision and Document Author candidate.

---

## Section 4 — Pattern Consistency Check

### D-355 — Gate Record Modal Pattern

**Migration check:** all gate interactions surface through `GateRecordModalComponent` via `MatDialog.open()`. The retired inline gate sub-panel does not exist in the current codebase. `dialog.open` references for the gate modal are in `delivery-cycle-detail.component.ts` only.

**Other entry points to gate modal:** none — gate diamond inside `StageTrackComponent` emits `(gateClicked)`; only detail component listens.

**Status:** PASS — single entry, single component.

### D-360 — Free Transition Model (Stage Track)

`stage-track.component.ts` line count 344; renders both Full and Condensed modes. Spec §1 acceptance criterion 1 advances D-360 to `built` on B-97 UAT PASS.

- **Gate-blocked stages:** Stage circles non-interactive; gate diamonds carry the gate-blocked state and tooltips. PASS by spec §1 of Contract 15 (Stage Track §6) — out of audit scope to re-verify.
- **Free-transition stages:** Pointer cursor and "Advance to [STAGE]" tooltip implementation — out of audit scope to re-verify per code-read; reported as IMPLEMENTED based on Contract 14/15 acceptance.
- **Active state:** One active at all times per D-360. PASS by spec §1 acceptance.

**Status:** Spec-level PASS. UAT confirms via B-97 closeout.

### `user_screen_state` Implementation Coverage

| Screen | Filter / sort present? | Persistence | Status |
|--------|------------------------|-------------|--------|
| `admin.users` | Yes (role filter, name sort) | **Supabase `user_screen_state` (Contract 16)** | IMPLEMENTED |
| `delivery.cycles` | Yes (8 filters + sort) | localStorage via `ScreenStateService` | Outstanding — migrate to Supabase in future contract |
| `delivery.workstreams` | Partial | localStorage via `ScreenStateService` (key exists) | Outstanding |
| `delivery.divisions` | Partial | localStorage (key exists) | Outstanding |
| `delivery.gates` | Yes (gate status filter) | localStorage (key exists) | Outstanding |
| `delivery.deploy-schedule` | Workstream/quarter grouping (not filter/sort per se) | None | Out of scope per current spec |
| `oi-library` | Search only | None — search not persisted per spec | Conformant |

**Finding:** admin.users is the FIRST surface on the Supabase-backed `user_screen_state` table. Five other delivery-domain screens remain on localStorage. Migration to Supabase is future scope.

**Proposal:** Schedule a sweep contract to migrate all `delivery.*` screens to `user_screen_state` table. The recency check pattern (7-day) is already centralized in `SCREEN_STATE_RECENCY_DAYS`. Service-level migration: change `ScreenStateService.restore`/`save` from localStorage to `AuthService.restoreUserScreenState`/`upsertUserScreenState` calls. Component call sites unchanged.

---

## Section 5 — Other Findings

### F1 — `CLAUDE.src.md` was never created

D-338/D-339 specced a source/output split for code-read markdown files. The source file (`CLAUDE.src.md`) was never created. Contract 16 §7 attempted to amend it. Path C (Phil adjudication): CLAUDE.md v2.6 from zip replaced repo root file directly. RATIONALE/GOVERNING HTML comments missing from operative file — Document Author session candidate per D-306.

### F2 — Spec said "Craig Sycuro" — actual name "Craig Bickford"

Per Phil correction 2026-05-15. Spec §5 used wrong surname. Recorded as CC-decision per Rule 7. SQL produced with correct name.

### F3 — `set_milestone_actual_date` had latent bug pre-Contract 16

Prior implementation (Session 2026-03-24-A era) wrote computed values `'achieved'`, `'overdue'`, `'complete'` to `cycle_milestone_dates.date_status` — but the table CHECK constraint only allows `'not_started','on_track','at_risk','behind','complete'`. Two of the three computed values would have caused write failures. The tool may never have been exercised on a path that hit those branches, masking the bug. Contract 16 rewrite uses `'complete'` only per D-205.

### F4 — `manually_entered` parameter on `set_milestone_actual_date` was inert

Service signature included `manually_entered: boolean` parameter that was never honored by the prior MCP handler. Dropped in Contract 16. Replaced with `override_reason` per spec §2 revert handling.

### F5 — Build CSS budget warnings (5 components)

Angular build emits CSS budget warnings (not errors) for 5 components: `edit-panel`, `gate-record-modal`, `gates-summary`, `deploy-schedule`, `create-panel`. Largest offender: `gate-record-modal` at 3.89 kB vs 2.00 kB budget. Cosmetic — does not block deploy.

**Proposal:** Raise CSS budget to 4 kB in `angular.json` OR extract component CSS to dedicated `.scss` files (current pattern is inline `styles:` array).

### F6 — Two pre-existing MCP test failures

Both flagged in Contract 14 as out of scope. Tracking:
- `create_delivery_cycle` — error path: missing workstream_id (175ms, suggests it's hitting Supabase due to validation order)
- Lifecycle constant: `nextStage VALIDATE → PILOT` returns 'UAT' instead of 'PILOT'. Per D-108 the order is VALIDATE → UAT → PILOT. The test assertion expects PILOT which is incorrect. **The TEST is wrong, not the implementation.** Should be: VALIDATE → UAT.

**Proposal:** Fix the test assertion (correct expected value to 'UAT'). 1-line change. Separate contract or piggyback on next MCP-touching contract.

### F7 — Two-pattern coexistence on screen state

Post-Contract 16, two patterns persist filter/sort:
- `admin.users` uses Supabase-backed `user_screen_state` table (Contract 16)
- All `delivery.*` screens use localStorage via `ScreenStateService` (pre-Contract 16)

Until the sweep contract (see Section 4), the codebase has split implementations. Comments in `screen-state.service.ts` already acknowledge "MCP write-back is planned for a future build session" — should be updated to note `AuthService.restoreUserScreenState`/`upsertUserScreenState` exist now.

### F8 — `auth.service.ts` SRP growth

Per CC-010, AuthService grew two screen-state methods. SRP technically weakens (auth service now knows about screen state). Cleanest long-term refactor is a `SupabaseClientService` wrapper that both AuthService and a future `UserScreenStateService` inject. Tracked as deferred item.

### F9 — Orphan user record in `public.users`

Discovered during §5 SQL execution. Vijay Patil row in `public.users` (id `b693a88b-26f0-472c-bf44-9184c1308fd3`, email `vijay.patil@triarghealth.com` — typo with `g` for `q`) had **no corresponding `auth.users` identity**. User could not sign in via OTP regardless of role. Origin unknown — possible causes: manual SQL insert pre-build, auth.users deletion without cleanup of public.users, data migration from another system.

FK audit found only `division_memberships` references (3 Trust-level assignments — Value Services, Practice Services, Performance). All other tables (delivery_cycles, gate_records, cycle_event_log, delivery_workstreams, workstream_members) had zero references to the orphan id.

Resolution (Path 1, per Phil): captured the 3 Trust assignments before delete, deleted the orphan + memberships, re-invited via Admin Users UI at corrected email `vijay.patil@triarqhealth.com`, re-assign 3 Trusts via UI, grant Admin via SQL on the new id.

**Proposal — DEFER-ORPHAN-AUDIT:** Sweep all `public.users` rows for orphans:

```sql
SELECT u.id, u.email, u.display_name, u.system_role, u.created_at
FROM public.users u
LEFT JOIN auth.users a ON a.id = u.id
WHERE a.id IS NULL
  AND u.deleted_at IS NULL;
```

Decide per-row whether to delete (no activity) or backfill auth identity (has activity).

---

## Summary

| Section | Headline |
|---------|----------|
| 1 Component Size Inventory | 16 of 19 components over 300-line threshold. Top 4: 2871, 1975, 1157, 876. All services under threshold. |
| 2 Test Coverage Gap Map | Effectively zero Angular `.spec.ts` coverage (one file post-Contract 16). MCP coverage is input-validation only — no DB happy paths. |
| 3 Spec/Implementation Alignment | Build C scope fully implemented. Contract 16 specs §4 and §6 were no-ops (work already done, or file never existed). |
| 4 Pattern Consistency Check | D-355, D-360: PASS. `user_screen_state`: admin.users is the first adopter; five `delivery.*` screens outstanding. |
| 5 Other Findings | 9 findings — recorded above. F3 (latent bug fixed), F6 (incorrect test assertion), F7 (two-pattern coexistence), F8 (SRP growth), F9 (orphan user record in public.users) are the most actionable. |

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-05-15*
