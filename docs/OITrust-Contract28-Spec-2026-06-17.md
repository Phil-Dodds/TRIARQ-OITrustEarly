# Contract 28 Specification

**Contract:** 28 — Gate Skip Flow and Status Revert Fix
**Governing decisions:** D-447, D-448, D-449, D-450, D-451
**Date:** 2026-06-17
**Spec author:** Design Session 2026-06-17

---

## Overview

Two workstreams:

- **WS1 — Gate Skip Flow (D-447, D-448, D-449, D-450):** New `skipped` terminal state for gates. Skip interstitial fires when a TRIO submits a gate that has unapproved predecessors. Visual: hollow Oravive diamond. Backdate path to reverse skip. Deploy gate cannot be skipped.
- **WS2 — Status Revert Fix (D-451):** Fix incorrect trigger on `status_override_reason`. Replace hard block with confirmation dialog on complete-revert only. Log revert event to activity feed.

**Governing principles:** Principle 10 (D-180), Principle 11 (D-181), Principle 13 (D-183)

---

## Workstream 1 — Gate Skip Flow (D-447, D-448, D-449, D-450)

### Schema Migration

**Migration 044 — gate_records and cycle_milestone_dates**

`gate_records.gate_status` enum gains `skipped`:
```sql
ALTER TABLE gate_records
  DROP CONSTRAINT gate_records_gate_status_check;
ALTER TABLE gate_records
  ADD CONSTRAINT gate_records_gate_status_check
  CHECK (gate_status IN ('pending','approved','returned','blocked','skipped'));
```

`cycle_milestone_dates.date_status` gains `skipped`:
```sql
ALTER TABLE cycle_milestone_dates
  DROP CONSTRAINT cycle_milestone_dates_date_status_check;
ALTER TABLE cycle_milestone_dates
  ADD CONSTRAINT cycle_milestone_dates_date_status_check
  CHECK (date_status IN ('not_started','on_track','at_risk','behind','complete','skipped'));
```

No new columns. No new tables.

### MCP Changes

**`submit_gate_for_approval.js` — skip interstitial pre-check**

Before existing enforcement checks (§4.2), add:

1. Query `gate_records` and `cycle_milestone_dates` for all predecessor gates of the submitted gate in gate order: `brief_review → go_to_build → go_to_deploy → go_to_release → close_review`.
2. Identify predecessors whose `gate_status` is not `approved` and not `skipped`.
3. If no unapproved predecessors → proceed normally (no change to existing flow).
4. If unapproved predecessors exist AND submitted gate is `go_to_deploy` → return error response:
   ```json
   {
     "error": "DEPLOY_GATE_SKIP_BLOCKED",
     "message": "The Deploy gate cannot be skipped. To submit Go to Deploy for approval, the following gates must be completed or backdated first: [gate list]. You can backdate gates that were completed outside OI Trust.",
     "gates_requiring_action": ["brief_review", "go_to_build"]
   }
   ```
5. If unapproved predecessors exist AND submitted gate is NOT `go_to_deploy` → return interstitial response (not an error — Angular handles the dialog):
   ```json
   {
     "status": "REQUIRES_SKIP_CONFIRMATION",
     "gates_to_skip": ["brief_review"],
     "submitted_gate": "go_to_build",
     "message": "The following gates will be marked as skipped: [gate list]. Continue to submit Go to Build for approval?"
   }
   ```
6. Angular confirms with user, then calls `confirm_gate_skip` (new tool below).

**New tool: `confirm_gate_skip.js`**

Accepts: `delivery_cycle_id`, `gates_to_skip` (array), `submitted_gate`.

Execution sequence (single transaction):
1. For each gate in `gates_to_skip`:
   - Set `gate_records.gate_status = 'skipped'` (upsert — create row if not exists).
   - Set `cycle_milestone_dates.date_status = 'skipped'` for matching gate.
   - Insert `cycle_event_log` row: `event_type = 'gate_skipped'`, `event_description = '[Gate label] skipped — initiative entered system past this gate'`, `actor_user_id` = caller, `event_metadata = { gate_name, skipped_at }`.
2. Proceed with normal `submit_gate_for_approval` flow for `submitted_gate`.
3. Return combined result: skip confirmations + submission result.

**Constraints:**
- `confirm_gate_skip` rejects if any gate in `gates_to_skip` is `go_to_deploy`. Backend enforcement — not UI-only.
- `confirm_gate_skip` rejects if caller is not DCS, EPO, or DOL on the initiative.
- `skipped` cannot be set directly via any other tool — system-only state.

**`set_milestone_actual_date.js` — backdate clears skip**

When `actual_date` is set on a gate whose current `date_status` is `skipped`:
1. Show backdate confirmation in Angular before calling (see Angular section below).
2. On confirmation: set `date_status = 'complete'`, set `actual_date`, set `gate_records.gate_status = 'approved'` — **no approval routing, no approver_user_id populated** (self-asserted historical record).
3. Insert `cycle_event_log` row: `event_type = 'gate_backdated'`, `event_description = '[Gate label] backdated — marked complete as of [date]'`, `actor_user_id` = caller, `event_metadata = { gate_name, backdated_date, previous_status: 'skipped' }`.

**Read tools — `list_delivery_cycles.js` and `get_delivery_cycle.js`**

Return `skipped` as a valid `gate_status` and `date_status` value. No structural change — enum expansion is backward compatible.

**`get_gate_approvals.js` / `list_gate_approvals.js` (Recently Approved Gates, D-431)**

Add filter: exclude rows where `gate_status = 'skipped'`. Skipped gates are never approvals.

### Angular Changes

**StageTrackComponent — `(gateClicked)` handler**

StageTrackComponent already emits `(gateClicked)`. The parent (DeliveryCycleDetailComponent or equivalent) handles the event. Update the handler:

On gate diamond click:
1. Call `submit_gate_for_approval` (existing flow).
2. Check response status:
   - Normal → existing flow, no change.
   - `REQUIRES_SKIP_CONFIRMATION` → open skip interstitial dialog (see below).
   - `DEPLOY_GATE_SKIP_BLOCKED` → open deploy gate blocked dialog (see below).
   - Error → existing error handling.

**Skip interstitial dialog (D-448)**

Material dialog. Not a modal scrim — inline confirmation panel below the gate row (matching Gate Detail Sub-Panel pattern, §7).

Content:
```
The following gates will be marked as skipped:
  · [Gate label 1]
  · [Gate label 2]

Continue to submit [Gate Name] for approval?

[Skip & Submit]  [Cancel]
```

"Skip & Submit" calls `confirm_gate_skip`. On success: refresh gate state, close panel, proceed to normal submission confirmation. On error: surface inline per D-200 Pattern 3.

**Deploy gate blocked dialog (D-450)**

Same panel pattern. Content:
```
The Deploy gate cannot be skipped.

To submit Go to Deploy for approval, the following gates
must be completed or backdated first:
  · [Gate label 1]
  · [Gate label 2]

You can backdate gates that were completed outside OI Trust.

[Close]
```

No confirm option. Close only.

**Skipped gate — Gate Detail Sub-Panel (D-449)**

When a skipped gate diamond is clicked, the Gate Detail Sub-Panel opens with modified content:

- Gate name header
- Status badge: "Skipped" (hollow Oravive diamond + label)
- No Submit button
- No Approve / Return buttons
- Backdate affordance: "This gate was skipped. If it was completed outside OI Trust, you can record the actual date." + date input field + "Record Date" button.
- On "Record Date" click: confirmation dialog: "This will mark [Gate Name] as completed on [date] and remove the skipped status. The gate will be recorded as complete without a formal approval. Continue?" → Confirm / Cancel.
- On confirm: call `set_milestone_actual_date` with backdate flag.

**Visual — skipped gate diamond (D-447)**

In StageTrackComponent token mapping, add:

```
Gate skipped: hollow Oravive (#E96127) stroke, no fill, stroke-width 2px
```

CSS: `fill: transparent; stroke: #E96127; stroke-width: 2px;`

Tooltip on hover: "Skipped — [date skipped formatted as MMM D, YYYY]"

In condensed mode (dashboard/grid track): hollow Oravive diamond, no tooltip (display only per D-447).

**Status dot resolution — D-419 amendment**

In the `computeStatusDot` / status resolution function: treat `skipped` gate status as transparent — skip over it in the resolution chain and evaluate the next gate. If all gates are skipped except Deploy, derive dot from Deploy only.

**Activity feed — gate_skipped and gate_backdated events**

Both new event types must be handled in the activity feed renderer. Display text:
- `gate_skipped`: "[Actor] skipped [Gate Label]"
- `gate_backdated`: "[Actor] recorded [Gate Label] completed on [date]"

Both are filterable event types in the activity feed filter panel (D-439 filter list gains these two entries).

---

## Workstream 2 — Status Revert Fix (D-451)

### Schema — no migration required

`status_override_reason` column retained as nullable text. No structural change.

### MCP Changes

**`update_milestone_status.js` (or equivalent status-setting tool)**

Current trigger: requires `status_override_reason` whenever transitioning away from complete.

**New trigger logic:**
- If `actual_date` IS NOT NULL on the milestone being updated → complete-revert path → Angular must send `status_override_reason = 'confirmed-revert'` in the request body, or MCP returns `REVERT_CONFIRMATION_REQUIRED` response.
- If `actual_date` IS NULL → no requirement, no block. Save proceeds silently.

MCP stores `status_override_reason = 'confirmed-revert'` (fixed system string) when received. Does not accept free-text values — fixed string only.

After successful complete-revert save, insert `cycle_event_log` row:
```
event_type: 'milestone_status_reverted'
event_description: '[Gate label] status reverted from Complete to [new_status]'
actor_user_id: caller
event_metadata: { gate_name, previous_status: 'complete', new_status, previous_actual_date }
```

### Angular Changes

**Gate Detail Sub-Panel — status dropdown change handler**

Current behavior: blocks save and requires `status_override_reason` text on complete revert. No input field exists.

**New behavior:**

1. User changes status dropdown on a gate where `actual_date` is set.
2. Before calling MCP: open confirmation dialog (inline panel, not modal):
   ```
   You are reverting a completed gate. This will be logged.

   [Continue]  [Cancel]
   ```
3. On Continue: call MCP with `status_override_reason = 'confirmed-revert'`. No text field displayed to user.
4. On Cancel: restore previous status value in the dropdown. No MCP call.
5. On any other status change (no `actual_date` set): save immediately, no confirmation, no dialog.

**Activity feed — milestone_status_reverted event**

Display text: "[Actor] reverted [Gate Label] from Complete to [new status]"
Filterable in activity feed filter panel.

---

## Acceptance Criteria

### WS1 — Gate Skip Flow

1. Migration 044 applies cleanly. `gate_records.gate_status` and `cycle_milestone_dates.date_status` both accept `skipped`.
2. Clicking a gate diamond where all predecessor gates are approved or skipped → existing submit flow, no interstitial.
3. Clicking a gate diamond where one or more predecessor gates are unapproved → skip interstitial appears listing the gates to be skipped.
4. Confirming skip interstitial → predecessor gates set to `skipped`, `gate_skipped` events logged, submitted gate proceeds to approval flow.
5. Cancelling skip interstitial → no state change.
6. Skipped gate diamond renders as hollow Oravive stroke, no fill, in both full mode (Initiative detail) and condensed mode (grid track).
7. Skipped gate tooltip: "Skipped — [date]" in full mode.
8. Clicking a skipped gate diamond in Initiative detail → Gate Detail Sub-Panel shows skipped state with Backdate affordance. No Submit button. No Approve/Return buttons.
9. Recording an actual date on a skipped gate → confirmation dialog fires. On confirm: gate transitions to complete, `gate_backdated` event logged, hollow diamond replaced with complete state.
10. Attempting to skip `go_to_deploy` → deploy gate blocked dialog fires. No skip option. Lists gates requiring action.
11. `confirm_gate_skip` rejects `go_to_deploy` in `gates_to_skip` at backend — not UI-only enforcement.
12. Skipped gates excluded from Recently Approved Gates view (D-431) and My Completed Gates home card (D-430).
13. `gate_skipped` and `gate_backdated` events appear in Initiative activity feed.
14. Both event types are filterable in the activity feed filter panel.
15. Status dot resolution: skipped gates treated as transparent in resolution chain. Initiative with all gates skipped except Deploy derives dot from Deploy only.

### WS2 — Status Revert Fix

16. Changing gate status when `actual_date` is NOT set → saves immediately, no confirmation dialog, no block.
17. Changing gate status when `actual_date` IS set → confirmation dialog fires before save.
18. Confirming revert dialog → MCP call succeeds, `milestone_status_reverted` event logged in activity feed.
19. Cancelling revert dialog → dropdown restores previous value, no MCP call.
20. `milestone_status_reverted` event appears in activity feed with correct actor, gate name, and status transition.
21. No free-text `status_override_reason` field displayed to user at any point.

---

## Structural Health Notes

- `confirm_gate_skip.js` is a new MCP tool — expected ~80–100 lines. Under threshold.
- StageTrackComponent gateClicked handler expansion: parent component handles dialog logic. If parent component is already over 300 lines, extract dialog logic into a `GateSkipDialogComponent` (Angular standalone).
- No new DB tables. Two enum expansions via migration.

