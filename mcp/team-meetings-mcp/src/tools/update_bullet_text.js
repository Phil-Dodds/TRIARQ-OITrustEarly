// update_bullet_text.js
// Pathways OI Trust — team-meetings-mcp
// Edit a saved bullet's text. Free-text bullets only — an initiative-linked
// bullet displays the Initiative name (its text is never rendered), so a
// rename would silently vanish; callers are told to edit the note instead.

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ bullet_id: string, text: string }} params
 * @param {string} caller_user_id
 */
async function update_bullet_text(params, caller_user_id) {
  const { bullet_id } = params;
  const text = typeof params.text === 'string' ? params.text.trim() : '';
  if (!bullet_id) return { success: false, error: 'bullet_id is required.' };
  if (!text)      return { success: false, error: 'text is required and cannot be empty.' };

  const { data: bullet } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id, initiative_id')
    .eq('id', bullet_id)
    .maybeSingle();
  if (!bullet) return { success: false, error: 'Bullet not found.' };
  if (bullet.initiative_id) {
    return {
      success: false,
      error: 'This bullet shows an Initiative name and cannot be renamed. Edit its note instead, or remove it and add a new bullet.'
    };
  }

  const access = await assertSectionAccess(bullet.section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const { error } = await supabase
    .from('team_meeting_bullets')
    .update({ text })
    .eq('id', bullet_id);
  if (error) return { success: false, error: error.message };

  await bumpMeeting(access.meeting.id);
  return { success: true, data: { bullet_id, text } };
}

module.exports = { update_bullet_text };
