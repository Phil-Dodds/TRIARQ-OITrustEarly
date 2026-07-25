// force_close_initiative.js — Phil 2026-07-24
// Phil-only data-cleanup / testing lever: approves every remaining gate on an
// Initiative in sequence (reusing the shared applyGateApprovalTransition so
// stage advancement, milestones, and events behave exactly like real
// approvals), closing the Initiative without completing its gates.
//
// Auth: users.is_super_admin = true (Phil's row only). The UI confirms before
// calling; every use writes a phil_override event.

const { supabase } = require('../db');
const { isPhil } = require('./helpers/phil');
const { applyGateApprovalTransition } = require('./record_gate_decision');

const GATE_ORDER = [
  'brief_review',
  'go_to_build',
  'go_to_deploy',
  'go_to_release',
  'close_review'
];

const RESOLVED = new Set(['approved', 'skipped']);

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} caller_user_id - from JWT (must be Phil)
 */
async function force_close_initiative(params, caller_user_id) {
  const { delivery_cycle_id } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  if (!(await isPhil(caller_user_id))) {
    return { success: false, error: 'force_close_initiative is available to Phil only.' };
  }

  const { data: caller } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  const callerDisplayName = caller?.display_name ?? 'Phil';

  const approvedGates = [];
  for (const gate_name of GATE_ORDER) {
    // Re-fetch the cycle each pass — the transition advances the stage.
    const { data: cycle, error: cycleErr } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, workstream_id, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, baseline_level, set_level, ai_functionality, ai_delivery_form, ai_audience')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .is('deleted_at', null)
      .single();
    if (cycleErr || !cycle) {
      return { success: false, error: 'Initiative not found or has been deleted.' };
    }

    const { data: gate_record, error: gateErr } = await supabase
      .from('gate_records')
      .select('gate_record_id, gate_status, approver_user_id')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('gate_name', gate_name)
      .is('deleted_at', null)
      .single();
    if (gateErr || !gate_record) {
      return {
        success: false,
        error: `Gate record for '${gate_name}' not found on this Initiative — stopped after: ${approvedGates.join(', ') || 'none'}.`
      };
    }

    if (RESOLVED.has(gate_record.gate_status)) { continue; }

    const transition = await applyGateApprovalTransition({
      delivery_cycle_id, gate_name, gate_record, cycle,
      actor_user_id: caller_user_id,
      actorDisplayName: callerDisplayName,
      approver_user_id_for_record: caller_user_id,
      approver_notes: 'Force-closed by Phil (data cleanup / testing override).'
    });
    if (transition.error) {
      return {
        success: false,
        error: `Force-close stopped at ${gate_name}: ${transition.error}. Approved before stopping: ${approvedGates.join(', ') || 'none'}.`
      };
    }
    approvedGates.push(gate_name);
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'phil_override',
    event_description: `Phil force-closed this Initiative — remaining gates approved in sequence (${approvedGates.join(', ') || 'none remaining'}).`,
    actor_user_id:     caller_user_id,
    event_metadata:    { action: 'force_close', gates_approved: approvedGates }
  });

  return { success: true, data: { delivery_cycle_id, gates_approved: approvedGates } };
}

module.exports = { force_close_initiative };
