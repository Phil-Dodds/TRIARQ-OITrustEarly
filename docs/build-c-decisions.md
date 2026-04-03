# Build C Decision Log — Delivery Cycle Tracker
# Pathways OI Trust | April 2026 | CONFIDENTIAL
# Feed to Claude Chat at the start of any Build C review, Build D scoping, or post-build design session.

---

## What This Document Is

Locked design decisions made during Build C development and the post-Build-C review pass.
Decisions here are operative — they govern future builds and must not be re-litigated without a
documented rationale. If a future build requirement conflicts with a decision here, surface the
conflict explicitly before building.

---

## Build C Scope (for context)

Build C delivered:
1. **delivery-cycle-mcp** — 16 tools, full lifecycle management
2. **Delivery Workstream Registry** — admin UI, create/manage workstreams
3. **Delivery Cycle Dashboard** — role-aware, division-scoped, sortable, filterable
4. **Delivery Cycle Detail View** — stage track, milestones, artifacts, gate records, event log
5. **Gate Workflow** — Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review
6. **Cycle Artifact Tracking** — 26 seeded slots by stage, ad hoc attachment, MSO365 pointer model
7. **Build Report stub** — slot present, OI Library submission button returns stub message
8. **Jira Sync stub** — graceful message if unconfigured; five fields sync if configured
9. **Admin Hub** — card-based admin consolidation page at /admin (D-164)

---

## Locked Decisions — Build C

### D-163 — Workflow Entry Point Completeness

Every user-facing function must be reachable from exactly one declared entry point:
- **Sidebar nav item** — user-initiated, persistent. Declared in `NAV_ITEMS` in `sidebar.component.ts`.
- **Home page card** — role-relevant summary. Declared via `showX` getter in `home.component.ts`.
- **Action Queue / Notification** — system-triggered event. Wired to action queue or notifications.

A feature with no wired entry point is not done regardless of whether the route and component exist.
Admin functions are never standalone sidebar links — they belong in the Admin hub (D-164).
Full principle in `docs/design-principles.md` Principle 1.

**Triggered by:** Build C delivered Delivery Cycle Tracking with the sidebar restricted to
`['ds','cb']`, excluding Phil. Home card was a non-functional stub. Workstream Admin was a
loose sidebar link rather than an Admin hub entry.

---

### D-164 — Admin Hub Consolidation

All administrative functions are grouped under `/admin`. One sidebar entry `['phil','admin']`.
Hub renders a card grid — one card per admin function (what, why, link).
Sub-routes: `/admin/workstreams`, `/admin/divisions`, `/admin/users`.
New admin functions add a new sub-route and a new hub card — never a new sidebar link.
Full principle in `docs/design-principles.md` Principle 2.

**Triggered by:** Build C added Workstream Admin, Divisions, and Users as three separate sidebar
links. This does not scale.

---

### D-165 — Workstream Optional at Cycle Creation, Required at Brief Review Gate

**Decision:** `workstream_id` is recommended but not required when creating a Delivery Cycle.
It must be assigned before the **Brief Review** gate can be submitted for approval.

**Rationale:** At Brief (initial scoping), a team may not yet know which Workstream governs the
delivery. Forcing assignment before the work is scoped enough to assign is friction without value.
By Brief Review — the first governance gate — the Workstream must be known because it determines
which delivery team is accountable and whether gates can clear.

**Implementation:**
- Database: `workstream_id` is nullable (migration 024)
- `create_delivery_cycle` MCP tool: workstream_id is optional; if provided, must exist
- `submit_gate_for_approval` MCP tool: blocks ALL gates if workstream_id is null,
  with a D-140 message: "Assign a Workstream before submitting for approval"
- Angular create form: workstream field shows "Assign later" option with hint
  "Required before Brief Review gate"
- Angular service: `createCycle` params — workstream_id is optional

**What does NOT change:**
- If a workstream IS provided at creation, it is validated (must exist)
- Workstream active_status is still checked at gate submission (ARCH-23)
- Inactive workstream still blocks gate clearance

---

### D-166 — Division Filter on Delivery Cycle Dashboard

**Decision:** The Delivery Cycle Dashboard has a Division filter showing the user's directly-assigned
Divisions. An "Include child Divisions" checkbox expands the filter to include descendant Divisions
when a specific Division is selected.

**Implementation:**
- Division dropdown: populated from `directly_assigned_divisions` in `get_user_divisions` response
- Only shown when user has more than one directly-assigned Division (one Division = no choice needed)
- "Include child Divisions" checkbox: only visible when a specific Division is selected
- Division filtering is server-side — changes trigger a `list_delivery_cycles` reload with `division_id`
  and `include_child_divisions` params
- `list_delivery_cycles` MCP tool updated to accept `division_id` + `include_child_divisions`
- When `include_child_divisions` is true, the MCP recursively collects descendant Division IDs

**Known inconsistency logged:**
`list_delivery_cycles` uses direct `division_memberships` for access control — it does not apply
D-135 inheritance (child division access from parent membership) for the default unfiltered view.
`get_user_divisions` does apply D-135. This inconsistency means a user with a parent Division
membership may not see cycles in child Divisions unless they explicitly use the "Include child
Divisions" toggle. Fixing this globally (making the default view D-135-consistent) is a future
Build D item, not resolved in Build C.

---

### D-167 — Workstream Filter: Separate Options for None and Inactive

**Decision:** The Workstream filter dropdown on the Delivery Cycle Dashboard has three option groups:
1. **"No workstream assigned"** — cycles with null workstream_id (D-165 cycles in early scoping)
2. **Active** — named active workstreams
3. **Inactive** — named inactive workstreams, labelled "(inactive)"

Inactive workstreams are NOT merged with "No workstream assigned." They are different states:
- No workstream = early scoping, expected, no gates blocked
- Inactive workstream = workstream deactivated, gates currently blocked

Merging them would hide the blocked-gate condition from users who filter for "blank" cycles.

**Implementation:**
- `filterWorkstream === '__none__'` → `applyFilters()` returns cycles where `!cycle.workstream_id`
- Active/inactive groups use `<optgroup>` for visual separation
- Inactive group only rendered when inactive workstreams exist

---

### ARCH-23 — Workstream Active Status Check at Gate Submission (unchanged)

Delivery Cycle gates check workstream active_status at submission time, not at cycle creation.
If the workstream is inactive when a gate is submitted:
- `gate_status = 'blocked'`
- `workstream_active_at_clearance = false` recorded
- Event log entry written
- D-140 message returned: "Reactivate Workstream to continue"

This is unchanged by D-165. D-165 adds a new pre-check (is workstream assigned at all).

---

### Sidebar Reactive Profile Loading — Fix Documented

**Problem:** `SidebarComponent.ngOnInit()` called `getCurrentProfile()` synchronously. The profile
loads asynchronously in the home component. The sidebar rendered before the profile arrived,
got `null` role, and showed only `'all'` items — role-restricted items (Admin, etc.) never appeared.

**Fix:** `SidebarComponent` now subscribes to `UserProfileService.profile$` (BehaviorSubject).
Any time the profile loads or changes, `visibleItems` is recalculated and `cdr.markForCheck()`
is called. Component implements `OnDestroy` and unsubscribes cleanly.

**Pattern to follow:** Any component that depends on the user profile for display logic must
subscribe to `profile$`, not call `getCurrentProfile()` once at init.

---

### Delivery Cycle Tracking — Visible to All Roles

**Decision:** `Delivery Cycle Tracking` sidebar entry has `roles: 'all'`.
The delivery cycles home card (`showDeliveryCycles`) returns `true` for all roles.

**Empty state handles role differences:**
- No Division assignment → "Contact your admin to be assigned to a Division. Cycles are Division-scoped."
- Has Division, no cycles → role-aware: DS/Phil/Admin see "create one," others see "DS or Phil will create one"

**Rationale:** Every role in the system is involved in delivery in some capacity. Hiding the feature
from certain roles hides context they need — even a CE or CB user should be able to see what's in
their Divisions. The Division scoping at the MCP layer ensures they only see what they have access to.

---

## Build C — Infrastructure Reference

| Component | URL / Location |
|---|---|
| Angular app | GitHub Pages — Phil-Dodds/TRIARQ-OITrustEarly (gh-pages branch) |
| delivery-cycle-mcp | Render — stateless Node.js, port 3003 |
| division-mcp | Render — stateless Node.js |
| Database | Supabase — personal GCP project |

**Render deploy settings (delivery-cycle-mcp):**
- Build command: `cd mcp/delivery-cycle-mcp && npm install`
- Start command: `node mcp/delivery-cycle-mcp/src/index.js`
- Branch: master

**GitHub Pages deploy command:**
```
npx angular-cli-ghpages --dir=dist/pathways-oi-trust/browser \
  --repo=https://github.com/Phil-Dodds/TRIARQ-OITrustEarly.git \
  --name="Phil Dodds" --email="pdodds@triarqhealth.com"
```

**git push note:** PowerShell shows exit code 1 / NativeCommandError on `git push` — this is normal.
Success is confirmed by the hash range in output (e.g. `376940b..682b338 master -> master`).

---

## What Comes Next — Build B / D Context

These are NOT Build C scope but are decisions that Build B/D must honour:

- **OI Library submission workflow** — Build Report artifact slot is stubbed. OI Library submission
  button returns a stub message. Full submission is Build B.
- **Embedded chat** — Build D. Not wired in Build C.
- **Notification SLA timers** — Build D.
- **Gate approval UI** — Phil and Admin can approve/return gates via `record_gate_decision`.
  The UI for this (gate panel in detail view) is present but the approval action is wired.
  Build D may add notification-triggered approval workflows.
- **D-135 inheritance in list_delivery_cycles** — logged as known inconsistency (see D-166).
  Fix in Build D when the division access model is revisited.

---

TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | April 2026
