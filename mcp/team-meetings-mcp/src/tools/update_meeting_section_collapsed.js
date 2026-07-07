// update_meeting_section_collapsed.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Lightweight single-field update: persists collapsed/expanded state for a section.
// CC-001: added per Step 4 spec reference — not in the original 7-tool count.

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ section_id: string, collapsed: boolean }} params
 * @param {string} caller_user_id
 */
async function update_meeting_section_collapsed(params, caller_user_id) {
  const { section_id, collapsed } = params;
  if (!section_id)          return { success: false, error: 'section_id is required.' };
  if (collapsed === undefined || collapsed === null) {
    return { success: false, error: 'collapsed is required.' };
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

  const { error } = await supabase
    .from('team_meeting_sections')
    .update({ collapsed: !!collapsed })
    .eq('id', section_id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: { section_id, collapsed: !!collapsed } };
}

module.exports = { update_meeting_section_collapsed };
