// create_team_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase A
// Creates a meeting inside a track. Any active track member can create (not admin-only).
// Sections snapshot from the track's section template at creation time.

'use strict';

const { supabase } = require('../db');
const { assertTrackAccess } = require('../track_access');

/**
 * @param {{ title: string, meeting_date: string, track_id: string }} params
 * @param {string} caller_user_id
 */
async function create_team_meeting(params, caller_user_id) {
  const { title, meeting_date, track_id } = params;

  if (!title?.trim()) return { success: false, error: 'title is required.' };
  if (!meeting_date)  return { success: false, error: 'meeting_date is required.' };
  if (!track_id)      return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  if (access.track.deleted_at) return { success: false, error: 'This series has been deleted.' };

  // Snapshot section template.
  const { data: templateSections, error: tplErr } = await supabase
    .from('team_meeting_track_sections')
    .select('section_key, title, sub_label, bar_color, sort_order')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });
  if (tplErr) return { success: false, error: tplErr.message };
  if (!templateSections?.length) {
    return { success: false, error: 'This series has no sections configured. A series leader must add at least one section before meetings can be created.' };
  }

  const { data: meeting, error: meetingErr } = await supabase
    .from('team_meetings')
    .insert({ title: title.trim(), meeting_date, track_id, created_by: caller_user_id })
    .select()
    .single();
  if (meetingErr) {
    return { success: false, error: `Failed to create meeting: ${meetingErr.message}` };
  }

  const sectionRows = templateSections.map(s => ({
    meeting_id:  meeting.id,
    section_key: s.section_key,
    title:       s.title,
    sub_label:   s.sub_label,
    bar_color:   s.bar_color,
    sort_order:  s.sort_order
  }));
  const { data: sections, error: sectionErr } = await supabase
    .from('team_meeting_sections')
    .insert(sectionRows)
    .select();
  if (sectionErr) {
    return { success: false, error: `Failed to create sections: ${sectionErr.message}` };
  }

  return {
    success: true,
    data: {
      ...meeting,
      sections: sections.map(s => ({ ...s, bullets: [], notes: null }))
    }
  };
}

module.exports = { create_team_meeting };
