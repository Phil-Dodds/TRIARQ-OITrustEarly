// database.ts — Pathways OI Trust
// TypeScript interfaces for all database table shapes.
// These match the schema exactly. Used by services and components.
// No Supabase client imports here — this file is types only.

export type SystemRole = 'phil' | 'ds' | 'cb' | 'ce' | 'admin';
export type LifecycleStatus = 'draft' | 'seed_review' | 'candidate' | 'canon' | 'superseded' | 'archived';
export type FileFormat = 'pdf' | 'docx' | 'md' | 'txt';
export type MalwareScanStatus = 'pending' | 'clean' | 'rejected';
export type WorkflowStatus = 'open' | 'approved' | 'declined' | 'cancelled';
export type RaciRole = 'A' | 'C' | 'I';
export type ParticipantStatus = 'pending' | 'approved' | 'declined' | 'dismissed' | 'informed';
export type DefaultScope = 'system' | 'trust' | 'division';

export interface User {
  id:                                    string;
  email:                                 string;
  display_name:                          string;
  system_role:                           SystemRole;
  allow_both_admin_and_functional_roles: boolean;
  is_active:                             boolean;
  created_at:                            string;
  updated_at:                            string;
  deleted_at:                            string | null;
}

export interface Division {
  id:                 string;
  parent_division_id: string | null;
  division_name:      string;
  // ARCH-29 / D-203 — short display name (max 10 chars at MCP/UI layer). Falls back to division_name when null.
  // Migration 030 added this column to divisions. Source: Contract 10 §6 B-48.
  display_name_short: string | null;
  division_level:     number;
  division_type_label: string | null;
  owner_user_id:      string | null;
  created_by:         string;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
}

export interface DivisionMembership {
  id:          string;
  user_id:     string;
  division_id: string;
  assigned_by: string;
  assigned_at: string;
  revoked_at:  string | null;
  created_at:  string;
  updated_at:  string;
  deleted_at:  string | null;
}

export interface ArtifactType {
  id:               string;
  type_name:        string;
  type_description: string | null;
  is_system_type:   boolean;
  workflow_handler: string | null;
  default_scope:    DefaultScope | null;
  created_by:       string;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
}

export interface Artifact {
  id:               string;
  artifact_type_id: string;
  artifact_title:   string;
  artifact_content: string | null;
  division_id:      string;
  folder_id:        string | null;
  lifecycle_status: LifecycleStatus;
  submitted_by:     string;
  submitted_at:     string;
  superseded_by:    string | null;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
  // Joined fields (present when fetched with relations)
  artifact_types?:  Pick<ArtifactType, 'type_name' | 'type_description'>;
  divisions?:       Pick<Division, 'division_name'>;
  download_url?:    string | null;
}

export interface ArtifactVersion {
  id:                        string;
  artifact_id:               string;
  version_number:            number;
  artifact_content_snapshot: string | null;
  file_id:                   string | null;
  created_by:                string;
  created_at:                string;
  change_note:               string | null;
  updated_at:                string;
  deleted_at:                string | null;
  document_files?:           DocumentFile;
}

export interface DocumentFile {
  id:                  string;
  storage_path:        string;
  original_filename:   string;
  file_format:         FileFormat;
  file_size_bytes:     number;
  malware_scan_status: MalwareScanStatus;
  malware_scan_at:     string | null;
  uploaded_by:         string;
  uploaded_at:         string;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface Folder {
  id:               string;
  division_id:      string;
  parent_folder_id: string | null;
  folder_name:      string;
  created_by:       string;
  created_at:       string;
  updated_at:       string;
  deleted_at:       string | null;
}

export interface ApprovalWorkflow {
  id:                  string;
  artifact_id:         string;
  workflow_type:       string;
  workflow_status:     WorkflowStatus;
  accountable_user_id: string;
  decided_at:          string | null;
  decision_note:       string | null;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface ApprovalParticipant {
  id:                 string;
  workflow_id:        string;
  user_id:            string;
  raci_role:          RaciRole;
  participant_status: ParticipantStatus;
  responded_at:       string | null;
  response_note:      string | null;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
}

export interface Notification {
  id:                string;
  user_id:           string;
  notification_type: string;
  artifact_id:       string | null;
  workflow_id:       string | null;
  notification_body: string;
  dismissed_at:      string | null;
  created_at:        string;
  updated_at:        string;
  deleted_at:        string | null;
}

// ── MCP response envelope ─────────────────────────────────────────────────────
export interface McpResponse<T = unknown> {
  success:       boolean;
  data?:         T;
  error?:        string;
  message?:      string;
  stub_message?: string;
}

// ── Build C — Delivery Cycle types ────────────────────────────────────────────

export type TierClassification  = 'tier_1' | 'tier_2' | 'tier_3';
export type LifecycleStage      = 'BRIEF' | 'DESIGN' | 'SPEC' | 'BUILD' | 'VALIDATE' | 'PILOT' | 'UAT' | 'RELEASE' | 'OUTCOME' | 'COMPLETE' | 'CANCELLED' | 'ON_HOLD';
export type GateName            = 'brief_review' | 'go_to_build' | 'go_to_deploy' | 'go_to_release' | 'close_review';
// gate_status: not_started (D-282 seed) | pending (legacy seed) | awaiting_approval (D-345)
//   | approved | returned | blocked. Migration 029 added 'awaiting_approval'.
export type GateStatus          = 'not_started' | 'pending' | 'awaiting_approval' | 'approved' | 'returned' | 'blocked';
export type DateStatus          = 'not_started' | 'on_track' | 'at_risk' | 'behind' | 'complete';
export type PointerStatus       = 'external_only' | 'promoted' | 'oi_only';
export type JiraSyncStatus      = 'unsynced' | 'synced' | 'error';
// GateDisplayState: stage-track + gate sub-panel rendering vocabulary.
// 'not_started' = grey diamond, no submission yet. 'pending' = legacy. 'awaiting_approval' = sunray, submitted.
// 'blocked' = system error. 'complete' = teal approved. 'upcoming' = dim future gate.
// Source: D-345, gate-submission-flow-spec §2.
export type GateDisplayState    = 'not_started' | 'pending' | 'awaiting_approval' | 'blocked' | 'complete' | 'upcoming';

export interface DeliveryWorkstream {
  workstream_id:           string;
  workstream_name:         string;
  display_name_short?:     string | null; // D-203: max 20 chars; fallback to workstream_name when null. Migration 027.
  home_division_id:        string;
  workstream_lead_user_id: string;
  active_status:           boolean;
  created_at:              string;
  updated_at:              string;
  deleted_at:              string | null;
  // Joined / computed (list_delivery_workstreams enrichment)
  home_division_name?:     string;
  lead_display_name?:      string;
  active_cycle_count?:     number;
}

export interface DeliveryCycle {
  delivery_cycle_id:       string;
  cycle_title:             string;
  cycle_description:       string | null;
  division_id:             string;
  workstream_id:           string | null;  // nullable — D-165: optional at creation, required at Brief Review gate
  tier_classification:     TierClassification;
  current_lifecycle_stage: LifecycleStage;
  outcome_statement:       string | null;
  outcome_set_by_user_id:  string | null;
  outcome_set_at:          string | null;
  // cycle_owner_user_id removed — migration 025 (CC-006): redundant with assigned_ds_user_id
  assigned_ds_user_id:     string | null;  // Delivery Specialist — nullable at creation, required before Brief Review (CC-006)
  assigned_cb_user_id:     string | null;  // Capability Builder — migration 024
  pre_hold_lifecycle_stage: LifecycleStage | null;  // Stores stage before ON_HOLD — migration 024
  jira_epic_key:           string | null;
  created_at:              string;
  updated_at:              string;
  deleted_at:              string | null;
  // Joined
  workstream?:             DeliveryWorkstream;
  division_name?:          string;
  owner_display_name?:     string;
  assigned_ds_display_name?: string;
  assigned_cb_display_name?: string;
  milestone_dates?:        CycleMilestoneDate[];
  gate_records?:           GateRecord[];
  jira_links?:             JiraLink[];
  artifacts?:              CycleArtifact[];
}

export interface CycleMilestoneDate {
  milestone_id:          string;
  delivery_cycle_id:     string;
  gate_name:             GateName;
  milestone_label:       string;
  target_date:           string | null;
  actual_date:           string | null;
  date_status:           DateStatus;
  status_override_reason: string | null;
  created_at:            string;
  updated_at:            string;
}

export interface GateRecord {
  gate_record_id:              string;
  delivery_cycle_id:           string;
  gate_name:                   GateName;
  gate_status:                 GateStatus;
  approver_user_id:            string | null;
  approver_decision_at:        string | null;
  approver_notes:              string | null;
  workstream_active_at_clearance: boolean | null;
  // D-345: submission tracking. Set on submit_gate_for_approval, cleared on withdraw_gate_submission.
  submitted_at:                string | null;
  submitted_by_user_id:        string | null;
  created_at:                  string;
  updated_at:                  string;
  // Supplement Section 1: populated by get_delivery_cycle for the calling user
  current_user_gate_authority?: {
    can_submit:   boolean;
    can_approve:  boolean;
    can_withdraw: boolean;
  };
  // Joined — display name of submitter for the "Submitted by" line in sub-panel
  submitted_by_display_name?:  string | null;
}

export interface CycleEventLogEntry {
  event_id:          string;
  delivery_cycle_id: string;
  event_type:        string;
  event_description: string;
  actor_user_id:     string | null;
  event_metadata:    Record<string, unknown> | null;
  created_at:        string;
}

export interface CycleArtifactType {
  artifact_type_id:   string;
  artifact_type_name: string;
  lifecycle_stage:    string;
  guidance_text:      string;
  sort_order:         number;
  gate_required:      boolean;
  required_at_gate:   GateName | null;
}

export interface CycleArtifact {
  cycle_artifact_id:      string;
  delivery_cycle_id:      string;
  artifact_type_id:       string | null;
  display_name:           string;
  external_url:           string | null;
  oi_library_artifact_id: string | null;
  pointer_status:         PointerStatus;
  attached_by_user_id:    string;
  attached_at:            string;
  created_at:             string;
  updated_at:             string;
  deleted_at:             string | null;
  // Joined — populated by get_delivery_cycle when artifacts are returned with full type metadata
  artifact_type_name?:      string;
  lifecycle_stage?:         string;
  guidance_text?:           string;   // from cycle_artifact_types.guidance_text — shown in slot UI (Item 2)
  attached_by_display_name?: string;  // resolved from attached_by_user_id — shown as tappable chip (D-181)
}

export interface JiraLink {
  jira_link_id:      string;
  delivery_cycle_id: string;
  jira_epic_key:     string;
  jira_project_key:  string;
  sync_status:       JiraSyncStatus;
  last_synced_at:    string | null;
  last_sync_error:   string | null;
  created_at:        string;
  updated_at:        string;
}

/** Ordered lifecycle track node — used by StageTrackComponent */
export interface LifecycleTrackNode {
  type:     'stage' | 'gate';
  id:       string;           // stage name or gate name
  label:    string;
}

/** Per-gate display state map passed into StageTrackComponent */
export type GateStateMap = Record<GateName, GateDisplayState>;

// ── D-345 — Action Queue / list_pending_approvals response item ──────────────
export interface PendingApprovalItem {
  gate_record_id:                string;
  delivery_cycle_id:             string;
  cycle_title:                   string;
  division_display_name_short:   string;  // falls back to division_name when display_name_short null
  workstream_display_name_short: string;  // falls back to workstream_name
  gate_name:                     GateName;
  gate_name_display:             string;  // human-readable e.g. "Brief Review"
  submitted_at:                  string;
  submitted_by_display_name:     string;
  tier_classification:           TierClassification;
}

// ── Build C — Dashboard summary types (D-171–D-176) ──────────────────────────

/** WIP category counts per workstream. Prep = BRIEF/DESIGN/SPEC; Build = BUILD/VALIDATE;
 *  Outcome = PILOT/UAT/RELEASE/OUTCOME. Limit = 4 each (D-190). */
export interface WorkstreamSummaryItem {
  workstream_id:          string | null;  // null = cycles with no workstream assigned
  workstream_name:        string;
  home_division_id:       string | null;
  home_division_name:     string;
  active_status:          boolean;
  total_active_cycles:    number;
  wip_prep:               number;
  wip_build:              number;
  wip_outcome:            number;
  wip_prep_exceeded:      boolean;
  wip_build_exceeded:     boolean;
  wip_outcome_exceeded:   boolean;
  cycles_by_next_gate:    Record<GateName | 'none', number>;
}

/** Gate-level pending/upcoming/overdue summary for the Gate Summary view. */
export interface GateSummaryItem {
  gate_name:           GateName;
  total_pending_count: number;  // cycles where this is their next gate
  upcoming_count:      number;  // target date within 7 days (and not yet past)
  overdue_count:       number;  // target date is in the past, no actual date set
}

/** Division-level active cycle count for the Division Summary view (D-176). */
export interface DivisionSummaryItem {
  division_id:         string;
  division_name:       string;
  division_level:      number;
  parent_division_id:  string | null;
  active_cycle_count:  number;
}

/** Full summary response from get_delivery_summary MCP tool. */
export interface DeliverySummary {
  workstream_summaries: WorkstreamSummaryItem[];
  gate_summaries:       GateSummaryItem[];
  division_summaries:   DivisionSummaryItem[];
}
