// update_bullet_note.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Saves or clears the per-bullet note. Called on textarea blur. Any track member.

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ bullet_id: string, note_text: string }} params
 * @param {string} caller_user_id
 */
async function update_bullet_note(params, caller_user_id) {
  const { bullet_id, note_text } = params;
  if (!bullet_id) return { success: false, error: 'bullet_id is required.' };

  const { data: bullet } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id')
    .eq('id', bullet_id)
    .maybeSingle();
  if (!bullet) return { success: false, error: 'Bullet not found.' };

  const access = await assertSectionAccess(bullet.section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const { error: updateErr } = await supabase
    .from('team_meeting_bullets')
    .update({ bullet_note: note_text?.trim() || null })
    .eq('id', bullet_id);
  if (updateErr) return { success: false, error: updateErr.message };

  await bumpMeeting(access.meeting.id);
  return { success: true };
}

module.exports = { update_bullet_note };
