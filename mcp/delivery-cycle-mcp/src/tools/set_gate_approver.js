// set_gate_approver.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 29 WS3, D-463/D-464).
//
// Upserts a per-Division, per-gate Accountable approver config. Used by the
// Phil-only Gate Approvers admin screen for both Create and Edit (same save
// path — UNIQUE(division_id, gate_name) makes it idempotent).
//
// Auth: Phil only (users.is_super_admin = true, CC-29-5). Any other user → rejected.
// Duplicate Division+Gate on the Add form is guarded client-side (Angular holds
// the full config list); server upsert is safe either way.

'use strict';

const { supabase } = require('../db');

const VALID_GATES = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} params.gate_name
 * @param {string} params.approver_user_id
 * @param {string} caller_user_id - from JWT
 */
async function set_gate_approver(params, caller_user_id) {
  const { division_id, gate_name, approver_user_id } = params;

  // ── Validate (cheap checks before the auth DB round-trip) ─────────────────
  if (!division_id)      { return { success: false, error: 'division_id is required.' }; }
  if (!gate_name)        { return { success: false, error: 'gate_name is required.' }; }
  if (!approver_user_id) { return { success: false, error: 'approver_user_id is required.' }; }
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
    return { success: false, error: 'Only Phil can configure gate approvers.' };
  }

  const { data: division } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', division_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!division) {
    return { success: false, error: 'division_id not found or has been deleted.' };
  }

  const { data: approver } = await supabase
    .from('users')
    .select('id')
    .eq('id', approver_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!approver) {
    return { success: false, error: 'approver_user_id not found or has been deleted.' };
  }

  // ── Upsert ──────────────────────────────────────────────────────────────────
  const { data: row, error: upsertErr } = await supabase
    .from('gate_approver_configs')
    .upsert(
      {
        division_id,
        gate_name,
        approver_user_id,
        updated_at:         new Date().toISOString(),
        updated_by_user_id: caller_user_id
      },
      { onConflict: 'division_id,gate_name' }
    )
    .select()
    .single();

  if (upsertErr) {
    return { success: false, error: `Failed to set gate approver: ${upsertErr.message}` };
  }

  return { success: true, data: row };
}

module.exports = { set_gate_approver };
