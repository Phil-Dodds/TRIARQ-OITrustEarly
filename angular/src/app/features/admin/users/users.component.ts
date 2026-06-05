// users.component.ts — Admin User Management
// Build A: User creation, role management, Division membership view.
// Acceptance criteria: users created, assigned to Divisions, role-aware home confirmed.
// Roles: admin + phil (route protected by authGuard).
// D-93:  McpService only — no direct Supabase access.
// D-135: Trust-level assignment gives downward-inherited access to all child Divisions.
// D-139: Only 'phil' role can set allow_both_admin_and_functional_roles = true.
// D-140: Blocked action UX on all errors.
//
// NOTE: Sort by last login is not implemented — last_login_at is not in the
// current schema. Requires schema addition before that column can be sorted.
//
// NOTE: Division assignment picker shows Trusts only (level 0). Trust membership
// grants inherited access to all child Service Lines and Functions (D-135).
// D-178: Three-tier loading standard applied — Tier 1 skeleton, Tier 2 button spinners, Tier 3 overlays.

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

// Alias retained for readability in this surface — RoleFlag now covers exactly the
// five active flags (is_phil was retired post-migration 034).
type ActiveRoleFlag = RoleFlag;

/** get_user_divisions response shape */
interface UserDivisionsData {
  user_id:                    string;
  display_name:               string;
  directly_assigned_divisions: Division[];
  all_accessible_divisions:   (Division & { access_type: 'direct' | 'inherited' })[];
}

/**
 * Contract 19 (Part 1e): form-level validator. The boolean role-flag checkboxes
 * are independent controls; at least one must be true for the form to be valid.
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
  template: `
    <div class="oi-card" style="max-width:960px;margin:var(--triarq-space-2xl) auto;">

      <!-- Header ────────────────────────────────────────────────────────── -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);">
        <h3 style="margin:0;">User Management</h3>
        <button
          class="oi-btn-primary"
          (click)="toggleInviteForm()"
          style="font-size:var(--triarq-text-small);"
        >{{ showInviteForm ? 'Cancel' : '+ Add User' }}</button>
      </div>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Add user form (D-178 Tier 3: section overlay) ─────────────────── -->
      <div *ngIf="showInviteForm" style="position:relative;">
        <app-loading-overlay [visible]="inviting" message="Creating User…"></app-loading-overlay>
        <div
          style="background:var(--triarq-color-background-subtle);
                 border-radius:8px;padding:var(--triarq-space-md);
                 margin-bottom:var(--triarq-space-md);"
        >
          <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
            Add New User
          </h4>
          <form [formGroup]="inviteForm" (ngSubmit)="submitInvite()">
            <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:1fr 1fr;">
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Email Address *
                </label>
                <!-- Contract 19 (Part 1e): paste-parse "Display Name <email@domain.com>" on this field.
                     When the pasted value matches that pattern, email + display_name are filled together. -->
                <input
                  formControlName="email"
                  type="email"
                  class="oi-input"
                  placeholder="user@triarqhealth.com"
                  (paste)="onEmailPaste($event)"
                />
                <div
                  *ngIf="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched"
                  style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
                >Valid email is required.</div>
              </div>
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Display Name *
                </label>
                <input
                  formControlName="display_name"
                  class="oi-input"
                  placeholder="First Last"
                />
                <div
                  *ngIf="inviteForm.get('display_name')?.invalid && inviteForm.get('display_name')?.touched"
                  style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
                >Display name is required.</div>
              </div>
            </div>

            <!-- Contract 19 (Part 1e): role checkboxes — one per flag. At least one must be selected. -->
            <div style="margin-top:var(--triarq-space-sm);">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Roles *
              </label>
              <div style="display:flex;flex-wrap:wrap;gap:var(--triarq-space-sm);" [formGroup]="inviteForm">
                <label *ngFor="let flag of ALL_ROLE_FLAGS"
                       style="display:inline-flex;align-items:center;gap:6px;
                              font-size:var(--triarq-text-small);cursor:pointer;
                              padding:6px 12px;border:1px solid var(--triarq-color-border);
                              border-radius:5px;background:#fff;user-select:none;">
                  <input type="checkbox" [formControlName]="flag" />
                  <span>{{ flagAbbrev(flag) }} — {{ flagDisplay(flag) }}</span>
                </label>
              </div>
              <div *ngIf="inviteForm.errors?.['noRoleSelected'] && inviteForm.touched"
                   style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
                Select at least one role.
              </div>
            </div>
            <div style="margin-top:var(--triarq-space-sm);display:flex;gap:var(--triarq-space-sm);align-items:center;">
              <!-- D-178 Tier 2: button spinner while creating user -->
              <button type="submit" class="oi-btn-primary" [disabled]="inviteForm.invalid || inviting">
                <ion-spinner *ngIf="inviting" name="crescent"
                             style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
                </ion-spinner>
                {{ inviting ? 'Creating…' : 'Create User' }}
              </button>
              <span
                *ngIf="inviteError"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);"
              >{{ inviteError }}</span>
              <span
                *ngIf="inviteSuccess"
                style="color:var(--triarq-color-success,#2e7d32);font-size:var(--triarq-text-small);"
              >{{ inviteSuccessMsg }}</span>
            </div>
          </form>
        </div>
      </div>

      <!-- Resend feedback (D-140 / D-248) ──────────────────────────────────── -->
      <div *ngIf="resendSuccessMsg"
           style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;
                  padding:8px 12px;margin-bottom:var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);color:#2e7d32;">
        {{ resendSuccessMsg }}
      </div>
      <!-- Edit success snackbar (D-354 §4) ─────────────────────────────────── -->
      <div *ngIf="editSuccessMsg"
           style="background:#e8f5e9;border:1px solid #81c784;border-radius:8px;
                  padding:8px 12px;margin-bottom:var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);color:#2e7d32;">
        {{ editSuccessMsg }}
      </div>
      <div *ngIf="resendError"
           style="background:#fff3f3;border:1px solid #f5a0a0;border-radius:8px;
                  padding:8px 12px;margin-bottom:var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);color:#c0392b;">
        {{ resendError }}
      </div>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr 90px 130px;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:999px;width:50px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:999px;width:60px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:999px;width:60px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Filter / Sort bar ─────────────────────────────────────────────── -->
      <div
        *ngIf="!loading && users.length > 0"
        style="display:flex;gap:var(--triarq-space-xs);flex-wrap:wrap;
               margin-bottom:var(--triarq-space-sm);align-items:center;"
      >
        <span style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                     margin-right:4px;">Role:</span>
        <!-- B-53: tabs generated dynamically from roles present in user list. Contract 10 §7 B-53. -->
        <span
          *ngFor="let f of visibleRoleFilters"
          class="oi-pill"
          (click)="setRoleFilter(f.value)"
          [style.background]="roleFilter === f.value
            ? 'var(--triarq-color-primary)'
            : 'var(--triarq-color-background-subtle)'"
          [style.color]="roleFilter === f.value
            ? '#fff'
            : 'var(--triarq-color-text-secondary)'"
          style="cursor:pointer;"
        >{{ f.label }}</span>
      </div>

      <!-- User list ─────────────────────────────────────────────────────── -->
      <div *ngIf="!loading && users.length > 0">

        <!-- Column headers -->
        <div
          style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr 90px 130px;
                 gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);
                 font-size:var(--triarq-text-small);font-weight:500;
                 color:var(--triarq-color-text-secondary);
                 border-bottom:2px solid var(--triarq-color-border);"
        >
          <span
            (click)="toggleNameSort()"
            style="cursor:pointer;user-select:none;"
          >Name {{ nameSortDir === 'asc' ? '↑' : '↓' }}</span>
          <span>Email</span>
          <span>Role</span>
          <span>Active</span>
          <span>Invite</span>
          <span></span>
        </div>

        <!-- Each user row + optional inline panels -->
        <div *ngFor="let user of filteredSortedUsers">

          <!-- Row -->
          <div
            style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr 90px 130px;
                   gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                   border-bottom:1px solid var(--triarq-color-border);
                   font-size:var(--triarq-text-small);align-items:center;"
          >
            <span style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-weight:500;color:var(--triarq-color-text-primary);">
                {{ user.display_name }}
              </span>
              <!-- Contract 19 (D-395, UAT #13): Division-membership count.
                   Click "Assign" to open the full chip set. Tooltip lists names. -->
              <span *ngIf="(user.division_names?.length ?? 0) > 0"
                    [title]="(user.division_names ?? []).join(', ')"
                    style="font-size:10px;color:var(--triarq-color-text-secondary);">
                {{ user.division_names!.length }}
                Division{{ user.division_names!.length === 1 ? '' : 's' }}
              </span>
              <span *ngIf="(user.division_names?.length ?? 0) === 0"
                    style="font-size:10px;color:var(--triarq-color-text-secondary);font-style:italic;">
                No Division
              </span>
            </span>
            <span style="color:var(--triarq-color-text-secondary);">{{ user.email }}</span>
            <span style="display:flex;flex-wrap:wrap;gap:4px;">
              <!-- Contract 19 (Part 1e): render one pill per role flag the user holds. -->
              <ng-container *ngIf="userFlags(user).length > 0; else noRoles">
                <span *ngFor="let flag of userFlags(user)"
                      class="oi-pill"
                      [style.background]="flagPillBg(flag)"
                      [style.color]="flagPillColor(flag)">
                  {{ flagAbbrev(flag) }}
                </span>
              </ng-container>
              <ng-template #noRoles>
                <span class="oi-pill"
                      style="background:var(--triarq-color-background-subtle);
                             color:var(--triarq-color-text-secondary);">
                  No role
                </span>
              </ng-template>
            </span>
            <!-- Active/Inactive badge -->
            <span>
              <span
                class="oi-pill"
                [style.background]="user.is_active
                  ? 'var(--triarq-color-background-subtle)'
                  : 'var(--triarq-color-error-light,#fdecea)'"
                [style.color]="user.is_active
                  ? 'var(--triarq-color-text-secondary)'
                  : 'var(--triarq-color-error)'"
              >{{ user.is_active ? 'Active' : 'Inactive' }}</span>
            </span>
            <!-- B-52 + B-64: Invite badge always present. Resolves to one of:
                 Active / Invited — awaiting password set / Invite expired / Not Yet Invited.
                 Source: D-248, Contract 10 §7 B-52, Contract 11 §B-64. -->
            <span>
              <span
                class="oi-pill"
                [style.background]="inviteBadgeBg(inviteStatusFor(user.id))"
                [style.color]="inviteBadgeColor(inviteStatusFor(user.id))"
              >{{ inviteBadgeLabel(inviteStatusFor(user.id)) }}</span>
            </span>
            <!-- Action buttons: Edit | Invite/Resend | Assign. B-65: Invite for Not Yet Invited. -->
            <span style="display:flex;gap:var(--triarq-space-sm);justify-content:flex-end;flex-wrap:wrap;">
              <button
                (click)="editingUserId === user.id ? cancelEdit() : startEdit(user)"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                       background:none;border:none;cursor:pointer;padding:0;"
              >{{ editingUserId === user.id ? 'Cancel' : 'Edit' }}</button>
              <!-- B-65: Invite for Not Yet Invited; D-346 Context A label transition. CC-C11-002: reuse resend_invite. -->
              <button
                *ngIf="inviteStatusFor(user.id) === 'not_yet_invited'"
                (click)="resendInvite(user.id)"
                [disabled]="resendingUserId === user.id"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                       background:none;border:none;cursor:pointer;padding:0;"
              >{{ resendingUserId === user.id ? 'Inviting…' : 'Invite' }}</button>
              <button
                *ngIf="inviteStatusFor(user.id) === 'invited' || inviteStatusFor(user.id) === 'expired'"
                (click)="resendInvite(user.id)"
                [disabled]="resendingUserId === user.id"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                       background:none;border:none;cursor:pointer;padding:0;"
              >{{ resendingUserId === user.id ? 'Sending…' : 'Resend' }}</button>
              <button
                (click)="divisionsUserId === user.id ? closeDivisions() : openDivisions(user)"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                       background:none;border:none;cursor:pointer;padding:0;"
              >{{ divisionsUserId === user.id ? 'Close' : 'Assign' }}</button>
            </span>
          </div>

          <!-- Inline edit form (D-178 Tier 3: section overlay) -->
          <div
            *ngIf="editingUserId === user.id"
            style="position:relative;"
          >
            <app-loading-overlay [visible]="saving" message="Saving…"></app-loading-overlay>
            <div
              style="background:var(--triarq-color-background-subtle);
                     padding:var(--triarq-space-sm) var(--triarq-space-md);
                     border-bottom:1px solid var(--triarq-color-border);"
            >
              <form [formGroup]="editForm" (ngSubmit)="submitEdit()">
                <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:2fr 2fr 1fr auto;
                            align-items:end;">
                  <div>
                    <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                      Display Name *
                    </label>
                    <input formControlName="display_name" class="oi-input" style="width:100%;" />
                  </div>
                  <!-- D-354 §4 / D-169: Email Address — admin-only edit -->
                  <div>
                    <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                      Email Address *
                    </label>
                    <input
                      formControlName="email"
                      type="email"
                      autocomplete="email"
                      class="oi-input"
                      style="width:100%;"
                      [class.oi-input-error]="emailFieldInvalid"
                    />
                    <!-- D-200 Pattern 3: inline error directly under the field -->
                    <div
                      *ngIf="emailFieldInvalid"
                      style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
                    >Enter a valid email address.</div>
                    <div
                      *ngIf="emailDuplicateError"
                      style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
                    >That email address is already in use.</div>
                  </div>
                  <div>
                    <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                      Status
                    </label>
                    <select formControlName="is_active" class="oi-input">
                      <option [ngValue]="true">Active</option>
                      <option [ngValue]="false">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <!-- D-178 Tier 2: button spinner while saving -->
                    <button
                      type="submit"
                      class="oi-btn-primary"
                      [disabled]="editForm.invalid || saving"
                      style="white-space:nowrap;"
                    >
                      <ion-spinner *ngIf="saving" name="crescent"
                                   style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">
                      </ion-spinner>
                      {{ saving ? 'Saving…' : 'Save' }}
                    </button>
                  </div>
                </div>

                <!-- Contract 19 (Part 1e): role checkboxes — same shape as Add User. -->
                <div style="margin-top:var(--triarq-space-sm);">
                  <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                    Roles *
                  </label>
                  <div style="display:flex;flex-wrap:wrap;gap:var(--triarq-space-sm);">
                    <label *ngFor="let flag of ALL_ROLE_FLAGS"
                           style="display:inline-flex;align-items:center;gap:6px;
                                  font-size:var(--triarq-text-small);cursor:pointer;
                                  padding:6px 12px;border:1px solid var(--triarq-color-border);
                                  border-radius:5px;background:#fff;user-select:none;">
                      <input type="checkbox" [formControlName]="flag" />
                      <span>{{ flagAbbrev(flag) }} — {{ flagDisplay(flag) }}</span>
                    </label>
                  </div>
                  <div *ngIf="editForm.errors?.['noRoleSelected'] && editForm.touched"
                       style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
                    Select at least one role.
                  </div>
                </div>
                <div
                  *ngIf="editError"
                  style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:var(--triarq-space-xs);"
                >{{ editError }}</div>
              </form>
            </div>
          </div>

          <!-- Division assignment panel -->
          <div
            *ngIf="divisionsUserId === user.id"
            style="background:var(--triarq-color-background-subtle);
                   padding:var(--triarq-space-sm) var(--triarq-space-md);
                   border-bottom:1px solid var(--triarq-color-border);"
          >
            <div style="font-size:var(--triarq-text-small);font-weight:500;
                        margin-bottom:var(--triarq-space-xs);">
              Division Assignments — {{ user.display_name }}
            </div>

            <!-- Loading memberships -->
            <div
              *ngIf="loadingMemberships"
              style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);"
            >Loading…</div>

            <!-- Current direct assignments -->
            <div *ngIf="!loadingMemberships">
              <div
                *ngIf="userDirectDivisions.length === 0"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                       margin-bottom:var(--triarq-space-xs);"
              >Not assigned to any Division.</div>

              <div
                *ngIf="userDirectDivisions.length > 0"
                style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--triarq-space-sm);"
              >
                <span
                  *ngFor="let div of userDirectDivisions"
                  style="display:inline-flex;align-items:center;gap:4px;
                         background:var(--triarq-color-primary);color:#fff;
                         border-radius:999px;padding:2px 10px 2px 12px;
                         font-size:var(--triarq-text-small);"
                >
                  {{ div.division_name }}
                  <!-- D-178 Tier 2: spinner on Revoke button -->
                  <button
                    (click)="revokeAssignment(div.id)"
                    [disabled]="revokingDivisionId === div.id"
                    style="background:none;border:none;color:#fff;cursor:pointer;
                           font-size:14px;line-height:1;padding:0 0 0 2px;opacity:0.8;
                           display:inline-flex;align-items:center;"
                    title="Remove"
                  >
                    <ion-spinner *ngIf="revokingDivisionId === div.id" name="crescent"
                                 style="width:12px;height:12px;color:#fff;">
                    </ion-spinner>
                    <span *ngIf="revokingDivisionId !== div.id">×</span>
                  </button>
                </span>
              </div>

              <!-- Add a Trust -->
              <div
                *ngIf="availableTrusts.length > 0"
                style="display:flex;gap:var(--triarq-space-sm);align-items:center;"
              >
                <select
                  [formControl]="trustPickerControl"
                  class="oi-input"
                  style="max-width:300px;"
                >
                  <option value="">— Assign a Trust —</option>
                  <option *ngFor="let t of availableTrusts" [value]="t.id">
                    {{ t.division_name }}
                  </option>
                </select>
                <!-- D-178 Tier 2: spinner on Assign button -->
                <button
                  class="oi-btn-primary"
                  (click)="submitAssign()"
                  [disabled]="!trustPickerControl.value || assigning"
                  style="font-size:var(--triarq-text-small);white-space:nowrap;"
                >
                  <ion-spinner *ngIf="assigning" name="crescent"
                               style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">
                  </ion-spinner>
                  {{ assigning ? 'Assigning…' : 'Assign' }}
                </button>
              </div>
              <div
                *ngIf="availableTrusts.length === 0 && !loadingMemberships"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);"
              >Assigned to all available Trusts.</div>

              <!-- Errors (D-140) -->
              <div
                *ngIf="assignError"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);
                       margin-top:var(--triarq-space-xs);"
              >{{ assignError }}</div>
              <div
                *ngIf="membershipsError"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);
                       margin-top:var(--triarq-space-xs);"
              >{{ membershipsError }}</div>
            </div>
          </div>

        </div>

        <!-- Zero results after filter -->
        <div
          *ngIf="filteredSortedUsers.length === 0"
          style="color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);
                 padding:var(--triarq-space-lg) 0;text-align:center;"
        >No users match the selected role filter.</div>

      </div>

      <div
        *ngIf="!loading && users.length === 0 && !blockedMessage"
        style="color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);
               padding:var(--triarq-space-lg) 0;text-align:center;"
      >No users found. Use "+ Add User" to add the first user.</div>

      <!-- Summary ───────────────────────────────────────────────────────── -->
      <div
        *ngIf="users.length > 0"
        style="margin-top:var(--triarq-space-sm);
               font-size:var(--triarq-text-small);
               color:var(--triarq-color-text-secondary);"
      >
        {{ filteredSortedUsers.length }}
        <span *ngIf="roleFilter !== 'all'">of {{ users.length }}</span>
        user{{ users.length === 1 ? '' : 's' }}
        <span *ngIf="roleFilter !== 'all'"> — filtered by {{ $any(this).flagAbbrev(roleFilter) }}</span>
      </div>

      <!-- Footer nav ────────────────────────────────────────────────────── -->
      <div
        style="margin-top:var(--triarq-space-lg);padding-top:var(--triarq-space-md);
               border-top:1px solid var(--triarq-color-border);"
      >
        <a
          routerLink="/admin/divisions"
          style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);"
        >← Division Hierarchy</a>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {

  // ── User list state ────────────────────────────────────────────────────────
  users:           User[]       = [];
  loading          = false;
  showInviteForm   = false;
  inviting         = false;
  inviteError      = '';
  inviteSuccess    = false;
  inviteSuccessMsg = '';
  blockedMessage   = '';
  blockedHint      = '';
  inviteForm!:     FormGroup;

  // ── Invite status state (D-248) ────────────────────────────────────────────
  // Maps user_id → 'active' | 'invited' | 'expired'
  inviteStatusMap: Map<string, string> = new Map();
  resendingUserId: string | null = null;
  resendError      = '';
  resendSuccessMsg = '';

  // ── Sort / filter state ────────────────────────────────────────────────────
  // Contract 19 (Part 1e): filter values match role-flag keys ('all' = no filter).
  roleFilter:   string       = 'all';
  nameSortDir:  'asc'|'desc' = 'asc';

  // Template-accessible constants.
  readonly ALL_ROLE_FLAGS = ALL_ROLE_FLAGS;

  // ── Edit user state ────────────────────────────────────────────────────────
  editingUserId:    string | null = null;
  editingUserOriginalEmail = '';
  editForm!:        FormGroup;
  saving            = false;
  editError         = '';
  emailDuplicateError = false;
  editSuccessMsg    = '';

  // ── Division assignment state ──────────────────────────────────────────────
  divisionsUserId:       string | null = null;
  userDirectDivisions:   Division[]    = [];
  loadingMemberships     = false;
  membershipsError       = '';
  allTrusts:             Division[]    = [];
  trustsLoaded           = false;
  trustPickerControl     = new FormControl<string>('');
  assigning              = false;
  assignError            = '';
  revokingDivisionId:    string | null = null;

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4, 5];

  constructor(
    private readonly mcp:         McpService,
    private readonly profile:     UserProfileService,
    private readonly auth:        AuthService,
    private readonly screenState: ScreenStateService,
    private readonly fb:          FormBuilder,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Contract 19: role checkboxes replace the single system_role dropdown.
    // The atLeastOneRole validator surfaces the "Select at least one role" error.
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
    this.restoreScreenState();
  }

  /**
   * Contract 19 (Part 1e): "Email Address" field paste-parse.
   * If the pasted value matches "Display Name <email@domain.com>", fill both
   * display_name and email; otherwise let the paste land as-is.
   */
  onEmailPaste(ev: ClipboardEvent): void {
    const raw = ev.clipboardData?.getData('text') ?? '';
    const match = raw.match(/^\s*([^<]+?)\s*<\s*([^>\s]+)\s*>\s*$/);
    if (!match) { return; }
    ev.preventDefault();
    const displayName = match[1].trim();
    const emailValue  = match[2].trim();
    this.inviteForm.patchValue({
      display_name: displayName,
      email:        emailValue
    });
    this.cdr.markForCheck();
  }

  // ── Screen-state persistence — D-171 / D-370 / D-380 ──────────────────────
  // Contract 17 §2: routed through ScreenStateService → division-mcp. The
  // Contract 16 direct-Supabase path was an unauthorized Arch-1 exception;
  // Design ruled it must be removed. user_id is taken from the JWT at the MCP
  // boundary. Search text is never persisted (D-171) — only roleFilter and
  // nameSortDir. Server enforces the 7-day recency rule.

  private async restoreScreenState(): Promise<void> {
    const saved = await this.screenState.restore(SCREEN_KEYS.ADMIN_USERS);
    if (!saved) { return; }

    const filter = saved.filter_state as { roleFilter?: string } | null;
    const sort   = saved.sort_state   as { nameSortDir?: 'asc' | 'desc' } | null;
    // Contract 19 (Part 1e): validate the restored roleFilter against the new flag set.
    // Sessions saved before Contract 19 used legacy system_role values ('dcs', 'phil', ...)
    // which would silently filter every user out. Stale values fall back to 'all'.
    if (filter?.roleFilter) {
      const valid: string[] = ['all', ...ALL_ROLE_FLAGS];
      this.roleFilter = valid.includes(filter.roleFilter) ? filter.roleFilter : 'all';
    }
    if (sort?.nameSortDir)    { this.nameSortDir = sort.nameSortDir; }
    this.cdr.markForCheck();
  }

  private saveScreenState(): void {
    this.screenState.save(
      SCREEN_KEYS.ADMIN_USERS,
      { roleFilter:  this.roleFilter },
      { nameSortDir: this.nameSortDir }
    );
  }

  // ── Sort / Filter ──────────────────────────────────────────────────────────
  // Contract 19 (Part 1e): filter values are role-flag names; 'all' = no filter.
  // A user appears under every flag they hold — multi-role users are surfaced everywhere.
  get filteredSortedUsers(): User[] {
    let result = [...this.users];
    if (this.roleFilter !== 'all') {
      const flag = this.roleFilter as ActiveRoleFlag;
      result = result.filter(u => u[flag] === true);
    }
    result.sort((a, b) => {
      const cmp = a.display_name.localeCompare(b.display_name);
      return this.nameSortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }

  /** Trusts not yet directly assigned to the current divisions user. */
  get availableTrusts(): Division[] {
    const assignedIds = new Set(this.userDirectDivisions.map(d => d.id));
    return this.allTrusts.filter(t => !assignedIds.has(t.id));
  }

  setRoleFilter(role: string): void {
    this.roleFilter = role;
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  toggleNameSort(): void {
    this.nameSortDir = this.nameSortDir === 'asc' ? 'desc' : 'asc';
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private loadUsers(): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<User[]>('division', 'list_users', {})
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.users = Array.isArray(res.data) ? res.data : [];
            // Load invite statuses after users load (D-248).
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
    this.mcp
      .call<Array<{ user_id: string; invite_status: string }>>(
        'division', 'get_user_invite_statuses', {}
      )
      .subscribe({
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
        error: () => {
          // Non-fatal — invite status badges just won't show. Don't block the user list.
        }
      });
  }

  /** B-52 + B-64: every row resolves to a non-empty status. Null → 'not_yet_invited'.
   *  Source: Contract 10 §7 B-52, Contract 11 §B-64. */
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
    // D-354: labels updated for OTP flow (no password set step).
    if (status === 'active')          return 'Active';
    if (status === 'invited')         return 'Invited — awaiting code entry';
    if (status === 'expired')         return 'Invite expired';
    if (status === 'not_yet_invited') return 'Not Yet Invited';
    return '';
  }

  resendInvite(userId: string): void {
    this.resendingUserId = userId;
    this.resendError     = '';
    this.resendSuccessMsg = '';
    this.cdr.markForCheck();

    this.mcp
      .call<{ message?: string }>('division', 'resend_invite', { user_id: userId })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.resendSuccessMsg = (res.data as { message?: string })?.message ?? 'Invitation resent.';
          } else {
            this.resendError = res.error ?? 'Could not send invitation. Please try again.';
          }
          this.resendingUserId = null;
          this.loadInviteStatuses();
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.resendError     = err.error ?? 'Could not send invitation. Please try again.';
          this.resendingUserId = null;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Add user ────────────────────────────────────────────────────────────────
  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    this.inviteError    = '';
    this.inviteSuccess  = false;
    if (this.showInviteForm) { this.inviteForm.reset(); }
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) {
      // Surface the noRoleSelected error if user has not picked any role.
      this.inviteForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.inviting      = true;
    this.inviteError   = '';
    this.inviteSuccess = false;
    this.cdr.markForCheck();

    const v = this.inviteForm.value as Record<string, unknown>;
    this.mcp
      .call<User>('division', 'create_user', {
        email:        v['email']        as string,
        display_name: v['display_name'] as string,
        // Boolean role flags — sole source of role truth post-migration-034.
        is_admin:     v['is_admin'] === true,
        is_dcs:       v['is_dcs']   === true,
        is_epo:       v['is_epo']   === true,
        is_dol:       v['is_dol']   === true,
        is_ce:        v['is_ce']    === true
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            const email = this.inviteForm.value.email as string;
            this.inviteSuccess   = true;
            // Use the MCP tool's message if present; fallback to standard message (D-248).
            this.inviteSuccessMsg = (res as { message?: string }).message
              ?? `User created and invitation sent to ${email}.`;
            this.showInviteForm  = false;
            this.inviteForm.reset();
            this.loadUsers();
          } else {
            this.inviteError = res.error ?? 'Create failed.';
          }
          this.inviting = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.inviteError = err.error ?? 'Create failed. Check the email and try again.';
          this.inviting    = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Edit user ───────────────────────────────────────────────────────────────
  get emailFieldInvalid(): boolean {
    const c = this.editForm?.get('email');
    return !!(c?.invalid && c?.touched);
  }

  startEdit(user: User): void {
    this.editingUserId            = user.id;
    this.editingUserOriginalEmail = user.email;
    this.editError                = '';
    this.emailDuplicateError      = false;
    this.divisionsUserId          = null;  // close division panel if open
    // Contract 19: boolean flags drive the checkbox set. The user record already
    // carries the flags from list_users (Phase 1 dual-read).
    this.editForm.setValue({
      display_name: user.display_name,
      email:        user.email,
      is_active:    user.is_active,
      is_admin:     user.is_admin === true,
      is_dcs:       user.is_dcs   === true,
      is_epo:       user.is_epo   === true,
      is_dol:       user.is_dol   === true,
      is_ce:        user.is_ce    === true
    });
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingUserId            = null;
    this.editingUserOriginalEmail = '';
    this.editError                = '';
    this.emailDuplicateError      = false;
    this.cdr.markForCheck();
  }

  /**
   * D-354 §4: when the email field changes, run update_user_email first via the
   * dedicated MCP tool (which calls supabase.auth.admin.updateUserById). Other
   * field updates flow through update_user as before. Email is intentionally
   * NOT a mutable field on update_user — D-169 admin-only, plus the auth-side
   * update is the source of truth.
   */
  submitEdit(): void {
    if (this.editForm.invalid || !this.editingUserId) { return; }
    this.saving              = true;
    this.editError           = '';
    this.emailDuplicateError = false;
    this.cdr.markForCheck();

    const userId      = this.editingUserId;
    const newEmail    = (this.editForm.value.email as string).trim().toLowerCase();
    const emailChanged = newEmail !== this.editingUserOriginalEmail.toLowerCase();

    const updateOtherFields = (): void => {
      const v = this.editForm.value as Record<string, unknown>;
      this.mcp
        .call<User>('division', 'update_user', {
          user_id: userId,
          updates: {
            display_name: v['display_name'] as string,
            is_active:    v['is_active']    as boolean,
            // Boolean role flag updates — MUTABLE_FIELDS in update_user MCP.
            is_admin:     v['is_admin'] === true,
            is_dcs:       v['is_dcs']   === true,
            is_epo:       v['is_epo']   === true,
            is_dol:       v['is_dol']   === true,
            is_ce:        v['is_ce']    === true
          }
        })
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.editingUserId            = null;
              this.editingUserOriginalEmail = '';
              this.editSuccessMsg           = 'User updated.';
              this.loadUsers();
              setTimeout(() => { this.editSuccessMsg = ''; this.cdr.markForCheck(); }, 4000);
            } else {
              this.editError = res.error ?? 'Save failed.';
            }
            this.saving = false;
            this.cdr.markForCheck();
          },
          error: (err: { error?: string }) => {
            this.editError = err.error ?? 'Save failed. Check permissions and try again.';
            this.saving    = false;
            this.cdr.markForCheck();
          }
        });
    };

    if (!emailChanged) {
      updateOtherFields();
      return;
    }

    this.mcp
      .call<User>('division', 'update_user_email', {
        user_id:   userId,
        new_email: newEmail
      })
      .subscribe({
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

  // ── Division assignment ────────────────────────────────────────────────────
  openDivisions(user: User): void {
    this.divisionsUserId  = user.id;
    this.editingUserId    = null;  // close edit panel if open
    this.assignError      = '';
    this.membershipsError = '';
    this.trustPickerControl.setValue('');
    this.userDirectDivisions = [];
    this.loadMemberships(user.id);
    this.loadTrustsOnce();
    this.cdr.markForCheck();
  }

  closeDivisions(): void {
    this.divisionsUserId     = null;
    this.userDirectDivisions = [];
    this.assignError         = '';
    this.membershipsError    = '';
    this.trustPickerControl.setValue('');
    this.cdr.markForCheck();
  }

  private loadMemberships(userId: string): void {
    this.loadingMemberships = true;
    this.membershipsError   = '';
    this.cdr.markForCheck();

    this.mcp
      .call<UserDivisionsData>('division', 'get_user_divisions', { user_id: userId })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.userDirectDivisions = res.data.directly_assigned_divisions ?? [];
          } else {
            this.membershipsError = res.error ?? 'Could not load Division assignments.';
          }
          this.loadingMemberships = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.membershipsError   = err.error ?? 'Could not load Division assignments.';
          this.loadingMemberships = false;
          this.cdr.markForCheck();
        }
      });
  }

  /** Loads the Trust list once per component lifetime — reused across all users. */
  private loadTrustsOnce(): void {
    if (this.trustsLoaded) { return; }

    this.mcp
      .call<Division[]>('division', 'list_divisions', { parent_division_id: null })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.allTrusts    = Array.isArray(res.data) ? res.data : [];
            this.trustsLoaded = true;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          // Non-fatal — picker just stays empty, user sees "no available Trusts" message.
          this.cdr.markForCheck();
        }
      });
  }

  submitAssign(): void {
    const divisionId = this.trustPickerControl.value;
    if (!divisionId || !this.divisionsUserId) { return; }
    this.assigning   = true;
    this.assignError = '';
    this.cdr.markForCheck();

    this.mcp
      .call<unknown>('division', 'assign_user_to_division', {
        user_id:     this.divisionsUserId,
        division_id: divisionId
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.trustPickerControl.setValue('');
            this.loadMemberships(this.divisionsUserId!);
          } else {
            this.assignError = res.error ?? 'Assign failed.';
          }
          this.assigning = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.assignError = err.error ?? 'Assign failed. Check permissions and try again.';
          this.assigning   = false;
          this.cdr.markForCheck();
        }
      });
  }

  revokeAssignment(divisionId: string): void {
    if (!this.divisionsUserId) { return; }
    this.revokingDivisionId = divisionId;
    this.assignError        = '';
    this.cdr.markForCheck();

    this.mcp
      .call<unknown>('division', 'revoke_division_membership', {
        user_id:     this.divisionsUserId,
        division_id: divisionId
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.loadMemberships(this.divisionsUserId!);
          } else {
            this.assignError = res.error ?? 'Remove failed.';
          }
          this.revokingDivisionId = null;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.assignError        = err.error ?? 'Remove failed. Check permissions and try again.';
          this.revokingDivisionId = null;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Presentation helpers ───────────────────────────────────────────────────
  // Contract 19 (Part 1e): pill style keyed by role flag.
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

  /** Returns the role flags this user holds, in canonical display order (admin first). */
  userFlags(user: User): ActiveRoleFlag[] {
    return ALL_ROLE_FLAGS.filter(f => user[f] === true);
  }

  /**
   * Contract 19 (Part 1e): role-filter tabs — All + any flag for which at least one user holds it.
   * Order: Admin, DCS, EPO, DOL, CE (matches ALL_ROLE_FLAGS).
   */
  get visibleRoleFilters(): { value: string; label: string }[] {
    const tabs: { value: string; label: string }[] = [{ value: 'all', label: 'All' }];
    for (const flag of ALL_ROLE_FLAGS) {
      if (this.users.some(u => u[flag] === true)) {
        tabs.push({ value: flag, label: ROLE_FLAG_ABBREVIATIONS[flag] });
      }
    }
    return tabs;
  }

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}
