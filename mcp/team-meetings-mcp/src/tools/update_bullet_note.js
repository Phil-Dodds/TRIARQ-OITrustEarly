// update_bullet_note.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Saves or clears the per-bullet note. Called on textarea blur in the detail view.

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ bullet_id: string, note_text: string }} params
 * @param {string} caller_user_id
 */
async function update_bullet_note(params, caller_user_id) {
  const { bullet_id, note_text } = params;
  if (!bullet_id) return { success: false, error: 'bullet_id is required.' };

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

  const { error: updateErr } = await supabase
    .from('team_meeting_bullets')
    .update({ bullet_note: note_text?.trim() || null })
    .eq('id', bullet_id);

  if (updateErr) return { success: false, error: updateErr.message };

  return { success: true };
}

module.exports = { update_bullet_note };
