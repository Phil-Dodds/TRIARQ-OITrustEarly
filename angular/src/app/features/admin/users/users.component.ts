// users.component.ts — Admin User Management
// Contract 21 (2026-06-09): standard grid+filter+right-panel pattern per
//   D-410, D-411, D-412, S-005, S-010, S-011, S-012, S-016, S-018, S-019.
//   - Role tab strip retired.
//   - Filter panel: Role (multi-select), Division (drill-in), Active Status.
//   - Active filter chips below header.
//   - Tap user row → right panel in View state (S-018). Edit button → Edit
//     state in same slot (S-019). + Add User → Create state in same slot
//     (S-016).
//   - Assign Divisions, Resend invite — surfaced in View/Edit panels only.
//
// Inactive Division handling per S-032: Division picker (Assign Divisions
// in View panel; Divisions field on Create) excludes inactive Divisions
// from the selectable set.
//
// Outlook paste-parse on the Email field (D-412): pasting
// "Display Name <email@domain.com>" fills Name and Email together.
//
// D-93:  McpService only — no direct Supabase access.
// D-135: Membership in a Trust grants downward-inherited access to all child
//        Divisions (enforced server-side by get_user_divisions).
// D-140: Blocked action UX on all errors.
// D-178: Three-tier loading standard — skeleton rows, button spinners, panel overlay.
// D-394: Boolean role flags (is_admin / is_dcs / is_epo / is_dol / is_ce).
// D-411: division_summary is pre-computed server-side per row.

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
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../../core/services/mcp.service';
import { UserProfileService }          from '../../../core/services/user-profile.service';
import { AuthService }                 from '../../../core/services/auth.service';
import {
  ScreenStateService,
  SCREEN_KEYS
}                                       from '../../../core/services/screen-state.service';
import { BlockedActionComponent }      from '../../../shared/components/blocked-action/blocked-action.component';
import { LoadingOverlayComponent }     from '../../../shared/components/loading-overlay/loading-overlay.component';
import { User, Division }              from '../../../core/types/database';
import {
  ALL_ROLE_FLAGS,
  ROLE_FLAG_ABBREVIATIONS,
  ROLE_FLAG_DISPLAY_NAMES,
  RoleFlag
} from '../../../core/constants/roles';

type ActiveRoleFlag = RoleFlag;

type PanelMode = 'view' | 'edit' | 'create' | null;
type ActiveFilter = 'all' | 'active' | 'inactive';
type DivisionFilterMode = 'mine' | 'all' | 'single';

/** get_user_divisions response shape */
interface UserDivisionsData {
  user_id:                    string;
  display_name:               string;
  directly_assigned_divisions: Division[];
  all_accessible_divisions:   (Division & { access_type: 'direct' | 'inherited' })[];
}

interface FilterState {
  roleFlags:        ActiveRoleFlag[];
  divisionMode:     DivisionFilterMode;
  divisionId:       string | null;
  activeStatus:     ActiveFilter;
}

const DEFAULT_FILTER: FilterState = {
  roleFlags:    [],
  divisionMode: 'mine',
  divisionId:   null,
  activeStatus: 'all'
};

/**
 * Form-level validator: at least one role flag must be true (D-394).
 */
function atLeastOneRoleValidator(group: AbstractControl): ValidationErrors | null {
  const v = group.value as Record<string, unknown>;
  const any =
    v['is_admin'] === true ||
    v['is_dcs']   === true ||
    v['is_epo']   === true ||
    v['is_dol']   === true ||
    v['is_ce']    === true;
  return any ? null : { noRoleSelected: true };
}

@Component({
  selector: 'app-users',
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
    .um-page{padding:var(--triarq-space-lg);max-width:1200px;margin:0 auto}
    .um-header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--triarq-space-md);margin-bottom:var(--triarq-space-sm)}
    .um-header h2{margin:0}
    .um-desc{font-size:11px;font-style:italic;color:#5A5A5A;margin-top:4px}
    .um-toolbar{display:flex;align-items:center;gap:var(--triarq-space-sm);margin-bottom:var(--triarq-space-sm);flex-wrap:wrap}
    .um-chip-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--triarq-space-sm)}
    .um-grid{border:1px solid var(--triarq-color-border);border-radius:10px;background:#fff;overflow:hidden}
    .um-row{display:grid;grid-template-columns:2fr 2fr 1.4fr .9fr 1.3fr;gap:var(--triarq-space-sm);padding:var(--triarq-space-sm) var(--triarq-space-md);border-bottom:1px solid var(--triarq-color-border);align-items:center;font-size:13px}
    .um-header-row{font-weight:500;color:var(--triarq-color-text-secondary);background:var(--triarq-color-background-subtle);border-bottom:2px solid var(--triarq-color-border)}
    .um-data:hover{background:#fafbfc;cursor:pointer}
    .um-data.um-selected{background:#eef6fb}
    .um-name-cell{display:flex;flex-direction:column;gap:2px}
    .um-name{font-weight:500;color:var(--triarq-color-text-primary)}
    .um-subline{font-size:11px;color:var(--triarq-color-text-secondary)}
    .um-no-div{font-style:italic}
    .um-pill{display:inline-flex;align-items:center;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:500;line-height:1.4}
    .um-role-pills{display:flex;flex-wrap:wrap;gap:4px}
    .um-empty{padding:var(--triarq-space-lg);text-align:center;color:var(--triarq-color-text-secondary);font-size:13px}
    .um-role-checkboxes{display:flex;flex-wrap:wrap;gap:6px}
    .um-role-check{display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;padding:6px 10px;border:1px solid var(--triarq-color-border);border-radius:5px;background:#fff;user-select:none}
    .um-div-chip{display:inline-flex;align-items:center;gap:6px;background:var(--triarq-color-primary);color:#fff;border-radius:999px;padding:4px 12px;font-size:12px;margin:0 6px 6px 0}
    .um-div-chip .um-x{background:none;border:none;color:#fff;cursor:pointer;font-size:14px;line-height:1;padding:0}
  `],
  template: `
    <div class="um-page">

      <!-- Header (S-005) ─────────────────────────────────────────────────── -->
      <div class="um-header">
        <div>
          <h2>User Management</h2>
          <div class="um-desc">Admin and Phil only. Tap a row to view details.</div>
        </div>
        <button class="oi-btn-primary" (click)="openCreate()">+ Add User</button>
      </div>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Toolbar (filters + count) ─────────────────────────────────────── -->
      <div class="um-toolbar">
        <button class="oi-btn-secondary" (click)="openFilterPanel()">
          Filters{{ activeFilterCount > 0 ? ' (' + activeFilterCount + ')' : '' }}
        </button>
        <span class="oi-filter-row-val" *ngIf="!loading">
          {{ filteredUsers.length }} of {{ users.length }} user{{ users.length === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Active filter chips (S-012) ───────────────────────────────────── -->
      <div class="um-chip-bar" *ngIf="activeFilterChips.length > 0">
        <span class="oi-filter-chip" *ngFor="let chip of activeFilterChips">
          {{ chip.label }}
          <button (click)="removeFilterChip(chip.id)" aria-label="Remove filter">×</button>
        </span>
      </div>

      <!-- Snackbars / errors ────────────────────────────────────────────── -->
      <div *ngIf="successMsg"
           style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;
                  padding:8px 12px;margin-bottom:var(--triarq-space-sm);
                  font-size:12px;color:#2e7d32;">
        {{ successMsg }}
      </div>

      <!-- Loading skeleton (D-178 Tier 1) ───────────────────────────────── -->
      <div class="um-grid" *ngIf="loading">
        <div class="um-row um-header-row">
          <span>Name</span><span>Email</span><span>Role</span>
          <span>Active</span><span>Invite</span>
        </div>
        <div class="um-row" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:18px;border-radius:999px;width:80px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:18px;border-radius:999px;width:50px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Grid (D-196: header always rendered) ──────────────────────────── -->
      <div class="um-grid" *ngIf="!loading && users.length > 0">
        <div class="um-row um-header-row">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Active</span>
          <span>Invite</span>
        </div>

        <div
          class="um-row um-data"
          *ngFor="let user of filteredUsers"
          [class.um-selected]="selectedUserId === user.id && panelMode !== 'create'"
          (click)="openView(user)"
        >
          <span class="um-name-cell">
            <span class="um-name">{{ user.display_name }}</span>
            <span class="um-subline"
                  *ngIf="user.division_summary && user.division_count && user.division_count > 0"
                  [title]="(user.division_names ?? []).join(', ')"
            >{{ user.division_summary }}</span>
            <span class="um-subline um-no-div"
                  *ngIf="!user.division_count || user.division_count === 0"
            >No Division</span>
          </span>
          <span style="color:var(--triarq-color-text-secondary);">{{ user.email }}</span>
          <span class="um-role-pills">
            <ng-container *ngIf="userFlags(user).length > 0; else noRoles">
              <span class="um-pill"
                    *ngFor="let flag of userFlags(user)"
                    [style.background]="flagPillBg(flag)"
                    [style.color]="flagPillColor(flag)">
                {{ flagAbbrev(flag) }}
              </span>
            </ng-container>
            <ng-template #noRoles>
              <span class="um-pill"
                    style="background:var(--triarq-color-background-subtle);
                           color:var(--triarq-color-text-secondary);">No role</span>
            </ng-template>
          </span>
          <span>
            <span class="um-pill"
                  [style.background]="user.is_active
                    ? 'var(--triarq-color-background-subtle)'
                    : 'var(--triarq-color-error-light,#fdecea)'"
                  [style.color]="user.is_active
                    ? 'var(--triarq-color-text-secondary)'
                    : 'var(--triarq-color-error)'">
              {{ user.is_active ? 'Active' : 'Inactive' }}
            </span>
          </span>
          <span>
            <span class="um-pill"
                  *ngIf="!user.is_active || inviteStatusFor(user.id) !== 'active'"
                  [style.background]="inviteBadgeBg(inviteStatusFor(user.id))"
                  [style.color]="inviteBadgeColor(inviteStatusFor(user.id))">
              {{ inviteBadgeLabel(inviteStatusFor(user.id)) }}
            </span>
          </span>
        </div>
      </div>

      <!-- Empty / zero-results state ────────────────────────────────────── -->
      <div class="um-empty" *ngIf="!loading && users.length === 0 && !blockedMessage">
        No users found. Use "+ Add User" to add the first user.
      </div>
      <div class="um-empty" *ngIf="!loading && users.length > 0 && filteredUsers.length === 0">
        No users match the current filters.
      </div>

      <!-- Filter panel (S-010/S-011) ─────────────────────────────────────── -->
      <div class="oi-scrim oi-scrim-filter" *ngIf="filterPanelOpen" (click)="closeFilterPanel()"></div>
      <div class="oi-side-panel oi-side-filter" *ngIf="filterPanelOpen" role="dialog" aria-modal="true">
        <div class="oi-side-head">
          <strong>Filters</strong>
          <button style="background:none;border:none;cursor:pointer;font-size:18px;"
                  (click)="closeFilterPanel()" aria-label="Close filter panel">✕</button>
        </div>
        <div class="oi-side-body">

          <!-- Role (S-013 drill-in) -->
          <div class="oi-filter-row">
            <div class="oi-filter-row-head" (click)="toggleFilterRow('role')">
              <span class="oi-filter-row-name">Role</span>
              <span class="oi-filter-row-val">{{ pendingRoleSummary }}</span>
            </div>
            <div class="oi-filter-row-body" *ngIf="expandedFilterRow === 'role'">
              <label class="um-role-check" *ngFor="let flag of ALL_ROLE_FLAGS"
                     style="margin: 0 6px 6px 0;">
                <input type="checkbox"
                       [checked]="pendingFilters.roleFlags.includes(flag)"
                       (change)="togglePendingRole(flag)" />
                <span>{{ flagAbbrev(flag) }} — {{ flagDisplay(flag) }}</span>
              </label>
            </div>
          </div>

          <!-- Division (S-013 drill-in) -->
          <div class="oi-filter-row">
            <div class="oi-filter-row-head" (click)="toggleFilterRow('division')">
              <span class="oi-filter-row-name">Division</span>
              <span class="oi-filter-row-val">{{ pendingDivisionSummary }}</span>
            </div>
            <div class="oi-filter-row-body" *ngIf="expandedFilterRow === 'division'">
              <label class="oi-picker-row">
                <input type="radio" name="divMode"
                       [checked]="pendingFilters.divisionMode === 'mine'"
                       (change)="setPendingDivisionMode('mine')" />
                <span>My Divisions</span>
              </label>
              <label class="oi-picker-row">
                <input type="radio" name="divMode"
                       [checked]="pendingFilters.divisionMode === 'all'"
                       (change)="setPendingDivisionMode('all')" />
                <span>All Divisions</span>
              </label>
              <label class="oi-picker-row">
                <input type="radio" name="divMode"
                       [checked]="pendingFilters.divisionMode === 'single'"
                       (change)="setPendingDivisionMode('single')" />
                <span>Select Division</span>
              </label>
              <div *ngIf="pendingFilters.divisionMode === 'single'" style="margin-top: var(--triarq-space-sm);">
                <select class="oi-input"
                        [value]="pendingFilters.divisionId || ''"
                        (change)="setPendingDivisionId($event)">
                  <option value="">— Choose a Division —</option>
                  <option *ngFor="let div of allDivisions" [value]="div.id">
                    {{ div.division_name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Active Status (S-013 drill-in) -->
          <div class="oi-filter-row">
            <div class="oi-filter-row-head" (click)="toggleFilterRow('active')">
              <span class="oi-filter-row-name">Active Status</span>
              <span class="oi-filter-row-val">{{ pendingActiveSummary }}</span>
            </div>
            <div class="oi-filter-row-body" *ngIf="expandedFilterRow === 'active'">
              <label class="oi-picker-row">
                <input type="radio" name="activeStatus"
                       [checked]="pendingFilters.activeStatus === 'all'"
                       (change)="setPendingActiveStatus('all')" />
                <span>All</span>
              </label>
              <label class="oi-picker-row">
                <input type="radio" name="activeStatus"
                       [checked]="pendingFilters.activeStatus === 'active'"
                       (change)="setPendingActiveStatus('active')" />
                <span>Active only</span>
              </label>
              <label class="oi-picker-row">
                <input type="radio" name="activeStatus"
                       [checked]="pendingFilters.activeStatus === 'inactive'"
                       (change)="setPendingActiveStatus('inactive')" />
                <span>Inactive only</span>
              </label>
            </div>
          </div>

        </div>
        <div class="oi-side-foot">
          <button class="oi-btn-secondary" (click)="clearPendingFilters()">Clear all</button>
          <button class="oi-btn-primary" (click)="applyFilters()">Apply filters</button>
        </div>
      </div>

      <!-- Right panel — Create / View / Edit ─────────────────────────────── -->
      <ng-container *ngIf="panelMode">
        <!-- Scrim: present for Edit and Create (modal) per S-017; absent for View. -->
        <div class="oi-scrim oi-scrim-detail"
             *ngIf="panelMode === 'edit' || panelMode === 'create'"
             (click)="onScrimClick()"></div>

        <div class="oi-side-panel oi-side-detail" role="dialog" aria-modal="true" aria-label="User detail">
          <app-loading-overlay [visible]="panelOverlayBusy" [message]="panelOverlayMessage"></app-loading-overlay>

          <!-- ========================= CREATE ========================= -->
          <ng-container *ngIf="panelMode === 'create'">
            <div class="oi-side-head">
              <strong>New User</strong>
              <button style="background:none;border:none;cursor:pointer;font-size:18px;"
                      (click)="onScrimClick()" aria-label="Close">✕</button>
            </div>
            <div class="oi-side-body">
              <form [formGroup]="inviteForm" (ngSubmit)="submitInvite()">
                <div class="oi-field-row">
                  <label class="oi-field-label">Email Address *</label>
                  <input formControlName="email" type="email" class="oi-input"
                         placeholder="user@triarqhealth.com"
                         (paste)="onEmailPaste($event)" />
                  <div class="oi-hint">
                    Tip: paste directly from Outlook — e.g.
                    <em>Philip Dodds &lt;pdodds&#64;triarqhealth.com&gt;</em>.
                    Name and email will be parsed automatically.
                  </div>
                  <div class="oi-err"
                       *ngIf="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched">
                    Valid email is required.
                  </div>
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Name *</label>
                  <input formControlName="display_name" class="oi-input" placeholder="First Last" />
                  <div class="oi-err"
                       *ngIf="inviteForm.get('display_name')?.invalid && inviteForm.get('display_name')?.touched">
                    Name is required.
                  </div>
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Roles * (one or more)</label>
                  <div class="um-role-checkboxes" [formGroup]="inviteForm">
                    <label class="um-role-check" *ngFor="let flag of ALL_ROLE_FLAGS">
                      <input type="checkbox" [formControlName]="flag" />
                      <span>{{ flagAbbrev(flag) }} — {{ flagDisplay(flag) }}</span>
                    </label>
                  </div>
                  <div class="oi-err"
                       *ngIf="inviteForm.errors?.['noRoleSelected'] && inviteForm.touched">
                    Select at least one role.
                  </div>
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Divisions (optional)</label>
                  <div class="oi-zone-explain">Inactive Divisions are excluded.</div>
                  <div style="max-height:160px;overflow-y:auto;border:1px solid var(--triarq-color-border);
                              border-radius:5px; padding: 4px; margin-top: 6px;">
                    <label class="oi-picker-row" *ngFor="let div of selectableDivisions">
                      <span>
                        <input type="checkbox"
                               [checked]="createDivisionIds.includes(div.id)"
                               (change)="toggleCreateDivision(div.id)" />
                        {{ div.division_name }}
                      </span>
                    </label>
                    <div *ngIf="selectableDivisions.length === 0"
                         style="padding: 6px; font-size: 12px; color: var(--triarq-color-text-secondary);">
                      No active Divisions available.
                    </div>
                  </div>
                </div>
                <div class="oi-err" *ngIf="inviteError">{{ inviteError }}</div>
              </form>
            </div>
            <div class="oi-side-foot oi-side-foot-split">
              <button class="oi-btn-secondary" (click)="onScrimClick()">Cancel</button>
              <button class="oi-btn-primary"
                      [disabled]="inviteForm.invalid || inviting"
                      (click)="submitInvite()">
                {{ inviting ? 'Creating…' : 'Create User' }}
              </button>
            </div>
          </ng-container>

          <!-- ========================= VIEW ========================= -->
          <ng-container *ngIf="panelMode === 'view' && selectedUser">
            <div class="oi-side-head">
              <div style="display:flex;flex-direction:column;gap:2px;">
                <strong>{{ selectedUser.display_name }}</strong>
                <span style="font-size:12px;color:var(--triarq-color-text-secondary);">
                  {{ selectedUser.email }}
                </span>
              </div>
              <button style="background:none;border:none;cursor:pointer;font-size:18px;"
                      (click)="closePanel()" aria-label="Close">✕</button>
            </div>
            <div class="oi-side-body">

              <!-- Identity zone -->
              <div class="oi-zone">
                <div class="oi-zone-title">Identity</div>
                <div class="oi-field-row">
                  <span class="um-pill"
                        [style.background]="selectedUser.is_active
                          ? 'var(--triarq-color-background-subtle)'
                          : 'var(--triarq-color-error-light,#fdecea)'"
                        [style.color]="selectedUser.is_active
                          ? 'var(--triarq-color-text-secondary)'
                          : 'var(--triarq-color-error)'">
                    {{ selectedUser.is_active ? 'Active' : 'Inactive' }}
                  </span>
                  <span style="display:inline-flex;flex-wrap:wrap;gap:4px;margin-left:8px;">
                    <span class="um-pill"
                          *ngFor="let flag of userFlags(selectedUser)"
                          [style.background]="flagPillBg(flag)"
                          [style.color]="flagPillColor(flag)">
                      {{ flagAbbrev(flag) }}
                    </span>
                  </span>
                </div>
              </div>

              <!-- Divisions zone -->
              <div class="oi-zone">
                <div class="oi-zone-title">Divisions</div>
                <div *ngIf="loadingMemberships" style="font-size:12px;color:var(--triarq-color-text-secondary);">
                  Loading…
                </div>
                <div *ngIf="!loadingMemberships">
                  <div *ngIf="userDirectDivisions.length === 0"
                       class="oi-zone-explain">
                    No Divisions assigned.
                  </div>
                  <div *ngIf="userDirectDivisions.length > 0" style="margin-bottom: 6px;">
                    <span class="um-div-chip" *ngFor="let div of userDirectDivisions">
                      {{ div.division_name }}
                      <button class="um-x"
                              (click)="revokeAssignment(div.id)"
                              [disabled]="revokingDivisionId === div.id"
                              title="Remove">×</button>
                    </span>
                  </div>
                  <button class="oi-btn-secondary"
                          (click)="toggleAssignPicker()"
                          style="margin-top: 6px;">
                    {{ assignPickerOpen ? 'Close picker' : 'Assign Divisions' }}
                  </button>
                  <div *ngIf="assignPickerOpen"
                       style="margin-top: 8px; max-height: 220px; overflow-y: auto;
                              border:1px solid var(--triarq-color-border); border-radius: 5px;
                              padding: 4px;">
                    <label class="oi-picker-row" *ngFor="let div of selectableDivisions">
                      <span>
                        <input type="checkbox"
                               [checked]="isAssigned(div.id)"
                               (change)="onPickerToggle(div.id, !isAssigned(div.id))" />
                        {{ div.division_name }}
                      </span>
                      <span class="oi-filter-row-val" *ngIf="div.division_level !== undefined">
                        L{{ div.division_level }}
                      </span>
                    </label>
                    <div *ngIf="selectableDivisions.length === 0"
                         class="oi-zone-explain" style="padding: 6px;">
                      No active Divisions available.
                    </div>
                  </div>
                  <div class="oi-err" *ngIf="assignError">{{ assignError }}</div>
                </div>
              </div>

              <!-- Invite zone (only when not Active) -->
              <div class="oi-zone" *ngIf="inviteStatusFor(selectedUser.id) !== 'active'">
                <div class="oi-zone-title">Invite</div>
                <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
                  <span class="um-pill"
                        [style.background]="inviteBadgeBg(inviteStatusFor(selectedUser.id))"
                        [style.color]="inviteBadgeColor(inviteStatusFor(selectedUser.id))">
                    {{ inviteBadgeLabel(inviteStatusFor(selectedUser.id)) }}
                  </span>
                  <button class="oi-btn-secondary"
                          (click)="resendInvite(selectedUser.id)"
                          [disabled]="resendingUserId === selectedUser.id">
                    {{ resendingUserId === selectedUser.id ? 'Sending…' : 'Resend' }}
                  </button>
                </div>
                <div class="oi-err" *ngIf="resendError">{{ resendError }}</div>
              </div>

            </div>
            <div class="oi-side-foot oi-side-foot-split">
              <span></span>
              <button class="oi-btn-primary" (click)="startEdit()">Edit</button>
            </div>
          </ng-container>

          <!-- ========================= EDIT ========================= -->
          <ng-container *ngIf="panelMode === 'edit' && selectedUser">
            <div class="oi-side-head">
              <strong>Edit User</strong>
              <button style="background:none;border:none;cursor:pointer;font-size:18px;"
                      (click)="onScrimClick()" aria-label="Close">✕</button>
            </div>
            <div class="oi-side-body">
              <form [formGroup]="editForm" (ngSubmit)="submitEdit()">
                <div class="oi-field-row">
                  <label class="oi-field-label">Name *</label>
                  <input formControlName="display_name" class="oi-input" />
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Email Address *</label>
                  <input formControlName="email" type="email" class="oi-input" />
                  <div class="oi-err" *ngIf="emailFieldInvalid">Enter a valid email address.</div>
                  <div class="oi-err" *ngIf="emailDuplicateError">That email address is already in use.</div>
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Status</label>
                  <select formControlName="is_active" class="oi-input">
                    <option [ngValue]="true">Active</option>
                    <option [ngValue]="false">Inactive</option>
                  </select>
                </div>
                <div class="oi-field-row">
                  <label class="oi-field-label">Roles * (one or more)</label>
                  <div class="um-role-checkboxes" [formGroup]="editForm">
                    <label class="um-role-check" *ngFor="let flag of ALL_ROLE_FLAGS">
                      <input type="checkbox" [formControlName]="flag" />
                      <span>{{ flagAbbrev(flag) }} — {{ flagDisplay(flag) }}</span>
                    </label>
                  </div>
                  <div class="oi-err"
                       *ngIf="editForm.errors?.['noRoleSelected'] && editForm.touched">
                    Select at least one role.
                  </div>
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
export class UsersComponent implements OnInit {

  // ── User list state ────────────────────────────────────────────────────────
  users:           User[] = [];
  loading          = false;
  blockedMessage   = '';
  blockedHint      = '';
  successMsg       = '';

  // ── Invite status state (D-248) ────────────────────────────────────────────
  inviteStatusMap: Map<string, string> = new Map();
  resendingUserId: string | null = null;
  resendError      = '';

  // ── Filter state (D-171 / D-370 / D-380) ───────────────────────────────────
  filters: FilterState        = { ...DEFAULT_FILTER };
  pendingFilters: FilterState = { ...DEFAULT_FILTER };
  filterPanelOpen = false;
  expandedFilterRow: 'role' | 'division' | 'active' | null = null;

  // Cached lists for filtering
  allDivisions: Division[]      = [];
  myDivisionIds: Set<string>    = new Set();
  divisionsLoaded               = false;

  // ── Panel state (S-018/S-019/S-016) ────────────────────────────────────────
  panelMode: PanelMode          = null;
  selectedUserId: string | null = null;
  selectedUser: User | null     = null;

  // Forms
  inviteForm!:     FormGroup;
  editForm!:       FormGroup;
  inviting         = false;
  inviteError      = '';
  saving           = false;
  editError        = '';
  emailDuplicateError = false;
  editingUserOriginalEmail = '';

  // Division assignment state (within View panel)
  userDirectDivisions: Division[] = [];
  loadingMemberships  = false;
  assigning           = false;
  revokingDivisionId: string | null = null;
  assignError         = '';
  assignPickerOpen    = false;

  // Create state
  createDivisionIds: string[] = [];

  // Template-accessible constants.
  readonly ALL_ROLE_FLAGS = ALL_ROLE_FLAGS;
  readonly skeletonRows   = [1, 2, 3, 4, 5];

  constructor(
    private readonly mcp:         McpService,
    private readonly profile:     UserProfileService,
    private readonly auth:        AuthService,
    private readonly screenState: ScreenStateService,
    private readonly fb:          FormBuilder,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      email:        ['', [Validators.required, Validators.email]],
      display_name: ['', Validators.required],
      is_admin:     [false],
      is_dcs:       [false],
      is_epo:       [false],
      is_dol:       [false],
      is_ce:        [false]
    }, { validators: atLeastOneRoleValidator });

    this.editForm = this.fb.group({
      display_name: ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],
      is_active:    [true],
      is_admin:     [false],
      is_dcs:       [false],
      is_epo:       [false],
      is_dol:       [false],
      is_ce:        [false]
    }, { validators: atLeastOneRoleValidator });

    this.loadUsers();
    this.loadDivisionsOnce();
    this.restoreScreenState();
  }

  // ── ESC closes open overlay (S-017) ────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.panelMode) { this.onScrimClick(); return; }
    if (this.filterPanelOpen) { this.closeFilterPanel(); }
  }

  // ── Screen-state persistence ───────────────────────────────────────────────
  private async restoreScreenState(): Promise<void> {
    const saved = await this.screenState.restore(SCREEN_KEYS.ADMIN_USERS);
    if (!saved) { return; }
    const f = saved.filter_state as Partial<FilterState> | null;
    if (f && typeof f === 'object') {
      const valid = (flag: unknown): flag is ActiveRoleFlag =>
        (ALL_ROLE_FLAGS as readonly string[]).includes(flag as string);
      const roles = Array.isArray(f.roleFlags)
        ? f.roleFlags.filter(valid) as ActiveRoleFlag[]
        : [];
      const mode: DivisionFilterMode =
        f.divisionMode === 'all' || f.divisionMode === 'single' || f.divisionMode === 'mine'
          ? f.divisionMode : 'mine';
      const status: ActiveFilter =
        f.activeStatus === 'active' || f.activeStatus === 'inactive' || f.activeStatus === 'all'
          ? f.activeStatus : 'all';
      this.filters = {
        roleFlags:    roles,
        divisionMode: mode,
        divisionId:   typeof f.divisionId === 'string' ? f.divisionId : null,
        activeStatus: status
      };
      this.pendingFilters = { ...this.filters, roleFlags: [...roles] };
      this.cdr.markForCheck();
    }
  }

  private saveScreenState(): void {
    this.screenState.save(SCREEN_KEYS.ADMIN_USERS, this.filters as unknown as Record<string, unknown>, {});
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  private loadUsers(): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp.call<User[]>('division', 'list_users', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users = Array.isArray(res.data) ? res.data : [];
          this.loadInviteStatuses();
        } else {
          this.setBlocked(
            res.error ?? 'Could not load users.',
            'Ensure you have admin access and your session is active.'
          );
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.setBlocked(
          err.error ?? 'Could not load users.',
          'Ensure you have admin access and your session is active.'
        );
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadInviteStatuses(): void {
    this.mcp.call<Array<{ user_id: string; invite_status: string }>>(
      'division', 'get_user_invite_statuses', {}
    ).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          const map = new Map<string, string>();
          for (const entry of res.data) {
            map.set(entry.user_id, entry.invite_status);
          }
          this.inviteStatusMap = map;
          this.cdr.markForCheck();
        }
      },
      error: () => { /* non-fatal */ }
    });
  }

  /** Load all Divisions (active + inactive) once. Inactive used only when
   *  surfacing the existing membership — pickers filter to active. */
  private loadDivisionsOnce(): void {
    if (this.divisionsLoaded) { return; }
    this.mcp.call<Division[]>('division', 'list_divisions', {
      all_levels: true,
      include_inactive: true
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.allDivisions = Array.isArray(res.data) ? res.data : [];
          this.divisionsLoaded = true;
          this.cdr.markForCheck();
        }
      },
      error: () => { /* non-fatal */ }
    });

    // Also resolve the caller's accessible divisions for "My Divisions" filter mode.
    const callerId = this.profile.getCurrentProfile()?.id ?? this.auth.getCurrentUser()?.id;
    if (callerId) {
      this.mcp.call<UserDivisionsData>('division', 'get_user_divisions', { user_id: callerId })
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.myDivisionIds = new Set(
                (res.data.all_accessible_divisions ?? []).map(d => d.id)
              );
              this.cdr.markForCheck();
            }
          },
          error: () => { /* non-fatal */ }
        });
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  get filteredUsers(): User[] {
    return this.users.filter(u => this.matches(u));
  }

  private matches(user: User): boolean {
    const f = this.filters;
    if (f.roleFlags.length > 0) {
      const ok = f.roleFlags.some(flag => user[flag] === true);
      if (!ok) { return false; }
    }
    if (f.activeStatus === 'active' && !user.is_active) { return false; }
    if (f.activeStatus === 'inactive' && user.is_active) { return false; }
    if (f.divisionMode === 'single' && f.divisionId) {
      const names = user.division_names ?? [];
      const target = this.allDivisions.find(d => d.id === f.divisionId);
      if (!target || !names.includes(target.division_name)) { return false; }
    }
    if (f.divisionMode === 'mine' && this.myDivisionIds.size > 0) {
      const myNames = new Set(
        this.allDivisions
          .filter(d => this.myDivisionIds.has(d.id))
          .map(d => d.division_name)
      );
      const names = user.division_names ?? [];
      if (myNames.size > 0 && !names.some(n => myNames.has(n))) { return false; }
    }
    return true;
  }

  // ── Filter chip rendering ──────────────────────────────────────────────────
  get activeFilterCount(): number { return this.activeFilterChips.length; }

  get activeFilterChips(): { id: string; label: string }[] {
    const out: { id: string; label: string }[] = [];
    for (const flag of this.filters.roleFlags) {
      out.push({ id: `role:${flag}`, label: `Role: ${flagAbbrevFor(flag)}` });
    }
    if (this.filters.divisionMode === 'all') {
      out.push({ id: 'division:all', label: 'Division: All' });
    } else if (this.filters.divisionMode === 'single' && this.filters.divisionId) {
      const d = this.allDivisions.find(x => x.id === this.filters.divisionId);
      out.push({ id: 'division:single', label: `Division: ${d ? d.division_name : 'Selected'}` });
    }
    if (this.filters.activeStatus !== 'all') {
      out.push({
        id: `active:${this.filters.activeStatus}`,
        label: `Active: ${this.filters.activeStatus === 'active' ? 'Active' : 'Inactive'}`
      });
    }
    return out;
  }

  removeFilterChip(id: string): void {
    if (id.startsWith('role:')) {
      const flag = id.slice('role:'.length) as ActiveRoleFlag;
      this.filters = {
        ...this.filters,
        roleFlags: this.filters.roleFlags.filter(f => f !== flag)
      };
    } else if (id === 'division:all' || id === 'division:single') {
      this.filters = { ...this.filters, divisionMode: 'mine', divisionId: null };
    } else if (id.startsWith('active:')) {
      this.filters = { ...this.filters, activeStatus: 'all' };
    }
    this.pendingFilters = { ...this.filters, roleFlags: [...this.filters.roleFlags] };
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  // ── Filter panel ───────────────────────────────────────────────────────────
  openFilterPanel(): void {
    this.pendingFilters = { ...this.filters, roleFlags: [...this.filters.roleFlags] };
    this.expandedFilterRow = null;
    this.filterPanelOpen = true;
    this.cdr.markForCheck();
  }

  closeFilterPanel(): void {
    this.filterPanelOpen = false;
    this.expandedFilterRow = null;
    this.cdr.markForCheck();
  }

  toggleFilterRow(row: 'role' | 'division' | 'active'): void {
    this.expandedFilterRow = this.expandedFilterRow === row ? null : row;
    this.cdr.markForCheck();
  }

  togglePendingRole(flag: ActiveRoleFlag): void {
    const has = this.pendingFilters.roleFlags.includes(flag);
    this.pendingFilters = {
      ...this.pendingFilters,
      roleFlags: has
        ? this.pendingFilters.roleFlags.filter(f => f !== flag)
        : [...this.pendingFilters.roleFlags, flag]
    };
    this.cdr.markForCheck();
  }

  setPendingDivisionMode(mode: DivisionFilterMode): void {
    this.pendingFilters = {
      ...this.pendingFilters,
      divisionMode: mode,
      divisionId: mode === 'single' ? this.pendingFilters.divisionId : null
    };
    this.cdr.markForCheck();
  }

  setPendingDivisionId(ev: Event): void {
    const value = (ev.target as HTMLSelectElement).value || null;
    this.pendingFilters = { ...this.pendingFilters, divisionId: value };
    this.cdr.markForCheck();
  }

  setPendingActiveStatus(value: ActiveFilter): void {
    this.pendingFilters = { ...this.pendingFilters, activeStatus: value };
    this.cdr.markForCheck();
  }

  get pendingRoleSummary(): string {
    if (this.pendingFilters.roleFlags.length === 0) { return 'All'; }
    return this.pendingFilters.roleFlags.map(flagAbbrevFor).join(', ');
  }

  get pendingDivisionSummary(): string {
    const f = this.pendingFilters;
    if (f.divisionMode === 'mine') { return 'My Divisions'; }
    if (f.divisionMode === 'all')  { return 'All'; }
    if (f.divisionId) {
      const d = this.allDivisions.find(x => x.id === f.divisionId);
      return d ? d.division_name : 'Single';
    }
    return 'Single — none selected';
  }

  get pendingActiveSummary(): string {
    const s = this.pendingFilters.activeStatus;
    return s === 'all' ? 'All' : s === 'active' ? 'Active only' : 'Inactive only';
  }

  applyFilters(): void {
    this.filters = { ...this.pendingFilters, roleFlags: [...this.pendingFilters.roleFlags] };
    this.saveScreenState();
    this.closeFilterPanel();
  }

  clearPendingFilters(): void {
    this.pendingFilters = { ...DEFAULT_FILTER, roleFlags: [] };
    this.expandedFilterRow = null;
    this.cdr.markForCheck();
  }

  // ── Panel open / close (S-018 / S-019 / S-016) ─────────────────────────────
  openView(user: User): void {
    this.selectedUser   = user;
    this.selectedUserId = user.id;
    this.panelMode      = 'view';
    this.assignPickerOpen = false;
    this.assignError    = '';
    this.userDirectDivisions = [];
    this.loadMemberships(user.id);
    this.cdr.markForCheck();
  }

  startEdit(): void {
    if (!this.selectedUser) { return; }
    const u = this.selectedUser;
    this.editingUserOriginalEmail = u.email;
    this.editError = '';
    this.emailDuplicateError = false;
    this.editForm.setValue({
      display_name: u.display_name,
      email:        u.email,
      is_active:    u.is_active,
      is_admin:     u.is_admin === true,
      is_dcs:       u.is_dcs   === true,
      is_epo:       u.is_epo   === true,
      is_dol:       u.is_dol   === true,
      is_ce:        u.is_ce    === true
    });
    this.panelMode = 'edit';
    this.cdr.markForCheck();
  }

  openCreate(): void {
    this.inviteForm.reset({
      email: '', display_name: '',
      is_admin: false, is_dcs: false, is_epo: false, is_dol: false, is_ce: false
    });
    this.inviteError = '';
    this.createDivisionIds = [];
    this.selectedUser = null;
    this.selectedUserId = null;
    this.panelMode = 'create';
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode = null;
    this.selectedUser = null;
    this.selectedUserId = null;
    this.assignPickerOpen = false;
    this.userDirectDivisions = [];
    this.cdr.markForCheck();
  }

  /** S-017 dirty-state check on scrim/ESC for Edit and Create. */
  onScrimClick(): void {
    if (this.panelMode === 'edit') {
      if (this.editForm.dirty) {
        if (!confirm('Discard unsaved changes?')) { return; }
      }
      // Return to View if we have a selected user, otherwise close fully.
      if (this.selectedUser) {
        this.panelMode = 'view';
      } else {
        this.closePanel();
      }
      this.cdr.markForCheck();
      return;
    }
    if (this.panelMode === 'create') {
      if (this.inviteForm.dirty || this.createDivisionIds.length > 0) {
        if (!confirm('Discard unsaved changes?')) { return; }
      }
      this.closePanel();
      return;
    }
    // View mode — just close.
    this.closePanel();
  }

  // ── View panel — memberships ───────────────────────────────────────────────
  private loadMemberships(userId: string): void {
    this.loadingMemberships = true;
    this.cdr.markForCheck();
    this.mcp.call<UserDivisionsData>('division', 'get_user_divisions', { user_id: userId })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.userDirectDivisions = res.data.directly_assigned_divisions ?? [];
          } else {
            this.assignError = res.error ?? 'Could not load Division assignments.';
          }
          this.loadingMemberships = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.assignError = err.error ?? 'Could not load Division assignments.';
          this.loadingMemberships = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleAssignPicker(): void {
    this.assignPickerOpen = !this.assignPickerOpen;
    this.assignError = '';
    this.cdr.markForCheck();
  }

  /** Divisions selectable in pickers — excludes inactive per S-032. */
  get selectableDivisions(): Division[] {
    return this.allDivisions.filter(d => (d as { active_status?: boolean }).active_status !== false);
  }

  isAssigned(divisionId: string): boolean {
    return this.userDirectDivisions.some(d => d.id === divisionId);
  }

  onPickerToggle(divisionId: string, shouldAssign: boolean): void {
    if (!this.selectedUserId) { return; }
    const userId = this.selectedUserId;
    this.assignError = '';
    this.cdr.markForCheck();

    if (shouldAssign) {
      this.mcp.call<unknown>('division', 'assign_user_to_division', {
        user_id: userId, division_id: divisionId
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadMemberships(userId);
            this.loadUsers();  // refresh division_summary on grid
          } else {
            this.assignError = res.error ?? 'Assignment failed.';
          }
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.assignError = err.error ?? 'Assignment failed.';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.revokeAssignment(divisionId);
    }
  }

  revokeAssignment(divisionId: string): void {
    if (!this.selectedUserId) { return; }
    const userId = this.selectedUserId;
    this.revokingDivisionId = divisionId;
    this.assignError = '';
    this.cdr.markForCheck();

    this.mcp.call<unknown>('division', 'revoke_division_membership', {
      user_id: userId, division_id: divisionId
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadMemberships(userId);
          this.loadUsers();
        } else {
          this.assignError = res.error ?? 'Remove failed.';
        }
        this.revokingDivisionId = null;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.assignError = err.error ?? 'Remove failed.';
        this.revokingDivisionId = null;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Create form ────────────────────────────────────────────────────────────
  toggleCreateDivision(id: string): void {
    if (this.createDivisionIds.includes(id)) {
      this.createDivisionIds = this.createDivisionIds.filter(x => x !== id);
    } else {
      this.createDivisionIds = [...this.createDivisionIds, id];
    }
    this.cdr.markForCheck();
  }

  /** D-412: Outlook paste-parse. */
  onEmailPaste(ev: ClipboardEvent): void {
    const raw = ev.clipboardData?.getData('text') ?? '';
    const match = raw.match(/^\s*([^<]+?)\s*<\s*([^>\s]+)\s*>\s*$/);
    if (!match) { return; }
    ev.preventDefault();
    const displayName = match[1].trim();
    const emailValue  = match[2].trim();
    this.inviteForm.patchValue({
      display_name: this.inviteForm.value.display_name || displayName,
      email:        emailValue
    });
    this.cdr.markForCheck();
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.inviting    = true;
    this.inviteError = '';
    this.cdr.markForCheck();

    const v = this.inviteForm.value as Record<string, unknown>;
    this.mcp.call<User>('division', 'submit_member_invite', {
      email:        v['email']        as string,
      display_name: v['display_name'] as string,
      is_admin:     v['is_admin'] === true,
      is_dcs:       v['is_dcs']   === true,
      is_epo:       v['is_epo']   === true,
      is_dol:       v['is_dol']   === true,
      is_ce:        v['is_ce']    === true,
      division_ids: this.createDivisionIds.length > 0 ? [...this.createDivisionIds] : undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMsg = (res as { message?: string }).message
            ?? `User invited. Invite email sent to ${v['email']}.`;
          this.closePanel();
          this.loadUsers();
          setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000);
        } else {
          this.inviteError = res.error ?? 'Create failed.';
        }
        this.inviting = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.inviteError = err.error ?? 'Create failed.';
        this.inviting    = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Edit save ──────────────────────────────────────────────────────────────
  get emailFieldInvalid(): boolean {
    const c = this.editForm?.get('email');
    return !!(c?.invalid && c?.touched);
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.selectedUserId) { return; }
    this.saving = true;
    this.editError = '';
    this.emailDuplicateError = false;
    this.cdr.markForCheck();

    const userId      = this.selectedUserId;
    const newEmail    = (this.editForm.value.email as string).trim().toLowerCase();
    const emailChanged = newEmail !== this.editingUserOriginalEmail.toLowerCase();

    const updateOtherFields = (): void => {
      const v = this.editForm.value as Record<string, unknown>;
      this.mcp.call<User>('division', 'update_user', {
        user_id: userId,
        updates: {
          display_name: v['display_name'] as string,
          is_active:    v['is_active']    as boolean,
          is_admin:     v['is_admin'] === true,
          is_dcs:       v['is_dcs']   === true,
          is_epo:       v['is_epo']   === true,
          is_dol:       v['is_dol']   === true,
          is_ce:        v['is_ce']    === true
        }
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMsg = 'User updated.';
            setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000);
            // Reload and return to View state.
            this.loadUsers();
            const refreshed = this.users.find(u => u.id === userId);
            if (refreshed) {
              this.selectedUser = refreshed;
              this.loadMemberships(userId);
            }
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
          this.saving    = false;
          this.cdr.markForCheck();
        }
      });
    };

    if (!emailChanged) { updateOtherFields(); return; }

    this.mcp.call<User>('division', 'update_user_email', {
      user_id: userId,
      new_email: newEmail
    }).subscribe({
      next: (res) => {
        if (res.success) {
          updateOtherFields();
        } else {
          const msg = res.error ?? 'Could not update email.';
          if (/already.*in use/i.test(msg)) {
            this.emailDuplicateError = true;
          } else {
            this.editError = msg;
          }
          this.saving = false;
          this.cdr.markForCheck();
        }
      },
      error: (err: { error?: string }) => {
        const msg = err.error ?? 'Could not update email.';
        if (/already.*in use/i.test(msg)) {
          this.emailDuplicateError = true;
        } else {
          this.editError = msg;
        }
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Invite ─────────────────────────────────────────────────────────────────
  resendInvite(userId: string): void {
    this.resendingUserId = userId;
    this.resendError = '';
    this.cdr.markForCheck();

    this.mcp.call<{ message?: string }>('division', 'resend_invite', { user_id: userId })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMsg = (res.data as { message?: string })?.message ?? 'Invitation resent.';
            setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000);
            this.loadInviteStatuses();
          } else {
            this.resendError = res.error ?? 'Could not resend invitation.';
          }
          this.resendingUserId = null;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.resendError = err.error ?? 'Could not resend invitation.';
          this.resendingUserId = null;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Invite status badges (D-248 / D-354) ───────────────────────────────────
  inviteStatusFor(userId: string): string {
    return this.inviteStatusMap.get(userId) ?? 'not_yet_invited';
  }

  inviteBadgeBg(status: string): string {
    if (status === 'active')          return '#e8f5e9';
    if (status === 'invited')         return '#fff8e1';
    if (status === 'expired')         return '#fdecea';
    if (status === 'not_yet_invited') return 'var(--triarq-color-background-subtle)';
    return 'transparent';
  }
  inviteBadgeColor(status: string): string {
    if (status === 'active')          return '#2e7d32';
    if (status === 'invited')         return '#f57f17';
    if (status === 'expired')         return 'var(--triarq-color-error)';
    if (status === 'not_yet_invited') return 'var(--triarq-color-text-secondary)';
    return 'transparent';
  }
  inviteBadgeLabel(status: string): string {
    if (status === 'active')          return 'Active';
    if (status === 'invited')         return 'Invited — awaiting code';
    if (status === 'expired')         return 'Invite expired';
    if (status === 'not_yet_invited') return 'Not Yet Invited';
    return '';
  }

  // ── Panel overlay (D-178 Tier 3) ───────────────────────────────────────────
  get panelOverlayBusy(): boolean {
    return this.saving || this.inviting || this.assigning || this.revokingDivisionId !== null;
  }
  get panelOverlayMessage(): string {
    if (this.saving)               { return 'Saving…'; }
    if (this.inviting)             { return 'Creating User…'; }
    if (this.assigning)            { return 'Assigning…'; }
    if (this.revokingDivisionId)   { return 'Removing…'; }
    return '';
  }

  // ── Role pill helpers ──────────────────────────────────────────────────────
  private static readonly FLAG_PILL_BG: Record<ActiveRoleFlag, string> = {
    is_admin: '#e3f2fd',
    is_dcs:   '#f3e5f5',
    is_epo:   '#e8f5e9',
    is_dol:   '#fde7e9',
    is_ce:    '#fff3e0'
  };
  private static readonly FLAG_PILL_COLOR: Record<ActiveRoleFlag, string> = {
    is_admin: '#1565c0',
    is_dcs:   '#6a1b9a',
    is_epo:   '#2e7d32',
    is_dol:   '#c2185b',
    is_ce:    '#e65100'
  };

  flagPillBg(flag: ActiveRoleFlag): string    { return UsersComponent.FLAG_PILL_BG[flag];    }
  flagPillColor(flag: ActiveRoleFlag): string { return UsersComponent.FLAG_PILL_COLOR[flag]; }
  flagAbbrev(flag: ActiveRoleFlag): string    { return ROLE_FLAG_ABBREVIATIONS[flag]; }
  flagDisplay(flag: ActiveRoleFlag): string   { return ROLE_FLAG_DISPLAY_NAMES[flag]; }

  userFlags(user: User): ActiveRoleFlag[] {
    return ALL_ROLE_FLAGS.filter(f => user[f] === true);
  }

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}

// Free helper used inside chip rendering — keeps ROLE_FLAG_ABBREVIATIONS lookups
// out of inline template expressions per OnPush template purity.
function flagAbbrevFor(flag: ActiveRoleFlag): string {
  return ROLE_FLAG_ABBREVIATIONS[flag];
}
