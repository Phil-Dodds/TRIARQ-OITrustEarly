// list_team_meetings.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase A
// Returns a track's meetings sorted by created_at DESC. Track members + admins.

'use strict';

const { supabase } = require('../db');
const { assertTrackAccess } = require('../track_access');

/**
 * @param {{ track_id: string, limit?: number, offset?: number }} params
 * @param {string} caller_user_id
 */
async function list_team_meetings(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const limit  = Math.min(params.limit  ?? 20, 100);
  const offset = params.offset ?? 0;

  const access = await assertTrackAccess(track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const { data, error } = await supabase
    .from('team_meetings')
    .select('id, title, meeting_date, created_at, updated_at')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { success: false, error: error.message };
  return {
    success: true,
    data: data || [],
    track: {
      track_id:   access.track.track_id,
      track_name: access.track.track_name,
      is_leader:  !!access.membership?.is_leader || access.caller.is_admin
    }
  };
}

module.exports = { list_team_meetings };
