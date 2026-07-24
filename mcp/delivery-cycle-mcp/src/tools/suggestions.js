// suggestions.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G9 (D-563 Grade 2)
// Exactly TWO hardcoded suggestion rules — no rules framework (a framework
// arrives only when rule three does):
//   q4_security — Q4 = Yes  → Security as Consulted (natural gate: Go to Build)
//   q5_ux       — Q5 = Critical → UX as Consulted (Brief Review + Go to Build)
// The named gates are the rules' rationale; v1 participation stakes are
// initiative-level (CC-G9 lean, consistent with D-563 division defaults).
// A suggestion is LIVE when its answer condition holds, the group has no
// active C stake, and no dismissal exists. Dismissal requires a note and is
// visible to the relevant specialty (S-C7).

'use strict';

const { supabase } = require('../db');

const SUGGESTION_RULES = {
  q4_security: {
    group_name: 'Security',
    label: 'Security as Consulted',
    rationale: 'Q4 flags a new security or access element — Security consults at Go to Build.',
    applies: (sizing) => sizing?.q4_security_impact === true
  },
  q5_ux: {
    group_name: 'UX',
    label: 'UX as Consulted',
    rationale: 'Q5 marks UX involvement critical — UX consults at Brief Review and Go to Build.',
    applies: (sizing) => sizing?.q5_ux === 'critical'
  }
};

/** Shared loader: sizing + groups + active C stakes + dismissals. */
async function loadSuggestionState(delivery_cycle_id) {
  const [{ data: sizing }, { data: groups }, { data: stakes }, { data: dismissals }] = await Promise.all([
    supabase.from('initiative_sizing')
      .select('q4_security_impact, q5_ux')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .maybeSingle(),
    supabase.from('specialty_groups')
      .select('group_id, group_name')
      .in('group_name', ['Security', 'UX']),
    supabase.from('participation_records')
      .select('holder_group_id, letter')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('letter', 'C')
      .is('removed_at', null),
    supabase.from('suggestion_dismissals')
      .select('rule_key, group_id, note, dismissed_by_user_id, created_at')
      .eq('delivery_cycle_id', delivery_cycle_id)
  ]);

  const groupByName = {};
  (groups || []).forEach(g => { groupByName[g.group_name] = g; });
  const stakedGroupIds = new Set((stakes || []).map(s => s.holder_group_id).filter(Boolean));
  const dismissalByRule = {};
  (dismissals || []).forEach(d => { dismissalByRule[d.rule_key] = d; });

  const suggestions = [];
  for (const [rule_key, rule] of Object.entries(SUGGESTION_RULES)) {
    const group = groupByName[rule.group_name];
    if (!group) { continue; }
    const applies = rule.applies(sizing);
    const attached = stakedGroupIds.has(group.group_id);
    const dismissal = dismissalByRule[rule_key] ?? null;
    suggestions.push({
      rule_key,
      group_id: group.group_id,
      group_name: group.group_name,
      label: rule.label,
      rationale: rule.rationale,
      applies,
      attached,
      dismissed: !!dismissal,
      dismissal_note: dismissal?.note ?? null,
      dismissed_by_user_id: dismissal?.dismissed_by_user_id ?? null,
      live: applies && !attached && !dismissal
    });
  }
  return suggestions;
}

/**
 * Read the suggestion state for an Initiative — live suggestions, attached
 * rules, dismissals with notes (the specialty-visible record, S-C7).
 */
async function get_suggestion_state(params, caller_user_id) {
  const { delivery_cycle_id } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  const suggestions = await loadSuggestionState(delivery_cycle_id);
  return { success: true, data: { suggestions } };
}

/**
 * Apply the trio's decision on a suggestion: Add attaches the group as
 * Consulted (set_via 'rule'); Dismiss requires a note and records the
 * dismissal (visible to the specialty). Auth mirrors participation attach:
 * trio member, awaiting-gate approver, DL, or Admin (server-checked by
 * add_participation for adds; dismissals checked here — CC-G9 lean).
 * @param {string} params.delivery_cycle_id
 * @param {string} params.rule_key — 'q4_security' | 'q5_ux'
 * @param {string} params.action — 'add' | 'dismiss'
 * @param {string} [params.note] — required for dismiss
 */
async function apply_suggestion_decision(params, caller_user_id) {
  const { delivery_cycle_id, rule_key, action, note } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  const rule = SUGGESTION_RULES[rule_key];
  if (!rule) {
    return { success: false, error: "rule_key must be 'q4_security' or 'q5_ux' — exactly two rules exist (D-563)." };
  }
  if (!['add', 'dismiss'].includes(action)) {
    return { success: false, error: "action must be 'add' or 'dismiss'." };
  }
  if (action === 'dismiss' && (!note || !String(note).trim())) {
    return { success: false, error: 'Dismissing a suggestion requires a note — it is visible to the specialty (D-563).' };
  }

  const { data: group } = await supabase
    .from('specialty_groups')
    .select('group_id, group_name')
    .eq('group_name', rule.group_name)
    .maybeSingle();
  if (!group) {
    return { success: false, error: `The ${rule.group_name} Specialty Group was not found.` };
  }

  // Auth: trio member of the cycle, DL, or admin (dismissals are trio calls).
  const { data: cycle } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }
  let authorized = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
    .includes(caller_user_id);
  if (!authorized) {
    const { data: callerRow } = await supabase
      .from('users')
      .select('is_admin, is_super_admin')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    authorized = callerRow?.is_admin === true || callerRow?.is_super_admin === true;
  }
  if (!authorized) {
    return { success: false, error: 'Acting on a suggestion requires the Initiative trio or an Admin.' };
  }

  if (action === 'add') {
    // Idempotent attach (mirrors the vendor rule).
    const { data: existing } = await supabase
      .from('participation_records')
      .select('record_id')
      .eq('delivery_cycle_id', delivery_cycle_id)
      .eq('letter', 'C')
      .eq('holder_group_id', group.group_id)
      .is('removed_at', null)
      .maybeSingle();
    if (!existing) {
      const { error: insertErr } = await supabase
        .from('participation_records')
        .insert({
          delivery_cycle_id,
          letter:          'C',
          holder_group_id: group.group_id,
          set_via:         'rule',
          set_by_user_id:  caller_user_id
        });
      if (insertErr) {
        return { success: false, error: `Failed to attach the Consulted stake: ${insertErr.message}` };
      }
    }
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'suggestion_accepted',
      event_description: `${rule.label} suggestion accepted — ${group.group_name} attached as Consulted (${rule_key}).`,
      actor_user_id:     caller_user_id,
      event_metadata:    { rule_key, group_id: group.group_id }
    });
    return { success: true, data: { rule_key, action: 'add', group_name: group.group_name } };
  }

  // dismiss — upsert on (cycle, rule_key); the note is the specialty-visible record.
  const { error: dismissErr } = await supabase
    .from('suggestion_dismissals')
    .upsert({
      delivery_cycle_id,
      rule_key,
      group_id:             group.group_id,
      note:                 String(note).trim(),
      dismissed_by_user_id: caller_user_id
    }, { onConflict: 'delivery_cycle_id,rule_key' });
  if (dismissErr) {
    return { success: false, error: `Failed to record the dismissal: ${dismissErr.message}` };
  }
  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'suggestion_dismissed',
    event_description: `${rule.label} suggestion dismissed (visible to ${group.group_name}). Note: ${String(note).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { rule_key, group_id: group.group_id, note: String(note).trim() }
  });
  return { success: true, data: { rule_key, action: 'dismiss', group_name: group.group_name } };
}

module.exports = { get_suggestion_state, apply_suggestion_decision, SUGGESTION_RULES };
