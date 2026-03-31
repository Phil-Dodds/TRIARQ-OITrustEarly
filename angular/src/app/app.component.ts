// app.component.ts — Pathways OI Trust
// Root shell. Shows sidebar when authenticated, hides it on /login.

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd }  from '@angular/router';
import { AuthService }            from './core/services/auth.service';
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
    private readonly router: Router,
    private readonly auth:   AuthService
  ) {}

  ngOnInit(): void {
    this.showSidebar$ = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) =>
        this.auth.isAuthenticated() && !e.urlAfterRedirects.startsWith('/login')
      )
    );
  }
}
