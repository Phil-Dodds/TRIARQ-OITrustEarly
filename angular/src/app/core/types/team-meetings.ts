// team-meetings.ts — Pathways OI Trust
// TypeScript types for Team Meetings feature (D-490 + Tracks Phase A+B).

export type SectionKey = string;   // catalog keys ('hot-topics', …) or 'custom-<uuid>'

export type RefPanelPersonType = 'dcs' | 'dol' | 'epo';

export interface TeamMeetingNextGate {
  label:       string;
  target_date: string | null;
}

export interface TeamMeetingInitiativeRef {
  id:          string;
  name:        string;
  stage:       string;
  gate_status: string;
  dcs_name:    string | null;   // assigned person of the track's ref_panel_person_type
  next_gate:   TeamMeetingNextGate | null;
}

export interface TeamMeetingBullet {
  id:                      string;
  text:                    string;
  bullet_note:             string | null;
  sort_order:              number;
  carried_from_bullet_id:  string | null;
  created_by_display_name: string | null;
  initiative:              TeamMeetingInitiativeRef | null;
  /** Client-only: optimistic ghost row shown while the add round-trips. */
  pending?:                boolean;
}

export interface TeamMeetingNotes {
  notes_text:              string;
  updated_at:              string;
  updated_by_display_name: string | null;
}

export interface TeamMeetingSection {
  id:                string;
  section_key:       SectionKey;
  sort_order:        number;
  collapsed:         boolean;
  title:             string;
  sub_label:         string;
  bar_color:         string;
  presenter_user_id: string | null;
  bullets:           TeamMeetingBullet[];
  notes:             TeamMeetingNotes | null;
}

export interface TeamMeetingTrackContext {
  track_id:              string;
  track_name:            string;
  ref_panel_person_type: RefPanelPersonType;
  is_leader:             boolean;
  member_count:          number;
}

export interface TeamMeeting {
  id:                 string;
  title:              string;
  meeting_date:       string;
  created_at:         string;
  updated_at:         string;
  content_updated_at: string;
  track:              TeamMeetingTrackContext | null;
  sections:           TeamMeetingSection[];
}

export interface TeamMeetingListItem {
  id:                 string;
  title:              string;
  meeting_date:       string;
  created_at:         string;
  updated_at:         string;
  /** True "anything changed by anyone" stamp — bumped by every content mutation. */
  content_updated_at: string;
  /** Caller never viewed this meeting, or it changed since their last view. */
  unread:             boolean;
}

// ── Tracks ─────────────────────────────────────────────────────────────────────

export interface TrackListItem {
  track_id:              string;
  track_name:            string;
  is_public:             boolean;
  ref_panel_person_type: RefPanelPersonType;
  is_member:             boolean;
  is_leader:             boolean;
  /** First leader alphabetically — shown as a chip on non-leader rows. */
  first_leader_name:     string | null;
  member_count:          number;
  latest_meeting:        { id: string; title: string; meeting_date: string } | null;
  /** Caller has not viewed the latest meeting, or it changed since their last view. */
  unread:                boolean;
  deleted_at:            string | null;
}

export interface TrackMember {
  user_id:      string;
  display_name: string;
  email:        string;
  is_leader:    boolean;
}

export interface TrackSection {
  id:                string;
  catalog_id:        string | null;
  section_key:       string;
  title:             string;
  sub_label:         string;
  bar_color:         string;
  sort_order:        number;
  presenter_user_id: string | null;
}

// Meeting series cadence — suggestion only, never enforced (D-205).
export type CadenceType = 'interval' | 'weekly' | 'biweekly' | 'triweekly' | 'monthly';

export interface MeetingCadence {
  type:              CadenceType;
  interval_days?:    1 | 7 | 14;
  day_of_week?:      number;                          // 0=Sun … 6=Sat
  month_occurrence?: '1' | '2' | '3' | '4' | 'last';
}

// Section spec used by meeting templates → create_track.
export interface TemplateSectionSpec {
  section_key?: string;   // catalog key to link; omit for custom
  title:        string;
  sub_label?:   string;
  bar_color?:   string;
}

export interface TrackDetail {
  track_id:              string;
  track_name:            string;
  is_public:             boolean;
  ref_panel_person_type: RefPanelPersonType;
  meeting_cadence:       MeetingCadence | null;
  suggested_next_meeting_date: string;
  deleted_at:            string | null;
  is_leader:             boolean;
  is_member:             boolean;
  members:               TrackMember[];
  sections:              TrackSection[];
  latest_meeting:        { id: string; title: string; meeting_date: string } | null;
}

export interface PublicTrackListItem {
  track_id:       string;
  track_name:     string;
  leaders:        string[];
  latest_meeting: { title: string; meeting_date: string } | null;
  is_member:      boolean;
}

export interface CatalogSection {
  id:          string;
  section_key: string;
  title:       string;
  sub_label:   string;
  bar_color:   string;
  sort_order:  number;
}

export interface InviteReport {
  added:     { email: string; display_name: string }[];
  already:   { email: string; display_name: string }[];
  not_found: string[];
}

// ── Reference panel ────────────────────────────────────────────────────────────

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

// Participant-aware reference panel payload (session 2026-07-11 design).
export interface RefPanelPerson {
  id:           string;
  display_name: string;
  is_leader:    boolean;
  avatar_url:   string | null;
  initiatives:  DcsInitiativeRef[];
}

export interface TrackInitiativeReference {
  participants: RefPanelPerson[];
  others:       RefPanelPerson[];
}

// Per-user, per-track remembered reference panel view state (Option A).
export interface RefPanelTrackState {
  participants_only?: boolean;
  person_type?:       RefPanelPersonType;
  expanded?:          Record<string, boolean>;
}

export const PERSON_TYPE_LABELS: Record<RefPanelPersonType, string> = {
  dcs: 'DCS',
  dol: 'DOL',
  epo: 'EPO'
};

// Screen key constants — never constructed from runtime variables (Rule 4).
export const TEAM_MEETINGS_SCREEN_KEYS = {
  LIST:   'team-meetings.list',
  TRACKS: 'team-meetings.tracks',
  PUBLIC: 'team-meetings.public'
} as const;
