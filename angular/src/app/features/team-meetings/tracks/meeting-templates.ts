// meeting-templates.ts — Pathways OI Trust
// Meeting series templates (session 2026-07-12 design). Hardcoded constant —
// promote to a DB table + admin screen when a third template appears.
//
// A template pre-loads the series section list (guidance carried in sub_label)
// and suggests a cadence. It is a starting point, never a constraint — leaders
// edit everything after creation.
//
// The 1:1 template follows Andy Grove, High Output Management (ch. 4 & 8):
// the meeting belongs to the subordinate; status lives elsewhere; both sides
// keep a hold-file between meetings; always end with "one more thing".

import { MeetingCadence, TemplateSectionSpec } from '../../../core/types/team-meetings';

export interface MeetingTemplate {
  key:         'team' | 'one-on-one' | 'blank';
  label:       string;
  description: string;
  /** undefined = seed all shared-catalog sections (Blank behavior). */
  sections?:   TemplateSectionSpec[];
  /** Pre-fills the series cadence; leader confirms the weekday in settings. */
  suggested_cadence?: MeetingCadence;
}

export const MEETING_TEMPLATES: readonly MeetingTemplate[] = [
  {
    key:         'team',
    label:       'Team Meeting',
    description: 'Recurring team check-in. Starts by collecting agenda topics from the room so nothing gets missed, then works escalations, communications, initiatives, and improvement.',
    sections: [
      {
        section_key: 'hot-topics',
        title:       'Hot Topics / Agenda Topics',
        sub_label:   'Start Here — Go Around the Room and Collect Topics Before Diving In, So Nothing Gets Missed'
      },
      { section_key: 'escalation' },
      { section_key: 'comms' },
      { section_key: 'initiatives-gates' },
      { section_key: 'training' }
    ] as TemplateSectionSpec[],
    suggested_cadence: { type: 'weekly', day_of_week: 1 }   // Monday — leader adjusts
  },
  {
    key:         'one-on-one',
    label:       'Manager / Employee 1:1',
    description: 'Grove-style one-on-one. The employee owns the agenda and does most of the talking; the manager listens and coaches. Add topics between meetings so nothing depends on memory.',
    sections: [
      {
        title:     'Your Agenda',
        sub_label: 'This Is Your Meeting — Bring the Topics. Aim for Three or More Items',
        bar_color: '#257099'
      },
      {
        title:     'Nascent Problems',
        sub_label: "What's Bugging You? Early Signals, Not Yet Fires — Catch Problems While They're Small",
        bar_color: '#E96127'
      },
      {
        title:     'Manager Topics',
        sub_label: 'Coaching, Context from Above, and Feedback',
        bar_color: '#0071AF'
      },
      {
        title:     'Development / Career',
        sub_label: 'Skills, Growth, and What the Next Level Looks Like',
        bar_color: '#534AB7'
      },
      {
        title:     'Actions & Follow-Ups',
        sub_label: 'Written Commitments from This Session — Writing Forces Clarity',
        bar_color: '#4CAF50'
      },
      {
        title:     'One More Thing…',
        sub_label: "Anything Else? Don't Close Until This Is Truly Empty — the Real Issue Is Often Raised Last",
        bar_color: '#5A5A5A'
      }
    ],
    suggested_cadence: { type: 'biweekly', day_of_week: 2 }  // Tuesday — leader adjusts
  },
  {
    // CC-38 f20 (Phil #3B): truly blank — explicit [] means NO seeded
    // sections (create_track distinguishes [] from undefined).
    key:         'blank',
    sections:    [],
    label:       'Blank',
    description: 'Start empty — add exactly the sections you want in Series Settings. No suggested cadence.',
    suggested_cadence: undefined
  }
];
