// list_division_approvers.js
// Contract 40 follow-on. Lists designated Approvers for a division (admin
// editor). Admin-only read. Returns display_name + is_active projections.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} caller_user_id
 */
async function list_division_approvers(params, caller_user_id) {
  const { division_id } = params;
  if (!division_id) return { success: false, error: 'division_id is required.' };

  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) return { success: false, error: 'Caller user record not found.' };
  if (caller.is_admin !== true) {
    return { success: false, error: 'Viewing Division Approvers requires Admin role.' };
  }

  const { data: rows, error: rowsErr } = await supabase
    .from('division_approvers')
    .select('id, division_id, user_id, assigned_by, assigned_at')
    .eq('division_id', division_id)
    .is('deleted_at', null);

  if (rowsErr) return { success: false, error: `Failed to load approvers: ${rowsErr.message}` };
  if (!rows || rows.length === 0) return { success: true, data: [] };

  // Resolve display names + active state in one batch.
  const userIds = [...new Set(rows.map(r => r.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, is_active')
    .in('id', userIds)
    .is('deleted_at', null);

  const byId = new Map((users || []).map(u => [u.id, u]));
  const data = rows.map(r => ({
    ...r,
    display_name: byId.get(r.user_id)?.display_name ?? '(unknown user)',
    is_active:    byId.get(r.user_id)?.is_active ?? false
  }));

  return { success: true, data };
}

module.exports = { list_division_approvers };
