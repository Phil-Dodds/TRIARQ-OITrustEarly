// completed-actions-list.component.ts — Pathways OI Trust
// Contract 30 follow-up. The "Completed" tab of My Actions — actions the caller
// already took (approver decisions + consultation responses) from
// list_completed_actions. Read-only history: no Approve/Deny action; the
// Initiative chip clicks through to the initiative detail (read-only), carrying
// returnTo so exit returns to this tab.
//
// Same locally-replicated S-011/S-012/S-013 filter pattern + S-036 sort as the
// Open list. Date filter keys on acted_at (when the caller acted). Default last
// 21 days, clearable. Screen key actions.completed (D-171). Full load (D-346).

import {
  Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CompletedActionItem } from '../../core/types/database';
import { ScreenStateService, SCREEN_KEYS } from '../../core/services/screen-state.service';
import { GATE_DISPLAY, GATE_KEYS, relativeDays, daysAgoIso, ACTIONS_DEFAULT_FILTER_DAYS } from './actions-util';

type SortField = 'gate' | 'initiative' | 'division' | 'decision' | 'acted';

@Component({
  selector:        'app-completed-actions-list',
  standalone:      true,
  imports:         [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ga-controls">
      <button class="ga-filters-btn" type="button" (click)="panelOpen = !panelOpen">
        Filters
        <span *ngIf="activeFilterCount > 0" class="ga-filters-count">{{ activeFilterCount }}</span>
      </button>
      <div class="ga-chips" *ngIf="activeFilterCount > 0">
        <span *ngIf="appliedDateActive" class="ga-chip">
          Acted in last {{ days }} days
          <button type="button" (click)="removeDate()" aria-label="Clear date filter">×</button>
        </span>
        <span *ngFor="let g of appliedGates" class="ga-chip">
          Gate: {{ gateDisplay(g) }}
          <button type="button" (click)="removeGate(g)" [attr.aria-label]="'Clear ' + gateDisplay(g)">×</button>
        </span>
        <span *ngFor="let d of appliedDivisions" class="ga-chip">
          Division: {{ d }}
          <button type="button" (click)="removeDivision(d)" [attr.aria-label]="'Clear ' + d">×</button>
        </span>
      </div>
    </div>

    <div *ngIf="panelOpen" class="ga-panel">
      <div class="ga-panel-row">
        <button class="ga-panel-rowhead" type="button" (click)="toggleRow('gate')">
          <span>Gate</span><span>{{ openRow === 'gate' ? '▲' : '▼' }}</span>
        </button>
        <div *ngIf="openRow === 'gate'" class="ga-panel-opts">
          <label *ngFor="let g of gateKeys" class="ga-opt">
            <input type="checkbox" [checked]="stagedGates.has(g)" (change)="toggleStaged(stagedGates, g)" /> {{ gateDisplay(g) }}
          </label>
        </div>
      </div>
      <div class="ga-panel-row">
        <button class="ga-panel-rowhead" type="button" (click)="toggleRow('division')">
          <span>Division</span><span>{{ openRow === 'division' ? '▲' : '▼' }}</span>
        </button>
        <div *ngIf="openRow === 'division'" class="ga-panel-opts">
          <label *ngFor="let d of divisionOptions" class="ga-opt">
            <input type="checkbox" [checked]="stagedDivisions.has(d)" (change)="toggleStaged(stagedDivisions, d)" /> {{ d }}
          </label>
          <div *ngIf="divisionOptions.length === 0" class="ga-opt-empty">No Divisions in this list.</div>
        </div>
      </div>
      <div class="ga-panel-row">
        <button class="ga-panel-rowhead" type="button" (click)="toggleRow('date')">
          <span>Action date</span><span>{{ openRow === 'date' ? '▲' : '▼' }}</span>
        </button>
        <div *ngIf="openRow === 'date'" class="ga-panel-opts">
          <label class="ga-opt">
            <input type="checkbox" [checked]="stagedDateActive" (change)="stagedDateActive = !stagedDateActive" /> Acted in the last {{ days }} days
          </label>
        </div>
      </div>
      <div class="ga-panel-actions">
        <button class="ga-btn-primary" type="button" (click)="applyFilters()">Apply filters</button>
        <button class="ga-btn-text" type="button" (click)="clearAll()">Clear all</button>
      </div>
    </div>

    <div *ngIf="loading" class="ga-skeleton">
      <div class="ga-skel-row" *ngFor="let r of [1,2,3,4,5]"></div>
    </div>

    <div *ngIf="!loading" class="ga-grid" role="table">
      <div class="ga-grid-head" role="row">
        <span class="ga-sort" [class.ga-sort--active]="sortField==='gate'" (click)="setSort('gate')">Gate {{ icon('gate') }}</span>
        <span class="ga-sort" [class.ga-sort--active]="sortField==='initiative'" (click)="setSort('initiative')">Initiative {{ icon('initiative') }}</span>
        <span class="ga-sort" [class.ga-sort--active]="sortField==='division'" (click)="setSort('division')">Division {{ icon('division') }}</span>
        <span class="ga-sort" [class.ga-sort--active]="sortField==='decision'" (click)="setSort('decision')">Your decision {{ icon('decision') }}</span>
        <span class="ga-sort" [class.ga-sort--active]="sortField==='acted'" (click)="setSort('acted')">When {{ icon('acted') }}</span>
      </div>

      <div class="ga-row" role="row" *ngFor="let item of view; trackBy: trackByItem">
        <span>{{ item.gate_name_display }}</span>
        <a class="ga-init-chip" [routerLink]="['/initiatives', item.delivery_cycle_id]"
           [queryParams]="{ gate: item.gate_name, returnTo: returnTo }">{{ item.cycle_title }}</a>
        <span class="ga-muted">{{ item.division_display_name_short }}</span>
        <span [class.ca-neg]="isNegative(item)">{{ item.decision }}</span>
        <span class="ga-muted" [title]="item.acted_at">{{ rel(item.acted_at) }}</span>
      </div>

      <div *ngIf="view.length === 0" class="ga-empty">
        {{ appliedDateActive ? ('No actions completed in the last ' + days + ' days.') : 'No completed actions yet.' }}
        <a *ngIf="appliedDateActive" (click)="removeDate()" class="ga-empty-link">Clear date filter</a>
      </div>
    </div>
  `,
  styles: [`
    .ga-controls { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .ga-filters-btn { display:inline-flex;align-items:center;gap:6px;border:1px solid var(--triarq-color-border,#e0e0e0);
                      background:#fff;border-radius:var(--triarq-radius-button,5px);padding:6px 12px;cursor:pointer;font-size:13px; }
    .ga-filters-count { background:var(--triarq-color-primary,#257099);color:#fff;border-radius:999px;padding:0 7px;font-size:11px;font-weight:700; }
    .ga-chips { display:flex;gap:6px;flex-wrap:wrap; }
    .ga-chip { display:inline-flex;align-items:center;gap:4px;background:rgba(37,112,153,0.08);color:#257099;border-radius:999px;padding:2px 6px 2px 10px;font-size:12px; }
    .ga-chip button { background:none;border:none;cursor:pointer;color:inherit;font-size:14px;line-height:1;padding:0 2px; }
    .ga-panel { border:1px solid var(--triarq-color-border,#e0e0e0);border-radius:8px;padding:8px 0;margin-bottom:12px;max-width:420px; }
    .ga-panel-rowhead { display:flex;justify-content:space-between;width:100%;background:none;border:none;cursor:pointer;padding:10px 16px;font-size:13px;font-weight:500;font-family:inherit; }
    .ga-panel-opts { padding:0 16px 12px;display:flex;flex-direction:column;gap:6px; }
    .ga-opt { font-size:13px;display:flex;align-items:center;gap:8px;cursor:pointer; }
    .ga-opt-empty { font-size:12px;color:#9E9E9E; }
    .ga-panel-actions { display:flex;gap:12px;padding:8px 16px 0;border-top:1px solid var(--triarq-color-fog,#eee);margin-top:4px; }
    .ga-btn-primary { background:var(--triarq-color-primary,#257099);color:#fff;border:none;border-radius:5px;padding:6px 14px;cursor:pointer;font-size:13px; }
    .ga-btn-text { background:none;border:none;color:var(--triarq-color-primary,#257099);cursor:pointer;font-size:13px; }
    .ga-grid { border:1px solid var(--triarq-color-border,#e8e8e8);border-radius:8px;overflow:hidden; }
    .ga-grid-head, .ga-row { display:grid;grid-template-columns:130px 1.6fr 90px 150px 130px;gap:8px;padding:12px 16px;align-items:center; }
    .ga-grid-head { background:#F7F9FB;font-size:12px;font-weight:600;color:#5A5A5A;border-bottom:1px solid #E8E8E8; }
    .ga-row { border-bottom:1px solid #F0F0F0;font-size:13px; }
    .ga-row:last-child { border-bottom:none; }
    .ga-sort { cursor:pointer;user-select:none; }
    .ga-sort:hover::after { content:' ↕';opacity:0.5; }
    .ga-sort--active { font-weight:700;color:#1E1E1E; }
    .ga-muted { color:#5A5A5A; }
    .ca-neg { color:var(--triarq-color-oravive,#E96127); }
    .ga-init-chip { color:var(--triarq-color-primary,#257099);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .ga-init-chip:hover { text-decoration:underline; }
    .ga-empty { padding:24px 16px;color:#5A5A5A;font-style:italic;font-size:13px; }
    .ga-empty-link { color:var(--triarq-color-primary,#257099);cursor:pointer;margin-left:6px;font-style:normal; }
    .ga-skeleton { display:flex;flex-direction:column;gap:8px; }
    .ga-skel-row { height:44px;border-radius:6px;background:linear-gradient(90deg,#f0f0f0,#f7f7f7,#f0f0f0); }
  `]
})
export class CompletedActionsListComponent implements OnChanges {
  @Input() items: CompletedActionItem[] = [];
  @Input() loading = true;
  /** Where the detail should return on exit (this tab). */
  readonly returnTo = '/actions?tab=completed';

  readonly days     = ACTIONS_DEFAULT_FILTER_DAYS;
  readonly gateKeys = GATE_KEYS;

  appliedDateActive = true;
  appliedGates:     string[] = [];
  appliedDivisions: string[] = [];

  stagedDateActive = true;
  stagedGates     = new Set<string>();
  stagedDivisions = new Set<string>();

  panelOpen = false;
  openRow: 'gate' | 'division' | 'date' | null = null;

  sortField: SortField = 'acted';
  sortDir: 'asc' | 'desc' = 'desc';

  private restored = false;

  constructor(
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    if (!this.restored) {
      this.restored = true;
      this.screenState.restore(SCREEN_KEYS.ACTIONS_COMPLETED).then(state => {
        if (state) {
          const f = state.filter_state || {};
          const s = state.sort_state   || {};
          if (typeof f['dateActive'] === 'boolean') { this.appliedDateActive = f['dateActive'] as boolean; }
          if (Array.isArray(f['gates']))     { this.appliedGates     = f['gates'] as string[]; }
          if (Array.isArray(f['divisions'])) { this.appliedDivisions = f['divisions'] as string[]; }
          if (typeof s['field'] === 'string') { this.sortField = s['field'] as SortField; }
          if (s['dir'] === 'asc' || s['dir'] === 'desc') { this.sortDir = s['dir']; }
          this.syncStagedFromApplied();
          this.cdr.markForCheck();
        }
      });
    }
  }

  get view(): CompletedActionItem[] {
    const cutoff  = this.appliedDateActive ? daysAgoIso(this.days) : null;
    const gateSet = new Set(this.appliedGates);
    const divSet  = new Set(this.appliedDivisions);
    const rows = this.items.filter(i => {
      if (cutoff && (i.acted_at ?? '') < cutoff) { return false; }
      if (gateSet.size && !gateSet.has(i.gate_name)) { return false; }
      if (divSet.size && !divSet.has(i.division_display_name_short)) { return false; }
      return true;
    });
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => dir * this.cmp(a, b));
  }

  private cmp(a: CompletedActionItem, b: CompletedActionItem): number {
    switch (this.sortField) {
      case 'gate':       return (a.gate_name_display || '').localeCompare(b.gate_name_display || '');
      case 'initiative': return (a.cycle_title || '').localeCompare(b.cycle_title || '');
      case 'division':   return (a.division_display_name_short || '').localeCompare(b.division_display_name_short || '');
      case 'decision':   return (a.decision || '').localeCompare(b.decision || '');
      case 'acted':
      default:           return (a.acted_at || '').localeCompare(b.acted_at || '');
    }
  }

  get divisionOptions(): string[] {
    return [...new Set(this.items.map(i => i.division_display_name_short).filter(Boolean))].sort();
  }

  get activeFilterCount(): number {
    return (this.appliedDateActive ? 1 : 0) + this.appliedGates.length + this.appliedDivisions.length;
  }

  /** Returned / declined decisions render in Oravive. */
  isNegative(item: CompletedActionItem): boolean {
    return /returned|declined/i.test(item.decision || '');
  }

  setSort(field: SortField): void {
    if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.persist();
  }
  icon(field: SortField): string {
    if (this.sortField !== field) { return ''; }
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  toggleRow(row: 'gate' | 'division' | 'date'): void { this.openRow = this.openRow === row ? null : row; }
  toggleStaged(set: Set<string>, value: string): void { if (set.has(value)) { set.delete(value); } else { set.add(value); } }

  applyFilters(): void {
    this.appliedDateActive = this.stagedDateActive;
    this.appliedGates      = [...this.stagedGates];
    this.appliedDivisions  = [...this.stagedDivisions];
    this.panelOpen = false;
    this.persist();
  }
  clearAll(): void {
    this.stagedDateActive = false;
    this.stagedGates.clear();
    this.stagedDivisions.clear();
  }

  removeDate(): void { this.appliedDateActive = false; this.stagedDateActive = false; this.persist(); }
  removeGate(g: string): void { this.appliedGates = this.appliedGates.filter(x => x !== g); this.stagedGates.delete(g); this.persist(); }
  removeDivision(d: string): void { this.appliedDivisions = this.appliedDivisions.filter(x => x !== d); this.stagedDivisions.delete(d); this.persist(); }

  private syncStagedFromApplied(): void {
    this.stagedDateActive = this.appliedDateActive;
    this.stagedGates      = new Set(this.appliedGates);
    this.stagedDivisions  = new Set(this.appliedDivisions);
  }

  private persist(): void {
    this.screenState.save(
      SCREEN_KEYS.ACTIONS_COMPLETED,
      { dateActive: this.appliedDateActive, gates: this.appliedGates, divisions: this.appliedDivisions },
      { field: this.sortField, dir: this.sortDir }
    );
  }

  gateDisplay(g: string): string { return GATE_DISPLAY[g] ?? g; }
  rel(iso: string): string { return relativeDays(iso); }
  trackByItem(_: number, item: CompletedActionItem): string { return item.gate_record_id + '|' + item.item_type; }
}
