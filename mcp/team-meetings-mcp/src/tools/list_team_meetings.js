// list_team_meetings.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Returns meetings sorted by meeting_date DESC.

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ limit?: number, offset?: number }} params
 * @param {string} caller_user_id
 */
async function list_team_meetings(params, caller_user_id) {
  const limit  = Math.min(params.limit  ?? 20, 100);
  const offset = params.offset ?? 0;

  // Admin check.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (callerErr || !caller?.is_admin) {
    return { success: false, error: 'Team Meetings is restricted to Admin users.' };
  }

  const { data, error } = await supabase
    .from('team_meetings')
    .select('id, title, meeting_date, created_at, updated_at')
    .is('deleted_at', null)
    .order('meeting_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

module.exports = { list_team_meetings };
