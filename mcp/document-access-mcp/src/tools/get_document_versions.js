// get_document_versions.js
// Human governance layer — full version history for an artifact.

'use strict';

const { supabase }              = require('../db');
const { userCanAccessDivision } = require('../lib/division-access');

/**
 * @param {object} params
 * @param {string} params.document_id
 * @param {string} caller_user_id
 */
async function get_document_versions(params, caller_user_id) {
  const { document_id } = params;

  if (!document_id) return { success: false, error: 'document_id is required.' };

  // Verify artifact exists and get division_id
  const { data: artifact, error: artErr } = await supabase
    .from('artifacts')
    .select('id, artifact_title, division_id')
    .eq('id', document_id)
    .is('deleted_at', null)
    .single();

  if (artErr || !artifact) {
    return { success: false, error: 'Document not found.' };
  }

  // Division access check
  const canAccess = await userCanAccessDivision(caller_user_id, artifact.division_id);
  if (!canAccess) {
    return {
      success: false,
      error: 'You do not have access to this document\'s Division. Contact your Division Admin to request access.'
    };
  }

  const { data: versions, error: versErr } = await supabase
    .from('artifact_versions')
    .select(`
      id,
      version_number,
      artifact_content_snapshot,
      file_id,
      created_at,
      change_note,
      created_by,
      document_files ( id, original_filename, file_format, file_size_bytes, malware_scan_status ),
      users!artifact_versions_created_by_fkey ( display_name )
    `)
    .eq('artifact_id', document_id)
    .is('deleted_at', null)
    .order('version_number', { ascending: false });

  if (versErr) {
    return { success: false, error: `Failed to fetch versions: ${versErr.message}` };
  }

  return {
    success: true,
    data: {
      document_id,
      artifact_title: artifact.artifact_title,
      versions:       versions || []
    }
  };
}

module.exports = { get_document_versions };
