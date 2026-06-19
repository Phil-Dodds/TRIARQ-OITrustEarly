// gate-approvers.component.ts — Admin Gate Approvers screen
// Route: /admin/gate-approvers  (Phil-only — D-464, Contract 29 WS3).
//
// Assigns the Accountable approver for each gate per Division. Standard grid +
// right panel per S-005, S-018, S-019. Create / View / Edit via the right-panel
// slot (S-016). Delete is a D-183 two-step inline confirmation.
//
// Patterns applied:
//   Arch-1 / D-93 — all DB access via DeliveryService → MCP (configs) and the
//                   division MCP (active Divisions for the Create picker), same
//                   pattern the Divisions screen + UserPicker already use.
//   D-140         — blocked-action UX: non-Phil users get a primary + secondary
//                   explanation, never a raw error.
//   D-171 / D-380 — filter + sort state persisted via ScreenStateService under
//                   the named constant SCREEN_KEYS.ADMIN_GATE_APPROVERS (Rule 4).
//   D-181         — tappable row opens the right View panel.
//   D-182         — Assigned Approver via the shared UserPicker.
//   D-183         — Delete is a two-step inline confirmation.
//   D-200         — Pattern 3 inline field error (duplicate Division+Gate) shown
//                   BEFORE the MCP call, checked client-side against loaded rows.
//   S-036         — every grid column sortable; default Division asc.
//
// Source: D-464, S-005, S-016, S-018, S-019, S-036, D-140, D-171, D-181, D-182, D-183, D-200.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  HostListener, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { IonicModule }       from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription, filter, take } from 'rxjs';

import { DeliveryService }   from '../../../core/services/delivery.service';
import { McpService }        from '../../../core/services/mcp.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import {
  ScreenStateService, SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import {
  GateApproverConfigRow, GateName, Division, User
} from '../../../core/types/database';
import {
  SortState, applySortToggle, sortIndicator, compareString, compareNumber, compareDate
} from '../../../core/utils/sort-state';
import { UserPickerComponent } from '../../../shared/pickers/user-picker/user-picker.component';
import { SYSTEM_ROLES } from '../../../core/constants/roles';

// Rule 4 — D-171 screen key declared ONCE as a named constant. Never constructed.
const SCREEN_KEY = SCREEN_KEYS.ADMIN_GATE_APPROVERS;

type GaSortColumn = 'division' | 'gate' | 'approver' | 'updated_at';

const DEFAULT_GA_SORT: SortState<GaSortColumn> = { column: 'division', direction: 'asc' };

// Five gates in lifecycle order — values are the GateName enum.
const GATE_OPTIONS: { value: GateName; label: string }[] = [
  { value: 'brief_review',  label: 'Brief Review' },
  { value: 'go_to_build',   label: 'Go to Build' },
  { value: 'go_to_deploy',  label: 'Go to Deploy' },
  { value: 'go_to_release', label: 'Go to Release' },
  { value: 'close_review',  label: 'Close Review' }
];
const GATE_SEQUENCE: Record<string, number> = {
  brief_review: 1, go_to_build: 2, go_to_deploy: 3, go_to_release: 4, close_review: 5
};
const GATE_DISPLAY: Record<string, string> = {
  brief_review: 'Brief Review', go_to_build: 'Go to Build', go_to_deploy: 'Go to Deploy',
  go_to_release: 'Go to Release', close_review: 'Close Review'
};

type PanelMode = 'view' | 'edit' | 'create' | null;

@Component({
  selector:        'app-gate-approvers',
  standalone:      true,
  imports:         [CommonModule, RouterModule, IonicModule, ReactiveFormsModule, UserPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ga-shell">

      <a routerLink="/admin" class="ga-back-link">← Administration</a>

      <!-- Blocked state — non-Phil (D-140) -->
      <div *ngIf="blockedReason" class="ga-blocked">
        <div class="ga-blocked-primary">Gate Approvers configuration is restricted.</div>
        <div class="ga-blocked-secondary">{{ blockedReason }}</div>
      </div>

      <ng-container *ngIf="!blockedReason">

        <div class="ga-header">
          <div class="ga-header-row">
            <h3 class="ga-title">Gate Approvers</h3>
            <button type="button" class="ga-add-btn" (click)="openCreate()">+ Add</button>
          </div>
          <p class="ga-subtitle">
            Assign the Accountable approver for each gate per Division. When no
            approver is configured for a Division and gate, the system escalates
            to the Division Owner or Phil.
          </p>
        </div>

        <!-- Filter bar -->
        <div class="ga-filter-bar">
          <div class="ga-filter-group">
            <span class="ga-filter-label">Division</span>
            <div class="ga-chip-row">
              <button type="button"
                      *ngFor="let d of divisionFilterOptions"
                      class="ga-filter-chip"
                      [class.ga-filter-chip-on]="divisionFilter.includes(d.id)"
                      (click)="toggleDivisionFilter(d.id)">
                {{ d.label }}
              </button>
              <span *ngIf="divisionFilterOptions.length === 0" class="ga-filter-empty">—</span>
            </div>
          </div>
          <div class="ga-filter-group">
            <span class="ga-filter-label">Gate</span>
            <div class="ga-chip-row">
              <button type="button"
                      *ngFor="let g of gateOptions"
                      class="ga-filter-chip"
                      [class.ga-filter-chip-on]="gateFilter.includes(g.value)"
                      (click)="toggleGateFilter(g.value)">
                {{ g.label }}
              </button>
            </div>
          </div>
          <button type="button"
                  *ngIf="divisionFilter.length || gateFilter.length"
                  class="ga-filter-clear"
                  (click)="clearFilters()">
            Clear filters
          </button>
        </div>

        <!-- Top-level load error -->
        <div *ngIf="loadError && !loading" class="ga-error">
          <div class="ga-error-primary">Gate Approvers could not load.</div>
          <div class="ga-error-secondary">{{ loadError }}</div>
        </div>

        <div class="ga-grid">
          <div class="ga-row ga-header-grid">
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('division')"
                  (click)="onSortColumn('division')">Division {{ glyph('division') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('gate')"
                  (click)="onSortColumn('gate')">Gate {{ glyph('gate') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('approver')"
                  (click)="onSortColumn('approver')">Assigned Approver {{ glyph('approver') }}</span>
            <span class="oi-sort-th" [class.oi-sort-active]="isSorted('updated_at')"
                  (click)="onSortColumn('updated_at')">Last Updated {{ glyph('updated_at') }}</span>
            <span><!-- action column --></span>
          </div>

          <ng-container *ngIf="loading && rows.length === 0">
            <div class="ga-row" *ngFor="let _ of skeletonRows">
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
              <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
            </div>
          </ng-container>

          <!-- Empty state -->
          <div *ngIf="!loading && !loadError && rows.length === 0" class="ga-empty">
            No gate approvers configured. Add a row to assign an approver for a
            Division and gate.
          </div>

          <!-- No-match-after-filter state -->
          <div *ngIf="!loading && !loadError && rows.length > 0 && filteredSortedRows.length === 0"
               class="ga-empty">
            No gate approvers match the current filters.
          </div>

          <div class="ga-row ga-data"
               *ngFor="let row of filteredSortedRows"
               [class.ga-selected]="selectedId === row.id"
               (click)="openView(row)">
            <span class="ga-cell">{{ row.division_display_name_short || row.division_name }}</span>
            <span class="ga-cell">{{ gateLabel(row.gate_name) }}</span>
            <span class="ga-cell">{{ row.approver_display_name }}</span>
            <span class="ga-cell ga-muted">{{ row.updated_at ? formatUpdated(row) : '—' }}</span>
            <span class="ga-action-cell" (click)="$event.stopPropagation()">
              <a *ngIf="deleteConfirmId !== row.id"
                 class="ga-delete-link"
                 (click)="onDeleteClick(row)">Remove</a>
              <span *ngIf="deleteConfirmId === row.id" class="ga-row-confirm">
                Remove {{ row.division_display_name_short || row.division_name }} —
                {{ gateLabel(row.gate_name) }} approver assignment? The system will
                escalate to Division Owner or Phil.
                <button type="button" class="oi-btn-primary ga-confirm-sm"
                        [disabled]="deleting"
                        (click)="onDeleteConfirm(row)">
                  {{ deleting ? 'Removing…' : 'Confirm' }}
                </button>
                <button type="button" class="oi-btn-secondary ga-confirm-sm"
                        [disabled]="deleting"
                        (click)="onDeleteCancel()">Cancel</button>
              </span>
            </span>
          </div>
        </div>

        <!-- Right panel (S-016 Create / S-018 View / S-019 Edit) -->
        <div class="oi-scrim oi-scrim-detail"
             *ngIf="panelMode === 'edit' || panelMode === 'create'"
             (click)="onScrimClick()"></div>
        <div class="oi-side-panel oi-side-detail" *ngIf="panelMode" role="dialog" aria-modal="true">
          <div class="oi-side-head">
            <strong>{{ panelTitle }}</strong>
            <button class="oi-close-btn" (click)="closePanel()" aria-label="Close">✕</button>
          </div>

          <div class="oi-side-body">

            <!-- View -->
            <ng-container *ngIf="panelMode === 'view' && selectedRow">
              <dl class="ga-dl">
                <dt>Division</dt>          <dd>{{ selectedRow.division_name }}</dd>
                <dt>Gate</dt>              <dd>{{ gateLabel(selectedRow.gate_name) }}</dd>
                <dt>Assigned Approver</dt> <dd>{{ selectedRow.approver_display_name }}</dd>
                <dt>Last Updated</dt>      <dd>{{ selectedRow.updated_at ? formatUpdated(selectedRow) : '—' }}</dd>
              </dl>
            </ng-container>

            <!-- Create / Edit form -->
            <ng-container *ngIf="panelMode === 'create' || panelMode === 'edit'">
              <form [formGroup]="form" novalidate class="ga-form">

                <label class="ga-label">Division</label>
                <select formControlName="division_id" class="ga-input"
                        [class.ga-input-error]="dupError">
                  <option [ngValue]="null">— Select a Division —</option>
                  <option *ngFor="let d of activeDivisions" [ngValue]="d.id">
                    {{ d.division_name }}
                  </option>
                </select>

                <label class="ga-label">Gate</label>
                <select formControlName="gate_name" class="ga-input"
                        [class.ga-input-error]="dupError">
                  <option [ngValue]="null">— Select a gate —</option>
                  <option *ngFor="let g of gateOptions" [value]="g.value">{{ g.label }}</option>
                </select>

                <!-- D-200 Pattern 3 — duplicate Division+Gate, shown before MCP call -->
                <div *ngIf="dupError" class="ga-field-error">
                  An approver is already assigned for this Division and gate. Edit
                  the existing row instead, or choose a different Division or gate.
                </div>

                <label class="ga-label">Assigned Approver</label>
                <div class="ga-approver-row">
                  <span *ngIf="approverDisplayName" class="ga-approver-chip">
                    {{ approverDisplayName }}
                  </span>
                  <span *ngIf="!approverDisplayName" class="ga-approver-none">
                    No approver selected
                  </span>
                  <button type="button" class="oi-btn-secondary ga-pick-btn"
                          (click)="openPicker()">
                    {{ approverDisplayName ? 'Change' : 'Select approver' }}
                  </button>
                </div>

                <div *ngIf="saveError" class="ga-field-error">{{ saveError }}</div>
              </form>
            </ng-container>
          </div>

          <!-- View footer -->
          <div class="oi-side-foot" *ngIf="panelMode === 'view'">
            <button class="oi-btn-secondary" (click)="closePanel()">Close</button>
            <button class="oi-btn-primary"   (click)="openEdit()">Edit</button>
          </div>
          <!-- Create / Edit footer -->
          <div class="oi-side-foot" *ngIf="panelMode === 'create' || panelMode === 'edit'">
            <button class="oi-btn-secondary" (click)="closePanel()">Cancel</button>
            <button class="oi-btn-primary"
                    [disabled]="form.invalid || !form.value.approver_user_id || saving"
                    (click)="save()">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>

        <!-- Approver UserPicker (D-182) -->
        <app-user-picker
          *ngIf="pickerOpen"
          [allUsers]="true"
          [divisionId]="pickerDivisionId"
          [currentUserId]="pickerCurrentUserId"
          (userSelected)="onApproverSelected($event)">
        </app-user-picker>

      </ng-container>
    </div>
  `,
  styles: [`
    .ga-shell { max-width: 1100px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .ga-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .ga-header { margin: 8px 0 var(--triarq-space-md); }
    .ga-header-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); }
    .ga-title { margin: 0; }
    .ga-add-btn { background: var(--triarq-color-primary); color: #fff; border: none; border-radius: 5px; padding: 8px 16px; font-size: var(--triarq-text-small); cursor: pointer; }
    .ga-add-btn:hover { background: #1d5878; }
    .ga-subtitle { margin: 4px 0 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .ga-filter-bar { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--triarq-space-lg); padding: var(--triarq-space-sm) 0 var(--triarq-space-md); border-bottom: 1px solid var(--triarq-color-border); margin-bottom: var(--triarq-space-md); }
    .ga-filter-group { display: flex; flex-direction: column; gap: 6px; }
    .ga-filter-label, .ga-muted { font-size: 11px; color: #5A5A5A; }
    .ga-filter-label { font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
    .ga-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .ga-filter-chip { background: #fff; border: 1px solid var(--triarq-color-border); border-radius: 999px; padding: 4px 12px; font-size: 12px; color: #5A5A5A; cursor: pointer; }
    .ga-filter-chip:hover, .ga-filter-chip-on { border-color: var(--triarq-color-primary); }
    .ga-filter-chip-on { background: rgba(37,112,153,0.10); color: var(--triarq-color-primary); }
    .ga-filter-empty, .ga-approver-none { font-size: 12px; color: #9E9E9E; }
    .ga-filter-clear { align-self: center; background: none; border: none; color: var(--triarq-color-primary); font-size: 12px; cursor: pointer; text-decoration: underline; }
    .ga-grid { border: 1px solid var(--triarq-color-border); border-radius: 10px; background: #fff; overflow: hidden; }
    .ga-row { display: grid; grid-template-columns: 1.6fr 1.2fr 1.6fr 1.4fr 220px; gap: var(--triarq-space-sm); padding: 8px var(--triarq-space-md); border-bottom: 1px solid #E8E8E8; align-items: center; font-size: 13px; }
    .ga-header-grid { background: #12274A; color: #fff; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; font-size: 12px; }
    .ga-data { cursor: pointer; }
    .ga-data:hover { background: #F0F4F8; }
    .ga-selected { background: #E8F0FE; }
    .ga-cell { color: #1E1E1E; overflow: hidden; text-overflow: ellipsis; }
    .ga-empty { padding: var(--triarq-space-xl); text-align: center; color: #5A5A5A; font-size: 13px; }
    .ga-action-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .ga-delete-link { font-size: 12px; color: var(--triarq-color-error); cursor: pointer; text-decoration: underline; }
    .ga-row-confirm { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 11px; color: #1E1E1E; background: rgba(245,166,35,0.10); border-left: 3px solid var(--triarq-color-sunray); border-radius: 5px; padding: 6px 8px; }
    .ga-confirm-sm { padding: 4px 12px !important; font-size: 12px !important; }
    .ga-blocked { max-width: 560px; margin-top: var(--triarq-space-md); padding: var(--triarq-space-md); background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray); border-radius: 5px; }
    .ga-error { padding: var(--triarq-space-md); max-width: 560px; }
    .ga-blocked-primary, .ga-error-primary { font-weight: 500; margin-bottom: 4px; }
    .ga-blocked-primary { color: var(--triarq-color-text-primary); }
    .ga-error-primary, .ga-input-error { border-color: var(--triarq-color-error); }
    .ga-error-primary { color: var(--triarq-color-error); }
    .ga-blocked-secondary, .ga-error-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
    .ga-dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; font-size: 13px; }
    .ga-dl dt { color: #5A5A5A; }
    .ga-dl dd { margin: 0; color: #1E1E1E; }
    .ga-form { display: flex; flex-direction: column; gap: 8px; }
    .ga-label { font-size: 12px; color: #5A5A5A; font-weight: 500; }
    .ga-input { padding: 8px 12px; border: 1px solid #D6D6D6; border-radius: 5px; font-size: 13px; background: #fff; }
    .ga-input:focus { outline: none; border-color: var(--triarq-color-primary); }
    .ga-input-error { border-width: 2px; border-style: solid; }
    .ga-field-error { font-size: 12px; color: var(--triarq-color-error); }
    .ga-approver-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .ga-approver-chip { display: inline-flex; align-items: center; background: rgba(37,112,153,0.08); border-radius: 999px; padding: 4px 12px; font-size: 13px; color: #262626; }
    .ga-approver-none { font-style: italic; }
    .ga-pick-btn { padding: 6px 14px !important; font-size: 13px !important; }
  `]
})
export class GateApproversComponent implements OnInit, OnDestroy {

  loading       = false;
  loadError     = '';
  blockedReason = '';

  rows: GateApproverConfigRow[] = [];

  // Filter state (D-171). Both persisted under SCREEN_KEY.
  divisionFilter: string[]   = [];
  gateFilter:     GateName[] = [];

  sortState: SortState<GaSortColumn> = { ...DEFAULT_GA_SORT };

  // Right panel.
  panelMode:   PanelMode = null;
  selectedId:  string | null = null;
  selectedRow: GateApproverConfigRow | null = null;
  form:        FormGroup;
  saving       = false;
  saveError    = '';
  dupError     = false;
  approverDisplayName = '';

  // Picker.
  pickerOpen = false;
  readonly approverPickerRole = SYSTEM_ROLES.DOL;

  // Active Divisions for the Create dropdown.
  activeDivisions: Division[] = [];

  // Delete confirmation (D-183).
  deleteConfirmId: string | null = null;
  deleting = false;

  readonly gateOptions   = GATE_OPTIONS;
  readonly skeletonRows  = [1, 2, 3, 4];

  private readonly subs = new Subscription();

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly mcp:         McpService,
    private readonly profile:     UserProfileService,
    private readonly screenState: ScreenStateService,
    private readonly fb:          FormBuilder,
    private readonly cdr:         ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      division_id:      [null, Validators.required],
      gate_name:        [null, Validators.required],
      approver_user_id: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(async profile => {
        // D-464 — Phil-only. is_super_admin is the single-user super-admin flag
        // (CC-19-06). Mirrors the EPO WIP D-140 blocked pattern but gates on
        // is_super_admin per the Gate Approvers spec.
        if (profile.is_super_admin !== true) {
          this.blockedReason =
            'Only Phil can configure Gate Approvers. ' +
            'Contact Phil if a Division or gate needs a different Accountable approver.';
          this.cdr.markForCheck();
          return;
        }

        // Restore filter + sort state per D-171.
        const saved = await this.screenState.restore(SCREEN_KEY);
        if (saved?.filter_state) {
          const divs  = saved.filter_state['division_ids'];
          const gates = saved.filter_state['gate_names'];
          if (Array.isArray(divs))  { this.divisionFilter = divs.filter((x): x is string => typeof x === 'string'); }
          if (Array.isArray(gates)) { this.gateFilter = gates.filter((x): x is GateName => this.isGateName(x)); }
        }
        if (saved?.sort_state) {
          const col = saved.sort_state['column'];
          const dir = saved.sort_state['direction'];
          if (typeof col === 'string' && this.isSortColumn(col)) { this.sortState.column = col; }
          if (dir === 'asc' || dir === 'desc') { this.sortState.direction = dir; }
        }

        this.loadRows();
        this.loadActiveDivisions();
      })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.panelMode) { this.closePanel(); } }

  // ── Load ────────────────────────────────────────────────────────────────────

  private loadRows(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.delivery.getGateApproverConfigs().subscribe({
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

  // Active Divisions for the Create picker — same MCP the Divisions screen uses.
  private loadActiveDivisions(): void {
    this.mcp.call<Division[]>('division', 'list_divisions', {
      all_levels: true,
      include_inactive: false
    }).subscribe({
      next: res => {
        const data = res.success && Array.isArray(res.data) ? res.data : [];
        // active_status defaults true at DB level; treat undefined as active.
        this.activeDivisions = data
          .filter(d => d.active_status !== false && !d.deleted_at)
          .sort((a, b) => a.division_name.localeCompare(b.division_name));
        this.cdr.markForCheck();
      },
      error: () => { this.activeDivisions = []; this.cdr.markForCheck(); }
    });
  }

  // ── Filter (D-171) ───────────────────────────────────────────────────────────

  get divisionFilterOptions(): { id: string; label: string }[] {
    // Distinct Divisions present in the loaded config rows.
    const seen = new Map<string, string>();
    for (const r of this.rows) {
      if (!seen.has(r.division_id)) {
        seen.set(r.division_id, r.division_display_name_short || r.division_name);
      }
    }
    return Array.from(seen, ([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  toggleDivisionFilter(id: string): void {
    this.divisionFilter = this.divisionFilter.includes(id)
      ? this.divisionFilter.filter(x => x !== id)
      : [...this.divisionFilter, id];
    this.persistState();
    this.cdr.markForCheck();
  }

  toggleGateFilter(gate: GateName): void {
    this.gateFilter = this.gateFilter.includes(gate)
      ? this.gateFilter.filter(x => x !== gate)
      : [...this.gateFilter, gate];
    this.persistState();
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.divisionFilter = [];
    this.gateFilter     = [];
    this.persistState();
    this.cdr.markForCheck();
  }

  // ── Sort (S-036 / D-171) ──────────────────────────────────────────────────────

  onSortColumn(column: GaSortColumn): void {
    this.sortState = applySortToggle(this.sortState, column);
    this.persistState();
    this.cdr.markForCheck();
  }
  isSorted(column: GaSortColumn): boolean { return this.sortState.column === column; }
  glyph(column: GaSortColumn): '↑' | '↓' | '' { return sortIndicator(this.sortState, column); }

  get filteredSortedRows(): GateApproverConfigRow[] {
    const filtered = this.rows.filter(r =>
      (this.divisionFilter.length === 0 || this.divisionFilter.includes(r.division_id)) &&
      (this.gateFilter.length === 0     || this.gateFilter.includes(r.gate_name))
    );
    const { column, direction } = this.sortState;
    return filtered.sort((a, b) => {
      switch (column) {
        case 'division':
          return compareString(a.division_display_name_short || a.division_name,
                               b.division_display_name_short || b.division_name, direction);
        case 'gate':
          return compareNumber(GATE_SEQUENCE[a.gate_name], GATE_SEQUENCE[b.gate_name], direction);
        case 'approver':
          return compareString(a.approver_display_name, b.approver_display_name, direction);
        case 'updated_at':
          return compareDate(a.updated_at, b.updated_at, direction);
      }
    });
  }

  private persistState(): void {
    this.screenState.save(
      SCREEN_KEY,
      { division_ids: this.divisionFilter, gate_names: this.gateFilter },
      { column: this.sortState.column, direction: this.sortState.direction }
    );
  }

  // ── Panel: view / create / edit ───────────────────────────────────────────────

  get panelTitle(): string {
    switch (this.panelMode) {
      case 'create': return 'Add Gate Approver';
      case 'edit':   return 'Edit Gate Approver';
      default:       return 'Gate Approver';
    }
  }

  openView(row: GateApproverConfigRow): void {
    this.selectedId  = row.id;
    this.selectedRow = row;
    this.panelMode   = 'view';
    this.cdr.markForCheck();
  }

  openCreate(): void {
    this.selectedId  = null;
    this.selectedRow = null;
    this.dupError    = false;
    this.saveError   = '';
    this.approverDisplayName = '';
    this.form.reset({ division_id: null, gate_name: null, approver_user_id: null });
    // Division + Gate are editable when creating.
    this.form.get('division_id')?.enable({ emitEvent: false });
    this.form.get('gate_name')?.enable({ emitEvent: false });
    this.panelMode = 'create';
    this.cdr.markForCheck();
  }

  openEdit(): void {
    if (!this.selectedRow) { return; }
    this.dupError  = false;
    this.saveError = '';
    this.approverDisplayName = this.selectedRow.approver_display_name;
    this.form.reset({
      division_id:      this.selectedRow.division_id,
      gate_name:        this.selectedRow.gate_name,
      approver_user_id: this.selectedRow.approver_user_id
    });
    // Division + Gate identify the row — locked while editing the approver.
    this.form.get('division_id')?.disable({ emitEvent: false });
    this.form.get('gate_name')?.disable({ emitEvent: false });
    this.panelMode = 'edit';
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode   = null;
    this.selectedId  = null;
    this.selectedRow = null;
    this.dupError    = false;
    this.saveError   = '';
    this.form.get('division_id')?.enable({ emitEvent: false });
    this.form.get('gate_name')?.enable({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onScrimClick(): void {
    if (this.form.dirty && !window.confirm('Discard unsaved changes?')) { return; }
    this.closePanel();
  }

  // ── Approver picker (D-182) ────────────────────────────────────────────────────

  // Picker bindings — use getRawValue() so disabled (edit-mode) controls resolve.
  get pickerDivisionId(): string | null {
    return (this.form.getRawValue().division_id as string | null) ?? null;
  }
  get pickerCurrentUserId(): string | null {
    return (this.form.getRawValue().approver_user_id as string | null) ?? null;
  }

  openPicker(): void { this.pickerOpen = true; this.cdr.markForCheck(); }

  onApproverSelected(user: User | null): void {
    this.pickerOpen = false;
    if (user) {
      this.form.patchValue({ approver_user_id: user.id });
      this.form.get('approver_user_id')?.markAsDirty();
      this.approverDisplayName = user.display_name;
    }
    this.cdr.markForCheck();
  }

  // ── Save (Create + Edit) ───────────────────────────────────────────────────────

  save(): void {
    const raw = this.form.getRawValue();   // includes disabled controls
    if (!raw.division_id || !raw.gate_name || !raw.approver_user_id) { return; }

    // D-200 Pattern 3 — duplicate Division+Gate check BEFORE the MCP call.
    // Only relevant when creating (edit keeps the same Division+Gate key).
    if (this.panelMode === 'create') {
      const dup = this.rows.some(r =>
        r.division_id === raw.division_id && r.gate_name === raw.gate_name
      );
      if (dup) {
        this.dupError = true;
        this.cdr.markForCheck();
        return;
      }
    }

    this.saving    = true;
    this.saveError = '';
    this.dupError  = false;
    this.cdr.markForCheck();

    this.delivery.setGateApprover({
      division_id:      raw.division_id,
      gate_name:        raw.gate_name,
      approver_user_id: raw.approver_user_id
    }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.closePanel();
          this.loadRows();   // reload to pick up joined display names (S-008)
        } else {
          this.saveError = res.error ?? 'Could not save the approver assignment.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.saving    = false;
        this.saveError = err?.error ?? 'Could not save the approver assignment.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Delete (D-183 two-step) ─────────────────────────────────────────────────────

  onDeleteClick(row: GateApproverConfigRow): void {
    this.deleteConfirmId = row.id;
    this.cdr.markForCheck();
  }

  onDeleteCancel(): void {
    this.deleteConfirmId = null;
    this.cdr.markForCheck();
  }

  onDeleteConfirm(row: GateApproverConfigRow): void {
    this.deleting = true;
    this.cdr.markForCheck();

    this.delivery.deleteGateApproverConfig({
      division_id: row.division_id,
      gate_name:   row.gate_name
    }).subscribe({
      next: res => {
        this.deleting = false;
        if (res.success) {
          this.deleteConfirmId = null;
          if (this.selectedId === row.id) { this.closePanel(); }
          this.loadRows();
        } else {
          this.loadError = res.error ?? 'Could not remove the assignment.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.deleting  = false;
        this.loadError = err?.error ?? 'Could not remove the assignment.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  gateLabel(g: GateName | null | undefined): string {
    if (!g) { return '—'; }
    return GATE_DISPLAY[g] ?? g;
  }

  formatUpdated(row: GateApproverConfigRow): string {
    if (!row.updated_at) { return '—'; }
    const datePart = new Date(row.updated_at).toLocaleDateString();
    const byPart = row.updated_by_display_name ? ` by ${row.updated_by_display_name}` : '';
    return `${datePart}${byPart}`;
  }

  private isSortColumn(value: string): value is GaSortColumn {
    return ['division', 'gate', 'approver', 'updated_at'].includes(value);
  }

  private isGateName(value: unknown): value is GateName {
    return typeof value === 'string' &&
      ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'].includes(value);
  }
}
