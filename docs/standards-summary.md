<!-- standards-summary.md — Pathways OI Trust | v1.1 | April 2026 | CONFIDENTIAL
     Version history:
       v1.0 April 2026: Initial file. S-001 through S-014.
       v1.1 April 2026: Added S-015 through S-019. Removed standards.md reference (wrong
            audience — Code cannot access it). Removed S-004 (Design meta-standard, not
            actionable by Code). Removed Maintenance Rule (Design instruction, wrong audience).
            Applied D-330 (governing references to HTML), D-331 (rationale in HTML,
            Question/Root format), D-333 template (Rule, Conformance test, Exceptions,
            Non-conformance handling). Rule reference updated: Rule 4 → Rule 2.
            Source: Governance session 2026-04-15. -->

# Standards Summary — Pathways OI Trust
docs/standards-summary.md | v1.1 | April 2026 | CONFIDENTIAL

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

<!-- RATIONALE:
     Question/Root: Users arrive at surfaces from many entry points without carrying
       context from where they came. A surface that doesn't declare what it is forces
       the user to reconstruct context mentally.
     Balance: Novice-first default serves all users at onboarding and remains harmless
       to expert users. Cost of visible context to an expert is low; cost of absent
       context to a novice is high.
     Dirt: Does not define how much context is enough — a one-word label technically
       complies. Content quality within the pattern is not governed here.
-->
<!-- GOVERNING: D-140 -->
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

<!-- RATIONALE:
     Question/Root: Delivery Cycles have a 12-stage lifecycle with 5 named gates.
       A text status field answers "where are we now" but not "how far along" or
       "what's next."
     Balance: Visual lifecycle component takes horizontal space and has a minimum
       legible width. Graceful degradation on narrow viewports preserves orientation
       while sacrificing gate-level detail.
     Dirt: Component is presentation-only. Answers "where" but not "what to do next."
       That gap is intentional — a different surface owns next actions.
-->
<!-- GOVERNING: ARCH-25 -->
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

<!-- RATIONALE:
     Question/Root: Bare generic nouns create ambiguity at every level. A field called
       "date" in a schema leaves every reader guessing which date. In a system with many
       entities and many dates, statuses, and IDs, bare nouns accumulate into a
       maintenance and comprehension burden.
     Balance: Rule applies universally including to identifiers that seem unambiguous
       in context — a table called "gate_records" with a column called "status" seems
       readable in context but loses that context in a JOIN result.
     Dirt: Governs form (every identifier must be qualified) but not quality — a field
       called "approval_date" when it records submission time technically complies but
       misleads.
-->
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

<!-- RATIONALE:
     Question/Root: Without a universal pattern, each entity surface gets designed
       independently — producing inconsistent information architecture, inconsistent
       action placement, and inconsistent edit behavior. Users build no transferable
       mental model.
     Balance: A universal pattern constrains entity-specific design freedom. Exceptions
       can be declared with a decision number — the pattern is the default, exceptions
       require justification.
     Dirt: Defines structure but not content — field selection, grouping, and ordering
       within View and Edit are entity-specific and must be specced per entity.
-->
<!-- GOVERNING: ARCH-27, D-183 -->
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

<!-- RATIONALE:
     Question/Root: When entity detail surfaces open in disconnected or replacement
       states, users lose their place and have no reliable return path. Especially
       damaging on mobile.
     Balance: Strict stack means users navigate back through every level they opened —
       no jump-to-top shortcut. Deep stacks signal that information architecture needs
       simplification — the standard creates useful design pressure.
     Dirt: Maximum stack depth is not defined. A user drilling four or five levels deep
       has four or five back-taps to return. Known cost accepted at adoption.
-->
<!-- GOVERNING: D-199, ARCH-27 -->
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

<!-- RATIONALE:
     Question/Root: Without an explicit reuse rule, each new context where an entity
       appears becomes an opportunity to build a slightly different view — tuned for
       that context but diverging from the canonical surface. Over time this produces
       multiple views that drift apart.
     Balance: Strict reuse means the canonical surface must serve all contexts, creating
       pressure to design it well upfront. Context-specific exceptions require a decision
       number.
     Dirt: Canonical surface must handle permission-driven variation — same View shows
       different actions to different roles. Adds complexity that a context-specific
       surface would avoid. Accepted cost of reuse.
-->
<!-- GOVERNING: ARCH-27, S-005 -->
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

<!-- RATIONALE:
     Question/Root: A parent surface that doesn't refresh after a child session may
       display stale data — a cycle that was just cancelled still showing as active.
       Stale state erodes trust in the system.
     Balance: Unconditional refresh means every back navigation triggers a re-query
       including cancels where nothing changed. Query load and potential flicker
       accepted at the scale this system operates.
     Dirt: Requires re-query but does not specify scope — full list, affected row only,
       or something in between. Implementation detail left to per-surface spec.
-->
<!-- GOVERNING: S-005, S-006 -->
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

<!-- RATIONALE:
     Question/Root: A cancelled item is operationally gone from the user's perspective.
       Showing cancelled items by default pollutes the working surface with noise the
       user has explicitly decided to retire.
     Balance: Hide-by-default means users who regularly investigate cancelled items must
       toggle the reveal on every visit — no sticky option. Population of users who want
       a clean active-only view is everyone; population who regularly investigate
       cancelled items is small.
     Dirt: Governs list and grid surfaces but not summary counts and aggregate metrics —
       those are explicitly out of scope. Two adjacent surfaces could give inconsistent
       impressions.
-->
<!-- GOVERNING: D-183, D-171 -->
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

<!-- RATIONALE:
     Question/Root: A persistent filter bar consumes vertical space on every screen load
       even when filters are not in use.
     Balance: Slide-in panel adds one tap to open filters vs. always-visible controls.
       Majority of screen loads do not require filtering — clean default is more valuable
       than saving one tap for the minority that do filter.
     Dirt: Surfaces where filtering is the primary activity may warrant always-visible
       controls. Any such exception requires a named decision.
-->
<!-- GOVERNING: D-HubFilter-2026-04-06 -->
### S-010 — Filter Panel Structure

**Rule:** Every filterable list or grid surface uses a slide-in filter panel, collapsed
by default. A "Filters" button opens it with a count badge when filters are active.
Panel contains filter controls only — no sort, no search.

**Conformance test:** Is the filter panel collapsed on default load? Does the Filters
button show a count badge when filters are active? Are sort controls absent from the
panel? All yes = pass. Any no = violation.

**Exceptions:** None.

---

<!-- RATIONALE:
     Question/Root: Real-time filtering fires a server query on every selection change.
       With six filters and multiple options per filter, a user building a compound
       filter set would trigger 5–10 queries before reaching their intended state.
     Balance: Batch filtering requires an explicit Apply tap. Users accustomed to
       real-time behavior may expect immediate results — Apply button must be prominent.
     Dirt: Clear all resets but does not query — grid continues showing previously
       filtered result until Apply is tapped. Deliberate choice but can feel
       inconsistent.
-->
<!-- GOVERNING: D-HubFilter-2026-04-06, D-171 -->
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

<!-- RATIONALE:
     Question/Root: Active filters that are only visible inside the closed filter panel
       are invisible — users forget what filters are set and cannot tell why the grid
       shows fewer rows.
     Balance: "Name: Value" chip label adds width vs. value-only chips. Accepted —
       value-only chips are ambiguous when multiple filters are active simultaneously.
     Dirt: Chips use display_name_short for Division and Workstream values. If
       display_name_short is not yet populated, chip falls back to full name and may
       be wider than the design assumes.
-->
<!-- GOVERNING: D-HubFilter-2026-04-06, D-203 -->
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

<!-- RATIONALE:
     Question/Root: Showing all filter options expanded simultaneously produces a long
       panel requiring scroll before the user can see all available filters.
     Balance: Drill-in requires two taps to change a filter vs. one tap on a visible
       checkbox. Compact overview of all filters judged more valuable than saving one
       tap per filter change.
     Dirt: One-at-a-time expansion means a user setting three filters must open and
       close each drill-in separately. Revisit if UAT shows users struggling with this
       constraint.
-->
<!-- GOVERNING: D-HubFilter-2026-04-06, D-HubFilter-Division, D-HubFilter-AssignedPerson, D-HubFilter-Tier -->
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

<!-- RATIONALE:
     Question/Root: Without a named component library, Code makes component-level
       judgment calls on every new surface — input field heights, focus rings, motion
       timing, disabled states. These accumulate invisibly and produce visual
       inconsistency.
     Balance: Adopting a component library means accepting its defaults where OI Trust
       hasn't specified differently. Some MD3 defaults may not match TRIARQ brand
       standards — OI Trust decisions and Active Standards override; MD3 fills what
       they don't cover.
     Dirt: Angular Material's component API may constrain some OI Trust design choices.
       When it does, Code surfaces as a CC-decision rather than working around it
       silently.
-->
<!-- GOVERNING: D-274 -->
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

<!-- RATIONALE:
     Question/Root: Orienting text — surface descriptions and zone explanations —
       serves a supporting role. When it renders at the same size and weight as data and
       field labels, it competes visually and adds noise.
     Balance: 11px italic at #5A5A5A (Stone) on white meets minimum contrast for
       supplementary text — readable but clearly secondary. Going smaller or lighter
       sacrifices legibility; going larger or darker undermines visual hierarchy.
     Dirt: Governs style, not content quality. An orienting text block can conform while
       being unhelpful or misleading.
-->
<!-- GOVERNING: D-284, D-288 -->
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

<!-- RATIONALE:
     Question/Root: Without a standard, Create forms are candidates for modal dialogs
       or page replacements. OI Trust uses the right panel for View and Edit — a Create
       form that opens differently breaks the spatial model users have learned.
     Balance: Right-panel Create means the user can see the list behind while creating,
       providing context. The panel covers part of the list — context benefit judged
       higher than coverage cost.
     Dirt: Governs where the form opens, not its internal layout or field order. Content
       quality of Create forms is governed by entity-specific specs.
-->
<!-- GOVERNING: D-290, D-180, S-005 -->
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

<!-- RATIONALE:
     Question/Root: View panels are read-only orientation surfaces — allowing list
       navigation while in View reduces friction for comparing records. Edit and Create
       panels involve in-progress data entry — allowing list navigation while editing
       creates disorientation and data loss risk.
     Balance: Scrim on Edit/Create adds visual weight and blocks list access. Accepted —
       users cannot accidentally navigate away from unsaved work, and the dirty-state
       check gives a clean escape path.
     Dirt: Dirty-state check requires each Edit and Create panel to implement isDirty()
       comparing form state against loaded values. A panel that always returns
       isDirty() = false technically complies but defeats the purpose.
-->
<!-- GOVERNING: D-292, D-291, S-005, S-006 -->
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

<!-- RATIONALE:
     Question/Root: Without a named pattern, every spec must re-derive where tapping a
       row goes and what state the panel opens in. Two failure modes observed: Code
       inventing panel behavior not in the spec, and specs specifying the same behavior
       redundantly across surfaces.
     Balance: Making View non-modal keeps the list accessible while reading entity
       detail — aids comparison and orientation. On narrow viewports this requires
       layout adaptation — orientation benefit judged higher than layout cost.
     Dirt: Governs entry and modality, not panel content. Field set, zone layout, and
       entity-specific display rules are per-entity specs.
-->
<!-- GOVERNING: D-308, D-180, S-005, S-006 -->
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

<!-- RATIONALE:
     Question/Root: Edit surfaces require a distinct entry point from View — users
       should not accidentally trigger edit mode by browsing. The Edit button in the
       View header is the single explicit entry point.
     Balance: Opening Edit in-place means the user cannot reference View state while
       editing. Accepted — the list (visible in non-edit states) provides ambient
       context, and most edit operations on admin entities are intentional corrections
       rather than comparative reviews.
     Dirt: Governs pattern structure — slot reuse, modality, dirty-state check,
       post-save return. Does not govern the Edit form's field set, which fields are
       editable, or validation behavior. Those are per-entity concerns.
-->
<!-- GOVERNING: D-291, D-292, S-016, S-017, S-018 -->
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
