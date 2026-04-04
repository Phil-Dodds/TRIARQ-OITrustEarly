# Design Principles — Pathways OI Trust
# Pathways OI Trust | April 2026 | CONFIDENTIAL
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

## Version History

| Version | Date | Change |
|---|---|---|
| v1.0 | April 2026 | Initial document. Principles 1 (D-163) and 2 (D-164) added after Build C nav gap identified. Principles 3–5 carried from existing decisions P1, P2, D-140. |
| v1.1 | April 2026 | Principle 6 (D-168) added: mandatory debate/question behavior for Claude Code sessions. |
| v1.2 | April 2026 | Principle 7 (D-169) added: decision source tagging and registry protocol. |
| v1.3 | April 2026 | Principle 8 added: feature stage advancement check at session close. |

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
