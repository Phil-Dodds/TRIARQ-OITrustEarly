// list_dcs_users_with_initiatives.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Returns users of the requested person type (dcs | dol | epo) with their active
// initiatives, scoped to caller's division access. Any authenticated user —
// this is the reference panel data source, gated by track membership at the
// meeting level, not here.
// D-419: gate_status is the walkback result from cycle_milestone_dates.

'use strict';

const { supabase } = require('../db');
const { getCaller } = require('../track_access');

const WALKBACK_CHAIN = ['go_to_deploy', 'go_to_build', 'brief_review'];

const PERSON_TYPES = {
  dcs: { flag: 'is_dcs', column: 'assigned_dcs_user_id' },
  dol: { flag: 'is_dol', column: 'assigned_dol_user_id' },
  epo: { flag: 'is_epo', column: 'assigned_epo_user_id' }
};

function resolveGateStatus(milestoneDates) {
  for (const gate of WALKBACK_CHAIN) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (!m || !m.date_status) continue;
    if (m.date_status === 'not_started') continue;
    if (m.date_status === 'skipped')     continue;
    return m.date_status;
  }
  return 'not_started';
}

/**
 * @param {{ person_type?: 'dcs'|'dol'|'epo' }} params
 * @param {string} caller_user_id
 */
async function list_dcs_users_with_initiatives(params, caller_user_id) {
  const personType = PERSON_TYPES[params.person_type || 'dcs'];
  if (!personType) return { success: false, error: 'person_type must be dcs, dol, or epo.' };

  const caller = await getCaller(caller_user_id);
  if (!caller) return { success: false, error: 'User not found.' };

  // Division access for the caller — admins get all divisions.
  let accessible_division_ids = null; // null = all divisions (admin)
  if (!caller.is_admin) {
    const { data: memberships } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .is('revoked_at', null)
      .is('deleted_at', null);
    accessible_division_ids = (memberships || []).map(m => m.division_id);
    if (!accessible_division_ids.length) return { success: true, data: [] };
  }

  // All users of the requested person type.
  const { data: typedUsers, error: usersErr } = await supabase
    .from('users')
    .select('id, display_name')
    .eq(personType.flag, true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true });
  if (usersErr) return { success: false, error: usersErr.message };
  if (!typedUsers?.length) return { success: true, data: [] };

  const userIds = typedUsers.map(u => u.id);

  // Active initiatives assigned to these users, scoped to accessible divisions.
  let cycleQuery = supabase
    .from('delivery_cycles')
    .select(`delivery_cycle_id, cycle_title, current_lifecycle_stage, ${personType.column}, division_id`)
    .in(personType.column, userIds)
    .neq('current_lifecycle_stage', 'closed')
    .is('deleted_at', null)
    .order('cycle_title', { ascending: true });

  if (accessible_division_ids !== null) {
    cycleQuery = cycleQuery.in('division_id', accessible_division_ids);
  }

  const { data: cycles, error: cycleErr } = await cycleQuery;
  if (cycleErr) return { success: false, error: cycleErr.message };

  const cycleIds = (cycles || []).map(c => c.delivery_cycle_id);

  // Milestone dates for D-419 walkback.
  let milestonesByCycle = {};
  if (cycleIds.length) {
    const { data: milestones } = await supabase
      .from('cycle_milestone_dates')
      .select('delivery_cycle_id, gate_name, date_status')
      .in('delivery_cycle_id', cycleIds)
      .is('deleted_at', null);
    (milestones || []).forEach(m => {
      (milestonesByCycle[m.delivery_cycle_id] = milestonesByCycle[m.delivery_cycle_id] || []).push(m);
    });
  }

  // Last status update date per initiative (CC-006).
  let lastStatusDateByCycle = {};
  if (cycleIds.length) {
    const { data: statusRows } = await supabase
      .from('initiative_status_updates')
      .select('delivery_cycle_id, created_at')
      .in('delivery_cycle_id', cycleIds)
      .order('created_at', { ascending: false });
    (statusRows || []).forEach(s => {
      if (!lastStatusDateByCycle[s.delivery_cycle_id]) {
        lastStatusDateByCycle[s.delivery_cycle_id] = s.created_at;
      }
    });
  }

  // Group initiatives by assigned user.
  const cyclesByUser = {};
  (cycles || []).forEach(c => {
    const assignedId = c[personType.column];
    const list = cyclesByUser[assignedId] || [];
    list.push({
      id:                      c.delivery_cycle_id,
      name:                    c.cycle_title,
      stage:                   c.current_lifecycle_stage,
      gate_status:             resolveGateStatus(milestonesByCycle[c.delivery_cycle_id] || []),
      last_status_update_date: lastStatusDateByCycle[c.delivery_cycle_id] ?? null
    });
    cyclesByUser[assignedId] = list;
  });

  const result = typedUsers.map(u => ({
    id:           u.id,
    display_name: u.display_name,
    avatar_url:   null,
    initiatives:  cyclesByUser[u.id] || []
  }));

  return { success: true, data: result };
}

module.exports = { list_dcs_users_with_initiatives };
