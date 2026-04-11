import {
  McpService
} from "./chunk-SQSDYRWS.js";

// src/app/core/services/delivery.service.ts
import { Injectable } from "@angular/core";
import * as i0 from "@angular/core";
var DeliveryService = class _DeliveryService {
  constructor(mcp) {
    this.mcp = mcp;
  }
  // ── Workstream tools ───────────────────────────────────────────────────────
  createWorkstream(params) {
    return this.mcp.call("delivery", "create_delivery_workstream", params);
  }
  listWorkstreams(params = {}) {
    return this.mcp.call("delivery", "list_delivery_workstreams", params);
  }
  updateWorkstreamActiveStatus(params) {
    return this.mcp.call("delivery", "update_workstream_active_status", params);
  }
  // ── Delivery Cycle tools ───────────────────────────────────────────────────
  createCycle(params) {
    return this.mcp.call("delivery", "create_delivery_cycle", params);
  }
  // Update mutable fields on a Delivery Cycle. Only supplied fields are changed.
  // D-229: logs field_edit event per changed field. CC-Decision-2026-04-10-D.
  updateCycle(params) {
    return this.mcp.call("delivery", "update_delivery_cycle", params);
  }
  getCycle(delivery_cycle_id) {
    return this.mcp.call("delivery", "get_delivery_cycle", { delivery_cycle_id });
  }
  listCycles(params = {}) {
    return this.mcp.call("delivery", "list_delivery_cycles", params);
  }
  assignDsCb(params) {
    return this.mcp.call("delivery", "assign_ds_cb_to_cycle", params);
  }
  advanceStage(delivery_cycle_id) {
    return this.mcp.call("delivery", "advance_cycle_stage", { delivery_cycle_id });
  }
  /**
   * D-179: Two-call pattern for stage regression.
   * Without confirmed → returns preview ({ requires_confirmation, target_stage, gates_to_reset, warning }).
   * With confirmed:true → executes regression, returns updated DeliveryCycle.
   */
  reverseStage(params) {
    return this.mcp.call("delivery", "reverse_cycle_stage", params);
  }
  setOnHold(params) {
    return this.mcp.call("delivery", "set_cycle_on_hold", params);
  }
  resumeFromHold(delivery_cycle_id) {
    return this.mcp.call("delivery", "resume_cycle_from_hold", { delivery_cycle_id });
  }
  cancelCycle(delivery_cycle_id) {
    return this.mcp.call("delivery", "cancel_delivery_cycle", { delivery_cycle_id });
  }
  uncancelCycle(delivery_cycle_id) {
    return this.mcp.call("delivery", "uncancel_delivery_cycle", { delivery_cycle_id });
  }
  setOutcomeStatement(params) {
    return this.mcp.call("delivery", "set_outcome_statement", params);
  }
  // ── Gate tools ─────────────────────────────────────────────────────────────
  submitGateForApproval(params) {
    return this.mcp.call("delivery", "submit_gate_for_approval", params);
  }
  recordGateDecision(params) {
    return this.mcp.call("delivery", "record_gate_decision", params);
  }
  // ── Milestone date tools ───────────────────────────────────────────────────
  setMilestoneTargetDate(params) {
    return this.mcp.call("delivery", "set_milestone_target_date", params);
  }
  setMilestoneActualDate(params) {
    return this.mcp.call("delivery", "set_milestone_actual_date", params);
  }
  updateMilestoneStatus(params) {
    return this.mcp.call("delivery", "update_milestone_status", params);
  }
  // ── Artifact tools ─────────────────────────────────────────────────────────
  attachArtifact(params) {
    return this.mcp.call("delivery", "attach_cycle_artifact", params);
  }
  promoteArtifact(params) {
    return this.mcp.call("delivery", "promote_artifact_to_oi_library", params);
  }
  // ── Event log ──────────────────────────────────────────────────────────────
  getEventLog(delivery_cycle_id) {
    return this.mcp.call("delivery", "get_cycle_event_log", { delivery_cycle_id });
  }
  // ── Dashboard summary (D-171–D-176) ───────────────────────────────────────
  /**
   * Returns pre-aggregated summary data for all three hub sub-views.
   * Optionally filtered to specific division IDs (pass empty/omit for all accessible).
   * D-173: NEXT_GATE_BY_STAGE computed server-side.
   * D-174: WIP category counts and exceeded flags computed server-side.
   */
  getDeliverySummary(params = {}) {
    return this.mcp.call("delivery", "get_delivery_summary", params);
  }
  // ── Jira sync ──────────────────────────────────────────────────────────────
  syncJiraEpic(params) {
    return this.mcp.call("delivery", "sync_jira_epic", params);
  }
  static {
    this.\u0275fac = function DeliveryService_Factory(t) {
      return new (t || _DeliveryService)(i0.\u0275\u0275inject(McpService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({ token: _DeliveryService, factory: _DeliveryService.\u0275fac, providedIn: "root" });
  }
};

export {
  DeliveryService
};
//# sourceMappingURL=chunk-65IKJVPJ.js.map
