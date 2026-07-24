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
  RoadmapTheme,
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
  CompletedActionItem,
  EpoWipLimitRow,
  InitiativeActivityPage,
  InitiativeActivityCount,
  ApprovedGateRow,
  MyCompletedGatesResponse,
  ArtifactTypeRow,
  GateDecisionResult,
  RoadmapFreezeDate,
  GateSkipConfirmResult,
  // Contract 29 (WS2/WS3)
  ConsultationResponse,
  GateConsultation,
  GateApproverConfig,
  GateApproverConfigRow,
  // Contract 37 (D-549–D-553)
  EffectiveSprintCalendar,
  GateDateRuleType,
  SprintAnchor,
  SetGateDateRuleResult,
  // Contract G1/G3 (D-558/D-562/D-567)
  InitiativeSizing,
  GovernanceDerivation,
  // Contract G4 (D-563/D-564)
  ParticipationRecord,
  SpecialtyGroup,
  DivisionDefaultConsulted,
  // Contract G6 (D-565)
  GateThreadMessage,
  GateConditionRecord
} from '../types/database';
import {
  LatestInitiativeStatus,
  SaveStatusResult,
  SaveInitiativeStatusParams,
  InitiativeStatusUpdate,
  AcknowledgeResult,
  MyStatusDueRow,
  MyAcknowledgmentDueRow,
  StatusRefreshResult,
  LastRunResult,
  InitiativeStatusDashboardRow
} from '../types/initiative-status';

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

  // ── Contract 32 — Initiative Status Updates (D-476–D-486) ───────────────────

  /** Trio member saves a status update. Confidence values write through to gate status (D-477). */
  saveInitiativeStatusUpdate(params: SaveInitiativeStatusParams): Observable<McpResponse<SaveStatusResult>> {
    return this.mcp.call<SaveStatusResult>('delivery', 'save_initiative_status_update', params as unknown as Record<string, unknown>);
  }

  /** Latest status + per-trio acknowledgment state + Needs Review reasons (D-485). */
  getLatestInitiativeStatus(initiative_id: string): Observable<McpResponse<LatestInitiativeStatus>> {
    return this.mcp.call<LatestInitiativeStatus>('delivery', 'get_latest_initiative_status', { initiative_id });
  }

  /** Reverse-chronological status history with acknowledgment lists (D-483). */
  getInitiativeStatusHistory(initiative_id: string, limit = 20): Observable<McpResponse<InitiativeStatusUpdate[]>> {
    return this.mcp.call<InitiativeStatusUpdate[]>('delivery', 'get_initiative_status_history', { initiative_id, limit });
  }

  /** Non-save trio member acknowledges the latest update (D-483). */
  acknowledgeStatusUpdate(status_update_id: string): Observable<McpResponse<AcknowledgeResult>> {
    return this.mcp.call<AcknowledgeResult>('delivery', 'acknowledge_status_update', { status_update_id });
  }

  /** My Initiative Status — Updates Due tab (D-484). */
  getMyStatusDue(): Observable<McpResponse<MyStatusDueRow[]>> {
    return this.mcp.call<MyStatusDueRow[]>('delivery', 'get_my_status_due', {});
  }

  /** My Initiative Status — Needs Acknowledgment tab (D-484). */
  getMyAcknowledgmentsDue(): Observable<McpResponse<MyAcknowledgmentDueRow[]>> {
    return this.mcp.call<MyAcknowledgmentDueRow[]>('delivery', 'get_my_acknowledgments_due', {});
  }

  /** Initiative Status Dashboard rows (D-485). */
  getInitiativeStatusDashboard(params: { division_ids?: string[]; needs_review_only?: boolean; initiative_id?: string } = {}):
    Observable<McpResponse<InitiativeStatusDashboardRow[]>> {
    return this.mcp.call<InitiativeStatusDashboardRow[]>('delivery', 'get_initiative_status_dashboard', params as Record<string, unknown>);
  }

  /** Contract 36 (D-512): dashboard polling change signal — boolean only. */
  statusDashboardChangedSince(since: string | null, division_ids?: string[]):
    Observable<McpResponse<{ changed: boolean; checked_at: string }>> {
    return this.mcp.call('delivery', 'status_dashboard_changed_since', {
      ...(since ? { since } : {}),
      ...(division_ids?.length ? { division_ids } : {})
    });
  }

  /** On-demand overdue refresh (D-482). */
  triggerStatusRefresh(): Observable<McpResponse<StatusRefreshResult>> {
    return this.mcp.call<StatusRefreshResult>('delivery', 'trigger_status_refresh', {});
  }

  /** Last refresh timestamp for the My Initiative Status header (D-484). */
  getStatusRefreshLastRun(): Observable<McpResponse<LastRunResult>> {
    return this.mcp.call<LastRunResult>('delivery', 'get_status_refresh_last_run', {});
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
    roadmap_theme_id?:        string | null;   // D-487: optional Theme tag
    // CC-38 f14: optional AI Governance profile at creation.
    ai_functionality?:        'yes' | 'no' | 'unknown';
    ai_delivery_form?:        'product_embedded' | 'analytics_outputs' | 'service_agent';
    ai_audience?:             'external' | 'internal';
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
    roadmap_theme_id?:       string | null;   // D-487: null clears the tag
    // CC-38 f13 (migration 075): AI Production Governance profile.
    ai_functionality?:       'yes' | 'no' | 'unknown' | null;
    ai_delivery_form?:       'product_embedded' | 'analytics_outputs' | 'service_agent' | null;
    ai_audience?:            'external' | 'internal' | null;
    ai_board_approved?:      boolean;
    // Contract G4: D-458 array params retired (migration 084) — the MCP tool
    // rejects them; participation is managed via the participation tools.
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
    include_event_log?:        boolean;   // D-446: when true, attaches target_date_change_events per cycle
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
    // D-489: optional "Why is this gate ready?" justification.
    submission_note?:  string;
  }): Observable<McpResponse<GateRecord>> {
    return this.mcp.call<GateRecord>('delivery', 'submit_gate_for_approval', params as Record<string, unknown>);
  }

  /** Contract 28 / D-447 / D-448: confirms a gate skip after the user accepts
   *  the REQUIRES_SKIP_CONFIRMATION interstitial. Backend rejects go_to_deploy
   *  in gates_to_skip and requires a TRIO caller (DCS, EPO, or DOL). */
  confirmGateSkip(params: {
    delivery_cycle_id: string;
    gates_to_skip:     GateName[];
    submitted_gate:    GateName;
  }): Observable<McpResponse<GateSkipConfirmResult>> {
    return this.mcp.call<GateSkipConfirmResult>(
      'delivery', 'confirm_gate_skip', params as Record<string, unknown>
    );
  }

  recordGateDecision(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    decision:          'approved' | 'returned';
    approver_notes?:   string;
    // Contract G8 (D-560): loud IE override — reason required server-side.
    ie_override?:      boolean;
    override_reason?:  string;
    // Contract G8 (D-569): reasoning when approving over a returned consultation.
    over_returned_reason?: string;
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

  /** Contract 30: actions the caller has completed — approver decisions
   *  (approved/returned) plus consultation responses. Powers the Completed tab. */
  listCompletedActions(): Observable<McpResponse<CompletedActionItem[]>> {
    return this.mcp.call<CompletedActionItem[]>('delivery', 'list_completed_actions', {});
  }

  // ── Gate consultation tools (Contract 29 WS2, D-459–D-462) ─────────────────

  /** A Consulted party records/updates their response on a gate consultation. */
  recordConsultationResponse(params: {
    gate_record_id: string;
    response:       ConsultationResponse;
    notes?:         string;
  }): Observable<McpResponse<GateConsultation>> {
    return this.mcp.call<GateConsultation>(
      'delivery', 'record_consultation_response', params as Record<string, unknown>
    );
  }

  /** All consultation rows for a gate (Consulted section, D-461). */
  listGateConsultations(gate_record_id: string): Observable<McpResponse<GateConsultation[]>> {
    return this.mcp.call<GateConsultation[]>(
      'delivery', 'list_gate_consultations', { gate_record_id }
    );
  }

  // ── Gate approver configuration tools (Contract 29 WS3, D-463/D-464) ───────

  /** Phil-only: upsert a per-Division, per-gate Accountable approver. */
  setGateApprover(params: {
    division_id:      string;
    gate_name:        GateName;
    approver_user_id: string;
  }): Observable<McpResponse<GateApproverConfig>> {
    return this.mcp.call<GateApproverConfig>(
      'delivery', 'set_gate_approver', params as Record<string, unknown>
    );
  }

  /** All gate approver configs, joined to divisions + users. */
  getGateApproverConfigs(): Observable<McpResponse<GateApproverConfigRow[]>> {
    return this.mcp.call<GateApproverConfigRow[]>('delivery', 'get_gate_approver_configs', {});
  }

  /** Phil-only: remove a config row; system falls back to escalation. */
  deleteGateApproverConfig(params: {
    division_id: string;
    gate_name:   GateName;
  }): Observable<McpResponse<{ division_id: string; gate_name: GateName; deleted: boolean }>> {
    return this.mcp.call('delivery', 'delete_gate_approver_config', params as Record<string, unknown>);
  }

  // ── Milestone date tools ───────────────────────────────────────────────────

  // D-502 null contract: explicit null CLEARS the date; a YYYY-MM-DD string sets it.
  setMilestoneTargetDate(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    target_date:       string | null;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'set_milestone_target_date', params as Record<string, unknown>);
  }

  // ── Contract 37 (D-550/D-551/D-552) — Sprint Calendars + Gate Date Rules ────

  /** D-550 ancestor walk. calendar null = no effective calendar → Date mode only. */
  getEffectiveSprintCalendar(divisionId: string): Observable<McpResponse<EffectiveSprintCalendar>> {
    return this.mcp.call<EffectiveSprintCalendar>('delivery', 'get_effective_sprint_calendar',
      { division_id: divisionId });
  }

  /**
   * D-551/D-552: resolve + save a gate target date rule. Two-call pattern —
   * a cascading save first returns { requires_confirmation, shifts } without
   * writing; re-call with confirmed: true to commit every listed shift.
   */
  setGateDateRule(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    rule: {
      date_rule_type:     GateDateRuleType;
      target_date?:       string | null;      // manual mode; null clears date + rule (D-501)
      rule_sprint_id?:    string;
      rule_anchor?:       SprintAnchor;
      rule_sprint_count?: number;
      rule_day_offset?:   number;
    };
    confirmed?: boolean;
  }): Observable<McpResponse<SetGateDateRuleResult>> {
    return this.mcp.call<SetGateDateRuleResult>('delivery', 'set_gate_date_rule', params as unknown as Record<string, unknown>);
  }

  // D-502 null contract: explicit null CLEARS the date (status untouched, D-503).
  setMilestoneActualDate(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    actual_date:       string | null;
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
    /** Contract 25 Part 2 follow-on: gate group key for ad-hoc attaches so
     *  Zone 6 renders them under the right group. Omit for type-bound attaches. */
    gate_affinity?:         string;
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

  /** Contract 25 Part 2 follow-on: edit an existing Initiative artifact's
   *  display_name and/or external_url. Auth (DCS/EPO/DOL/admin) enforced
   *  server-side. */
  updateArtifact(params: {
    cycle_artifact_id: string;
    display_name?:     string;
    external_url?:     string;
  }): Observable<McpResponse<CycleArtifact>> {
    return this.mcp.call<CycleArtifact>('delivery', 'update_cycle_artifact', params as Record<string, unknown>);
  }

  /** Contract 25 Part 2 follow-on: soft-delete an Initiative artifact.
   *  Auth (DCS/EPO/DOL/admin) enforced server-side. */
  detachArtifact(params: {
    cycle_artifact_id: string;
  }): Observable<McpResponse<CycleArtifact>> {
    return this.mcp.call<CycleArtifact>('delivery', 'detach_cycle_artifact', params as Record<string, unknown>);
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

  // ── Roadmap Themes (D-487) — Division-scoped vocabulary ──────────────────

  listRoadmapThemes(division_id?: string, include_inactive = false): Observable<McpResponse<RoadmapTheme[]>> {
    return this.mcp.call<RoadmapTheme[]>('delivery', 'list_roadmap_themes', {
      ...(division_id ? { division_id } : {}),
      ...(include_inactive ? { include_inactive: true } : {})
    });
  }

  createRoadmapTheme(division_id: string, name: string): Observable<McpResponse<RoadmapTheme>> {
    return this.mcp.call<RoadmapTheme>('delivery', 'create_roadmap_theme', { division_id, name });
  }

  updateRoadmapTheme(theme_id: string, patch: { name?: string; sort_order?: number; active?: boolean }): Observable<McpResponse<RoadmapTheme>> {
    return this.mcp.call<RoadmapTheme>('delivery', 'update_roadmap_theme', { theme_id, ...patch });
  }

  deactivateRoadmapTheme(theme_id: string): Observable<McpResponse<RoadmapTheme & { referencing_initiatives: number }>> {
    return this.mcp.call('delivery', 'deactivate_roadmap_theme', { theme_id });
  }

  // ── Artifact Type management (D-437 origin; D-438 Contract 25 schema) ────

  listArtifactTypes(): Observable<McpResponse<ArtifactTypeRow[]>> {
    return this.mcp.call<ArtifactTypeRow[]>('delivery', 'list_artifact_types', {});
  }

  createArtifactType(params: {
    artifact_type_name:     string;
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

  // ── Contract 27 — Deploy Roadmap Baselines (D-444) ────────────────────────

  /** Any authenticated user — deploy views call this for the baseline selector. */
  listRoadmapFreezeDates(): Observable<McpResponse<RoadmapFreezeDate[]>> {
    return this.mcp.call<RoadmapFreezeDate[]>('delivery', 'list_roadmap_freeze_dates', {});
  }

  /** Admin only. Returns DUPLICATE_DATE in data.code on freeze_date collision. */
  createRoadmapFreezeDate(params: {
    freeze_date:  string;     // ISO YYYY-MM-DD
    freeze_label: string;
  }): Observable<McpResponse<RoadmapFreezeDate>> {
    return this.mcp.call<RoadmapFreezeDate>(
      'delivery', 'create_roadmap_freeze_date', params as Record<string, unknown>
    );
  }

  /** Admin only. */
  updateRoadmapFreezeDate(params: {
    freeze_date_id: string;
    freeze_date?:   string;
    freeze_label?:  string;
  }): Observable<McpResponse<RoadmapFreezeDate>> {
    return this.mcp.call<RoadmapFreezeDate>(
      'delivery', 'update_roadmap_freeze_date', params as Record<string, unknown>
    );
  }

  /** Admin only. Soft-delete (CC-27-1) — clears the active uniqueness slot. */
  deleteRoadmapFreezeDate(params: {
    freeze_date_id: string;
  }): Observable<McpResponse<{ deleted: true; freeze_date_id: string }>> {
    return this.mcp.call<{ deleted: true; freeze_date_id: string }>(
      'delivery', 'delete_roadmap_freeze_date', params as Record<string, unknown>
    );
  }

  // ── Contract G1/G3 — sizing + governance level (D-558, D-562, D-567) ───────

  getInitiativeSizing(params: { delivery_cycle_id: string }):
    Observable<McpResponse<{ sizing: InitiativeSizing | null; is_sized: boolean }>> {
    return this.mcp.call<{ sizing: InitiativeSizing | null; is_sized: boolean }>(
      'delivery', 'get_initiative_sizing', params as unknown as Record<string, unknown>
    );
  }

  /** Saves sizing; recomputes + caches baseline. Post-Go-to-Build edits return
   *  status REQUIRES_APPROVER_CONFIRMATION until approver_confirmed=true (G3). */
  upsertInitiativeSizing(params: {
    delivery_cycle_id:   string;
    answers:             SizingAnswers;
    subs?:               SizingSubs;
    notes?:              SizingNotes;
    approver_confirmed?: boolean;
  }): Observable<McpResponse<SizingSaveResult>> {
    return this.mcp.call<SizingSaveResult>(
      'delivery', 'upsert_initiative_sizing', params as unknown as Record<string, unknown>
    );
  }

  deriveGovernance(params: { delivery_cycle_id: string }):
    Observable<McpResponse<GovernanceDerivation>> {
    return this.mcp.call<GovernanceDerivation>(
      'delivery', 'derive_governance', params as unknown as Record<string, unknown>
    );
  }

  /** Stateless preview for the creation form's live Governance panel (G3). */
  previewGovernanceDerivation(params: {
    answers:      SizingAnswers;
    subs?:        SizingSubs;
    dcs_user_id?: string;
  }): Observable<McpResponse<{
    baseline_level: 1 | 2 | 3; explanation_chips: string[]; alerts: string[]; dcs_trusted: boolean;
  }>> {
    return this.mcp.call<{
      baseline_level: 1 | 2 | 3; explanation_chips: string[]; alerts: string[]; dcs_trusted: boolean;
    }>('delivery', 'preview_governance_derivation', params as unknown as Record<string, unknown>);
  }

  /** Admin → Divisions banner: non-leadership configs in L3 Divisions (G3, D-570c). */
  getGovernanceConfigWarnings(): Observable<McpResponse<{ config_warnings: GovernanceConfigWarning[] }>> {
    return this.mcp.call<{ config_warnings: GovernanceConfigWarning[] }>(
      'delivery', 'get_governance_config_warnings', {}
    );
  }

  // ── Contract G4 — participation (D-563/D-564) ───────────────────────────────

  listParticipation(params: { delivery_cycle_id: string; include_removed?: boolean }):
    Observable<McpResponse<{ participation_records: ParticipationRecord[] }>> {
    return this.mcp.call<{ participation_records: ParticipationRecord[] }>(
      'delivery', 'list_participation', params as unknown as Record<string, unknown>
    );
  }

  /** "Initiatives I'm following" — the caller's active C/I stakes with Initiative context. */
  listMyParticipation(): Observable<McpResponse<{ participation_records: ParticipationRecord[] }>> {
    return this.mcp.call<{ participation_records: ParticipationRecord[] }>(
      'delivery', 'list_my_participation', {}
    );
  }

  addParticipation(params: {
    delivery_cycle_id: string;
    letter:            'C' | 'I';
    holder_user_id?:   string;
    holder_group_id?:  string;
    set_via:           'trio' | 'self' | 'rule' | 'division_default' | 'approver' | 'leadership';
  }): Observable<McpResponse<ParticipationRecord>> {
    return this.mcp.call<ParticipationRecord>(
      'delivery', 'add_participation', params as unknown as Record<string, unknown>
    );
  }

  /** Note required when the remover is not the holder (D-564). */
  removeParticipation(params: { record_id: string; note?: string }):
    Observable<McpResponse<ParticipationRecord>> {
    return this.mcp.call<ParticipationRecord>(
      'delivery', 'remove_participation', params as unknown as Record<string, unknown>
    );
  }

  listSpecialtyGroups(): Observable<McpResponse<{ specialty_groups: SpecialtyGroup[] }>> {
    return this.mcp.call<{ specialty_groups: SpecialtyGroup[] }>(
      'delivery', 'list_specialty_groups', {}
    );
  }

  listDivisionDefaultConsulteds(params: { division_id: string }):
    Observable<McpResponse<{ division_default_consulteds: DivisionDefaultConsulted[] }>> {
    return this.mcp.call<{ division_default_consulteds: DivisionDefaultConsulted[] }>(
      'delivery', 'list_division_default_consulteds', params as unknown as Record<string, unknown>
    );
  }

  addDivisionDefaultConsulted(params: {
    division_id: string; holder_user_id?: string; holder_group_id?: string;
  }): Observable<McpResponse<DivisionDefaultConsulted>> {
    return this.mcp.call<DivisionDefaultConsulted>(
      'delivery', 'add_division_default_consulted', params as unknown as Record<string, unknown>
    );
  }

  removeDivisionDefaultConsulted(params: { default_consulted_id: string }):
    Observable<McpResponse<{ default_consulted_id: string; removed: boolean }>> {
    return this.mcp.call<{ default_consulted_id: string; removed: boolean }>(
      'delivery', 'remove_division_default_consulted', params as unknown as Record<string, unknown>
    );
  }

  // ── Contract G6 — gate thread + conditions (D-565) ──────────────────────────

  listGateThread(params: { gate_record_id: string }):
    Observable<McpResponse<{ gate_thread_messages: GateThreadMessage[] }>> {
    return this.mcp.call<{ gate_thread_messages: GateThreadMessage[] }>(
      'delivery', 'list_gate_thread', params as unknown as Record<string, unknown>
    );
  }

  addGateThreadMessage(params: { gate_record_id: string; text: string }):
    Observable<McpResponse<GateThreadMessage>> {
    return this.mcp.call<GateThreadMessage>(
      'delivery', 'add_gate_thread_message', params as unknown as Record<string, unknown>
    );
  }

  listGateConditions(params: { gate_record_id: string }):
    Observable<McpResponse<{ gate_conditions: GateConditionRecord[] }>> {
    return this.mcp.call<{ gate_conditions: GateConditionRecord[] }>(
      'delivery', 'list_gate_conditions', params as unknown as Record<string, unknown>
    );
  }

  addGateCondition(params: {
    gate_record_id: string;
    type: 'general' | 'consultation_required';
    text: string;
    target_consultation_id?: string;
  }): Observable<McpResponse<GateConditionRecord>> {
    return this.mcp.call<GateConditionRecord>(
      'delivery', 'add_gate_condition', params as unknown as Record<string, unknown>
    );
  }

  resolveGateCondition(params: { condition_id: string; note?: string }):
    Observable<McpResponse<GateConditionRecord>> {
    return this.mcp.call<GateConditionRecord>(
      'delivery', 'resolve_gate_condition', params as unknown as Record<string, unknown>
    );
  }

  // ── Contract G9 — the two hardcoded suggestion rules (D-563 Grade 2) ────────

  getSuggestionState(params: { delivery_cycle_id: string }):
    Observable<McpResponse<{ suggestions: SuggestionState[] }>> {
    return this.mcp.call<{ suggestions: SuggestionState[] }>(
      'delivery', 'get_suggestion_state', params as unknown as Record<string, unknown>
    );
  }

  /** Add attaches the group as Consulted; dismiss requires a note (S-C7). */
  applySuggestionDecision(params: {
    delivery_cycle_id: string;
    rule_key: 'q4_security' | 'q5_ux';
    action: 'add' | 'dismiss';
    note?: string;
  }): Observable<McpResponse<{ rule_key: string; action: string; group_name: string }>> {
    return this.mcp.call<{ rule_key: string; action: string; group_name: string }>(
      'delivery', 'apply_suggestion_decision', params as unknown as Record<string, unknown>
    );
  }

  // ── Contract G8 — governance level controls (D-562, S-C6 prompt) ───────────

  setEffectiveLevel(params: { delivery_cycle_id: string; level: 1 | 2 | 3; reason: string }):
    Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>(
      'delivery', 'set_effective_level', params as unknown as Record<string, unknown>
    );
  }

  clearEffectiveLevel(params: { delivery_cycle_id: string; reason: string }):
    Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>(
      'delivery', 'clear_effective_level', params as unknown as Record<string, unknown>
    );
  }

  // ── Contract G8 — Initiative Executive (D-560) ──────────────────────────────

  /** Phil-only grant/revoke. */
  setInitiativeExecutive(params: { user_id: string; granted: boolean; note?: string }):
    Observable<McpResponse<{ user_id: string; display_name: string; is_initiative_executive: boolean }>> {
    return this.mcp.call<{ user_id: string; display_name: string; is_initiative_executive: boolean }>(
      'delivery', 'set_initiative_executive', params as unknown as Record<string, unknown>
    );
  }

  /** IE/Admin pull-only monitoring view. */
  listAllPendingGates(): Observable<McpResponse<{
    pending_gates: AllPendingGateRow[]; aging_threshold_days: number;
  }>> {
    return this.mcp.call<{ pending_gates: AllPendingGateRow[]; aging_threshold_days: number }>(
      'delivery', 'list_all_pending_gates', {}
    );
  }
}

/** Contract G9 (D-563): one suggestion rule's state on an Initiative. */
export interface SuggestionState {
  rule_key:             'q4_security' | 'q5_ux';
  group_id:             string;
  group_name:           string;
  label:                string;
  rationale:            string;
  applies:              boolean;
  attached:             boolean;
  dismissed:            boolean;
  dismissal_note:       string | null;
  dismissed_by_user_id: string | null;
  live:                 boolean;
}

/** Contract G8 (D-560): one row of the All Pending Gates view. */
export interface AllPendingGateRow {
  gate_record_id:              string;
  delivery_cycle_id:           string;
  cycle_title:                 string;
  gate_name:                   GateName;
  gate_name_display:           string;
  division_id:                 string | null;
  division_display_name_short: string;
  effective_level:             1 | 2 | 3 | null;
  approver_user_id:            string | null;
  approver_display_name:       string | null;
  submitted_at:                string;
  days_waiting:                number;
  aging:                       boolean;
  waiting_on:                  { state: string; line: string; days_waiting: number } | null;
}

// ── Contract G3 payload shapes ────────────────────────────────────────────────
export interface SizingAnswers {
  q1_investment:      'small' | 'medium' | 'large' | 'xlarge';
  q2_novelty:         'standard' | 'major';
  q3_wrongness:       'contained' | 'significant' | 'large_hard';
  q4_security_impact: boolean;
  q5_ux:              'standard' | 'critical';
}
export interface SizingSubs {
  q1_sub_engineering?: 'small' | 'medium' | 'large' | 'xlarge';
  q1_sub_operational?: 'small' | 'medium' | 'large' | 'xlarge';
  q2_sub_persona?:     'well_known' | 'new';
  q2_sub_scenarios?:   'highly_studied' | 'in_discovery';
  q2_sub_technology?:  'standard' | 'new_untried';
  q2_sub_new_vendor?:  boolean;
  q3_sub_blast?:       'contained_internal' | 'external_large';
  q3_sub_correctable?: 'easy' | 'difficult';
  q5_sub_facing?:      'none' | 'patient' | 'provider_clinical';
  q5_sub_application?: 'established' | 'new_application';
}
export interface SizingNotes {
  q1_note?: string; q2_note?: string; q3_note?: string; q4_note?: string; q5_note?: string;
}
export interface SizingSaveResult {
  sizing:          InitiativeSizing;
  baseline_level:  1 | 2 | 3 | null;
  effective_level: 1 | 2 | 3 | null;
  alerts:          string[];
  /** Present on the REQUIRES_APPROVER_CONFIRMATION preview response instead. */
  current_baseline_level?: 1 | 2 | 3 | null;
  new_baseline_level?:     1 | 2 | 3 | null;
  message?:                string;
}
export interface GovernanceConfigWarning {
  division_id:           string;
  division_name:         string | null;
  gate_name:             GateName;
  approver_user_id:      string;
  approver_display_name: string | null;
  l3_initiative_count:   number;
}
