// team-meetings.test.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Tests: happy path + error path per tool per coding standards.
// Run with: node --test tests/

'use strict';

const { describe, it, before, mock } = require('node:test');
const assert = require('node:assert/strict');

// ── Mock Supabase ─────────────────────────────────────────────────────────────
// Replace db.js with a controllable mock before requiring tools.

const mockChain = {
  _result: { data: null, error: null },
  _setResult(data, error = null) { this._result = { data, error }; return this; },
  select() { return this; },
  insert() { return this; },
  update() { return this; },
  upsert() { return this; },
  delete() { return this; },
  eq()     { return this; },
  neq()    { return this; },
  in()     { return this; },
  is()     { return this; },
  order()  { return this; },
  limit()  { return this; },
  range()  { return this; },
  single() { return Promise.resolve(this._result); },
  maybeSingle() { return Promise.resolve(this._result); },
  then(resolve) { return Promise.resolve(this._result).then(resolve); }
};

const mockSupabase = {
  from() { return mockChain; },
  auth: { getUser: async () => ({ data: { user: { id: 'user-1', email: 'test@test.com' } }, error: null }) }
};

// Inject mock before requiring tools.
require.cache[require.resolve('../src/db')] = {
  id: require.resolve('../src/db'),
  filename: require.resolve('../src/db'),
  loaded: true,
  exports: { supabase: mockSupabase }
};

const { create_team_meeting }      = require('../src/tools/create_team_meeting');
const { list_team_meetings }       = require('../src/tools/list_team_meetings');
const { get_team_meeting }         = require('../src/tools/get_team_meeting');
const { add_meeting_bullet }       = require('../src/tools/add_meeting_bullet');
const { remove_meeting_bullet }    = require('../src/tools/remove_meeting_bullet');
const { update_meeting_notes }     = require('../src/tools/update_meeting_notes');
const { carry_forward_bullet }     = require('../src/tools/carry_forward_bullet');

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminCaller(extraData = {}) {
  mockChain._setResult({ data: { is_admin: true, ...extraData }, error: null });
}

function nonAdminCaller() {
  mockChain._setResult({ data: { is_admin: false }, error: null });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('create_team_meeting', () => {
  it('returns error when title is missing', async () => {
    adminCaller();
    const r = await create_team_meeting({ meeting_date: '2026-07-07' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('title'));
  });

  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await create_team_meeting({ title: 'Test', meeting_date: '2026-07-07' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('list_team_meetings', () => {
  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await list_team_meetings({}, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('get_team_meeting', () => {
  it('returns error when meeting_id is missing', async () => {
    adminCaller();
    const r = await get_team_meeting({}, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('meeting_id'));
  });

  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await get_team_meeting({ meeting_id: 'mtg-1' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('add_meeting_bullet', () => {
  it('returns error when section_id is missing', async () => {
    adminCaller();
    const r = await add_meeting_bullet({ text: 'hello' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('section_id'));
  });

  it('returns error when text is missing', async () => {
    adminCaller();
    const r = await add_meeting_bullet({ section_id: 'sec-1' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('text'));
  });

  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await add_meeting_bullet({ section_id: 'sec-1', text: 'hello' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('remove_meeting_bullet', () => {
  it('returns error when bullet_id is missing', async () => {
    adminCaller();
    const r = await remove_meeting_bullet({}, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('bullet_id'));
  });

  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await remove_meeting_bullet({ bullet_id: 'b-1' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('update_meeting_notes', () => {
  it('returns error when section_id is missing', async () => {
    adminCaller();
    const r = await update_meeting_notes({ notes_text: 'hello' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('section_id'));
  });

  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await update_meeting_notes({ section_id: 'sec-1', notes_text: 'hello' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('carry_forward_bullet', () => {
  it('returns error when source_bullet_id is missing', async () => {
    adminCaller();
    const r = await carry_forward_bullet({ target_meeting_id: 'mtg-2' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('source_bullet_id'));
  });

  it('returns error when target_meeting_id is missing', async () => {
    adminCaller();
    const r = await carry_forward_bullet({ source_bullet_id: 'b-1' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('target_meeting_id'));
  });

  it('returns error for non-admin caller', async () => {
    nonAdminCaller();
    const r = await carry_forward_bullet({ source_bullet_id: 'b-1', target_meeting_id: 'mtg-2' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('Admin'));
  });
});

describe('move_section', () => {
  const { move_section } = require('../src/tools/move_section');

  it('returns error when section_id is missing', async () => {
    const r = await move_section({ target_section_id: 'sec-2' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('section_id'));
  });

  it('returns error when target_section_id is missing', async () => {
    const r = await move_section({ section_id: 'sec-1' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('target_section_id'));
  });

  it('no-ops when dragged onto itself', async () => {
    const r = await move_section({ section_id: 'sec-1', target_section_id: 'sec-1' }, 'user-1');
    assert.equal(r.success, true);
    assert.equal(r.data.section_id, 'sec-1');
  });
});

describe('update_bullet_text', () => {
  const { update_bullet_text } = require('../src/tools/update_bullet_text');

  it('returns error when bullet_id is missing', async () => {
    const r = await update_bullet_text({ text: 'hello' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('bullet_id'));
  });

  it('returns error when text is missing or blank', async () => {
    const r = await update_bullet_text({ bullet_id: 'b-1', text: '   ' }, 'user-1');
    assert.equal(r.success, false);
    assert.ok(r.error.includes('text'));
  });
});
