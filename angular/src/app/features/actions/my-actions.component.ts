// my-actions.component.ts — Pathways OI Trust
// Contract 30 / D-472 (WS1.3). The My Actions screen at /actions.
//
// Tabbed multi-list: Gate Approvals (Accountable items) | Gate Reviews (Consulted items).
// One MCP call (list_pending_approvals) loads everything; the container splits by
// item_type and hands each tab its slice. Full load before interactive (D-346) —
// the active tab shows skeleton rows until data arrives.
//
// D-93: data via DeliveryService → MCP. Presentation only.
// Source: D-472, D-468, D-181, S-012/S-013, S-036, D-346.

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliveryService }     from '../../core/services/delivery.service';
import { PendingApprovalItem } from '../../core/types/database';
import { GateApprovalsTabComponent } from './gate-approvals-tab.component';
import { GateReviewsTabComponent }   from './gate-reviews-tab.component';

type ActiveTab = 'approvals' | 'reviews';

@Component({
  selector:        'app-my-actions',
  standalone:      true,
  imports:         [CommonModule, GateApprovalsTabComponent, GateReviewsTabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ma-page">
      <header class="ma-header">
        <h1 class="ma-title">My Actions</h1>
        <p class="ma-subtitle">Gates awaiting your approval and reviews requested of you.</p>
      </header>

      <!-- Tab strip — Gate Approvals default active. Count = active items in tab. -->
      <div class="ma-tabs" role="tablist">
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'approvals'"
                [attr.aria-selected]="activeTab === 'approvals'"
                (click)="activeTab = 'approvals'">
          Gate Approvals
          <span *ngIf="approvalsCount > 0" class="ma-tab-badge">{{ approvalsCount }}</span>
        </button>
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'reviews'"
                [attr.aria-selected]="activeTab === 'reviews'"
                (click)="activeTab = 'reviews'">
          Gate Reviews
          <span *ngIf="reviewsCount > 0" class="ma-tab-badge">{{ reviewsCount }}</span>
        </button>
      </div>

      <app-gate-approvals-tab *ngIf="activeTab === 'approvals'"
        [items]="accountableItems" [loading]="loading"></app-gate-approvals-tab>
      <app-gate-reviews-tab *ngIf="activeTab === 'reviews'"
        [items]="consultedItems" [loading]="loading"></app-gate-reviews-tab>
    </div>
  `,
  styles: [`
    .ma-page { padding: var(--triarq-space-lg, 24px); max-width: 1200px; }
    .ma-header { margin-bottom: var(--triarq-space-md, 16px); }
    .ma-title { font-family: 'Gill Sans', var(--triarq-font-family, Roboto), sans-serif;
                font-weight: 700; color: var(--triarq-color-deep-navy, #1a2b4a);
                font-size: 28px; margin: 0; }
    /* S-015: surface description — 11px italic Stone. */
    .ma-subtitle { font-size: 11px; font-style: italic; color: #5A5A5A; margin: 4px 0 0; }
    .ma-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--triarq-color-border, #e0e0e0);
               margin-bottom: var(--triarq-space-md, 16px); }
    .ma-tab { display: inline-flex; align-items: center; gap: 8px; background: none; border: none;
              border-bottom: 3px solid transparent; padding: 10px 16px; cursor: pointer;
              font-size: 14px; font-weight: 500; color: var(--triarq-color-text-secondary, #5A5A5A);
              font-family: var(--triarq-font-family, Roboto), sans-serif; }
    .ma-tab--active { color: var(--triarq-color-primary, #257099);
                      border-bottom-color: var(--triarq-color-primary, #257099); font-weight: 600; }
    .ma-tab-badge { background: var(--triarq-color-primary, #257099); color: #fff;
                    border-radius: var(--triarq-radius-pill, 999px); padding: 1px 8px;
                    font-size: 11px; font-weight: 700; }
  `]
})
export class MyActionsComponent implements OnInit {
  activeTab: ActiveTab = 'approvals';
  loading = true;

  accountableItems: PendingApprovalItem[] = [];
  consultedItems:   PendingApprovalItem[] = [];

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  /** Gate Approvals tab badge — Accountable items (all awaiting_approval). */
  get approvalsCount(): number { return this.accountableItems.length; }

  /** Gate Reviews tab badge — active Consulted items (awaiting_approval only;
   *  post-approval review-welcome items are not counted, per D-468). */
  get reviewsCount(): number {
    return this.consultedItems.filter(i => i.gate_status === 'awaiting_approval').length;
  }

  ngOnInit(): void {
    this.delivery.listPendingApprovals().subscribe({
      next: res => {
        const items: PendingApprovalItem[] = (res.success && res.data) ? res.data : [];
        this.accountableItems = items.filter(i => i.item_type === 'accountable');
        this.consultedItems   = items.filter(i => i.item_type === 'consulted');
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
