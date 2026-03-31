// jwt.js
// Pathways OI Trust — document-access-mcp
// JWT validation middleware. Fires on every request before any tool logic.
// Returns 401 on any failure — no exceptions, no bypasses (D-93, D-142).
// Uses supabase.auth.getUser() — works with RS256 and HS256 Supabase projects.

'use strict';

const { supabase } = require('../db');

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
    return res.status(401).json({
      success: false,
      error: 'JWT validation failed. Token is invalid or expired.'
    });
  }
}

module.exports = { validateJwt };
