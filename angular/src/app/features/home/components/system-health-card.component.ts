// system-health-card.component.ts — Phil only (D-150)
// Shows Division count, user count, artifact count. Functional in Build A.

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { McpService }   from '../../../core/services/mcp.service';
import { firstValueFrom } from 'rxjs';

interface HealthStats {
  divisionCount: number;
  userCount:     number;
  artifactCount: number;
}

@Component({
  selector:        'app-system-health-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <h4>System Health</h4>
      <p *ngIf="loading" class="oi-card-empty">Loading…</p>
      <div *ngIf="!loading" class="oi-health-stats">
        <div class="oi-stat">
          <span class="oi-stat-value">{{ stats.divisionCount }}</span>
          <span class="oi-stat-label">Divisions</span>
        </div>
        <div class="oi-stat">
          <span class="oi-stat-value">{{ stats.userCount }}</span>
          <span class="oi-stat-label">Users</span>
        </div>
        <div class="oi-stat">
          <span class="oi-stat-value">{{ stats.artifactCount }}</span>
          <span class="oi-stat-label">Artifacts</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    h4 { margin: 0 0 var(--triarq-space-md) 0; font-size: var(--triarq-text-h4); }
    .oi-health-stats { display: flex; gap: var(--triarq-space-lg); }
    .oi-stat { display: flex; flex-direction: column; align-items: center; }
    .oi-stat-value { font-size: var(--triarq-text-h3); font-weight: var(--triarq-font-weight-bold); color: var(--triarq-color-primary); }
    .oi-stat-label { font-size: var(--triarq-text-caption); color: var(--triarq-color-text-secondary); }
    .oi-card-empty { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
  `]
})
export class SystemHealthCardComponent implements OnInit {
  stats:   HealthStats = { divisionCount: 0, userCount: 0, artifactCount: 0 };
  loading = true;

  constructor(
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const [divResponse, userResponse, artifactResponse] = await Promise.all([
        firstValueFrom(this.mcp.call<unknown[]>('division', 'list_divisions', {})),
        firstValueFrom(this.mcp.call<unknown[]>('division', 'list_users', {})),
        firstValueFrom(this.mcp.call<{ total: number }>('document', 'list_documents', { limit: 1 }))
      ]);

      this.stats = {
        divisionCount: (divResponse.data as unknown[])?.length ?? 0,
        userCount:     (userResponse.data as unknown[])?.length ?? 0,
        artifactCount: (artifactResponse.data as { total: number })?.total ?? 0
      };
    } catch {
      // Non-fatal — stats remain at 0
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
