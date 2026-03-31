// user-management-card.component.ts — Admin only (D-150)

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { McpService } from '../../../core/services/mcp.service';
import { User }       from '../../../core/types/database';
import { firstValueFrom } from 'rxjs';

@Component({
  selector:        'app-user-management-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>User Management</h4>
        <a routerLink="/admin/users" class="oi-card-link">Manage →</a>
      </div>

      <p *ngIf="loading" class="oi-card-empty">Loading…</p>

      <div *ngIf="!loading" class="oi-user-stats">
        <span class="oi-stat-value">{{ totalUsers }}</span>
        <span class="oi-stat-label">total users</span>
      </div>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--triarq-space-md); }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-card-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .oi-card-empty { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .oi-user-stats { display: flex; align-items: baseline; gap: var(--triarq-space-sm); }
    .oi-stat-value { font-size: var(--triarq-text-h3); font-weight: var(--triarq-font-weight-bold); color: var(--triarq-color-primary); }
    .oi-stat-label { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
  `]
})
export class UserManagementCardComponent implements OnInit {
  totalUsers = 0;
  loading    = true;

  constructor(
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.mcp.call<User[]>('division', 'list_users', {})
      );
      this.totalUsers = response.data?.length ?? 0;
    } catch {
      this.totalUsers = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
