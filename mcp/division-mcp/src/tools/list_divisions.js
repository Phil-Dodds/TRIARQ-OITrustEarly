// list_divisions.js
// Lists Divisions. Defaults to root Trusts (division_level = 0) if no parent specified.

'use strict';

const { supabase } = require('../db');

/**
 * @param {object} params
 * @param {string}  [params.parent_division_id] - if omitted and all_levels not set, returns root Trusts
 * @param {boolean} [params.all_levels]          - when true, returns all divisions across all levels
 * @param {string} caller_user_id
 */
async function list_divisions(params, caller_user_id) {
  const { parent_division_id, all_levels } = params;

  let query = supabase
    .from('divisions')
    .select('id, division_name, division_level, division_type_label, owner_user_id, parent_division_id, created_at, updated_at')
    .is('deleted_at', null)
    .order('division_name');

  if (all_levels) {
    // Return all divisions regardless of hierarchy level — used by create forms
  } else if (parent_division_id) {
    query = query.eq('parent_division_id', parent_division_id);
  } else {
    // Root Trusts have no parent
    query = query.is('parent_division_id', null);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: `Failed to list Divisions: ${error.message}` };
  }

  return { success: true, data: data || [] };
}

module.exports = { list_divisions };
