// all-pending-gates.component.ts — Pathways OI Trust
// Contract G8 (D-560): the Initiative Executive monitoring view. Every gate
// awaiting approval company-wide — gate, initiative, Division, assigned
// approver, days waiting, the G7 waiting-on line. Pull-only, default-sorted
// by age (oldest first), aging highlight past the ARCH-33 constant.
// Push (Action Queue) and pull (this view) are never merged.
// The IE override itself runs on the gate panel (loud flow) — rows drill in.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService, AllPendingGateRow } from '../../../core/services/delivery.service';

@Component({
  selector: 'app-all-pending-gates',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apg-page">
      <div class="apg-header">
        <h2>All Pending Gates</h2>
        <div class="apg-desc">
          Every gate awaiting approval, company-wide — oldest first. Rows past
          {{ agingThresholdDays }} days are highlighted. Monitoring only: your
          personal obligations stay in My Actions.
        </div>
      </div>

      <div *ngIf="loading" class="apg-empty">Loading…</div>
      <div *ngIf="!loading && errorText" class="apg-error" role="alert">{{ errorText }}</div>
      <div *ngIf="!loading && !errorText && rows.length === 0" class="apg-empty">
        Nothing is waiting — every submitted gate has been decided.
      </div>

      <table *ngIf="!loading && rows.length > 0" class="apg-table">
        <thead>
          <tr>
            <th>Initiative</th><th>Gate</th><th>Division</th><th>Level</th>
            <th>Approver</th><th>Days</th><th>Waiting on</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows" class="apg-row" [class.apg-row--aging]="r.aging"
              (click)="open(r)">
            <td>{{ r.cycle_title }}</td>
            <td>{{ r.gate_name_display }}</td>
            <td>{{ r.division_display_name_short || '—' }}</td>
            <td>{{ r.effective_level ? 'L' + r.effective_level : '—' }}</td>
            <td>{{ r.approver_display_name || (r.effective_level === 1 ? 'Trio (Level 1)' : 'Unassigned') }}</td>
            <td [style.fontWeight]="r.aging ? '700' : '400'">{{ r.days_waiting }}</td>
            <td class="apg-waiting">{{ r.waiting_on?.line || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .apg-page { padding: 24px; }
    .apg-header h2 { margin: 0 0 4px 0; font: 500 22px Roboto, sans-serif; color: #00274E; }
    .apg-desc { font: italic 11px Roboto, sans-serif; color: #5A5A5A; margin-bottom: 18px; }
    .apg-empty { font: italic 12px Roboto, sans-serif; color: #5A5A5A; padding: 24px 0; }
    .apg-error { border: 2px solid #d32f2f; border-radius: 5px; padding: 8px 12px; font-size: 12px; color: #d32f2f; }
    .apg-table { width: 100%; border-collapse: collapse; font: 400 13px Roboto, sans-serif; }
    .apg-table th {
      text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.05em; color: #5A5A5A; border-bottom: 1px solid #DDE5EA;
    }
    .apg-row td { padding: 10px 12px; border-bottom: 1px solid #EEF3F6; color: #1a1a1a; }
    .apg-row { cursor: pointer; }
    .apg-row:hover td { background: #F7FAFC; }
    /* ARCH-33 aging highlight — amber band, D-200 Pattern 2 palette. */
    .apg-row--aging td { background: rgba(242, 166, 32, 0.08); border-left: none; }
    .apg-row--aging td:first-child { border-left: 3px solid #F2A620; }
    .apg-waiting { font-style: italic; color: #5A5A5A; }
  `]
})
export class AllPendingGatesComponent implements OnInit {
  rows: AllPendingGateRow[] = [];
  agingThresholdDays = 7;
  loading = true;
  errorText = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listAllPendingGates().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.rows = res.data.pending_gates;
          this.agingThresholdDays = res.data.aging_threshold_days;
        } else {
          this.errorText = res.error ?? 'Could not load pending gates.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.errorText = err.error ?? 'Could not load pending gates.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  open(r: AllPendingGateRow): void {
    this.router.navigate(['/initiatives', r.delivery_cycle_id], {
      queryParams: { gate: r.gate_name, returnTo: 'all-pending-gates' }
    });
  }
}
