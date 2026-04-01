// jwt.js
// Pathways OI Trust — document-access-mcp
// JWT validation middleware. Fires on every request before any tool logic.
// Returns 401 on any failure — no exceptions (D-93, D-142).
//
// Two auth paths:
//   1. Normal (magic link): Bearer <supabase-jwt> — validated via supabase.auth.getUser()
//   2. Dev bypass: Bearer devbypass::<DEV_BYPASS_TOKEN>::<email> — active only when
//      DEV_BYPASS_TOKEN env var is set. Looks up user by email in public.users.
//      Remove DEV_BYPASS_TOKEN from Render env to disable dev bypass entirely.

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

  // ── Dev bypass ────────────────────────────────────────────────────────────
  // Active only when DEV_BYPASS_TOKEN is set in the MCP server environment.
  // Token format: devbypass::<DEV_BYPASS_TOKEN>::<email>
  const DEV_BYPASS = process.env.DEV_BYPASS_TOKEN;
  if (DEV_BYPASS && token.startsWith('devbypass::')) {
    const parts = token.split('::');
    if (parts.length !== 3 || parts[1] !== DEV_BYPASS || !parts[2]) {
      return res.status(401).json({
        success: false,
        error: 'Dev bypass token invalid or malformed.'
      });
    }

    const devEmail = parts[2].toLowerCase();

    try {
      const { data: userRecord, error: userErr } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', devEmail)
        .is('deleted_at', null)
        .eq('is_active', true)
        .single();

      if (userErr || !userRecord) {
        return res.status(401).json({
          success: false,
          error: `Dev bypass: no active user found for ${devEmail}.`
        });
      }

      req.auth = {
        user_id: userRecord.id,
        email:   userRecord.email
      };

      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Dev bypass: user lookup failed.'
      });
    }
  }
  // ── End dev bypass ────────────────────────────────────────────────────────

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
