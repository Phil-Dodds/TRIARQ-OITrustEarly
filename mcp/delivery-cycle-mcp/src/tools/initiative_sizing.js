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

const DIRECT_ANSWER_COLUMNS = ['q1_investment', 'q2_novelty', 'q3_wrongness', 'q4_security_impact', 'q5_ux'];

const ANSWER_ALLOWED_VALUES = {
  q1_investment: ['small', 'medium', 'large', 'xlarge'],
  q2_novelty:    ['standard', 'major'],
  q3_wrongness:  ['contained', 'significant', 'large_hard'],
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
  if (!answers || typeof answers !== 'object') {
    return { success: false, error: 'answers object is required — all five direct answers must be provided.' };
  }

  // All five direct answers required (spec 2.1 / AC #2).
  for (const col of DIRECT_ANSWER_COLUMNS) {
    if (answers[col] === undefined || answers[col] === null || answers[col] === '') {
      return { success: false, error: `Sizing answer '${col}' is required. All five direct answers must be provided.` };
    }
  }
  for (const [col, allowed] of Object.entries(ANSWER_ALLOWED_VALUES)) {
    if (!allowed.includes(answers[col])) {
      return { success: false, error: `Invalid value for '${col}'. Allowed: ${allowed.join(', ')}.` };
    }
  }
  if (typeof answers.q4_security_impact !== 'boolean') {
    return { success: false, error: 'q4_security_impact must be true or false.' };
  }

  // Validate subs (nullable).
  const subValues = {};
  if (subs && typeof subs === 'object') {
    for (const [col, allowed] of Object.entries(SUB_ALLOWED_VALUES)) {
      if (subs[col] !== undefined && subs[col] !== null) {
        if (!allowed.includes(subs[col])) {
          return { success: false, error: `Invalid value for '${col}'. Allowed: ${allowed.join(', ')}.` };
        }
        subValues[col] = subs[col];
      } else if (subs[col] === null) {
        subValues[col] = null;
      }
    }
    if (subs.q2_sub_new_vendor !== undefined) {
      if (subs.q2_sub_new_vendor !== null && typeof subs.q2_sub_new_vendor !== 'boolean') {
        return { success: false, error: 'q2_sub_new_vendor must be true, false, or null.' };
      }
      subValues.q2_sub_new_vendor = subs.q2_sub_new_vendor;
    }
  }

  const noteValues = {};
  if (notes && typeof notes === 'object') {
    for (const col of NOTE_COLUMNS) {
      if (notes[col] !== undefined) { noteValues[col] = notes[col] || null; }
    }
  }

  // Cycle must exist and be live.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, set_level')
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

  const directValues = {};
  for (const col of DIRECT_ANSWER_COLUMNS) { directValues[col] = answers[col]; }

  const row = {
    delivery_cycle_id,
    ...directValues,
    ...subValues,
    ...noteValues,
    ...(existing
      ? { updated_by_user_id: caller_user_id, updated_at: new Date().toISOString() }
      : { answered_by_user_id: caller_user_id, answered_at: new Date().toISOString() })
  };

  const { data: saved, error: saveErr } = await supabase
    .from('initiative_sizing')
    .upsert(row, { onConflict: 'delivery_cycle_id' })
    .select()
    .single();

  if (saveErr) {
    return { success: false, error: `Failed to save sizing: ${saveErr.message}` };
  }

  // Recompute + cache baseline (AC #4) via the single source of truth.
  const recompute = await recomputeBaselineForCycle(supabase, delivery_cycle_id);
  if (recompute.error) {
    return { success: false, error: recompute.error };
  }

  const alerts = computeSizingAlerts(saved);

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

module.exports = { get_initiative_sizing, upsert_initiative_sizing, derive_governance };
