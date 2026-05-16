// screen-state.service.ts — Pathways OI Trust
// Persists filter and sort state per screen per user.
// Item 4 (Part 3), Principle 4 (self-clarifying screen keys), Principle 9 (skeleton on restore).
//
// Current implementation: localStorage with 7-day expiry.
// MCP write-back to user_screen_state table is planned for a future build session
// when a screen-state MCP endpoint is added to division-mcp or document-access-mcp.
//
// D-93: no direct Supabase. D-140: fails silently — filter state is quality-of-life, not core.

import { Injectable } from '@angular/core';

/** SCREEN_STATE_RECENCY_DAYS = 7 — shared constant per Part 3 Item 4. */
export const SCREEN_STATE_RECENCY_DAYS = 7;

/**
 * Screen key constants — declared once here as the authority.
 * Components import and use these — never construct keys dynamically.
 * Principle 4: self-explanatory without surrounding context.
 */
export const SCREEN_KEYS = {
  DELIVERY_CYCLES:      'delivery.cycles',
  DELIVERY_WORKSTREAMS: 'delivery.workstreams',
  DELIVERY_DIVISIONS:   'delivery.divisions',
  DELIVERY_GATES:       'delivery.gates',
  ADMIN_USERS:          'admin.users',
} as const;

export type ScreenKey = typeof SCREEN_KEYS[keyof typeof SCREEN_KEYS];

interface StoredState {
  state:    Record<string, unknown>;
  saved_at: string; // ISO timestamp
}

@Injectable({ providedIn: 'root' })
export class ScreenStateService {

  /**
   * Restore screen state for a given key and user.
   * Returns null when: not found, expired (> SCREEN_STATE_RECENCY_DAYS), or parse error.
   */
  restore(screenKey: ScreenKey, userId: string): Record<string, unknown> | null {
    const key = this.storageKey(screenKey, userId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { return null; }
      const stored: StoredState = JSON.parse(raw) as StoredState;
      const ageMs   = Date.now() - new Date(stored.saved_at).getTime();
      const ageDays = ageMs / 86_400_000;
      if (ageDays > SCREEN_STATE_RECENCY_DAYS) {
        localStorage.removeItem(key);
        return null;
      }
      return stored.state;
    } catch {
      // Corrupted storage — ignore silently (non-critical)
      return null;
    }
  }

  /**
   * Save screen state for a given key and user.
   * Search text is never persisted — pass only filter dropdowns, sort column, sort direction.
   * Fails silently on quota errors (private browsing, storage full).
   */
  save(screenKey: ScreenKey, userId: string, state: Record<string, unknown>): void {
    const key = this.storageKey(screenKey, userId);
    const stored: StoredState = { state, saved_at: new Date().toISOString() };
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      // Storage quota or private browsing — non-critical, ignore
    }
  }

  /** Clear stored state for a screen + user combination. */
  clear(screenKey: ScreenKey, userId: string): void {
    localStorage.removeItem(this.storageKey(screenKey, userId));
  }

  private storageKey(screenKey: ScreenKey, userId: string): string {
    return `oi_trust.screen_state.${userId}.${screenKey}`;
  }
}
