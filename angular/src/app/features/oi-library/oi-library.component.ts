// oi-library.component.ts — OI Library list view
// Build A: Browse and search the organizational knowledge base.
// Shows all artifacts accessible to the current user's Divisions.
// Click an artifact to view detail at /library/:id.
// D-93:  McpService only — no direct Supabase access.
// D-140: Blocked action UX on all errors.
// D-178: Three-tier loading standard applied — Tier 1 skeleton, Tier 2 button spinner.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../core/services/mcp.service';
import { BlockedActionComponent }      from '../../shared/components/blocked-action/blocked-action.component';
import { Artifact }                    from '../../core/types/database';

@Component({
  selector: 'app-oi-library',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonicModule,
    BlockedActionComponent
  ],
  template: `
    <div class="oi-card" style="max-width:960px;margin:var(--triarq-space-2xl) auto;">

      <!-- Header ────────────────────────────────────────────────────────── -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);">
        <h3 style="margin:0;">OI Library</h3>
        <span style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ totalCount }} artifact{{ totalCount === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Search bar ────────────────────────────────────────────────────── -->
      <form [formGroup]="searchForm" (ngSubmit)="search()" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;gap:var(--triarq-space-sm);">
          <input
            formControlName="query"
            class="oi-input"
            style="flex:1;"
            placeholder="Search by title…"
          />
          <!-- D-178 Tier 2: spinner on Search button while searching -->
          <button type="submit" class="oi-btn-primary" [disabled]="searching">
            <ion-spinner *ngIf="searching" name="crescent"
                         style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
            </ion-spinner>
            {{ searching ? 'Searching…' : 'Search' }}
          </button>
          <button
            *ngIf="isSearching"
            type="button"
            class="oi-btn-secondary"
            (click)="clearSearch()"
          >Clear</button>
        </div>
      </form>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:flex;align-items:flex-start;justify-content:space-between;
                    padding:var(--triarq-space-sm) var(--triarq-space-md);
                    border-radius:6px;margin-bottom:6px;
                    border:1px solid var(--triarq-color-border);gap:var(--triarq-space-md);">
          <div style="flex:1;min-width:0;">
            <ion-skeleton-text animated style="height:16px;border-radius:4px;margin-bottom:6px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:12px;border-radius:4px;width:60%;"></ion-skeleton-text>
          </div>
          <ion-skeleton-text animated style="height:20px;width:70px;border-radius:999px;flex-shrink:0;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Artifact list ─────────────────────────────────────────────────── -->
      <div *ngIf="!loading">
        <div
          *ngIf="artifacts.length === 0 && !blockedMessage"
          style="text-align:center;padding:var(--triarq-space-xl);
                 color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);"
        >
          {{ isSearching ? 'No results for "' + lastQuery + '".' : 'No artifacts in the library yet.' }}
        </div>

        <div
          *ngFor="let a of artifacts"
          [routerLink]="['/library', a.id]"
          style="display:flex;align-items:flex-start;justify-content:space-between;
                 padding:var(--triarq-space-sm) var(--triarq-space-md);
                 border-radius:6px;margin-bottom:6px;cursor:pointer;
                 border:1px solid var(--triarq-color-border);transition:background 0.15s;"
          onmouseenter="this.style.background='var(--triarq-color-background-subtle)'"
          onmouseleave="this.style.background=''"
        >
          <div style="flex:1;min-width:0;">
            <div style="font-weight:500;color:var(--triarq-color-text-primary);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {{ a.artifact_title }}
            </div>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                        margin-top:2px;">
              <span *ngIf="a.artifact_types">{{ a.artifact_types.type_name }}</span>
              <span *ngIf="a.artifact_types && a.divisions"> · </span>
              <span *ngIf="a.divisions">{{ a.divisions.division_name }}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);margin-left:var(--triarq-space-md);">
            <span
              class="oi-pill"
              [style.background]="statusBg(a.lifecycle_status)"
              [style.color]="statusColor(a.lifecycle_status)"
            >{{ a.lifecycle_status }}</span>
            <span style="color:var(--triarq-color-text-tertiary);font-size:20px;">›</span>
          </div>
        </div>
      </div>

      <!-- Pagination ────────────────────────────────────────────────────── -->
      <div
        *ngIf="!loading && !isSearching && artifacts.length > 0"
        style="margin-top:var(--triarq-space-md);display:flex;
               justify-content:center;gap:var(--triarq-space-sm);"
      >
        <button
          class="oi-btn-secondary"
          [disabled]="page === 1"
          (click)="prevPage()"
          style="font-size:var(--triarq-text-small);"
        >← Prev</button>
        <span style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                     align-self:center;">
          Page {{ page }}
        </span>
        <button
          class="oi-btn-secondary"
          [disabled]="artifacts.length < pageSize"
          (click)="nextPage()"
          style="font-size:var(--triarq-text-small);"
        >Next →</button>
      </div>
    </div>
  `
})
export class OILibraryComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────
  artifacts:      Artifact[]  = [];
  loading         = false;
  searching       = false;
  isSearching     = false;
  lastQuery       = '';
  totalCount      = 0;
  page            = 1;
  readonly pageSize = 20;
  blockedMessage  = '';
  blockedHint     = '';
  searchForm!:    FormGroup;

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4];

  constructor(
    private readonly mcp: McpService,
    private readonly fb:  FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchForm = this.fb.group({ query: [''] });
    this.loadPage(1);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private loadPage(page: number): void {
    this.loading        = true;
    this.isSearching    = false;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<{ artifacts: Artifact[]; total_count: number; page_number: number; page_size: number }>(
        'document',
        'list_documents',
        { page_number: page, page_size: this.pageSize }
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.artifacts  = res.data.artifacts;
            this.totalCount = res.data.total_count;
            this.page       = res.data.page_number;
          } else {
            this.setBlocked(
              res.error ?? 'Could not load the library.',
              'Ensure you have Division membership and your session is active.'
            );
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.setBlocked(
            err.error ?? 'Could not load the library.',
            'Ensure you have Division membership and your session is active.'
          );
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  search(): void {
    const query = (this.searchForm.value.query as string ?? '').trim();
    if (!query) { this.clearSearch(); return; }

    this.searching      = true;
    this.lastQuery      = query;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<{ results: Artifact[]; total_count: number }>(
        'document',
        'search_documents',
        { query }
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.artifacts  = res.data.results;
            this.totalCount = res.data.total_count;
            this.isSearching = true;
          } else {
            this.setBlocked(res.error ?? 'Search failed.', '');
          }
          this.searching = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.setBlocked(err.error ?? 'Search failed.', 'Try a different search term.');
          this.searching = false;
          this.cdr.markForCheck();
        }
      });
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.isSearching    = false;
    this.lastQuery      = '';
    this.blockedMessage = '';
    this.loadPage(1);
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  nextPage(): void { this.loadPage(this.page + 1); }
  prevPage(): void { if (this.page > 1) { this.loadPage(this.page - 1); } }

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
