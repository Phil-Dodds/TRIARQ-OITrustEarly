// epo-wip-limits.component.ts — Admin EPO WIP Limits screen
// Route: /admin/epo-wip
// Spec: Contract 20 §8 (D-401). Decision authority: D-400, D-401, D-183, D-200.
//
// Single responsibility (S-030): list every EPO, allow inline edit of zone
// limits, allow per-row and bulk reset to 3/3/3.
//
// Patterns applied:
//   D-93  / Arch-1: all DB access via DeliveryService → MCP.
//   D-140       — blocked-action UX with explanation when the user is not Admin.
//   D-171 / D-380 — sort state persisted via ScreenStateService (SCREEN_KEYS.ADMIN_EPO_WIP).
//   D-183       — destructive action two-step inline confirmation for resets.
//   D-200       — Pattern 3 inline validation (red) for non-integer / <1 inputs.
//   D-369       — Admin or Phil only (super_admin gating handled at MCP).
//   S-001       — visible context: page title + description + clear next action.
//   S-024       — capitalization: "EPO", "Initiative", "WIP".
//   S-028 Context A — auto-save shows "Saving…" → ✓ tick → fades. No toast.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { IonicModule }     from '@ionic/angular';
import { Subscription, filter, take, firstValueFrom } from 'rxjs';

import { DeliveryService }      from '../../../core/services/delivery.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import {
  ScreenStateService,
  SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import { EpoWipLimitRow }       from '../../../core/types/database';

type SortColumn = 'display_name' | 'pre_build_limit' | 'build_limit' | 'post_deploy_limit' | 'updated_at';
type SortDir    = 'asc' | 'desc';
type LimitField = 'pre_build_limit' | 'build_limit' | 'post_deploy_limit';

interface EpoRowView extends EpoWipLimitRow {
  // Per-row edit state — drives the auto-save UI.
  saving_field:    LimitField | null;
  saved_field:     LimitField | null;    // briefly true after success — fades in template
  error_field:     LimitField | null;
  error_message:   string;
  reset_confirming: boolean;
}

const SAVED_TICK_FADE_MS = 1500;

@Component({
  selector: 'app-epo-wip-limits',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule],
  template: `
    <div class="ewl-shell">

      <!-- Back link to admin hub -->
      <a routerLink="/admin" class="ewl-back-link">← Administration</a>

      <!-- Header -->
      <div class="ewl-header">
        <div class="ewl-header-row">
          <h3 class="ewl-title">EPO WIP Limits</h3>

          <!-- Bulk reset trigger (D-183 two-step) -->
          <ng-container *ngIf="rows.length > 0">
            <button
              *ngIf="!bulkResetConfirming"
              type="button"
              class="ewl-bulk-reset-btn"
              (click)="onBulkResetClick()">
              Reset all to 3·3·3
            </button>

            <div *ngIf="bulkResetConfirming" class="ewl-bulk-confirm">
              <span class="ewl-bulk-confirm-msg">
                Reset all EPO WIP limits to 3/3/3? This affects {{ rows.length }} EPO(s).
              </span>
              <button type="button"
                      class="ewl-confirm-primary"
                      [disabled]="bulkSaving"
                      (click)="onBulkResetConfirm()">
                {{ bulkSaving ? 'Resetting…' : 'Confirm' }}
              </button>
              <button type="button"
                      class="ewl-confirm-ghost"
                      [disabled]="bulkSaving"
                      (click)="onBulkResetCancel()">
                Cancel
              </button>
            </div>
          </ng-container>
        </div>

        <!-- S-015 surface description -->
        <p class="ewl-subtitle">
          Configure WIP zone limits for each EPO. Defaults are 3 per zone — Pre-Build, Build,
          and Post-Build. Lower limits enforce tighter focus; higher limits open capacity.
          Changes take effect on the next gate approval.
        </p>
      </div>

      <!-- Blocked state — non-admin (D-140) -->
      <div *ngIf="blockedReason" class="ewl-blocked">
        <div class="ewl-blocked-primary">EPO WIP Limits configuration is restricted.</div>
        <div class="ewl-blocked-secondary">{{ blockedReason }}</div>
      </div>

      <ng-container *ngIf="!blockedReason">

        <!-- Top-level load error -->
        <div *ngIf="loadError && !loading" class="ewl-error">
          <div class="ewl-error-primary">EPO WIP Limits could not load.</div>
          <div class="ewl-error-secondary">{{ loadError }}</div>
        </div>

        <!-- Column headers — D-196: always rendered -->
        <div class="ewl-grid ewl-grid-header">
          <span class="ewl-sort-trigger" (click)="onSort('display_name')">
            EPO Name {{ sortIndicator('display_name') }}
          </span>
          <span class="num ewl-sort-trigger" (click)="onSort('pre_build_limit')">
            Pre-Build {{ sortIndicator('pre_build_limit') }}
          </span>
          <span class="num ewl-sort-trigger" (click)="onSort('build_limit')">
            Build {{ sortIndicator('build_limit') }}
          </span>
          <span class="num ewl-sort-trigger" (click)="onSort('post_deploy_limit')">
            Post-Build {{ sortIndicator('post_deploy_limit') }}
          </span>
          <span class="ewl-sort-trigger" (click)="onSort('updated_at')">
            Last Updated {{ sortIndicator('updated_at') }}
          </span>
          <span><!-- Reset action column --></span>
        </div>

        <!-- Skeleton — S-028 Context B -->
        <div *ngIf="loading">
          <div *ngFor="let _ of skeletonRows" class="ewl-grid ewl-grid-row">
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && !loadError && rows.length === 0" class="ewl-empty">
          <div class="ewl-empty-primary">No EPOs configured.</div>
          <div class="ewl-empty-secondary">
            Assign the EPO role to users in
            <a routerLink="/admin/users" class="ewl-empty-link">User Management</a>.
            New EPOs are added here automatically at 3/3/3.
          </div>
        </div>

        <!-- Rows -->
        <ng-container *ngIf="!loading && !loadError">
          <div *ngFor="let row of sortedRows; trackBy: trackByUserId"
               class="ewl-grid ewl-grid-row">

            <!-- EPO name -->
            <span class="ewl-epo-name">{{ row.display_name }}</span>

            <!-- Pre-Build limit -->
            <span class="num ewl-cell">
              <input type="number" min="1"
                     class="ewl-input"
                     [class.ewl-input-error]="row.error_field === 'pre_build_limit'"
                     [value]="row.pre_build_limit"
                     [disabled]="row.saving_field === 'pre_build_limit'"
                     (change)="onLimitChange(row, 'pre_build_limit', $any($event.target).value)" />
              <span *ngIf="row.saving_field === 'pre_build_limit'" class="ewl-status">Saving…</span>
              <span *ngIf="row.saved_field === 'pre_build_limit'" class="ewl-status ewl-saved">✓</span>
              <span *ngIf="row.error_field === 'pre_build_limit'" class="ewl-field-error">
                {{ row.error_message }}
              </span>
            </span>

            <!-- Build limit -->
            <span class="num ewl-cell">
              <input type="number" min="1"
                     class="ewl-input"
                     [class.ewl-input-error]="row.error_field === 'build_limit'"
                     [value]="row.build_limit"
                     [disabled]="row.saving_field === 'build_limit'"
                     (change)="onLimitChange(row, 'build_limit', $any($event.target).value)" />
              <span *ngIf="row.saving_field === 'build_limit'" class="ewl-status">Saving…</span>
              <span *ngIf="row.saved_field === 'build_limit'" class="ewl-status ewl-saved">✓</span>
              <span *ngIf="row.error_field === 'build_limit'" class="ewl-field-error">
                {{ row.error_message }}
              </span>
            </span>

            <!-- Post-Deploy limit -->
            <span class="num ewl-cell">
              <input type="number" min="1"
                     class="ewl-input"
                     [class.ewl-input-error]="row.error_field === 'post_deploy_limit'"
                     [value]="row.post_deploy_limit"
                     [disabled]="row.saving_field === 'post_deploy_limit'"
                     (change)="onLimitChange(row, 'post_deploy_limit', $any($event.target).value)" />
              <span *ngIf="row.saving_field === 'post_deploy_limit'" class="ewl-status">Saving…</span>
              <span *ngIf="row.saved_field === 'post_deploy_limit'" class="ewl-status ewl-saved">✓</span>
              <span *ngIf="row.error_field === 'post_deploy_limit'" class="ewl-field-error">
                {{ row.error_message }}
              </span>
            </span>

            <!-- Last updated -->
            <span class="ewl-updated">
              {{ row.updated_at ? formatUpdated(row) : '—' }}
            </span>

            <!-- Reset to 3·3·3 — D-183 two-step inline -->
            <span class="ewl-reset-cell">
              <a *ngIf="!row.reset_confirming"
                 class="ewl-reset-link"
                 (click)="onRowResetClick(row)">
                Reset to 3·3·3
              </a>
              <span *ngIf="row.reset_confirming" class="ewl-row-confirm">
                Reset {{ row.display_name }}'s limits to 3/3/3?
                <button type="button"
                        class="ewl-confirm-primary"
                        [disabled]="row.saving_field !== null"
                        (click)="onRowResetConfirm(row)">
                  {{ row.saving_field ? 'Resetting…' : 'Confirm' }}
                </button>
                <button type="button"
                        class="ewl-confirm-ghost"
                        [disabled]="row.saving_field !== null"
                        (click)="onRowResetCancel(row)">
                  Cancel
                </button>
              </span>
            </span>
          </div>
        </ng-container>

      </ng-container>

    </div>
  `,
  styles: [`
    .ewl-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .ewl-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .ewl-header { margin-bottom: var(--triarq-space-md); }
    .ewl-header-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); margin: 8px 0 4px 0; }
    .ewl-title { margin: 0; }
    .ewl-bulk-reset-btn { background: transparent; color: var(--triarq-color-primary, #257099); border: 1px solid var(--triarq-color-primary, #257099); border-radius: 5px; padding: 6px 14px; font-size: var(--triarq-text-small); cursor: pointer; }
    .ewl-bulk-reset-btn:hover { background: rgba(37,112,153,0.08); }
    .ewl-bulk-confirm, .ewl-row-confirm, .ewl-blocked { background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 5px; }
    .ewl-bulk-confirm { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
    .ewl-bulk-confirm-msg { font-size: var(--triarq-text-small); color: var(--triarq-color-text-primary); }
    .ewl-confirm-primary { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
    .ewl-confirm-primary:disabled { opacity: 0.6; cursor: wait; }
    .ewl-confirm-ghost { background: transparent; color: var(--triarq-color-text-secondary); border: 1px solid var(--triarq-color-border, #ccc); border-radius: 5px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
    .ewl-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .ewl-grid { display: grid; grid-template-columns: 1.8fr 130px 130px 150px 1.5fr 160px; gap: var(--triarq-space-sm); padding: var(--triarq-space-xs) var(--triarq-space-sm); align-items: center; }
    .ewl-grid-header { font-size: var(--triarq-text-small); font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .ewl-grid-row { border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); min-height: 44px; }
    .num { text-align: center; }
    .ewl-sort-trigger { cursor: pointer; user-select: none; }
    .ewl-sort-trigger:hover { color: var(--triarq-color-primary); }
    .ewl-epo-name { font-weight: 500; color: var(--triarq-color-text-primary); }
    .ewl-cell { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
    .ewl-input { width: 64px; padding: 4px 6px; border: 1px solid var(--triarq-color-border, #ccc); border-radius: 5px; font-size: var(--triarq-text-small); text-align: center; }
    .ewl-input:focus { outline: none; border-color: var(--triarq-color-primary, #257099); }
    .ewl-input-error { border: 2px solid var(--triarq-color-error, #c0392b); }
    .ewl-status { font-size: 11px; color: var(--triarq-color-text-secondary); }
    .ewl-saved { color: var(--triarq-color-success, #2c8a3a); animation: ewlFade ${SAVED_TICK_FADE_MS}ms ease-out forwards; }
    @keyframes ewlFade { 0%,80% { opacity: 1; } 100% { opacity: 0; } }
    .ewl-field-error { flex-basis: 100%; font-size: 11px; color: var(--triarq-color-error, #c0392b); margin-top: 2px; }
    .ewl-updated, .ewl-reset-link { font-size: 11px; color: var(--triarq-color-stone, #5A5A5A); }
    .ewl-reset-cell { display: inline-flex; align-items: center; gap: 6px; }
    .ewl-reset-link { cursor: pointer; text-decoration: underline; }
    .ewl-reset-link:hover { color: var(--triarq-color-primary); }
    .ewl-row-confirm { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--triarq-color-text-primary); padding: 4px 6px; }
    .ewl-empty { padding: var(--triarq-space-xl); text-align: center; }
    .ewl-empty-primary { font-size: var(--triarq-text-body); color: var(--triarq-color-text-primary); margin-bottom: 4px; }
    .ewl-empty-secondary, .ewl-error-secondary, .ewl-blocked-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
    .ewl-empty-link { color: var(--triarq-color-primary); text-decoration: underline; }
    .ewl-error { padding: var(--triarq-space-md); max-width: 560px; }
    .ewl-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px; }
    .ewl-blocked { max-width: 560px; padding: var(--triarq-space-md); }
    .ewl-blocked-primary { font-weight: 500; color: var(--triarq-color-text-primary); margin-bottom: 4px; }
  `]
})
export class EpoWipLimitsComponent implements OnInit, OnDestroy {

  loading          = false;
  loadError        = '';
  blockedReason    = '';

  rows: EpoRowView[] = [];

  // Sort state — persisted via SCREEN_KEYS.ADMIN_EPO_WIP per D-171.
  sortColumn: SortColumn = 'display_name';
  sortDir:    SortDir    = 'asc';

  bulkResetConfirming = false;
  bulkSaving          = false;

  readonly skeletonRows = [1, 2, 3, 4];

  private readonly subs = new Subscription();
  private fadeTimers = new Map<string, number>();   // key = `${user_id}|${field}`

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly profile:     UserProfileService,
    private readonly screenState: ScreenStateService,
    private readonly router:      Router,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(async profile => {
        // D-369 / D-394: Admin guard. Phil is super-admin per CC-19-06.
        const isAdmin = profile.is_admin === true;
        if (!isAdmin) {
          this.blockedReason =
            'You need Admin role to configure EPO WIP limits. ' +
            'Contact your System Admin if you need access to this screen.';
          this.cdr.markForCheck();
          return;
        }

        // Restore sort state per D-171.
        const saved = await this.screenState.restore(SCREEN_KEYS.ADMIN_EPO_WIP);
        if (saved?.sort_state) {
          const col = saved.sort_state['column'] as SortColumn | undefined;
          const dir = saved.sort_state['direction'] as SortDir | undefined;
          if (col && this.isSortColumn(col)) { this.sortColumn = col; }
          if (dir === 'asc' || dir === 'desc') { this.sortDir = dir; }
        }

        this.loadRows();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.fadeTimers.forEach(t => clearTimeout(t));
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  private loadRows(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.delivery.getEpoWipLimits().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.rows = res.data.map(r => this.toView(r));
        } else {
          this.loadError = res.error ?? 'Unable to reach the server. Check your connection and try again.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Unable to reach the server. Check your connection and try again.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private toView(r: EpoWipLimitRow): EpoRowView {
    return {
      ...r,
      saving_field:     null,
      saved_field:      null,
      error_field:      null,
      error_message:    '',
      reset_confirming: false
    };
  }

  // ── Inline edit ───────────────────────────────────────────────────────────

  onLimitChange(row: EpoRowView, field: LimitField, rawValue: string): void {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < 1) {
      row.error_field   = field;
      row.error_message = 'Enter a whole number of 1 or more.';
      this.cdr.markForCheck();
      return;
    }

    // No change?
    if (parsed === row[field]) {
      row.error_field   = null;
      row.error_message = '';
      this.cdr.markForCheck();
      return;
    }

    const priorValue = row[field];
    row.saving_field  = field;
    row.saved_field   = null;
    row.error_field   = null;
    row.error_message = '';

    // Optimistic update.
    row[field] = parsed;
    this.cdr.markForCheck();

    this.delivery.updateEpoWipLimits({
      user_id: row.user_id,
      [field]: parsed
    } as { user_id: string; pre_build_limit?: number; build_limit?: number; post_deploy_limit?: number }).subscribe({
      next: (res) => {
        row.saving_field = null;
        if (res.success && res.data) {
          row.pre_build_limit   = res.data.pre_build_limit;
          row.build_limit       = res.data.build_limit;
          row.post_deploy_limit = res.data.post_deploy_limit;
          row.updated_at        = res.data.updated_at;
          row.updated_by_display_name = res.data.updated_by_display_name ?? null;
          this.flashSavedTick(row, field);
        } else {
          // Revert optimistic update on failure.
          row[field]        = priorValue;
          row.error_field   = field;
          row.error_message = res.error ?? 'Could not save. Try again.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        row[field]         = priorValue;
        row.saving_field   = null;
        row.error_field    = field;
        row.error_message  = err?.error ?? 'Could not save. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  private flashSavedTick(row: EpoRowView, field: LimitField): void {
    row.saved_field = field;
    const key = `${row.user_id}|${field}`;
    const prior = this.fadeTimers.get(key);
    if (prior) { clearTimeout(prior); }
    const handle = window.setTimeout(() => {
      row.saved_field = null;
      this.fadeTimers.delete(key);
      this.cdr.markForCheck();
    }, SAVED_TICK_FADE_MS);
    this.fadeTimers.set(key, handle);
  }

  // ── Per-row reset (D-183) ─────────────────────────────────────────────────

  onRowResetClick(row: EpoRowView): void {
    row.reset_confirming = true;
    this.cdr.markForCheck();
  }

  onRowResetCancel(row: EpoRowView): void {
    row.reset_confirming = false;
    this.cdr.markForCheck();
  }

  onRowResetConfirm(row: EpoRowView): void {
    row.saving_field  = 'pre_build_limit'; // generic 'saving' indicator on row
    row.error_field   = null;
    row.error_message = '';
    this.cdr.markForCheck();

    this.delivery.updateEpoWipLimits({
      user_id:           row.user_id,
      pre_build_limit:   3,
      build_limit:       3,
      post_deploy_limit: 3
    }).subscribe({
      next: (res) => {
        row.saving_field      = null;
        row.reset_confirming  = false;
        if (res.success && res.data) {
          row.pre_build_limit   = res.data.pre_build_limit;
          row.build_limit       = res.data.build_limit;
          row.post_deploy_limit = res.data.post_deploy_limit;
          row.updated_at        = res.data.updated_at;
          row.updated_by_display_name = res.data.updated_by_display_name ?? null;
          this.flashSavedTick(row, 'pre_build_limit');
        } else {
          row.error_field   = 'pre_build_limit';
          row.error_message = res.error ?? 'Reset failed. Try again.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        row.saving_field  = null;
        row.error_field   = 'pre_build_limit';
        row.error_message = err?.error ?? 'Reset failed. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Bulk reset (D-183) ────────────────────────────────────────────────────

  onBulkResetClick(): void {
    this.bulkResetConfirming = true;
    this.cdr.markForCheck();
  }

  onBulkResetCancel(): void {
    this.bulkResetConfirming = false;
    this.cdr.markForCheck();
  }

  async onBulkResetConfirm(): Promise<void> {
    this.bulkSaving = true;
    this.cdr.markForCheck();

    // Sequential reset to keep behavior predictable on partial failure. Worst
    // case slow with many EPOs — acceptable for an Admin-only action.
    let firstFailure: string | null = null;
    for (const row of this.rows) {
      try {
        const res = await firstValueFrom(
          this.delivery.updateEpoWipLimits({
            user_id:           row.user_id,
            pre_build_limit:   3,
            build_limit:       3,
            post_deploy_limit: 3
          })
        );
        if (!res.success && !firstFailure) {
          firstFailure = `${row.display_name}: ${res.error ?? 'unknown error'}`;
        }
      } catch (err) {
        if (!firstFailure) {
          firstFailure = `${row.display_name}: ${(err as { error?: string })?.error ?? 'network error'}`;
        }
      }
    }

    this.bulkResetConfirming = false;
    this.bulkSaving          = false;

    // Reload from server to reconcile (S-008 — refresh on action).
    this.loadRows();

    if (firstFailure) {
      this.loadError = `Bulk reset completed with errors. First failure: ${firstFailure}`;
      this.cdr.markForCheck();
    }
  }

  // ── Sort (D-171) ──────────────────────────────────────────────────────────

  onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDir    = 'asc';
    }
    this.persistSort();
    this.cdr.markForCheck();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) { return ''; }
    return this.sortDir === 'asc' ? '▲' : '▼';
  }

  get sortedRows(): EpoRowView[] {
    const arr = [...this.rows];
    const col = this.sortColumn;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = a[col];
      const bv = b[col];
      if (av === null && bv === null) { return 0; }
      if (av === null) { return 1; }   // nulls last regardless of direction
      if (bv === null) { return -1; }
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
    return arr;
  }

  private persistSort(): void {
    this.screenState.save(
      SCREEN_KEYS.ADMIN_EPO_WIP,
      {},
      { column: this.sortColumn, direction: this.sortDir }
    );
  }

  private isSortColumn(value: string): value is SortColumn {
    return ['display_name', 'pre_build_limit', 'build_limit', 'post_deploy_limit', 'updated_at']
      .includes(value);
  }

  // ── Misc helpers ──────────────────────────────────────────────────────────

  formatUpdated(row: EpoRowView): string {
    if (!row.updated_at) { return '—'; }
    const date = new Date(row.updated_at);
    const datePart = date.toLocaleDateString();
    const byPart = row.updated_by_display_name ? ` by ${row.updated_by_display_name}` : '';
    return `${datePart}${byPart}`;
  }

  trackByUserId(_: number, row: EpoRowView): string {
    return row.user_id;
  }
}
