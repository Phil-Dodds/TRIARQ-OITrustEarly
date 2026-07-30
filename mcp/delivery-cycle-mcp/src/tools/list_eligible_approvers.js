// list_eligible_approvers.js
// Contract 40 follow-on (picker-only approver eligibility; Phil 2026-07-29).
//
// Returns the candidate pool the MANUAL gate-approver picker offers for a
// cycle. Picker-only — does NOT change automatic gate resolution (D-557).
//
// Pool =
//   all Initiative Executives (users.is_initiative_executive)
//   + the cycle division's Leader (divisions.owner_user_id)
//   + every ancestor division's Leader (walk parent_division_id)
//   + the cycle division's designated Approvers (division_approvers rows)
//
// Ancestor divisions contribute their Leader only — not their approvers.
// Caller must be leadership for the cycle (Phil / IE / a division leader in
// the cycle's ancestor chain) — same gate as who may set the approver.

'use strict';

const { supabase }             = require('../db');
const { isLeadershipForCycle }  = require('./helpers/approver');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id
 */
async function list_eligible_approvers(params, caller_user_id) {
  const { delivery_cycle_id } = params;
  if (!delivery_cycle_id) return { success: false, error: 'delivery_cycle_id is required.' };

  // Cycle → division.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('id, division_id')
    .eq('id', delivery_cycle_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (cycleErr) return { success: false, error: `Failed to load initiative: ${cycleErr.message}` };
  if (!cycle)   return { success: false, error: 'Initiative not found.' };

  // Authorization: only leadership for this cycle may see the reassignment pool.
  if (!(await isLeadershipForCycle(caller_user_id, cycle.division_id))) {
    return {
      success: false,
      error: 'Changing the approver requires Division Leadership, an Initiative Executive, or Admin. Your current role does not have this permission.'
    };
  }

  // sources keyed by user_id → Set of reason tags.
  const sources = new Map();
  const add = (userId, tag) => {
    if (!userId) return;
    if (!sources.has(userId)) sources.set(userId, new Set());
    sources.get(userId).add(tag);
  };

  // 1. Walk the cycle's division + ancestor chain. Own division's leader is
  //    'division_leader'; ancestors' leaders are 'parent_leader'.
  let currentDivisionId = cycle.division_id;
  let depth = 0;
  while (currentDivisionId && depth < 10) {
    const { data: division } = await supabase
      .from('divisions')
      .select('id, owner_user_id, parent_division_id')
      .eq('id', currentDivisionId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!division) break;
    add(division.owner_user_id, depth === 0 ? 'division_leader' : 'parent_leader');
    currentDivisionId = division.parent_division_id;
    depth += 1;
  }

  // 2. The cycle division's designated approvers.
  const { data: approverRows } = await supabase
    .from('division_approvers')
    .select('user_id')
    .eq('division_id', cycle.division_id)
    .is('deleted_at', null);
  for (const r of (approverRows || [])) add(r.user_id, 'division_approver');

  // 3. All Initiative Executives.
  const { data: ieRows } = await supabase
    .from('users')
    .select('id')
    .eq('is_initiative_executive', true)
    .is('deleted_at', null);
  for (const r of (ieRows || [])) add(r.id, 'initiative_executive');

  if (sources.size === 0) return { success: true, data: [] };

  // Resolve names + active state; drop soft-deleted users.
  const userIds = [...sources.keys()];
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, is_active')
    .in('id', userIds)
    .is('deleted_at', null);

  const data = (users || [])
    .map(u => ({
      user_id:      u.id,
      display_name: u.display_name,
      is_active:    u.is_active !== false,
      sources:      [...(sources.get(u.id) || [])]
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  return { success: true, data };
}

module.exports = { list_eligible_approvers };
