// upsert_user_screen_state.js
// Pathways OI Trust — division-mcp
//
// Persists the calling user's filter and sort state for a single screen.
// Per Contract 17 §2 / D-380 / D-381: screen state writes are mediated by MCP —
// user_id is taken from the JWT (caller_user_id) and never accepted as a
// parameter, so a caller cannot write to another user's row. The unique
// constraint (user_id, screen_key) on user_screen_state ensures one row per
// screen per user — every call is an upsert.
//
// D-171 Filter and Sort Memory rules enforced upstream by the Angular layer:
// search-text fields are never persisted. This tool does not inspect the
// jsonb payload — Angular is responsible for stripping non-persistable fields
// before calling.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.screen_key   - one of the named SCREEN_KEYS constants
 * @param {object} [params.filter_state] - jsonb-serialisable filter state
 * @param {object} [params.sort_state]   - jsonb-serialisable sort state
 * @param {string} caller_user_id      - from JWT
 */
async function upsert_user_screen_state(params, caller_user_id) {
  const { screen_key, filter_state, sort_state } = params || {};

  if (!caller_user_id) {
    return { success: false, error: 'Authenticated user required.' };
  }
  if (!screen_key || typeof screen_key !== 'string' || !screen_key.trim()) {
    return { success: false, error: 'screen_key is required.' };
  }
  if (filter_state !== undefined && filter_state !== null && typeof filter_state !== 'object') {
    return { success: false, error: 'filter_state must be a JSON object.' };
  }
  if (sort_state !== undefined && sort_state !== null && typeof sort_state !== 'object') {
    return { success: false, error: 'sort_state must be a JSON object.' };
  }

  const row = {
    user_id:          caller_user_id,
    screen_key,
    filter_state:     filter_state ?? {},
    sort_state:       sort_state   ?? {},
    last_rendered_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('user_screen_state')
    .upsert(row, { onConflict: 'user_id,screen_key' })
    .select('filter_state, sort_state, last_rendered_at')
    .single();

  if (error) {
    return { success: false, error: `Failed to save screen state: ${error.message}` };
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

module.exports = { upsert_user_screen_state };
