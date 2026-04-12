# Standards Summary — Pathways OI Trust
docs/standards-summary.md | v1.0 | April 2026 | CONFIDENTIAL

Read this file at every session start. Active Standards carry the same force as
Non-Negotiable Architectural Rules. A spec element that conflicts with an Active
Standard is not valid without a named exception decision carrying a D-number.

Authoritative source: `standards.md` (canonical document — delivered via session zip).
This file is the Code-facing distillation. If any conflict exists between this file
and `standards.md`, `standards.md` governs.

---

## How to Use This File

Before writing any component or interaction:
1. Identify which Standards apply to the surface you are building.
2. Confirm conformance for each applicable Standard using its Conformance test.
3. If a spec element conflicts with a Standard, raise it per Rule 4 (Debate Before
   Building) before writing any code.
4. If a spec element has no applicable Standard or decision, flag it as an
   undocumented pattern — do not invent behavior.

---

## Active Standards

### S-001 — Visible Context on Every Surface

**Rule:** Every screen shows: what this is (context), why it matters (purpose), and
how to act (next action). Novice-first default. Progressive disclosure for advanced
options. When an action is blocked, tell the user what is blocked AND what needs to
change to unblock it.

**Conformance test:** Does every screen have a visible label identifying what it is, a
purpose statement or implicit context establishing why it matters, and a clear next
action or empty-state instruction? On blocked actions: does the blocked state name what
is blocked and what must change? All yes = pass. Any no = violation.

**Governing decisions:** D-140 (Blocked Action UX Standard).

---

### S-002 — Stage Track UI Pattern

**Rule:** Apply StageTrackComponent when three conditions are met: (1) the record has
a defined lifecycle with discrete ordered stages, (2) the viewer benefits from knowing
relative position, (3) the surface has enough horizontal space to render without
collapsing below legibility. Four node states: Complete, Current, Gate pending (amber —
`--triarq-color-sunray`), Gate blocked (error color). Two render modes: Full (detail
views — all stage nodes plus gate nodes, labels below) and Condensed (dashboard rows —
gate nodes only, stage name as adjacent text). Mode is an explicit input, not inferred
from screen width. Stage Track is read-only — no business logic inside it. Gate nodes
are interactive (click opens gate record); stage nodes are not. On mobile or narrow
panel, collapses to single "Stage X of Y" text indicator with progress bar.

**Conformance test:** Does the Stage Track component take lifecycle definition, current
stage, gate states, and display mode as explicit inputs with no business logic inside
the component? Are node state colors drawn exclusively from the token set (no hardcoded
values)? Is display mode set explicitly in the spec — not inferred from screen width or
viewport? All yes = pass. Any no = violation.

**Governing decisions:** ARCH-25 (Stage Track component contract).

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
`artifact_name`, `approval_status`, `cycle_id`. All pass = compliant. Any fail = violation.

**Governing decisions:** None — S-003 is the authority.

---

### S-004 — Standards Rationale Requirement

**Rule:** Every Active Standard must include a Rationale section with three named parts:
(1) Problem and choice, (2) Balance point, (3) Dirt. A standard without all three parts
may not be Active. Amending a standard requires engaging all three parts.

**Note for Code:** This Standard governs the Design session standards-authoring process,
not Code implementation. Code does not need to apply it during builds. It is included
here so Code can flag if a spec section lacks visible rationale grounding — raise per
Rule 4 if a spec makes a design choice with no cited principle, decision, or Standard.

**Conformance test (Design-facing):** Does every Active Standard have all three labeled
rationale parts, each substantive? All yes = pass. Any missing or placeholder = violation.

---

### S-005 — Universal Entity Detail Pattern

**Rule:** Every named entity has exactly one canonical View surface and one canonical
Edit surface.

- **View** — read-only. Shows all available actions including destructive actions.
  Never shows editable fields.
- **Edit** — separate from View. Mutable fields only. Never surfaces destructive actions.
- **Destructive actions** — available from View only. Require two-step confirmation
  (D-183) before executing.
- **Drill-downs** — any entity reference in View (chips, links, identifiers) is tappable
  and opens that entity's canonical View via the navigation stack (S-006).
- **Trigger** — full-row tap on any list or grid opens the entity's View. Always present.
  Additional explicit triggers permitted but do not replace full-row tap.

**Conformance test:** (1) Does every entity have a single canonical View and a single
canonical Edit? (2) Are destructive actions absent from Edit? (3) Are all entity
references in View tappable? (4) Is the full row tappable on every list and grid? All
yes = pass. Any no = violation.

**Governing decisions:** ARCH-27 (Universal Entity Detail Panel), D-183 (Destructive
Action Confirmation).

---

### S-006 — Entity Detail Navigation Stack

**Rule:** Entity detail navigation uses a push/pop stack. Every drill-in pushes; back
always pops and returns to the exact prior surface (refreshed per S-008). No entity
detail surface opens in a disconnected or free-floating state.

**Viewport adaptation — same model, different rendering:**
- Wide viewport: detail panel opens to the right of the originating surface.
- Narrowing viewport: panel progressively covers more screen width.
- Narrow/mobile: panel renders full-screen; back = standard mobile back gesture.

Same component, same code, same behavior across all viewports. Viewport width
determines rendering only — not behavior, not available actions, not information
architecture. No mobile-specific behavior branches.

**Scope:** Entity detail navigation only. Does not govern top-level sidebar navigation,
authentication flows, or administrative route changes.

**Conformance test:** (1) Does every entity detail navigation action push onto the
stack rather than replace the current surface? (2) Does back always return to the
exact prior surface? (3) Does rendering adapt to viewport width without branching
behavior? (4) Is there any entity detail surface that opens without a clear back path?
All yes (and no to 4) = pass. Any failure = violation.

**Governing decisions:** D-199 (Sidebar-Only Navigation), ARCH-27 (Universal Entity
Detail Panel).

---

### S-007 — Reuse Before Build

**Rule:** When an entity already has a canonical View or Edit surface, that surface is
used everywhere that entity appears in the system. A second View or Edit surface for
the same entity type is never built. The canonical surface adapts its available actions
to the viewer's permissions and the context it was opened from.

**Conformance test:** Does any entity type have more than one View surface or more than
one Edit surface in the codebase? More than one = violation. One canonical per mode = pass.

**Governing decisions:** ARCH-27 (Universal Entity Detail Panel), S-005 (Universal
Entity Detail Pattern).

---

### S-008 — Parent Refresh on Return

**Rule:** Every stack pop (Edit → View, View → list, sub-surface → parent) triggers an
unconditional re-query of the parent surface. The parent never assumes the child session
produced no changes. Applies regardless of whether the user saved, cancelled, or
triggered a destructive action.

**Scope:** All entity detail navigation governed by S-006. Does not apply to top-level
sidebar route changes.

**Conformance test:** On every stack pop, does the parent surface re-query and update
before rendering? Is there any parent surface that retains stale state after a child
navigation returns? All refresh = pass. Any stale state = violation.

**Governing decisions:** S-005 (Universal Entity Detail Pattern), S-006 (Entity Detail
Navigation Stack).

---

### S-009 — Cancelled Item Visibility

**Rule:** Cancelled items are excluded from all list and grid surfaces by default,
system-wide. Surfaces that can contain cancelled items expose an explicit reveal control
(e.g. "Include Cancelled" toggle). The reveal control:
- Is off by default on every screen load.
- Never persists in filter memory — it resets on every screen load regardless of prior
  state. This is an explicit exception to D-171 (Filter and Sort Memory): the cancelled
  reveal state is never written to `user_screen_state`.

**Scope:** All list and grid surfaces. Does not govern summary count cards or aggregate
metrics — those surfaces must document explicitly whether cancelled items are included.

**Conformance test:** (1) Does every list and grid that can contain cancelled items
exclude them by default? (2) Does every reveal control start off on every screen load
regardless of prior session state? (3) Is there any surface writing the cancelled reveal
state to `user_screen_state`? (1) and (2) yes, (3) no = pass. Any failure = violation.

**Named exception:** D-171 is the named exception — cancelled reveal state intentionally
excluded from filter memory. No further justification needed at the surface level.

**Governing decisions:** D-183 (cancelled is a consequential lifecycle state), D-171
(filter memory — this standard is a named exception to it).

---

### S-010 — Filter Panel Structure

**Rule:** Every filterable list or grid surface uses a slide-in filter panel, collapsed by default. A "Filters" button opens it with a count badge when filters are active. Panel contains filter controls only — no sort, no search.

**Conformance test:** Is the filter panel collapsed on default load? Does Filters button show count badge when active? Are sort controls absent from the panel? All yes = pass.

**Governing decisions:** D-HubFilter-2026-04-06.

---

### S-011 — Filter Panel Commit Model

**Rule:** Filter selections do not trigger queries in real time. Panel has "Apply filters" (runs query, closes panel) and "Clear all" (resets to defaults, no query, panel stays open). X closes panel without side effects. No filter change takes effect until Apply is tapped.

**Conformance test:** Does selecting a filter value alone change grid results? (No = pass.) Does Apply run query and close panel? Does Clear all reset without querying? Does X close without side effects? All correct = pass.

**Governing decisions:** D-HubFilter-2026-04-06, D-171.

---

### S-012 — Active Filter Chips

**Rule:** Active filters render as dismissible chips in a bar below the grid header, above grid rows. Format: "FilterName: Value". Tapping chip X removes that filter and immediately re-queries. Chip bar absent when no filters active.

**Conformance test:** Does each active filter produce one chip with "Name: Value" format? Does removing a chip re-query immediately? Is chip bar absent when no filters active? All yes = pass.

**Governing decisions:** D-HubFilter-2026-04-06, D-203.

---

### S-013 — Filter Drill-in Pattern

**Rule:** Each filter row shows name and current value, collapsed. Tapping expands options inline. Only one row expanded at a time — expanding a second collapses the first. No dropdowns or checkbox lists inside the panel.

**Conformance test:** Are filter options hidden until row is tapped? Does expanding one row collapse others? Are dropdowns used inside panel? (No = pass.) Are checkbox lists used inside panel? (No = pass.) All correct = pass.

**Governing decisions:** D-HubFilter-2026-04-06, D-HubFilter-Division, D-HubFilter-AssignedPerson, D-HubFilter-Tier.

---

### S-014 — Component Library Baseline: Angular Material (Material Design 3)

**Rule:** OI Trust uses Angular Material (MD3) as the default component library. Where an OI Trust Active Standard or locked decision specifies different behavior, OI Trust governs. Where no specification exists, Code consults Angular Material / MD3, extracts the rule in binary-testable form, and proposes it as a Standard candidate before implementing. No silent MD3 adoption.

**Conformance test:** Does every component either trace to an OI Trust Active Standard or locked decision, or cite an explicit Angular Material / MD3 reference in a CC-decision or Standard candidate? Yes = pass. Any silent invention = violation.

**Governing decisions:** D-274.

---

## Maintenance Rule

When a new Standard is promoted to Active in a design session, a Section F instruction
must be produced to add it to this file in the same session. Do not defer.

Format for new entries: S-number, Rule (operative text), Conformance test (binary),
Governing decisions (D-numbers with one-line description). Rationale lives in
`standards.md` only — not repeated here.
