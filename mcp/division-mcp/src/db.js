// db.js
// Pathways OI Trust — division-mcp
// Supabase client singleton using the service role key.
// Only imported by MCP tool handlers — never exposed to Angular.
// SUPABASE_SERVICE_ROLE_KEY has full DB access and bypasses RLS (which is disabled).

'use strict';

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[division-mcp] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

module.exports = { supabase };
