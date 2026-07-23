// gate_approvals.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-557, D-560, D-569)
// N-approval collection per gate: record_gate_approval, list_gate_approvals.
// gate_records.approver_user_id (D-463) is untouched — existing single-approval
// flows are unchanged in G1; dual-write of 'assigned' rows begins in G2.
// MCP-layer enforcement (spec 2.4/2.5):
//   - reason required for approval_type='ie_override'
//   - reason required when over_returned_consultation=true
//   - board-triggered gates reject ie_override (D-560)
// CC-G1: ie_override callers restricted to Phil (is_super_admin) until the IE
// role grant lands in G8.

'use strict';

const { supabase } = require('../db');
const { isBoardTriggeredGate } = require('./helpers/board-trigger');

const VALID_APPROVAL_TYPES = ['assigned', 'trio_member', 'ie_override', 'condition_cosign'];

/**
 * Record an approval row against a gate record.
 * @param {string}  params.gate_record_id
 * @param {string}  params.approval_type — 'assigned'|'trio_member'|'ie_override'|'condition_cosign'
 * @param {string}  [params.reason_note]
 * @param {boolean} [params.over_returned_consultation] — D-569 marker, default false
 */
async function record_gate_approval(params, caller_user_id) {
  const { gate_record_id, approval_type, reason_note } = params;
  const over_returned_consultation = params.over_returned_consultation === true;

  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }
  if (!VALID_APPROVAL_TYPES.includes(approval_type)) {
    return { success: false, error: `approval_type must be one of: ${VALID_APPROVAL_TYPES.join(', ')}.` };
  }
  if (approval_type === 'ie_override' && (!reason_note || !String(reason_note).trim())) {
    return {
      success: false,
      error: 'A reason is required for an Initiative Executive override approval (D-560).'
    };
  }
  if (over_returned_consultation && (!reason_note || !String(reason_note).trim())) {
    return {
      success: false,
      error: 'A reason is required when approving over a returned consultation (D-569).'
    };
  }

  const { data: gateRecord, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, gate_status')
    .eq('gate_record_id', gate_record_id)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gateRecord) {
    return { success: false, error: 'Gate record not found.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, ai_functionality, ai_delivery_form, ai_audience')
    .eq('delivery_cycle_id', gateRecord.delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  if (approval_type === 'ie_override') {
    // Board gates are exempt from IE override (D-560).
    if (isBoardTriggeredGate(cycle, gateRecord.gate_name)) {
      return {
        success: false,
        error: 'This gate carries the AI Production Board requirement — board gates cannot be overridden by an Initiative Executive (D-560).'
      };
    }
    // CC-G1: IE role storage lands in G8 — until then only Phil may record
    // an ie_override approval.
    const { data: caller } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (caller?.is_super_admin !== true) {
      return {
        success: false,
        error: 'Initiative Executive override requires the Initiative Executive role (available in a later contract) or Phil.'
      };
    }
  }

  // Duplicate guard: one approval per (gate_record, approver, type).
  const { data: dup } = await supabase
    .from('gate_approvals')
    .select('approval_id')
    .eq('gate_record_id', gate_record_id)
    .eq('approver_user_id', caller_user_id)
    .eq('approval_type', approval_type)
    .maybeSingle();

  if (dup) {
    return { success: false, error: `You have already recorded a '${approval_type}' approval on this gate.` };
  }

  const { data: approval, error: insertErr } = await supabase
    .from('gate_approvals')
    .insert({
      gate_record_id,
      approver_user_id: caller_user_id,
      approval_type,
      over_returned_consultation,
      reason_note: reason_note ? String(reason_note).trim() : null
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to record gate approval: ${insertErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id: gateRecord.delivery_cycle_id,
    event_type:        'gate_approval_recorded',
    event_description: `${approval_type} approval recorded on ${gateRecord.gate_name} gate` +
                       `${over_returned_consultation ? ' over a returned consultation (D-569)' : ''}` +
                       `${reason_note ? `. Reason: ${String(reason_note).trim()}` : '.'}`,
    actor_user_id:     caller_user_id,
    event_metadata:    {
      approval_id: approval.approval_id,
      gate_record_id,
      approval_type,
      over_returned_consultation
    }
  });

  return { success: true, data: approval };
}

/**
 * List the approval collection on a gate record, approvers resolved.
 * @param {string} params.gate_record_id
 */
async function list_gate_approvals(params, caller_user_id) {
  const { gate_record_id } = params;
  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }

  const { data: approvals, error: approvalsErr } = await supabase
    .from('gate_approvals')
    .select('*')
    .eq('gate_record_id', gate_record_id)
    .order('created_at', { ascending: true });

  if (approvalsErr) {
    return { success: false, error: `Failed to list gate approvals: ${approvalsErr.message}` };
  }

  const userIds = [...new Set((approvals || []).map(a => a.approver_user_id))];
  const userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);
    for (const u of users || []) { userMap[u.id] = u.display_name; }
  }

  return {
    success: true,
    data: {
      gate_approvals: (approvals || []).map(a => ({
        ...a,
        approver_display_name: userMap[a.approver_user_id] || null
      }))
    }
  };
}

module.exports = { record_gate_approval, list_gate_approvals };
