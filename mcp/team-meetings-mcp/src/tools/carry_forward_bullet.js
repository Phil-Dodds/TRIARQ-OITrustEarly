// carry_forward_bullet.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase B
// Carries a bullet from a prior meeting to a target meeting IN THE SAME TRACK,
// preserving lineage via carried_from_bullet_id FK. Never copies text without
// the FK — that breaks the carry-forward relationship (D-490 Step 6).
// Any track member.

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, assertMeetingAccess, bumpMeeting } = require('../track_access');

/**
 * @param {{ source_bullet_id: string, target_meeting_id: string }} params
 * @param {string} caller_user_id
 */
async function carry_forward_bullet(params, caller_user_id) {
  const { source_bullet_id, target_meeting_id } = params;
  if (!source_bullet_id)  return { success: false, error: 'source_bullet_id is required.' };
  if (!target_meeting_id) return { success: false, error: 'target_meeting_id is required.' };

  // Load source bullet.
  const { data: sourceBullet, error: bulletErr } = await supabase
    .from('team_meeting_bullets')
    .select('id, text, bullet_note, initiative_id, section_id, indent_level, sort_order')
    .eq('id', source_bullet_id)
    .maybeSingle();
  if (bulletErr || !sourceBullet) {
    return { success: false, error: 'Source bullet not found.' };
  }

  // Access via source section (resolves meeting + track membership).
  const sourceAccess = await assertSectionAccess(sourceBullet.section_id, caller_user_id);
  if (sourceAccess.error) return { success: false, error: sourceAccess.error };

  // Access to target meeting + same-track guard.
  const targetAccess = await assertMeetingAccess(target_meeting_id, caller_user_id);
  if (targetAccess.error) return { success: false, error: targetAccess.error };
  if (sourceAccess.meeting.track_id !== targetAccess.meeting.track_id) {
    return { success: false, error: 'Bullets can only be carried forward within the same meeting series.' };
  }

  // Find matching section in target meeting.
  const { data: targetSection, error: targetSectionErr } = await supabase
    .from('team_meeting_sections')
    .select('id')
    .eq('meeting_id', target_meeting_id)
    .eq('section_key', sourceAccess.section.section_key)
    .is('deleted_at', null)
    .maybeSingle();
  if (targetSectionErr || !targetSection) {
    return {
      success: false,
      error: `Target meeting does not have a matching section for '${sourceAccess.section.section_key}'.`
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

  // CC-38 f22: carrying a sub-bullet alone loses its meaning — auto-carry the
  // parent line first (deduped by lineage FK or identical text). Phil ruling.
  let nextOrder = sort_order;
  if ((sourceBullet.indent_level ?? 0) === 1) {
    const { data: above } = await supabase
      .from('team_meeting_bullets')
      .select('id, text, bullet_note, initiative_id, indent_level, sort_order')
      .eq('section_id', sourceBullet.section_id)
      .lt('sort_order', sourceBullet.sort_order)
      .order('sort_order', { ascending: false });
    const parent = (above || []).find(b => (b.indent_level ?? 0) === 0);
    if (parent) {
      const { data: byLineage } = await supabase
        .from('team_meeting_bullets')
        .select('id')
        .eq('section_id', targetSection.id)
        .eq('carried_from_bullet_id', parent.id)
        .limit(1);
      let parentExists = (byLineage || []).length > 0;
      if (!parentExists) {
        const { data: byText } = await supabase
          .from('team_meeting_bullets')
          .select('id')
          .eq('section_id', targetSection.id)
          .eq('text', parent.text)
          .limit(1);
        parentExists = (byText || []).length > 0;
      }
      if (!parentExists) {
        await supabase.from('team_meeting_bullets').insert({
          section_id:             targetSection.id,
          text:                   parent.text,
          bullet_note:            parent.bullet_note ?? null,
          initiative_id:          parent.initiative_id ?? null,
          sort_order:             nextOrder,
          indent_level:           0,
          carried_from_bullet_id: parent.id,
          created_by:             caller_user_id
        });
        nextOrder += 1;
      }
    }
  }

  const { data: newBullet, error: insertErr } = await supabase
    .from('team_meeting_bullets')
    .insert({
      section_id:             targetSection.id,
      text:                   sourceBullet.text,
      bullet_note:            sourceBullet.bullet_note ?? null,
      initiative_id:          sourceBullet.initiative_id ?? null,
      sort_order:             nextOrder,
      indent_level:           sourceBullet.indent_level ?? 0,
      carried_from_bullet_id: source_bullet_id,
      created_by:             caller_user_id
    })
    .select()
    .single();
  if (insertErr) {
    return { success: false, error: `Failed to carry forward bullet: ${insertErr.message}` };
  }

  // Verify the FK was set (D-490 Step 6).
  if (!newBullet.carried_from_bullet_id) {
    return { success: false, error: 'Carry-forward failed: carried_from_bullet_id was not set on the new bullet.' };
  }

  await bumpMeeting(target_meeting_id);
  return { success: true, data: { bullet: newBullet, target_meeting_id } };
}

module.exports = { carry_forward_bullet };
