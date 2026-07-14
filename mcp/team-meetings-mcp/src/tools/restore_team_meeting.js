// restore_team_meeting.js
// Pathways OI Trust — team-meetings-mcp (Phil 2026-07-14)
// Un-deletes a soft-deleted meeting. Leaders of the series + admins — the
// recovery path for a mis-deleted meeting (previously none existed).

'use strict';

const { supabase } = require('../db');
const { assertTrackAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ meeting_id: string }} params
 * @param {string} caller_user_id
 */
async function restore_team_meeting(params, caller_user_id) {
  const { meeting_id } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };

  const { data: meeting } = await supabase
    .from('team_meetings')
    .select('id, track_id, deleted_at')
    .eq('id', meeting_id)
    .maybeSingle();
  if (!meeting) return { success: false, error: 'Meeting not found.' };
  if (!meeting.deleted_at) return { success: true, data: { meeting_id } }; // already live

  const access = await assertTrackAccess(meeting.track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  const isLeader = !!access.membership?.is_leader || access.caller.is_admin;
  if (!isLeader) {
    return {
      success: false,
      error: 'Restoring a meeting requires a series leader or an Admin. Ask a leader of this series to restore it.'
    };
  }

  const { error } = await supabase
    .from('team_meetings')
    .update({ deleted_at: null })
    .eq('id', meeting_id);
  if (error) return { success: false, error: error.message };

  // Surfaces (lists, latest-meeting detection) refresh off the content stamp.
  await bumpMeeting(meeting_id);
  return { success: true, data: { meeting_id } };
}

module.exports = { restore_team_meeting };
