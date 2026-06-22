// reactivate_api_key.js
// Pathways OI Trust — division-mcp (Contract 31, D-474). Phil-only.
//
// Reactivates a revoked API key by clearing revoked_at. The same raw key works
// again immediately. Idempotency guard: already-active returns a conflict
// envelope ("Key is already active."). Reactivation is reversible/low-risk, so
// the screen uses a single confirm (not a two-step) per D-183 / D-475.
//
// CC-31 deviation (audit log): cycle_event_log writes omitted for api_key tools.

'use strict';

const { supabase } = require('../db');
const { isPhil } = require('../helpers/phil');

/**
 * @param {object} params
 * @param {string} params.key_id - required
 * @param {string} caller_user_id
 */
async function reactivate_api_key(params, caller_user_id) {
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
    return { success: false, error: `Failed to reactivate API key: ${existErr.message}.` };
  }
  if (!existing) {
    return { success: false, error: 'API key not found.' };
  }
  if (existing.revoked_at === null) {
    return { success: false, error: 'Key is already active.' };
  }

  const { data: row, error } = await supabase
    .from('api_keys')
    .update({ revoked_at: null })
    .eq('key_id', key_id)
    .not('revoked_at', 'is', null)
    .select('key_id')
    .single();

  if (error || !row) {
    return { success: false, error: `Failed to reactivate API key: ${error?.message || 'unknown error'}.` };
  }

  return { success: true, data: { key_id: row.key_id } };
}

module.exports = { reactivate_api_key };
