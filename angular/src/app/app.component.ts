// app.component.ts — Pathways OI Trust
// Root shell. Shows sidebar when authenticated, hides it on /login.
// Loads the user profile once at app startup so the sidebar has role data
// regardless of which route the user lands on first (fixes Admin hidden on
// direct navigation to non-home routes).
//
// CC-20-09: renders a top-of-viewport "Update available" banner when the
// VersionCheckService detects a deploy newer than the boot-time build. Users
// click Reload to apply (preserves in-flight work; no forced redirect).

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd }  from '@angular/router';
import { AuthService }            from './core/services/auth.service';
import { UserProfileService }     from './core/services/user-profile.service';
import { VersionCheckService }    from './core/services/version-check.service';
import { BusyService }            from './core/services/busy.service';
import { NewsTickerService }      from './core/services/news-ticker.service';
import { filter, map }            from 'rxjs/operators';
import { Observable }             from 'rxjs';

@Component({
  selector:        'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-app-root" [class.oi-nb-open]="bannerVisible$ | async">

      <!-- Global activity bar — visible while any mutating MCP call is in
           flight (Processing Feedback standard, 2026-07-12). Pairs with the
           body.oi-busy progress cursor set by BusyService. -->
      <div *ngIf="busy$ | async" class="oi-activity-bar" aria-hidden="true"></div>

      <!-- CC-20-09: deploy-update banner. Sticky top, full width. Sits
           above the sidebar+main shell so it is visible regardless of
           which route is loaded. -->
      <div *ngIf="updateAvailable$ | async" class="oi-update-banner">
        <span class="oi-update-text">
          A new version of OI Trust is available.
        </span>
        <button type="button"
                class="oi-update-btn"
                (click)="reloadNow()">
          Reload
        </button>
      </div>

      <div class="oi-app-shell">
        <app-sidebar *ngIf="showSidebar$ | async"></app-sidebar>
        <main class="oi-main-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Easter Egg Hunt — completion celebration, fires on any screen -->
      <app-egg-celebration-overlay></app-egg-celebration-overlay>

      <!-- Bottom news banner — positive activity, all screens when signed in -->
      <app-news-banner *ngIf="showSidebar$ | async"></app-news-banner>
    </div>
  `,
  styles: [`
    .oi-app-root { display: flex; flex-direction: column; min-height: 100vh; }

    /* Deploy-update banner — D-200-adjacent treatment. Vital Blue background,
       full-width strip, above all content. Sticky so it remains visible as
       users scroll inside the main content area. */
    .oi-update-banner {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 8px 16px;
      background: #0071AF;
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .oi-update-text { line-height: 1.4; }
    .oi-update-btn {
      background: #ffffff;
      color: #0071AF;
      border: none;
      border-radius: 5px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .oi-update-btn:hover { background: #e6e6e6; }

    /* Processing Feedback standard: 2px indeterminate activity bar, fixed at
       the very top, shown only while a mutating server call is in flight. */
    .oi-activity-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 2000;
      background: linear-gradient(90deg, transparent 0%, var(--triarq-color-primary, #257099) 40%, #6EC1E4 60%, transparent 100%);
      background-size: 50% 100%;
      background-repeat: no-repeat;
      animation: oi-activity-slide 1.1s linear infinite;
      pointer-events: none;
    }
    @keyframes oi-activity-slide {
      0%   { background-position: -50% 0; }
      100% { background-position: 150% 0; }
    }
    /* News-banner space reservation. --nb-space is 0 until the banner strip
       actually renders (not hidden AND has items) — then the whole shell,
       sidebar included, ends above the banner. Hiding the banner reclaims the
       space immediately. Components with viewport-height columns may consume
       var(--nb-space) to stay clear as well. */
    .oi-app-root { --nb-space: 0px; }
    .oi-app-root.oi-nb-open { --nb-space: calc(38px + env(safe-area-inset-bottom, 0px)); }
    .oi-app-shell { padding-bottom: var(--nb-space); transition: padding-bottom .15s ease; }
  `]
})
export class AppComponent implements OnInit {
  showSidebar$!:     Observable<boolean>;
  updateAvailable$!: Observable<boolean>;
  busy$!:            Observable<boolean>;
  bannerVisible$!:   Observable<boolean>;

  constructor(
    private readonly router:         Router,
    private readonly auth:           AuthService,
    private readonly profileService: UserProfileService,
    private readonly versionCheck:   VersionCheckService,
    private readonly busy:           BusyService,
    private readonly newsTicker:     NewsTickerService
  ) {}

  ngOnInit(): void {
    this.showSidebar$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e =>
        this.auth.isAuthenticated() && !e.urlAfterRedirects.startsWith('/login')
      )
    );

    // CC-20-09: kick off version polling. Service tracks boot version on
    // first response, then compares every 5 minutes and on every
    // NavigationEnd. Banner appears when build_version differs.
    this.updateAvailable$ = this.versionCheck.updateAvailable$;
    this.versionCheck.init();

    // Processing Feedback standard: activity bar mirrors BusyService.
    this.busy$ = this.busy.busy$;

    // News-banner space reservation — shell padding follows actual banner render state.
    this.bannerVisible$ = this.newsTicker.bannerVisible$;

    // Load profile at app startup so sidebar role-filtering works on any
    // first-landing route, not just /home. HomeComponent also calls
    // loadProfile() — UserProfileService is idempotent on repeat calls
    // (subsequent calls from HomeComponent are still fine).
    //
    // Contract 16 UAT fix (CC-019): wait for AuthService.waitForInit() before
    // checking isAuthenticated(). The session is restored asynchronously from
    // storage during AuthService's constructor; ngOnInit runs before that
    // promise resolves. Without the wait, isAuthenticated() returns false on
    // any deep-link landing route (e.g. /delivery/cycles), loadProfile is
    // never called, profile$ stays null, and the sidebar filters out every
    // role-restricted item. Symptom: Phil sees five sidebar items instead of
    // six on routes other than /home.
    this.auth.waitForInit().then(async () => {
      if (this.auth.isAuthenticated()) {
        // SECURITY: an authenticated session with no active public.users row is
        // not permitted (Supabase OTP authenticates any email). Bounce such a
        // session back to /login. Only act on a definitive 'unregistered' — a
        // transient lookup 'error' must NOT sign a legitimate user out.
        const access = await this.profileService.resolveAccess();
        if (access === 'unregistered') {
          await this.auth.signOut();
          this.profileService.clearProfile();
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      }
    });
  }

  reloadNow(): void {
    this.versionCheck.reloadNow();
  }
}
