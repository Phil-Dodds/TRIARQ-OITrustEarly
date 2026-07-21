// set_bullet_indent.js
// Pathways OI Trust — team-meetings-mcp (Contract 38 follow-on 22)
// Indent/outdent a bullet (flat model: 0 = bullet, 1 = sub-bullet). Works on
// initiative-linked bullets too (unlike text edits). Any track member.
// Client enforces the "no deeper than the bullet above +1" rule; server just
// bounds the value.

'use strict';

const { supabase } = require('../db');
const { assertSectionAccess, bumpMeeting } = require('../track_access');

async function set_bullet_indent(params, caller_user_id) {
  const { bullet_id } = params;
  const indent_level = params.indent_level === 1 ? 1 : params.indent_level === 0 ? 0 : null;
  if (!bullet_id) return { success: false, error: 'bullet_id is required.' };
  if (indent_level === null) return { success: false, error: 'indent_level must be 0 or 1.' };

  const { data: bullet } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id')
    .eq('id', bullet_id)
    .maybeSingle();
  if (!bullet) return { success: false, error: 'Bullet not found.' };

  const access = await assertSectionAccess(bullet.section_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const { error } = await supabase
    .from('team_meeting_bullets')
    .update({ indent_level })
    .eq('id', bullet_id);
  if (error) return { success: false, error: error.message };

  await bumpMeeting(access.meeting.id);
  return { success: true, data: { bullet_id, indent_level } };
}

module.exports = { set_bullet_indent };
