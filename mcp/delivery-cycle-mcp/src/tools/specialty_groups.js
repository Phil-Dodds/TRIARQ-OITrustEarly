// specialty_groups.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-563)
// Specialty Groups: list_specialty_groups (any user), member CRUD (admin JWT).
// Groups are seeded by migration 082 (Security, UX, Compliance,
// IT/Infrastructure). Group create/rename is not in the G1 spec — member CRUD
// only (CC-G1).

'use strict';

const { supabase } = require('../db');

/** Admin/Phil check shared by the member CRUD tools. */
async function requireAdmin(caller_user_id) {
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, is_admin, is_super_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller || !caller.is_active) {
    return { success: false, error: 'Caller user record not found or inactive.' };
  }
  if (caller.is_admin !== true && caller.is_super_admin !== true) {
    return { success: false, error: 'Managing Specialty Group members requires an Admin role.' };
  }
  return null;
}

/**
 * List Specialty Groups with active member rosters.
 * @param {boolean} [params.include_inactive] — include inactive groups
 */
async function list_specialty_groups(params, caller_user_id) {
  let query = supabase
    .from('specialty_groups')
    .select('*')
    .order('group_name', { ascending: true });

  if (!params.include_inactive) {
    query = query.eq('active_status', true);
  }

  const { data: groups, error: groupsErr } = await query;
  if (groupsErr) {
    return { success: false, error: `Failed to list Specialty Groups: ${groupsErr.message}` };
  }

  const groupIds = (groups || []).map(g => g.group_id);
  let membersByGroup = {};
  if (groupIds.length) {
    const { data: members, error: membersErr } = await supabase
      .from('specialty_group_members')
      .select('group_id, user_id, created_at')
      .in('group_id', groupIds)
      .is('deleted_at', null);

    if (membersErr) {
      return { success: false, error: `Failed to list group members: ${membersErr.message}` };
    }

    const userIds = [...new Set((members || []).map(m => m.user_id))];
    const userMap = {};
    if (userIds.length) {
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, is_active')
        .in('id', userIds);
      for (const u of users || []) { userMap[u.id] = u; }
    }

    membersByGroup = {};
    for (const m of members || []) {
      (membersByGroup[m.group_id] = membersByGroup[m.group_id] || []).push({
        user_id:      m.user_id,
        display_name: userMap[m.user_id]?.display_name || null,
        is_active:    userMap[m.user_id]?.is_active ?? null,
        member_since: m.created_at
      });
    }
  }

  return {
    success: true,
    data: {
      specialty_groups: (groups || []).map(g => ({
        ...g,
        members: membersByGroup[g.group_id] || []
      }))
    }
  };
}

/**
 * Add a user to a Specialty Group (admin JWT). Re-adding a removed member
 * reactivates the soft-deleted membership row.
 * @param {string} params.group_id
 * @param {string} params.user_id
 */
async function add_specialty_group_member(params, caller_user_id) {
  const { group_id, user_id } = params;
  if (!group_id || !user_id) {
    return { success: false, error: 'group_id and user_id are required.' };
  }

  const adminFailure = await requireAdmin(caller_user_id);
  if (adminFailure) { return adminFailure; }

  const { data: group, error: groupErr } = await supabase
    .from('specialty_groups')
    .select('group_id, group_name, active_status')
    .eq('group_id', group_id)
    .single();

  if (groupErr || !group) {
    return { success: false, error: 'Specialty Group not found.' };
  }
  if (!group.active_status) {
    return { success: false, error: `Specialty Group ${group.group_name} is inactive — members cannot be added.` };
  }

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, display_name, is_active')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (userErr || !user) {
    return { success: false, error: 'User not found.' };
  }
  if (!user.is_active) {
    return { success: false, error: `${user.display_name} is inactive and cannot be added to a Specialty Group.` };
  }

  const { data: existing } = await supabase
    .from('specialty_group_members')
    .select('group_id, user_id, deleted_at')
    .eq('group_id', group_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (existing && !existing.deleted_at) {
    return { success: false, error: `${user.display_name} is already a member of ${group.group_name}.` };
  }

  const { data: membership, error: saveErr } = existing
    ? await supabase
        .from('specialty_group_members')
        .update({ deleted_at: null })
        .eq('group_id', group_id)
        .eq('user_id', user_id)
        .select()
        .single()
    : await supabase
        .from('specialty_group_members')
        .insert({ group_id, user_id })
        .select()
        .single();

  if (saveErr) {
    return { success: false, error: `Failed to add group member: ${saveErr.message}` };
  }

  return {
    success: true,
    data: { ...membership, group_name: group.group_name, display_name: user.display_name }
  };
}

/**
 * Remove a user from a Specialty Group (admin JWT). Soft delete (Arch-6).
 * @param {string} params.group_id
 * @param {string} params.user_id
 */
async function remove_specialty_group_member(params, caller_user_id) {
  const { group_id, user_id } = params;
  if (!group_id || !user_id) {
    return { success: false, error: 'group_id and user_id are required.' };
  }

  const adminFailure = await requireAdmin(caller_user_id);
  if (adminFailure) { return adminFailure; }

  const { data: existing, error: existingErr } = await supabase
    .from('specialty_group_members')
    .select('group_id, user_id, deleted_at')
    .eq('group_id', group_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (existingErr || !existing || existing.deleted_at) {
    return { success: false, error: 'Active group membership not found.' };
  }

  const { error: removeErr } = await supabase
    .from('specialty_group_members')
    .update({ deleted_at: new Date().toISOString() })
    .eq('group_id', group_id)
    .eq('user_id', user_id);

  if (removeErr) {
    return { success: false, error: `Failed to remove group member: ${removeErr.message}` };
  }

  return { success: true, data: { group_id, user_id, removed: true } };
}

module.exports = {
  list_specialty_groups,
  add_specialty_group_member,
  remove_specialty_group_member
};
