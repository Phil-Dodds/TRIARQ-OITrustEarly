# Design Principles — Pathways OI Trust
# Pathways OI Trust | April 2026 | CONFIDENTIAL | v1.4
# Authoritative source for UX and navigation design principles.
# Referenced from CLAUDE.md. Feed to Claude Code and Claude Chat at session start.

---

## How to use this document

These principles are **locked design constraints**, not suggestions. They have the same standing as architectural rules in CLAUDE.md. When building any new feature:

1. Identify the entry point before writing a single component
2. Identify the workflow steps before designing a single form
3. Identify the blocked-action messages before writing any error handler

If a principle conflicts with a Build Specification detail, raise the conflict — do not resolve it silently.

---

## Principle 1 — Workflow Entry Point Completeness (D-163)

**Statement:** Every user-facing function must be reachable from exactly one declared entry point appropriate to its frequency and trigger type. A feature that has no entry point is not done, regardless of whether the route and component exist.

### The three valid entry point types

| Type | When to use | Implemented as |
|---|---|---|
| **Sidebar nav item** | Persistent function the user initiates on demand | `NAV_ITEMS` array in `sidebar.component.ts` |
| **Home page card** | Role-relevant summary the user checks regularly | Card component in `home.component.html`, `showX` getter in `home.component.ts` |
| **Action Queue / Notification** | System-initiated, event-driven workflow | Entry in My Action Queue card or My Notifications card |

Every new feature falls into one of these three categories. The decision must be made and implemented before the feature is considered complete.

### Rules

**Rule 1 — Declare the entry point first.**
Before writing any component for a new feature, state which entry point type it uses and update that entry point in the same PR/commit. A route without an entry point is a build error.

**Rule 2 — Role visibility must be correct at the entry point.**
The sidebar `roles` array and the home component `showX` getter must include every role that is permitted to use the feature. Roles that are excluded from the entry point cannot reach the feature, even if the route exists. Test entry point visibility for every role before marking the feature done.

**Rule 3 — Sequential workflows declare their steps.**
Any workflow that requires more than one user action must communicate:
- What step the user is on (if applicable)
- What is needed to proceed (prerequisites, required fields)
- What is blocked and why, and what needs to change (D-140)
- What happens after the current step completes

**Rule 4 — Entry points are grouped by function, not by build sequence.**
Do not add admin functions as individual sidebar links. Admin functions belong in the Admin hub. Do not add role-restricted features to the sidebar as separate top-level items when they belong to an existing module.

### What triggered this principle

Build C delivered Delivery Cycle Tracking with a complete route, component, and MCP server — but the sidebar entry point was restricted to `['ds','cb']`, excluding Phil. The home page card was a non-functional stub. The admin entry point (Workstream Admin) was a loose sidebar link rather than part of the Admin hub. The feature was functionally complete but unreachable for the primary user. This principle prevents that failure mode.

### Checklist — apply before marking any feature done

- [ ] Entry point type declared (sidebar / home card / action queue)
- [ ] Sidebar `NAV_ITEMS` updated if sidebar is the entry point
- [ ] `showX` getter in `home.component.ts` updated if home card is the entry point
- [ ] Role array correct — includes all permitted roles, excludes all excluded roles
- [ ] Entry point tested for each role in the permitted list
- [ ] If admin function: added to Admin hub, not as a loose sidebar link
- [ ] If sequential workflow: steps, prerequisites, and blocked-action messages defined

---

## Principle 2 — Admin Hub Consolidation (D-164)

**Statement:** All administrative functions are grouped under a single Admin hub, accessible from a single sidebar entry point. Admin functions are never individual top-level sidebar links.

### Structure

```
Sidebar → Admin  →  /admin  (Admin Hub page)
                     ├── Workstreams       /admin/workstreams
                     ├── Divisions         /admin/divisions
                     ├── Users             /admin/users
                     └── [future admin functions added here, not to sidebar]
```

### Rules

**Rule 1 — One sidebar entry.** The sidebar has exactly one `Admin` link for `['phil','admin']` roles. No admin sub-function appears as a direct sidebar link.

**Rule 2 — Hub page is a card grid.** The `/admin` route renders a hub page with one card per admin function. Each card states: what the function does, who it is for, and links directly to the function route.

**Rule 3 — Admin routes are stable.** Sub-routes (`/admin/workstreams`, `/admin/divisions`, `/admin/users`) do not change when new admin functions are added. New functions add a new sub-route and a new card on the hub.

**Rule 4 — Hub card follows Design Principle 4.2.** Each admin hub card includes a one-sentence description of what the function does and why an admin would use it. Never a bare link with no context.

### What triggered this principle

Build C added `Workstream Admin` as a direct sidebar link alongside `Divisions` and `Users`. This pattern does not scale — every new admin function would add a sidebar link. The Admin hub pattern scales indefinitely.

---

## Principle 3 — Visible Context (carried from Design Principle 4.2)

**Statement:** Every screen must answer three questions for the user, without requiring them to already know the system:

1. **What** — What is this screen / what does this function do?
2. **Why** — Why would I use it / what problem does it solve?
3. **How** — How do I get started / what is the first action?

### Application

- Every list screen that can be empty must have an empty state that answers all three questions — not just "No items found"
- Every form must have a brief description of what it creates and what happens next
- Every admin function must describe who it is for and what it governs
- Every blocked action must state what is blocked AND what needs to change (D-140)

### Anti-patterns

- Empty state: "No Delivery Cycles found." — does not answer Why or How
- Form label with no context: "Lead" — does not answer What
- Error: "Not authorized" — does not answer Why or How to unblock

---

## Principle 4 — No Bare Generic Nouns (carried from P1 / Naming Standards)

**Statement:** Every field, label, schema column, and UI element must be self-explanatory without surrounding context.

Wrong: `date`, `status`, `name`, `type`, `id`, `description`, `notes`, `lead`
Right: `submission_date`, `lifecycle_status`, `workstream_name`, `artifact_type_id`, `division_owner_user_id`, `approver_return_notes`, `workstream_lead_user_id`

Applies to: database schema columns, API response field names, Angular component inputs/outputs, UI labels, form field labels, table column headers, filter labels.

---

## Principle 5 — Progressive Disclosure (carried from P2)

**Statement:** Lead with the simplest, most essential information. Allow complexity to unfold only as needed.

- Default views show summary — drill down for detail
- Forms show required fields by default — advanced options behind a toggle or secondary section
- Dashboard rows are scannable — detail is on the detail page
- Admin hub shows what each function does — configuration detail is inside the function

---

## Principle 6 — Debate Before Building (D-168)

**Statement:** Claude Code raises disagreements, conflicts, and ambiguities explicitly before writing any code. Silent resolution is a build error.

This is a mandatory behavioral constraint, not a suggestion. It has the same standing as an architectural rule.

### The four trigger conditions

| Trigger | What Claude Code must do |
|---|---|
| **Disagrees with a design choice** | State the disagreement, explain the rationale, and present an alternative. Build only after hearing the response. |
| **Unclear requirement** | Ask the question before building. Do not infer and build — inferences become decisions without review. |
| **Conflict with a locked decision** | Surface the conflict explicitly. Name the decision (D-NNN), describe the conflict, and ask how to resolve it. Never build around a locked decision silently. |
| **Multiple valid approaches with different trade-offs** | Present the options with their trade-offs. Recommend one if appropriate, but present the choice. |

### Rules

**Rule 1 — Raise before writing.** The debate or question must happen before a single line of code is written. Not after. Not as a comment in the code.

**Rule 2 — State a position.** "I disagree because X" is more useful than "here are some thoughts." Claude Code should have a view and state it. Phil may override it — that is fine. The point is that the disagreement is on the record.

**Rule 3 — One message, multiple issues.** If there are multiple debates or questions for a single task, raise them all in one message rather than sequentially after each build step.

**Rule 4 — Override is explicit.** If Phil says "I hear you, do it anyway" or equivalent, Claude Code builds as directed and notes in the code comment that this was an explicit override. No further debate on that item.

**Rule 5 — Do not ask about optional parameters.** This principle is about design conflicts and ambiguity — not about checking in on choices that are already clear. Do not add unnecessary questions to pad interaction.

### What triggered this principle

Build C and earlier builds occasionally resolved design ambiguities silently through implementation choices. Several required rollback or rework. The cost of a question is one exchange. The cost of a silent wrong choice is a build pass of rework. The asymmetry is clear.

### Anti-patterns

- Building what was asked and then noting "you might want to consider X" in a comment — should have been raised before building.
- Asking "are you sure?" about a clear, unambiguous instruction — this principle applies to genuine conflicts and ambiguity, not hesitation.
- Raising the same debate more than once after an explicit override — once overridden, it is done.

---

---

## Principle 7 — Decision Source Tagging and Registry Protocol (D-169)

**Statement:** Every decision is tagged with its originating session type. A registry file is the authoritative master list of all allocated decision numbers. Claude Code reads the registry before allocating any new number.

### The source tag format

Every decision in `decisions-active.md` ends with:
```
| Source: Claude Code | April 2026 |
| Source: Claude Chat | April 2026 |
| Source: Design Session | April 2026 |
```

### Why this matters

Claude Chat and Claude Code operate in separate contexts. Both can allocate decision numbers. Without source tagging, there is no way to tell which session originated a decision. Without a registry, two sessions can claim the same number for different decisions — silently.

Source tagging makes collisions visible at a glance. The registry prevents them from happening in the first place.

### Claude Code allocation protocol

1. Read `docs/decision-registry.md` — find "Next available"
2. Confirm the number is not taken in `decisions-active.md`
3. Write the decision with `| Source: Claude Code | [date] |`
4. Update "Next available" in the registry in the same commit as the decision

### Claude Chat allocation protocol

Claude Chat cannot write files. Protocol:
1. Claude Chat checks the registry file (provided in context) for the current next-available number
2. Claude Chat states the number it is claiming in the conversation
3. Phil asks Claude Code to commit the decision in the next code session
4. Claude Code follows the Code allocation protocol and tags with `| Source: Claude Chat | [date] |`

### Collision resolution

If Claude Code finds a claimed number that conflicts:
1. Take the next available unclaimed number
2. Add `COLLISION — see [other decision title]` note in the registry for the conflicting row
3. Surface the conflict to Phil before committing — do not silently resolve

Full protocol and registry in `docs/decision-registry.md`.

---

---

## Principle 8 — Feature Stage Advancement Check

**Statement:** At the end of every Claude Code session where features have been built or modified, Claude Code reviews `devStatus` in `NAV_ITEMS` and flags any feature that appears ready to advance — without advancing it silently.

### Why this exists

Dev status labels in the sidebar are only useful if they stay accurate. Without an explicit check, features silently outgrow their labels. A feature showing "Not Started" that is actually running in UAT misleads everyone who looks at it.

### The check

Claude Code compares each feature's current `devStatus` against the work done in the session using these signals:

| From | To | Signal |
|---|---|---|
| `not-started` | `pilot` | Route, component, and MCP tool exist and are deployed. Basic happy path works. |
| `pilot` | `uat` | Feature used with real data. Core flows work end-to-end. Blocked states handled. |
| `uat` | `live` | Phil has reviewed. Acceptance criteria from Build Spec are met. No known blockers. |

### The format

> "Stage check: [Feature] may be ready to advance from [current] to [next]. Reason: [one sentence]. Want me to update it?"

Claude Code does not update `devStatus` without explicit confirmation. It does not skip the check because the session was short or focused elsewhere.

---

## Principle 9 — Processing State Standard: Three-Tier Loading Pattern (D-178)

**Statement:** Every MCP call, query, and transaction displays a loading indicator appropriate to its operation type. Lazy omission of a loading state is a build error, not a style preference. All three tiers are applied at build time — never deferred as retrofits (Rule 8).

### The three tiers

| Tier | When | Implementation |
|---|---|---|
| **Tier 1 — Skeleton screen** | Data loads: tables, lists, cards | `ion-skeleton-text animated` rows matching the expected content layout. Replaces all "Loading…" text. |
| **Tier 2 — Button spinner** | Inline actions: save, toggle, submit single field | `ion-spinner name="crescent"` replaces button label; button `[disabled]="true"` during processing. No overlay. |
| **Tier 3 — Section overlay** | CRUD: create, full form save, delete, gate action | `LoadingOverlayComponent` covers the active form. Sidebar and other panels remain interactive. |

### Rules

**Rule 1 — Sidebar is never locked.** Other panels and navigation remain active during all tiers. Only the scope of the operation is covered.

**Rule 2 — Overlay lifts on success or error.** Error appears within the form after the overlay clears — the overlay does not persist on the error state.

**Rule 3 — Async card loading is scoped.** Dashboard and summary cards use Tier 1 scoped to the card. Other cards remain interactive and resolve independently.

**Rule 4 — Completion toast is narrow.** `ion-toast` is emitted only for operations exceeding 3 seconds where the user may have navigated away. It is not used for routine fast operations.

**Rule 5 — No "Loading…" text.** Plain text loading states are an anti-pattern. Every data load uses Tier 1 skeleton rows. Every action uses Tier 2 or Tier 3.

### Shared implementation

- `LoadingOverlayComponent` — standalone, OnPush — at `/shared/components/loading-overlay/`
- Inputs: `[visible]: boolean`, `[message]: string`
- Parent element must be `position:relative` for the overlay to scope correctly
- Tier 1 uses `ion-skeleton-text` directly in component templates
- Tier 2 uses `ion-spinner name="crescent"` inline in button templates

### Anti-patterns

- "Loading cycles…" text — replace with Tier 1 skeleton rows
- Button text change to "Creating…" with no spinner — add Tier 2 `ion-spinner`
- Inline create form with no overlay — add Tier 3 `LoadingOverlayComponent`
- Processing state with no visual feedback — build error

---

---

## Principle 10 — Right-Panel Entity Detail Pattern (D-180)

**Statement:** Clicking any named entity anywhere in the system opens its detail in a right panel. The originating screen remains visible and navigable. No entity detail opens as a full-page replacement or modal unless a specific exception is locked by a design decision.

### Architectural basis

This principle exists for two reasons that are non-negotiable:

1. **QPathways UX alignment.** OI Trust is a Native Federation remote that loads into the QPathways platform shell at port time. The right-panel detail pattern is the QPathways standard for entity detail. Deviating creates a UX discontinuity at the seam where OI Trust joins the platform.
2. **Mobile compatibility.** OI Trust must function on a smartphone. The right-panel layout — list on left, detail on right — collapses naturally to a single-column stack on narrow viewports: list view first, detail view replaces it on tap, back button returns to list. A full-page replacement or modal does not collapse cleanly. Every detail surface built to this principle is mobile-ready without a separate implementation.

### Rules

**Rule 1 — List stays visible on wide viewports.**
On tablet and desktop, the list occupies the left portion of the viewport when a right panel is open. The user can tap a different row without closing the panel — the panel updates to the new entity. On narrow (phone) viewports, the detail view replaces the list; the back button returns to the list.

**Rule 2 — One panel slot, no stacking.**
There is exactly one right panel slot. Opening a second entity's detail replaces the first. Panels do not stack. The user always knows where detail content lives.

**Rule 3 — Entity references within a detail panel are tappable.**
Any named entity reference rendered inside a detail panel — Division chip, Workstream chip, Assigned DS, Assigned CB, Approver name, Gate node — opens the referenced entity's detail in the same right panel slot, replacing the current detail. See Principle 11 (Tappable Entity Chips) for rendering requirements.

**Rule 4 — Right panel does not change the main route.**
The URL does not change when a right panel opens or closes. The panel is a UI layer, not a route. Deep-linking to a specific entity's detail panel is not supported in this pattern.

**Rule 5 — Exceptions require a locked decision.**
A full-page detail view or modal is only acceptable if a specific design decision names the exception and documents why. "We ran out of space" is not a valid exception.

### Scope — applies to all entity types

| Entity | Build | Panel Content |
|---|---|---|
| Delivery Cycle | C | Identity zone, Stage Track, gates, artifacts, activity |
| Division | A (shell), D (full) | Hierarchy position, members, active cycle count |
| User | A (shell), D (full) | Role, Division assignments, accomplishments |
| Workstream | C | Members, lead, active cycles, WIP |
| Gate | C | Gate status, checklist, approver routing, action buttons |
| OI Library Artifact | B | Metadata, lifecycle state, Stage Track, review history |

### What triggered this principle

Session 2026-03-24 Decision I locked the right panel as the standard detail surface system-wide, originating from the Document Viewer side panel in D-153. Build C implemented Delivery Cycle detail correctly. Without a principle entry, future entity types default to modals or full-page replacements — both of which break mobile layout and the QPathways port contract.

### Anti-patterns

* Gate detail opens as a modal — use the right panel sub-section within the cycle detail panel
* Workstream name in a cycle row is plain text — must be a tappable chip per Principle 11
* Clicking a Division chip navigates to `/admin/divisions` — open the right panel instead

---

## Principle 11 — Tappable Entity Chips (D-181)

**Statement:** Every named entity reference in a list row, detail panel, or form is rendered as a tappable chip. Plain text entity references are an anti-pattern.

### What is an entity reference

Any field value that names a specific record in the system: a Division name, a Workstream name, a user name (DS, CB, approver, actor), a Gate name, or an OI Library artifact title. If the value could open a detail panel for that entity, it is an entity reference and must be a chip.

### Rules

**Rule 1 — Visual treatment.**
Entity chips use a pill shape (`border-radius: var(--radius-pill)`) with a muted background (`--triarq-color-fog` at low opacity) and the entity's initials avatar or a type icon on the left. Font: Roboto, same size as surrounding body text. On hover: background darkens slightly, cursor changes to pointer.

**Rule 2 — Tap behavior.**
Tapping a chip opens the referenced entity's detail in the right panel per Principle 10. The chip does not navigate away from the current screen.

**Rule 3 — Inactive or inaccessible entities.**
If the referenced entity is inactive or the current user lacks access to view it, the chip still renders but tapping it shows a read-only summary only — no action buttons. Never hide a chip because the entity is inactive.

**Rule 4 — Multiple chips in a single field.**
When a field contains multiple entity references (e.g., a list of Consulted reviewers), render each as a separate chip inline. Do not concatenate to plain text.

**Rule 5 — Form field entity pickers produce chips.**
After a user selects an entity via a picker or dropdown, the selected value renders as a chip (with a remove ✕ for editable fields), not as plain text in a text input.

### Where chips are required in Build C

* Assigned DS and Assigned CB on every Delivery Cycle row and detail
* Delivery Workstream on every Delivery Cycle row and detail
* Division on every Delivery Cycle row and detail
* Approver names (Accountable, Consulted, Informed) in gate detail
* Actor names in cycle activity log
* Gate names in milestone date rows
* "Attached by" user name on artifact slots

### What triggered this principle

Build C cycle dashboard rows initially rendered DS, CB, and Workstream names as plain text strings. Principle 10 requires entity references to be actionable — plain text cannot fulfill that requirement. Chips are the visual signal that a reference is tappable.

### Anti-patterns

* "Dave Chen" as plain text in the Assigned DS column — must be a chip
* Workstream filter selection shown as selected text inside an `ion-select` — must become a chip after selection
* "Practice Services Trust" as plain bold label in cycle detail — must be a chip

---

## Principle 12 — Entity Picker Pattern (D-182)

**Statement:** When a form field requires the user to select a named entity that has meaningful attributes relevant to making the correct choice, use an entity picker — not a plain dropdown. A dropdown is only appropriate for short, flat lists of simple scalar values.

### When to use a picker vs. a dropdown

| Use a picker when | Use a dropdown when |
|---|---|
| The entity has attributes the user needs to evaluate (status, ownership, capacity) | The list is a flat set of scalar values (Tier 1/2/3, lifecycle stage) |
| The list may be long enough to require search | The list is short (under ~8 items) and static |
| Inactive or ineligible items exist and must be visible but blocked | All values in the list are valid selections |
| The user must distinguish between entities with similar names | Values are unambiguous without additional context |

### Picker structure

Every picker follows this layout. Sections are only rendered when applicable (e.g., scope radio is omitted if only one scope exists).

```
┌─────────────────────────────────────────────┐
│ Select [Entity Type]              [✕ Close] │
├─────────────────────────────────────────────┤
│ Scope:  ○ [Default scope — label]           │  ← only when multiple
│         ○ [Wider scope — label]             │    scopes exist
│         ○ [Widest scope — label]            │
├─────────────────────────────────────────────┤
│ 🔍  Search [entity type]s…                  │
├─────────────────────────────────────────────┤
│ [Entity row: avatar · name · attr · status] │
│ [Entity row — inactive: dimmed, ⊘ badge,   │
│  not selectable]                            │
├─────────────────────────────────────────────┤
│ Selected                                    │
│ [Entity chip with key attributes]           │
│ — or — None selected                        │
├─────────────────────────────────────────────┤
│                   [Cancel]  [Confirm]        │
└─────────────────────────────────────────────┘
```

### Scope radio rules

**Default is tightest relevant scope.**
The picker opens showing only the entities most likely to be correct for the current context. The full system list is never the default.

**Scope expansion is explicit and progressive.**
Scope options are ordered from tightest to broadest. The user must deliberately choose a wider scope — the picker never auto-expands when no results are found. Correct pattern: show "No results in this Division" with scope radio visible so user can choose to expand.

**Scope radio always visible when multiple scopes exist.**
Not hidden behind an "expand" link.

### Search field rules

**Always present in a picker.**
If the list were short enough to not need search, it would be a dropdown.

**Client-side filtering when the scoped list is small.**
When the default scope returns a manageable list (under ~100 records), load the full scoped list on picker open and filter client-side on each keystroke. No debounce, no per-keystroke query. Instant results.

**Debounced server query when the scope is large.**
When the selected scope could return a large number of records, do not load the full list on open. Fire a server query after the user pauses typing for `PICKER_SEARCH_DEBOUNCE_MS` with no new keystroke.

```
PICKER_SEARCH_DEBOUNCE_MS = 600
```

Defined once as a shared constant. Never hardcoded in individual components. 600ms is intentionally longer than standard web debounce (300ms) — healthcare context, deliberate typists, false queries more expensive than marginal lag.

**Loading state during a debounced query.**
Tier 1 skeleton rows (Principle 9) in the list area while query is in flight. Search field remains active — continued typing cancels in-flight query and restarts debounce. Never lock the search field.

**Scope change triggers a fresh load.**
List clears and reloads for the new scope. If new scope uses client-side filtering, load full scoped list immediately. If server queries, show: "Type to search [entity type]s in [scope label]."

### Entity row content

Each row: `[Avatar/initials]  [Primary name]  [Key attribute 1]  [Key attribute 2]  [Status badge]`

Configurable per entity type. Structure fixed. Sorting: active items first alphabetically, inactive items at bottom dimmed with `⊘ Inactive` badge. Tapping an inactive row: blocked message inline below the row — picker stays open.

### Echo section (Selected)

Shows currently-selected entity as a chip with key attributes — not just the name. If a value is already set when picker opens, pre-selected in echo section. Tapping a row updates echo — does not close picker. Confirm closes and commits. Cancel closes and discards change.

### DS/CB Picker — scope logic

First production instance. Reference implementation for all future pickers.

| Radio Label | Population |
|---|---|
| This Division (default) | Users with role DS (or CB) with membership in the cycle's assigned Division or any child Divisions |
| [Trust Name] — shown only if cycle's Division is not a Trust-level Division | Users with role DS (or CB) with membership in any ancestor Division up to and including the Trust |
| All Divisions | All users with role DS (or CB) in the system |

Entity row content: Avatar initials · Full name · Primary Division · Active cycle count as DS or CB · Account status badge.

### Implementation rule

`EntityPickerComponent` is implemented once as a shared, configurable component. Never reimplemented per entity type. Configuration inputs: `entityType`, `defaultScope`, `scopeOptions`, `displayColumns`, `searchPlaceholder`. `WorkstreamPickerComponent` is the reference implementation — all future pickers configure the shared component.

### Anti-patterns

* Dropdown showing all 50 system users for DS selection — use picker with Division-scoped default
* Picker that hides inactive Workstreams — show dimmed with blocked message on tap
* Picker that auto-expands scope on no results — scope expansion is always a deliberate user action
* `600` hardcoded in a component — reference `PICKER_SEARCH_DEBOUNCE_MS`
* New entity picker as standalone component — configure `EntityPickerComponent`

---

## Principle 13 — Destructive and Irreversible Action Confirmation (D-183)

**Statement:** Any action that cannot be automatically reversed — gate approval, stage regression, Workstream inactivation, artifact lifecycle transition — requires an explicit two-step confirmation that states what will change before the user commits.

### Rules

**Rule 1 — State what will change, not just "are you sure."**
Examples:

* Gate approval: "Approving this Gate will advance the Delivery Cycle to [NEXT STAGE]. This cannot be undone without a stage regression."
* Stage regression: "Regressing to [STAGE] will reset the following Gates: [list]. Each Gate must be resubmitted and approved."
* Workstream inactivation: "Inactivating this Workstream will block Gate advancement on [N] active Delivery Cycles. Each cycle must be reassigned before its next Gate can be approved."

Generic "Are you sure?" confirmations are not acceptable.

**Rule 2 — Two-call pattern for operations with computed downstream effects.**
For operations where the impact set must be computed before confirming (stage regression, Workstream inactivation with active cycles): first MCP call returns a preview of what will change; second call with `confirmed: true` executes. UI renders the preview before showing the confirm button.

**Rule 3 — Confirmation is inline, not a modal.**
Confirmation renders inline within the current form or panel. Confirm and cancel buttons appear below the impact preview.

**Rule 4 — Cancel is available until execution begins.**
Cancel present and functional until Tier 3 loading overlay (Principle 9) takes over on the second MCP call.

**Rule 5 — "Cannot be undone" means no automatic rollback, not impossibility.**
"This cannot be undone without [correction path]" is accurate. Do not say "permanent" if the effect can be corrected manually.

### Anti-patterns

* "Confirm Gate approval? [OK] [Cancel]" — state what advances
* Modal dialog for stage regression — inline per Rule 3
* Stage regression that executes immediately — must preview Gate resets first

---

## Principle 14 — Entity Name Capitalization (D-184)

**Statement:** Named system entities are capitalized in all user-facing text. General-purpose nouns describing the same concept are not.

### The test

If you could substitute the entity name as a UI label ("View all Delivery Cycles," "Assign a Workstream"), capitalize it. If it appears in a conceptual explanation where any instance could be substituted ("a delivery cycle is a unit of work"), use lowercase.

### Capitalized entities

Division, Workstream, Delivery Cycle, Gate, Artifact, OI Library, Delivery Workstream, Context Brief, Build Report, Action Queue, Stage Track, Trust, Milestone.

### Applies to

All Angular component templates, error messages, empty states, loading state labels, hub card descriptions, MCP error messages returned to the UI, form field labels, table column headers.

### Does not apply to

TypeScript variable names, database column names, MCP parameter names, schema identifiers.

### Anti-patterns

* "No delivery cycles found" — should be "No Delivery Cycles found"
* "Delivery Cycle" in an explanatory sentence defining the concept — lowercase is correct there
* "action queue" as a UI label — must be "Action Queue"
* "gate approval" in a button label — must be "Gate Approval"

---

## Principle 15 — Principle Citation in Specs (D-185)

**Statement:** Every spec document produced by Claude Chat cites the governing design principle number(s) for each section. Claude Code raises conflicts against the cited principle before building — not against the spec detail in isolation.

### Format

At each section header, immediately after Source:

```
**Governing principles:** Principle N (Name), Principle N (Name)
```

If a section has no applicable principle, omit the line — do not write "None."

### Purpose

Two-way benefit:

* **For Claude Code:** When a spec instruction seems wrong, Claude Code debates against the principle, not against the spec author's intent. This surfaces the right level of conflict — "this spec instruction appears to violate Principle 10 because..." is more useful than "I think the UI should work differently."
* **For Claude Chat:** Writing the principle citation forces the spec to be grounded. If a section cannot be cited to a principle, it may be an undocumented pattern that needs to become a new principle before the spec is issued.

### Rules

**Rule 1 — Citation is required on every section that governs UI or behavioral decisions.**
Schema-only sections (migration lists, seed data) do not require citations. Every section that governs how the UI looks, behaves, or what the user can do requires at least one citation.

**Rule 2 — Claude Code raises principle conflicts per Principle 6.**
If a spec instruction appears to conflict with its cited principle, Claude Code raises it explicitly before building. "Spec Section 2.1 says X, but Principle 10 says Y — which governs?" is the correct escalation.

**Rule 3 — Missing principle is a spec gap, not a silent assumption.**
If Claude Code cannot identify a governing principle for a behavior it is implementing, it flags this to Phil. The behavior may need a new principle before it becomes a build pattern.

### What triggered this principle

Build C supplement was produced without principle citations. Claude Code implementing from that spec had no grounding for which behaviors were system-wide constraints vs. local decisions. This created unnecessary debates about spec details and missed several principle violations that would have been caught if the citation were present.

---

## Principle 16 — Decision Implementation Status (D-186)

**Statement:** Every decision in decisions-active.md carries an `impl_status` field. Both Claude Chat and Claude Code maintain it. Neither tracks coverage through archaeology.

### Four status values

| Status | Meaning | Set by |
|---|---|---|
| `unspecced` | Decision locked, no spec document yet produced | Default for all existing decisions |
| `specced` | Included in a spec document given to Claude Code | Claude Chat, when producing a spec |
| `built` | Claude Code has implemented | Claude Code, at implementation completion |
| `verified` | Phil has confirmed acceptance criteria met | Phil, or Claude Code reporting Phil confirmation |

### Format in decisions-active.md

Append to the end of each decision record, after the Source tag:

```
| impl_status: unspecced |
| impl_status: specced |
| impl_status: built |
| impl_status: verified |
```

### Rules

**Rule 1 — Claude Code updates to `built` at implementation.**
When Claude Code completes implementation of a decision's acceptance criteria, it updates `impl_status` from `specced` to `built` in the same commit. If no `impl_status` field exists on the decision, Claude Code adds it.

**Rule 2 — Claude Chat sets `specced` when producing a spec.**
When a decision is included in a spec document, the spec document's D-Number Claims section states `impl_status: specced`. Claude Code applies this when committing the spec decisions.

**Rule 3 — Default for all existing decisions is `unspecced`.**
Claude Code applies `unspecced` as the default when first adding `impl_status` to existing decisions that have not been through this process. Do not attempt to infer status from code — set `unspecced` and let the status advance naturally.

**Rule 4 — `verified` requires explicit Phil confirmation.**
Claude Code does not set `verified` speculatively. Phil either confirms directly or Claude Code reports "acceptance criteria met" and Phil confirms in the next session.

### What triggered this principle

This session required archaeology to determine which decisions had been specced to Claude Code, which Claude Code had built, and which were floating. The Build C remaining spec document was produced by comparing three spec documents against the decisions list manually. With `impl_status`, that work is a query, not a review.

---

## Principle 17 — Primary Workflow Clarity (D-188)

**Statement:** Every screen and panel is designed around its primary workflow — the action the user performs most often under normal operating conditions. Primary workflows are optimized for speed, clarity, and minimal visual noise. Secondary and tertiary capabilities are present but visually recessed.

**Rules:**
- Identify the primary workflow for every screen and panel before designing layout. If it cannot be stated in one sentence, the screen has too many responsibilities.
- Primary workflow controls are the largest, most prominent elements on the surface. They are never visually equal to secondary controls.
- Secondary options use muted visual treatment: smaller text, reduced contrast, positioned below a visual separator or at screen edge, never inline with primary controls at equal weight.
- A secondary capability that appears as prominent as the primary workflow is a layout violation — not a preference.
- Applies to: every form, panel, picker, modal, and dashboard screen in the system.

**Anti-patterns:**
- A "Show inactive Workstreams" checkbox appearing inline with scope radios at equal visual weight.
- An advanced filter option rendered identically to a primary filter control.
- An edge-case toggle positioned above or beside the main action path.

**Application to pickers:** In any entity picker, the scope radios are the primary control. Secondary options (show inactive, advanced filters) must be visually separated — placed below a thin rule or with increased margin — and use smaller, muted text. They must not appear as a peer row to the scope radios.

**Source:** Session 2026-04-06 | D-188 | impl_status: built

---

## Principle 18 — Sidebar-Only Navigation (D-189)

**Statement:** OI Trust uses sidebar-only navigation. There is no top navigation bar. The sidebar is the single navigation authority for the application.

**Rules:**
- All navigation lives in the left sidebar. No secondary navigation bar at the top of the content area.
- As the number of sidebar items grows across builds, items are grouped under section headers (not moved to a top bar). Section headers use muted uppercase label styling and do not carry navigation targets themselves.
- Implement section headers when the sidebar has 7 or more items. Defer grouping below that threshold.
- Current grouping model (evolves as builds add surfaces):
  - *(no header)* — Home, Action Queue, Notifications
  - **OI Library** — OI Library
  - **Delivery** — Delivery Cycle Tracking, Gates, Workstreams
  - **Admin** — User Management, System Health, Admin
- The "+ New Cycle" button and equivalent primary actions live in the content area header — never in the sidebar.
- At port time into AI.TRIARQPathways.com, the host shell provides the outer chrome. OI Trust loads as a Native Federation remote. Sidebar navigation is internal to the OI Trust remote and does not conflict with host-level navigation.

**Source:** Session 2026-04-06 | D-189 | impl_status: built

---

## UI Feedback Standard — Field Guidance, Warnings, and Errors (D-190)

Every form, panel, and screen uses exactly three visual feedback patterns. These are the only three. No new patterns are introduced without a locked design decision.

### Pattern 1 — Field Guidance (gray sub-text)

Used for: helpful context that tells the user when or why a field matters. Not a warning. Not an error. Informational only.

Visual treatment:
- Text color: `--triarq-color-stone` (gray, muted)
- Font size: one step below the field label (e.g., 12px if label is 14px)
- Position: directly below the input field, above the next field
- No icon, no background, no border

Examples:
- "Required before Brief Review Gate."
- "Required before Go to Build Gate."
- "Outcome Statement should be set before Brief Review. You can add it now or after creation."

**The Outcome Statement nudge on the Create Cycle form is Field Guidance — not a warning. It must use this pattern, not the amber banner pattern.**

### Pattern 2 — Warning (amber)

Used for: a condition that requires attention but does not block the current action.

Visual treatment:
- Left border: 3px solid `--triarq-color-sunray` (amber)
- Background: `--triarq-color-sunray` at 8% opacity
- Text color: standard body color (not amber)
- Icon: ⚠ amber, left-aligned
- Position: inline where the condition exists (below a field, within a panel section, or as a banner within a right panel — never a floating overlay)

Examples:
- Amber dot on Outcome Statement column when null in dashboard row
- "Assigned Delivery Workstream is inactive — reassign before this cycle can advance past its current gate."

### Pattern 3 — Error (red)

Used for: a validation failure that blocks the current action.

Visual treatment:
- Field border: 2px solid system error color
- Error message: system error color, below the field
- Icon: ✕ or ⚠ in error color
- Position: adjacent to the field that failed validation

Examples:
- Required field left blank on form submit
- Invalid date format
- Gate blocked — missing required artifact

### Enforcement Rule

Before adding any new feedback element to a form or panel, identify which of the three patterns applies. If none fits, surface it as a new design decision — do not invent a fourth pattern inline.

**Source:** Session 2026-04-06 | D-190 | impl_status: built

---

## Version History

| Version | Date | Change |
|---|---|---|
| v1.0 | April 2026 | Initial document. Principles 1 (D-163) and 2 (D-164) added after Build C nav gap identified. Principles 3–5 carried from existing decisions P1, P2, D-140. |
| v1.1 | April 2026 | Principle 6 (D-168) added: mandatory debate/question behavior for Claude Code sessions. |
| v1.2 | April 2026 | Principle 7 (D-169) added: decision source tagging and registry protocol. |
| v1.3 | April 2026 | Principle 8 added: feature stage advancement check at session close. |
| v1.4 | April 2026 | Principles 10–16 added (D-180 through D-186): Right-Panel Entity Detail Pattern, Tappable Entity Chips, Entity Picker Pattern, Destructive Action Confirmation, Entity Name Capitalization, Principle Citation in Specs, Decision Implementation Status. Source: Claude Chat. |
| v1.5 | April 2026 | Principles 17–18 + UI Feedback Standard added (D-188 through D-190): Primary Workflow Clarity, Sidebar-Only Navigation, three-pattern UI Feedback Standard. Source: Claude Chat. |

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
