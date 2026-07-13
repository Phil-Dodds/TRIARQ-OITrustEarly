// roadmap_themes.js
// Pathways OI Trust — delivery-cycle-mcp
// D-487: Division-scoped roadmap vocabulary. Four tools: list / create /
// update / deactivate. Deactivate-only when referenced (D-437 pattern) —
// there is no hard-delete path at all.
//
// Management is Admin-only for now: D-487 names a "Division Leader" role that
// does not exist in the schema (CC-decision — flagged to Design).
// Reads (list_roadmap_themes) are open to any authenticated user — the Edit
// panel and grid filters need the vocabulary.

'use strict';

const { supabase } = require('../db');

async function requireAdmin(caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  return caller?.is_admin === true;
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
  if (!(await requireAdmin(caller_user_id))) {
    return { success: false, error: 'Admin role required to manage Roadmap Themes.' };
  }
  const division_id = params?.division_id;
  const name = typeof params?.name === 'string' ? params.name.trim() : '';
  if (!division_id) return { success: false, error: 'division_id is required.' };
  if (!name)        return { success: false, error: 'name is required.' };

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
// { theme_id, name?, sort_order? } — rename and/or reorder.
async function update_roadmap_theme(params, caller_user_id) {
  if (!(await requireAdmin(caller_user_id))) {
    return { success: false, error: 'Admin role required to manage Roadmap Themes.' };
  }
  const { theme_id } = params || {};
  if (!theme_id) return { success: false, error: 'theme_id is required.' };

  const patch = { updated_at: new Date().toISOString() };
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
  if (!(await requireAdmin(caller_user_id))) {
    return { success: false, error: 'Admin role required to manage Roadmap Themes.' };
  }
  const { theme_id } = params || {};
  if (!theme_id) return { success: false, error: 'theme_id is required.' };

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
