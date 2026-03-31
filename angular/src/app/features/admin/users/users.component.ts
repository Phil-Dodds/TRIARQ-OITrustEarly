// users.component.ts — Admin User Management
// Build A: User creation (invite), role management, Division membership view.
// Acceptance criteria: users created, assigned to Divisions, role-aware home confirmed.
// Roles: admin only (protected by authGuard + admin.module.ts route).
// D-93:  McpService only — no direct Supabase access.
// D-139: Only 'phil' role can set allow_both_admin_and_functional_roles = true.
// D-140: Blocked action UX on all errors.

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
  FormGroup,
  Validators
} from '@angular/forms';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../../core/services/mcp.service';
import { UserProfileService }          from '../../../core/services/user-profile.service';
import { BlockedActionComponent }      from '../../../shared/components/blocked-action/blocked-action.component';
import { User, SystemRole }            from '../../../core/types/database';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonicModule,
    BlockedActionComponent
  ],
  template: `
    <div class="oi-card" style="max-width:900px;margin:var(--triarq-space-2xl) auto;">

      <!-- Header ────────────────────────────────────────────────────────── -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);">
        <h3 style="margin:0;">User Management</h3>
        <button
          class="oi-btn-primary"
          (click)="toggleInviteForm()"
          style="font-size:var(--triarq-text-small);"
        >{{ showInviteForm ? 'Cancel' : '+ Invite User' }}</button>
      </div>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Invite form ───────────────────────────────────────────────────── -->
      <div
        *ngIf="showInviteForm"
        style="background:var(--triarq-color-background-subtle);
               border-radius:8px;padding:var(--triarq-space-md);
               margin-bottom:var(--triarq-space-md);"
      >
        <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
          Invite New User
        </h4>
        <p style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                  margin:0 0 var(--triarq-space-sm) 0;">
          An email invitation will be sent. The user must click the link to activate their account.
        </p>
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
                <option value="ds">DS — Data Steward</option>
                <option value="cb">CB — Care Builder</option>
                <option value="ce">CE — Care Enabler</option>
                <option value="admin">Admin</option>
              </select>
              <div
                *ngIf="inviteForm.get('system_role')?.invalid && inviteForm.get('system_role')?.touched"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
              >Role is required.</div>
            </div>
          </div>
          <div style="margin-top:var(--triarq-space-sm);display:flex;gap:var(--triarq-space-sm);align-items:center;">
            <button type="submit" class="oi-btn-primary" [disabled]="inviteForm.invalid || inviting">
              {{ inviting ? 'Sending Invite…' : 'Send Invite' }}
            </button>
            <span
              *ngIf="inviteError"
              style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);"
            >{{ inviteError }}</span>
            <span
              *ngIf="inviteSuccess"
              style="color:var(--triarq-color-success,#2e7d32);font-size:var(--triarq-text-small);"
            >Invitation sent. The user will receive a magic-link email.</span>
          </div>
        </form>
      </div>

      <!-- Loading ───────────────────────────────────────────────────────── -->
      <div
        *ngIf="loading"
        style="text-align:center;padding:var(--triarq-space-xl);
               color:var(--triarq-color-text-secondary);"
      >Loading users…</div>

      <!-- User table ────────────────────────────────────────────────────── -->
      <div *ngIf="!loading && users.length > 0">
        <div
          style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr;
                 gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);
                 font-size:var(--triarq-text-small);font-weight:500;
                 color:var(--triarq-color-text-secondary);
                 border-bottom:2px solid var(--triarq-color-border);"
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        <div
          *ngFor="let user of users"
          style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr;
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
        </div>
      </div>

      <div
        *ngIf="!loading && users.length === 0 && !blockedMessage"
        style="color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);
               padding:var(--triarq-space-lg) 0;text-align:center;"
      >No users found. Use "+ Invite User" to add the first user.</div>

      <!-- Summary ───────────────────────────────────────────────────────── -->
      <div
        *ngIf="users.length > 0"
        style="margin-top:var(--triarq-space-sm);
               font-size:var(--triarq-text-small);
               color:var(--triarq-color-text-secondary);"
      >{{ users.length }} user{{ users.length === 1 ? '' : 's' }}</div>

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

  // ── State ──────────────────────────────────────────────────────────────────
  users:          User[]    = [];
  loading         = false;
  showInviteForm  = false;
  inviting        = false;
  inviteError     = '';
  inviteSuccess   = false;
  blockedMessage  = '';
  blockedHint     = '';
  inviteForm!:    FormGroup;

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
    this.loadUsers();
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private loadUsers(): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<{ users: User[]; total_count: number }>('division', 'list_users', {})
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.users = res.data.users;
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

  // ── Invite ─────────────────────────────────────────────────────────────────
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
      .call<{ user: User }>('division', 'create_user', {
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
            this.inviteError = res.error ?? 'Invite failed.';
          }
          this.inviting = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.inviteError = err.error ?? 'Invite failed. Check the email and try again.';
          this.inviting    = false;
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
