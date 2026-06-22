// list_api_keys.js
// Pathways OI Trust — division-mcp (Contract 31, D-474). Phil-only.
//
// Returns all API keys (active and inactive), newest first. No deleted_at
// filter — revoked_at is the state field, and inactive keys must remain
// visible in the admin grid. Never returns key_hash or division_ids.

'use strict';

const { supabase } = require('../db');
const { isPhil } = require('../helpers/phil');
const { resolveCreatorNames, shapeApiKeyRow } = require('../helpers/api-key-format');

/**
 * @param {object} _params - none
 * @param {string} caller_user_id
 */
async function list_api_keys(_params, caller_user_id) {
  if (!(await isPhil(caller_user_id))) {
    return { success: false, error: 'Only Phil can manage API keys.' };
  }

  const { data: rows, error } = await supabase
    .from('api_keys')
    .select('key_id, display_name, user_label, scope_type, created_at, last_used_at, revoked_at, created_by')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: `Failed to list API keys: ${error.message}.` };
  }

  const nameMap = await resolveCreatorNames(supabase, rows || []);
  const data = (rows || []).map(r => shapeApiKeyRow(r, nameMap.get(r.created_by)));

  return { success: true, data };
}

module.exports = { list_api_keys };
