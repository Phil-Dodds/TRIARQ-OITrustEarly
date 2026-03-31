// upload_document.js
// Human governance layer — bulk knowledge seed entry point.
// Full two-layer validation per D-146:
//   Layer 1: extension + magic bytes
//   Layer 2: ClamAV scan
// Creates: document_files record, artifact record (seed_review), artifact_version v1.

'use strict';

const { supabase }              = require('../db');
const { validateFile }          = require('../lib/file-validator');
const { scanBuffer }            = require('../lib/malware-scanner');
const { userCanAccessDivision } = require('../lib/division-access');

/**
 * @param {object} params
 * @param {string} params.file            - base64-encoded file content
 * @param {string} params.filename        - original filename with extension
 * @param {string} params.artifact_type_id
 * @param {string} params.division_id
 * @param {object} [params.metadata]      - { artifact_title?, folder_id?, source_tag? }
 * @param {string} caller_user_id
 */
async function upload_document(params, caller_user_id) {
  const { file, filename, artifact_type_id, division_id, metadata = {} } = params;

  // Required field checks
  if (!file)             return { success: false, error: 'file (base64) is required.' };
  if (!filename)         return { success: false, error: 'filename is required.' };
  if (!artifact_type_id) return { success: false, error: 'artifact_type_id is required.' };
  if (!division_id)      return { success: false, error: 'division_id is required.' };

  // Division access check
  const canAccess = await userCanAccessDivision(caller_user_id, division_id);
  if (!canAccess) {
    return {
      success: false,
      error: 'You do not have access to this Division. Contact your Division Admin to be assigned before uploading documents.'
    };
  }

  // Verify artifact_type exists
  const { data: artifactType, error: typeErr } = await supabase
    .from('artifact_types')
    .select('id, type_name')
    .eq('id', artifact_type_id)
    .is('deleted_at', null)
    .single();

  if (typeErr || !artifactType) {
    return { success: false, error: 'artifact_type_id not found.' };
  }

  // Decode base64
  let fileBuffer;
  try {
    fileBuffer = Buffer.from(file, 'base64');
  } catch (e) {
    return { success: false, error: 'file could not be decoded. Ensure it is valid base64.' };
  }

  // ── Layer 1: Extension + magic bytes ────────────────────────────────────────
  const validation = validateFile(fileBuffer, filename);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // ── Layer 2: ClamAV scan ─────────────────────────────────────────────────────
  const scan = await scanBuffer(fileBuffer);

  if (!scan.clean) {
    // Create document_files record with rejected status for audit trail
    await supabase.from('document_files').insert({
      storage_path:        'REJECTED — not stored',
      original_filename:   filename,
      file_format:         validation.extension,
      file_size_bytes:     fileBuffer.length,
      malware_scan_status: 'rejected',
      malware_scan_at:     new Date().toISOString(),
      uploaded_by:         caller_user_id
    });

    return {
      success: false,
      error: scan.error || 'File failed malware scan and has not been stored. Upload a clean file to proceed.'
    };
  }

  // ── Write to Supabase Storage ────────────────────────────────────────────────
  // Path: documents/{division_id}/{timestamp}_{filename}
  const timestamp   = Date.now();
  const storagePath = `documents/${division_id}/${timestamp}_${filename}`;

  const { error: storageErr } = await supabase
    .storage
    .from('documents')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType(validation.extension),
      upsert: false
    });

  if (storageErr) {
    return { success: false, error: `Storage upload failed: ${storageErr.message}` };
  }

  // ── Create document_files record ─────────────────────────────────────────────
  const { data: docFile, error: fileRecordErr } = await supabase
    .from('document_files')
    .insert({
      storage_path:        storagePath,
      original_filename:   filename,
      file_format:         validation.extension,
      file_size_bytes:     fileBuffer.length,
      malware_scan_status: 'clean',
      malware_scan_at:     new Date().toISOString(),
      uploaded_by:         caller_user_id
    })
    .select()
    .single();

  if (fileRecordErr) {
    return { success: false, error: `Failed to create file record: ${fileRecordErr.message}` };
  }

  // ── Create artifact record ────────────────────────────────────────────────────
  const artifactTitle = metadata.artifact_title || filename.replace(/\.[^.]+$/, '');

  const { data: artifact, error: artifactErr } = await supabase
    .from('artifacts')
    .insert({
      artifact_type_id,
      artifact_title:  artifactTitle,
      division_id,
      folder_id:       metadata.folder_id || null,
      lifecycle_status: 'seed_review',
      submitted_by:    caller_user_id
    })
    .select()
    .single();

  if (artifactErr) {
    return { success: false, error: `Failed to create artifact record: ${artifactErr.message}` };
  }

  // ── Create artifact_version v1 ────────────────────────────────────────────────
  const { error: versionErr } = await supabase
    .from('artifact_versions')
    .insert({
      artifact_id:    artifact.id,
      version_number: 1,
      file_id:        docFile.id,
      created_by:     caller_user_id,
      change_note:    'Initial upload via bulk seed'
    });

  if (versionErr) {
    return { success: false, error: `Failed to create version record: ${versionErr.message}` };
  }

  return {
    success: true,
    data: {
      ...artifact,
      document_file: docFile
    }
  };
}

function mimeType(extension) {
  const types = {
    pdf:  'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    md:   'text/markdown',
    txt:  'text/plain'
  };
  return types[extension] || 'application/octet-stream';
}

module.exports = { upload_document };
