// list_gate_consultations.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 29 WS2, D-461/D-462).
//
// Returns all gate_consultations rows for a gate, joined to users for display
// names. Powers the gate sub-panel Consulted section. Sorted auto-approved
// first (the submitter), then by created_at ascending.
//
// Source: D-461, D-462, spec Contract 29 WS2.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} params.gate_record_id
 * @param {string} caller_user_id - from JWT (unused beyond auth middleware)
 */
async function list_gate_consultations(params, _caller_user_id) {
  const { gate_record_id } = params;

  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }

  const { data: rows, error } = await supabase
    .from('gate_consultations')
    .select('id, consulted_user_id, response, notes, responded_at, is_auto_approved, created_at')
    .eq('gate_record_id', gate_record_id);

  if (error) {
    return { success: false, error: `Failed to list consultations: ${error.message}` };
  }
  if (!rows || rows.length === 0) {
    return { success: true, data: [] };
  }

  // Resolve display names.
  const userIds = [...new Set(rows.map(r => r.consulted_user_id).filter(Boolean))];
  const nameById = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds)
      .is('deleted_at', null);
    (users || []).forEach(u => { nameById[u.id] = u.display_name; });
  }

  const items = rows
    .map(r => ({
      id:                r.id,
      consulted_user_id: r.consulted_user_id,
      display_name:      nameById[r.consulted_user_id] ?? 'Unknown',
      response:          r.response,
      notes:             r.notes ?? null,
      responded_at:      r.responded_at ?? null,
      is_auto_approved:  r.is_auto_approved === true,
      created_at:        r.created_at
    }))
    // Auto-approved (submitter) first, then created_at ascending.
    .sort((a, b) => {
      if (a.is_auto_approved !== b.is_auto_approved) {
        return a.is_auto_approved ? -1 : 1;
      }
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return ta - tb;
    });

  return { success: true, data: items };
}

module.exports = { list_gate_consultations };
