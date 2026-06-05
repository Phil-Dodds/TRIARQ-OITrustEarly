// screen-state.service.ts — Pathways OI Trust
// Per-user filter and sort persistence (D-171, D-370, D-380).
//
// Contract 17 §2 / D-380, D-381: screen state is mediated by MCP. The
// `user_screen_state` table is never read or written from the Angular-side
// authenticated Supabase client. user_id is taken from the JWT at the MCP
// boundary — Angular does not pass it.
//
// The earlier localStorage implementation has been removed. The migration
// 032 Arch-1 exception cited under D-171 was incorrect (D-171 is the hub
// page decision); Design ruled the direct-Supabase pattern from Contract 16
// unauthorized and required this migration.

import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

import { McpService } from './mcp.service';
import { McpResponse } from '../types/database';

/** SCREEN_STATE_RECENCY_DAYS = 7 — recency policy enforced server-side. */
export const SCREEN_STATE_RECENCY_DAYS = 7;

/**
 * Screen key constants — declared once here as the authority (Rule 4).
 * Components import and use these — never construct keys dynamically.
 */
export const SCREEN_KEYS = {
  DELIVERY_CYCLES:          'delivery.cycles',
  DELIVERY_WORKSTREAMS:     'delivery.workstreams',
  DELIVERY_DIVISIONS:       'delivery.divisions',
  DELIVERY_GATES:           'delivery.gates',
  DELIVERY_DEPLOY_SCHEDULE: 'delivery.deploy-schedule',
  ADMIN_USERS:              'admin.users',
  ADMIN_WORKSTREAMS:        'admin.workstreams',
  // Contract 20 (D-401): EPO WIP Limits admin screen.
  ADMIN_EPO_WIP:            'admin.epo-wip',
  // Contract 20 Session 2: EPO-organized hub views.
  INITIATIVES_EPO_SUMMARY:  'initiatives.epo-summary',
  INITIATIVES_EPO_SCHEDULE: 'initiatives.epo-schedule',
  INITIATIVES_EPO_DEPLOY:   'initiatives.epo-deploy',
} as const;

export type ScreenKey = typeof SCREEN_KEYS[keyof typeof SCREEN_KEYS];

export interface RestoredScreenState {
  filter_state:     Record<string, unknown>;
  sort_state:       Record<string, unknown>;
  last_rendered_at: string;
}

@Injectable({ providedIn: 'root' })
export class ScreenStateService {

  constructor(private readonly mcp: McpService) {}

  /**
   * Restore screen state for the calling user (JWT-scoped) and screen.
   * Returns null when nothing is stored within the 7-day recency window or on
   * any error — restore failures are non-critical and degrade to defaults.
   */
  restore(screenKey: ScreenKey): Promise<RestoredScreenState | null> {
    return firstValueFrom(
      this.mcp.call<RestoredScreenState | null>('division', 'get_user_screen_state', {
        screen_key: screenKey
      }).pipe(
        map((res: McpResponse<RestoredScreenState | null>) =>
          (res?.success && res.data) ? res.data : null
        ),
        catchError(() => of(null))
      )
    );
  }

  /**
   * Persist screen state for the calling user (JWT-scoped) and screen.
   * Fire-and-forget — failures are swallowed because screen state is
   * quality-of-life, not core (D-140 / Arch-3).
   *
   * filterState: persisted filter dropdown values, scope toggles, etc.
   *              Search-text fields are never persisted (D-171).
   * sortState:   persisted sort column + direction.
   */
  save(
    screenKey:   ScreenKey,
    filterState: Record<string, unknown>,
    sortState:   Record<string, unknown> = {}
  ): void {
    this.mcp.call<RestoredScreenState>('division', 'upsert_user_screen_state', {
      screen_key:   screenKey,
      filter_state: filterState,
      sort_state:   sortState
    }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Raw observable for callers that want explicit error handling.
   * Not used by default — restore() above is the standard path.
   */
  restore$(screenKey: ScreenKey): Observable<RestoredScreenState | null> {
    return this.mcp.call<RestoredScreenState | null>('division', 'get_user_screen_state', {
      screen_key: screenKey
    }).pipe(
      map((res: McpResponse<RestoredScreenState | null>) =>
        (res?.success && res.data) ? res.data : null
      ),
      catchError(() => of(null))
    );
  }
}
