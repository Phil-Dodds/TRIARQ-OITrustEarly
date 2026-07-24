// cancel-authority.js
// Pathways OI Trust — delivery-cycle-mcp shared helper — Contract G10 (D-566)
// Cancellation authority follows severity:
//   Before Brief Review passes — any trio member cancels freely.
//   After Brief Review — L1: any trio member; L2/L3: the resolved approver
//   (the awaiting gate's stamped approver, else the next gate's would-be
//   approver via the D-557 chain — CC-G10 lean).
// Admins/Phil retain their standing operational authority (CC-G10 lean —
// consistent with every other admin fallback in the tool set).

'use strict';

const { supabase } = require('../../db');
const { resolveGateApproverV2 } = require('./approver');

const GATE_ORDER = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

/**
 * Resolve the cancel authority for a cycle.
 * @returns {Promise<{ mode: 'trio'|'approver', authority_user_id: string|null,
 *   brief_passed: boolean, effective_level: number|null, error: string|null }>}
 */
async function resolveCancelAuthority(cycle) {
  const { data: gates, error: gatesErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, gate_name, gate_status, approver_user_id')
    .eq('delivery_cycle_id', cycle.delivery_cycle_id)
    .is('deleted_at', null);
  if (gatesErr) {
    return { mode: 'trio', authority_user_id: null, brief_passed: false, effective_level: null, error: gatesErr.message };
  }

  const byName = {};
  (gates || []).forEach(g => { byName[g.gate_name] = g; });
  const briefPassed = byName.brief_review?.gate_status === 'approved' ||
                      byName.brief_review?.gate_status === 'skipped';
  const effective = cycle.set_level ?? cycle.baseline_level ?? null;

  // Pre-Brief-Review, or Level 1 (and unsized-legacy — CC-G10 lean: NULL level
  // maps to trio authority; legacy cancellation stays as permissive as today).
  if (!briefPassed || effective === 1 || effective === null) {
    return { mode: 'trio', authority_user_id: null, brief_passed: briefPassed, effective_level: effective, error: null };
  }

  // L2/L3 post-Brief-Review: the resolved approver — the awaiting gate's
  // stamped approver when one exists, else the next unapproved gate's
  // would-be approver via the D-557 chain.
  const awaiting = (gates || []).find(g => g.gate_status === 'awaiting_approval' && g.approver_user_id);
  if (awaiting) {
    return { mode: 'approver', authority_user_id: awaiting.approver_user_id, brief_passed: briefPassed, effective_level: effective, error: null };
  }
  const nextGateName = GATE_ORDER.find(name =>
    byName[name] && byName[name].gate_status !== 'approved' && byName[name].gate_status !== 'skipped');
  const resolution = await resolveGateApproverV2({ cycle, gate_name: nextGateName ?? 'close_review' });
  return {
    mode: 'approver',
    authority_user_id: resolution.approver_user_id,
    brief_passed: briefPassed,
    effective_level: effective,
    error: null
  };
}

/** Notify every Consulted and Informed holder (D-566) — user ids, groups expanded. */
async function participationHolderIds(delivery_cycle_id) {
  const { data: stakes } = await supabase
    .from('participation_records')
    .select('holder_user_id, holder_group_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('removed_at', null);
  const ids = new Set();
  const groupIds = [];
  for (const s of stakes || []) {
    if (s.holder_user_id) { ids.add(s.holder_user_id); }
    else if (s.holder_group_id) { groupIds.push(s.holder_group_id); }
  }
  if (groupIds.length > 0) {
    const { data: members } = await supabase
      .from('specialty_group_members')
      .select('user_id')
      .in('group_id', groupIds)
      .is('deleted_at', null);
    (members || []).forEach(m => ids.add(m.user_id));
  }
  return [...ids];
}

module.exports = { resolveCancelAuthority, participationHolderIds };
