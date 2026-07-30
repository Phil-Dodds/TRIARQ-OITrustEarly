// all-pending-gates.component.ts — Pathways OI Trust
// Contract G8 (D-560) + Contract 40 follow-on (CC-40-P/Q). Every gate awaiting
// approval in the widest scope the viewer is allowed (IE/Admin/Phil = all
// divisions; Division Leader = their division(s)). Filter to narrow; reassign
// the approver inline (CC-40-O routes the gate to the new person). Rows drill
// into the gate panel. Pull-only; push obligations stay in My Actions.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeliveryService, AllPendingGateRow } from '../../../core/services/delivery.service';
import {
  ReassignApproverDialogComponent, ReassignApproverDialogData
} from '../../../shared/components/reassign-approver-dialog/reassign-approver-dialog.component';

type ApgSort = 'days' | 'initiative' | 'division' | 'level' | 'approver';

@Component({
  selector: 'app-all-pending-gates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apg-page">
      <div class="apg-header">
        <h2>All Pending Gates</h2>
        <div class="apg-desc">
          Every gate awaiting approval in your scope — rows past
          {{ agingThresholdDays }} days are highlighted. Reassign routes the gate
          to the new approver's queue immediately and notifies the trio.
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

      <table *ngIf="!loading && visibleRows.length > 0" class="apg-table">
        <thead>
          <tr>
            <th class="apg-sortable" (click)="setSort('initiative')">Initiative {{ arrow('initiative') }}</th>
            <th>Gate</th>
            <th class="apg-sortable" (click)="setSort('division')">Division {{ arrow('division') }}</th>
            <th class="apg-sortable" (click)="setSort('level')">Level {{ arrow('level') }}</th>
            <th class="apg-sortable" (click)="setSort('approver')">Approver {{ arrow('approver') }}</th>
            <th class="apg-sortable" (click)="setSort('days')">Days {{ arrow('days') }}</th>
            <th>Waiting on</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of visibleRows" class="apg-row" [class.apg-row--aging]="r.aging" (click)="open(r)">
            <td>{{ r.cycle_title }}</td>
            <td>{{ r.gate_name_display }}</td>
            <td>{{ r.division_display_name_short || '—' }}</td>
            <td>{{ r.effective_level ? 'L' + r.effective_level : '—' }}</td>
            <td>{{ r.approver_display_name || (r.effective_level === 1 ? 'Trio (Level 1)' : 'Unassigned') }}</td>
            <td [style.fontWeight]="r.aging ? '700' : '400'">{{ r.days_waiting }}</td>
            <td class="apg-waiting">{{ r.waiting_on?.line || '—' }}</td>
            <td>
              <!-- Reassign only meaningful for a single-approver (L2/L3) gate. -->
              <button *ngIf="r.effective_level !== 1" type="button" class="apg-reassign"
                      (click)="$event.stopPropagation(); reassign(r)">Reassign…</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .apg-page { padding: 24px; }
    .apg-header h2 { margin: 0 0 4px 0; font: 500 22px Roboto, sans-serif; color: #00274E; }
    .apg-desc { font: italic 11px Roboto, sans-serif; color: #5A5A5A; margin-bottom: 14px; }
    .apg-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
    .apg-f { border: 1px solid #B9C4CE; border-radius: 5px; padding: 5px 8px; font: 400 12px Roboto; }
    .apg-check { font: 400 12px Roboto; color: #1E1E1E; display: inline-flex; align-items: center; gap: 5px; }
    .apg-clear { background: none; border: none; color: #257099; font: 500 12px Roboto; cursor: pointer; text-decoration: underline; }
    .apg-count { font: italic 11px Roboto; color: #5A5A5A; margin-left: auto; }
    .apg-empty { font: italic 12px Roboto, sans-serif; color: #5A5A5A; padding: 24px 0; }
    .apg-error { border: 2px solid #d32f2f; border-radius: 5px; padding: 8px 12px; font-size: 12px; color: #d32f2f; }
    .apg-table { width: 100%; border-collapse: collapse; font: 400 13px Roboto, sans-serif; }
    .apg-table th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #5A5A5A; border-bottom: 1px solid #DDE5EA; }
    .apg-sortable { cursor: pointer; user-select: none; }
    .apg-sortable:hover { color: #257099; }
    .apg-row td { padding: 10px 12px; border-bottom: 1px solid #EEF3F6; color: #1a1a1a; }
    .apg-row { cursor: pointer; }
    .apg-row:hover td { background: #F7FAFC; }
    .apg-row--aging td { background: rgba(242, 166, 32, 0.08); border-left: none; }
    .apg-row--aging td:first-child { border-left: 3px solid #F2A620; }
    .apg-waiting { font-style: italic; color: #5A5A5A; }
    .apg-reassign { background: none; border: 1px solid #B9C4CE; border-radius: 5px; padding: 3px 10px; font: 500 11px Roboto; color: #257099; cursor: pointer; white-space: nowrap; }
    .apg-reassign:hover { background: rgba(37,112,153,0.08); }
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
    private readonly dialog: MatDialog,
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

  reassign(r: AllPendingGateRow): void {
    this.dialog.open(ReassignApproverDialogComponent, {
      data: {
        delivery_cycle_id: r.delivery_cycle_id,
        cycle_title: r.cycle_title,
        gate_name_display: r.gate_name_display,
        current_approver_name: r.approver_display_name
      } as ReassignApproverDialogData,
      width: '420px', maxWidth: '92vw'
    }).afterClosed().subscribe(result => {
      if (result?.reassigned) { this.load(); }   // refresh — the row moved queues
    });
  }
}
