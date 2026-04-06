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
  DeliverySummary
} from '../types/database';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  constructor(private readonly mcp: McpService) {}

  // ── Workstream tools ───────────────────────────────────────────────────────

  createWorkstream(params: {
    workstream_name:       string;
    home_division_id:      string;
    workstream_lead_user_id: string;
  }): Observable<McpResponse<DeliveryWorkstream>> {
    return this.mcp.call<DeliveryWorkstream>('delivery', 'create_delivery_workstream', params as Record<string, unknown>);
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
    assigned_ds_user_id?:     string;          // optional — D-174: required before Brief Review gate
    assigned_cb_user_id?:     string;          // optional — D-174: required before Go to Build gate
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
    assigned_to_current_user?: boolean;   // Build C supplement: when true, returns only cycles where caller is DS or CB
  } = {}): Observable<McpResponse<DeliveryCycle[]>> {
    return this.mcp.call<DeliveryCycle[]>('delivery', 'list_delivery_cycles', params as Record<string, unknown>);
  }

  assignDsCb(params: {
    delivery_cycle_id:     string;
    assigned_ds_user_id?:  string | null;
    assigned_cb_user_id?:  string | null;
  }): Observable<McpResponse<DeliveryCycle>> {
    return this.mcp.call<DeliveryCycle>('delivery', 'assign_ds_cb_to_cycle', params as Record<string, unknown>);
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
  }): Observable<McpResponse<GateRecord>> {
    return this.mcp.call<GateRecord>('delivery', 'record_gate_decision', params as Record<string, unknown>);
  }

  // ── Milestone date tools ───────────────────────────────────────────────────

  setMilestoneTargetDate(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    target_date:       string;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'set_milestone_target_date', params as Record<string, unknown>);
  }

  updateMilestoneStatus(params: {
    delivery_cycle_id:      string;
    gate_name:              GateName;
    date_status:            DateStatus;
    status_override_reason?: string;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'update_milestone_status', params as Record<string, unknown>);
  }

  // Session 2026-03-24-F: manual actual date entry for data quality path
  setMilestoneActualDate(params: {
    delivery_cycle_id: string;
    gate_name:         GateName;
    actual_date:       string;
    manually_entered:  boolean;
  }): Observable<McpResponse<CycleMilestoneDate>> {
    return this.mcp.call<CycleMilestoneDate>('delivery', 'set_milestone_actual_date', params as Record<string, unknown>);
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
   * D-189: NEXT_GATE_BY_STAGE computed server-side.
   * D-190: WIP category counts and exceeded flags computed server-side.
   */
  getDeliverySummary(params: {
    division_ids?: string[];
  } = {}): Observable<McpResponse<DeliverySummary>> {
    return this.mcp.call<DeliverySummary>('delivery', 'get_delivery_summary', params as Record<string, unknown>);
  }

  // ── Jira sync ──────────────────────────────────────────────────────────────

  syncJiraEpic(params: {
    delivery_cycle_id: string;
    jira_epic_key:     string;
  }): Observable<McpResponse<{ jira_epic_key: string; sync_status: string; last_synced_at?: string; stub?: boolean; message?: string }>> {
    return this.mcp.call('delivery', 'sync_jira_epic', params as Record<string, unknown>);
  }
}
