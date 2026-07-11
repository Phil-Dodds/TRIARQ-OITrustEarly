// delete_team_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Soft-deletes a meeting (sets deleted_at). Arch-6: never hard delete.
// Series leaders + admins only — destructive relative to member-level actions.

'use strict';

const { supabase } = require('../db');
const { assertMeetingAccess } = require('../track_access');

/**
 * @param {{ meeting_id: string }} params
 * @param {string} caller_user_id
 */
async function delete_team_meeting(params, caller_user_id) {
  const { meeting_id } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };

  const access = await assertMeetingAccess(meeting_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  if (!access.membership?.is_leader && !access.caller.is_admin) {
    return { success: false, error: 'Only series leaders can delete a meeting. Ask a leader to remove it.' };
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
