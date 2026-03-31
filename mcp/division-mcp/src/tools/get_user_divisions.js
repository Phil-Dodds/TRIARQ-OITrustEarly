// get_user_divisions.js
// Returns all Divisions a user has active membership in, with inherited access.
// Downward-only inheritance: membership in a Division grants access to all
// child Divisions recursively (D-135).

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.user_id
 * @param {string} caller_user_id
 */
async function get_user_divisions(params, caller_user_id) {
  const { user_id } = params;

  if (!user_id) return { success: false, error: 'user_id is required.' };

  // Verify user exists
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (userErr || !user) {
    return { success: false, error: 'User not found.' };
  }

  // Get directly assigned Divisions (active memberships)
  const { data: memberships, error: memErr } = await supabase
    .from('division_memberships')
    .select('division_id, assigned_at')
    .eq('user_id', user_id)
    .is('revoked_at', null)
    .is('deleted_at', null);

  if (memErr) {
    return { success: false, error: `Failed to fetch memberships: ${memErr.message}` };
  }

  if (!memberships || memberships.length === 0) {
    return {
      success: true,
      data: {
        user_id,
        display_name: user.display_name,
        directly_assigned_divisions: [],
        all_accessible_divisions: []
      }
    };
  }

  const directIds = memberships.map(m => m.division_id);

  // Fetch details for directly assigned Divisions
  const { data: directDivisions, error: directErr } = await supabase
    .from('divisions')
    .select('id, division_name, division_level, parent_division_id, division_type_label')
    .in('id', directIds)
    .is('deleted_at', null);

  if (directErr) {
    return { success: false, error: `Failed to fetch Division details: ${directErr.message}` };
  }

  // Recursively collect all descendant Divisions for inherited access
  const allAccessibleIds = new Set(directIds);
  await collectDescendants(directIds, allAccessibleIds);

  const allIds = Array.from(allAccessibleIds);

  const { data: allDivisions, error: allErr } = await supabase
    .from('divisions')
    .select('id, division_name, division_level, parent_division_id, division_type_label')
    .in('id', allIds)
    .is('deleted_at', null)
    .order('division_level')
    .order('division_name');

  if (allErr) {
    return { success: false, error: `Failed to fetch accessible Divisions: ${allErr.message}` };
  }

  // Tag each Division with whether access is direct or inherited
  const directSet = new Set(directIds);
  const annotated = (allDivisions || []).map(d => ({
    ...d,
    access_type: directSet.has(d.id) ? 'direct' : 'inherited'
  }));

  return {
    success: true,
    data: {
      user_id,
      display_name: user.display_name,
      directly_assigned_divisions: directDivisions || [],
      all_accessible_divisions: annotated
    }
  };
}

/**
 * Recursively collects all descendant Division IDs into the accumulator set.
 */
async function collectDescendants(parentIds, accumulator) {
  if (parentIds.length === 0) return;

  const { data: children } = await supabase
    .from('divisions')
    .select('id')
    .in('parent_division_id', parentIds)
    .is('deleted_at', null);

  if (!children || children.length === 0) return;

  const newIds = children.map(c => c.id).filter(id => !accumulator.has(id));
  newIds.forEach(id => accumulator.add(id));

  await collectDescendants(newIds, accumulator);
}

module.exports = { get_user_divisions };
