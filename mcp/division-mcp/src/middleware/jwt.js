// jwt.js
// Pathways OI Trust — division-mcp
// JWT validation middleware. Fires on every request before any tool logic.
// Returns 401 on any failure — no exceptions, no bypasses (D-93, D-142).
//
// Uses Supabase auth.getUser() to validate tokens — works with both HS256
// and RS256 signing (Supabase newer projects use asymmetric RS256).
// No JWT secret or Key ID required. The Supabase service client handles
// all cryptographic verification internally.

'use strict';

const { supabase } = require('../db');

/**
 * Validates the Supabase JWT from the Authorization header.
 * On success: attaches { user_id, email } to req.auth and calls next().
 * On failure: returns 401 with { success: false, error: string }.
 */
async function validateJwt(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header missing or malformed. Expected: Bearer <token>.'
    });
  }

  const token = authHeader.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: 'JWT validation failed. Token is invalid or expired.'
      });
    }

    req.auth = {
      user_id: data.user.id,
      email:   data.user.email || null
    };

    next();
  } catch (err) {
    // Never log the token value
    return res.status(401).json({
      success: false,
      error: 'JWT validation failed. Token is invalid or expired.'
    });
  }
}

module.exports = { validateJwt };
