// my-activity-card.component.ts
// Pathways OI Trust — home screen "My Initiative Activity" card
// (D-429, Contract 23 Item 6.1; Phil 2026-06-14 rename + limit-7 follow-on).
//
// Shows last 7 cycle_event_log entries where actor_user_id = current user,
// ordered by created_at DESC. Async load per D-346 — home screen does not block
// on this card. Initiative chip routes to /initiatives/:cycle_id and always
// renders (per Phil 2026-06-14: every activity row must surface its Initiative).
//
// Card position per D-425: My Initiatives → My Action Queue → My Notifications
// → My Activity (this card appends to that order).
//
// "View all activity →" footer routes to /initiatives/activity. V1 does not
// pre-populate a Person filter on the activity view since that view does not
// yet expose a Person filter (deferred Contract 23 follow-on); the link works
// today, and once the filter ships, navigation will simply pass the filter via
// query params or shared filter state.

import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

import { DeliveryService } from '../../../core/services/delivery.service';
import { InitiativeActivityEntry } from '../../../core/types/database';

@Component({
  selector:        'app-my-activity-card',
  standalone:      true,
  imports:         [CommonModule, RouterModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>My Initiative Activity</h4>
      </div>

      <!-- Skeleton while loading (D-346) -->
      <ng-container *ngIf="loading">
        <div class="ma-row" *ngFor="let _ of [1,2,3]">
          <ion-skeleton-text animated style="height:12px;width:75%;"></ion-skeleton-text>
        </div>
      </ng-container>

      <!-- Empty -->
      <p *ngIf="!loading && events.length === 0" class="oi-card-empty">
        No initiative activity recorded yet.
      </p>

      <!-- Rows -->
      <ul *ngIf="!loading && events.length > 0" class="ma-list">
        <li *ngFor="let e of events; trackBy: trackById" class="ma-item">
          <span class="ma-time" [title]="absoluteTime(e.created_at)">
            {{ relativeTime(e.created_at) }}
          </span>
          <span class="ma-desc">{{ e.event_description }}</span>
          <a *ngIf="e.delivery_cycle_id"
             class="ma-chip"
             [routerLink]="['/initiatives', e.delivery_cycle_id]">
            {{ e.initiative_title || 'Initiative' }}
          </a>
        </li>
      </ul>

      <!-- Footer link — pre-sets "Show Only My Activity" filter on the
           Initiative Activity screen (Phil 2026-06-14). User can uncheck. -->
      <a *ngIf="!loading"
         class="ma-view-all"
         routerLink="/initiatives/activity"
         [queryParams]="{ mine: '1' }">
        View all activity →
      </a>
    </div>
  `,
  styles: [`
    .oi-card-header {
      display: flex;
      align-items: center;
      gap: var(--triarq-space-sm);
      margin-bottom: var(--triarq-space-md);
    }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-card-empty {
      color: var(--triarq-color-text-secondary);
      font-size: var(--triarq-text-small);
    }

    .ma-list { list-style: none; padding: 0; margin: 0; }
    .ma-item {
      display: flex;
      align-items: center;
      gap: var(--triarq-space-sm);
      padding: 6px 0;
      border-bottom: 1px solid var(--triarq-color-border);
      font-size: var(--triarq-text-small);
    }
    .ma-item:last-of-type { border-bottom: 0; }

    .ma-time {
      flex: 0 0 80px;
      color: #5A5A5A;
      font-size: 11px;
    }
    .ma-desc {
      flex: 1 1 auto;
      color: var(--triarq-color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* S-021 — entity chip */
    .ma-chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(120, 130, 140, 0.10);
      color: var(--triarq-color-primary);
      text-decoration: none;
      font-size: 11px;
      white-space: nowrap;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ma-chip:hover { background: rgba(120, 130, 140, 0.20); cursor: pointer; }

    .ma-row { padding: 6px 0; }

    .ma-view-all {
      display: inline-block;
      margin-top: var(--triarq-space-sm);
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-primary);
      text-decoration: none;
      font-weight: 500;
    }
    .ma-view-all:hover { text-decoration: underline; }
  `]
})
export class MyActivityCardComponent implements OnInit {

  @Input() userId = '';

  events:  InitiativeActivityEntry[] = [];
  loading = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.userId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.delivery.listInitiativeActivity({
      actor_user_id: this.userId,
      limit:         7
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events = res.data.events;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  trackById = (_i: number, e: InitiativeActivityEntry): string => e.event_id;

  relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const diff = Date.now() - then;
    const min  = 60 * 1000;
    const hour = 60 * min;
    const day  = 24 * hour;
    if (diff < min)      return 'just now';
    if (diff < hour)     return `${Math.round(diff / min)} min ago`;
    if (diff < day)      return `${Math.round(diff / hour)} hr ago`;
    if (diff < 14 * day) return `${Math.round(diff / day)} days ago`;
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  absoluteTime(iso: string): string {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toUTCString() : iso;
  }
}
