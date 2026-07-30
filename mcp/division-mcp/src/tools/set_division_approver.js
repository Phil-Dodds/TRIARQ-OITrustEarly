// set_division_approver.js
// Contract 40 follow-on (picker-only approver eligibility; Phil 2026-07-29).
// Designates a user as an Approver for a division. Admin-only. Members-only:
// the target must have an active division_memberships row in the division.
// Picker pool only — does NOT change automatic gate resolution (D-557).

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} params.user_id
 * @param {string} caller_user_id
 */
async function set_division_approver(params, caller_user_id) {
  const { division_id, user_id } = params;

  if (!division_id) return { success: false, error: 'division_id is required.' };
  if (!user_id)     return { success: false, error: 'user_id is required.' };

  // Admin-only (mirrors assign_user_to_division, D-394).
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) return { success: false, error: 'Caller user record not found.' };
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Designating Division Approvers requires Admin role. Your current role does not have this permission.'
    };
  }

  // Division exists + active.
  const { data: division, error: divErr } = await supabase
    .from('divisions')
    .select('id, division_name, active_status')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (divErr || !division) return { success: false, error: 'Division not found.' };
  if (division.active_status === false) {
    return {
      success: false,
      error: `${division.division_name} is inactive. Approver designations are blocked while the Division is inactive. Reactivate the Division to designate approvers.`
    };
  }

  // Target user exists.
  const { data: targetUser, error: userErr } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (userErr || !targetUser) return { success: false, error: 'Target user not found.' };

  // Members-only: must have an active membership in this division.
  const { data: membership } = await supabase
    .from('division_memberships')
    .select('id')
    .eq('user_id', user_id)
    .eq('division_id', division_id)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .limit(1);

  if (!membership || membership.length === 0) {
    return {
      success: false,
      error: `${targetUser.display_name} is not a member of ${division.division_name}. Add them as a member before designating them an approver.`
    };
  }

  // Already an active approver? (unique index also guards this.)
  const { data: existing } = await supabase
    .from('division_approvers')
    .select('id')
    .eq('division_id', division_id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      success: false,
      error: `${targetUser.display_name} is already an approver for ${division.division_name}.`
    };
  }

  const { data: row, error: insertErr } = await supabase
    .from('division_approvers')
    .insert({ division_id, user_id, assigned_by: caller_user_id })
    .select()
    .single();

  if (insertErr) return { success: false, error: `Failed to designate approver: ${insertErr.message}` };
  return { success: true, data: row };
}

module.exports = { set_division_approver };
