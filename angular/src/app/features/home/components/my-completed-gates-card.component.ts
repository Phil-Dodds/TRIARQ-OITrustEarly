// my-completed-gates-card.component.ts
// Pathways OI Trust — home screen "My Completed Gates" card (D-430, Contract 24).
//
// Surfaces the caller's recently-approved gates as DCS / EPO / DOL on the
// underlying Initiative. Async per D-346, appended after My Activity per D-425.
// Initiative chip routes to /initiatives/:cycle_id. Footer link routes to
// /initiatives/gates-approved with personFilter pre-set to the current user
// per D-430.
//
// Source: D-430, D-180, D-346, D-425, S-021,
// OITrust-Contract24-Spec-2026-06-15.md §Workstream 6.

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

import { DeliveryService }   from '../../../core/services/delivery.service';
import { MyCompletedGateRow } from '../../../core/types/database';

const CARD_LIMIT = 5;

@Component({
  selector:        'app-my-completed-gates-card',
  standalone:      true,
  imports:         [CommonModule, RouterModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>My Completed Gates</h4>
      </div>

      <!-- Skeleton while loading (D-346 async card) -->
      <ng-container *ngIf="loading">
        <div class="mcg-row" *ngFor="let _ of [1,2,3]">
          <ion-skeleton-text animated style="height:12px;width:70%;"></ion-skeleton-text>
        </div>
      </ng-container>

      <!-- Empty state per spec -->
      <p *ngIf="!loading && rows.length === 0" class="oi-card-empty">
        No gates approved on your initiatives in the last 4 weeks.
      </p>

      <!-- Rows -->
      <ul *ngIf="!loading && rows.length > 0" class="mcg-list">
        <li *ngFor="let r of rows" class="mcg-item">
          <span class="mcg-gate">{{ r.gate_name_display }}</span>
          <a class="mcg-chip"
             [routerLink]="['/initiatives', r.delivery_cycle_id]"
             [title]="r.initiative_name">
            {{ r.initiative_name }}
          </a>
          <span class="mcg-division">{{ r.division_short_name }}</span>
          <span class="mcg-when" [title]="absoluteTime(r.approver_decision_at)">
            {{ relativeTime(r.approver_decision_at) }}
          </span>
        </li>
      </ul>

      <!-- Footer link — personFilter pre-set to the current user per D-430. -->
      <a *ngIf="!loading"
         class="mcg-view-all"
         routerLink="/initiatives/gates-approved"
         [queryParams]="footerQueryParams">
        View all {{ totalCount }} →
      </a>
    </div>
  `,
  styles: [`
    .oi-card-header {
      display: flex; align-items: center; gap: var(--triarq-space-sm);
      margin-bottom: var(--triarq-space-md);
    }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-card-empty {
      color: var(--triarq-color-text-secondary);
      font-size: var(--triarq-text-small);
    }

    .mcg-list { list-style: none; padding: 0; margin: 0; }
    .mcg-item {
      display: flex; align-items: center; gap: var(--triarq-space-sm);
      padding: 6px 0;
      border-bottom: 1px solid var(--triarq-color-border);
      font-size: var(--triarq-text-small);
    }
    .mcg-item:last-of-type { border-bottom: 0; }

    .mcg-gate     { flex: 0 0 110px; color: var(--triarq-color-text-primary); }
    .mcg-chip {
      display: inline-flex; align-items: center; padding: 2px 8px;
      border-radius: 999px; background: rgba(120, 130, 140, 0.10);
      color: var(--triarq-color-primary); text-decoration: none;
      font-size: 11px; white-space: nowrap;
      max-width: 160px; overflow: hidden; text-overflow: ellipsis;
    }
    .mcg-chip:hover { background: rgba(120, 130, 140, 0.20); cursor: pointer; }
    .mcg-division { color: #5A5A5A; font-size: 11px; }
    .mcg-when     { margin-left: auto; color: #5A5A5A; font-size: 11px; }

    .mcg-row { padding: 6px 0; }
    .mcg-view-all {
      display: inline-block;
      margin-top: var(--triarq-space-sm);
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-primary);
      text-decoration: none; font-weight: 500;
    }
    .mcg-view-all:hover { text-decoration: underline; }
  `]
})
export class MyCompletedGatesCardComponent implements OnInit {
  @Input() userId = '';

  rows:        MyCompletedGateRow[] = [];
  totalCount   = 0;
  loading      = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  get footerQueryParams(): Record<string, string> {
    return this.userId ? { personFilter: this.userId } : {};
  }

  ngOnInit(): void {
    if (!this.userId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.delivery.listMyCompletedGates({ limit: CARD_LIMIT, days_back: 28 }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.rows       = res.data.items ?? [];
          this.totalCount = res.data.total_count ?? this.rows.length;
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

  relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) { return ''; }
    const diff = Date.now() - then;
    const min  = 60 * 1000;
    const hour = 60 * min;
    const day  = 24 * hour;
    if (diff < min)      { return 'just now'; }
    if (diff < hour)     { return `${Math.round(diff / min)} min ago`; }
    if (diff < day)      { return `${Math.round(diff / hour)} hr ago`; }
    if (diff < 14 * day) { return `${Math.round(diff / day)} days ago`; }
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  absoluteTime(iso: string): string {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toUTCString() : iso;
  }
}
