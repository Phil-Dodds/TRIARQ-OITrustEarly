// create_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Creates a new Delivery Cycle. Seeds five cycle_milestone_dates rows and
// gate_records for all five gates. Appends creation event to cycle_event_log.
// DS and Phil roles may create cycles.
// Source: D-83, D-108, D-124, D-125, build-c-spec Section 4.1

'use strict';

const { supabase } = require('../db');
const { GATE_MILESTONE_LABELS, ALL_GATES } = require('../lifecycle');

/**
 * @param {object} params
 * @param {string} params.cycle_title
 * @param {string} [params.cycle_description]
 * @param {string} params.division_id
 * @param {string} params.workstream_id
 * @param {string} params.tier_classification  — 'tier_1' | 'tier_2' | 'tier_3'
 * @param {string} params.cycle_owner_user_id
 * @param {string} [params.jira_epic_key]
 * @param {string} caller_user_id - from JWT
 */
async function create_delivery_cycle(params, caller_user_id) {
  const {
    cycle_title,
    cycle_description,
    division_id,
    workstream_id,
    tier_classification,
    cycle_owner_user_id,
    jira_epic_key
  } = params;

  // ── Validation ────────────────────────────────────────────────────────────
  if (!cycle_title || !cycle_title.trim()) {
    return { success: false, error: 'cycle_title is required.' };
  }
  if (!division_id) {
    return { success: false, error: 'division_id is required.' };
  }
  if (!workstream_id) {
    return { success: false, error: 'workstream_id is required.' };
  }
  if (!tier_classification) {
    return { success: false, error: 'tier_classification is required.' };
  }
  if (!['tier_1', 'tier_2', 'tier_3'].includes(tier_classification)) {
    return { success: false, error: 'tier_classification must be one of: tier_1, tier_2, tier_3.' };
  }
  if (!cycle_owner_user_id) {
    return { success: false, error: 'cycle_owner_user_id is required.' };
  }

  // ── Caller role check (DS, CB, CE, or Phil may create cycles) ────────────
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

  // ── Verify workstream exists and is active ────────────────────────────────
  const { data: workstream, error: wsErr } = await supabase
    .from('delivery_workstreams')
    .select('workstream_id, workstream_name, active_status, home_division_id')
    .eq('workstream_id', workstream_id)
    .is('deleted_at', null)
    .single();

  if (wsErr || !workstream) {
    return { success: false, error: 'workstream_id not found or has been deleted.' };
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

  // ── Verify cycle owner exists ─────────────────────────────────────────────
  const { data: owner, error: ownerErr } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('id', cycle_owner_user_id)
    .is('deleted_at', null)
    .single();

  if (ownerErr || !owner) {
    return { success: false, error: 'cycle_owner_user_id not found or has been deleted.' };
  }

  // ── Insert cycle ──────────────────────────────────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .insert({
      cycle_title:             cycle_title.trim(),
      cycle_description:       cycle_description || null,
      division_id,
      workstream_id,
      tier_classification,
      current_lifecycle_stage: 'BRIEF',
      cycle_owner_user_id,
      jira_epic_key:           jira_epic_key || null
    })
    .select()
    .single();

  if (cycleErr) {
    return { success: false, error: `Failed to create Delivery Cycle: ${cycleErr.message}` };
  }

  const cycle_id = cycle.delivery_cycle_id;

  // ── Seed five milestone_dates rows ────────────────────────────────────────
  const milestoneRows = ALL_GATES.map(gate_name => ({
    delivery_cycle_id: cycle_id,
    gate_name,
    milestone_label:   GATE_MILESTONE_LABELS[gate_name],
    date_status:       'not_started'
  }));

  const { error: milestonesErr } = await supabase
    .from('cycle_milestone_dates')
    .insert(milestoneRows);

  if (milestonesErr) {
    return { success: false, error: `Cycle created but milestone seeding failed: ${milestonesErr.message}` };
  }

  // ── Seed five gate_record rows ─────────────────────────────────────────────
  const gateRows = ALL_GATES.map(gate_name => ({
    delivery_cycle_id: cycle_id,
    gate_name,
    gate_status:       'pending'
  }));

  const { error: gatesErr } = await supabase
    .from('gate_records')
    .insert(gateRows);

  if (gatesErr) {
    return { success: false, error: `Cycle created but gate record seeding failed: ${gatesErr.message}` };
  }

  // ── Append creation event ─────────────────────────────────────────────────
  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id: cycle_id,
      event_type:        'cycle_created',
      event_description: `Delivery Cycle "${cycle.cycle_title}" created at ${tier_classification} in ${workstream.workstream_name}.`,
      actor_user_id:     caller_user_id,
      event_metadata: {
        tier_classification,
        workstream_id,
        workstream_name: workstream.workstream_name,
        division_id
      }
    });

  return { success: true, data: cycle };
}

module.exports = { create_delivery_cycle };
