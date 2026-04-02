# Build C Specification
Pathways OI Trust | Delivery Cycle Tracker | v1.0 | March 2026 | CONFIDENTIAL
Owner: Phil Sappington, EVP Performance & Governance

---

## 1. Build C Scope

Build C delivers the Delivery Cycle management layer. It builds directly on top of Build A's Division hierarchy, user/role model, and authentication infrastructure. Every table, MCP tool, and component in this spec assumes Build A tables (`divisions`, `users`, `division_memberships`, `artifacts`) are stable and populated.

| Component | Use Case | Delivers |
|-----------|----------|---------|
| Delivery Cycle MCP (`delivery-cycle-mcp`) | UC-01, UC-05, UC-06, UC-07 | Full lifecycle management — create, advance stages, clear gates, attach artifacts, Jira sync |
| Delivery Workstream Registry | UC-05 | Admin UI to create and manage Workstreams; gate enforcement integration |
| Delivery Cycle Dashboard | UC-01, UC-05 | Dashboard view — all cycles visible to current user per Division access; role-aware |
| Delivery Cycle Detail View | UC-01, UC-05, UC-06 | Full cycle record — Stage Track, milestone dates, artifact slots, gate records, event log |
| Gate Workflow | UC-05 | Brief Review, Go to Build, Go to Deploy, Close Review — approval record, target/actual date tracking |
| Cycle Artifact Tracking | UC-01, UC-06 | Artifact slots by stage, ad hoc attachment, MSO365 → OI Library pointer model |
| Build Report OI Library Submission Stub | UC-06 | UI and data model wired; submission to OI Library completes in Build B |
| Jira Sync | UC-07 | Read/write five governance fields on linked Jira epic via MCP |

Build C does **not** include: OI Library submission workflow (Build B), embedded chat (Build B), notification SLA timers (Build D).

---

## 2. Hard Dependencies on Build A

Before Build C can be tested, the following Build A outputs must be stable:

- `divisions` table — Delivery Cycles attach to a Division
- `users` table and Supabase Auth — JWT identity used in all MCP calls
- `division_memberships` table — Division-scoped access enforcement
- `artifacts` table — OI Library artifact pointer on `cycle_artifacts.oi_library_artifact_id`
- Division MCP (`division-mcp`) — Build C MCP calls `get_division` and `list_division_members` to validate Division context and resolve user access

If any of these are unstable, Build C schema migrations can be written and reviewed but should not be deployed to Supabase until Build A acceptance criteria pass.

---

## 3. Schema — New Tables

All tables follow the schema rules in CLAUDE.md: UUID PKs, `created_at`/`updated_at`, soft delete via `deleted_at`, `WHERE deleted_at IS NULL` on all selects, `ON DELETE RESTRICT` on all foreign keys unless noted, parameterized SQL only.

### 3.1 delivery_workstreams
Source: ARCH-23, Session 2026-03-24-L

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| workstream_id | uuid | PK, default gen_random_uuid() | Workstream identifier |
| workstream_name | text | NOT NULL | Display name — self-explanatory, no bare nouns |
| home_division_id | uuid | FK divisions.division_id, NOT NULL | Owning Division |
| workstream_lead_user_id | uuid | FK users.user_id, NOT NULL | Named lead — single person |
| active_status | boolean | NOT NULL, default true | Gate enforcement uses this — inactive blocks all gate clearance |
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
Source: D-108, D-124, D-125, ARCH-12, ARCH-15, ARCH-23, Session 2026-03-24, Session 2026-03-25-A

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| delivery_cycle_id | uuid | PK | |
| cycle_title | text | NOT NULL | Descriptive title — no bare nouns |
| cycle_description | text | nullable | Optional longer context |
| division_id | uuid | FK divisions.division_id, NOT NULL | Owning Division — pre-populated from Workstream home Division, overridable |
| workstream_id | uuid | FK delivery_workstreams.workstream_id, NOT NULL | Must be active at every gate clearance attempt |
| tier_classification | text | NOT NULL, CHECK IN ('tier_1','tier_2','tier_3') | Set at BRIEF stage — drives gate configuration |
| current_lifecycle_stage | text | NOT NULL, default 'BRIEF' | System-controlled. Valid values: BRIEF, DESIGN, SPEC, BUILD, VALIDATE, UAT, PILOT, RELEASE, OUTCOME, COMPLETE, CANCELLED, ON_HOLD |
| outcome_statement | text | nullable | Direct field — not an artifact. Amber warning in UI when null |
| outcome_set_by_user_id | uuid | FK users.user_id, nullable | |
| outcome_set_at | timestamptz | nullable | |
| cycle_owner_user_id | uuid | FK users.user_id, NOT NULL | Domain Strategist — cycle owner |
| jira_epic_key | text | nullable | e.g. PS-2025-042 — bidirectional sync via Jira MCP |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | nullable | |

### 3.4 cycle_milestone_dates
Source: Session 2026-03-24-E, Session 2026-03-24-A (date state model)

One row per gate per cycle. Five rows seeded on cycle creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| milestone_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| gate_name | text | NOT NULL, CHECK IN ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review') | |
| milestone_label | text | NOT NULL | Human-readable: Brief Review Complete, Build Start, Pilot Start, Release Start, Close Review Complete |
| target_date | date | nullable | Team-set commitment date |
| actual_date | date | nullable | System-recorded when gate clears |
| date_status | text | NOT NULL, default 'not_started', CHECK IN ('not_started','on_track','at_risk','behind','complete') | Five statuses — fixed colors in UI |
| status_override_reason | text | nullable | Required when reverting from complete |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

**Date field state model (Session 2026-03-24-A):**
- Commitment mode: `actual_date` is null → show `target_date`; overdue = today > target_date (Oravive); upcoming = ≤ 4 days (Sunray)
- Achieved mode: `actual_date` ≤ `target_date` → show actual, label "Actual", neutral color
- Missed mode: `actual_date` > `target_date` → show actual, label "Actual", muted overdue color
- Urgency indicators suppressed when cycle is COMPLETE or CANCELLED

### 3.5 gate_records
Source: D-49, D-154, ARCH-12, Session 2026-03-18-A

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| gate_record_id | uuid | PK | |
| delivery_cycle_id | uuid | FK delivery_cycles.delivery_cycle_id, NOT NULL | |
| gate_name | text | NOT NULL, CHECK IN ('brief_review','go_to_build','go_to_deploy','go_to_release','close_review') | |
| gate_status | text | NOT NULL, default 'pending', CHECK IN ('pending','approved','returned','blocked') | |
| approver_user_id | uuid | FK users.user_id, nullable | Configured per Division per tier per D-65 |
| approver_decision_at | timestamptz | nullable | |
| approver_notes | text | nullable | Required on return |
| workstream_active_at_clearance | boolean | nullable | Recorded at gate clearance attempt — audit trail |
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
| event_metadata | jsonb | nullable | Structured detail — prior stage, new stage, gate name, artifact id, etc. |
| created_at | timestamptz | NOT NULL, default now() | |

### 3.7 cycle_artifact_types
Source: ARCH-24, Session 2026-03-25-B, Session 2026-03-25-F

System-defined seed table. Populated via migration — not user-editable at launch.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| artifact_type_id | uuid | PK | |
| artifact_type_name | text | NOT NULL | |
| lifecycle_stage | text | NOT NULL | Stage this slot belongs to, or 'ANY' for ad hoc |
| guidance_text | text | NOT NULL | Shown in empty slot placeholder |
| sort_order | integer | NOT NULL | Display order within stage |
| gate_required | boolean | NOT NULL, default false | Dormant at launch — do not enforce |
| required_at_gate | text | nullable | Dormant at launch |

**Seed data (Session 2026-03-25-F) — commit as migration:**

| Stage | Artifact Type Name | Guidance |
|-------|--------------------|---------|
| BRIEF | Context Brief | Primary framing document for this cycle |
| BRIEF | Scenario Journeys | Context Package layer — scenario-based supporting context |
| BRIEF | True-life examples | Context Package layer — real examples supporting the brief |
| BRIEF | Stakeholder input record | Structured record of stakeholder input gathered |
| DESIGN | Design session output | Session output file from design work |
| DESIGN | UI/UX mockup | Screen designs or wireframes |
| DESIGN | Process flow diagram | Workflow or process map |
| SPEC | Technical Specification | Full tech spec — MCP scope, schema, acceptance criteria |
| SPEC | Cursor prompt | Initial AI-executable build prompt (BUILD phase working artifact per D-115) |
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
| external_url | text | nullable | MSO365 or other external link — preserved on OI Library promotion |
| oi_library_artifact_id | uuid | FK artifacts.artifact_id, nullable | OI Library pointer — populated on promotion |
| pointer_status | text | NOT NULL, default 'external_only', CHECK IN ('external_only','promoted','oi_only') | Promotion state per Session 2026-03-25-G |
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

---

## 4. Delivery Cycle MCP — `delivery-cycle-mcp`

Stateless Node.js on Render. JWT validation middleware fires on every request — 401 on failure, no exceptions. Tool naming: `verb_noun`. Response envelope: `{ success: boolean, data: any, error?: string }`.

### 4.1 Tool Set

| Tool | Description |
|------|-------------|
| `create_delivery_cycle` | Creates a new cycle record, seeds five milestone date rows, seeds gate_records for gates applicable to the tier, appends creation event to event log |
| `get_delivery_cycle` | Returns full cycle record including current stage, milestone dates, open gate record, Workstream details |
| `list_delivery_cycles` | Returns cycles visible to the authenticated user filtered by Division access. Supports filter by: division_id, lifecycle_stage, workstream_id, tier_classification |
| `advance_cycle_stage` | Advances current_lifecycle_stage to the next stage in the 12-stage sequence. Validates: gate cleared if a gate precedes this stage; workstream is active. Appends event log entry. |
| `set_outcome_statement` | Sets outcome_statement on the cycle record. Records outcome_set_by_user_id and outcome_set_at. Appends event log. |
| `submit_gate_for_approval` | Transitions gate_record status from pending to awaiting_approval. Validates workstream active_status — returns error if inactive. |
| `record_gate_decision` | Records approver approval or return on a gate_record. On approval: sets actual_date on corresponding milestone, updates date_status to complete, advances cycle stage. On return: requires approver_notes. Appends event log. |
| `set_milestone_target_date` | Sets target_date on a specific milestone. User-set — not system-controlled. |
| `update_milestone_status` | Updates date_status on a milestone. On reverting from complete: requires status_override_reason. |
| `attach_cycle_artifact` | Attaches an artifact to a cycle. Accepts: delivery_cycle_id, artifact_type_id (nullable for ad hoc), display_name, external_url or oi_library_artifact_id, pointer_status. Appends event log. |
| `promote_artifact_to_oi_library` | Updates cycle_artifact: sets oi_library_artifact_id, transitions pointer_status to promoted, preserves external_url. Stub in Build C — OI Library submission wired in Build B. |
| `get_cycle_event_log` | Returns append-only event log for a cycle, ordered by created_at ascending |
| `sync_jira_epic` | Reads/writes five governance fields on linked Jira epic via Jira REST API: Outcome Statement, Context Brief Link, Tier Classification, Capabilities Equation Mapping, Technical Specification status. Updates sync_status and last_synced_at. |
| `list_delivery_workstreams` | Returns all Workstreams visible to the user. Supports filter by: home_division_id, active_status |
| `create_delivery_workstream` | Admin only. Creates Workstream record. |
| `update_workstream_active_status` | Admin only. Toggles active_status. Appends event if deactivating an active Workstream that has open cycles — warning returned, not a block. |

### 4.2 Gate Enforcement Rules

On every `submit_gate_for_approval` and `advance_cycle_stage` call:
1. Check `delivery_workstreams.active_status` for the cycle's workstream — if false, return error: `{ success: false, error: "Gate blocked: assigned workstream is inactive. Contact your Division Admin." }`
2. Record `workstream_active_at_clearance` boolean on the gate_record at the moment of the clearance attempt — audit trail regardless of outcome
3. Gate approver is resolved from Division-level configuration (D-65) — Build C uses a simplified lookup: Phil's user_id as default approver for all gates. RACI-configured approver assignment is Build B.

---

## 5. Angular Components

All components are presentation-only. No business logic. No Supabase client imports. All data via `delivery-cycle-mcp` through Angular services.

### 5.1 DeliveryModule (lazy-loaded)

Route: `/delivery`

### 5.2 DeliveryCycleDashboardComponent

Route: `/delivery`

Displays all Delivery Cycles visible to the current user.

**Dashboard row — per cycle:**
- Cycle title
- Current lifecycle stage (D-Session 2026-03-24-D)
- Workstream name
- Division name
- Tier badge (T1 / T2 / T3)
- Intelligent headline text (Session 2026-03-24-C) — see logic in Section 4.1 of decisions
- Pilot Start Date column (Session 2026-03-24-B) — date state model applied
- Production Release Date column (Session 2026-03-24-B) — date state model applied
- Outcome Statement amber warning indicator when null

**Dashboard controls:**
- Filter by: Division, Workstream, lifecycle stage, tier
- Create new Delivery Cycle button (DS and Phil roles)

### 5.3 DeliveryCycleDetailComponent

Route: `/delivery/:cycle_id`

**Sections:**
- Cycle header: title, owner, Division, Workstream, tier, current stage
- Outcome Statement field: inline edit. Amber persistent warning when null — "Outcome statement not yet set. Add one to keep the team aligned."
- StageTrackComponent (ARCH-25) — Full display mode. Gate nodes interactive — click opens gate record panel. Stage nodes non-interactive.
- Milestone dates panel: five rows, target date editable, actual date system-set, date state model applied per gate
- Artifact slots panel: organized by current and past stages. Empty slots render as placeholders with guidance text. Attach button per slot. Ad hoc attachment option.
- Gate record panel (right panel, D-Session 2026-03-24-I): opens on gate node click. Shows gate status, approver, notes, workstream active state at last attempt.
- Event log: append-only, chronological, bottom of detail view
- Jira sync panel: epic key display, sync status, last synced timestamp, manual sync trigger

### 5.4 DeliveryWorkstreamAdminComponent

Route: `/admin/workstreams` (Admin role only)

- List all Workstreams with active/inactive status
- Create Workstream form
- Toggle active status — warning displayed if open cycles exist on the Workstream

### 5.5 StageTrackComponent (ARCH-25)

Standalone reusable component. Build C delivers Full mode and Condensed mode.

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

**Behavior:**
- Gate nodes interactive — emit `(gateClicked)` event with gate name
- Stage nodes non-interactive
- Condensed mode: used in dashboard row — compact horizontal track, no labels
- Full mode: used in detail view — full labels, interactive gates

---

## 6. Environment Variables

No new Supabase environment variables required for Build C. One new variable for Jira integration:

```
# Jira Integration (required for sync_jira_epic tool)
JIRA_BASE_URL=https://[your-org].atlassian.net
JIRA_API_TOKEN=PLACEHOLDER
JIRA_USER_EMAIL=PLACEHOLDER
```

If Jira credentials are not available at build start, the `sync_jira_epic` tool should return a graceful stub response: `{ success: false, error: "Jira integration not configured — set JIRA_BASE_URL, JIRA_API_TOKEN, and JIRA_USER_EMAIL." }`. All other Build C functionality is unblocked.

---

## 7. Blocked Action UX Standard (D-140)

Applied throughout Build C. Every blocked action communicates two things:
1. What is blocked and why
2. What would need to change for the action to be available

Examples:
- Gate blocked by inactive workstream: "Gate blocked: the [Workstream Name] workstream is inactive. A Division Admin must reactivate it before this gate can proceed."
- Outcome Statement null warning: "Outcome statement not yet set. Add one to keep the team aligned." (amber — not a block)
- Approver not configured: "No approver configured for this gate. Contact your Division Admin to set up gate approvers."

---

## 8. Build C Acceptance Criteria

Build C is complete when all of the following are demonstrable against real data:

1. **Workstream Admin** — Admin can create a Delivery Workstream, assign a lead, link to a Division, and toggle active/inactive status
2. **Cycle Creation** — DS or Phil can create a Delivery Cycle, select a Workstream, set tier, and see the cycle appear on the dashboard
3. **Dashboard Render** — Dashboard correctly renders intelligent headline, current stage, Pilot Start Date, and Production Release Date columns per the date state model (all three modes: commitment / achieved / missed)
4. **Stage Advancement** — Cycle advances through at least three stages correctly; gate records created at correct positions in the 12-stage sequence
5. **Gate Enforcement** — Gate clearance attempt on a cycle with an inactive Workstream returns the correct blocked message and records `workstream_active_at_clearance = false` in the gate record
6. **Milestone Dates** — Target date set by user; actual date recorded by system on gate clearance; date status displays correct color per state model
7. **Outcome Statement** — Amber warning visible when null; inline edit sets value and clears warning
8. **Stage Track Component** — Full mode renders all 12 stages with five gate nodes at correct positions; gate node click opens gate record panel; condensed mode renders correctly on dashboard row
9. **Artifact Slots** — All 26 seed slots visible in correct stage groupings; attach action works for external URL; ad hoc attachment works with user-provided display name
10. **Event Log** — Every stage advance, gate decision, artifact attachment, and outcome statement set appears in the event log in correct chronological order
11. **Jira Stub** — Jira sync panel visible on cycle detail; if unconfigured, returns graceful stub message; if configured, five governance fields sync bidirectionally
12. **Build Report Stub** — BUILD stage artifact slot for Delivery Cycle Build Report is present; attach action works; OI Library submission button is visible but returns stub message: "OI Library submission will be available in the next build."
13. **Unauthenticated Access** — Unauthenticated user cannot call any delivery-cycle-mcp tool (401 returned)
14. **Zero Direct DB Calls** — No Supabase client imports in any Angular component or service

---

## 9. Migration Checklist (Supabase SQL Editor)

Run in this order before Claude Code begins component work:

1. `delivery_workstreams` table
2. `workstream_members` table
3. `delivery_cycles` table
4. `cycle_milestone_dates` table
5. `gate_records` table
6. `cycle_event_log` table
7. `cycle_artifact_types` table + seed data (26 rows from Section 3.7)
8. `cycle_artifacts` table
9. `jira_links` table

Claude Code will produce all migration SQL. You run each one in the Supabase SQL Editor and confirm before Claude Code proceeds to the component build.

---

## 10. Key Decision References

| Decision | What It Locks |
|----------|--------------|
| D-67 | Jira link model — bidirectional, one cycle to multiple epics |
| D-83 | Delivery Cycle as primary unit of work |
| D-108 | 12-stage lifecycle with 5 gates |
| D-113 | Cycle artifacts live on cycle until Build Report canonization |
| D-114 | Pilot Plan required in DESIGN if PILOT is active |
| D-115 | Cursor Prompt as BUILD phase working artifact |
| D-117 | Jira MCP integration — OI Trust as system of record |
| D-124 | Tier set at BRIEF stage |
| D-125 | Append-only event log on every cycle |
| D-126 | Brief Review gate exits BRIEF |
| D-140 | Blocked action UX standard |
| D-154 | Five named gates |
| ARCH-12 | Gate positions in 12-stage lifecycle |
| ARCH-15 | Stage requires: status, target dates, actual dates, gate results, artifact refs |
| ARCH-16 | Jira MCP read/write contract — five governance fields |
| ARCH-23 | Delivery Workstream schema and gate enforcement |
| ARCH-24 | Cycle artifact tracking tables |
| ARCH-25 | StageTrackComponent contract |
| Session 2026-03-24-A | Date field state model |
| Session 2026-03-24-B | Dashboard milestone date columns |
| Session 2026-03-24-C | Intelligent headline logic |
| Session 2026-03-24-E | Five milestone dates as planning layer |
| Session 2026-03-24-G | Go to Release as fifth gate |
| Session 2026-03-24-L | Delivery Workstream registry fields |
| Session 2026-03-24-Q | Inactive workstream gate enforcement |
| Session 2026-03-25-A | Outcome Statement as direct cycle field |
| Session 2026-03-25-B | Cycle artifact model — two tables |
| Session 2026-03-25-C | No enforcement on artifact slots at launch |
| Session 2026-03-25-F | Full artifact slot seed set |
| Session 2026-03-25-G | MSO365 → OI Library pointer transition model |
