// initiative-status.ts — Contract 32 (Initiative Status Updates)
// Shared types for the status update panel, history panel, My Initiative Status,
// and Initiative Status Dashboard. Confidence values reuse DateStatus (D-477).

import { DateStatus } from './database';

/** Confidence is a subset of the five user-controlled milestone statuses (D-477). */
export type StatusConfidence = Extract<DateStatus,
  'not_started' | 'on_track' | 'at_risk' | 'behind' | 'complete'>;

export interface InitiativeStatusUpdate {
  id:                          string;
  initiative_id:               string;
  accomplished_last_cycle:     string | null;
  plan_next_cycle:             string | null;
  blockers:                    string | null;
  escalation_needed:           boolean;
  pilot_confidence:            StatusConfidence | null;
  close_confidence:            StatusConfidence | null;
  pilot_confidence_applicable: boolean;
  close_confidence_applicable: boolean;
  saved_by:                    string;
  saved_at:                    string;
  // Contract 36 (D-507): edit chain — null on original saves.
  supersedes_update_id?:       string | null;
  // Enriched by history tool:
  saved_by_name?:              string;
  acknowledged_by?:            AckEntry[];
}

export interface AckEntry {
  user_id:         string;
  display_name:    string;
  acknowledged_at: string;
}

/** Per-trio acknowledgment state on the latest update.
 *  Contract 36 (D-513): one chip per trio member (non-trio-authored updates only);
 *  acknowledged_earlier marks acks against an earlier chain version (D-507). */
export interface TrioAckStatus {
  role:            'DOL' | 'DCS' | 'EPO';
  user_id:         string;
  display_name:    string;
  acknowledged:    boolean;
  acknowledged_at: string | null;
  acknowledged_earlier?:    boolean;
  earlier_acknowledged_at?: string | null;
}

/** Contract 36 (D-507): chain context on the latest update. */
export interface StatusChainInfo {
  root_saved_at:    string;
  is_edited:        boolean;
  edit_window_open: boolean;
}

export interface LatestInitiativeStatus {
  initiative_id:        string;
  latest:               InitiativeStatusUpdate | null;
  saved_by_name:        string | null;
  // Contract 36: null when no update; false → non-trio author (chips render).
  is_trio_author?:      boolean | null;
  chain?:               StatusChainInfo | null;
  // D-514: 'weekly' | 'triweekly' | 'monthly' | null (unconfigured → omit phrase).
  resolved_cadence?:    string | null;
  /** D-482 amendment (2026-07-14): next division meeting date — drives the
   *  amber "Update due for meeting" nudge client-side. */
  status_due_at?:       string | null;
  acknowledgments:      TrioAckStatus[];
  needs_review_reasons: string[];
}

export interface SaveStatusResult {
  status_update_id: string;
  saved_at:         string;
  is_edit?:         boolean;
  is_trio_author?:  boolean;
}

export interface AcknowledgeResult {
  acknowledgment_id: string;
  acknowledged_at:   string;
}

export interface SaveInitiativeStatusParams {
  initiative_id:            string;
  accomplished_last_cycle?: string | null;
  plan_next_cycle?:         string | null;
  blockers?:                string | null;
  escalation_needed:        boolean;
  pilot_confidence?:        StatusConfidence | null;
  close_confidence?:        StatusConfidence | null;
  // Contract 36 (D-507): edit path — supersedes the initiative's latest update.
  supersedes_update_id?:    string;
}

// ── My Initiative Status (D-484) ──────────────────────────────────────────────
export interface MyStatusDueRow {
  initiative_id: string;
  cycle_title:   string;
  division_name: string | null;
  last_saved_at: string | null;
  cadence:       string | null;
  status_due_at: string | null;
}

export interface MyAcknowledgmentDueRow {
  initiative_id:    string;
  cycle_title:      string;
  division_name:    string | null;
  saved_by_name:    string;
  saved_at:         string;
  status_update_id: string;
}

export interface StatusRefreshResult {
  last_run:              string | null;
  initiatives_processed: number;
}

export interface LastRunResult {
  last_run: string | null;
}

// ── Initiative Status Dashboard (D-485, amended D-510/D-511 Contract 36) ──────
export interface InitiativeStatusDashboardRow {
  initiative_id:           string;
  cycle_title:             string;
  division_id:             string;
  division_name:           string | null;
  division_display_name_short: string | null;
  current_lifecycle_stage: string;
  status_overdue:          boolean;
  /** D-482 amendment (2026-07-14): next division meeting date (amber nudge input). */
  status_due_at?:          string | null;
  // D-510: Next Gate + Target Date (shared gate resolution)
  next_gate_label:         string | null;
  next_gate_name:          string | null;
  next_gate_target_date:   string | null;
  /** Contract 36 UAT: the next gate is submitted and awaiting approval. */
  next_gate_pending_approval?: boolean;
  // D-510: Team column (grid parity) + D-511 person filters
  assigned_dcs_user_id:    string | null;
  assigned_epo_user_id:    string | null;
  assigned_dol_user_id:    string | null;
  assigned_dcs_display_name: string | null;
  assigned_epo_display_name: string | null;
  assigned_dol_display_name: string | null;
  // D-510 merged Updated By + D-507 chain-root age
  saved_by_name:           string | null;
  is_trio_author:          boolean | null;
  saved_at:                string | null;
  root_saved_at:           string | null;
  status_update_id:        string | null;
  escalation_needed:       boolean;
  pilot_confidence:        StatusConfidence | null;
  close_confidence:        StatusConfidence | null;
  needs_review_reasons:    string[];
}
