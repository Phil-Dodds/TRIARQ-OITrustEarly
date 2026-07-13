// list_team_meetings.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase A
// Returns a track's meetings sorted by created_at DESC. Track members + admins.

'use strict';

const { supabase } = require('../db');
const { assertTrackAccess } = require('../track_access');
const { suggestNextMeetingDate } = require('../cadence');

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
    .select('id, title, meeting_date, created_at, updated_at, content_updated_at')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { success: false, error: error.message };

  // Unread flag per meeting: caller never viewed it, or content changed since
  // their last view (same semantics as the series list).
  const meetingIds = (data || []).map(m => m.id);
  let viewByMeeting = {};
  if (meetingIds.length) {
    const { data: views } = await supabase
      .from('team_meeting_views')
      .select('meeting_id, viewed_at')
      .eq('user_id', caller_user_id)
      .in('meeting_id', meetingIds);
    (views || []).forEach(v => { viewByMeeting[v.meeting_id] = v.viewed_at; });
  }
  const enriched = (data || []).map(m => {
    const viewedAt = viewByMeeting[m.id];
    return {
      ...m,
      unread: !viewedAt ||
        new Date(m.content_updated_at).getTime() > new Date(viewedAt).getTime()
    };
  });

  // Cadence-driven default date for the "+ New Meeting" panel.
  const { data: cadRow } = await supabase
    .from('team_meeting_tracks')
    .select('meeting_cadence')
    .eq('track_id', track_id)
    .maybeSingle();
  // Latest by meeting_date (cadence anchors on the calendar, not created_at).
  const { data: latestByDate } = await supabase
    .from('team_meetings')
    .select('meeting_date')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('meeting_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    success: true,
    data: enriched,
    track: {
      track_id:   access.track.track_id,
      track_name: access.track.track_name,
      is_leader:  !!access.membership?.is_leader || access.caller.is_admin,
      suggested_next_meeting_date: suggestNextMeetingDate(cadRow?.meeting_cadence ?? null, latestByDate?.meeting_date ?? null)
    }
  };
}

module.exports = { list_team_meetings };
