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
  OnInit,
  ViewChild
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
import { UserCreateFormComponent }     from '../../../shared/components/user-create-form/user-create-form.component';
import { DivisionTreePickerComponent } from '../../../shared/pickers/division-tree-picker/division-tree-picker.component';
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
// D-410 Amend 2: 'no-assigned' = users with zero division_memberships rows.
type DivisionFilterMode = 'all' | 'no-assigned' | 'mine' | 'single';

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

// D-410 Amend 1: Division filter default = All on User Management (admin surface).
// Filter memory per D-171 wins after first visit.
const DEFAULT_FILTER: FilterState = {
  roleFlags:    [],
  divisionMode: 'all',
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
    LoadingOverlayComponent,
    UserCreateFormComponent,
    DivisionTreePickerComponent
  ],
  styles: [`
    :host{display:block}
    .um-page{padding:var(--triarq-space-lg);max-width:1200px;margin:0 auto}
    .um-header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--triarq-space-md);margin-bottom:var(--triarq-space-sm)}
    .um-header h2{margin:0}
    .um-desc{font-size:11px;font-style:italic;color:#5A5A5A;margin-top:4px}
    .um-toolbar{display:flex;align-items:center;gap:var(--triarq-space-sm);margin-bottom:var(--triarq-space-sm);flex-wrap:wrap}
    .um-chip-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--triarq-space-sm)}
    /* Grid container — Initiative grid look. Header is sticky Deep Navy uppercase. */
    .um-grid{border:1px solid var(--triarq-color-border);border-radius:6px;background:#fff;overflow:hidden}
    /* D-422: 6 columns — Name | Email | Role | Active | Last Login | Invite. */
    .um-row{display:grid;grid-template-columns:2fr 2fr 1.4fr .9fr 1.1fr 1.1fr;gap:var(--triarq-space-sm);padding:6px var(--triarq-space-md);border-bottom:1px solid #E8E8E8;align-items:center;font-size:13px;border-left:3px solid transparent}
    /* Header row — matches Initiative grid: Deep Navy bg, white uppercase, sticky. */
    .um-header-row{font-weight:500;color:#fff;background:#12274A;text-transform:uppercase;letter-spacing:0.3px;font-size:13px;padding:8px var(--triarq-space-md);position:sticky;top:0;z-index:3;border-left:none;border-bottom:none}
    .um-data:hover{background:#F0F4F8;cursor:pointer}
    .um-data.um-selected{background:#E8F0FE;border-left:3px solid var(--triarq-color-primary,#257099)}
    .um-name-cell{display:flex;flex-direction:column;gap:1px;min-width:0}
    .um-name{font-weight:500;color:var(--triarq-color-text-primary)}
    .um-subline{font-size:11px;color:#5A5A5A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .um-no-div{font-style:italic}
    .um-pill{display:inline-flex;align-items:center;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:500;line-height:1.4}
    .um-role-pills{display:flex;flex-wrap:wrap;gap:4px}
    .um-empty{padding:var(--triarq-space-lg);text-align:center;color:var(--triarq-color-text-secondary);font-size:13px}
    .um-role-checkboxes{display:flex;flex-wrap:wrap;gap:6px}
    .um-role-check{display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;padding:6px 10px;border:1px solid var(--triarq-color-border);border-radius:5px;background:#fff;user-select:none}
    .um-div-chip{display:inline-flex;align-items:center;gap:6px;background:var(--triarq-color-primary);color:#fff;border-radius:999px;padding:4px 12px;font-size:12px;margin:0 6px 6px 0}
    .um-div-chip .um-x{background:none;border:none;color:#fff;cursor:pointer;font-size:14px;line-height:1;padding:0}
    /* D-421 / D-200 Pattern 2 — amber warning band for missing Division assignment. */
    .um-warn-band{display:flex;gap:8px;background:rgba(243,150,30,0.08);border-left:3px solid var(--triarq-color-sunray,#F3961E);padding:8px 10px;border-radius:5px;margin-bottom:8px;align-items:flex-start}
    .um-warn-icon{color:#F3961E;font-size:14px;line-height:1.4;flex-shrink:0}
    .um-warn-primary{font-size:13px;font-weight:500;color:var(--triarq-color-text-primary);margin-bottom:2px}
    .um-warn-secondary{font-size:12px;color:#5A5A5A;line-height:1.4}
    .um-warn-action{background:none;border:none;color:#257099;cursor:pointer;font-size:12px;font-weight:500;padding:4px 0 0 0;text-align:left}
    .um-warn-action:hover{text-decoration:underline}
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
          <span>User Name</span><span>Email</span><span>Roles</span>
          <span>Active Status</span><span>Last Login</span><span>Invite Status</span>
        </div>
        <div class="um-row" *ngFor="let _ of skeletonRows">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:18px;border-radius:999px;width:80px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:18px;border-radius:999px;width:50px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Grid (D-196: header always rendered) ──────────────────────────── -->
      <div class="um-grid" *ngIf="!loading && users.length > 0">
        <div class="um-row um-header-row">
          <span>User Name</span>
          <span>Email</span>
          <span>Roles</span>
          <span>Active Status</span>
          <!-- D-422: Last Login is sortable. Tap header toggles sort on/off; on = desc. -->
          <span (click)="toggleLastLoginSort()"
                style="cursor:pointer;user-select:none;"
                [title]="sortByLastLogin ? 'Sorted by Last Login (most recent first). Tap to clear.' : 'Tap to sort by Last Login (most recent first).'">
            Last Login{{ sortByLastLogin ? ' ▼' : '' }}
          </span>
          <span>Invite Status</span>
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
          <!-- D-422: Last Login — relative time, ISO tooltip, "Never logged in" stone italic. -->
          <span>
            <span *ngIf="user.last_login_at"
                  [title]="user.last_login_at"
                  style="color:#5A5A5A;">
              {{ relativeFromNow(user.last_login_at) }}
            </span>
            <span *ngIf="!user.last_login_at"
                  style="color:#5A5A5A;font-style:italic;">
              Never logged in
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
              <!-- D-410 Amend 1+2: order is All (default), No Division Assigned, My Divisions, Select single. -->
              <label class="oi-picker-row">
                <input type="radio" name="divMode"
                       [checked]="pendingFilters.divisionMode === 'all'"
                       (change)="setPendingDivisionMode('all')" />
                <span>All</span>
              </label>
              <label class="oi-picker-row">
                <input type="radio" name="divMode"
                       [checked]="pendingFilters.divisionMode === 'no-assigned'"
                       (change)="setPendingDivisionMode('no-assigned')" />
                <span>No Division Assigned</span>
              </label>
              <label class="oi-picker-row">
                <input type="radio" name="divMode"
                       [checked]="pendingFilters.divisionMode === 'mine'"
                       (change)="setPendingDivisionMode('mine')" />
                <span>My Divisions</span>
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
              <!-- S-007 — shared Create form component, reused by D-420 picker inline Add User. -->
              <app-user-create-form
                [allDivisions]="allDivisions"
                (userCreated)="onUserCreated($event)"
                (cancelled)="onScrimClick()">
              </app-user-create-form>
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

              <!-- Divisions zone — D-417: hierarchical tree picker replaces flat list.
                   Chips remain read-only — management happens in the modal tree picker. -->
              <div class="oi-zone">
                <div class="oi-zone-title">Divisions</div>
                <div *ngIf="loadingMemberships" style="font-size:12px;color:var(--triarq-color-text-secondary);">
                  Loading…
                </div>
                <div *ngIf="!loadingMemberships">
                  <!-- D-421: D-200 Pattern 2 warning when user has zero Division assignments. -->
                  <div *ngIf="userDirectDivisions.length === 0" class="um-warn-band">
                    <span class="um-warn-icon">⚠</span>
                    <div>
                      <div class="um-warn-primary">No Division assigned.</div>
                      <div class="um-warn-secondary">
                        This user will not appear in Division-scoped views or Initiative
                        pickers until a Division is assigned.
                      </div>
                      <button type="button" class="um-warn-action"
                              (click)="openTreePicker()"
                              [disabled]="treePickerBusy">
                        Assign Division →
                      </button>
                    </div>
                  </div>
                  <div *ngIf="userDirectDivisions.length > 0" style="margin-bottom: 6px;">
                    <span class="um-div-chip" *ngFor="let div of userDirectDivisions">
                      {{ div.division_name }}
                    </span>
                  </div>
                  <button class="oi-btn-secondary"
                          *ngIf="userDirectDivisions.length > 0"
                          (click)="openTreePicker()"
                          [disabled]="treePickerBusy"
                          style="margin-top: 6px;">
                    {{ treePickerBusy ? 'Saving…' : 'Assign Divisions' }}
                  </button>
                  <div class="oi-err" *ngIf="assignError">{{ assignError }}</div>
                </div>
              </div>

              <!-- D-422 Login Activity zone — below Roles/Divisions, above Invite -->
              <div class="oi-zone">
                <div class="oi-zone-title">Login Activity</div>
                <div style="display:grid;grid-template-columns:120px 1fr;gap:6px 12px;font-size:12px;">
                  <span style="color:var(--triarq-color-text-secondary);">Last Login</span>
                  <span *ngIf="selectedUser.last_login_at"
                        [title]="selectedUser.last_login_at"
                        style="color:var(--triarq-color-text-primary);">
                    {{ formatDateTime(selectedUser.last_login_at) }}
                    <span style="color:#5A5A5A;">({{ relativeFromNow(selectedUser.last_login_at) }})</span>
                  </span>
                  <span *ngIf="!selectedUser.last_login_at"
                        style="color:#5A5A5A;font-style:italic;">Never logged in</span>

                  <span style="color:var(--triarq-color-text-secondary);">Account Created</span>
                  <span style="color:var(--triarq-color-text-primary);"
                        [title]="selectedUser.created_at">
                    {{ formatDateTime(selectedUser.created_at) }}
                  </span>

                  <span style="color:var(--triarq-color-text-secondary);">Invite Status</span>
                  <span>
                    <span class="um-pill"
                          [style.background]="inviteBadgeBg(inviteStatusFor(selectedUser.id))"
                          [style.color]="inviteBadgeColor(inviteStatusFor(selectedUser.id))">
                      {{ inviteBadgeLabel(inviteStatusFor(selectedUser.id)) }}
                    </span>
                  </span>
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

      <!-- D-417 — Division Assignment hierarchical tree picker modal -->
      <app-division-tree-picker
        *ngIf="treePickerOpen"
        [allDivisions]="allDivisions"
        [currentlyAssignedIds]="currentlyAssignedDivisionIds"
        (confirmed)="onTreePickerConfirmed($event)"
        (cancelled)="onTreePickerCancelled()">
      </app-division-tree-picker>

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

  // Forms — Create form moved to shared UserCreateFormComponent (D-420 reuse). Edit stays inline.
  editForm!:       FormGroup;
  saving           = false;
  editError        = '';
  emailDuplicateError = false;
  editingUserOriginalEmail = '';
  /** ViewChild for the shared Create form — used for S-017 dirty-state check on scrim close. */
  @ViewChild(UserCreateFormComponent) private userCreateForm?: UserCreateFormComponent;

  // Division assignment state (within View panel)
  userDirectDivisions: Division[] = [];
  loadingMemberships  = false;
  assignError         = '';
  treePickerOpen      = false;   // D-417 hierarchical tree picker modal
  treePickerBusy      = false;   // batch MCP diff in flight

  // D-422 — Last Login sort. Off = alphabetical by display_name (server default).
  // Tap column header → on, sorts by last_login_at desc with nulls last.
  sortByLastLogin     = false;

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
        f.divisionMode === 'all' || f.divisionMode === 'single'
        || f.divisionMode === 'mine' || f.divisionMode === 'no-assigned'
          ? f.divisionMode : 'all';
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
    const list = this.users.filter(u => this.matches(u));
    if (!this.sortByLastLogin) { return list; }
    // D-422: descending by last_login_at, nulls last (never-logged-in users go to bottom).
    return [...list].sort((a, b) => {
      const av = a.last_login_at ?? null;
      const bv = b.last_login_at ?? null;
      if (av && bv) { return bv.localeCompare(av); }
      if (av) { return -1; }
      if (bv) { return 1; }
      return (a.display_name || '').localeCompare(b.display_name || '');
    });
  }

  toggleLastLoginSort(): void {
    this.sortByLastLogin = !this.sortByLastLogin;
    this.cdr.markForCheck();
  }

  /** D-422 relative time formatter — coarse buckets, no external lib. */
  relativeFromNow(iso: string | null | undefined): string {
    if (!iso) { return ''; }
    const t = Date.parse(iso);
    if (Number.isNaN(t)) { return ''; }
    const diffMs = Date.now() - t;
    if (diffMs < 0) { return 'just now'; }
    const min = Math.floor(diffMs / 60000);
    if (min < 1)     { return 'just now'; }
    if (min < 60)    { return `${min} minute${min === 1 ? '' : 's'} ago`; }
    const hr = Math.floor(min / 60);
    if (hr  < 24)    { return `${hr} hour${hr  === 1 ? '' : 's'} ago`; }
    const day = Math.floor(hr / 24);
    if (day < 7)     { return `${day} day${day === 1 ? '' : 's'} ago`; }
    if (day < 30)    { return `${Math.floor(day / 7)} week${Math.floor(day / 7) === 1 ? '' : 's'} ago`; }
    if (day < 365)   { return `${Math.floor(day / 30)} month${Math.floor(day / 30) === 1 ? '' : 's'} ago`; }
    return `${Math.floor(day / 365)} year${Math.floor(day / 365) === 1 ? '' : 's'} ago`;
  }

  /** D-422 zone date formatter — locale short datetime, e.g. "Jun 11, 2026, 3:42 PM". */
  formatDateTime(iso: string | null | undefined): string {
    if (!iso) { return ''; }
    const t = Date.parse(iso);
    if (Number.isNaN(t)) { return ''; }
    return new Date(t).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
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
    // D-410 Amend 2: 'no-assigned' — only users with zero Division memberships.
    if (f.divisionMode === 'no-assigned') {
      const count = user.division_count ?? (user.division_names?.length ?? 0);
      if (count > 0) { return false; }
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
      // 'all' is the default — no chip needed since it's the default behavior.
    } else if (this.filters.divisionMode === 'no-assigned') {
      out.push({ id: 'division:no-assigned', label: 'Division: None assigned' });
    } else if (this.filters.divisionMode === 'mine') {
      out.push({ id: 'division:mine', label: 'Division: My Divisions' });
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
    } else if (id === 'division:all' || id === 'division:single'
            || id === 'division:no-assigned' || id === 'division:mine') {
      // D-410 Amend 1: removing any non-default division chip returns to default 'all'.
      this.filters = { ...this.filters, divisionMode: 'all', divisionId: null };
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
    if (f.divisionMode === 'all')          { return 'All'; }
    if (f.divisionMode === 'no-assigned')  { return 'None assigned'; }
    if (f.divisionMode === 'mine')         { return 'My Divisions'; }
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
    this.assignError    = '';
    this.userDirectDivisions = [];
    this.currentlyAssignedDivisionIds = [];
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
    this.selectedUser = null;
    this.selectedUserId = null;
    this.panelMode = 'create';
    this.cdr.markForCheck();
  }

  /** Called by UserCreateFormComponent on successful invite. Loaded user
   *  transitions panel to View state so the D-421 no-Division warning lands. */
  onUserCreated(newUser: User): void {
    this.successMsg = `User invited. Invite email sent to ${newUser.email}.`;
    this.loadUsers();
    // Switch to View on the new user so D-421 warning fires inline if no Division.
    this.selectedUser = newUser;
    this.selectedUserId = newUser.id;
    this.userDirectDivisions = [];
    this.currentlyAssignedDivisionIds = [];
    this.loadMemberships(newUser.id);
    this.panelMode = 'view';
    setTimeout(() => { this.successMsg = ''; this.cdr.markForCheck(); }, 4000);
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode = null;
    this.selectedUser = null;
    this.selectedUserId = null;
    this.userDirectDivisions = [];
    this.currentlyAssignedDivisionIds = [];
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
      if (this.userCreateForm?.isDirty) {
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
            // Refresh the cached ID array only when memberships actually change.
            this.currentlyAssignedDivisionIds =
              this.userDirectDivisions.map(d => d.id);
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

  // ── D-417 hierarchical tree picker integration ─────────────────────────────
  // Per-row assign/revoke (flat picker) retired; D-417 tree picker batch diff is the
  // single management entry point. revokeAssignment / onPickerToggle removed.

  // Cached IDs — refreshed only when memberships actually change. Using a
  // getter that maps userDirectDivisions on every CD pass returned a new
  // array reference each time, which thrashed the picker's ngOnChanges and
  // wiped in-progress selections (Contract 22.1 picker thrash bug).
  currentlyAssignedDivisionIds: string[] = [];

  openTreePicker(): void {
    this.assignError = '';
    this.treePickerOpen = true;
    this.cdr.markForCheck();
  }

  onTreePickerCancelled(): void {
    this.treePickerOpen = false;
    this.cdr.markForCheck();
  }

  onTreePickerConfirmed(diff: { toAdd: string[]; toRemove: string[] }): void {
    this.treePickerOpen = false;
    if (!this.selectedUserId) { return; }
    if (diff.toAdd.length === 0 && diff.toRemove.length === 0) {
      this.cdr.markForCheck();
      return;
    }

    const userId = this.selectedUserId;
    type Op = { tool: 'assign_user_to_division' | 'revoke_division_membership'; divisionId: string };
    const ops: Op[] = [
      ...diff.toAdd.map((id): Op    => ({ tool: 'assign_user_to_division',     divisionId: id })),
      ...diff.toRemove.map((id): Op => ({ tool: 'revoke_division_membership',  divisionId: id })),
    ];

    this.treePickerBusy = true;
    this.assignError    = '';
    this.cdr.markForCheck();
    this.runDivisionOpsSequentially(userId, ops, 0);
  }

  /** Sequential MCP calls for batched division assignment changes per D-417. */
  private runDivisionOpsSequentially(
    userId: string,
    ops: { tool: 'assign_user_to_division' | 'revoke_division_membership'; divisionId: string }[],
    index: number
  ): void {
    if (index >= ops.length) {
      this.treePickerBusy = false;
      this.loadMemberships(userId);
      this.loadUsers();
      this.cdr.markForCheck();
      return;
    }
    const op = ops[index];
    this.mcp.call<unknown>('division', op.tool, {
      user_id: userId, division_id: op.divisionId
    }).subscribe({
      next: (res) => {
        if (!res.success) {
          this.assignError = res.error ?? 'Division change failed.';
          this.treePickerBusy = false;
          this.loadMemberships(userId);
          this.loadUsers();
          this.cdr.markForCheck();
          return;
        }
        this.runDivisionOpsSequentially(userId, ops, index + 1);
      },
      error: (err: { error?: string }) => {
        this.assignError = err.error ?? 'Division change failed.';
        this.treePickerBusy = false;
        this.loadMemberships(userId);
        this.loadUsers();
        this.cdr.markForCheck();
      }
    });
  }

  // Create form mechanics moved to shared UserCreateFormComponent (S-007, D-420 reuse).
  // Parent retains: openCreate(), onUserCreated(), onScrimClick() dirty-state check
  // delegated to ViewChild's isDirty getter.

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
  // Inviting is owned by the shared UserCreateFormComponent; it shows its own busy state.
  // Tree picker batch operations show busy via treePickerBusy on the Assign Divisions button.
  get panelOverlayBusy(): boolean {
    return this.saving;
  }
  get panelOverlayMessage(): string {
    if (this.saving) { return 'Saving…'; }
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
