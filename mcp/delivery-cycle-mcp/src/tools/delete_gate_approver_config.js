// delete_gate_approver_config.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 29 WS3, D-464).
//
// Deletes a gate_approver_configs row. After deletion the system falls back to
// escalation (Division Owner → Phil) at the next submission.
//
// Auth: Phil only (users.is_super_admin = true, CC-29-5).
//
// CC-decision (CC-29-9): this is a HARD delete, not a soft delete. ARCH-6 soft
//   delete governs domain records with audit/history value. gate_approver_configs
//   is mutable configuration with no deleted_at column (migration 047) — removing
//   a row simply restores escalation behavior. Matches the analogous config
//   tools' semantics (e.g. delete_roadmap_freeze_date).

'use strict';

const { supabase } = require('../db');

const VALID_GATES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} params.gate_name
 * @param {string} caller_user_id - from JWT
 */
async function delete_gate_approver_config(params, caller_user_id) {
  const { division_id, gate_name } = params;

  // ── Validate (cheap checks before the auth DB round-trip) ─────────────────
  if (!division_id) { return { success: false, error: 'division_id is required.' }; }
  if (!gate_name)   { return { success: false, error: 'gate_name is required.' }; }
  if (!VALID_GATES.includes(gate_name)) {
    return { success: false, error: `gate_name must be one of: ${VALID_GATES.join(', ')}.` };
  }

  // ── Phil-only ─────────────────────────────────────────────────────────────
  const { data: caller } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_super_admin !== true) {
    return { success: false, error: 'Only Phil can remove gate approver configs.' };
  }

  const { data: deleted, error: delErr } = await supabase
    .from('gate_approver_configs')
    .delete()
    .eq('division_id', division_id)
    .eq('gate_name', gate_name)
    .select();

  if (delErr) {
    return { success: false, error: `Failed to delete gate approver config: ${delErr.message}` };
  }
  if (!deleted || deleted.length === 0) {
    return { success: false, error: 'No gate approver config found for that Division and gate.' };
  }

  return { success: true, data: { division_id, gate_name, deleted: true } };
}

module.exports = { delete_gate_approver_config };
