// index.js
// Pathways OI Trust — division-mcp v1.0
// Stateless Node.js MCP server. Admin-only Division and user management.
// JWT validation fires on every request before any tool logic (D-93, D-144).
//
// Tool naming: verb_noun
// Response envelope: { success: boolean, data: any, error?: string }
// All errors return the envelope — never throw to HTTP layer.
// Logs: tool_name, user_id, division_id (if applicable), timestamp, duration_ms
// Never log: JWT values, file content, personal data beyond user_id

'use strict';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { validateJwt } = require('./middleware/jwt');

const { create_division }          = require('./tools/create_division');
const { get_division }             = require('./tools/get_division');
const { list_divisions }           = require('./tools/list_divisions');
const { update_division }          = require('./tools/update_division');
const { assign_user_to_division }  = require('./tools/assign_user_to_division');
const { revoke_division_membership } = require('./tools/revoke_division_membership');
const { get_user_divisions }       = require('./tools/get_user_divisions');
const { create_user }              = require('./tools/create_user');
const { update_user }              = require('./tools/update_user');
const { list_users }               = require('./tools/list_users');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS — allow GitHub Pages and local dev origins ───────────────────────────
// Must be before validateJwt so OPTIONS preflight requests are answered.
app.use(cors({
  origin: [
    'https://phil-dodds.github.io',
    'http://localhost:4201'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// ── JWT validation on every request ──────────────────────────────────────────
app.use(validateJwt);

// ── Tool router ───────────────────────────────────────────────────────────────
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const params       = req.body || {};
  const caller_id    = req.auth.user_id;
  const start        = Date.now();

  const tools = {
    create_division,
    get_division,
    list_divisions,
    update_division,
    assign_user_to_division,
    revoke_division_membership,
    get_user_divisions,
    create_user,
    update_user,
    list_users
  };

  if (!tools[toolName]) {
    return res.status(404).json({
      success: false,
      error: `Tool '${toolName}' not found. Available tools: ${Object.keys(tools).join(', ')}.`
    });
  }

  try {
    const result = await tools[toolName](params, caller_id);
    const duration_ms = Date.now() - start;

    console.log(JSON.stringify({
      tool_name:   toolName,
      user_id:     caller_id,
      division_id: params.division_id || null,
      timestamp:   new Date().toISOString(),
      duration_ms,
      success:     result.success
    }));

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    const duration_ms = Date.now() - start;

    console.error(JSON.stringify({
      tool_name:   toolName,
      user_id:     caller_id,
      timestamp:   new Date().toISOString(),
      duration_ms,
      error:       err.message
    }));

    return res.status(500).json({
      success: false,
      error:   'An unexpected error occurred. The engineering team has been notified.'
    });
  }
});

// ── Health check (no JWT required) ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'division-mcp', version: '1.0.0' });
});

// ── Tool discovery (no JWT required) ─────────────────────────────────────────
app.get('/tools', (req, res) => {
  res.json({
    service: 'division-mcp',
    version: '1.0.0',
    tools: [
      { name: 'create_division',          method: 'POST', path: '/tools/create_division' },
      { name: 'get_division',             method: 'POST', path: '/tools/get_division' },
      { name: 'list_divisions',           method: 'POST', path: '/tools/list_divisions' },
      { name: 'update_division',          method: 'POST', path: '/tools/update_division' },
      { name: 'assign_user_to_division',  method: 'POST', path: '/tools/assign_user_to_division' },
      { name: 'revoke_division_membership', method: 'POST', path: '/tools/revoke_division_membership' },
      { name: 'get_user_divisions',       method: 'POST', path: '/tools/get_user_divisions' },
      { name: 'create_user',              method: 'POST', path: '/tools/create_user' },
      { name: 'update_user',              method: 'POST', path: '/tools/update_user' },
      { name: 'list_users',               method: 'POST', path: '/tools/list_users' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`[division-mcp] v1.0.0 listening on port ${PORT}`);
});
