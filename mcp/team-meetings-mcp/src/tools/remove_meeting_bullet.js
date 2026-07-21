// remove_meeting_bullet.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Hard deletes a bullet (list items are ephemeral per D-490 Step 2 spec).
// ON DELETE SET NULL on carried_from_bullet_id FK handles carry-forward references.
// Any track member.

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ bullet_id: string }} params
 * @param {string} caller_user_id
 */
async function remove_meeting_bullet(params, caller_user_id) {
  const { bullet_id } = params;
  if (!bullet_id) return { success: false, error: 'bullet_id is required.' };

  const { data: bullet } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id, indent_level, sort_order')
    .eq('id', bullet_id)
    .maybeSingle();
  if (!bullet) return { success: false, error: 'Bullet not found.' };

  const access = await assertSectionAccess(bullet.section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  // CC-38 f22: deleting a parent PROMOTES its contiguous sub-bullets — never
  // a silent cascade (Phil ruling).
  if ((bullet.indent_level ?? 0) === 0) {
    const { data: siblings } = await supabase
      .from('team_meeting_bullets')
      .select('id, indent_level, sort_order')
      .eq('section_id', bullet.section_id)
      .gt('sort_order', bullet.sort_order)
      .order('sort_order', { ascending: true });
    const toPromote = [];
    for (const s of siblings || []) {
      if ((s.indent_level ?? 0) === 1) { toPromote.push(s.id); } else { break; }
    }
    if (toPromote.length) {
      await supabase.from('team_meeting_bullets')
        .update({ indent_level: 0 }).in('id', toPromote);
    }
  }

  const { error } = await supabase
    .from('team_meeting_bullets')
    .delete()
    .eq('id', bullet_id);
  if (error) return { success: false, error: `Failed to remove bullet: ${error.message}` };

  await bumpMeeting(access.meeting.id);
  return { success: true, data: { bullet_id } };
}

module.exports = { remove_meeting_bullet };
