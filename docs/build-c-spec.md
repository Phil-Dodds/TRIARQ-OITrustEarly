# Build C Specification
Pathways OI Trust | Delivery Cycle Tracker | v2.0 | April 2026 | CONFIDENTIAL
Owner: Phil Dodds, EVP Performance & Governance

**v2.0 — Replacement spec. Supersedes v1.0 (March 2026). Reflects the system as built through Session 2026-04-06. Authoritative for all Build C surfaces, schema, MCP tools, routes, and acceptance criteria. The original build-c-spec.md v1.0 is retired.**

---

## 1. Build C Scope

Build C delivers the Delivery Cycle management layer. It builds directly on top of Build A's Division hierarchy, user/role model, and authentication infrastructure.

| Component | Use Case | Delivers |
|-----------|----------|---------
| Delivery Cycle MCP (`delivery-cycle-mcp`) | UC-01, UC-05, UC-06, UC-07 | Full lifecycle management — create, advance stages, clear gates, attach artifacts, Jira sync. 20 tools total. |
| Delivery Workstream Registry | UC-05 | Admin UI at /admin/workstreams; create/manage workstreams; gate enforcement integration |
| Delivery Cycle Tracking Hub | UC-01, UC-05 | Landing page at /delivery with four named views |
| All Delivery Cycles view | UC-01 | Filterable list at /delivery/cycles; pattern setter for all other views |
| Workstream Summary view | UC-05 | WIP limit visibility at /delivery/workstreams (shell only; full implementation follows All Delivery Cycles) |
| Gate Schedule view | UC-01 | Time-pressure view at /delivery/gates — overdue and upcoming gates within 7 days |
| Deploy Gate by Quarter view | UC-05 | Workstream/quarter-organized view at /delivery/deploy-schedule |
| Delivery Cycle Detail View | UC-01, UC-05, UC-06 | Full cycle record — Stage Track, milestone dates, artifact slots, gate records, event log |
| Gate Workflow | UC-05 | Brief Review, Go to Build, Go to Deploy, Go to Release, Close Review — approval record, target/actual date tracking |
| Cycle Artifact Tracking | UC-01, UC-06 | 26 seeded artifact slots by stage, ad hoc attachment, MSO365 → OI Library pointer model |
| Build Report OI Library Submission Stub | UC-06 | UI and data model wired; submission completes in Build B |
| Jira Sync | UC-07 | Five governance fields sync to linked Jira epic via MCP |
| Admin Hub | UC-01 | Card-based admin consolidation at /admin; all admin functions under single sidebar entry |
| Maintenance Mode | — | system_config table, Division MCP tools, Angular bootstrap interception; final Build C acceptance criterion |

Build C does **not** include: OI Library submission workflow (Build B), embedded chat (Build B), notification SLA timers (Build D), User Activity infrastructure (Build D), full User Detail Panel (Build D).

---

## 2. Hard Dependencies on Build A

Before Build C can be tested:

- `divisions` table — Delivery Cycles attach to a Division
- `users` table and Supabase Auth — JWT identity used in all MCP calls
- `division_memberships` table — Division-scoped access enforcement
- `artifacts` table — OI Library artifact pointer on `cycle_artifacts.oi_library_artifact_id`
- `user_screen_state` table — filter/sort memory per D-171; first implemented in Build A on admin.users; Build C screens implement at build time
- Division MCP (`division-mcp`) — Build C calls `get_division`, `list_division_members`, `get_maintenance_mode`, `set_maintenance_mode`

---

## 3. Schema — New Tables

All tables follow CLAUDE.md schema rules: UUID PKs, `created_at`/`updated_at`, soft delete via `deleted_at`, `WHERE deleted_at IS NULL` on all selects, `ON DELETE RESTRICT` on all FKs unless noted, parameterized SQL only. RLS is disabled — access control lives entirely in the MCP layer per Session 2026-03-30-A.

### 3.1 delivery_workstreams
Source: ARCH-23, Session 2026-03-24-L

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| workstream_id | uuid | PK, default gen_random_uuid() | Workstream identifier |
| workstream_name | text | NOT NULL | Display name |
| home_division_id | uuid | FK divisions.division_id, NOT NULL | Owning Division |
| workstream_lead_user_id | uuid | FK users.user_id, NOT NULL | Named lead — single person |
| active_status | boolean | NOT NULL, default true | Gate enforcement — inactive blocks all gate clearance |
| wip_limit_pre_build | integer | NOT NULL, default 3 | WIP limit for Pre-Build zone (DESIGN, SPEC stages) per D-WIPLimit-2026-04-06 |
| wip_limit_build | integer | NOT NULL, default 3 | WIP limit for Build zone (BUILD, VALIDATE, UAT stages) |
| wip_limit_post_deploy | integer | NOT NULL, default 3 | WIP limit for Post-Deploy zone (PILOT, RELEASE, OUTCOME stages) |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | nullable | Soft delete |

### 3.2 workstream_members
Source: ARCH-23

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| workstream_member_id | uuid | PK | |
| workstream_id | uuid | FK delivery_workstreams.workstream_id, NOT NULL | |
| member_user_id | uuid | FK users.user_id, NOT NULL | |
| created_at | timestamptz | NOT NULL, default now() | |

### 3.3 delivery_cycles
Source: D-108, D-124, D-125, ARCH-12, ARCH-15, ARCH-23, D-173, D-174, D-165, Session 2026-03-24, Session 2026-03-25-A

**Schema corrections from v1.0:** `cycle_owner_user_id` dropped (D-173). `assigned_ds_user_id` and `assigned_cb_user_id` added (D-173, D-174). `workstream_id` changed to nullable (D-165).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| delivery_cycle_id | uuid | PK | |
| cycle_title | text | NOT NULL | Descriptive title |
| cycle_description | text | nullable | Optional longer context |
| division_id | uuid | FK divisions.division_id, NOT NULL | Owning Division |
| workstream_id | uuid | FK delivery_workstreams.workstream_id, **nullable** | Nullable at creation — required before Brief Review gate per D-165 |
| tier_classification | text | NOT NULL, CHECK IN ('tier_1','tier_2','tier_3') | Set at BRIEF stage |
| current_lifecycle_stage | text | NOT NULL, default 'BRIEF' | System-controlled. Values: BRIEF, DESIGN, SPEC, BUILD, VALIDATE, UAT, PILOT, RELEASE, OUTCOME, COMPLETE, CANCELLED, ON_HOLD |
| outcome_statement | text | nullable | Direct field — not an artifact. Amber warning in UI when null. |
| outcome_set_by_user_id | uuid | FK users.user_id, nullable | |
| outcome_set_at | timestamptz | nullable | |
| assigned_ds_user_id | uuid | FK users.user_id, **nullable** | Domain Strategist — nullable at creation; MCP blocks Brief Review if null at gate time |
| assigned_cb_user_id | uuid | FK users.user_id, **nullable** | Capability Builder — nullable at creation; MCP blocks Go to Build if null at gate time |
| jira_epic_key | text | nullable | e.g. PS-2025-042 |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | nullable | |

### 3.4 cycle_milestone_dates
Source: Session 2026-03-24-E, Session 2026-03-24-A

One row per gate per cycle. Five rows seeded on cycle creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| milestone_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| gate_name | text | NOT NULL, CHECK IN ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review') | |
| milestone_label | text | NOT NULL | Human-readable: Brief Review Complete, Build Start, Pilot Start, Release Start, Close Review Complete |
| target_date | date | nullable | Team-set commitment date |
| actual_date | date | nullable | System-recorded when gate clears |
| date_status | text | NOT NULL, default 'not_started', CHECK IN ('not_started','on_track','at_risk','behind','complete') | |
| status_override_reason | text | nullable | Required when reverting from complete |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

**Date field state model (Session 2026-03-24-A):**
- Commitment mode: `actual_date` is null → show `target_date`; overdue = today > target_date (Oravive); upcoming ≤ 4 days (Sunray)
- Achieved mode: `actual_date` ≤ `target_date` → show actual, label "Actual", neutral color
- Missed mode: `actual_date` > `target_date` → show actual, label "Actual", muted overdue color
- Urgency indicators suppressed when cycle is COMPLETE or CANCELLED

**Five status values with colors (Session 2026-03-24-N):**
- Not Started: gray (system default)
- On Track: green (human-set)
- At Risk: amber (human-set)
- Behind: red (system-set when today > target date and gate not cleared)
- Complete: blue (system-set when gate clears)

Human can unset Complete — unsetting requires a logged reason.

### 3.5 gate_records
Source: D-49, D-154, ARCH-12, Session 2026-03-18-A

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| gate_record_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| gate_name | text | NOT NULL, CHECK IN ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review') | |
| gate_status | text | NOT NULL, default 'pending', CHECK IN ('pending','approved','returned','blocked') | |
| approver_user_id | uuid | FK users.user_id, nullable | Configured per Division per D-192; default Phil |
| approver_decision_at | timestamptz | nullable | |
| approver_notes | text | nullable | Required on return |
| workstream_active_at_clearance | boolean | nullable | Audit trail — recorded at every gate clearance attempt |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

### 3.6 cycle_event_log
Source: D-125

Append-only. Never update or delete rows.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| event_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| event_type | text | NOT NULL | e.g. stage_advanced, gate_cleared, gate_returned, artifact_attached, outcome_set, jira_synced |
| event_description | text | NOT NULL | Human-readable summary |
| actor_user_id | uuid | FK users.user_id, nullable | Null for system-generated events |
| event_metadata | jsonb | nullable | Prior stage, new stage, gate name, artifact id, etc. |
| created_at | timestamptz | NOT NULL, default now() | |

### 3.7 cycle_artifact_types
Source: ARCH-24, Session 2026-03-25-B, Session 2026-03-25-F

System-defined seed table. Populated via migration — not user-editable at launch. 26 seeded rows plus 1 ad hoc type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| artifact_type_id | uuid | PK | |
| artifact_type_name | text | NOT NULL | |
| lifecycle_stage | text | NOT NULL | Stage this slot belongs to, or 'ANY' for ad hoc |
| guidance_text | text | NOT NULL | Shown in empty slot placeholder |
| sort_order | integer | NOT NULL | Display order within stage |
| gate_required | boolean | NOT NULL, default false | Dormant at launch — do not enforce |
| required_at_gate | text | nullable | Dormant at launch |

**Seed data — commit as migration:**

| Stage | Artifact Type Name | Guidance |
|-------|--------------------|---------
| BRIEF | Context Brief | Primary framing document for this cycle |
| BRIEF | Scenario Journeys | Context Package layer — scenario-based supporting context |
| BRIEF | True-life examples | Context Package layer — real examples supporting the brief |
| BRIEF | Stakeholder input record | Structured record of stakeholder input gathered |
| DESIGN | Design session output | Session output file from design work |
| DESIGN | UI/UX mockup | Screen designs or wireframes |
| DESIGN | Process flow diagram | Workflow or process map |
| SPEC | Technical Specification | Full tech spec — MCP scope, schema, acceptance criteria |
| SPEC | Cursor prompt | Initial AI-executable build prompt |
| SPEC | Architecture Decision Record | ADR if applicable |
| SPEC | Agent Registry entry | Required for Tier 3 agent deployments |
| BUILD | Governing document bootstrap log | CLAUDE.md session context confirmation |
| BUILD | Mend scan results | SCA scan — no critical/high CVEs |
| BUILD | Code review sign-off | CB code review gate record |
| BUILD | Delivery Cycle Build Report | As-built record — complete before Go to Deploy |
| VALIDATE | QA test results | Functional test pass record |
| VALIDATE | OWASP ZAP scan | DAST results |
| VALIDATE | Wiz posture report | CSPM baseline |
| UAT | UAT sign-off record | Stakeholder acceptance |
| UAT | 7-step governance checklist | Required for Tier 3 |
| UAT | HITRUST/GRICS checklist | Required for Tier 3 |
| PILOT | Pilot Plan | Who, scope, duration, success criteria, rollback trigger |
| PILOT | Pilot observations log | Running log during pilot |
| RELEASE | Wiz continuous monitoring baseline | Production posture baseline |
| OUTCOME | Outcome measurement record | Demonstrated outcome against acceptance criteria |
| ANY | Reference document | Ad hoc — user provides display name |

### 3.8 cycle_artifacts
Source: ARCH-24, Session 2026-03-25-B, Session 2026-03-25-G

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| cycle_artifact_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| artifact_type_id | uuid | FK cycle_artifact_types.artifact_type_id, nullable | Null = ad hoc attachment |
| display_name | text | NOT NULL | User-provided label |
| external_url | text | nullable | MSO365 or other external link |
| oi_library_artifact_id | uuid | FK artifacts.artifact_id, nullable | OI Library pointer — populated on promotion |
| pointer_status | text | NOT NULL, default 'external_only', CHECK IN ('external_only','promoted','oi_only') | |
| attached_by_user_id | uuid | FK users.user_id, NOT NULL | |
| attached_at | timestamptz | NOT NULL, default now() | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

### 3.9 jira_links
Source: D-67, D-117, ARCH-16

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| jira_link_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| jira_epic_key | text | NOT NULL | e.g. PS-2025-042 |
| jira_project_key | text | NOT NULL | e.g. PS |
| sync_status | text | NOT NULL, default 'unsynced', CHECK IN ('unsynced','synced','error') | |
| last_synced_at | timestamptz | nullable | |
| last_sync_error | text | nullable | |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

### 3.10 tier_gate_requirements
Source: D-192

One row per tier per gate. Seeded via migration — determines which gates each tier must pass.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| tier_classification | text | NOT NULL, CHECK IN ('tier_1','tier_2','tier_3') | |
| gate_name | text | NOT NULL, CHECK IN ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review') | |
| is_required | boolean | NOT NULL, default true | All tiers require all gates for current rollout phase per D-192 |
| created_at | timestamptz | NOT NULL, default now() | |

### 3.11 division_gate_approvers
Source: D-192, D-65, Session 2026-03-29-C

Demo seed: Sabrina as Accountable for Brief Review / Go to Build / Go to Deploy on Practice Services and Value Services. Phil as Accountable for Go to Release / Close Review. Other Trusts escalate to Division Owner per Session 2026-03-29-C.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| division_id | uuid | FK divisions.division_id, NOT NULL | |
| gate_name | text | NOT NULL | |
| accountable_user_id | uuid | FK users.user_id, NOT NULL | Primary approver |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

### 3.12 system_config
Source: D-MaintenanceMode

Single-row configuration table. Seeded at bootstrap. Angular reads this table directly — the only exception to D-93 (MCP-Only Database Access). All other data access remains MCP-only.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| maintenance_mode | boolean | NOT NULL, default false | When true: Angular intercepts all routing and renders MaintenanceScreenComponent |
| maintenance_message | text | nullable | Overrides default message when set |
| updated_at | timestamptz | NOT NULL, default now() | |
| updated_by | text | nullable | Records who/what set the flag |

---

## 4. Delivery Cycle MCP — `delivery-cycle-mcp`

Stateless Node.js on Render. JWT validation middleware on every request — 401 on failure, no exceptions. Tool naming: `verb_noun`. Response envelope: `{ success: boolean, data: any, error?: string }`.

### 4.1 Complete Tool Set (20 tools)

**Core cycle tools (4):**

| Tool | Description |
|------|-------------|
| `create_delivery_cycle` | Creates cycle record, seeds five milestone date rows, seeds gate_records for applicable gates, appends creation event. Accepts: cycle_title, division_id, workstream_id (optional per D-165), tier_classification, assigned_ds_user_id (optional), assigned_cb_user_id (optional), outcome_statement (optional), jira_epic_key (optional). |
| `get_delivery_cycle` | Returns full cycle record including current stage, milestone dates, open gate record, Workstream details, assigned DS/CB. |
| `list_delivery_cycles` | Returns cycles visible to authenticated user filtered by Division access. Filters: division_id, include_child_divisions, lifecycle_stage, workstream_id, tier_classification, assigned_user_id, gate_status. |
| `update_delivery_cycle` | Updates mutable cycle fields: `cycle_title`, `outcome_statement`, `assigned_ds_user_id`, `assigned_cb_user_id`, `workstream_id`, `tier_classification`, `division_id`, `jira_epic_key`, `cycle_status`. Every call that changes one or more field values appends a structured event log entry per D-229. |

**Stage/lifecycle tools (2):**

| Tool | Description |
|------|-------------|
| `advance_cycle_stage` | Advances current_lifecycle_stage to next stage. Validates: gate cleared if gate precedes this stage; workstream is active. Appends event log. |
| `get_stage_definition` | Returns ordered stage/gate sequence for a given tier classification. Internal tool — not user-callable directly. |

**Gate tools (4):**

| Tool | Description |
|------|-------------|
| `submit_gate_for_approval` | Transitions gate_record status from pending to awaiting_approval. Pre-checks: workstream assigned and active (D-165, ARCH-23), assigned DS set if gate is Brief Review (D-174), assigned CB set if gate is Go to Build (D-174). Returns D-140 blocked message on failure. |
| `record_gate_decision` | Records approver approval or return. On approval: sets actual_date on milestone, updates date_status to complete, advances cycle stage, runs WIP limit check and returns warning if applicable (D-WIPLimit-2026-04-06). On return: requires approver_notes. Appends event log. |
| `get_gate_record` | Returns gate record for a specific gate on a specific cycle. |
| `list_gate_records` | Returns all gate records for a cycle, ordered by gate sequence. |

**Artifact tools (3):**

| Tool | Description |
|------|-------------|
| `attach_cycle_artifact` | Attaches artifact to cycle. Accepts: delivery_cycle_id, artifact_type_id (nullable for ad hoc), display_name, external_url or oi_library_artifact_id, pointer_status. Appends event log. |
| `list_cycle_artifacts` | Returns artifacts for a cycle, organized by lifecycle stage. |
| `update_artifact_pointer` | Updates pointer_status and oi_library_artifact_id on an artifact. Used for OI Library promotion. |

**Workstream tools (4):**

| Tool | Description |
|------|-------------|
| `list_delivery_workstreams` | Returns Workstreams visible to user. Filters: home_division_id, active_status. Includes WIP counts per zone per D-WIPLimit-2026-04-06. |
| `get_delivery_workstream` | Returns single Workstream with members, active cycle count, WIP zone counts. |
| `create_delivery_workstream` | Admin only. Creates Workstream record. workstream_name, home_division_id, workstream_lead_user_id required. active_status always true at creation. |
| `update_delivery_workstream` | Admin only. Updates workstream_name, workstream_lead_user_id, active_status. Returns warning when inactivating a Workstream with open cycles. |

**Milestone date tools (2):**

| Tool | Description |
|------|-------------|
| `set_milestone_target_date` | Sets target_date on a milestone. User-set — not system-controlled. |
| `set_milestone_actual_date` | Sets actual_date on a milestone. Called by `record_gate_decision` on approval; also callable directly by authorized users for corrections. Updates date_status to complete. |

**Jira tool (1):**

| Tool | Description |
|------|-------------|
| `sync_jira_epic` | Reads/writes five governance fields on linked Jira epic: Outcome Statement, Context Brief Link, Tier Classification, Capabilities Equation Mapping, Technical Specification status. Updates sync_status and last_synced_at. Returns graceful stub if Jira not configured. |

### 4.2 Gate Enforcement Rules

On every `submit_gate_for_approval` call:
1. Check `workstream_id` is not null — if null, return D-140 message: "Assign a Workstream before submitting for approval."
2. Check `delivery_workstreams.active_status` — if false, return D-140 message: "Gate blocked: assigned Workstream is inactive. Contact your Division Admin."
3. Check `assigned_ds_user_id` is not null for Brief Review gate — if null, return D-140 message.
4. Check `assigned_cb_user_id` is not null for Go to Build gate — if null, return D-140 message.
5. Record `workstream_active_at_clearance` on gate_record regardless of outcome (audit trail).

WIP limit check on `record_gate_decision` (approval only):
- Go to Build approval → cycle enters Build zone. If wip_limit_build ≤ current Build zone count, return warning in response (not an error — approval proceeds).
- Go to Deploy approval → cycle enters Post-Deploy zone. Same warning pattern.
- D-200 Pattern 2 warning surfaced in Angular before user confirms approval.

### 4.3 Division MCP — Maintenance Mode Tools

Two tools added to `division-mcp` for Build C (D-MaintenanceMode):

| Tool | Description |
|------|-------------|
| `set_maintenance_mode` | Admin JWT required. Sets maintenance_mode boolean and optional maintenance_message on system_config. |
| `get_maintenance_mode` | No JWT required (Angular calls this before auth on bootstrap). Returns { maintenance_mode: boolean, maintenance_message: string \| null }. |

---

## 5. Angular Components

All components presentation-only. No business logic. No Supabase client imports — except AppComponent which reads system_config.maintenance_mode directly (D-MaintenanceMode exception). All data via MCP through Angular services.

**Governing principles:** Principle 10 (Right-Panel Entity Detail, D-180), Principle 11 (Tappable Entity Chips, D-181), Principle 14 (Entity Name Capitalization, D-184), Principle 17 (Primary Workflow Clarity, D-198), Principle 18 (Sidebar-Only Navigation, D-199)

### 5.1 Sidebar Navigation (D-199, D-164)

Single navigation authority. Grouped under muted uppercase section headers:

```
(no header)  Home / Action Queue / Notifications
OI LIBRARY   OI Library
DELIVERY     Delivery Cycle Tracking
ADMIN        Admin
```

`Delivery Cycle Tracking` visible to all roles (`roles: 'all'`) per D-310. `Admin` visible to phil and admin roles only (D-311).

### 5.2 AppComponent — Bootstrap Sequence (D-MaintenanceMode)

Before any route resolves, AppComponent reads `system_config.maintenance_mode` via a direct Supabase query (single-row lightweight read — MCP servers may be down during deployment). If true: render `MaintenanceScreenComponent`, suppress all routing, no auth attempted. If false: proceed normally.

`MaintenanceScreenComponent`: standalone component, no auth dependency, no MCP calls. Displays: "Pathways OI Trust is currently being updated. Check back shortly." and optional `maintenance_message` if set.

### 5.3 Admin Hub (D-164)

Route: `/admin`
Roles: phil, admin

Card grid — one card per admin function:
- Delivery Workstream Registry → /admin/workstreams
- Division Management → /admin/divisions
- User Management → /admin/users

No standalone sidebar entries for individual admin functions.

### 5.4 DeliveryModule (lazy-loaded)

Route root: `/delivery`

### 5.5 Delivery Cycle Tracking Hub — Landing Page (D-DeliveryHub-FourViews)

Route: `/delivery`

Landing page only — no actions from this page. Four view cards, each with:
- View title
- One-sentence description
- Async headline strip (skeleton animation while loading; populates after card renders)
- "Open view →" link

Four views:

| Card | Route | Description | Async Headline |
|------|-------|-------------|----------------|
| All Delivery Cycles | /delivery/cycles | Full filterable list of all cycles | "You are assigned to N cycles" (if N > 0) or "N active cycles in your divisions" |
| Workstream Summary | /delivery/workstreams | WIP limit visibility per workstream | WIP signal if any workstreams over limit |
| Gate Schedule | /delivery/gates | Overdue and upcoming gates within 7 days | "X overdue · Y due in 7 days" (amber/red if present) |
| Deploy Gate by Quarter | /delivery/deploy-schedule | Cycles organized by Go to Deploy quarter | Workstream count + signal if misses present |

Each view has a `+ New Cycle` button with context-aware pre-population per D-HubCreate-2026-04-06.

### 5.6 All Delivery Cycles View (D-172, D-HubFilter-2026-04-06, D-HubCounts-2026-04-06)

Route: `/delivery/cycles`
Primary view — pattern setter for all other views.

**Governing principles:** Principle 11 (D-181), Principle 17 (D-198)

**Header counts (when no filters active) per D-HubCounts-2026-04-06:**
- Active cycles — total non-terminal cycles in My Divisions. Always shown. Not tappable.
- My Cycles — cycles where current user is assigned DS or CB. Tappable → sets Assigned Person filter to "My cycles." Hidden at zero.
- Overdue gates — cycles where any gate target date exceeded and gate not cleared. Tappable → sets Gate Status filter to "Overdue." Hidden at zero.

When any filter active: counts hidden, replaced by "X of Y cycles — filtered view" in grid footer.

**Filter panel (D-HubFilter-2026-04-06):**

Collapsed by default. "Filters" button opens slide-in panel. Active filter count badge on button when filters set. Each filter is a drill-in item — tapping opens its options:

| Filter | Drill-in Options |
|--------|-----------------|
| Division | My Divisions (default) / All Divisions / Select single — Division picker per D-HubFilter-Division |
| Assigned Person | Anyone (default) / My cycles / Unassigned DS / Unassigned CB / Select person — entity picker per D-HubFilter-AssignedPerson |
| Lifecycle Stage | Multi-select of all 12 stages; default all |
| Gate Status | All / Overdue / Pending / Approved |
| Tier | All Tiers (default) / Tier 1 / Tier 2 / Tier 3 with colored dots and descriptions per D-HubFilter-Tier |
| Workstream | All (default) + active workstreams; includes "No workstream assigned" and inactive group per D-167 |

Active filters render as dismissible chips in filter bar below the header. Filter state persists per D-171 with screen key `delivery.cycles`. Pre-set filter shortcuts from count taps do NOT write to filter memory.

**Column set per D-172 (11 columns, ordered):**

| # | Column | Notes |
|---|--------|-------|
| 1 | Tier dot | 48px circle — Tier 1 green, Tier 2 amber, Tier 3 teal per D-197 |
| 2 | Division | Tappable chip → Division Detail Panel |
| 3 | Cycle Title + Tier badge | Title tappable → opens right panel detail. Tier badge pill below title. |
| 4 | Outcome Statement | One-line truncation, amber dot when null |
| 5 | Stage Track (Condensed) | 5 gate diamonds per ARCH-25 |
| 6 | Headline | Intelligent summary text per Session 2026-03-24-C |
| 7 | Assigned DS | Tappable chip → User Detail Panel |
| 8 | Assigned CB | Tappable chip → User Detail Panel |
| 9 | Pilot Start Date | Date state model |
| 10 | Production Release Date | Date state model |
| 11 | Delivery Workstream | Tappable chip → Workstream detail |

Column headers always rendered (D-196) — Deep Navy background, white text. Empty state inside grid body, not replacing headers.

Responsive: DS/CB collapse to avatar only; Workstream truncates with tooltip; Division, Title, Stage Track, Tier dot never hidden.

### 5.7 Gate Schedule View (D-DeliveryHub-GateSummary)

Route: `/delivery/gates`

**Governing principles:** Principle 17 (D-198)

Two named sections at top:
1. Overdue — cycles where current gate target date exceeded and gate not cleared. Overdue callout banner (D-200 Pattern 2) at top when count > 0 — cannot be dismissed.
2. Upcoming — cycles where current gate target date falls within 7 days.

Full grid below both sections shows all cycles. Cycles outside both windows appear in grid only.

Rules: 7-day window fixed. Cycles with no gate target date not in Overdue or Upcoming sections. Gate filter dropdown: narrows to specific gate type, default all. Sort state persists per D-171. "Display only my Divisions" toggle: hidden for Phil/Admin, visible for DS/CB, defaulting on.

### 5.8 Deploy Gate by Quarter View (D-PilotSchedule-2026-04-06)

Route: `/delivery/deploy-schedule`
Full name: Deploy Gate Schedule by Quarter. Card display name: "Deploy Gate by Quarter."

**Governing principles:** Principle 17 (D-198)

Organizing date: Go to Deploy gate milestone (Pilot Start target or actual). Actual overrides target when set.

Top-level: list of all workstreams (including zero-cycle workstreams). Each row shows: workstream name + inline counts — Prior: N · Current: N · Other: N. Expand chevron opens three section groups. Multiple workstreams expandable simultaneously (no accordion).

Three section groups per workstream:
1. Prior Quarter [Q label] Actual — cycles where Pilot Start actual date falls in prior calendar quarter. Includes COMPLETE cycles.
2. Current Quarter [Q label] Planned/Actual — cycles where Pilot Start actual or target date falls in current calendar quarter.
3. Other Active — all other active cycles.

Each section header always renders — shows "No cycles" when empty. Each section collapsible. Each section contains standard cycle grid per Section 5.6. Pilot Start milestone date status dot shown on every row.

Prior quarter with target set but no actual: cycle appears in Prior Quarter (red dot, Behind signal) AND in Other Active if still active.

### 5.9 Workstream Summary View

Route: `/delivery/workstreams`

Shell route present. Full WIP limit implementation follows All Delivery Cycles pattern. WIP zone counts displayed per D-WIPLimit-2026-04-06 (see Section 8).

### 5.10 DeliveryCycleDetailComponent (right panel)

**Governing principles:** Principle 10 (D-180), Principle 11 (D-181), Principle 13 (D-183), Principle 14 (D-184)

Opens on cycle title tap from any view. Originating screen remains visible. One panel slot — no stacking.

**Panel header:** Deep Navy background, cycle title (Roboto Bold 20px white), stage badge and tier badge top right.

**Stage Track (Full Mode, ARCH-25):** Immediately below header. 10 stage nodes + 5 gate diamonds. Gate nodes tappable — emits `(gateClicked)`. See Section 5.12.

**Outcome Statement zone:** Amber bordered box always present. When null: amber warning text "No Outcome Statement set. Required before Brief Review Gate." When populated: italic text in amber box. Inline edit.

**Identity fields (two-column grid):**
- Domain Strategist / Capability Builder
- Delivery Workstream / Jira Epic Link
- Division Assignment / Tier Classification

Named entity values tappable as chips per D-181 — opens entity detail in same panel slot.

**Gates & Milestone Dates section:** Five gate rows. Diamond icon in gate status color. Target date editable (user-set). Actual date system-set. Status colored per five-state model.

**Artifact slots:** Organized by current and past stages. Future stage slots visible but dimmed — "Available when Delivery Cycle reaches [STAGE]." Each slot: card with artifact type name, guidance text, attach/replace action. See Section 6 for attach interaction. Ad hoc attachment: "+ Attach Document" at bottom of each stage section.

**Gate detail sub-panel:** Opens below Stage Track on gate node click. See Section 7.

**Event log:** Append-only, chronological, bottom of panel.

**Jira sync panel:** In Identity Zone. Three states per build-c-supplement-spec.md Section 10.

### 5.11 New Delivery Cycle Form (right panel) (D-194, D-191, D-195)

**Governing principles:** Principle 10 (D-180), Principle 12 (D-182), Principle 17 (D-198)

Opens as right panel. Dashboard visible behind it. Header: Deep Navy, "New Delivery Cycle."

**Field order per D-194:**

| # | Field | Required | Notes |
|---|-------|----------|-------|
| 1 | Division | Required | Dropdown of user's accessible Divisions; pre-populates if single Division |
| 2 | Delivery Cycle Title | Required | Free text, max 120 chars |
| 3 | Outcome Statement | Optional | Textarea, min 80px. Amber persistent warning below: "Outcome Statement should be set before Brief Review. You can add it now or after creation." (D-200 Pattern 2) |
| 4 | Delivery Workstream | Required | Entity picker per D-182 scoped to selected Division. Trust scope radio suppressed when Division is Trust-level (D-195). "Show inactive" toggle separated per D-195. |
| 5 | Tier Classification | Required | Dropdown (not radio per D-191). No default. Options: Tier 1 — Fast Lane: Workflow changes, config updates, no platform dependencies. Tier 2 — Structured: Platform changes, integrations, cross-domain dependencies. Tier 3 — Governed: Agent deployments, compliance scope changes, AI Governance Board required. Tier 3 error if not selected. |
| 6 | Assigned Domain Strategist | Optional | Dropdown of DS-role users in Division. Nullable. Gate-requirement note: "Required before Brief Review Gate." (D-200 Pattern 1) |
| 7 | Assigned Capability Builder | Optional | Dropdown of CB-role users in Division. Nullable. Gate-requirement note: "Required before Go to Build Gate." (D-200 Pattern 1) |
| 8 | Jira Epic Link | Optional | Free text. Note: "Required before Go to Build Gate." (D-200 Pattern 1) |

On success: panel closes, new row at top of list, snackbar confirms "Delivery Cycle created." Starting stage always BRIEF.

**Context-aware pre-population per D-HubCreate-2026-04-06:**
- From All Delivery Cycles: Division pre-filled if Division filter = single division; DS pre-filled if Assigned Person = "My cycles"
- From Workstream Summary: Workstream and Division pre-filled from workstream context
- From Gate Schedule: Division pre-filled if single division in scope filter
- From Deploy Gate by Quarter: Workstream pre-filled from expanded workstream row

### 5.12 StageTrackComponent — ARCH-25

Standalone reusable component. Two modes.

**Inputs:**
- `lifecycleDefinition`: ordered stage array with gate positions
- `currentStageId`: string
- `gateStateMap`: map of gate name → `pending | blocked | complete | upcoming`
- `displayMode`: `full | condensed`

**Token mapping:**
- Complete / Current stage: `--triarq-color-primary` (#257099)
- Gate pending: `--triarq-color-sunray`
- Gate blocked: system error color
- Upcoming: `--triarq-color-fog`

**Full mode (cycle detail):** 10 stage nodes + 5 gate diamonds. Labels above/below. Gate nodes interactive — emit `(gateClicked)`. Stage nodes non-interactive.

**Condensed mode (dashboard rows):** 5 gate diamonds in horizontal row. No labels. Non-interactive.

### 5.13 Delivery Workstream Admin UI (build-c-supplement-spec.md Section 5)

Route: `/admin/workstreams`
Roles: phil, admin

**Governing principles:** Principle 10 (D-180), Principle 11 (D-181), Principle 13 (D-183), Principle 14 (D-184)

Page header: "Delivery Workstream Registry"
Subheading: "Named teams of Capability Builders. Every Delivery Cycle must be linked to an active Workstream. Inactive Workstream blocks Gate advancement — no grace period."

Filter toggle: Active / Inactive / All (default: Active)

Columns: avatar, Workstream Name (tappable → right panel), Home Division (tappable chip → Division Detail Panel), Workstream Lead (tappable chip → User Detail Panel), Active Cycle Count, Active Status (pill badge).

Inactive workstream row: amber warning band — D-200 Pattern 2 — "Inactive Workstream — Gate advancement blocked on all assigned Delivery Cycles."

Right panel detail per build-c-supplement-spec.md Section 5.2. Inactivation confirmation per D-183 — states number of affected active cycles.

---

## 6. Artifact Attach Interaction (build-c-supplement-spec.md Section 4)

**Governing principles:** Principle 10 (D-180), Principle 11 (D-181), Principle 14 (D-184)

Current and past stage slots: active. Future stage slots: visible but dimmed — "Available when Delivery Cycle reaches [STAGE]."

**External URL / MSO365:** Inline form expands below slot — no modal. Fields: Display Name (pre-filled, editable), External URL. pointer_status = external_only on save.

**File upload:** Inline file picker. Accepted: PDF, DOCX, MD, TXT (D-146). Max 25MB. ClamAV scan spinner during scan. Clean: green checkmark. Rejected: inline error in slot — "File rejected by malware scan. Remove and try a different file."

**Build Report slot:** Standard attach works. "Submit to OI Library" button renders as stub: "OI Library submission available in Build B." Not an error — informational. Gate enforcement: MCP blocks Go to Deploy if no attachment on Build Report slot (Tier 2+, D-50).

---

## 7. Gate Detail Sub-Panel (build-c-supplement-spec.md Section 2)

**Governing principles:** Principle 10 (D-180), Principle 11 (D-181), Principle 13 (D-183), Principle 14 (D-184)

Opens below Stage Track on gate node click. Not a modal, not a separate page. One sub-panel open at a time — opening second closes first. Dismissible via ✕ or clicking another gate node.

**Content:** Gate name, Gate Approval Status (contextual narrative text per D-245 — absent when pending), milestone target date (user-editable inline, calls `set_milestone_target_date`), milestone actual date (display, user-editable for corrections, calls `set_milestone_actual_date`), Milestone Status indicator (five-color model per D-244), approval routing (Accountable/Consulted/Informed as tappable chips per D-181), gate checklist (pass/fail items — informational only, not enforcement), review notes if any, action buttons per Section 7.1.

**Gate checklist by gate per build-c-supplement-spec.md Section 2.2.**

**Gate action rules per build-c-supplement-spec.md Section 1:**
- No action authority → read-only, no buttons
- Accountable approver → Approve (primary/filled) and Return (secondary/outlined)
- DS or CB on cycle (gate ready to submit) → Submit for Approval
- Consulted participant → Add Review Note (muted, below main action zone)

Approval confirmation per D-183: "Approving this Gate will advance the lifecycle stage to [NEXT STAGE]. This cannot be undone." Inline — not a modal.

**Gate Approval Status display (D-245):** Contextual narrative text only. pending = no text; awaiting_approval = "Awaiting [Approver display name] approval"; approved = "Approved by [display name] on [date]"; returned = "Returned — [approver_notes]" with re-submit path. Not an editable field.

**Milestone Status display (D-244):** Five-color indicator on the gate row. Not on Stage Track diamonds — diamonds use clearance-state coloring only.

**WIP limit warning:** When approval would move cycle into a zone at or over limit, D-200 Pattern 2 warning shown before user confirms. User can still approve.

---

## 8. WIP Limit Model (D-WIPLimit-2026-04-06)

**Three WIP zones per workstream, independent limits. Default: 3/3/3 (WIP_LIMIT_DEFAULT = 3 — system constant).**

| Zone | Stages Included | Gate Trigger |
|------|-----------------|-------------|
| Pre-Build | DESIGN, SPEC | Brief Review cleared, Go to Build not yet cleared. BRIEF excluded. |
| Build | BUILD, VALIDATE, UAT | Go to Build cleared, Go to Deploy not yet cleared |
| Post-Deploy | PILOT, RELEASE, OUTCOME | Go to Deploy cleared, Close Review not yet cleared |

Alert condition: zone count ≥ limit. Warning not a hard block — cycle always advances.

**Two alert surfaces:**
1. Workstream Summary view — zone count in red when at/over limit; workstream row carries visual flag
2. Gate approval warning — D-200 Pattern 2 warning before confirming Go to Build or Go to Deploy approval

Per-workstream limit override: stored on `wip_limit_pre_build`, `wip_limit_build`, `wip_limit_post_deploy` columns (system default 3 at creation). Admin-configurable — not yet exposed in UI; columns present in schema.

WIP zone count query: delivery-cycle-mcp `list_delivery_workstreams` includes computed zone counts per ARCH-28.

---

## 9. Maintenance Mode — Deployment Sequence (D-MaintenanceMode)

Before any schema migration, MCP deploy, or Angular deploy:

```
1. Call set_maintenance_mode(true) via division-mcp tool
2. Run Supabase migrations
3. Deploy delivery-cycle-mcp to Render (wait for healthy)
4. Deploy division-mcp to Render (wait for healthy)
5. Deploy Angular to GitHub Pages
6. Run health checks
7. Call set_maintenance_mode(false)
```

Maintenance mode is **never** left active. Clearing it is the final required deployment step. Claude Code must confirm it is cleared before session close.

---

## 10. Visual and Layout Standards

Authoritative reference: build-c-visual-layout-standards-2026-04-05.md. Token values below are the primary reference. Prototype images (BuildsACBprototypesv2.pptx Build C slides) are the visual target for proportions and hierarchy.

**Key token values:**
- App sidebar: `#1a2f4e` background
- `--triarq-color-primary`: #257099 (stage badges, active states, primary buttons)
- Deep Navy: #12274A (table headers, panel headers)
- `--triarq-color-sunray`: #F2A620 (pending gates, warnings, amber)
- Oravive: #E96127 (overdue, destructive actions, required field indicator)
- Body text: Roboto throughout — never Gill Sans or Lato in the Angular app
- Typography scale per D-151: see build-c-visual-layout-standards-2026-04-05.md Section 1.5
- Spacing: multiples of 4px per build-c-visual-layout-standards-2026-04-05.md Section 1.6

**UI Feedback Standard — Three patterns only (D-200):**
- Pattern 1 — Field Guidance: `--triarq-color-stone` gray sub-text below input, no icon or background
- Pattern 2 — Warning: 3px left border `--triarq-color-sunray`, 8% opacity background, ⚠ icon
- Pattern 3 — Error: field border in error color, message below field

---

## 11. Environment Variables

```
# Jira Integration (required for sync_jira_epic tool)
JIRA_BASE_URL=https://[your-org].atlassian.net
JIRA_API_TOKEN=PLACEHOLDER
JIRA_USER_EMAIL=PLACEHOLDER
```

If Jira credentials unavailable: `sync_jira_epic` returns `{ success: false, error: "Jira integration not configured — set JIRA_BASE_URL, JIRA_API_TOKEN, and JIRA_USER_EMAIL." }`. All other functionality unblocked.

No new Supabase environment variables required.

---

## 12. Build C Acceptance Criteria

Build C is complete when all are demonstrable against real data:

**Core Delivery Cycle functionality:**
1. DS or Phil can create a Delivery Cycle with Division, Title, Workstream, Tier, and see it on the dashboard
2. Delivery Cycle with no Workstream assigned can be created; Submit for Approval returns D-140 blocked message until Workstream assigned
3. Dashboard renders correct 11-column set per D-172 with column headers always present (D-196)
4. Tier dot (D-197) and Tier badge both render on cycle rows
5. Cycle advances through at least three stages correctly; gate records created at correct positions
6. Gate clearance on cycle with inactive Workstream returns blocked message and records `workstream_active_at_clearance = false`
7. Milestone dates display correct three-mode state model (commitment / achieved / missed)
8. Outcome Statement: amber warning visible when null; inline edit sets value and clears warning
9. Stage Track: Full mode (10 stages + 5 gates) renders on detail; Condensed (5 gates) renders on dashboard row; gate node click opens sub-panel

**Hub and filtering:**
10. Delivery Cycle Tracking hub landing page renders four view cards with async headline strips
11. Filter panel with six drill-in filters replaces workstream tab strip; active filters render as chips in filter bar
12. Filter state persists on return to screen within 7 days (D-171, screen key `delivery.cycles`)
13. Header counts (Active cycles, My Cycles, Overdue gates) display correctly; tappable counts set corresponding filters
14. Gate Schedule view: two sections (Overdue, Upcoming within 7 days), overdue callout banner, gate filter, standard grid
15. Deploy Gate by Quarter view: workstream list with three counts per row, expandable section groups, prior-quarter miss detection

**Gate workflow:**
16. Gate action buttons render correctly by role (DS/CB see Submit on own cycles; Accountable sees Approve/Return; CE sees no actions)
17. Gate approval confirmation states lifecycle stage that will be advanced (D-183)
18. WIP limit warning surfaces at Go to Build and Go to Deploy approval when zone at/over limit (D-WIPLimit-2026-04-06)
19. Full gate sequence (all 5 gates) required for all tiers in current rollout phase (D-192)

**Artifacts and supplemental surfaces:**
20. All 26 seed artifact slots visible in correct stage groupings; future stage slots dimmed with "Available when Delivery Cycle reaches [STAGE]" label
21. File attach shows scan spinner; Clean badge on success; inline rejected error on malware
22. Build Report slot OI Library button renders as informational stub — not error
23. Jira sync panel: unconfigured state renders informational note; configured state shows Sync Now + five governance fields written on sync

**Admin and infrastructure:**
24. Admin Hub at /admin with three cards (Workstreams, Divisions, Users); no standalone sidebar admin links
25. Delivery Workstream Registry: 6 columns, amber warning band on inactive rows, filter toggle, right panel detail, inactivation confirmation states affected cycle count (D-183)
26. Home screen My Delivery Cycles card: DS/CB roles see only assigned cycles; empty state correct
27. Role data scope: Phil sees all cycles; DS/CB/CE see own Divisions; CE has no action buttons
28. Filter and sort memory implemented on all delivery screens
29. **Maintenance mode implemented and verified:** system_config table seeded, set_maintenance_mode and get_maintenance_mode tools operational in division-mcp, Angular bootstrap interception confirmed (maintenance screen renders when flag is true, normal routing resumes when false), Claude Code deployment sequence documented and tested
30. Unauthenticated user cannot call any delivery-cycle-mcp tool (401 returned)
31. Zero direct Supabase client calls in any Angular component or service — except AppComponent reading system_config.maintenance_mode only

Build C does not close and Build B does not open until criterion 29 (maintenance mode) is met.

---

## 13. Schema Migration Checklist

Run in this order before Claude Code begins component work:

1. `delivery_workstreams` table (with WIP limit columns)
2. `workstream_members` table
3. `delivery_cycles` table (assigned_ds_user_id, assigned_cb_user_id, nullable workstream_id — no cycle_owner_user_id)
4. `cycle_milestone_dates` table
5. `gate_records` table
6. `cycle_event_log` table
7. `cycle_artifact_types` table + seed data (26 rows)
8. `cycle_artifacts` table
9. `jira_links` table
10. `tier_gate_requirements` table + seed data (full gate sequence all tiers per D-192)
11. `division_gate_approvers` table + demo seed data (Sabrina/Phil per D-192)
12. `system_config` table + seed (single row, maintenance_mode = false)

Migrations 001–026 already run. Apply only missing migrations from above list. Claude Code will confirm which are outstanding before running any migration.

---

## 14. Key Decision Reference

| Decision | What It Locks |
|----------|--------------|
| D-67 | Jira link model |
| D-83 | Delivery Cycle as primary unit of work |
| D-108 | 12-stage lifecycle with 5 gates |
| D-113 | Cycle artifacts model |
| D-124 | Tier set at BRIEF stage |
| D-125 | Append-only event log |
| D-140 | Blocked action UX standard |
| D-154 | Five named gates |
| D-163 | Admin Hub Consolidation |
| D-164 | Admin Hub route and card structure |
| D-165 | Workstream optional at creation, required at Brief Review |
| D-166 | Division filter on dashboard |
| D-167 | Workstream filter: separate None and Inactive groups |
| D-171 | Filter and sort memory |
| D-172 | 11-column dashboard set |
| D-173 | cycle_owner_user_id dropped; assigned_ds_user_id is single DS field |
| D-174 | DS and CB nullable at creation; gate enforcement |
| D-175 | Inform and Consult build assignment |
| D-178 | Three-tier loading skeleton |
| D-179 | Stage regression with gate reset preview |
| D-180 | Right-Panel Entity Detail Pattern |
| D-181 | Tappable Entity Chips |
| D-182 | Entity Picker Pattern |
| D-183 | Destructive Action Confirmation |
| D-184 | Entity Name Capitalization |
| D-198 | Primary Workflow Clarity (Principle 17) |
| D-199 | Sidebar-Only Navigation (Principle 18) |
| D-200 | UI Feedback Standard — Three Patterns |
| D-191 | Tier Classification dropdown with descriptions |
| D-192 | Full gate sequence all tiers — rollout phase |
| D-194 | Create Cycle form field order |
| D-195 | Workstream Picker corrections |
| D-196 | Column headers always rendered |
| D-197 | Tier avatar dot |
| D-DeliveryHub-FourViews | Four-view hub structure |
| D-DeliveryHub-GateSummary | Gate Schedule detail rules |
| D-HubCounts-2026-04-06 | Hub header count definitions |
| D-HubFilter-Division | Division filter drill-in |
| D-HubFilter-AssignedPerson | Assigned Person filter |
| D-HubFilter-Tier | Tier filter drill-in |
| D-HubCreate-2026-04-06 | Create button pre-population by view context |
| D-PilotSchedule-2026-04-06 | Deploy Gate by Quarter detail rules |
| D-WIPLimit-2026-04-06 | WIP zone model and alerts |
| D-MaintenanceMode | Maintenance mode pattern and deployment sequence |
| ARCH-12 | Gate positions in 12-stage lifecycle |
| ARCH-23 | Delivery Workstream schema and gate enforcement |
| ARCH-24 | Cycle artifact tracking tables |
| ARCH-25 | StageTrackComponent contract |
| ARCH-27 | Universal Entity Detail Panel — system-wide principle |
| ARCH-28 | WIP zone count query pattern |

---

*Pathways OI Trust · Empower | Optimize | Partner · CONFIDENTIAL · April 2026*
