// list_users.js
// Lists users. If division_id provided, returns users with access to that Division.
// If no division_id, returns all active users (System Admin view).
//
// Contract 19 (D-395 — mapped to division_memberships per CC-19-02): the no-division-id
// shape now includes a `division_names` array per user — the names of every Division
// the user is a member of via division_memberships (active rows only). Powers the
// Admin Users row display and the Division Memberships chip set in the edit panel.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string} [params.division_id]
 * @param {string} caller_user_id
 */
async function list_users(params, caller_user_id) {
  const { division_id } = params;

  if (division_id) {
    // Return users with active membership in this Division
    // B-27 fix: specify explicit FK path to resolve Supabase relationship ambiguity.
    // Error was: "Could not embed because more than one relationship was found for
    // 'division_memberships' and 'users'". Source: Contract 9.
    const { data, error } = await supabase
      .from('division_memberships')
      .select(`
        assigned_at,
        users!division_memberships_user_id_fkey (
          id,
          email,
          display_name,
          is_admin, is_dcs, is_epo, is_dol, is_ce, is_super_admin,
          is_active,
          allow_both_admin_and_functional_roles
        )
      `)
      .eq('division_id', division_id)
      .is('revoked_at', null)
      .is('deleted_at', null);

    if (error) {
      return { success: false, error: `Failed to list Division users: ${error.message}` };
    }

    const users = (data || [])
      .filter(m => m.users)
      .map(m => ({ ...m.users, assigned_at: m.assigned_at }));

    return { success: true, data: users };
  }

  // No division_id — return all non-deleted users, enriched with active Division memberships.
  // D-422: last_login_at surfaced for User Management grid Last Login column +
  // User View panel Login Activity zone.
  const { data: users, error } = await supabase
    .from('users')
    // Contract 45 (D-638): manager_user_id ships on the profile call so the
    // User View panel can display the reporting line read-only, and so the
    // "My team" filter can resolve direct reports without a second round trip.
    .select('id, email, display_name, is_admin, is_dcs, is_epo, is_dol, is_ce, is_super_admin, is_active, allow_both_admin_and_functional_roles, created_at, last_login_at, manager_user_id')
    .is('deleted_at', null)
    .order('display_name');

  if (error) {
    return { success: false, error: `Failed to list users: ${error.message}` };
  }
  if (!users || users.length === 0) {
    return { success: true, data: [] };
  }

  // Contract 19 (D-395): enrich each user with their active Division memberships.
  //   One batch query — joins division_memberships to divisions to get names.
  //   revoked_at IS NULL = membership active; deleted_at NULL on both sides.
  const userIds = users.map(u => u.id);
  const { data: memberships, error: memErr } = await supabase
    .from('division_memberships')
    .select('user_id, divisions(id, division_name)')
    .in('user_id', userIds)
    .is('revoked_at', null)
    .is('deleted_at', null);

  // Contract 43 (D-613): derive Division ownership rather than storing it.
  //   `owns_division` is a DERIVED field, never a column. A stored
  //   is_division_leader flag would duplicate a fact the divisions table
  //   already owns and would drift the moment division ownership changed —
  //   silently costing someone access to their own queue. One batch query over
  //   owner_user_id answers it for every user at once.
  //   This is the fold-in point for the All Pending Gates sidebar entry: the
  //   profile call the app already makes now carries the answer.
  const { data: ownedDivisions } = await supabase
    .from('divisions')
    .select('owner_user_id')
    .not('owner_user_id', 'is', null)
    .is('deleted_at', null);
  const ownerUserIds = new Set((ownedDivisions ?? []).map(d => d.owner_user_id));

  // Contract 45 (D-638): resolve each manager's display name from the rows we
  // already have. Managers are users, and this call returns every user, so a
  // second query would be asking the database something it just told us.
  const nameById = new Map(users.map(u => [u.id, u.display_name]));

  if (memErr) {
    // Membership enrichment is non-fatal — return users without the array.
    return {
      success: true,
      data: users.map(u => ({
        ...u,
        division_names:       [],
        owns_division:        ownerUserIds.has(u.id),
        manager_display_name: u.manager_user_id ? (nameById.get(u.manager_user_id) ?? null) : null
      }))
    };
  }

  // Group membership names by user_id.
  const namesByUser = new Map();
  for (const row of memberships ?? []) {
    const divisionName = row.divisions?.division_name;
    if (!divisionName) { continue; }
    const list = namesByUser.get(row.user_id) ?? [];
    list.push(divisionName);
    namesByUser.set(row.user_id, list);
  }

  // Contract 21 (D-411): pre-compute the Division summary so the grid renders
  // a single string per row without client-side counting logic.
  //   0 divisions       → "No Division"
  //   1 or 2 divisions  → division names, comma-separated
  //   3 or more         → "N Divisions"
  const enriched = users.map(u => {
    const names = (namesByUser.get(u.id) ?? []).sort();
    const count = names.length;
    let summary;
    if (count === 0) {
      summary = 'No Division';
    } else if (count <= 2) {
      summary = names.join(', ');
    } else {
      summary = `${count} Divisions`;
    }
    return {
      ...u,
      division_names:   names,
      division_count:   count,
      division_summary: summary,
      // Contract 43 (D-613): derived, not stored. See the note above.
      owns_division:    ownerUserIds.has(u.id),
      // Contract 45 (D-638): read-only reporting line for the User View panel.
      manager_display_name: u.manager_user_id ? (nameById.get(u.manager_user_id) ?? null) : null
    };
  });

  return { success: true, data: enriched };
}

module.exports = { list_users };
