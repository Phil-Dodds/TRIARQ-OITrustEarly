// create_api_key.js
// Pathways OI Trust — division-mcp (Contract 31, D-474). Phil-only.
//
// Issues a new API key. Returns the raw oitrust_… key ONCE — it is not stored
// and cannot be retrieved again (only the bcrypt hash is persisted). Phase 1:
// scope_type is always 'all' (all Divisions); division_ids stays empty.
//
// CC-31 deviation (audit log): the spec instructs logging api_key_created to
// cycle_event_log. That table's delivery_cycle_id is NOT NULL (FK to
// delivery_cycles); an API key has no Initiative, so the insert would fail.
// Per Phil's call this contract, cycle_event_log writes are omitted for the
// api_key tools — created_by + created_at on the row are the issuance audit
// trail. Recorded as a CC-decision.

'use strict';

const { supabase } = require('../db');
const { isPhil } = require('../helpers/phil');
const { generateApiKey, KEY_PREFIX } = require('../helpers/api-key');

/**
 * @param {object} params
 * @param {string} params.display_name - required, non-empty
 * @param {string} params.user_label   - required, non-empty (the person the key is for)
 * @param {string} caller_user_id
 */
async function create_api_key(params, caller_user_id) {
  const { display_name, user_label } = params || {};

  // Phil-only (D-474). Authz failure surfaces as the standard error envelope.
  if (!(await isPhil(caller_user_id))) {
    return { success: false, error: 'Only Phil can manage API keys.' };
  }

  if (typeof display_name !== 'string' || display_name.trim().length === 0) {
    return { success: false, error: 'display_name is required and cannot be empty.' };
  }
  if (typeof user_label !== 'string' || user_label.trim().length === 0) {
    return { success: false, error: 'user_label is required and cannot be empty.' };
  }

  const { raw, hash } = await generateApiKey();

  const { data: row, error } = await supabase
    .from('api_keys')
    .insert({
      key_hash:     hash,
      display_name: display_name.trim(),
      user_label:   user_label.trim(),
      scope_type:   'all',
      division_ids: [],
      created_by:   caller_user_id
    })
    .select('key_id, display_name, user_label, created_at')
    .single();

  if (error || !row) {
    return { success: false, error: `Failed to create API key: ${error?.message || 'unknown error'}.` };
  }

  // raw_key is returned exactly once — never persisted, never logged.
  return {
    success: true,
    data: {
      key_id:       row.key_id,
      raw_key:      raw,            // prefix: KEY_PREFIX (oitrust_)
      display_name: row.display_name,
      user_label:   row.user_label,
      created_at:   row.created_at
    }
  };
}

module.exports = { create_api_key, KEY_PREFIX };
