// jwt.js
// Pathways OI Trust — delivery-cycle-mcp
// JWT validation middleware. Fires on every request before any tool logic.
// Returns 401 on any failure — no exceptions (D-93, D-144).
//
// Auth path: Bearer <supabase-jwt> — validated via supabase.auth.getUser().
// Dev bypass removed (D-248, Auth Contract 2026-04-14).

'use strict';

const { supabase } = require('../db');

/**
 * Validates the Authorization header.
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
    // Never log the token value.
    return res.status(401).json({
      success: false,
      error: 'JWT validation failed. Token is invalid or expired.'
    });
  }
}

module.exports = { validateJwt };
