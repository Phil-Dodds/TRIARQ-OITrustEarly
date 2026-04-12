// create_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Creates a new Delivery Cycle. Seeds five cycle_milestone_dates rows and
// gate_records for all five gates. Appends creation event to cycle_event_log.
// DS, CB, CE, Phil, and Admin roles may create cycles.
//
// D-165: workstream_id is optional at creation. If provided, it must exist.
// It does not need to be active at creation — active status is checked at gate time (ARCH-23).
// Workstream must be assigned before Brief Review gate can be submitted.
//
// CC-006 (Session 2026-04-04): cycle_owner_user_id removed — same person as assigned_ds_user_id.
// assigned_ds_user_id is nullable at creation; required before Brief Review gate (enforced in submit_gate_for_approval).
// assigned_cb_user_id is nullable at creation; required before Go to Build gate.
// D-194 (Session 2026-04-06): assigned_cb_user_id added to create params — single-call creation (Option B).
//
// Source: D-83, D-108, D-124, D-125, D-165, CC-006, D-194, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');
const { GATE_MILESTONE_LABELS, ALL_GATES } = require('../lifecycle');

/**
 * @param {object} params
 * @param {string}  params.cycle_title
 * @param {string}  [params.cycle_description]
 * @param {string}  params.division_id
 * @param {string}  [params.workstream_id]         — Optional at creation (D-165)
 * @param {string}  params.tier_classification     — 'tier_1' | 'tier_2' | 'tier_3'
 * @param {string}  [params.assigned_ds_user_id]   — Optional at creation (CC-006); required before Brief Review gate
 * @param {string}  [params.assigned_cb_user_id]   — Optional at creation (D-194); required before Go to Build gate
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
    assigned_ds_user_id,
    assigned_cb_user_id,
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
  if (!['tier_1', 'tier_2', 'tier_3'].includes(tier_classification)) {
    return { success: false, error: 'tier_classification must be one of: tier_1, tier_2, tier_3.' };
  }
  // assigned_ds_user_id is optional at creation (CC-006) — required before Brief Review gate.
  // assigned_cb_user_id is optional at creation (D-194) — required before Go to Build gate.
  // No required checks here — gate enforcement is in submit_gate_for_approval.

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
  if (!['ds', 'cb', 'ce', 'phil', 'admin'].includes(caller.system_role)) {
    return {
      success: false,
      error: 'Creating Delivery Cycles requires DS, CB, CE, Admin, or Phil role. Your current role does not have this permission.'
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

  // ── Verify assigned DS exists (if provided) ───────────────────────────────
  if (assigned_ds_user_id) {
    const { data: ds, error: dsErr } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', assigned_ds_user_id)
      .is('deleted_at', null)
      .single();

    if (dsErr || !ds) {
      return { success: false, error: 'assigned_ds_user_id not found or has been deleted.' };
    }
  }

  // ── Verify assigned CB exists (if provided) ───────────────────────────────
  if (assigned_cb_user_id) {
    const { data: cb, error: cbErr } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', assigned_cb_user_id)
      .is('deleted_at', null)
      .single();

    if (cbErr || !cb) {
      return { success: false, error: 'assigned_cb_user_id not found or has been deleted.' };
    }
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
      assigned_ds_user_id:     assigned_ds_user_id || null,  // CC-006: nullable at creation
      assigned_cb_user_id:     assigned_cb_user_id || null,  // D-194: nullable at creation
      outcome_statement:       outcome_statement   || null,
      jira_epic_key:           jira_epic_key       || null
    })
    .select()
    .single();

  if (cycleErr) {
    return { success: false, error: `Failed to create Delivery Cycle: ${cycleErr.message}` };
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
    return { success: false, error: `Cycle created but milestone seeding failed: ${milestonesErr.message}` };
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
    return { success: false, error: `Cycle created but gate record seeding failed: ${gatesErr.message}` };
  }

  // ── Append creation event ─────────────────────────────────────────────────
  const workstreamDesc = workstream
    ? `in ${workstream.workstream_name}`
    : 'with no Workstream assigned (assign before Brief Review gate)';

  const dsDesc = assigned_ds_user_id
    ? ` DS assigned at creation.`
    : ` No DS assigned yet (required before Brief Review gate).`;

  const cbDesc = assigned_cb_user_id
    ? ` CB assigned at creation.`
    : '';

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id: cycle_id,
      event_type:        'cycle_created',
      event_description: `Delivery Cycle "${cycle.cycle_title}" created at ${tier_classification} ${workstreamDesc}.${dsDesc}${cbDesc}`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        tier_classification,
        workstream_id:       workstream_id       || null,
        workstream_name:     workstream?.workstream_name || null,
        division_id,
        assigned_ds_user_id: assigned_ds_user_id || null,
        assigned_cb_user_id: assigned_cb_user_id || null
      }
    });

  return { success: true, data: cycle };
}

module.exports = { create_delivery_cycle };
