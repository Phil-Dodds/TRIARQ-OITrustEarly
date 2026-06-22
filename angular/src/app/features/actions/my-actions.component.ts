// my-actions.component.ts — Pathways OI Trust
// Contract 30 / D-472 (WS1.3), revised. The My Actions screen at /actions.
//
// Single merged list — approver (Accountable) and consulted rows together, no tabs,
// treated uniformly (Phil direction). One MCP call (list_pending_approvals) loads
// everything; the list component filters/sorts client-side. Full load before
// interactive (D-346).
//
// D-93: data via DeliveryService → MCP. Presentation only.
// Source: D-472, D-468, D-346.

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeliveryService }     from '../../core/services/delivery.service';
import { PendingApprovalItem } from '../../core/types/database';
import { ActionsListComponent } from './actions-list.component';

@Component({
  selector:        'app-my-actions',
  standalone:      true,
  imports:         [CommonModule, ActionsListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ma-page">
      <header class="ma-header">
        <h1 class="ma-title">My Actions</h1>
        <p class="ma-subtitle">Gates awaiting your approval or review.</p>
      </header>

      <app-actions-list [items]="items" [loading]="loading"></app-actions-list>
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
  `]
})
export class MyActionsComponent implements OnInit {
  loading = true;
  items: PendingApprovalItem[] = [];

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listPendingApprovals().subscribe({
      next: res => {
        this.items = (res.success && res.data) ? res.data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
