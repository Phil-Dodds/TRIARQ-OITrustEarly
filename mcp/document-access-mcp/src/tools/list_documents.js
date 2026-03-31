// list_documents.js
// Paginated list of artifact metadata scoped to caller's accessible Divisions.
// No file content returned — metadata only.

'use strict';

const { supabase }                    = require('../db');
const { getAccessibleDivisionIds,
        userCanAccessDivision }       = require('../lib/division-access');

const DEFAULT_LIMIT  = 50;
const MAX_LIMIT      = 200;

/**
 * @param {object} params
 * @param {string}  [params.division_id]
 * @param {string}  [params.folder_id]
 * @param {string}  [params.artifact_type]   - type_name string filter
 * @param {string}  [params.lifecycle_status]
 * @param {number}  [params.limit]
 * @param {number}  [params.offset]
 * @param {string}  caller_user_id
 */
async function list_documents(params, caller_user_id) {
  const {
    division_id,
    folder_id,
    artifact_type,
    lifecycle_status,
    limit  = DEFAULT_LIMIT,
    offset = 0
  } = params;

  // Resolve which Divisions to scope to
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
      return { success: true, data: { artifacts: [], total: 0, limit, offset } };
    }
  }

  const safeLimit = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);

  let query = supabase
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
    `, { count: 'exact' })
    .in('division_id', divisionIds)
    .is('deleted_at', null)
    .order('submitted_at', { ascending: false })
    .range(offset, offset + safeLimit - 1);

  if (folder_id)        query = query.eq('folder_id', folder_id);
  if (lifecycle_status) query = query.eq('lifecycle_status', lifecycle_status);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: `Failed to list documents: ${error.message}` };
  }

  // Apply artifact_type filter after join (type_name is on related table)
  let results = data || [];
  if (artifact_type) {
    results = results.filter(a => a.artifact_types?.type_name === artifact_type);
  }

  return {
    success: true,
    data: {
      artifacts: results,
      total:     count || 0,
      limit:     safeLimit,
      offset
    }
  };
}

module.exports = { list_documents };
