// index.js
// Pathways OI Trust — delivery-cycle-mcp v1.0
// Stateless Node.js MCP server. Full Initiative lifecycle management (D-392).
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
// Contract 17 §9: unified workstream edit tool. Handles workstream_name,
// display_name_short, home_division_id, workstream_lead_user_id, active_status.
const { update_delivery_workstream }     = require('./tools/update_delivery_workstream');

const { create_delivery_cycle }          = require('./tools/create_delivery_cycle');
const { update_delivery_cycle }          = require('./tools/update_delivery_cycle');
const { get_delivery_cycle }             = require('./tools/get_delivery_cycle');
const { list_delivery_cycles }           = require('./tools/list_delivery_cycles');
const { advance_cycle_stage }            = require('./tools/advance_cycle_stage');
const { reverse_cycle_stage }            = require('./tools/reverse_cycle_stage');
const { set_cycle_on_hold }              = require('./tools/set_cycle_on_hold');
const { resume_cycle_from_hold }         = require('./tools/resume_cycle_from_hold');
// Bugfix 2026-06-15: cancel + uncancel MCP tools previously missing from the
// server (Angular cancelCycle() referenced non-existent endpoints).
const { cancel_delivery_cycle }          = require('./tools/cancel_delivery_cycle');
const { uncancel_delivery_cycle }        = require('./tools/uncancel_delivery_cycle');
const { assign_roles_to_cycle }          = require('./tools/assign_roles_to_cycle');
const { set_outcome_statement }          = require('./tools/set_outcome_statement');

const { submit_gate_for_approval }       = require('./tools/submit_gate_for_approval');
const { confirm_gate_skip }              = require('./tools/confirm_gate_skip');
const { record_gate_decision }           = require('./tools/record_gate_decision');
const { withdraw_gate_submission }       = require('./tools/withdraw_gate_submission');
const { list_pending_approvals }         = require('./tools/list_pending_approvals');
// Contract 29 (D-459–D-465): gate consultation + approver configuration.
const { record_consultation_response }   = require('./tools/record_consultation_response');
const { list_gate_consultations }        = require('./tools/list_gate_consultations');
const { set_gate_approver }              = require('./tools/set_gate_approver');
const { get_gate_approver_configs }      = require('./tools/get_gate_approver_configs');
const { delete_gate_approver_config }    = require('./tools/delete_gate_approver_config');
// Contract 24 — approved gate queries (D-430, D-431).
const { list_approved_gates }            = require('./tools/list_approved_gates');
const { list_my_completed_gates }        = require('./tools/list_my_completed_gates');
// Contract 24 — artifact type management (D-437).
const { list_artifact_types }            = require('./tools/list_artifact_types');
const { create_artifact_type }           = require('./tools/create_artifact_type');
const { update_artifact_type }           = require('./tools/update_artifact_type');

const { set_milestone_target_date }      = require('./tools/set_milestone_target_date');
const { set_milestone_actual_date }      = require('./tools/set_milestone_actual_date');
const { update_milestone_status }        = require('./tools/update_milestone_status');

const { attach_cycle_artifact }          = require('./tools/attach_cycle_artifact');
const { update_cycle_artifact }          = require('./tools/update_cycle_artifact');
const { detach_cycle_artifact }          = require('./tools/detach_cycle_artifact');
const { promote_artifact_to_oi_library } = require('./tools/promote_artifact_to_oi_library');

const { get_cycle_event_log }            = require('./tools/get_cycle_event_log');
const { link_jira_epic }                 = require('./tools/link_jira_epic');
const { sync_jira_epic }                 = require('./tools/sync_jira_epic');
const { get_delivery_summary }           = require('./tools/get_delivery_summary');

// Contract 23 (D-428, D-429): cross-Initiative activity feed.
const { list_initiative_activity }       = require('./tools/list_initiative_activity');

// Contract 20 (D-400, D-401): EPO WIP limit model.
const { get_epo_wip_limits }             = require('./tools/get_epo_wip_limits');
const { update_epo_wip_limits }          = require('./tools/update_epo_wip_limits');

// Contract 27 (D-444): Deploy Roadmap Baselines registry.
const { list_roadmap_freeze_dates }      = require('./tools/list_roadmap_freeze_dates');
const { create_roadmap_freeze_date }     = require('./tools/create_roadmap_freeze_date');
const { update_roadmap_freeze_date }     = require('./tools/update_roadmap_freeze_date');
const { delete_roadmap_freeze_date }     = require('./tools/delete_roadmap_freeze_date');

const app  = express();
const PORT = process.env.PORT || 3003;

// ── Tool registry ─────────────────────────────────────────────────────────────
const TOOLS = {
  // Workstream management
  create_delivery_workstream,
  list_delivery_workstreams,
  update_workstream_active_status,
  update_delivery_workstream,

  // Delivery Cycle lifecycle
  create_delivery_cycle,
  update_delivery_cycle,
  get_delivery_cycle,
  list_delivery_cycles,
  advance_cycle_stage,
  reverse_cycle_stage,
  set_cycle_on_hold,
  resume_cycle_from_hold,
  cancel_delivery_cycle,
  uncancel_delivery_cycle,
  assign_roles_to_cycle,
  set_outcome_statement,

  // Gate workflow (D-345)
  submit_gate_for_approval,
  // Contract 28 — gate skip flow (D-447, D-448, D-449, D-450).
  confirm_gate_skip,
  record_gate_decision,
  withdraw_gate_submission,
  list_pending_approvals,
  // Contract 29 — gate consultation + approver configuration (D-459–D-465)
  record_consultation_response,
  list_gate_consultations,
  set_gate_approver,
  get_gate_approver_configs,
  delete_gate_approver_config,
  // Contract 24 — approved gate analytical views (D-430, D-431).
  list_approved_gates,
  list_my_completed_gates,
  // Contract 24 — artifact type management + warnings (D-437).
  list_artifact_types,
  create_artifact_type,
  update_artifact_type,

  // Milestone date management
  set_milestone_target_date,
  set_milestone_actual_date,
  update_milestone_status,

  // Artifact tracking
  attach_cycle_artifact,
  update_cycle_artifact,
  detach_cycle_artifact,
  promote_artifact_to_oi_library,

  // Event log
  get_cycle_event_log,

  // Contract 23 — cross-Initiative activity feed (D-428, D-429)
  list_initiative_activity,

  // Jira link + sync
  link_jira_epic,
  sync_jira_epic,

  // Dashboard hub summaries (D-171–D-176)
  get_delivery_summary,

  // Contract 20 — EPO WIP limit model (D-400, D-401)
  get_epo_wip_limits,
  update_epo_wip_limits,

  // Contract 27 — Deploy Roadmap Baselines registry (D-444)
  list_roadmap_freeze_dates,
  create_roadmap_freeze_date,
  update_roadmap_freeze_date,
  delete_roadmap_freeze_date
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
