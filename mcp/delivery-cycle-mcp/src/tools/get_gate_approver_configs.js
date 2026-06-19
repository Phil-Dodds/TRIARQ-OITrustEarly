// get_gate_approver_configs.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 29 WS3, D-464).
//
// Returns all gate_approver_configs joined to divisions and users, sorted by
// division name then gate sequence order. Powers the Gate Approvers admin grid.
//
// Read access is broad (RLS SELECT TRUE); the admin SCREEN is gated Phil-only
// in Angular. Listing here is not write-sensitive.

'use strict';

const { supabase } = require('../db');

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};
const GATE_SEQUENCE = {
  brief_review:  1,
  go_to_build:   2,
  go_to_deploy:  3,
  go_to_release: 4,
  close_review:  5
};

/**
 * @param {object} _params
 * @param {string} _caller_user_id - from JWT
 */
async function get_gate_approver_configs(_params, _caller_user_id) {
  const { data: configs, error } = await supabase
    .from('gate_approver_configs')
    .select('id, division_id, gate_name, approver_user_id, updated_at, updated_by_user_id');

  if (error) {
    return { success: false, error: `Failed to load gate approver configs: ${error.message}` };
  }
  if (!configs || configs.length === 0) {
    return { success: true, data: [] };
  }

  const divisionIds = [...new Set(configs.map(c => c.division_id).filter(Boolean))];
  const userIds     = [...new Set(
    configs.flatMap(c => [c.approver_user_id, c.updated_by_user_id]).filter(Boolean)
  )];

  const [{ data: divisions }, { data: users }] = await Promise.all([
    divisionIds.length
      ? supabase.from('divisions')
          .select('id, division_name, display_name_short')
          .in('id', divisionIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from('users')
          .select('id, display_name')
          .in('id', userIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] })
  ]);

  const divisionMap = {};
  const userMap     = {};
  (divisions || []).forEach(d => { divisionMap[d.id] = d; });
  (users     || []).forEach(u => { userMap[u.id] = u.display_name; });

  const items = configs.map(c => {
    const d = divisionMap[c.division_id] || {};
    return {
      id:                       c.id,
      division_id:              c.division_id,
      division_name:            d.division_name || '',
      division_display_name_short: d.display_name_short || d.division_name || '',
      gate_name:                c.gate_name,
      gate_name_display:        GATE_NAME_DISPLAY[c.gate_name] || c.gate_name,
      approver_user_id:         c.approver_user_id,
      approver_display_name:    userMap[c.approver_user_id] || 'Unknown',
      updated_at:               c.updated_at,
      updated_by_display_name:  c.updated_by_user_id ? (userMap[c.updated_by_user_id] || null) : null
    };
  });

  items.sort((a, b) => {
    const dn = (a.division_name || '').localeCompare(b.division_name || '');
    if (dn !== 0) { return dn; }
    return (GATE_SEQUENCE[a.gate_name] || 99) - (GATE_SEQUENCE[b.gate_name] || 99);
  });

  return { success: true, data: items };
}

module.exports = { get_gate_approver_configs };
