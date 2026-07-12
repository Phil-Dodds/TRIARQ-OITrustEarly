// get_team_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490 + Tracks Phase A+B
// Returns a full meeting: sections (snapshot title/color, deleted excluded),
// bullets (initiative join + created_by attribution), notes, track context,
// content_updated_at for polling sync.

'use strict';

const { supabase } = require('../db');
const { assertMeetingAccess } = require('../track_access');

// D-419 walkback chain: find the furthest-in-progress gate milestone status.
const WALKBACK_CHAIN = ['go_to_deploy', 'go_to_build', 'brief_review'];

// Forward order for "next gate" computation.
const GATE_FORWARD_ORDER = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

// Track person type → delivery_cycles assigned column.
const PERSON_TYPE_COLUMN = {
  dcs: 'assigned_dcs_user_id',
  dol: 'assigned_dol_user_id',
  epo: 'assigned_epo_user_id'
};

function resolveGateStatus(milestoneDates) {
  for (const gate of WALKBACK_CHAIN) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (!m || !m.date_status) continue;
    if (m.date_status === 'not_started') continue;
    if (m.date_status === 'skipped')     continue;
    return m.date_status;
  }
  return 'not_started';
}

function resolveNextGate(milestoneDates) {
  for (const gate of GATE_FORWARD_ORDER) {
    const m = (milestoneDates || []).find(x => x.gate_name === gate);
    if (!m) continue;
    if (m.date_status === 'complete') continue;
    if (m.date_status === 'skipped')  continue;
    return { label: m.milestone_label, target_date: m.target_date ?? null };
  }
  return null;
}

/**
 * @param {{ meeting_id: string }} params
 * @param {string} caller_user_id
 */
async function get_team_meeting(params, caller_user_id) {
  const { meeting_id } = params;
  if (!meeting_id) return { success: false, error: 'meeting_id is required.' };

  const access = await assertMeetingAccess(meeting_id, caller_user_id);
  if (access.error) return { success: false, error: access.error };
  const { meeting, membership, caller } = access;

  // Track context (member_count drives contributor-initials visibility in the UI).
  let track = null;
  let memberCount = 0;
  if (meeting.track_id) {
    const { data: t } = await supabase
      .from('team_meeting_tracks')
      .select('track_id, track_name, is_public, ref_panel_person_type')
      .eq('track_id', meeting.track_id)
      .maybeSingle();
    track = t || null;
    const { count } = await supabase
      .from('team_meeting_track_members')
      .select('id', { count: 'exact', head: true })
      .eq('track_id', meeting.track_id)
      .is('deleted_at', null);
    memberCount = count ?? 0;
  }
  const personType = track?.ref_panel_person_type || 'dcs';
  const assignedColumn = PERSON_TYPE_COLUMN[personType];

  const { data: sections, error: sectionErr } = await supabase
    .from('team_meeting_sections')
    .select('id, section_key, sort_order, collapsed, title, sub_label, bar_color, presenter_user_id')
    .eq('meeting_id', meeting_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });
  if (sectionErr) return { success: false, error: sectionErr.message };

  const sectionIds = (sections || []).map(s => s.id);

  // Fetch bullets.
  const { data: bullets, error: bulletErr } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id, text, bullet_note, sort_order, carried_from_bullet_id, initiative_id, created_by')
    .in('section_id', sectionIds.length ? sectionIds : ['__none__'])
    .order('sort_order', { ascending: true });
  if (bulletErr) return { success: false, error: bulletErr.message };

  // Fetch notes.
  const { data: notes, error: notesErr } = await supabase
    .from('team_meeting_notes')
    .select('section_id, notes_text, updated_at, updated_by')
    .in('section_id', sectionIds.length ? sectionIds : ['__none__']);
  if (notesErr) return { success: false, error: notesErr.message };

  // Resolve display names for note authors + bullet authors.
  const authorIds = [...new Set([
    ...(notes || []).map(n => n.updated_by),
    ...(bullets || []).map(b => b.created_by)
  ].filter(Boolean))];
  let authorMap = {};
  if (authorIds.length) {
    const { data: authors } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', authorIds);
    (authors || []).forEach(a => { authorMap[a.id] = a.display_name; });
  }

  // Resolve initiative data for bullets that have an initiative_id.
  const initiativeIds = [...new Set((bullets || []).map(b => b.initiative_id).filter(Boolean))];
  let initiativeMap = {};
  if (initiativeIds.length) {
    const { data: cycles } = await supabase
      .from('delivery_cycles')
      .select(`delivery_cycle_id, cycle_title, current_lifecycle_stage, ${assignedColumn}`)
      .in('delivery_cycle_id', initiativeIds)
      .is('deleted_at', null);

    // Look up assigned-person display names (per track person type).
    const assignedIds = [...new Set((cycles || []).map(c => c[assignedColumn]).filter(Boolean))];
    let assignedNameMap = {};
    if (assignedIds.length) {
      const { data: assignedUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', assignedIds)
        .is('deleted_at', null);
      (assignedUsers || []).forEach(u => { assignedNameMap[u.id] = u.display_name; });
    }

    // Milestone dates — D-419 walkback + next gate.
    const { data: milestones } = await supabase
      .from('cycle_milestone_dates')
      .select('delivery_cycle_id, gate_name, milestone_label, target_date, date_status')
      .in('delivery_cycle_id', initiativeIds)
      .is('deleted_at', null);

    const milestonesByCycle = {};
    (milestones || []).forEach(m => {
      (milestonesByCycle[m.delivery_cycle_id] = milestonesByCycle[m.delivery_cycle_id] || []).push(m);
    });

    (cycles || []).forEach(c => {
      const mds = milestonesByCycle[c.delivery_cycle_id] || [];
      initiativeMap[c.delivery_cycle_id] = {
        id:          c.delivery_cycle_id,
        name:        c.cycle_title,
        stage:       c.current_lifecycle_stage,
        gate_status: resolveGateStatus(mds),
        dcs_name:    c[assignedColumn] ? (assignedNameMap[c[assignedColumn]] ?? null) : null,
        next_gate:   resolveNextGate(mds)
      };
    });
  }

  // Assemble notes map keyed by section_id.
  const notesMap = {};
  (notes || []).forEach(n => {
    notesMap[n.section_id] = {
      notes_text:              n.notes_text,
      updated_at:              n.updated_at,
      updated_by_display_name: authorMap[n.updated_by] ?? null
    };
  });

  // Assemble bullets by section.
  const bulletsBySection = {};
  (bullets || []).forEach(b => {
    const list = bulletsBySection[b.section_id] || [];
    list.push({
      id:                     b.id,
      text:                   b.text,
      bullet_note:            b.bullet_note ?? null,
      sort_order:             b.sort_order,
      carried_from_bullet_id: b.carried_from_bullet_id,
      created_by_display_name: b.created_by ? (authorMap[b.created_by] ?? null) : null,
      initiative:             b.initiative_id ? (initiativeMap[b.initiative_id] ?? null) : null
    });
    bulletsBySection[b.section_id] = list;
  });

  const enrichedSections = (sections || []).map(s => ({
    id:                s.id,
    section_key:       s.section_key,
    sort_order:        s.sort_order,
    collapsed:         s.collapsed,
    title:             s.title,
    sub_label:         s.sub_label,
    bar_color:         s.bar_color,
    presenter_user_id: s.presenter_user_id ?? null,
    bullets:           bulletsBySection[s.id] || [],
    notes:             notesMap[s.id] ?? null
  }));

  return {
    success: true,
    data: {
      id:                 meeting.id,
      title:              meeting.title,
      meeting_date:       meeting.meeting_date,
      created_at:         meeting.created_at,
      updated_at:         meeting.updated_at,
      content_updated_at: meeting.content_updated_at,
      track: track ? {
        track_id:              track.track_id,
        track_name:            track.track_name,
        ref_panel_person_type: track.ref_panel_person_type,
        is_leader:             !!membership?.is_leader || caller.is_admin,
        member_count:          memberCount
      } : null,
      sections: enrichedSections
    }
  };
}

module.exports = { get_team_meeting };
