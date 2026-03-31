// my-notifications-card.component.ts
// Universal — all roles. Shows undismissed notifications. Functional in Build A.

import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { McpService }    from '../../../core/services/mcp.service';
import { Notification }  from '../../../core/types/database';
import { firstValueFrom } from 'rxjs';

@Component({
  selector:        'app-my-notifications-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>Notifications</h4>
        <span class="oi-badge" *ngIf="notifications.length > 0">{{ notifications.length }}</span>
      </div>

      <p *ngIf="loading" class="oi-card-empty">Loading…</p>

      <p *ngIf="!loading && notifications.length === 0" class="oi-card-empty">
        No new notifications.
      </p>

      <ul *ngIf="!loading && notifications.length > 0" class="oi-notif-list">
        <li *ngFor="let n of notifications" class="oi-notif-item">
          <span class="oi-notif-body">{{ n.notification_body }}</span>
          <button class="oi-dismiss-btn" (click)="dismiss(n.id)" aria-label="Dismiss">✕</button>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; align-items: center; gap: var(--triarq-space-sm); margin-bottom: var(--triarq-space-md); }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-badge { background: var(--triarq-color-accent); color: #fff; border-radius: var(--triarq-radius-pill); padding: 2px 8px; font-size: var(--triarq-text-caption); font-weight: var(--triarq-font-weight-bold); }
    .oi-card-empty { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .oi-notif-list { list-style: none; padding: 0; margin: 0; }
    .oi-notif-item { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--triarq-space-sm) 0; border-bottom: 1px solid var(--triarq-color-border); gap: var(--triarq-space-sm); }
    .oi-notif-body { font-size: var(--triarq-text-small); flex: 1; }
    .oi-dismiss-btn { background: none; border: none; cursor: pointer; color: var(--triarq-color-text-disabled); flex-shrink: 0; padding: 0; font-size: 12px; }
    .oi-dismiss-btn:hover { color: var(--triarq-color-text-secondary); }
  `]
})
export class MyNotificationsCardComponent implements OnInit {
  @Input() userId = '';

  notifications: Notification[] = [];
  loading = true;

  constructor(
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Notifications are fetched via document-access-mcp list_documents filtered to
    // the notifications table — full wiring in Build B when notification service is active.
    this.loading = false;
    this.cdr.markForCheck();
  }

  async dismiss(notificationId: string): Promise<void> {
    // Dismiss via MCP — update dismissed_at (Build B wiring)
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.cdr.markForCheck();
  }
}
