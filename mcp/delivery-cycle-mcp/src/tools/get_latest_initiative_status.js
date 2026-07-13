// get_latest_initiative_status.js — Contract 32 (WS2)
// Latest status update for an Initiative + per-trio acknowledgment state +
// Needs Review reasons (D-485). Read-only; any authenticated user with access.
// Governing: D-478, D-483, D-485, D-486.

'use strict';

const { supabase } = require('../db');
const { computeNeedsReviewReasons } = require('../lib/needs-review');
const { isWithinRecentCalendarDays, resolveChainRoots } = require('../lib/status-chain');

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

  // Trio display names + author name (D-506: author may be outside the trio).
  const trio = [cycle.assigned_dol_user_id, cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id];
  const lookupIds = [...new Set([...trio, latest?.saved_by].filter(Boolean))];
  const nameById = {};
  if (lookupIds.length) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', lookupIds);
    for (const u of (users || [])) { nameById[u.id] = u.display_name; }
  }

  // D-507: chain context — root timestamp governs age; edit window state for the UI.
  let chain = null;
  if (latest) {
    const rootMap = await resolveChainRoots([latest.id]);
    const root = rootMap.get(latest.id);
    chain = {
      root_saved_at: root?.root_saved_at ?? latest.saved_at,
      is_edited:     !!latest.supersedes_update_id,
      // D-507 editability preconditions the server can assert (caller-specific
      // author-or-trio check happens at save time): root recent + not overdue.
      edit_window_open: !!root && isWithinRecentCalendarDays(root.root_saved_at) && cycle.status_overdue !== true
    };
  }

  // D-506/D-513: acknowledgments render only for NON-trio-authored updates —
  // the only case generating invitations. Trio-authored → empty array.
  const isTrioAuthor = latest ? trio.includes(latest.saved_by) : null;

  // Acks on the head row + anywhere earlier in the chain (D-507: acks are
  // preserved across edits; an ack on an earlier row shows the
  // "acknowledged an earlier version" marker with one-click re-acknowledge).
  const ackByUser = {};        // user_id → acknowledged_at on the HEAD
  const earlierAckByUser = {}; // user_id → acknowledged_at on an EARLIER chain row
  if (latest && isTrioAuthor === false) {
    // Collect all chain row ids (head + ancestors).
    const chainIds = [latest.id];
    let cursor = latest.supersedes_update_id;
    let guard = 0;
    while (cursor && guard++ < 50) {
      chainIds.push(cursor);
      const { data: prev } = await supabase
        .from('initiative_status_updates')
        .select('id, supersedes_update_id')
        .eq('id', cursor)
        .maybeSingle();
      cursor = prev?.supersedes_update_id ?? null;
    }

    const { data: acks } = await supabase
      .from('initiative_status_acknowledgments')
      .select('status_update_id, acknowledged_by, acknowledged_at')
      .in('status_update_id', chainIds);
    for (const a of (acks || [])) {
      if (a.status_update_id === latest.id) {
        ackByUser[a.acknowledged_by] = a.acknowledged_at;
      } else if (!earlierAckByUser[a.acknowledged_by]) {
        earlierAckByUser[a.acknowledged_by] = a.acknowledged_at;
      }
    }
  }

  // Per-trio acknowledgment state (D-513: one chip per trio member; author is
  // non-trio here, so no exclusions apply).
  const acknowledgments = [];
  if (latest && isTrioAuthor === false) {
    for (const [role, field] of TRIO_ROLES) {
      const uid = cycle[field];
      if (!uid) { continue; }
      const onHead = Object.prototype.hasOwnProperty.call(ackByUser, uid);
      acknowledgments.push({
        role,
        user_id:              uid,
        display_name:         nameById[uid] || 'Unknown',
        acknowledged:         onHead,
        acknowledged_at:      ackByUser[uid] || null,
        // D-507: acked an earlier chain version, not the current head.
        acknowledged_earlier: !onHead && Object.prototype.hasOwnProperty.call(earlierAckByUser, uid),
        earlier_acknowledged_at: earlierAckByUser[uid] || null
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
      saved_by_name:  latest ? (nameById[latest.saved_by] || null) : null,
      is_trio_author: isTrioAuthor,   // D-506/D-513: chips render only when false
      chain,                          // D-507: { root_saved_at, is_edited, edit_window_open }
      acknowledgments,
      needs_review_reasons
    }
  };
}

module.exports = { get_latest_initiative_status };
