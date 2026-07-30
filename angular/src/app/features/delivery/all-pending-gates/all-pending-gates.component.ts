// all-pending-gates.component.ts — Pathways OI Trust
// Contract G8 (D-560) + Contract 40 follow-on. Every gate awaiting approval in
// the widest scope the viewer is allowed (IE/Admin/Phil = all divisions;
// Division Leader = their division(s)). Filter to narrow. Rows drill into the
// gate panel. Reassignment lives on the initiative detail (Set approver…), not
// here (Phil 2026-07-29). Pull-only; push obligations stay in My Actions.
//
// Reskinned onto the standard card + grid surface (Phil 2026-07-29) — token
// colors, card container, zebra rows — to match the Initiative list.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService, AllPendingGateRow } from '../../../core/services/delivery.service';

type ApgSort = 'days' | 'initiative' | 'division' | 'level' | 'approver';

@Component({
  selector: 'app-all-pending-gates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apg-page">
      <div class="apg-header">
        <h2>All Pending Gates</h2>
        <div class="apg-desc">
          Every gate awaiting approval in your scope — rows past
          {{ agingThresholdDays }} days are highlighted. To change an approver,
          open the initiative and use “Set approver…”.
        </div>
      </div>

      <!-- Filters (inline; client-side over the loaded rows) -->
      <div *ngIf="!loading && !errorText && rows.length > 0" class="apg-filters">
        <input type="text" class="apg-f" placeholder="Search initiative…" [(ngModel)]="search" (ngModelChange)="cdr.markForCheck()" />
        <select class="apg-f" [(ngModel)]="filterDivision" (ngModelChange)="cdr.markForCheck()">
          <option value="">Division: any</option>
          <option *ngFor="let d of divisionOptions" [value]="d">{{ d }}</option>
        </select>
        <select class="apg-f" [(ngModel)]="filterApprover" (ngModelChange)="cdr.markForCheck()">
          <option value="">Approver: any</option>
          <option *ngFor="let a of approverOptions" [value]="a">{{ a }}</option>
        </select>
        <select class="apg-f" [(ngModel)]="filterLevel" (ngModelChange)="cdr.markForCheck()">
          <option value="">Level: any</option>
          <option value="1">L1</option><option value="2">L2</option><option value="3">L3</option>
        </select>
        <label class="apg-check"><input type="checkbox" [(ngModel)]="filterAging" (ngModelChange)="cdr.markForCheck()" /> Overdue only ({{ agingThresholdDays }}d+)</label>
        <button *ngIf="anyFilterActive" type="button" class="apg-clear" (click)="clearFilters()">Clear</button>
        <span class="apg-count">{{ visibleRows.length }} of {{ rows.length }}</span>
      </div>

      <div *ngIf="loading" class="apg-empty">Loading…</div>
      <div *ngIf="!loading && errorText" class="apg-error" role="alert">{{ errorText }}</div>
      <div *ngIf="!loading && !errorText && rows.length === 0" class="apg-empty">
        Nothing is waiting — every submitted gate has been decided.
      </div>
      <div *ngIf="!loading && !errorText && rows.length > 0 && visibleRows.length === 0" class="apg-empty">
        No gates match these filters.
      </div>

      <div *ngIf="!loading && visibleRows.length > 0" class="apg-card">
        <table class="apg-table">
          <thead>
            <tr>
              <th class="apg-sortable" (click)="setSort('initiative')">Initiative {{ arrow('initiative') }}</th>
              <th>Gate</th>
              <th class="apg-sortable" (click)="setSort('division')">Division {{ arrow('division') }}</th>
              <th class="apg-sortable" (click)="setSort('level')">Level {{ arrow('level') }}</th>
              <th class="apg-sortable" (click)="setSort('approver')">Approver {{ arrow('approver') }}</th>
              <th class="apg-sortable apg-num" (click)="setSort('days')">Days {{ arrow('days') }}</th>
              <th>Waiting on</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of visibleRows" class="apg-row" [class.apg-row--aging]="r.aging" (click)="open(r)">
              <td class="apg-strong">{{ r.cycle_title }}</td>
              <td>{{ r.gate_name_display }}</td>
              <td>{{ r.division_display_name_short || '—' }}</td>
              <td>{{ r.effective_level ? 'L' + r.effective_level : '—' }}</td>
              <td>{{ r.approver_display_name || (r.effective_level === 1 ? 'Trio (Level 1)' : 'Unassigned') }}</td>
              <td class="apg-num" [style.fontWeight]="r.aging ? '700' : '400'">{{ r.days_waiting }}</td>
              <td class="apg-waiting">{{ r.waiting_on?.line || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .apg-page { padding: var(--triarq-space-lg, 24px); }
    .apg-header h2 { margin: 0 0 4px 0; font-family: Roboto, sans-serif; font-weight: 500; font-size: 22px; color: var(--triarq-color-deep-navy, #00274E); }
    .apg-desc { font: italic 11px Roboto, sans-serif; color: var(--triarq-color-text-secondary, #5A5A5A); margin-bottom: 14px; }
    .apg-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
    .apg-f { border: 1px solid var(--triarq-color-border, #B9C4CE); border-radius: var(--triarq-radius-input, 5px); padding: 5px 8px; font: 400 12px Roboto; }
    .apg-check { font: 400 12px Roboto; color: #1E1E1E; display: inline-flex; align-items: center; gap: 5px; }
    .apg-clear { background: none; border: none; color: var(--triarq-color-primary, #257099); font: 500 12px Roboto; cursor: pointer; text-decoration: underline; }
    .apg-count { font: italic 11px Roboto; color: var(--triarq-color-text-secondary, #5A5A5A); margin-left: auto; }
    .apg-empty { font: italic 12px Roboto, sans-serif; color: var(--triarq-color-text-secondary, #5A5A5A); padding: 24px 0; }
    .apg-error { border: 2px solid #d32f2f; border-radius: 5px; padding: 8px 12px; font-size: 12px; color: #d32f2f; }
    /* Standard card surface (radius 10, token border) — matches Initiative list. */
    .apg-card { background: #fff; border: 1px solid var(--triarq-color-border, #DDE5EA); border-radius: var(--triarq-radius-card, 10px); overflow: hidden; }
    .apg-table { width: 100%; border-collapse: collapse; font: 400 13px Roboto, sans-serif; }
    .apg-table th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--triarq-color-text-secondary, #5A5A5A); background: #F7FAFC; border-bottom: 1px solid var(--triarq-color-border, #DDE5EA); }
    .apg-num { text-align: right; }
    .apg-sortable { cursor: pointer; user-select: none; }
    .apg-sortable:hover { color: var(--triarq-color-primary, #257099); }
    .apg-row td { padding: 11px 14px; border-bottom: 1px solid #EEF3F6; color: #1a1a1a; }
    .apg-row:last-child td { border-bottom: none; }
    .apg-row { cursor: pointer; }
    .apg-row:nth-child(even) td { background: #FBFDFE; }
    .apg-row:hover td { background: rgba(37,112,153,0.06); }
    .apg-strong { font-weight: 600; }
    .apg-row--aging td { background: rgba(242, 166, 32, 0.08); }
    .apg-row--aging td:first-child { border-left: 3px solid var(--triarq-color-warning, #F2A620); }
    .apg-waiting { font-style: italic; color: var(--triarq-color-text-secondary, #5A5A5A); }
  `]
})
export class AllPendingGatesComponent implements OnInit {
  rows: AllPendingGateRow[] = [];
  agingThresholdDays = 7;
  loading = true;
  errorText = '';

  // Filters (client-side over the loaded rows).
  search = '';
  filterDivision = '';
  filterApprover = '';
  filterLevel = '';
  filterAging = false;

  sortField: ApgSort = 'days';
  sortDir: 'asc' | 'desc' = 'desc';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly router: Router,
    readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true; this.cdr.markForCheck();
    this.delivery.listAllPendingGates().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.rows = res.data.pending_gates;
          this.agingThresholdDays = res.data.aging_threshold_days;
        } else { this.errorText = res.error ?? 'Could not load pending gates.'; }
        this.loading = false; this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.errorText = err.error ?? 'Could not load pending gates.';
        this.loading = false; this.cdr.markForCheck();
      }
    });
  }

  get divisionOptions(): string[] {
    return [...new Set(this.rows.map(r => r.division_display_name_short).filter(Boolean))].sort();
  }
  get approverOptions(): string[] {
    return [...new Set(this.rows.map(r => r.approver_display_name).filter((n): n is string => !!n))].sort();
  }
  get anyFilterActive(): boolean {
    return !!(this.search.trim() || this.filterDivision || this.filterApprover || this.filterLevel || this.filterAging);
  }
  clearFilters(): void {
    this.search = ''; this.filterDivision = ''; this.filterApprover = '';
    this.filterLevel = ''; this.filterAging = false; this.cdr.markForCheck();
  }

  get visibleRows(): AllPendingGateRow[] {
    const q = this.search.trim().toLowerCase();
    let out = this.rows.filter(r =>
      (!q || r.cycle_title.toLowerCase().includes(q)) &&
      (!this.filterDivision || r.division_display_name_short === this.filterDivision) &&
      (!this.filterApprover || r.approver_display_name === this.filterApprover) &&
      (!this.filterLevel || String(r.effective_level ?? '') === this.filterLevel) &&
      (!this.filterAging || r.aging)
    );
    const dir = this.sortDir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      switch (this.sortField) {
        case 'days':       return (a.days_waiting - b.days_waiting) * dir;
        case 'initiative': return a.cycle_title.localeCompare(b.cycle_title) * dir;
        case 'division':   return (a.division_display_name_short || '').localeCompare(b.division_display_name_short || '') * dir;
        case 'level':      return ((a.effective_level ?? 0) - (b.effective_level ?? 0)) * dir;
        case 'approver':   return (a.approver_display_name || '').localeCompare(b.approver_display_name || '') * dir;
      }
    });
    return out;
  }

  setSort(f: ApgSort): void {
    if (this.sortField === f) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = f; this.sortDir = f === 'days' ? 'desc' : 'asc'; }
    this.cdr.markForCheck();
  }
  arrow(f: ApgSort): string { return this.sortField === f ? (this.sortDir === 'asc' ? '↑' : '↓') : '↕'; }

  open(r: AllPendingGateRow): void {
    this.router.navigate(['/initiatives', r.delivery_cycle_id], {
      queryParams: { gate: r.gate_name, returnTo: 'all-pending-gates' }
    });
  }
}
