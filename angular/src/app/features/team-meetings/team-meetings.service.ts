// team-meetings.service.ts — Pathways OI Trust
// Angular service for all team-meetings-mcp tool calls (D-490 + Tracks Phase A+B).
// Components never call McpService directly — they call this service.

import { Injectable }  from '@angular/core';
import { Observable }  from 'rxjs';
import { McpService }  from '../../core/services/mcp.service';
import { McpResponse } from '../../core/types/database';
import {
  TeamMeeting,
  TeamMeetingListItem,
  TeamMeetingBullet,
  TeamMeetingNotes,
  DcsUserWithInitiatives,
  TrackListItem,
  TrackInitiativeReference,
  TemplateSectionSpec,
  MeetingCadence,
  TrackDetail,
  TrackSection,
  PublicTrackListItem,
  CatalogSection,
  InviteReport,
  RefPanelPersonType
} from '../../core/types/team-meetings';

@Injectable({ providedIn: 'root' })
export class TeamMeetingsService {
  constructor(private readonly mcp: McpService) {}

  // ── Meetings ─────────────────────────────────────────────────────────────────

  createMeeting(track_id: string, title: string, meeting_date: string): Observable<McpResponse<TeamMeeting>> {
    return this.mcp.call<TeamMeeting>('team-meetings', 'create_team_meeting', { track_id, title, meeting_date });
  }

  getMeeting(meeting_id: string): Observable<McpResponse<TeamMeeting>> {
    return this.mcp.call<TeamMeeting>('team-meetings', 'get_team_meeting', { meeting_id });
  }

  listMeetings(track_id: string, limit = 20, offset = 0): Observable<McpResponse<TeamMeetingListItem[]>> {
    return this.mcp.call<TeamMeetingListItem[]>('team-meetings', 'list_team_meetings', { track_id, limit, offset });
  }

  addBullet(
    section_id: string,
    text: string,
    initiative_id?: string,
    carried_from_bullet_id?: string
  ): Observable<McpResponse<TeamMeetingBullet>> {
    return this.mcp.call<TeamMeetingBullet>('team-meetings', 'add_meeting_bullet', {
      section_id,
      text,
      ...(initiative_id          ? { initiative_id }          : {}),
      ...(carried_from_bullet_id ? { carried_from_bullet_id } : {})
    });
  }

  removeBullet(bullet_id: string): Observable<McpResponse<{ bullet_id: string }>> {
    return this.mcp.call<{ bullet_id: string }>('team-meetings', 'remove_meeting_bullet', { bullet_id });
  }

  updateNotes(section_id: string, notes_text: string, base_updated_at?: string, force = false): Observable<McpResponse<TeamMeetingNotes> & { conflict?: boolean }> {
    return this.mcp.call<TeamMeetingNotes>('team-meetings', 'update_meeting_notes', {
      section_id, notes_text,
      ...(base_updated_at ? { base_updated_at } : {}),
      ...(force ? { force: true } : {})
    });
  }

  carryForwardBullet(
    source_bullet_id: string,
    target_meeting_id: string
  ): Observable<McpResponse<{ bullet: TeamMeetingBullet; target_meeting_id: string }>> {
    return this.mcp.call('team-meetings', 'carry_forward_bullet', { source_bullet_id, target_meeting_id });
  }

  updateSectionCollapsed(section_id: string, collapsed: boolean): Observable<McpResponse<{ section_id: string; collapsed: boolean }>> {
    return this.mcp.call('team-meetings', 'update_meeting_section_collapsed', { section_id, collapsed });
  }

  listDcsUsersWithInitiatives(person_type: RefPanelPersonType = 'dcs'): Observable<McpResponse<DcsUserWithInitiatives[]>> {
    return this.mcp.call<DcsUserWithInitiatives[]>('team-meetings', 'list_dcs_users_with_initiatives', { person_type });
  }

  listTrackInitiativeReference(track_id: string, person_type: RefPanelPersonType): Observable<McpResponse<TrackInitiativeReference>> {
    return this.mcp.call<TrackInitiativeReference>('team-meetings', 'list_track_initiative_reference', { track_id, person_type });
  }

  updateMeeting(meeting_id: string, title: string, meeting_date?: string): Observable<McpResponse<{ id: string; title: string; meeting_date: string; updated_at: string }>> {
    return this.mcp.call('team-meetings', 'update_meeting', {
      meeting_id,
      title,
      ...(meeting_date ? { meeting_date } : {})
    });
  }

  updateBulletNote(bullet_id: string, note_text: string): Observable<McpResponse<void>> {
    return this.mcp.call('team-meetings', 'update_bullet_note', { bullet_id, note_text });
  }

  deleteMeeting(meeting_id: string): Observable<McpResponse<void>> {
    return this.mcp.call('team-meetings', 'delete_team_meeting', { meeting_id });
  }

  // ── Polling sync (10s, cheap change-check) ───────────────────────────────────

  meetingChangedSince(meeting_id: string, since: string | null): Observable<McpResponse<{ changed: boolean; content_updated_at: string }>> {
    return this.mcp.call('team-meetings', 'meeting_changed_since', { meeting_id, ...(since ? { since } : {}) });
  }

  // ── Tracks ───────────────────────────────────────────────────────────────────

  listMyTracks(include_all = false): Observable<McpResponse<TrackListItem[]>> {
    return this.mcp.call<TrackListItem[]>('team-meetings', 'list_my_tracks', { include_all });
  }

  createTrack(
    track_name: string,
    is_public: boolean,
    sections?: TemplateSectionSpec[],
    meeting_cadence?: MeetingCadence
  ): Observable<McpResponse<{ track_id: string }>> {
    return this.mcp.call('team-meetings', 'create_track', {
      track_name, is_public,
      ...(sections ? { sections } : {}),
      ...(meeting_cadence ? { meeting_cadence } : {})
    });
  }

  getTrack(track_id: string): Observable<McpResponse<TrackDetail>> {
    return this.mcp.call<TrackDetail>('team-meetings', 'get_track', { track_id });
  }

  updateTrack(track_id: string, patch: { track_name?: string; is_public?: boolean; ref_panel_person_type?: RefPanelPersonType; meeting_cadence?: MeetingCadence | null }): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'update_track', { track_id, ...patch });
  }

  deleteTrack(track_id: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'delete_track', { track_id });
  }

  purgeTrack(track_id: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'purge_track', { track_id });
  }

  restoreTrack(track_id: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'restore_track', { track_id });
  }

  addTrackMembers(track_id: string, emails: string): Observable<McpResponse<InviteReport>> {
    return this.mcp.call<InviteReport>('team-meetings', 'add_track_members', { track_id, emails });
  }

  removeTrackMember(track_id: string, user_id: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'remove_track_member', { track_id, user_id });
  }

  setTrackLeader(track_id: string, user_id: string, is_leader: boolean): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'set_track_leader', { track_id, user_id, is_leader });
  }

  listPublicTracks(): Observable<McpResponse<PublicTrackListItem[]>> {
    return this.mcp.call<PublicTrackListItem[]>('team-meetings', 'list_public_tracks', {});
  }

  joinPublicTrack(track_id: string): Observable<McpResponse<{ track_id: string; already_member: boolean }>> {
    return this.mcp.call('team-meetings', 'join_public_track', { track_id });
  }

  getLatestMeeting(track_id: string): Observable<McpResponse<{ meeting_id: string | null; track_name: string }>> {
    return this.mcp.call('team-meetings', 'get_latest_meeting', { track_id });
  }

  // ── Section template + catalog ───────────────────────────────────────────────

  addTrackSection(track_id: string, opts: { catalog_id?: string; title?: string; sub_label?: string; bar_color?: string; meeting_id?: string }): Observable<McpResponse<{ track_section: TrackSection; meeting_section: unknown }>> {
    return this.mcp.call('team-meetings', 'add_track_section', { track_id, ...opts });
  }

  updateTrackSection(track_id: string, track_section_id: string, patch: { title?: string; sub_label?: string }, meeting_id?: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'update_track_section', { track_id, track_section_id, ...patch, ...(meeting_id ? { meeting_id } : {}) });
  }

  removeTrackSection(track_id: string, track_section_id: string, meeting_id?: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'remove_track_section', { track_id, track_section_id, ...(meeting_id ? { meeting_id } : {}) });
  }

  reorderTrackSections(track_id: string, ordered_ids: string[]): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'reorder_track_sections', { track_id, ordered_ids });
  }

  setPresenterSection(track_id: string, user_id: string, enabled: boolean, meeting_id?: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'set_presenter_section', { track_id, user_id, enabled, ...(meeting_id ? { meeting_id } : {}) });
  }

  addPresenterSectionsAll(track_id: string, meeting_id?: string): Observable<McpResponse<{ created: number }>> {
    return this.mcp.call('team-meetings', 'add_presenter_sections_all', { track_id, ...(meeting_id ? { meeting_id } : {}) });
  }

  /** target_bullet_id: dragged bullet takes that bullet's position; omitted → append. */
  moveBullet(bullet_id: string, target_section_id: string, target_bullet_id?: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'move_bullet',
      { bullet_id, target_section_id, ...(target_bullet_id ? { target_bullet_id } : {}) });
  }

  /** Section reorder within one meeting — dragged section takes the target's position. */
  moveSection(section_id: string, target_section_id: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'move_section', { section_id, target_section_id });
  }

  /** Edit a saved free-text bullet (initiative bullets are rejected server-side). */
  updateBulletText(bullet_id: string, text: string): Observable<McpResponse<{ bullet_id: string; text: string }>> {
    return this.mcp.call('team-meetings', 'update_bullet_text', { bullet_id, text });
  }

  pullFromLastMeeting(meeting_id: string, section_id?: string): Observable<McpResponse<{ pulled: number; skipped: number; no_previous?: boolean }>> {
    return this.mcp.call('team-meetings', 'pull_from_last_meeting', { meeting_id, ...(section_id ? { section_id } : {}) });
  }

  listSectionCatalog(): Observable<McpResponse<CatalogSection[]>> {
    return this.mcp.call<CatalogSection[]>('team-meetings', 'list_section_catalog', {});
  }

  saveCatalogSection(section: { id?: string; title: string; sub_label?: string; bar_color?: string; sort_order?: number }): Observable<McpResponse<CatalogSection>> {
    return this.mcp.call<CatalogSection>('team-meetings', 'save_catalog_section', section);
  }

  deleteCatalogSection(id: string): Observable<McpResponse<unknown>> {
    return this.mcp.call('team-meetings', 'delete_catalog_section', { id });
  }
}
