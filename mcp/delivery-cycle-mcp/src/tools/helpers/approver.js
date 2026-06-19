// approver.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (Contract 29 WS3).
//
// Resolve the Accountable approver for a gate at submission time (D-463).
// Resolution order (spec WS3 + Session 2026-03-29-C escalation):
//   1. gate_approver_configs row for (division_id, gate_name)
//   2. divisions.owner_user_id (Division Owner escalation)
//   3. Phil (users.is_super_admin = true) — see helpers/phil.js, CC-29-5
//
// Returns the resolved approver_user_id and which source produced it.

'use strict';

const { supabase }       = require('../../db');
const { getPhilUserId }  = require('./phil');

/**
 * @param {object} args
 * @param {string} args.division_id
 * @param {string} args.gate_name
 * @returns {Promise<{ approver_user_id: string|null, source: string }>}
 *   source ∈ 'config' | 'division_owner' | 'phil' | 'unresolved'
 */
async function resolveGateApprover({ division_id, gate_name }) {
  // 1. Configured approver for this Division + gate.
  if (division_id) {
    const { data: config } = await supabase
      .from('gate_approver_configs')
      .select('approver_user_id')
      .eq('division_id', division_id)
      .eq('gate_name', gate_name)
      .maybeSingle();
    if (config?.approver_user_id) {
      return { approver_user_id: config.approver_user_id, source: 'config' };
    }

    // 2. Division Owner escalation.
    const { data: division } = await supabase
      .from('divisions')
      .select('owner_user_id')
      .eq('id', division_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (division?.owner_user_id) {
      return { approver_user_id: division.owner_user_id, source: 'division_owner' };
    }
  }

  // 3. Phil fallback.
  const philId = await getPhilUserId();
  if (philId) {
    return { approver_user_id: philId, source: 'phil' };
  }

  return { approver_user_id: null, source: 'unresolved' };
}

module.exports = { resolveGateApprover };
