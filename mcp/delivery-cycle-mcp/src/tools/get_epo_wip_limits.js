// get_epo_wip_limits.js
// Pathways OI Trust — delivery-cycle-mcp
// Returns all EPO WIP limit rows joined to user display data.
//
// Spec: Contract 20 §2.1 (D-400, D-401).
// JWT required (any authenticated user — read is non-admin). Tool-layer
// authorization is open; RLS on epo_wip_limits is read-all-authenticated.
//
// Auto-create behavior: any user with is_epo = true who has no row in
// epo_wip_limits gets a row inserted at 3/3/3 before the result returns.
// Ensures no EPO is ever missing a limit row, so the Admin screen and the
// EPO Summary view both see the complete list.
//
// Returns array of:
//   { user_id, display_name, pre_build_limit, build_limit, post_deploy_limit,
//     updated_at, updated_by_display_name }
//
// Source: D-400, D-401, Contract 20 §2.1.

'use strict';

const { supabase } = require('../db');
const { WIP_LIMIT_PRE_BUILD, WIP_LIMIT_BUILD, WIP_LIMIT_POST_DEPLOY } = require('../lifecycle');

async function get_epo_wip_limits(_params, _caller_user_id) {
  // ── Resolve all active EPOs ───────────────────────────────────────────────
  const { data: epos, error: epoErr } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('is_epo', true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true });

  if (epoErr) {
    return { success: false, error: `Failed to load EPO users: ${epoErr.message}` };
  }

  if (!epos || epos.length === 0) {
    return { success: true, data: [] };
  }

  // ── Load existing limit rows for these EPOs ───────────────────────────────
  const epoIds = epos.map(u => u.id);
  const { data: existingLimits, error: limitErr } = await supabase
    .from('epo_wip_limits')
    .select('user_id, pre_build_limit, build_limit, post_deploy_limit, updated_at, updated_by')
    .in('user_id', epoIds);

  if (limitErr) {
    return { success: false, error: `Failed to load EPO WIP limits: ${limitErr.message}` };
  }

  const limitMap = new Map();
  for (const row of (existingLimits || [])) {
    limitMap.set(row.user_id, row);
  }

  // ── Auto-create missing rows at 3/3/3 ─────────────────────────────────────
  const missing = epoIds.filter(id => !limitMap.has(id));
  if (missing.length > 0) {
    const inserts = missing.map(user_id => ({
      user_id,
      pre_build_limit:   WIP_LIMIT_PRE_BUILD,
      build_limit:       WIP_LIMIT_BUILD,
      post_deploy_limit: WIP_LIMIT_POST_DEPLOY
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from('epo_wip_limits')
      .insert(inserts)
      .select('user_id, pre_build_limit, build_limit, post_deploy_limit, updated_at, updated_by');

    if (insertErr) {
      return { success: false, error: `Failed to seed EPO WIP limits: ${insertErr.message}` };
    }

    for (const row of (inserted || [])) {
      limitMap.set(row.user_id, row);
    }
  }

  // ── Resolve updater display names ─────────────────────────────────────────
  const updaterIds = Array.from(new Set(
    Array.from(limitMap.values())
      .map(r => r.updated_by)
      .filter(Boolean)
  ));

  const updaterMap = new Map();
  if (updaterIds.length > 0) {
    const { data: updaters } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', updaterIds)
      .is('deleted_at', null);

    for (const u of (updaters || [])) {
      updaterMap.set(u.id, u.display_name);
    }
  }

  // ── Assemble response ─────────────────────────────────────────────────────
  const data = epos.map(epo => {
    const row = limitMap.get(epo.id);
    return {
      user_id:                 epo.id,
      display_name:            epo.display_name,
      pre_build_limit:         row?.pre_build_limit   ?? WIP_LIMIT_PRE_BUILD,
      build_limit:             row?.build_limit       ?? WIP_LIMIT_BUILD,
      post_deploy_limit:       row?.post_deploy_limit ?? WIP_LIMIT_POST_DEPLOY,
      updated_at:              row?.updated_at        ?? null,
      updated_by_display_name: row?.updated_by ? (updaterMap.get(row.updated_by) ?? null) : null
    };
  });

  return { success: true, data };
}

module.exports = { get_epo_wip_limits };
