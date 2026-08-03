// maintenance-mode.service.ts — Pathways OI Trust
// Responsibility: resolve system_config.maintenance_mode once, before the
// router performs its initial navigation, and hold the answer for AppComponent.
//
// ── ARCH-1 AUTHORIZED EXCEPTION ──────────────────────────────────────────────
// This is the pre-auth maintenance mode read (D-MaintenanceMode), one of the
// named exceptions to Arch-1's MCP-only rule, and the only direct Supabase read
// in the Angular application. It cannot go through MCP: the whole point of the
// flag is to hold users out while the MCP services are being redeployed, so a
// read that depends on those services would fail in exactly the window it is
// needed. RLS permits it — 031_enable_rls_all_tables.sql grants
// `system_config_select USING (TRUE)`, deliberately, citing D-MaintenanceMode.
//
// It also cannot depend on auth: the maintenance screen renders before any
// session is restored (build-c-spec §5.2 — "attempts no auth").
//
// Implemented as a plain fetch against the PostgREST endpoint rather than via
// @supabase/supabase-js, so the read carries no client construction, no session
// restore, and no import of the Supabase SDK into a second location.
//
// FAIL-OPEN: any error — network, RLS, malformed row — resolves to "not in
// maintenance". A failed read must never be able to lock every user out of a
// healthy application. The inverse failure (a user reaching a mid-deploy app)
// is the pre-AC-29 status quo, so fail-open is strictly no worse.

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface MaintenanceModeState {
  active:  boolean;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceModeService {
  private state: MaintenanceModeState = { active: false, message: null };

  /** True when the app must render the maintenance screen instead of routing. */
  get isActive(): boolean {
    return this.state.active;
  }

  /** Operator-supplied message, shown under the primary line. May be null. */
  get message(): string | null {
    return this.state.message;
  }

  /**
   * Read the flag once at bootstrap. Called from the APP_INITIALIZER in
   * AppModule so it completes before the router's initial navigation.
   */
  async resolveMaintenanceModeAtBootstrap(): Promise<MaintenanceModeState> {
    try {
      const url =
        `${environment.supabaseUrl}/rest/v1/system_config` +
        `?select=maintenance_mode,maintenance_message&limit=1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          apikey:          environment.supabaseAnonKey,
          Authorization:   `Bearer ${environment.supabaseAnonKey}`,
          'Cache-Control': 'no-store'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        return this.state;
      }

      const rows = await response.json();
      const row  = Array.isArray(rows) ? rows[0] : null;

      this.state = {
        active:  row?.maintenance_mode === true,
        message: row?.maintenance_message ?? null
      };
    } catch {
      // Fail-open, deliberately silent — see the header note. Nothing to log
      // to: the app has not bootstrapped far enough for any logging service.
    }

    return this.state;
  }
}
