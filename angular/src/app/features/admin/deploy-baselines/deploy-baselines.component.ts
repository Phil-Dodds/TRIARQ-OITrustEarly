// deploy-baselines.component.ts — Admin Deploy Roadmap Baselines screen
// Route: /admin/deploy-baselines
// Spec: Contract 27 §Workstream 1 (D-444). Decision authority: D-444, D-183, D-200, D-171, D-369.
//
// Single responsibility (S-030):
//   Manages the Deploy Roadmap Baselines admin screen — CRUD for
//   roadmap_freeze_dates records.
//   Does NOT manage the baseline selector on deploy views — that lives in
//   the EPO Deploy and Workstream Deploy view components.
//
// Patterns applied:
//   D-93 / Arch-1 — all DB access via DeliveryService → MCP.
//   D-140        — blocked-action UX explanation when the user is not Admin.
//   D-171 / D-380 — sort state persisted via ScreenStateService
//                   (SCREEN_KEYS.ADMIN_DEPLOY_BASELINES).
//   D-183        — destructive action two-step inline confirmation with a
//                   5-second timeout window for Remove.
//   D-200        — Pattern 3 inline validation (red) for invalid input.
//   D-369        — Admin or Phil only.
//   S-001        — visible context: page title + description + clear next action.
//   S-024        — capitalization: "Initiative", "Deploy", "Roadmap".
//   S-028 Context A — auto-save shows "Saving…" → ✓ tick → fades. No toast.
//   S-036        — column-header sort; ↕ on hover, ↑/↓ on active.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { RouterModule }    from '@angular/router';
import { IonicModule }     from '@ionic/angular';
import { Subscription, filter, take } from 'rxjs';

import { DeliveryService }      from '../../../core/services/delivery.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import {
  ScreenStateService,
  SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import { RoadmapFreezeDate }    from '../../../core/types/database';

type SortColumn = 'freeze_date' | 'freeze_label' | 'created_by_display_name' | 'created_at';
type SortDir    = 'asc' | 'desc';
type EditField  = 'freeze_date' | 'freeze_label';

interface BaselineRowView extends RoadmapFreezeDate {
  // Per-row state for inline edit + remove flow.
  editing_field:    EditField | null;
  edit_value:       string;       // staging value while editing
  saving_field:     EditField | null;
  saved_field:      EditField | null;
  error_field:      EditField | null;
  error_message:    string;
  remove_confirming: boolean;
  removing:         boolean;
}

const SAVED_TICK_FADE_MS = 1500;
const REMOVE_CONFIRM_WINDOW_MS = 5000;   // Spec §Workstream 1 Delete — 5-second timeout.

// Stand-in row id for the "+ Add Baseline" inline row (no DB id yet).
const NEW_ROW_ID = '__new__';

@Component({
  selector: 'app-deploy-baselines',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule],
  template: `
    <div class="dbl-shell">

      <!-- Back link to admin hub -->
      <a routerLink="/admin" class="dbl-back-link">← Administration</a>

      <!-- Header -->
      <div class="dbl-header">
        <div class="dbl-header-row">
          <h3 class="dbl-title">Deploy Roadmap Baselines</h3>

          <button
            *ngIf="!blockedReason && !creating"
            type="button"
            class="dbl-add-btn"
            (click)="onAddBaselineClick()">
            + Add Baseline
          </button>
        </div>

        <!-- S-015 surface description -->
        <p class="dbl-subtitle">
          Each baseline is a dated snapshot of the Deploy roadmap — used by the
          EPO Deploy and Workstream Deploy by Quarter views to show how prior
          quarters planned versus actually shipped. Add a baseline after every
          roadmap freeze; old baselines stay available for retrospective views.
        </p>
      </div>

      <!-- Blocked state — non-admin (D-140) -->
      <div *ngIf="blockedReason" class="dbl-blocked">
        <div class="dbl-blocked-primary">Deploy Roadmap Baselines configuration is restricted.</div>
        <div class="dbl-blocked-secondary">{{ blockedReason }}</div>
      </div>

      <ng-container *ngIf="!blockedReason">

        <!-- Top-level load error -->
        <div *ngIf="loadError && !loading" class="dbl-error">
          <div class="dbl-error-primary">Deploy Roadmap Baselines could not load.</div>
          <div class="dbl-error-secondary">{{ loadError }}</div>
        </div>

        <!-- Column headers — S-036 sortable column header pattern -->
        <div class="dbl-grid dbl-grid-header">
          <span class="dbl-sort-trigger" (click)="onSort('freeze_date')">
            Freeze Date {{ sortIndicator('freeze_date') }}
          </span>
          <span class="dbl-sort-trigger" (click)="onSort('freeze_label')">
            Label {{ sortIndicator('freeze_label') }}
          </span>
          <span class="dbl-sort-trigger" (click)="onSort('created_by_display_name')">
            Set By {{ sortIndicator('created_by_display_name') }}
          </span>
          <span class="dbl-sort-trigger" (click)="onSort('created_at')">
            Set At {{ sortIndicator('created_at') }}
          </span>
          <span><!-- Remove column --></span>
        </div>

        <!-- Skeleton — S-028 Context B -->
        <div *ngIf="loading">
          <div *ngFor="let _ of skeletonRows" class="dbl-grid dbl-grid-row">
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          </div>
        </div>

        <!-- Inline create row -->
        <div *ngIf="creating" class="dbl-grid dbl-grid-row dbl-create-row">
          <span class="dbl-cell">
            <input type="date"
                   class="dbl-input dbl-input-date"
                   [class.dbl-input-error]="createErrorField === 'freeze_date'"
                   [(ngModel)]="createDate"
                   (keydown.enter)="onCreateSave()"
                   (keydown.escape)="onCreateCancel()" />
            <span *ngIf="createErrorField === 'freeze_date'" class="dbl-field-error">
              {{ createErrorMessage }}
            </span>
          </span>
          <span class="dbl-cell">
            <input type="text"
                   maxlength="100"
                   class="dbl-input dbl-input-text"
                   placeholder="e.g. Roadmap Q3 2026"
                   [class.dbl-input-error]="createErrorField === 'freeze_label'"
                   [(ngModel)]="createLabel"
                   (keydown.enter)="onCreateSave()"
                   (keydown.escape)="onCreateCancel()" />
            <span *ngIf="createErrorField === 'freeze_label'" class="dbl-field-error">
              {{ createErrorMessage }}
            </span>
          </span>
          <span class="dbl-cell dbl-muted">—</span>
          <span class="dbl-cell dbl-muted">—</span>
          <span class="dbl-cell dbl-create-actions">
            <button type="button"
                    class="dbl-save-btn"
                    [disabled]="creatingSaving"
                    (click)="onCreateSave()">
              {{ creatingSaving ? 'Saving…' : 'Save' }}
            </button>
            <a class="dbl-cancel-link"
               [class.dbl-cancel-disabled]="creatingSaving"
               (click)="!creatingSaving && onCreateCancel()">
              Cancel
            </a>
          </span>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && !loadError && !creating && rows.length === 0" class="dbl-empty">
          <div class="dbl-empty-primary">No roadmap baselines recorded.</div>
          <div class="dbl-empty-secondary">
            Add one to enable planned vs. actual analysis on Deploy by Quarter views.
          </div>
        </div>

        <!-- Rows -->
        <ng-container *ngIf="!loading && !loadError">
          <div *ngFor="let row of sortedRows; trackBy: trackByRowId"
               class="dbl-grid dbl-grid-row">

            <!-- Freeze Date — inline editable -->
            <span class="dbl-cell">
              <ng-container *ngIf="row.editing_field !== 'freeze_date'">
                <span class="dbl-editable" (click)="onCellClick(row, 'freeze_date')">
                  {{ formatDate(row.freeze_date) }}
                </span>
              </ng-container>
              <ng-container *ngIf="row.editing_field === 'freeze_date'">
                <input type="date"
                       class="dbl-input dbl-input-date"
                       [class.dbl-input-error]="row.error_field === 'freeze_date'"
                       [disabled]="row.saving_field === 'freeze_date'"
                       [(ngModel)]="row.edit_value"
                       (blur)="onCellSave(row, 'freeze_date')"
                       (keydown.enter)="onCellSave(row, 'freeze_date')"
                       (keydown.escape)="onCellCancel(row)" />
              </ng-container>
              <span *ngIf="row.saving_field === 'freeze_date'" class="dbl-status">Saving…</span>
              <span *ngIf="row.saved_field === 'freeze_date'" class="dbl-status dbl-saved">✓</span>
              <span *ngIf="row.error_field === 'freeze_date'" class="dbl-field-error">
                {{ row.error_message }}
              </span>
            </span>

            <!-- Label — inline editable -->
            <span class="dbl-cell">
              <ng-container *ngIf="row.editing_field !== 'freeze_label'">
                <span class="dbl-editable" (click)="onCellClick(row, 'freeze_label')">
                  {{ row.freeze_label }}
                </span>
              </ng-container>
              <ng-container *ngIf="row.editing_field === 'freeze_label'">
                <input type="text"
                       maxlength="100"
                       class="dbl-input dbl-input-text"
                       [class.dbl-input-error]="row.error_field === 'freeze_label'"
                       [disabled]="row.saving_field === 'freeze_label'"
                       [(ngModel)]="row.edit_value"
                       (blur)="onCellSave(row, 'freeze_label')"
                       (keydown.enter)="onCellSave(row, 'freeze_label')"
                       (keydown.escape)="onCellCancel(row)" />
              </ng-container>
              <span *ngIf="row.saving_field === 'freeze_label'" class="dbl-status">Saving…</span>
              <span *ngIf="row.saved_field === 'freeze_label'" class="dbl-status dbl-saved">✓</span>
              <span *ngIf="row.error_field === 'freeze_label'" class="dbl-field-error">
                {{ row.error_message }}
              </span>
            </span>

            <!-- Set By -->
            <span class="dbl-cell dbl-muted">
              {{ row.created_by_display_name ?? '—' }}
            </span>

            <!-- Set At — relative + absolute tooltip -->
            <span class="dbl-cell dbl-muted"
                  [attr.title]="formatAbsolute(row.created_at)">
              {{ formatRelative(row.created_at) }}
            </span>

            <!-- Remove — D-183 two-step inline w/ 5s timeout -->
            <span class="dbl-cell dbl-remove-cell">
              <a *ngIf="!row.remove_confirming && !row.removing"
                 class="dbl-remove-link"
                 (click)="onRemoveClick(row)">
                Remove
              </a>
              <a *ngIf="row.remove_confirming"
                 class="dbl-remove-link dbl-remove-confirm"
                 (click)="onRemoveConfirm(row)">
                Confirm remove?
              </a>
              <span *ngIf="row.removing" class="dbl-status">Removing…</span>
            </span>
          </div>
        </ng-container>

      </ng-container>

    </div>
  `,
  styles: [`
    .dbl-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .dbl-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .dbl-header { margin-bottom: var(--triarq-space-md); }
    .dbl-header-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); margin: 8px 0 4px 0; }
    .dbl-title { margin: 0; }
    .dbl-add-btn { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 6px 14px; font-size: var(--triarq-text-small); cursor: pointer; }
    .dbl-add-btn:hover { filter: brightness(0.95); }
    .dbl-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .dbl-grid { display: grid; grid-template-columns: 170px 1.4fr 1fr 140px 200px; gap: var(--triarq-space-sm); padding: var(--triarq-space-xs) var(--triarq-space-sm); align-items: center; }
    .dbl-grid-header { font-size: var(--triarq-text-small); font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .dbl-grid-row { border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); min-height: 44px; }
    .dbl-create-row { background: rgba(37,112,153,0.04); }
    .dbl-sort-trigger { cursor: pointer; user-select: none; }
    .dbl-sort-trigger:hover { color: var(--triarq-color-primary); }
    .dbl-cell { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; min-height: 28px; }
    .dbl-editable { cursor: text; padding: 2px 4px; border-radius: 4px; }
    .dbl-editable:hover { background: rgba(37,112,153,0.06); }
    .dbl-input { padding: 4px 6px; border: 1px solid var(--triarq-color-border, #ccc); border-radius: 5px; font-size: var(--triarq-text-small); }
    .dbl-input:focus { outline: none; border-color: var(--triarq-color-primary, #257099); }
    .dbl-input-error { border: 2px solid var(--triarq-color-error, #c0392b); }
    .dbl-input-date { width: 150px; }
    .dbl-input-text { width: 100%; max-width: 280px; }
    .dbl-status { font-size: 11px; color: var(--triarq-color-text-secondary); }
    .dbl-saved { color: var(--triarq-color-success, #2c8a3a); animation: dblFade ${SAVED_TICK_FADE_MS}ms ease-out forwards; }
    @keyframes dblFade { 0%,80% { opacity: 1; } 100% { opacity: 0; } }
    .dbl-field-error { flex-basis: 100%; font-size: 11px; color: var(--triarq-color-error, #c0392b); margin-top: 2px; }
    .dbl-muted { color: var(--triarq-color-stone, #5A5A5A); }
    .dbl-create-actions { gap: 10px; }
    .dbl-save-btn { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 4px 12px; font-size: 12px; cursor: pointer; }
    .dbl-save-btn:disabled { opacity: 0.6; cursor: wait; }
    .dbl-cancel-link { color: var(--triarq-color-text-secondary); text-decoration: underline; cursor: pointer; font-size: 12px; }
    .dbl-cancel-link:hover { color: var(--triarq-color-primary); }
    .dbl-cancel-disabled { opacity: 0.5; cursor: default; }
    .dbl-remove-cell { justify-content: flex-end; }
    .dbl-remove-link { font-size: 11px; color: var(--triarq-color-stone, #5A5A5A); cursor: pointer; text-decoration: underline; }
    .dbl-remove-link:hover { color: var(--triarq-color-error, #c0392b); }
    .dbl-remove-confirm { color: var(--triarq-color-error, #c0392b); font-weight: 500; }
    .dbl-empty { padding: var(--triarq-space-xl); text-align: center; }
    .dbl-empty-primary { font-size: var(--triarq-text-body); color: var(--triarq-color-text-primary); margin-bottom: 4px; }
    .dbl-empty-secondary, .dbl-error-secondary, .dbl-blocked-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
    .dbl-error { padding: var(--triarq-space-md); max-width: 560px; }
    .dbl-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px; }
    .dbl-blocked { max-width: 560px; padding: var(--triarq-space-md); background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 5px; }
    .dbl-blocked-primary { font-weight: 500; color: var(--triarq-color-text-primary); margin-bottom: 4px; }
  `]
})
export class DeployBaselinesComponent implements OnInit, OnDestroy {

  loading       = false;
  loadError     = '';
  blockedReason = '';

  rows: BaselineRowView[] = [];

  // Sort state — persisted via SCREEN_KEYS.ADMIN_DEPLOY_BASELINES per D-171.
  sortColumn: SortColumn = 'freeze_date';
  sortDir:    SortDir    = 'desc';   // most recent first by default per spec.

  // Inline create row state.
  creating         = false;
  creatingSaving   = false;
  createDate       = '';
  createLabel      = '';
  createErrorField: 'freeze_date' | 'freeze_label' | null = null;
  createErrorMessage = '';

  readonly skeletonRows = [1, 2, 3];

  private readonly subs = new Subscription();
  private fadeTimers = new Map<string, number>();         // `${freeze_date_id}|${field}`
  private removeTimers = new Map<string, number>();       // freeze_date_id

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly profile:     UserProfileService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(async profile => {
        const isAdmin = profile.is_admin === true;
        if (!isAdmin) {
          this.blockedReason =
            'You need Admin role to manage Deploy Roadmap Baselines. ' +
            'Contact your System Admin if you need access to this screen.';
          this.cdr.markForCheck();
          return;
        }

        const saved = await this.screenState.restore(SCREEN_KEYS.ADMIN_DEPLOY_BASELINES);
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
    this.removeTimers.forEach(t => clearTimeout(t));
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  private loadRows(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.delivery.listRoadmapFreezeDates().subscribe({
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

  private toView(r: RoadmapFreezeDate): BaselineRowView {
    return {
      ...r,
      editing_field:     null,
      edit_value:        '',
      saving_field:      null,
      saved_field:       null,
      error_field:       null,
      error_message:     '',
      remove_confirming: false,
      removing:          false
    };
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  get sortedRows(): BaselineRowView[] {
    const arr = this.rows.slice();
    const col = this.sortColumn;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[col];
      const bv = (b as unknown as Record<string, unknown>)[col];
      if (av == null && bv == null) { return 0; }
      if (av == null) { return 1; }
      if (bv == null) { return -1; }
      if (typeof av === 'string' && typeof bv === 'string') {
        return dir * av.localeCompare(bv);
      }
      return dir * (av < bv ? -1 : av > bv ? 1 : 0);
    });
    return arr;
  }

  onSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDir    = 'asc';
    }
    this.screenState.save(
      SCREEN_KEYS.ADMIN_DEPLOY_BASELINES,
      {},
      { column: this.sortColumn, direction: this.sortDir }
    );
    this.cdr.markForCheck();
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn !== column) { return '↕'; }
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  private isSortColumn(s: string): s is SortColumn {
    return s === 'freeze_date' || s === 'freeze_label'
        || s === 'created_by_display_name' || s === 'created_at';
  }

  // ── Inline create row ─────────────────────────────────────────────────────

  onAddBaselineClick(): void {
    this.creating       = true;
    this.createDate     = '';
    this.createLabel    = '';
    this.createErrorField   = null;
    this.createErrorMessage = '';
    this.cdr.markForCheck();
  }

  onCreateCancel(): void {
    this.creating       = false;
    this.creatingSaving = false;
    this.createDate     = '';
    this.createLabel    = '';
    this.createErrorField   = null;
    this.createErrorMessage = '';
    this.cdr.markForCheck();
  }

  onCreateSave(): void {
    if (this.creatingSaving) { return; }

    const date  = (this.createDate || '').trim();
    const label = (this.createLabel || '').trim();

    if (!date) {
      this.createErrorField   = 'freeze_date';
      this.createErrorMessage = 'Pick a freeze date.';
      this.cdr.markForCheck();
      return;
    }
    if (!label) {
      this.createErrorField   = 'freeze_label';
      this.createErrorMessage = 'Add a label.';
      this.cdr.markForCheck();
      return;
    }
    if (label.length > 100) {
      this.createErrorField   = 'freeze_label';
      this.createErrorMessage = 'Label must be 100 characters or fewer.';
      this.cdr.markForCheck();
      return;
    }

    this.creatingSaving     = true;
    this.createErrorField   = null;
    this.createErrorMessage = '';
    this.cdr.markForCheck();

    this.delivery.createRoadmapFreezeDate({ freeze_date: date, freeze_label: label }).subscribe({
      next: (res) => {
        this.creatingSaving = false;
        if (res.success && res.data) {
          this.rows = [this.toView(res.data), ...this.rows];
          this.onCreateCancel();
        } else {
          const code = (res.data as { code?: string } | undefined)?.code;
          this.createErrorField   = code === 'DUPLICATE_DATE' ? 'freeze_date' : 'freeze_label';
          this.createErrorMessage = res.error ?? 'Could not save. Try again.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.creatingSaving     = false;
        this.createErrorField   = 'freeze_label';
        this.createErrorMessage = err?.error ?? 'Could not save. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Inline edit on existing rows ──────────────────────────────────────────

  onCellClick(row: BaselineRowView, field: EditField): void {
    if (row.saving_field || row.removing) { return; }
    // Close any other open editor on this row.
    this.cancelOtherEdits(row);
    row.editing_field  = field;
    row.edit_value     = field === 'freeze_date' ? row.freeze_date : row.freeze_label;
    row.error_field    = null;
    row.error_message  = '';
    this.cdr.markForCheck();
  }

  private cancelOtherEdits(row: BaselineRowView): void {
    this.rows.forEach(r => {
      if (r !== row && r.editing_field) {
        r.editing_field = null;
        r.edit_value    = '';
      }
    });
  }

  onCellCancel(row: BaselineRowView): void {
    row.editing_field  = null;
    row.edit_value     = '';
    row.error_field    = null;
    row.error_message  = '';
    this.cdr.markForCheck();
  }

  onCellSave(row: BaselineRowView, field: EditField): void {
    if (row.editing_field !== field || row.saving_field === field) { return; }

    const raw     = (row.edit_value || '').trim();
    const current = field === 'freeze_date' ? row.freeze_date : row.freeze_label;

    // No-op: revert without a server round-trip.
    if (raw === current) {
      this.onCellCancel(row);
      return;
    }

    // Local validation (D-200 Pattern 3).
    if (field === 'freeze_date' && !raw) {
      row.error_field   = 'freeze_date';
      row.error_message = 'Pick a freeze date.';
      this.cdr.markForCheck();
      return;
    }
    if (field === 'freeze_label') {
      if (!raw) {
        row.error_field   = 'freeze_label';
        row.error_message = 'Label cannot be empty.';
        this.cdr.markForCheck();
        return;
      }
      if (raw.length > 100) {
        row.error_field   = 'freeze_label';
        row.error_message = 'Label must be 100 characters or fewer.';
        this.cdr.markForCheck();
        return;
      }
    }

    const params: { freeze_date_id: string; freeze_date?: string; freeze_label?: string } = {
      freeze_date_id: row.freeze_date_id
    };
    if (field === 'freeze_date')  { params.freeze_date  = raw; }
    if (field === 'freeze_label') { params.freeze_label = raw; }

    row.saving_field  = field;
    row.saved_field   = null;
    row.error_field   = null;
    row.error_message = '';
    this.cdr.markForCheck();

    this.delivery.updateRoadmapFreezeDate(params).subscribe({
      next: (res) => {
        row.saving_field = null;
        if (res.success && res.data) {
          row.freeze_date             = res.data.freeze_date;
          row.freeze_label            = res.data.freeze_label;
          row.created_at              = res.data.created_at;
          row.created_by_display_name = res.data.created_by_display_name;
          row.editing_field           = null;
          row.edit_value              = '';
          this.flashSavedTick(row, field);
        } else {
          row.error_field   = field;
          row.error_message = res.error ?? 'Could not save. Try again.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        row.saving_field   = null;
        row.error_field    = field;
        row.error_message  = err?.error ?? 'Could not save. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  private flashSavedTick(row: BaselineRowView, field: EditField): void {
    row.saved_field = field;
    const key = `${row.freeze_date_id}|${field}`;
    const prior = this.fadeTimers.get(key);
    if (prior) { clearTimeout(prior); }
    const handle = window.setTimeout(() => {
      row.saved_field = null;
      this.fadeTimers.delete(key);
      this.cdr.markForCheck();
    }, SAVED_TICK_FADE_MS);
    this.fadeTimers.set(key, handle);
  }

  // ── Remove (D-183 two-step + 5s timeout) ──────────────────────────────────

  onRemoveClick(row: BaselineRowView): void {
    if (row.saving_field || row.removing) { return; }
    row.remove_confirming = true;
    this.cdr.markForCheck();

    const prior = this.removeTimers.get(row.freeze_date_id);
    if (prior) { clearTimeout(prior); }
    const handle = window.setTimeout(() => {
      row.remove_confirming = false;
      this.removeTimers.delete(row.freeze_date_id);
      this.cdr.markForCheck();
    }, REMOVE_CONFIRM_WINDOW_MS);
    this.removeTimers.set(row.freeze_date_id, handle);
  }

  onRemoveConfirm(row: BaselineRowView): void {
    if (row.removing) { return; }

    const prior = this.removeTimers.get(row.freeze_date_id);
    if (prior) { clearTimeout(prior); }
    this.removeTimers.delete(row.freeze_date_id);

    row.remove_confirming = false;
    row.removing          = true;
    this.cdr.markForCheck();

    this.delivery.deleteRoadmapFreezeDate({ freeze_date_id: row.freeze_date_id }).subscribe({
      next: (res) => {
        if (res.success) {
          this.rows = this.rows.filter(r => r.freeze_date_id !== row.freeze_date_id);
        } else {
          row.removing      = false;
          row.error_field   = 'freeze_label';
          row.error_message = res.error ?? 'Could not remove. Try again.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        row.removing      = false;
        row.error_field   = 'freeze_label';
        row.error_message = err?.error ?? 'Could not remove. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Formatters + trackBy ─────────────────────────────────────────────────

  formatDate(iso: string): string {
    if (!iso) { return '—'; }
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) { return iso; }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatRelative(iso: string): string {
    if (!iso) { return '—'; }
    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) { return iso; }
    const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
    if (seconds < 60)         { return 'just now'; }
    if (seconds < 3600)       { const m = Math.floor(seconds / 60);    return `${m} min${m === 1 ? '' : 's'} ago`; }
    if (seconds < 86400)      { const h = Math.floor(seconds / 3600);  return `${h} hr${h === 1 ? '' : 's'} ago`; }
    if (seconds < 2592000)    { const d = Math.floor(seconds / 86400); return `${d} day${d === 1 ? '' : 's'} ago`; }
    return this.formatDate(then.toISOString().slice(0, 10));
  }

  formatAbsolute(iso: string): string {
    if (!iso) { return ''; }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) { return iso; }
    return d.toLocaleString();
  }

  trackByRowId(_index: number, row: BaselineRowView): string {
    return row.freeze_date_id ?? NEW_ROW_ID;
  }
}
