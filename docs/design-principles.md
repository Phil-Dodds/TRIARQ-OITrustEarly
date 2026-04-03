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

## Version History

| Version | Date | Change |
|---|---|---|
| v1.0 | April 2026 | Initial document. Principles 1 (D-163) and 2 (D-164) added after Build C nav gap identified. Principles 3–5 carried from existing decisions P1, P2, D-140. |

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
