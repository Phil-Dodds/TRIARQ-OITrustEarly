# Claude Code Input — Part 2 of 3
# Build C Supplement Specification — 2026-04-04

Pathways OI Trust | April 2026 | CONFIDENTIAL
Owner: Phil Dodds, EVP

**This is Part 2 of 3. Part 1 must be committed and design-principles.md must be at v1.4 before starting this file.**

## Your instructions for this file

1. Read CLAUDE.md, AGENTS.md, and all governing documents — including the updated design-principles.md (v1.4) — before making any changes.
2. Apply all sections below to the current Build C implementation. These are additive specs only — do not re-implement anything already built and working.
3. Raise conflicts against the cited governing principles per Principle 6 (Debate Before Building) before building.
4. Update `impl_status` to `built` in decisions-active.md for each decision as you complete its implementation.
5. Commit all changes and confirm completion before Part 3 is provided.

---

# Build C Supplement Specification

## Purpose

This document fills the gaps Claude Code identified during Build C implementation. The original build-c-spec.md and delivery-cycle-dashboard-spec.md remain authoritative for everything they cover. This supplement adds specifications for surfaces and behaviors that were either unspecified or flagged as thin. Do not re-implement anything already built and working — these are additive specs only.

Confirmed solid (do not touch):

* Delivery Cycle dashboard column set and date state model (delivery-cycle-dashboard-spec.md)
* Delivery Cycle detail view right panel layout (delivery-cycle-dashboard-spec.md)
* StageTrackComponent contract (ARCH-25, design-communication-principles.md Section 5.1)
* Gate workflow (5 gates, gate records, blocked action UX for inactive workstreams)
* All 26 schema migrations and Build C tables

Supplement covers: gate action permission matrix, gate detail sub-panel, cycle create form, artifact attach interaction, Workstream admin UI, home delivery card, delivery hub card content, role-differentiated views, Build Report stub, and Jira sync panel.

---

## 1. Gate Action Permission Matrix

**Source:** D-149 (RACI definitions), D-65 (approval assignment model), D-136 (roles), Session 2026-03-24-H (gate enforcement via business rules MCP)
**Governing principles:** Principle 10 (Right-Panel Entity Detail), Principle 13 (Destructive Action Confirmation)

The business rules MCP governs who can perform which gate action. The UI renders only the actions available to the current user — no ghost buttons, no disabled states with unexplained locks.

### 1.1 Role Definitions Relevant to Gate Actions

| Role | Gate Authority |
|------|---------------|
| Phil | Can approve any gate on any cycle in any Trust |
| DS | Can submit a cycle's gate for approval on cycles where assigned_ds_user_id = their user ID |
| CB | Can submit a cycle's gate for approval on cycles where assigned_cb_user_id = their user ID |
| Division Owner | Can approve gates on cycles in their Division when configured as Accountable approver |
| Admin | No gate action authority — Admin is infrastructure only |
| CE | Read-only — can view gate detail, no action authority |

### 1.2 Gate Action Matrix

| Action | Who Can Perform | Condition |
|--------|----------------|-----------|
| Submit gate for approval | Assigned DS or assigned CB on the cycle | Gate is not yet submitted; cycle is in the correct stage |
| Approve gate | Accountable approver configured for this artifact type + Division (Phil if none configured) | Gate is in Submitted or Under Review state |
| Return gate to submitter | Accountable approver | Gate is in Submitted or Under Review state |
| View gate detail | Any authenticated user with Division access | Always |
| Add review note (Consulted) | Consulted participants configured for this gate | Gate is in Under Review state; Accountable has not yet decided |

### 1.3 UI Rendering Rules

* If the user has no action authority on a gate: render gate detail as read-only. No action buttons.
* If the user is the Accountable approver: render Approve and Return buttons. Approve is primary (filled). Return is secondary (outlined).
* If the user is the DS or CB on the cycle and the gate is ready to submit: render Submit for Approval button.
* If the user is a Consulted participant: render Add Review Note — muted, below the main action zone.
* If the gate is blocked (inactive workstream, missing DS/CB): render blocked state per D-140 — primary message states what is blocked, secondary message states what must change. No action buttons until block is resolved.
* Approval is binding and auto-advances stage. The Approve button carries a confirmation: "Approving this Gate will advance the lifecycle stage to [NEXT STAGE]. This cannot be undone." Inline confirm — not a modal. (Principle 13, Rule 3)

### 1.4 Business Rules MCP Enforcement

All permission checks run server-side in the business rules MCP before any gate state transition. The UI check is a display optimization only — it cannot substitute for server-side enforcement. The MCP returns `{ success: false, blocked: true, reason: "...", resolution: "..." }` on any blocked action. The UI renders this using the D-140 blocked action pattern.

---

## 2. Gate Detail Sub-Panel

**Source:** D-154 (five named gates), Session 2026-03-18-A (gate positions), Session 2026-03-24-E (milestone dates), D-149 (RACI definitions), prototype Build C Screen 3 of 4
**Governing principles:** Principle 10 (Right-Panel Entity Detail), Principle 11 (Tappable Entity Chips), Principle 13 (Destructive Action Confirmation), Principle 14 (Entity Name Capitalization)

Clicking a gate node in the StageTrackComponent opens the gate detail. This renders as a sub-panel below the Stage Track within the right panel detail view — not as a modal, not as a separate page. The list view remains visible.

### 2.1 Gate Detail Sub-Panel Layout

```
┌─────────────────────────────────────────────┐
│ [Gate Name]                     [Close ✕]   │
│ [Cycle Name] · [Division] · Tier [N]        │
├─────────────────────────────────────────────┤
│ GATE STATUS                                 │
│ [Status badge: Pending / Approved /         │
│  Returned / Blocked / Not Yet Active]       │
│                                             │
│ MILESTONE DATE                              │
│ Target: [date or —]    Actual: [date or —]  │
│ Status: [colored badge per D-172-N model]   │
├─────────────────────────────────────────────┤
│ APPROVAL ROUTING                            │
│ Accountable  [Name] · [role]   [A badge]    │
│ Consulted    [Name] · [role]   [C badge]    │  ← if configured
│ Informed     [Name] · [role]   [I badge]    │  ← if configured
│ (Unset → escalation note shown)             │
├─────────────────────────────────────────────┤
│ GATE CHECKLIST                              │
│ ✓ Context Package attached                  │
│ ✓ Outcome Statement set                     │
│ ✓ Technical Specification complete          │  ← varies by gate
│ ✓ Tier classification set                   │
│ ✓ Jira epic linked                          │
│ ✓ MCP scope declared                        │
├─────────────────────────────────────────────┤
│ REVIEW NOTES   (if any)                     │
│ [Reviewer name] · [timestamp]               │
│ [Note text]                                 │
├─────────────────────────────────────────────┤
│ [Action buttons per Section 1.3 above]      │
└─────────────────────────────────────────────┘
```

Approver names (Accountable, Consulted, Informed) render as tappable chips per Principle 11 — tap opens User detail panel per Principle 10.

### 2.2 Gate Checklist by Gate

Each gate renders its own checklist. Items are pass/fail — green checkmark or amber warning. The checklist is informational; gate enforcement is the business rules MCP.

**Brief Review (exits BRIEF, before DESIGN):**

* Context Package attached (at least one artifact in BRIEF stage slots)
* Outcome Statement set on cycle record
* Tier classification set
* Assigned DS set

**Go to Build (exits SPEC, before BUILD):**

* Context Package attached
* Outcome Statement set
* Technical Specification complete (artifact slot filled)
* Tier classification set
* Jira epic linked (D-67)
* MCP scope declared (artifact slot filled or noted)
* Assigned CB set

**Go to Deploy (exits UAT, before PILOT):**

* Delivery Cycle Build Report attached (BUILD stage artifact slot — stub at this build)
* UAT sign-off record attached
* 7-step governance checklist attached (Tier 3 only)
* HITRUST/GRICS checklist attached (Tier 3 only)

**Go to Release (exits PILOT, before RELEASE):**

* Pilot observations log attached
* AI Production Governance Board compliance check complete (Tier 3 agent/Analytics Capability)

**Close Review (exits OUTCOME, before COMPLETE):**

* Outcome measurement record attached
* Outcome Statement matches demonstrated result (user-confirmed checkbox)
* Wiz continuous monitoring baseline attached (Tier 3)

### 2.3 Gate Status States

| Status | Display | Meaning |
|--------|---------|---------|
| Not Yet Active | Gray, muted | Gate is more than one stage ahead of current stage |
| Upcoming | Gray | Gate is the next gate after current stage |
| Pending | Amber (Sunray) | Gate is the current gate; awaiting submission or approval |
| Under Review | Amber (Sunray) | Submitted; Accountable has opened |
| Approved | Primary color | Gate cleared; stage advanced |
| Returned | Warning | Returned to submitter with note |
| Blocked | Error red | Workstream inactive, or required field (DS/CB) missing |

### 2.4 Interaction Note

The sub-panel is dismissible via ✕ or by clicking another gate node. Only one gate detail sub-panel is open at a time — opening a second gate closes the first.

---

## 3. Cycle Create Form

**Source:** D-108 (lifecycle), D-172 (column set), D-174 (DS/CB nullable at creation), Session 2026-03-24-L (Delivery Workstream required), D-67 (Jira link)
**Governing principles:** Principle 10 (Right-Panel Entity Detail), Principle 12 (Entity Picker Pattern), Principle 14 (Entity Name Capitalization)

The create form opens as a right panel, triggered by the "+ New Cycle" button on the dashboard. It does not navigate away from the dashboard.

### 3.1 Field Specification

| Field | Label | Required at Creation | Notes |
|-------|-------|---------------------|-------|
| Cycle title | Delivery Cycle Title | Required | Free text, max 120 chars |
| Division | Division | Required | Dropdown of Divisions the user has access to |
| Delivery Workstream | Delivery Workstream | Required | Dropdown of active workstreams in selected Division. Inactive workstreams not shown. |
| Tier | Tier Classification | Required | Radio: Tier 1 / Tier 2 / Tier 3. No default — user must choose. |
| Assigned DS | Assigned Domain Strategist | Optional at creation | Dropdown of DS-role users in the selected Division. Nullable — business rules MCP blocks Brief Review if null at gate time. |
| Assigned CB | Assigned Capability Builder | Optional at creation | Dropdown of CB-role users in the selected Division. Nullable — business rules MCP blocks Go to Build if null at gate time. |
| Outcome Statement | Outcome Statement | Optional at creation | Textarea. Amber persistent warning displayed inline when null (not a block). |
| Jira Epic Link | Jira Epic Link | Optional at creation | Free text field for Jira epic key (e.g. PS-2026-041). Not validated against Jira at creation — must be in place before Go to Build Gate (D-67). |

### 3.2 Field Order (Visual Sequence)

1. Delivery Cycle Title
2. Division
3. Delivery Workstream (populates after Division is selected)
4. Tier Classification
5. Assigned Domain Strategist
6. Assigned Capability Builder
7. Outcome Statement
8. Jira Epic Link

### 3.3 Form Behavior

* Division selection triggers Delivery Workstream list refresh — only active workstreams in that Division shown.
* If user has access to only one Division, it pre-populates and is read-only.
* Delivery Workstream home Division pre-populates Division when a workstream is selected first (if user enters workstream before Division). Overridable.
* Create button label: "Create Delivery Cycle"
* On success: right panel closes, dashboard row for the new cycle appears at top of list, snackbar confirms "Delivery Cycle created."
* Starting lifecycle stage is always BRIEF — system-set, not user-selectable.
* Outcome Statement null warning: shown inline below the field as a persistent amber note — "Outcome Statement should be set before Brief Review. You can add it now or after creation." Not a validation error — form can be submitted without it.

---

## 4. Artifact Attach Interaction

**Source:** Session 2026-03-25-B (cycle artifact model), Session 2026-03-25-G (pointer transition model), D-146 (supported file formats), ARCH-24 (artifact tracking schema)
**Governing principles:** Principle 10 (Right-Panel Entity Detail), Principle 11 (Tappable Entity Chips), Principle 14 (Entity Name Capitalization)

Artifact attachment surfaces in the cycle detail view within each stage's artifact slots section.

### 4.1 Artifact Slot Display

Each lifecycle stage in the detail view has an **Artifacts** section showing the named slots for that stage (seeded from cycle_artifact_types, locked in Session 2026-03-25-F). Slots for the current and past stages are active — future stage slots are visible but dimmed with a label "Available when Delivery Cycle reaches [STAGE]."

Each slot renders as a card:

```
┌──────────────────────────────────────────┐
│ [Artifact Type Name]                      │
│ [Guidance text from cycle_artifact_types] │
│                                           │
│  [Attach]     [if attached: View / ✕]     │
└──────────────────────────────────────────┘
```

If a file is attached: show file name, file type icon, timestamp, and attached-by user name as a tappable chip (Principle 11). Attach button becomes Replace.

### 4.2 Attach Interaction — Two Entry Types

**External URL / MSO365 link:**

* Inline form expands below the slot card (no modal)
* Fields: Display Name (required, pre-filled from artifact type name — editable), External URL (required)
* Save / Cancel buttons inline
* On save: pointer_status = external_only, external_url populated

**File upload:**

* Inline file picker — clicking Attach triggers native file picker
* Accepted formats: PDF, DOCX, MD, TXT (D-146)
* Max size: 25MB per file
* ClamAV scan runs on upload — spinner during scan
* Clean: file attached, scan result shown as green checkmark
* Rejected: error message inline in the slot — "File rejected by malware scan. Remove and try a different file."
* On success: pointer_status = external_only (OI Library promotion is a separate action)

**Ad hoc attachment (no slot — any stage):**

* "+ Attach Document" link at the bottom of each stage's artifact section
* Opens same inline form as above, but with a Display Name field that is free text (no artifact_type_id — stored as null per ARCH-24)
* User provides their own display name

### 4.3 OI Library Promotion

When an artifact slot has pointer_status = external_only, a "Promote to OI Library" action is available to users with OI Library submission authority. This triggers the OI Library submit flow (UC-21) pre-populated from the cycle artifact metadata. On promotion completion: oi_library_artifact_id populated, pointer_status = promoted, external_url preserved. The slot shows both pointers — OI Library entry as primary, external URL as archived reference (per Session 2026-03-25-G).

**Build Report slot specifically:** pointer_status for the Delivery Cycle Build Report slot is always external_only at this build (stub). The "Submit to OI Library" action is present but shows: "OI Library submission available in Build B." Not wired — do not wire it now.

---

## 5. Delivery Workstream Admin UI

**Source:** Session 2026-03-24-L (workstream registry), Session 2026-03-24-Q (active/inactive enforcement), ARCH-23, prototype Build C Screen 4 of 4
**Governing principles:** Principle 10 (Right-Panel Entity Detail), Principle 11 (Tappable Entity Chips), Principle 13 (Destructive Action Confirmation), Principle 14 (Entity Name Capitalization)

### 5.1 Workstream List Screen

Route: Admin → Delivery Workstream Registry (already routed per Claude Code report)

Page header: "Delivery Workstream Registry"
Subheading: "Named teams of Capability Builders. Every Delivery Cycle must be linked to an active Workstream. Inactive Workstream blocks Gate advancement — no grace period."

List columns (matching prototype):

| Column | Label | Notes |
|--------|-------|-------|
| Workstream avatar | — | Two-letter initials, colored pill |
| Workstream name | Workstream Name | Tappable → opens Workstream detail in right panel (Principle 10) |
| Home Division | Home Division | Tappable chip → Division Detail Panel (Principle 11) |
| Workstream Lead | Workstream Lead | Name tappable chip → User Detail Panel (Principle 11) |
| Active Cycle Count | Active Cycle Count | Count of delivery_cycles linked to this workstream in non-terminal stages |
| Active Status | Active Status | Pill badge: Active (green) / Inactive (gray) |

Actions: "+ New Workstream" button (top right)

Inactive workstream row: amber warning band beneath the row — "Inactive Workstream — Gate advancement blocked on all assigned Delivery Cycles. Reassign active Delivery Cycles before any Gate can be approved."

Filter: Active / Inactive / All toggle (default: Active)

### 5.2 Workstream Detail (Right Panel)

Opens on row click per Principle 10. Fields displayed:

* Workstream Name
* Active Status — toggle (Admin only; toggling to Inactive triggers inline confirmation per Principle 13: "Inactivating this Workstream will block Gate advancement on [N] active Delivery Cycles. Each cycle must be reassigned before its next Gate can be approved.")
* Home Division — tappable chip (Principle 11)
* Workstream Lead — tappable chip → User Detail Panel (Principle 11)
* Members list — CB-role users; each member tappable chip → User Detail Panel. "+ Add Member" for Admin.
* Active Delivery Cycles — list of cycles currently linked; each tappable → cycle detail panel (Principle 10)
* Created Date

### 5.3 Create / Edit Workstream Form

Opens as inline right panel form (same pattern as Cycle Create):

| Field | Label | Required | Notes |
|-------|-------|----------|-------|
| Workstream name | Workstream Name | Required | Free text, max 80 chars |
| Home Division | Home Division | Required | Dropdown of Divisions the user administers |
| Workstream Lead | Workstream Lead | Required | Dropdown of CB-role users in selected Division |
| Members | Workstream Members | Optional at creation | Multi-select of CB-role users |
| Active status | Active at Creation | — | Always active on creation — not configurable at create time |

---

## 6. Home Screen Delivery Card (My Delivery Cycles)

**Source:** D-150 (home screen card definitions), build-a-spec.md Section 6.4 (MyDeliveryCyclesCard shell), D-108 (lifecycle)
**Governing principles:** Principle 14 (Entity Name Capitalization)

Card shell exists (Build A). Data wired in Build C.

### 6.1 Card: My Delivery Cycles

**Visible to:** DS and CB roles (D-150)

**Header:** "My Delivery Cycles"
**Subtext:** "Active cycles where you are assigned as DS or CB."

**Card content — up to 3 rows, each row shows:**

* Cycle title (truncated, one line)
* Stage badge (current lifecycle stage)
* Next Gate name and target date (or "No Gate date set" in gray)
* Tier badge

**Footer link:** "View all [N] cycles →" → navigates to Delivery dashboard filtered to user's cycles

**Empty state:** "No active Delivery Cycles assigned to you." with "+ Start a Delivery Cycle" link (creates cycle with user pre-set as DS or CB depending on their role).

**Data source:** delivery-cycle-mcp `list_my_cycles` tool (or equivalent) — filtered to cycles where assigned_ds_user_id OR assigned_cb_user_id = current user, in non-terminal lifecycle stages.

---

## 7. Delivery Hub Summary Cards

**Source:** D-80 (primitives), D-150, prototype nav (Delivery hub with four summary views)
**Governing principles:** Principle 1 (Workflow Entry Point Completeness), Principle 14 (Entity Name Capitalization)

The Delivery hub page (nav: "Delivery") surfaces four summary views as cards before the main cycle list. Each card is a tap target that filters the dashboard below it.

### 7.1 Four Summary Cards

**Card 1 — Active Cycles**

* Label: "Active Cycles"
* Value: Count of cycles in non-terminal stages across user's accessible Divisions
* Sub-stat: Breakdown by stage (e.g., "3 in SPEC · 2 in BUILD · 1 in UAT")
* Tap: filters dashboard to All Active

**Card 2 — Gates Awaiting Action**

* Label: "Gates Awaiting Your Action"
* Value: Count of Gate records where current user is Accountable approver AND gate status = Submitted or Under Review
* Sub-stat: Oldest Gate name + days waiting (e.g., "Oldest: Go to Build · 4 days")
* Tap: filters dashboard to show only cycles with Gates awaiting current user's action; highlights the Gate column

**Card 3 — Overdue Gates**

* Label: "Overdue Gates"
* Value: Count of Gate records where target date < today AND Gate not yet Approved
* Sub-stat: "Across [N] cycles"
* Tap: filters dashboard to cycles with at least one overdue Gate
* Card accent color: amber (Sunray) if count > 0; neutral if 0

**Card 4 — Workstreams**

* Label: "Active Workstreams"
* Value: Count of active delivery_workstreams in user's accessible Divisions
* Sub-stat: Total active cycle count across all Workstreams
* Tap: navigates to Workstream Registry (Admin) or filters dashboard by Workstream (non-Admin)

---

## 8. Role-Differentiated Views

**Source:** D-136 (system roles), D-150 (home screen card definitions), D-135 (hierarchical admin model)

The UI is role-aware at data scope and action authority — not at screen structure. The same screens render for all roles; what differs is which data appears and which action buttons render.

### 8.1 Dashboard — Role Data Scope

| Role | Cycles Visible |
|------|---------------|
| Phil | All cycles across all Trusts |
| DS | Cycles in Divisions they are assigned to; their own cycles highlighted |
| CB | Cycles in Divisions they are assigned to; their own cycles highlighted |
| CE | Cycles in Divisions they are assigned to; read-only |
| Admin | All cycles in Divisions they administer |

### 8.2 Action Authority by Role — Summary

| Action | Phil | DS | CB | Admin | CE |
|--------|------|----|----|-------|----|
| Create cycle | ✓ | ✓ | ✓ | — | — |
| Submit gate | ✓ | On own cycles | On own cycles | — | — |
| Approve gate | ✓ | If configured as Accountable | If configured as Accountable | — | — |
| Attach artifact | ✓ | On own cycles | On own cycles | — | — |
| Edit Outcome Statement | ✓ | On own cycles | On own cycles | — | — |
| View all cycles | ✓ (all Trusts) | ✓ (own Divisions) | ✓ (own Divisions) | ✓ (admin Divisions) | ✓ (own Divisions, read-only) |
| Workstream admin | ✓ | — | — | ✓ | — |

### 8.3 No Role-Specific Layouts

There are no separate Angular routes or component trees per role. Role differentiation is applied via:

1. Data filtering in MCP tool responses (server-side scope)
2. Conditional rendering of action buttons (per Section 1.3 and ARCH-27)
3. Home screen card set per D-150

Do not create role-specific dashboard components. The same DeliveryDashboardComponent renders for all roles; the MCP response determines what data it displays.

---

## 9. Build Report Stub

**Source:** Session 2026-03-24-P (Build C stub note), Session 2026-03-25-D (Build Report in BUILD stage), D-50 (Build Report at Go to Deploy gate)
**Governing principles:** Principle 14 (Entity Name Capitalization)

The Delivery Cycle Build Report artifact slot exists in the BUILD stage (per the full slot set in Session 2026-03-25-F). Its specification as a stub:

**Slot display:** Renders like any other artifact slot in the BUILD stage — with its guidance text: "As-built record — what was built, how it works, deviations from spec. Complete before Go to Deploy. Input to Pilot, training, and OI Library submission."

**Attach behavior:** Standard attach interaction per Section 4 above — user can attach an external URL or file.

**OI Library submission action:** Present in the slot UI. Label: "Submit to OI Library." Behavior: renders a disabled button with tooltip/note — "OI Library submission available in Build B. Attach the Build Report now and submission will be wired when Build B ships." Do not show an error — show an informational note only.

**Gate enforcement:** Business rules MCP checks for Build Report slot having at least one attachment before allowing Go to Deploy Gate to be submitted (D-50, Tier 2+ cycles). If not attached: blocked action message — "Delivery Cycle Build Report required before Go to Deploy Gate can be submitted. Attach the Build Report in the BUILD stage."

---

## 10. Jira Sync Panel

**Source:** D-67 (Jira link model), D-117 (Jira MCP integration), build-c-spec.md (sync_jira_epic tool)
**Governing principles:** Principle 3 (Visible Context), Principle 14 (Entity Name Capitalization)

The Jira sync panel surfaces on the Cycle Detail View, in the Identity Zone below the core cycle fields.

### 10.1 Panel States

**State 1 — No Jira Link (jira_link_id is null):**

```
Jira Epic Link
[Not linked]    [+ Link Jira Epic]
Jira link required before Go to Build Gate.
```

"+ Link Jira Epic" opens inline form: single text field "Jira Epic Key" (e.g. PS-2026-041). Save / Cancel. No Jira API validation at this build — field is stored as-is.

**State 2 — Jira Link Present, Jira Not Configured (MCP URL is placeholder):**

```
Jira Epic Link
PS-2026-041    [Edit]
⚠ Jira sync unavailable — Jira API not yet configured.
   Epic key saved. Sync will activate when Jira API token is set.
```

No error state — informational note only. The epic key is preserved and displayed.

**State 3 — Jira Link Present, Jira Configured, Sync Active:**

```
Jira Epic Link
PS-2026-041    [Sync Now]  [Edit]
Last synced: [timestamp]
Governance fields written to Jira: Outcome Statement, Context Brief Link,
Tier Classification, Capabilities Equation Mapping, Tech Spec Status
```

"Sync Now" triggers sync_jira_epic MCP tool call. On success: last synced timestamp updates. On failure: inline error — "Jira sync failed. [Error detail]. Try again or contact your admin."

### 10.2 Fields Written to Jira Epic

Per D-117. OI Trust writes these governance fields to the linked Jira epic:

* Outcome Statement (from cycle record)
* Context Brief Link (from BRIEF stage artifact slot — external URL of attached Context Brief)
* Tier Classification (Tier 1 / 2 / 3)
* Capabilities Equation Mapping (from cycle record if field exists — or omit if not yet implemented)
* Technical Specification Status (presence of Tech Spec artifact in SPEC stage slot: Complete / Not Attached)

---

## 11. MCP Tool Count Reconciliation

Claude Code flagged a discrepancy: session notes say 16 tools, actual directory has 20.

**Expected tool set for delivery-cycle-mcp per build-c-spec.md plus decisions:**

* Core cycle tools (list, get, create, update): 4
* Stage/lifecycle tools (get_stage, advance_stage — internal, not user-callable): 2
* Gate tools (submit_gate_for_approval, record_gate_decision, get_gate_record, list_gate_records): 4
* Artifact tools (attach_cycle_artifact, list_cycle_artifacts, update_artifact_pointer): 3
* Workstream tools (list_workstreams, get_workstream, create_workstream, update_workstream): 4
* Milestone date tools (update_milestone_date, update_milestone_status): 2
* Jira tool (sync_jira_epic): 1

**Total expected: 20**

The session notes figure of 16 was the original build-c-spec.md count before Session 2026-04-04 additions (D-171 filter/sort, D-173/174 DS/CB field changes, D-175 Inform/Consult participant tools). The 20-tool count in the repo is correct. No tools need to be removed unless Claude Code identifies a specific tool with no decision backing — flag those by name for review, do not delete speculatively.

---

## 12. Build C Acceptance Criteria — Supplement

These add to (not replace) the acceptance criteria in build-c-spec.md.

| Criterion | How Demonstrated |
|-----------|-----------------|
| Gate action buttons render correctly by role | Log in as DS, CB, Phil, CE in turn. Verify only appropriate actions appear at each gate state. |
| Gate detail sub-panel opens on gate node click | Click each of the 5 gate nodes. Verify sub-panel renders with correct checklist, approver routing, and status. |
| Cycle create form — Workstream required | Attempt to create cycle without selecting a workstream. Verify field-level validation blocks submission. |
| Artifact attach — file scan feedback | Attach a test file. Verify scan spinner, Clean badge on success. |
| Artifact attach — future stage slots dimmed | Open a cycle in BRIEF. Verify BUILD and later stage slots are visible but dimmed with "Available when Delivery Cycle reaches BUILD" label. |
| Build Report slot OI Library stub | Navigate to BUILD stage artifacts. Verify Build Report slot renders with stub note — not an error. |
| Jira panel — unconfigured state | Open a cycle with a Jira link but no Jira API token. Verify informational note renders. |
| Home delivery card — DS/CB role | Log in as DS. Verify My Delivery Cycles card shows only cycles where user is assigned DS or CB. |
| Role data scope — CE read-only | Log in as CE. Verify no action buttons appear on any cycle or Gate. |
| Workstream inactivation warning | Inactivate a Workstream with active cycles. Verify amber warning appears on those cycle rows. |

---

*Pathways OI Trust · Build C Supplement · CONFIDENTIAL · April 2026*
