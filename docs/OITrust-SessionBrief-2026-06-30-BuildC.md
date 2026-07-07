<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

# OITrust Session Brief — 2026-06-30 — Build C
**Governing decisions extract for Code session**  
Read after START-HERE.md. Read before any spec files.

---

## Active Build Context

Build C — Delivery Cycle tracker. Active contracts: Contract 32 (Initiative Status Updates, D-476–D-486) plus new decisions D-487–D-492 from Design session 2026-06-30.

---

## New Decisions This Session (D-487–D-492)

Read these in full in decisions-active.md before building.

**D-487 — Roadmap Theme: Division-Scoped Vocabulary and Tagging.**
New table `roadmap_themes` (id, division_id FK, name, sort_order, active, created_at/updated_at/created_by). Unique constraint (division_id, name) where active. `delivery_cycles` gains `roadmap_theme_id` (uuid FK roadmap_themes, nullable). Admin: new "Roadmap Themes" tab on Division admin screen — Division Leader (own Division) and Admin (any Division) can add/edit/reorder/deactivate. No hard delete if referenced — deactivate only (same as D-437). Tagging: "Roadmap Theme" field on Initiative Edit panel, single-select scoped to Initiative's Division's active Themes, optional. New MCP: `list_roadmap_themes(division_id)`, `create_roadmap_theme`, `update_roadmap_theme`, `deactivate_roadmap_theme`. `create_delivery_cycle`/`update_delivery_cycle` accept `roadmap_theme_id`; `get_delivery_cycle` returns `roadmap_theme_name`. Connects to: D-471, D-480, D-437, D-399, D-396, D-312

**D-488 — Roadmap Theme: Display and Filtering.**
Standard Initiative grid name cell (all screens sharing the component) prepends Theme name when set: `[Theme Name] · [Initiative Name]` (middle-dot separator, matching existing inline-count convention). No Theme set: name renders unprefixed, no dangling separator. No new grid column. EPO Deploy by Quarter (D-399) additionally sub-groups Initiatives by Theme within each section group — "Unthemed" sub-group last. Theme filter (multi-select) added to filter panels on EPO Deploy by Quarter and All Initiatives; filter state persists per D-171. Grid queries amended to return `roadmap_theme_id`/`roadmap_theme_name`. Connects to: D-487, D-399, D-396, D-171, D-419

**D-489 — Gate Submission Justification Note.**
`gate_records` gains `submission_note` (text, nullable). Gate sub-panel Submit action gains free-text field "Why is this gate ready?" — encouraged, not required. Visible to Accountable approver (above Consulted Summary, D-461) and all Consulted parties. Not editable after submission. `submit_gate_for_approval` gains optional `submission_note` param. Action Queue: `submission_note` shown truncated (one line, ellipsis) below item label for Accountable and Consulted item types. `list_pending_approvals` return shape gains `submission_note` per item. Tapping item or truncated note opens gate sub-panel as today. Connects to: D-345, D-355, D-461, D-462, D-468, D-463

**D-490 — Team Meetings Feature.**
Full spec in `team-meetings-spec.md`. Phil-only (Admin JWT gate). New left-nav item "Team Meetings." Four new tables: `team_meetings`, `team_meeting_sections`, `team_meeting_bullets`, `team_meeting_notes`. Seven MCP tools. Two-column meeting prep/run screen with DCS Initiative Reference Panel. Carry-forward via FK (`carried_from_bullet_id`) — never text copy. Read in spec before touching any component.

**D-491 — Amendment to D-484: My Initiative Status Nav Placement.**
My Initiative Status is NOT a standalone nav item. My Actions becomes a three-tab screen: (1) Approvals (existing Action Queue content), (2) Updates Due (D-484 tab), (3) Needs Acknowledgment (D-484 tab). Top-level My Actions badge sums all three tab counts. Standalone "My Initiative Status" nav item removed. D-484 tab content and data model unchanged. Connects to: D-484, D-483, D-482, D-346

**D-492 — Amendment to D-485: Initiative Status Dashboard Nav Placement.**
Initiative Status Dashboard is NOT a standalone nav item. It is a card on the Initiative Tracking landing page, near the top of the card list, following existing card pattern (title, one-line description, async headline metric, "Open view →"). Standalone nav item removed. D-485 screen content and all behavior unchanged. Connects to: D-485, D-478, D-171, D-396

---

## Governing Decisions — Contract 32 (Initiative Status Updates)

These were locked 2026-06-23. Read before building any Contract 32 surface.

**D-476 — Initiative Status Update Data Model.** Four new tables: `initiative_status_updates`, `initiative_status_acknowledgments`, `division_status_config`, `gate_date_history` (conditional — query Supabase first). Additions to `delivery_cycles`: `latest_status_update_id`, `status_due_at`, `status_overdue`, `status_last_calculated_at`. `system_config` gains `status_refresh_last_run` entry. Follow existing system_config patterns exactly.

**D-477 — Confidence Fields Are Gate Status.** Confidence fields use existing `date_status` values exactly — same five values, same component (D-205), same colors. Reuse existing component directly — no redefinition. Saving writes through to `cycle_milestone_dates.date_status` and appends `cycle_event_log` entry with `source = 'status_update'`.

**D-478 — Status Update Entry and Panel Design.** Right-panel only (S-005/S-017). Three entry points: initiative detail view, My Initiative Status screen, Initiative Status Dashboard. Read-only mode includes "View Initiative" link to existing detail panel — no new surface (S-007).

**D-479 — Confidence Field Applicability Logic.** Pilot Start Date confidence shown when `go_to_deploy` not yet reached. Close Review Gate confidence shown when reached. Both hidden when both complete. Applicability snapshots stored per history record.

**D-480 — Division Cadence Configuration Model.** Weekly / triweekly / monthly. Outlook-style recurrence picker. Admin → Divisions → Initiative Update Cycle tab (new tab on existing screen).

**D-481 — Cadence Inheritance.** Walk division parent chain. First `division_status_config` row found wins. No config anywhere in chain = exempt from overdue flagging (not flagged, not counted).

**D-482 — Overdue Detection and Scheduled Function.** pg_cron every 30 minutes. MCP `trigger_status_refresh` for on-demand. Updates `system_config.status_refresh_last_run` after each run.

**D-483 — Acknowledgment Model.** Non-save trio members acknowledge via single button. Only latest update requires acknowledgment. Unacknowledged updates older than 5 days filter out of Needs Acknowledgment tab.

**D-486 — Gate Date Slip Detection.** `new_date > old_date` AND `changed_at >= now() − cadence_interval` in `gate_date_history`. Query Supabase for existing tracking before creating table.

---

## Key Standing Decisions — Always Apply

**D-171** — Filter state persists per screen key. Every filter panel must persist state.

**D-308** — List → View navigation. Tapping a row opens read-only right panel. Never open a modal for row navigation.

**D-345** — Gate sub-panel state machine. Full end-to-end gate interaction model. Read before touching any gate surface.

**D-389** — DCS role: `system_role = 'dcs'`, `assigned_dcs_user_id` on `delivery_cycles`.

**D-415 / S-034** — Compact person row layout. Avatar 32px, name + role pill on same horizontal line. Applies system-wide to all person rows.

**D-419** — Status dot rule. Gate status color logic. Reuse existing component — do not re-implement.

**D-437** — Deactivate-only for referenced admin vocabulary items. No hard delete if rows reference the type.

---

## Phil Executes All SQL

Produce all migration SQL as files. Never execute directly against Supabase.

---

*Session Brief · Build C · 2026-06-30 · Pathways OI Trust*
