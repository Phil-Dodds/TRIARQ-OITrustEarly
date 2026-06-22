// create_division.js
// Creates a new Division. Phil-only (is_super_admin) — Contract 31 follow-on.
// If parent_division_id provided, division_level is computed from parent
// (parent.division_level + 1), or 0 for a root Trust.

'use strict';

const { supabase } = require('../db');

// Contract 10 §6 B-48 (migration 030): display_name_short is NOT NULL on
// the divisions table, max 10 chars. When the caller does not supply one,
// derive a sensible default from the division name. Phil can rename later
// via update_division.
const DISPLAY_NAME_SHORT_MAX = 10;

function deriveShortName(divisionName) {
  return divisionName.trim().slice(0, DISPLAY_NAME_SHORT_MAX).trim();
}

/**
 * @param {object} params
 * @param {string} params.division_name
 * @param {string} [params.display_name_short]
 * @param {string} [params.parent_division_id]
 * @param {string} [params.division_type_label]
 * @param {string} caller_user_id - from JWT sub claim
 */
async function create_division(params, caller_user_id) {
  const { division_name, parent_division_id, division_type_label } = params;
  let   { display_name_short } = params;

  if (!division_name || !division_name.trim()) {
    return { success: false, error: 'division_name is required.' };
  }

  // Validate / default display_name_short. Migration 030 made it NOT NULL.
  if (display_name_short !== undefined && display_name_short !== null) {
    if (typeof display_name_short !== 'string') {
      return { success: false, error: 'display_name_short must be a string of 10 characters or fewer.' };
    }
    display_name_short = display_name_short.trim();
    if (display_name_short.length === 0) {
      display_name_short = deriveShortName(division_name);
    } else if (display_name_short.length > DISPLAY_NAME_SHORT_MAX) {
      return {
        success: false,
        error: `display_name_short must be ${DISPLAY_NAME_SHORT_MAX} characters or fewer.`
      };
    }
  } else {
    display_name_short = deriveShortName(division_name);
  }

  // Verify caller is Admin — Contract 19 (D-394, CC-19-01).
  // is_super_admin (CC-19-06 option B) bypasses the parent-membership check
  // below — super-admins administer the entire system, not a downward slice.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, is_admin, is_active, is_super_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();

  if (callerErr || !caller) {
    return { success: false, error: 'Caller user record not found.' };
  }
  if (!caller.is_active) {
    return { success: false, error: 'Your account is inactive.' };
  }
  if (caller.is_admin !== true) {
    return {
      success: false,
      error: 'Creating Divisions requires Admin role. Your current role does not have this permission. Contact your System Admin to request access.'
    };
  }
  // Contract 31 follow-on (CC): Division creation is restricted to Phil
  // (is_super_admin). The Add Trust / Service Line / Functional Team UI is
  // Phil-only; this server-side gate enforces it (defense in depth, mirrors the
  // api_key tools). Stricter than the historical admin-level contract and
  // overrides the D-413/D-414 "structural changes require a Design session"
  // removal — Phil directed it in-session; D-number to be assigned by Design.
  if (caller.is_super_admin !== true) {
    return {
      success: false,
      error: 'Only Phil can create Divisions. Creating a Trust, Service Line, or Functional Team is restricted to the super-admin.'
    };
  }

  let division_level = 0;

  if (parent_division_id) {
    // Verify parent exists
    const { data: parent, error: parentErr } = await supabase
      .from('divisions')
      .select('id, division_level')
      .eq('id', parent_division_id)
      .is('deleted_at', null)
      .single();

    if (parentErr || !parent) {
      return { success: false, error: 'parent_division_id not found or has been deleted.' };
    }

    // Downward-only model: a regular Admin can only create children inside
    // branches they administer (direct membership in the parent). Super-admin
    // bypasses this — CC-19-06 option B: super-admin holds system-wide
    // authority. Without this bypass, even a freshly seeded super-admin can't
    // build out the initial hierarchy because no membership rows exist yet.
    if (caller.is_super_admin !== true) {
      const hasAccess = await callerHasDivisionAccess(caller_user_id, parent_division_id);
      if (!hasAccess) {
        return {
          success: false,
          error: 'You do not have admin access to the parent Division. ' +
                 'You can only create child Divisions within Divisions you administer. ' +
                 'Ask a Super-Admin to create it, or have an Admin add you as a member of the parent Division first.'
        };
      }
    }

    division_level = parent.division_level + 1;
  }

  const { data: division, error: insertErr } = await supabase
    .from('divisions')
    .insert({
      division_name:       division_name.trim(),
      display_name_short,
      parent_division_id:  parent_division_id || null,
      division_level,
      division_type_label: division_type_label || null,
      created_by:          caller_user_id
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to create Division: ${insertErr.message}` };
  }

  return { success: true, data: division };
}

/**
 * Returns true if user_id has an active membership (directly or via ancestor) for division_id.
 * Simplified check for Build A: direct membership only.
 * Full recursive ancestor check wired when hierarchical membership query is needed.
 */
async function callerHasDivisionAccess(user_id, division_id) {
  const { data } = await supabase
    .from('division_memberships')
    .select('id')
    .eq('user_id', user_id)
    .eq('division_id', division_id)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .limit(1);

  return data && data.length > 0;
}

module.exports = { create_division };
