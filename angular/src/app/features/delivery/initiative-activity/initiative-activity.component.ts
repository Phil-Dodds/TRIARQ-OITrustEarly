// initiative-activity.component.ts
// Pathways OI Trust — Initiative Activity feed (D-428, D-439).
// Route: /initiatives/activity
//
// Contract 25 (D-439) replaces the Contract 23 top-bar date dropdown with a
// full S-010 slide-in filter panel: Division / Person / Event type / Date
// range. Filter chip bar per S-012 shows active non-default filters; X on a
// chip resets that dimension and re-queries immediately. Apply / Clear all
// commit model per S-011. Filter state persists under D-171 screen key
// `initiatives.activity`.
//
// CC-25-01 (deviation): Event type filter uses a multi-select checklist inside
// the drill-in row, conflicting with S-013 "no checkbox lists inside the
// panel." Spec WS2 §Event type filter explicitly mandates a checklist for this
// surface; that overrides S-013 for this dimension.
//
// CC-25-02 (deviation): Person filter is an inline multi-select checklist
// (same drill-in treatment as Event type) rather than the S-022 EntityPicker
// modal. The codebase has no multi-select EntityPicker variant; building one
// is out of scope for Contract 25. Multi-select EntityPicker deferred.
//
// Standing S-021 exception (Cand-05): actor display is bold text — no User
// detail panel exists yet so chips are deferred.
//
// "Show Only My Activity" checkbox preserved as a convenience shortcut — it
// toggles the Person filter to the current user only (set on check, cleared
// on uncheck). The route query param `?mine=1` still pre-sets it.
//
// Source: D-428, D-439, D-181, D-180, D-200, D-171, D-346, S-010, S-011,
//         S-012, S-013, S-015, S-021, S-022.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

import { DeliveryService }    from '../../../core/services/delivery.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { McpService }         from '../../../core/services/mcp.service';
import {
  ScreenStateService,
  SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import {
  Division,
  InitiativeActivityEntry,
  User
} from '../../../core/types/database';

type DateRangeKey = '7d' | '30d' | '90d' | 'custom';

const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  '7d':     'Last 7 days',
  '30d':    'Last 30 days',
  '90d':    'Last 90 days',
  'custom': 'Custom range'
};

const DATE_RANGE_DAYS: Record<'7d'|'30d'|'90d', number> = {
  '7d':  7,
  '30d': 30,
  '90d': 90
};

const PAGE_SIZE = 50;

// Known event types per Contract 25 WS2 §Event type filter display name map.
// New types fall back to "underscore → space, title-case" — surfaced as a
// CC-decision when first encountered (CC-25-03 placeholder for future drift).
const EVENT_TYPE_DISPLAY: Record<string, string> = {
  gate_submitted:                 'Gate submitted',
  gate_approved:                  'Gate approved',
  gate_returned:                  'Gate returned',
  gate_blocked:                   'Gate blocked',
  // Contract 28 / D-447 / D-449 / D-451 — three new event types.
  gate_skipped:                   'Gate skipped',
  gate_backdated:                 'Gate backdated',
  milestone_status_reverted:      'Milestone status reverted',
  milestone_target_date_changed:  'Milestone date set',
  milestone_actual_date_set:      'Milestone actual date set',
  initiative_created:             'Initiative created',
  initiative_updated:             'Initiative updated',
  stage_advanced:                 'Stage advanced'
};

const KNOWN_EVENT_TYPES = Object.keys(EVENT_TYPE_DISPLAY);

type FilterRow = 'division' | 'person' | 'event' | 'date' | null;

interface AppliedFilters {
  divisionIds:  string[];   // empty = default (My Divisions; admin = all)
  personIds:    string[];   // empty = all persons
  eventTypes:   string[];   // empty = all event types
  dateRange:    DateRangeKey;
  customAfter:  string;     // ISO date (yyyy-mm-dd)
  customBefore: string;     // ISO date (yyyy-mm-dd)
}

const DEFAULT_FILTERS: AppliedFilters = {
  divisionIds:  [],
  personIds:    [],
  eventTypes:   [],
  dateRange:    '7d',
  customAfter:  '',
  customBefore: ''
};

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

        <!-- Top controls: Show Only Mine + Filter button -->
        <div class="ia-controls">
          <label class="ia-mine-toggle">
            <input type="checkbox"
                   [ngModel]="showOnlyMine"
                   (ngModelChange)="onMineToggle($event)"
                   [disabled]="!currentUserId" />
            Show Only My Activity
          </label>

          <button class="ia-filter-btn" (click)="openPanel()">
            Filters
            <span class="ia-filter-count" *ngIf="activeFilterCount > 0">
              {{ activeFilterCount }}
            </span>
          </button>
        </div>
      </div>

      <!-- S-012 active filter chip bar -->
      <div class="ia-chip-bar" *ngIf="activeChips.length > 0">
        <span class="ia-chip ia-active-chip"
              *ngFor="let chip of activeChips">
          {{ chip.label }}
          <button class="ia-chip-x"
                  (click)="dismissChip(chip.dim)"
                  [attr.aria-label]="'Remove ' + chip.label">✕</button>
        </span>
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
            No activity matches the current filters.
          </div>

          <!-- Rows -->
          <div *ngFor="let e of events; trackBy: trackById" class="ia-row">
            <span class="ia-time" [title]="absoluteTime(e.created_at)">
              {{ relativeTime(e.created_at) }}
            </span>

            <!-- Actor — bold text (Cand-05 S-021 exception) -->
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

            <!-- Initiative chip — full-page route per D-440 (no right-panel
                 slot on this surface) -->
            <a *ngIf="e.delivery_cycle_id"
               class="ia-chip"
               [routerLink]="['/initiatives', e.delivery_cycle_id]">
              {{ e.initiative_title || 'Initiative' }}
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

      <!-- S-010/011/013 filter panel -->
      <div class="ia-scrim" *ngIf="panelOpen" (click)="cancelPanel()"></div>
      <aside class="ia-panel" *ngIf="panelOpen"
             role="dialog" aria-modal="true" aria-label="Filters">
        <header class="ia-panel-head">
          <strong>Filters</strong>
          <button class="oi-close-btn"
                  (click)="cancelPanel()" aria-label="Close">✕</button>
        </header>
        <div class="ia-panel-body">

          <!-- Division row -->
          <div class="ia-frow" [class.ia-frow-open]="expandedRow === 'division'">
            <button class="ia-frow-head" (click)="toggleRow('division')">
              <span>Division</span>
              <span class="ia-frow-val">{{ divisionValueLabel(pending) }}</span>
            </button>
            <div class="ia-frow-body" *ngIf="expandedRow === 'division'">
              <ng-container *ngIf="divisions.length === 0">
                <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              </ng-container>
              <label *ngFor="let d of divisions" class="ia-check">
                <input type="checkbox"
                       [checked]="pending.divisionIds.includes(d.id)"
                       (change)="toggleDivision(d.id)" />
                {{ d.display_name_short || d.division_name }}
              </label>
            </div>
          </div>

          <!-- Person row (CC-25-02 inline multi-select) -->
          <div class="ia-frow" [class.ia-frow-open]="expandedRow === 'person'">
            <button class="ia-frow-head" (click)="toggleRow('person')">
              <span>Person</span>
              <span class="ia-frow-val">{{ personValueLabel(pending) }}</span>
            </button>
            <div class="ia-frow-body" *ngIf="expandedRow === 'person'">
              <input type="search"
                     class="ia-search"
                     placeholder="Search people…"
                     [(ngModel)]="personSearch" />
              <ng-container *ngIf="users.length === 0">
                <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              </ng-container>
              <div class="ia-person-list">
                <label *ngFor="let u of filteredUsers" class="ia-check">
                  <input type="checkbox"
                         [checked]="pending.personIds.includes(u.id)"
                         (change)="togglePerson(u.id)" />
                  {{ u.display_name }}
                </label>
                <div *ngIf="filteredUsers.length === 0 && users.length > 0"
                     class="ia-frow-empty">
                  No people match "{{ personSearch }}".
                </div>
              </div>
            </div>
          </div>

          <!-- Event type row (CC-25-01 checklist) -->
          <div class="ia-frow" [class.ia-frow-open]="expandedRow === 'event'">
            <button class="ia-frow-head" (click)="toggleRow('event')">
              <span>Event type</span>
              <span class="ia-frow-val">{{ eventValueLabel(pending) }}</span>
            </button>
            <div class="ia-frow-body" *ngIf="expandedRow === 'event'">
              <label *ngFor="let t of knownEventTypes" class="ia-check">
                <input type="checkbox"
                       [checked]="pending.eventTypes.includes(t)"
                       (change)="toggleEvent(t)" />
                {{ eventTypeLabel(t) }}
              </label>
            </div>
          </div>

          <!-- Date range row -->
          <div class="ia-frow" [class.ia-frow-open]="expandedRow === 'date'">
            <button class="ia-frow-head" (click)="toggleRow('date')">
              <span>Date range</span>
              <span class="ia-frow-val">{{ dateValueLabel(pending) }}</span>
            </button>
            <div class="ia-frow-body" *ngIf="expandedRow === 'date'">
              <label class="ia-radio" *ngFor="let k of rangeKeys">
                <input type="radio"
                       name="ia-range"
                       [value]="k"
                       [ngModel]="pending.dateRange"
                       (ngModelChange)="setDateRange(k)" />
                {{ rangeLabel(k) }}
              </label>
              <div *ngIf="pending.dateRange === 'custom'" class="ia-custom-range">
                <label class="ia-label">From</label>
                <input type="date" class="ia-date-input"
                       [(ngModel)]="pending.customAfter" />
                <label class="ia-label">To</label>
                <input type="date" class="ia-date-input"
                       [(ngModel)]="pending.customBefore" />
              </div>
            </div>
          </div>

        </div>

        <!-- S-011: Apply / Clear all / X. X is the close button in the header. -->
        <footer class="ia-panel-foot">
          <button class="oi-btn-secondary" (click)="clearAll()">Clear all</button>
          <button class="oi-btn-primary"   (click)="applyFilters()">Apply filters</button>
        </footer>
      </aside>

    </div>
  `,
  // D-371: filter-panel and feed CSS moved to global styles.scss to stay under
  // the 4kB component-style error budget. Selectors keep the `ia-` prefix.
  styles: [`
    .ia-shell {
      max-width: 1080px;
      margin: var(--triarq-space-2xl) auto;
      padding: 0 var(--triarq-space-md);
    }
    .ia-header { margin-bottom: var(--triarq-space-lg); }
    .ia-title { margin: 0 0 4px 0; }
  `]
})
export class InitiativeActivityComponent implements OnInit {

  readonly rangeKeys: DateRangeKey[] = ['7d', '30d', '90d', 'custom'];
  readonly knownEventTypes = KNOWN_EVENT_TYPES;

  /** Applied (committed) filter state — used for the actual query. */
  applied: AppliedFilters = { ...DEFAULT_FILTERS };
  /** Pending (panel-staging) filter state — copied to applied on Apply. */
  pending: AppliedFilters = { ...DEFAULT_FILTERS };

  events:    InitiativeActivityEntry[] = [];
  totalCount = 0;
  hasMore    = false;
  loading    = false;
  loadingMore = false;

  panelOpen   = false;
  expandedRow: FilterRow = null;
  personSearch = '';

  divisions: Division[] = [];
  users:     User[]     = [];
  divisionsLoaded = false;
  usersLoaded     = false;

  showOnlyMine     = false;
  currentUserId: string | null = null;

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly profile:     UserProfileService,
    private readonly mcp:         McpService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef,
    private readonly route:       ActivatedRoute,
    private readonly _router:     Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.profile.getCurrentProfile()?.id ?? null;

    const mineParam = this.route.snapshot.queryParamMap.get('mine');
    this.showOnlyMine = mineParam === '1' && !!this.currentUserId;

    this.restoreFilters().then(() => {
      if (this.showOnlyMine && this.currentUserId) {
        this.applied = { ...this.applied, personIds: [this.currentUserId] };
      }
      this.pending = { ...this.applied };
      this.reload();
    });
  }

  // ── Filter chip bar (S-012) ────────────────────────────────────────────────

  get activeFilterCount(): number {
    return this.activeChips.length;
  }

  get activeChips(): { dim: keyof AppliedFilters; label: string }[] {
    const chips: { dim: keyof AppliedFilters; label: string }[] = [];
    const a = this.applied;
    if (a.divisionIds.length > 0) {
      chips.push({ dim: 'divisionIds', label: 'Division: ' + this.summarize(
        a.divisionIds.map(id => {
          const d = this.divisions.find(x => x.id === id);
          return d ? (d.display_name_short || d.division_name) : 'Division';
        })
      ) });
    }
    if (a.personIds.length > 0) {
      chips.push({ dim: 'personIds', label: 'Person: ' + this.summarize(
        a.personIds.map(id => {
          const u = this.users.find(x => x.id === id);
          return u?.display_name ?? 'Person';
        })
      ) });
    }
    if (a.eventTypes.length > 0) {
      chips.push({ dim: 'eventTypes', label: 'Event: ' + this.summarize(
        a.eventTypes.map(t => this.eventTypeLabel(t))
      ) });
    }
    if (a.dateRange !== '7d') {
      chips.push({ dim: 'dateRange', label: 'Date: ' + this.dateValueLabel(a) });
    }
    return chips;
  }

  private summarize(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length <= 2)  return items.join(', ');
    return `${items[0]} +${items.length - 1}`;
  }

  /** Remove one dimension's filter and immediately re-query (S-012). */
  dismissChip(dim: keyof AppliedFilters): void {
    const next = { ...this.applied };
    if (dim === 'divisionIds') next.divisionIds = [];
    if (dim === 'personIds')   {
      next.personIds = [];
      this.showOnlyMine = false;
    }
    if (dim === 'eventTypes')  next.eventTypes = [];
    if (dim === 'dateRange')   { next.dateRange = '7d'; next.customAfter = ''; next.customBefore = ''; }
    this.applied = next;
    this.pending = { ...next };
    this.persistFilters();
    this.reload();
  }

  // ── Panel open / close ─────────────────────────────────────────────────────

  openPanel(): void {
    this.pending     = { ...this.applied };
    this.expandedRow = null;
    this.panelOpen   = true;
    this.personSearch = '';
    this.ensureDivisionsLoaded();
    this.ensureUsersLoaded();
    this.cdr.markForCheck();
  }

  cancelPanel(): void {
    this.panelOpen   = false;
    this.expandedRow = null;
    this.cdr.markForCheck();
  }

  applyFilters(): void {
    this.applied = { ...this.pending };
    if (this.currentUserId && this.applied.personIds.length === 1 &&
        this.applied.personIds[0] === this.currentUserId) {
      this.showOnlyMine = true;
    } else {
      this.showOnlyMine = false;
    }
    this.panelOpen   = false;
    this.expandedRow = null;
    this.persistFilters();
    this.reload();
  }

  clearAll(): void {
    this.pending = { ...DEFAULT_FILTERS };
    this.expandedRow = null;
    this.cdr.markForCheck();
  }

  // ── Drill-in (S-013) — one row at a time ───────────────────────────────────

  toggleRow(row: Exclude<FilterRow, null>): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.cdr.markForCheck();
  }

  // ── Per-row toggles ────────────────────────────────────────────────────────

  toggleDivision(id: string): void {
    this.pending = { ...this.pending, divisionIds: toggleId(this.pending.divisionIds, id) };
  }
  togglePerson(id: string): void {
    this.pending = { ...this.pending, personIds: toggleId(this.pending.personIds, id) };
  }
  toggleEvent(t: string): void {
    this.pending = { ...this.pending, eventTypes: toggleId(this.pending.eventTypes, t) };
  }
  setDateRange(k: DateRangeKey): void {
    this.pending = { ...this.pending, dateRange: k };
  }

  // ── Show Only My Activity checkbox ─────────────────────────────────────────

  onMineToggle(next: boolean): void {
    if (next && this.currentUserId) {
      this.applied = { ...this.applied, personIds: [this.currentUserId] };
      this.showOnlyMine = true;
    } else {
      this.applied = { ...this.applied, personIds: [] };
      this.showOnlyMine = false;
    }
    this.pending = { ...this.applied };
    this.persistFilters();
    this.reload();
  }

  // ── Label helpers ──────────────────────────────────────────────────────────

  rangeLabel(k: DateRangeKey): string { return DATE_RANGE_LABELS[k]; }

  divisionValueLabel(f: AppliedFilters): string {
    if (f.divisionIds.length === 0) return 'My Divisions';
    const names = f.divisionIds.map(id => {
      const d = this.divisions.find(x => x.id === id);
      return d ? (d.display_name_short || d.division_name) : '...';
    });
    return this.summarize(names);
  }

  personValueLabel(f: AppliedFilters): string {
    if (f.personIds.length === 0) return 'All';
    const names = f.personIds.map(id => {
      const u = this.users.find(x => x.id === id);
      return u?.display_name ?? '...';
    });
    return this.summarize(names);
  }

  eventValueLabel(f: AppliedFilters): string {
    if (f.eventTypes.length === 0) return 'All';
    return this.summarize(f.eventTypes.map(t => this.eventTypeLabel(t)));
  }

  dateValueLabel(f: AppliedFilters): string {
    if (f.dateRange === 'custom') {
      if (f.customAfter && f.customBefore) return `${f.customAfter} → ${f.customBefore}`;
      if (f.customAfter)                   return `Since ${f.customAfter}`;
      if (f.customBefore)                  return `Until ${f.customBefore}`;
      return 'Custom range';
    }
    return DATE_RANGE_LABELS[f.dateRange];
  }

  eventTypeLabel(t: string): string {
    return EVENT_TYPE_DISPLAY[t] ?? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  get filteredUsers(): User[] {
    const q = this.personSearch.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  trackById = (_i: number, e: InitiativeActivityEntry): string => e.event_id;

  reload(): void {
    this.loading    = true;
    this.events     = [];
    this.totalCount = 0;
    this.hasMore    = false;
    this.cdr.markForCheck();

    this.delivery.listInitiativeActivity(this.buildQueryParams()).subscribe({
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

  loadMore(): void {
    if (this.loadingMore || !this.hasMore || this.events.length === 0) return;
    this.loadingMore = true;
    this.cdr.markForCheck();

    const oldest = this.events[this.events.length - 1];
    this.delivery.listInitiativeActivity({
      ...this.buildQueryParams(),
      before_cursor: oldest.created_at,
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

  private buildQueryParams(): Parameters<DeliveryService['listInitiativeActivity']>[0] {
    const a = this.applied;
    const params: Parameters<DeliveryService['listInitiativeActivity']>[0] = {
      limit: PAGE_SIZE,
      after: this.afterIso()
    };
    if (a.divisionIds.length > 0) params.division_ids    = a.divisionIds;
    if (a.personIds.length > 0)   params.person_user_ids = a.personIds;
    if (a.eventTypes.length > 0)  params.event_types     = a.eventTypes;
    if (a.dateRange === 'custom' && a.customBefore) {
      // Custom upper bound is exclusive — add one day to make end-of-day inclusive.
      const before = new Date(a.customBefore + 'T00:00:00Z');
      before.setUTCDate(before.getUTCDate() + 1);
      params.before_cursor = before.toISOString();
    }
    return params;
  }

  /** Lower bound (after) ISO for the current range. */
  private afterIso(): string {
    const a = this.applied;
    if (a.dateRange === 'custom') {
      if (a.customAfter) {
        return new Date(a.customAfter + 'T00:00:00Z').toISOString();
      }
      return new Date(0).toISOString();
    }
    const days = DATE_RANGE_DAYS[a.dateRange];
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  // ── Lazy-loaded panel data ─────────────────────────────────────────────────

  private ensureDivisionsLoaded(): void {
    if (this.divisionsLoaded) return;
    this.mcp.call<Division[]>('division', 'list_divisions', { include_inactive: false }).subscribe({
      next: res => {
        if (res.success && Array.isArray(res.data)) {
          this.divisions = [...res.data].sort((a, b) =>
            (a.display_name_short || a.division_name).localeCompare(b.display_name_short || b.division_name)
          );
        }
        this.divisionsLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => { this.divisionsLoaded = true; this.cdr.markForCheck(); }
    });
  }

  private ensureUsersLoaded(): void {
    if (this.usersLoaded) return;
    this.mcp.call<User[]>('division', 'list_users', {}).subscribe({
      next: res => {
        if (res.success && Array.isArray(res.data)) {
          this.users = [...res.data]
            .filter(u => u.is_active !== false)
            .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
        }
        this.usersLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => { this.usersLoaded = true; this.cdr.markForCheck(); }
    });
  }

  // ── Persistence (D-171) ────────────────────────────────────────────────────

  private async restoreFilters(): Promise<void> {
    try {
      const state = await this.screenState.restore(SCREEN_KEYS.INITIATIVES_ACTIVITY);
      if (state?.filter_state) {
        const f = state.filter_state as Partial<AppliedFilters>;
        this.applied = {
          divisionIds:  Array.isArray(f.divisionIds) ? f.divisionIds : [],
          personIds:    Array.isArray(f.personIds)   ? f.personIds   : [],
          eventTypes:   Array.isArray(f.eventTypes)  ? f.eventTypes  : [],
          dateRange:    (f.dateRange as DateRangeKey) ?? '7d',
          customAfter:  typeof f.customAfter  === 'string' ? f.customAfter  : '',
          customBefore: typeof f.customBefore === 'string' ? f.customBefore : ''
        };
      }
    } catch { /* restore failures degrade to defaults */ }
  }

  private persistFilters(): void {
    void this.screenState.save(
      SCREEN_KEYS.INITIATIVES_ACTIVITY,
      this.applied as unknown as Record<string, unknown>,
      {}
    );
  }

  // ── Time formatting ────────────────────────────────────────────────────────

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

// ── Local pure helper ────────────────────────────────────────────────────────

function toggleId(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}
