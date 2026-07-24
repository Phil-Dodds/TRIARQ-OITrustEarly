// quarter_deploy_goal.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G10 (D-568 family C)
// THE one v1 KPI: quarter deploy-goal. Per person: gates completed vs gates
// remaining to bring assigned Initiatives through Go to Deploy this quarter;
// recent weekly pace vs needed pace. Division roll-up for Division Leaders.
// Denominator recomputes as initiatives change; target movement is SHOWN,
// not hidden (change count included). Level 1 shared gates count once per
// person whose approval was required — a per-person view naturally counts
// each assigned Initiative's gate once. Diagnostic, not a target (D-568).
// Families A, B, D: NOT built — they require the dedicated metric pass.

'use strict';

const { supabase } = require('../db');

const DEPLOY_CHAIN = ['brief_review', 'go_to_build', 'go_to_deploy'];

function quarterBounds(now = new Date()) {
  const q = Math.floor(now.getUTCMonth() / 3);
  const start = new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1));
  const end   = new Date(Date.UTC(now.getUTCFullYear(), q * 3 + 3, 1));
  return {
    label: `Q${q + 1} ${now.getUTCFullYear()}`,
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    weeksRemaining: Math.max(1, Math.ceil((end.getTime() - now.getTime()) / (7 * 86400000)))
  };
}

/** Compute the KPI over a set of cycle ids. */
async function computeGoal(cycleIds, bounds) {
  if (cycleIds.length === 0) {
    return { initiative_count: 0, gates_done: 0, gates_remaining: 0, weekly_pace: 0, needed_pace: 0, target_changes_this_quarter: 0 };
  }

  const { data: milestones } = await supabase
    .from('cycle_milestone_dates')
    .select('delivery_cycle_id, gate_name, target_date')
    .in('delivery_cycle_id', cycleIds)
    .eq('gate_name', 'go_to_deploy')
    .is('deleted_at', null);
  const inQuarterIds = new Set(
    (milestones || [])
      .filter(m => m.target_date && m.target_date >= bounds.startIso && m.target_date < bounds.endIso)
      .map(m => m.delivery_cycle_id)
  );
  if (inQuarterIds.size === 0) {
    return { initiative_count: 0, gates_done: 0, gates_remaining: 0, weekly_pace: 0, needed_pace: 0, target_changes_this_quarter: 0 };
  }
  const goalIds = [...inQuarterIds];

  const { data: gates } = await supabase
    .from('gate_records')
    .select('delivery_cycle_id, gate_name, gate_status, approver_decision_at')
    .in('delivery_cycle_id', goalIds)
    .in('gate_name', DEPLOY_CHAIN)
    .is('deleted_at', null);

  let done = 0, remaining = 0, recentApprovals = 0;
  const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();
  for (const g of gates || []) {
    if (g.gate_status === 'approved' || g.gate_status === 'skipped') {
      done += 1;
      if (g.approver_decision_at && g.approver_decision_at >= fourWeeksAgo) { recentApprovals += 1; }
    } else {
      remaining += 1;
    }
  }

  // Target movement shown, not hidden (D-568 C).
  const { data: moveEvents } = await supabase
    .from('cycle_event_log')
    .select('event_id, event_metadata, created_at')
    .in('delivery_cycle_id', goalIds)
    .eq('event_type', 'milestone_target_date_changed')
    .gte('created_at', bounds.startIso);
  const targetChanges = (moveEvents || [])
    .filter(e => (e.event_metadata?.gate_name ?? null) === 'go_to_deploy').length;

  return {
    initiative_count: goalIds.length,
    gates_done: done,
    gates_remaining: remaining,
    weekly_pace: Math.round((recentApprovals / 4) * 10) / 10,
    needed_pace: Math.round((remaining / bounds.weeksRemaining) * 10) / 10,
    target_changes_this_quarter: targetChanges
  };
}

/**
 * The personal quarter deploy-goal card + Division roll-up for DLs.
 * @param {string} [params.user_id] — defaults to caller
 */
async function get_quarter_deploy_goal(params, caller_user_id) {
  const user_id = params.user_id || caller_user_id;
  const bounds = quarterBounds();

  const { data: assigned } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .or(`assigned_dcs_user_id.eq.${user_id},assigned_epo_user_id.eq.${user_id},assigned_dol_user_id.eq.${user_id}`)
    .not('current_lifecycle_stage', 'in', '("CANCELLED","COMPLETE")')
    .is('deleted_at', null);
  const personal = await computeGoal((assigned || []).map(c => c.delivery_cycle_id), bounds);

  // Division roll-up when the user leads Divisions (D-568 C).
  const rollups = [];
  const { data: ownedDivisions } = await supabase
    .from('divisions')
    .select('id, division_name')
    .eq('owner_user_id', user_id)
    .is('deleted_at', null);
  for (const div of ownedDivisions || []) {
    const { data: divCycles } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id')
      .eq('division_id', div.id)
      .not('current_lifecycle_stage', 'in', '("CANCELLED","COMPLETE")')
      .is('deleted_at', null);
    const goal = await computeGoal((divCycles || []).map(c => c.delivery_cycle_id), bounds);
    rollups.push({ division_id: div.id, division_name: div.division_name, ...goal });
  }

  return {
    success: true,
    data: {
      quarter: bounds.label,
      weeks_remaining: bounds.weeksRemaining,
      personal,
      division_rollups: rollups
    }
  };
}

module.exports = { get_quarter_deploy_goal, quarterBounds, computeGoal };
