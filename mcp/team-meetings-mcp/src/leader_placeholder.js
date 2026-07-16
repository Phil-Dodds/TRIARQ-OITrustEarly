// leader_placeholder.js
// Pathways OI Trust — session 2026-07-16
// The shared section catalog stores a literal {leader} token in titles and
// sub-labels (migration 071). This module resolves that token to a series
// leader's first name at snapshot time (create_track / add_track_section)
// and at catalog-list time when track context is supplied.

'use strict';

const { supabase } = require('./db');

const LEADER_TOKEN = /\{leader\}/g;

/** Replace every {leader} token. Empty/unknown name falls back to 'Leader'. */
function resolveLeaderPlaceholder(text, leaderFirstName) {
  if (!text) return text ?? '';
  return text.replace(LEADER_TOKEN, leaderFirstName || 'Leader');
}

/** First token of a display name — 'Shirish Bhavsar' → 'Shirish'. */
function firstNameOf(displayName) {
  return (displayName || '').trim().split(/\s+/)[0] || '';
}

/**
 * First leader's first name for a track: earliest active leader membership,
 * falling back to the track creator. Returns '' when nothing resolves
 * (resolveLeaderPlaceholder then falls back to 'Leader').
 */
async function firstLeaderFirstName(track_id) {
  const { data: leaders } = await supabase
    .from('team_meeting_track_members')
    .select('user_id, created_at')
    .eq('track_id', track_id)
    .eq('is_leader', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1);

  let leaderUserId = leaders?.[0]?.user_id ?? null;
  if (!leaderUserId) {
    const { data: track } = await supabase
      .from('team_meeting_tracks')
      .select('created_by')
      .eq('track_id', track_id)
      .maybeSingle();
    leaderUserId = track?.created_by ?? null;
  }
  if (!leaderUserId) return '';

  const { data: leaderUser } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', leaderUserId)
    .maybeSingle();
  return firstNameOf(leaderUser?.display_name);
}

module.exports = { resolveLeaderPlaceholder, firstNameOf, firstLeaderFirstName };
