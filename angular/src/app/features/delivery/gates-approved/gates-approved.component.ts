// gates-approved.component.ts — Pathways OI Trust
// Recently Approved Gates view (D-431 / hub card 9 / Contract 24).
// Route: /initiatives/gates-approved
//
// Read-only feed of gates approved in the last 4 weeks. Division-scoped via
// JWT. Hub card 9 footer links here. My Completed Gates home card footer
// links here with ?personFilter=<userId> pre-set per D-430.
//
// Columns (S-036 sortable): Gate · Initiative · Division · Approved by ·
// Approved date. Default sort: approver_decision_at descending.
// Pagination: 50 rows + "Load more" button. No date range filter (fixed
// 28-day window). No + New Initiative button (explicit D-431 exception).
//
// Filter persistence per D-171 screen key `initiatives.gates-approved`.
//
// V1 scope:
//   - Server fetch with optional ?personFilter query param pre-set
//   - S-036 sort interaction on all five columns
//   - Initiative chip → /initiatives/:cycle_id (S-018 spirit)
//   - "Showing N of M" footer + Load more
//
// Deferred to follow-on contract (recorded as CC-decisions in CodeClose):
//   - Slide-in filter panel (S-010..S-013) with Division / Gate name /
//     Approved-by filters and active chips bar.
//   - Filter state persistence beyond the query-param pre-set.
//
// Source: D-431, D-180, D-181, D-346, S-021, S-036, OITrust-Contract24-Spec.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }                from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { IonicModule }                 from '@ionic/angular';

import { DeliveryService }   from '../../../core/services/delivery.service';
import {
  ScreenStateService,
  SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import { ApprovedGateRow }   from '../../../core/types/database';
import {
  SortState,
  applySortToggle,
  sortIndicator,
  compareString,
  compareDate
} from '../../../core/utils/sort-state';

type GaSortColumn =
  | 'gate_name_display'
  | 'initiative_name'
  | 'division_short_name'
  | 'approver_display_name'
  | 'approver_decision_at';

const DEFAULT_GA_SORT: SortState<GaSortColumn> = {
  column:    'approver_decision_at',
  direction: 'desc'
};

const PAGE_SIZE = 50;

@Component({
  selector:        'app-gates-approved',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, IonicModule],
  template: `
    <div class="ga-shell">

      <div class="ga-header">
        <h3 class="ga-title">Recently Approved Gates</h3>
        <p class="ga-subtitle">
          Gates approved in the last 4 weeks, across all Initiatives in your Divisions.
          {{ personFilterUserId ? 'Filtered to your approvals.' : '' }}
        </p>
      </div>

      <!-- D-196: header always visible. S-036 sortable headers. -->
      <div class="ga-grid">
        <div class="ga-row ga-header-row">
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('gate_name_display')"
                (click)="onSortColumn('gate_name_display')">
            Gate {{ glyph('gate_name_display') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('initiative_name')"
                (click)="onSortColumn('initiative_name')">
            Initiative {{ glyph('initiative_name') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('division_short_name')"
                (click)="onSortColumn('division_short_name')">
            Division {{ glyph('division_short_name') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('approver_display_name')"
                (click)="onSortColumn('approver_display_name')">
            Approved by {{ glyph('approver_display_name') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('approver_decision_at')"
                (click)="onSortColumn('approver_decision_at')">
            Approved date {{ glyph('approver_decision_at') }}
          </span>
        </div>

        <!-- Loading skeleton — S-028 Context B -->
        <ng-container *ngIf="loading && rows.length === 0">
          <div class="ga-row" *ngFor="let _ of skeletonRows">
            <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          </div>
        </ng-container>

        <div *ngIf="!loading && pageRows.length === 0" class="ga-empty">
          No gates approved in the last 28 days.
        </div>

        <div class="ga-row ga-data" *ngFor="let row of pageRows">
          <span class="ga-cell">{{ row.gate_name_display }}</span>
          <a class="ga-chip"
             [routerLink]="['/initiatives', row.delivery_cycle_id]"
             [title]="row.initiative_name">
            {{ row.initiative_name }}
          </a>
          <span class="ga-cell ga-muted">{{ row.division_short_name }}</span>
          <span class="ga-cell ga-muted">{{ row.approver_display_name }}</span>
          <span class="ga-cell">{{ formatDate(row.approver_decision_at) }}</span>
        </div>
      </div>

      <div *ngIf="rows.length > 0" class="ga-footer">
        <span class="ga-count">
          Showing {{ pageRows.length }} of {{ rows.length }} approved gates
        </span>
        <button class="ga-load-more"
                *ngIf="hasMore"
                (click)="loadMore()"
                [disabled]="loading">
          Load more
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ga-shell { padding: var(--triarq-space-md); }
    .ga-header { margin-bottom: var(--triarq-space-md); }
    .ga-title  { margin: 0; font-size: 18px; font-weight: 600; color: #1E1E1E; }
    .ga-subtitle {
      margin: 4px 0 0; font-size: 11px; font-style: italic; color: #5A5A5A;
    }

    .ga-grid {
      border: 1px solid var(--triarq-color-border);
      border-radius: 6px; background: #fff; overflow: hidden;
    }
    .ga-row {
      display: grid;
      grid-template-columns: 140px 1.6fr 140px 1.2fr 140px;
      gap: var(--triarq-space-sm);
      padding: 8px var(--triarq-space-md);
      border-bottom: 1px solid #E8E8E8;
      align-items: center; font-size: 13px;
    }
    .ga-header-row {
      background: #12274A; color: #fff; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.3px; font-size: 12px;
    }
    .ga-header-row span { color: #fff; }
    .ga-data:hover  { background: #F0F4F8; }
    .ga-cell  { color: #1E1E1E; }
    .ga-muted { color: #5A5A5A; }
    .ga-empty {
      padding: var(--triarq-space-xl); text-align: center;
      color: #5A5A5A; font-size: 13px;
    }
    /* S-021 entity chip — pill, muted bg, no underline */
    .ga-chip {
      display: inline-flex; align-items: center;
      padding: 2px 10px; border-radius: 999px;
      background: rgba(120, 130, 140, 0.10);
      color: var(--triarq-color-primary, #257099);
      text-decoration: none; font-size: 12px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ga-chip:hover { background: rgba(120, 130, 140, 0.20); }

    .ga-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: var(--triarq-space-md);
    }
    .ga-count { font-size: 11px; color: #5A5A5A; }
    .ga-load-more {
      padding: 8px 16px;
      border: 1px solid var(--triarq-color-primary, #257099);
      border-radius: 5px; background: #fff;
      color: var(--triarq-color-primary, #257099);
      font-size: 12px; cursor: pointer;
    }
    .ga-load-more:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class GatesApprovedComponent implements OnInit {
  rows:    ApprovedGateRow[] = [];
  loading              = false;
  loadError            = '';
  pageSize             = PAGE_SIZE;
  /** Number of rows currently rendered — grows by PAGE_SIZE on Load more. */
  visibleCount         = PAGE_SIZE;
  personFilterUserId: string | null = null;

  sortState: SortState<GaSortColumn> = { ...DEFAULT_GA_SORT };

  readonly skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly screenState: ScreenStateService,
    private readonly route:       ActivatedRoute,
    private readonly router:      Router,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.personFilterUserId = this.route.snapshot.queryParamMap.get('personFilter');
    this.restoreSort().then(() => this.load());
  }

  get pageRows(): ApprovedGateRow[] {
    return this.sortedRows.slice(0, this.visibleCount);
  }

  get hasMore(): boolean {
    return this.visibleCount < this.rows.length;
  }

  get sortedRows(): ApprovedGateRow[] {
    const { column, direction } = this.sortState;
    return [...this.rows].sort((a, b) => {
      switch (column) {
        case 'approver_decision_at':
          return compareDate(a.approver_decision_at, b.approver_decision_at, direction);
        case 'gate_name_display':
        case 'initiative_name':
        case 'division_short_name':
        case 'approver_display_name':
          return compareString(a[column], b[column], direction);
      }
    });
  }

  onSortColumn(column: GaSortColumn): void {
    const firstClick: 'asc' | 'desc' = column === 'approver_decision_at' ? 'desc' : 'asc';
    this.sortState = applySortToggle(this.sortState, column, firstClick);
    this.screenState.save(
      SCREEN_KEYS.INITIATIVES_GATES_APPROVED,
      {},
      this.sortState as unknown as Record<string, unknown>
    );
    this.cdr.markForCheck();
  }

  isSorted(column: GaSortColumn): boolean {
    return this.sortState.column === column;
  }

  glyph(column: GaSortColumn): '↑' | '↓' | '' {
    return sortIndicator(this.sortState, column);
  }

  loadMore(): void {
    this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.rows.length);
    this.cdr.markForCheck();
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) { return ''; }
    const t = Date.parse(iso);
    if (Number.isNaN(t)) { return ''; }
    return new Date(t).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  private async restoreSort(): Promise<void> {
    const saved = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_GATES_APPROVED);
    if (!saved) { return; }
    const s = saved.sort_state as Partial<SortState<GaSortColumn>> | null;
    if (s && typeof s === 'object') {
      const validCol = (c: unknown): c is GaSortColumn =>
        c === 'gate_name_display'
        || c === 'initiative_name'
        || c === 'division_short_name'
        || c === 'approver_display_name'
        || c === 'approver_decision_at';
      const validDir = (d: unknown): d is 'asc' | 'desc' => d === 'asc' || d === 'desc';
      if (validCol(s.column) && validDir(s.direction)) {
        this.sortState = { column: s.column, direction: s.direction };
      }
    }
  }

  private load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const params: { approver_user_id?: string } = {};
    if (this.personFilterUserId) {
      params.approver_user_id = this.personFilterUserId;
    }

    this.delivery.listApprovedGates(params).subscribe({
      next: res => {
        if (res.success && Array.isArray(res.data)) {
          this.rows         = res.data;
          this.visibleCount = Math.min(PAGE_SIZE, this.rows.length);
        } else {
          this.loadError = res.error ?? 'Could not load approved gates.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = 'Could not load approved gates.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }
}
