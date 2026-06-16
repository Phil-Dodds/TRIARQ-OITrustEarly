# OITrust Contract 24 Specification
*Pathways OI Trust · Contract 24 · 2026-06-15 · CONFIDENTIAL*

Read CLAUDE.md, decisions-active.md, and build-c-spec.md before writing any code.
Read this file completely before beginning any workstream.
Complete workstreams in the order listed. Confirm each workstream before proceeding to the next.

---

## Contract 24 Scope

Eight new-feature workstreams + AC obligation workstream + one standing rule addition.

| # | Workstream | Decisions | Type |
|---|---|---|---|
| 1 | Backfill: S-035 violations (if not yet complete) | S-035 | Code carries forward if not done |
| 2 | Grid Column Sort Standard | D-432 / S-036 | New standard — system-wide + User Management |
| 3 | Division Picker Hierarchy Grouping | D-433 | System-wide — audit + fix all Division pickers |
| 4 | Gate Column Rename + Next Gate Sort | D-434, D-435 | Initiatives grid |
| 5 | Division Assignment Picker Scoping | D-436 | New Initiative + Edit Initiative + any assignment picker |
| 6 | My Completed Gates Home Card | D-430 | Home screen + new MCP tool |
| 7 | Recently Approved Gates Hub Card + View | D-431 | Initiative Tracking hub + new route + new MCP tool |
| 8 | Artifact Type Admin UI + Gate Warnings + Seed Revision | D-437 | Admin hub + artifact type management + seed migration |
| 9 | AC Obligation Pass | Rule 34 | Build obligations AC-18, AC-21 (pending), AC-23, AC-29, AC-11 |

---

## Workstream 1 — S-035 Backfill

**Only execute if Code has not yet completed the S-035 backfill flagged in the current session.**

S-035 requires an About Entry block in every CodeClose output and a `ChangelogEntry` prepended to `src/app/core/data/changelog.ts` for every contract touching user-facing surfaces. Two violations were identified:
1. Current session commits (6c08284, f05e8dc, f078b46) — no About Entry, no changelog.ts entry.
2. Contract 23 Part 1 CodeClose (2026-06-12) — no About Entry for items 1–3 (all user-facing).

**If D-426 (About Panel) is now built:** produce consolidated About Entry blocks covering Contract 23 Part 1 and current session surfaces. Prepend all backfilled ChangelogEntry objects to `src/app/core/data/changelog.ts` in the deploy commit for this contract. One ChangelogEntry per contract label.

**If D-426 is still in progress:** complete D-426 first (it is in-progress per Code's report), then do the backfill in this contract's deploy commit.

---

## Workstream 2 — Grid Column Sort Standard (D-432 / S-036)

**Governing principles:** Principle 17 (Primary Workflow Clarity — D-198)
**Governing decisions:** D-432: column header is the exclusive sort control; S-036: full interaction mechanic; D-171: sort state persists per user per screen; S-010: no sort controls in filter panel

### Standard
S-036 is now the system-wide grid column sort interaction standard:
1. Column header is the exclusive sort control — no sort in filter panel.
2. Sortable column headers: faint ↕ icon on hover only (not permanently visible).
3. Click sortable header → ascending (A→Z, oldest→newest); active indicator: ↑ beside label, label bold.
4. Click same header again → descending; indicator: ↓.
5. Click different sortable header → ascending on new column, prior indicator clears.
6. Non-sortable columns: no hover icon, cursor default, no click behavior.
7. Sort state persists per D-171.

### User Management Grid — Amendment
Amends D-410 / D-422. Sortable columns on `/admin/users` grid:
- **Display Name** — alphabetical on `display_name` (A→Z ascending)
- **Last Login** — `last_login_at` (descending = most recent first)
- **Created** — `users.created_at`
- **Invite Status** — alphabetical on status value

Default sort: **Last Login descending.** Screen key `admin.users` (already exists per D-380).

### Audit Pass
Audit all existing sortable grids in the system and confirm S-036 compliance. Document non-conformant surfaces in CodeClose Candidates with proposed contract.

---

## Workstream 3 — Division Picker Hierarchy Grouping (D-433)

**Governing principles:** Principle 12 (Entity Picker Pattern — D-182)
**Governing decisions:** D-433: Trust grouping required on all flat Division pickers; D-413: three-level hierarchy (Trust/Service Line/Functional Team); D-417: hierarchical tree already complies — this workstream governs flat pickers only

### Rule
Every Division selection control system-wide must group Divisions by their parent Trust:
- Trust name: non-selectable group label — bold, stone color
- Service Line and Functional Team Divisions: 16px indent under Trust group
- Sort within group: alphabetical by `display_name`
- `parent_division_id` and `division_level` already present — no schema change

### Applies to
- Native `<select>` dropdowns — use `<optgroup>` labels
- EntityPicker Division rows — use visually distinct section headers
- Filter panel Division pickers
- Any other flat Division selection control

### Does NOT apply to
- D-417 hierarchical tree multi-select (already correct)
- Filter panels with existing My Divisions radio options (governed by their own decisions)

### Implementation
1. Audit every Division picker in the codebase.
2. Apply grouping to all flat Division selection controls.
3. For any picker where grouped data cannot be accepted without a component rewrite: flag as CC-decision in CodeClose — do not silently skip.

Primary violation to fix: Edit Initiative panel Division `<select>` dropdown.

---

## Workstream 4 — Gate Column Rename + Next Gate Sort (D-434, D-435)

**Governing principles:** Principle 17 (Primary Workflow Clarity — D-198)
**Governing decisions:** D-434: column renamed "Gate" — content unchanged; D-435: Next Gate sort definition, sort_order 1–5, sub-sort by target_date, descending-first default; D-267: Gate column content (condensed Stage Track + stage name); S-036: sort interaction mechanic; D-171: sort state persists

### Gate Column Rename (D-434)
On the All Initiatives grid (`/initiatives/list`): rename column header "STAGE" → "GATE".
Column content unchanged: condensed Stage Track component (5 gate nodes per S-002) + current stage name text below nodes.

### Next Gate Sort (D-435)
The Gate column is now sortable per S-036.

**Next Gate definition:** First `gate_record` in sequence order where `gate_status != 'approved'`.
Gate sequence: Brief Review (1) → Go to Build (2) → Go to Deploy (3) → Go to Release (4) → Close Review (5).
- All gates pending (new Initiative) → Next Gate = Brief Review (sort_order 1)
- All gates approved → sort_order = null (sorts last, both directions)

**Computed fields — add to `list_delivery_cycles` response:**
- `next_gate_sort_order`: integer 1–5, null if all approved
- `next_gate_target_date`: `target_date` from milestone record matching the next gate — null if not set

Implementation choice: server-side computed columns in `list_delivery_cycles` MCP tool OR client-side derivation if all gate records already travel in the list payload. **Flag your chosen approach as a CC-decision in CodeClose.**

**Sort behavior:**
- Click Gate column header → descending (Close Review first, sort order 5→4→3→2→1), null last
- Click again → ascending (Brief Review first, 1→2→3→4→5), null last
- Sub-sort within gate group: `next_gate_target_date` ascending; null target dates last within group
- Default on first click: **descending** (furthest-along first)
- Sort state persists D-171, screen key `initiatives.list`

No new label added to Gate column cell — Headline already shows next gate name.

---

## Workstream 5 — Division Assignment Picker Scoping (D-436)

**Governing principles:** Principle 12 (Entity Picker Pattern — D-182)
**Governing decisions:** D-436: My Divisions short list for non-Admin, Recently Used for Admin, "Show all" progressive disclosure; D-433: grouping within expanded list; D-135: My Divisions includes descendants; D-380: user_screen_state for picker history; D-171 exception: expansion state does not persist

Applies to: New Initiative form Division field, Edit Initiative panel Division field, and any single-select or multi-select Division picker used for *assignment*. Does NOT apply to filter panels with existing My Divisions options.

### Non-Admin Users
Picker opens showing only assigned Divisions + descendants (same resolution as "My Divisions" per D-135/D-395), grouped by Trust per D-433.
- If user has only one Trust represented: omit Trust group header
- "Show all divisions" link at bottom → expands list in place to full Division set grouped per D-433 → link becomes "Show fewer"
- Expansion state: does not persist (D-171 exception) — resets to short list on next picker open
- Zero assignments: show full list + stone note above: "No divisions assigned to your account."

### Admin Users
Picker opens showing:
1. **Recently Used** section at top: last 5 Divisions selected by this user across any assignment picker, most recent first. Section label: "Recently Used." Absent on first use (no history).
2. Full grouped Division list below per D-433.
No short-list truncation for Admins — full list always visible after Recently Used.

### Picker History
On every Division assignment picker commit (user selects and saves):
- Prepend selected `division_id` to `picker.division.recent` jsonb array in `user_screen_state`
- Deduplicate: if `division_id` already present, move to front
- Cap at 5 entries
- Single upsert via `upsert_user_screen_state` MCP tool (D-380)

---

## Workstream 6 — My Completed Gates Home Card (D-430)

**Governing principles:** Principle 1 (Home Screen Clarity)
**Governing decisions:** D-430: card definition, MCP tool, row format, footer link; D-425: home card order (appended after My Activity); D-346: async load; D-180: right panel on Initiative tap; D-345: gate_records source of truth

### New MCP Tool: `list_my_completed_gates(limit, days_back)`
Query: `gate_records` joined to `delivery_cycles` where:
- `gate_records.gate_status = 'approved'`
- `gate_records.approver_decision_at >= now() - interval '[days_back] days'`
- `delivery_cycles.assigned_dcs_user_id = current_user` OR `assigned_epo_user_id = current_user` OR `assigned_dol_user_id = current_user`
- `current_user` from JWT

Returns: gate_name, initiative_name, division_short_name, approver_decision_at, delivery_cycle_id. Sorted by `approver_decision_at` descending. Limited to `limit` rows (default 5). Also return total count for footer "View all [N]."

### Home Screen Card
- Title: "My Completed Gates"
- Position: appended per D-425 (after My Activity card)
- Load: async per D-346
- Rows (max 5): Gate name (display map below) · Initiative name (tappable → right panel per D-180) · Division short name (stone) · `approver_decision_at` as relative date
- Gate display map: `brief_review` → Brief Review / `go_to_build` → Go to Build / `go_to_deploy` → Go to Deploy / `go_to_release` → Go to Release / `close_review` → Close Review
- Footer: "View all [N] →" → `/initiatives/gates-approved` with Person filter pre-set to current user
- Empty state: "No gates approved on your initiatives in the last 4 weeks."
- Roles: all authenticated users

---

## Workstream 7 — Recently Approved Gates Hub Card + View (D-431)

**Governing principles:** Principle 17 (Primary Workflow Clarity — D-198)
**Governing decisions:** D-431: hub card 9 definition, view spec, no + New button exception; D-396: hub card count (eight → nine); D-180: right panel on Initiative tap; D-346: load behavior; D-171: filter/sort state persistence; S-036: sort interaction; S-010–S-013: filter panel standards

### Hub Card 9
On `/initiatives` landing page — card 9 (amends D-396, eight cards → nine cards).
- Display name: "Recently Approved Gates"
- Description: "Gates approved in the last 4 weeks, across all initiatives in your divisions."
- Async headline: "N gates approved in the last 28 days" — zero state: "No gates approved in the last 28 days."
- Route: `/initiatives/gates-approved`

### New MCP Tool: `list_approved_gates(division_ids, gate_names?, approver_user_id?, days_back?)`
Query: `gate_records` joined to `delivery_cycles` and `users` (for approver display name) where:
- `gate_status = 'approved'`
- `approver_decision_at >= now() - interval '[days_back] days'`
- Division-scoped per `division_ids` (same scope as All Initiatives — Division access from JWT)
- Optional filters: `gate_names` (array), `approver_user_id`

Returns: gate_name, initiative_name, division_short_name, approver_display_name, approver_decision_at, delivery_cycle_id. Sorted by `approver_decision_at` descending.

### View: `/initiatives/gates-approved`
- Columns: Gate name · Initiative name (tappable → DeliveryCycleDetailComponent right panel per D-180) · Division short name · Approved by (stone) · Approved date (MMM D, YYYY)
- Sort: `approver_decision_at` descending default; all columns sortable per S-036; persists D-171 screen key `initiatives.gates-approved`
- Filter panel (slide-in): Division (My Divisions default), Gate name (multi-select, all 5, default all), Approved by (person picker); persists D-171 key `initiatives.gates-approved`
- No date range filter — fixed 28-day window
- No + New Initiative button — read-only analytical surface (explicit exception to hub "+ New" pattern)
- Load: full before interactive per D-346
- Pagination: 50 rows, "Load more" — no infinite scroll
- Read-only throughout
- Access: all authenticated users, Division-scoped

---

## Workstream 8 — Artifact Type Admin UI + Gate Warnings + Seed Revision (D-437)

**Governing principles:** Principle 17 (Primary Workflow Clarity — D-198)
**Governing decisions:** D-437: full artifact type management spec; S-005: standard grid+right panel pattern; S-016: create form pattern; S-018: view panel; S-019: edit panel; D-200: warning pattern (Pattern 2 = amber non-blocking); D-171: filter/sort persistence; D-174: gate submission pre-checks (suggestion warnings append after, do not replace); D-312: gate pre-check sequence

### Part A — Schema Migration
Add `'all'` to `cycle_artifact_types.required_at_gate` CHECK constraint. The current CHECK constraint only includes the five gate name values — 'all' must be added before seed data is inserted.

Migration steps:
1. Alter `cycle_artifact_types.required_at_gate` to allow `'all'` as a valid value.
2. Run seed revision (Part C below) as a migration.

### Part B — Admin UI: `/admin/artifact-types`

**Admin hub amendment:** Add "Artifact Types" as a new card to the Admin hub (`/admin`). Card description: "Manage suggested artifact types by stage and gate."

**Screen:** Standard grid + right panel per S-005, S-018, S-019. Admin and Phil only.

Grid columns: Artifact Type Name · Stage · Suggested Before Gate · Active Status (pill).
Filter panel: Stage (multi-select, all stage values + ALL), Gate (multi-select, all 5 gates + ALL + None), Active Status (Active default). D-171 screen key `admin.artifact-types`.

Right panel View state: Name, Stage, Suggested Before Gate, Guidance Text, Sort Order, Active Status — all read-only.
Edit state (S-019): all fields editable except Active Status if blocked (see below).
- Name: required text
- Stage: required select from lifecycle stage enum
- Suggested Before Gate: optional select — gate enum values + "All Gates" + "None"
- Guidance Text: required text
- Sort Order: integer
- Active Status toggle: if any `cycle_artifacts` rows reference this artifact_type_id — show block message: "N initiatives have this artifact attached. Remove references before deactivating." Disable toggle.

+ Add Artifact Type: opens create form per S-016 pattern.

**MCP tools:**
- `list_artifact_types()` — returns all rows including inactive; Admin JWT
- `create_artifact_type(artifact_type_name, lifecycle_stage, guidance_text, sort_order, required_at_gate?)` — Admin JWT
- `update_artifact_type(artifact_type_id, artifact_type_name?, lifecycle_stage?, guidance_text?, sort_order?, required_at_gate?, active?)` — Admin JWT; block deactivation if cycle_artifacts references exist

No delete operation — deactivation only.

### Part C — Gate Suggestion Warnings

**submit_gate_for_approval amendment:**
After all existing pre-checks pass, add:
1. Query active artifact types where `required_at_gate = [gate being submitted]` OR `required_at_gate = 'all'`
2. For each matching artifact type, check if any `cycle_artifacts` row exists for this Initiative with matching `artifact_type_id`
3. Collect artifact type names with zero attached artifacts → `suggestion_warnings` array
4. Include `suggestion_warnings` in response — does NOT change success/error status; does NOT block submission
5. Angular gate submission modal: if `suggestion_warnings` non-empty, render D-200 Pattern 2 warning above confirm button: "The following artifacts are typically attached before [Gate Name]: [comma-separated list]. You can still submit — this is a reminder, not a requirement." Confirm button still proceeds.

**record_gate_decision amendment (approver side):**
Same check as above. If artifact gaps exist when approver opens gate record modal for approval:
- Render D-200 Pattern 2 warning above Approve/Return buttons: "Typically expected before [Gate Name]: [list of missing artifact types]. Approving anyway is permitted."
- Approver is not blocked — Approve and Return buttons remain active.

### Part D — Seed Data Revision

Replace current 26-slot seed migration with the following. Preserve existing attached artifacts (`cycle_artifacts` rows) — do not delete them. For artifact types that still exist by name, update in place. Add new types. Deactivate removed types only if no `cycle_artifacts` references exist.

| Stage | Artifact Type Name | required_at_gate | Guidance Text |
|---|---|---|---|
| BRIEF | One-Pager | brief_review | Simple explanation of the proposed initiative — basis for Stakeholder Interview Questionnaire |
| BRIEF | Stakeholder Interview Questionnaire | brief_review | Completed before Context Brief is written |
| BRIEF | Context Brief | brief_review | Primary framing document — QUESTION and Outcome Statement required |
| BRIEF | Scenario Journeys | brief_review | Scenario-based supporting context including gotcha/edge cases |
| BRIEF | True-life examples | brief_review | Real examples supporting the brief |
| DESIGN | Design session output | go_to_build | Session output file from design work |
| DESIGN | UI/UX mockup | go_to_build | Screen designs or wireframes (Figma or equivalent — decision documented) |
| DESIGN | Process flow diagram | go_to_build | Workflow or process map |
| DESIGN | User Stories | go_to_build | Problem Statement, Solution Statement, Acceptance Criteria |
| DESIGN | Jira Epic | go_to_build | Jira epic with all documents attached |
| SPEC | Technical Specification | go_to_build | Full tech spec — MCP scope, schema, acceptance criteria |
| SPEC | Cursor prompt | go_to_build | Initial AI-executable build prompt |
| SPEC | Architecture Decision Record | go_to_build | ADR if applicable |
| SPEC | Agent Registry entry | go_to_build | Required for Tier 3 agent deployments |
| SPEC | AI Governance Spec | go_to_build | AI projects only: model approach, data inputs, governance hooks |
| BUILD | Governing document bootstrap log | go_to_deploy | CLAUDE.md session context confirmation |
| BUILD | Mend scan results | go_to_deploy | SCA scan — no critical/high CVEs |
| BUILD | Code review sign-off | go_to_deploy | CB code review gate record |
| BUILD | As-built Document | go_to_deploy | Retelling of what was actually created after build iterations — passed to UAT, training, OI Trust log |
| VALIDATE | QA test results | go_to_deploy | Functional test pass record |
| VALIDATE | OWASP ZAP scan | go_to_deploy | DAST results |
| VALIDATE | Wiz posture report | go_to_deploy | CSPM baseline |
| UAT | UAT sign-off record | go_to_deploy | Stakeholder acceptance |
| UAT | Release Notes / Build Completion Summary | go_to_deploy | Summary of what was built and what changed |
| UAT | 7-step governance checklist | go_to_deploy | Required for Tier 3 |
| UAT | HITRUST/GRICS checklist | go_to_deploy | Required for Tier 3 |
| UAT | AI Governance Board approval | go_to_deploy | AI projects only: confirmed before gate opens — Tier 3 hard stop |
| PILOT | Pilot Plan | go_to_release | User roles, pilot clients, observation period, feedback mechanism, success criteria |
| PILOT | Pilot observations log | go_to_release | Running log during pilot period |
| PILOT | Pilot Results Summary | go_to_release | 1 page max |
| PILOT | Outstanding Issues Log | go_to_release | All P1/P2 resolved or with approved resolution plan |
| RELEASE | Production Rollout Plan | close_review | Timeline, comms, training |
| RELEASE | Rollback Plan | close_review | Documented and tested |
| RELEASE | Wiz continuous monitoring baseline | close_review | Production posture baseline |
| OUTCOME | Outcome measurement record | close_review | Demonstrated outcome against acceptance criteria |
| OUTCOME | Outcomes Dashboard / KPI Summary | close_review | 1 page max |
| OUTCOME | Lessons Learned Summary | close_review | Submitted to OI Library |
| ANY | Compliance & Risk Assessment | all | Required before every gate — attach latest version |
| ANY | Reference document | NULL | Ad hoc — user provides display name |

Sort order within each stage: assign sequentially starting from 10 (increments of 10) to allow insertion.

Note: Display model for `required_at_gate = 'all'` artifacts in the detail panel is deferred to Contract 25. For now: these artifact types appear in their normal `lifecycle_stage = 'ANY'` position. Gate suggestion warnings fire correctly from the `required_at_gate = 'all'` value — that behavior is active this contract.

---

## Workstream 9 — AC Obligation Pass

Run the Rule 34 rolling AC conformance check. For each item:

| AC | Description | Expected status | Action |
|---|---|---|---|
| AC-18 | WIP warning surfaced to UI on gate approval | MCP returns `wip_warning` payload — wire render in gate-record-modal per spec line 659. D-200 Pattern 2 warning before confirm. | Complete the render. |
| AC-21 | ClamAV scan on file upload | PENDING — security team decision on scanner choice not yet received. | Do not implement scanner. Add inline stub: scan UI shows "File accepted — malware scan pending configuration." Document as NOT BUILT in CodeClose with note: awaiting security team decision. |
| AC-23 | Jira sync panel three-state | Per spec line 553: Jira epic key + amber warning "Jira sync unavailable — API not yet configured" when link present; "Not linked" when absent. | Complete to spec. |
| AC-29 | Maintenance mode screen | **BUILD C CLOSE BLOCKER.** MaintenanceScreenComponent not built. Spec at lines 395–397. AppComponent reads `system_config.maintenance_mode` via direct Supabase query at bootstrap; if true: render MaintenanceScreenComponent, suppress routing, no auth. MaintenanceScreenComponent: standalone, no auth dependency, displays message + optional maintenance_message. | Build completely. Verify: toggle maintenance_mode true → screen appears; toggle false → normal routing resumes. |
| AC-11 | Filter panel S-010–S-013 compliance | Audit all filterable grids. For each non-conformant surface: document as CC-decision in CodeClose with surface name and gap description. This contract: fix Activity view gap flagged in CC-23.2-08 if surface is accessible. Other surfaces: document for future contracts. | Audit + fix Activity view + document remainder. |

---

## Standing Rule Addition — Rule 34

Rule 34 is now operative. Every CodeClose for this contract and all subsequent contracts must include a rolling Build C §12 AC conformance table: AC item / BUILT / PARTIAL / NOT BUILT / Evidence. Any PARTIAL or NOT BUILT → Candidates section with proposed contract assignment.

---

## Acceptance Criteria

1. D-430: My Completed Gates card renders on home screen with correct data, relative dates, tappable Initiative names, footer link to /initiatives/gates-approved with Person filter pre-set.
2. D-431: Recently Approved Gates appears as hub card 9; route /initiatives/gates-approved renders correctly; filter panel functional; Division-scoped; all columns sortable per S-036.
3. D-432/S-036: All sortable grids show ↕ on header hover and ↑/↓ when sort active; no sort controls in filter panels; User Management default sort is Last Login descending.
4. D-433: All flat Division selection controls group Divisions under Trust headers; Edit Initiative Division dropdown groups correctly; Code audit documented in CodeClose.
5. D-434: Initiatives grid column header reads "GATE" not "STAGE."
6. D-435: Gate column sortable; ascending/descending correct; default click descending (Close Review first); sub-sort by target_date within gate group; null target_dates last; all-approved Initiatives sort last; sort persists across navigation.
7. D-436: New Initiative and Edit Initiative Division pickers show My Divisions short list for non-Admin users; "Show all" link expands correctly; Admin users see Recently Used section; picker history writes to user_screen_state on commit.
8. D-437: /admin/artifact-types renders with grid + right panel; create/edit/deactivation functional; gate suggestion warning fires on submission and approval with correct missing artifact list; seed migration runs without errors; Compliance & Risk Assessment appears with required_at_gate = 'all'.
9. AC-29: MaintenanceScreenComponent built and verified — maintenance mode on/off confirmed functional.
10. AC-18: WIP warning renders in gate-record-modal when wip_warning payload present.
11. AC-23: Jira sync panel renders stub correctly for unconfigured state.
12. Rule 34: CodeClose includes rolling AC conformance table.
13. S-035: About Entry block present in CodeClose; changelog.ts updated in deploy commit.

---

## CodeClose Requirements

- Rolling AC conformance table per Rule 34 (system-wide §12 check)
- About Entry block per S-035 (all user-facing surfaces this contract)
- changelog.ts prepend in deploy commit
- CC-decision list: non-conformant Division pickers requiring component work; next_gate computed field implementation choice (server vs client); any S-036 non-conformant grids found in audit
- UAT checklist covering all 13 acceptance criteria above

*Pathways OI Trust · Contract 24 · 2026-06-15 · CONFIDENTIAL*
