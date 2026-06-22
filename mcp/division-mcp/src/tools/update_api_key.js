// update_api_key.js
// Pathways OI Trust — division-mcp (Contract 31, D-474). Phil-only.
//
// Updates the mutable label fields (display_name, user_label) on an API key.
// Scope is not editable post-creation (Phase 1 — always 'all'). Returns the
// updated record in get_api_key shape. 404-equivalent envelope when not found.

'use strict';

const { supabase } = require('../db');
const { isPhil } = require('../helpers/phil');
const { resolveCreatorNames, shapeApiKeyRow } = require('../helpers/api-key-format');

/**
 * @param {object} params
 * @param {string}  params.key_id        - required
 * @param {string} [params.display_name] - optional, non-empty if provided
 * @param {string} [params.user_label]   - optional, non-empty if provided
 * @param {string} caller_user_id
 */
async function update_api_key(params, caller_user_id) {
  const { key_id, display_name, user_label } = params || {};

  if (!(await isPhil(caller_user_id))) {
    return { success: false, error: 'Only Phil can manage API keys.' };
  }
  if (!key_id) {
    return { success: false, error: 'key_id is required.' };
  }

  const payload = {};
  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.trim().length === 0) {
      return { success: false, error: 'display_name cannot be empty.' };
    }
    payload.display_name = display_name.trim();
  }
  if (user_label !== undefined) {
    if (typeof user_label !== 'string' || user_label.trim().length === 0) {
      return { success: false, error: 'user_label cannot be empty.' };
    }
    payload.user_label = user_label.trim();
  }
  if (Object.keys(payload).length === 0) {
    return { success: false, error: 'Provide at least one of display_name or user_label to update.' };
  }

  // Confirm the key exists (distinguish 404 from a no-op update).
  const { data: existing, error: existErr } = await supabase
    .from('api_keys')
    .select('key_id')
    .eq('key_id', key_id)
    .maybeSingle();
  if (existErr) {
    return { success: false, error: `Failed to update API key: ${existErr.message}.` };
  }
  if (!existing) {
    return { success: false, error: 'API key not found.' };
  }

  const { data: row, error } = await supabase
    .from('api_keys')
    .update(payload)
    .eq('key_id', key_id)
    .select('key_id, display_name, user_label, scope_type, created_at, last_used_at, revoked_at, created_by')
    .single();

  if (error || !row) {
    return { success: false, error: `Failed to update API key: ${error?.message || 'unknown error'}.` };
  }

  const nameMap = await resolveCreatorNames(supabase, [row]);
  return { success: true, data: shapeApiKeyRow(row, nameMap.get(row.created_by)) };
}

module.exports = { update_api_key };
