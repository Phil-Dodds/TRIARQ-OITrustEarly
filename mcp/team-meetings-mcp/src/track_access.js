// track_access.js
// Pathways OI Trust — Team Meeting Tracks (Phase A+B)
// Shared access helpers: caller lookup, track membership/leader checks,
// meeting→track resolution, content_updated_at bump for polling sync.
//
// Access model:
//   - Track members interact with that track's meetings (add/edit/remove bullets, notes).
//   - Leaders additionally manage track config (name, visibility, sections, members, leaders).
//   - Admins see all tracks (opt-in toggle) incl. soft-deleted; admins may purge.
//   - Track creation restricted to TRACK_CREATOR_EMAIL.

'use strict';

const { supabase } = require('./db');

// Business rule (session 2026-07-11): only Phil can create tracks for now.
const TRACK_CREATOR_EMAIL = 'pdodds@triarqhealth.com';

/** Load caller row. Returns null if not found/deleted. */
async function getCaller(caller_user_id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** Active membership row for user on track, or null. */
async function getMembership(track_id, user_id) {
  const { data } = await supabase
    .from('team_meeting_track_members')
    .select('id, user_id, is_leader')
    .eq('track_id', track_id)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .maybeSingle();
  return data || null;
}

/** Track row (not purged), or null. Soft-deleted rows ARE returned — callers decide. */
async function getTrack(track_id) {
  const { data } = await supabase
    .from('team_meeting_tracks')
    .select('track_id, track_name, is_public, ref_panel_person_type, created_by, deleted_at')
    .eq('track_id', track_id)
    .is('purged_at', null)
    .maybeSingle();
  return data || null;
}

/**
 * Resolve meeting → { meeting, track, membership, caller }.
 * Grants access if caller is an active member of the meeting's track, or is_admin.
 * Returns { error } string on failure.
 */
async function assertMeetingAccess(meeting_id, caller_user_id) {
  const caller = await getCaller(caller_user_id);
  if (!caller) return { error: 'User not found.' };

  const { data: meeting, error: mErr } = await supabase
    .from('team_meetings')
    .select('id, track_id, title, meeting_date, created_at, updated_at, content_updated_at')
    .eq('id', meeting_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (mErr || !meeting) return { error: 'Meeting not found.' };

  let membership = null;
  if (meeting.track_id) {
    membership = await getMembership(meeting.track_id, caller_user_id);
  }
  if (!membership && !caller.is_admin) {
    return { error: 'You are not a member of this meeting series. Ask a series leader to invite you.' };
  }
  return { meeting, membership, caller };
}

/** Same as assertMeetingAccess but resolved from a section_id. */
async function assertSectionAccess(section_id, caller_user_id) {
  const { data: section, error } = await supabase
    .from('team_meeting_sections')
    .select('id, meeting_id, section_key')
    .eq('id', section_id)
    .maybeSingle();
  if (error || !section) return { error: 'Section not found.' };
  const access = await assertMeetingAccess(section.meeting_id, caller_user_id);
  if (access.error) return access;
  return { ...access, section };
}

/**
 * Track-level access. requireLeader=true additionally requires is_leader (admins pass).
 */
async function assertTrackAccess(track_id, caller_user_id, { requireLeader = false } = {}) {
  const caller = await getCaller(caller_user_id);
  if (!caller) return { error: 'User not found.' };

  const track = await getTrack(track_id);
  if (!track) return { error: 'Meeting series not found.' };
  if (track.deleted_at && !caller.is_admin) return { error: 'Meeting series not found.' };

  const membership = await getMembership(track_id, caller_user_id);
  if (!membership && !caller.is_admin) {
    return { error: 'You are not a member of this meeting series. Ask a series leader to invite you.' };
  }
  if (requireLeader && !membership?.is_leader && !caller.is_admin) {
    return { error: 'Only series leaders can do this. Ask a leader to make the change or grant you the leader role.' };
  }
  return { track, membership, caller };
}

/** Bump content_updated_at on a meeting — drives the 10s polling optimization. */
async function bumpMeeting(meeting_id) {
  await supabase
    .from('team_meetings')
    .update({ content_updated_at: new Date().toISOString() })
    .eq('id', meeting_id);
}

/** Bump via section_id. */
async function bumpMeetingBySection(section_id) {
  const { data: section } = await supabase
    .from('team_meeting_sections')
    .select('meeting_id')
    .eq('id', section_id)
    .maybeSingle();
  if (section?.meeting_id) await bumpMeeting(section.meeting_id);
}

/**
 * Parse an Outlook-style recipient string into unique lowercase emails.
 * Accepts: "a@x.com", "a@x.com; b@x.com", "Name One <a@x.com>; Name Two <b@x.com>",
 * comma or semicolon separated, newlines tolerated.
 */
function parseEmails(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const parts = raw.split(/[;,\n]+/);
  const emails = [];
  for (const part of parts) {
    const angled = part.match(/<([^<>]+)>/);
    const candidate = (angled ? angled[1] : part).trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) && !emails.includes(candidate)) {
      emails.push(candidate);
    }
  }
  return emails;
}

module.exports = {
  TRACK_CREATOR_EMAIL,
  getCaller,
  getMembership,
  getTrack,
  assertMeetingAccess,
  assertSectionAccess,
  assertTrackAccess,
  bumpMeeting,
  bumpMeetingBySection,
  parseEmails
};
