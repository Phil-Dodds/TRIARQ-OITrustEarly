// governance-derivation.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1
// Single source of truth for baseline governance level derivation (D-558, D-562).
// Every consumer — upsert_initiative_sizing, derive_governance, DCS
// reassignment hooks, set_trusted_dcs recompute — calls through this module.
// Derivation inputs: Q1/Q2/Q3 direct answers + trusted_dcs of the assigned DCS.
// Q4/Q5 and all sub-answers guide/alert only — they never enter the derivation.

'use strict';

/**
 * Derive the baseline governance level from sizing answers + DCS trust.
 * Spec Section 2.2 (D-558), validated against derivation test table 4.1.
 *
 * @param {object}  sizing            — initiative_sizing row (q1_investment, q2_novelty, q3_wrongness)
 * @param {boolean} assignedDcsTrusted — users.trusted_dcs of the assigned DCS;
 *                                       false when no DCS is assigned (CC-decision:
 *                                       absent DCS cannot be a trusted DCS)
 * @returns {1|2|3}
 */
function deriveBaselineLevel(sizing, assignedDcsTrusted) {
  // Contract 40 WS2 (D-598): "I don't know" is a first-class answer on Q1/Q2/Q3.
  // It derives to the cautious value — Q1 idk → Large, Q2 idk → Major, Q3 idk →
  // Significant — each of which is a Level 2 floor. So any IDK forces Level 2
  // minimum: Level 1 requires Small AND Standard AND Contained, all affirmatively
  // answered. No IDK mapping reaches Level 3 (that needs an explicit X-Large /
  // Large-or-hard answer).
  if (sizing.q1_investment === 'xlarge' || sizing.q3_wrongness === 'large_hard') {
    return 3;
  }
  if (
    sizing.q1_investment === 'medium' ||
    sizing.q1_investment === 'large' ||
    sizing.q1_investment === 'idk' ||       // idk → Large (Level 2 floor)
    sizing.q2_novelty === 'major' ||
    sizing.q2_novelty === 'idk' ||          // idk → Major (Level 2 floor)
    sizing.q3_wrongness === 'significant' ||
    sizing.q3_wrongness === 'idk'           // idk → Significant (Level 2 floor)
  ) {
    return 2;
  }
  return assignedDcsTrusted === true ? 1 : 2;
}

/**
 * Human-readable explanation chips for a derivation (derive_governance tool).
 * Returns the chips that fired, in rule order.
 */
function buildDerivationExplanation(sizing, assignedDcsTrusted) {
  const chips = [];
  if (sizing.q1_investment === 'xlarge') {
    chips.push('Q1 Investment is X-Large → Level 3');
  }
  if (sizing.q3_wrongness === 'large_hard') {
    chips.push('Q3 If-wrong is Large/Hard to correct → Level 3');
  }
  if (chips.length > 0) { return chips; }

  // Contract 40 WS2 (D-598): IDK attributes as "Not yet known (treated as …)".
  if (sizing.q1_investment === 'idk') {
    chips.push('Q1 Investment: Not yet known (treated as Large) → Level 2');
  } else if (sizing.q1_investment === 'medium' || sizing.q1_investment === 'large') {
    chips.push(`Q1 Investment is ${sizing.q1_investment === 'medium' ? 'Medium' : 'Large'} → Level 2`);
  }
  if (sizing.q2_novelty === 'idk') {
    chips.push('Q2 Novelty: Not yet known (treated as Major) → Level 2');
  } else if (sizing.q2_novelty === 'major') {
    chips.push('Q2 Novelty is Major → Level 2');
  }
  if (sizing.q3_wrongness === 'idk') {
    chips.push('Q3 If-wrong: Not yet known (treated as Significant) → Level 2');
  } else if (sizing.q3_wrongness === 'significant') {
    chips.push('Q3 If-wrong is Significant → Level 2');
  }
  if (chips.length > 0) { return chips; }

  // Phil 2026-07-24: the trusted-DCS rule stays silent on screen — never name
  // a person as untrusted. Both branches get the same neutral explanation.
  chips.push(assignedDcsTrusted === true
    ? 'All answers small/standard/contained → Level 1'
    : 'All answers small/standard/contained → Level 2');
  return chips;
}

// Q1 rank order for the sub_exceeds_answer alert. Contract 40 WS2: idk ranks as
// Large (its derived-equivalent) so a sub above Large still alerts under IDK.
const Q1_RANK = { small: 1, medium: 2, large: 3, xlarge: 4, idk: 3 };

/**
 * Guide/alert signals for a sizing row (spec 2.5, upsert_initiative_sizing).
 * - sub_exceeds_answer: a Q1 sub-answer ranks above the Q1 direct answer.
 * - novelty_ux_mismatch: Q2 major + Q5 standard.
 * @returns {string[]} alert codes
 */
function computeSizingAlerts(sizing) {
  const alerts = [];
  const q1Rank = Q1_RANK[sizing.q1_investment];
  if (
    (sizing.q1_sub_engineering && Q1_RANK[sizing.q1_sub_engineering] > q1Rank) ||
    (sizing.q1_sub_operational && Q1_RANK[sizing.q1_sub_operational] > q1Rank)
  ) {
    alerts.push('sub_exceeds_answer');
  }
  if (sizing.q2_novelty === 'major' && sizing.q5_ux === 'standard') {
    alerts.push('novelty_ux_mismatch');
  }
  return alerts;
}

/**
 * Recompute and cache baseline_level for one Initiative (D-562).
 * No sizing row → baseline_level set to NULL (unsized).
 * Returns { baseline_level, set_level, effective_level } or { error }.
 *
 * @param {object} supabase — service-role client
 * @param {string} delivery_cycle_id
 */
async function recomputeBaselineForCycle(supabase, delivery_cycle_id) {
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, assigned_dcs_user_id, set_level')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { error: 'Initiative not found or has been deleted.' };
  }

  const { data: sizing, error: sizingErr } = await supabase
    .from('initiative_sizing')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .maybeSingle();

  if (sizingErr) {
    return { error: `Failed to read sizing: ${sizingErr.message}` };
  }

  let baseline_level = null;
  if (sizing) {
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
    baseline_level = deriveBaselineLevel(sizing, trusted);
  }

  const { error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({ baseline_level })
    .eq('delivery_cycle_id', delivery_cycle_id);

  if (updateErr) {
    return { error: `Failed to cache baseline level: ${updateErr.message}` };
  }

  return {
    baseline_level,
    set_level: cycle.set_level ?? null,
    effective_level: cycle.set_level ?? baseline_level
  };
}

module.exports = {
  deriveBaselineLevel,
  buildDerivationExplanation,
  computeSizingAlerts,
  recomputeBaselineForCycle
};
