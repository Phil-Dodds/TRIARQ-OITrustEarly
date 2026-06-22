// index.js
// Pathways OI Trust — initiative-public-mcp v1.0 (Contract 31, D-473).
//
// Public, READ-ONLY MCP server exposing Initiative data to executive Claude
// Desktop clients via mcp-remote. Real MCP protocol over Streamable HTTP at
// POST /mcp (the existing division/delivery/document servers are internal REST
// for the Angular app; this one must speak MCP for mcp-remote to bridge it).
//
// AUTH (explicit Arch-5 exception — Pre-Plan Instruction 4): NO Supabase JWT.
// Every /mcp request must carry `Authorization: Bearer oitrust_…`, validated
// against the api_keys table (bcrypt) before any tool runs. Service-role key is
// used internally only and never exposed.
//
// CC-31 decision: built as a real MCP server (Phil's call this contract). The
// spec said "match the existing pattern exactly", but the existing servers are
// plain REST and cannot be driven by mcp-remote. @modelcontextprotocol/sdk is
// added to deps for this reason — recorded as a CC-decision.

'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { z }   = require('zod');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

const { supabase } = require('./db');
const { validateApiKey } = require('./helpers/api-key-auth');
const { listInitiatives } = require('./tools/list_initiatives');
const { getInitiative } = require('./tools/get_initiative');
const { getInitiativeHistory } = require('./tools/get_initiative_history');

const PORT = process.env.PORT || process.env.INITIATIVE_MCP_PORT || 3004;

// JSON-RPC tool result helpers.
const ok    = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
const notFound = (msg) => ({ content: [{ type: 'text', text: JSON.stringify({ error: msg }) }], isError: true });

/**
 * Build a fresh McpServer bound to the authenticated key's scope. One server +
 * stateless transport per request (Streamable HTTP stateless mode).
 */
function buildMcpServer(scope) {
  const server = new McpServer({ name: 'oi-trust-initiative-public-mcp', version: '1.0.0' });

  server.registerTool(
    'list_initiatives',
    {
      title: 'List Initiatives',
      description: 'List OI Trust Initiatives with optional filters. Phase 1 returns all Divisions.',
      inputSchema: {
        division_name:   z.string().optional(),
        workstream_name: z.string().optional(),
        lifecycle_stage: z.union([z.string(), z.array(z.string())]).optional(),
        tier:            z.string().optional(),
        gate_status:     z.string().optional(),
        next_gate:       z.string().optional()
      }
    },
    async (args) => ok(await listInitiatives(supabase, args || {}, scope))
  );

  server.registerTool(
    'get_initiative',
    {
      title: 'Get Initiative',
      description: 'Full record for a single Initiative: milestones, gates, and artifacts.',
      inputSchema: { initiative_id: z.string() }
    },
    async (args) => {
      const result = await getInitiative(supabase, args?.initiative_id, scope);
      return result ? ok(result) : notFound('Initiative not found.');
    }
  );

  server.registerTool(
    'get_initiative_history',
    {
      title: 'Get Initiative History',
      description: 'Event log for a single Initiative, newest first.',
      inputSchema: { initiative_id: z.string() }
    },
    async (args) => {
      const result = await getInitiativeHistory(supabase, args?.initiative_id);
      return result ? ok(result) : notFound('Initiative not found.');
    }
  );

  return server;
}

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id'],
  exposedHeaders: ['Mcp-Session-Id']
}));
app.use(express.json({ limit: '1mb' }));

// Health check (no auth).
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'initiative-public-mcp', version: '1.0.0' });
});

// ── MCP endpoint — API-key authenticated, stateless Streamable HTTP ──────────
app.post('/mcp', async (req, res) => {
  const auth = await validateApiKey(supabase, req.headers['authorization']);
  if (!auth.valid) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: auth.error || 'Unauthorized' },
      id: null
    });
  }

  try {
    const server = buildMcpServer({ scope_type: auth.scope_type, division_ids: auth.division_ids });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[initiative-public-mcp] request error:', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null
      });
    }
  }
});

// Stateless mode: no server-initiated SSE stream or session teardown.
const methodNotAllowed = (_req, res) => res.status(405).json({
  jsonrpc: '2.0',
  error: { code: -32000, message: 'Method not allowed. Use POST /mcp.' },
  id: null
});
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);

// Don't listen when required by tests.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[initiative-public-mcp] v1.0.0 listening on port ${PORT}`);
  });
}

module.exports = { app, buildMcpServer };
