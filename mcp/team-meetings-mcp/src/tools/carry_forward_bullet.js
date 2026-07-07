// carry_forward_bullet.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Carries a bullet from a prior meeting to the current meeting, preserving lineage
// via carried_from_bullet_id FK. Never copies text without the FK — that breaks
// the carry-forward relationship (D-490 Step 6 critical note).

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ source_bullet_id: string, target_meeting_id: string }} params
 * @param {string} caller_user_id
 */
async function carry_forward_bullet(params, caller_user_id) {
  const { source_bullet_id, target_meeting_id } = params;
  if (!source_bullet_id)  return { success: false, error: 'source_bullet_id is required.' };
  if (!target_meeting_id) return { success: false, error: 'target_meeting_id is required.' };

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

  // Load source bullet.
  const { data: sourceBullet, error: bulletErr } = await supabase
    .from('team_meeting_bullets')
    .select('id, text, initiative_id, section_id')
    .eq('id', source_bullet_id)
    .maybeSingle();
  if (bulletErr || !sourceBullet) {
    return { success: false, error: 'Source bullet not found.' };
  }

  // Resolve source section's section_key.
  const { data: sourceSection, error: sourceSectionErr } = await supabase
    .from('team_meeting_sections')
    .select('section_key')
    .eq('id', sourceBullet.section_id)
    .maybeSingle();
  if (sourceSectionErr || !sourceSection) {
    return { success: false, error: 'Source section not found.' };
  }

  // Find matching section in target meeting.
  const { data: targetSection, error: targetSectionErr } = await supabase
    .from('team_meeting_sections')
    .select('id')
    .eq('meeting_id', target_meeting_id)
    .eq('section_key', sourceSection.section_key)
    .maybeSingle();
  if (targetSectionErr || !targetSection) {
    return {
      success: false,
      error: `Target meeting does not have a matching section for '${sourceSection.section_key}'.`
    };
  }

  // Compute next sort_order in target section.
  const { data: maxRow } = await supabase
    .from('team_meeting_bullets')
    .select('sort_order')
    .eq('section_id', targetSection.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data: newBullet, error: insertErr } = await supabase
    .from('team_meeting_bullets')
    .insert({
      section_id:            targetSection.id,
      text:                  sourceBullet.text,
      initiative_id:         sourceBullet.initiative_id ?? null,
      sort_order,
      carried_from_bullet_id: source_bullet_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to carry forward bullet: ${insertErr.message}` };
  }

  // Verify the FK was set — a null FK here means something went wrong (D-490 Step 6).
  if (!newBullet.carried_from_bullet_id) {
    return { success: false, error: 'Carry-forward failed: carried_from_bullet_id was not set on the new bullet.' };
  }

  return { success: true, data: { bullet: newBullet, target_meeting_id } };
}

module.exports = { carry_forward_bullet };
