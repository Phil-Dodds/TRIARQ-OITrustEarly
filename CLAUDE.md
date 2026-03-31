# CLAUDE.md
Pathways OI Trust | Build A — Foundation | March 2026 | CONFIDENTIAL
Owner: Phil Sappington, EVP Performance & Governance

---

## Session Initialization — HARD PAUSE RULE

Read this file completely before writing any code or calling any tool.

Then call `get_session_context` on the governing documents MCP endpoint below. If the call fails or returns incomplete governing documents, **stop immediately and report the failure**. Do not proceed on absent or unverified governing constraints.

```
GOVERNING_DOCS_MCP_ENDPOINT=PLACEHOLDER — replace with Render URL for document-access-mcp before first session
```

After `get_session_context` returns:
1. Confirm build scope is **Build A** before proceeding
2. Read the Master Build Plan
3. Read the Build A Specification
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

## Build A Scope

Build A delivers four things. Nothing else is in scope.

1. **Container / Division Hierarchy** — nine-Trust hierarchy, recursive Divisions, admin UI, role assignment
2. **Bulk Knowledge Seed** — batch upload, ClamAV scan, seed_review state, batch approval, directory import
3. **Document Access MCP** (`document-access-mcp`) — nine tools, human governance + agent consumption layers
4. **Division MCP** (`division-mcp`) — ten tools, admin-only writes
5. **Home Screen** — role-aware cards per D-150; Chat card is a **stub only** — no chat skill, no Vertex AI

Embedded chat is **Build B**. Do not wire the chat skill or any Vertex AI dependency in Build A.

---

## Schema Rules

Applied to every table without exception.

- UUID primary keys on all tables — `default gen_random_uuid()`
- `created_at` and `updated_at` timestamptz on all tables
- Soft delete: `deleted_at` timestamptz — never hard delete
- `WHERE deleted_at IS NULL` on every SELECT on soft-deletable tables
- All foreign keys `ON DELETE RESTRICT` unless the Build A Specification explicitly states otherwise
- Parameterized statements only — no string interpolation in SQL

RLS is **disabled**. JWT validation and Division-scoped access control live in the MCP layer.

---

## MCP Server Rules

Applied to both `document-access-mcp` and `division-mcp`.

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
- Confirm current build scope (Build A) before beginning any file
- Never expand scope mid-build — a scope question requires stopping and asking, not inferring and building
- If any environment variable placeholder is still unset when a dependent operation is attempted, stop and report which variable is missing

---

## Build A Acceptance Criteria (summary)

Build A is complete when all of the following are demonstrable against real data:

- Nine-Trust Division hierarchy created via admin UI
- Child Divisions created at least two levels deep
- Users created, assigned to Divisions, role-aware home screen confirmed per role
- Downward access inheritance works; upward access blocked
- Admin/functional role separation enforced (allow_both=false hard block)
- Batch upload: files scan clean, reach seed_review status
- Batch approval: transitions to candidate, triggers document_embeddings rows
- Home screen correct for all five roles (Phil, DS, CB, CE, Admin)
- No-Division user sees onboarding message
- Unauthenticated MCP call returns 401
- Zero Supabase client imports in any Angular component or service

Full acceptance criteria with demonstration method in Build A Specification Section 9.

---

## Key Decision References

Decisions are locked in `decisions-active.md`. Do not re-litigate locked decisions. If a decision reference appears below and seems to conflict with an instruction here, this file takes precedence for Build A execution — raise the conflict rather than resolving it silently.

| Decision | What It Locks |
|----------|--------------|
| D-93 | MCP-only DB access; UI as presentation layer only |
| D-131 | Permissions model: role-aware, permissions-deferred |
| D-134 | Division as universal container primitive |
| D-135 | Hierarchical admin model — downward only |
| D-136 | System-level roles — one per user |
| D-139 | Admin + functional role separation with override |
| D-140 | Blocked action UX standard |
| D-142 | Email OTP via Supabase Auth; 30-day session |
| D-143 | Angular Native Federation remote |
| D-144 | MCP server pattern |
| D-145 | 13 seeded system artifact types |
| D-146 | Supported file formats and size limits |
| D-147 | Document Access MCP tool set |
| D-150 | Home screen card definitions per role |
| D-151 | Design token rules (h2=60px critical fix) |
| D-155 | On-demand MCP tool loading |
| Session 2026-03-29-A | Embedded chat is Build B — stub only in Build A |
| Session 2026-03-29-B | Division MCP name (`division-mcp`) |
| Session 2026-03-29-E | GCP account confirmed ready |
