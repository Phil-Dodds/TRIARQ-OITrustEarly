// roadmap_themes.js
// Pathways OI Trust — delivery-cycle-mcp
// D-487: Division-scoped roadmap vocabulary. Four tools: list / create /
// update / deactivate. Deactivate-only when referenced (D-437 pattern) —
// there is no hard-delete path at all.
//
// Management access (Contract 38 follow-on 14, Phil 2026-07-17): Admin OR any
// member of the theme's Division — Trios manage their Divisions' themes from
// the Deploy by Quarter screen. Supersedes the Admin-only interim rule.
// Reads (list_roadmap_themes) are open to any authenticated user — the Edit
// panel and grid filters need the vocabulary.

'use strict';

const { supabase } = require('../db');

/** Admin OR member of division_id. Returns true/false. */
async function hasThemeAccess(caller_user_id, division_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin === true) { return true; }
  if (!division_id) { return false; }
  const { data: membership } = await supabase
    .from('division_memberships')
    .select('division_id')
    .eq('user_id', caller_user_id)
    .eq('division_id', division_id)
    .is('deleted_at', null)
    .limit(1);
  return Array.isArray(membership) && membership.length > 0;
}

const ACCESS_DENIED =
  'You do not have access to manage Roadmap Themes for this Division. ' +
  'Theme management requires Division membership or an Admin role.';

/** Resolve a theme's division_id for the access check on update/deactivate. */
async function themeDivisionId(theme_id) {
  const { data } = await supabase
    .from('roadmap_themes')
    .select('division_id')
    .eq('id', theme_id)
    .single();
  return data?.division_id ?? null;
}

// ── list_roadmap_themes ────────────────────────────────────────────────────────
// { division_id?, include_inactive? } — division omitted = all divisions
// (grid filter panels need the full vocabulary across visible divisions).
async function list_roadmap_themes(params, _caller_user_id) {
  let q = supabase
    .from('roadmap_themes')
    .select('id, division_id, name, sort_order, active')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (params?.division_id)      q = q.eq('division_id', params.division_id);
  if (!params?.include_inactive) q = q.eq('active', true);

  const { data, error } = await q;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

// ── create_roadmap_theme ───────────────────────────────────────────────────────
async function create_roadmap_theme(params, caller_user_id) {
  const division_id = params?.division_id;
  const name = typeof params?.name === 'string' ? params.name.trim() : '';
  if (!division_id) return { success: false, error: 'division_id is required.' };
  if (!name)        return { success: false, error: 'name is required.' };
  if (!(await hasThemeAccess(caller_user_id, division_id))) {
    return { success: false, error: ACCESS_DENIED };
  }

  const { data: maxRow } = await supabase
    .from('roadmap_themes')
    .select('sort_order')
    .eq('division_id', division_id)
    .eq('active', true)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('roadmap_themes')
    .insert({
      division_id,
      name,
      sort_order: (maxRow?.sort_order ?? 0) + 1,
      created_by: caller_user_id
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `A Theme named "${name}" already exists in this Division. Theme names must be unique per Division.` };
    }
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ── update_roadmap_theme ───────────────────────────────────────────────────────
// { theme_id, name?, sort_order?, active? } — rename, reorder, and/or
// reactivate (active:true — Contract 38 f14 gives Trios the full cycle).
async function update_roadmap_theme(params, caller_user_id) {
  const { theme_id } = params || {};
  if (!theme_id) return { success: false, error: 'theme_id is required.' };
  if (!(await hasThemeAccess(caller_user_id, await themeDivisionId(theme_id)))) {
    return { success: false, error: ACCESS_DENIED };
  }

  const patch = { updated_at: new Date().toISOString() };
  if (params.active !== undefined) {
    if (typeof params.active !== 'boolean') return { success: false, error: 'active must be a boolean.' };
    patch.active = params.active;
  }
  if (params.name !== undefined) {
    const name = typeof params.name === 'string' ? params.name.trim() : '';
    if (!name) return { success: false, error: 'name cannot be empty.' };
    patch.name = name;
  }
  if (params.sort_order !== undefined) {
    if (!Number.isFinite(params.sort_order)) return { success: false, error: 'sort_order must be a number.' };
    patch.sort_order = Math.floor(params.sort_order);
  }

  const { data, error } = await supabase
    .from('roadmap_themes')
    .update(patch)
    .eq('id', theme_id)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A Theme with that name already exists in this Division.' };
    }
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ── deactivate_roadmap_theme ───────────────────────────────────────────────────
// D-437 pattern: deactivation hides the Theme from pickers and new tagging.
// Initiatives already tagged keep their tag and continue displaying the name.
async function deactivate_roadmap_theme(params, caller_user_id) {
  const { theme_id } = params || {};
  if (!theme_id) return { success: false, error: 'theme_id is required.' };
  if (!(await hasThemeAccess(caller_user_id, await themeDivisionId(theme_id)))) {
    return { success: false, error: ACCESS_DENIED };
  }

  const { count } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id', { count: 'exact', head: true })
    .eq('roadmap_theme_id', theme_id)
    .is('deleted_at', null);

  const { data, error } = await supabase
    .from('roadmap_themes')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', theme_id)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: { ...data, referencing_initiatives: count ?? 0 } };
}

module.exports = {
  list_roadmap_themes,
  create_roadmap_theme,
  update_roadmap_theme,
  deactivate_roadmap_theme
};
