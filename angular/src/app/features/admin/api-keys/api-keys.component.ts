// api-keys.component.ts — Admin API Keys screen
// Route: /admin/api-keys  (Phil-only — D-475, Contract 31 WS2).
//
// Issue and manage API keys for executive MCP access to Initiative data via
// initiative-public-mcp (D-473). Standard grid + right panel per S-005/S-018/
// S-019. Create → one-time reveal (the raw key is shown ONCE, D-474). View
// surfaces Setup Instructions (D-180 overlay), Edit, Inactivate (D-183 two-step),
// and Reactivate (single confirm — reversible).
//
// Patterns applied:
//   Arch-1 / D-93 — all DB access via ApiKeyService → division-mcp.
//   D-140         — non-Phil users get a primary + secondary blocked explanation.
//   D-171 / D-380 — status filter + sort persisted via ScreenStateService under
//                   SCREEN_KEYS.ADMIN_API_KEYS (Rule 4 named constant).
//   D-180         — Setup Instructions render as a right-panel overlay.
//   D-183         — Inactivate is a two-step confirm; Reactivate is single.
//   D-200         — Pattern 3 inline errors; Pattern 1 stone guidance.
//   D-346 / S-028 — buttons → present-participle + disabled during MCP calls.
//   S-036         — every grid column sortable; default Created desc.
//
// Source: D-473, D-474, D-475, D-180, D-183, D-200, D-346, S-005, S-018, S-019, S-036, D-171.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  HostListener, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { IonicModule }       from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription, filter, take } from 'rxjs';

import { ApiKeyService }      from '../../../core/services/api-key.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import {
  ScreenStateService, SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import { ApiKey, ApiKeyCreated } from '../../../core/types/database';
import {
  SortState, applySortToggle, sortIndicator, compareString, compareNumber, compareDate
} from '../../../core/utils/sort-state';
import { environment } from '../../../../environments/environment';

// Rule 4 — D-171 screen key declared ONCE as a named constant. Never constructed.
const SCREEN_KEY = SCREEN_KEYS.ADMIN_API_KEYS;

type AkSortColumn = 'display_name' | 'user_label' | 'created_at' | 'last_used_at' | 'status';
const DEFAULT_AK_SORT: SortState<AkSortColumn> = { column: 'created_at', direction: 'desc' };

type StatusFilter = 'active' | 'inactive' | 'all';
type PanelMode = 'view' | 'edit' | 'create' | 'reveal' | null;

@Component({
  selector:        'app-api-keys',
  standalone:      true,
  imports:         [CommonModule, RouterModule, IonicModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ak-shell">

      <a routerLink="/admin" class="ak-back-link">← Administration</a>

      <!-- Blocked state — non-Phil (D-140) -->
      <div *ngIf="blockedReason" class="ak-blocked">
        <div class="ak-blocked-primary">API Key management is restricted.</div>
        <div class="ak-blocked-secondary">{{ blockedReason }}</div>
      </div>

      <ng-container *ngIf="!blockedReason">

        <div class="ak-header">
          <div class="ak-header-row">
            <h3 class="ak-title">API Keys</h3>
            <button type="button" class="ak-add-btn" (click)="openCreate()">+ Add Key</button>
          </div>
          <p class="ak-subtitle">
            Issue and manage API keys for executive MCP access to Initiative data.
            Each key is shown once at creation — copy it before closing.
          </p>
        </div>

        <!-- Status filter (default Active) -->
        <div class="ak-filter-bar">
          <span class="ak-filter-label">Status</span>
          <div class="ak-chip-row">
            <button type="button" class="ak-filter-chip"
                    [class.ak-filter-chip-on]="statusFilter === 'active'"
                    (click)="setStatusFilter('active')">Active</button>
            <button type="button" class="ak-filter-chip"
                    [class.ak-filter-chip-on]="statusFilter === 'inactive'"
                    (click)="setStatusFilter('inactive')">Inactive</button>
            <button type="button" class="ak-filter-chip"
                    [class.ak-filter-chip-on]="statusFilter === 'all'"
                    (click)="setStatusFilter('all')">All</button>
          </div>
        </div>

        <!-- Top-level load error -->
        <div *ngIf="loadError && !loading" class="ak-error">
          <div class="ak-error-primary">API Keys could not load.</div>
          <div class="ak-error-secondary">{{ loadError }}</div>
        </div>

        <div class="ak-grid">
          <div class="ak-row ak-header-grid">
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('display_name')"
                  (click)="onSortColumn('display_name')">Display Name {{ glyph('display_name') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('user_label')"
                  (click)="onSortColumn('user_label')">User Label {{ glyph('user_label') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('created_at')"
                  (click)="onSortColumn('created_at')">Created {{ glyph('created_at') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('last_used_at')"
                  (click)="onSortColumn('last_used_at')">Last Used {{ glyph('last_used_at') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('status')"
                  (click)="onSortColumn('status')">Status {{ glyph('status') }}</span>
          </div>

          <ng-container *ngIf="loading && rows.length === 0">
            <div class="ak-row" *ngFor="let _ of skeletonRows">
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
            </div>
          </ng-container>

          <div *ngIf="!loading && !loadError && rows.length === 0" class="ak-empty">
            No API keys yet. Click “+ Add Key” to issue one for an executive’s
            Claude Desktop.
          </div>

          <div *ngIf="!loading && !loadError && rows.length > 0 && filteredSortedRows.length === 0"
               class="ak-empty">
            No API keys match the current status filter.
          </div>

          <div class="ak-row ak-data"
               *ngFor="let row of filteredSortedRows"
               [class.ak-selected]="selectedId === row.key_id"
               (click)="openView(row)">
            <span class="ak-cell">{{ row.display_name }}</span>
            <span class="ak-cell">{{ row.user_label }}</span>
            <span class="ak-cell ak-muted">{{ formatDate(row.created_at) }}</span>
            <span class="ak-cell ak-muted">{{ formatLastUsed(row.last_used_at) }}</span>
            <span class="ak-cell">
              <span class="ak-pill" [class.ak-pill-active]="row.is_active"
                    [class.ak-pill-inactive]="!row.is_active">
                {{ row.is_active ? 'Active' : 'Inactive' }}
              </span>
            </span>
          </div>
        </div>

        <!-- Right panel — scrim is modal for Create / Edit / Reveal (S-017) -->
        <div class="oi-scrim oi-scrim-detail"
             *ngIf="panelMode === 'edit' || panelMode === 'create' || panelMode === 'reveal'"
             (click)="onScrimClick()"></div>
        <div class="oi-side-panel oi-side-detail" *ngIf="panelMode" role="dialog" aria-modal="true">

          <div class="oi-side-head">
            <strong>{{ panelTitle }}</strong>
            <!-- No × on the one-time reveal — user must click Done (D-474). -->
            <button *ngIf="panelMode !== 'reveal'" class="oi-close-btn"
                    (click)="closePanel()" aria-label="Close">✕</button>
          </div>

          <div class="oi-side-body">

            <!-- View -->
            <ng-container *ngIf="panelMode === 'view' && selectedRow">
              <dl class="ak-dl">
                <dt>Display Name</dt> <dd>{{ selectedRow.display_name }}</dd>
                <dt>User Label</dt>   <dd>{{ selectedRow.user_label }}</dd>
                <dt>Scope</dt>        <dd>All Divisions</dd>
                <dt>Status</dt>
                <dd>
                  <span class="ak-pill" [class.ak-pill-active]="selectedRow.is_active"
                        [class.ak-pill-inactive]="!selectedRow.is_active">
                    {{ selectedRow.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </dd>
                <dt>Created</dt>    <dd>{{ formatDate(selectedRow.created_at) }}</dd>
                <dt>Last Used</dt>  <dd>{{ formatLastUsed(selectedRow.last_used_at) }}</dd>
                <dt>Created By</dt> <dd>{{ selectedRow.created_by_name || '—' }}</dd>
              </dl>

              <!-- Inactivate two-step inline confirm (D-183) -->
              <div *ngIf="inactivateConfirm" class="ak-confirm">
                Inactivate {{ selectedRow.display_name }}? The key will stop working
                immediately.
                <div class="ak-confirm-actions">
                  <button type="button" class="oi-btn-primary ak-confirm-sm"
                          [disabled]="mutating" (click)="confirmInactivate()">
                    {{ mutating ? 'Inactivating…' : 'Inactivate' }}
                  </button>
                  <button type="button" class="oi-btn-secondary ak-confirm-sm"
                          [disabled]="mutating" (click)="inactivateConfirm = false">Cancel</button>
                </div>
              </div>

              <!-- Reactivate single confirm (D-183 — reversible, low risk) -->
              <div *ngIf="reactivateConfirm" class="ak-confirm">
                Reactivate {{ selectedRow.display_name }}?
                <div class="ak-confirm-actions">
                  <button type="button" class="oi-btn-primary ak-confirm-sm"
                          [disabled]="mutating" (click)="confirmReactivate()">
                    {{ mutating ? 'Reactivating…' : 'Reactivate' }}
                  </button>
                  <button type="button" class="oi-btn-secondary ak-confirm-sm"
                          [disabled]="mutating" (click)="reactivateConfirm = false">Cancel</button>
                </div>
              </div>

              <div *ngIf="mutateError" class="ak-field-error">{{ mutateError }}</div>
            </ng-container>

            <!-- Create / Edit form -->
            <ng-container *ngIf="panelMode === 'create' || panelMode === 'edit'">
              <form [formGroup]="form" novalidate class="ak-form">

                <label class="ak-label">Display Name</label>
                <input type="text" formControlName="display_name" class="ak-input"
                       maxlength="100" placeholder="e.g. Sabrina Chen — Initiative read access">

                <label class="ak-label">User Label</label>
                <input type="text" formControlName="user_label" class="ak-input"
                       maxlength="100" placeholder="e.g. Sabrina Chen">

                <label class="ak-label">Scope</label>
                <div class="ak-scope">
                  <label class="ak-radio">
                    <input type="radio" name="scope" [checked]="true" disabled>
                    All Divisions
                  </label>
                  <label class="ak-radio ak-radio-disabled">
                    <input type="radio" name="scope" disabled>
                    Specific Divisions <span class="ak-coming-soon">Coming soon</span>
                  </label>
                </div>

                <div *ngIf="saveError" class="ak-field-error">{{ saveError }}</div>
              </form>
            </ng-container>

            <!-- One-Time Reveal (D-474) -->
            <ng-container *ngIf="panelMode === 'reveal' && revealData">
              <div class="ak-reveal-banner">
                This key will not be shown again. Copy it now before closing.
              </div>
              <label class="ak-label">API Key for {{ revealData.display_name }}</label>
              <div class="ak-reveal-row">
                <input #revealInput type="text" class="ak-input ak-mono" readonly
                       [value]="revealData.raw_key">
                <button type="button" class="oi-btn-secondary ak-copy-btn"
                        (click)="copy(revealData.raw_key, 'reveal')">
                  {{ copiedTarget === 'reveal' ? 'Copied ✓' : 'Copy' }}
                </button>
              </div>
            </ng-container>

          </div>

          <!-- Footers -->
          <div class="oi-side-foot" *ngIf="panelMode === 'view' && selectedRow">
            <button class="oi-btn-secondary" (click)="openSetup()">Setup Instructions</button>
            <button class="oi-btn-secondary" (click)="openEdit()">Edit</button>
            <button *ngIf="selectedRow.is_active" class="oi-btn-danger"
                    (click)="askInactivate()">Inactivate</button>
            <button *ngIf="!selectedRow.is_active" class="oi-btn-primary"
                    (click)="askReactivate()">Reactivate</button>
          </div>

          <div class="oi-side-foot" *ngIf="panelMode === 'create' || panelMode === 'edit'">
            <button class="oi-btn-secondary" (click)="closePanel()">Cancel</button>
            <button class="oi-btn-primary" [disabled]="form.invalid || saving" (click)="save()">
              {{ saving ? (panelMode === 'create' ? 'Creating…' : 'Saving…') : 'Save' }}
            </button>
          </div>

          <div class="oi-side-foot" *ngIf="panelMode === 'reveal'">
            <button class="oi-btn-primary" (click)="dismissReveal()">Done</button>
          </div>
        </div>

        <!-- Setup Instructions overlay (D-180) -->
        <div class="oi-scrim oi-scrim-detail" *ngIf="setupOpen" (click)="closeSetup()"></div>
        <div class="oi-side-panel oi-side-detail" *ngIf="setupOpen && selectedRow"
             role="dialog" aria-modal="true">
          <div class="oi-side-head">
            <strong>MCP Setup Instructions — {{ selectedRow.display_name }}</strong>
            <button class="oi-close-btn" (click)="closeSetup()" aria-label="Close">✕</button>
          </div>
          <div class="oi-side-body">
            <p class="ak-setup-intro">
              Send these instructions to {{ selectedRow.user_label }} to connect OI
              Trust to their Claude Desktop.
            </p>
            <textarea class="ak-input ak-mono ak-setup-text" readonly rows="20"
                      [value]="setupInstructionsText"></textarea>
          </div>
          <div class="oi-side-foot">
            <button class="oi-btn-secondary" (click)="closeSetup()">Close</button>
            <button class="oi-btn-primary" (click)="copy(setupInstructionsText, 'setup')">
              {{ copiedTarget === 'setup' ? 'Copied ✓' : 'Copy instructions' }}
            </button>
          </div>
        </div>

        <!-- Snackbar -->
        <div *ngIf="snackbar" class="ak-snackbar">{{ snackbar }}</div>

      </ng-container>
    </div>
  `,
  styles: [`
    .ak-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .ak-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .ak-header { margin: 8px 0 var(--triarq-space-md); }
    .ak-header-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); }
    .ak-title { margin: 0; }
    .ak-add-btn { background: var(--triarq-color-primary); color: #fff; border: none; border-radius: 5px; padding: 8px 16px; font-size: var(--triarq-text-small); cursor: pointer; }
    .ak-add-btn:hover { background: #1d5878; }
    .ak-subtitle { margin: 4px 0 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .ak-filter-bar { display: flex; align-items: center; gap: var(--triarq-space-md); padding: var(--triarq-space-sm) 0 var(--triarq-space-md); border-bottom: 1px solid var(--triarq-color-border); margin-bottom: var(--triarq-space-md); }
    .ak-filter-label { font-size: 11px; color: #5A5A5A; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
    .ak-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .ak-filter-chip { background: #fff; border: 1px solid var(--triarq-color-border); border-radius: 999px; padding: 4px 12px; font-size: 12px; color: #5A5A5A; cursor: pointer; }
    .ak-filter-chip:hover, .ak-filter-chip-on { border-color: var(--triarq-color-primary); }
    .ak-filter-chip-on { background: rgba(37,112,153,0.10); color: var(--triarq-color-primary); }
    .ak-grid { border: 1px solid var(--triarq-color-border); border-radius: 10px; background: #fff; overflow: hidden; }
    .ak-row { display: grid; grid-template-columns: 1.8fr 1.4fr 1.2fr 1.2fr 0.9fr; gap: var(--triarq-space-sm); padding: 8px var(--triarq-space-md); border-bottom: 1px solid #E8E8E8; align-items: center; font-size: 13px; }
    .ak-header-grid { background: #12274A; color: #fff; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; font-size: 12px; }
    .ak-data { cursor: pointer; }
    .ak-data:hover { background: #F0F4F8; }
    .ak-selected { background: #E8F0FE; }
    .ak-cell { color: #1E1E1E; overflow: hidden; text-overflow: ellipsis; }
    .ak-muted { color: #5A5A5A; }
    .ak-empty { padding: var(--triarq-space-xl); text-align: center; color: #5A5A5A; font-size: 13px; }
    .ak-pill { display: inline-block; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 500; }
    .ak-pill-active { background: rgba(46,125,50,0.12); color: #2e7d32; }
    .ak-pill-inactive { background: rgba(90,90,90,0.12); color: #5A5A5A; }
    .ak-blocked { max-width: 560px; margin-top: var(--triarq-space-md); padding: var(--triarq-space-md); background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray); border-radius: 5px; }
    .ak-error { padding: var(--triarq-space-md); max-width: 560px; }
    .ak-blocked-primary, .ak-error-primary { font-weight: 500; margin-bottom: 4px; }
    .ak-blocked-primary { color: var(--triarq-color-text-primary); }
    .ak-error-primary { color: var(--triarq-color-error); }
    .ak-blocked-secondary, .ak-error-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
    .ak-dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; font-size: 13px; }
    .ak-dl dt { color: #5A5A5A; }
    .ak-dl dd { margin: 0; color: #1E1E1E; }
    .ak-form { display: flex; flex-direction: column; gap: 8px; }
    .ak-label { font-size: 12px; color: #5A5A5A; font-weight: 500; }
    .ak-input { padding: 8px 12px; border: 1px solid #D6D6D6; border-radius: 5px; font-size: 13px; background: #fff; width: 100%; box-sizing: border-box; }
    .ak-input:focus { outline: none; border-color: var(--triarq-color-primary); }
    .ak-mono { font-family: 'Roboto Mono', ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
    .ak-scope { display: flex; flex-direction: column; gap: 6px; }
    .ak-radio { font-size: 13px; color: #1E1E1E; display: flex; align-items: center; gap: 6px; }
    .ak-radio-disabled { color: #9E9E9E; }
    .ak-coming-soon { font-style: italic; color: #9E9E9E; font-size: 12px; }
    .ak-field-error { font-size: 12px; color: var(--triarq-color-error); margin-top: 4px; }
    .ak-confirm { margin-top: var(--triarq-space-md); font-size: 12px; color: #1E1E1E; background: rgba(245,166,35,0.10); border-left: 3px solid var(--triarq-color-sunray); border-radius: 5px; padding: 10px 12px; }
    .ak-confirm-actions { display: flex; gap: 8px; margin-top: 8px; }
    .ak-confirm-sm { padding: 4px 14px !important; font-size: 12px !important; }
    .ak-reveal-banner { background: var(--triarq-color-oravive, #E96127); color: #fff; border-radius: 5px; padding: 10px 12px; font-size: 13px; font-weight: 500; margin-bottom: var(--triarq-space-md); }
    .ak-reveal-row { display: flex; align-items: center; gap: 8px; }
    .ak-copy-btn { padding: 6px 14px !important; font-size: 12px !important; white-space: nowrap; }
    .ak-setup-intro { font-size: 11px; font-style: italic; color: #5A5A5A; margin: 0 0 var(--triarq-space-sm); }
    .ak-setup-text { resize: vertical; line-height: 1.5; }
    .oi-btn-danger { background: var(--triarq-color-oravive, #E96127); color: #fff; border: none; border-radius: 5px; padding: 8px 16px; font-size: var(--triarq-text-small); cursor: pointer; }
    .oi-btn-danger:hover { filter: brightness(0.95); }
    .ak-snackbar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #12274A; color: #fff; padding: 10px 18px; border-radius: 6px; font-size: 13px; box-shadow: 0 2px 12px rgba(0,0,0,0.25); z-index: 10000; }
  `]
})
export class ApiKeysComponent implements OnInit, OnDestroy {

  loading       = false;
  loadError     = '';
  blockedReason = '';

  rows: ApiKey[] = [];

  statusFilter: StatusFilter = 'active';
  sortState: SortState<AkSortColumn> = { ...DEFAULT_AK_SORT };

  // Right panel.
  panelMode:   PanelMode = null;
  selectedId:  string | null = null;
  selectedRow: ApiKey | null = null;
  form:        FormGroup;
  saving       = false;
  saveError    = '';

  // One-time reveal.
  revealData: ApiKeyCreated | null = null;

  // Setup Instructions overlay (D-180).
  setupOpen = false;

  // Inactivate / reactivate.
  inactivateConfirm = false;
  reactivateConfirm = false;
  mutating          = false;
  mutateError       = '';

  // Copy feedback + snackbar.
  copiedTarget: 'reveal' | 'setup' | null = null;
  snackbar = '';

  readonly skeletonRows = [1, 2, 3, 4];

  private readonly subs = new Subscription();
  private copyTimer:  ReturnType<typeof setTimeout> | null = null;
  private snackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly apiKeys:     ApiKeyService,
    private readonly profile:     UserProfileService,
    private readonly screenState: ScreenStateService,
    private readonly fb:          FormBuilder,
    private readonly cdr:         ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      display_name: ['', [Validators.required, Validators.maxLength(100)]],
      user_label:   ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(async profile => {
        // D-475 — Phil-only (is_super_admin single-user flag, CC-19-06).
        if (profile.is_super_admin !== true) {
          this.blockedReason =
            'Only Phil can issue and manage API keys. ' +
            'Contact Phil if an executive needs MCP access to Initiative data.';
          this.cdr.markForCheck();
          return;
        }

        const saved = await this.screenState.restore(SCREEN_KEY);
        if (saved?.filter_state) {
          const sf = saved.filter_state['status'];
          if (sf === 'active' || sf === 'inactive' || sf === 'all') { this.statusFilter = sf; }
        }
        if (saved?.sort_state) {
          const col = saved.sort_state['column'];
          const dir = saved.sort_state['direction'];
          if (typeof col === 'string' && this.isSortColumn(col)) { this.sortState.column = col; }
          if (dir === 'asc' || dir === 'desc') { this.sortState.direction = dir; }
        }

        this.loadRows();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.copyTimer)  { clearTimeout(this.copyTimer); }
    if (this.snackTimer) { clearTimeout(this.snackTimer); }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.setupOpen)            { this.closeSetup(); return; }
    if (this.panelMode === 'reveal') { return; }   // reveal requires explicit Done
    if (this.panelMode)            { this.closePanel(); }
  }

  // ── Load ────────────────────────────────────────────────────────────────────

  private loadRows(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.apiKeys.listApiKeys().subscribe({
      next: res => {
        if (res.success && Array.isArray(res.data)) {
          this.rows = res.data;
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

  // ── Filter + sort (D-171 / S-036) ─────────────────────────────────────────────

  setStatusFilter(value: StatusFilter): void {
    this.statusFilter = value;
    this.persistState();
    this.cdr.markForCheck();
  }

  onSortColumn(column: AkSortColumn): void {
    this.sortState = applySortToggle(this.sortState, column);
    this.persistState();
    this.cdr.markForCheck();
  }
  isSorted(column: AkSortColumn): boolean { return this.sortState.column === column; }
  glyph(column: AkSortColumn): '↑' | '↓' | '' { return sortIndicator(this.sortState, column); }

  get filteredSortedRows(): ApiKey[] {
    const filtered = this.rows.filter(r =>
      this.statusFilter === 'all' ||
      (this.statusFilter === 'active'   && r.is_active) ||
      (this.statusFilter === 'inactive' && !r.is_active)
    );
    const { column, direction } = this.sortState;
    return filtered.sort((a, b) => {
      switch (column) {
        case 'display_name': return compareString(a.display_name, b.display_name, direction);
        case 'user_label':   return compareString(a.user_label, b.user_label, direction);
        case 'created_at':   return compareDate(a.created_at, b.created_at, direction);
        case 'last_used_at': return compareDate(a.last_used_at, b.last_used_at, direction);
        case 'status':       return compareNumber(a.is_active ? 1 : 0, b.is_active ? 1 : 0, direction);
      }
    });
  }

  private persistState(): void {
    this.screenState.save(
      SCREEN_KEY,
      { status: this.statusFilter },
      { column: this.sortState.column, direction: this.sortState.direction }
    );
  }

  // ── Panel ──────────────────────────────────────────────────────────────────

  get panelTitle(): string {
    switch (this.panelMode) {
      case 'create': return 'Add API Key';
      case 'edit':   return 'Edit API Key';
      case 'reveal': return 'API Key Created';
      default:       return 'API Key';
    }
  }

  openView(row: ApiKey): void {
    this.selectedId  = row.key_id;
    this.selectedRow = row;
    this.panelMode   = 'view';
    this.resetConfirms();
    this.cdr.markForCheck();
  }

  openCreate(): void {
    this.selectedId  = null;
    this.selectedRow = null;
    this.saveError   = '';
    this.form.reset({ display_name: '', user_label: '' });
    this.panelMode = 'create';
    this.cdr.markForCheck();
  }

  openEdit(): void {
    if (!this.selectedRow) { return; }
    this.saveError = '';
    this.form.reset({
      display_name: this.selectedRow.display_name,
      user_label:   this.selectedRow.user_label
    });
    this.panelMode = 'edit';
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode   = null;
    this.selectedId  = null;
    this.selectedRow = null;
    this.revealData  = null;
    this.saveError   = '';
    this.resetConfirms();
    this.cdr.markForCheck();
  }

  onScrimClick(): void {
    if (this.panelMode === 'reveal') { return; }   // no dismiss-by-scrim on reveal
    if (this.form.dirty && (this.panelMode === 'create' || this.panelMode === 'edit')
        && !window.confirm('Discard unsaved changes?')) { return; }
    this.closePanel();
  }

  private resetConfirms(): void {
    this.inactivateConfirm = false;
    this.reactivateConfirm = false;
    this.mutateError       = '';
  }

  // ── Save (Create + Edit) ──────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) { return; }
    const { display_name, user_label } = this.form.getRawValue();

    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    if (this.panelMode === 'create') {
      this.apiKeys.createApiKey(display_name.trim(), user_label.trim()).subscribe({
        next: res => {
          this.saving = false;
          if (res.success && res.data) {
            this.revealData = res.data;
            this.panelMode  = 'reveal';   // show the raw key once
          } else {
            this.saveError = res.error ?? 'Could not create the API key.';
          }
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.saving    = false;
          this.saveError = err?.error ?? 'Could not create the API key.';
          this.cdr.markForCheck();
        }
      });
      return;
    }

    // Edit
    if (!this.selectedId) { this.saving = false; return; }
    this.apiKeys.updateApiKey(this.selectedId, {
      display_name: display_name.trim(),
      user_label:   user_label.trim()
    }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.selectedRow = res.data;
          this.panelMode   = 'view';
          this.showSnackbar('Key updated.');
          this.loadRows();                // S-008 parent refresh
        } else {
          this.saveError = res.error ?? 'Could not update the API key.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.saving    = false;
        this.saveError = err?.error ?? 'Could not update the API key.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── One-time reveal ───────────────────────────────────────────────────────────

  dismissReveal(): void {
    const newId = this.revealData?.key_id ?? null;
    this.revealData = null;
    this.loadRows();                       // grid refresh
    if (newId) {
      // Navigate to View for the new key (S-018). Fetch the persisted shape.
      this.apiKeys.getApiKey(newId).subscribe({
        next: res => {
          if (res.success && res.data) { this.openView(res.data); }
          else { this.closePanel(); }
          this.cdr.markForCheck();
        },
        error: () => { this.closePanel(); this.cdr.markForCheck(); }
      });
    } else {
      this.closePanel();
    }
  }

  // ── Inactivate (D-183 two-step) / Reactivate (single) ──────────────────────────

  askInactivate(): void { this.inactivateConfirm = true; this.reactivateConfirm = false; this.cdr.markForCheck(); }
  askReactivate(): void { this.reactivateConfirm = true; this.inactivateConfirm = false; this.cdr.markForCheck(); }

  confirmInactivate(): void {
    if (!this.selectedId) { return; }
    this.mutating = true; this.mutateError = ''; this.cdr.markForCheck();
    this.apiKeys.inactivateApiKey(this.selectedId).subscribe({
      next: res => {
        this.mutating = false;
        if (res.success) {
          this.inactivateConfirm = false;
          if (this.selectedRow) { this.selectedRow = { ...this.selectedRow, is_active: false, revoked_at: res.data?.revoked_at ?? new Date().toISOString() }; }
          this.showSnackbar('Key inactivated.');
          this.loadRows();
        } else {
          this.mutateError = res.error ?? 'Could not inactivate the key.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.mutating = false;
        this.mutateError = err?.error ?? 'Could not inactivate the key.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmReactivate(): void {
    if (!this.selectedId) { return; }
    this.mutating = true; this.mutateError = ''; this.cdr.markForCheck();
    this.apiKeys.reactivateApiKey(this.selectedId).subscribe({
      next: res => {
        this.mutating = false;
        if (res.success) {
          this.reactivateConfirm = false;
          if (this.selectedRow) { this.selectedRow = { ...this.selectedRow, is_active: true, revoked_at: null }; }
          this.showSnackbar('Key reactivated.');
          this.loadRows();
        } else {
          this.mutateError = res.error ?? 'Could not reactivate the key.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.mutating = false;
        this.mutateError = err?.error ?? 'Could not reactivate the key.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Setup Instructions (D-180 overlay) ──────────────────────────────────────────

  openSetup(): void { this.setupOpen = true; this.cdr.markForCheck(); }
  closeSetup(): void { this.setupOpen = false; this.cdr.markForCheck(); }

  get setupInstructionsText(): string {
    const base = environment.initiativeMcpBaseUrl;
    return [
      'To connect OI Trust to Claude Desktop:',
      '',
      '1. Open your Claude Desktop configuration file (claude_desktop_config.json).',
      '',
      '2. Add the following entry under "mcpServers":',
      '',
      '{',
      '  "oi-trust": {',
      '    "command": "npx",',
      '    "args": [',
      '      "-y",',
      '      "mcp-remote",',
      `      "${base}/mcp",`,
      '      "--header",',
      '      "Authorization: Bearer oitrust_XXXXX"',
      '    ]',
      '  }',
      '}',
      '',
      '3. Replace oitrust_XXXXX with the API key you received when your',
      '   access was created. If you no longer have your key, contact an',
      '   Admin to issue a new one.',
      '',
      '4. Restart Claude Desktop. You can now ask Claude about OI Trust',
      '   Initiatives directly.'
    ].join('\n');
  }

  // ── Clipboard + snackbar ─────────────────────────────────────────────────────

  copy(text: string, target: 'reveal' | 'setup'): void {
    const done = () => {
      this.copiedTarget = target;
      this.cdr.markForCheck();
      if (this.copyTimer) { clearTimeout(this.copyTimer); }
      this.copyTimer = setTimeout(() => { this.copiedTarget = null; this.cdr.markForCheck(); }, 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  }

  private fallbackCopy(text: string, done: () => void): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* no-op */ }
    document.body.removeChild(ta);
    done();
  }

  private showSnackbar(msg: string): void {
    this.snackbar = msg;
    this.cdr.markForCheck();
    if (this.snackTimer) { clearTimeout(this.snackTimer); }
    this.snackTimer = setTimeout(() => { this.snackbar = ''; this.cdr.markForCheck(); }, 3000);
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────────

  formatDate(iso: string | null): string {
    if (!iso) { return '—'; }
    return new Date(iso).toLocaleDateString();
  }

  formatLastUsed(iso: string | null): string {
    if (!iso) { return 'Never used'; }
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const day = 86400000;
    if (diffMs < 0)        { return 'Just now'; }
    if (diffMs < 3600000)  { const m = Math.floor(diffMs / 60000); return m <= 1 ? 'Just now' : `${m} minutes ago`; }
    if (diffMs < day)      { const h = Math.floor(diffMs / 3600000); return h === 1 ? '1 hour ago' : `${h} hours ago`; }
    if (diffMs < day * 30) { const d = Math.floor(diffMs / day); return d === 1 ? '1 day ago' : `${d} days ago`; }
    return new Date(iso).toLocaleDateString();
  }

  private isSortColumn(value: string): value is AkSortColumn {
    return ['display_name', 'user_label', 'created_at', 'last_used_at', 'status'].includes(value);
  }
}
