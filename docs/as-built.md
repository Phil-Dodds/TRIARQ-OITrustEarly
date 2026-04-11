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

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
