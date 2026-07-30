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
import { GateConditionsListComponent }   from './gate-conditions-list.component';
import { MatDialog, MatDialogModule }    from '@angular/material/dialog';
import {
  ReassignApproverDialogComponent, ReassignApproverDialogData
} from '../../shared/components/reassign-approver-dialog/reassign-approver-dialog.component';
import { MyInitiativeStatusComponent }   from '../delivery/my-initiative-status/my-initiative-status.component';
import { EggSpotComponent }              from '../easter-eggs/egg-spot.component';
import { EGG_KEYS }                      from '../../core/constants/easter-egg.constants';

type ActiveTab = 'open' | 'completed' | 'due' | 'ack' | 'conditions';

@Component({
  selector:        'app-my-actions',
  standalone:      true,
  imports:         [CommonModule, MatDialogModule, ActionsListComponent, CompletedActionsListComponent, GateConditionsListComponent, MyInitiativeStatusComponent, EggSpotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ma-page">
      <header class="ma-header">
        <h1 class="ma-title">My Actions</h1>
        <p class="ma-subtitle">Gates awaiting your approval or review, initiative status updates due, and what you've completed.</p>
      </header>

      <!-- D-515 (Contract 36, amends D-491): three tabs; Completed is a
           secondary link inside Approve Initiative Gates, not a tab. -->
      <div class="ma-tabs" role="tablist">
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'open' || activeTab === 'completed'"
                [attr.aria-selected]="activeTab === 'open' || activeTab === 'completed'"
                (click)="selectTab('open')">
          Approve Initiative Gates
          <span *ngIf="openCount > 0" class="ma-tab-badge">{{ openCount }}</span>
        </button>
        <!-- Contract 40 WS3 (D-590): a verb-first tab for gate conditions the
             caller must address. Approvals-only stays in the first tab. -->
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'conditions'"
                [attr.aria-selected]="activeTab === 'conditions'"
                (click)="selectTab('conditions')">
          Address Gate Conditions
          <span *ngIf="conditionCount > 0" class="ma-tab-badge">{{ conditionCount }}</span>
        </button>
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'due'"
                [attr.aria-selected]="activeTab === 'due'"
                (click)="selectTab('due')">
          Update Initiative Statuses
          <span *ngIf="dueCount > 0" class="ma-tab-badge">{{ dueCount }}</span>
        </button>
        <button class="ma-tab" role="tab"
                [class.ma-tab--active]="activeTab === 'ack'"
                [attr.aria-selected]="activeTab === 'ack'"
                (click)="selectTab('ack')">
          Acknowledge Initiative Status Updates
          <span *ngIf="ackCount > 0" class="ma-tab-badge">{{ ackCount }}</span>
        </button>
      </div>

      <!-- D-515: Completed reachable via a link in filter-row position. -->
      <div *ngIf="activeTab === 'open'" class="ma-completed-linkrow">
        <a class="ma-completed-link" role="button" tabindex="0"
           (click)="selectTab('completed')" (keydown.enter)="selectTab('completed')">View completed →</a>
      </div>
      <div *ngIf="activeTab === 'completed'" class="ma-completed-linkrow">
        <a class="ma-completed-link" role="button" tabindex="0"
           (click)="selectTab('open')" (keydown.enter)="selectTab('open')">← Back to pending</a>
      </div>

      <app-actions-list *ngIf="activeTab === 'open'"
        [items]="openItems" [loading]="loadingOpen"
        (reassignRequested)="onReassign($event)"></app-actions-list>
      <app-completed-actions-list *ngIf="activeTab === 'completed'"
        [items]="completedItems" [loading]="loadingCompleted"></app-completed-actions-list>
      <app-gate-conditions-list *ngIf="activeTab === 'conditions'"
        [items]="conditionItems" [loading]="loadingOpen"></app-gate-conditions-list>

      <!-- Always mounted so its counts populate the Updates Due / Needs
           Acknowledgment badges even before those tabs are opened; the grid
           body renders only when one of the two status tabs is active. -->
      <app-my-initiative-status
        [visibleTab]="statusVisibleTab"
        (countsChanged)="onStatusCounts($event)">
      </app-my-initiative-status>

      <!-- Easter Egg Hunt spots — foot of the Update Statuses / Acknowledge tabs -->
      <div *ngIf="activeTab === 'due'" style="text-align:center; padding:14px 0 4px;">
        <app-egg-spot [placementKey]="EGG_KEYS.ACTIONS_UPDATE_FOOTER"></app-egg-spot>
      </div>
      <div *ngIf="activeTab === 'ack'" style="text-align:center; padding:14px 0 4px;">
        <app-egg-spot [placementKey]="EGG_KEYS.ACTIONS_ACK_FOOTER"></app-egg-spot>
      </div>
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
    /* D-515: Completed as a secondary link in filter-row position. */
    .ma-completed-linkrow { margin: -6px 0 10px; }
    .ma-completed-link { font-size: 12px; color: var(--triarq-color-primary, #257099); cursor: pointer; }
  `]
})
export class MyActionsComponent implements OnInit {
  readonly EGG_KEYS = EGG_KEYS;
  activeTab: ActiveTab = 'open';

  loadingOpen = true;
  loadingCompleted = true;
  openItems: PendingApprovalItem[] = [];
  completedItems: CompletedActionItem[] = [];
  // Contract 40 WS3 (D-590): open_conditions rows live in their own tab, never
  // in the approvals list.
  conditionItems: PendingApprovalItem[] = [];

  // Counts emitted by the embedded status component (D-484).
  dueCount = 0;
  ackCount = 0;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly route:    ActivatedRoute,
    private readonly router:   Router,
    private readonly dialog:   MatDialog,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  /** CC-40-Q: reassign a gate's approver from the approval queue. On success the
   *  gate leaves this queue (re-routed), so reload the pending list. */
  onReassign(item: PendingApprovalItem): void {
    this.dialog.open(ReassignApproverDialogComponent, {
      data: {
        delivery_cycle_id: item.delivery_cycle_id,
        cycle_title: item.cycle_title,
        gate_name_display: item.gate_name_display,
        current_approver_name: item.approver_display_name ?? null
      } as ReassignApproverDialogData,
      width: '420px', maxWidth: '92vw'
    }).afterClosed().subscribe(result => {
      if (result?.reassigned) { this.reloadOpen(); }
    });
  }

  private reloadOpen(): void {
    this.loadingOpen = true; this.cdr.markForCheck();
    this.delivery.listPendingApprovals().subscribe({
      next: res => {
        const all = (res.success && res.data) ? res.data : [];
        this.openItems      = all.filter(i => i.item_type !== 'open_conditions');
        this.conditionItems = all.filter(i => i.item_type === 'open_conditions');
        this.loadingOpen = false; this.cdr.markForCheck();
      },
      error: () => { this.loadingOpen = false; this.cdr.markForCheck(); }
    });
  }

  /** Approve-gates badge — pending items count (approvals only). */
  get openCount(): number { return this.openItems.length; }

  /** Address-conditions badge — open_conditions rows count. */
  get conditionCount(): number { return this.conditionItems.length; }

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
    if (tab === 'completed' || tab === 'due' || tab === 'ack' || tab === 'conditions') { this.activeTab = tab; }

    this.delivery.listPendingApprovals().subscribe({
      next: res => {
        const all = (res.success && res.data) ? res.data : [];
        // WS3: split approvals from open_conditions — the tabs are separate.
        this.openItems      = all.filter(i => i.item_type !== 'open_conditions');
        this.conditionItems = all.filter(i => i.item_type === 'open_conditions');
        this.loadingOpen = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingOpen = false; this.cdr.markForCheck(); }
    });
    this.delivery.listCompletedActions().subscribe({
      next: res => { this.completedItems = (res.success && res.data) ? res.data : []; this.loadingCompleted = false; this.cdr.markForCheck(); },
      error: () => { this.loadingCompleted = false; this.cdr.markForCheck(); }
    });
  }
}
