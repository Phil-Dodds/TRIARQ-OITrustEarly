// division_default_consulteds.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-563)
// Division default Consulted parties: list / add / remove (DL or admin JWT).
// Attach-at-creation wiring is G4 — G1 ships the registry and CRUD only.

'use strict';

const { supabase } = require('../db');

/**
 * DL-or-admin check for a Division. DL = divisions.owner_user_id.
 * Returns { division } on success or { failure } envelope.
 */
async function requireDivisionLeaderOrAdmin(division_id, caller_user_id) {
  const { data: division, error: divisionErr } = await supabase
    .from('divisions')
    .select('id, division_name, owner_user_id')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (divisionErr || !division) {
    return { failure: { success: false, error: 'Division not found.' } };
  }

  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, is_admin, is_super_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { failure: { success: false, error: 'Caller user record not found or inactive.' } };
  }

  const isAllowed = division.owner_user_id === caller_user_id ||
    caller.is_admin === true || caller.is_super_admin === true;

  if (!isAllowed) {
    return {
      failure: {
        success: false,
        error: 'Managing Division default Consulted parties requires the Division Leader or an Admin role.'
      }
    };
  }

  return { division };
}

/**
 * List default Consulted parties for a Division, holders resolved.
 * @param {string} params.division_id
 */
async function list_division_default_consulteds(params, caller_user_id) {
  const { division_id } = params;
  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }

  const { data: rows, error: rowsErr } = await supabase
    .from('division_default_consulteds')
    .select('*')
    .eq('division_id', division_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (rowsErr) {
    return { success: false, error: `Failed to list Division default Consulteds: ${rowsErr.message}` };
  }

  const userIds  = [...new Set((rows || []).map(r => r.holder_user_id).filter(Boolean))];
  const groupIds = [...new Set((rows || []).map(r => r.holder_group_id).filter(Boolean))];

  const userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase.from('users').select('id, display_name').in('id', userIds);
    for (const u of users || []) { userMap[u.id] = u.display_name; }
  }
  const groupMap = {};
  if (groupIds.length) {
    const { data: groups } = await supabase.from('specialty_groups').select('group_id, group_name').in('group_id', groupIds);
    for (const g of groups || []) { groupMap[g.group_id] = g.group_name; }
  }

  return {
    success: true,
    data: {
      division_default_consulteds: (rows || []).map(r => ({
        ...r,
        holder_display_name: r.holder_user_id ? (userMap[r.holder_user_id] || null) : null,
        holder_group_name:   r.holder_group_id ? (groupMap[r.holder_group_id] || null) : null
      }))
    }
  };
}

/**
 * Add a default Consulted party (user or group) to a Division.
 * @param {string} params.division_id
 * @param {string} [params.holder_user_id]
 * @param {string} [params.holder_group_id]
 */
async function add_division_default_consulted(params, caller_user_id) {
  const { division_id, holder_user_id, holder_group_id } = params;
  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }
  const hasUser  = !!holder_user_id;
  const hasGroup = !!holder_group_id;
  if (hasUser === hasGroup) {
    return { success: false, error: 'Exactly one of holder_user_id or holder_group_id is required.' };
  }

  const ctx = await requireDivisionLeaderOrAdmin(division_id, caller_user_id);
  if (ctx.failure) { return ctx.failure; }

  let holderLabel;
  if (hasUser) {
    const { data: holder, error: holderErr } = await supabase
      .from('users')
      .select('id, display_name, is_active')
      .eq('id', holder_user_id)
      .is('deleted_at', null)
      .single();
    if (holderErr || !holder) { return { success: false, error: 'Holder user not found.' }; }
    if (!holder.is_active) {
      return { success: false, error: `${holder.display_name} is inactive and cannot be a default Consulted party.` };
    }
    holderLabel = holder.display_name;
  } else {
    const { data: group, error: groupErr } = await supabase
      .from('specialty_groups')
      .select('group_id, group_name, active_status')
      .eq('group_id', holder_group_id)
      .single();
    if (groupErr || !group) { return { success: false, error: 'Holder Specialty Group not found.' }; }
    if (!group.active_status) {
      return { success: false, error: `Specialty Group ${group.group_name} is inactive and cannot be a default Consulted party.` };
    }
    holderLabel = group.group_name;
  }

  // Duplicate active default guard.
  const dupQuery = supabase
    .from('division_default_consulteds')
    .select('default_consulted_id')
    .eq('division_id', division_id)
    .is('deleted_at', null);
  const { data: dup } = hasUser
    ? await dupQuery.eq('holder_user_id', holder_user_id).maybeSingle()
    : await dupQuery.eq('holder_group_id', holder_group_id).maybeSingle();

  if (dup) {
    return { success: false, error: `${holderLabel} is already a default Consulted party for this Division.` };
  }

  const { data: row, error: insertErr } = await supabase
    .from('division_default_consulteds')
    .insert({
      division_id,
      holder_user_id:     holder_user_id || null,
      holder_group_id:    holder_group_id || null,
      created_by_user_id: caller_user_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to add default Consulted party: ${insertErr.message}` };
  }

  return { success: true, data: { ...row, holder_label: holderLabel } };
}

/**
 * Remove a default Consulted party. Soft delete (Arch-6).
 * @param {string} params.default_consulted_id
 */
async function remove_division_default_consulted(params, caller_user_id) {
  const { default_consulted_id } = params;
  if (!default_consulted_id) {
    return { success: false, error: 'default_consulted_id is required.' };
  }

  const { data: row, error: rowErr } = await supabase
    .from('division_default_consulteds')
    .select('default_consulted_id, division_id, deleted_at')
    .eq('default_consulted_id', default_consulted_id)
    .single();

  if (rowErr || !row || row.deleted_at) {
    return { success: false, error: 'Active default Consulted entry not found.' };
  }

  const ctx = await requireDivisionLeaderOrAdmin(row.division_id, caller_user_id);
  if (ctx.failure) { return ctx.failure; }

  const { error: removeErr } = await supabase
    .from('division_default_consulteds')
    .update({ deleted_at: new Date().toISOString() })
    .eq('default_consulted_id', default_consulted_id);

  if (removeErr) {
    return { success: false, error: `Failed to remove default Consulted party: ${removeErr.message}` };
  }

  return { success: true, data: { default_consulted_id, removed: true } };
}

module.exports = {
  list_division_default_consulteds,
  add_division_default_consulted,
  remove_division_default_consulted
};
