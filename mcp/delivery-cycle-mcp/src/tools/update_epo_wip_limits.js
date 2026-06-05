// update_epo_wip_limits.js
// Pathways OI Trust — delivery-cycle-mcp
// Admin-only. Updates one or more WIP zone limits for a single EPO.
//
// Spec: Contract 20 §2.2 (D-400, D-401).
//
// Behavior:
//   - Admin JWT required — non-admin caller returns 403-style error (D-140).
//   - Each supplied limit must be an integer ≥ 1 (DB CHECK constraint also
//     enforces this — tool layer surfaces a clear D-200 Pattern 3 message).
//   - Updates only supplied fields; preserves existing values for omitted fields.
//   - If no row exists for the target user, inserts one with the supplied
//     fields + defaults for the rest (covers the edge case where an EPO was
//     flagged is_epo = true but the seed step did not fire).
//   - Sets updated_at = now(), updated_by = caller_user_id.
//
// Returns: { user_id, pre_build_limit, build_limit, post_deploy_limit,
//            updated_at, updated_by }
//
// Source: D-400, D-401, Contract 20 §2.2.

'use strict';

const { supabase } = require('../db');
const { WIP_LIMIT_PRE_BUILD, WIP_LIMIT_BUILD, WIP_LIMIT_POST_DEPLOY } = require('../lifecycle');

const LIMIT_FIELDS = ['pre_build_limit', 'build_limit', 'post_deploy_limit'];

function isPositiveInteger(value) {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 1;
}

/**
 * @param {object} params
 * @param {string}  params.user_id            — required, target EPO
 * @param {number} [params.pre_build_limit]   — optional, integer ≥ 1
 * @param {number} [params.build_limit]       — optional, integer ≥ 1
 * @param {number} [params.post_deploy_limit] — optional, integer ≥ 1
 * @param {string} caller_user_id - from JWT (must be Admin)
 */
async function update_epo_wip_limits(params, caller_user_id) {
  const { user_id } = params;

  if (!user_id) {
    return { success: false, error: 'user_id is required.' };
  }

  // ── Collect supplied fields ───────────────────────────────────────────────
  const supplied = {};
  for (const field of LIMIT_FIELDS) {
    if (params[field] !== undefined) {
      if (!isPositiveInteger(params[field])) {
        return {
          success: false,
          error: `${field} must be an integer of 1 or greater. WIP limits cannot be zero or negative.`
        };
      }
      supplied[field] = params[field];
    }
  }

  if (Object.keys(supplied).length === 0) {
    return {
      success: false,
      error: 'At least one of pre_build_limit, build_limit, or post_deploy_limit must be supplied.'
    };
  }

  // ── Admin authorization (D-369, D-394) ────────────────────────────────────
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('id, is_admin, is_active')
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
      error: 'Updating EPO WIP limits requires Admin role. Contact your System Admin to request access.'
    };
  }

  // ── Verify target user exists and is an EPO ───────────────────────────────
  const { data: target, error: targetErr } = await supabase
    .from('users')
    .select('id, is_epo, display_name')
    .eq('id', user_id)
    .is('deleted_at', null)
    .single();

  if (targetErr || !target) {
    return { success: false, error: 'Target user not found or has been deleted.' };
  }
  if (target.is_epo !== true) {
    return {
      success: false,
      error: `${target.display_name} is not an EPO. Assign the EPO role first in User Management before setting WIP limits.`
    };
  }

  // ── Upsert: update if row exists, insert with defaults if not ─────────────
  const now = new Date().toISOString();
  const upsertPayload = {
    user_id,
    pre_build_limit:   supplied.pre_build_limit   ?? WIP_LIMIT_PRE_BUILD,
    build_limit:       supplied.build_limit       ?? WIP_LIMIT_BUILD,
    post_deploy_limit: supplied.post_deploy_limit ?? WIP_LIMIT_POST_DEPLOY,
    updated_at:        now,
    updated_by:        caller_user_id
  };

  // Check for existing row first so we preserve non-supplied fields on update.
  const { data: existing } = await supabase
    .from('epo_wip_limits')
    .select('pre_build_limit, build_limit, post_deploy_limit')
    .eq('user_id', user_id)
    .maybeSingle();

  if (existing) {
    // Preserve omitted fields by overlaying supplied onto existing.
    upsertPayload.pre_build_limit   = supplied.pre_build_limit   ?? existing.pre_build_limit;
    upsertPayload.build_limit       = supplied.build_limit       ?? existing.build_limit;
    upsertPayload.post_deploy_limit = supplied.post_deploy_limit ?? existing.post_deploy_limit;
  }

  const { data: updated, error: upsertErr } = await supabase
    .from('epo_wip_limits')
    .upsert(upsertPayload, { onConflict: 'user_id' })
    .select('user_id, pre_build_limit, build_limit, post_deploy_limit, updated_at, updated_by')
    .single();

  if (upsertErr) {
    return { success: false, error: `Failed to update EPO WIP limits: ${upsertErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_epo_wip_limits };
