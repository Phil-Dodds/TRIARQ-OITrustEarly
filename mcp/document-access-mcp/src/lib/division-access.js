// division-access.js
// Pathways OI Trust — document-access-mcp
// Resolves the set of Division IDs a user can access.
// Downward-only: direct membership + all recursive descendants (D-135).
// Used by all tools that scope results to the caller's accessible Divisions.

'use strict';

const { supabase } = require('../db');

/**
 * Returns all Division IDs the user can access:
 * directly assigned + all recursive descendants.
 *
 * @param {string} user_id
 * @returns {Promise<string[]>} array of accessible division_id UUIDs
 */
async function getAccessibleDivisionIds(user_id) {
  // Get directly assigned Divisions (active memberships)
  const { data: memberships, error } = await supabase
    .from('division_memberships')
    .select('division_id')
    .eq('user_id', user_id)
    .is('revoked_at', null)
    .is('deleted_at', null);

  if (error) throw new Error(`Failed to resolve Division access: ${error.message}`);
  if (!memberships || memberships.length === 0) return [];

  const directIds = memberships.map(m => m.division_id);
  const allIds    = new Set(directIds);

  await collectDescendants(directIds, allIds);

  return Array.from(allIds);
}

async function collectDescendants(parentIds, accumulator) {
  if (parentIds.length === 0) return;

  const { data: children } = await supabase
    .from('divisions')
    .select('id')
    .in('parent_division_id', parentIds)
    .is('deleted_at', null);

  if (!children || children.length === 0) return;

  const newIds = children.map(c => c.id).filter(id => !accumulator.has(id));
  newIds.forEach(id => accumulator.add(id));

  await collectDescendants(newIds, accumulator);
}

/**
 * Verifies a user has access to a specific Division.
 * Returns true if the division_id is in the user's accessible set.
 *
 * @param {string} user_id
 * @param {string} division_id
 * @returns {Promise<boolean>}
 */
async function userCanAccessDivision(user_id, division_id) {
  const accessible = await getAccessibleDivisionIds(user_id);
  return accessible.includes(division_id);
}

module.exports = { getAccessibleDivisionIds, userCanAccessDivision };
