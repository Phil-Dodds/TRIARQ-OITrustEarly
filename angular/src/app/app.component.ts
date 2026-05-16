// app.component.ts — Pathways OI Trust
// Root shell. Shows sidebar when authenticated, hides it on /login.
// Loads the user profile once at app startup so the sidebar has role data
// regardless of which route the user lands on first (fixes Admin hidden on
// direct navigation to non-home routes).

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd }  from '@angular/router';
import { AuthService }            from './core/services/auth.service';
import { UserProfileService }     from './core/services/user-profile.service';
import { filter, map }            from 'rxjs/operators';
import { Observable }             from 'rxjs';

@Component({
  selector:        'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-app-shell">
      <app-sidebar *ngIf="showSidebar$ | async"></app-sidebar>
      <main class="oi-main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  showSidebar$!: Observable<boolean>;

  constructor(
    private readonly router:         Router,
    private readonly auth:           AuthService,
    private readonly profileService: UserProfileService
  ) {}

  ngOnInit(): void {
    this.showSidebar$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e =>
        this.auth.isAuthenticated() && !e.urlAfterRedirects.startsWith('/login')
      )
    );

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
    this.auth.waitForInit().then(() => {
      if (this.auth.isAuthenticated()) {
        this.profileService.loadProfile();
      }
    });
  }
}
