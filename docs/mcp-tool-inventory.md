# MCP Tool Inventory — Pathways OI Trust
docs/mcp-tool-inventory.md | v1.0 | July 2026 | CONFIDENTIAL

Created at Contract G1 (AC #9). This document is the catalog of MCP tools that
form the public data API of the OI Trust platform (D-575 intent: every
governance table is readable through clean, documented MCP tools — the
Executive View is composed from these, not from internal plumbing).

Sections: (1) Contract G1 governance tools — fully documented; (2) inventory of
pre-G1 tools by service — names only; behavior documented in their contract
specs and the `GET /tools` discovery endpoint on each service.

All tools: `POST /tools/{tool_name}` with Supabase JWT (`Authorization: Bearer`).
Response envelope: `{ success: boolean, data?: any, error?: string }`.

---

## 1. Contract G1 — Governance redesign foundation tools (delivery-cycle-mcp)

### 1.1 Sizing (Primitive 1 — `initiative_sizing`, migration 080)

**`get_initiative_sizing`** — read the sizing row for an Initiative.
- Params: `delivery_cycle_id` (uuid, required)
- Returns: `{ sizing: InitiativeSizing | null, is_sized: boolean }`. No row =
  not yet sized (D-567) — never backfilled.
- Auth: any active user JWT.

**`upsert_initiative_sizing`** — create or update the sizing row.
- Params: `delivery_cycle_id` (required); `answers` (required — all five of
  `q1_investment`, `q2_novelty`, `q3_wrongness`, `q4_security_impact`, `q5_ux`);
  `subs` (optional — `q1_sub_engineering`, `q1_sub_operational`,
  `q2_sub_persona`, `q2_sub_scenarios`, `q2_sub_technology`,
  `q2_sub_new_vendor`, `q3_sub_blast`, `q3_sub_correctable`, `q5_sub_facing`,
  `q5_sub_application`); `notes` (optional — `q1_note` … `q5_note`).
- Behavior: validates all five direct answers present (rejects otherwise);
  recomputes and caches `baseline_level`; appends `sizing_answered` /
  `sizing_updated` event.
- Returns: `{ sizing, baseline_level, effective_level, alerts[] }`. Alert codes:
  `sub_exceeds_answer` (a Q1 sub ranks above the Q1 answer),
  `novelty_ux_mismatch` (Q2 major + Q5 standard).
- Auth: any active user JWT (creation-form gating is G3 UI).

**`derive_governance`** — read-only recompute + explanation chips. Does not
write the cache.
- Params: `delivery_cycle_id` (required)
- Returns: `GovernanceDerivation` — `{ is_sized, baseline_level,
  cached_baseline_level, set_level, set_level_reason, effective_level,
  explanation_chips[], alerts[] }`.
- Auth: any active user JWT.

Derivation (D-558, single source of truth
`src/lib/governance-derivation.js`): `q1='xlarge'` or `q3='large_hard'` → 3;
else `q1∈{medium,large}` or `q2='major'` or `q3='significant'` → 2; else 1 when
the assigned DCS has `trusted_dcs=true`, otherwise 2. Recomputed on sizing
upsert, DCS reassignment (`assign_roles_to_cycle`, `update_delivery_cycle`),
and trusted-flag change.

### 1.2 Governance level, trust, oversight (Primitive 2 — migration 081)

**`set_effective_level`** — leadership sets the governance level (D-562).
- Params: `delivery_cycle_id`, `level` (1|2|3), `reason` (required)
- Auth: Division Leader of the Initiative's Division, or Phil. (IE joins in G8.)
- Effective level = COALESCE(set_level, baseline_level). Event-logged.

**`clear_effective_level`** — clears the set level; falls back to baseline.
- Params: `delivery_cycle_id`, `reason` (required). Auth: as set_effective_level.

**`set_oversight`** — per-Initiative approver override (D-561).
- Params: `delivery_cycle_id`, `user_id`, `set_via` ('default'|'manual')
- Auth: Division Leader / Phil. Consumed by approver resolution in G2.

**`clear_oversight`** — clears the oversight field.
- Params: `delivery_cycle_id`, `note` (required — D-561). Setter notification
  wiring is G5; the note is event-logged now.

**`set_trusted_dcs`** — set/revoke the per-user global trust flag (D-559).
- Params: `user_id`, `trusted` (boolean), `note` (optional)
- Auth: admin or Phil JWT.
- Behavior: recomputes cached `baseline_level` on every live Initiative where
  the user is assigned DCS; appends a `trusted_dcs_changed` event per affected
  Initiative; structured server log for the user-level change.

### 1.3 Participation (Primitive 3 — migration 082)

**`add_participation`** — add a C or I stake (D-564).
- Params: `delivery_cycle_id`, `letter` ('C'|'I'), exactly one of
  `holder_user_id` / `holder_group_id`, `set_via`
  ('trio'|'self'|'rule'|'division_default'|'approver'|'leadership')
- `set_via='self'` requires holder = caller (one-tap Informed claim).
  Duplicate active stakes rejected. Event-logged.

**`remove_participation`** — soft-remove a stake (sets `removed_at`).
- Params: `record_id`, `note` (required when the remover is not the holder;
  for group-held stakes an active group member counts as holder — D-564).

**`list_participation`** — stakes on an Initiative, holders resolved.
- Params: `delivery_cycle_id`, `include_removed` (optional, default false)

**`list_my_participation`** — a user's active stakes across Initiatives
(data source for "Initiatives I'm following", G4). Includes group-held stakes
via active membership.
- Params: `user_id` (optional — defaults to caller)

**`list_specialty_groups`** — groups + active member rosters.
- Params: `include_inactive` (optional). Auth: any active user JWT.

**`add_specialty_group_member`** / **`remove_specialty_group_member`** —
member CRUD (admin JWT). Removal is soft (Arch-6); re-adding reactivates.
- Params: `group_id`, `user_id`

**`list_division_default_consulteds`** / **`add_division_default_consulted`** /
**`remove_division_default_consulted`** — Division default Consulted registry
(D-563). Add/remove require Division Leader or admin JWT. Holder is exactly one
of `holder_user_id` / `holder_group_id`. Remove takes `default_consulted_id`.
Attach-at-creation wiring is G4.

### 1.4 Gate events (Primitive 4 — migration 083)

**`add_gate_thread_message`** — append to a gate's thread (D-565).
- Params: `gate_record_id`, `text`. Auth: any active user JWT. Append-only.

**`list_gate_thread`** — chronological thread, authors resolved.
- Params: `gate_record_id`

**`add_gate_condition`** — attach a condition to a gate (D-565).
- Params: `gate_record_id`, `type` ('general'|'consultation_required'),
  `text`, `target_consultation_id` (required for consultation_required; must
  belong to the same gate record).

**`resolve_gate_condition`** — resolve an open condition.
- Params: `condition_id`, `note` (optional)
- Auth: condition setter, admin, or Phil. Consultation auto-resolve is G6.

**`list_gate_conditions`** — conditions on a gate record (open first).
- Params: `gate_record_id`

**`record_gate_approval`** — record one approval row (D-557/D-569).
- Params: `gate_record_id`, `approval_type`
  ('assigned'|'trio_member'|'ie_override'|'condition_cosign'),
  `reason_note` (optional), `over_returned_consultation` (optional boolean)
- Enforcement: reason required for `ie_override` and for
  `over_returned_consultation=true`; board-triggered gates reject `ie_override`
  (D-560 — detection in `src/tools/helpers/board-trigger.js`); `ie_override`
  restricted to Phil until the G8 role grant; duplicate (gate, approver, type)
  rejected. N approvals per gate supported. Existing single-approval flows are
  untouched — dual-write begins in G2.

**`list_gate_approvals`** — the approval collection, approvers resolved.
- Params: `gate_record_id`

### 1.5 G1 table → reader tool map (AC #9)

| Table | Reader tool(s) |
|---|---|
| initiative_sizing | get_initiative_sizing, derive_governance |
| delivery_cycles governance columns | derive_governance (also get/list_delivery_cycles row) |
| users.trusted_dcs | set_trusted_dcs response; users list surfaces in later contract |
| specialty_groups | list_specialty_groups |
| specialty_group_members | list_specialty_groups (rosters) |
| participation_records | list_participation, list_my_participation |
| division_default_consulteds | list_division_default_consulteds |
| gate_approvals | list_gate_approvals |
| gate_conditions | list_gate_conditions |
| gate_thread_messages | list_gate_thread |

---

## 2. Pre-G1 tool inventory (names only)

Authoritative runtime list: `GET /tools` on each service. Behavior: per-contract
specs in `docs/`.

### delivery-cycle-mcp
Roadmap themes: list_roadmap_themes, create_roadmap_theme, update_roadmap_theme,
deactivate_roadmap_theme. Workstreams: create_delivery_workstream,
list_delivery_workstreams, update_workstream_active_status,
update_delivery_workstream. Cycles: create_delivery_cycle,
update_delivery_cycle, get_delivery_cycle, list_delivery_cycles,
advance_cycle_stage, reverse_cycle_stage, set_cycle_on_hold,
resume_cycle_from_hold, cancel_delivery_cycle, uncancel_delivery_cycle,
assign_roles_to_cycle, set_outcome_statement. Gates: submit_gate_for_approval,
confirm_gate_skip, record_gate_decision, withdraw_gate_submission,
list_pending_approvals, list_completed_actions, record_consultation_response,
list_gate_consultations, set_gate_approver, get_gate_approver_configs,
delete_gate_approver_config, list_approved_gates, list_my_completed_gates.
Artifact types: list_artifact_types, create_artifact_type, update_artifact_type.
Milestones: set_milestone_target_date, set_milestone_actual_date,
update_milestone_status. Sprint calendars: list_sprint_calendars,
create_sprint_calendar, update_sprint_calendar, delete_sprint_calendar,
list_sprints, upsert_sprints, delete_sprint, set_division_sprint_calendar,
get_effective_sprint_calendar, set_gate_date_rule. Artifacts:
attach_cycle_artifact, update_cycle_artifact, detach_cycle_artifact,
promote_artifact_to_oi_library. Events/feeds: get_cycle_event_log,
list_initiative_activity. Jira: link_jira_epic, sync_jira_epic. Summaries:
get_delivery_summary. EPO WIP: get_epo_wip_limits, update_epo_wip_limits.
Roadmap freeze dates: list_roadmap_freeze_dates, create_roadmap_freeze_date,
update_roadmap_freeze_date, delete_roadmap_freeze_date. Status updates:
save_initiative_status_update, get_latest_initiative_status,
get_initiative_status_history, acknowledge_status_update, get_my_status_due,
get_my_acknowledgments_due, status_dashboard_changed_since,
get_initiative_status_dashboard, trigger_status_refresh,
get_status_refresh_last_run.

### division-mcp / document-access-mcp / team-meetings-mcp / initiative-public-mcp
See each service's `GET /tools` endpoint and contract specs. (Catalog expansion
for these services: candidate for a later contract.)

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | July 2026 | v1.0*
