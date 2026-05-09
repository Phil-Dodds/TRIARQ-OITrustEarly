# Build C — Contract 15 Specification
<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->
Pathways OI Trust | v1.0 | 2026-05-08 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance

**Supersession declaration:** This spec addresses bug fixes to surfaces previously specced in build-c-spec.md v2.5 (Admin Users, Gate Record Modal, Stage Track) and adds D-308 compliance to Gate Schedule and Deploy Gate by Quarter. For Admin Users: this spec is additive — build-c-spec.md Section 5.x admin surfaces remain operative for all sections not addressed here. For Gate Schedule and Deploy Gate by Quarter: this spec supersedes the implicit "navigate to /delivery/cycles" behavior from the B-94 fix (Contract 14). For Stage Track tooltip behavior: this spec amends build-c-spec.md Section 5.12.

---

## Outcome Statement

Resolve five Contract 14 UAT regressions (B-91/B-92/B-97/B-101/B-102/B-105) and implement D-308 right-panel compliance on Gate Schedule and Deploy Gate by Quarter so cycle detail opens on the originating view without navigation away.

---

## Section 1 — Bug Fixes

### 1.1 B-91 / B-105 — Invite fails for seeded users with no auth account

**Governing principles:** Principle 13 (D-183 — blocked action UX)
**Governing decisions:** D-140: blocked action must tell user what would need to change — never silent failure or opaque error.

**Surface:** Admin → Users (`/admin/users`) — Invite button

**Root cause to investigate:** `resend_invite.js` is returning "Could not retrieve auth account" error for users with no Supabase auth account. The Contract 14 fix (CC-2) intended to drop the auth pre-check entirely and call `inviteUserByEmail` directly. UAT shows the error still fires. Code must read the actual `resend_invite.js` implementation and trace where "Could not retrieve auth account" originates — it may be firing from a different layer (MCP error handler, Angular service, or a second pre-check not covered by CC-2).

**Required behavior:**
- For users with no Supabase auth account (`invite_status = 'not_invited'` or `'invite_expired'`): Invite button calls `inviteUserByEmail` directly. No auth account pre-check. No error surfaced to user for missing auth account.
- On successful invite: status updates to "Invited — awaiting password set." Success message displayed.
- On rate limit hit: surface friendly error "Invite rate limit reached — please try again shortly."
- On any other MCP error: surface D-200 Pattern 3 error inline. Never surface raw error strings.

**Conformance test:** Does clicking Invite on a seeded user (no auth account) fire successfully without error? Yes = pass.

---

### 1.2 B-92 — Email update fails for seeded users with no auth account

**Governing principles:** Principle 13 (D-183)
**Governing decisions:** D-140: blocked action UX. CC-3 (ratified Contract 14): fix targets `approver_user_id`, not `accountable_user_id`.

**Surface:** Admin → Users — Edit form — Email Address field

**Root cause to investigate:** `update_user_email.js` is returning "Could not update email: User not found" for seeded users. Contract 14 CC-3 split the write into two paths: auth update (gated by existence check) and `public.users` update (always runs). UAT shows the `public.users` update is also failing. Code must trace the actual error path — the `public.users` UPDATE may be gated behind the auth check result rather than running independently.

**Required behavior:**
- For users with no Supabase auth account: `public.users` email update always runs regardless of auth account existence. Auth update skipped silently when no auth account found — no error surfaced to user.
- On successful save: list row updates to new email. No error banner.
- On auth update success (user has auth account): both `auth.users` and `public.users` updated.
- On any MCP error affecting `public.users` update: surface D-200 Pattern 3 error inline.

**Conformance test:** Does editing email for a seeded user (no auth account) save successfully with no error? Yes = pass.

---

### 1.3 B-97 — Escape on Gate Record Modal refreshes full cycle list

**Governing decisions:** D-355: Dismiss via ×, Cancel, backdrop, Escape — all close without action. CC-5 (ratified Contract 14): `onDismiss()` path does not trigger panel refresh. Parent `afterClosed` treats `undefined` as no-refresh.

**Surface:** Gate Record Modal (`GateRecordModalComponent`) — Escape key dismiss

**Root cause to investigate:** UAT shows Escape triggers a full list refresh (entire delivery cycles list reloads), not just a panel refresh. This is worse than the original B-97 description. Code must trace what fires on Escape: (1) is the MatDialog `afterClosed` subscription on the parent component triggering a list reload on any close event? (2) is there a route-level reload triggered by the modal close? (3) is the hostlistener for Escape firing multiple close events?

**Required behavior:**
- Escape closes the Gate Record Modal.
- The cycle detail panel behind the modal does NOT refresh.
- The delivery cycles list does NOT refresh.
- No route change occurs.
- No data reload of any kind on Escape dismiss.

**Conformance test:** Does pressing Escape on Gate Record Modal close it with zero list or panel reload? Yes = pass.

---

### 1.4 B-101 — Gate-blocked stage tooltip shows wrong text

**Governing decisions:** D-360: gate-blocked next stage tooltip = "Requires [Gate Name] approval". UAT showed "Go to Build - not yet submitted" instead.

**Surface:** Stage Track — gate-blocked next stage node hover tooltip

**Required behavior:**
- Gate-blocked next stage node (the stage immediately after an uncleared gate): tooltip = "Requires [Gate Name] approval" where [Gate Name] is the human-readable gate label (e.g. "Go to Build", "Go to Deploy").
- Default cursor (arrow) — no pointer.

**Conformance test:** Does hovering over a gate-blocked next stage show "Requires [Gate Name] approval"? Yes = pass.

---

### 1.5 B-102 — Null tooltip on future stage circles

**Governing decisions:** D-360: all stage nodes — completed (non-interactive), active (non-interactive), next free stage (pointer + "Advance to [STAGE]" tooltip), gate-blocked next stage (default cursor + "Requires [Gate Name] approval"), all other future stages (non-interactive). B-98 (Contract 14) fixed active stage null tooltip. B-102 extends: all future stage nodes beyond the next one also show null.

**Surface:** Stage Track — all non-interactive future stage nodes (stages beyond the next transition)

**Required behavior:**
- All future stage nodes beyond the immediate next transition: no tooltip rendered at all. Empty string or null tooltip must not render as "Null" string.
- Completed stage nodes: no tooltip required. If a tooltip is shown, it must not be "Null".
- Active stage node: no tooltip (non-interactive per D-360).

**Fix approach:** Audit the full tooltip binding in `stage-track.component.ts`. Any node whose tooltip value is null, undefined, or empty string must suppress the tooltip entirely — not render the string "Null". Apply a null-guard to all tooltip bindings.

**Conformance test:** Does hovering over any stage circle in the Stage Track produce zero "Null" string tooltips? Yes = pass.

---

### 1.6 B-103 — Missing divergence alert icon on Gates & Milestone Dates

**Governing decisions:** D-205: alert icon ⚠ amber shown when (A) status = Complete but no gate approval record exists OR no actual date set; (B) status ≠ Complete AND status ≠ Behind AND today > target date.

**Surface:** Gates & Milestone Dates zone — status column per gate row

**UAT observation:** Go to Deploy row showed status "On Track" with no target date set and no alert icon. Per D-205 condition (B): today > null target date does not trigger — condition (B) requires a target date to be set. However a separate case: status "On Track" with target date in the past and gate not cleared should show alert. Confirm the alert logic covers both D-205 conditions correctly.

**Required behavior:**
- Alert icon ⚠ (amber, after status dot) renders when:
  - Condition A: `date_status = 'complete'` AND (`actual_date` IS NULL OR no `gate_records` row with `gate_status = 'approved'` for this gate)
  - Condition B: `date_status` NOT IN ('complete', 'behind') AND `target_date` IS NOT NULL AND `target_date` < today
- Alert icon absent when neither condition is met.
- Alert icon absent when `target_date` IS NULL (cannot be overdue without a target).

**Conformance test:** Does a gate row with status "On Track" and a past target date show the ⚠ alert icon? Yes = pass.

---

## Section 2 — D-308 Compliance: Gate Schedule and Deploy Gate by Quarter

**Governing principles:** Principle 10 (D-180 — right panel, originating screen stays visible)
**Governing decisions:** D-308: tappable entity row opens detail in right panel, list stays visible, no navigation. S-018: List → View pattern. S-005: Universal Entity Detail Pattern. D-355: Gate Record Modal triggered from gate diamond within the panel. D-360: free transition inline confirm within the panel.

**Supersession:** The B-94 fix (Contract 14) routed cycle row clicks to `/delivery/cycles?selected_cycle_id=`. This spec supersedes that behavior for Gate Schedule and Deploy Gate by Quarter. Remove the navigation-away routing from both views. All Delivery Cycles (`/delivery/cycles`) is unaffected.

**Reference implementation:** `DeliveryCycleDetailComponent` as rendered on `/delivery/cycles`. Same component, same zones, same actions. No view-specific variant.

---

### 2.1 Gate Schedule (`/delivery/gates`)

**Panel slot:** Add the same right-panel slot used on All Delivery Cycles to the Gate Schedule layout. Panel opens to the right of the gate list. List remains fully visible and interactive while panel is open.

**Scenarios:**

| Trigger | Behavior |
|---|---|
| Tap cycle row anywhere in Gate Schedule | Opens `DeliveryCycleDetailComponent` in right panel. Route stays `/delivery/gates`. No navigation. |
| Panel open — tap different cycle row | First panel closes, second cycle's detail opens in same slot. |
| Panel open — tap same cycle row | No-op. Panel stays open showing same cycle. |
| Panel open — × button or ESC | Panel closes. List stays on `/delivery/gates`. No reload. |
| Panel open — Edit Cycle | Edit state opens in same slot per S-019. Scrim covers list. |
| Panel open — free transition (D-360 Surface 3) | Inline confirm appears within panel below Stage Track. |
| Panel open — gate diamond click | Gate Record Modal opens per D-355. Panel dims behind modal. |
| Panel open — Escape on Gate Record Modal | Modal closes per B-97 fix. Panel and list unaffected. |
| Overdue callout banner — cycle row tap | Same panel behavior as grid row tap. |
| No cycles in view | No panel slot rendered — empty state per D-196. |

**No `?selected_cycle_id=` query param** — panel opens without route change. Remove the navigation-away code from Gate Schedule cycle row click handler.

---

### 2.2 Deploy Gate by Quarter (`/delivery/deploy-schedule`)

**Panel slot:** Same right-panel slot as Gate Schedule and All Delivery Cycles. Opens to the right of the workstream list. List and workstream expansion state remain visible and interactive while panel is open.

**Scenarios:**

| Trigger | Behavior |
|---|---|
| Expand workstream row — tap any cycle row in any section | Opens `DeliveryCycleDetailComponent` in right panel. Route stays `/delivery/deploy-schedule`. No navigation. |
| Panel open — tap cycle in different workstream section | First panel closes, second cycle's detail opens in same slot. |
| Panel open — tap same cycle row | No-op. |
| Panel open — × or ESC | Panel closes. Workstream expansion state preserved. No reload. |
| Panel open — Edit Cycle | Edit state in same slot per S-019. Scrim covers list. |
| Panel open — free transition | Inline confirm within panel per D-360. |
| Panel open — gate diamond | Gate Record Modal per D-355. |
| Workstream row collapsed while panel open | Panel stays open. Collapse does not close panel. |
| Section headers (Prior Quarter / Current Quarter / Other Active) | Non-interactive. No panel trigger. |
| No cycles in any section | Section shows "No cycles" per existing spec. No panel rendered. |

**No `?selected_cycle_id=` query param** — remove navigation-away code from Deploy Gate by Quarter cycle row click handler.

---

## Section 3 — Acceptance Criteria

1. B-91/B-105: Clicking Invite on any seeded user (no auth account) fires invite successfully with no error banner.
2. B-92: Editing email on any seeded user (no auth account) saves `public.users` successfully with no error.
3. B-97: Pressing Escape on Gate Record Modal closes modal only — zero list reload, zero panel reload.
4. B-101: Hovering gate-blocked next stage shows "Requires [Gate Name] approval" tooltip with default cursor.
5. B-102: Zero "Null" strings appear on hover over any stage circle in any Stage Track.
6. B-103: Gate row with `date_status` not in (complete, behind) and `target_date` < today shows ⚠ alert icon.
7. D-308 Gate Schedule: Tapping any cycle row opens right panel on `/delivery/gates` — no navigation to `/delivery/cycles`.
8. D-308 Deploy Gate by Quarter: Tapping any cycle row opens right panel on `/delivery/deploy-schedule` — no navigation to `/delivery/cycles`.
9. D-308 both views: Panel closes on × or ESC with no list reload and no route change.
10. D-308 both views: Gate Record Modal and free transition inline confirm work within the panel identically to All Delivery Cycles.
