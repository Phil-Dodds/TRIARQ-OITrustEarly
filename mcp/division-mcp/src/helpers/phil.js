// phil.js
// Pathways OI Trust — division-mcp shared helper (Contract 31).
//
// Phil identification for the Phil-only api_key tools (D-474). Mirrors
// delivery-cycle-mcp/src/tools/helpers/phil.js (CC-29-5): Phil = the single
// row in public.users where is_super_admin = true. Migration 033 set
// is_super_admin = true on Phil's row only; it is the canonical, non-hardcoded
// Phil identifier. is_admin is NOT sufficient — multiple users may be admins;
// only Phil is super-admin.
//
// CC-31 deviation note: the spec (§WS1.3) says "use the existing isPhil()
// helper (helpers/phil.js)", but that helper lived only in delivery-cycle-mcp.
// The six api_key tools ship in division-mcp (D-474), which had no phil.js, so
// this is a same-shape copy local to division-mcp. Recorded as a CC-decision.

'use strict';

const { supabase } = require('../db');

/**
 * True iff the caller is Phil (the super-admin). Used by the Phil-only api_key
 * tools to avoid duplicating the is_super_admin check.
 * @param {string} caller_user_id
 * @returns {Promise<boolean>}
 */
async function isPhil(caller_user_id) {
  if (!caller_user_id) { return false; }
  const { data: caller } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  return caller?.is_super_admin === true;
}

module.exports = { isPhil };
