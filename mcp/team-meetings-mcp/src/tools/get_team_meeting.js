// get_team_meeting.js
// Pathways OI Trust — team-meetings-mcp / D-490
// Returns a full meeting including sections, bullets (with initiative join), and notes.

'use strict';

const { supabase } = require('../db');

// D-419 walkback chain: find the furthest-in-progress gate milestone status.
const WALKBACK_CHAIN = ['go_to_deploy', 'go_to_build', 'brief_review'];

// Forward order for "next gate" computation.
const GATE_FORWARD_ORDER = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

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

  // Admin check.
  const { data: caller, error: callerErr } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (callerErr || !caller?.is_admin) {
    return { success: false, error: 'Team Meetings is restricted to Admin users.' };
  }

  const { data: meeting, error: meetingErr } = await supabase
    .from('team_meetings')
    .select('id, title, meeting_date, created_at, updated_at')
    .eq('id', meeting_id)
    .maybeSingle();
  if (meetingErr) return { success: false, error: meetingErr.message };
  if (!meeting)   return { success: false, error: 'Meeting not found.' };

  const { data: sections, error: sectionErr } = await supabase
    .from('team_meeting_sections')
    .select('id, section_key, sort_order, collapsed')
    .eq('meeting_id', meeting_id)
    .order('sort_order', { ascending: true });
  if (sectionErr) return { success: false, error: sectionErr.message };

  const sectionIds = (sections || []).map(s => s.id);

  // Fetch bullets.
  const { data: bullets, error: bulletErr } = await supabase
    .from('team_meeting_bullets')
    .select('id, section_id, text, bullet_note, sort_order, carried_from_bullet_id, initiative_id')
    .in('section_id', sectionIds.length ? sectionIds : ['__none__'])
    .order('sort_order', { ascending: true });
  if (bulletErr) return { success: false, error: bulletErr.message };

  // Fetch notes.
  const { data: notes, error: notesErr } = await supabase
    .from('team_meeting_notes')
    .select('section_id, notes_text, updated_at, updated_by')
    .in('section_id', sectionIds.length ? sectionIds : ['__none__']);
  if (notesErr) return { success: false, error: notesErr.message };

  // Resolve display names for notes authors.
  const noteAuthorIds = [...new Set((notes || []).map(n => n.updated_by).filter(Boolean))];
  let noteAuthorMap = {};
  if (noteAuthorIds.length) {
    const { data: authors } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', noteAuthorIds);
    (authors || []).forEach(a => { noteAuthorMap[a.id] = a.display_name; });
  }

  // Resolve initiative data for bullets that have an initiative_id.
  const initiativeIds = [...new Set((bullets || []).map(b => b.initiative_id).filter(Boolean))];
  let initiativeMap = {};
  if (initiativeIds.length) {
    const { data: cycles } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, assigned_dcs_user_id')
      .in('delivery_cycle_id', initiativeIds)
      .is('deleted_at', null);

    // Look up DCS display names.
    const dcsUserIds = [...new Set((cycles || []).map(c => c.assigned_dcs_user_id).filter(Boolean))];
    let dcsNameMap = {};
    if (dcsUserIds.length) {
      const { data: dcsUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', dcsUserIds)
        .is('deleted_at', null);
      (dcsUsers || []).forEach(u => { dcsNameMap[u.id] = u.display_name; });
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
        dcs_name:    c.assigned_dcs_user_id ? (dcsNameMap[c.assigned_dcs_user_id] ?? null) : null,
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
      updated_by_display_name: noteAuthorMap[n.updated_by] ?? null
    };
  });

  // Assemble bullets by section.
  const bulletsBySection = {};
  (bullets || []).forEach(b => {
    const list = bulletsBySection[b.section_id] || [];
    list.push({
      id:                    b.id,
      text:                  b.text,
      bullet_note:           b.bullet_note ?? null,
      sort_order:            b.sort_order,
      carried_from_bullet_id: b.carried_from_bullet_id,
      initiative:            b.initiative_id ? (initiativeMap[b.initiative_id] ?? null) : null
    });
    bulletsBySection[b.section_id] = list;
  });

  const enrichedSections = (sections || []).map(s => ({
    id:          s.id,
    section_key: s.section_key,
    sort_order:  s.sort_order,
    collapsed:   s.collapsed,
    bullets:     bulletsBySection[s.id] || [],
    notes:       notesMap[s.id] ?? null
  }));

  return { success: true, data: { ...meeting, sections: enrichedSections } };
}

module.exports = { get_team_meeting };
