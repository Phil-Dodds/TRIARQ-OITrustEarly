// index.js
// Pathways OI Trust — team-meetings-mcp v1.0 / D-490
// Admin-only MCP server for Team Meetings feature.
// JWT validation fires on every request before any tool logic (D-93, D-144).
//
// Tool naming: verb_noun
// Response envelope: { success: boolean, data: any, error?: string }
// All errors return the envelope — never throw to HTTP layer.
// Logs: tool_name, user_id, timestamp, duration_ms
// Never log: JWT values, file content, personal data beyond user_id

'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { validateJwt } = require('./middleware/jwt');

const { create_team_meeting }               = require('./tools/create_team_meeting');
const { get_team_meeting }                  = require('./tools/get_team_meeting');
const { list_team_meetings }                = require('./tools/list_team_meetings');
const { add_meeting_bullet }                = require('./tools/add_meeting_bullet');
const { remove_meeting_bullet }             = require('./tools/remove_meeting_bullet');
const { update_meeting_notes }              = require('./tools/update_meeting_notes');
const { carry_forward_bullet }              = require('./tools/carry_forward_bullet');
const { update_meeting_section_collapsed }  = require('./tools/update_meeting_section_collapsed');
const { list_dcs_users_with_initiatives }   = require('./tools/list_dcs_users_with_initiatives');
const { update_meeting }                    = require('./tools/update_meeting');
const { update_bullet_note }               = require('./tools/update_bullet_note');
const { delete_team_meeting }              = require('./tools/delete_team_meeting');

const app  = express();
const PORT = process.env.PORT || 3005;

const TOOLS = {
  create_team_meeting,
  get_team_meeting,
  list_team_meetings,
  add_meeting_bullet,
  remove_meeting_bullet,
  update_meeting_notes,
  carry_forward_bullet,
  update_meeting_section_collapsed,
  list_dcs_users_with_initiatives,
  update_meeting,
  update_bullet_note,
  delete_team_meeting
};

app.use(cors());
app.use(express.json());
app.use(validateJwt);

app.get('/health', (_req, res) => res.json({ status: 'ok', server: 'team-meetings-mcp' }));
app.get('/tools',  (_req, res) => res.json({ tools: Object.keys(TOOLS) }));

app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const tool = TOOLS[toolName];

  if (!tool) {
    return res.status(404).json({ success: false, error: `Tool '${toolName}' not found.` });
  }

  const start = Date.now();
  try {
    const result = await tool(req.body || {}, req.auth.user_id);
    const duration_ms = Date.now() - start;
    console.log(JSON.stringify({
      tool_name:  toolName,
      user_id:    req.auth.user_id,
      success:    result.success,
      duration_ms
    }));
    return res.json(result);
  } catch (err) {
    const duration_ms = Date.now() - start;
    console.error(JSON.stringify({
      tool_name:  toolName,
      user_id:    req.auth.user_id,
      error:      err.message,
      duration_ms
    }));
    return res.json({ success: false, error: 'An unexpected server error occurred.' });
  }
});

app.listen(PORT, () => {
  console.log(`[team-meetings-mcp] Listening on port ${PORT}`);
});
