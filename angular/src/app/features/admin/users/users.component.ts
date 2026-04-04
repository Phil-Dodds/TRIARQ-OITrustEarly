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
  Validators
} from '@angular/forms';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../../core/services/mcp.service';
import { UserProfileService }          from '../../../core/services/user-profile.service';
import { BlockedActionComponent }      from '../../../shared/components/blocked-action/blocked-action.component';
import { LoadingOverlayComponent }     from '../../../shared/components/loading-overlay/loading-overlay.component';
import { User, SystemRole, Division }  from '../../../core/types/database';

/** get_user_divisions response shape */
interface UserDivisionsData {
  user_id:                    string;
  display_name:               string;
  directly_assigned_divisions: Division[];
  all_accessible_divisions:   (Division & { access_type: 'direct' | 'inherited' })[];
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
            <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:1fr 1fr 1fr;">
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Email Address *
                </label>
                <input
                  formControlName="email"
                  type="email"
                  class="oi-input"
                  placeholder="user@triarqhealth.com"
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
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  System Role *
                </label>
                <select formControlName="system_role" class="oi-input">
                  <option value="">— Select role —</option>
                  <option value="ds">DS — Domain Strategist</option>
                  <option value="cb">CB — Capability Builder</option>
                  <option value="ce">CE — Context Engineer</option>
                  <option value="admin">Admin</option>
                </select>
                <div
                  *ngIf="inviteForm.get('system_role')?.invalid && inviteForm.get('system_role')?.touched"
                  style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
                >Role is required.</div>
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
              >User created. They can sign in now with their &#64;triarqhealth.com email.</span>
            </div>
          </form>
        </div>
      </div>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr 130px;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:999px;width:50px;"></ion-skeleton-text>
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
        <span
          *ngFor="let f of roleFilters"
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
          style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr 130px;
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
          <span>Status</span>
          <span></span>
        </div>

        <!-- Each user row + optional inline panels -->
        <div *ngFor="let user of filteredSortedUsers">

          <!-- Row -->
          <div
            style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr 130px;
                   gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                   border-bottom:1px solid var(--triarq-color-border);
                   font-size:var(--triarq-text-small);align-items:center;"
          >
            <span style="font-weight:500;color:var(--triarq-color-text-primary);">
              {{ user.display_name }}
            </span>
            <span style="color:var(--triarq-color-text-secondary);">{{ user.email }}</span>
            <span>
              <span
                class="oi-pill"
                [style.background]="rolePillBg(user.system_role)"
                [style.color]="rolePillColor(user.system_role)"
              >{{ user.system_role.toUpperCase() }}</span>
            </span>
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
            <!-- Action buttons: Edit | Assign -->
            <span style="display:flex;gap:var(--triarq-space-sm);justify-content:flex-end;">
              <button
                (click)="editingUserId === user.id ? cancelEdit() : startEdit(user)"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                       background:none;border:none;cursor:pointer;padding:0;"
              >{{ editingUserId === user.id ? 'Cancel' : 'Edit' }}</button>
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
                <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:2fr 1fr 1fr auto;
                            align-items:end;">
                  <div>
                    <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                      Display Name *
                    </label>
                    <input formControlName="display_name" class="oi-input" style="width:100%;" />
                  </div>
                  <div>
                    <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                      Role *
                    </label>
                    <select formControlName="system_role" class="oi-input">
                      <option value="ds">DS — Domain Strategist</option>
                      <option value="cb">CB — Capability Builder</option>
                      <option value="ce">CE — Context Engineer</option>
                      <option value="admin">Admin</option>
                      <option value="phil">Phil</option>
                    </select>
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
        <span *ngIf="roleFilter !== 'all'"> — filtered by {{ roleFilter.toUpperCase() }}</span>
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
  blockedMessage   = '';
  blockedHint      = '';
  inviteForm!:     FormGroup;

  // ── Sort / filter state ────────────────────────────────────────────────────
  roleFilter:   string       = 'all';
  nameSortDir:  'asc'|'desc' = 'asc';

  readonly roleFilters = [
    { value: 'all',   label: 'All' },
    { value: 'ds',    label: 'DS' },
    { value: 'cb',    label: 'CB' },
    { value: 'ce',    label: 'CE' },
    { value: 'admin', label: 'Admin' },
    { value: 'phil',  label: 'Phil' }
  ];

  // ── Edit user state ────────────────────────────────────────────────────────
  editingUserId:   string | null = null;
  editForm!:       FormGroup;
  saving           = false;
  editError        = '';

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
    private readonly mcp:     McpService,
    private readonly profile: UserProfileService,
    private readonly fb:      FormBuilder,
    private readonly cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      email:        ['', [Validators.required, Validators.email]],
      display_name: ['', Validators.required],
      system_role:  ['', Validators.required]
    });
    this.editForm = this.fb.group({
      display_name: ['', Validators.required],
      system_role:  ['', Validators.required],
      is_active:    [true]
    });
    this.loadUsers();
  }

  // ── Sort / Filter ──────────────────────────────────────────────────────────
  get filteredSortedUsers(): User[] {
    let result = [...this.users];
    if (this.roleFilter !== 'all') {
      result = result.filter(u => u.system_role === this.roleFilter);
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
    this.cdr.markForCheck();
  }

  toggleNameSort(): void {
    this.nameSortDir = this.nameSortDir === 'asc' ? 'desc' : 'asc';
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

  // ── Add user ────────────────────────────────────────────────────────────────
  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    this.inviteError    = '';
    this.inviteSuccess  = false;
    if (this.showInviteForm) { this.inviteForm.reset(); }
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) { return; }
    this.inviting      = true;
    this.inviteError   = '';
    this.inviteSuccess = false;
    this.cdr.markForCheck();

    this.mcp
      .call<User>('division', 'create_user', {
        email:        this.inviteForm.value.email as string,
        display_name: this.inviteForm.value.display_name as string,
        system_role:  this.inviteForm.value.system_role as SystemRole
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.inviteSuccess  = true;
            this.showInviteForm = false;
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
  startEdit(user: User): void {
    this.editingUserId  = user.id;
    this.editError      = '';
    this.divisionsUserId = null;  // close division panel if open
    this.editForm.setValue({
      display_name: user.display_name,
      system_role:  user.system_role,
      is_active:    user.is_active
    });
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editError     = '';
    this.cdr.markForCheck();
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.editingUserId) { return; }
    this.saving    = true;
    this.editError = '';
    this.cdr.markForCheck();

    this.mcp
      .call<User>('division', 'update_user', {
        user_id: this.editingUserId,
        updates: {
          display_name: this.editForm.value.display_name as string,
          system_role:  this.editForm.value.system_role  as SystemRole,
          is_active:    this.editForm.value.is_active    as boolean
        }
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.editingUserId = null;
            this.loadUsers();
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
  rolePillBg(role: SystemRole): string {
    const map: Record<SystemRole, string> = {
      phil:  'var(--triarq-color-primary)',
      admin: '#e3f2fd',
      ds:    '#f3e5f5',
      cb:    '#e8f5e9',
      ce:    '#fff3e0'
    };
    return map[role] ?? 'var(--triarq-color-background-subtle)';
  }

  rolePillColor(role: SystemRole): string {
    const map: Record<SystemRole, string> = {
      phil:  '#ffffff',
      admin: '#1565c0',
      ds:    '#6a1b9a',
      cb:    '#2e7d32',
      ce:    '#e65100'
    };
    return map[role] ?? 'var(--triarq-color-text-secondary)';
  }

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}
