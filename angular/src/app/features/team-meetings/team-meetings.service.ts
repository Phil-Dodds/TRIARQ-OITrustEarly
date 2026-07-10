// team-meetings.service.ts — Pathways OI Trust
// Angular service for all team-meetings-mcp tool calls (D-490).
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
  DcsUserWithInitiatives
} from '../../core/types/team-meetings';

@Injectable({ providedIn: 'root' })
export class TeamMeetingsService {
  constructor(private readonly mcp: McpService) {}

  createMeeting(title: string, meeting_date: string): Observable<McpResponse<TeamMeeting>> {
    return this.mcp.call<TeamMeeting>('team-meetings', 'create_team_meeting', { title, meeting_date });
  }

  getMeeting(meeting_id: string): Observable<McpResponse<TeamMeeting>> {
    return this.mcp.call<TeamMeeting>('team-meetings', 'get_team_meeting', { meeting_id });
  }

  listMeetings(limit = 20, offset = 0): Observable<McpResponse<TeamMeetingListItem[]>> {
    return this.mcp.call<TeamMeetingListItem[]>('team-meetings', 'list_team_meetings', { limit, offset });
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
      ...(initiative_id             ? { initiative_id }             : {}),
      ...(carried_from_bullet_id    ? { carried_from_bullet_id }    : {})
    });
  }

  removeBullet(bullet_id: string): Observable<McpResponse<{ bullet_id: string }>> {
    return this.mcp.call<{ bullet_id: string }>('team-meetings', 'remove_meeting_bullet', { bullet_id });
  }

  updateNotes(section_id: string, notes_text: string): Observable<McpResponse<TeamMeetingNotes>> {
    return this.mcp.call<TeamMeetingNotes>('team-meetings', 'update_meeting_notes', { section_id, notes_text });
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

  listDcsUsersWithInitiatives(): Observable<McpResponse<DcsUserWithInitiatives[]>> {
    return this.mcp.call<DcsUserWithInitiatives[]>('team-meetings', 'list_dcs_users_with_initiatives', {});
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
}
