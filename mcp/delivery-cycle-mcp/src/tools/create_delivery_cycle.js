// create_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Creates a new Initiative (D-392). Seeds five cycle_milestone_dates rows and
// gate_records for all five gates. Appends creation event to cycle_event_log.
// DCS, EPO, DOL, CE, Phil, and Admin roles may create Initiatives.
//
// D-165: workstream_id is optional at creation. If provided, it must exist.
// It does not need to be active at creation — active status is checked at gate time (ARCH-23).
// Workstream must be assigned before Brief Review gate can be submitted.
//
// D-389/D-390/D-391: assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id
// are nullable at creation. Gate enforcement (DCS+DOL for Brief Review, EPO for Go to Build)
// lives in submit_gate_for_approval.
//
// Source: D-83, D-108, D-124, D-125, D-165, D-194, D-389, D-390, D-391, D-393.

'use strict';

const { supabase } = require('../db');
const { GATE_MILESTONE_LABELS, ALL_GATES } = require('../lifecycle');

const VALID_TIERS         = ['tier_1', 'tier_2', 'tier_3'];
const VALID_CREATOR_ROLES = ['dcs', 'epo', 'dol', 'ce', 'phil', 'admin'];

/**
 * @param {object} params
 * @param {string}  params.cycle_title
 * @param {string}  [params.cycle_description]
 * @param {string}  params.division_id
 * @param {string}  [params.workstream_id]          — Optional at creation (D-165)
 * @param {string}  params.tier_classification      — 'tier_1' | 'tier_2' | 'tier_3'
 * @param {string}  [params.assigned_dcs_user_id]   — Optional; required before Brief Review (D-389)
 * @param {string}  [params.assigned_epo_user_id]   — Optional; required before Go to Build (D-390)
 * @param {string}  [params.assigned_dol_user_id]   — Optional; required before Brief Review (D-391)
 * @param {string}  [params.outcome_statement]      — Optional; can be set at creation or later
 * @param {string}  [params.jira_epic_key]          — Optional Jira Epic Key
 * @param {object}  [params.milestone_target_dates] — Optional gate target dates at creation
 * @param {string}  [params.milestone_target_dates.brief_review]
 * @param {string}  [params.milestone_target_dates.go_to_build]
 * @param {string}  [params.milestone_target_dates.go_to_deploy]
 * @param {string}  [params.milestone_target_dates.go_to_release]
 * @param {string}  [params.milestone_target_dates.close_review]
 * @param {string} caller_user_id - from JWT
 */
async function create_delivery_cycle(params, caller_user_id) {
  const {
    cycle_title,
    cycle_description,
    division_id,
    workstream_id,
    tier_classification,
    assigned_dcs_user_id,
    assigned_epo_user_id,
    assigned_dol_user_id,
    outcome_statement,
    jira_epic_key,
    milestone_target_dates
  } = params;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!cycle_title || !cycle_title.trim()) {
    return { success: false, error: 'cycle_title is required.' };
  }
  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }
  // workstream_id is optional (D-165) — no required check here.
  // If provided, it must exist. Active status is checked at gate submission (ARCH-23).
  if (!tier_classification) {
    return { success: false, error: 'tier_classification is required.' };
  }
  if (!VALID_TIERS.includes(tier_classification)) {
    return { success: false, error: 'tier_classification must be one of: tier_1, tier_2, tier_3.' };
  }
  // DCS / EPO / DOL are nullable at creation. Gate enforcement
  // (DCS+DOL → Brief Review, EPO → Go to Build) lives in submit_gate_for_approval.

  // ── Caller role check ─────────────────────────────────────────────────────
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
  if (!VALID_CREATOR_ROLES.includes(caller.system_role)) {
    return {
      success: false,
      error: 'Creating Initiatives requires DCS, EPO, DOL, CE, Admin, or Phil role. Your current role does not have this permission.'
    };
  }

  // ── Verify workstream exists (if provided) ────────────────────────────────
  // D-165: workstream is optional at creation. If provided it must exist.
  // Active status is NOT checked here — only at gate submission (ARCH-23).
  let workstream = null;
  if (workstream_id) {
    const { data: ws, error: wsErr } = await supabase
      .from('delivery_workstreams')
      .select('workstream_id, workstream_name, active_status, home_division_id')
      .eq('workstream_id', workstream_id)
      .is('deleted_at', null)
      .single();

    if (wsErr || !ws) {
      return { success: false, error: 'workstream_id not found or has been deleted. Select a valid Workstream or leave blank to assign one later.' };
    }
    workstream = ws;
  }

  // ── Verify division exists ────────────────────────────────────────────────
  const { data: division, error: divErr } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', division_id)
    .is('deleted_at', null)
    .single();

  if (divErr || !division) {
    return { success: false, error: 'division_id not found or has been deleted.' };
  }

  // ── Verify provided assignees exist ───────────────────────────────────────
  async function verifyAssignedUserOrFail(userId, paramName) {
    if (!userId) { return null; }
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();
    if (userErr || !user) {
      return { success: false, error: `${paramName} not found or has been deleted.` };
    }
    return null;
  }

  const assigneeFailure = (
    await verifyAssignedUserOrFail(assigned_dcs_user_id, 'assigned_dcs_user_id') ||
    await verifyAssignedUserOrFail(assigned_epo_user_id, 'assigned_epo_user_id') ||
    await verifyAssignedUserOrFail(assigned_dol_user_id, 'assigned_dol_user_id')
  );
  if (assigneeFailure) {
    return assigneeFailure;
  }

  // ── Insert cycle ──────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .insert({
      cycle_title:             cycle_title.trim(),
      cycle_description:       cycle_description || null,
      division_id,
      workstream_id:           workstream_id || null,
      tier_classification,
      current_lifecycle_stage: 'BRIEF',
      assigned_dcs_user_id:    assigned_dcs_user_id || null,  // D-389: nullable at creation
      assigned_epo_user_id:    assigned_epo_user_id || null,  // D-390: nullable at creation
      assigned_dol_user_id:    assigned_dol_user_id || null,  // D-391: nullable at creation
      outcome_statement:       outcome_statement    || null,
      jira_epic_key:           jira_epic_key        || null
    })
    .select()
    .single();

  if (cycleErr) {
    return { success: false, error: `Failed to create Initiative: ${cycleErr.message}` };
  }

  const cycle_id = cycle.delivery_cycle_id;

  // ── Seed five milestone_dates rows ────────────────────────────────────────
  // Apply target dates at seed time if supplied in milestone_target_dates param.
  const targetDates = milestone_target_dates || {};
  const milestoneRows = ALL_GATES.map(gate_name => ({
    delivery_cycle_id: cycle_id,
    gate_name,
    milestone_label:   GATE_MILESTONE_LABELS[gate_name],
    target_date:       targetDates[gate_name] || null,
    date_status:       'not_started'
  }));

  const { error: milestonesErr } = await supabase
    .from('cycle_milestone_dates')
    .insert(milestoneRows);

  if (milestonesErr) {
    return { success: false, error: `Initiative created but milestone seeding failed: ${milestonesErr.message}` };
  }

  // ── Seed five gate_record rows ─────────────────────────────────────────────
  // CC-Decision-2026-04-12-B: seed as 'not_started'. 'pending' is now reserved for
  // submitted-for-review state. Prevents premature "Under Review" display on new cycles.
  const gateRows = ALL_GATES.map(gate_name => ({
    delivery_cycle_id: cycle_id,
    gate_name,
    gate_status:       'not_started'
  }));

  const { error: gatesErr } = await supabase
    .from('gate_records')
    .insert(gateRows);

  if (gatesErr) {
    return { success: false, error: `Initiative created but gate record seeding failed: ${gatesErr.message}` };
  }

  // ── Append creation event ─────────────────────────────────────────────────
  const workstreamDesc = workstream
    ? `in ${workstream.workstream_name}`
    : 'with no Workstream assigned (assign before Brief Review gate)';

  const dcsDesc = assigned_dcs_user_id
    ? ` DCS assigned at creation.`
    : ` No DCS assigned yet (required before Brief Review gate).`;
  const epoDesc = assigned_epo_user_id ? ` EPO assigned at creation.` : '';
  const dolDesc = assigned_dol_user_id
    ? ` DOL assigned at creation.`
    : ` No DOL assigned yet (required before Brief Review gate).`;

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id: cycle_id,
      event_type:        'cycle_created',
      event_description: `Initiative "${cycle.cycle_title}" created at ${tier_classification} ${workstreamDesc}.${dcsDesc}${epoDesc}${dolDesc}`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        tier_classification,
        workstream_id:        workstream_id        || null,
        workstream_name:      workstream?.workstream_name || null,
        division_id,
        assigned_dcs_user_id: assigned_dcs_user_id || null,
        assigned_epo_user_id: assigned_epo_user_id || null,
        assigned_dol_user_id: assigned_dol_user_id || null
      }
    });

  return { success: true, data: cycle };
}

module.exports = { create_delivery_cycle };
