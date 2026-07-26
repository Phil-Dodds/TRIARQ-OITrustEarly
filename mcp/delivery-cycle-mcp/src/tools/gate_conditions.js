// gate_conditions.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-565)
// Approver conditions on gates: add_gate_condition, resolve_gate_condition,
// list_gate_conditions. Waiting-on integration and consultation auto-resolve
// wiring land in G6 — G1 ships the primitive.
// CC-G1: spec column "status" is condition_status (S-003 — no bare generic nouns).

'use strict';

const { supabase } = require('../db');

const VALID_CONDITION_TYPES = ['general', 'consultation_required'];

/**
 * Add a condition to a gate record.
 * @param {string} params.gate_record_id
 * @param {string} params.type — 'general' | 'consultation_required'
 * @param {string} params.text — condition statement
 * @param {string} [params.target_consultation_id] — required when type='consultation_required'
 */
async function add_gate_condition(params, caller_user_id) {
  const { gate_record_id, type, text, target_consultation_id } = params;
  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }
  if (!VALID_CONDITION_TYPES.includes(type)) {
    return { success: false, error: `type must be one of: ${VALID_CONDITION_TYPES.join(', ')}.` };
  }
  if (!text || !String(text).trim()) {
    return { success: false, error: 'Condition text is required.' };
  }

  const { data: gateRecord, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, approver_user_id')
    .eq('gate_record_id', gate_record_id)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gateRecord) {
    return { success: false, error: 'Gate record not found.' };
  }

  // ── Contract G6 (D-565): conditions are the approver's tool — setter must be
  // the gate's resolved approver, an L1 trio member, or an Admin (CC-G6 lean).
  {
    let authorized = gateRecord.approver_user_id === caller_user_id;
    if (!authorized) {
      const { data: cycleRow } = await supabase
        .from('delivery_cycles')
        .select('assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
        .eq('delivery_cycle_id', gateRecord.delivery_cycle_id)
        .is('deleted_at', null)
        .maybeSingle();
      const isTrio = cycleRow &&
        [cycleRow.assigned_dcs_user_id, cycleRow.assigned_epo_user_id, cycleRow.assigned_dol_user_id]
          .includes(caller_user_id);
      if (!isTrio) {
        const { data: callerRow } = await supabase
          .from('users')
          .select('is_admin, is_super_admin')
          .eq('id', caller_user_id)
          .is('deleted_at', null)
          .maybeSingle();
        authorized = callerRow?.is_admin === true || callerRow?.is_super_admin === true;
      } else {
        authorized = true;
      }
    }
    if (!authorized) {
      return {
        success: false,
        error: 'Setting a gate condition requires the gate\'s approver, an Initiative trio member, or an Admin.'
      };
    }
  }

  if (type === 'consultation_required') {
    if (!target_consultation_id) {
      return {
        success: false,
        error: "target_consultation_id is required when type is 'consultation_required'."
      };
    }
    const { data: consultation, error: consultErr } = await supabase
      .from('gate_consultations')
      .select('id, gate_record_id')
      .eq('id', target_consultation_id)
      .single();

    if (consultErr || !consultation) {
      return { success: false, error: 'Target consultation not found.' };
    }
    if (consultation.gate_record_id !== gate_record_id) {
      return { success: false, error: 'Target consultation belongs to a different gate record.' };
    }
  } else if (target_consultation_id) {
    return { success: false, error: "target_consultation_id is only valid when type is 'consultation_required'." };
  }

  const { data: condition, error: insertErr } = await supabase
    .from('gate_conditions')
    .insert({
      gate_record_id,
      condition_type:         type,
      condition_text:         String(text).trim(),
      target_consultation_id: target_consultation_id || null,
      set_by_user_id:         caller_user_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to add gate condition: ${insertErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id: gateRecord.delivery_cycle_id,
    event_type:        'gate_condition_added',
    event_description: `Condition added to ${gateRecord.gate_name} gate (${type}): ${String(text).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { condition_id: condition.condition_id, gate_record_id, condition_type: type }
  });

  return { success: true, data: condition };
}

/**
 * Resolve an open condition. Resolver must be the condition setter or an
 * admin/Phil (CC-G1 — spec silent; gate-progress integrity posture).
 * @param {string} params.condition_id
 * @param {string} [params.note]
 */
async function resolve_gate_condition(params, caller_user_id) {
  const { condition_id, note } = params;
  if (!condition_id) {
    return { success: false, error: 'condition_id is required.' };
  }

  const { data: condition, error: conditionErr } = await supabase
    .from('gate_conditions')
    .select('condition_id, gate_record_id, condition_type, condition_text, condition_status, set_by_user_id')
    .eq('condition_id', condition_id)
    .single();

  if (conditionErr || !condition) {
    return { success: false, error: 'Gate condition not found.' };
  }
  if (condition.condition_status === 'resolved') {
    return { success: false, error: 'This condition has already been resolved.' };
  }

  if (condition.set_by_user_id !== caller_user_id) {
    // G6 (CC-G1-20 extended per spec): the gate's current approver may also
    // resolve, alongside the setter and Admins.
    const { data: gateRow } = await supabase
      .from('gate_records')
      .select('approver_user_id')
      .eq('gate_record_id', condition.gate_record_id)
      .is('deleted_at', null)
      .maybeSingle();
    const isGateApprover = gateRow?.approver_user_id === caller_user_id;
    if (!isGateApprover) {
      const { data: caller } = await supabase
        .from('users')
        .select('is_admin, is_super_admin')
        .eq('id', caller_user_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (caller?.is_admin !== true && caller?.is_super_admin !== true) {
        return {
          success: false,
          error: 'Resolving a gate condition requires the condition setter, the gate\'s approver, or an Admin role.'
        };
      }
    }
  }

  const { data: resolved, error: resolveErr } = await supabase
    .from('gate_conditions')
    .update({
      condition_status:    'resolved',
      resolved_at:         new Date().toISOString(),
      resolved_by_user_id: caller_user_id,
      resolution_note:     note ? String(note).trim() : null
    })
    .eq('condition_id', condition_id)
    .select()
    .single();

  if (resolveErr) {
    return { success: false, error: `Failed to resolve gate condition: ${resolveErr.message}` };
  }

  const { data: gateRecord } = await supabase
    .from('gate_records')
    .select('delivery_cycle_id, gate_name')
    .eq('gate_record_id', condition.gate_record_id)
    .maybeSingle();

  if (gateRecord) {
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id: gateRecord.delivery_cycle_id,
      event_type:        'gate_condition_resolved',
      event_description: `Condition resolved on ${gateRecord.gate_name} gate${note ? `. Note: ${String(note).trim()}` : '.'}`,
      actor_user_id:     caller_user_id,
      event_metadata:    { condition_id, gate_record_id: condition.gate_record_id }
    });
  }

  return { success: true, data: resolved };
}

/**
 * List conditions on a gate record (open first, then resolved, chronological).
 * @param {string} params.gate_record_id
 */
async function list_gate_conditions(params, caller_user_id) {
  const { gate_record_id } = params;
  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }

  const { data: conditions, error: conditionsErr } = await supabase
    .from('gate_conditions')
    .select('*')
    .eq('gate_record_id', gate_record_id)
    .order('condition_status', { ascending: false }) // 'open' > 'resolved' descending text order
    .order('created_at', { ascending: true });

  if (conditionsErr) {
    return { success: false, error: `Failed to list gate conditions: ${conditionsErr.message}` };
  }

  return { success: true, data: { gate_conditions: conditions || [] } };
}

/**
 * Withdraw an open condition — "no longer applies" (Phil ruling 2026-07-26,
 * migration 090). Reason REQUIRED; never-delete posture: status 'withdrawn',
 * reason stored on resolution_note, history stays readable in retro.
 * Authority mirrors resolve: setter, the gate's approver, or Admin.
 */
async function withdraw_gate_condition(params, caller_user_id) {
  const { condition_id, reason } = params;
  if (!condition_id) {
    return { success: false, error: 'condition_id is required.' };
  }
  if (!reason || !String(reason).trim()) {
    return { success: false, error: 'A reason is required to withdraw a condition — it is recorded on the gate history.' };
  }

  const { data: condition, error: conditionErr } = await supabase
    .from('gate_conditions')
    .select('condition_id, gate_record_id, condition_status, set_by_user_id')
    .eq('condition_id', condition_id)
    .single();
  if (conditionErr || !condition) {
    return { success: false, error: 'Gate condition not found.' };
  }
  if (condition.condition_status !== 'open') {
    return { success: false, error: `Only open conditions can be withdrawn — this one is ${condition.condition_status}.` };
  }

  if (condition.set_by_user_id !== caller_user_id) {
    const { data: gateRow } = await supabase
      .from('gate_records')
      .select('approver_user_id')
      .eq('gate_record_id', condition.gate_record_id)
      .is('deleted_at', null)
      .maybeSingle();
    const isGateApprover = gateRow?.approver_user_id === caller_user_id;
    if (!isGateApprover) {
      const { data: caller } = await supabase
        .from('users')
        .select('is_admin, is_super_admin')
        .eq('id', caller_user_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (caller?.is_admin !== true && caller?.is_super_admin !== true) {
        return {
          success: false,
          error: 'Withdrawing a gate condition requires the condition setter, the gate\'s approver, or an Admin role.'
        };
      }
    }
  }

  const { data: withdrawn, error: withdrawErr } = await supabase
    .from('gate_conditions')
    .update({
      condition_status:    'withdrawn',
      resolved_at:         new Date().toISOString(),
      resolved_by_user_id: caller_user_id,
      resolution_note:     `Withdrawn — ${String(reason).trim()}`
    })
    .eq('condition_id', condition_id)
    .select()
    .single();
  if (withdrawErr) {
    return { success: false, error: `Failed to withdraw gate condition: ${withdrawErr.message}` };
  }

  const { data: gateRecord } = await supabase
    .from('gate_records')
    .select('delivery_cycle_id, gate_name')
    .eq('gate_record_id', condition.gate_record_id)
    .maybeSingle();
  if (gateRecord) {
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id: gateRecord.delivery_cycle_id,
      event_type:        'gate_condition_withdrawn',
      event_description: `Condition withdrawn on ${gateRecord.gate_name} gate — ${String(reason).trim()}`,
      actor_user_id:     caller_user_id,
      event_metadata:    { condition_id, gate_record_id: condition.gate_record_id }
    });
  }

  return { success: true, data: withdrawn };
}

module.exports = { add_gate_condition, resolve_gate_condition, withdraw_gate_condition, list_gate_conditions };
