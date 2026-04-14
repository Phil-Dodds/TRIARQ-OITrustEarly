# CLAUDE.md
Pathways OI Trust | Build C — Delivery Cycle Tracker | April 2026 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance

---

## Tool Permission Preferences

Full rules in `docs/claude-tool-preferences.json`. Summary:

**Allowed without asking:**
All common shell commands — `git`, `ls`, `find`, `cd`, `pwd`, `cat`, `grep`, `head`, `tail`, `cp`, `mv`, `mkdir`, `touch`, `echo`, `npm`, `npx`, `node`, `python3`, `pytest`, `curl`, `gh`, `xargs`, `sed`, `awk`, `sort`, `diff`, and any other standard read or build operation. When in doubt, run it — the ask list is narrow and explicit.

**`rm`:** Free on build artifacts (`dist/`, `node_modules/`, `*.tmp`). Ask before deleting source files, migration files, or docs.

**Must ask before running:** `git reset --hard`, `git push --force`, `sudo`
- State what will change, why, and wait for explicit confirmation before executing.

**Not applicable here:** `docker`, direct database execution — not used in this project. Flag if they ever come up.

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

## Active Standards — Mandatory Read (D-232)

Read `docs/standards-summary.md` before writing any component code.

Active Standards carry the same force as Non-Negotiable Architectural Rules above.
A spec element that conflicts with an Active Standard is not valid without a named
exception decision carrying a D-number.

`docs/standards-summary.md` contains the operative Rule and Conformance test for each
Active Standard. Full rationale for each Standard lives in `standards.md` (canonical
document — available via session zip).

When a spec cites a Standard (e.g. "Governing standards: S-006"), find that Standard
in `docs/standards-summary.md` and confirm the implementation will pass its Conformance
test before writing code. If it will not pass, raise per Rule 4.

---

## Permanent Reference Documents (D-234)

After reading this file, verify every document in this list exists in the repo at the
specified path. If any document is missing: **stop immediately and report which
document is missing before writing any code.**

Required documents:
- `docs/standards-summary.md` — Active Standards reference (D-232)
- `docs/build-c-visual-layout-standards.md` — Visual layout and token rules

This list is maintained by Design sessions. When a new permanent reference document
is added, a CLAUDE.md update instruction adds it to this list.

---

## Auth and Security

Before implementing any auth, session, or credential handling code:

1. Read D-248 (Production Auth — Supabase Email+Password with Invite Flow) in full from `docs/decisions-active.md` or the session brief.
2. Read D-301 (Persistent Session / Remember This Device) in full.
3. Any implementation choice not explicitly covered by a locked decision must be surfaced as a CCode-decision before building.
4. Do not infer auth behavior — declare it.

This rule applies to: login flows, invite flows, password reset, session storage, token handling, JWT validation, MCP auth middleware, account lockout, and any other authentication or credential-adjacent code.

---

## Session Type and Reading Order (D-235, D-236, D-238)

Every session brief includes a SESSION TYPE declaration. Read it before opening
any files.

**NEW BUILD session:**
1. Read session brief completely
2. Read permanent reference documents (docs/standards-summary.md,
   docs/build-c-visual-layout-standards.md)
3. Read the target state spec
4. Build from spec

**MODIFICATION session:**
1. Read session brief completely — including the delta instruction section
2. Read permanent reference documents
3. Read the target state spec
4. **Only then** open existing component files — and only to extract:
   - CC-decision comments
   - Auth/guard logic
   - Error handling patterns
   Discard all other existing patterns. Build from the delta instruction.

Opening existing component files before completing steps 1–3 in a MODIFICATION
session is a Rule 4 violation. The existing implementation is not a design reference
for redesigned surfaces.

If a session brief flags a surface as MODIFICATION but provides no delta instruction
for that surface: stop and raise per Rule 4 before proceeding.

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

## Non-Negotiable Architectural Rules

These override any other instruction, any framework default, and any apparent shortcut. Violation of any rule is a hard build error — not a soft gate.

**Rule 1 — MCP-Only Database Access.**
All database calls go through MCP servers. No direct Supabase client calls from any Angular component or service — ever. If a component needs data, it calls an Angular service. The service calls the MCP endpoint. The MCP server validates the JWT, enforces Division scope, and queries Supabase. There is no shorter path.

**Rule 2 — UI as Presentation Layer Only.**
Angular components render data. They contain no prompts, no business logic, and no SQL. Skill files own prompt logic. MCP servers own business logic and data access. Components own display.

**Rule 3 — Workflow Entry Point Completeness (D-163).**
A feature is not done until its entry point is declared and wired. Before writing any component, identify which entry point type the feature uses and implement it in the same commit:

- **Sidebar nav item** → add to `NAV_ITEMS` in `sidebar.component.ts` with correct `roles` array
- **Home page card** → add `showX` getter in `home.component.ts`, wire card in `home.component.html`
- **Action Queue / Notification** → wire to action queue or notifications system

Entry point checklist — required before marking any feature done:
- [ ] Entry point type declared and implemented
- [ ] Role array correct — all permitted roles included
- [ ] If admin function: added to Admin hub card grid, NOT as a loose sidebar link
- [ ] If sequential workflow: steps, prerequisites, and D-140 blocked-action messages defined

Full principle in `docs/design-principles.md` (Principle 1).

**Rule 4 — Debate Before Building (D-168).**
Before writing any code, Claude Code must explicitly raise: (1) any design choice it disagrees with, stating its position and rationale; (2) any requirement that is unclear or ambiguous, asking before building; (3) any request that conflicts with a locked decision, naming the decision and describing the conflict; (4) any implementation path with multiple valid approaches that carry meaningfully different trade-offs.

Silent resolution of conflicts is a hard build error, not a style preference.

After Phil responds: if overridden, build as directed and note the override in the code comment. Do not re-debate after an explicit override.

Full principle in `docs/design-principles.md` (Principle 6). Decision D-168.

**Rule 5 — Decision Source Tagging and Registry Protocol (D-169).**
Before allocating any new decision number, Claude Code must:
1. Read `docs/decision-registry.md` to find the current "Next available" number.
2. Check that the number is not already claimed in `decisions-active.md`.
3. Write the decision with a source tag: `| Source: Claude Code | [date] |`
4. Update the "Next available" field in the registry in the same commit.

If Claude Code finds a collision (number taken by a different decision), it takes the next unclaimed number, adds a `COLLISION` note in the registry row, and surfaces the conflict to Phil before committing.

Claude Chat-originated decisions are tagged `| Source: Claude Chat |`. When Phil asks Claude Code to commit a chat-originated decision, Claude Code follows the same allocation protocol and notes the chat origin in the source tag.

This rule exists to prevent silent collision of D-numbers between Claude Code and Claude Chat sessions. Full protocol in `docs/decision-registry.md`. Decision D-169.

**Rule 6 — No Service Worker.**
Service worker registration is disabled for this project. `angular.json` must have
`"serviceWorker": false` for all build configurations. Do not enable it in any build
configuration without an explicit design session decision covering cache invalidation
strategy. If `ngsw-config.json` exists, remove it.

**Rule 7 — Build Configuration Changes Require CC-Decision (D-237).**
Any change to `angular.json`, `package.json` (new dependencies), or any other build
configuration file requires a CC-decision recorded before committing. No silent build
configuration changes. Binary-testable: did the commit that changed `angular.json` or
`package.json` include a corresponding CC-decision entry? Yes = compliant. No = violation.

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

## Worktree and Scripting Rules

**Governing documents are master-only.** Never modify `decisions-active.md`, `docs/decision-registry.md`, or `docs/design-principles.md` inside a worktree. Make all governing doc changes directly on master (before or after the worktree merge). This prevents merge conflicts on files that both branches would otherwise touch.

**npm install on new worktrees.** Any worktree that has no `node_modules/` requires `npm install --legacy-peer-deps` in the `angular/` folder before `ng build` will work. Do this automatically at the start of any worktree session — do not wait for `ng build` to fail first.

**tsconfig.federation.json is build-critical — never commit mutations from npm install.** Running `npm install` causes `@angular-architects/native-federation` to rewrite `tsconfig.federation.json` with hardcoded `node_modules\\` paths for every shared package. This mutated file must NEVER be staged or committed. After every `npm install` in a worktree, immediately run `git checkout -- angular/tsconfig.federation.json` to restore the clean version before doing anything else. Committing the mutated version causes the next `ng build` to hang indefinitely as the TypeScript compiler tries to process `.mjs` files directly.

**File manipulation scripting.** Use `awk`, `sed`, and `grep` for text/file processing. Do not use `python3` — the Windows alias opens Microsoft Store instead of running Python. Node.js (`node -e`) is available as a fallback but requires care with path arguments: pass file paths via `process.argv` or environment variables, never interpolated directly into the `-e` string (bash `/c/` paths become `C:\c\` in Node's Windows resolver).

---

## Code Generation Rules

- Generate tests alongside every code file — CB reviews coverage before QA
- Confirm current build scope (Build C) before beginning any file
- Never expand scope mid-build — a scope question requires stopping and asking, not inferring and building
- If any environment variable placeholder is still unset when a dependent operation is attempted, stop and report which variable is missing

---

## Feature Stage Advancement — End-of-Session Check

At the end of any session where features have been built, modified, or deployed, Claude Code must:

1. Review the `devStatus` field for each item in `NAV_ITEMS` in `sidebar.component.ts`
2. Compare each feature's current `devStatus` against the work done in the session
3. Flag any item that appears ready to advance to the next stage — do not advance silently, but do call it out explicitly

**Stage advancement signals to watch for:**
- `not-started` → `uat`: A route, component, and MCP tool exist and are deployed. Basic happy path works.
- `uat` → `pilot`: Feature has been used with real data, core flows work end-to-end, blocked-action states are handled.
- `pilot` → `new`: Feature has been reviewed by Phil, acceptance criteria from the Build Specification are met, no known blocking issues. Badge signals users to notice the new feature.
- `new` → (badge removed): Once a feature is no longer new, remove the devStatus badge row from NAV_ITEMS entirely. Do not leave it set to any further value.

**Format for the flag:**
At session close, if any feature appears ready to advance, say:
> "Stage check: [Feature Name] may be ready to advance from [current] to [next]. Reason: [one sentence]. Want me to update it?"

Do not update `devStatus` without explicit confirmation. Do not skip the check because the session was focused on something else.

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
| D-163 | Workflow Entry Point Completeness — every feature needs a wired entry point |
| D-164 | Admin Hub Consolidation — all admin functions under /admin, never loose sidebar links |

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
| D-165 | Workstream optional at cycle creation; required before Brief Review gate |
| D-166 | Division filter on dashboard; include child divisions toggle |
| D-167 | Workstream filter: no-workstream and inactive shown as separate options |
| D-168 | Claude Code must debate/question before building — silent conflict resolution is a build error |
| D-169 | Decision source tagging + registry protocol — read docs/decision-registry.md before allocating any D-number |

---

## Naming Standard (D-223)

All files, methods, and exports in this codebase follow these five rules. All rules are binary — a file either complies or it does not.

**Rule 1 — File naming:** Files follow `feature-name.type.ts` Angular pattern. The feature name must contain at least one domain noun and one function noun. Example: `delivery-cycle-lifecycle.service.ts` (domain: delivery-cycle, function: lifecycle). `delivery.service.ts` violates this rule — function is missing.

**Rule 2 — No generic feature names:** The following words are banned in file names: `shared`, `common`, `util`, `helper`, `misc`, `data`, `base`. These signal unclear responsibility. Split or rename before committing.

**Rule 3 — Method naming:** Method names follow verb-noun pattern declaring intent. Examples: `approveMilestoneGate()` not `handleMilestone()`. `buildFilterQuery()` not `processData()`. `loadWorkstreamsByScope()` not `getData()`.

**Rule 4 — One export per file:** Each file has one export by default. Two exports signals two responsibilities — split the file. If co-location is genuinely justified, add a comment explaining why before committing.

**Rule 5 — Decision citations:** When a piece of logic implements a specific locked decision, add a comment in this format: `// [plain-language summary of the rule]. Source: D-NNN`. Example: `// User controls milestone status freely — system alerts on divergence but never restricts. Source: D-205`. The plain-language summary is required — the D-number alone is not sufficient.

---

## Design Contract Standards (D-239, D-242, D-243)

Added Contract 2 2026-04-10. These rules govern how Code interprets and executes
thin contract documents.

**D-239 — Thin Contract:** The contract is the complete execution instruction. Do not
expand scope beyond what the contract specifies. Any scope question requires stopping
and surfacing to Phil — never inferring and building.

**D-242 — Field Completeness:** If an ARCH note or decision marks a field "required at
creation/edit" but that field is absent from the form spec, record a CC-decision and
surface to Phil — do not infer the field implementation.

Binary test: Is every field in the implemented form explicitly present in the spec?
Yes = compliant. Any inferred field = violation.

**D-243 — Spec Completeness:** Do not infer behavior from ARCH notes, decisions, or
prior sessions. If a behavior is not in the spec section, it is not specced — record a
CC-decision.

Binary test: Is every implemented behavior traceable to an explicit line in the
current contract or spec? Yes = compliant. Any inferred behavior = violation.

---

## Responsibility Declaration (D-226)

Before creating any new service or component file, add a one-line responsibility declaration as the first comment in the file. The declaration must contain two parts:

1. What this file is responsible for
2. What it is NOT responsible for, and where that logic lives instead

Example:
```
// Manages milestone date status updates only.
// Does not handle gate approval logic or cycle stage advancement — those live in delivery-cycle-lifecycle.service.ts.
```

A declaration that only states what the file DOES is incomplete — the NOT statement is required. Rewrite before committing.

Also include the declaration in the CodeClose output under "New Files Created" so Design has a record of all new file boundaries.

Future sessions treat this declaration as the boundary for the file. If a new piece of logic violates the stated boundary, record it as a CC-decision rather than silently adding it.
