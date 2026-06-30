// my-actions.component.ts — Pathways OI Trust
// Contract 30 / D-472, restructured by Contract 32 (D-484 amendment).
//
// Four tabs:
//   Approve Initiative Gates           — merged pending list (ActionsListComponent).
//   Initiative Gate Approvals Completed — actions already taken (CompletedActionsListComponent).
//   Updates Due                        — Contract 32 status, relocated from the
//   Needs Acknowledgment               —   standalone My Initiative Status screen.
// The two status tabs render via MyInitiativeStatusComponent (embedded), which
// owns its grids, Refresh, and panels and emits its counts up for the badges.
// Active tab persists in ?tab= so navigating into an item and back restores it.
//
// D-93: data via DeliveryService → MCP. Presentation only.

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { DeliveryService }      from '../../core/services/delivery.service';
import { PendingApprovalItem, CompletedActionItem } from '../../core/types/database';
import { ActionsListComponent }          from './actions-list.component';
import { CompletedActionsListComponent } from './completed-actions-list.component';
import { MyInitiativeStatusComponent }   from '../delivery/my-initiative-status/my-initiative-status.component';

type ActiveTab = 'open' | 'completed' | 'due' | 'ack';

@Component({
  selector:        'app-my-actions',
  standalone:      true,
  imports:         [CommonModule, ActionsListComponent, CompletedActionsListComponent, MyInitiativeStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ma-page">
      <header class="ma-header">
        <h1 class="ma-title">My Actions</h1>
        <p class="ma-subtitle">Gates awaiting your approval or review, initiative status updates due, and what you've completed.</p>
      </header>

      <div class="ma-tabs" role="tablist">
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'open'"
                [attr.aria-selected]="activeTab === 'open'"
                (click)="selectTab('open')">
          Approve Initiative Gates
          <span *ngIf="openCount > 0" class="ma-tab-badge">{{ openCount }}</span>
        </button>
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'completed'"
                [attr.aria-selected]="activeTab === 'completed'"
                (click)="selectTab('completed')">
          Initiative Gate Approvals Completed
        </button>
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'due'"
                [attr.aria-selected]="activeTab === 'due'"
                (click)="selectTab('due')">
          Updates Due
          <span *ngIf="dueCount > 0" class="ma-tab-badge">{{ dueCount }}</span>
        </button>
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'ack'"
                [attr.aria-selected]="activeTab === 'ack'"
                (click)="selectTab('ack')">
          Needs Acknowledgment
          <span *ngIf="ackCount > 0" class="ma-tab-badge">{{ ackCount }}</span>
        </button>
      </div>

      <app-actions-list *ngIf="activeTab === 'open'"
        [items]="openItems" [loading]="loadingOpen"></app-actions-list>
      <app-completed-actions-list *ngIf="activeTab === 'completed'"
        [items]="completedItems" [loading]="loadingCompleted"></app-completed-actions-list>

      <!-- Always mounted so its counts populate the Updates Due / Needs
           Acknowledgment badges even before those tabs are opened; the grid
           body renders only when one of the two status tabs is active. -->
      <app-my-initiative-status
        [visibleTab]="statusVisibleTab"
        (countsChanged)="onStatusCounts($event)">
      </app-my-initiative-status>
    </div>
  `,
  styles: [`
    .ma-page { padding: var(--triarq-space-lg, 24px); max-width: 1200px; }
    .ma-header { margin-bottom: var(--triarq-space-md, 16px); }
    .ma-title { font-family: 'Gill Sans', var(--triarq-font-family, Roboto), sans-serif;
                font-weight: 700; color: var(--triarq-color-deep-navy, #1a2b4a);
                font-size: 28px; margin: 0; }
    .ma-subtitle { font-size: 11px; font-style: italic; color: #5A5A5A; margin: 4px 0 0; }
    .ma-tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--triarq-color-border, #e0e0e0);
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
  activeTab: ActiveTab = 'open';

  loadingOpen = true;
  loadingCompleted = true;
  openItems: PendingApprovalItem[] = [];
  completedItems: CompletedActionItem[] = [];

  // Counts emitted by the embedded status component (D-484).
  dueCount = 0;
  ackCount = 0;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly route:    ActivatedRoute,
    private readonly router:   Router,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  /** Approve-gates badge — pending items count. */
  get openCount(): number { return this.openItems.length; }

  /** Which status grid the embedded component renders (null on gate tabs). */
  get statusVisibleTab(): 'due' | 'ack' | null {
    return this.activeTab === 'due' ? 'due' : this.activeTab === 'ack' ? 'ack' : null;
  }

  onStatusCounts(counts: { due: number; ack: number }): void {
    this.dueCount = counts.due;
    this.ackCount = counts.ack;
    this.cdr.markForCheck();
  }

  selectTab(tab: ActiveTab): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'open' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'completed' || tab === 'due' || tab === 'ack') { this.activeTab = tab; }

    this.delivery.listPendingApprovals().subscribe({
      next: res => { this.openItems = (res.success && res.data) ? res.data : []; this.loadingOpen = false; this.cdr.markForCheck(); },
      error: () => { this.loadingOpen = false; this.cdr.markForCheck(); }
    });
    this.delivery.listCompletedActions().subscribe({
      next: res => { this.completedItems = (res.success && res.data) ? res.data : []; this.loadingCompleted = false; this.cdr.markForCheck(); },
      error: () => { this.loadingCompleted = false; this.cdr.markForCheck(); }
    });
  }
}
