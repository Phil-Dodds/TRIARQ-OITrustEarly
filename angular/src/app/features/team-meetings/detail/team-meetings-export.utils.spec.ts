// team-meetings-export.utils.spec.ts
// Pathways OI Trust — Meeting Collab export (2026-08-13).
//
// Pure functions, so these are real assertions rather than DI scaffolding.
// Each agreed rule gets a test, and the two Phil chose explicitly — no
// carry-forward marker, Initiative as name + stage — are pinned so a later
// change cannot quietly reverse a decision he made.

import { buildMeetingExport, meetingExportFilename } from './team-meetings-export.utils';
import { TeamMeeting, TeamMeetingBullet, TeamMeetingSection } from '../../../core/types/team-meetings';

const bullet = (over: Partial<TeamMeetingBullet> = {}): TeamMeetingBullet => ({
  id: 'b1', text: 'Rollout of QSuite V26.08', bullet_note: null, sort_order: 1,
  indent_level: 0, carried_from_bullet_id: null, created_by_display_name: 'David Shaw',
  initiative: null, ...over
});

const section = (over: Partial<TeamMeetingSection> = {}): TeamMeetingSection => ({
  id: 's1', section_key: 'person' as TeamMeetingSection['section_key'], sort_order: 1,
  collapsed: false, title: 'David Shaw', sub_label: 'Action Items, Escalations',
  bar_color: '#12274A', presenter_user_id: 'u1', bullets: [bullet()], notes: null, ...over
});

const meeting = (over: Partial<TeamMeeting> = {}): TeamMeeting => ({
  id: 'm1', title: 'Bi-weekly: Successes and Retros', meeting_date: '2026-08-14',
  created_at: '', updated_at: '', content_updated_at: '',
  track: { track_id: 't1', track_name: 'Bi-weekly', ref_panel_person_type: 'dcs' as never,
           is_leader: true, member_count: 4 },
  sections: [section()], ...over
});

describe('buildMeetingExport', () => {

  it('leads with the meeting title and a locally-formatted date', () => {
    const md = buildMeetingExport(meeting());
    expect(md.startsWith('# Bi-weekly: Successes and Retros')).toBe(true);
    // Local construction, not UTC — a date-only string must not shift a day.
    expect(md).toContain('Friday, August 14, 2026');
  });

  it('renders the bullet headline bold with its note beneath', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [bullet({ bullet_note: 'Rollout started Aug 10th' })] })]
    }));
    expect(md).toContain('- **Rollout of QSuite V26.08**');
    expect(md).toContain('  Rollout started Aug 10th');
  });

  it('Rule 5 — an Initiative renders as name + stage, never an id', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [bullet({
        initiative: { id: 'uuid-should-not-appear', name: 'SMS Texting Implementation',
                      stage: 'BRIEF', gate_status: 'pending', dcs_name: null, next_gate: null }
      })] })]
    }));
    expect(md).toContain('[SMS Texting Implementation (BRIEF)]');
    expect(md).not.toContain('uuid-should-not-appear');
  });

  it('Rule 4 — attributes a bullet only when the author is not the presenter', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [
        bullet({ id: 'b1', text: 'Own item', created_by_display_name: 'David Shaw' }),
        bullet({ id: 'b2', text: 'Guest item', sort_order: 2, created_by_display_name: 'Phil Dodds' })
      ] })]
    }));
    expect(md).toContain('- **Own item**\n');          // no trailing attribution
    expect(md).toContain('- **Guest item** — Phil Dodds');
  });

  it('Phil 2026-08-13 — carried-forward bullets carry NO marker', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [bullet({ carried_from_bullet_id: 'prev-bullet' })] })]
    }));
    expect(md.toLowerCase()).not.toContain('carried');
  });

  it('Rule 2 — a collapsed section still exports; collapse is a view state', () => {
    const md = buildMeetingExport(meeting({ sections: [section({ collapsed: true })] }));
    expect(md).toContain('## David Shaw');
  });

  it('Rule 3 — a section with no bullets and no notes is omitted', () => {
    const md = buildMeetingExport(meeting({
      sections: [section(), section({ id: 's2', title: 'Julie Lundberg', sort_order: 2,
                                      bullets: [], notes: null })]
    }));
    expect(md).toContain('## David Shaw');
    expect(md).not.toContain('## Julie Lundberg');
  });

  it('keeps a section that has only notes', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [], notes: {
        notes_text: 'Revisit at next retro.', updated_at: '', updated_by_display_name: null } })]
    }));
    expect(md).toContain('**Notes / comments**');
    expect(md).toContain('Revisit at next retro.');
  });

  it('orders sections and bullets by sort_order, not array order', () => {
    const md = buildMeetingExport(meeting({
      sections: [
        section({ id: 's2', title: 'Second', sort_order: 2, bullets: [bullet({ text: 'B' })] }),
        section({ id: 's1', title: 'First',  sort_order: 1, bullets: [
          bullet({ id: 'x', text: 'B1', sort_order: 2 }),
          bullet({ id: 'y', text: 'A1', sort_order: 1 })
        ] })
      ]
    }));
    expect(md.indexOf('## First')).toBeLessThan(md.indexOf('## Second'));
    expect(md.indexOf('A1')).toBeLessThan(md.indexOf('B1'));
  });

  it('nests a sub-bullet by indent_level', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [
        bullet({ id: 'p', text: 'Parent', sort_order: 1 }),
        bullet({ id: 'c', text: 'Child',  sort_order: 2, indent_level: 1 })
      ] })]
    }));
    expect(md).toContain('  - **Child**');
  });

  it('excludes optimistic ghost rows still round-tripping', () => {
    const md = buildMeetingExport(meeting({
      sections: [section({ bullets: [bullet(), bullet({ id: 'g', text: 'Ghost', pending: true })] })]
    }));
    expect(md).not.toContain('Ghost');
  });

  it('ARCH-3 — emits content only, with no prompt preamble', () => {
    const md = buildMeetingExport(meeting());
    expect(md.startsWith('#')).toBe(true);
    expect(md.toLowerCase()).not.toContain('summarise');
    expect(md.toLowerCase()).not.toContain('you are an');
  });
});

describe('meetingExportFilename', () => {

  it('slugifies title and date', () => {
    expect(meetingExportFilename(meeting()))
      .toBe('bi-weekly-successes-and-retros-2026-08-14.md');
  });

  it('survives a title with no usable characters', () => {
    expect(meetingExportFilename(meeting({ title: '///' }))).toBe('meeting-2026-08-14.md');
  });
});
