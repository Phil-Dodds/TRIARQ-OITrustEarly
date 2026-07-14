// latest_activity.js
// Pathways OI Trust — team-meetings-mcp
// Latest content activity per meeting for the list previews (Phil 2026-07-14):
// the newest of (bullet added — created_at; bullets carry no updated_at, so
// text edits don't refresh the preview, acceptable v1) and (non-empty section
// note edit — updated_at). One truncated plain-text line so list screens show
// WHAT changed without opening the meeting; the unread bold shows THAT it did.

'use strict';

const { supabase } = require('./db');

const SNIPPET_LEN = 110;

function toSnippet(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length > SNIPPET_LEN ? `${t.slice(0, SNIPPET_LEN).trimEnd()}…` : t;
}

/**
 * @param {string[]} meetingIds
 * @returns Map<meeting_id, { at, snippet, author_name, section_title }>
 */
async function latestActivityByMeeting(meetingIds) {
  const result = new Map();
  if (!meetingIds?.length) return result;

  const { data: sections } = await supabase
    .from('team_meeting_sections')
    .select('id, meeting_id, title')
    .in('meeting_id', meetingIds)
    .is('deleted_at', null);
  const sectionMeta = new Map((sections || []).map(s => [s.id, s]));
  const sectionIds  = [...sectionMeta.keys()];
  if (!sectionIds.length) return result;

  // Newest-first, bounded — list screens look at ≤ ~20 meetings, so the top
  // slices comfortably contain each meeting's newest item.
  const [{ data: bullets }, { data: notes }] = await Promise.all([
    supabase.from('team_meeting_bullets')
      .select('section_id, text, created_at, created_by')
      .in('section_id', sectionIds)
      .order('created_at', { ascending: false })
      .limit(400),
    supabase.from('team_meeting_notes')
      .select('section_id, notes_text, updated_at, updated_by')
      .in('section_id', sectionIds)
      .neq('notes_text', '')
      .order('updated_at', { ascending: false })
      .limit(200)
  ]);

  const best = new Map(); // meeting_id → { at, text, userId, sectionTitle }
  const consider = (sectionId, at, text, userId) => {
    const meta = sectionMeta.get(sectionId);
    if (!meta || !at || !(text || '').trim()) return;
    const cur = best.get(meta.meeting_id);
    if (!cur || new Date(at).getTime() > new Date(cur.at).getTime()) {
      best.set(meta.meeting_id, { at, text, userId: userId ?? null, sectionTitle: meta.title });
    }
  };
  (bullets || []).forEach(b => consider(b.section_id, b.created_at, b.text, b.created_by));
  (notes   || []).forEach(n => consider(n.section_id, n.updated_at, n.notes_text, n.updated_by));

  const userIds = [...new Set([...best.values()].map(x => x.userId).filter(Boolean))];
  const nameById = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from('users').select('id, display_name').in('id', userIds);
    (users || []).forEach(u => { nameById[u.id] = u.display_name; });
  }

  for (const [meetingId, x] of best) {
    result.set(meetingId, {
      at:            x.at,
      snippet:       toSnippet(x.text),
      author_name:   x.userId ? (nameById[x.userId] ?? null) : null,
      section_title: x.sectionTitle
    });
  }
  return result;
}

module.exports = { latestActivityByMeeting };
