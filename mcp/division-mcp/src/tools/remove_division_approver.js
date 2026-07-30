// remove_division_approver.js
// Contract 40 follow-on. Soft-removes an Approver designation (Arch-6 soft
// delete). Admin-only. Idempotent — removing a non-existent designation
// succeeds with removed:false.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} params.user_id
 * @param {string} caller_user_id
 */
async function remove_division_approver(params, caller_user_id) {
  const { division_id, user_id } = params;
  if (!division_id) return { success: false, error: 'division_id is required.' };
  if (!user_id)     return { success: false, error: 'user_id is required.' };

  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) return { success: false, error: 'Caller user record not found.' };
  if (caller.is_admin !== true) {
    return { success: false, error: 'Removing Division Approvers requires Admin role.' };
  }

  const { data: existing } = await supabase
    .from('division_approvers')
    .select('id')
    .eq('division_id', division_id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .limit(1);

  if (!existing || existing.length === 0) {
    return { success: true, data: { removed: false } };
  }

  const { error: updErr } = await supabase
    .from('division_approvers')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', existing[0].id);

  if (updErr) return { success: false, error: `Failed to remove approver: ${updErr.message}` };
  return { success: true, data: { removed: true } };
}

module.exports = { remove_division_approver };
