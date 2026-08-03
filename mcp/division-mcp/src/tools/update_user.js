// update_user.js
// Updates mutable user fields. Admin-only.
// allow_both_admin_and_functional_roles can only be set to true by a super-admin (D-139, CC-19-06).
//
// Phase 2 (Contract 19 follow-up, migration 034): system_role removed. Role updates go
// through the boolean flags only. is_super_admin is intentionally NOT mutable here —
// bootstrap via direct DB assignment.

'use strict';

const { supabase } = require('../db');

// Boolean role flags accepted as updates. is_super_admin is excluded by design.
const ROLE_FLAGS = ['is_admin', 'is_dcs', 'is_epo', 'is_dol', 'is_ce'];
const MUTABLE_FIELDS = [
  'display_name', 'is_active', 'allow_both_admin_and_functional_roles',
  // Contract 45 (D-638): the in-line manager relation. Admin/Phil only, which
  // the existing is_admin gate below already enforces. Set to null to clear.
  'manager_user_id',
  ...ROLE_FLAGS
];

// D-638: depth guard on the reporting-chain walk. Matches the divisions walk in
// delivery-cycle-mcp's isLeadershipForCycle. A real org is nowhere near this
// deep; the bound exists so a pre-existing loop in the data cannot hang the
// request while we are checking for loops.
const MAX_MANAGER_CHAIN_DEPTH = 50;

/**
 * D-638 — application-layer reporting-loop prevention.
 *
 * A self-referencing FK does not stop A→B→A: Postgres is perfectly happy with
 * a cycle, and the resulting chain walk never terminates. So the check has to
 * live here, on write.
 *
 * Walks upward from the PROPOSED manager. If the user being edited appears
 * anywhere in that chain, the assignment would close a loop and is rejected.
 *
 * @param {string} user_id            the user being edited
 * @param {string} proposedManagerId  their proposed manager
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function wouldCloseReportingLoop(user_id, proposedManagerId) {
  if (proposedManagerId === user_id) {
    return { ok: false, error: 'A user cannot be their own manager.' };
  }

  let currentId = proposedManagerId;
  let depth = 0;

  while (currentId && depth < MAX_MANAGER_CHAIN_DEPTH) {
    const { data: row } = await supabase
      .from('users')
      .select('id, manager_user_id, display_name')
      .eq('id', currentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!row) { break; }                       // chain ends at a deleted/absent user
    if (row.manager_user_id === user_id) {
      return {
        ok: false,
        error: `That assignment would create a reporting loop — ${row.display_name} already reports to this user, `
             + 'directly or through their chain. Change the other reporting line first.'
      };
    }
    currentId = row.manager_user_id;
    depth += 1;
  }

  if (depth >= MAX_MANAGER_CHAIN_DEPTH) {
    return {
      ok: false,
      error: 'The reporting chain above that manager is unexpectedly deep and may already contain a loop. '
           + 'Clear the manager on one of the users in that chain, then try again.'
    };
  }

  return { ok: true };
}

/**
 * @param {object} params
 * @param {string} params.user_id
 * @param {object} params.updates
 * @param {string} caller_user_id
 */
async function update_user(params, caller_user_id) {
  const { user_id, updates } = params;

  if (!user_id) return { success: false, error: 'user_id is required.' };
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return { success: false, error: 'updates object is required and must not be empty.' };
  }

  const immutableAttempts = Object.keys(updates).filter(k => !MUTABLE_FIELDS.includes(k));
  if (immutableAttempts.length > 0) {
    return {
      success: false,
      error: `The following fields cannot be updated: ${immutableAttempts.join(', ')}.`
    };
  }

  // Verify caller — Contract 19 (D-394): boolean predicate.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin, is_super_admin, is_active')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Updating users requires Admin role. Your current role does not have this permission.'
    };
  }

  // D-139: allow_both_admin_and_functional_roles is a HITRUST separation-of-duties exception.
  // CC-19-06 option B: super-admin gate replaces the legacy 'phil'-only check.
  // is_super_admin is bootstrapped by direct DB assignment, not via this MCP, so the override
  // cannot be self-granted or escalated through Admin Users.
  if (updates.allow_both_admin_and_functional_roles === true && caller.is_super_admin !== true) {
    return {
      success: false,
      error: 'Setting allow_both_admin_and_functional_roles requires super-admin authority. '
           + 'This override is a HITRUST separation-of-duties exception and cannot be granted by Division Admins.'
    };
  }

  // Verify target user exists
  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (existErr || !existing) {
    return { success: false, error: 'User not found.' };
  }

  // ── Contract 45 (D-638): manager validation ───────────────────────────────
  // Runs before the write, because the loop it prevents is one the database
  // will happily accept and every later chain walk will hang on.
  if (updates.manager_user_id !== undefined && updates.manager_user_id !== null) {
    const { data: manager } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', updates.manager_user_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!manager) {
      return { success: false, error: 'Manager not found. Select an active user.' };
    }
    if (manager.is_active !== true) {
      return { success: false, error: 'That user is inactive and cannot be set as a manager.' };
    }

    const loopCheck = await wouldCloseReportingLoop(user_id, updates.manager_user_id);
    if (!loopCheck.ok) {
      return { success: false, error: loopCheck.error };
    }
  }

  // Build safe update payload from whitelisted fields.
  const payload = {};
  for (const field of MUTABLE_FIELDS) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update(payload)
    .eq('id', user_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update user: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_user };
