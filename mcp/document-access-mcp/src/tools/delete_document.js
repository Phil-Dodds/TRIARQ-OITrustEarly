// delete_document.js
// Human governance layer — soft delete only (D-93 Rule 6).
// Sets deleted_at timestamp. Record is never destroyed.

'use strict';

const { supabase }              = require('../db');
const { userCanAccessDivision } = require('../lib/division-access');

/**
 * @param {object} params
 * @param {string} params.document_id
 * @param {string} caller_user_id
 */
async function delete_document(params, caller_user_id) {
  const { document_id } = params;

  if (!document_id) return { success: false, error: 'document_id is required.' };

  // Fetch artifact to verify existence and get division_id for access check
  const { data: artifact, error: fetchErr } = await supabase
    .from('artifacts')
    .select('id, artifact_title, division_id, lifecycle_status, deleted_at')
    .eq('id', document_id)
    .single();

  if (fetchErr || !artifact) {
    return { success: false, error: 'Document not found.' };
  }

  if (artifact.deleted_at) {
    return { success: false, error: 'Document has already been deleted.' };
  }

  // Canon artifacts require Phil-level authority to delete
  if (artifact.lifecycle_status === 'canon') {
    const { data: caller } = await supabase
      .from('users')
      .select('system_role')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .single();

    if (!caller || caller.system_role !== 'phil') {
      return {
        success: false,
        error: `"${artifact.artifact_title}" is a Canon document and cannot be deleted. `
             + 'Only Phil (EVP P&G) can delete Canon documents. '
             + 'To remove this document from circulation, request that it be Superseded or Archived instead.'
      };
    }
  }

  // Division access check
  const canAccess = await userCanAccessDivision(caller_user_id, artifact.division_id);
  if (!canAccess) {
    return {
      success: false,
      error: 'You do not have access to this document\'s Division. Contact your Division Admin to request access.'
    };
  }

  const { data: deleted, error: deleteErr } = await supabase
    .from('artifacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', document_id)
    .select()
    .single();

  if (deleteErr) {
    return { success: false, error: `Failed to delete document: ${deleteErr.message}` };
  }

  return {
    success: true,
    data: {
      document_id:     deleted.id,
      artifact_title:  deleted.artifact_title,
      deleted_at:      deleted.deleted_at,
      message:         `"${deleted.artifact_title}" has been deleted. The record is retained for audit purposes.`
    }
  };
}

module.exports = { delete_document };
