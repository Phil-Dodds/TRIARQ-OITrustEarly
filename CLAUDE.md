# CLAUDE.md
Pathways OI Trust | Build C — Delivery Cycle Tracker | April 2026 | CONFIDENTIAL
Owner: Phil Sappington, EVP Performance & Governance

---

## Session Initialization — HARD PAUSE RULE

Read this file completely before writing any code or calling any tool.

Then call `get_session_context` on the governing documents MCP endpoint below. If the call fails or returns incomplete governing documents, **stop immediately and report the failure**. Do not proceed on absent or unverified governing constraints.

```
GOVERNING_DOCS_MCP_ENDPOINT=PLACEHOLDER — replace with Render URL for document-access-mcp before first session
```

After `get_session_context` returns:
1. Confirm build scope is **Build C** before proceeding
2. Read the Master Build Plan
3. Read the Build C Specification (`build-c-spec.md`)
4. Begin work

---

## Environment Variables

These must be set before Claude Code can execute any database or MCP operations. Never hardcode any of these values.

```
# Supabase
SUPABASE_URL=PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=PLACEHOLDER

# MCP Servers (Render)
DOCUMENT_ACCESS_MCP_URL=PLACEHOLDER
DIVISION_MCP_URL=PLACEHOLDER

# Vertex AI (personal GCP — does not block Build A)
VERTEX_PROJECT_ID=PLACEHOLDER
VERTEX_LOCATION=us-central1
VERTEX_MODEL=PLACEHOLDER — locked in Build B (ARCH-19)
```

---

## Two Non-Negotiable Architectural Rules

These override any other instruction, any framework default, and any apparent shortcut.

**Rule 1 — MCP-Only Database Access.**
All database calls go through MCP servers. No direct Supabase client calls from any Angular component or service — ever. If a component needs data, it calls an Angular service. The service calls the MCP endpoint. The MCP server validates the JWT, enforces Division scope, and queries Supabase. There is no shorter path.

**Rule 2 — UI as Presentation Layer Only.**
Angular components render data. They contain no prompts, no business logic, and no SQL. Skill files own prompt logic. MCP servers own business logic and data access. Components own display.

Violation of either rule is a hard build error — not a soft gate.

---

## Build C Scope

Build C delivers the Delivery Cycle management layer. Nothing else is in scope.

1. **Delivery Cycle MCP** (`delivery-cycle-mcp`) — 16 tools, full lifecycle management
2. **Delivery Workstream Registry** — admin UI, create/manage Workstreams, gate enforcement integration
3. **Delivery Cycle Dashboard** — role-aware, all cycles visible per Division access
4. **Delivery Cycle Detail View** — Stage Track, milestone dates, artifact slots, gate records, event log
5. **Gate Workflow** — Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review
6. **Cycle Artifact Tracking** — 26 seeded slots by stage, ad hoc attachment, MSO365 pointer model
7. **Build Report OI Library Stub** — UI and data wired; OI Library submission completes in Build B
8. **Jira Sync** — five governance fields read/write via MCP; graceful stub if unconfigured

OI Library submission workflow, embedded chat, and notification SLA timers are **Build B / D**. Do not wire them in Build C.

---

## Schema Rules

Applied to every table without exception.

- UUID primary keys on all tables — `default gen_random_uuid()`
- `created_at` and `updated_at` timestamptz on all tables
- Soft delete: `deleted_at` timestamptz — never hard delete
- `WHERE deleted_at IS NULL` on every SELECT on soft-deletable tables
- All foreign keys `ON DELETE RESTRICT` unless the Build C Specification explicitly states otherwise
- Parameterized statements only — no string interpolation in SQL

RLS is **disabled**. JWT validation and Division-scoped access control live in the MCP layer.

---

## MCP Server Rules

Applied to `document-access-mcp`, `division-mcp`, and `delivery-cycle-mcp`.

- Stateless Node.js on Render
- JWT validation middleware fires on **every request** before any tool logic executes — 401 on failure, no exceptions
- Tool naming: `verb_noun`
- Response envelope: `{ success: boolean, data: any, error?: string }` — always, including errors
- Semantic versioning — both servers start at v1.0
- On-demand tool loading is the standard (D-155) — use Tool Search to discover and load tools rather than loading all tools at session start

---

## UI and Design Token Rules

- Import `triarq.tokens.v1.css` in `styles.scss`
- Import `ionic.theme.map.scss` in `global.scss` **before** the Ionic default theme
- Use `--triarq-*` CSS variables for all color, spacing, and typography — no hardcoded values
- **CRITICAL: `--triarq-text-h2` = 60px. The token file value of 20px is a data entry error. Do not use the token file value for h2.**
- Font: Roboto — not Gill Sans, not Lato
- Border radius: cards=10px, buttons=5px, inputs=5px, pills=999px
- Sidebar active state: `--triarq-color-primary` (#257099) as left border indicator
- SVG icons: `assets/icons/triarq/`, `stroke=currentColor`, 24px base grid

---

## Angular Architecture Rules

- Native Federation remote — `@angular-architects/native-federation`, exposed module: `AppModule`
- All routes relative — no hardcoded absolute paths
- Lazy-loaded feature modules: `OILibraryModule`, `AdminModule`, `ChatModule`, `DeliveryModule`
- Zero Supabase client imports in any component or service — this is a code review gate

---

## Naming Standards

No bare generic nouns. Every field, label, schema column, and UI element must be self-explanatory without surrounding context.

Wrong: `date`, `status`, `name`, `type`, `id`, `description`
Right: `submission_date`, `lifecycle_status`, `artifact_title`, `artifact_type_id`, `division_owner_user_id`

This applies to: database schema, API response fields, Angular component inputs/outputs, UI labels, form fields, report column headers.

---

## Blocked Action UX

When a user attempts a blocked action, the UI must communicate two things:

1. What is blocked and why
2. What would need to change for the action to be available

Never return error codes or silent failures. Source: D-140.

---

## Code Generation Rules

- Generate tests alongside every code file — CB reviews coverage before QA
- Confirm current build scope (Build C) before beginning any file
- Never expand scope mid-build — a scope question requires stopping and asking, not inferring and building
- If any environment variable placeholder is still unset when a dependent operation is attempted, stop and report which variable is missing

---

## Build C Acceptance Criteria (summary)

Build C is complete when all of the following are demonstrable against real data:

- Admin can create a Delivery Workstream, assign a lead, link to a Division, toggle active/inactive
- DS or Phil can create a Delivery Cycle, select Workstream, set tier, see on dashboard
- Dashboard renders intelligent headline, current stage, Pilot Start Date, Production Release Date per date state model
- Cycle advances through at least three stages; gate records created at correct positions
- Gate clearance on inactive Workstream returns correct blocked message; records workstream_active_at_clearance = false
- Target date set by user; actual date recorded on gate clearance; date status correct per state model
- Outcome Statement amber warning visible when null; inline edit sets value and clears warning
- StageTrackComponent Full mode: 12 stages, 5 gate nodes, gate click opens gate record panel; Condensed mode on dashboard
- All 26 artifact slots visible in correct stage groupings; attach works for external URL and ad hoc
- Event log shows every stage advance, gate decision, artifact attachment, outcome set in order
- Jira stub: sync panel visible; graceful message if unconfigured; five fields sync if configured
- Build Report stub: slot present, attach works, OI Library submission button returns stub message
- Unauthenticated call to delivery-cycle-mcp returns 401
- Zero Supabase client imports in any Angular component or service

Full acceptance criteria in Build C Specification Section 8.

---

## Key Decision References

Decisions are locked in `decisions-active.md`. Do not re-litigate locked decisions. If a decision reference appears below and seems to conflict with an instruction here, this file takes precedence for Build C execution — raise the conflict rather than resolving it silently.

**Carried from Build A (project-wide):**

| Decision | What It Locks |
|----------|--------------|
| D-93 | MCP-only DB access; UI as presentation layer only |
| D-140 | Blocked action UX standard |
| D-143 | Angular Native Federation remote |
| D-144 | MCP server pattern |
| D-151 | Design token rules (h2=60px critical fix) |
| D-155 | On-demand MCP tool loading |

**Build C specific:**

| Decision | What It Locks |
|----------|--------------|
| D-67 | Jira link model — bidirectional, one cycle to multiple epics |
| D-83 | Delivery Cycle as primary unit of work |
| D-108 | 12-stage lifecycle with 5 gates |
| D-113 | Cycle artifacts live on cycle until Build Report canonization |
| D-115 | Cursor Prompt as BUILD phase working artifact |
| D-117 | Jira MCP integration — OI Trust as system of record |
| D-124 | Tier set at BRIEF stage |
| D-125 | Append-only event log on every cycle |
| D-154 | Five named gates |
| ARCH-12 | Gate positions in 12-stage lifecycle |
| ARCH-16 | Jira MCP read/write contract — five governance fields |
| ARCH-23 | Delivery Workstream schema and gate enforcement |
| ARCH-24 | Cycle artifact tracking tables |
| ARCH-25 | StageTrackComponent contract |
| Session 2026-03-24-A | Date field state model |
| Session 2026-03-24-P | Build sequence revised to A→C→B→D→E→F |
| Session 2026-03-25-F | Full artifact slot seed set (26 rows) |
| Session 2026-03-25-G | MSO365 → OI Library pointer transition model |
