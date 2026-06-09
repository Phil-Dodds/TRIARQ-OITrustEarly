// list_divisions.js
// Lists Divisions. Defaults to root Trusts (division_level = 0) if no parent specified.
//
// Contract 21 (D-413, S-032):
//   - `active_status` is included in the response so admin grids can render
//     active/inactive pills and amber warning bands.
//   - When `with_member_counts: true`, each row is enriched with `member_count` —
//     the number of currently active rows in division_memberships for that
//     division_id (revoked_at IS NULL, deleted_at IS NULL).
//   - When `include_inactive: false` (default), inactive Divisions are
//     excluded — this is the picker default per S-032. Admin views pass
//     `include_inactive: true` to see all rows.

'use strict';

const { supabase } = require('../db');

const DIVISION_SELECT =
  'id, division_name, display_name_short, division_level, division_type_label, ' +
  'owner_user_id, parent_division_id, active_status, created_at, updated_at';

/**
 * @param {object} params
 * @param {string}  [params.parent_division_id] - if omitted and all_levels not set, returns root Trusts
 * @param {boolean} [params.all_levels]          - when true, returns all divisions across all levels
 * @param {boolean} [params.include_inactive=false] - when false, excludes inactive Divisions (picker default per S-032)
 * @param {boolean} [params.with_member_counts=false] - when true, enriches each row with member_count
 * @param {string} caller_user_id
 */
async function list_divisions(params, caller_user_id) {
  const {
    parent_division_id,
    all_levels,
    include_inactive = false,
    with_member_counts = false
  } = params;

  let query = supabase
    .from('divisions')
    .select(DIVISION_SELECT)
    .is('deleted_at', null)
    .order('division_level')
    .order('division_name');

  if (all_levels) {
    // Return all divisions regardless of hierarchy level — used by tree grid and create forms
  } else if (parent_division_id) {
    query = query.eq('parent_division_id', parent_division_id);
  } else {
    // Root Trusts have no parent
    query = query.is('parent_division_id', null);
  }

  if (!include_inactive) {
    query = query.eq('active_status', true);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: `Failed to list Divisions: ${error.message}` };
  }

  const divisions = data || [];

  if (!with_member_counts || divisions.length === 0) {
    return { success: true, data: divisions };
  }

  // Member-count enrichment — one batch query joining division_memberships.
  const ids = divisions.map(d => d.id);
  const { data: memberships, error: memErr } = await supabase
    .from('division_memberships')
    .select('division_id')
    .in('division_id', ids)
    .is('revoked_at', null)
    .is('deleted_at', null);

  if (memErr) {
    // Non-fatal — return divisions with member_count = 0 rather than failing the list.
    return { success: true, data: divisions.map(d => ({ ...d, member_count: 0 })) };
  }

  const countByDivision = new Map();
  for (const row of memberships || []) {
    countByDivision.set(row.division_id, (countByDivision.get(row.division_id) || 0) + 1);
  }

  const enriched = divisions.map(d => ({
    ...d,
    member_count: countByDivision.get(d.id) || 0
  }));

  return { success: true, data: enriched };
}

module.exports = { list_divisions };
