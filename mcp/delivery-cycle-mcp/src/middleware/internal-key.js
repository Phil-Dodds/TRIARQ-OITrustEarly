// internal-key.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-643).
//
// Auth for SCHEDULED CALLERS ONLY. Implements RENDER_INTERNAL_API_KEY, which
// CLAUDE.md Arch-4 has declared as "MCP server auth" since Build C but which
// nothing had built until now.
//
// ── Why this exists at all ───────────────────────────────────────────────────
// The 06:00 digest (D-643) has no user. Arch-5 requires a JWT on every tool
// call, and correctly so — but a JWT belongs to a person, and there is no
// person here. Rather than mint a service account (a real user row with real
// permissions that could be used for anything), scheduled work gets a separate,
// deliberately tiny door.
//
// ── Why it is NOT wired into the tool router ─────────────────────────────────
// The obvious shortcut is to accept this key in `app.use(validateJwt)` as an
// alternative credential. That would make every one of the ~90 tools reachable
// with a static key, which is a far larger blast radius than the one job needs.
// Instead this guards specific /internal/* routes mounted BEFORE validateJwt,
// and those routes expose exactly one operation each. The key cannot reach the
// tool router at all.
//
// ── Failure posture ──────────────────────────────────────────────────────────
// Absent or unset env var = the route is DISABLED, not open. A missing
// configuration must never become an unauthenticated endpoint.

'use strict';

const crypto = require('crypto');

/**
 * Timing-safe comparison. A plain === leaks the key one character at a time to
 * anyone who can measure response times, which for a static long-lived
 * credential is worth avoiding even behind a scheduler.
 */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) { return false; }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Express middleware. Requires header `x-internal-api-key` to match
 * process.env.RENDER_INTERNAL_API_KEY.
 */
function requireInternalKey(req, res, next) {
  const expected = process.env.RENDER_INTERNAL_API_KEY;

  // Unset env var → route disabled. Never open.
  if (!expected) {
    return res.status(404).json({
      success: false,
      error:   'Not found.'
    });
  }

  const provided = req.headers['x-internal-api-key'];
  if (!provided || !safeEqual(provided, expected)) {
    // Deliberately unspecific: a scheduled caller knows what it sent, and an
    // unauthorised one learns nothing about why it failed.
    return res.status(401).json({
      success: false,
      error:   'Unauthorized.'
    });
  }

  return next();
}

module.exports = { requireInternalKey, safeEqual };
