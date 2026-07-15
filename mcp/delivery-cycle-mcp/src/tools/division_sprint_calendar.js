// division_sprint_calendar.js — Contract 37 (D-550, D-552 §6.5)
// Per-Division calendar assignment + effective-calendar lookup.
//
// set_division_sprint_calendar — admin. Assignment NEVER moves dates: the only
// side effect is the stale-flag pass over the affected subtree's rules.
// get_effective_sprint_calendar — any authenticated user (feeds the gate date
// editor's sprint dropdown and live preview).

'use strict';

const { supabase } = require('../db');
const {
  resolveEffectiveCalendar,
  getInheritingSubtreeDivisionIds,
  refreshStaleFlagsForDivisions
} = require('../lib/effective-calendar');

// ── set_division_sprint_calendar ────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.division_id
 * @param {string} params.assignment — a sprint_calendars.id uuid, 'inherit',
 *   or 'none' (D-550 explicit opt-out — truncates the ancestor walk).
 */
async function set_division_sprint_calendar(params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Assigning Sprint Calendars requires Admin role. Your current role does not have this permission.' };
  }

  const { division_id, assignment } = params;
  if (!division_id) return { success: false, error: 'division_id is required.' };
  if (!assignment) {
    return { success: false, error: "assignment is required: a Sprint Calendar id, 'inherit', or 'none'." };
  }

  const { data: division } = await supabase
    .from('divisions')
    .select('id')
    .eq('id', division_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!division) return { success: false, error: 'Division not found.' };

  let payload;
  if (assignment === 'inherit') {
    payload = { sprint_calendar_id: null, sprint_calendar_none: false };
  } else if (assignment === 'none') {
    payload = { sprint_calendar_id: null, sprint_calendar_none: true };
  } else {
    const { data: calendar } = await supabase
      .from('sprint_calendars')
      .select('id, active_status')
      .eq('id', assignment)
      .is('deleted_at', null)
      .maybeSingle();
    if (!calendar) return { success: false, error: 'Sprint Calendar not found.' };
    payload = { sprint_calendar_id: calendar.id, sprint_calendar_none: false };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('divisions')
    .update(payload)
    .eq('id', division_id)
    .select('id, division_name, sprint_calendar_id, sprint_calendar_none')
    .single();
  if (updateErr || !updated) {
    return { success: false, error: `Failed to assign Sprint Calendar: ${updateErr?.message || 'unknown error'}` };
  }

  // D-552 §6.5: no recompute, no date movement — stale-flag pass only, over
  // the divisions whose effective calendar resolves through this one.
  const affectedIds = await getInheritingSubtreeDivisionIds(division_id);
  const stale_refresh = await refreshStaleFlagsForDivisions(affectedIds);

  return { success: true, data: { division: updated, stale_refresh } };
}

// ── get_effective_sprint_calendar ───────────────────────────────────────────
/** Any authenticated user. Returns { calendar, sprints, source_division_id };
 *  calendar null = no effective calendar → Date mode only in editors. */
async function get_effective_sprint_calendar(params, caller_user_id) {
  const { division_id } = params;
  if (!division_id) return { success: false, error: 'division_id is required.' };

  const resolved = await resolveEffectiveCalendar(division_id);
  return { success: true, data: resolved };
}

module.exports = { set_division_sprint_calendar, get_effective_sprint_calendar };
