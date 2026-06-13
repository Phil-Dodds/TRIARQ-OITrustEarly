// initiative-activity.component.ts
// Pathways OI Trust — Initiative Activity feed (D-428).
// Route: /initiatives/activity
//
// Reverse-chronological cycle_event_log feed scoped by viewer's Division access
// (admin sees all). Each row shows: timestamp, actor, event description,
// Initiative chip, Division short name. Read-only — no actions.
//
// Pagination: 50 rows per request, "Load more" appends next page using the
// oldest visible row's created_at as before_cursor.
//
// V1 scope (Contract 23 §5):
//   - Date range filter (Last 7 / 30 / 90 days) — default Last 7 days
//   - Reverse-chronological list with pagination
//   - Initiative chip → navigate to /initiatives/:cycle_id (S-018 spirit)
//   - Actor renders as bold text (no User panel drill-through yet)
//   - "Showing N of M events" count + Load more button
//
// Deferred to follow-on contract (recorded as CC-decisions):
//   - Slide-in filter panel with Division/Person/Event type filters (spec §5.2)
//   - Active filter chip bar with dismiss + re-query (spec §5.2)
//   - Filter state persistence via screen key 'initiatives.activity' (D-171)
//   - Custom date range picker
//   - Tappable actor chip → User panel
//
// Source: D-428, D-181, D-180, D-346, S-015, S-021.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

import { DeliveryService } from '../../../core/services/delivery.service';
import { InitiativeActivityEntry } from '../../../core/types/database';

type DateRangeKey = '7d' | '30d' | '90d';

const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days'
};

const DATE_RANGE_DAYS: Record<DateRangeKey, number> = {
  '7d':  7,
  '30d': 30,
  '90d': 90
};

const PAGE_SIZE = 50;

@Component({
  selector:        'app-initiative-activity',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, RouterModule, IonicModule],
  template: `
    <div class="ia-shell">

      <!-- S-001: visible context — title + purpose -->
      <div class="ia-header">
        <h3 class="ia-title">Initiative Activity</h3>
        <p class="ia-subtitle">
          Recent activity across all Initiatives you can see.
          Use this to track what has changed and who changed it.
        </p>

        <!-- Date range selector — single visible filter for V1.
             Spec slide-in panel with Division/Person/Event filters deferred. -->
        <div class="ia-controls">
          <label class="ia-range-label" for="ia-range">Show:</label>
          <select id="ia-range"
                  class="ia-range-select"
                  [ngModel]="dateRange"
                  (ngModelChange)="onRangeChange($event)">
            <option *ngFor="let k of rangeKeys" [value]="k">{{ rangeLabel(k) }}</option>
          </select>
        </div>
      </div>

      <!-- Feed -->
      <div class="ia-feed">

        <!-- Loading state — skeleton rows per S-028 Context B -->
        <ng-container *ngIf="loading && events.length === 0">
          <div class="ia-row ia-row-skeleton" *ngFor="let _ of [1,2,3,4,5]">
            <ion-skeleton-text animated style="height:14px;width:80%;"></ion-skeleton-text>
          </div>
        </ng-container>

        <!-- Loaded state -->
        <ng-container *ngIf="!loading || events.length > 0">

          <!-- Empty state -->
          <div *ngIf="!loading && events.length === 0" class="ia-empty">
            No activity found for the selected range.
          </div>

          <!-- Rows -->
          <div *ngFor="let e of events; trackBy: trackById" class="ia-row">
            <span class="ia-time" [title]="absoluteTime(e.created_at)">
              {{ relativeTime(e.created_at) }}
            </span>

            <!-- Actor — bold text V1 (User panel drill-through deferred) -->
            <span class="ia-actor">
              <ng-container *ngIf="e.actor_display_name; else systemActor">
                {{ e.actor_display_name }}
              </ng-container>
              <ng-template #systemActor>
                <em class="ia-system">System</em>
              </ng-template>
            </span>

            <!-- Description — plain text -->
            <span class="ia-desc">{{ e.event_description }}</span>

            <!-- Initiative chip → /initiatives/:cycle_id (S-018 spirit) -->
            <a *ngIf="e.delivery_cycle_id && e.initiative_title"
               class="ia-chip"
               [routerLink]="['/initiatives', e.delivery_cycle_id]">
              {{ e.initiative_title }}
            </a>

            <!-- Division short name — far right -->
            <span class="ia-division" *ngIf="e.division_short_name">
              {{ e.division_short_name }}
            </span>
          </div>

          <!-- Footer: showing N of M + Load more -->
          <div class="ia-footer" *ngIf="events.length > 0">
            <span class="ia-count">
              Showing {{ events.length }} of {{ totalCount }} events
            </span>
            <button class="ia-load-more"
                    [disabled]="loadingMore || !hasMore"
                    *ngIf="hasMore"
                    (click)="loadMore()">
              {{ loadingMore ? 'Loading…' : 'Load more' }}
            </button>
          </div>

        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .ia-shell {
      max-width: 1080px;
      margin: var(--triarq-space-2xl) auto;
      padding: 0 var(--triarq-space-md);
    }
    .ia-header { margin-bottom: var(--triarq-space-lg); }
    .ia-title { margin: 0 0 4px 0; }
    /* S-015: 11px italic Stone */
    .ia-subtitle {
      margin: 0 0 var(--triarq-space-md) 0;
      font-size: 11px;
      font-style: italic;
      color: #5A5A5A;
      max-width: 620px;
      line-height: 1.6;
    }
    .ia-controls {
      display: flex;
      align-items: center;
      gap: var(--triarq-space-sm);
    }
    .ia-range-label {
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-text-primary);
    }
    .ia-range-select {
      font-size: var(--triarq-text-small);
      padding: 6px 10px;
      border: 1px solid var(--triarq-color-border);
      border-radius: var(--triarq-radius-input, 5px);
      background: #fff;
    }

    .ia-feed { display: flex; flex-direction: column; gap: 4px; }

    .ia-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--triarq-space-sm);
      padding: 10px 12px;
      border-bottom: 1px solid var(--triarq-color-border);
      font-size: var(--triarq-text-body);
    }
    .ia-row:last-of-type { border-bottom: 0; }

    .ia-row-skeleton { padding: 10px 12px; }

    .ia-time {
      flex: 0 0 110px;
      color: #5A5A5A;
      font-size: 12px;
    }
    .ia-actor { font-weight: 600; }
    .ia-system { color: #5A5A5A; }
    .ia-desc { flex: 1 1 auto; color: var(--triarq-color-text-primary); }

    /* S-021 entity chip — pill shape, muted background */
    .ia-chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      background: rgba(120, 130, 140, 0.10);
      color: var(--triarq-color-primary);
      text-decoration: none;
      font-size: 12px;
      white-space: nowrap;
      transition: background-color 0.15s;
    }
    .ia-chip:hover { background: rgba(120, 130, 140, 0.20); cursor: pointer; }

    .ia-division {
      font-size: 11px;
      color: #5A5A5A;
      margin-left: auto;
    }

    .ia-empty {
      padding: var(--triarq-space-2xl);
      text-align: center;
      color: #5A5A5A;
      font-size: var(--triarq-text-body);
    }

    .ia-footer {
      margin-top: var(--triarq-space-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--triarq-space-md);
    }
    .ia-count { font-size: 11px; color: #5A5A5A; }
    .ia-load-more {
      padding: 8px 16px;
      border: 1px solid var(--triarq-color-primary);
      border-radius: var(--triarq-radius-button, 5px);
      background: #fff;
      color: var(--triarq-color-primary);
      font-size: var(--triarq-text-small);
      cursor: pointer;
    }
    .ia-load-more:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class InitiativeActivityComponent implements OnInit {

  readonly rangeKeys: DateRangeKey[] = ['7d', '30d', '90d'];

  dateRange: DateRangeKey = '7d';
  events:    InitiativeActivityEntry[] = [];
  totalCount = 0;
  hasMore    = false;
  loading    = false;
  loadingMore = false;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef,
    private readonly _router:  Router
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  rangeLabel(k: DateRangeKey): string {
    return DATE_RANGE_LABELS[k];
  }

  onRangeChange(next: DateRangeKey): void {
    this.dateRange = next;
    this.reload();
  }

  trackById = (_i: number, e: InitiativeActivityEntry): string => e.event_id;

  /** Fetch first page from MCP. Resets feed state. */
  reload(): void {
    this.loading    = true;
    this.events     = [];
    this.totalCount = 0;
    this.hasMore    = false;
    this.cdr.markForCheck();

    this.delivery.listInitiativeActivity({
      after: this.afterIso(),
      limit: PAGE_SIZE
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events     = res.data.events;
          this.totalCount = res.data.total_count;
          this.hasMore    = res.data.has_more;
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

  /** Append the next page using the oldest visible row's created_at as cursor. */
  loadMore(): void {
    if (this.loadingMore || !this.hasMore || this.events.length === 0) return;
    this.loadingMore = true;
    this.cdr.markForCheck();

    const oldest = this.events[this.events.length - 1];
    this.delivery.listInitiativeActivity({
      after:         this.afterIso(),
      before_cursor: oldest.created_at,
      limit:         PAGE_SIZE
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events     = [...this.events, ...res.data.events];
          this.totalCount = res.data.total_count;
          this.hasMore    = res.data.has_more;
        }
        this.loadingMore = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingMore = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Compute the after (lower bound) ISO timestamp for the current range. */
  private afterIso(): string {
    const days  = DATE_RANGE_DAYS[this.dateRange];
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return after.toISOString();
  }

  /** Relative format: "2 hours ago", "3 days ago". Falls back to date for older. */
  relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const diff = Date.now() - then;
    const min  = 60 * 1000;
    const hour = 60 * min;
    const day  = 24 * hour;
    if (diff < min)         return 'just now';
    if (diff < hour)        return `${Math.round(diff / min)} min ago`;
    if (diff < day)         return `${Math.round(diff / hour)} hr ago`;
    if (diff < 14 * day)    return `${Math.round(diff / day)} days ago`;
    return this.shortDate(iso);
  }

  /** Absolute formatted timestamp for tooltip. */
  absoluteTime(iso: string): string {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toUTCString() : iso;
  }

  private shortDate(iso: string): string {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : iso;
  }
}
