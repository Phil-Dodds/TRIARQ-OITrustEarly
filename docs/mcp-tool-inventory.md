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

## 1.6 Contract G2 — Approver Resolution v2 (modified tool)

**`submit_gate_for_approval`** (modified — D-557/D-561/D-570):
- Resolution is now effective-level-aware via `helpers/approver.js
  resolveGateApproverV2`. Effective level = COALESCE(set_level, baseline_level):
  - NULL (unsized) → legacy chain (config → DL → Phil) exactly as pre-G2; no
    gate_approvals dual-write (D-570b).
  - Level 1 → legacy chain unchanged until G5 (D-570a), dual-written; oversight
    set promotes to L2 semantics (S-C4).
  - Level 2 → oversight (D-561) → gate_approver_configs → Division Leader → Phil.
  - Level 3 → leadership only (oversight-if-leadership → DL → Phil); configs
    ignored; non-leadership config/oversight adds
    `warnings: ['level3_sub_leadership_config_ignored']` (D-570c, S-C1).
- Sized submissions dual-write one `gate_approvals` row per (gate, approver)
  with approval_type 'assigned' (D-570a truthful history).
- Board detection now sourced from `helpers/board-trigger.js` (CC-G1-18);
  behavior unchanged.
- Response additions: `effective_level` (1|2|3|null), `approver_source`
  ('oversight'|'config'|'division_owner'|'phil'|'legacy_*'|'unresolved'),
  `warnings` (string[]).

---

## 1.7 Contract G3 — Sizing UI support (new + modified tools)

**`preview_governance_derivation`** (new) — stateless derivation preview for the
creation form's live Governance panel. Params: `answers` (all five, validated
as upsert), `subs?`, `dcs_user_id?`. Returns `{ baseline_level,
explanation_chips[], alerts[], dcs_trusted }`. Keeps
`lib/governance-derivation.js` the single source of truth (no client-side
derivation). Auth: any active user JWT.

**`get_governance_config_warnings`** (new) — Admin → Divisions banner data:
`gate_approver_configs` rows naming non-leadership people in Divisions with
live Level-3-effective Initiatives (D-570c). Returns `{ config_warnings:
[{ division_id, division_name, gate_name, approver_user_id,
approver_display_name, l3_initiative_count }] }`. Auth: admin JWT.

**`upsert_initiative_sizing`** (modified — D-567/D-562/D-563):
- Post-Go-to-Build edits: two-call approver confirmation — first call returns
  `status: 'REQUIRES_APPROVER_CONFIRMATION'` with
  `{ current_baseline_level, new_baseline_level, message }`; second call with
  `approver_confirmed: true` executes. Confirming caller must be the approver
  of a currently awaiting gate (when one exists) or an admin.
- Level-lowering edits post-GtB notify the awaiting gate approver(s)
  (email_type `governance_level_lowered`) + `sizing_lowered_level` event.
- Baseline rising above a set level adds alert `baseline_exceeds_set_level`
  + event (S-C6 data support).
- `q2_sub_new_vendor: true` writes an idempotent IT/Infrastructure Informed
  participation record (set_via `rule`).

**`submit_gate_for_approval`** (modified — D-567): unsized Initiative → the
non-mutating interstitial `status: 'REQUIRES_SIZING'` (mirrors the skip
interstitial); Angular interposes the sizing form and re-submits.

**`set_effective_level`** (modified — D-562): a level-lowering set notifies the
approver(s) of awaiting gates (email + event).

---

## 1.8 Contract G4 — Participation (modified tools)

**`add_participation`** (modified — role-scoped auth, supersedes CC-G1-19):
`set_via 'self'` = one-tap Informed only (letter I, holder = caller, any active
user). `'trio'` requires an assigned DCS/EPO/DOL of the cycle; `'approver'`
the approver of a currently awaiting gate; `'leadership'` the Division Leader;
`'rule'`/`'division_default'` are server-side paths (external callers need
admin). Admin/Phil pass all.

**`list_my_participation`** (modified): rows now carry Initiative context —
`cycle_title`, `current_lifecycle_stage`, `division_id`, `effective_level`
("Initiatives I'm following" data source).

**`submit_gate_for_approval`** (modified — D-564): the Consulted set derives
from participation_records C stakes (groups expanded to active members) plus
the non-null trio. The D-458 array is no longer read (migration 084 retires it).

**`record_gate_decision`** (modified — D-564): Informed holders (user-held +
group members) receive gate-decision emails (email_type
`informed_gate_decision`); the decision-maker is excluded; Informed parties
never appear in waiting-on.

**`create_delivery_cycle`** (modified — D-563): Division default Consulteds
attach automatically at creation (participation records, set_via
`division_default`).

---

## 1.9 Contract G5 — Level 1 consensus (modified tools)

**`submit_gate_for_approval`** (modified — D-557/S-A1): L1-consensus gates
(effective level 1, no oversight) enforce the assignment floor (DCS+DOL at
Brief Review — absolute, overriding the Division DOL exemption; full trio from
Go to Build on), resolve `approver_user_id` NULL (D-570a retired, no
'assigned' dual-write), and auto-record the submitter's `trio_member` approval
when the submitter is a trio member.

**`record_gate_decision`** (modified — D-557): on an awaiting L1 gate, only a
trio member or Admin may act. 'approved' records an uncleared-dup-guarded
`trio_member` approval; the gate passes the instant the collection completes
(all non-null trio + all non-trio consulted approved) via the shared
`applyGateApprovalTransition` (exported for the consultation tool). 'returned'
returns the gate entirely: approvals cleared (`cleared_by_return_at` +
`cleared_by_event_id`, migration 085 — never deleted), trio notified. Normal
single-approver returns also clear collected G2 'assigned' rows (ruling 1).

**`record_consultation_response`** (modified — S-A3/S-A4): on an awaiting L1
gate a consulted 'declined' returns the gate entirely (trio-return semantics);
a consulted 'approved' that completes the collection passes the gate.

**`list_pending_approvals`** (modified): new item_type `trio_member_approval`
for awaiting L1 gates where the caller is an assigned trio member without an
uncleared approval; wins typing over the admin null-approver fallback and over
a pending consulted row on the same gate.

**`get_delivery_cycle`** (modified): awaiting L1 gate records carry
`l1_consensus: true` and `l1_waiting_on { pending_trio_user_ids,
pending_trio_display_names, pending_consulted_count, caller_has_approved }`;
`can_approve` extends to trio members who haven't approved yet.

---

## 1.10 Contract G6 — Gate thread + conditions (modified tools)

**`submit_gate_for_approval`** (modified — D-565 AC #1): a submission note is
also written as the gate thread's opening message (gate_thread_messages).

**`record_consultation_response`** (modified — S-B5): a consulted 'approved'
auto-resolves any open `consultation_required` conditions targeting that
consultation.

**`record_gate_decision`** (modified — D-565): approval is blocked while the
gate has open conditions (single-approver and L1 collection alike — CC-G6
lean: conditions hold the gate; resolving never auto-approves). Returns clear
open conditions with the approvals (AC #5 lean — resolved with a clearing
note, never deleted).

**`add_gate_condition`** (modified): setter auth = the gate's resolved
approver, an Initiative trio member, or an Admin (CC-G6 lean).
**`resolve_gate_condition`** (modified): resolver set extended to the gate's
current approver (CC-G1-20 + spec).

---

## 1.11 Contract G8 — Initiative Executive (new + modified tools)

**`set_initiative_executive`** (new — D-560/D-464 posture): Phil-only
grant/revoke of `users.is_initiative_executive` (migration 086);
activity-logged (structured server log).

**`list_all_pending_gates`** (new — D-560): every awaiting gate company-wide —
gate, initiative, Division, effective level, assigned approver, days waiting,
the G7 waiting-on line, aging highlight past ARCH-33-APG-AGING (7 days, code
constant — CC-G8). Pull-only, oldest first. Auth: IE, Phil, or Admin.

**`record_gate_decision`** (modified — D-560/D-569):
- `ie_override: true` + `override_reason` — IEs/Phil approve any non-board
  gate; distinct `ie_override` approval row, `gate_ie_override` event,
  assigned approver emailed; board gates rejected (untouchable).
- Approving any gate that carries a DECLINED consultation requires
  `over_returned_reason` (else the structured error
  `RETURNED_CONSULTATION_REQUIRES_REASON`); approving writes the
  over_returned marker row + event, notifies returning parties with the
  reasoning, and auto-notifies the Division Leader on content-triggered
  cases (Security membership + Q4 flag; Compliance membership at Go to
  Deploy — CC-G8 lean until G9 suggestion provenance exists).

**`record_gate_approval`** (modified): ie_override callers = IEs + Phil
(CC-G1-14 interim retired).

Leadership sets extended to IEs: `resolveGateApproverV2` L3 chain,
`set/clear_effective_level`, `set/clear_oversight` (completes CC-G1-08/-09).

---

## 1.12 Contract G9 — Suggestions + interest filters (new + modified tools)

**`get_suggestion_state`** (new — D-563 Grade 2): per-Initiative state of the
two hardcoded rules (`q4_security`, `q5_ux`) — applies / attached / dismissed
(with the specialty-visible note, S-C7) / live.

**`apply_suggestion_decision`** (new): `action 'add'` attaches the group as
Consulted (set_via 'rule', idempotent); `action 'dismiss'` requires a note and
records it in `suggestion_dismissals` (migration 087, UNIQUE per cycle+rule).
Auth: Initiative trio or Admin. Unknown rule_key rejected — no rules framework
until rule three arrives (D-563 locked).

**`list_delivery_cycles`** (modified — D-563 Grade 1): rows carry the full
`sizing` object (answers, sub-answers, Other-notes) so interest profiles
filter client-side over queryable facts; rows also carry `waiting_on` (G7).

---

## 1.13 Contract G10 — Cancellation + the one v1 KPI (new + modified tools)

**`cancel_delivery_cycle`** (modified — D-566): authority follows severity —
pre-Brief-Review / L1 / unsized: any trio member; L2/L3 post-Brief-Review: the
resolved approver (awaiting gate's stamp, else next gate via the D-557 chain).
Admin/Phil/IE retain operational authority (IE = the release valve for stuck
requests). Executing closes any open cancel request and notifies every
Consulted and Informed holder (groups expanded).

**`request_cancel`** (new — D-566): trio-only, reason required; routes to the
cancel authority (cancel_requests, migration 088) — email + a
`cancel_request` row in the authority's My Actions queue.
**`decline_cancel_request`** (new): authority/IE/Admin declines with a note;
the requester is notified.
**`get_open_cancel_request`** (new): the Initiative-panel banner source.

**`get_quarter_deploy_goal`** (new — D-568 family C, THE one v1 KPI): per
person — assigned Initiatives with a Go to Deploy target this quarter; gates
done vs remaining across the deploy chain; recent weekly pace vs needed pace;
deploy-target movement count (shown, not hidden); Division roll-ups for DLs.
Families A/B/D NOT built (dedicated metric pass required — deferred).

**`list_pending_approvals`** (modified): open cancel requests routed to the
caller appear as `item_type 'cancel_request'` rows (reason in
submission_note); resolution happens on the Initiative panel.

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
