// get_documents_bulk.js
// Human governance / Engineering layer.
// Primary tool for Claude Code calling canonical files.
// Returns complete artifact records. Can fetch by ID list, folder, type, or Division.

'use strict';

const { supabase }                  = require('../db');
const { getAccessibleDivisionIds,
        userCanAccessDivision }     = require('../lib/division-access');

const MAX_BULK_DOCUMENTS = 50;
const SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * @param {object}   params
 * @param {string[]} [params.document_ids]
 * @param {string}   [params.folder_id]
 * @param {string}   [params.artifact_type]
 * @param {string}   [params.division_id]
 * @param {string}   caller_user_id
 */
async function get_documents_bulk(params, caller_user_id) {
  const { document_ids, folder_id, artifact_type, division_id } = params;

  // At least one filter required
  if (!document_ids?.length && !folder_id && !artifact_type && !division_id) {
    return {
      success: false,
      error: 'At least one filter is required: document_ids, folder_id, artifact_type, or division_id.'
    };
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

  let query = supabase
    .from('artifacts')
    .select(`
      *,
      artifact_types ( type_name, type_description ),
      divisions ( division_name ),
      artifact_versions (
        id,
        version_number,
        artifact_content_snapshot,
        file_id,
        created_at,
        change_note,
        document_files ( id, original_filename, file_format, file_size_bytes, storage_path, malware_scan_status )
      )
    `)
    .in('division_id', divisionIds)
    .is('deleted_at', null)
    .order('version_number', { foreignTable: 'artifact_versions', ascending: false })
    .limit(MAX_BULK_DOCUMENTS);

  if (document_ids?.length) query = query.in('id', document_ids.slice(0, MAX_BULK_DOCUMENTS));
  if (folder_id)            query = query.eq('folder_id', folder_id);

  const { data, error } = await query;

  if (error) {
    return { success: false, error: `Bulk fetch failed: ${error.message}` };
  }

  let results = data || [];

  if (artifact_type) {
    results = results.filter(a => a.artifact_types?.type_name === artifact_type);
  }

  // Attach signed download URLs for clean file-based artifacts
  const enriched = await Promise.all(results.map(async (artifact) => {
    const latestVersion = artifact.artifact_versions?.[0];
    let download_url = null;

    if (latestVersion?.document_files?.storage_path &&
        latestVersion.document_files.malware_scan_status === 'clean') {
      const { data: signedData } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(latestVersion.document_files.storage_path, SIGNED_URL_EXPIRY_SECONDS);
      download_url = signedData?.signedUrl || null;
    }

    return { ...artifact, download_url };
  }));

  return { success: true, data: enriched };
}

module.exports = { get_documents_bulk };
