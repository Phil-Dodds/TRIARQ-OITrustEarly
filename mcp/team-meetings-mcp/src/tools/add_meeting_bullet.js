// add_meeting_bullet.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Adds a bullet to a meeting section.
//
// CRITICAL: initiative_id must be set when called from the @ picker or reference
// panel "+ Add". Never set initiative_id from free-text input (D-490 spec Step 2).
// carry_forward_bullet sets carried_from_bullet_id via this tool's logic path.

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ section_id: string, text: string, initiative_id?: string, carried_from_bullet_id?: string }} params
 * @param {string} caller_user_id
 */
async function add_meeting_bullet(params, caller_user_id) {
  const { section_id, text, initiative_id, carried_from_bullet_id } = params;

  if (!section_id) return { success: false, error: 'section_id is required.' };
  if (!text?.trim()) return { success: false, error: 'text is required.' };

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

  // Verify section exists.
  const { data: section, error: sectionErr } = await supabase
    .from('team_meeting_sections')
    .select('id')
    .eq('id', section_id)
    .maybeSingle();
  if (sectionErr || !section) {
    return { success: false, error: 'Section not found.' };
  }

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
    text:                  text.trim(),
    sort_order,
    initiative_id:         initiative_id         ?? null,
    carried_from_bullet_id: carried_from_bullet_id ?? null
  };

  const { data: bullet, error: bulletErr } = await supabase
    .from('team_meeting_bullets')
    .insert(newBullet)
    .select()
    .single();
  if (bulletErr) return { success: false, error: `Failed to add bullet: ${bulletErr.message}` };

  return { success: true, data: bullet };
}

module.exports = { add_meeting_bullet };
