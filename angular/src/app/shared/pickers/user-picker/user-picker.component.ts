// user-picker.component.ts — Pathways OI Trust
// Picker modal for selecting a DCS, EPO, or DOL user. Implements D-182 Entity Picker Pattern.
//
// D-182 (Entity Picker Pattern, Principle 12):
//   - Scope radio: tightest scope default, explicit progression
//   - Search: client-side when scoped list is small (<100 records)
//   - Entity rows: avatar, name, key attributes, status badge
//   - Echo section: selected entity as chip
//   - Inactive/ineligible: dimmed, not selectable, blocked message inline
//   - PICKER_SEARCH_DEBOUNCE_MS = 600 (not applicable here — client-side search)
//
// CC-007: Two-scope simplification — "This Division" and "All Divisions" only.
//   D-182 specifies a third "Trust" scope (ancestor Divisions up to Trust level).
//   This requires trust ancestry lookup not supported by current list_users MCP params.
//   Deferred to Design Chat for MCP enhancement. Noted as CC-007.
//
// Scope logic per D-182 Principle 12 role-assignment section:
//   "This Division" (default) → users with target role in the cycle's Division.
//   "All Divisions"           → all users with target role in the system.
//
// D-93: No direct Supabase access — calls division-mcp via McpService.
// ChangeDetection: OnPush.
// D-184: Entity name capitalization — role display labels via ROLE_DISPLAY_NAMES (roles.ts).

import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { McpService } from '../../../core/services/mcp.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { User } from '../../../core/types/database';
import { SYSTEM_ROLES, SystemRole, ROLE_DISPLAY_NAMES, userRoleToFlag } from '../../../core/constants/roles';
import { UserCreateFormComponent } from '../../components/user-create-form/user-create-form.component';

type UserPickerScope = 'division' | 'all';

interface UserPickerRow extends User {
  initials:      string;
  avatarColor:   string;
  isSelectable:  boolean;
  blockedReason: string | null;
}

const AVATAR_COLORS = [
  '#257099', '#00274E', '#E96127', '#F2A620',
  '#2E7D32', '#1565C0', '#6A1B9A', '#00695C'
];

function nameInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) { return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
  return (parts[0] || '?').substring(0, 2).toUpperCase();
}

function avatarColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

@Component({
  selector:        'app-user-picker',
  standalone:      true,
  imports:         [CommonModule, ReactiveFormsModule, UserCreateFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="up-overlay" (click)="onOverlayClick($event)">
      <div class="up-modal" role="dialog" aria-modal="true"
           [attr.aria-label]="'Select ' + roleLabel">

        <!-- Header -->
        <div class="up-header">
          <h2 class="up-title">Select {{ roleLabel }}</h2>
          <button class="up-close" (click)="cancel()" aria-label="Close">✕</button>
        </div>

        <!-- Scope radio -->
        <div class="up-scope-row">
          <span class="up-scope-label">Scope:</span>
          <label *ngFor="let opt of scopeOptions" class="up-scope-option">
            <input type="radio" [value]="opt.value" [formControl]="scopeCtrl" />
            {{ opt.label }}
          </label>
        </div>

        <!-- Search -->
        <div class="up-search-row">
          <input class="up-search-input"
                 type="text"
                 [formControl]="searchCtrl"
                 [placeholder]="'Search ' + roleLabel + 's…'"
                 aria-label="Search users" />
        </div>

        <!-- D-299 / B-13 fix: "This Division" scope with no divisionId — inline inform only.
             Does NOT block the list — shows below scope row. Source: D-299. -->
        <div *ngIf="noDivisionMessage" class="up-no-division-msg">
          This Initiative doesn't have a Division set yet. Select a Division on the form to filter by Division.
        </div>

        <!-- Error -->
        <div *ngIf="loadError" class="up-load-error" role="alert">
          <span class="up-error-primary">Could not load users.</span>
          <span class="up-error-secondary">{{ loadError }}</span>
        </div>

        <!-- Loading -->
        <div *ngIf="loading && !loadError" class="up-loading">
          Loading users…
        </div>

        <!-- User list -->
        <div *ngIf="!loading && !loadError" class="up-list-container">
          <!-- B-13 fix: specific message when This Division has no users of this role.
               Distinguishes empty result from genuine error. Source: D-297. -->
          <div *ngIf="filteredRows.length === 0 && divisionEmptyMessage" class="up-empty">
            {{ divisionEmptyMessage }}
            <span class="up-expand-hint">Try "All Divisions" to search the full system.</span>
          </div>
          <div *ngIf="filteredRows.length === 0 && !divisionEmptyMessage" class="up-empty">
            No {{ roleLabel }}s found in this scope.
            <span *ngIf="scopeCtrl.value === 'division'"
                  class="up-expand-hint">
              Try "All Divisions" to search the full system.
            </span>
          </div>

          <div *ngFor="let row of filteredRows"
               class="up-row"
               [class.up-row-selected]="selectedUserId === row.id"
               [class.up-row-inactive]="!row.is_active"
               [class.up-row-selectable]="row.isSelectable"
               (click)="onRowClick(row)">

            <!-- Avatar — S-034: 32px -->
            <div class="up-avatar"
                 [style.background]="row.avatarColor">
              {{ row.initials }}
            </div>

            <!-- Name + role pill — S-034: inline on same horizontal line -->
            <div class="up-row-body">
              <span class="up-row-name">{{ row.display_name }}</span>
              <span class="up-role-badge">{{ roleLabel }}</span>
              <span *ngIf="!row.is_active" class="up-inactive-badge">⊘ Inactive</span>
            </div>

            <!-- Blocked message (inline, only shown on click for inactive) -->
            <div *ngIf="blockedRowId === row.id && row.blockedReason"
                 class="up-blocked-msg" role="alert">
              {{ row.blockedReason }}
            </div>
          </div>

          <!-- D-420 — Admin-only "+ Add User" link below the last result row.
               Opens an inline Create User overlay over the picker. -->
          <div *ngIf="callerIsAdmin" class="up-add-user-row">
            <button type="button" class="up-add-user-link" (click)="openCreateOverlay()">
              + Add User
            </button>
          </div>
        </div>

        <!-- Echo section -->
        <div class="up-echo-section">
          <div class="up-echo-label">Selected</div>
          <div *ngIf="selectedRow; else noSelection" class="up-echo-chip">
            <div class="up-echo-avatar"
                 [style.background]="selectedRow.avatarColor">
              {{ selectedRow.initials }}
            </div>
            <span class="up-echo-name">{{ selectedRow.display_name }}</span>
            <span *ngIf="!selectedRow.is_active" class="up-inactive-badge">Inactive</span>
          </div>
          <ng-template #noSelection>
            <span class="up-echo-none">— None selected —</span>
          </ng-template>
        </div>

        <!-- Footer buttons -->
        <div class="up-footer">
          <button class="up-btn-cancel" type="button" (click)="cancel()">Cancel</button>
          <button class="up-btn-confirm" type="button"
                  [disabled]="!selectedRow || !selectedRow.isSelectable"
                  (click)="confirm()">
            Confirm
          </button>
        </div>
      </div>

      <!-- D-420 — Create User overlay (modal over picker, Admin-only).
           Reuses .up-overlay + .up-modal chrome with .up-overlay-create z-bump.
           Form is the shared UserCreateFormComponent (S-007). -->
      <div *ngIf="createOverlayOpen" class="up-overlay up-overlay-create"
           (click)="$event.stopPropagation()">
        <div class="up-modal" role="dialog" aria-modal="true" aria-label="Add User">
          <div class="up-header">
            <h2 class="up-title">Add {{ roleLabel }}</h2>
            <button class="up-close" type="button"
                    (click)="onCreateCancelled()" aria-label="Close add user">✕</button>
          </div>
          <div class="up-body-padded">
            <p class="up-create-explain">
              New user receives an invite email and gets the {{ roleLabel }} role.
              Assign Divisions via User Management after the invite.
            </p>
            <app-user-create-form
              [allDivisions]="[]"
              [defaultRoleFlag]="defaultRoleFlagForPicker"
              (userCreated)="onUserCreated($event)"
              (cancelled)="onCreateCancelled()">
            </app-user-create-form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .up-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1100; }
    .up-modal { background: #fff; border-radius: 10px; width: 540px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .up-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #12274A; }
    .up-title { margin: 0; font: 600 18px/1.2 Roboto; color: #fff; }
    .up-close { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; padding: 4px 8px; }
    .up-scope-row { display: flex; align-items: center; gap: 16px; padding: 12px 20px; border-bottom: 1px solid #E8E8E8; background: #F5F5F5; }
    .up-scope-label { font: 500 13px/1 Roboto; color: #5A5A5A; white-space: nowrap }
    .up-scope-option { display: flex; align-items: center; gap: 6px; font: 400 13px/1 Roboto; color: #262626; cursor: pointer }
    .up-search-row { padding: 12px 20px; border-bottom: 1px solid #E8E8E8; }
    .up-search-input { width: 100%; box-sizing: border-box; border: 1.5px solid #D0D0D0; border-radius: 5px; padding: 8px 12px; font: 400 14px Roboto; }
    .up-search-input:focus { outline: none; border-color: #257099; }
    .up-no-division-msg { padding: 24px 20px; text-align: center; font: italic 14px Roboto; color: #5A5A5A; }
    .up-load-error { padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
    .up-error-primary { font: 500 14px Roboto; color: #C62828; }
    .up-loading,.up-error-secondary,.up-empty { color: #5A5A5A; }
    .up-error-secondary { font: 400 12px Roboto; }
    .up-loading { padding: 24px 20px; text-align: center; font: 400 14px Roboto }
    .up-list-container { overflow-y: auto; flex: 1; padding: 8px 0; }
    .up-empty { padding: 20px; font: 400 14px Roboto; display: flex; flex-direction: column; gap: 6px; }
    .up-expand-hint { font: 400 12px Roboto; color: #257099; }
    .up-row { display: flex; align-items: center; gap: 12px; padding: 8px 20px; border-bottom: 1px solid #F0F0F0; cursor: pointer; flex-wrap: wrap; }
    .up-row:hover { background: #F0F4F8; }
    .up-row-selected { background: #E8F0FE !important; }
    .up-row-inactive { opacity: 0.55; }
    .up-row:not(.up-row-selectable) { cursor: default; }
    .up-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font: 600 13px/1 Roboto; color: #fff; flex-shrink: 0; }
    .up-row-body { flex: 1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .up-row-name { font: 500 14px/1.3 Roboto; color: #1E1E1E; }
    .up-role-badge, .up-inactive-badge { border-radius: 4px; padding: 2px 7px; font: 500 11px Roboto; }
    .up-role-badge { background: #E3F2FD; color: #1565C0; }
    .up-inactive-badge { background: #F5F5F5; color: #757575; }
    .up-blocked-msg { width: 100%; padding: 8px 12px; margin-top: 4px; background: #FFF8E1; border-left: 3px solid #F2A620; border-radius: 4px; font: 400 12px Roboto; }
    .up-echo-section { padding: 12px 20px; border-top: 1px solid #E8E8E8; background: #FAFAFA; }
    .up-echo-label { font: 500 12px Roboto; color: #5A5A5A; margin-bottom: 6px; }
    .up-echo-chip { display: inline-flex; align-items: center; gap: 8px; background: rgba(37,112,153,0.08); border-radius: 999px; padding: 4px 12px 4px 6px; }
    .up-echo-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font: 600 10px Roboto; color: #fff; }
    .up-echo-name { font: 400 13px Roboto; color: #262626; }
    .up-echo-none { font: 400 italic 13px Roboto; color: #9E9E9E; }
    .up-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 14px 20px; border-top: 1px solid #E8E8E8; }
    .up-btn-cancel { background: #fff; border: 1.5px solid #D0D0D0; border-radius: 5px; padding: 8px 20px; font: 500 14px Roboto; color: #5A5A5A; cursor: pointer; }
    .up-btn-cancel:hover { background: #F5F5F5; }
    .up-btn-confirm { background: #257099; border: none; border-radius: 5px; padding: 8px 24px; font: 500 14px Roboto; color: #fff; cursor: pointer; }
    .up-btn-confirm:hover:not(:disabled) { background: #1d5878; }
    .up-btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
    /* D-420 */
    .up-add-user-row { padding: 8px 20px; border-top: 1px solid #F0F0F0; }
    .up-add-user-link { background: none; border: none; cursor: pointer; color: #257099; font: 500 13px Roboto; padding: 4px 0; }
    .up-add-user-link:hover { text-decoration: underline; }
    .up-overlay-create { z-index: 1200; background: rgba(0,0,0,0.65); }
    .up-body-padded { flex: 1; overflow-y: auto; padding: 16px 20px; }
    .up-create-explain { margin: 0 0 16px; font: 400 italic 12px Roboto; color: #5A5A5A; }
  `]
})
export class UserPickerComponent implements OnInit, OnDestroy {
  /** Role to filter the picker — D-389/D-390/D-391. Ignored when allUsers=true. */
  @Input() userRole: SystemRole = SYSTEM_ROLES.DCS;
  /**
   * Contract 29: when true, the picker lists ALL active users regardless of
   * role (no role-flag filter). Used by surfaces that select an arbitrary user
   * — Other Consulted / Other Informed (D-458) and gate approver (D-464).
   * Defaults false → existing role-scoped behavior is unchanged.
   */
  @Input() allUsers = false;
  /** Division ID for "This Division" scope. Null → skip division scope, default to All. */
  @Input() divisionId: string | null = null;
  /** Pre-selected user ID (current value on the cycle). */
  @Input() currentUserId: string | null = null;

  @Output() userSelected = new EventEmitter<User | null>();

  scopeCtrl  = new FormControl<UserPickerScope>('division');
  searchCtrl = new FormControl<string>('');

  allRows:      UserPickerRow[] = [];
  filteredRows: UserPickerRow[] = [];
  loading       = false;
  loadError     = '';
  // B-13 fix: separate empty-state message for "This Division has no users of this role"
  // vs a genuine network/server error. Source: D-297.
  divisionEmptyMessage = '';
  selectedRow:  UserPickerRow | null = null;
  selectedUserId: string | null = null;
  blockedRowId: string | null = null;
  // D-297/D-299: shown when user explicitly selects "This Division" scope but cycle has no Division.
  // B-13/D-299 fix: noDivisionMessage only shown on explicit scope switch, not on initial open. Source: D-299.
  noDivisionMessage = false;

  scopeOptions: { value: UserPickerScope; label: string }[] = [];

  // D-420 — Admin inline + Add User. Derived from UserProfileService at init.
  callerIsAdmin     = false;
  createOverlayOpen = false;

  get roleLabel(): string {
    if (this.allUsers) { return 'User'; }
    return ROLE_DISPLAY_NAMES[this.userRole] ?? this.userRole;
  }

  /** D-420 — role flag for the shared Create form's default pre-check. */
  get defaultRoleFlagForPicker(): import('../../../core/constants/roles').RoleFlag {
    return userRoleToFlag(this.userRole);
  }

  private subs = new Subscription();

  constructor(
    private readonly mcp:         McpService,
    private readonly userProfile: UserProfileService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // D-299 fix: when no Division set on cycle, default scope to 'all' and load immediately.
    // Previous behavior: noDivisionMessage = true blocked all loading. Source: D-299.
    // D-297: "This Division" scope with no divisionId shows inline inform message (not a blocker).

    // D-420 — caller admin detection drives + Add User link visibility.
    this.callerIsAdmin = this.userProfile.getCurrentProfile()?.is_admin === true;

    // Build scope options — D-182: tightest scope first
    this.scopeOptions = [
      { value: 'division', label: 'This Division' },
      { value: 'all',      label: 'All Divisions' }
    ];

    // D-299: when cycle has no Division, open with All Divisions scope.
    if (!this.divisionId) {
      this.scopeCtrl.setValue('all', { emitEvent: false });
    }

    // Pre-select current user if one is set
    this.selectedUserId = this.currentUserId;

    // React to scope changes
    this.subs.add(
      this.scopeCtrl.valueChanges.subscribe(scope => {
        // D-299: if user switches to "This Division" with no divisionId, show inline inform.
        // All Divisions list remains visible (noDivisionMessage does NOT block the list).
        if (scope === 'division' && !this.divisionId) {
          this.noDivisionMessage = true;
          // Load all divisions anyway — user can still select
          this.loadUsers();
        } else {
          this.noDivisionMessage = false;
          this.loadUsers();
        }
        this.cdr.markForCheck();
      })
    );

    // React to search changes — client-side filter
    this.subs.add(
      this.searchCtrl.valueChanges.subscribe(q => {
        this.applySearch(q ?? '');
      })
    );

    this.loadUsers();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  private loadUsers(): void {
    this.loading          = true;
    this.loadError        = '';
    this.divisionEmptyMessage = '';
    this.allRows          = [];
    this.filteredRows     = [];
    this.blockedRowId     = null;
    this.cdr.markForCheck();

    const scope = this.scopeCtrl.value as UserPickerScope;
    const params: Record<string, unknown> = {};
    // D-299: use division_id only when scope is 'division' AND a divisionId is available.
    if (scope === 'division' && this.divisionId) {
      params['division_id'] = this.divisionId;
    }
    // D-299: if scope is 'division' but no divisionId, load all users (show inform message separately).

    this.mcp.call<User[]>('division', 'list_users', params).subscribe({
      next: (res) => {
        if (!res.success) {
          this.loadError = res.error ?? 'Failed to load users.';
          this.loading   = false;
          this.cdr.markForCheck();
          return;
        }
        // Filter by role client-side — D-182: "This Division" loads small scoped list.
        // Contract 19 (D-394): boolean flag predicate replaces system_role equality.
        //   A user with is_admin = true AND is_dcs = true appears in BOTH DCS and Admin
        //   role views — multi-role membership is the explicit intent.
        // Contract 29: allUsers mode bypasses the role-flag filter entirely.
        const roleFlag = userRoleToFlag(this.userRole);
        const users = (res.data ?? []).filter(u =>
          !u.deleted_at && (this.allUsers || u[roleFlag] === true)
        );
        // B-13 fix: distinguish empty result from error. When scope is 'division' and
        // MCP succeeded but no users of this role exist in the Division, show plain message.
        // Previous behavior: any non-result showed generic "Network error" message. Source: D-297.
        if (users.length === 0 && scope === 'division' && this.divisionId) {
          this.divisionEmptyMessage =
            `No ${this.roleLabel}s found in this Division.`;
        }
        // Sort: active first alphabetically, inactive at bottom
        users.sort((a, b) => {
          if (a.is_active !== b.is_active) { return a.is_active ? -1 : 1; }
          return (a.display_name || '').localeCompare(b.display_name || '');
        });
        this.allRows = users.map(u => ({
          ...u,
          initials:      nameInitials(u.display_name || ''),
          avatarColor:   avatarColorFromName(u.display_name || ''),
          isSelectable:  !!u.is_active,
          blockedReason: u.is_active ? null : `${u.display_name} is inactive. Only active users can be assigned.`
        }));
        // Restore pre-selection if present
        if (this.selectedUserId) {
          this.selectedRow = this.allRows.find(r => r.id === this.selectedUserId) ?? null;
        }
        this.loading = false;
        this.applySearch(this.searchCtrl.value ?? '');
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        // B-13 fix: genuine network/server errors show the server error message when available.
        this.loadError = err?.error ?? 'Network error loading users. Try again.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private applySearch(query: string): void {
    const q = query.trim().toLowerCase();
    this.filteredRows = q
      ? this.allRows.filter(r => (r.display_name || '').toLowerCase().includes(q))
      : [...this.allRows];
    this.cdr.markForCheck();
  }

  onRowClick(row: UserPickerRow): void {
    if (!row.isSelectable) {
      // Show inline blocked message per D-182
      this.blockedRowId = this.blockedRowId === row.id ? null : row.id;
      this.cdr.markForCheck();
      return;
    }
    this.blockedRowId  = null;
    this.selectedUserId = row.id;
    this.selectedRow   = row;
    this.cdr.markForCheck();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('up-overlay')) {
      this.cancel();
    }
  }

  cancel(): void { this.userSelected.emit(null); }

  confirm(): void {
    if (!this.selectedRow?.isSelectable) { return; }
    this.userSelected.emit(this.selectedRow as User);
  }

  // ── D-420 — Admin inline + Add User ────────────────────────────────────────

  openCreateOverlay(): void {
    this.createOverlayOpen = true;
    this.cdr.markForCheck();
  }

  onCreateCancelled(): void {
    this.createOverlayOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * On successful invite: close overlay, reload picker list, pre-select the new user
   * so the existing selectedRow lookup picks it up after loadUsers finishes.
   * D-421 no-Division warning surfaces on the User View panel next time the
   * admin opens the user in User Management — Division assignment is not part of
   * the picker-side mini-form.
   */
  onUserCreated(newUser: User): void {
    this.createOverlayOpen = false;
    this.selectedUserId    = newUser.id;
    this.loadUsers();
  }
}
