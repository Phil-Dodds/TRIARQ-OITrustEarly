// inactivate_api_key.js
// Pathways OI Trust — division-mcp (Contract 31, D-474). Phil-only.
//
// Revokes an API key by stamping revoked_at = now(). The key stops working
// immediately on the next initiative-public-mcp call. Idempotency guard:
// already-inactive returns a conflict envelope ("Key is already inactive.")
// rather than silently re-stamping.
//
// CC-31 deviation (audit log): cycle_event_log writes omitted for api_key tools
// (delivery_cycle_id is NOT NULL; a key has no Initiative). See create_api_key.

'use strict';

const { supabase } = require('../db');
const { isPhil } = require('../helpers/phil');

/**
 * @param {object} params
 * @param {string} params.key_id - required
 * @param {string} caller_user_id
 */
async function inactivate_api_key(params, caller_user_id) {
  const { key_id } = params || {};

  if (!(await isPhil(caller_user_id))) {
    return { success: false, error: 'Only Phil can manage API keys.' };
  }
  if (!key_id) {
    return { success: false, error: 'key_id is required.' };
  }

  const { data: existing, error: existErr } = await supabase
    .from('api_keys')
    .select('key_id, revoked_at')
    .eq('key_id', key_id)
    .maybeSingle();
  if (existErr) {
    return { success: false, error: `Failed to inactivate API key: ${existErr.message}.` };
  }
  if (!existing) {
    return { success: false, error: 'API key not found.' };
  }
  if (existing.revoked_at !== null) {
    return { success: false, error: 'Key is already inactive.' };
  }

  const { data: row, error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('key_id', key_id)
    .is('revoked_at', null)
    .select('key_id, revoked_at')
    .single();

  if (error || !row) {
    return { success: false, error: `Failed to inactivate API key: ${error?.message || 'unknown error'}.` };
  }

  return { success: true, data: { key_id: row.key_id, revoked_at: row.revoked_at } };
}

module.exports = { inactivate_api_key };
