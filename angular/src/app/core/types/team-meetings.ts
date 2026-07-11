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
  title:       string;
  sub_label:   string;
  bar_color:   string;
  bullets:     TeamMeetingBullet[];
  notes:       TeamMeetingNotes | null;
}

export interface TeamMeetingTrackContext {
  track_id:              string;
  track_name:            string;
  ref_panel_person_type: RefPanelPersonType;
  is_leader:             boolean;
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
  id:           string;
  title:        string;
  meeting_date: string;
  created_at:   string;
  updated_at:   string;
}

// ── Tracks ─────────────────────────────────────────────────────────────────────

export interface TrackListItem {
  track_id:              string;
  track_name:            string;
  is_public:             boolean;
  ref_panel_person_type: RefPanelPersonType;
  is_member:             boolean;
  is_leader:             boolean;
  member_count:          number;
  latest_meeting:        { id: string; title: string; meeting_date: string } | null;
  deleted_at:            string | null;
}

export interface TrackMember {
  user_id:      string;
  display_name: string;
  email:        string;
  is_leader:    boolean;
}

export interface TrackSection {
  id:          string;
  catalog_id:  string | null;
  section_key: string;
  title:       string;
  sub_label:   string;
  bar_color:   string;
  sort_order:  number;
}

export interface TrackDetail {
  track_id:              string;
  track_name:            string;
  is_public:             boolean;
  ref_panel_person_type: RefPanelPersonType;
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
