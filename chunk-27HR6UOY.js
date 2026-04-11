// src/app/core/services/screen-state.service.ts
import { Injectable } from "@angular/core";
import * as i0 from "@angular/core";
var SCREEN_STATE_RECENCY_DAYS = 7;
var SCREEN_KEYS = {
  DELIVERY_CYCLES: "delivery.cycles",
  DELIVERY_WORKSTREAMS: "delivery.workstreams",
  DELIVERY_DIVISIONS: "delivery.divisions",
  DELIVERY_GATES: "delivery.gates"
};
var ScreenStateService = class _ScreenStateService {
  /**
   * Restore screen state for a given key and user.
   * Returns null when: not found, expired (> SCREEN_STATE_RECENCY_DAYS), or parse error.
   */
  restore(screenKey, userId) {
    const key = this.storageKey(screenKey, userId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      const stored = JSON.parse(raw);
      const ageMs = Date.now() - new Date(stored.saved_at).getTime();
      const ageDays = ageMs / 864e5;
      if (ageDays > SCREEN_STATE_RECENCY_DAYS) {
        localStorage.removeItem(key);
        return null;
      }
      return stored.state;
    } catch {
      return null;
    }
  }
  /**
   * Save screen state for a given key and user.
   * Search text is never persisted — pass only filter dropdowns, sort column, sort direction.
   * Fails silently on quota errors (private browsing, storage full).
   */
  save(screenKey, userId, state) {
    const key = this.storageKey(screenKey, userId);
    const stored = { state, saved_at: (/* @__PURE__ */ new Date()).toISOString() };
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {
    }
  }
  /** Clear stored state for a screen + user combination. */
  clear(screenKey, userId) {
    localStorage.removeItem(this.storageKey(screenKey, userId));
  }
  storageKey(screenKey, userId) {
    return `oi_trust.screen_state.${userId}.${screenKey}`;
  }
  static {
    this.\u0275fac = function ScreenStateService_Factory(t) {
      return new (t || _ScreenStateService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({ token: _ScreenStateService, factory: _ScreenStateService.\u0275fac, providedIn: "root" });
  }
};

export {
  SCREEN_KEYS,
  ScreenStateService
};
//# sourceMappingURL=chunk-27HR6UOY.js.map
