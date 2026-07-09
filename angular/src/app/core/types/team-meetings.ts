// team-meetings.ts — Pathways OI Trust
// TypeScript types for Team Meetings feature (D-490).

export type SectionKey = 'hot-topics' | 'escalation' | 'comms' | 'initiatives-gates' | 'training';

export interface TeamMeetingInitiativeRef {
  id:          string;
  name:        string;
  stage:       string;
  gate_status: string;
}

export interface TeamMeetingBullet {
  id:                     string;
  text:                   string;
  sort_order:             number;
  carried_from_bullet_id: string | null;
  initiative:             TeamMeetingInitiativeRef | null;
}

export interface TeamMeetingNotes {
  notes_text:              string;
  updated_at:              string;
  updated_by_display_name: string | null;
}

export interface TeamMeetingSection {
  id:          string;
  section_key: SectionKey;
  sort_order:  number;
  collapsed:   boolean;
  bullets:     TeamMeetingBullet[];
  notes:       TeamMeetingNotes | null;
}

export interface TeamMeeting {
  id:           string;
  title:        string;
  meeting_date: string;
  created_at:   string;
  updated_at:   string;
  sections:     TeamMeetingSection[];
}

export interface TeamMeetingListItem {
  id:           string;
  title:        string;
  meeting_date: string;
  created_at:   string;
  updated_at:   string;
}

export interface DcsInitiativeRef {
  id:                      string;
  name:                    string;
  stage:                   string;
  gate_status:             string;
  last_status_update_date: string | null;
}

export interface DcsUserWithInitiatives {
  id:           string;
  display_name: string;
  avatar_url:   string | null;
  initiatives:  DcsInitiativeRef[];
}

// Section UI config (colors, titles, sub-labels) — declared as named constants per Rule 4.
export interface SectionConfig {
  section_key: SectionKey;
  title:       string;
  sub_label:   string;
  bar_color:   string;
}

export const SECTION_CONFIGS: readonly SectionConfig[] = [
  {
    section_key: 'hot-topics',
    title:       'Hot Topics / Agenda Topics',
    sub_label:   'What the Team Wants to Raise Today',
    bar_color:   '#E96127'
  },
  {
    section_key: 'escalation',
    title:       'Escalation to Phil, Inform Phil, Blockers',
    sub_label:   "Things That Need Phil's Attention, Awareness, or a Decision",
    bar_color:   '#F2A620'
  },
  {
    section_key: 'comms',
    title:       'Phil Communications / Reminders',
    sub_label:   'Items Phil Wants the Team to Know',
    bar_color:   '#0071AF'
  },
  {
    section_key: 'initiatives-gates',
    title:       'Initiatives and Gates',
    sub_label:   'Initiative Status, Gate Dates, and Planning Discussion',
    bar_color:   '#534AB7'
  },
  {
    section_key: 'training',
    title:       'Trainings / Process / Getting Better',
    sub_label:   'Process Improvements, Skill Gaps, Team Development',
    bar_color:   '#5A5A5A'
  }
] as const;

// Screen key constants — never constructed from runtime variables (Rule 4).
export const TEAM_MEETINGS_SCREEN_KEYS = {
  LIST: 'team-meetings.list'
} as const;
