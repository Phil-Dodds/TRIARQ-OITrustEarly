// get_api_key.js
// Pathways OI Trust — division-mcp (Contract 31, D-474). Phil-only.
//
// Returns a single API key by key_id, same shape as one list_api_keys item.
// Never returns key_hash, never returns the raw key (that is shown once at
// creation only). 404-equivalent error envelope when not found.

'use strict';

const { supabase } = require('../db');
const { isPhil } = require('../helpers/phil');
const { resolveCreatorNames, shapeApiKeyRow } = require('../helpers/api-key-format');

/**
 * @param {object} params
 * @param {string} params.key_id - required
 * @param {string} caller_user_id
 */
async function get_api_key(params, caller_user_id) {
  const { key_id } = params || {};

  if (!(await isPhil(caller_user_id))) {
    return { success: false, error: 'Only Phil can manage API keys.' };
  }
  if (!key_id) {
    return { success: false, error: 'key_id is required.' };
  }

  const { data: row, error } = await supabase
    .from('api_keys')
    .select('key_id, display_name, user_label, scope_type, created_at, last_used_at, revoked_at, created_by')
    .eq('key_id', key_id)
    .maybeSingle();

  if (error) {
    return { success: false, error: `Failed to fetch API key: ${error.message}.` };
  }
  if (!row) {
    return { success: false, error: 'API key not found.' };
  }

  const nameMap = await resolveCreatorNames(supabase, [row]);
  return { success: true, data: shapeApiKeyRow(row, nameMap.get(row.created_by)) };
}

module.exports = { get_api_key };
