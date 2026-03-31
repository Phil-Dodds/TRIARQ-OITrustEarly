// file-validator.test.js
// Tests for Layer 1 file validation (D-146).
// Uses Node.js built-in test runner (node --test).

'use strict';

const { test, describe } = require('node:test');
const assert             = require('node:assert/strict');
const { validateFile }   = require('../src/lib/file-validator');

// ── Magic byte helpers ────────────────────────────────────────────────────────
function pdfBuffer(extra = 0) {
  const buf = Buffer.alloc(8 + extra);
  buf.write('%PDF', 0, 'ascii');
  return buf;
}

function docxBuffer(extra = 0) {
  const buf = Buffer.alloc(8 + extra);
  buf[0] = 0x50; buf[1] = 0x4B; buf[2] = 0x03; buf[3] = 0x04;
  return buf;
}

function textBuffer(content = 'Hello, world!') {
  return Buffer.from(content, 'utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
describe('validateFile — extension checks', () => {

  test('rejects file with no extension', () => {
    const result = validateFile(pdfBuffer(), 'noextension');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('no extension'));
  });

  test('rejects unsupported extension', () => {
    const result = validateFile(Buffer.from('data'), 'file.exe');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('.exe'));
    assert.ok(result.error.includes('not supported'));
  });

  test('rejects empty buffer', () => {
    const result = validateFile(Buffer.alloc(0), 'file.pdf');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('empty'));
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateFile — magic bytes', () => {

  test('accepts valid PDF with correct magic bytes', () => {
    const result = validateFile(pdfBuffer(), 'document.pdf');
    assert.equal(result.valid, true);
    assert.equal(result.extension, 'pdf');
    assert.equal(result.error, null);
  });

  test('rejects PDF extension with wrong magic bytes', () => {
    const buf = Buffer.from('This is not a PDF');
    const result = validateFile(buf, 'fake.pdf');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('header does not match'));
    assert.ok(result.error.includes('.pdf'));
  });

  test('accepts valid DOCX with correct magic bytes (PK signature)', () => {
    const result = validateFile(docxBuffer(), 'doc.docx');
    assert.equal(result.valid, true);
    assert.equal(result.extension, 'docx');
  });

  test('rejects DOCX extension with wrong magic bytes', () => {
    const buf = Buffer.from('Not a zip file at all');
    const result = validateFile(buf, 'fake.docx');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('header does not match'));
  });

  test('accepts valid markdown file', () => {
    const result = validateFile(textBuffer('# My Document\n\nContent here.'), 'readme.md');
    assert.equal(result.valid, true);
    assert.equal(result.extension, 'md');
  });

  test('accepts valid txt file', () => {
    const result = validateFile(textBuffer('Plain text content.'), 'notes.txt');
    assert.equal(result.valid, true);
    assert.equal(result.extension, 'txt');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateFile — size limits', () => {

  test('rejects file exceeding 25MB', () => {
    const bigBuffer = Buffer.alloc(26214401); // 25MB + 1 byte
    const result = validateFile(bigBuffer, 'big.txt');
    assert.equal(result.valid, false);
    assert.ok(result.error.includes('25MB'));
  });

  test('accepts file exactly at 25MB limit', () => {
    // Use PDF magic bytes so format validation passes
    const maxBuffer = Buffer.alloc(26214400);
    maxBuffer.write('%PDF', 0, 'ascii');
    const result = validateFile(maxBuffer, 'max.pdf');
    assert.equal(result.valid, true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('validateFile — extension case insensitivity', () => {

  test('accepts uppercase extension .PDF', () => {
    const result = validateFile(pdfBuffer(), 'DOCUMENT.PDF');
    assert.equal(result.valid, true);
    assert.equal(result.extension, 'pdf');
  });

  test('accepts mixed case .Docx', () => {
    const result = validateFile(docxBuffer(), 'Report.Docx');
    assert.equal(result.valid, true);
    assert.equal(result.extension, 'docx');
  });

});
