// update_meeting_notes.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Upserts notes for a section. Auto-saves on blur. Any track member.
// Optimistic concurrency: pass base_updated_at (the notes updated_at the client
// loaded). If the server copy is newer, the save is rejected with a conflict
// payload so the UI can offer reload-or-overwrite.

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ section_id: string, notes_text: string, base_updated_at?: string, force?: boolean }} params
 * @param {string} caller_user_id
 */
async function update_meeting_notes(params, caller_user_id) {
  const { section_id, notes_text, base_updated_at, force } = params;
  if (!section_id) return { success: false, error: 'section_id is required.' };
  if (notes_text === undefined || notes_text === null) {
    return { success: false, error: 'notes_text is required.' };
  }

  const access = await assertSectionAccess(section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  // Conflict check — someone else saved since this client loaded.
  if (!force) {
    const { data: current } = await supabase
      .from('team_meeting_notes')
      .select('updated_at, updated_by, notes_text')
      .eq('section_id', section_id)
      .maybeSingle();
    if (current && base_updated_at &&
        new Date(current.updated_at).getTime() > new Date(base_updated_at).getTime()) {
      let editorName = null;
      if (current.updated_by) {
        const { data: editor } = await supabase
          .from('users').select('display_name').eq('id', current.updated_by).maybeSingle();
        editorName = editor?.display_name ?? null;
      }
      return {
        success: false,
        conflict: true,
        error: `These notes were changed by ${editorName || 'another member'} while you were editing.`,
        data: { server_notes_text: current.notes_text, server_updated_at: current.updated_at, editor: editorName }
      };
    }
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

  await bumpMeeting(access.meeting.id);
  return { success: true, data };
}

module.exports = { update_meeting_notes };
