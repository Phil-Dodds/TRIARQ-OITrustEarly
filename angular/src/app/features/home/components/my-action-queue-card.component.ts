// my-action-queue-card.component.ts
// Universal — all roles. Home screen "My Action Queue" card.
//
// Surfaces gate records where the caller is the Accountable approver
// (item_type='accountable') OR a Consulted party (item_type='consulted').
// Data: DeliveryService.listPendingApprovals() → PendingApprovalItem[].
//
// Contract 29 / D-468 (WS2) — Consulted rendering:
//   • Accountable items: unchanged behavior (label + role tag), count in badge.
//   • Active consulted (gate_status='awaiting_approval'):
//       "Review requested: <gate> — <cycle>". Normal styling. Not dismissible.
//   • Post-approval consulted (gate_status='approved'):
//       "Gate approved — your review still welcome: <gate> — <cycle>".
//       Stone color. Client-side dismissible (X). Excluded from the badge count.
//   • Tapping any row opens the Initiative detail with the gate sub-panel
//     auto-expanded (routerLink ['/initiatives', cycle_id] + gate query param —
//     same navigation the sibling home cards use to reach Initiative detail).
//
// Source: D-150, D-345, D-462, D-468, Contract 29 WS2.

import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DeliveryService }    from '../../../core/services/delivery.service';
import { PendingApprovalItem } from '../../../core/types/database';
import { ConsultedStatusIndicatorComponent } from '../../../shared/components/consulted-status-indicator/consulted-status-indicator.component';

@Component({
  selector:        'app-my-action-queue-card',
  standalone:      true,
  imports:         [CommonModule, RouterModule, ConsultedStatusIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>My Action Queue</h4>
        <!-- D-468: badge counts approval-actionable items only; post-approval
             consulted items (review still welcome) do NOT increment it. -->
        <span class="oi-badge" *ngIf="badgeCount > 0">{{ badgeCount }}</span>
      </div>

      <p *ngIf="loading" class="oi-card-loading">Loading…</p>

      <p *ngIf="!loading && items.length === 0" class="oi-card-empty">
        No pending actions. You're all caught up.
      </p>

      <ul *ngIf="!loading && items.length > 0" class="oi-action-list">
        <!-- WS1.2 (D-472): home card shows the top 7 by created_at desc only.
             "View all →" reaches the full /actions surface. -->
        <li *ngFor="let item of displayItems; trackBy: trackByItem"
            class="oi-action-item"
            [class.oi-action-item--post-approval]="isPostApprovalConsulted(item)">

          <!-- Tap target: opens Initiative detail with the gate sub-panel
               auto-expanded. Same nav the sibling cards use (/initiatives/:id),
               plus the gate query param the detail panel reads to auto-expand. -->
          <a class="oi-action-link"
             [routerLink]="['/initiatives', item.delivery_cycle_id]"
             [queryParams]="{ gate: item.gate_name }">
            <span class="oi-action-main">
              <span class="oi-action-title">{{ labelFor(item) }}</span>
              <!-- WS1.2 (D-468): Consulted status indicator, inline right of the gate text. -->
              <app-consulted-status-indicator
                [summary]="item.consulted_summary"
                [gateStatus]="item.gate_status"></app-consulted-status-indicator>
            </span>
            <span *ngIf="item.item_type !== 'consulted'" class="oi-action-role">Approve</span>
          </a>

          <!-- D-468: post-approval consulted items are client-side dismissible. -->
          <button *ngIf="isPostApprovalConsulted(item)"
                  type="button"
                  class="oi-action-dismiss"
                  aria-label="Dismiss"
                  title="Dismiss"
                  (click)="dismiss(item)">×</button>
        </li>
      </ul>

      <!-- WS1.2 (D-472): always-visible footer link to the full My Actions surface. -->
      <a *ngIf="!loading"
         class="oi-action-viewall"
         [routerLink]="['/actions']">View all →</a>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; align-items: center; gap: var(--triarq-space-sm); margin-bottom: var(--triarq-space-md); }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-badge { background: var(--triarq-color-primary); color: #fff; border-radius: var(--triarq-radius-pill); padding: 2px 8px; font-size: var(--triarq-text-caption); font-weight: var(--triarq-font-weight-bold); }
    .oi-card-empty, .oi-card-loading { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .oi-action-list { list-style: none; padding: 0; margin: 0; }
    .oi-action-item { display: flex; align-items: center; gap: var(--triarq-space-sm); padding: var(--triarq-space-sm) 0; border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); }
    .oi-action-item:last-of-type { border-bottom: 0; }
    .oi-action-link { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-sm); flex: 1 1 auto; text-decoration: none; color: inherit; min-width: 0; }
    .oi-action-link:hover .oi-action-title { text-decoration: underline; }
    /* WS1.2: gate text + Consulted indicator grouped left; role pushed right. */
    .oi-action-main { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1 1 auto; }
    .oi-action-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* WS1.2: footer link to the full My Actions surface. */
    .oi-action-viewall { display: inline-block; margin-top: var(--triarq-space-sm); font-size: var(--triarq-text-caption); color: var(--triarq-color-primary, #257099); text-decoration: none; }
    .oi-action-viewall:hover { text-decoration: underline; }
    .oi-action-role { color: var(--triarq-color-primary); font-weight: var(--triarq-font-weight-medium); flex-shrink: 0; }
    /* D-468: post-approval consulted rows render in Stone — informational, not actionable. */
    .oi-action-item--post-approval .oi-action-title { color: var(--triarq-color-stone, #8a9ba8); }
    .oi-action-dismiss { flex-shrink: 0; background: none; border: 0; cursor: pointer; font-size: 16px; line-height: 1; padding: 0 4px; color: var(--triarq-color-stone, #8a9ba8); }
    .oi-action-dismiss:hover { color: var(--triarq-color-text-primary); }
  `]
})
export class MyActionQueueCardComponent implements OnInit {
  @Input() userId = '';

  items:   PendingApprovalItem[] = [];
  loading = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  /**
   * D-468: badge / unread count = approval-actionable items only.
   * Post-approval consulted items (gate_status='approved') are informational —
   * they must NOT increment the count.
   */
  get badgeCount(): number {
    return this.items.filter(i => !this.isPostApprovalConsulted(i)).length;
  }

  /**
   * WS1.2 (D-472): home card renders the top 7 items only, ordered by created_at
   * descending. No date filter — top-7 is the only constraint. The badge above
   * still reflects the full pending count (this getter governs display only).
   */
  get displayItems(): PendingApprovalItem[] {
    return [...this.items]
      .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))
      .slice(0, 7);
  }

  /** Post-approval consulted item: stone styling + dismissible + badge-excluded. */
  isPostApprovalConsulted(item: PendingApprovalItem): boolean {
    return item.item_type === 'consulted' && item.gate_status === 'approved';
  }

  /** Row label per D-468. Accountable items keep their gate/cycle title. */
  labelFor(item: PendingApprovalItem): string {
    const gate  = item.gate_name_display;
    const cycle = item.cycle_title;
    if (item.item_type === 'consulted') {
      return item.gate_status === 'approved'
        ? `Gate approved — your review still welcome: ${gate} — ${cycle}`
        : `Review requested: ${gate} — ${cycle}`;
    }
    return `${gate} — ${cycle}`;
  }

  trackByItem(_: number, item: PendingApprovalItem): string {
    return item.gate_record_id;
  }

  /**
   * D-468: client-side dismissal only — no MCP tool, persists nothing.
   * Removes the post-approval consulted item from the local list for this view.
   */
  dismiss(item: PendingApprovalItem): void {
    this.items = this.items.filter(i => i.gate_record_id !== item.gate_record_id);
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.delivery.listPendingApprovals().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.items = res.data;
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
}
