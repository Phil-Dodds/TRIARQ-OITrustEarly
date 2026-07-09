// list_dcs_users_with_initiatives.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Returns all DCS users with their active initiatives scoped to caller's division access.
// D-419: gate_status is the D-419 walkback result from cycle_milestone_dates.
// D-389: system_role = 'dcs', assigned_dcs_user_id on delivery_cycles.

'use strict';

const { supabase } = require('../db');

const WALKBACK_CHAIN = ['go_to_deploy', 'go_to_build', 'brief_review'];

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
 * @param {{}} params
 * @param {string} caller_user_id
 */
async function list_dcs_users_with_initiatives(params, caller_user_id) {
  // Admin check.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (callerErr || !caller?.is_admin) {
    return { success: false, error: 'Team Meetings is restricted to Admin users.' };
  }

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

  // All DCS users.
  const { data: dcsUsers, error: dcsErr } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('is_dcs', true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true });
  if (dcsErr) return { success: false, error: dcsErr.message };
  if (!dcsUsers?.length) return { success: true, data: [] };

  const dcsIds = dcsUsers.map(u => u.id);

  // Active initiatives assigned to these DCS users, scoped to accessible divisions.
  let cycleQuery = supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, delivery_cycle_name, lifecycle_stage, assigned_dcs_user_id, division_id')
    .in('assigned_dcs_user_id', dcsIds)
    .neq('lifecycle_stage', 'closed')
    .is('deleted_at', null)
    .order('delivery_cycle_name', { ascending: true });

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

  // Last status update date per initiative (CC-006: joined from initiative_status_updates).
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

  // Group initiatives by DCS user.
  const cyclesByDcs = {};
  (cycles || []).forEach(c => {
    const list = cyclesByDcs[c.assigned_dcs_user_id] || [];
    list.push({
      id:                     c.delivery_cycle_id,
      name:                   c.delivery_cycle_name,
      stage:                  c.lifecycle_stage,
      gate_status:            resolveGateStatus(milestonesByCycle[c.delivery_cycle_id] || []),
      last_status_update_date: lastStatusDateByCycle[c.delivery_cycle_id] ?? null
    });
    cyclesByDcs[c.assigned_dcs_user_id] = list;
  });

  const result = dcsUsers.map(u => ({
    id:           u.id,
    display_name: u.display_name,
    avatar_url:   null,
    initiatives:  cyclesByDcs[u.id] || []
  }));

  return { success: true, data: result };
}

module.exports = { list_dcs_users_with_initiatives };
