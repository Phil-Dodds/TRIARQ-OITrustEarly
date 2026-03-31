// file-validator.js
// Pathways OI Trust — document-access-mcp
// Layer 1 file validation (D-146):
//   1. Extension must be in the allowed list (pdf, docx, md, txt)
//   2. Magic bytes must match the declared extension
//   3. File size must not exceed 25MB
// Both checks must pass. Mismatch = rejection with explanation.

'use strict';

const MAX_FILE_BYTES = 26214400; // 25MB

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'md', 'txt'];

// Magic byte signatures — first bytes of file buffer
// PDF:  %PDF  (25 50 44 46)
// DOCX: PK\x03\x04  (50 4B 03 04) — DOCX is a ZIP archive
// MD:   text file — no fixed magic bytes, validate UTF-8
// TXT:  text file — no fixed magic bytes, validate UTF-8
const MAGIC_BYTES = {
  pdf:  [0x25, 0x50, 0x44, 0x46],
  docx: [0x50, 0x4B, 0x03, 0x04]
};

/**
 * Validates a file buffer against its declared extension.
 *
 * @param {Buffer} fileBuffer
 * @param {string} filename - original filename including extension
 * @returns {{ valid: boolean, extension: string|null, error: string|null }}
 */
function validateFile(fileBuffer, filename) {
  if (!fileBuffer || fileBuffer.length === 0) {
    return { valid: false, extension: null, error: 'File is empty.' };
  }

  if (fileBuffer.length > MAX_FILE_BYTES) {
    const sizeMB = (fileBuffer.length / 1048576).toFixed(1);
    return {
      valid: false,
      extension: null,
      error: `File size ${sizeMB}MB exceeds the 25MB maximum. Reduce the file size and try again.`
    };
  }

  // Extract extension
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) {
    return {
      valid: false,
      extension: null,
      error: 'File has no extension. Supported formats: pdf, docx, md, txt.'
    };
  }

  const extension = filename.slice(dotIndex + 1).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      extension,
      error: `File format .${extension} is not supported. Supported formats: pdf, docx, md, txt.`
    };
  }

  // Magic bytes check for binary formats
  if (MAGIC_BYTES[extension]) {
    const expected = MAGIC_BYTES[extension];
    for (let i = 0; i < expected.length; i++) {
      if (fileBuffer[i] !== expected[i]) {
        return {
          valid: false,
          extension,
          error: `File header does not match the .${extension} format. `
               + `The file extension and file content do not match. `
               + `Re-save the file in the correct format and try again.`
        };
      }
    }
  }

  // Text format validation (md, txt) — verify decodable as UTF-8
  if (extension === 'md' || extension === 'txt') {
    try {
      // Attempt UTF-8 decode on first 4KB sample
      const sample = fileBuffer.slice(0, 4096);
      const decoded = sample.toString('utf8');
      // Check for replacement characters that indicate binary content
      if (decoded.includes('\uFFFD') && containsBinaryContent(sample)) {
        return {
          valid: false,
          extension,
          error: `File does not appear to be valid UTF-8 text. `
               + `.${extension} files must be plain text. Check the file and try again.`
        };
      }
    } catch (e) {
      return {
        valid: false,
        extension,
        error: `File could not be read as text. .${extension} files must be plain text.`
      };
    }
  }

  return { valid: true, extension, error: null };
}

/**
 * Heuristic: checks if a buffer has a high proportion of non-printable bytes
 * indicating binary (non-text) content.
 */
function containsBinaryContent(buffer) {
  let nonPrintable = 0;
  const checkLength = Math.min(buffer.length, 512);
  for (let i = 0; i < checkLength; i++) {
    const byte = buffer[i];
    if (byte < 0x09 || (byte > 0x0D && byte < 0x20 && byte !== 0x1B)) {
      nonPrintable++;
    }
  }
  return (nonPrintable / checkLength) > 0.3;
}

module.exports = { validateFile, ALLOWED_EXTENSIONS, MAX_FILE_BYTES };
