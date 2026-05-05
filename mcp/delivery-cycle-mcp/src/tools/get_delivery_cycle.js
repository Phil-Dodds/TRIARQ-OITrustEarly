// get_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns the full cycle record including current stage, milestone dates,
// gate records, Workstream details.
//
// Supplement Section 1: each gate_record in the response includes
// current_user_gate_authority: { can_submit, can_approve } so the Angular
// client can render action buttons without re-deriving permissions.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id - from JWT
 */
async function get_delivery_cycle(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  // ── Fetch cycle ───────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  // ── Fetch milestone dates ─────────────────────────────────────────────────
  const { data: milestone_dates } = await supabase
    .from('cycle_milestone_dates')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch gate records ────────────────────────────────────────────────────
  const { data: gate_records } = await supabase
    .from('gate_records')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch workstream details ──────────────────────────────────────────────
  const { data: workstream } = await supabase
    .from('delivery_workstreams')
    .select('workstream_id, workstream_name, active_status, home_division_id, workstream_lead_user_id')
    .eq('workstream_id', cycle.workstream_id)
    .is('deleted_at', null)
    .single();

  // ── Resolve workstream home division name (Section 2.5 — Division field inheritance) ──
  let home_division_name = null;
  if (workstream?.home_division_id) {
    const { data: divRow } = await supabase
      .from('divisions')
      .select('division_name')
      .eq('id', workstream.home_division_id)
      .is('deleted_at', null)
      .single();
    if (divRow) { home_division_name = divRow.division_name; }
  }

  // ── Fetch Jira links ──────────────────────────────────────────────────────
  const { data: jira_links } = await supabase
    .from('jira_links')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // ── Fetch cycle artifacts ─────────────────────────────────────────────────
  const { data: artifacts } = await supabase
    .from('cycle_artifacts')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .order('attached_at', { ascending: true });

  // ── Resolve DS / CB display names + caller role ───────────────────────────
  const userIdsToResolve = [
    cycle.assigned_ds_user_id,
    cycle.assigned_cb_user_id,
    caller_user_id
  ].filter(Boolean);

  let userMap = {};
  let callerRole = '';
  if (userIdsToResolve.length > 0) {
    const { data: userRows } = await supabase
      .from('users')
      .select('id, display_name, system_role')
      .in('id', userIdsToResolve)
      .is('deleted_at', null);
    if (userRows) {
      userRows.forEach(u => {
        userMap[u.id] = u.display_name;
        if (u.id === caller_user_id) { callerRole = u.system_role ?? ''; }
      });
    }
  }

  // ── Supplement Section 1: compute gate authority per gate for the caller ──
  const isPhil       = callerRole === 'phil';
  const isAssignedDs = cycle.assigned_ds_user_id === caller_user_id;
  const isAssignedCb = cycle.assigned_cb_user_id === caller_user_id;
  // Caller can submit if they are Phil, the assigned DS, or the assigned CB
  const callerCanSubmitAny = isPhil || isAssignedDs || isAssignedCb;

  // Resolve submitter display names for gate records that have submitted_by_user_id (D-345).
  const submitterIds = (gate_records || [])
    .map(gr => gr.submitted_by_user_id)
    .filter(Boolean);
  const submitterMap = {};
  if (submitterIds.length > 0) {
    const { data: submitterRows } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', submitterIds)
      .is('deleted_at', null);
    (submitterRows || []).forEach(u => { submitterMap[u.id] = u.display_name; });
  }

  const enrichedGateRecords = (gate_records || []).map(gr => ({
    ...gr,
    submitted_by_display_name: gr.submitted_by_user_id
      ? (submitterMap[gr.submitted_by_user_id] ?? null)
      : null,
    current_user_gate_authority: {
      // can_submit: gate not approved/awaiting_approval and caller has submit authority
      can_submit: callerCanSubmitAny &&
        gr.gate_status !== 'approved' &&
        gr.gate_status !== 'awaiting_approval',
      // can_approve: caller is Phil, or caller is the designated approver_user_id, AND gate is awaiting
      // When approver_user_id is null (Build C default), Phil is the fallback approver
      can_approve: gr.gate_status === 'awaiting_approval' &&
        (isPhil || gr.approver_user_id === caller_user_id),
      // can_withdraw: caller has submit authority and gate is awaiting_approval (D-345 §4)
      can_withdraw: callerCanSubmitAny && gr.gate_status === 'awaiting_approval'
    }
  }));

  return {
    success: true,
    data: {
      ...cycle,
      assigned_ds_display_name: cycle.assigned_ds_user_id ? (userMap[cycle.assigned_ds_user_id] ?? null) : null,
      assigned_cb_display_name: cycle.assigned_cb_user_id ? (userMap[cycle.assigned_cb_user_id] ?? null) : null,
      milestone_dates:  milestone_dates       || [],
      gate_records:     enrichedGateRecords,
      workstream:       workstream ? { ...workstream, home_division_name } : null,
      jira_links:       jira_links            || [],
      artifacts:        artifacts             || []
    }
  };
}

module.exports = { get_delivery_cycle };
