# Build C — Contract 3: Freeze Fix + UAT Gap Corrections
Pathways OI Trust | 2026-04-10 | CONFIDENTIAL

<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

## SESSION TYPE: MODIFICATION
## BUILD SCOPE: Build C — All Delivery Cycles view, Detail Panel View, Hub Landing Page
## SURFACES IN THIS SESSION:
- delivery-cycles-list.component (MODIFICATION — freeze fix + grid corrections)
- delivery-cycle-detail.component / view panel (MODIFICATION — bug fixes)
- delivery-tracking-hub.component (MODIFICATION — hub card corrections)

---

## Priority Order

Work in this exact sequence. Do not proceed to the next block until the current block is verified working in the browser.

**Block 0 — Diagnostics (complete before touching any code)**
**Block 1 — Freeze fix**
**Block 2 — Hub card corrections**
**Block 3 — Grid corrections**
**Block 4 — Detail panel bug fixes**
**Block 5 — Edit panel bug fix**

---

## Block 0 — Diagnostics

Before writing a single line of code, open browser DevTools on the deployed app and capture:

1. Console errors at page load (any errors, any warnings)
2. Console output when the Filters button is tapped — what runs, does it freeze immediately?
3. Console output when the Cancel button in Edit panel is tapped
4. Network tab — are there any requests that hang or fail?
5. Check every component on the delivery/cycles route for:
   - Unsubscribed Observables (no `takeUntil` or `async` pipe)
   - `setInterval` or `setTimeout` without clearance
   - Any subscription inside `ngOnInit` that triggers another subscription
   - Any infinite loop in `ngOnChanges` or computed signals

Report findings as a CC-decision before writing any code. If the freeze source is identified, state it explicitly. Do not guess — verify.

---

## Block 1 — Freeze Fix

**Current behavior:** Tapping Filters button causes "Page Unresponsive" browser freeze. Cancel button in Edit panel does not respond. Gate diamonds in View panel do not respond. Multiple interactive controls are unresponsive.

**Target behavior:** All interactive controls respond within 200ms. No browser freeze on any action.

**Likely candidates (based on UAT observation):**
- A subscription loop triggered when the filter panel attempts to open
- An unsubscribed BehaviorSubject or Subject being fed in a loop
- A large synchronous computation (e.g., computing gate status for all rows) blocking the main thread

**Fix approach:**
1. Identify the root cause from Block 0 diagnostics
2. Fix the root cause — do not work around it
3. Verify: tap Filters, tap Cancel in Edit, tap a gate diamond — all must respond without freeze
4. If multiple independent causes are found, fix all before moving to Block 2

**CC-decision required:** Record what caused the freeze, what was fixed, and confirm it is resolved.

---

## Block 2 — Hub Landing Page Card Corrections

**Current behavior:** Hub at `/delivery` shows four cards: "Workstream Summary", "Division Summary", "Upcoming Gate Summary", "All Delivery Cycles" — wrong names and wrong set.

**Target behavior:** Four cards per spec Section 5.5 (D-DeliveryHub-FourViews):

| Card Title | Route | Description |
|------------|-------|-------------|
| All Delivery Cycles | /delivery/cycles | Full filterable list of all cycles |
| Workstream Summary | /delivery/workstreams | WIP limit visibility per workstream |
| Gate Schedule | /delivery/gates | Overdue and upcoming gates within 7 days |
| Deploy Gate by Quarter | /delivery/deploy-schedule | Cycles organized by Go to Deploy quarter |

**REMOVE:** "Division Summary" card — this view was removed from Build C scope (D-DeliveryHub-FourViews).
**RENAME:** "Upcoming Gate Summary" → "Gate Schedule"
**ADD:** "Deploy Gate by Quarter" card if missing
**PRESERVE:** Card layout, async headline strip behavior, "Open view →" links

Verify: navigate to `/delivery`, confirm four cards with correct titles and descriptions.

---

## Block 3 — Grid Corrections (All Delivery Cycles)

**Delta instruction — delivery-cycles-list.component:**

**Current behavior:** 5-column grid (Division avatar/no name, Cycle Name + Tier badge, Outcome, Stage condensed, Team). Missing Overdue Gates count card. Division column shows avatar circle with no division name text.

**Target behavior per spec Section 5.6 (D-172):**

REMOVE:
- "Team" column (combined DS+CB) — replaced by separate Assigned DS and Assigned CB columns

ADD:
- Overdue Gates count card (third card) — cycles where any gate target date exceeded and gate not cleared. Hidden at zero. Tappable → sets Gate Status filter to "Overdue"
- Division name text in Division column — display_name_short if present, else division_name. Tappable chip per D-181
- Assigned DS column — tappable chip. Shows name, not avatar only
- Assigned CB column — tappable chip. Shows name, not avatar only

PRESERVE:
- Active Cycles count card
- My Cycles count card
- Tier badge on cycle name row
- Stage Track condensed dots
- Outcome Statement one-line truncation
- "Showing N cycles · sorted by X" footer
- Column headers (Deep Navy background, white text) per D-196

**Columns not required this session** (spec scope, build later):
- Headline (intelligent summary — requires additional MCP work)
- Pilot Start Date
- Production Release Date
- Delivery Workstream chip

**Verify:** Division name visible, DS and CB names visible as separate columns, Overdue Gates card appears when gate is overdue (test by setting a past target date on the test cycle).

---

## Block 4 — Detail Panel View Bug Fixes

**Delta instruction — delivery-cycle-detail.component (View mode):**

**Current behavior (bugs only — preserve what works):**
1. Label reads "Lifecycle Track" — should read "Stage Track" (S-002, P1)
2. Gate diamonds not interactive — tapping does nothing
3. All milestone gates show "Under Review — awaiting decision" regardless of stage position — wrong status logic
4. Brief Review gate shows "Behind" status even when no target date has been set — wrong

**Target behavior:**

FIX 1 — Label: Change "Lifecycle Track" to "Stage Track" everywhere in this component.

FIX 2 — Gate interactivity: Gate diamonds must be tappable. Tapping a gate diamond opens its gate record inline (or scrolls to the Milestone Dates section for that gate). Per spec Section 5.5, this is display-only in current build — "Click a gate diamond to open its record and record a decision." Minimum acceptable: tapping a diamond highlights/selects the corresponding gate row in Milestone Dates section. Full gate record modal is Build C scope but can be deferred if freeze was the blocker.

FIX 3 — Gate status logic: "Under Review — awaiting decision" should only show for the CURRENT gate (the gate corresponding to the cycle's current lifecycle stage). Gates not yet reached should show "Not Started" (gray). Gates already cleared should show "Approved" (with date).

FIX 4 — Milestone date status: "Behind" (red dot) requires BOTH a target date set AND today > target date. When no target date is set, status must show "Not Started" (gray), never "Behind".

PRESERVE: All sections that are working — Outcome Statement display, identity fields, Artifacts section, Jira Sync section, Event Log section, Edit Cycle and Cancel Cycle actions.

---

## Block 5 — Edit Panel Bug Fix

**Current behavior:** Cancel button in Edit Delivery Cycle panel does not respond (likely same freeze root cause as Block 1 — verify after Block 1 fix).

**Target behavior:** Cancel closes the Edit panel and returns to View panel without saving. No confirmation required (no destructive action).

**If Block 1 fix resolves Cancel:** Verify and note in CC-decision. No additional code change needed.
**If Cancel is still broken after Block 1 fix:** Investigate separately. The Cancel button must call the same panel-dismiss method used by the × close button.

---

## Acceptance Criteria

All must pass before closing this contract:

1. No browser freeze on any interaction — Filters button, Cancel button, gate diamonds, row taps all respond within 200ms
2. Hub at `/delivery` shows exactly four cards with correct titles: All Delivery Cycles, Workstream Summary, Gate Schedule, Deploy Gate by Quarter
3. Division Summary card is absent from hub
4. Grid shows Division name (not avatar only), separate DS column, separate CB column
5. Three count cards present: Active Cycles, My Cycles, Overdue Gates (Overdue hidden at zero)
6. Detail panel label reads "Stage Track" not "Lifecycle Track"
7. Gate status logic correct: current gate = "Under Review/awaiting decision", past gates = "Approved", future gates = "Not Started"
8. Milestone date "Behind" status only appears when target date is set AND today > target date
9. Cancel in Edit panel closes panel and returns to View without saving

---

## CC-Decision Requirements

Record a CC-decision for:
- The freeze root cause and fix (required — Block 1)
- Any deviation from this contract's specified behavior
- Any spec gap discovered during implementation

---

## Governing decisions
D-172 (11-column grid), D-196 (column headers always rendered), D-HubCounts-2026-04-06 (three count cards), D-DeliveryHub-FourViews (four hub cards), D-205 (user-controlled milestone status), D-181 (tappable chips), S-002 (Stage Track UI pattern), P1 (Self-Clarifying Labels), D-239 (Thin Contract Standard), D-240 (Plan-Mode Checkpoint)


---

## Standing Rule — D-252 (effective this session)

**Greenfield vs. Modification Execution Model.**

This session contains only MODIFICATION surfaces. The following rule applies to every surface in this contract and is being locked as D-252 — it will be committed to `claude-code-session-rules.md` as part of this session.

> For NEW surfaces, the session spec is the complete blueprint — build from scratch. For MODIFICATION surfaces, the session spec is a delta — the existing component is the blueprint, and the spec annotates what changes. For every MODIFICATION surface: (1) Read the complete existing component file before writing any plan. (2) Produce a plan that lists only the lines/blocks being changed — if the plan describes rebuilding the component, it is wrong. (3) Default to small diffs. A full file rewrite requires a CC-decision stating specifically why surgical modification was not viable. Compliance test: after any MODIFICATION session, every behavior present before the session that was not named in the spec is still present and functioning.

**This session's compliance test:** After all blocks are complete, verify that every working behavior observed in UAT before this session is still present — right panel opens on row tap, Edit panel loads with correct fields, Lifecycle Track renders, Artifacts section renders, Jira Sync section renders, Event Log section renders. If any of these are broken after this session's changes, something was over-written. Fix it before closing.

