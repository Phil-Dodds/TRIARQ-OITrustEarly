// create_division.js
// Creates a new Division. Admin-only.
// If parent_division_id provided, validates caller has admin access to that parent.
// division_level is computed from parent (parent.division_level + 1), or 0 for root.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_name
 * @param {string} [params.parent_division_id]
 * @param {string} [params.division_type_label]
 * @param {string} caller_user_id - from JWT sub claim
 */
async function create_division(params, caller_user_id) {
  const { division_name, parent_division_id, division_type_label } = params;

  if (!division_name || !division_name.trim()) {
    return { success: false, error: 'division_name is required.' };
  }

  // Verify caller exists and is admin role
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, system_role, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (!caller.is_active) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (caller.system_role !== 'admin' && caller.system_role !== 'phil') {
    return {
      success: false,
      error: 'Creating Divisions requires Admin role. Your current role does not have this permission. Contact your System Admin to request access.'
    };
  }

  let division_level = 0;

  if (parent_division_id) {
    // Verify parent exists
    const { data: parent, error: parentErr } = await supabase
      .from('divisions')
      .select('id, division_level')
      .eq('id', parent_division_id)
      .is('deleted_at', null)
      .single();

    if (parentErr || !parent) {
      return { success: false, error: 'parent_division_id not found or has been deleted.' };
    }

    // Verify caller has admin access to the parent Division (downward-only model)
    const hasAccess = await callerHasDivisionAccess(caller_user_id, parent_division_id);
    if (!hasAccess) {
      return {
        success: false,
        error: 'You do not have admin access to the parent Division. You can only create child Divisions within Divisions you administer.'
      };
    }

    division_level = parent.division_level + 1;
  }

  const { data: division, error: insertErr } = await supabase
    .from('divisions')
    .insert({
      division_name:       division_name.trim(),
      parent_division_id:  parent_division_id || null,
      division_level,
      division_type_label: division_type_label || null,
      created_by:          caller_user_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to create Division: ${insertErr.message}` };
  }

  return { success: true, data: division };
}

/**
 * Returns true if user_id has an active membership (directly or via ancestor) for division_id.
 * Simplified check for Build A: direct membership only.
 * Full recursive ancestor check wired when hierarchical membership query is needed.
 */
async function callerHasDivisionAccess(user_id, division_id) {
  const { data } = await supabase
    .from('division_memberships')
    .select('id')
    .eq('user_id', user_id)
    .eq('division_id', division_id)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .limit(1);

  return data && data.length > 0;
}

module.exports = { create_division };
