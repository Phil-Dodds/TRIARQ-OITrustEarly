// initiative_sizing.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-558, D-562, D-567)
// Sizing answers: get_initiative_sizing, upsert_initiative_sizing,
// derive_governance. Derivation logic lives in lib/governance-derivation.js —
// single source of truth. No behavior change to existing gate flows.

'use strict';

const { supabase } = require('../db');
const {
  deriveBaselineLevel,
  buildDerivationExplanation,
  computeSizingAlerts,
  recomputeBaselineForCycle
} = require('../lib/governance-derivation');
// Contract G3: displaced-approver notification on level-lowering edits.
const { sendGateNotificationEmail } = require('./helpers/notification-email');

const DIRECT_ANSWER_COLUMNS = ['q1_investment', 'q2_novelty', 'q3_wrongness', 'q4_security_impact', 'q5_ux'];

// Contract 40 WS2 (D-598): 'idk' ("I don't know") is a first-class answer on
// Q1/Q2/Q3 — distinct from unanswered (null). Q4/Q5 and all sub-chips do NOT
// accept idk (an unsure Q4/Q5 resolves to Yes/Critical on the client).
const ANSWER_ALLOWED_VALUES = {
  q1_investment: ['small', 'medium', 'large', 'xlarge', 'idk'],
  q2_novelty:    ['standard', 'major', 'idk'],
  q3_wrongness:  ['contained', 'significant', 'large_hard', 'idk'],
  q5_ux:         ['standard', 'critical']
};

const SUB_ALLOWED_VALUES = {
  q1_sub_engineering: ['small', 'medium', 'large', 'xlarge'],
  q1_sub_operational: ['small', 'medium', 'large', 'xlarge'],
  q2_sub_persona:     ['well_known', 'new'],
  q2_sub_scenarios:   ['highly_studied', 'in_discovery'],
  q2_sub_technology:  ['standard', 'new_untried'],
  q3_sub_blast:       ['contained_internal', 'external_large'],
  q3_sub_correctable: ['easy', 'difficult'],
  q5_sub_facing:      ['none', 'patient', 'provider_clinical'],
  q5_sub_application: ['established', 'new_application']
};

const NOTE_COLUMNS = ['q1_note', 'q2_note', 'q3_note', 'q4_note', 'q5_note'];

/**
 * Shared payload validation for upsert + preview (Contract G3).
 * Returns { error } or { directValues, subValues }.
 */
function validateSizingPayload(answers, subs) {
  if (!answers || typeof answers !== 'object') {
    return { error: 'answers object is required — all five direct answers must be provided.' };
  }
  for (const col of DIRECT_ANSWER_COLUMNS) {
    if (answers[col] === undefined || answers[col] === null || answers[col] === '') {
      return { error: `Sizing answer '${col}' is required. All five direct answers must be provided.` };
    }
  }
  for (const [col, allowed] of Object.entries(ANSWER_ALLOWED_VALUES)) {
    if (!allowed.includes(answers[col])) {
      return { error: `Invalid value for '${col}'. Allowed: ${allowed.join(', ')}.` };
    }
  }
  if (typeof answers.q4_security_impact !== 'boolean') {
    return { error: 'q4_security_impact must be true or false.' };
  }

  const subValues = {};
  if (subs && typeof subs === 'object') {
    for (const [col, allowed] of Object.entries(SUB_ALLOWED_VALUES)) {
      if (subs[col] !== undefined && subs[col] !== null) {
        if (!allowed.includes(subs[col])) {
          return { error: `Invalid value for '${col}'. Allowed: ${allowed.join(', ')}.` };
        }
        subValues[col] = subs[col];
      } else if (subs[col] === null) {
        subValues[col] = null;
      }
    }
    if (subs.q2_sub_new_vendor !== undefined) {
      if (subs.q2_sub_new_vendor !== null && typeof subs.q2_sub_new_vendor !== 'boolean') {
        return { error: 'q2_sub_new_vendor must be true, false, or null.' };
      }
      subValues.q2_sub_new_vendor = subs.q2_sub_new_vendor;
    }
  }

  const directValues = {};
  for (const col of DIRECT_ANSWER_COLUMNS) { directValues[col] = answers[col]; }
  return { directValues, subValues };
}

/**
 * Read the sizing row for an Initiative. No row = not yet sized (D-567).
 * @param {object} params.delivery_cycle_id
 */
async function get_initiative_sizing(params, caller_user_id) {
  const { delivery_cycle_id } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  const { data: sizing, error: sizingErr } = await supabase
    .from('initiative_sizing')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .maybeSingle();

  if (sizingErr) {
    return { success: false, error: `Failed to read sizing: ${sizingErr.message}` };
  }

  return { success: true, data: { sizing: sizing || null, is_sized: !!sizing } };
}

/**
 * Create or update the sizing row (D-558). Validates all five direct answers
 * present, recomputes and caches baseline_level, returns alerts.
 * @param {string} params.delivery_cycle_id
 * @param {object} params.answers — { q1_investment, q2_novelty, q3_wrongness, q4_security_impact, q5_ux }
 * @param {object} [params.subs]  — sub-answer columns (guide/alert only)
 * @param {object} [params.notes] — { q1_note … q5_note }
 */
async function upsert_initiative_sizing(params, caller_user_id) {
  const { delivery_cycle_id, answers, subs, notes } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  const validated = validateSizingPayload(answers, subs);
  if (validated.error) {
    return { success: false, error: validated.error };
  }
  const { directValues, subValues } = validated;

  const noteValues = {};
  if (notes && typeof notes === 'object') {
    for (const col of NOTE_COLUMNS) {
      if (notes[col] !== undefined) { noteValues[col] = notes[col] || null; }
    }
  }

  // Cycle must exist and be live.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, baseline_level, set_level, set_level_by_user_id, assigned_dcs_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  const { data: existing, error: existingErr } = await supabase
    .from('initiative_sizing')
    .select('delivery_cycle_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .maybeSingle();

  if (existingErr) {
    return { success: false, error: `Failed to read existing sizing: ${existingErr.message}` };
  }

  // ── Contract G3 — post-Go-to-Build edit guard (D-567/D-562) ────────────────
  // Editing sizing after Go to Build approval requires current-approver
  // confirmation. Two-call pattern (S-023): first call previews, second call
  // with approver_confirmed=true executes. CC-G3 lean: the confirming caller
  // must be the approver of a currently awaiting gate when one exists,
  // otherwise an admin/Phil or (no awaiting gate) any editor.
  let gtbApproved = false;
  let awaitingGates = [];
  const oldEffectiveLevel = cycle.set_level ?? cycle.baseline_level ?? null;
  if (existing) {
    const { data: gateRows } = await supabase
      .from('gate_records')
      .select('gate_record_id, gate_name, gate_status, approver_user_id')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .is('deleted_at', null);
    gtbApproved = (gateRows || []).some(g => g.gate_name === 'go_to_build' && g.gate_status === 'approved');
    awaitingGates = (gateRows || []).filter(g => g.gate_status === 'awaiting_approval');
  }

  // New baseline from the incoming answers (needed for preview + notifications).
  let dcsTrusted = false;
  if (cycle.assigned_dcs_user_id) {
    const { data: dcsRow } = await supabase
      .from('users')
      .select('trusted_dcs')
      .eq('id', cycle.assigned_dcs_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    dcsTrusted = dcsRow?.trusted_dcs === true;
  }
  const incomingBaseline = deriveBaselineLevel(directValues, dcsTrusted);

  if (existing && gtbApproved) {
    if (params.approver_confirmed !== true) {
      return {
        success: true,
        status: 'REQUIRES_APPROVER_CONFIRMATION',
        data: {
          code: 'REQUIRES_APPROVER_CONFIRMATION',
          current_baseline_level: cycle.baseline_level ?? null,
          new_baseline_level: incomingBaseline,
          message: 'Go to Build has been approved on this Initiative. Editing sizing now requires ' +
                   'current-approver confirmation. Confirm to apply the new answers' +
                   (incomingBaseline < (cycle.baseline_level ?? incomingBaseline)
                     ? ' — note this edit lowers the derived governance level.' : '.')
        }
      };
    }
    if (awaitingGates.length > 0) {
      const isAwaitingApprover = awaitingGates.some(g => g.approver_user_id === caller_user_id);
      if (!isAwaitingApprover) {
        const { data: callerRow } = await supabase
          .from('users')
          .select('is_admin, is_super_admin')
          .eq('id', caller_user_id)
          .is('deleted_at', null)
          .maybeSingle();
        if (callerRow?.is_admin !== true && callerRow?.is_super_admin !== true) {
          return {
            success: false,
            error: 'Confirming a post-Go-to-Build sizing edit requires the approver of the gate ' +
                   'currently awaiting approval, or an Admin.'
          };
        }
      }
    }
  }

  // Split UPDATE vs INSERT rather than a single write-or-conflict: Supabase's
  // conflict-write issues INSERT ... ON CONFLICT DO UPDATE, so an edit (existing
  // row) that omits the NOT NULL answered_by_user_id fails the INSERT clause
  // before conflict resolution. A true UPDATE sets only the changed fields and
  // preserves the original answerer's provenance; INSERT stamps it on first answer.
  const answerFields = { ...directValues, ...subValues, ...noteValues };
  let saved, saveErr;
  if (existing) {
    ({ data: saved, error: saveErr } = await supabase
      .from('initiative_sizing')
      .update({ ...answerFields, updated_by_user_id: caller_user_id, updated_at: new Date().toISOString() })
      .eq('delivery_cycle_id', delivery_cycle_id)
      .select()
      .single());
  } else {
    ({ data: saved, error: saveErr } = await supabase
      .from('initiative_sizing')
      .insert({ delivery_cycle_id, ...answerFields, answered_by_user_id: caller_user_id, answered_at: new Date().toISOString() })
      .select()
      .single());
  }

  if (saveErr) {
    return { success: false, error: `Failed to save sizing: ${saveErr.message}` };
  }

  // Recompute + cache baseline (AC #4) via the single source of truth.
  const recompute = await recomputeBaselineForCycle(supabase, delivery_cycle_id);
  if (recompute.error) {
    return { success: false, error: recompute.error };
  }

  const alerts = computeSizingAlerts(saved);

  // ── Contract G3 — S-C6 data support (D-562): baseline rises above a set
  // level → alert + event; the setter is prompted to confirm-or-release.
  if (cycle.set_level !== null && cycle.set_level !== undefined &&
      recompute.baseline_level !== null && recompute.baseline_level > cycle.set_level) {
    alerts.push('baseline_exceeds_set_level');
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'baseline_exceeds_set_level',
      event_description: `Sizing edit raised the computed baseline to Level ${recompute.baseline_level}, ` +
                         `above the set Level ${cycle.set_level}. The setter should confirm or release the set level.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { set_level: cycle.set_level, baseline_level: recompute.baseline_level, set_level_by_user_id: cycle.set_level_by_user_id }
    });
  }

  // ── Contract G3 — lowering edit post-Go-to-Build notifies the displaced
  // approver(s) of any awaiting gate (D-567/D-562, AC #6).
  if (existing && gtbApproved &&
      oldEffectiveLevel !== null && recompute.effective_level !== null &&
      recompute.effective_level < oldEffectiveLevel && awaitingGates.length > 0) {
    const approverIds = [...new Set(awaitingGates.map(g => g.approver_user_id).filter(Boolean))];
    if (approverIds.length > 0) {
      const { data: approverRows } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', approverIds)
        .is('deleted_at', null);
      const recipients = (approverRows || []).filter(u => u.email)
        .map(u => ({ email: u.email, display_name: u.display_name }));
      if (recipients.length > 0) {
        await sendGateNotificationEmail({
          recipients,
          subject:          `${cycle.cycle_title} — sizing edit lowered the governance level`,
          initiativeName:   cycle.cycle_title,
          gateNameDisplay:  'Governance level',
          contextParagraph: `A sizing edit lowered the effective governance level on ${cycle.cycle_title} ` +
                            `from Level ${oldEffectiveLevel} to Level ${recompute.effective_level}. ` +
                            `You are notified as the approver of a gate currently awaiting approval.`,
          delivery_cycle_id,
          email_type:       'governance_level_lowered'
        });
      }
    }
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'sizing_lowered_level',
      event_description: `Sizing edit lowered the effective governance level from ${oldEffectiveLevel} to ${recompute.effective_level}.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { old_effective_level: oldEffectiveLevel, new_effective_level: recompute.effective_level }
    });
  }

  // ── Contract G3 — D-563 vendor rule: Q2 new-vendor sub = yes sets the
  // IT/Infrastructure Informed flag (automatic, awareness-only; set_via 'rule';
  // idempotent — display-only until G4 surfaces participation).
  if (saved.q2_sub_new_vendor === true) {
    const { data: itGroup } = await supabase
      .from('specialty_groups')
      .select('group_id, group_name')
      .eq('group_name', 'IT/Infrastructure')
      .maybeSingle();
    if (itGroup) {
      const { data: existingStake } = await supabase
        .from('participation_records')
        .select('record_id')
        .eq('delivery_cycle_id', delivery_cycle_id)
        .eq('letter', 'I')
        .eq('holder_group_id', itGroup.group_id)
        .is('removed_at', null)
        .maybeSingle();
      if (!existingStake) {
        await supabase.from('participation_records').insert({
          delivery_cycle_id,
          letter:          'I',
          holder_group_id: itGroup.group_id,
          set_via:         'rule',
          set_by_user_id:  caller_user_id
        });
      }
    }
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        existing ? 'sizing_updated' : 'sizing_answered',
    event_description: `${existing ? 'Sizing updated' : 'Sizing answered'} — baseline governance level ${recompute.baseline_level ?? 'unset'}.`,
    actor_user_id:     caller_user_id,
    event_metadata:    { answers: directValues, baseline_level: recompute.baseline_level, alerts }
  });

  return {
    success: true,
    data: {
      sizing:          saved,
      baseline_level:  recompute.baseline_level,
      effective_level: recompute.effective_level,
      alerts
    }
  };
}

/**
 * Contract G3 — stateless derivation preview for the creation form's live
 * Governance panel (CC-G3: new tool rather than duplicating derivation
 * client-side — lib/governance-derivation.js stays the single source of truth).
 * No cycle required; DCS trust read from users when dcs_user_id supplied.
 * @param {object} params.answers — five direct answers (validated as upsert)
 * @param {object} [params.subs]
 * @param {string} [params.dcs_user_id]
 */
async function preview_governance_derivation(params, caller_user_id) {
  const validated = validateSizingPayload(params.answers, params.subs);
  if (validated.error) {
    return { success: false, error: validated.error };
  }
  const { directValues, subValues } = validated;

  let dcsTrusted = false;
  if (params.dcs_user_id) {
    const { data: dcsRow } = await supabase
      .from('users')
      .select('trusted_dcs')
      .eq('id', params.dcs_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    dcsTrusted = dcsRow?.trusted_dcs === true;
  }

  const sizingShape = { ...directValues, ...subValues };
  return {
    success: true,
    data: {
      baseline_level:    deriveBaselineLevel(sizingShape, dcsTrusted),
      explanation_chips: buildDerivationExplanation(sizingShape, dcsTrusted),
      alerts:            computeSizingAlerts(sizingShape),
      dcs_trusted:       dcsTrusted
    }
  };
}

/**
 * Read-only recompute + explanation chips (spec 2.5). Does NOT write the cache.
 * @param {string} params.delivery_cycle_id
 */
async function derive_governance(params, caller_user_id) {
  const { delivery_cycle_id } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, assigned_dcs_user_id, baseline_level, set_level, set_level_reason')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  const { data: sizing, error: sizingErr } = await supabase
    .from('initiative_sizing')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .maybeSingle();

  if (sizingErr) {
    return { success: false, error: `Failed to read sizing: ${sizingErr.message}` };
  }

  if (!sizing) {
    return {
      success: true,
      data: {
        is_sized: false,
        baseline_level: null,
        set_level: cycle.set_level ?? null,
        effective_level: cycle.set_level ?? null,
        explanation_chips: ['Not yet sized — sizing is required at the next gate (D-567).'],
        alerts: []
      }
    };
  }

  let trusted = false;
  if (cycle.assigned_dcs_user_id) {
    const { data: dcs } = await supabase
      .from('users')
      .select('trusted_dcs')
      .eq('id', cycle.assigned_dcs_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    trusted = dcs?.trusted_dcs === true;
  }

  const baseline = deriveBaselineLevel(sizing, trusted);
  return {
    success: true,
    data: {
      is_sized: true,
      baseline_level: baseline,
      cached_baseline_level: cycle.baseline_level ?? null,
      set_level: cycle.set_level ?? null,
      set_level_reason: cycle.set_level_reason ?? null,
      effective_level: cycle.set_level ?? baseline,
      explanation_chips: buildDerivationExplanation(sizing, trusted),
      alerts: computeSizingAlerts(sizing)
    }
  };
}

module.exports = {
  get_initiative_sizing,
  upsert_initiative_sizing,
  derive_governance,
  preview_governance_derivation
};
