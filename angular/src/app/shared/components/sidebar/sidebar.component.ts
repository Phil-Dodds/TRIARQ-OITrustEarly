// sidebar.component.ts — Pathways OI Trust
// Role-aware navigation sidebar. Active item uses --triarq-color-primary left border (D-151).
// Subscribes to profile$ so nav items update reactively when async profile load completes.
// devStatus field shows build development stage per nav item — visual only, no routing effect.

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AuthService }        from '../../../core/services/auth.service';
import { DeliveryService }    from '../../../core/services/delivery.service';
import { Router }             from '@angular/router';
import { User, PendingApprovalItem } from '../../../core/types/database';
import { RoleFlag }           from '../../../core/constants/roles';
import { Subscription }       from 'rxjs';

type DevStatus = 'new' | 'uat' | 'pilot' | 'live' | 'not-started';

interface NavItem {
  label:     string;
  // Optional: placeholder ("Coming Soon") items have no destination yet and render
  // as non-navigating labels.
  route?:    string;
  // Contract 19 (D-394): boolean flag gates the item. undefined = visible to all.
  requiresFlag?: RoleFlag;
  devStatus: DevStatus;
  // One level of sub-menu items, rendered indented under the parent.
  children?: NavItem[];
}

// D-163: Every feature must have a declared entry point in this list.
// D-164: Admin functions are never individual sidebar links — they belong under /admin (Admin hub).
// devStatus reflects current build stage. Update when a feature advances.
// Coming-soon items with no route are placeholders for not-yet-built surfaces.
const NAV_ITEMS: NavItem[] = [
  { label: 'Home',                 route: '/home',           devStatus: 'pilot'       },
  // Contract 30 / D-472 (WS1.1): My Actions — gate-action surface; badge = pending count.
  { label: 'My Actions',           route: '/actions',        devStatus: 'pilot'       },
  // Raised above OI Library (Phil).
  { label: 'Initiative Tracking',  route: '/initiatives',    devStatus: 'live'        },
  { label: 'To Dos',                                         devStatus: 'not-started' },
  { label: 'OI Library',           route: '/library',        devStatus: 'not-started',
    children: [
      { label: 'Skills Management',                          devStatus: 'not-started' },
      { label: 'Context',                                    devStatus: 'not-started' },
      { label: 'Artifact',                                   devStatus: 'not-started' },
    ] },
  { label: 'Chat',                 route: '/chat',           devStatus: 'not-started' },
  // Lowered below Chat (Phil).
  { label: 'AI Governance Boards',                           devStatus: 'not-started',
    children: [
      { label: 'AI Inventory',                               devStatus: 'not-started' },
      { label: 'Meeting Archives',                           devStatus: 'not-started' },
    ] },
  { label: 'Policy Committee',                               devStatus: 'not-started' },
  { label: 'Contact an Admin',     route: '/contact-admin',  devStatus: 'live'        },
  { label: 'Admin',                route: '/admin',          requiresFlag: 'is_admin', devStatus: 'live' },
];

@Component({
  selector:        'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="oi-sidebar" aria-label="Main navigation">
      <div class="oi-sidebar-brand">
        <span class="oi-brand-name">OI Trust</span>
      </div>

      <ul class="oi-nav-list">
        <li *ngFor="let item of visibleItems">
          <ng-container *ngTemplateOutlet="entry; context: { $implicit: item, sub: false }"></ng-container>
          <!-- One level of sub-menu items — shown only while the parent is expanded. -->
          <ul *ngIf="item.children?.length && isExpanded(item.label)" class="oi-nav-sublist">
            <li *ngFor="let child of item.children">
              <ng-container *ngTemplateOutlet="entry; context: { $implicit: child, sub: true }"></ng-container>
            </li>
          </ul>
        </li>
      </ul>

      <!-- One nav entry: a router link when it has a route, else a non-navigating
           placeholder. Parents with children show a ▸/▾ chevron that toggles their
           sub-menu (collapsed by default). -->
      <ng-template #entry let-item let-sub="sub">
        <a *ngIf="item.route"
           [routerLink]="item.route"
           routerLinkActive="active"
           class="oi-nav-item"
           [class.oi-nav-subitem]="sub"
           [attr.aria-label]="item.label">
          <span class="oi-nav-label">{{ item.label }}</span>
          <!-- D-472 (WS1.1): pending-action badge on My Actions only. -->
          <span *ngIf="item.route === '/actions' && actionBadge > 0"
                class="oi-nav-badge"
                [attr.aria-label]="actionBadge + ' pending actions'">{{ actionBadge }}</span>
          <button *ngIf="item.children?.length"
                  type="button" class="oi-nav-chevron"
                  [attr.aria-label]="(isExpanded(item.label) ? 'Collapse ' : 'Expand ') + item.label"
                  (click)="$event.preventDefault(); $event.stopPropagation(); toggle(item.label)">{{ isExpanded(item.label) ? '▾' : '▸' }}</button>
          <span class="oi-dev-status" [ngClass]="'status-' + item.devStatus">
            {{ statusLabel(item.devStatus) }}
          </span>
        </a>
        <span *ngIf="!item.route"
              class="oi-nav-item oi-nav-item--static"
              [class.oi-nav-item--toggle]="item.children?.length"
              [class.oi-nav-subitem]="sub"
              [attr.aria-label]="item.label"
              (click)="item.children?.length && toggle(item.label)">
          <span class="oi-nav-label">{{ item.label }}</span>
          <span *ngIf="item.children?.length" class="oi-nav-chevron">{{ isExpanded(item.label) ? '▾' : '▸' }}</span>
          <span class="oi-dev-status" [ngClass]="'status-' + item.devStatus">
            {{ statusLabel(item.devStatus) }}
          </span>
        </span>
      </ng-template>

      <div class="oi-sidebar-footer">
        <span class="oi-sidebar-user">{{ displayName }}</span>
        <!-- D-426: About link opens build history panel. -->
        <button class="oi-about-btn"
                type="button"
                (click)="aboutOpen = true">About</button>
        <button class="oi-signout-btn" (click)="signOut()">Sign out</button>
      </div>
    </nav>

    <!-- D-426 About Panel — D-180 right-panel overlay -->
    <app-about-panel [show]="aboutOpen" (close)="aboutOpen = false"></app-about-panel>
  `,
  styles: [`
    .oi-sidebar { height: 100vh; display: flex; flex-direction: column; }
    .oi-sidebar-brand { padding: var(--triarq-space-lg) var(--triarq-space-md); border-bottom: 1px solid rgba(255,255,255,0.1); }
    .oi-brand-name { font-size: var(--triarq-text-small); font-weight: var(--triarq-font-weight-bold); color: #fff; letter-spacing: 0.5px; }
    .oi-nav-list { list-style: none; padding: var(--triarq-space-sm) 0; margin: 0; flex: 1; }

    .oi-nav-item { display: flex; flex-direction: row; align-items: center;
                   justify-content: space-between; gap: 6px; }
    /* Long labels wrap/shrink within the fixed sidebar width — never widen it. */
    .oi-nav-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    /* Belt-and-braces: clip any horizontal overflow so the panel width is stable. */
    .oi-nav-list { overflow-x: hidden; }
    /* Sub-list: indented children under a parent nav item. */
    .oi-nav-sublist { list-style: none; padding: 0 0 0 var(--triarq-space-md, 16px); margin: 0; }
    .oi-nav-subitem .oi-nav-label { font-size: var(--triarq-text-caption); }
    /* Non-navigating placeholder (Coming Soon, not yet built): no pointer, dimmed. */
    .oi-nav-item--static { cursor: default; opacity: 0.7; }
    /* Routeless parent with a sub-menu is clickable (toggles its children). */
    .oi-nav-item--toggle { cursor: pointer; }
    /* ▸/▾ expand chevron on parents with sub-menus. */
    .oi-nav-chevron { background: none; border: none; color: inherit; cursor: pointer;
                      font-size: 11px; line-height: 1; padding: 0 4px; flex-shrink: 0; }
    .oi-dev-status {
      display: inline;
      font-size: 10px;
      letter-spacing: 0.3px;
      white-space: nowrap;
      flex-shrink: 0;
      opacity: 0.85;
    }
    /* D-472 (WS1.1): pending-action badge pill on the My Actions nav item. */
    .oi-nav-badge {
      flex-shrink: 0;
      background: var(--triarq-color-primary, #257099);
      color: #fff;
      border-radius: var(--triarq-radius-pill, 999px);
      padding: 1px 7px;
      font-size: 10px;
      font-weight: var(--triarq-font-weight-bold, 700);
      line-height: 1.4;
    }

    /* Status colors */
    .status-new         { color: #6fcf97; }
    .status-uat         { color: var(--triarq-color-sunray, #f5a623); }
    .status-pilot       { color: #56ccf2; }
    .status-live        { color: #34c759; }
    .status-not-started { color: rgba(255,255,255,0.35); }

    .oi-sidebar-footer { padding: var(--triarq-space-md); border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: var(--triarq-space-xs); }
    .oi-sidebar-user { font-size: var(--triarq-text-caption); color: var(--triarq-color-sidebar-text); }
    .oi-about-btn,
    .oi-signout-btn { background: none; border: 1px solid rgba(255,255,255,0.2); color: var(--triarq-color-sidebar-text); border-radius: var(--triarq-radius-button); padding: var(--triarq-space-xs) var(--triarq-space-sm); cursor: pointer; font-size: var(--triarq-text-caption); }
    .oi-about-btn:hover,
    .oi-signout-btn:hover { background: rgba(255,255,255,0.08); }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  visibleItems: NavItem[] = [];
  displayName = '';
  /** D-426: About Panel show/hide state. */
  aboutOpen = false;
  /** Labels of parent items whose sub-menu is currently expanded. Collapsed by
   *  default to keep the sidebar short (avoids the vertical scrollbar). */
  private readonly expanded = new Set<string>();
  isExpanded(label: string): boolean { return this.expanded.has(label); }
  toggle(label: string): void {
    if (this.expanded.has(label)) { this.expanded.delete(label); }
    else { this.expanded.add(label); }
    this.cdr.markForCheck();
  }

  /** D-472 (WS1.1): pending-action count on the My Actions nav badge.
   *  Accountable awaiting_approval + active Consulted pending; post-approval
   *  Consulted items (D-468) are excluded — same rule as the Home card badge. */
  actionBadge = 0;

  private sub = new Subscription();

  constructor(
    private readonly profileService: UserProfileService,
    private readonly auth:           AuthService,
    private readonly delivery:       DeliveryService,
    private readonly router:         Router,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.profileService.profile$.subscribe(profile => {
        this.displayName  = profile?.display_name ?? '';
        // Contract 19 (D-394): nav items gate on boolean flags. requiresFlag undefined = all.
        this.visibleItems = NAV_ITEMS.filter(item =>
          !item.requiresFlag || (profile && (profile as User)[item.requiresFlag] === true)
        );
        this.cdr.markForCheck();
      })
    );
    this.loadActionBadge();
  }

  /** D-472 (WS1.1): fetch the pending-action count for the My Actions badge. */
  private loadActionBadge(): void {
    this.sub.add(
      this.delivery.listPendingApprovals().subscribe({
        next: res => {
          const items: PendingApprovalItem[] = (res.success && res.data) ? res.data : [];
          // Exclude post-approval Consulted items (D-468: stone, not counted).
          this.actionBadge = items.filter(
            i => !(i.item_type === 'consulted' && i.gate_status === 'approved')
          ).length;
          this.cdr.markForCheck();
        },
        error: () => { /* badge stays 0 — non-blocking */ }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  statusLabel(status: DevStatus): string {
    switch (status) {
      case 'new':         return '** New';
      case 'uat':         return '** UAT';
      case 'pilot':       return '** Pilot';
      case 'live':        return '** Live';
      // D-356 (Contract 13): unbuilt nav surfaces use "Coming Soon" wording.
      case 'not-started': return '** Coming Soon';
    }
  }

  async signOut(): Promise<void> {
    this.profileService.clearProfile();
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
