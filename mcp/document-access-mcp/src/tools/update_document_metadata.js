// update_document_metadata.js
// Human governance layer — updates artifact metadata fields only.
// Does not replace file content or create a new version.

'use strict';

const { supabase }              = require('../db');
const { userCanAccessDivision } = require('../lib/division-access');

const MUTABLE_FIELDS = ['artifact_title', 'folder_id', 'lifecycle_status'];

const VALID_LIFECYCLE_STATUSES = ['draft', 'seed_review', 'candidate', 'canon', 'superseded', 'archived'];

/**
 * @param {object} params
 * @param {string} params.document_id
 * @param {object} params.metadata - keys restricted to MUTABLE_FIELDS
 * @param {string} caller_user_id
 */
async function update_document_metadata(params, caller_user_id) {
  const { document_id, metadata } = params;

  if (!document_id) return { success: false, error: 'document_id is required.' };
  if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
    return { success: false, error: 'metadata object is required and must not be empty.' };
  }

  const immutableAttempts = Object.keys(metadata).filter(k => !MUTABLE_FIELDS.includes(k));
  if (immutableAttempts.length > 0) {
    return {
      success: false,
      error: `The following fields cannot be updated via this tool: ${immutableAttempts.join(', ')}. `
           + `To update file content, upload a new version. Mutable fields: ${MUTABLE_FIELDS.join(', ')}.`
    };
  }

  // Validate lifecycle_status if being set
  if (metadata.lifecycle_status && !VALID_LIFECYCLE_STATUSES.includes(metadata.lifecycle_status)) {
    return {
      success: false,
      error: `lifecycle_status must be one of: ${VALID_LIFECYCLE_STATUSES.join(', ')}.`
    };
  }

  // Fetch artifact
  const { data: artifact, error: fetchErr } = await supabase
    .from('artifacts')
    .select('id, artifact_title, division_id, lifecycle_status')
    .eq('id', document_id)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !artifact) {
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

  // Build safe update payload
  const payload = {};
  for (const field of MUTABLE_FIELDS) {
    if (metadata[field] !== undefined) {
      payload[field] = metadata[field];
    }
  }

  const { data: updated, error: updateErr } = await supabase
    .from('artifacts')
    .update(payload)
    .eq('id', document_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to update document: ${updateErr.message}` };
  }

  return { success: true, data: updated };
}

module.exports = { update_document_metadata };
