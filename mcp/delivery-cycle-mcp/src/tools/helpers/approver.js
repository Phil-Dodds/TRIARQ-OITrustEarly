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
  // Build the resolution tiers in priority order, then return the FIRST tier
  // whose user is live (not soft-deleted). A configured approver or division
  // owner who was later soft-deleted must NOT be returned — that would route
  // the gate to a user who can never act and silently drop the submission
  // email. Falling through to the next tier (ultimately Phil) keeps the gate
  // approvable. Phil's own row is already deleted_at-checked in getPhilUserId.
  const candidates = [];

  if (division_id) {
    // 1. Configured approver for this Division + gate.
    const { data: config } = await supabase
      .from('gate_approver_configs')
      .select('approver_user_id')
      .eq('division_id', division_id)
      .eq('gate_name', gate_name)
      .maybeSingle();
    if (config?.approver_user_id) {
      candidates.push({ id: config.approver_user_id, source: 'config' });
    }

    // 2. Division Owner escalation.
    const { data: division } = await supabase
      .from('divisions')
      .select('owner_user_id')
      .eq('id', division_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (division?.owner_user_id) {
      candidates.push({ id: division.owner_user_id, source: 'division_owner' });
    }
  }

  // 3. Phil fallback.
  const philId = await getPhilUserId();
  if (philId) {
    candidates.push({ id: philId, source: 'phil' });
  }

  // Return the first candidate that is a live (non-deleted) user.
  for (const c of candidates) {
    const { data: live } = await supabase
      .from('users')
      .select('id')
      .eq('id', c.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (live) {
      return { approver_user_id: c.id, source: c.source };
    }
  }

  return { approver_user_id: null, source: 'unresolved' };
}

module.exports = { resolveGateApprover };
