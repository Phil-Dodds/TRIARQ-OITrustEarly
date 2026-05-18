// get_user_screen_state.js
// Pathways OI Trust — division-mcp
//
// Returns the calling user's persisted filter and sort state for a single
// screen, identified by the named screen_key. Per Contract 17 §2 / D-380:
// screen state access is mediated by MCP — the table is never read directly
// from Angular. user_id is taken from the JWT (caller_user_id) — never accepted
// as a parameter — so a caller cannot read another user's state.
//
// Recency rule (SCREEN_STATE_RECENCY_DAYS = 7): rows older than 7 days are
// treated as absent — the client falls back to system defaults. The rule is
// enforced server-side here so the recency policy can never be bypassed by an
// Angular bug.
//
// Returns { success: true, data: { filter_state, sort_state, last_rendered_at } }
// or { success: true, data: null } when nothing is stored within the recency
// window. { success: false, error } only on hard errors.

'use strict';

const { supabase } = require('../db');

const SCREEN_STATE_RECENCY_DAYS = 7;

/**
 * @param {object} params
 * @param {string} params.screen_key  - one of the named SCREEN_KEYS constants
 * @param {string} caller_user_id     - from JWT
 */
async function get_user_screen_state(params, caller_user_id) {
  const { screen_key } = params || {};

  if (!caller_user_id) {
    return { success: false, error: 'Authenticated user required.' };
  }
  if (!screen_key || typeof screen_key !== 'string' || !screen_key.trim()) {
    return { success: false, error: 'screen_key is required.' };
  }

  const { data, error } = await supabase
    .from('user_screen_state')
    .select('filter_state, sort_state, last_rendered_at')
    .eq('user_id',    caller_user_id)
    .eq('screen_key', screen_key)
    .maybeSingle();

  if (error) {
    return { success: false, error: `Failed to read screen state: ${error.message}` };
  }

  if (!data) {
    return { success: true, data: null };
  }

  // Recency enforcement — older than 7 days → treat as absent.
  const last = new Date(data.last_rendered_at).getTime();
  if (!Number.isFinite(last)) {
    return { success: true, data: null };
  }
  const ageMs = Date.now() - last;
  if (ageMs > SCREEN_STATE_RECENCY_DAYS * 86_400_000) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      filter_state:     data.filter_state ?? {},
      sort_state:       data.sort_state   ?? {},
      last_rendered_at: data.last_rendered_at
    }
  };
}

module.exports = { get_user_screen_state, SCREEN_STATE_RECENCY_DAYS };
