// api-key-auth.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473/D-474).
//
// API-key authentication. This server does NOT validate a Supabase JWT — it is
// an explicit, documented exception to Arch-5 (Pre-Plan Instruction 4): the
// server is read-only and publicly accessible by design. Auth is the inbound
// `Authorization: Bearer oitrust_…` token, bcrypt-compared against the active
// rows in api_keys. On a match, last_used_at is stamped (fire-and-forget) and
// the key's scope is returned for Phase-2 Division scoping.
//
// Performance note (CodeClose candidate): iterating all active keys for a
// bcrypt compare is acceptable for Phase 1 (small key count). If the key count
// grows, add a fast-path lookup column.

'use strict';

const bcrypt = require('bcrypt');

/**
 * @param {object} supabase - service-role client
 * @param {string|undefined} authHeader - raw Authorization header value
 * @returns {Promise<{valid:boolean, scope_type?:string, division_ids?:string[], key_id?:string, error?:string}>}
 */
async function validateApiKey(supabase, authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or malformed Authorization header' };
  }
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith('oitrust_')) {
    return { valid: false, error: 'Invalid key format' };
  }

  // Fetch all active keys — bcrypt requires comparing each hash.
  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('key_id, key_hash, scope_type, division_ids')
    .is('revoked_at', null);

  if (error || !keys || keys.length === 0) {
    return { valid: false, error: 'Authentication failed' };
  }

  for (const key of keys) {
    const match = await bcrypt.compare(rawKey, key.key_hash);
    if (match) {
      // Stamp last_used_at (fire and forget — never block the request).
      supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_id', key.key_id)
        .then(() => {}, () => {});

      return {
        valid: true,
        key_id: key.key_id,
        scope_type: key.scope_type,
        division_ids: key.division_ids || []
      };
    }
  }
  return { valid: false, error: 'Invalid API key' };
}

module.exports = { validateApiKey };
