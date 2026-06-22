// api-key-format.js
// Pathways OI Trust — division-mcp (Contract 31, D-474).
//
// Shared response shaping for the api_key read tools (list_api_keys,
// get_api_key, and the update/inactivate/reactivate return payloads). Keeps the
// returned shape identical across tools (S-030 — single responsibility, no
// duplicated logic) and guarantees key_hash and division_ids are never present
// in any response (Phase 1 — scope always 'all').

'use strict';

/**
 * Resolve created_by UUIDs to display names in one query.
 * @param {object} supabase
 * @param {Array<{created_by: string}>} rows
 * @returns {Promise<Map<string,string>>} map of user id → display_name
 */
async function resolveCreatorNames(supabase, rows) {
  const ids = [...new Set(rows.map(r => r.created_by).filter(Boolean))];
  if (ids.length === 0) { return new Map(); }
  const { data } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', ids);
  return new Map((data || []).map(u => [u.id, u.display_name]));
}

/**
 * Shape a raw api_keys row into the tool response shape. Never includes
 * key_hash or division_ids.
 * @param {object} row - raw api_keys row (must include key_id, display_name,
 *   user_label, scope_type, created_at, last_used_at, revoked_at, created_by)
 * @param {string|null} createdByName
 */
function shapeApiKeyRow(row, createdByName) {
  return {
    key_id:          row.key_id,
    display_name:    row.display_name,
    user_label:      row.user_label,
    scope_type:      row.scope_type,
    created_at:      row.created_at,
    last_used_at:    row.last_used_at,
    revoked_at:      row.revoked_at,
    is_active:       row.revoked_at === null,      // derived — no stored boolean (D-474)
    created_by_name: createdByName || null
  };
}

module.exports = { resolveCreatorNames, shapeApiKeyRow };
