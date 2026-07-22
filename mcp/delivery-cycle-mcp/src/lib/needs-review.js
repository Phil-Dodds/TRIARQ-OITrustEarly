// needs-review.js — Contract 32 (Initiative Status Updates)
// Shared "Needs Review Reason" computation (D-485, D-486). Used by
// get_latest_initiative_status (WS2) and get_initiative_status_dashboard (WS4)
// so the reason logic has a single definition.
//
// D-486 gate-date-slip detection reuses the EXISTING cycle_event_log mechanism
// (CC-32-1) — event_type 'milestone_target_date_changed' carries old/new dates.
// No gate_date_history table was created.

'use strict';

const { resolveNextGate } = require('./gate-resolution');

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
  const cadence = await resolveCadenceName(supabase, division_id);
  return cadence ? (CADENCE_INTERVAL_DAYS[cadence] ?? null) : null;
}

/**
 * D-514: resolve the cadence NAME ('weekly' | 'triweekly' | 'monthly' | null)
 * for a Division via the D-481 upward walk. Null = unconfigured (exempt) —
 * consumers omit the cadence phrase entirely.
 */
async function resolveCadenceName(supabase, division_id) {
  if (!division_id) { return null; }
  const { data, error } = await supabase
    .rpc('resolve_division_status_config', { p_division_id: division_id });
  if (error) { return null; }
  const row = Array.isArray(data) ? data[0] : data;
  return row?.cadence ?? null;
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

  return aggregateSlipLine(events);
}

/** CC-38 f25: pure aggregation — shared by the per-cycle query path and the
 *  dashboard's batched prefetch path (N+1 fix). */
function aggregateSlipLine(events) {
  // CC-38-44 wording: one aggregated line, no gate names — total days the
  // target dates were pushed out within the cadence window.
  let movedDays = 0;
  for (const ev of events || []) {
    const m = ev.event_metadata || {};
    const oldD = m.old_target_date;
    const newD = m.new_target_date;
    // slip = a later date than before (push-out). Null old (first set) is not a
    // slip; null new (D-501 clear) is not a slip either — both excluded here.
    if (oldD && newD && new Date(newD) > new Date(oldD)) {
      movedDays += Math.round((new Date(newD) - new Date(oldD)) / 86400000);
    }
  }
  return movedDays > 0
    ? [`Gate Date Moved +${movedDays} day${movedDays === 1 ? '' : 's'}`]
    : [];
}

/**
 * Full Needs Review reason list for one Initiative (D-485 conditions,
 * D-482 final model 2026-07-14).
 * @param supabase       service-role client
 * @param cycle          { delivery_cycle_id, division_id, status_overdue }
 * @param latestUpdate   latest initiative_status_updates row or null
 * @param milestones     array of { gate_name, date_status, target_date }
 * @returns string[] (empty when nothing needs review)
 */
async function computeNeedsReviewReasons(supabase, cycle, latestUpdate, milestones, prefetch = {}) {
  // CC-38 f25 (N+1 fix): the dashboard batches cadence intervals, slip
  // events, and gate records ONCE and passes them here — no per-row queries.
  // Single-initiative callers omit prefetch and keep the query path.
  const reasons = [];

  // 1) Escalation flagged
  if (latestUpdate && latestUpdate.escalation_needed === true) {
    reasons.push('Escalation');
  }

  // 2) Status overdue — D-482 final (migration 064): the flag means the chain
  // root predates the most recently OPENED prep window (meeting − 2 days).
  // One continuous rule: blank until the window opens, red from window-open
  // through and past the meeting until anyone saves (save clears the flag;
  // the cron re-evaluates daily). An update made today is never red today.
  if (cycle.status_overdue === true) {
    reasons.push('Status Update Overdue');
  }

  // 3) Gate date slipped within cadence period (D-486)
  const intervalDays = prefetch.intervalDays !== undefined
    ? prefetch.intervalDays
    : await resolveCadenceIntervalDays(supabase, cycle.division_id);
  let slipped;
  if (prefetch.slipEvents !== undefined) {
    const sinceIso = intervalDays
      ? new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    slipped = sinceIso
      ? aggregateSlipLine((prefetch.slipEvents || []).filter(e => e.created_at >= sinceIso))
      : [];
  } else {
    slipped = await computeSlippedGateLabels(supabase, cycle.delivery_cycle_id, intervalDays);
  }
  for (const line of slipped) {
    reasons.push(line);   // 'Gate Date Moved +N days' (CC-38-44)
  }

  // 4) At risk — confidence values and/or gate date_status at_risk/behind.
  // D-509 lifecycle: a confidence-based reason fires while the gate that
  // confidence applies to is NOT complete — regardless of the update's age
  // (no time decay) — and clears the moment the gate is approved/completed.
  const statusByGate = {};
  for (const m of (milestones || [])) { statusByGate[m.gate_name] = m.date_status; }

  let anyAtRisk = false;
  if (latestUpdate) {
    if (latestUpdate.pilot_confidence_applicable &&
        AT_RISK_STATES.includes(latestUpdate.pilot_confidence) &&
        statusByGate.go_to_deploy !== 'complete') { anyAtRisk = true; }
    if (latestUpdate.close_confidence_applicable &&
        AT_RISK_STATES.includes(latestUpdate.close_confidence) &&
        statusByGate.close_review !== 'complete') { anyAtRisk = true; }
  }
  for (const m of (milestones || [])) {
    if (AT_RISK_STATES.includes(m.date_status)) { anyAtRisk = true; }
  }
  // CC-38-44 wording: one bare 'At Risk' line — the gate detail lives in the
  // panel's gates table, not the reason list.
  if (anyAtRisk) { reasons.push('At Risk'); }

  // 5) Next gate has no target date — nothing to track against, so the row
  // can never surface as slipped or at-risk on dates. Callers must include
  // target_date in the milestones they pass.
  const nextGate = resolveNextGate(milestones || []);
  if (nextGate && !nextGate.target_date) {
    reasons.push('Missing Target Date');
  }

  // 6) Missing Deploy Date mid-flight (Phil 2026-07-16, CC-38-37): Brief
  // Review passed, Go to Deploy not yet resolved, and the Deploy milestone has
  // neither a target nor an actual date — the initiative is in motion with no
  // deploy commitment. Distinct from (5), which only watches the NEXT gate.
  let gateRows = prefetch.gateRows;
  if (gateRows === undefined) {
    const res = await supabase
      .from('gate_records')
      .select('gate_name, gate_status')
      .eq('delivery_cycle_id', cycle.delivery_cycle_id)
      .is('deleted_at', null);
    gateRows = res.data;
  }
  const gs = {};
  for (const g of (gateRows || [])) { gs[g.gate_name] = g.gate_status; }
  const briefPassed  = gs.brief_review === 'approved' || gs.brief_review === 'skipped';
  const deployOpen   = gs.go_to_deploy !== 'approved' && gs.go_to_deploy !== 'skipped';
  const deployMs     = (milestones || []).find(m => m.gate_name === 'go_to_deploy');
  const deployUndated = !deployMs?.target_date && !deployMs?.actual_date;
  if (briefPassed && deployOpen && deployUndated) {
    reasons.push('Missing Deploy Date');
  }

  // 7) Gate Overdue (CC-38-44): any unresolved gate whose target date has
  // passed. One bare line, no gate name — the row's Next Gate/Target Date
  // columns and the panel carry the detail.
  const today = new Date().toISOString().slice(0, 10);
  const anyOverdue = (milestones || []).some(m =>
    m.target_date && !m.actual_date && m.target_date < today &&
    gs[m.gate_name] !== 'approved' && gs[m.gate_name] !== 'skipped'
  );
  if (anyOverdue) { reasons.push('Gate Overdue'); }

  return reasons;
}

module.exports = {
  GATE_LABELS,
  CADENCE_INTERVAL_DAYS,
  resolveCadenceIntervalDays,
  resolveCadenceName,
  computeSlippedGateLabels,
  computeNeedsReviewReasons
};
