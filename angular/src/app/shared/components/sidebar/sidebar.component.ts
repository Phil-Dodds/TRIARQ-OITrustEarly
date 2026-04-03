// sidebar.component.ts — Pathways OI Trust
// Role-aware navigation sidebar. Active item uses --triarq-color-primary left border (D-151).
// Subscribes to profile$ so nav items update reactively when async profile load completes.
// Fix: calling getCurrentProfile() once at init missed async loads — switched to profile$ subscription.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AuthService }        from '../../../core/services/auth.service';
import { Router }             from '@angular/router';
import { SystemRole }         from '../../../core/types/database';
import { Subscription }       from 'rxjs';

interface NavItem {
  label: string;
  route: string;
  roles: SystemRole[] | 'all';
}

// D-163: Every feature must have a declared entry point in this list.
// D-164: Admin functions are never individual sidebar links — they belong under /admin (Admin hub).
const NAV_ITEMS: NavItem[] = [
  { label: 'Home',                    route: '/home',      roles: 'all' },
  { label: 'OI Library',              route: '/library',   roles: 'all' },
  { label: 'Delivery Cycle Tracking', route: '/delivery',  roles: 'all' },
  { label: 'Chat',                    route: '/chat',      roles: 'all' },
  { label: 'Admin',                   route: '/admin',     roles: ['phil', 'admin'] },
];

@Component({
  selector:        'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="oi-sidebar" aria-label="Main navigation">
      <div class="oi-sidebar-brand">
        <span class="oi-brand-name">Pathways OI Trust</span>
      </div>

      <ul class="oi-nav-list">
        <li *ngFor="let item of visibleItems">
          <a [routerLink]="item.route"
             routerLinkActive="active"
             class="oi-nav-item"
             [attr.aria-label]="item.label">
            {{ item.label }}
          </a>
        </li>
      </ul>

      <div class="oi-sidebar-footer">
        <span class="oi-sidebar-user">{{ displayName }}</span>
        <button class="oi-signout-btn" (click)="signOut()">Sign out</button>
      </div>
    </nav>
  `,
  styles: [`
    .oi-sidebar { height: 100vh; display: flex; flex-direction: column; }
    .oi-sidebar-brand { padding: var(--triarq-space-lg) var(--triarq-space-md); border-bottom: 1px solid rgba(255,255,255,0.1); }
    .oi-brand-name { font-size: var(--triarq-text-small); font-weight: var(--triarq-font-weight-bold); color: #fff; letter-spacing: 0.5px; }
    .oi-nav-list { list-style: none; padding: var(--triarq-space-sm) 0; margin: 0; flex: 1; }
    .oi-sidebar-footer { padding: var(--triarq-space-md); border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: var(--triarq-space-xs); }
    .oi-sidebar-user { font-size: var(--triarq-text-caption); color: var(--triarq-color-sidebar-text); }
    .oi-signout-btn { background: none; border: 1px solid rgba(255,255,255,0.2); color: var(--triarq-color-sidebar-text); border-radius: var(--triarq-radius-button); padding: var(--triarq-space-xs) var(--triarq-space-sm); cursor: pointer; font-size: var(--triarq-text-caption); }
    .oi-signout-btn:hover { background: rgba(255,255,255,0.08); }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  visibleItems: NavItem[] = [];
  displayName = '';

  private sub = new Subscription();

  constructor(
    private readonly profileService: UserProfileService,
    private readonly auth:           AuthService,
    private readonly router:         Router,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to profile$ so the sidebar updates reactively when the async
    // profile load completes (home screen calls loadProfile() after init).
    // Without this, getCurrentProfile() returns null at sidebar init time and
    // role-restricted items never appear.
    this.sub.add(
      this.profileService.profile$.subscribe(profile => {
        this.displayName  = profile?.display_name ?? '';
        const role        = profile?.system_role ?? null;
        this.visibleItems = NAV_ITEMS.filter(item =>
          item.roles === 'all' || (role && (item.roles as SystemRole[]).includes(role))
        );
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  async signOut(): Promise<void> {
    this.profileService.clearProfile();
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
