// delete_team_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Soft-deletes a meeting (sets deleted_at). Arch-6: never hard delete.

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ meeting_id: string }} params
 * @param {string} caller_user_id
 */
async function delete_team_meeting(params, caller_user_id) {
  const { meeting_id } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };

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

  const { error } = await supabase
    .from('team_meetings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', meeting_id)
    .is('deleted_at', null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

module.exports = { delete_team_meeting };
