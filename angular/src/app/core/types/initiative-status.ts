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
  // Enriched by history tool:
  saved_by_name?:              string;
  acknowledged_by?:            AckEntry[];
}

export interface AckEntry {
  user_id:         string;
  display_name:    string;
  acknowledged_at: string;
}

/** Per-trio acknowledgment state on the latest update (save user excluded). */
export interface TrioAckStatus {
  role:            'DOL' | 'DCS' | 'EPO';
  user_id:         string;
  display_name:    string;
  acknowledged:    boolean;
  acknowledged_at: string | null;
}

export interface LatestInitiativeStatus {
  initiative_id:        string;
  latest:               InitiativeStatusUpdate | null;
  saved_by_name:        string | null;
  acknowledgments:      TrioAckStatus[];
  needs_review_reasons: string[];
}

export interface SaveStatusResult {
  status_update_id: string;
  saved_at:         string;
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

// ── Initiative Status Dashboard (D-485) ───────────────────────────────────────
export interface InitiativeStatusDashboardRow {
  initiative_id:           string;
  cycle_title:             string;
  division_id:             string;
  division_name:           string | null;
  current_lifecycle_stage: string;
  status_overdue:          boolean;
  saved_by_name:           string | null;
  saved_at:                string | null;
  escalation_needed:       boolean;
  pilot_confidence:        StatusConfidence | null;
  close_confidence:        StatusConfidence | null;
  needs_review_reasons:    string[];
}
