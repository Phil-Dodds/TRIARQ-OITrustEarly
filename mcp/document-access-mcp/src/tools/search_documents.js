// search_documents.js
// Human governance layer — full-text metadata search across accessible Divisions.
// Returns artifact metadata only — no file content.

'use strict';

const { supabase }                  = require('../db');
const { getAccessibleDivisionIds,
        userCanAccessDivision }     = require('../lib/division-access');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

/**
 * @param {object} params
 * @param {string}  params.query            - search string
 * @param {string}  [params.division_id]
 * @param {string}  [params.artifact_type]
 * @param {string}  [params.folder_id]
 * @param {number}  [params.limit]
 * @param {string}  caller_user_id
 */
async function search_documents(params, caller_user_id) {
  const {
    query,
    division_id,
    artifact_type,
    folder_id,
    limit = DEFAULT_LIMIT
  } = params;

  if (!query || !query.trim()) {
    return { success: false, error: 'query is required.' };
  }

  // Resolve Division scope
  let divisionIds;
  if (division_id) {
    const canAccess = await userCanAccessDivision(caller_user_id, division_id);
    if (!canAccess) {
      return {
        success: false,
        error: 'You do not have access to this Division. Access is granted by your Division Admin.'
      };
    }
    divisionIds = [division_id];
  } else {
    divisionIds = await getAccessibleDivisionIds(caller_user_id);
    if (divisionIds.length === 0) {
      return { success: true, data: [] };
    }
  }

  const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const searchTerm = query.trim();

  // Case-insensitive title search using ilike
  let dbQuery = supabase
    .from('artifacts')
    .select(`
      id,
      artifact_title,
      lifecycle_status,
      submitted_at,
      division_id,
      folder_id,
      artifact_type_id,
      artifact_types ( type_name ),
      divisions ( division_name )
    `)
    .in('division_id', divisionIds)
    .is('deleted_at', null)
    .ilike('artifact_title', `%${searchTerm}%`)
    .order('submitted_at', { ascending: false })
    .limit(safeLimit);

  if (folder_id) dbQuery = dbQuery.eq('folder_id', folder_id);

  const { data, error } = await dbQuery;

  if (error) {
    return { success: false, error: `Search failed: ${error.message}` };
  }

  let results = data || [];

  // Apply artifact_type filter (on joined relation)
  if (artifact_type) {
    results = results.filter(a => a.artifact_types?.type_name === artifact_type);
  }

  return { success: true, data: results };
}

module.exports = { search_documents };
