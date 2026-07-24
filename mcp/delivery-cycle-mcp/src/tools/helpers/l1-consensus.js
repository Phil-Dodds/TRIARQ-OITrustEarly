// l1-consensus.js
// Pathways OI Trust — delivery-cycle-mcp shared helper — Contract G5 (D-557)
// Level 1 consensus mechanics: collected-party state, trio approvals,
// any-return-returns-all clearing (Checkpoint 2026-07-23 ruling 1).
//
// An L1 consensus gate = effective level 1 AND gate_records.approver_user_id
// IS NULL (the D-570a interim stamped an approver; from G5 the NULL is real).
// An L1 cycle with the oversight field set resolves as L2 (S-C4) and carries
// an approver — it never enters this path.
// Collected parties = the non-null assigned trio (gate_approvals rows,
// approval_type 'trio_member'/'ie_override') + every NON-trio consulted party
// on the gate (gate_consultations rows). Any single return by any collected
// party returns the gate entirely: approvals cleared (never deleted),
// consulted responses preserved per CC-29-8 but re-collection restarts on
// re-submission.

'use strict';

const { supabase } = require('../../db');

function effectiveLevel(cycle) {
  return cycle.set_level ?? cycle.baseline_level ?? null;
}

/** True when this gate runs L1 consensus (G5). */
function isL1ConsensusGate(cycle, gate_record) {
  return effectiveLevel(cycle) === 1 && !gate_record.approver_user_id;
}

function trioIdsOf(cycle) {
  return [...new Set(
    [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
      .filter(Boolean)
  )];
}

/**
 * Collected-party state for an L1 gate.
 * @returns {Promise<{ trioIds, approvedTrioIds, pendingTrioIds,
 *   pendingConsultedIds, allCollected, error }>}
 */
async function getL1CollectedState(gate_record_id, cycle) {
  const trioIds = trioIdsOf(cycle);

  const { data: approvalRows, error: approvalsErr } = await supabase
    .from('gate_approvals')
    .select('approver_user_id, approval_type')
    .eq('gate_record_id', gate_record_id)
    .is('cleared_by_return_at', null);
  if (approvalsErr) {
    return { error: `Failed to read gate approvals: ${approvalsErr.message}` };
  }
  const approvedSet = new Set(
    (approvalRows || [])
      .filter(a => a.approval_type === 'trio_member' || a.approval_type === 'ie_override')
      .map(a => a.approver_user_id)
  );

  const { data: consultRows, error: consultErr } = await supabase
    .from('gate_consultations')
    .select('consulted_user_id, response')
    .eq('gate_record_id', gate_record_id);
  if (consultErr) {
    return { error: `Failed to read gate consultations: ${consultErr.message}` };
  }
  // Trio members approve as trio_member rows — their consultation rows (D-459
  // derivation includes the trio) don't gate L1 passage separately.
  const pendingConsultedIds = (consultRows || [])
    .filter(c => !trioIds.includes(c.consulted_user_id) && c.response === 'pending')
    .map(c => c.consulted_user_id);

  const approvedTrioIds = trioIds.filter(id => approvedSet.has(id));
  const pendingTrioIds  = trioIds.filter(id => !approvedSet.has(id));

  return {
    trioIds,
    approvedTrioIds,
    pendingTrioIds,
    pendingConsultedIds,
    allCollected: pendingTrioIds.length === 0 && pendingConsultedIds.length === 0,
    error: null
  };
}

/**
 * Record one trio-member approval (uncleared dup-guarded).
 * @returns {Promise<{ recorded: boolean, duplicate: boolean, error: string|null }>}
 */
async function recordTrioApproval(gate_record_id, approver_user_id) {
  const { data: dup } = await supabase
    .from('gate_approvals')
    .select('approval_id')
    .eq('gate_record_id', gate_record_id)
    .eq('approver_user_id', approver_user_id)
    .eq('approval_type', 'trio_member')
    .is('cleared_by_return_at', null)
    .maybeSingle();
  if (dup) { return { recorded: false, duplicate: true, error: null }; }

  const { error: insertErr } = await supabase
    .from('gate_approvals')
    .insert({ gate_record_id, approver_user_id, approval_type: 'trio_member' });
  if (insertErr) { return { recorded: false, duplicate: false, error: insertErr.message }; }
  return { recorded: true, duplicate: false, error: null };
}

/**
 * Any-return-returns-all (S-A2/S-A4): mark every uncleared approval on the
 * gate cleared, referencing the gate_returned event. Rows never deleted.
 */
async function clearGateApprovals(gate_record_id, cleared_by_event_id) {
  const { error } = await supabase
    .from('gate_approvals')
    .update({
      cleared_by_return_at: new Date().toISOString(),
      cleared_by_event_id:  cleared_by_event_id ?? null
    })
    .eq('gate_record_id', gate_record_id)
    .is('cleared_by_return_at', null);
  return { error: error ? error.message : null };
}

module.exports = {
  effectiveLevel,
  isL1ConsensusGate,
  trioIdsOf,
  getL1CollectedState,
  recordTrioApproval,
  clearGateApprovals
};
