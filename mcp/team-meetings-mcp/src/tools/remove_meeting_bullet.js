// remove_meeting_bullet.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Hard deletes a bullet. ON DELETE SET NULL on carried_from_bullet_id FK handles
// nulling out carry-forward references on child bullets automatically (D-490 Step 2).

'use strict';

const { supabase } = require('../db');

/**
 * @param {{ bullet_id: string }} params
 * @param {string} caller_user_id
 */
async function remove_meeting_bullet(params, caller_user_id) {
  const { bullet_id } = params;
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

  const { error } = await supabase
    .from('team_meeting_bullets')
    .delete()
    .eq('id', bullet_id);

  if (error) return { success: false, error: `Failed to remove bullet: ${error.message}` };
  return { success: true, data: { bullet_id } };
}

module.exports = { remove_meeting_bullet };
