// move_section.js
// Pathways OI Trust — team-meetings-mcp
// Drag & drop reorder of whole sections within one meeting. Meeting-local:
// sort_order changes on this meeting's sections only — the series template
// (and therefore future meetings) is untouched.
// Drop semantics: the dragged section takes the target section's position
// (dragging down lands after the target, dragging up lands before it).

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ section_id: string, target_section_id: string }} params
 * @param {string} caller_user_id
 */
async function move_section(params, caller_user_id) {
  const { section_id, target_section_id } = params;
  if (!section_id || !target_section_id) {
    return { success: false, error: 'section_id and target_section_id are required.' };
  }
  if (section_id === target_section_id) {
    return { success: true, data: { section_id } };
  }

  const access = await assertSectionAccess(section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  const meetingId = access.meeting.id;

  // Full ordered section list for the meeting; target must belong to it.
  const { data: sections, error: listErr } = await supabase
    .from('team_meeting_sections')
    .select('id, sort_order')
    .eq('meeting_id', meetingId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });
  if (listErr) return { success: false, error: listErr.message };

  const ids = (sections || []).map(s => s.id);
  const from = ids.indexOf(section_id);
  const to   = ids.indexOf(target_section_id);
  if (from === -1 || to === -1) {
    return { success: false, error: 'Sections can only be reordered within the same meeting.' };
  }

  ids.splice(from, 1);
  ids.splice(to, 0, section_id);

  // Rewrite sort_order 1..N — only rows whose position actually changed.
  for (let i = 0; i < ids.length; i++) {
    const current = (sections || []).find(s => s.id === ids[i]);
    if (current && current.sort_order !== i + 1) {
      const { error } = await supabase
        .from('team_meeting_sections')
        .update({ sort_order: i + 1 })
        .eq('id', ids[i]);
      if (error) return { success: false, error: error.message };
    }
  }

  await bumpMeeting(meetingId);
  return { success: true, data: { section_id, target_section_id } };
}

module.exports = { move_section };
