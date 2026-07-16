// leader-placeholder.test.js
// Pure-function coverage for the {leader} token resolver (session 2026-07-16).
// firstLeaderFirstName is multi-query — per Rule 37 the single-result mock
// cannot sequence it, so DB-touching paths are covered by validation tests
// in team-meetings.test.js style, not happy-path mocks.

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Inject db mock before requiring anything that touches src/db (same pattern
// as team-meetings.test.js — db.js throws at load without Supabase env vars).
const mockChain = {
  _result: { data: null, error: null },
  select() { return this; }, insert() { return this; }, update() { return this; },
  upsert() { return this; }, delete() { return this; }, eq() { return this; },
  neq() { return this; }, gte() { return this; }, in() { return this; },
  is() { return this; }, not() { return this; }, or() { return this; },
  order() { return this; }, limit() { return this; }, range() { return this; },
  single() { return Promise.resolve(this._result); },
  maybeSingle() { return Promise.resolve(this._result); },
  then(resolve) { return Promise.resolve(this._result).then(resolve); }
};
require.cache[require.resolve('../src/db')] = {
  id: require.resolve('../src/db'),
  filename: require.resolve('../src/db'),
  loaded: true,
  exports: { supabase: { from() { return mockChain; } } }
};

const { resolveLeaderPlaceholder, firstNameOf } = require('../src/leader_placeholder');

describe('resolveLeaderPlaceholder', () => {
  it('replaces a single {leader} token', () => {
    assert.equal(
      resolveLeaderPlaceholder('{leader} Communications / Reminders', 'Shirish'),
      'Shirish Communications / Reminders'
    );
  });

  it('replaces every {leader} token in the string', () => {
    assert.equal(
      resolveLeaderPlaceholder('Escalation to {leader}, Inform {leader}, Blockers', 'Vijay'),
      'Escalation to Vijay, Inform Vijay, Blockers'
    );
  });

  it('leaves text without a token unchanged', () => {
    assert.equal(
      resolveLeaderPlaceholder('Initiatives and Gates', 'Shirish'),
      'Initiatives and Gates'
    );
  });

  it("falls back to 'Leader' when no name resolves", () => {
    assert.equal(
      resolveLeaderPlaceholder('{leader} Communications / Reminders', ''),
      'Leader Communications / Reminders'
    );
  });

  it('returns empty string for null/undefined text', () => {
    assert.equal(resolveLeaderPlaceholder(null, 'Shirish'), '');
    assert.equal(resolveLeaderPlaceholder(undefined, 'Shirish'), '');
  });
});

describe('firstNameOf', () => {
  it('returns the first token of a display name', () => {
    assert.equal(firstNameOf('Shirish Bhavsar'), 'Shirish');
  });

  it('handles single-token names', () => {
    assert.equal(firstNameOf('Phil'), 'Phil');
  });

  it('trims surrounding whitespace', () => {
    assert.equal(firstNameOf('  Vijay Patil '), 'Vijay');
  });

  it('returns empty string for null/empty input', () => {
    assert.equal(firstNameOf(null), '');
    assert.equal(firstNameOf(''), '');
  });
});

describe('meeting_changed_since validation', () => {
  const { meeting_changed_since } = require('../src/tools/tracks');

  it('returns error when meeting_id is missing', async () => {
    const r = await meeting_changed_since({ focused_section_key: 'comms' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('meeting_id'));
  });
});
