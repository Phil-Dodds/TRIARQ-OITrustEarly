// my-action-queue-card.component.ts
// Universal — all roles. Shows pending approval_participants items.
// Sparsely populated in Build A — wired to approval data in Build B. (D-150)

import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { McpService } from '../../../core/services/mcp.service';
import { firstValueFrom } from 'rxjs';

interface ActionItem {
  id:              string;
  artifact_title:  string;
  workflow_type:   string;
  raci_role:       string;
}

@Component({
  selector:        'app-my-action-queue-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>My Action Queue</h4>
        <span class="oi-badge" *ngIf="items.length > 0">{{ items.length }}</span>
      </div>

      <p *ngIf="loading" class="oi-card-loading">Loading…</p>

      <p *ngIf="!loading && items.length === 0" class="oi-card-empty">
        No pending actions. You're all caught up.
      </p>

      <ul *ngIf="!loading && items.length > 0" class="oi-action-list">
        <li *ngFor="let item of items" class="oi-action-item">
          <span class="oi-action-title">{{ item.artifact_title }}</span>
          <span class="oi-action-role">{{ item.raci_role }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; align-items: center; gap: var(--triarq-space-sm); margin-bottom: var(--triarq-space-md); }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-badge { background: var(--triarq-color-primary); color: #fff; border-radius: var(--triarq-radius-pill); padding: 2px 8px; font-size: var(--triarq-text-caption); font-weight: var(--triarq-font-weight-bold); }
    .oi-card-empty, .oi-card-loading { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .oi-action-list { list-style: none; padding: 0; margin: 0; }
    .oi-action-item { display: flex; justify-content: space-between; padding: var(--triarq-space-sm) 0; border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); }
    .oi-action-role { color: var(--triarq-color-primary); font-weight: var(--triarq-font-weight-medium); }
  `]
})
export class MyActionQueueCardComponent implements OnInit {
  @Input() userId = '';

  items:   ActionItem[] = [];
  loading = true;

  constructor(
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Build A: action queue is sparsely populated — no full wiring until Build B
    // Placeholder load that returns empty gracefully
    this.loading = false;
    this.cdr.markForCheck();
  }
}
