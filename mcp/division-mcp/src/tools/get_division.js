// get_division.js
// Returns a Division record with its direct child Divisions and active member count.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} caller_user_id
 */
async function get_division(params, caller_user_id) {
  const { division_id } = params;

  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }

  // Fetch the Division
  const { data: division, error: divErr } = await supabase
    .from('divisions')
    .select('*')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (divErr || !division) {
    return { success: false, error: 'Division not found.' };
  }

  // Fetch direct child Divisions
  const { data: children, error: childErr } = await supabase
    .from('divisions')
    .select('id, division_name, division_level, division_type_label, owner_user_id, created_at')
    .eq('parent_division_id', division_id)
    .is('deleted_at', null)
    .order('division_name');

  if (childErr) {
    return { success: false, error: `Failed to fetch child Divisions: ${childErr.message}` };
  }

  // Active member count
  const { count, error: countErr } = await supabase
    .from('division_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('division_id', division_id)
    .is('revoked_at', null)
    .is('deleted_at', null);

  if (countErr) {
    return { success: false, error: `Failed to fetch member count: ${countErr.message}` };
  }

  return {
    success: true,
    data: {
      ...division,
      child_divisions: children || [],
      active_member_count: count || 0
    }
  };
}

module.exports = { get_division };
