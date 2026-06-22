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

    // SECURITY: a valid Supabase token is necessary but NOT sufficient — Supabase
    // OTP authenticates ANY email. The identity must map to an active public.users
    // row. Fail closed on a definitive "no active row"; fail open on a transient
    // lookup error so a DB blip never locks out legitimate users. (D-302/D-354, Arch-5.)
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', data.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!userErr && (!userRow || userRow.is_active === false)) {
      return res.status(401).json({
        success: false,
        error: 'Your account is not provisioned for OI Trust access. Contact your System Admin.'
      });
    }

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
