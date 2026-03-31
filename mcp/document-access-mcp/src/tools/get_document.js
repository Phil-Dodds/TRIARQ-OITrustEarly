// get_document.js
// Human governance layer — full artifact record for a single document.
// Returns content or a signed download URL for file-based artifacts.
// Enforces Division access before returning anything.

'use strict';

const { supabase }              = require('../db');
const { userCanAccessDivision } = require('../lib/division-access');

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * @param {object} params
 * @param {string} params.document_id
 * @param {string} caller_user_id
 */
async function get_document(params, caller_user_id) {
  const { document_id } = params;

  if (!document_id) return { success: false, error: 'document_id is required.' };

  // Fetch artifact with related data
  const { data: artifact, error } = await supabase
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
    .eq('id', document_id)
    .is('deleted_at', null)
    .order('version_number', { foreignTable: 'artifact_versions', ascending: false })
    .single();

  if (error || !artifact) {
    return { success: false, error: 'Document not found.' };
  }

  // Division access check
  const canAccess = await userCanAccessDivision(caller_user_id, artifact.division_id);
  if (!canAccess) {
    return {
      success: false,
      error: 'You do not have access to this document. It belongs to a Division you are not assigned to. Contact your Division Admin to request access.'
    };
  }

  // For file-based artifacts, generate a signed download URL for the latest version
  let download_url = null;
  const latestVersion = artifact.artifact_versions?.[0];

  if (latestVersion?.document_files?.storage_path &&
      latestVersion.document_files.malware_scan_status === 'clean') {
    const { data: signedData } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(latestVersion.document_files.storage_path, SIGNED_URL_EXPIRY_SECONDS);

    download_url = signedData?.signedUrl || null;
  }

  return {
    success: true,
    data: {
      ...artifact,
      download_url,
      latest_version: latestVersion || null
    }
  };
}

module.exports = { get_document };
