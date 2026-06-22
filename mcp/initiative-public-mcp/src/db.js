// db.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473).
// Supabase client singleton using the service role key. This server is public
// and API-key authenticated (not JWT); it uses the service role internally to
// read Initiative data and to validate inbound keys against api_keys. The
// service key is never exposed to any client (Arch-1 / Arch-4).

'use strict';

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[initiative-public-mcp] FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

module.exports = { supabase };
