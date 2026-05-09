# CodeClose — Build C Contract 15

Date: 2026-05-08
Worktree: `.claude/worktrees/competent-tharp-d9ef11` (master baseline + uncommitted Contract 14 + Contract 15)
Build status: ng build EXIT 0 (CSS budget warnings only — pre-existing, not introduced this contract)
Tests: division-mcp 26 / 27 passing (1 pre-existing fail flagged in C14: `update_user.js` system_role test out of scope)

---

## Outcome

Six UAT bug fixes (B-91/B-105, B-92, B-97, B-101, B-102, B-103) + D-308 right-panel compliance applied to Gate Schedule and Deploy Gate by Quarter. The B-94 navigation-away fix from Contract 14 is superseded on those two surfaces — cycle row tap now opens detail in the right panel of the originating view.

---

## Files changed

### MCP — division-mcp

- [mcp/division-mcp/src/tools/resend_invite.js](mcp/division-mcp/src/tools/resend_invite.js) — B-91/B-105: wrap `inviteUserByEmail` in try/catch; specific branches for rate-limit and already-registered. Defensive against supabase-js admin throws.
- [mcp/division-mcp/src/tools/update_user_email.js](mcp/division-mcp/src/tools/update_user_email.js) — B-92: auth lookup + update wrapped in try/catch. `public.users` update now runs unconditionally after the auth try/catch — fully decoupled from auth path. Added user-readable translation for PostgREST "no rows returned" error.
- [mcp/division-mcp/tests/tools.test.js](mcp/division-mcp/tests/tools.test.js) — added two regression tests: (1) `resend_invite` try/catch + rate-limit branch, (2) `update_user_email` public.users update runs after auth try/catch block.

### Angular — components

- [angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts:1399](angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts:1399) — B-97: `onEscKey` now early-returns when any MatDialog is open (`this.dialog.openDialogs.length > 0`). Stops the document-level Escape from closing the panel and triggering parent `loadCycles()` while Gate Record Modal is open.
- [angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts:664](angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts:664) — B-103: Condition A alert icon now fires when `effectiveDateStatus === 'complete' && (!actual_date || !isGateApproved)`. OR semantics per D-205. Tooltip varies by which side fires.
- [angular/src/app/features/delivery/stage-track/stage-track.component.ts:102, 130, 161](angular/src/app/features/delivery/stage-track/stage-track.component.ts:102) — B-101 + B-102: switched `[title]` to `[attr.title]` on stage circles, gate diamonds (full mode), and gate diamonds (condensed mode). `[attr.title]` cleanly removes the attribute on null. Stage circle tooltip text was already correct; the binding mechanism was the failure mode.
- [angular/src/app/features/delivery/gates-summary/gates-summary.component.ts](angular/src/app/features/delivery/gates-summary/gates-summary.component.ts) — D-308: added flex container, right-panel detail slot rendering `DeliveryCycleDetailComponent`, edit-scrim overlay, and `selectedCycleId` / `cancelEditSignal` / `showEditScrim` state. `openCycle()` now sets `selectedCycleId` instead of routing. New `closePanel()`, `onEditPanelOpened()`, `onEditPanelClosed()`, `onScrimClick()` handlers.
- [angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts](angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts) — D-308: same pattern as Gate Schedule. Workstream expansion state preserved while panel is open.

---

## CC-decisions

CC-1 — **B-91/B-105 root cause is below the spec's stated string.** The string "Could not retrieve auth account" no longer exists in the codebase — it was the C13 error message. The C14 fix dropped the auth pre-check, but `inviteUserByEmail` itself still fails for some seeded users (rate limit, already-registered conflicts, or supabase-js admin call throwing). C15 fix wraps the call in try/catch and returns specific user-readable error strings. Spec literal "trace where 'Could not retrieve auth account' originates" was treated as historical — actual fix is robustness around the supabase-js admin call.

CC-2 — **B-92 root cause is exception swallowing failure.** `supabase.auth.admin.getUserById` can either return `{data:null,error}` or throw, depending on supabase-js internal state. C14 destructured `data` only; an unhandled throw caused the whole tool to fail before reaching the public.users update. C15 fix: wrap auth lookup AND auth update in a single try/catch; the public.users update now runs unconditionally after that block. Test added asserts the structural ordering.

CC-3 — **B-97 root cause is dual document-level Escape listeners.** `gate-record-modal.component.ts:542` and `delivery-cycle-detail.component.ts:1399` both register `@HostListener('document:keydown.escape')`. When the modal Escape fires, both handlers run — the modal closes correctly via `dialogRef.close({refreshKind:'none'})`, but the cycle-detail handler also fires `close.emit()` which dashboard handles by setting `selectedCycleId=null` AND calling `loadCycles()`. Result: full list refresh. Fix: the cycle-detail handler now early-returns when any MatDialog is open. C14's `onDismiss`/`onGateActionComplete` split was correct but didn't address this layer.

CC-4 — **B-101 + B-102 share root cause.** `[title]="..."` is a DOM property binding — Angular sets the `title` property to whatever string the expression evaluates to, including `"null"` as a stringified value in some browsers. `[attr.title]="..."` is an attribute binding that cleanly removes the attribute when the expression is null. Switching the binding fixes both bugs at once. Stage circle tooltip text was already producing "Requires [Gate Name] approval" — the actual rendered tooltip simply didn't appear reliably until the binding was correct.

CC-5 — **B-103 spec read literally on Condition A.** Spec D-205 Condition A: status = Complete AND (`actual_date` IS NULL OR no approved gate_record). C14 only checked the `!isGateApproved` side. Added the `!m.actual_date` side per spec. Tooltip varies based on which side fires so the user knows which divergence they're looking at.

CC-6 — **D-308 supersedes B-94 navigation-away approach.** C14's B-94 fix routed cycle row clicks to `/delivery/cycles?selected_cycle_id=...` to satisfy the right-panel pattern with minimum work. C15 spec supersedes that by requiring the panel slot on the originating surface. Implemented by importing `DeliveryCycleDetailComponent` directly into both Gate Schedule and Deploy Gate by Quarter components and wiring up the same flex+panel layout used on `/delivery/cycles`. The dashboard's defensive read of `?selected_cycle_id=` (line 957) is left in place — harmless if a stale URL is hit, but no longer used as the navigation mechanism.

CC-7 — **MCP redeploy required to clear B-91/B-92 in production.** Contract 14 deploy went to gh-pages (Angular only). MCP servers run on Render with their own deploy pipeline. If the C14 MCP changes weren't redeployed there, the `Could not retrieve auth account` string is still live on the API. The C15 fix is robust regardless of which version is deployed, but Phil should verify the division-mcp Render deploy is current (and re-deploy if not) before re-running UAT.

CC-8 — **D-360 still flagged for Design routing.** Contract 14 CC-decision flagged that D-360 isn't in `decisions-active.md`. Still not present. C15 doesn't add it — Design owns that file. C15 inherits the same flag.

---

## Conflicts encountered (Rule 8 log)

C-1 — Spec B-91 says trace "Could not retrieve auth account" — string doesn't exist in current source. Resolved by treating the bug as "invite still fails on UAT" rather than the literal string match. Recorded as CC-1.

C-2 — Spec B-101 says fix the gate-blocked stage tooltip text — current source already produces the correct text. Resolved by recognizing the actual failure mode is the `[title]` binding rendering "null" as a string for adjacent future stages. Recorded as CC-4.

C-3 — Spec D-308 contradicts Contract 14's B-94 fix on Gate Schedule and Deploy Gate by Quarter. Resolved by explicit supersession declaration in the spec — C15 strips the navigation-away routing on those two surfaces only. `/delivery/cycles` is unaffected. Recorded as CC-6.

---

## Structural Health (Rule 12)

| File | Lines | Threshold | Status |
|------|------:|-----------|--------|
| mcp/division-mcp/src/tools/resend_invite.js | ~95 | 400 (service) | ✓ |
| mcp/division-mcp/src/tools/update_user_email.js | ~140 | 400 (service) | ✓ |
| angular/src/app/features/delivery/stage-track/stage-track.component.ts | ~351 | 300 (component) | ⚠ pre-existing — flagged C14 |
| angular/src/app/features/delivery/gate-record-modal/gate-record-modal.component.ts | ~862 | 300 (component) | ⚠ pre-existing — flagged C14 |
| angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts | ~2735 | 300 (component) | ⚠ pre-existing — flagged C14 |
| angular/src/app/features/delivery/gates-summary/gates-summary.component.ts | ~610 | 300 (component) | ⚠ exceeds — added panel slot ~95 lines |
| angular/src/app/features/delivery/deploy-schedule/deploy-schedule.component.ts | ~720 | 300 (component) | ⚠ exceeds — added panel slot ~70 lines |

---

## Behavior Protection (Rule 11)

| File | Tier | Test baseline | Post-edit |
|------|------|---------------|-----------|
| resend_invite.js | logic-touching | 2 tests (C14) | 3 tests passing |
| update_user_email.js | logic-touching | 5 tests (C14) | 6 tests passing |
| Gate Record Modal | unchanged this contract | n/a | n/a |
| Stage Track | logic-touching (binding swap) | none existed | no new tests — covered in UAT |
| delivery-cycle-detail (Escape guard) | logic-touching | none existed | no new tests — covered in UAT |
| delivery-cycle-detail (alert icon Condition A) | logic-touching | none existed | no new tests — covered in UAT |
| gates-summary (panel slot) | layout-touching | none existed | no new tests — covered in UAT |
| deploy-schedule (panel slot) | layout-touching | none existed | no new tests — covered in UAT |

Pre-existing test failure in `update_user.js` system_role validation (`tools.test.js:207`) — out of scope this contract, flagged in C14 candidates and unchanged.

---

## CLAUDE.md Candidates (Rule 16)

- **C-MCP-deploy-status** (NEW) — Render-side division-mcp deploy status is not visible from Code's worktree. UAT regressions on MCP-touching bugs require an explicit confirmation from Phil that the matching MCP deploy is current. Recommend a sentence in the deploy procedure or a CodeClose checklist item.
- **C-Component-size-gates-summary** (NEW) — gates-summary.component.ts now ~610 lines (exceeds 300). Panel slot integration added ~95 lines.
- **C-Component-size-deploy-schedule** (NEW) — deploy-schedule.component.ts now ~720 lines (exceeds 300). Panel slot integration added ~70 lines.
- **C-Repeated-attr-title-pattern** (NEW) — `[attr.title]` should be the default for any tooltip whose value can be null/empty. `[title]` rendering "null" was the root cause for B-101/B-102. Audit other components for similar `[title]` bindings.
- **C-Stale-Migration-019** (carried) — flagged in C14, unchanged.
- **C-Pre-existing-test-fail** (carried) — `update_user.js` system_role test, unchanged.
- **C-Component-size-stage-track** (carried) — unchanged.
- **C-Component-size-detail** (carried) — unchanged, ~2735 lines.
- **C-Component-size-grm** (carried) — unchanged, ~862 lines.
- **C-CSS-budget-warnings** (carried) — same 9 components flagged in C14.
- **C-resend_invite-response-shape** (carried) — unchanged.
- **C-D360-not-in-decisions-active** (carried) — D-360 still not in `decisions-active.md`.

---

## Stage check (S-020)

Per Phil's standing memory: only flag stage advancement *after* Phil has UAT'd, not immediately on deployment. Several features modified this contract — no devStatus changes proposed; awaiting Phil's UAT on deployed gh-pages.

Features touched: Gate Schedule, Deploy Gate by Quarter, Stage Track tooltips, Cycle Detail alert icons + Escape handling, Admin → Users (Invite, Edit Email).

---

## Implementation Status (S-027)

D-308 already in `decisions-active.md` — `impl_status` should advance to `built` once Phil UATs Gate Schedule + Deploy Gate by Quarter panel behavior. Code does not auto-advance; Design audits coverage.

D-360 still missing from `decisions-active.md` — flagged again for Design routing per the C14 instruction.

---

## Non-Code Steps (Phil)

- **Verify division-mcp Render deploy is current.** B-91/B-105 and B-92 fixes are on the MCP layer. If the Render service is still on the C13 build, the new error branches won't fire. Trigger a redeploy if uncertain.
- **UAT Phil** — visit https://phil-dodds.github.io/TRIARQ-OITrustEarly/ after deploy and verify:
  - B-91/B-105: Invite button on a seeded user (no auth account) succeeds with no error banner. Rate limit (rapid retries) shows "Invite rate limit reached — please try again shortly."
  - B-92: Edit email on a seeded user saves `public.users` even if auth lookup or update fails internally.
  - B-97: Pressing Escape on Gate Record Modal closes ONLY the modal — cycle detail panel stays open, list does not reload.
  - B-101: Hovering a gate-blocked next stage circle shows "Requires [Gate Name] approval" — never the gate's submission tooltip.
  - B-102: No "Null" string anywhere on stage circle hover.
  - B-103: A milestone row marked Complete with no actual_date set OR no gate approval shows the ⚠ alert. A milestone with status not in (Complete, Behind) and target date in the past shows the ⚠ alert.
  - D-308 Gate Schedule: Tap a cycle row → detail opens in the right panel of `/delivery/gates`. URL stays at `/delivery/gates`. Tap a different row → same slot updates. × or Escape → closes the panel only, list and route unchanged.
  - D-308 Deploy Gate by Quarter: Same as Gate Schedule. Workstream expansion state preserved through open/close cycles. Multiple workstreams can stay expanded while panel is open.
  - Edit Cycle, free-transition inline confirm, gate diamond click → all work inside the right panel identically to `/delivery/cycles`.

---

## CC-decision sequence completeness (Rule 17)

CC-1, CC-2, CC-3, CC-4, CC-5, CC-6, CC-7, CC-8 — sequential, no gaps.

---

## Output file location

Full Windows path:

`C:\Users\PhilipDodds\OneDrive - Triarq Health\Desktop\OI Trust Project Keepsakes\OI TRUST Early Builds\.claude\worktrees\competent-tharp-d9ef11\.claude\sessions\session-output-2026-05-08-BuildC-Contract15.md`
