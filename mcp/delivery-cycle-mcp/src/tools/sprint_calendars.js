// sprint_calendars.js — Contract 37 (D-549, D-552 §6.3/§6.5, D-140, D-183)
// Admin sprint-calendar management: calendar CRUD + sprint grid tools.
// Grouped in one file per the roadmap_themes.js precedent.
//
// All tools admin-only (spec §8). Soft delete only (Arch-6). Sprint ids are
// TEXT end-to-end — '2026.10' keeps its zero (D-549).

'use strict';

const { supabase } = require('../db');
const { ISO_DATE_RE } = require('../lib/sprint-resolution');
const {
  getDivisionIdsOnCalendar,
  refreshStaleFlagsForDivisions
} = require('../lib/effective-calendar');

async function requireAdmin(caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return 'Managing Sprint Calendars requires Admin role. Your current role does not have this permission.';
  }
  return null;
}

/** Warn-not-block overlap check (spec §4.1 — gaps allowed). */
function findOverlapWarnings(sprintRows) {
  const sorted = [...sprintRows].sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  const warnings = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start_date <= sorted[i - 1].end_date) {
      warnings.push(
        `Sprint '${sorted[i].sprint_id}' (${sorted[i].start_date}) overlaps sprint '${sorted[i - 1].sprint_id}' (ends ${sorted[i - 1].end_date}).`
      );
    }
  }
  return warnings;
}

// ── list_sprint_calendars ───────────────────────────────────────────────────
// Calendar list with sprint count and direct-assignment count (spec §4.1).
async function list_sprint_calendars(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const { data: calendars, error } = await supabase
    .from('sprint_calendars')
    .select('id, calendar_name, active_status, created_at, updated_at')
    .is('deleted_at', null)
    .order('calendar_name', { ascending: true });
  if (error) return { success: false, error: `Failed to list Sprint Calendars: ${error.message}` };

  const enriched = [];
  for (const cal of calendars || []) {
    const { count: sprintCount } = await supabase
      .from('sprints')
      .select('id', { count: 'exact', head: true })
      .eq('calendar_id', cal.id)
      .is('deleted_at', null);
    const { count: divisionCount } = await supabase
      .from('divisions')
      .select('id', { count: 'exact', head: true })
      .eq('sprint_calendar_id', cal.id)
      .is('deleted_at', null);
    enriched.push({ ...cal, sprint_count: sprintCount ?? 0, divisions_using: divisionCount ?? 0 });
  }
  return { success: true, data: enriched };
}

// ── create_sprint_calendar ──────────────────────────────────────────────────
async function create_sprint_calendar(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const calendar_name = typeof params.calendar_name === 'string' ? params.calendar_name.trim() : '';
  if (!calendar_name) {
    return { success: false, error: 'calendar_name is required and cannot be empty.' };
  }

  const { data: created, error } = await supabase
    .from('sprint_calendars')
    .insert({ calendar_name })
    .select()
    .single();
  if (error) {
    return { success: false, error: `Failed to create Sprint Calendar: ${error.message}` };
  }
  return { success: true, data: created };
}

// ── update_sprint_calendar ──────────────────────────────────────────────────
async function update_sprint_calendar(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const { calendar_id, updates } = params;
  if (!calendar_id) return { success: false, error: 'calendar_id is required.' };
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return { success: false, error: 'updates object is required and must not be empty.' };
  }
  const MUTABLE = ['calendar_name', 'active_status'];
  const rejected = Object.keys(updates).filter(k => !MUTABLE.includes(k));
  if (rejected.length > 0) {
    return { success: false, error: `The following fields cannot be updated: ${rejected.join(', ')}. Mutable fields: ${MUTABLE.join(', ')}.` };
  }
  if (updates.calendar_name !== undefined) {
    if (typeof updates.calendar_name !== 'string' || updates.calendar_name.trim().length === 0) {
      return { success: false, error: 'calendar_name cannot be empty.' };
    }
    updates.calendar_name = updates.calendar_name.trim();
  }
  if (updates.active_status !== undefined && typeof updates.active_status !== 'boolean') {
    return { success: false, error: 'active_status must be a boolean.' };
  }

  const { data: updated, error } = await supabase
    .from('sprint_calendars')
    .update(updates)
    .eq('id', calendar_id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error || !updated) {
    return { success: false, error: 'Sprint Calendar not found or update failed.' };
  }
  return { success: true, data: updated };
}

// ── delete_sprint_calendar ──────────────────────────────────────────────────
// D-140: blocked while referenced. A calendar with zero Division assignments
// has no effective-resolution path, so rules cannot reference it non-stale —
// the assignment guard transitively covers the spec's "non-stale rule" clause.
async function delete_sprint_calendar(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const { calendar_id } = params;
  if (!calendar_id) return { success: false, error: 'calendar_id is required.' };

  const { count: assignmentCount } = await supabase
    .from('divisions')
    .select('id', { count: 'exact', head: true })
    .eq('sprint_calendar_id', calendar_id)
    .is('deleted_at', null);
  if ((assignmentCount ?? 0) > 0) {
    return {
      success: false,
      error: `This Sprint Calendar cannot be deleted: ${assignmentCount} Division(s) are assigned to it. Reassign those Divisions to another calendar (or to None) first, then delete.`
    };
  }

  const { data: deleted, error } = await supabase
    .from('sprint_calendars')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', calendar_id)
    .is('deleted_at', null)
    .select()
    .single();
  if (error || !deleted) {
    return { success: false, error: 'Sprint Calendar not found or already deleted.' };
  }
  return { success: true, data: deleted };
}

// ── list_sprints ────────────────────────────────────────────────────────────
async function list_sprints(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const { calendar_id } = params;
  if (!calendar_id) return { success: false, error: 'calendar_id is required.' };

  const { data: sprints, error } = await supabase
    .from('sprints')
    .select('id, sprint_id, start_date, end_date')
    .eq('calendar_id', calendar_id)
    .is('deleted_at', null)
    .order('start_date', { ascending: true });
  if (error) return { success: false, error: `Failed to list sprints: ${error.message}` };
  return { success: true, data: sprints || [] };
}

// ── upsert_sprints ──────────────────────────────────────────────────────────
// Batch add/edit for the grid editor (spec §8). Two-call pattern (D-183/§6.3):
// when any EXISTING sprint's dates change, the first call (confirmed absent/
// false) returns requires_confirmation + affected-initiative count without
// writing; the second call (confirmed: true) commits and runs the scoped
// recompute — stale-flag refresh over initiatives whose EFFECTIVE calendar is
// this one. Dates on gates never move here; §6.3 target recompute for sprint/
// relative rules happens through set_gate_date_rule saves — this pass keeps
// rule_stale truthful. Adds-only batches commit immediately.
async function upsert_sprints(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const { calendar_id, sprints, confirmed } = params;
  if (!calendar_id) return { success: false, error: 'calendar_id is required.' };
  if (!Array.isArray(sprints) || sprints.length === 0) {
    return { success: false, error: 'sprints array is required and must not be empty.' };
  }

  // Validate rows
  const seenIds = new Set();
  for (const s of sprints) {
    if (typeof s.sprint_id !== 'string' || s.sprint_id.trim().length === 0) {
      return { success: false, error: 'Every sprint row requires a non-empty text sprint_id.' };
    }
    if (!ISO_DATE_RE.test(s.start_date || '') || !ISO_DATE_RE.test(s.end_date || '')) {
      return { success: false, error: `Sprint '${s.sprint_id}': start_date and end_date must be YYYY-MM-DD.` };
    }
    if (s.end_date <= s.start_date) {
      return { success: false, error: `Sprint '${s.sprint_id}': end_date must be after start_date.` };
    }
    if (seenIds.has(s.sprint_id)) {
      return { success: false, error: `Sprint id '${s.sprint_id}' appears more than once in the batch. Sprint ids must be unique per calendar.` };
    }
    seenIds.add(s.sprint_id);
  }

  const { data: calendar } = await supabase
    .from('sprint_calendars')
    .select('id')
    .eq('id', calendar_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!calendar) return { success: false, error: 'Sprint Calendar not found.' };

  const { data: existing } = await supabase
    .from('sprints')
    .select('id, sprint_id, start_date, end_date')
    .eq('calendar_id', calendar_id)
    .is('deleted_at', null);
  const existingById = new Map((existing || []).map(s => [s.id, s]));
  const existingBySprintId = new Map((existing || []).map(s => [s.sprint_id, s]));

  // Unique sprint_id per calendar across batch + existing (block).
  for (const s of sprints) {
    const clash = existingBySprintId.get(s.sprint_id);
    if (clash && clash.id !== s.id) {
      return { success: false, error: `Sprint id '${s.sprint_id}' already exists in this calendar. Sprint ids must be unique per calendar.` };
    }
    if (s.id && !existingById.has(s.id)) {
      return { success: false, error: `Sprint row '${s.sprint_id}' references an unknown sprint id.` };
    }
  }

  // Does any EXISTING sprint change dates? → two-call confirmation.
  const dateChanges = sprints.filter(s => {
    const prior = s.id ? existingById.get(s.id) : null;
    return prior && (prior.start_date !== s.start_date || prior.end_date !== s.end_date);
  });

  const affectedDivisionIds = dateChanges.length > 0 ? await getDivisionIdsOnCalendar(calendar_id) : [];
  let affected_initiative_count = 0;
  if (dateChanges.length > 0 && affectedDivisionIds.length > 0) {
    const { count } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id', { count: 'exact', head: true })
      .in('division_id', affectedDivisionIds)
      .is('deleted_at', null);
    affected_initiative_count = count ?? 0;
  }

  if (dateChanges.length > 0 && confirmed !== true) {
    return {
      success: true,
      data: {
        requires_confirmation: true,
        changed_sprints: dateChanges.map(s => s.sprint_id),
        affected_initiative_count
      }
    };
  }

  // Commit: update existing rows, insert new rows.
  const warnings = findOverlapWarnings(sprints);
  for (const s of sprints) {
    if (s.id) {
      const { error } = await supabase
        .from('sprints')
        .update({ sprint_id: s.sprint_id.trim(), start_date: s.start_date, end_date: s.end_date })
        .eq('id', s.id)
        .is('deleted_at', null);
      if (error) return { success: false, error: `Failed to update sprint '${s.sprint_id}': ${error.message}` };
    } else {
      const { error } = await supabase
        .from('sprints')
        .insert({ calendar_id, sprint_id: s.sprint_id.trim(), start_date: s.start_date, end_date: s.end_date });
      if (error) return { success: false, error: `Failed to add sprint '${s.sprint_id}': ${error.message}` };
    }
  }

  // Scoped stale-flag recompute (§6.3/§6.5) — only this calendar's divisions.
  let stale_refresh = null;
  if (dateChanges.length > 0) {
    stale_refresh = await refreshStaleFlagsForDivisions(affectedDivisionIds);
  }

  const { data: after } = await supabase
    .from('sprints')
    .select('id, sprint_id, start_date, end_date')
    .eq('calendar_id', calendar_id)
    .is('deleted_at', null)
    .order('start_date', { ascending: true });

  return { success: true, data: { sprints: after || [], warnings, stale_refresh, affected_initiative_count } };
}

// ── delete_sprint ───────────────────────────────────────────────────────────
// Soft delete (Arch-6). Rules pointing at the removed sprint go stale on the
// same call (§6.5) — resolved dates HOLD.
async function delete_sprint(params, caller_user_id) {
  const adminErr = await requireAdmin(caller_user_id);
  if (adminErr) return { success: false, error: adminErr };

  const { sprint_row_id } = params;
  if (!sprint_row_id) return { success: false, error: 'sprint_row_id is required.' };

  const { data: deleted, error } = await supabase
    .from('sprints')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sprint_row_id)
    .is('deleted_at', null)
    .select('id, sprint_id, calendar_id')
    .single();
  if (error || !deleted) {
    return { success: false, error: 'Sprint not found or already deleted.' };
  }

  const divisionIds = await getDivisionIdsOnCalendar(deleted.calendar_id);
  const stale_refresh = await refreshStaleFlagsForDivisions(divisionIds);

  return { success: true, data: { deleted_sprint: deleted, stale_refresh } };
}

module.exports = {
  list_sprint_calendars,
  create_sprint_calendar,
  update_sprint_calendar,
  delete_sprint_calendar,
  list_sprints,
  upsert_sprints,
  delete_sprint
};
