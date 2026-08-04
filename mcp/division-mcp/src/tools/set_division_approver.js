// set_division_approver.js
// Contract 40 follow-on (picker-only approver eligibility; Phil 2026-07-29).
// Designates a user as an Approver for a division. Admin-only to perform.
// Eligibility (AMENDS D-600 / CC-40-R members-only; Phil 2026-08-04, CC-0804-07):
//   an active division_memberships row in the division, OR the target is_admin.
// Picker pool only — does NOT change automatic gate resolution (D-557), and
// being an Admin still confers NO automatic eligibility on any Initiative.

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
    .select('id, display_name, is_admin')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (userErr || !targetUser) return { success: false, error: 'Target user not found.' };

  // ── Eligibility: an active member, OR an Admin ──────────────────────────────
  // AMENDS D-600 / CC-40-R, which specified members-only. Phil 2026-08-04:
  // "I do not want admins automatically available for all initiatives — but they
  // should be options to be configured as Division Approvers (or Division
  // Owners)." Design ratification required; recorded as CC-0804-07.
  //
  // Why the amendment is coherent rather than a loosening: D-170 already gives
  // Admins implicit access to every Division, so members-only forced an Admin to
  // be enrolled as a "member" of a Division purely to satisfy this check —
  // recording a false organisational fact to pass a gate. Admins were the one
  // population with standing everywhere and eligibility nowhere.
  //
  // What deliberately does NOT change: `list_eligible_approvers` is untouched.
  // Admin is NOT a source of automatic eligibility, so being an Admin still puts
  // nobody on an Initiative's approver dropdown. It only makes them selectable
  // HERE. Once designated, the resulting `division_approvers` row is what makes
  // them eligible — the same path as any other approver. D-557 automatic gate
  // resolution remains untouched (CC-40-R's "picker-only" lock still holds).
  if (targetUser.is_admin !== true) {
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
