// delivery.service.ts — Pathways OI Trust
// Angular service for all delivery-cycle-mcp tool calls.
// Components never call McpService directly — they call this service.
// D-93: MCP-only DB access. Rule 2: UI as presentation layer only.

import { Injectable }  from '@angular/core';
import { Observable }  from 'rxjs';
import { McpService }  from './mcp.service';
import {
  McpResponse,
  DeliveryWorkstream,
  DeliveryCycle,
  CycleMilestoneDate,
  GateRecord,
  CycleEventLogEntry,
  CycleArtifactType,
  CycleArtifact,
  JiraLink,
  TierClassification,
  GateName,
  GateStatus,
  DateStatus,
  PointerStatus,
  DeliverySummary,
  PendingApprovalItem,
  EpoWipLimitRow,
  InitiativeActivityPage,
  InitiativeActivityCount,
  ApprovedGateRow,
  MyCompletedGatesResponse,
  ArtifactTypeRow,
  GateDecisionResult
} from '../types/database';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  constructor(private readonly mcp: McpService) {}

  // ── Workstream tools ───────────────────────────────────────────────────────

  createWorkstream(params: {
    workstream_name:         string;
    display_name_short?:     string;   // Contract 17 §9: required at UI, optional at MCP
    home_division_id:        string;
    workstream_lead_user_id: string;
  }): Observable<McpResponse<DeliveryWorkstream>> {
    return this.mcp.call<DeliveryWorkstream>('delivery', 'create_delivery_workstream', params as Record<string, unknown>);
  }

  /**
   * Contract 17 §9: unified update for editable Workstream fields and active_status.
   * Supersedes updateWorkstreamActiveStatus. Only supplied fields are changed.
   */
  updateWorkstream(params: {
    workstream_id:            string;
    workstream_name?:         string;
    display_name_short?:      string | null;
    home_division_id?:        string;
    workstream_lead_user_id?: string;
    active_status?:           boolean;
  }): Observable<McpResponse<DeliveryWorkstream>> {
    return this.mcp.call<DeliveryWorkstream>('delivery', 'update_delivery_workstream', params as Record<string, unknown>);
  }

  listWorkstreams(params: {
    // Scope mode (CC-002 Workstream Picker)
    scope_type?:        'division_tree' | 'trust' | 'user_divisions' | 'all';
    scope_division_id?: string;   // Required when scope_type = 'division_tree'
    include_inactive?:  boolean;  // Default false — inactive excluded from picker unless toggled
    // Legacy filters (still supported when scope params absent)
    home_division_id?:  string;
    active_status?:     boolean;
  } = {}): Observable<McpResponse<DeliveryWorkstream[]>> {
    return this.mcp.call<DeliveryWorkstream[]>('delivery', 'list_delivery_workstreams', params as Record<string, unknown>);
  }

  updateWorkstreamActiveStatus(params: {
    workstream_id: string;
    active_status: boolean;
  }): Observable<McpResponse<DeliveryWorkstream>> {
    return this.mcp.call<DeliveryWorkstream>('delivery', 'update_workstream_active_status', params as Record<string, unknown>);
  }

  // ── Delivery Cycle tools ───────────────────────────────────────────────────

  createCycle(params: {
    cycle_title:              string;
    cycle_description?:       string;
    division_id:              string;
    workstream_id?:           string;          // optional — D-165
    tier_classification:      TierClassification;
    assigned_dcs_user_id?:    string;          // optional at creation; required before Brief Review gate
    assigned_epo_user_id?:    string;          // optional at creation; required before Go to Build gate
    assigned_dol_user_id?:    string;          // optional — D-391 (new); required before Brief Review gate
    outcome_statement?:       string;          // optional at creation
    jira_epic_key?:           string;          // optional
    milestone_target_dates?:  {               // optional gate target dates at creation
      brief_review?:   string;
      go_to_build?:    string;
      go_to_deploy?:   string;
      go_to_release?:  string;
      close_review?:   string;
    };
  }): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'create_delivery_cycle', params as Record<string, unknown>);
  }

  // Update mutable fields on a Delivery Cycle. Only supplied fields are changed.
  // D-229: logs field_edit event per changed field. CC-Decision-2026-04-10-D.
  updateCycle(params: {
    delivery_cycle_id:       string;
    cycle_title?:            string;
    division_id?:            string;
    outcome_statement?:      string | null;
    workstream_id?:          string | null;
    tier_classification?:    TierClassification;
    assigned_dcs_user_id?:   string | null;
    assigned_epo_user_id?:   string | null;
    assigned_dol_user_id?:   string | null;
    jira_epic_key?:          string | null;
  }): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'update_delivery_cycle', params as Record<string, unknown>);
  }

  getCycle(delivery_cycle_id: string): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'get_delivery_cycle', { delivery_cycle_id });
  }

  listCycles(params: {
    division_id?:              string;
    include_child_divisions?:  boolean;   // D-166: when true, includes child division cycles
    current_lifecycle_stage?:  string;
    workstream_id?:            string;
    filter_no_workstream?:     boolean;   // D-167: when true, returns only cycles with no workstream
    tier_classification?:      TierClassification;
    assigned_to_current_user?: boolean;   // D-391: when true, returns only cycles where caller is DCS, EPO, or DOL
  } = {}): Observable<McpResponse<DeliveryCycle[]>> {
    return this.mcp.call<DeliveryCycle[]>('delivery', 'list_delivery_cycles', params as Record<string, unknown>);
  }

  assignRolesToCycle(params: {
    delivery_cycle_id:      string;
    assigned_dcs_user_id?:  string | null;
    assigned_epo_user_id?:  string | null;
    assigned_dol_user_id?:  string | null;
  }): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'assign_roles_to_cycle', params as Record<string, unknown>);
  }

  advanceStage(delivery_cycle_id: string): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'advance_cycle_stage', { delivery_cycle_id });
  }

  /**
   * D-179: Two-call pattern for stage regression.
   * Without confirmed → returns preview ({ requires_confirmation, target_stage, gates_to_reset, warning }).
   * With confirmed:true → executes regression, returns updated DeliveryCycle.
   */
  reverseStage(params: {
    delivery_cycle_id: string;
    confirmed?:        boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Observable<McpResponse<any>> {
    return this.mcp.call('delivery', 'reverse_cycle_stage', params as Record<string, unknown>);
  }

  setOnHold(params: {
    delivery_cycle_id: string;
    hold_reason?:      string;
  }): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'set_cycle_on_hold', params as Record<string, unknown>);
  }

  resumeFromHold(delivery_cycle_id: string): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'resume_cycle_from_hold', { delivery_cycle_id });
  }

  cancelCycle(delivery_cycle_id: string): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'cancel_delivery_cycle', { delivery_cycle_id });
  }

  uncancelCycle(delivery_cycle_id: string): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'uncancel_delivery_cycle', { delivery_cycle_id });
  }

  setOutcomeStatement(params: {
    delivery_cycle_id: string;
    outcome_statement: string;
  }): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'set_outcome_statement', params as Record<string, unknown>);
  }

  // ── Gate tools ─────────────────────────────────────────────────────────────

  submitGateForApproval(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
  }): Observable<McpResponse<GateRecord>> {
    return this.mcp.call<GateRecord>('delivery', 'submit_gate_for_approval', params as Record<string, unknown>);
  }

  recordGateDecision(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    decision:          'approved' | 'returned';
    approver_notes?:   string;
  }): Observable<McpResponse<GateDecisionResult>> {
    return this.mcp.call<GateDecisionResult>(
      'delivery', 'record_gate_decision', params as Record<string, unknown>
    );
  }

  /**
   * D-345: withdraw a gate that is awaiting approval. Resets to not_started.
   * Caller must have submit authority on the cycle (DCS, EPO, DOL, or Phil).
   */
  withdrawGateSubmission(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
  }): Observable<McpResponse<{ gate_record_id: string; gate_status: GateStatus }>> {
    return this.mcp.call('delivery', 'withdraw_gate_submission', params as Record<string, unknown>);
  }

  /**
   * D-345 §3.4: returns gate_records currently awaiting approval where the caller is the approver.
   * Powers the Action Queue and the pending-approvals sidebar badge.
   */
  listPendingApprovals(): Observable<McpResponse<PendingApprovalItem[]>> {
    return this.mcp.call<PendingApprovalItem[]>('delivery', 'list_pending_approvals', {});
  }

  // ── Milestone date tools ───────────────────────────────────────────────────

  setMilestoneTargetDate(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    target_date:       string;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'set_milestone_target_date', params as Record<string, unknown>);
  }

  setMilestoneActualDate(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    actual_date:       string;
    override_reason?:  string;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'set_milestone_actual_date', params as Record<string, unknown>);
  }

  updateMilestoneStatus(params: {
    delivery_cycle_id:      string;
    gate_name:              GateName;
    date_status:            DateStatus;
    status_override_reason?: string;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'update_milestone_status', params as Record<string, unknown>);
  }

  // ── Artifact tools ─────────────────────────────────────────────────────────

  attachArtifact(params: {
    delivery_cycle_id:      string;
    artifact_type_id?:      string;
    display_name:           string;
    external_url?:          string;
    oi_library_artifact_id?: string;
    pointer_status?:        PointerStatus;
  }): Observable<McpResponse<CycleArtifact>> {
    return this.mcp.call<CycleArtifact>('delivery', 'attach_cycle_artifact', params as Record<string, unknown>);
  }

  promoteArtifact(params: {
    cycle_artifact_id:      string;
    oi_library_artifact_id: string;
  }): Observable<McpResponse<CycleArtifact>> {
    return this.mcp.call<CycleArtifact>('delivery', 'promote_artifact_to_oi_library', params as Record<string, unknown>);
  }

  // ── Event log ──────────────────────────────────────────────────────────────

  getEventLog(delivery_cycle_id: string): Observable<McpResponse<CycleEventLogEntry[]>> {
    return this.mcp.call<CycleEventLogEntry[]>('delivery', 'get_cycle_event_log', { delivery_cycle_id });
  }

  // ── Dashboard summary (D-171–D-176) ───────────────────────────────────────

  /**
   * Returns pre-aggregated summary data for all three hub sub-views.
   * Optionally filtered to specific division IDs (pass empty/omit for all accessible).
   * D-173: NEXT_GATE_BY_STAGE computed server-side.
   * Contract 20 (D-400 / CC-20-04): per-workstream WIP exceeded flags removed.
   * Zone counts retained.
   */
  getDeliverySummary(params: {
    division_ids?: string[];
  } = {}): Observable<McpResponse<DeliverySummary>> {
    return this.mcp.call<DeliverySummary>('delivery', 'get_delivery_summary', params as Record<string, unknown>);
  }

  // ── EPO WIP limits (Contract 20, D-400, D-401) ────────────────────────────

  /** Returns one row per active EPO with current limits. Auto-creates 3/3/3
   *  rows for any EPO missing one. Any authenticated user. */
  getEpoWipLimits(): Observable<McpResponse<EpoWipLimitRow[]>> {
    return this.mcp.call<EpoWipLimitRow[]>('delivery', 'get_epo_wip_limits', {});
  }

  /** Updates one or more limit fields for a single EPO. Admin only.
   *  Validation: each supplied limit must be an integer ≥ 1. */
  updateEpoWipLimits(params: {
    user_id:            string;
    pre_build_limit?:   number;
    build_limit?:       number;
    post_deploy_limit?: number;
  }): Observable<McpResponse<EpoWipLimitRow>> {
    return this.mcp.call<EpoWipLimitRow>('delivery', 'update_epo_wip_limits', params as Record<string, unknown>);
  }

  // ── Initiative activity (Contract 23, D-428, D-429) ───────────────────────

  /**
   * Cross-Initiative event feed. Division scope enforced by MCP. Pagination via
   * before_cursor (oldest loaded row's created_at). limit default 50, max 100.
   * Powers /initiatives/activity, My Activity home card, and User View zone.
   */
  listInitiativeActivity(params: {
    division_ids?:     string[];
    actor_user_id?:    string;
    person_user_ids?:  string[];      // D-439 multi-select Person filter
    event_types?:      string[];
    after?:            string;          // ISO timestamptz, inclusive lower bound
    before_cursor?:    string;          // ISO timestamptz, exclusive upper bound
    limit?:            number;
  } = {}): Observable<McpResponse<InitiativeActivityPage>> {
    return this.mcp.call<InitiativeActivityPage>(
      'delivery', 'list_initiative_activity', params as Record<string, unknown>
    );
  }

  /**
   * Count-only variant used by the Initiative hub card 8 async headline.
   * Same filter shape — passes count_only:true so MCP skips row enrichment.
   */
  countInitiativeActivity(params: {
    division_ids?:  string[];
    actor_user_id?: string;
    event_types?:   string[];
    after?:         string;
  } = {}): Observable<McpResponse<InitiativeActivityCount>> {
    return this.mcp.call<InitiativeActivityCount>(
      'delivery', 'list_initiative_activity',
      { ...params, count_only: true } as Record<string, unknown>
    );
  }

  // ── Contract 24 — approved gate analytical views (D-430, D-431) ──────────

  /** D-431 — Division-scoped approved gate feed. */
  listApprovedGates(params: {
    division_ids?:     string[];
    gate_names?:       GateName[];
    approver_user_id?: string;
    days_back?:        number;
  } = {}): Observable<McpResponse<ApprovedGateRow[]>> {
    return this.mcp.call<ApprovedGateRow[]>(
      'delivery', 'list_approved_gates', params as Record<string, unknown>
    );
  }

  /** D-430 — Caller's recently-approved gates as DCS / EPO / DOL. */
  listMyCompletedGates(params: {
    limit?:     number;
    days_back?: number;
  } = {}): Observable<McpResponse<MyCompletedGatesResponse>> {
    return this.mcp.call<MyCompletedGatesResponse>(
      'delivery', 'list_my_completed_gates', params as Record<string, unknown>
    );
  }

  // ── Artifact Type management (D-437 origin; D-438 Contract 25 schema) ────

  listArtifactTypes(): Observable<McpResponse<ArtifactTypeRow[]>> {
    return this.mcp.call<ArtifactTypeRow[]>('delivery', 'list_artifact_types', {});
  }

  createArtifactType(params: {
    artifact_type_name:     string;
    lifecycle_stage:        string;
    guidance_text:          string;
    sort_order:             number;
    primary_gate?:          string | null;
    gate_warning_behavior?: 'none' | 'primary_only' | 'primary_and_subsequent';
  }): Observable<McpResponse<ArtifactTypeRow>> {
    return this.mcp.call<ArtifactTypeRow>(
      'delivery', 'create_artifact_type', params as Record<string, unknown>
    );
  }

  updateArtifactType(params: {
    artifact_type_id:       string;
    artifact_type_name?:    string;
    lifecycle_stage?:       string;
    guidance_text?:         string;
    sort_order?:            number;
    primary_gate?:          string | null;
    gate_warning_behavior?: 'none' | 'primary_only' | 'primary_and_subsequent';
    active?:                boolean;
  }): Observable<McpResponse<ArtifactTypeRow>> {
    return this.mcp.call<ArtifactTypeRow>(
      'delivery', 'update_artifact_type', params as Record<string, unknown>
    );
  }

  // ── Jira link + sync ──────────────────────────────────────────────────────

  /** Creates (or updates) the jira_links row for an Initiative and mirrors the
   *  key to delivery_cycles.jira_epic_key. Must be called BEFORE syncJiraEpic —
   *  sync requires the link row to exist. */
  linkJiraEpic(params: {
    delivery_cycle_id: string;
    jira_epic_key:     string;
  }): Observable<McpResponse<JiraLink>> {
    return this.mcp.call<JiraLink>('delivery', 'link_jira_epic', params as Record<string, unknown>);
  }

  syncJiraEpic(params: {
    delivery_cycle_id: string;
    jira_epic_key:     string;
  }): Observable<McpResponse<{ jira_epic_key: string; sync_status: string; last_synced_at?: string; stub?: boolean; message?: string }>> {
    return this.mcp.call('delivery', 'sync_jira_epic', params as Record<string, unknown>);
  }
}
