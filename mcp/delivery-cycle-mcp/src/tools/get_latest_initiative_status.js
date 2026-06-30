// get_latest_initiative_status.js — Contract 32 (WS2)
// Latest status update for an Initiative + per-trio acknowledgment state +
// Needs Review reasons (D-485). Read-only; any authenticated user with access.
// Governing: D-478, D-483, D-485, D-486.

'use strict';

const { supabase } = require('../db');
const { computeNeedsReviewReasons } = require('../lib/needs-review');

const TRIO_ROLES = [
  ['DOL', 'assigned_dol_user_id'],
  ['DCS', 'assigned_dcs_user_id'],
  ['EPO', 'assigned_epo_user_id']
];

/**
 * @param {object} params
 * @param {string} params.initiative_id
 * @param {string} caller_user_id - from JWT
 */
async function get_latest_initiative_status(params, caller_user_id) {
  const { initiative_id } = params;
  if (!initiative_id) {
    return { success: false, error: 'initiative_id is required.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, division_id, status_overdue, latest_status_update_id, assigned_dol_user_id, assigned_dcs_user_id, assigned_epo_user_id')
    .eq('delivery_cycle_id', initiative_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // Latest immutable update (may be null if none saved yet).
  let latest = null;
  if (cycle.latest_status_update_id) {
    const { data: row } = await supabase
      .from('initiative_status_updates')
      .select('*')
      .eq('id', cycle.latest_status_update_id)
      .single();
    latest = row || null;
  }

  // Trio display names.
  const trioIds = [cycle.assigned_dol_user_id, cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id]
    .filter(Boolean);
  const nameById = {};
  if (trioIds.length) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', trioIds);
    for (const u of (users || [])) { nameById[u.id] = u.display_name; }
  }

  // Acknowledgments on the latest update.
  const ackByUser = {};
  if (latest) {
    const { data: acks } = await supabase
      .from('initiative_status_acknowledgments')
      .select('acknowledged_by, acknowledged_at')
      .eq('status_update_id', latest.id);
    for (const a of (acks || [])) { ackByUser[a.acknowledged_by] = a.acknowledged_at; }
  }

  // Per-trio acknowledgment state (save user excluded — they don't acknowledge).
  const acknowledgments = [];
  if (latest) {
    for (const [role, field] of TRIO_ROLES) {
      const uid = cycle[field];
      if (!uid || uid === latest.saved_by) { continue; }
      acknowledgments.push({
        role,
        user_id:         uid,
        display_name:    nameById[uid] || 'Unknown',
        acknowledged:    Object.prototype.hasOwnProperty.call(ackByUser, uid),
        acknowledged_at: ackByUser[uid] || null
      });
    }
  }

  // Needs Review reasons (D-485) — needs all gate statuses for at-risk eval.
  const { data: allMilestones } = await supabase
    .from('cycle_milestone_dates')
    .select('gate_name, date_status')
    .eq('delivery_cycle_id', initiative_id)
    .is('deleted_at', null);

  const needs_review_reasons = await computeNeedsReviewReasons(
    supabase, cycle, latest, allMilestones || []
  );

  return {
    success: true,
    data: {
      initiative_id,
      latest,
      saved_by_name: latest ? (nameById[latest.saved_by] || null) : null,
      acknowledgments,
      needs_review_reasons
    }
  };
}

module.exports = { get_latest_initiative_status };
