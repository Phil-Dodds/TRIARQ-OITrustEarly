# CodeClose — Build C Contract 14

Date: 2026-05-07
Worktree: `.claude/worktrees/competent-tharp-d9ef11` (master)
Deploy commit: `abb6628` on gh-pages
Build status: ng build EXIT 0 (CSS budget warnings only — pre-existing, not introduced this contract)

---

## Outcome

Seven UAT bug fixes (B-91, B-92, B-94, B-95, B-96, B-97, B-98) + D-360 Stage Track free transition model (4 surfaces) implemented. PILOT/UAT order corrected codebase-wide per Phil's call mid-session — operational order is now `VALIDATE → UAT → PILOT → RELEASE` per D-108.

---

## Files changed

### MCP
- [mcp/division-mcp/src/tools/resend_invite.js](mcp/division-mcp/src/tools/resend_invite.js) — B-91: removed auth-account pre-check; calls `inviteUserByEmail` directly. UI gates against confirmed users via `inviteStatus`.
- [mcp/division-mcp/src/tools/update_user_email.js](mcp/division-mcp/src/tools/update_user_email.js) — B-92: split write — auth update gated by `getUserById` existence check; public.users update always runs.
- [mcp/division-mcp/tests/tools.test.js](mcp/division-mcp/tests/tools.test.js) — added regression guards for B-91 and B-92.
- [mcp/delivery-cycle-mcp/src/lifecycle.js](mcp/delivery-cycle-mcp/src/lifecycle.js) — STAGE_SEQUENCE swapped to UAT-before-PILOT; NEXT_GATE_BY_STAGE: UAT now maps to `go_to_deploy` (was `go_to_release`).

### Angular core types
- [angular/src/app/core/types/database.ts:179](angular/src/app/core/types/database.ts:179) — `LifecycleStage` reordered: UAT before PILOT.

### Angular components
- [angular/src/app/features/delivery/stage-track/stage-track.component.ts](angular/src/app/features/delivery/stage-track/stage-track.component.ts) — D-360 Surface 2 (5 interaction states), B-98 (null-tooltip eliminated), `stageAdvanceRequested` Output for Surface 3, LIFECYCLE_TRACK + STAGE_ORDER reordered.
- [angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts](angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts) — D-360 Surface 1 (Current State chip), Surface 3 (inline confirm + MCP call + D-346 overlay + D-200 Pattern 3 error), Surface 4 (active gate row 3px primary left border + primary gate name). Removed dead `advanceStage()` method + `advancing`/`advanceError` fields. STAGE_ORDER × 3 reordered. STAGE_LABEL_MAP key order updated.
- [angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts](angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts) — B-95 (UUID→display name fallback to "Unknown user"; escalation default resolved via UserProfileService.getCurrentProfile), B-96 (placeholder text removed), B-97 (close handlers split: `onDismiss()` vs `onGateActionComplete(refreshKind)`). STAGE_ORDER + GATE_MIN_STAGE_IDX comments updated.
- [angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts](angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts) — STAGE_LABEL_MAP key order, `stages` array reorder, POST_DEPLOY_STAGES = `['PILOT','RELEASE','OUTCOME']` (UAT removed — now pre-deploy), `selected_cycle_id` query param read in ngOnInit (B-94 deep-link target).
- [angular/src/app/features/delivery/gates-summary/gates-summary.component.ts](angular/src/app/features/delivery/gates-summary/gates-summary.component.ts) — B-94: `openCycle` now navigates to `/delivery/cycles?selected_cycle_id=…` instead of `/delivery/cycles/:id`.
- [angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts](angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts) — B-94: same routing change.
- [angular/src/app/features/home/components/my-delivery-cycles-card.component.ts](angular/src/app/features/home/components/my-delivery-cycles-card.component.ts) — STAGE_LABEL key order updated.

---

## CC-decisions

CC-1 — **B-91 spec/file naming mismatch.** Spec referenced `division-mcp invite_user tool`, no such file exists. Actual tool is `resend_invite.js` (UI Invite button calls `resend_invite` per `users.component.ts:748`). Fix applied to actual file.

CC-2 — **B-91 dropped entire auth-account pre-check.** Spec said "Call inviteUserByEmail directly." Existing pre-check had two parts: existence check (`!authUser?.user`) and `email_confirmed_at` guard. Both removed per spec literal reading. UI gates against confirmed users via `inviteStatus !== 'confirmed'` — server-side defense in depth retired.

CC-3 — **B-95 schema field name discrepancy.** Spec said `gate_records.accountable_user_id`. Actual schema field is `approver_user_id` (`accountable_user_id` exists on `decisions` table only). Built fix targets `approver_user_id` — the field that was actually rendering UUIDs.

CC-4 — **B-95 fallback string changed.** When approver UUID is not in `allUsers`, fallback changed from raw UUID to literal `'Unknown user'`. Avoids leaking opaque IDs into UI.

CC-5 — **B-97 close-handler refactor (clarity, not behavioral fix).** Renamed `dismiss()` → `onDismiss()`; added `onGateActionComplete(refreshKind)` private method. All four MCP-success paths (submit, approve, return, withdraw) now route through `onGateActionComplete`. Escape, backdrop, ×, Cancel route through `onDismiss`. Parent's `afterClosed` already treats `undefined` and `{refreshKind:'none'}` identically — duplicate close attempts (MatDialog default Escape + our hostlistener) are idempotent, no panel refresh on Escape.

CC-6 — **`advance_stage` MCP — reused existing tool instead of duplicating.** Spec said add new tool to `division-mcp`. Existing `delivery-cycle-mcp/src/tools/advance_cycle_stage.js` already implements the required behavior. Phil approved option 2: reuse existing. UI Surface 3 calls `delivery.advanceStage(cycle_id)` which routes to delivery-cycle-mcp.

CC-7 — **D-360 Surface 2 — structural derivation from LIFECYCLE_TRACK instead of spec's hardcoded transition map.** Spec listed every transition as Free or Gate-blocked. Built version derives from track structure: if next node in `LIFECYCLE_TRACK` is type `gate` → blocked; if type `stage` → free. Cleaner; works correctly regardless of stage ordering.

CC-8 — **D-360 Surface 2 — active stage circle no longer opens Gate Record Modal.** Spec line "Active stage | Clickable: No" supersedes ARCH-25 / D-355 active-stage-click-opens-modal behavior. Gate diamond is now the sole trigger for the Gate Record Modal.

CC-9 — **PILOT/UAT order correction codebase-wide (scope expansion, Phil-approved mid-session).** D-108 has always specified `VALIDATE → UAT → PILOT → RELEASE`. Code had drifted to PILOT-before-UAT in the TypeScript types and component constants. Sweep applied: lifecycle.js (STAGE_SEQUENCE, NEXT_GATE_BY_STAGE), database.ts (LifecycleStage), stage-track (LIFECYCLE_TRACK + STAGE_ORDER), gate-record-modal (STAGE_ORDER + GATE_MIN_STAGE_IDX comments), delivery-cycle-dashboard (label map + STAGE_ORDER + POST_DEPLOY_STAGES), delivery-cycle-detail (label map + STAGE_ORDER × 3), my-delivery-cycles-card (label map). Resulting LIFECYCLE_TRACK: VALIDATE → UAT → go_to_deploy → PILOT → go_to_release → RELEASE.

CC-10 — **Removed dead code: `advanceStage()` method + `advancing` + `advanceError` fields** from `delivery-cycle-detail.component.ts`. Method was unused (no template binding). D-360 Surface 3 replaces this entirely with the inline-confirm pattern.

CC-11 — **POST_DEPLOY_STAGES corrected.** Was `['PILOT','UAT','RELEASE','OUTCOME']`. Now `['PILOT','RELEASE','OUTCOME']`. UAT is pre-deploy (validated before `go_to_deploy` gate).

---

## Conflicts encountered (Rule 8 log)

C-1 — Spec said "invite_user tool" → actual file `resend_invite.js`. Resolved without escalation; recorded as CC-1.

C-2 — Spec said create `advance_stage` in division-mcp → existing tool in delivery-cycle-mcp. Escalated to Phil; option 2 approved (reuse existing); CC-6.

C-3 — Spec PILOT/UAT order vs code PILOT/UAT order. Escalated to Phil; codebase fix approved; CC-9.

C-4 — Spec D-360 Surface 2 ("Active stage Clickable: No") vs ARCH-25/D-355 (active-stage-click-opens-modal). D-360 governs (newer, explicit redefinition); CC-8.

C-5 — Spec D-360 free transition map vs LIFECYCLE_TRACK structure. Resolved by structural derivation (CC-7) — works regardless of which is "right."

---

## Structural Health (Rule 12)

| File | Lines | Threshold | Status |
|------|------:|-----------|--------|
| mcp/division-mcp/src/tools/resend_invite.js | ~76 | 400 (service) | ✓ |
| mcp/division-mcp/src/tools/update_user_email.js | ~125 | 400 (service) | ✓ |
| mcp/delivery-cycle-mcp/src/lifecycle.js | ~160 | 400 (service) | ✓ |
| angular/src/app/features/delivery/stage-track/stage-track.component.ts | ~351 | 300 (component) | ⚠ exceeds — flagged candidate |
| angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts | ~862 | 300 (component) | ⚠ pre-existing, exceeds — flagged candidate |
| angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts | ~2730 | 300 (component) | ⚠ pre-existing, exceeds — flagged candidate |

---

## Behavior Protection (Rule 11)

| File | Tier | Test baseline | Post-edit |
|------|------|---------------|-----------|
| resend_invite.js | logic-touching | none existed (no test for this tool) | added 2 new tests; pass |
| update_user_email.js | logic-touching | 4 tests passing | 4 + 1 new = 5 tests passing |
| Gate Record Modal | logic-touching | none existed | no new tests; behavior covered in UAT |
| stage-track | logic-touching | none existed | no new tests |
| delivery-cycle-detail | logic-touching | none existed | no new tests |

Pre-existing test failure in `update_user.js` system_role validation (`tools.test.js:207`) — out of scope, flagged as candidate.

---

## CLAUDE.md Candidates (Rule 16)

- **C-Stale-Migration-019** — `db/migrations/019_create_gate_records.sql:11` comment lists wrong-order stage sequence (PILOT before UAT). Migration is applied history; can't be modified safely. Suggest a docs cleanup pass to add a new migration's comment or a docs note marking 019's comment stale.
- **C-Pre-existing-test-fail** — `mcp/division-mcp/tests/tools.test.js:207` — `update_user.js` test asserts error contains "must be one of" but tool returns a different message. Pre-existing failure; out of scope this contract.
- **C-Component-size-stage-track** — stage-track.component.ts now ~351 lines (exceeds 300 component threshold) after Surface 2 additions. Candidate for extracting a "stage state" helper module.
- **C-Component-size-detail** — delivery-cycle-detail.component.ts ~2730 lines, pre-existing — long-standing structural decomposition candidate. Surface 1/3/4 added ~150 lines; candidate flagged repeatedly.
- **C-Component-size-grm** — gate-record-modal.component.ts ~862 lines, pre-existing.
- **C-CSS-budget-warnings** — 9 components exceed 2.00 kB CSS budget (login, workstream-summary, gates-summary, deploy-schedule, workstream-picker, user-picker, edit-panel, gate-record-modal, create-panel). Pre-existing; not introduced this contract. Candidate for budget reset or CSS extraction.
- **C-resend_invite-response-shape** — `resend_invite` returns `{success, message}` (no `data` field) but Angular caller reads `res.data.message` with fallback. Cosmetic mismatch, fallback covers it. Candidate to align tool response with `{success, data: {message}}` pattern used by other tools.

---

## Stage check (S-020)

Per Phil's standing memory: only flag stage advancement *after* Phil has UAT'd, not immediately on deployment. Several features modified this contract — no devStatus changes proposed; awaiting Phil's UAT on deployed gh-pages.

Features touched: Delivery Cycles (detail, dashboard), Gate Schedule, Deploy Gate by Quarter, Stage Track, Gate Record Modal, Admin → Users (Invite, Edit Email).

---

## Implementation Status (S-027)

D-360 not present in `decisions-active.md` — only in the session brief. **Flagged for Design routing per session-brief D-212 instruction:** Design must add D-360 to `decisions-active.md` and set `impl_status: built` post-UAT.

---

## Non-Code Steps (Phil)

- B-99 — RCM Test Cycle data inconsistency: Brief Review shows Complete status but cycle in BRIEF. Fix manually in Supabase per spec.
- UAT Phil: visit https://phil-dodds.github.io/TRIARQ-OITrustEarly/ and verify the seven bugs + D-360 surfaces. Specifically:
  - Surface 1: Current State chip renders above Stage Track on cycle detail.
  - Surface 2: Hover next-free stage circle → "Advance to [STAGE]" tooltip + pointer cursor. Hover gate-blocked next stage → "Requires [GATE NAME] approval" tooltip, default cursor.
  - Surface 3: Click next-free stage → inline confirm appears below Stage Track. Confirm → MCP call, panel refreshes. Cancel → dismisses.
  - Surface 4: Active gate row in Gates & Milestone Dates has 3px primary left border + primary gate name color.
  - B-91: Invite button works for seeded user (no Supabase auth account).
  - B-92: Edit email works for seeded user (updates public.users only).
  - B-94: Cycle row click on Gate Schedule and Deploy Gate by Quarter opens detail panel at /delivery/cycles, not /home.
  - B-95: Gate Record Modal Approval Routing shows display name (not UUID) when approver configured. Shows "[Phil's display name] (escalation default — no Accountable configured)" when no approver, resolved from auth session.
  - B-96: "Consulted and Informed routing configured in Build D" placeholder gone.
  - B-97: Pressing Escape on Gate Record Modal closes it without refreshing the cycle detail panel behind.
  - B-98: No "Null" string anywhere on stage circle tooltips.
  - PILOT/UAT order: visible in Stage Track lifecycle, sidebar, dashboard list. Should read VALIDATE → UAT → PILOT → RELEASE.

---

## CC-decision sequence completeness (Rule 17)

CC-1, CC-2, CC-3, CC-4, CC-5, CC-6, CC-7, CC-8, CC-9, CC-10, CC-11 — sequential, no gaps.

---

## Output file location

Full Windows path:

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\worktrees\competent-tharp-d9ef11\.claude\sessions\session-output-2026-05-07-BuildC-Contract14.md`
