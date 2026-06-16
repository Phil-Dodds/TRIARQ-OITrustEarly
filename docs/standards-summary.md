# Standards Summary — Pathways OI Trust
docs/standards-summary.md | v2.0 | June 2026 | CONFIDENTIAL

Read this file at every session start. Active Standards carry the same force as
Non-Negotiable Architectural Rules. A spec element that conflicts with an Active
Standard is not valid without a named exception decision.

---

## Non-Conformance Default

When you discover a violation of any Standard in existing code during a session:
flag it, name the Standard and conformance test that fails, record it as a candidate
in the CodeClose output file, and continue. Do not fix unilaterally.

When building a destructive action with no explicit spec or design decision about
where it surfaces: flag it as a candidate in CodeClose before building.

Per-rule overrides to this default are declared in the rule's Non-conformance
handling section when present. Absence of that section means this default applies.

---

## How to Use This File

Before writing any component or interaction:
1. Identify which Standards apply to the surface you are building.
2. Confirm conformance using each applicable Standard's Conformance test.
3. If a spec element conflicts with a Standard, raise it per Rule 2 before writing
   any code.
4. If a spec element has no applicable Standard or decision, flag it as a candidate
   in CodeClose — do not invent behavior.

---

## Active Standards

### S-001 — Visible Context on Every Surface

**Rule:** Every screen shows: what this is (context), why it matters (purpose), and
how to act (next action). Novice-first default. Progressive disclosure for advanced
options. When an action is blocked, tell the user what is blocked AND what needs to
change to unblock it.

**Conformance test:** Does every screen have a visible label identifying what it is?
Does it have a purpose statement or implicit context? Does it have a clear next action
or empty-state instruction? On blocked actions: does the blocked state name what is
blocked and what must change? All yes = pass. Any no = violation.

**Exceptions:** None.

---

### S-002 — Stage Track UI Pattern

**Rule:** Apply StageTrackComponent when: (1) the record has a defined lifecycle with
discrete ordered stages, (2) the viewer benefits from knowing relative position, (3)
the surface has enough horizontal space without collapsing below legibility. Four node
states: Complete, Current, Gate pending (amber — `--triarq-color-sunray`), Gate blocked
(error color). Two render modes: Full (detail views — all stage nodes plus gate nodes,
labels below) and Condensed (dashboard rows — gate nodes only, stage name as adjacent
text). Mode is an explicit input, not inferred from screen width. Stage Track is
read-only — no business logic inside it. Gate nodes are interactive (click opens gate
record); stage nodes are not. On mobile or narrow panel, collapses to single "Stage X
of Y" text indicator with progress bar.

**Conformance test:** Does the Stage Track component take lifecycle definition, current
stage, gate states, and display mode as explicit inputs with no business logic inside?
Are node state colors drawn exclusively from the token set with no hardcoded values?
Is display mode set explicitly — not inferred from screen width? All yes = pass. Any
no = violation.

**Exceptions:** None.

---

### S-003 — No Bare Generic Nouns

**Rule:** Field names, column headers, UI labels, and schema identifiers must never be
bare generic nouns. Every generic noun (`date`, `name`, `type`, `status`, `id`,
`description`, `notes`) requires a clarifying adjective or qualifying noun. Applies to:
DB schemas, API response fields, UI labels, form fields, report columns, and any named
identifier.

**Conformance test:** Does every field name, column header, UI label, and schema
identifier contain at least one qualifying word beyond a bare generic noun? Fail
examples: `date`, `name`, `status`, `id`. Pass examples: `submission_date`,
`artifact_name`, `approval_status`, `cycle_id`. All pass = compliant. Any fail =
violation.

**Exceptions:** None.

---

### S-005 — Universal Entity Detail Pattern

**Rule:** Every named entity has exactly one canonical View surface and one canonical
Edit surface.
- **View** — read-only. Shows all information needed for orientation and decision-making.
  Surfaces all available actions for the entity. Never shows editable fields.
- **Edit** — separate from View. Mutable fields only. Never surfaces destructive actions.
- **Destructive actions** — placement governed by per-surface spec decision. When no
  explicit spec or design decision exists for where a destructive action surfaces, flag
  it as a candidate in CodeClose before building. Require two-step confirmation per
  D-183 regardless of placement.
- **Drill-downs** — any entity reference in View (chips, links, identifiers) is tappable
  and opens that entity's canonical View via the navigation stack (S-006).
- **Trigger** — full-row tap on any list or grid opens the entity's View. Always present.
  Additional explicit triggers permitted but do not replace full-row tap.

**Conformance test:** Does every entity have a single canonical View and a single
canonical Edit? Does Edit contain any destructive actions? (Yes = violation.) Are all
entity references in View tappable? Is the full row tappable on every list and grid?
One canonical per mode, no destructive actions in Edit, all references tappable, full
row tappable = pass. Any failure = violation.

**Exceptions:** None.

---

### S-006 — Entity Detail Navigation Stack

**Rule:** Entity detail navigation uses a push/pop stack. Every drill-in pushes; back
always pops and returns to the exact prior surface (refreshed per S-008). No entity
detail surface opens in a disconnected or free-floating state.

Viewport adaptation — same model, different rendering:
- Wide viewport: detail panel opens to the right of the originating surface.
- Narrowing viewport: panel progressively covers more screen width.
- Narrow/mobile: panel renders full-screen; back = standard mobile back gesture.

Same component, same code, same behavior across all viewports. Viewport width
determines rendering only — not behavior, not available actions, not information
architecture. No mobile-specific behavior branches.

Scope: entity detail navigation only. Does not govern top-level sidebar navigation,
authentication flows, or administrative route changes.

**Conformance test:** Does every entity detail navigation action push onto the stack
rather than replace the current surface? Does back always return to the exact prior
surface? Does rendering adapt to viewport width without branching behavior or action
differences? Is there any entity detail surface that opens without a clear back path?
All yes (and no to last) = pass. Any failure = violation.

**Exceptions:** None.

---

### S-007 — Reuse Before Build

**Rule:** When an entity already has a canonical View or Edit surface, that surface is
used everywhere that entity appears in the system. A second View or Edit surface for
the same entity type is never built. The canonical surface adapts its available actions
to the viewer's permissions and the context it was opened from.

**Conformance test:** Does any entity type have more than one View surface or more than
one Edit surface in the codebase? More than one = violation. One canonical per mode =
pass.

**Exceptions:** None.

---

### S-008 — Parent Refresh on Return

**Rule:** Every stack pop (Edit → View, View → list, sub-surface → parent) triggers an
unconditional re-query of the parent surface. The parent never assumes the child session
produced no changes. Applies regardless of whether the user saved, cancelled, or
triggered a destructive action.

Scope: all entity detail navigation governed by S-006. Does not apply to top-level
sidebar route changes.

**Conformance test:** On every stack pop, does the parent surface re-query and update
before rendering? Is there any parent surface that retains stale state after a child
navigation returns? All refresh = pass. Any stale state = violation.

**Exceptions:** None.

---

### S-009 — Cancelled Item Visibility

**Rule:** Cancelled items are excluded from all list and grid surfaces by default,
system-wide. Surfaces that can contain cancelled items expose an explicit reveal control
(e.g. "Include Cancelled" toggle). The reveal control is off by default on every screen
load and never persists in filter memory — it resets on every screen load regardless of
prior state. This is an explicit exception to the Filter and Sort Memory pattern: the
cancelled reveal state is never written to `user_screen_state`.

Scope: all list and grid surfaces. Does not govern summary count cards or aggregate
metrics — those surfaces must document explicitly whether cancelled items are included.

**Conformance test:** Does every list and grid that can contain cancelled items exclude
them by default? Does every reveal control start off on every screen load regardless of
prior session state? Is there any surface writing the cancelled reveal state to
`user_screen_state`? First two yes, last no = pass. Any failure = violation.

**Exceptions:** None.

---

### S-010 — Filter Panel Structure

**Rule:** Every filterable list or grid surface uses a slide-in filter panel, collapsed
by default. A "Filters" button opens it with a count badge when filters are active.
Panel contains filter controls only — no sort, no search.

**Conformance test:** Is the filter panel collapsed on default load? Does the Filters
button show a count badge when filters are active? Are sort controls absent from the
panel? All yes = pass. Any no = violation.

**Exceptions:** None.

---

### S-011 — Filter Panel Commit Model

**Rule:** Filter selections do not trigger queries in real time. Panel has two action
buttons: "Apply filters" (runs query, closes panel) and "Clear all" (resets to
defaults, no query, panel stays open). X closes panel without side effects. No filter
change takes effect until Apply is tapped.

**Conformance test:** Does selecting a filter value alone change grid results? (No =
pass.) Does Apply run the query and close the panel? Does Clear all reset without
querying and without closing? Does X close without side effects? All correct = pass.
Any failure = violation.

**Exceptions:** None.

---

### S-012 — Active Filter Chips

**Rule:** Active filters render as dismissible chips in a bar below the grid header,
above grid rows. Format: "FilterName: Value". Tapping a chip's X removes that filter
and immediately re-queries — no Apply required for chip dismissal. Chip bar is absent
when no filters are active.

**Conformance test:** Does each active filter produce exactly one chip in "Name: Value"
format? Does removing a chip re-query immediately without requiring Apply? Is the chip
bar absent when no filters are active? All yes = pass. Any no = violation.

**Exceptions:** None.

---

### S-013 — Filter Drill-in Pattern

**Rule:** Each filter row shows name and current value, collapsed. Tapping expands
options inline. Only one row expanded at a time — expanding a second collapses the
first. No dropdowns or checkbox lists inside the panel.

**Conformance test:** Are filter options hidden until the row is tapped? Does expanding
one row collapse any previously expanded row? Are dropdowns used as filter option
controls inside the panel? (No = pass.) Are inline checkbox lists used? (No = pass.)
All correct = pass. Any failure = violation.

**Exceptions:** None.

---

### S-014 — Component Library Baseline: Angular Material (Material Design 3)

**Rule:** OI Trust uses Angular Material (MD3) as the default component library. Where
an OI Trust Active Standard or locked decision specifies different behavior, OI Trust
governs. Where no specification exists, Code consults Angular Material / MD3, extracts
the applicable rule in binary-testable form, and records it as a candidate in CodeClose
before implementing. No silent MD3 adoption.

**Conformance test:** Does every component either trace to an OI Trust Active Standard
or locked decision, or cite an explicit Angular Material / MD3 reference in a CodeClose
candidate? Yes to either = pass. Any silent invention = violation.

**Exceptions:** None.

---

### S-015 — Secondary Orienting Text Style

**Rule:** Text that orients the user to a surface or zone without being data renders at
11px, italic, color #5A5A5A (Stone). Two named contexts:
1. **Surface description** — descriptive/purpose text appearing below a surface or page
   title on any list, grid, or hub surface.
2. **Zone explanation** — text describing a zone's purpose or instructing the user how
   to interact with it inside an entity detail panel.

Does not govern: field-level hint text, empty-state messages, chip labels, data values,
or actionable placeholders ("Set date").

**Conformance test:** Does every surface description and zone explanation text block
render at 11px, italic, #5A5A5A? Does any data value, hint text, empty state, or
actionable placeholder accidentally receive this style? First yes, second no = pass.
Any failure = violation.

**Exceptions:** None.

---

### S-016 — Create Surface Panel Behavior

**Rule:** New entity creation forms open in the right panel with the originating list
visible behind, identical to View and Edit behavior. A Create form never opens as a
full-width overlay, modal, or page replacement. Applies system-wide.

**Conformance test:** Does every Create surface open in the right panel with the
originating list visible behind? Is there any Create surface that opens as a full-width
overlay, modal dialog, or page replacement? Yes to first, no to second = pass. Any
failure = violation.

**Exceptions:** None.

---

### S-017 — Panel Modality by Surface Type

**Rule:** View panels are non-modal — the originating list remains visible and
interactive, no scrim. Edit and Create panels are modal — a scrim covers the originating
list, which is not interactive while the panel is open. Scrim click = ESC = Cancel for
modal panels. Dirty-state check on scrim click and ESC: if no changes, close
immediately; if changes exist, prompt "Discard unsaved changes?" with Discard and Keep
Editing options. Applies system-wide.

**Conformance test:** Is the list interactive while a View panel is open? (Yes = pass.)
Is the list blocked by a scrim while an Edit or Create panel is open? (Yes = pass.)
Does scrim click on an Edit/Create panel trigger the dirty-state check? (Yes = pass.)
Any failure = violation.

**Exceptions:** None.

---

### S-018 — List → View Pattern

**Rule:** Tapping any entity row or entity chip in a list opens that entity's detail in
a right panel in View state. The originating list remains fully visible and interactive
— no scrim, no navigation away from the list route. The View panel is read-only. One
panel slot only — opening a second entity closes the first. Panel opens in the same
right-panel slot used for Edit and Create on that surface. See S-019 for the
continuation of this flow.

**Conformance test:** Does tapping a list row open a right panel without navigating away
from the list? (Yes = pass.) Is the list interactive while the View panel is open?
(Yes = pass.) Does the View panel contain any save, submit, or destructive action
button? (Yes = fail — View is read-only.) Any failure = violation.

**Exceptions:** None.

---

### S-019 — View → Edit Pattern

**Rule:** From any View panel opened via S-018, an Edit button in the sticky panel
header opens the Edit state for that entity in the same panel slot. The View state is
replaced by the Edit state in place — no new panel, no navigation. Edit panels are
modal: a scrim covers the originating list, which is not interactive. Dirty-state check
on scrim click, ESC, and Cancel: if no changes, close immediately and return to View
state; if changes exist, prompt "Discard unsaved changes?" with Discard and Keep
Editing. On successful save, return to View state showing updated values. See S-018 for
the entry point into this flow.

**Conformance test:** Is the Edit button in the View panel header? (Yes = pass.) Does
Edit open in the same slot as View without navigation? (Yes = pass.) Is a scrim present
while Edit is open? (Yes = pass.) Does ESC/Cancel with unsaved changes trigger the
dirty-state prompt? (Yes = pass.) Does successful save return to View state? (Yes =
pass.) Any failure = violation.

**Exceptions:** None.
---

### S-020 — Feature Stage Advancement Check

**Rule:** At the end of every session where features have been built or modified, review
`devStatus` in `NAV_ITEMS` and flag any feature that appears ready to advance. Do not
advance `devStatus` without explicit confirmation. Format the flag as:
`"Stage check: [Feature] may be ready to advance from [current] to [next]. Reason:
[one sentence]. Want me to update it?"`

Advancement signals:
- `not-started` → `pilot`: Route, component, and MCP tool exist and are deployed.
  Basic happy path works.
- `pilot` → `uat`: Feature used with real data. Core flows work end-to-end.
  Blocked states handled.
- `uat` → `live`: Phil has reviewed. Acceptance criteria from Build Spec are met.
  No known blockers.

**Conformance test:** Does every session close where features were built or modified
include a stage check entry in CodeClose? Yes = pass. Absent = violation.

**Exceptions:** None.

---

### S-021 — Tappable Entity Chips

**Rule:** Every named entity reference in a list row, detail panel, or form renders as
a tappable chip — never plain text. An entity reference is any field value that names
a specific system record: Division, Workstream, user (DS, CB, approver, actor), Gate,
or OI Library artifact.

Visual treatment: pill shape (`border-radius: var(--radius-pill)`), muted background
(`--triarq-color-fog` at low opacity), initials avatar or type icon on left, Roboto
body size. Hover: background darkens, cursor pointer.

Tap behavior: opens referenced entity's detail in the right panel per S-018. Does not
navigate away from the current screen.

Inactive or inaccessible entities: chip still renders. Tap shows read-only summary
only — no action buttons. Never hide a chip because the entity is inactive.

Multiple references in one field: render as separate chips inline. Do not concatenate
to plain text.

Picker selections: after selection via picker, selected value renders as chip (with
remove ✕ for editable fields), not as plain text in an input.

**Conformance test:** Does any named entity reference render as plain text in a list
row, detail panel, or form? Yes = violation. All entity references as chips = pass.

**Exceptions:** None.

---

### S-022 — Entity Picker Pattern

**Rule:** When a form field requires selection of a named entity with attributes
relevant to the correct choice, use an entity picker — not a plain dropdown. Use a
dropdown only for short flat lists of scalar values (under ~8 items, all valid,
unambiguous without context).

Picker structure (sections omitted when not applicable):
```
┌──────────────────────────────────────────┐
│ Select [Entity Type]           [✕ Close] │
├──────────────────────────────────────────┤
│ Scope: ○ [Tightest — default]            │
│        ○ [Wider]  ○ [Widest]             │
├──────────────────────────────────────────┤
│ 🔍 Search…                               │
├──────────────────────────────────────────┤
│ [Avatar · Name · Attr · Status]          │
│ [Inactive row: dimmed, ⊘ badge]          │
├──────────────────────────────────────────┤
│ Selected: [chip with key attributes]     │
├──────────────────────────────────────────┤
│                      [Cancel] [Confirm]  │
└──────────────────────────────────────────┘
```

Scope rules: default is tightest relevant scope. Picker never auto-expands on no
results — show "No results in this scope" with scope radio visible. Scope radio always
visible when multiple scopes exist.

Search rules: always present. Client-side filtering for lists under ~100 records.
Debounced server query for larger scopes: `PICKER_SEARCH_DEBOUNCE_MS = 600` — defined
once as a shared constant, never hardcoded. Loading state during query: skeleton rows
in list area; search field stays active.

Entity rows: `[Avatar] [Name] [Key attr 1] [Key attr 2] [Status badge]`. Active first,
inactive dimmed at bottom. Tapping inactive: blocked message inline, picker stays open.

Echo section: selected entity as chip with key attributes. Tapping a row updates
echo — does not close picker. Confirm commits. Cancel discards.

Implementation: `EntityPickerComponent` is implemented once as a shared configurable
component. Never reimplemented per entity type. `WorkstreamPickerComponent` is the
reference implementation.

**Conformance test:** Does every entity picker use `EntityPickerComponent`? Is
`PICKER_SEARCH_DEBOUNCE_MS` referenced as a constant rather than hardcoded? Does the
picker default to tightest scope? Does scope expansion require deliberate user action?
All yes = pass. Any no = violation.

**Exceptions:** None.

---

### S-023 — Destructive Action Confirmation

**Rule:** Any action that cannot be automatically reversed requires explicit two-step
confirmation stating what will change before the user commits.

Confirmation message must state the specific effect, not just "are you sure":
- Gate approval: "Approving this Gate will advance the Delivery Cycle to [NEXT STAGE].
  This cannot be undone without a stage regression."
- Stage regression: "Regressing to [STAGE] will reset Gates: [list]. Each must be
  resubmitted."
- Workstream inactivation: "Inactivating will block Gate advancement on [N] active
  Cycles. Each must be reassigned before its next Gate can be approved."

Two-call pattern for operations with computed downstream effects: first MCP call
returns a preview of what will change; second call with `confirmed: true` executes.
UI renders preview before showing the confirm button.

Confirmation renders inline within the current form or panel — never a modal dialog.
Cancel is available until the Tier 3 loading overlay takes over on the second call.

"Cannot be undone" means no automatic rollback — not permanent impossibility. Use
"This cannot be undone without [correction path]." Never say "permanent."

**Conformance test:** Does every irreversible action state the specific effect before
asking for confirmation? Does confirmation render inline (not as a modal)? Do
operations with downstream effects use the two-call preview pattern? All yes = pass.
Any no = violation.

**Exceptions:** None.

---

### S-024 — Entity Name Capitalization

**Rule:** Named system entities are capitalized in all user-facing text. General-purpose
nouns describing the same concept are not.

Test: if you could substitute the entity name as a UI label ("View all Delivery
Cycles"), capitalize it. If it appears in a conceptual explanation where any instance
could be substituted ("a delivery cycle is a unit of work"), use lowercase.

Capitalized entities: Division, Workstream, Delivery Cycle, Gate, Artifact, OI Library,
Delivery Workstream, Context Brief, Build Report, Action Queue, Stage Track, Trust,
Milestone.

Applies to: Angular component templates, error messages, empty states, loading state
labels, hub card descriptions, MCP error messages returned to the UI, form field
labels, table column headers.

Does not apply to: TypeScript variable names, database column names, MCP parameter
names, schema identifiers.

**Conformance test:** Does every user-facing reference to a named system entity use
capitalized form in UI labels and error messages? Does any UI label use lowercase for
a named entity? All capitalized = pass. Any lowercase UI label for a named entity =
violation.

**Exceptions:** TypeScript identifiers, schema column names, MCP parameter names.

---

### S-025 — UI Feedback Patterns

**Rule:** Every form, panel, and screen uses exactly three visual feedback patterns.
No new patterns without a locked design decision.

**Pattern 1 — Field Guidance (gray sub-text)**
For: helpful context about when or why a field matters. Not a warning. Not an error.
- Color: `--triarq-color-stone`
- Size: one step below field label
- Position: directly below input field, above next field
- No icon, no background, no border

**Pattern 2 — Warning (amber)**
For: condition requiring attention that does not block the current action.
- Left border: 3px solid `--triarq-color-sunray`
- Background: `--triarq-color-sunray` at 8% opacity
- Text: standard body color (not amber)
- Icon: ⚠ amber, left-aligned
- Position: inline where condition exists — never a floating overlay

**Pattern 3 — Error (red)**
For: validation failure that blocks the current action.
- Field border: 2px solid system error color
- Error message: system error color, below the field
- Icon: ✕ or ⚠ in error color
- Position: adjacent to the field that failed validation

Before adding any new feedback element, identify which pattern applies. If none fits,
surface as a new design decision — do not invent inline.

**Conformance test:** Does every feedback element use one of the three named patterns?
Is there any feedback element that does not map to Pattern 1, 2, or 3? Any unmapped
element = violation. All mapped = pass.

**Exceptions:** None.

---

### S-026 — Sidebar-Only Navigation

**Rule:** OI Trust uses sidebar-only navigation. No top navigation bar. The sidebar
is the single navigation authority for the application.

All navigation lives in the left sidebar. As sidebar items grow, group under section
headers — never move items to a top bar. Implement section headers at 7 or more items.
Section headers use muted uppercase label styling and carry no navigation target.

Current grouping model:
- *(no header)* — Home, Action Queue, Notifications
- **OI Library** — OI Library
- **Delivery** — Delivery Cycle Tracking, Gates, Workstreams
- **Admin** — User Management, System Health, Admin

Primary actions (+ New Cycle and equivalents) live in the content area header — never
in the sidebar.

**Conformance test:** Is there any navigation element outside the left sidebar (top
bar, secondary nav, breadcrumb trail)? Yes = violation. Are primary action buttons
present in the sidebar? Yes = violation. All navigation in sidebar = pass.

**Exceptions:** Port-time host shell provides outer chrome — OI Trust sidebar is
internal to the remote and does not conflict with host-level navigation.

---

### S-027 — Implementation Status Updates

**Rule:** When Claude Code completes implementation of a decision's acceptance
criteria, update `impl_status` from `specced` to `built` in `decisions-active.md`
in the same commit. If no `impl_status` field exists on the decision, add it as
`unspecced` before advancing.

Do not set `impl_status: verified` speculatively. Phil confirms directly, or Code
reports "acceptance criteria met" and Phil confirms in the next session.

**Conformance test:** After implementing a decision, is `impl_status` updated to
`built` in the same commit? Yes = pass. Any decision implemented without status
update = violation.

**Exceptions:** None.

---

### S-028 — Processing Feedback Standard

**Rule:** Every triggered operation shows immediate feedback before the first MCP
call completes. Duration is never a criterion — the indicator appears on every
call without threshold.

Four processing contexts:

**Context A — Button-triggered operations** (saves, submissions, approvals,
confirmations, withdrawals): Button label changes to present-participle form
immediately on tap ("Saving…", "Submitting…", "Approving…", "Confirming…",
"Withdrawing…"). Button disabled during call. On failure: label reverts, button
re-enables, D-200 Pattern 3 error inline adjacent to button.

**Context B — List and picker loading**: Skeleton rows replace list content area
immediately. Search field and scope controls remain active. On failure: Pattern 3
error with Retry link inline. Governs S-022 "skeleton rows in list area."

**Context C — Irreversible two-step operations (second call only)**: D-178 Tier 3
Oravive overlay covers panel on the execution call. Dismisses on success or failure.
Governs S-023 "Tier 3 loading overlay takes over on the second call."

**Context D — Panel-level mutating operation**: Transparent non-interactive overlay
covers the entire panel including the × close button. Nothing tappable during any
write MCP call. Combined with Context A on the triggering button.

**Loading philosophy — synchronous required for:** lists and grids (full load before
any row tappable), View panels (full load before interactive), Edit panels (full load
before form fields interactive).

**Loading philosophy — async permitted only for:** hub landing page card headline
strips and home screen card counts. No other async loading without a locked design
decision.

**Conformance test:** (1) Every button MCP call shows present-participle label change?
(2) Every list/picker load shows skeleton rows? (3) Every two-step second call shows
Tier 3 overlay? (4) Every mutating panel operation locks full panel including ×?
(5) Lists, Views, Edit panels load completely before interactive? (6) Async loads
limited to hub/home cards only? All yes = pass. Any no = violation.

**Exceptions:** Hub landing page card headline strips and home screen card counts
are explicitly async. No other exceptions without a locked design decision.

---

### S-030 — Component Design Standard

**Rule:** Every component has a single, nameable responsibility stated in its class name. When a contract adds behavior to a component, Code first determines whether that behavior belongs in this component or should be extracted to a sub-component or service. Business logic appearing in more than one component is extracted to a shared service — not duplicated. The 300-line threshold is a trigger for the single-responsibility question, not an automatic refactor mandate.

**Conformance test:** Does every component modified in this contract have a nameable single responsibility? Is any duplicated logic extracted rather than copied? Yes to both = compliant.

**Exceptions:** None.

**CodeClose-applicable:** Yes.

**Governing decisions:** D-371 (CSS Budget Warnings: Quality Discipline Not Ceiling Raise)

---

### S-031 — Contract Code Quality Obligations

**Rule:** Three obligations on every contract: (1) Test ratchet — any logic-touching change is protected by a test before the contract closes; any bug fix includes a regression test that would have caught the bug; coverage never decreases. (2) Pattern sweep — when a contract changes a shared pattern, Code searches for the same pattern in other components, reports findings in CodeClose, and flags them as next-contract candidates. (3) Descriptive naming — any method added or modified uses verb+object+context naming that describes the action and subject without requiring the reader to open the method.

**Conformance test:** Does the CodeClose include a test ratchet confirmation? A pattern sweep report when a shared pattern was modified? Do all new/modified methods follow verb+object+context naming? Yes to all three = compliant.

**Exceptions:** None.

**CodeClose-applicable:** Yes.

**Governing decisions:** D-371 (CSS Budget Warnings: Quality Discipline Not Ceiling Raise)

---

### S-032 — Entity Deactivation as Soft Block on New Work

**Rule:** When an entity supports Active/Inactive state with soft-block semantics: (1) New dependent entities cannot reference a deactivated entity — pickers exclude inactive entities, not selectable even when revealed. (2) Existing entities referencing a deactivated entity continue normally — no retroactive disruption. Administrative actions on the entity itself (including removal of members) remain permitted. Reactivation always permitted, no confirmation required. (3) Visual: inactive grid row carries amber warning band (D-200 Pattern 2) with consequence statement. Active Status column/pill on grid and panel. (4) Deactivation confirmation (D-183): "Deactivate [Entity Name]? [Consequence.] Existing [dependent entities] are unaffected." (5) Schema: `active_status boolean NOT NULL DEFAULT true`. Migration required on existing tables. Distinguished from Workstream inactivation (ARCH-23) which blocks gate advancement.

**Conformance test:** Does any new dependent entity reference an inactive entity in pickers? (No = pass.) Does deactivation use D-183 two-step with consequence statement? (Yes = pass.) Does inactive entity row show amber warning band per D-200 Pattern 2? (Yes = pass.) Is `active_status` column present on any entity governed by this standard? (Yes = pass.) Any failure = violation.

**Exceptions:** Reactivation requires no confirmation. Administrative removal operations (e.g., `remove_user_from_division`) permitted on inactive entities.

**CodeClose-applicable:** Yes — declare S-032 conformance in the CodeClose Verification Pass (Rule 29) for any contract touching an entity governed by this standard.

---

### S-033 — Cache-Busting and Version Banner for Static-Hosted Angular Apps

**Rule:** Every TRIARQ Angular app deployed to static hosting must implement: (1) Cache-control meta tags on `index.html` (no-cache, no-store, must-revalidate + Pragma + Expires). (2) `version.json` written at build time with git SHA and `built_at` timestamp. (3) `VersionCheckService` fetching `version.json` on bootstrap (no-store + cache-buster), polling every 5 minutes and on every `NavigationEnd`, exposing `updateAvailable$` observable. (4) Sticky banner in `AppComponent` when deployed SHA differs from boot-time SHA: "A new version of Pathways is available. Reload." with Reload button — user-controlled, preserves in-flight work. (5) `npm run build:prod` chains the version-writer. Applies to all new static-hosted Angular deployments. Existing apps: retrofit when next contract touches `angular/package.json` or `angular/src/index.html`.

**Conformance test:** Are cache-control meta tags present on `index.html`? (Yes = pass.) Does a `version.json` postbuild script exist? (Yes = pass.) Is `VersionCheckService` present, polling on boot + 5min + `NavigationEnd`? (Yes = pass.) Is the sticky version banner present in `AppComponent`? (Yes = pass.) Does `npm run build:prod` chain the version-writer? (Yes = pass.) Any failure = violation.

**Exceptions:** Applies to static-hosted deployments only. Server-rendered or dynamically-hosted apps may use server-side cache headers instead.

**CodeClose-applicable:** Yes — declare S-033 conformance on any contract that introduces a new static-hosted Angular deployment or modifies the build pipeline.

### S-034 — Compact Person Row Layout

**Rule:** All rows displaying a person or named entity with an avatar and secondary attribute use compact single-line layout: avatar 32px, name and secondary attribute (role pill, type label, or equivalent) on the same horizontal line, vertical padding 8px top/bottom per row. Stacked layout (avatar > 32px, secondary attribute below name on its own line) is not permitted on person rows. Applies to: EntityPickerComponent rows, User Management grid rows, Workstream member rows, and any other avatar+subline row system-wide. Exception: grid rows where sub-line content is multi-value (e.g. Division list per D-411) may retain sub-line text below the name; row height and avatar size still compress.

**S-034 — Compact Person Row Layout.** Avatar 32px. Name and role pill on same horizontal line. 8px vertical padding per row. Applies system-wide to all EntityPicker rows and avatar+subline grid rows. Exception: multi-value sub-line content (e.g. Division list) may remain below name; row height still compresses. Governing: D-415.

**Conformance test:** Does any person row use an avatar larger than 32px? (No = pass.) Does any person row display a single secondary attribute below the name on its own line? (No = pass.) Any failure = violation.

**Exceptions:** Multi-value sub-line content (e.g. Division count list per D-411) may retain sub-line position below the name.

**Non-conformance handling:** Raise spec conflict before implementing. Stacked layout on a person row is a violation unless the sub-line content is multi-value.

### S-035 — About Panel Build History Maintenance

**Rule:** At every CodeClose for a contract that touches one or more user-facing surfaces, Code must: (1) produce an About Entry block in the CodeClose output file; (2) prepend the corresponding `ChangelogEntry` object to `CHANGELOG` in `src/app/core/data/changelog.ts` as part of the deployment commit. About Entry block format: `## About Entry — [Contract label]` / `Date: YYYY-MM-DD` / `BuiltAt: HH:MM UTC` / `Items: - [Admin|Trio|All] [surface]: [one line]`. Items from UAT Checklist surface names — one per surface, not per CC-decision. Audience tags: `[Admin]` (admin-role users), `[Trio]` (DCS/EPO/DOL), `[All]` (every user). Tag omitted entirely if audience undetermined — no blank placeholder.

**Conformance test:** For any CodeClose touching a user-facing surface — is an About Entry block present in the CodeClose output? (Yes = pass.) Is `changelog.ts` updated in the deployment commit? (Yes = pass.) Any failure = violation.

**Exceptions:** CodeClose sessions touching only schema, MCP tools, or infrastructure with no user-facing surface change are exempt — state "S-035: no user-facing surface changes this contract — About Entry exempt" in CodeClose output.

**Non-conformance handling:** Missing About Entry block at CodeClose = violation. Code produces it before declaring CodeClose complete.

### S-036 — Grid Column Sort Interaction Standard

**Rule:** Column header is the exclusive sort control (no sort in filter panel). Sortable headers show ↕ on hover only. Click → ascending (↑, bold label). Click again → descending (↓). Click different column → ascending on new column, prior clears. Non-sortable: no hover icon, default cursor. Sortable vs non-sortable declared in each screen's governing decision. Sort state persists per D-171. Default sort per screen declared in screen's own decision.

**Conformance test:** Sortable columns show ↕ hover and ↑/↓ active indicators? Sort control absent from filter panel? Sortable/non-sortable declared in screen's spec? All yes = pass.

**Exceptions:** None.

