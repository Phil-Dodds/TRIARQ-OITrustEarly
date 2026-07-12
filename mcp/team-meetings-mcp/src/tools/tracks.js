// tracks.js
// Pathways OI Trust — Team Meeting Tracks (Phase A+B)
// Track/series CRUD, membership, leaders, sections, public join, catalog.
// JWT validated by middleware before any tool runs (Arch-5).

'use strict';

const { supabase } = require('../db');
const {
  TRACK_CREATOR_EMAIL, getCaller, getMembership, getTrack,
  assertTrackAccess, parseEmails
} = require('../track_access');
const { suggestNextMeetingDate, validateCadence } = require('../cadence');

// ── list_my_tracks ─────────────────────────────────────────────────────────────
// Tracks where caller is an active member. Admin + include_all=true → every
// non-purged track (incl. soft-deleted, flagged).
async function list_my_tracks(params, caller_user_id) {
  const caller = await getCaller(caller_user_id);
  if (!caller) return { success: false, error: 'User not found.' };

  const includeAll = !!params.include_all && caller.is_admin;

  let trackIds = null; // null = all (admin mode)
  let membershipByTrack = {};

  const { data: memberships, error: memErr } = await supabase
    .from('team_meeting_track_members')
    .select('track_id, is_leader')
    .eq('user_id', caller_user_id)
    .is('deleted_at', null);
  if (memErr) return { success: false, error: memErr.message };
  (memberships || []).forEach(m => { membershipByTrack[m.track_id] = m; });

  if (!includeAll) {
    trackIds = (memberships || []).map(m => m.track_id);
    if (!trackIds.length) return { success: true, data: [] };
  }

  let query = supabase
    .from('team_meeting_tracks')
    .select('track_id, track_name, is_public, ref_panel_person_type, created_by, created_at, deleted_at')
    .is('purged_at', null)
    .order('track_name', { ascending: true });
  if (trackIds) query = query.in('track_id', trackIds).is('deleted_at', null);

  const { data: tracks, error: tErr } = await query;
  if (tErr) return { success: false, error: tErr.message };
  if (!tracks?.length) return { success: true, data: [] };

  const ids = tracks.map(t => t.track_id);

  // Member counts.
  const { data: allMembers } = await supabase
    .from('team_meeting_track_members')
    .select('track_id')
    .in('track_id', ids)
    .is('deleted_at', null);
  const memberCount = {};
  (allMembers || []).forEach(m => { memberCount[m.track_id] = (memberCount[m.track_id] || 0) + 1; });

  // Latest meeting per track.
  const { data: meetings } = await supabase
    .from('team_meetings')
    .select('id, track_id, title, meeting_date, created_at')
    .in('track_id', ids)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const latestByTrack = {};
  (meetings || []).forEach(m => { if (!latestByTrack[m.track_id]) latestByTrack[m.track_id] = m; });

  return {
    success: true,
    data: tracks.map(t => ({
      track_id:              t.track_id,
      track_name:            t.track_name,
      is_public:             t.is_public,
      ref_panel_person_type: t.ref_panel_person_type,
      is_member:             !!membershipByTrack[t.track_id],
      is_leader:             !!membershipByTrack[t.track_id]?.is_leader,
      member_count:          memberCount[t.track_id] || 0,
      latest_meeting:        latestByTrack[t.track_id]
                               ? { id: latestByTrack[t.track_id].id, title: latestByTrack[t.track_id].title, meeting_date: latestByTrack[t.track_id].meeting_date }
                               : null,
      deleted_at:            t.deleted_at
    }))
  };
}

// ── create_track ───────────────────────────────────────────────────────────────
// Restricted to TRACK_CREATOR_EMAIL.
// sections (optional, from a meeting template): [{ section_key?, title, sub_label?, bar_color? }].
//   - section_key matching a catalog row links it (catalog_id + key; provided
//     title/sub_label override catalog values when given).
//   - no section_key (or no catalog match) → custom section.
//   - omitted entirely → seeds all active catalog sections (Blank behavior).
// meeting_cadence (optional): validated cadence object (template suggestion).
async function create_track(params, caller_user_id) {
  const { track_name, is_public, sections, meeting_cadence } = params;
  if (!track_name?.trim()) return { success: false, error: 'track_name is required.' };

  const cadErr = validateCadence(meeting_cadence ?? null);
  if (cadErr) return { success: false, error: cadErr };

  const caller = await getCaller(caller_user_id);
  if (!caller) return { success: false, error: 'User not found.' };
  if (caller.email?.toLowerCase() !== TRACK_CREATOR_EMAIL) {
    return { success: false, error: 'Creating meeting series is currently restricted. Contact Phil Dodds to have a series created.' };
  }

  const { data: track, error: tErr } = await supabase
    .from('team_meeting_tracks')
    .insert({
      track_name: track_name.trim(),
      is_public: !!is_public,
      created_by: caller_user_id,
      ...(meeting_cadence ? { meeting_cadence } : {})
    })
    .select()
    .single();
  if (tErr) return { success: false, error: `Failed to create series: ${tErr.message}` };

  const { error: mErr } = await supabase
    .from('team_meeting_track_members')
    .insert({ track_id: track.track_id, user_id: caller_user_id, is_leader: true });
  if (mErr) return { success: false, error: `Series created but membership failed: ${mErr.message}` };

  const { data: catalog } = await supabase
    .from('team_meeting_section_catalog')
    .select('id, section_key, title, sub_label, bar_color, sort_order')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  let rows;
  if (Array.isArray(sections) && sections.length) {
    const { randomUUID } = require('crypto');
    const catalogByKey = {};
    (catalog || []).forEach(c => { catalogByKey[c.section_key] = c; });
    rows = sections
      .filter(s => s?.title?.trim() || catalogByKey[s?.section_key])
      .map((s, i) => {
        const cat = s.section_key ? catalogByKey[s.section_key] : null;
        return {
          track_id:    track.track_id,
          catalog_id:  cat?.id ?? null,
          section_key: cat?.section_key ?? `custom-${randomUUID()}`,
          title:       (s.title?.trim()) || cat.title,
          sub_label:   s.sub_label !== undefined ? (s.sub_label || '').trim() : (cat?.sub_label ?? ''),
          bar_color:   s.bar_color || cat?.bar_color || '#5A5A5A',
          sort_order:  i + 1
        };
      });
  } else {
    // Blank / default: seed all active catalog sections — leader trims in setup.
    rows = (catalog || []).map(c => ({
      track_id: track.track_id, catalog_id: c.id, section_key: c.section_key,
      title: c.title, sub_label: c.sub_label, bar_color: c.bar_color, sort_order: c.sort_order
    }));
  }
  if (rows.length) {
    const { error: sErr } = await supabase.from('team_meeting_track_sections').insert(rows);
    if (sErr) return { success: false, error: `Series created but sections failed: ${sErr.message}` };
  }

  return { success: true, data: track };
}

// ── get_track ──────────────────────────────────────────────────────────────────
async function get_track(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  const { track, membership, caller } = access;

  const { data: memberRows } = await supabase
    .from('team_meeting_track_members')
    .select('id, user_id, is_leader, created_at')
    .eq('track_id', track_id)
    .is('deleted_at', null);

  const userIds = (memberRows || []).map(m => m.user_id);
  let userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', userIds);
    (users || []).forEach(u => { userMap[u.id] = u; });
  }

  const { data: sections } = await supabase
    .from('team_meeting_track_sections')
    .select('id, catalog_id, section_key, title, sub_label, bar_color, sort_order, presenter_user_id')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  const { data: latest } = await supabase
    .from('team_meetings')
    .select('id, title, meeting_date, created_at')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Cadence lives on the track row; getTrack() helper doesn't select it — fetch here.
  const { data: cadRow } = await supabase
    .from('team_meeting_tracks')
    .select('meeting_cadence')
    .eq('track_id', track_id)
    .maybeSingle();
  const meeting_cadence = cadRow?.meeting_cadence ?? null;

  return {
    success: true,
    data: {
      track_id:              track.track_id,
      track_name:            track.track_name,
      is_public:             track.is_public,
      ref_panel_person_type: track.ref_panel_person_type,
      meeting_cadence,
      suggested_next_meeting_date: suggestNextMeetingDate(meeting_cadence, latest?.meeting_date ?? null),
      deleted_at:            track.deleted_at,
      is_leader:             !!membership?.is_leader || caller.is_admin,
      is_member:             !!membership,
      members: (memberRows || [])
        .map(m => ({
          user_id:      m.user_id,
          display_name: userMap[m.user_id]?.display_name ?? '(unknown)',
          email:        userMap[m.user_id]?.email ?? '',
          is_leader:    m.is_leader
        }))
        .sort((a, b) => (b.is_leader - a.is_leader) || a.display_name.localeCompare(b.display_name)),
      sections: sections || [],
      latest_meeting: latest ? { id: latest.id, title: latest.title, meeting_date: latest.meeting_date } : null
    }
  };
}

// ── update_track ───────────────────────────────────────────────────────────────
// Leader only. track_name / is_public / ref_panel_person_type.
async function update_track(params, caller_user_id) {
  const { track_id, track_name, is_public, ref_panel_person_type, meeting_cadence } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const patch = {};
  if (track_name !== undefined) {
    if (!track_name?.trim()) return { success: false, error: 'track_name cannot be empty.' };
    patch.track_name = track_name.trim();
  }
  if (is_public !== undefined) patch.is_public = !!is_public;
  if (ref_panel_person_type !== undefined) {
    if (!['dcs', 'dol', 'epo'].includes(ref_panel_person_type)) {
      return { success: false, error: 'ref_panel_person_type must be dcs, dol, or epo.' };
    }
    patch.ref_panel_person_type = ref_panel_person_type;
  }
  if (meeting_cadence !== undefined) {
    const cadErr = validateCadence(meeting_cadence);
    if (cadErr) return { success: false, error: cadErr };
    patch.meeting_cadence = meeting_cadence;   // null clears the cadence
  }
  if (!Object.keys(patch).length) return { success: false, error: 'Nothing to update.' };

  const { error } = await supabase
    .from('team_meeting_tracks')
    .update(patch)
    .eq('track_id', track_id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { track_id, ...patch } };
}

// ── delete_track (soft) / purge_track (admin) ──────────────────────────────────
async function delete_track(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const { error } = await supabase
    .from('team_meeting_tracks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('track_id', track_id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { track_id } };
}

// Sets purged_at — track becomes invisible to everyone; data retained (Arch-6 1b).
async function purge_track(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const caller = await getCaller(caller_user_id);
  if (!caller?.is_admin) return { success: false, error: 'Only Admins can purge a deleted series.' };

  const track = await getTrack(track_id);
  if (!track) return { success: false, error: 'Meeting series not found.' };
  if (!track.deleted_at) return { success: false, error: 'Series must be deleted before it can be purged.' };

  const { error } = await supabase
    .from('team_meeting_tracks')
    .update({ purged_at: new Date().toISOString() })
    .eq('track_id', track_id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { track_id } };
}

// Admin restore of a soft-deleted series.
async function restore_track(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const caller = await getCaller(caller_user_id);
  if (!caller?.is_admin) return { success: false, error: 'Only Admins can restore a deleted series.' };

  const { error } = await supabase
    .from('team_meeting_tracks')
    .update({ deleted_at: null })
    .eq('track_id', track_id)
    .is('purged_at', null);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { track_id } };
}

// ── add_track_members ──────────────────────────────────────────────────────────
// Leader only. Accepts Outlook-format email string. Unknown emails rejected with report.
async function add_track_members(params, caller_user_id) {
  const { track_id, emails } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const parsed = parseEmails(emails);
  if (!parsed.length) return { success: false, error: 'No valid email addresses found in the input.' };

  const { data: users } = await supabase
    .from('users')
    .select('id, email, display_name')
    .in('email', parsed)
    .is('deleted_at', null);
  const byEmail = {};
  (users || []).forEach(u => { byEmail[u.email.toLowerCase()] = u; });

  const added = [], already = [], not_found = [];
  for (const email of parsed) {
    const user = byEmail[email];
    if (!user) { not_found.push(email); continue; }

    const { data: existing } = await supabase
      .from('team_meeting_track_members')
      .select('id, deleted_at')
      .eq('track_id', track_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing && !existing.deleted_at) {
      already.push({ email, display_name: user.display_name });
    } else if (existing) {
      // Reactivate removed membership.
      await supabase.from('team_meeting_track_members')
        .update({ deleted_at: null, is_leader: false })
        .eq('id', existing.id);
      added.push({ email, display_name: user.display_name });
    } else {
      await supabase.from('team_meeting_track_members')
        .insert({ track_id, user_id: user.id, is_leader: false });
      added.push({ email, display_name: user.display_name });
    }
  }

  return { success: true, data: { added, already, not_found } };
}

// ── remove_track_member ────────────────────────────────────────────────────────
// Leader removes anyone; any member removes self (leave). Authored bullets stay.
async function remove_track_member(params, caller_user_id) {
  const { track_id, user_id } = params;
  if (!track_id || !user_id) return { success: false, error: 'track_id and user_id are required.' };

  const access = await assertTrackAccess(track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const isSelf = user_id === caller_user_id;
  if (!isSelf && !access.membership?.is_leader && !access.caller.is_admin) {
    return { success: false, error: 'Only series leaders can remove other members.' };
  }

  const { error } = await supabase
    .from('team_meeting_track_members')
    .update({ deleted_at: new Date().toISOString() })
    .eq('track_id', track_id)
    .eq('user_id', user_id)
    .is('deleted_at', null);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { track_id, user_id } };
}

// ── set_track_leader ───────────────────────────────────────────────────────────
// Only leaders (or admins) grant/revoke the leader role.
async function set_track_leader(params, caller_user_id) {
  const { track_id, user_id, is_leader } = params;
  if (!track_id || !user_id || is_leader === undefined) {
    return { success: false, error: 'track_id, user_id, and is_leader are required.' };
  }

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const target = await getMembership(track_id, user_id);
  if (!target) return { success: false, error: 'That user is not a member of this series.' };

  const { error } = await supabase
    .from('team_meeting_track_members')
    .update({ is_leader: !!is_leader })
    .eq('id', target.id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { track_id, user_id, is_leader: !!is_leader } };
}

// ── list_public_tracks ─────────────────────────────────────────────────────────
// Any user. Name + leaders + most recent meeting title/date + is_member.
async function list_public_tracks(params, caller_user_id) {
  const caller = await getCaller(caller_user_id);
  if (!caller) return { success: false, error: 'User not found.' };

  const { data: tracks, error } = await supabase
    .from('team_meeting_tracks')
    .select('track_id, track_name, created_at')
    .eq('is_public', true)
    .is('deleted_at', null)
    .is('purged_at', null)
    .order('track_name', { ascending: true });
  if (error) return { success: false, error: error.message };
  if (!tracks?.length) return { success: true, data: [] };

  const ids = tracks.map(t => t.track_id);

  const { data: members } = await supabase
    .from('team_meeting_track_members')
    .select('track_id, user_id, is_leader')
    .in('track_id', ids)
    .is('deleted_at', null);

  const leaderIds = [...new Set((members || []).filter(m => m.is_leader).map(m => m.user_id))];
  let nameMap = {};
  if (leaderIds.length) {
    const { data: users } = await supabase.from('users').select('id, display_name').in('id', leaderIds);
    (users || []).forEach(u => { nameMap[u.id] = u.display_name; });
  }

  const { data: meetings } = await supabase
    .from('team_meetings')
    .select('track_id, title, meeting_date, created_at')
    .in('track_id', ids)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  const latestByTrack = {};
  (meetings || []).forEach(m => { if (!latestByTrack[m.track_id]) latestByTrack[m.track_id] = m; });

  return {
    success: true,
    data: tracks.map(t => ({
      track_id:   t.track_id,
      track_name: t.track_name,
      leaders:    (members || []).filter(m => m.track_id === t.track_id && m.is_leader)
                    .map(m => nameMap[m.user_id]).filter(Boolean),
      latest_meeting: latestByTrack[t.track_id]
        ? { title: latestByTrack[t.track_id].title, meeting_date: latestByTrack[t.track_id].meeting_date }
        : null,
      is_member: (members || []).some(m => m.track_id === t.track_id && m.user_id === caller_user_id)
    }))
  };
}

// ── join_public_track ──────────────────────────────────────────────────────────
// Instant join for public tracks.
async function join_public_track(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const caller = await getCaller(caller_user_id);
  if (!caller) return { success: false, error: 'User not found.' };

  const track = await getTrack(track_id);
  if (!track || track.deleted_at) return { success: false, error: 'Meeting series not found.' };
  if (!track.is_public) {
    return { success: false, error: 'This series is private. Ask a series leader to invite you.' };
  }

  const { data: existing } = await supabase
    .from('team_meeting_track_members')
    .select('id, deleted_at')
    .eq('track_id', track_id)
    .eq('user_id', caller_user_id)
    .maybeSingle();

  if (existing && !existing.deleted_at) return { success: true, data: { track_id, already_member: true } };
  if (existing) {
    await supabase.from('team_meeting_track_members')
      .update({ deleted_at: null, is_leader: false }).eq('id', existing.id);
  } else {
    await supabase.from('team_meeting_track_members')
      .insert({ track_id, user_id: caller_user_id, is_leader: false });
  }
  return { success: true, data: { track_id, already_member: false } };
}

// ── Section template management ────────────────────────────────────────────────

// add_track_section — leader. From catalog (catalog_id) or custom (title).
// If meeting_id supplied, also snapshots the section into that live meeting.
async function add_track_section(params, caller_user_id) {
  const { track_id, catalog_id, title, sub_label, bar_color, meeting_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };
  if (!catalog_id && !title?.trim()) return { success: false, error: 'catalog_id or title is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  let row;
  if (catalog_id) {
    const { data: cat } = await supabase
      .from('team_meeting_section_catalog')
      .select('id, section_key, title, sub_label, bar_color')
      .eq('id', catalog_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!cat) return { success: false, error: 'Catalog section not found.' };
    row = { catalog_id: cat.id, section_key: cat.section_key, title: cat.title, sub_label: cat.sub_label, bar_color: cat.bar_color };
  } else {
    const { randomUUID } = require('crypto');
    row = {
      catalog_id: null,
      section_key: `custom-${randomUUID()}`,
      title: title.trim(),
      sub_label: (sub_label || '').trim(),
      bar_color: bar_color || '#5A5A5A'
    };
  }

  // Reactivate soft-deleted template row for same key (catalog re-add).
  const { data: existing } = await supabase
    .from('team_meeting_track_sections')
    .select('id, deleted_at')
    .eq('track_id', track_id)
    .eq('section_key', row.section_key)
    .maybeSingle();
  if (existing && !existing.deleted_at) return { success: false, error: 'That section is already in this series.' };

  const { data: maxRow } = await supabase
    .from('team_meeting_track_sections')
    .select('sort_order')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  let trackSection;
  if (existing) {
    const { data, error } = await supabase
      .from('team_meeting_track_sections')
      .update({ deleted_at: null, sort_order, title: row.title, sub_label: row.sub_label, bar_color: row.bar_color })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    trackSection = data;
  } else {
    const { data, error } = await supabase
      .from('team_meeting_track_sections')
      .insert({ track_id, ...row, sort_order })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    trackSection = data;
  }

  // Optionally snapshot into the live meeting.
  let meetingSection = null;
  if (meeting_id) {
    const { data: meeting } = await supabase
      .from('team_meetings')
      .select('id, track_id')
      .eq('id', meeting_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (meeting?.track_id === track_id) {
      // UNIQUE(meeting_id, section_key): reactivate a previously removed section
      // instead of inserting a duplicate.
      const { data: existingMs } = await supabase
        .from('team_meeting_sections')
        .select('id, deleted_at')
        .eq('meeting_id', meeting_id)
        .eq('section_key', trackSection.section_key)
        .maybeSingle();

      const { data: maxMs } = await supabase
        .from('team_meeting_sections')
        .select('sort_order')
        .eq('meeting_id', meeting_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextSort = (maxMs?.sort_order ?? 0) + 1;

      let ms = null, msErr = null;
      if (existingMs) {
        ({ data: ms, error: msErr } = await supabase
          .from('team_meeting_sections')
          .update({
            deleted_at: null,
            title: trackSection.title,
            sub_label: trackSection.sub_label,
            bar_color: trackSection.bar_color,
            sort_order: nextSort
          })
          .eq('id', existingMs.id)
          .select()
          .single());
      } else {
        ({ data: ms, error: msErr } = await supabase
          .from('team_meeting_sections')
          .insert({
            meeting_id,
            section_key: trackSection.section_key,
            title: trackSection.title,
            sub_label: trackSection.sub_label,
            bar_color: trackSection.bar_color,
            sort_order: nextSort
          })
          .select()
          .single());
      }
      if (!msErr) {
        meetingSection = ms;
        const { bumpMeeting } = require('../track_access');
        await bumpMeeting(meeting_id);
      }
    }
  }

  return { success: true, data: { track_section: trackSection, meeting_section: meetingSection } };
}

// update_track_section — leader. Edits title/sub_label on a series section.
// If meeting_id supplied, the matching section in that meeting updates too
// (snapshot model: other past meetings keep their original title).
async function update_track_section(params, caller_user_id) {
  const { track_id, track_section_id, title, sub_label, meeting_id } = params;
  if (!track_id || !track_section_id) return { success: false, error: 'track_id and track_section_id are required.' };
  if (title !== undefined && !title?.trim()) return { success: false, error: 'title cannot be empty.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const { data: ts } = await supabase
    .from('team_meeting_track_sections')
    .select('id, section_key')
    .eq('id', track_section_id)
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!ts) return { success: false, error: 'Section not found in this series.' };

  const patch = {};
  if (title !== undefined)     patch.title     = title.trim();
  if (sub_label !== undefined) patch.sub_label = (sub_label || '').trim();
  if (!Object.keys(patch).length) return { success: false, error: 'Nothing to update.' };

  const { error } = await supabase
    .from('team_meeting_track_sections')
    .update(patch)
    .eq('id', ts.id);
  if (error) return { success: false, error: error.message };

  if (meeting_id) {
    await supabase
      .from('team_meeting_sections')
      .update(patch)
      .eq('meeting_id', meeting_id)
      .eq('section_key', ts.section_key);
    const { bumpMeeting } = require('../track_access');
    await bumpMeeting(meeting_id);
  }

  return { success: true, data: { track_section_id, ...patch } };
}

// remove_track_section — leader. Soft-deletes template row (future meetings drop it).
// If meeting_id supplied, also soft-deletes the matching section in that meeting.
// Past meetings keep their snapshot.
async function remove_track_section(params, caller_user_id) {
  const { track_id, track_section_id, meeting_id } = params;
  if (!track_id || !track_section_id) return { success: false, error: 'track_id and track_section_id are required.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const { data: ts } = await supabase
    .from('team_meeting_track_sections')
    .select('id, section_key')
    .eq('id', track_section_id)
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!ts) return { success: false, error: 'Section not found in this series.' };

  const { error } = await supabase
    .from('team_meeting_track_sections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', ts.id);
  if (error) return { success: false, error: error.message };

  if (meeting_id) {
    await supabase
      .from('team_meeting_sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('meeting_id', meeting_id)
      .eq('section_key', ts.section_key);
    const { bumpMeeting } = require('../track_access');
    await bumpMeeting(meeting_id);
  }

  return { success: true, data: { track_section_id } };
}

// reorder_track_sections — leader. ordered_ids = full list of active section ids in new order.
async function reorder_track_sections(params, caller_user_id) {
  const { track_id, ordered_ids } = params;
  if (!track_id || !Array.isArray(ordered_ids) || !ordered_ids.length) {
    return { success: false, error: 'track_id and ordered_ids are required.' };
  }

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  for (let i = 0; i < ordered_ids.length; i++) {
    await supabase
      .from('team_meeting_track_sections')
      .update({ sort_order: i + 1 })
      .eq('id', ordered_ids[i])
      .eq('track_id', track_id);
  }
  return { success: true, data: { track_id } };
}

// ── Section catalog (shared list) ──────────────────────────────────────────────

// Any authenticated user can read the catalog (for series setup).
async function list_section_catalog(params, caller_user_id) {
  const caller = await getCaller(caller_user_id);
  if (!caller) return { success: false, error: 'User not found.' };

  const { data, error } = await supabase
    .from('team_meeting_section_catalog')
    .select('id, section_key, title, sub_label, bar_color, sort_order')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

// Admin-only create/update of a catalog section.
async function save_catalog_section(params, caller_user_id) {
  const { id, title, sub_label, bar_color, sort_order } = params;

  const caller = await getCaller(caller_user_id);
  if (!caller?.is_admin) return { success: false, error: 'Only Admins can manage the shared section list.' };
  if (!title?.trim()) return { success: false, error: 'title is required.' };

  if (id) {
    const { data, error } = await supabase
      .from('team_meeting_section_catalog')
      .update({
        title: title.trim(),
        sub_label: (sub_label || '').trim(),
        bar_color: bar_color || '#5A5A5A',
        ...(sort_order !== undefined ? { sort_order } : {})
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  const { randomUUID } = require('crypto');
  const { data: maxRow } = await supabase
    .from('team_meeting_section_catalog')
    .select('sort_order')
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('team_meeting_section_catalog')
    .insert({
      section_key: `catalog-${randomUUID()}`,
      title: title.trim(),
      sub_label: (sub_label || '').trim(),
      bar_color: bar_color || '#5A5A5A',
      sort_order: sort_order ?? ((maxRow?.sort_order ?? 0) + 1)
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// Admin-only soft delete of a catalog section. Tracks using it keep their template rows.
async function delete_catalog_section(params, caller_user_id) {
  const { id } = params;
  if (!id) return { success: false, error: 'id is required.' };

  const caller = await getCaller(caller_user_id);
  if (!caller?.is_admin) return { success: false, error: 'Only Admins can manage the shared section list.' };

  const { error } = await supabase
    .from('team_meeting_section_catalog')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { id } };
}

// ── Presenter sections (session 2026-07-12) ────────────────────────────────────
// One section per participant for their action items / escalations / blockers /
// accomplishments. Stable section_key 'presenter-<user_id>' matches across
// meetings (carry-forward + pull-from-last work automatically).

const PRESENTER_SUB_LABEL = 'Action Items, Escalations, Blockers, Accomplishments';
const PRESENTER_COLORS = [
  '#257099','#534AB7','#E96127','#0071AF','#5A5A5A',
  '#F2A620','#4CAF50','#D32F2F','#795548','#607D8B'
];
function presenterColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PRESENTER_COLORS[h % PRESENTER_COLORS.length];
}

/** Internal: create/reactivate one presenter template section (+ optional live meeting snapshot). */
async function upsertPresenterSection(track_id, user, meeting_id) {
  const section_key = `presenter-${user.id}`;

  const { data: existing } = await supabase
    .from('team_meeting_track_sections')
    .select('id, deleted_at')
    .eq('track_id', track_id)
    .eq('section_key', section_key)
    .maybeSingle();

  const { data: maxRow } = await supabase
    .from('team_meeting_track_sections')
    .select('sort_order')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const fields = {
    title:             user.display_name,
    sub_label:         PRESENTER_SUB_LABEL,
    bar_color:         presenterColor(user.id),
    presenter_user_id: user.id
  };

  let row;
  if (existing && !existing.deleted_at) {
    row = existing; // already active — no-op
  } else if (existing) {
    const { data, error } = await supabase
      .from('team_meeting_track_sections')
      .update({ ...fields, deleted_at: null, sort_order })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return { error: error.message };
    row = data;
  } else {
    const { data, error } = await supabase
      .from('team_meeting_track_sections')
      .insert({ track_id, catalog_id: null, section_key, sort_order, ...fields })
      .select()
      .single();
    if (error) return { error: error.message };
    row = data;
  }

  // Optional live-meeting snapshot (reactivate if previously removed).
  if (meeting_id) {
    const { data: ms } = await supabase
      .from('team_meeting_sections')
      .select('id, deleted_at')
      .eq('meeting_id', meeting_id)
      .eq('section_key', section_key)
      .maybeSingle();
    const { data: maxMs } = await supabase
      .from('team_meeting_sections')
      .select('sort_order')
      .eq('meeting_id', meeting_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const msSort = (maxMs?.sort_order ?? 0) + 1;
    if (ms && ms.deleted_at) {
      await supabase.from('team_meeting_sections')
        .update({ ...fields, deleted_at: null, sort_order: msSort })
        .eq('id', ms.id);
    } else if (!ms) {
      await supabase.from('team_meeting_sections')
        .insert({ meeting_id, section_key, sort_order: msSort, ...fields });
    }
    await require('../track_access').bumpMeeting(meeting_id);
  }

  return { row };
}

// set_presenter_section — leader. Per-member toggle.
async function set_presenter_section(params, caller_user_id) {
  const { track_id, user_id, enabled, meeting_id } = params;
  if (!track_id || !user_id || enabled === undefined) {
    return { success: false, error: 'track_id, user_id, and enabled are required.' };
  }

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  if (enabled) {
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', user_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!user) return { success: false, error: 'User not found.' };
    const result = await upsertPresenterSection(track_id, user, meeting_id);
    if (result.error) return { success: false, error: result.error };
    return { success: true, data: result.row };
  }

  // Disable: soft-delete template row (+ live meeting section).
  const section_key = `presenter-${user_id}`;
  const { error } = await supabase
    .from('team_meeting_track_sections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('track_id', track_id)
    .eq('section_key', section_key)
    .is('deleted_at', null);
  if (error) return { success: false, error: error.message };
  if (meeting_id) {
    await supabase
      .from('team_meeting_sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('meeting_id', meeting_id)
      .eq('section_key', section_key);
    await require('../track_access').bumpMeeting(meeting_id);
  }
  return { success: true, data: { track_id, user_id, enabled: false } };
}

// add_presenter_sections_all — leader. One per active member who lacks one.
async function add_presenter_sections_all(params, caller_user_id) {
  const { track_id, meeting_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id, { requireLeader: true });
  if (access.error) return { success: false, error: access.error };

  const { data: members } = await supabase
    .from('team_meeting_track_members')
    .select('user_id')
    .eq('track_id', track_id)
    .is('deleted_at', null);
  const memberIds = (members || []).map(m => m.user_id);
  if (!memberIds.length) return { success: true, data: { created: 0 } };

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', memberIds)
    .is('deleted_at', null)
    .order('display_name', { ascending: true });

  const { data: existing } = await supabase
    .from('team_meeting_track_sections')
    .select('presenter_user_id')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .not('presenter_user_id', 'is', null);
  const has = new Set((existing || []).map(s => s.presenter_user_id));

  let created = 0;
  for (const user of (users || [])) {
    if (has.has(user.id)) continue;
    const result = await upsertPresenterSection(track_id, user, meeting_id);
    if (!result.error) created++;
  }
  return { success: true, data: { created } };
}

// ── move_bullet — drag & drop between sections of the same meeting ─────────────
async function move_bullet(params, caller_user_id) {
  const { bullet_id, target_section_id } = params;
  if (!bullet_id || !target_section_id) {
    return { success: false, error: 'bullet_id and target_section_id are required.' };
  }

  const { data: bullet } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id')
    .eq('id', bullet_id)
    .maybeSingle();
  if (!bullet) return { success: false, error: 'Bullet not found.' };
  if (bullet.section_id === target_section_id) return { success: true, data: { bullet_id } };

  const { assertSectionAccess, bumpMeeting } = require('../track_access');
  const sourceAccess = await assertSectionAccess(bullet.section_id, caller_user_id);
  if (sourceAccess.error) return { success: false, error: sourceAccess.error };

  // Target must be a section of the same meeting.
  const { data: target } = await supabase
    .from('team_meeting_sections')
    .select('id, meeting_id')
    .eq('id', target_section_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!target || target.meeting_id !== sourceAccess.meeting.id) {
    return { success: false, error: 'Bullets can only be moved between sections of the same meeting.' };
  }

  const { data: maxRow } = await supabase
    .from('team_meeting_bullets')
    .select('sort_order')
    .eq('section_id', target_section_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from('team_meeting_bullets')
    .update({ section_id: target_section_id, sort_order: (maxRow?.sort_order ?? 0) + 1 })
    .eq('id', bullet_id);
  if (error) return { success: false, error: error.message };

  await bumpMeeting(sourceAccess.meeting.id);
  return { success: true, data: { bullet_id, target_section_id } };
}

// ── pull_from_last_meeting — master (all sections) or one section ──────────────
// Pulls bullets from the previous meeting in the series. Matching: presenter
// sections by presenter_user_id, everything else by section_key. Dedupe — skip if:
//   (a) source bullet already carried into this meeting (FK),
//   (b) same initiative already present in the target section,
//   (c) identical trimmed text already present (generic bullets).
// Unmatched source sections are skipped silently. Notes travel with bullets.
async function pull_from_last_meeting(params, caller_user_id) {
  const { meeting_id, section_id } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };

  const { assertMeetingAccess, bumpMeeting } = require('../track_access');
  const access = await assertMeetingAccess(meeting_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  const meeting = access.meeting;

  // Previous meeting = most recent other meeting in the track created before this one.
  const { data: prev } = await supabase
    .from('team_meetings')
    .select('id')
    .eq('track_id', meeting.track_id)
    .is('deleted_at', null)
    .neq('id', meeting_id)
    .lt('created_at', meeting.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!prev) return { success: true, data: { pulled: 0, skipped: 0, no_previous: true } };

  // Sections both sides.
  const { data: targetSections } = await supabase
    .from('team_meeting_sections')
    .select('id, section_key, presenter_user_id')
    .eq('meeting_id', meeting_id)
    .is('deleted_at', null);
  const { data: sourceSections } = await supabase
    .from('team_meeting_sections')
    .select('id, section_key, presenter_user_id')
    .eq('meeting_id', prev.id)
    .is('deleted_at', null);

  // Build target list (all, or just the requested one).
  const targets = (targetSections || []).filter(t => !section_id || t.id === section_id);
  if (!targets.length) return { success: false, error: 'Section not found in this meeting.' };

  // Match each target to its source section.
  const pairs = [];
  for (const t of targets) {
    const src = (sourceSections || []).find(s =>
      t.presenter_user_id ? s.presenter_user_id === t.presenter_user_id : s.section_key === t.section_key
    );
    if (src) pairs.push({ target: t, source: src });
  }

  let pulled = 0, skipped = 0;
  for (const { target, source } of pairs) {
    const { data: sourceBullets } = await supabase
      .from('team_meeting_bullets')
      .select('id, text, bullet_note, initiative_id, sort_order')
      .eq('section_id', source.id)
      .order('sort_order', { ascending: true });
    if (!sourceBullets?.length) continue;

    const { data: targetBullets } = await supabase
      .from('team_meeting_bullets')
      .select('id, text, initiative_id, carried_from_bullet_id')
      .eq('section_id', target.id);
    const carriedIds     = new Set((targetBullets || []).map(b => b.carried_from_bullet_id).filter(Boolean));
    const initiativeIds  = new Set((targetBullets || []).map(b => b.initiative_id).filter(Boolean));
    const texts          = new Set((targetBullets || []).map(b => (b.text || '').trim().toLowerCase()));

    let nextSort = Math.max(0, ...(targetBullets || []).map(() => 0));
    const { data: maxRow } = await supabase
      .from('team_meeting_bullets')
      .select('sort_order')
      .eq('section_id', target.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    nextSort = (maxRow?.sort_order ?? 0);

    for (const sb of sourceBullets) {
      const dupCarried    = carriedIds.has(sb.id);
      const dupInitiative = sb.initiative_id && initiativeIds.has(sb.initiative_id);
      const dupText       = !sb.initiative_id && texts.has((sb.text || '').trim().toLowerCase());
      if (dupCarried || dupInitiative || dupText) { skipped++; continue; }

      nextSort += 1;
      const { error } = await supabase
        .from('team_meeting_bullets')
        .insert({
          section_id:             target.id,
          text:                   sb.text,
          bullet_note:            sb.bullet_note ?? null,
          initiative_id:          sb.initiative_id ?? null,
          sort_order:             nextSort,
          carried_from_bullet_id: sb.id,
          created_by:             caller_user_id
        });
      if (!error) {
        pulled++;
        if (sb.initiative_id) initiativeIds.add(sb.initiative_id);
        texts.add((sb.text || '').trim().toLowerCase());
      }
    }
  }

  if (pulled) await bumpMeeting(meeting_id);
  return { success: true, data: { pulled, skipped } };
}

// ── list_track_initiative_reference ────────────────────────────────────────────
// Reference panel data, participant-aware (session 2026-07-11 design).
// participants: active track members (leaders + members), each with initiatives
//   merged across ALL THREE assignment roles (DCS + DOL + EPO), deduped.
// others: all users with the requested person-type flag who are NOT participants,
//   with initiatives from that role's column only.
// Division scoping matches list_dcs_users_with_initiatives (admins see all).
const REF_WALKBACK_CHAIN = ['go_to_deploy', 'go_to_build', 'brief_review'];
const REF_PERSON_TYPES = {
  dcs: { flag: 'is_dcs', column: 'assigned_dcs_user_id' },
  dol: { flag: 'is_dol', column: 'assigned_dol_user_id' },
  epo: { flag: 'is_epo', column: 'assigned_epo_user_id' }
};
const REF_ALL_COLUMNS = ['assigned_dcs_user_id', 'assigned_dol_user_id', 'assigned_epo_user_id'];

function refResolveGateStatus(milestoneDates) {
  for (const gate of REF_WALKBACK_CHAIN) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (!m || !m.date_status) continue;
    if (m.date_status === 'not_started') continue;
    if (m.date_status === 'skipped')     continue;
    return m.date_status;
  }
  return 'not_started';
}

async function list_track_initiative_reference(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };
  const personType = REF_PERSON_TYPES[params.person_type || 'dcs'];
  if (!personType) return { success: false, error: 'person_type must be dcs, dol, or epo.' };

  const access = await assertTrackAccess(track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  const caller = access.caller;

  // Division scope (admins = all divisions).
  let accessible_division_ids = null;
  if (!caller.is_admin) {
    const { data: dm } = await supabase
      .from('division_memberships')
      .select('division_id')
      .eq('user_id', caller_user_id)
      .is('revoked_at', null)
      .is('deleted_at', null);
    accessible_division_ids = (dm || []).map(m => m.division_id);
  }

  // Participants: active track members + user rows.
  const { data: memberRows, error: memErr } = await supabase
    .from('team_meeting_track_members')
    .select('user_id, is_leader')
    .eq('track_id', track_id)
    .is('deleted_at', null);
  if (memErr) return { success: false, error: memErr.message };

  const memberIds = (memberRows || []).map(m => m.user_id);
  const leaderById = {};
  (memberRows || []).forEach(m => { leaderById[m.user_id] = m.is_leader; });

  let memberUsers = [];
  if (memberIds.length) {
    const { data } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', memberIds)
      .is('deleted_at', null)
      .order('display_name', { ascending: true });
    memberUsers = data || [];
  }

  // Others: person-type-flagged users not in the track.
  const { data: typedUsers, error: typedErr } = await supabase
    .from('users')
    .select('id, display_name')
    .eq(personType.flag, true)
    .is('deleted_at', null)
    .order('display_name', { ascending: true });
  if (typedErr) return { success: false, error: typedErr.message };
  const otherUsers = (typedUsers || []).filter(u => !memberIds.includes(u.id));
  const otherIds = otherUsers.map(u => u.id);

  // Cycles for participants (any role column) — one OR query.
  let participantCycles = [];
  if (memberIds.length) {
    const idList = memberIds.join(',');
    let q = supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, assigned_dcs_user_id, assigned_dol_user_id, assigned_epo_user_id, division_id')
      .or(REF_ALL_COLUMNS.map(c => `${c}.in.(${idList})`).join(','))
      .neq('current_lifecycle_stage', 'closed')
      .is('deleted_at', null)
      .order('cycle_title', { ascending: true });
    if (accessible_division_ids !== null) q = q.in('division_id', accessible_division_ids);
    const { data, error } = await q;
    if (error) return { success: false, error: error.message };
    participantCycles = data || [];
  }

  // Cycles for others (person-type column only).
  let otherCycles = [];
  if (otherIds.length) {
    let q = supabase
      .from('delivery_cycles')
      .select(`delivery_cycle_id, cycle_title, current_lifecycle_stage, ${personType.column}, division_id`)
      .in(personType.column, otherIds)
      .neq('current_lifecycle_stage', 'closed')
      .is('deleted_at', null)
      .order('cycle_title', { ascending: true });
    if (accessible_division_ids !== null) q = q.in('division_id', accessible_division_ids);
    const { data, error } = await q;
    if (error) return { success: false, error: error.message };
    otherCycles = data || [];
  }

  // Enrichment: milestones + last status date across all cycles.
  const allCycleIds = [...new Set([...participantCycles, ...otherCycles].map(c => c.delivery_cycle_id))];
  let milestonesByCycle = {}, lastStatusDateByCycle = {};
  if (allCycleIds.length) {
    const { data: milestones } = await supabase
      .from('cycle_milestone_dates')
      .select('delivery_cycle_id, gate_name, date_status')
      .in('delivery_cycle_id', allCycleIds)
      .is('deleted_at', null);
    (milestones || []).forEach(m => {
      (milestonesByCycle[m.delivery_cycle_id] = milestonesByCycle[m.delivery_cycle_id] || []).push(m);
    });
    const { data: statusRows } = await supabase
      .from('initiative_status_updates')
      .select('delivery_cycle_id, created_at')
      .in('delivery_cycle_id', allCycleIds)
      .order('created_at', { ascending: false });
    (statusRows || []).forEach(s => {
      if (!lastStatusDateByCycle[s.delivery_cycle_id]) lastStatusDateByCycle[s.delivery_cycle_id] = s.created_at;
    });
  }

  const toRef = c => ({
    id:                      c.delivery_cycle_id,
    name:                    c.cycle_title,
    stage:                   c.current_lifecycle_stage,
    gate_status:             refResolveGateStatus(milestonesByCycle[c.delivery_cycle_id] || []),
    last_status_update_date: lastStatusDateByCycle[c.delivery_cycle_id] ?? null
  });

  const participants = memberUsers.map(u => {
    const seen = new Set();
    const initiatives = participantCycles
      .filter(c => REF_ALL_COLUMNS.some(col => c[col] === u.id))
      .filter(c => { if (seen.has(c.delivery_cycle_id)) return false; seen.add(c.delivery_cycle_id); return true; })
      .map(toRef);
    return { id: u.id, display_name: u.display_name, is_leader: !!leaderById[u.id], avatar_url: null, initiatives };
  });

  const others = otherUsers.map(u => ({
    id: u.id,
    display_name: u.display_name,
    is_leader: false,
    avatar_url: null,
    initiatives: otherCycles.filter(c => c[personType.column] === u.id).map(toRef)
  }));

  return { success: true, data: { participants, others } };
}

// ── get_latest_meeting — series URL entry point ────────────────────────────────
async function get_latest_meeting(params, caller_user_id) {
  const { track_id } = params;
  if (!track_id) return { success: false, error: 'track_id is required.' };

  const access = await assertTrackAccess(track_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const { data: latest } = await supabase
    .from('team_meetings')
    .select('id, title, meeting_date')
    .eq('track_id', track_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return { success: true, data: { meeting_id: null, track_name: access.track.track_name } };
  return { success: true, data: { meeting_id: latest.id, track_name: access.track.track_name } };
}

// ── meeting_changed_since — cheap 10s poll ─────────────────────────────────────
// Returns only the timestamp; client refetches full meeting when newer.
async function meeting_changed_since(params, caller_user_id) {
  const { meeting_id, since } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };

  const { assertMeetingAccess } = require('../track_access');
  const access = await assertMeetingAccess(meeting_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };

  const current = access.meeting.content_updated_at;
  const changed = !since || (current && new Date(current).getTime() > new Date(since).getTime());
  return { success: true, data: { changed, content_updated_at: current } };
}

module.exports = {
  list_my_tracks,
  create_track,
  get_track,
  update_track,
  delete_track,
  purge_track,
  restore_track,
  add_track_members,
  remove_track_member,
  set_track_leader,
  list_public_tracks,
  join_public_track,
  add_track_section,
  update_track_section,
  remove_track_section,
  reorder_track_sections,
  list_section_catalog,
  save_catalog_section,
  delete_catalog_section,
  get_latest_meeting,
  meeting_changed_since,
  list_track_initiative_reference,
  set_presenter_section,
  add_presenter_sections_all,
  move_bullet,
  pull_from_last_meeting
};
