// create_team_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Creates a new meeting record and inserts all five sections in fixed order.

'use strict';

const { supabase } = require('../db');

// Fixed section order per D-490 spec Step 2.
const SECTIONS = [
  { sort_order: 1, section_key: 'hot-topics'        },
  { sort_order: 2, section_key: 'escalation'        },
  { sort_order: 3, section_key: 'comms'             },
  { sort_order: 4, section_key: 'initiatives-gates' },
  { sort_order: 5, section_key: 'training'          },
];

/**
 * @param {{ title: string, meeting_date: string }} params
 * @param {string} caller_user_id
 */
async function create_team_meeting(params, caller_user_id) {
  const { title, meeting_date } = params;

  if (!title?.trim())    return { success: false, error: 'title is required.' };
  if (!meeting_date)     return { success: false, error: 'meeting_date is required.' };

  // Admin check (D-490: admin-only tool).
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (callerErr || !caller?.is_admin) {
    return { success: false, error: 'Team Meetings is restricted to Admin users.' };
  }

  const { data: meeting, error: meetingErr } = await supabase
    .from('team_meetings')
    .insert({ title: title.trim(), meeting_date, created_by: caller_user_id })
    .select()
    .single();
  if (meetingErr) {
    return { success: false, error: `Failed to create meeting: ${meetingErr.message}` };
  }

  const sectionRows = SECTIONS.map(s => ({ ...s, meeting_id: meeting.id }));
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
