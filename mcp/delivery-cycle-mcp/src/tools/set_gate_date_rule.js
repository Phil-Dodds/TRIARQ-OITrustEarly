// set_gate_date_rule.js — Contract 37 (D-551, D-552, D-501, D-140)
// One tool, one grammar: target = anchor + (X sprints) + (Z days).
//
// Computes the resolved date server-side and writes the resolved target_date
// and the rule metadata together — THE RESOLVED DATE REMAINS THE CANONICAL
// GATE TARGET (D-551); every existing consumer reads target_date unchanged.
//
// Pre-flight variant (spec §8): when the save would cascade, the first call
// (confirmed absent/false) returns the full shifted-gate list WITHOUT writing;
// the caller renders the D-140-style confirmation and re-calls with
// confirmed: true. Cancel = never re-call → zero writes.
//
// Cascade (D-552): only downstream 'relative' rules move, in lifecycle order,
// chaining target-to-target. Actual dates are never touched here — gate
// approval cascades nothing (that path is record_gate_decision, unchanged).
//
// Permission: same as set_milestone_target_date — any authenticated user
// (JWT validated by middleware); D-504 keeps targets editable while awaiting
// approval, so no lifecycle-state restriction.

'use strict';

const { supabase } = require('../db');
const {
  ISO_DATE_RE,
  resolveSprintRule,
  resolveRelativeRule,
  computeCascade
} = require('../lib/sprint-resolution');
const { resolveEffectiveCalendar } = require('../lib/effective-calendar');
const { GATE_FORWARD_ORDER, GATE_LABELS } = require('../lib/gate-resolution');

const VALID_RULE_TYPES = ['manual', 'sprint', 'relative'];

/**
 * @param {object} params
 * @param {string} params.delivery_cycle_id
 * @param {string} params.gate_name
 * @param {object} params.rule
 * @param {string} params.rule.date_rule_type — 'manual' | 'sprint' | 'relative'
 * @param {string|null} [params.rule.target_date] — manual mode only; null clears
 *   the date AND the rule (D-501 Contract 37 extension)
 * @param {string} [params.rule.rule_sprint_id]      — sprint mode
 * @param {string} [params.rule.rule_anchor]         — sprint mode: 'start'|'end'
 * @param {number} [params.rule.rule_sprint_count]   — relative mode: X ≥ 0
 * @param {number} [params.rule.rule_day_offset]     — both modes: Z (may be negative)
 * @param {boolean} [params.confirmed] — commit a cascading save
 * @param {string} caller_user_id — from JWT middleware
 */
async function set_gate_date_rule(params, caller_user_id) {
  const { delivery_cycle_id, gate_name, rule, confirmed } = params;

  if (!delivery_cycle_id) return { success: false, error: 'delivery_cycle_id is required.' };
  if (!gate_name || !GATE_FORWARD_ORDER.includes(gate_name)) {
    return { success: false, error: `gate_name must be one of: ${GATE_FORWARD_ORDER.join(', ')}.` };
  }
  if (!rule || typeof rule !== 'object' || !VALID_RULE_TYPES.includes(rule.date_rule_type)) {
    return { success: false, error: `rule.date_rule_type must be one of: ${VALID_RULE_TYPES.join(', ')}.` };
  }
  if (rule.rule_day_offset !== undefined && rule.rule_day_offset !== null && !Number.isInteger(rule.rule_day_offset)) {
    return { success: false, error: 'rule.rule_day_offset must be an integer (negative allowed).' };
  }

  // ── Load cycle, milestones, effective calendar ────────────────────────────
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, division_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();
  if (cycleErr || !cycle) {
    return { success: false, error: 'Delivery Cycle not found or has been deleted.' };
  }

  const { data: milestones, error: msErr } = await supabase
    .from('cycle_milestone_dates')
    .select('milestone_id, gate_name, target_date, actual_date, date_rule_type, rule_sprint_id, rule_anchor, rule_sprint_count, rule_day_offset, rule_stale')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null);
  if (msErr || !milestones || milestones.length === 0) {
    return { success: false, error: 'Milestone rows not found for this cycle.' };
  }
  const byGate = new Map(milestones.map(m => [m.gate_name, m]));
  const target = byGate.get(gate_name);
  if (!target) {
    return { success: false, error: `Milestone for gate '${gate_name}' not found on this cycle.` };
  }

  // ── Resolve the new target date per mode ──────────────────────────────────
  // One effective-calendar fetch serves both mode resolution and the cascade
  // (manual edits still cascade downstream relatives, §6.1 "by any means").
  const { calendar: effectiveCalendar, sprints: effectiveSprints } =
    await resolveEffectiveCalendar(cycle.division_id);

  let resolved_date;
  let ruleColumns;

  if (rule.date_rule_type === 'manual') {
    if (rule.target_date === undefined) {
      return { success: false, error: 'Manual mode requires rule.target_date — a YYYY-MM-DD date, or null to clear.' };
    }
    if (rule.target_date !== null && !ISO_DATE_RE.test(rule.target_date)) {
      return { success: false, error: 'rule.target_date must be in YYYY-MM-DD format, or null to clear.' };
    }
    resolved_date = rule.target_date;
    // Manual save (including direct edit on a ruled gate, §6.4, and D-501
    // clear) removes any rule metadata.
    ruleColumns = {
      date_rule_type: 'manual',
      rule_sprint_id: null, rule_anchor: null,
      rule_sprint_count: null, rule_day_offset: null,
      rule_stale: false
    };
  } else {
    // sprint / relative need the effective calendar (spec §7.1 — these modes
    // only render when one resolves; enforce the same server-side).
    const calendar = effectiveCalendar;
    const sprints = effectiveSprints;
    if (!calendar) {
      return {
        success: false,
        error: 'No effective Sprint Calendar resolves for this Initiative\'s Division. Sprint and relative date rules need a calendar — assign one on the Division (or use Date mode).'
      };
    }

    if (rule.date_rule_type === 'sprint') {
      const result = resolveSprintRule(sprints, rule.rule_sprint_id, rule.rule_anchor, rule.rule_day_offset || 0);
      if (result.error) return { success: false, error: result.error };
      resolved_date = result.resolved_date;
      ruleColumns = {
        date_rule_type: 'sprint',
        rule_sprint_id: rule.rule_sprint_id, rule_anchor: rule.rule_anchor,
        rule_sprint_count: null, rule_day_offset: rule.rule_day_offset || 0,
        rule_stale: false
      };
    } else {
      // relative — hidden on Brief Review (no prior gate, D-108/D-154).
      const gateIdx = GATE_FORWARD_ORDER.indexOf(gate_name);
      if (gateIdx === 0) {
        return { success: false, error: 'Brief Review has no prior gate — a relative rule cannot be set on it. Use Date or Sprint mode.' };
      }
      if (rule.rule_sprint_count !== undefined && rule.rule_sprint_count !== null && !Number.isInteger(rule.rule_sprint_count)) {
        return { success: false, error: 'rule.rule_sprint_count must be an integer of 0 or greater.' };
      }
      const priorGate = GATE_FORWARD_ORDER[gateIdx - 1];
      const priorTarget = byGate.get(priorGate)?.target_date ?? null;
      if (!priorTarget) {
        return {
          success: false,
          error: `${GATE_LABELS[priorGate]} has no target date to anchor to. Set a target on ${GATE_LABELS[priorGate]} first, or use Date or Sprint mode.`
        };
      }
      const result = resolveRelativeRule(sprints, priorTarget, rule.rule_sprint_count || 0, rule.rule_day_offset || 0);
      if (result.error) return { success: false, error: result.error };
      resolved_date = result.resolved_date;
      ruleColumns = {
        date_rule_type: 'relative',
        rule_sprint_id: null, rule_anchor: null,
        rule_sprint_count: rule.rule_sprint_count || 0, rule_day_offset: rule.rule_day_offset || 0,
        rule_stale: false
      };
    }
  }

  // ── Cascade computation (D-552) — pure, no writes yet ─────────────────────
  const { shifts, unresolved } = computeCascade(milestones, gate_name, resolved_date, effectiveSprints);

  // ── Pre-flight: cascading save needs confirmation (§6.3) ──────────────────
  if (shifts.length > 0 && confirmed !== true) {
    return {
      success: true,
      data: {
        requires_confirmation: true,
        resolved_date,
        shifts: shifts.map(s => ({ ...s, gate_label: GATE_LABELS[s.gate_name] })),
        unresolved
      }
    };
  }

  // ── Commit: gate row first, then downstream shifts, then events ───────────
  const prior_target_date = target.target_date ?? null;

  const { data: updated, error: updateErr } = await supabase
    .from('cycle_milestone_dates')
    .update({ target_date: resolved_date, ...ruleColumns })
    .eq('milestone_id', target.milestone_id)
    .select()
    .single();
  if (updateErr) {
    return { success: false, error: `Failed to save gate date rule: ${updateErr.message}` };
  }

  for (const shift of shifts) {
    const row = byGate.get(shift.gate_name);
    const { error: shiftErr } = await supabase
      .from('cycle_milestone_dates')
      .update({ target_date: shift.new_target_date, rule_stale: false })
      .eq('milestone_id', row.milestone_id);
    if (shiftErr) {
      return { success: false, error: `Cascade failed at ${GATE_LABELS[shift.gate_name]}: ${shiftErr.message}` };
    }
  }
  for (const u of unresolved) {
    const row = byGate.get(u.gate_name);
    await supabase
      .from('cycle_milestone_dates')
      .update({ rule_stale: true })
      .eq('milestone_id', row.milestone_id);
  }

  // ── Event log (D-427 metadata keys preserved — D-486 slip detection and
  //    D-521 needs-review keep reading these events unchanged) ───────────────
  let callerDisplayName = 'A user';
  if (caller_user_id) {
    const { data: caller } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    callerDisplayName = caller?.display_name ?? callerDisplayName;
  }

  const gateLabel = GATE_LABELS[gate_name];
  const ruleSuffix =
    rule.date_rule_type === 'sprint'
      ? ` (Sprint ${ruleColumns.rule_sprint_id} ${ruleColumns.rule_anchor}${ruleColumns.rule_day_offset ? ` ${ruleColumns.rule_day_offset > 0 ? '+' : ''}${ruleColumns.rule_day_offset}d` : ''})`
      : rule.date_rule_type === 'relative'
        ? ` (${GATE_LABELS[GATE_FORWARD_ORDER[GATE_FORWARD_ORDER.indexOf(gate_name) - 1]]} + ${ruleColumns.rule_sprint_count} sprint(s)${ruleColumns.rule_day_offset ? ` ${ruleColumns.rule_day_offset > 0 ? '+' : ''}${ruleColumns.rule_day_offset}d` : ''})`
        : '';
  const eventDescription = resolved_date === null
    ? `${callerDisplayName} cleared the ${gateLabel} target date.`
    : `${callerDisplayName} set ${gateLabel} target date to ${resolved_date}${ruleSuffix}.`;

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'milestone_target_date_changed',
    event_description: eventDescription,
    actor_user_id:     caller_user_id || null,
    event_metadata: {
      gate_name,
      old_target_date: prior_target_date,
      new_target_date: resolved_date,
      milestone_id:    target.milestone_id,
      date_rule_type:  ruleColumns.date_rule_type
    }
  });
  for (const shift of shifts) {
    const row = byGate.get(shift.gate_name);
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'milestone_target_date_changed',
      event_description: `${GATE_LABELS[shift.gate_name]} target date moved to ${shift.new_target_date} by cascade from ${gateLabel}.`,
      actor_user_id:     caller_user_id || null,
      event_metadata: {
        gate_name:       shift.gate_name,
        old_target_date: shift.old_target_date,
        new_target_date: shift.new_target_date,
        milestone_id:    row.milestone_id,
        cascaded_from:   gate_name
      }
    });
  }

  return {
    success: true,
    data: {
      milestone: updated,
      resolved_date,
      shifts: shifts.map(s => ({ ...s, gate_label: GATE_LABELS[s.gate_name] })),
      unresolved
    }
  };
}

module.exports = { set_gate_date_rule };
