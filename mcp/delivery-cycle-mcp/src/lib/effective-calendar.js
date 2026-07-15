// effective-calendar.js — Contract 37 (D-550/D-552 §6.5)
// Effective-calendar resolution (ancestor walk) and the stale-flag pass.
// DB-touching companion to the pure sprint-resolution.js.
//
// D-550: effective calendar = walk self → parent → … → root; first non-null
// sprint_calendar_id wins. sprint_calendar_none = true truncates the walk
// (explicit opt-out — the subtree resolves to NO calendar).
//
// D-552 §6.5: reassignment/sprint edits never move dates. Rules that can no
// longer resolve get rule_stale = true; rules that resolve again get it
// cleared. The resolved target_date always HOLDS.

'use strict';

const { supabase } = require('../db');
const { resolveSprintRule, resolveRelativeRule } = require('./sprint-resolution');
const { GATE_FORWARD_ORDER } = require('./gate-resolution');

const MAX_WALK_DEPTH = 50; // cycle guard — division trees are shallow in practice

/**
 * D-550 ancestor walk for one Division.
 * @returns {Promise<{ calendar: object|null, sprints: Array, source_division_id: string|null }>}
 *   calendar null = no effective calendar (all-null walk or explicit None) —
 *   sprint and relative modes are hidden for that subtree.
 */
async function resolveEffectiveCalendar(division_id) {
  let currentId = division_id;
  for (let depth = 0; depth < MAX_WALK_DEPTH && currentId; depth++) {
    const { data: division, error } = await supabase
      .from('divisions')
      .select('id, parent_division_id, sprint_calendar_id, sprint_calendar_none')
      .eq('id', currentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error || !division) break;

    if (division.sprint_calendar_none === true) {
      return { calendar: null, sprints: [], source_division_id: division.id };
    }
    if (division.sprint_calendar_id) {
      const { data: calendar } = await supabase
        .from('sprint_calendars')
        .select('id, calendar_name, active_status')
        .eq('id', division.sprint_calendar_id)
        .is('deleted_at', null)
        .maybeSingle();
      if (calendar) {
        const { data: sprints } = await supabase
          .from('sprints')
          .select('id, sprint_id, start_date, end_date')
          .eq('calendar_id', calendar.id)
          .is('deleted_at', null)
          .order('start_date', { ascending: true });
        return { calendar, sprints: sprints || [], source_division_id: division.id };
      }
      // Assigned calendar soft-deleted (delete is blocked while referenced, so
      // this is a guard, not an expected state) — keep walking.
    }
    currentId = division.parent_division_id;
  }
  return { calendar: null, sprints: [], source_division_id: null };
}

/**
 * All Division ids whose EFFECTIVE calendar resolves through `division_id`'s
 * own assignment — the division itself plus every descendant that inherits
 * (descendants with their own sprint_calendar_id or sprint_calendar_none
 * truncate their subtree out of the result).
 */
async function getInheritingSubtreeDivisionIds(division_id) {
  const { data: allDivisions } = await supabase
    .from('divisions')
    .select('id, parent_division_id, sprint_calendar_id, sprint_calendar_none')
    .is('deleted_at', null);
  const children = new Map();
  for (const d of allDivisions || []) {
    if (!children.has(d.parent_division_id)) children.set(d.parent_division_id, []);
    children.get(d.parent_division_id).push(d);
  }
  const result = [division_id];
  const stack = [...(children.get(division_id) || [])];
  while (stack.length) {
    const d = stack.pop();
    if (d.sprint_calendar_none === true || d.sprint_calendar_id) continue; // own assignment truncates
    result.push(d.id);
    stack.push(...(children.get(d.id) || []));
  }
  return result;
}

/**
 * Division ids whose effective calendar IS calendar_id (directly assigned
 * divisions plus their inheriting subtrees). Used for the delete guard and
 * the admin sprint-edit recompute scope (§6.3 — only initiatives whose
 * EFFECTIVE calendar is the edited one).
 */
async function getDivisionIdsOnCalendar(calendar_id) {
  const { data: assigned } = await supabase
    .from('divisions')
    .select('id')
    .eq('sprint_calendar_id', calendar_id)
    .is('deleted_at', null);
  const ids = new Set();
  for (const d of assigned || []) {
    for (const id of await getInheritingSubtreeDivisionIds(d.id)) ids.add(id);
  }
  return [...ids];
}

/**
 * D-552 §6.5 stale-flag pass. For every non-manual rule on non-deleted cycles
 * in the given Divisions, re-evaluate resolvability against each Division's
 * (new) effective calendar and set/clear rule_stale. NEVER writes target_date.
 * @returns {Promise<{ flagged: number, cleared: number, checked: number }>}
 */
async function refreshStaleFlagsForDivisions(divisionIds) {
  let flagged = 0, cleared = 0, checked = 0;
  for (const divisionId of divisionIds || []) {
    const { sprints } = await resolveEffectiveCalendar(divisionId);

    const { data: cycles } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id')
      .eq('division_id', divisionId)
      .is('deleted_at', null);
    if (!cycles || cycles.length === 0) continue;

    for (const cycle of cycles) {
      const { data: milestones } = await supabase
        .from('cycle_milestone_dates')
        .select('milestone_id, gate_name, target_date, date_rule_type, rule_sprint_id, rule_anchor, rule_sprint_count, rule_day_offset, rule_stale')
        .eq('delivery_cycle_id', cycle.delivery_cycle_id)
        .is('deleted_at', null);
      const byGate = new Map((milestones || []).map(m => [m.gate_name, m]));

      for (const m of milestones || []) {
        if (m.date_rule_type === 'manual') continue;
        checked++;
        let resolvable;
        if (m.date_rule_type === 'sprint') {
          resolvable = !resolveSprintRule(sprints, m.rule_sprint_id, m.rule_anchor, m.rule_day_offset).error;
        } else {
          const priorIdx = GATE_FORWARD_ORDER.indexOf(m.gate_name) - 1;
          const priorTarget = priorIdx >= 0
            ? (byGate.get(GATE_FORWARD_ORDER[priorIdx])?.target_date ?? null)
            : null;
          resolvable = !resolveRelativeRule(sprints, priorTarget, m.rule_sprint_count, m.rule_day_offset).error;
        }
        const shouldBeStale = !resolvable;
        if (shouldBeStale !== m.rule_stale) {
          await supabase
            .from('cycle_milestone_dates')
            .update({ rule_stale: shouldBeStale })
            .eq('milestone_id', m.milestone_id);
          if (shouldBeStale) flagged++; else cleared++;
        }
      }
    }
  }
  return { flagged, cleared, checked };
}

module.exports = {
  resolveEffectiveCalendar,
  getInheritingSubtreeDivisionIds,
  getDivisionIdsOnCalendar,
  refreshStaleFlagsForDivisions
};
