// artifact-detail.component.ts — OI Library artifact detail view
// Build A: Shows full artifact detail, download link, version history.
// Loaded via /library/:id route (see oi-library.module.ts).
// D-93:  McpService only — no direct Supabase access.
// D-140: Blocked action UX on all errors.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../core/services/mcp.service';
import { BlockedActionComponent }      from '../../shared/components/blocked-action/blocked-action.component';
import { Artifact, ArtifactVersion }   from '../../core/types/database';

@Component({
  selector: 'app-artifact-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    IonicModule,
    BlockedActionComponent
  ],
  template: `
    <div class="oi-card" style="max-width:800px;margin:var(--triarq-space-2xl) auto;">

      <!-- Back link ─────────────────────────────────────────────────────── -->
      <a
        routerLink="/library"
        style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
               display:inline-block;margin-bottom:var(--triarq-space-md);"
      >← OI Library</a>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Loading ───────────────────────────────────────────────────────── -->
      <div
        *ngIf="loading"
        style="text-align:center;padding:var(--triarq-space-xl);
               color:var(--triarq-color-text-secondary);"
      >Loading artifact…</div>

      <!-- Artifact detail ───────────────────────────────────────────────── -->
      <div *ngIf="!loading && artifact">

        <!-- Title + status ────────────────────────────────────────────────── -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;
                    margin-bottom:var(--triarq-space-md);">
          <div style="flex:1;min-width:0;">
            <h3 style="margin:0 0 6px 0;color:var(--triarq-color-text-primary);">
              {{ artifact.artifact_title }}
            </h3>
            <div style="display:flex;gap:var(--triarq-space-sm);flex-wrap:wrap;align-items:center;">
              <span
                class="oi-pill"
                [style.background]="statusBg(artifact.lifecycle_status)"
                [style.color]="statusColor(artifact.lifecycle_status)"
              >{{ artifact.lifecycle_status }}</span>
              <span
                *ngIf="artifact.artifact_types"
                class="oi-pill"
                style="background:var(--triarq-color-background-subtle);
                       color:var(--triarq-color-text-secondary);"
              >{{ artifact.artifact_types.type_name }}</span>
              <span
                *ngIf="artifact.divisions"
                class="oi-pill"
                style="background:var(--triarq-color-background-subtle);
                       color:var(--triarq-color-text-secondary);"
              >{{ artifact.divisions.division_name }}</span>
            </div>
          </div>

          <!-- Download button ─────────────────────────────────────────────── -->
          <a
            *ngIf="downloadUrl"
            [href]="downloadUrl"
            target="_blank"
            rel="noopener"
            class="oi-btn-primary"
            style="margin-left:var(--triarq-space-md);white-space:nowrap;
                   font-size:var(--triarq-text-small);text-decoration:none;"
          >↓ Download</a>
        </div>

        <!-- Metadata table ────────────────────────────────────────────────── -->
        <div
          style="background:var(--triarq-color-background-subtle);
                 border-radius:8px;padding:var(--triarq-space-md);
                 margin-bottom:var(--triarq-space-md);
                 display:grid;grid-template-columns:1fr 1fr;
                 gap:var(--triarq-space-sm);"
        >
          <div>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              Submitted
            </div>
            <div style="font-size:var(--triarq-text-small);font-weight:500;">
              {{ artifact.submitted_at | date:'mediumDate' }}
            </div>
          </div>
          <div *ngIf="artifact.artifact_types">
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              Type Description
            </div>
            <div style="font-size:var(--triarq-text-small);">
              {{ artifact.artifact_types.type_description ?? '—' }}
            </div>
          </div>
        </div>

        <!-- Version history ───────────────────────────────────────────────── -->
        <div>
          <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
            Version History
          </h4>
          <div
            *ngIf="versionsLoading"
            style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);"
          >Loading versions…</div>
          <div
            *ngIf="!versionsLoading && versions.length === 0"
            style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);"
          >No version history available.</div>
          <div
            *ngFor="let v of versions"
            style="display:flex;align-items:center;justify-content:space-between;
                   padding:var(--triarq-space-xs) var(--triarq-space-sm);
                   border-bottom:1px solid var(--triarq-color-border);
                   font-size:var(--triarq-text-small);"
          >
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
              <span
                class="oi-pill"
                style="background:var(--triarq-color-background-subtle);
                       color:var(--triarq-color-text-secondary);
                       font-size:11px;min-width:28px;text-align:center;"
              >v{{ v.version_number }}</span>
              <span style="color:var(--triarq-color-text-secondary);">
                {{ v.created_at | date:'mediumDate' }}
              </span>
              <span *ngIf="v.change_note" style="color:var(--triarq-color-text-primary);">
                {{ v.change_note }}
              </span>
            </div>
            <div *ngIf="v.document_files" style="color:var(--triarq-color-text-secondary);">
              {{ v.document_files.original_filename }}
              · {{ (v.document_files.file_size_bytes / 1024 / 1024).toFixed(1) }}MB
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ArtifactDetailComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────
  artifact:        Artifact | null       = null;
  downloadUrl:     string | null         = null;
  versions:        ArtifactVersion[]     = [];
  loading          = false;
  versionsLoading  = false;
  blockedMessage   = '';
  blockedHint      = '';

  private artifactId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly mcp:   McpService,
    private readonly cdr:   ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.artifactId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.artifactId) {
      this.setBlocked(
        'No artifact ID provided.',
        'Navigate to this page from the OI Library list.'
      );
      return;
    }
    this.loadArtifact();
    this.loadVersions();
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private loadArtifact(): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<{ artifact: Artifact; download_url: string | null }>(
        'document',
        'get_document',
        { artifact_id: this.artifactId }
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.artifact    = res.data.artifact;
            this.downloadUrl = res.data.download_url;
          } else {
            this.setBlocked(
              res.error ?? 'Could not load artifact.',
              'Ensure you have access to this artifact\'s Division.'
            );
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.setBlocked(
            err.error ?? 'Could not load artifact.',
            'Ensure you have Division access and your session is active.'
          );
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadVersions(): void {
    this.versionsLoading = true;
    this.cdr.markForCheck();

    this.mcp
      .call<{ versions: ArtifactVersion[] }>(
        'document',
        'get_document_versions',
        { artifact_id: this.artifactId }
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.versions = res.data.versions;
          }
          this.versionsLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // Version history is non-critical — fail silently, don't block the view.
          this.versionsLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Presentation helpers ───────────────────────────────────────────────────
  statusBg(status: string): string {
    const map: Record<string, string> = {
      canon:       'var(--triarq-color-primary)',
      candidate:   '#e3f2fd',
      seed_review: '#fff3e0',
      draft:       'var(--triarq-color-background-subtle)',
      superseded:  '#f5f5f5',
      archived:    '#f5f5f5'
    };
    return map[status] ?? 'var(--triarq-color-background-subtle)';
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      canon:       '#ffffff',
      candidate:   '#1565c0',
      seed_review: '#e65100',
      draft:       'var(--triarq-color-text-secondary)',
      superseded:  '#9e9e9e',
      archived:    '#9e9e9e'
    };
    return map[status] ?? 'var(--triarq-color-text-secondary)';
  }

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}
