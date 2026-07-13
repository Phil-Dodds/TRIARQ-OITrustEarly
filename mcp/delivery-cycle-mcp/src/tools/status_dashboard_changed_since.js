// status_dashboard_changed_since.js — Contract 36 (D-512)
// Lightweight change signal for the Initiative Status Dashboard's 10s poll
// (D-499 polling collaboration pattern / CC-021 mechanics). Returns a boolean:
// has any status update OR acknowledgment been created since `since`, scoped
// to the caller-visible initiatives (optionally narrowed by division_ids)?
// Read-only; JWT validated by middleware first (Arch-5).

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string[]} [params.division_ids] - optional narrowing filter
 * @param {string}   [params.since]        - ISO timestamp; omitted → changed=true
 * @param {string} caller_user_id - from JWT
 */
async function status_dashboard_changed_since(params, caller_user_id) {
  const since = params?.since ?? null;
  const now = new Date().toISOString();
  if (!since) {
    return { success: true, data: { changed: true, checked_at: now } };
  }

  // ── Caller-visible divisions (mirror the dashboard's access model) ─────────
  const { data: caller } = await supabase
    .from('users').select('is_admin').eq('id', caller_user_id).is('deleted_at', null).single();
  const isPrivileged = caller?.is_admin === true;

  let accessibleIds = null;
  if (!isPrivileged) {
    const { data: memberships } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .is('revoked_at', null)
      .is('deleted_at', null);
    accessibleIds = [...new Set((memberships || []).map(m => m.division_id))];
    if (accessibleIds.length === 0) {
      return { success: true, data: { changed: false, checked_at: now } };
    }
  }

  let scopeIds = null;
  const requested = Array.isArray(params?.division_ids) ? params.division_ids.filter(Boolean) : null;
  if (requested && requested.length) {
    scopeIds = accessibleIds ? requested.filter(id => accessibleIds.includes(id)) : requested;
    if (scopeIds.length === 0) {
      return { success: true, data: { changed: false, checked_at: now } };
    }
  } else {
    scopeIds = accessibleIds; // null for admin = all
  }

  // Visible initiative ids (bounded — Build C scale).
  let cycleQuery = supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .is('deleted_at', null)
    .not('current_lifecycle_stage', 'in', '(COMPLETE,CANCELLED)');
  if (scopeIds) { cycleQuery = cycleQuery.in('division_id', scopeIds); }
  const { data: cycles, error: cyclesErr } = await cycleQuery;
  if (cyclesErr) { return { success: false, error: cyclesErr.message }; }
  const cycleIds = (cycles || []).map(c => c.delivery_cycle_id);
  if (!cycleIds.length) {
    return { success: true, data: { changed: false, checked_at: now } };
  }

  // Any status update since? (head-count query, no payload)
  const { count: updCount, error: updErr } = await supabase
    .from('initiative_status_updates')
    .select('id', { count: 'exact', head: true })
    .in('initiative_id', cycleIds)
    .gt('saved_at', since);
  if (updErr) { return { success: false, error: updErr.message }; }
  if ((updCount ?? 0) > 0) {
    return { success: true, data: { changed: true, checked_at: now } };
  }

  // Any acknowledgment since? Acks reference update rows — scope via the
  // updates belonging to visible initiatives.
  const { data: updIdsRows } = await supabase
    .from('initiative_status_updates')
    .select('id')
    .in('initiative_id', cycleIds);
  const updIds = (updIdsRows || []).map(u => u.id);
  if (updIds.length) {
    const { count: ackCount, error: ackErr } = await supabase
      .from('initiative_status_acknowledgments')
      .select('id', { count: 'exact', head: true })
      .in('status_update_id', updIds)
      .gt('acknowledged_at', since);
    if (ackErr) { return { success: false, error: ackErr.message }; }
    if ((ackCount ?? 0) > 0) {
      return { success: true, data: { changed: true, checked_at: now } };
    }
  }

  return { success: true, data: { changed: false, checked_at: now } };
}

module.exports = { status_dashboard_changed_since };
