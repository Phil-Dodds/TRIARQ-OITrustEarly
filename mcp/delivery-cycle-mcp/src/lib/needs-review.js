// needs-review.js — Contract 32 (Initiative Status Updates)
// Shared "Needs Review Reason" computation (D-485, D-486). Used by
// get_latest_initiative_status (WS2) and get_initiative_status_dashboard (WS4)
// so the reason logic has a single definition.
//
// D-486 gate-date-slip detection reuses the EXISTING cycle_event_log mechanism
// (CC-32-1) — event_type 'milestone_target_date_changed' carries old/new dates.
// No gate_date_history table was created.

'use strict';

const GATE_LABELS = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const CADENCE_INTERVAL_DAYS = { weekly: 7, triweekly: 21, monthly: 30 };
const AT_RISK_STATES = ['at_risk', 'behind'];

/**
 * Resolve the cadence interval (in days) for a Division via the shared upward
 * walk (D-481). Returns null when no config exists in the chain (slip not
 * evaluated per D-486).
 */
async function resolveCadenceIntervalDays(supabase, division_id) {
  if (!division_id) { return null; }
  const { data, error } = await supabase
    .rpc('resolve_division_status_config', { p_division_id: division_id });
  if (error) { return null; }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.cadence) { return null; }
  return CADENCE_INTERVAL_DAYS[row.cadence] ?? null;
}

/**
 * Gate labels that slipped within the cadence window (D-486): a
 * milestone_target_date_changed event where new_target_date > old_target_date
 * and changed_at >= now() − cadence_interval. Empty when no cadence config.
 */
async function computeSlippedGateLabels(supabase, delivery_cycle_id, cadenceIntervalDays) {
  if (!cadenceIntervalDays) { return []; }
  const sinceIso = new Date(Date.now() - cadenceIntervalDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: events, error } = await supabase
    .from('cycle_event_log')
    .select('event_metadata, created_at')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('event_type', 'milestone_target_date_changed')
    .gte('created_at', sinceIso);

  if (error || !events) { return []; }

  const labels = new Set();
  for (const ev of events) {
    const m = ev.event_metadata || {};
    const oldD = m.old_target_date;
    const newD = m.new_target_date;
    // slip = a later date than before (push-out). Null old (first set) is not a slip.
    if (oldD && newD && new Date(newD) > new Date(oldD)) {
      labels.add(GATE_LABELS[m.gate_name] || m.gate_name);
    }
  }
  return Array.from(labels);
}

/**
 * Full Needs Review reason list for one Initiative (D-485 conditions).
 * @param supabase       service-role client
 * @param cycle          { delivery_cycle_id, division_id, status_overdue }
 * @param latestUpdate   latest initiative_status_updates row or null
 * @param milestones     array of { gate_name, date_status }
 * @returns string[] (empty when nothing needs review)
 */
async function computeNeedsReviewReasons(supabase, cycle, latestUpdate, milestones) {
  const reasons = [];

  // 1) Escalation flagged
  if (latestUpdate && latestUpdate.escalation_needed === true) {
    reasons.push('Escalation flagged');
  }

  // 2) Status overdue
  if (cycle.status_overdue === true) {
    reasons.push('Status overdue');
  }

  // 3) Gate date slipped within cadence period (D-486)
  const intervalDays = await resolveCadenceIntervalDays(supabase, cycle.division_id);
  const slipped = await computeSlippedGateLabels(supabase, cycle.delivery_cycle_id, intervalDays);
  for (const label of slipped) {
    reasons.push(`Gate date slipped: ${label}`);
  }

  // 4) At risk — confidence values and/or gate date_status at_risk/behind
  const atRiskLabels = new Set();
  if (latestUpdate) {
    if (latestUpdate.pilot_confidence_applicable && AT_RISK_STATES.includes(latestUpdate.pilot_confidence)) {
      atRiskLabels.add(GATE_LABELS.go_to_deploy);
    }
    if (latestUpdate.close_confidence_applicable && AT_RISK_STATES.includes(latestUpdate.close_confidence)) {
      atRiskLabels.add(GATE_LABELS.close_review);
    }
  }
  for (const m of (milestones || [])) {
    if (AT_RISK_STATES.includes(m.date_status)) {
      atRiskLabels.add(GATE_LABELS[m.gate_name] || m.gate_name);
    }
  }
  for (const label of atRiskLabels) {
    reasons.push(`At risk: ${label}`);
  }

  return reasons;
}

module.exports = {
  GATE_LABELS,
  CADENCE_INTERVAL_DAYS,
  resolveCadenceIntervalDays,
  computeSlippedGateLabels,
  computeNeedsReviewReasons
};
