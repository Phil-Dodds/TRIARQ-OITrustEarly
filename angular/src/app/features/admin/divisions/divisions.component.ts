// divisions.component.ts — Admin Division Management
// Contract 21 (2026-06-09): Tree grid + right-panel pattern per
//   D-413, D-414, S-005, S-006, S-010, S-011, S-018, S-019, S-032.
//
//   - Tree grid renders Trust (no indent), Service Line (24px), Functional Team (48px).
//   - Trust rows expanded by default; Service Line rows collapsed by default.
//   - Filter panel: Level (multi), Active Status (Active default per S-032).
//   - Right-panel View (S-018): identity, Parent chip, Members list with add/remove,
//     per-row Remove uses D-183 two-step.
//   - Right-panel Edit (S-019): Division Name + Active toggle; deactivation uses
//     D-183 two-step naming the soft-block consequence (S-032).
//   - + New Division REMOVED — structural changes require Design session (spec §2.1).
//
// D-93:  McpService only — no direct Supabase access.
// D-140: Blocked action UX on all errors.
// D-178: Three-tier loading — Tier 1 skeleton, Tier 2 button spinners, Tier 3 overlay.
// D-200: Pattern 2 amber band on Inactive rows per S-032.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  OnInit
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../../core/services/mcp.service';
import {
  ScreenStateService,
  SCREEN_KEYS
}                                       from '../../../core/services/screen-state.service';
import { BlockedActionComponent }      from '../../../shared/components/blocked-action/blocked-action.component';
import { LoadingOverlayComponent }     from '../../../shared/components/loading-overlay/loading-overlay.component';
import { Division, User }              from '../../../core/types/database';
import {
  ALL_ROLE_FLAGS,
  ROLE_FLAG_ABBREVIATIONS,
  RoleFlag
} from '../../../core/constants/roles';

type PanelMode = 'view' | 'edit' | null;
type LevelFilter = 'all' | 0 | 1 | 2;
type ActiveFilter = 'all' | 'active' | 'inactive';

interface FilterState {
  level:        LevelFilter;
  activeStatus: ActiveFilter;
}

const DEFAULT_FILTER: FilterState = { level: 'all', activeStatus: 'active' };

const LEVEL_LABELS: Record<number, string> = {
  0: 'Trust',
  1: 'Service Line',
  2: 'Functional Team'
};

@Component({
  selector: 'app-divisions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonicModule,
    BlockedActionComponent,
    LoadingOverlayComponent
  ],
  styles: [`
    :host{display:block}
    .dm-page{padding:var(--triarq-space-lg);max-width:1200px;margin:0 auto}
    .dm-header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--triarq-space-md);margin-bottom:var(--triarq-space-sm)}
    .dm-header h2{margin:0}
    .dm-desc{font-size:11px;font-style:italic;color:#5A5A5A;margin-top:4px}
    .dm-toolbar{display:flex;align-items:center;gap:var(--triarq-space-sm);margin-bottom:var(--triarq-space-sm);flex-wrap:wrap}
    .dm-chip-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--triarq-space-sm)}
    /* Grid container — Initiative grid look. Header is sticky Deep Navy uppercase. */
    .dm-grid{border:1px solid var(--triarq-color-border);border-radius:6px;background:#fff;overflow:hidden}
    .dm-row{display:grid;grid-template-columns:3fr .8fr 2fr 1.1fr;gap:var(--triarq-space-sm);padding:6px var(--triarq-space-md);border-bottom:1px solid #E8E8E8;align-items:center;font-size:13px;border-left:3px solid transparent}
    .dm-header-row{font-weight:500;color:#fff;background:#12274A;text-transform:uppercase;letter-spacing:0.3px;font-size:13px;padding:8px var(--triarq-space-md);position:sticky;top:0;z-index:3;border-left:none;border-bottom:none}
    .dm-data:hover{background:#F0F4F8;cursor:pointer}
    .dm-data.dm-selected{background:#E8F0FE;border-left:3px solid var(--triarq-color-primary,#257099)}
    .dm-name-cell{display:flex;align-items:center;gap:6px;min-width:0}
    .dm-name{font-weight:500;color:var(--triarq-color-text-primary)}
    .dm-trust-name{font-weight:700}
    .dm-chev{cursor:pointer;user-select:none;width:18px;display:inline-block;color:var(--triarq-color-text-secondary);font-size:11px}
    .dm-chev.dm-chev-empty{visibility:hidden}
    .dm-pill{display:inline-flex;align-items:center;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:500;line-height:1.4}
    .dm-pill-trust{background:rgba(37,112,153,0.12);color:var(--triarq-color-primary)}
    .dm-pill-sl{background:rgba(33,118,176,0.10);color:#1f78b4}
    .dm-pill-ft{background:var(--triarq-color-background-subtle);color:var(--triarq-color-text-secondary)}
    .dm-pill-active{background:#e8f5e9;color:#2e7d32}
    .dm-pill-inactive{background:#fff8e1;color:#f57f17}
    .dm-inactive-band{grid-column:1/-1;background:rgba(243,150,30,0.08);border-left:3px solid var(--triarq-color-sunray,#f3961e);padding:6px 10px;font-size:11px;color:#7a5b00}
    .dm-empty{padding:var(--triarq-space-lg);text-align:center;color:var(--triarq-color-text-secondary);font-size:13px}
    .dm-member-row{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--triarq-color-border);font-size:13px}
    .dm-member-row:last-child{border-bottom:none}
    .dm-member-name{display:flex;align-items:center;gap:6px}
    .dm-role-pill{font-size:10px;padding:1px 6px;border-radius:999px;background:var(--triarq-color-background-subtle);color:var(--triarq-color-text-secondary)}
    .dm-confirm{background:rgba(243,150,30,0.08);border-left:3px solid var(--triarq-color-sunray,#f3961e);padding:8px 10px;margin-top:8px;border-radius:5px;font-size:12px}
    .dm-confirm-actions{margin-top:6px;display:flex;gap:6px;justify-content:flex-end}
  `],
  template: `
    <div class="dm-page">

      <!-- Header (S-005) ─────────────────────────────────────────────────── -->
      <div class="dm-header">
        <div>
          <h2>Division Management</h2>
          <div class="dm-desc">
            TRIARQ organizational hierarchy: Trust → Service Line → Functional Team.
            Tap a row to view details. Structural changes require a Design session.
          </div>
        </div>
      </div>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Toolbar (filters + count) ─────────────────────────────────────── -->
      <div class="dm-toolbar">
        <button class="oi-btn-secondary" (click)="openFilterPanel()">
          Filters{{ activeFilterCount > 0 ? ' (' + activeFilterCount + ')' : '' }}
        </button>
        <span class="oi-filter-row-val" *ngIf="!loading">
          {{ visibleDivisionCount }} division{{ visibleDivisionCount === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Active filter chips (S-012) ───────────────────────────────────── -->
      <div class="dm-chip-bar" *ngIf="activeFilterChips.length > 0">
        <span class="oi-filter-chip" *ngFor="let chip of activeFilterChips">
          {{ chip.label }}
          <button (click)="removeFilterChip(chip.id)" aria-label="Remove filter">×</button>
        </span>
      </div>

      <!-- Snackbars ─────────────────────────────────────────────────────── -->
      <div *ngIf="successMsg"
           style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;
                  padding:8px 12px;margin-bottom:var(--triarq-space-sm);
                  font-size:12px;color:#2e7d32;">
        {{ successMsg }}
      </div>

      <!-- Skeleton (D-178 Tier 1) ───────────────────────────────────────── -->
      <div class="dm-grid" *ngIf="loading">
        <div class="dm-row dm-header-row">
          <span>Division Name</span><span>Members</span><span>Parent Division</span><span>Active Status</span>
        </div>
        <div class="dm-row" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;width:40px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:18px;border-radius:999px;width:60px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Tree grid ─────────────────────────────────────────────────────── -->
      <div class="dm-grid" *ngIf="!loading && allDivisions.length > 0">
        <div class="dm-row dm-header-row">
          <span>Division Name</span>
          <span>Members</span>
          <span>Parent Division</span>
          <span>Active Status</span>
        </div>

        <ng-container *ngFor="let row of visibleRows">
          <div class="dm-row dm-data"
               [class.dm-selected]="selectedDivisionId === row.division.id && panelMode"
               (click)="openView(row.division)">
            <span class="dm-name-cell" [style.padding-left.px]="row.division.division_level * 24">
              <span class="dm-chev"
                    *ngIf="canExpand(row.division)"
                    (click)="toggleExpand($event, row.division.id)">
                {{ isExpanded(row.division.id) ? '▼' : '▶' }}
              </span>
              <span class="dm-chev dm-chev-empty" *ngIf="!canExpand(row.division)">·</span>
              <span class="dm-name"
                    [class.dm-trust-name]="row.division.division_level === 0">
                {{ row.division.division_name }}
              </span>
              <span class="dm-pill"
                    [class.dm-pill-trust]="row.division.division_level === 0"
                    [class.dm-pill-sl]="row.division.division_level === 1"
                    [class.dm-pill-ft]="row.division.division_level === 2">
                {{ levelLabel(row.division.division_level) }}
              </span>
            </span>
            <span>{{ row.division.member_count ?? 0 }}</span>
            <span style="color:var(--triarq-color-text-secondary);">
              {{ parentName(row.division) || '—' }}
            </span>
            <span>
              <span class="dm-pill"
                    [class.dm-pill-active]="row.division.active_status !== false"
                    [class.dm-pill-inactive]="row.division.active_status === false">
                {{ row.division.active_status === false ? 'Inactive' : 'Active' }}
              </span>
            </span>
          </div>
          <div class="dm-row dm-inactive-band"
               *ngIf="row.division.active_status === false"
               (click)="openView(row.division)">
            ⚠ Inactive Division — no new Initiatives or user assignments permitted.
          </div>
        </ng-container>
      </div>

      <!-- Empty states ──────────────────────────────────────────────────── -->
      <div class="dm-empty" *ngIf="!loading && allDivisions.length === 0 && !blockedMessage">
        No Divisions found.
      </div>
      <div class="dm-empty" *ngIf="!loading && allDivisions.length > 0 && visibleRows.length === 0">
        No Divisions match the current filters.
      </div>

      <!-- Filter panel ──────────────────────────────────────────────────── -->
      <div class="oi-scrim oi-scrim-filter" *ngIf="filterPanelOpen" (click)="closeFilterPanel()"></div>
      <div class="oi-side-panel oi-side-filter" *ngIf="filterPanelOpen" role="dialog" aria-modal="true">
        <div class="oi-side-head">
          <strong>Filters</strong>
          <button class="oi-close-btn"
                  (click)="closeFilterPanel()" aria-label="Close filter panel">✕</button>
        </div>
        <div class="oi-side-body">

          <div class="oi-filter-row">
            <div class="oi-filter-row-head" (click)="toggleFilterRow('level')">
              <span class="oi-filter-row-name">Level</span>
              <span class="oi-filter-row-val">{{ pendingLevelSummary }}</span>
            </div>
            <div class="oi-filter-row-body" *ngIf="expandedFilterRow === 'level'">
              <label class="oi-picker-row">
                <span><input type="radio" name="lvl"
                       [checked]="pendingFilters.level === 'all'"
                       (change)="setPendingLevel('all')" /> All</span>
              </label>
              <label class="oi-picker-row">
                <span><input type="radio" name="lvl"
                       [checked]="pendingFilters.level === 0"
                       (change)="setPendingLevel(0)" /> Trust</span>
              </label>
              <label class="oi-picker-row">
                <span><input type="radio" name="lvl"
                       [checked]="pendingFilters.level === 1"
                       (change)="setPendingLevel(1)" /> Service Line</span>
              </label>
              <label class="oi-picker-row">
                <span><input type="radio" name="lvl"
                       [checked]="pendingFilters.level === 2"
                       (change)="setPendingLevel(2)" /> Functional Team</span>
              </label>
            </div>
          </div>

          <div class="oi-filter-row">
            <div class="oi-filter-row-head" (click)="toggleFilterRow('active')">
              <span class="oi-filter-row-name">Active Status</span>
              <span class="oi-filter-row-val">{{ pendingActiveSummary }}</span>
            </div>
            <div class="oi-filter-row-body" *ngIf="expandedFilterRow === 'active'">
              <label class="oi-picker-row">
                <span><input type="radio" name="act"
                       [checked]="pendingFilters.activeStatus === 'active'"
                       (change)="setPendingActive('active')" /> Active</span>
              </label>
              <label class="oi-picker-row">
                <span><input type="radio" name="act"
                       [checked]="pendingFilters.activeStatus === 'inactive'"
                       (change)="setPendingActive('inactive')" /> Inactive</span>
              </label>
              <label class="oi-picker-row">
                <span><input type="radio" name="act"
                       [checked]="pendingFilters.activeStatus === 'all'"
                       (change)="setPendingActive('all')" /> All</span>
              </label>
            </div>
          </div>

        </div>
        <div class="oi-side-foot">
          <button class="oi-btn-secondary" (click)="clearPendingFilters()">Clear all</button>
          <button class="oi-btn-primary" (click)="applyFilters()">Apply filters</button>
        </div>
      </div>

      <!-- Right panel — View / Edit ─────────────────────────────────────── -->
      <ng-container *ngIf="panelMode && selectedDivision">
        <div class="oi-scrim oi-scrim-detail"
             *ngIf="panelMode === 'edit'"
             (click)="onScrimClick()"></div>

        <div class="oi-side-panel oi-side-detail" role="dialog" aria-modal="true" aria-label="Division detail">
          <app-loading-overlay [visible]="panelOverlayBusy" [message]="panelOverlayMessage"></app-loading-overlay>

          <!-- ====================== VIEW ====================== -->
          <ng-container *ngIf="panelMode === 'view'">
            <div class="oi-side-head">
              <div style="display:flex;flex-direction:column;gap:2px;">
                <strong>{{ selectedDivision.division_name }}</strong>
                <span style="font-size:12px;color:var(--triarq-color-text-secondary);">
                  {{ levelLabel(selectedDivision.division_level) }}
                </span>
              </div>
              <button class="oi-close-btn"
                      (click)="closePanel()" aria-label="Close">✕</button>
            </div>
            <div class="oi-side-body">

              <div class="oi-zone">
                <div class="oi-zone-title">Identity</div>
                <div class="oi-field-row">
                  <span class="dm-pill"
                        [class.dm-pill-active]="selectedDivision.active_status !== false"
                        [class.dm-pill-inactive]="selectedDivision.active_status === false">
                    {{ selectedDivision.active_status === false ? 'Inactive' : 'Active' }}
                  </span>
                  <span class="dm-pill"
                        style="margin-left:6px;"
                        [class.dm-pill-trust]="selectedDivision.division_level === 0"
                        [class.dm-pill-sl]="selectedDivision.division_level === 1"
                        [class.dm-pill-ft]="selectedDivision.division_level === 2">
                    {{ levelLabel(selectedDivision.division_level) }}
                  </span>
                </div>
                <div class="oi-field-row" *ngIf="parentName(selectedDivision)">
                  <span class="oi-field-label">Parent Division</span>
                  <span class="oi-filter-chip"
                        style="cursor:pointer;"
                        (click)="openParentView()">
                    {{ parentName(selectedDivision) }}
                  </span>
                </div>
                <div class="oi-field-row" *ngIf="selectedDivision.display_name_short">
                  <span class="oi-field-label">Short Name</span>
                  <span>{{ selectedDivision.display_name_short }}</span>
                </div>
                <div class="oi-zone-explain" *ngIf="selectedDivision.active_status === false">
                  No new Initiatives or user assignments permitted while inactive.
                </div>
              </div>

              <div class="oi-zone">
                <div class="oi-zone-title">Members ({{ members.length }})</div>
                <div *ngIf="loadingMembers" style="font-size:12px;color:var(--triarq-color-text-secondary);">
                  Loading…
                </div>
                <div *ngIf="!loadingMembers">
                  <div *ngIf="members.length === 0" class="oi-zone-explain">No members assigned.</div>
                  <div *ngFor="let m of members" class="dm-member-row">
                    <span class="dm-member-name">
                      <span>{{ m.display_name }}</span>
                      <span class="dm-role-pill" *ngFor="let flag of userFlags(m)">
                        {{ flagAbbrev(flag) }}
                      </span>
                    </span>
                    <span>
                      <button *ngIf="removingMemberId !== m.id"
                              style="background:none;border:none;color:var(--triarq-color-primary);cursor:pointer;font-size:12px;"
                              (click)="askRemoveMember(m)">Remove</button>
                      <ion-spinner *ngIf="removingMemberId === m.id" name="crescent"
                                   style="width:14px;height:14px;"></ion-spinner>
                    </span>
                  </div>

                  <div class="dm-confirm" *ngIf="pendingRemoveMember">
                    Remove <strong>{{ pendingRemoveMember.display_name }}</strong> from
                    <strong>{{ selectedDivision.division_name }}</strong>?
                    They will lose access to {{ selectedDivision.division_name }}-scoped Initiatives.
                    <div class="dm-confirm-actions">
                      <button class="oi-btn-secondary" (click)="pendingRemoveMember = null">Cancel</button>
                      <button class="oi-btn-primary" (click)="confirmRemoveMember()">Remove</button>
                    </div>
                  </div>

                  <div style="margin-top:8px;">
                    <button class="oi-btn-secondary"
                            *ngIf="!addPickerOpen"
                            (click)="openAddPicker()"
                            [disabled]="selectedDivision.active_status === false"
                            [title]="selectedDivision.active_status === false
                              ? 'Division is inactive — user assignments not permitted'
                              : ''">
                      Add User
                    </button>
                    <div *ngIf="addPickerOpen" style="margin-top:8px;border:1px solid var(--triarq-color-border);border-radius:5px;padding:6px;max-height:220px;overflow-y:auto;">
                      <input type="text" class="oi-input"
                             placeholder="Filter users…"
                             [value]="addPickerSearch"
                             (input)="onAddPickerSearch($event)" />
                      <label class="oi-picker-row" *ngFor="let u of selectableUsers">
                        <span style="display:flex;align-items:center;gap:6px;">
                          <input type="checkbox"
                                 [checked]="false"
                                 (change)="addMember(u)" />
                          <span>{{ u.display_name }}</span>
                          <span class="dm-role-pill" *ngFor="let flag of userFlags(u)">
                            {{ flagAbbrev(flag) }}
                          </span>
                        </span>
                      </label>
                      <div *ngIf="selectableUsers.length === 0" class="oi-zone-explain" style="padding:6px;">
                        No users to add.
                      </div>
                    </div>
                  </div>
                  <div class="oi-err" *ngIf="memberError">{{ memberError }}</div>
                </div>
              </div>

            </div>
            <div class="oi-side-foot oi-side-foot-split">
              <span></span>
              <button class="oi-btn-primary" (click)="startEdit()">Edit</button>
            </div>
          </ng-container>

          <!-- ====================== EDIT ====================== -->
          <ng-container *ngIf="panelMode === 'edit'">
            <div class="oi-side-head">
              <strong>Edit Division</strong>
              <button class="oi-close-btn"
                      (click)="onScrimClick()" aria-label="Close">✕</button>
            </div>
            <div class="oi-side-body">
              <form [formGroup]="editForm">
                <div class="oi-field-row">
                  <label class="oi-field-label">Division Name *</label>
                  <input formControlName="division_name" class="oi-input" />
                  <div class="oi-err"
                       *ngIf="editForm.get('division_name')?.invalid && editForm.get('division_name')?.touched">
                    Name is required.
                  </div>
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Active Status</label>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <label class="oi-picker-row" style="cursor:pointer;">
                      <span><input type="radio" name="actSt"
                             [checked]="editActiveValue === true"
                             (change)="setEditActive(true)" /> Active</span>
                    </label>
                    <label class="oi-picker-row" style="cursor:pointer;">
                      <span><input type="radio" name="actSt"
                             [checked]="editActiveValue === false"
                             (change)="askDeactivate()" /> Inactive</span>
                    </label>
                  </div>
                  <div class="dm-confirm" *ngIf="showDeactivateConfirm">
                    Deactivate <strong>{{ selectedDivision.division_name }}</strong>?
                    No new Initiatives or user assignments will be permitted.
                    Existing Initiatives and memberships are unaffected.
                    <div class="dm-confirm-actions">
                      <button class="oi-btn-secondary" (click)="cancelDeactivate()">Cancel</button>
                      <button class="oi-btn-primary" (click)="confirmDeactivate()">Deactivate</button>
                    </div>
                  </div>
                </div>
                <div class="oi-zone-explain">
                  Level and Parent Division are structural — changes require a Design session.
                </div>
                <div class="oi-err" *ngIf="editError">{{ editError }}</div>
              </form>
            </div>
            <div class="oi-side-foot oi-side-foot-split">
              <button class="oi-btn-secondary" (click)="onScrimClick()">Cancel</button>
              <button class="oi-btn-primary"
                      [disabled]="editForm.invalid || saving"
                      (click)="submitEdit()">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </ng-container>

        </div>
      </ng-container>

    </div>
  `
})
export class DivisionsComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────────────────
  allDivisions: Division[] = [];
  loading       = false;
  blockedMessage = '';
  blockedHint    = '';
  successMsg     = '';

  // ── Tree state ────────────────────────────────────────────────────────────
  expandedIds: Set<string> = new Set();   // Trust IDs default-expanded on first load
  defaultExpansionApplied = false;

  // ── Filter state ──────────────────────────────────────────────────────────
  filters: FilterState        = { ...DEFAULT_FILTER };
  pendingFilters: FilterState = { ...DEFAULT_FILTER };
  filterPanelOpen = false;
  expandedFilterRow: 'level' | 'active' | null = null;

  // ── Panel state ───────────────────────────────────────────────────────────
  panelMode: PanelMode              = null;
  selectedDivisionId: string | null = null;
  selectedDivision: Division | null = null;

  editForm!: FormGroup;
  editActiveValue: boolean = true;
  saving         = false;
  editError      = '';
  showDeactivateConfirm = false;

  // ── Members state ─────────────────────────────────────────────────────────
  members: User[]      = [];
  loadingMembers       = false;
  allUsers: User[]     = [];
  addPickerOpen        = false;
  addPickerSearch      = '';
  addingMemberId: string | null   = null;
  removingMemberId: string | null = null;
  pendingRemoveMember: User | null = null;
  memberError          = '';

  readonly skeletonRows = [1, 2, 3, 4, 5];

  constructor(
    private readonly mcp:         McpService,
    private readonly screenState: ScreenStateService,
    private readonly fb:          FormBuilder,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      division_name: ['', [Validators.required, Validators.maxLength(120)]]
    });
    this.loadDivisions();
    this.loadUsersOnce();
    this.restoreScreenState();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.panelMode) { this.onScrimClick(); return; }
    if (this.filterPanelOpen) { this.closeFilterPanel(); }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  private loadDivisions(): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp.call<Division[]>('division', 'list_divisions', {
      all_levels: true,
      include_inactive: true,
      with_member_counts: true
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allDivisions = Array.isArray(res.data) ? res.data : [];
          if (!this.defaultExpansionApplied) {
            this.expandedIds = new Set(
              this.allDivisions.filter(d => d.division_level === 0).map(d => d.id)
            );
            this.defaultExpansionApplied = true;
          }
        } else {
          this.setBlocked(
            res.error ?? 'Could not load Divisions.',
            'Ensure you have admin access and your session is active.'
          );
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.setBlocked(
          err.error ?? 'Could not load Divisions.',
          'Ensure you have admin access and your session is active.'
        );
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadUsersOnce(): void {
    this.mcp.call<User[]>('division', 'list_users', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allUsers = Array.isArray(res.data) ? res.data : [];
          this.cdr.markForCheck();
        }
      },
      error: () => { /* non-fatal */ }
    });
  }

  // ── Screen-state ──────────────────────────────────────────────────────────
  private async restoreScreenState(): Promise<void> {
    const saved = await this.screenState.restore(SCREEN_KEYS.ADMIN_DIVISIONS);
    if (!saved) { return; }
    const f = saved.filter_state as Partial<FilterState> | null;
    if (f && typeof f === 'object') {
      const level: LevelFilter =
        f.level === 0 || f.level === 1 || f.level === 2 ? f.level
        : f.level === 'all' ? 'all' : 'all';
      const status: ActiveFilter =
        f.activeStatus === 'active' || f.activeStatus === 'inactive' || f.activeStatus === 'all'
          ? f.activeStatus : 'active';
      this.filters = { level, activeStatus: status };
      this.pendingFilters = { ...this.filters };
      this.cdr.markForCheck();
    }
  }

  private saveScreenState(): void {
    this.screenState.save(SCREEN_KEYS.ADMIN_DIVISIONS,
      this.filters as unknown as Record<string, unknown>, {});
  }

  // ── Tree rendering ────────────────────────────────────────────────────────
  /**
   * Flatten the tree honoring expand/collapse — a child is visible only when
   * every ancestor is in expandedIds. Sorted by level then name.
   */
  get visibleRows(): { division: Division }[] {
    const out: { division: Division }[] = [];
    const trusts = this.allDivisions
      .filter(d => d.division_level === 0 && this.matchesFilters(d))
      .sort((a, b) => a.division_name.localeCompare(b.division_name));
    for (const trust of trusts) {
      out.push({ division: trust });
      if (this.expandedIds.has(trust.id)) {
        const serviceLines = this.allDivisions
          .filter(d => d.parent_division_id === trust.id && d.division_level === 1 && this.matchesFilters(d))
          .sort((a, b) => a.division_name.localeCompare(b.division_name));
        for (const sl of serviceLines) {
          out.push({ division: sl });
          if (this.expandedIds.has(sl.id)) {
            const fts = this.allDivisions
              .filter(d => d.parent_division_id === sl.id && d.division_level === 2 && this.matchesFilters(d))
              .sort((a, b) => a.division_name.localeCompare(b.division_name));
            for (const ft of fts) { out.push({ division: ft }); }
          }
        }
      }
    }
    return out;
  }

  get visibleDivisionCount(): number { return this.visibleRows.length; }

  private matchesFilters(d: Division): boolean {
    if (this.filters.level !== 'all' && d.division_level !== this.filters.level) { return false; }
    if (this.filters.activeStatus === 'active'   && d.active_status === false) { return false; }
    if (this.filters.activeStatus === 'inactive' && d.active_status !== false) { return false; }
    return true;
  }

  canExpand(d: Division): boolean {
    if (d.division_level === 2) { return false; }
    return this.allDivisions.some(child => child.parent_division_id === d.id);
  }

  isExpanded(id: string): boolean { return this.expandedIds.has(id); }

  toggleExpand(ev: Event, id: string): void {
    ev.stopPropagation();
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
    this.cdr.markForCheck();
  }

  parentName(d: Division): string {
    if (!d.parent_division_id) { return ''; }
    const parent = this.allDivisions.find(x => x.id === d.parent_division_id);
    return parent ? parent.division_name : '';
  }

  levelLabel(level: number): string { return LEVEL_LABELS[level] ?? `Level ${level}`; }

  // ── Filter chips ──────────────────────────────────────────────────────────
  get activeFilterCount(): number { return this.activeFilterChips.length; }

  get activeFilterChips(): { id: string; label: string }[] {
    const out: { id: string; label: string }[] = [];
    if (this.filters.level !== 'all') {
      out.push({ id: 'level', label: `Level: ${LEVEL_LABELS[this.filters.level as number]}` });
    }
    if (this.filters.activeStatus !== 'active') {
      out.push({
        id: 'active',
        label: `Active: ${this.filters.activeStatus === 'all' ? 'All' : 'Inactive'}`
      });
    }
    return out;
  }

  removeFilterChip(id: string): void {
    if (id === 'level') { this.filters = { ...this.filters, level: 'all' }; }
    if (id === 'active') { this.filters = { ...this.filters, activeStatus: 'active' }; }
    this.pendingFilters = { ...this.filters };
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  // ── Filter panel ──────────────────────────────────────────────────────────
  openFilterPanel(): void {
    this.pendingFilters = { ...this.filters };
    this.expandedFilterRow = null;
    this.filterPanelOpen = true;
    this.cdr.markForCheck();
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
    this.expandedFilterRow = null;
    this.cdr.markForCheck();
  }

  toggleFilterRow(row: 'level' | 'active'): void {
    this.expandedFilterRow = this.expandedFilterRow === row ? null : row;
    this.cdr.markForCheck();
  }

  setPendingLevel(level: LevelFilter): void {
    this.pendingFilters = { ...this.pendingFilters, level };
    this.cdr.markForCheck();
  }

  setPendingActive(value: ActiveFilter): void {
    this.pendingFilters = { ...this.pendingFilters, activeStatus: value };
    this.cdr.markForCheck();
  }

  get pendingLevelSummary(): string {
    return this.pendingFilters.level === 'all' ? 'All' : LEVEL_LABELS[this.pendingFilters.level as number];
  }

  get pendingActiveSummary(): string {
    const s = this.pendingFilters.activeStatus;
    return s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'All';
  }

  applyFilters(): void {
    this.filters = { ...this.pendingFilters };
    this.saveScreenState();
    this.closeFilterPanel();
  }

  clearPendingFilters(): void {
    this.pendingFilters = { ...DEFAULT_FILTER };
    this.expandedFilterRow = null;
    this.cdr.markForCheck();
  }

  // ── Panel open / close ────────────────────────────────────────────────────
  openView(div: Division): void {
    this.selectedDivision   = div;
    this.selectedDivisionId = div.id;
    this.panelMode          = 'view';
    this.editError          = '';
    this.memberError        = '';
    this.addPickerOpen      = false;
    this.addPickerSearch    = '';
    this.pendingRemoveMember = null;
    this.loadMembers(div.id);
    this.cdr.markForCheck();
  }

  openParentView(): void {
    if (!this.selectedDivision?.parent_division_id) { return; }
    const parent = this.allDivisions.find(d => d.id === this.selectedDivision!.parent_division_id);
    if (parent) { this.openView(parent); }
  }

  startEdit(): void {
    if (!this.selectedDivision) { return; }
    const d = this.selectedDivision;
    this.editForm.setValue({ division_name: d.division_name });
    this.editActiveValue = d.active_status !== false;
    this.showDeactivateConfirm = false;
    this.editError = '';
    this.panelMode = 'edit';
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode = null;
    this.selectedDivision = null;
    this.selectedDivisionId = null;
    this.addPickerOpen = false;
    this.pendingRemoveMember = null;
    this.cdr.markForCheck();
  }

  onScrimClick(): void {
    if (this.panelMode === 'edit') {
      if (this.editForm.dirty) {
        if (!confirm('Discard unsaved changes?')) { return; }
      }
      // Return to View if a Division is selected.
      this.panelMode = this.selectedDivision ? 'view' : null;
      this.editForm.markAsPristine();
      this.cdr.markForCheck();
      return;
    }
    this.closePanel();
  }

  // ── Edit save ─────────────────────────────────────────────────────────────
  setEditActive(value: boolean): void {
    this.editActiveValue = value;
    this.showDeactivateConfirm = false;
    this.cdr.markForCheck();
  }

  askDeactivate(): void {
    // S-032 + D-183: two-step confirmation naming the consequence.
    this.showDeactivateConfirm = true;
    this.cdr.markForCheck();
  }

  cancelDeactivate(): void {
    this.showDeactivateConfirm = false;
    this.editActiveValue = true;
    this.cdr.markForCheck();
  }

  confirmDeactivate(): void {
    this.editActiveValue = false;
    this.showDeactivateConfirm = false;
    this.cdr.markForCheck();
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.selectedDivisionId) { return; }
    this.saving = true;
    this.editError = '';
    this.cdr.markForCheck();

    const updates: Record<string, unknown> = {
      division_name: (this.editForm.value.division_name as string).trim()
    };
    if (this.selectedDivision && this.editActiveValue !== (this.selectedDivision.active_status !== false)) {
      updates['active_status'] = this.editActiveValue;
    }

    this.mcp.call<Division>('division', 'update_division', {
      division_id: this.selectedDivisionId,
      updates
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.successMsg = 'Division updated.';
          setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000);
          // Reload the grid + refresh selected.
          this.loadDivisions();
          this.selectedDivision = res.data;
          this.panelMode = 'view';
          this.editForm.markAsPristine();
        } else {
          this.editError = res.error ?? 'Save failed.';
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.editError = err.error ?? 'Save failed.';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Members ───────────────────────────────────────────────────────────────
  private loadMembers(divisionId: string): void {
    this.loadingMembers = true;
    this.cdr.markForCheck();
    this.mcp.call<User[]>('division', 'list_users', { division_id: divisionId }).subscribe({
      next: (res) => {
        this.members = res.success && Array.isArray(res.data) ? res.data : [];
        this.loadingMembers = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.members = [];
        this.loadingMembers = false;
        this.cdr.markForCheck();
      }
    });
  }

  openAddPicker(): void {
    this.addPickerOpen = true;
    this.addPickerSearch = '';
    this.memberError = '';
    this.cdr.markForCheck();
  }

  onAddPickerSearch(ev: Event): void {
    this.addPickerSearch = (ev.target as HTMLInputElement).value.toLowerCase();
    this.cdr.markForCheck();
  }

  /** Active users not already in this Division, optionally filtered by search. */
  get selectableUsers(): User[] {
    const memberIds = new Set(this.members.map(m => m.id));
    const q = this.addPickerSearch.trim().toLowerCase();
    return this.allUsers.filter(u =>
      u.is_active &&
      !memberIds.has(u.id) &&
      (!q || u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }

  addMember(user: User): void {
    if (!this.selectedDivisionId) { return; }
    this.addingMemberId = user.id;
    this.memberError = '';
    this.cdr.markForCheck();

    this.mcp.call<unknown>('division', 'assign_user_to_division', {
      user_id: user.id,
      division_id: this.selectedDivisionId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMembers(this.selectedDivisionId!);
          this.loadDivisions();  // refresh member_count
        } else {
          this.memberError = res.error ?? 'Could not add member.';
        }
        this.addingMemberId = null;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.memberError = err.error ?? 'Could not add member.';
        this.addingMemberId = null;
        this.cdr.markForCheck();
      }
    });
  }

  askRemoveMember(user: User): void {
    this.pendingRemoveMember = user;
    this.cdr.markForCheck();
  }

  confirmRemoveMember(): void {
    if (!this.selectedDivisionId || !this.pendingRemoveMember) { return; }
    const user = this.pendingRemoveMember;
    this.removingMemberId = user.id;
    this.pendingRemoveMember = null;
    this.memberError = '';
    this.cdr.markForCheck();

    this.mcp.call<unknown>('division', 'revoke_division_membership', {
      user_id: user.id,
      division_id: this.selectedDivisionId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMembers(this.selectedDivisionId!);
          this.loadDivisions();
        } else {
          this.memberError = res.error ?? 'Could not remove member.';
        }
        this.removingMemberId = null;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.memberError = err.error ?? 'Could not remove member.';
        this.removingMemberId = null;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Overlay state ─────────────────────────────────────────────────────────
  get panelOverlayBusy(): boolean {
    return this.saving || this.addingMemberId !== null || this.removingMemberId !== null;
  }
  get panelOverlayMessage(): string {
    if (this.saving)               { return 'Saving…'; }
    if (this.addingMemberId)       { return 'Adding…'; }
    if (this.removingMemberId)     { return 'Removing…'; }
    return '';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  userFlags(user: User): RoleFlag[] {
    return ALL_ROLE_FLAGS.filter(f => user[f] === true);
  }

  flagAbbrev(flag: RoleFlag): string {
    return ROLE_FLAG_ABBREVIATIONS[flag];
  }

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}
