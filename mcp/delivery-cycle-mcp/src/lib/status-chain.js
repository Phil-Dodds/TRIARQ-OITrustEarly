// status-chain.js — Contract 36 (D-507 / D-508)
// Status Update Chain helpers + the single shared recency constant.
//
// A chain = rows linked by supersedes_update_id. HEAD = newest (what surfaces
// display); ROOT = the original save. The ROOT's saved_at governs overdue
// evaluation and every "X days" age display — an edit never refreshes the clock.

'use strict';

const { supabase } = require('../db');

// D-508: ONE recency constant, calendar days. Consumers: editability check,
// acknowledgment queue window, "acknowledged an earlier version" surfaces.
const STATUS_RECENT_DAYS = 3;

/** Calendar-day recency: true when isoTs falls on today or the previous
 *  (STATUS_RECENT_DAYS - 1) calendar days — e.g. 3 = today/yesterday/day before. */
function isWithinRecentCalendarDays(isoTs) {
  if (!isoTs) return false;
  const then = new Date(isoTs);
  const now  = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const thenDay = Math.floor(Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate()) / dayMs);
  const nowDay  = Math.floor(Date.UTC(now.getUTCFullYear(),  now.getUTCMonth(),  now.getUTCDate())  / dayMs);
  return (nowDay - thenDay) < STATUS_RECENT_DAYS;
}

/**
 * Resolve chain roots for a set of head update ids.
 * Iterative batched walk (chains are short — a handful of edits at most).
 * @returns Map<headId, { root_id, root_saved_at }>
 */
async function resolveChainRoots(headIds) {
  const result = new Map();
  if (!headIds?.length) return result;

  // Seed with the heads themselves.
  const { data: headRows } = await supabase
    .from('initiative_status_updates')
    .select('id, supersedes_update_id, saved_at')
    .in('id', headIds);

  // pointer: headId → current row in the walk
  const pointer = new Map();
  for (const r of (headRows || [])) pointer.set(r.id, r);

  let guard = 0;
  while (guard++ < 50) {
    const pendingParents = [...new Set(
      [...pointer.values()].map(r => r.supersedes_update_id).filter(Boolean)
    )];
    if (!pendingParents.length) break;

    const { data: parents } = await supabase
      .from('initiative_status_updates')
      .select('id, supersedes_update_id, saved_at')
      .in('id', pendingParents);
    const parentById = new Map((parents || []).map(p => [p.id, p]));

    let advanced = false;
    for (const [headId, row] of pointer) {
      if (row.supersedes_update_id && parentById.has(row.supersedes_update_id)) {
        pointer.set(headId, parentById.get(row.supersedes_update_id));
        advanced = true;
      }
    }
    if (!advanced) break;
  }

  for (const [headId, row] of pointer) {
    result.set(headId, { root_id: row.id, root_saved_at: row.saved_at });
  }
  return result;
}

module.exports = { STATUS_RECENT_DAYS, isWithinRecentCalendarDays, resolveChainRoots };
