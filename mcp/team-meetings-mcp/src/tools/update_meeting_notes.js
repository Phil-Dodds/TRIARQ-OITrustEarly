// update_meeting_notes.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Upserts notes for a section. Auto-saves on blur from the notes textarea.

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ section_id: string, notes_text: string }} params
 * @param {string} caller_user_id
 */
async function update_meeting_notes(params, caller_user_id) {
  const { section_id, notes_text } = params;
  if (!section_id) return { success: false, error: 'section_id is required.' };
  if (notes_text === undefined || notes_text === null) {
    return { success: false, error: 'notes_text is required.' };
  }

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

  const { data, error } = await supabase
    .from('team_meeting_notes')
    .upsert(
      {
        section_id,
        notes_text,
        updated_at: new Date().toISOString(),
        updated_by: caller_user_id
      },
      { onConflict: 'section_id' }
    )
    .select()
    .single();

  if (error) return { success: false, error: `Failed to save notes: ${error.message}` };
  return { success: true, data };
}

module.exports = { update_meeting_notes };
