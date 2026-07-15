// sprint-calendar.service.ts — Contract 37 (D-549/D-550)
// Admin Sprint Calendar management. All tools live on delivery-cycle-mcp
// (CC-37 service mapping: recompute + stale-flag passes write
// cycle_milestone_dates, so the calendar tools ship with the rule engine).
// Arch-1: MCP-only — components call this service, never Supabase.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McpService } from './mcp.service';
import { McpResponse, SprintCalendar, SprintRow } from '../types/database';

export interface UpsertSprintsResult {
  requires_confirmation?:     boolean;
  changed_sprints?:           string[];
  affected_initiative_count?: number;
  sprints?:                   SprintRow[];
  warnings?:                  string[];
  stale_refresh?:             { flagged: number; cleared: number; checked: number } | null;
}

export interface StaleRefreshResult {
  flagged: number;
  cleared: number;
  checked: number;
}

@Injectable({ providedIn: 'root' })
export class SprintCalendarService {
  constructor(private readonly mcp: McpService) {}

  listSprintCalendars(): Observable<McpResponse<SprintCalendar[]>> {
    return this.mcp.call<SprintCalendar[]>('delivery', 'list_sprint_calendars', {});
  }

  createSprintCalendar(calendarName: string): Observable<McpResponse<SprintCalendar>> {
    return this.mcp.call<SprintCalendar>('delivery', 'create_sprint_calendar', { calendar_name: calendarName });
  }

  updateSprintCalendar(calendarId: string, updates: { calendar_name?: string; active_status?: boolean }):
      Observable<McpResponse<SprintCalendar>> {
    return this.mcp.call<SprintCalendar>('delivery', 'update_sprint_calendar', { calendar_id: calendarId, updates });
  }

  /** Soft delete — MCP blocks it while any Division references the calendar (D-140). */
  deleteSprintCalendar(calendarId: string): Observable<McpResponse<SprintCalendar>> {
    return this.mcp.call<SprintCalendar>('delivery', 'delete_sprint_calendar', { calendar_id: calendarId });
  }

  listSprints(calendarId: string): Observable<McpResponse<SprintRow[]>> {
    return this.mcp.call<SprintRow[]>('delivery', 'list_sprints', { calendar_id: calendarId });
  }

  /**
   * Batch grid save. Two-call pattern (D-183/§6.3): when existing sprint dates
   * change, the first call returns { requires_confirmation,
   * affected_initiative_count } without writing; re-call with confirmed: true.
   */
  upsertSprints(calendarId: string, sprints: SprintRow[], confirmed?: boolean):
      Observable<McpResponse<UpsertSprintsResult>> {
    return this.mcp.call<UpsertSprintsResult>('delivery', 'upsert_sprints',
      { calendar_id: calendarId, sprints, confirmed } as unknown as Record<string, unknown>);
  }

  deleteSprint(sprintRowId: string): Observable<McpResponse<{ deleted_sprint: SprintRow; stale_refresh: StaleRefreshResult }>> {
    return this.mcp.call<{ deleted_sprint: SprintRow; stale_refresh: StaleRefreshResult }>(
      'delivery', 'delete_sprint', { sprint_row_id: sprintRowId });
  }

  /** D-550: assignment is a calendar id, 'inherit', or 'none'. Never moves dates. */
  setDivisionSprintCalendar(divisionId: string, assignment: string):
      Observable<McpResponse<{ division: unknown; stale_refresh: StaleRefreshResult }>> {
    return this.mcp.call<{ division: unknown; stale_refresh: StaleRefreshResult }>(
      'delivery', 'set_division_sprint_calendar', { division_id: divisionId, assignment });
  }
}
