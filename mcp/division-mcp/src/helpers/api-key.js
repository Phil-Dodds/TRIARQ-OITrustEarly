// api-key.js
// Pathways OI Trust — division-mcp shared helper (Contract 31, D-474).
//
// API key generation and verification. Key format: `oitrust_` + 32 url-safe
// base64 chars (24 random bytes → base64url). Hash: bcrypt cost 10. The raw
// key is returned once by create_api_key and never stored — only the hash.
// verifyApiKey is shared shape with initiative-public-mcp's auth helper, which
// bcrypt-compares an inbound bearer token against the stored hashes.

'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 10;
const KEY_PREFIX = 'oitrust_';

/**
 * Generate a new API key. Returns the raw key (shown once) and its bcrypt hash
 * (the only value persisted).
 * @returns {Promise<{ raw: string, hash: string }>}
 */
async function generateApiKey() {
  const raw = KEY_PREFIX + crypto.randomBytes(24).toString('base64url');
  const hash = await bcrypt.hash(raw, BCRYPT_ROUNDS);
  return { raw, hash };
}

/**
 * Verify a raw key against a stored bcrypt hash.
 * @param {string} raw
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyApiKey(raw, hash) {
  return bcrypt.compare(raw, hash);
}

module.exports = { generateApiKey, verifyApiKey, KEY_PREFIX, BCRYPT_ROUNDS };
