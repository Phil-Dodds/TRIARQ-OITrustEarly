// sidebar.component.ts — Pathways OI Trust
// Role-aware navigation sidebar. Active item uses --triarq-color-primary left border (D-151).

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AuthService }        from '../../../core/services/auth.service';
import { Router }             from '@angular/router';
import { SystemRole }         from '../../../core/types/database';

interface NavItem {
  label:    string;
  route:    string;
  roles:    SystemRole[] | 'all';
}

// D-163: Every feature must have a declared entry point in this list.
// D-164: Admin functions are never individual sidebar links — they belong under /admin (Admin hub).
const NAV_ITEMS: NavItem[] = [
  { label: 'Home',                    route: '/home',      roles: 'all' },
  { label: 'OI Library',              route: '/library',   roles: 'all' },
  { label: 'Delivery Cycle Tracking', route: '/delivery',  roles: ['phil', 'ds', 'cb', 'ce', 'admin'] },
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
export class SidebarComponent implements OnInit {
  visibleItems: NavItem[] = [];
  displayName = '';

  constructor(
    private readonly profileService: UserProfileService,
    private readonly auth:           AuthService,
    private readonly router:         Router
  ) {}

  ngOnInit(): void {
    const profile = this.profileService.getCurrentProfile();
    this.displayName = profile?.display_name ?? '';
    const role       = profile?.system_role ?? null;

    this.visibleItems = NAV_ITEMS.filter(item =>
      item.roles === 'all' || (role && item.roles.includes(role))
    );
  }

  async signOut(): Promise<void> {
    this.profileService.clearProfile();
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
