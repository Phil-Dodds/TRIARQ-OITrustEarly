// update_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490 UAT fix
// Updates team_meetings.title (and optionally meeting_date).

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ meeting_id: string, title?: string, meeting_date?: string }} params
 * @param {string} caller_user_id
 */
async function update_meeting(params, caller_user_id) {
  const { meeting_id, title, meeting_date } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };
  if (!title && !meeting_date) return { success: false, error: 'At least one of title or meeting_date is required.' };

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

  const updates = { updated_at: new Date().toISOString() };
  if (title)        updates.title        = title.trim();
  if (meeting_date) updates.meeting_date = meeting_date;

  const { data, error } = await supabase
    .from('team_meetings')
    .update(updates)
    .eq('id', meeting_id)
    .select('id, title, meeting_date, updated_at')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data)  return { success: false, error: 'Meeting not found.' };

  return { success: true, data };
}

module.exports = { update_meeting };
