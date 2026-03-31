// list_users.js
// Lists users. If division_id provided, returns users with access to that Division.
// If no division_id, returns all active users (System Admin view).

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} [params.division_id]
 * @param {string} caller_user_id
 */
async function list_users(params, caller_user_id) {
  const { division_id } = params;

  if (division_id) {
    // Return users with active membership in this Division
    const { data, error } = await supabase
      .from('division_memberships')
      .select(`
        assigned_at,
        users (
          id,
          email,
          display_name,
          system_role,
          is_active,
          allow_both_admin_and_functional_roles
        )
      `)
      .eq('division_id', division_id)
      .is('revoked_at', null)
      .is('deleted_at', null);

    if (error) {
      return { success: false, error: `Failed to list Division users: ${error.message}` };
    }

    const users = (data || [])
      .filter(m => m.users)
      .map(m => ({ ...m.users, assigned_at: m.assigned_at }));

    return { success: true, data: users };
  }

  // No division_id — return all non-deleted users
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, system_role, is_active, allow_both_admin_and_functional_roles, created_at')
    .is('deleted_at', null)
    .order('display_name');

  if (error) {
    return { success: false, error: `Failed to list users: ${error.message}` };
  }

  return { success: true, data: data || [] };
}

module.exports = { list_users };
