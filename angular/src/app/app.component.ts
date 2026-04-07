// app.component.ts — Pathways OI Trust
// Root shell. Shows sidebar when authenticated, hides it on /login.
// Loads the user profile once at app startup so the sidebar has role data
// regardless of which route the user lands on first (fixes Admin hidden on
// direct navigation to non-home routes).
//
// D-MaintenanceMode: on init, reads system_config.maintenance_mode directly from
// Supabase REST API (fetch — no Supabase client import) BEFORE any route resolves.
// This is the ONE deliberate exception to D-93 (MCP-only DB access). Rationale:
// MCP servers may be down during deployment; maintenance check must be reliable
// and pre-auth. If maintenance_mode = true, MaintenanceScreenComponent is shown
// and all routing is suppressed.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService }           from './core/services/auth.service';
import { UserProfileService }    from './core/services/user-profile.service';
import { filter, map, startWith } from 'rxjs/operators';
import { Observable }            from 'rxjs';
import { environment }           from '../environments/environment';

@Component({
  selector:        'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- D-MaintenanceMode: suppress routing until maintenance check resolves -->
    <ng-container *ngIf="maintenanceChecked">

      <!-- Maintenance mode active: show screen, no routing -->
      <app-maintenance-screen
        *ngIf="maintenanceMode"
        [maintenanceMessage]="maintenanceMessage">
      </app-maintenance-screen>

      <!-- Normal app shell -->
      <div *ngIf="!maintenanceMode" class="oi-app-shell">
        <app-sidebar *ngIf="showSidebar$ | async"></app-sidebar>
        <main class="oi-main-content">
          <router-outlet></router-outlet>
        </main>
      </div>

    </ng-container>
  `
})
export class AppComponent implements OnInit {
  showSidebar$!: Observable<boolean>;

  // D-MaintenanceMode state
  maintenanceChecked  = false;
  maintenanceMode     = false;
  maintenanceMessage: string | null = null;

  constructor(
    private readonly router:         Router,
    private readonly auth:           AuthService,
    private readonly profileService: UserProfileService,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // startWith seeds the initial value for when maintenanceChecked flips true
    // and the async pipe subscribes after NavigationEnd has already fired.
    this.showSidebar$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e =>
        this.auth.isAuthenticated() && !e.urlAfterRedirects.startsWith('/login')
      ),
      startWith(
        this.auth.isAuthenticated() && !this.router.url.startsWith('/login')
      )
    );

    // D-MaintenanceMode: check before routing (D-93 exception — direct Supabase REST read).
    // Uses fetch() so no @supabase/supabase-js import is needed here.
    this.checkMaintenanceMode().then(() => {
      if (!this.maintenanceMode && this.auth.isAuthenticated()) {
        this.profileService.loadProfile();
      }
    });
  }

  private async checkMaintenanceMode(): Promise<void> {
    try {
      const url = `${environment.supabaseUrl}/rest/v1/system_config` +
                  `?select=maintenance_mode,maintenance_message&limit=1`;

      const response = await fetch(url, {
        headers: {
          'apikey':        environment.supabaseAnonKey,
          'Authorization': `Bearer ${environment.supabaseAnonKey}`
        }
      });

      if (response.ok) {
        const rows = await response.json();
        if (rows && rows.length > 0) {
          this.maintenanceMode    = rows[0].maintenance_mode  ?? false;
          this.maintenanceMessage = rows[0].maintenance_message ?? null;
        }
      }
      // If the request fails (network error, table not yet created): fail open
      // so normal routing proceeds rather than locking users out.
    } catch {
      // Fail open — do not block the app if system_config is unreachable.
    } finally {
      this.maintenanceChecked = true;
      this.cdr.markForCheck();
    }
  }
}
