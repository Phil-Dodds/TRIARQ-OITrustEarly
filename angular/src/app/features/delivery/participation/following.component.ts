// following.component.ts — Pathways OI Trust
// Contract G4 (D-564): "Initiatives I'm following" — one place listing the
// viewer's Consulted and Informed memberships (direct or via Specialty Group).
// List view over list_my_participation; rows drill into the Initiative detail.
// No new screen class — dashboard row conventions reused.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ParticipationRecord } from '../../../core/types/database';

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fl-page">
      <div class="fl-header">
        <h2>Initiatives I'm Following</h2>
        <div class="fl-desc">
          Every Initiative where you hold a Consulted or Informed stake — directly
          or through a Specialty Group. Tap a row to open the Initiative.
        </div>
      </div>

      <div *ngIf="loading" class="fl-loading">Loading…</div>

      <div *ngIf="!loading && rows.length === 0" class="fl-empty">
        You are not following any Initiatives yet. Use "Follow (Informed)" on any
        Initiative's detail panel to start.
      </div>

      <table *ngIf="!loading && rows.length > 0" class="fl-table">
        <thead>
          <tr>
            <th>Initiative</th>
            <th>Your stake</th>
            <th>Via</th>
            <th>Stage</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of rows" class="fl-row" (click)="openInitiative(r)">
            <td>{{ r.cycle_title || r.delivery_cycle_id }}</td>
            <td>
              <span class="fl-pill" [class.fl-pill--c]="r.letter === 'C'">
                {{ r.letter === 'C' ? 'Consulted' : 'Informed' }}
              </span>
            </td>
            <td>{{ r.holder_group_name ? ('Group: ' + r.holder_group_name) : 'Direct' }}</td>
            <td>{{ r.current_lifecycle_stage || '—' }}</td>
            <td>{{ r.effective_level ? 'Level ' + r.effective_level : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .fl-page { padding: 24px; }
    .fl-header h2 { margin: 0 0 4px 0; font: 500 22px Roboto, sans-serif; color: #00274E; }
    .fl-desc { font: italic 11px Roboto, sans-serif; color: #5A5A5A; margin-bottom: 18px; }
    .fl-loading, .fl-empty { font: italic 12px Roboto, sans-serif; color: #5A5A5A; padding: 24px 0; }
    .fl-table { width: 100%; border-collapse: collapse; font: 400 13px Roboto, sans-serif; }
    .fl-table th {
      text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.05em; color: #5A5A5A; border-bottom: 1px solid #DDE5EA;
    }
    .fl-row td { padding: 10px 12px; border-bottom: 1px solid #EEF3F6; color: #1a1a1a; }
    .fl-row { cursor: pointer; }
    .fl-row:hover td { background: #F7FAFC; }
    .fl-pill {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      background: rgba(0,39,78,0.06); color: #00274E; font-size: 12px;
    }
    .fl-pill--c { background: rgba(37,112,153,0.10); color: #257099; }
  `]
})
export class FollowingComponent implements OnInit {
  rows: ParticipationRecord[] = [];
  loading = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listMyParticipation().subscribe({
      next: (res) => {
        this.rows = (res.success && res.data?.participation_records) || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openInitiative(r: ParticipationRecord): void {
    this.router.navigate(['/initiatives', r.delivery_cycle_id]);
  }
}
