// index.js
// Pathways OI Trust — document-access-mcp v1.0
// Stateless Node.js MCP server. Human governance and agent knowledge consumption.
// JWT validation fires on every request before any tool logic (D-93, D-144).
//
// Tool naming: verb_noun
// Response envelope: { success: boolean, data: any, error?: string }
// Logs: tool_name, user_id, division_id (if applicable), timestamp, duration_ms
// Never log: JWT values, file content, personal data beyond user_id

'use strict';
require('dotenv').config();

const express           = require('express');
const cors              = require('cors');
const { validateJwt }  = require('./middleware/jwt');

const { search_documents }        = require('./tools/search_documents');
const { query_knowledge }         = require('./tools/query_knowledge');
const { get_document }            = require('./tools/get_document');
const { get_documents_bulk }      = require('./tools/get_documents_bulk');
const { list_documents }          = require('./tools/list_documents');
const { upload_document }         = require('./tools/upload_document');
const { delete_document }         = require('./tools/delete_document');
const { get_document_versions }   = require('./tools/get_document_versions');
const { update_document_metadata } = require('./tools/update_document_metadata');

const app  = express();
const PORT = process.env.PORT || 3002;

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

// Increase limit for base64 file uploads (25MB raw → ~34MB base64)
app.use(express.json({ limit: '40mb' }));

// ── JWT validation on every request ──────────────────────────────────────────
app.use(validateJwt);

// ── Tool router ───────────────────────────────────────────────────────────────
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const params       = req.body || {};
  const caller_id    = req.auth.user_id;
  const start        = Date.now();

  const tools = {
    search_documents,
    query_knowledge,
    get_document,
    get_documents_bulk,
    list_documents,
    upload_document,
    delete_document,
    get_document_versions,
    update_document_metadata
  };

  if (!tools[toolName]) {
    return res.status(404).json({
      success: false,
      error: `Tool '${toolName}' not found. Available tools: ${Object.keys(tools).join(', ')}.`
    });
  }

  try {
    const result      = await tools[toolName](params, caller_id);
    const duration_ms = Date.now() - start;

    // Never log file content or base64 data
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
  res.json({ status: 'ok', service: 'document-access-mcp', version: '1.0.0' });
});

// ── Tool discovery (no JWT required) ─────────────────────────────────────────
app.get('/tools', (req, res) => {
  res.json({
    service: 'document-access-mcp',
    version: '1.0.0',
    tools: [
      { name: 'search_documents',         layer: 'human-governance',  method: 'POST', path: '/tools/search_documents' },
      { name: 'query_knowledge',          layer: 'agent-consumption', method: 'POST', path: '/tools/query_knowledge' },
      { name: 'get_document',             layer: 'human-governance',  method: 'POST', path: '/tools/get_document' },
      { name: 'get_documents_bulk',       layer: 'human-engineering', method: 'POST', path: '/tools/get_documents_bulk' },
      { name: 'list_documents',           layer: 'human-governance',  method: 'POST', path: '/tools/list_documents' },
      { name: 'upload_document',          layer: 'human-governance',  method: 'POST', path: '/tools/upload_document' },
      { name: 'delete_document',          layer: 'human-governance',  method: 'POST', path: '/tools/delete_document' },
      { name: 'get_document_versions',    layer: 'human-governance',  method: 'POST', path: '/tools/get_document_versions' },
      { name: 'update_document_metadata', layer: 'human-governance',  method: 'POST', path: '/tools/update_document_metadata' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`[document-access-mcp] v1.0.0 listening on port ${PORT}`);
});
