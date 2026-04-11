# as-built.md
# Pathways OI Trust — Build C As-Built Log
# Pathways OI Trust | Build C | April 2026 | CONFIDENTIAL

This file documents what was actually built in each session, surface by surface.
It is the authoritative record for Design sessions and future Code sessions.

---

## Session 2026-04-10 — Contract 1

### Branch: claude/crazy-cray

### Surfaces Changed

#### 1. All Delivery Cycles Grid

**File:** `angular/src/app/features/delivery/dashboard/delivery-cycle-dashboard.component.ts`

**Change:** Replaced 11-column layout with locked 5-column design per `build-c-visual-correction-spec-2026-04-08.md` Section 1 and `build-c-contract-1-2026-04-10.md`.

**Column spec (grid-template-columns: 48px 88px 180px 1fr 118px 128px):**
- Col 1: Tier dot — 48px contained circle, color per tier (D-197)
- Col 2: Division chip — `division_name` from MCP response (D-203 / CC-Decision-A)
- Col 3: Cycle Name — 2-line clamp, tier badge below
- Col 4: Outcome — 1-line truncation, amber dot when null
- Col 5: Stage — 3-line: stage label / condensed stage track / headline text
- Col 6: Team — CB display name / Workstream short name / DS display name; lift-up when null (CC-Decision-C)

**Right panel:** Row click opens `DeliveryCycleDetailComponent` as right panel (60% width, `position:sticky`) per S-005/S-006. `selectedCycleId` property tracks open panel. `closePanel()` calls `loadCycles()` unconditionally per S-008.

**CC-Decisions recorded in component header:**
- **CC-Decision-2026-04-10-A:** Division chip source is `division_name`. `display_name_short` not yet propagated to list query — update when ARCH-29 propagation reaches list query.
- **CC-Decision-2026-04-10-B:** Overdue gates filter — `filterGateStatus 'overdue'` already present in `applyFilters()`. No addition needed.
- **CC-Decision-2026-04-10-C:** Team cell lift-up — CB / Workstream / DS stacking order; null values collapse (no blank line); all-null renders single "Unassigned" muted label.

---

#### 2. Detail Panel — View Surface

**File:** `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts`

**Change:** S-005/S-006 View surface conversion. Per `build-c-contract-1-2026-04-10.md`.

**Key changes:**
- Added `@Input() cycleId?: string` — accepts cycle ID from dashboard panel embedding
- Added `@Output() close = new EventEmitter<void>()` — dashboard calls `closePanel()` → S-008 re-query
- Added `get panelMode(): boolean` — true when `cycleId` is provided via `@Input`
- Added `ngOnChanges()` — reloads cycle when `cycleId` input changes
- Updated `ngOnInit()` — uses `this.cycleId ?? route.snapshot.paramMap.get('cycle_id')`
- Removed `loadAllUsers()` call from `ngOnInit()` — not needed in View
- Outer wrapper: `[ngStyle]` panel-aware — no max-width in panel mode; `max-width:860px` in route mode
- Added panel close button (✕) visible only in panel mode
- DS/CB section: replaced inline edit dropdowns with display-only name display
- Outcome Statement: display-only (removed edit button and textarea form)
- Milestone Dates: display-only (removed inline target date and actual date editing)
- **D-244:** Added Milestone Status 5-color dot indicator per gate row (new `milestoneStatusDotColor()` method)
- **D-245:** Added Gate Approval Status contextual narrative text per gate row (new `gateApprovalNarrative()` and `gateApprovalNarrativeColor()` methods)
- **5-action Action Zone** (replacing old Advance/Regress/Hold button group):
  1. Edit Cycle — always shown; stub navigates to edit route (Contract 2)
  2. Submit Gate for Approval — when `pendingGateForSubmit` is non-null and caller can submit
  3. Regress Stage — `canRegress` true; D-179 two-call pattern preserved
  4. Cancel Cycle — `canCancelCycle` true; D-183 two-step inline confirmation
  5. Un-cancel Cycle — `CANCELLED` stage only; D-183 two-step inline confirmation
- Removed: Advance Stage button, Place on Hold button, Resume from Hold button, Hold reason form

**New getters:**
- `canCancelCycle` — not CANCELLED and not COMPLETE
- `pendingGateForSubmit` — next gate for current stage that is not yet `pending` or `approved`

**New methods:**
- `editCycleStub()` — window.alert stub for Contract 2
- `cancelCycleAction()` — calls `delivery.cancelCycle()`
- `uncancelCycleAction()` — calls `delivery.uncancelCycle()`
- `milestoneStatusDotColor(dateStatus)` — D-244 5-color mapping
- `gateApprovalNarrative(gateName)` — D-245 narrative text
- `gateApprovalNarrativeColor(gateName)` — D-245 color per gate status

**Note:** DS/CB edit methods (`startDsEdit`, `saveDs`, etc.) remain in the class but are no longer called from the template. They will be removed or reused in Contract 2 (Edit Cycle surface).

---

#### 3. Delivery Service

**File:** `angular/src/app/core/services/delivery.service.ts`

**Change:** Added two new methods needed for the Cancel/Un-cancel actions in the detail panel action zone:
- `cancelCycle(delivery_cycle_id)` — calls `cancel_delivery_cycle` MCP tool
- `uncancelCycle(delivery_cycle_id)` — calls `uncancel_delivery_cycle` MCP tool

---

### Build Status

TypeScript type check: **0 errors**
Full ng build: pending deployment verification

---

### Decisions in Effect (Session 2026-04-10)

| Reference | Description |
|---|---|
| D-240 | Plan-mode checkpoint executed before any code |
| D-241 | as-built.md updated at session close |
| D-244 | Stage Track diamonds — clearance-state only; Milestone Status 5-color dot on gate rows |
| D-245 | Gate Approval Status as contextual narrative text on gate rows |
| S-005 | View/Edit separation — View is display-only; Edit Cycle in Contract 2 |
| S-006 | Entity detail in right panel; close emits event for parent to re-query |
| S-008 | Parent re-queries unconditionally on every stack pop (closePanel → loadCycles) |
| D-183 | Destructive action two-step inline confirmation — Cancel and Un-cancel cycle |

---

## Session 2026-04-10 — Contract 2

### Branch: claude/crazy-cray (continues from Contract 1 on same branch)

---

### New Additions

#### 1. update_delivery_cycle MCP Tool (CC-Decision-2026-04-10-D)

**File:** `mcp/delivery-cycle-mcp/src/tools/update_delivery_cycle.js`

**Implemented:** Net-new MCP tool built this session — not a correction to an existing tool.
Accepts 8 mutable fields (`cycle_title`, `division_id`, `outcome_statement`, `workstream_id`,
`tier_classification`, `assigned_ds_user_id`, `assigned_cb_user_id`, `jira_epic_key`).
Only supplied fields are written. Validates FK references. Logs one `field_edit` event per
changed field per D-229. Rejects saves on cancelled cycles. Registered in `index.js` TOOLS registry.

**Deviations:** None — this tool was absent and required; built as approved in pre-build gap report.

**Open questions:** None.

---

#### 2. updateCycle() on DeliveryService

**File:** `angular/src/app/core/services/delivery.service.ts`

**Implemented:** Added `updateCycle()` method wrapping `update_delivery_cycle` MCP tool.
Accepts same 8 mutable fields with nullable support for clearable fields.

**Deviations:** None.

**Open questions:** None.

---

### Modified Surfaces

#### 3. Detail Panel — Edit Surface (new build)

**File:** `angular/src/app/features/delivery/edit-panel/delivery-cycle-edit-panel.component.ts`

**Implemented:** Full new build per `delivery-cycle-detail-panel-spec-2026-04-09.md` Section 2.
Standalone component. Deep Navy header. Save + Cancel always visible. 8 fields in spec order.
Tier as dropdown (not option cards — Edit spec only; option cards are Create form only per
acceptance check #4). D-228 amber non-blocking warning when Tier changed on cycle with gate records.
Division change: re-scopes Workstream picker, clears Workstream with inline note when unavailable
in new Division. Loads accessible divisions self-contained via `get_user_divisions` MCP.
Save calls `updateCycle()` with changed-fields-only payload; on success emits `saved`.
Cancel emits `cancelled` with no save or re-query.

**Deviations:**
- **CC-Decision-2026-04-10-E:** Approver comparison on Division change stubbed — `get_division_gate_approvers` MCP tool and backing table not yet built. Division rescopes Workstream and clears if unavailable; approver warning omitted until tool exists. Routed to Design.

**Open questions:** When will `get_division_gate_approvers` be built? Required to complete Section 2.4 spec fully.

---

#### 4. Detail Panel — View Surface (Edit wire-up)

**File:** `angular/src/app/features/delivery/detail/delivery-cycle-detail.component.ts`

**Change:** Replaced `editCycleStub()` (`window.alert`) with full S-006 Edit panel integration.

**Key changes:**
- Added `import DeliveryCycleEditPanelComponent` and added to `imports[]`
- Added `showEditPanel = false` property
- Replaced `editCycleStub()` → `openEditPanel()` (sets `showEditPanel = true`)
- Added `onEditSaved()` — sets `showEditPanel = false`, calls `loadCycle()` per S-008
- Added `onEditCancelled()` — sets `showEditPanel = false`, no re-query per spec 2.6
- Added `position:relative` to main content wrapper div so overlay positioning works
- Added `<app-delivery-cycle-edit-panel>` overlay block at top of main content wrapper

**Rule 16 tier:** Logic-touching — `editCycleStub()` method replaced with real behavior.

**Deviations:** None.

**Open questions:** None.

---

#### 5. Create Cycle Form — Two Targeted Corrections

**File:** `angular/src/app/features/delivery/create-panel/delivery-cycle-create-panel.component.ts`

**Correction 1 — Outcome Statement:**
Removed `cp-amber-warning` block (persistent amber warning). Replaced with `cp-gate-note`
gray hint: "Should be set before Brief Review Gate." Amber warning CSS class removed from styles.

**Correction 2 — Tier Classification:**
Removed `cp-radio-group` radio button rendering. Replaced with `cp-tier-cards` option card layout.
Three cards: Tier 1 — Fast Lane / Tier 2 — Structured / Tier 3 — Governed. Selected state via
`cp-tier-card--selected` class. FormControl binding and `Validators.required` preserved.
New tier card CSS added to component styles.

**Deviations:** None. All other form fields, behavior, and layout preserved.

**Open questions:** None.

---

#### 6. Workstream Picker — One Targeted Correction

**File:** `angular/src/app/shared/pickers/workstream-picker/workstream-picker.component.ts`

**Change:** Moved Show Inactive toggle from below-scope-tabs position to header upper right.
Toggle is now inline with the header, right of the title, left of the close button.
Label shortened to "Show inactive" to fit header width.
All other behavior, scope tabs, entity rows, echo section, and footer preserved.

**Deviations:** Label shortened from "Show inactive Workstreams" to "Show inactive" for header fit.
CC-Decision-2026-04-10-F: Label shortened for header layout — full label text preserved in aria context via the checkbox itself. If Design requires full label text surface it for a header layout discussion.

**Open questions:** None.

---

#### 7. claude-code-session-rules.md

**File:** `claude-code-session-rules.md`

**Change:** Added Rule 19 (D-240 Plan-Mode Checkpoint) and Rule 20 (D-241 As-Built Document).
Version bumped from v1.2 to v1.3.

**Deviations:** None.

**Open questions:** None.

---

#### 8. CLAUDE.md

**File:** `CLAUDE.md`

**Change:** Added "Design Contract Standards" section covering D-239, D-242, D-243 as new rules
per Contract 2 instruction.

**Deviations:** None.

**Open questions:** None.

---

### Structural Health (Rule 17)

| File | Line Count | Threshold | Status |
|---|---|---|---|
| `delivery-cycle-detail.component.ts` | 2593+ | 300 (component) | Over — route to Design refactor session |
| `workstream-picker.component.ts` | 420 | 300 (component) | Over — route to Design refactor session |
| `delivery.service.ts` | ~260 | 400 (service) | Under — OK |

---

### CC-Decisions This Session

| Decision | Description |
|---|---|
| CC-Decision-2026-04-10-D | `update_delivery_cycle` MCP tool built net-new this session. Required for Edit surface save path. Not a correction to existing tools. |
| CC-Decision-2026-04-10-E | Approver comparison on Division change stubbed — `get_division_gate_approvers` not yet built. Workstream rescope and clear implemented in full; approver warning absent until tool exists. |
| CC-Decision-2026-04-10-F | Workstream Picker "Show inactive" label shortened from "Show inactive Workstreams" for header layout fit. |

---

### Decisions in Effect (Contract 2)

| Reference | Description |
|---|---|
| D-239 | Thin contract — no scope expansion beyond contract |
| D-240 | Plan-mode checkpoint before any file modification |
| D-241 | As-built.md updated at session close |
| D-242 | Field completeness — no inferred fields |
| D-243 | Spec completeness — no inferred behavior |
| D-228 | Amber non-blocking warning on Tier change with existing gate records |
| D-229 | All update_delivery_cycle saves log field_edit events |
| S-005 | Edit is separate surface from View. Gates/artifacts in View only. |
| S-006 | Edit pushes onto navigation stack. Back pops. Overlay pattern implemented. |
| S-008 | Unconditional re-query on Edit save (onEditSaved → loadCycle) |

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
