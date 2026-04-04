// index.js
// Pathways OI Trust — delivery-cycle-mcp v1.0
// Stateless Node.js MCP server. Full Delivery Cycle lifecycle management.
// JWT validation fires on every request before any tool logic (D-93, D-144).
//
// Tool naming: verb_noun
// Response envelope: { success: boolean, data: any, error?: string }
// All errors return the envelope — never throw to HTTP layer.
// Logs: tool_name, user_id, delivery_cycle_id (if applicable), timestamp, duration_ms
// Never log: JWT values, file content, personal data beyond user_id

'use strict';
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { validateJwt } = require('./middleware/jwt');

// ── Tool imports ──────────────────────────────────────────────────────────────
const { create_delivery_workstream }     = require('./tools/create_delivery_workstream');
const { list_delivery_workstreams }      = require('./tools/list_delivery_workstreams');
const { update_workstream_active_status } = require('./tools/update_workstream_active_status');

const { create_delivery_cycle }          = require('./tools/create_delivery_cycle');
const { get_delivery_cycle }             = require('./tools/get_delivery_cycle');
const { list_delivery_cycles }           = require('./tools/list_delivery_cycles');
const { advance_cycle_stage }            = require('./tools/advance_cycle_stage');
const { reverse_cycle_stage }            = require('./tools/reverse_cycle_stage');
const { set_cycle_on_hold }              = require('./tools/set_cycle_on_hold');
const { resume_cycle_from_hold }         = require('./tools/resume_cycle_from_hold');
const { set_outcome_statement }          = require('./tools/set_outcome_statement');

const { submit_gate_for_approval }       = require('./tools/submit_gate_for_approval');
const { record_gate_decision }           = require('./tools/record_gate_decision');

const { set_milestone_target_date }      = require('./tools/set_milestone_target_date');
const { update_milestone_status }        = require('./tools/update_milestone_status');

const { attach_cycle_artifact }          = require('./tools/attach_cycle_artifact');
const { promote_artifact_to_oi_library } = require('./tools/promote_artifact_to_oi_library');

const { get_cycle_event_log }            = require('./tools/get_cycle_event_log');
const { sync_jira_epic }                 = require('./tools/sync_jira_epic');
const { get_delivery_summary }           = require('./tools/get_delivery_summary');

const app  = express();
const PORT = process.env.PORT || 3003;

// ── Tool registry ─────────────────────────────────────────────────────────────
const TOOLS = {
  // Workstream management
  create_delivery_workstream,
  list_delivery_workstreams,
  update_workstream_active_status,

  // Delivery Cycle lifecycle
  create_delivery_cycle,
  get_delivery_cycle,
  list_delivery_cycles,
  advance_cycle_stage,
  reverse_cycle_stage,
  set_cycle_on_hold,
  resume_cycle_from_hold,
  set_outcome_statement,

  // Gate workflow
  submit_gate_for_approval,
  record_gate_decision,

  // Milestone date management
  set_milestone_target_date,
  update_milestone_status,

  // Artifact tracking
  attach_cycle_artifact,
  promote_artifact_to_oi_library,

  // Event log
  get_cycle_event_log,

  // Jira sync
  sync_jira_epic,

  // Dashboard hub summaries (D-171–D-176)
  get_delivery_summary
};

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

  if (!TOOLS[toolName]) {
    return res.status(404).json({
      success: false,
      error: `Tool '${toolName}' not found. Available tools: ${Object.keys(TOOLS).join(', ')}.`
    });
  }

  try {
    const result      = await TOOLS[toolName](params, caller_id);
    const duration_ms = Date.now() - start;

    console.log(JSON.stringify({
      tool_name:         toolName,
      user_id:           caller_id,
      delivery_cycle_id: params.delivery_cycle_id || null,
      timestamp:         new Date().toISOString(),
      duration_ms,
      success:           result.success
    }));

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    const duration_ms = Date.now() - start;

    console.error(JSON.stringify({
      tool_name:         toolName,
      user_id:           caller_id,
      delivery_cycle_id: params.delivery_cycle_id || null,
      timestamp:         new Date().toISOString(),
      duration_ms,
      error:             err.message
    }));

    return res.status(500).json({
      success: false,
      error:   'An unexpected error occurred. The engineering team has been notified.'
    });
  }
});

// ── Health check (no JWT required) ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'delivery-cycle-mcp', version: '1.0.0' });
});

// ── Tool discovery (no JWT required, per D-155 on-demand loading) ─────────────
app.get('/tools', (req, res) => {
  res.json({
    service: 'delivery-cycle-mcp',
    version: '1.0.0',
    tools: Object.keys(TOOLS).map(name => ({
      name,
      method: 'POST',
      path:   `/tools/${name}`
    }))
  });
});

app.listen(PORT, () => {
  console.log(`[delivery-cycle-mcp] v1.0.0 listening on port ${PORT}`);
});
