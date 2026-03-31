// divisions-card.component.ts — Phil + Admin (D-150)
// Shows root Trust Divisions with link to Admin module.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { McpService }  from '../../../core/services/mcp.service';
import { Division }    from '../../../core/types/database';
import { firstValueFrom } from 'rxjs';

@Component({
  selector:        'app-divisions-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>Divisions</h4>
        <a routerLink="/admin/divisions" class="oi-card-link">Manage →</a>
      </div>

      <p *ngIf="loading" class="oi-card-empty">Loading…</p>
      <p *ngIf="!loading && divisions.length === 0" class="oi-card-empty">
        No Divisions created yet. Go to Manage to create the nine Trust Divisions.
      </p>

      <ul *ngIf="!loading && divisions.length > 0" class="oi-division-list">
        <li *ngFor="let d of divisions" class="oi-division-item">
          <span class="oi-division-name">{{ d.division_name }}</span>
          <span class="oi-division-label" *ngIf="d.division_type_label">{{ d.division_type_label }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--triarq-space-md); }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-card-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .oi-card-empty { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .oi-division-list { list-style: none; padding: 0; margin: 0; }
    .oi-division-item { display: flex; justify-content: space-between; padding: var(--triarq-space-xs) 0; border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); }
    .oi-division-label { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-caption); }
  `]
})
export class DivisionsCardComponent implements OnInit {
  divisions: Division[] = [];
  loading   = true;

  constructor(
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.mcp.call<Division[]>('division', 'list_divisions', {})
      );
      this.divisions = response.data ?? [];
    } catch {
      this.divisions = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
