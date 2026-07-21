// add_meeting_bullet.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Adds a bullet to a meeting section. Any track member. Records created_by attribution.
//
// CRITICAL: initiative_id must be set when called from the @ picker or reference
// panel checkbox. Never set initiative_id from free-text input (D-490 spec Step 2).

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ section_id: string, text: string, initiative_id?: string, carried_from_bullet_id?: string }} params
 * @param {string} caller_user_id
 */
async function add_meeting_bullet(params, caller_user_id) {
  const { section_id, text, initiative_id, carried_from_bullet_id } = params;
  // CC-38 f22: flat indent model — 0 = bullet, 1 = sub-bullet.
  const indent_level = params.indent_level === 1 ? 1 : 0;

  if (!section_id) return { success: false, error: 'section_id is required.' };
  if (!text?.trim()) return { success: false, error: 'text is required.' };

  const access = await assertSectionAccess(section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  // Compute next sort_order.
  const { data: maxRow } = await supabase
    .from('team_meeting_bullets')
    .select('sort_order')
    .eq('section_id', section_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const newBullet = {
    section_id,
    text:                   text.trim(),
    sort_order,
    indent_level,
    initiative_id:          initiative_id          ?? null,
    carried_from_bullet_id: carried_from_bullet_id ?? null,
    created_by:             caller_user_id
  };

  const { data: bullet, error: bulletErr } = await supabase
    .from('team_meeting_bullets')
    .insert(newBullet)
    .select()
    .single();
  if (bulletErr) return { success: false, error: `Failed to add bullet: ${bulletErr.message}` };

  await bumpMeeting(access.meeting.id);
  return { success: true, data: bullet };
}

module.exports = { add_meeting_bullet };
