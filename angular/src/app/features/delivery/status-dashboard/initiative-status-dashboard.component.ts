// initiative-status-dashboard.component.ts — Contract 32 (WS4)
// "Initiative Status Dashboard" (D-485). Initiative Tracking nav. Division
// multi-select filter (S-010/S-011/S-012, memory D-171) + Needs Review toggle.
// Grid with Needs Review reasons. S-018 row tap → detail; View Status → read
// panel. D-346 Context B skeleton. S-036 column sort.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { IonicModule }     from '@ionic/angular';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ScreenStateService, SCREEN_KEYS } from '../../../core/services/screen-state.service';
import { DeliveryCycleDetailComponent } from '../detail/delivery-cycle-detail.component';
import { InitiativeStatusUpdatePanelComponent } from '../status-panel/initiative-status-update-panel.component';
import { InitiativeStatusDashboardRow } from '../../../core/types/initiative-status';

type DashSort = 'initiative' | 'division' | 'stage' | 'last_update' | 'updated_by';

const STAGE_LABELS: Record<string, string> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build', VALIDATE: 'Validate',
  PILOT: 'Pilot', UAT: 'UAT', RELEASE: 'Release', OUTCOME: 'Outcome', COMPLETE: 'Complete',
  CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};
const CONFIDENCE = {
  not_started: { label: 'Not Started', color: '#9E9E9E' },
  on_track:    { label: 'On Track',    color: '#22c55e' },
  at_risk:     { label: 'At Risk',     color: '#F2A620' },
  behind:      { label: 'Behind',      color: '#E96127' },
  complete:    { label: 'Complete',    color: '#257099' }
} as Record<string, { label: string; color: string }>;

@Component({
  selector: 'app-initiative-status-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, DeliveryCycleDetailComponent, InitiativeStatusUpdatePanelComponent],
  template: `
    <div class="oi-page" style="max-width:1300px;margin:0 auto;padding:var(--triarq-space-lg);">

      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <h2 style="margin:0;">Initiative Status Dashboard</h2>
        <div style="display:flex;align-items:center;gap:12px;">
          <label class="isd-toggle">
            <input type="checkbox" [checked]="needsReviewOnly" (change)="toggleNeedsReview()" />
            <span>Needs Review only</span>
          </label>
          <button class="oi-btn-secondary isd-sm" (click)="openFilters()">
            Filters <span *ngIf="selectedDivisionIds.length" class="isd-badge">{{ selectedDivisionIds.length }}</span>
          </button>
        </div>
      </div>

      <!-- Active filter chips (S-012) -->
      <div *ngIf="selectedDivisionIds.length" class="isd-chips">
        <span class="isd-chip" *ngFor="let id of selectedDivisionIds">
          Division: {{ divisionLabel(id) }}
          <span class="isd-chip-x" (click)="removeDivision(id)">✕</span>
        </span>
      </div>

      <!-- D-346 Context B skeleton -->
      <div *ngIf="loading" class="oi-card" style="margin-top:12px;">
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
      </div>

      <div *ngIf="!loading" class="oi-card" style="margin-top:12px;overflow-x:auto;">
        <div *ngIf="visibleRows.length === 0" class="isd-empty">No initiatives match the current view.</div>
        <table *ngIf="visibleRows.length" class="isd-table">
          <thead>
            <tr>
              <th (click)="setSort('initiative')">Initiative Name {{ arrow('initiative') }}</th>
              <th (click)="setSort('division')">Division {{ arrow('division') }}</th>
              <th (click)="setSort('stage')">Stage {{ arrow('stage') }}</th>
              <th (click)="setSort('last_update')">Last Update {{ arrow('last_update') }}</th>
              <th (click)="setSort('updated_by')">Updated By {{ arrow('updated_by') }}</th>
              <th>Escalation</th>
              <th>Confidence</th>
              <th>Needs Review Reason</th>
              <th>View Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of visibleRows">
              <td><a class="isd-link" (click)="openDetail(r.initiative_id)">{{ r.cycle_title }}</a></td>
              <td>{{ r.division_name || '—' }}</td>
              <td>{{ stageLabel(r.current_lifecycle_stage) }}</td>
              <td>{{ r.saved_at ? formatDateTime(r.saved_at) : 'Never' }}</td>
              <td>{{ r.saved_by_name || '—' }}</td>
              <td>
                <span *ngIf="r.escalation_needed" class="isd-esc">Yes</span>
                <span *ngIf="!r.escalation_needed">—</span>
              </td>
              <td>
                <ng-container *ngIf="confidenceOf(r) as cf; else noConf">
                  <span class="isd-dot" [style.background]="cf.color"></span> {{ cf.label }}
                </ng-container>
                <ng-template #noConf>—</ng-template>
              </td>
              <td>
                <span *ngIf="r.needs_review_reasons.length === 0">—</span>
                <span *ngFor="let reason of r.needs_review_reasons" class="isd-reason">{{ reason }}</span>
              </td>
              <td><button class="oi-btn-secondary isd-sm" (click)="openStatus(r.initiative_id, r.cycle_title)">View Status</button></td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="visibleRows.length" class="isd-foot">
          {{ needsReviewOnly ? (visibleRows.length + ' of ' + rows.length + ' initiatives') : (visibleRows.length + ' initiatives') }}
        </div>
      </div>
    </div>

    <!-- Filter panel (S-010/S-011) -->
    <div *ngIf="filterOpen" class="oi-scrim oi-scrim-detail" (click)="filterOpen = false"></div>
    <div *ngIf="filterOpen" class="oi-side-panel oi-side-detail" role="dialog" aria-label="Filters">
      <div class="oi-side-head">
        <strong>Filters</strong>
        <button class="oi-close-btn" (click)="filterOpen = false" aria-label="Close">✕</button>
      </div>
      <div class="oi-side-body">
        <div class="oi-zone-title">Division</div>
        <label class="isd-check" *ngFor="let d of divisionOptions">
          <input type="checkbox" [checked]="draftDivisionIds.includes(d.id)" (change)="toggleDraft(d.id)" />
          <span>{{ d.name }}</span>
        </label>
        <div *ngIf="divisionOptions.length === 0" class="oi-zone-explain">No divisions in the current results.</div>
      </div>
      <div class="oi-side-foot oi-side-foot-split">
        <button class="oi-btn-secondary" (click)="clearFilters()">Clear all</button>
        <button class="oi-btn-primary" (click)="applyFilters()">Apply filters</button>
      </div>
    </div>

    <!-- Row-tap detail (S-018) -->
    <app-delivery-cycle-detail
      *ngIf="detailCycleId"
      [cycleId]="detailCycleId"
      (close)="detailCycleId = null; load()">
    </app-delivery-cycle-detail>

    <!-- View Status read-only panel -->
    <app-initiative-status-update-panel
      *ngIf="viewId"
      [initiativeId]="viewId"
      [initiativeName]="viewName"
      mode="read"
      (acknowledged)="load()"
      (viewInitiative)="openDetail(viewId); viewId = null"
      (cancelled)="viewId = null">
    </app-initiative-status-update-panel>
  `,
  styles: [`
    :host { display:block; }
    .isd-toggle { display:inline-flex; align-items:center; gap:6px; font-size:13px; cursor:pointer; }
    .isd-sm { font-size:11px; padding:3px 8px; }
    .isd-badge { background:var(--triarq-color-primary,#257099); color:#fff; border-radius:999px; padding:0 6px; font-size:11px; }
    .isd-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .isd-chip { background:var(--triarq-color-fog,#f4f4f4); border-radius:999px; padding:2px 10px; font-size:12px; display:inline-flex; align-items:center; gap:6px; }
    .isd-chip-x { cursor:pointer; color:var(--triarq-color-text-secondary); }
    .isd-table { width:100%; border-collapse:collapse; font-size:13px; }
    .isd-table th { text-align:left; padding:8px; border-bottom:1px solid var(--triarq-color-border,#e0e0e0); cursor:pointer; user-select:none; color:var(--triarq-color-text-secondary); font-weight:500; white-space:nowrap; }
    .isd-table td { padding:8px; border-bottom:1px solid var(--triarq-color-fog,#f4f4f4); vertical-align:top; }
    .isd-link { color:var(--triarq-color-primary,#257099); cursor:pointer; }
    .isd-esc { background:var(--triarq-color-error,#E96127); color:#fff; border-radius:999px; padding:1px 8px; font-size:11px; }
    .isd-dot { display:inline-block; width:10px; height:10px; border-radius:50%; vertical-align:middle; }
    .isd-reason { display:inline-block; background:var(--triarq-color-error,#E96127); color:#fff; border-radius:999px; padding:1px 8px; font-size:11px; margin:0 4px 4px 0; }
    .isd-empty { padding:16px; color:#5A5A5A; font-style:italic; }
    .isd-foot { padding:8px; font-size:12px; color:var(--triarq-color-text-secondary); }
    .isd-check { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:13px; }
  `]
})
export class InitiativeStatusDashboardComponent implements OnInit {
  loading = false;
  rows: InitiativeStatusDashboardRow[] = [];
  needsReviewOnly = false;

  // Division filter (S-010/S-011/S-012, memory D-171).
  filterOpen = false;
  selectedDivisionIds: string[] = [];
  draftDivisionIds: string[] = [];

  sortField: DashSort = 'initiative';
  sortDir: 'asc' | 'desc' = 'asc';

  detailCycleId: string | null = null;
  viewId: string | null = null;
  viewName = '';

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.screenState.restore(SCREEN_KEYS.INITIATIVE_STATUS_DASHBOARD).then(s => {
      if (s?.filter_state?.['division_ids']) {
        this.selectedDivisionIds = (s.filter_state['division_ids'] as string[]) || [];
      }
      if (s?.sort_state) {
        this.sortField = (s.sort_state['field'] as DashSort) ?? this.sortField;
        this.sortDir = (s.sort_state['dir'] as 'asc' | 'desc') ?? this.sortDir;
      }
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.delivery.getInitiativeStatusDashboard({ needs_review_only: this.needsReviewOnly }).subscribe({
      next: (res) => { this.rows = (res.success && res.data) ? res.data : []; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.rows = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  toggleNeedsReview(): void { this.needsReviewOnly = !this.needsReviewOnly; this.load(); }

  // ── Division filter options derived from caller-scoped results ──────────────
  get divisionOptions(): { id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const r of this.rows) { if (r.division_id) { seen.set(r.division_id, r.division_name || r.division_id); } }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  divisionLabel(id: string): string {
    return this.divisionOptions.find(d => d.id === id)?.name || id;
  }
  toggleDraft(id: string): void {
    this.draftDivisionIds = this.draftDivisionIds.includes(id)
      ? this.draftDivisionIds.filter(x => x !== id)
      : [...this.draftDivisionIds, id];
  }
  applyFilters(): void {
    this.selectedDivisionIds = [...this.draftDivisionIds];
    this.filterOpen = false;
    this.persistFilter();
  }
  clearFilters(): void { this.draftDivisionIds = []; }
  removeDivision(id: string): void {
    this.selectedDivisionIds = this.selectedDivisionIds.filter(x => x !== id);
    this.persistFilter();
  }
  openFilters(): void { this.draftDivisionIds = [...this.selectedDivisionIds]; this.filterOpen = true; }
  private persistFilter(): void {
    this.screenState.save(SCREEN_KEYS.INITIATIVE_STATUS_DASHBOARD,
      { division_ids: this.selectedDivisionIds }, { field: this.sortField, dir: this.sortDir });
  }

  get visibleRows(): InitiativeStatusDashboardRow[] {
    let out = this.rows;
    if (this.selectedDivisionIds.length) {
      out = out.filter(r => this.selectedDivisionIds.includes(r.division_id));
    }
    const dir = this.sortDir === 'asc' ? 1 : -1;
    const key = (r: InitiativeStatusDashboardRow): string => {
      switch (this.sortField) {
        case 'initiative':  return r.cycle_title || '';
        case 'division':    return r.division_name || '';
        case 'stage':       return r.current_lifecycle_stage || '';
        case 'last_update': return r.saved_at || '';
        case 'updated_by':  return r.saved_by_name || '';
      }
    };
    return [...out].sort((a, b) => key(a).localeCompare(key(b)) * dir);
  }

  setSort(field: DashSort): void {
    if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.persistFilter();
  }
  arrow(f: DashSort): string { return this.sortField === f ? (this.sortDir === 'asc' ? '↑' : '↓') : '↕'; }

  openDetail(id: string): void { this.detailCycleId = id; this.cdr.markForCheck(); }
  openStatus(id: string, name: string): void { this.viewId = id; this.viewName = name; this.cdr.markForCheck(); }

  confidenceOf(r: InitiativeStatusDashboardRow): { label: string; color: string } | null {
    const v = r.pilot_confidence || r.close_confidence;
    return v ? (CONFIDENCE[v] || null) : null;
  }
  stageLabel(s: string): string { return STAGE_LABELS[s] || s; }
  formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
