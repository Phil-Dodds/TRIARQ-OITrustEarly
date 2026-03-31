// oi-library-card.component.ts — All roles (D-150)
// Shows recent Canon artifacts scoped to user's Divisions. Functional in Build A.

import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { McpService }  from '../../../core/services/mcp.service';
import { Artifact }    from '../../../core/types/database';
import { firstValueFrom } from 'rxjs';
import { Router }      from '@angular/router';

@Component({
  selector:        'app-oi-library-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card">
      <div class="oi-card-header">
        <h4>OI Library</h4>
        <a routerLink="/library" class="oi-card-link">View all →</a>
      </div>

      <p *ngIf="loading" class="oi-card-empty">Loading…</p>
      <p *ngIf="!loading && artifacts.length === 0" class="oi-card-empty">
        No canonical documents yet.
      </p>

      <ul *ngIf="!loading && artifacts.length > 0" class="oi-artifact-list">
        <li *ngFor="let a of artifacts" class="oi-artifact-item" (click)="openArtifact(a.id)">
          <span class="oi-artifact-title">{{ a.artifact_title }}</span>
          <span class="oi-status-pill status-{{ a.lifecycle_status }}">{{ a.lifecycle_status }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .oi-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--triarq-space-md); }
    h4 { margin: 0; font-size: var(--triarq-text-h4); }
    .oi-card-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .oi-card-empty { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); }
    .oi-artifact-list { list-style: none; padding: 0; margin: 0; }
    .oi-artifact-item { display: flex; justify-content: space-between; align-items: center; padding: var(--triarq-space-sm) 0; border-bottom: 1px solid var(--triarq-color-border); cursor: pointer; }
    .oi-artifact-item:hover { background: rgba(37,112,153,0.04); }
    .oi-artifact-title { font-size: var(--triarq-text-small); flex: 1; }
  `]
})
export class OILibraryCardComponent implements OnInit {
  @Input() userId = '';

  artifacts: Artifact[] = [];
  loading   = true;

  constructor(
    private readonly mcp:    McpService,
    private readonly router: Router,
    private readonly cdr:    ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.mcp.call<{ artifacts: Artifact[] }>('document', 'list_documents', {
          lifecycle_status: 'canon',
          limit: 5
        })
      );
      this.artifacts = response.data?.artifacts ?? [];
    } catch {
      this.artifacts = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  openArtifact(id: string): void {
    this.router.navigate(['/library', id]);
  }
}
