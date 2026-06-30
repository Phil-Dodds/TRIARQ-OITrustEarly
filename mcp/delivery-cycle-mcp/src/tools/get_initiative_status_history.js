// get_initiative_status_history.js — Contract 32 (WS2)
// Reverse-chronological status update history for an Initiative, each with its
// acknowledgment list (names + timestamps, save user excluded). Read-only.
// Governing: D-478, D-483.

'use strict';

const { supabase } = require('../db');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @param {object} params
 * @param {string} params.initiative_id
 * @param {number} [params.limit] - default 20, capped at 100
 * @param {string} caller_user_id - from JWT
 */
async function get_initiative_status_history(params, caller_user_id) {
  const { initiative_id } = params;
  if (!initiative_id) {
    return { success: false, error: 'initiative_id is required.' };
  }
  const limit = Math.min(
    Number.isInteger(params.limit) && params.limit > 0 ? params.limit : DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const { data: updates, error: updErr } = await supabase
    .from('initiative_status_updates')
    .select('*')
    .eq('initiative_id', initiative_id)
    .order('saved_at', { ascending: false })
    .limit(limit);

  if (updErr) {
    return { success: false, error: `Failed to load status history: ${updErr.message}` };
  }
  if (!updates || updates.length === 0) {
    return { success: true, data: [] };
  }

  const updateIds = updates.map(u => u.id);

  // All acknowledgments for these updates in one query.
  const { data: acks } = await supabase
    .from('initiative_status_acknowledgments')
    .select('status_update_id, acknowledged_by, acknowledged_at')
    .in('status_update_id', updateIds);

  // Resolve display names for savers + acknowledgers.
  const userIds = new Set();
  updates.forEach(u => userIds.add(u.saved_by));
  (acks || []).forEach(a => userIds.add(a.acknowledged_by));
  const nameById = {};
  if (userIds.size) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', Array.from(userIds));
    for (const u of (users || [])) { nameById[u.id] = u.display_name; }
  }

  const acksByUpdate = {};
  for (const a of (acks || [])) {
    (acksByUpdate[a.status_update_id] = acksByUpdate[a.status_update_id] || []).push({
      user_id:         a.acknowledged_by,
      display_name:    nameById[a.acknowledged_by] || 'Unknown',
      acknowledged_at: a.acknowledged_at
    });
  }

  const data = updates.map(u => ({
    ...u,
    saved_by_name:    nameById[u.saved_by] || 'Unknown',
    acknowledged_by:  acksByUpdate[u.id] || []
  }));

  return { success: true, data };
}

module.exports = { get_initiative_status_history };
