// set-password.component.ts — Pathways OI Trust
// Route: /auth/set-password
// Handles two scenarios via the same surface (D-248):
//   1. First-time password set from an invite link (type=invite)
//   2. Password reset from "Forgot password?" (type=recovery)
//   3. Password expiry redirect from login (reason=expired, session already active)
// Supabase sends token_hash and type in the URL query params.
// Password requirements enforce HITRUST policy (D-248):
//   - Minimum 8 characters
//   - At least one uppercase letter
//   - At least one lowercase letter
//   - At least one number
//   - At least one special character
//   - Cannot reuse last 4 passwords (Supabase handles natively)

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService }     from '../../core/services/auth.service';

type SetPasswordState = 'loading' | 'form' | 'saving' | 'expired' | 'used' | 'error';

interface PasswordRequirements {
  minLength:   boolean;
  hasUpper:    boolean;
  hasLower:    boolean;
  hasNumber:   boolean;
  hasSpecial:  boolean;
}

@Component({
  selector:        'app-set-password',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, ReactiveFormsModule],
  template: `
    <div class="sp-wrapper">
      <div class="sp-card">

        <!-- Logo -->
        <div class="sp-logo-block">
          <img
            src="assets/images/TRIARQ_Logo_rgb.svg"
            alt="TRIARQ Health"
            style="width: 150px; height: auto; display: block;"
          />
        </div>

        <!-- Title — scenario-aware -->
        <h1 class="sp-title">
          {{ isExpiredReason ? 'Password Expired' : (scenario === 'invite' ? 'Set Your Password' : 'Reset Your Password') }}
        </h1>

        <!-- Expiry context message for expired-password scenario -->
        <p *ngIf="isExpiredReason" class="sp-context-msg">
          Your password has expired. Please set a new password to continue.
        </p>

        <!-- Loading -->
        <div *ngIf="pageState === 'loading'" class="sp-status">
          <p>Verifying your link…</p>
        </div>

        <!-- Token expired -->
        <div *ngIf="pageState === 'expired'" class="sp-error-block">
          <p class="sp-error-primary">This link has expired.</p>
          <p class="sp-error-secondary" *ngIf="scenario === 'invite'">
            Please contact your administrator to resend the invitation.
          </p>
          <p class="sp-error-secondary" *ngIf="scenario === 'recovery'">
            Request a new password reset link.
          </p>
          <button *ngIf="scenario === 'recovery'"
                  class="sp-btn-primary"
                  (click)="goToForgotPassword()">
            Back to Sign In
          </button>
        </div>

        <!-- Token already used -->
        <div *ngIf="pageState === 'used'" class="sp-error-block">
          <p class="sp-error-primary">This link has already been used.</p>
          <p class="sp-error-secondary">If you need to reset your password, request a new link.</p>
          <button class="sp-btn-primary" (click)="goToForgotPassword()">Back to Sign In</button>
        </div>

        <!-- Generic token error -->
        <div *ngIf="pageState === 'error'" class="sp-error-block">
          <p class="sp-error-primary">This link is invalid or has expired.</p>
          <p class="sp-error-secondary">Please request a new link or contact your administrator.</p>
          <button class="sp-btn-primary" (click)="goToLogin()">Back to Sign In</button>
        </div>

        <!-- Set password form -->
        <form *ngIf="pageState === 'form' || pageState === 'saving'"
              [formGroup]="pwForm"
              (ngSubmit)="onSubmit()"
              novalidate>

          <div class="oi-field pw-field">
            <label class="field-label" for="new-password">New Password</label>
            <input id="new-password"
                   class="oi-text-input"
                   [type]="showNew ? 'text' : 'password'"
                   formControlName="newPassword"
                   autocomplete="new-password"
                   placeholder="Create a password" />
            <button type="button" class="show-hide-btn"
                    (click)="showNew = !showNew" tabindex="-1">
              {{ showNew ? 'Hide' : 'Show' }}
            </button>
          </div>

          <!-- Password requirements checklist (updates in real time) -->
          <ul class="pw-requirements">
            <li [class.met]="reqs.minLength"  [class.unmet]="!reqs.minLength">
              {{ reqs.minLength ? '✓' : '✗' }} At least 8 characters
            </li>
            <li [class.met]="reqs.hasUpper"   [class.unmet]="!reqs.hasUpper">
              {{ reqs.hasUpper ? '✓' : '✗' }} At least one uppercase letter
            </li>
            <li [class.met]="reqs.hasLower"   [class.unmet]="!reqs.hasLower">
              {{ reqs.hasLower ? '✓' : '✗' }} At least one lowercase letter
            </li>
            <li [class.met]="reqs.hasNumber"  [class.unmet]="!reqs.hasNumber">
              {{ reqs.hasNumber ? '✓' : '✗' }} At least one number
            </li>
            <li [class.met]="reqs.hasSpecial" [class.unmet]="!reqs.hasSpecial">
              {{ reqs.hasSpecial ? '✓' : '✗' }} At least one special character
            </li>
          </ul>

          <div class="oi-field pw-field">
            <label class="field-label" for="confirm-password">Confirm Password</label>
            <input id="confirm-password"
                   class="oi-text-input"
                   [type]="showConfirm ? 'text' : 'password'"
                   formControlName="confirmPassword"
                   autocomplete="new-password"
                   placeholder="Confirm your password"
                   [class.oi-input-error]="mismatchError" />
            <button type="button" class="show-hide-btn"
                    (click)="showConfirm = !showConfirm" tabindex="-1">
              {{ showConfirm ? 'Hide' : 'Show' }}
            </button>
            <p *ngIf="mismatchError" class="oi-field-error">Passwords do not match.</p>
          </div>

          <!-- Inline submit errors -->
          <div *ngIf="submitError" class="sp-error-block">
            <p class="sp-error-primary">{{ submitError }}</p>
          </div>

          <button type="submit"
                  class="sp-btn-primary"
                  [disabled]="pageState === 'saving'">
            {{ pageState === 'saving' ? 'Setting password…' : 'Set Password' }}
          </button>

        </form>

      </div>
    </div>
  `,
  styles: [`
    .sp-wrapper {
      min-height: 100vh; background: #f5f6fa;
      display: flex; align-items: center; justify-content: center;
      font-family: Arial, sans-serif; padding: 2rem;
    }
    .sp-card {
      background: #ffffff; border-radius: 12px;
      box-shadow: 0 4px 24px rgba(18,39,74,0.10);
      padding: 2.5rem 2.5rem; width: 100%; max-width: 420px;
    }
    .sp-logo-block { margin-bottom: 1.75rem; }
    .sp-title {
      font-size: 22px; font-weight: 700; color: #12274A;
      margin: 0 0 1rem 0; line-height: 1.2;
    }
    .sp-context-msg {
      font-size: 13px; color: #E96127; font-weight: 600;
      margin: 0 0 1.25rem 0; background: #fff8f5;
      border: 1px solid #f5a87c; border-radius: 6px; padding: 8px 12px;
    }
    .sp-status { text-align: center; color: #5A5A5A; font-size: 14px; padding: 1rem 0; }

    .oi-field { margin-bottom: 1rem; }
    .pw-field { position: relative; }
    .field-label {
      display: block; font-size: 12px; font-weight: 600; color: #12274A;
      letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 6px;
    }
    .oi-text-input {
      width: 100%; box-sizing: border-box; padding: 12px 14px;
      border: 1.5px solid #d0d4da; border-radius: 8px;
      font-size: 14px; color: #12274A; background: #fafafa; outline: none;
    }
    .oi-text-input:focus { border-color: #0071AF; }
    .oi-input-error { border-color: var(--triarq-color-error) !important; }
    .oi-field-error { color: var(--triarq-color-error); font-size: 12px; margin: 4px 0 0 0; }
    .show-hide-btn {
      position: absolute; right: 12px; top: 34px;
      background: none; border: none; font-size: 12px;
      color: #0071AF; cursor: pointer; padding: 0;
    }

    /* Requirements checklist */
    .pw-requirements {
      list-style: none; padding: 0; margin: 0 0 1rem 0;
      background: #f8f9fb; border-radius: 8px;
      border: 1px solid #e8eaed; padding: 10px 14px;
    }
    .pw-requirements li { font-size: 12px; margin: 4px 0; }
    .pw-requirements li.met   { color: #2e7d32; }
    .pw-requirements li.unmet { color: #c0392b; }

    .sp-btn-primary {
      width: 100%; padding: 13px; background: #E96127;
      color: #ffffff; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 0.5rem;
    }
    .sp-btn-primary:hover:not(:disabled) { background: #c94f1e; }
    .sp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .sp-error-block {
      background: #fff3f3; border: 1px solid #f5a0a0;
      border-radius: 8px; padding: 12px 14px; margin-bottom: 1rem;
    }
    .sp-error-primary { font-size: 13px; font-weight: 600; color: #c0392b; margin: 0 0 6px 0; }
    .sp-error-secondary { font-size: 12px; color: #5A5A5A; margin: 0 0 10px 0; }
  `]
})
export class SetPasswordComponent implements OnInit {
  pageState:    SetPasswordState = 'loading';
  scenario:     'invite' | 'recovery' = 'recovery';
  isExpiredReason = false;
  showNew     = false;
  showConfirm = false;
  submitError = '';
  mismatchError = false;

  pwForm: FormGroup;

  reqs: PasswordRequirements = {
    minLength: false, hasUpper: false,
    hasLower:  false, hasNumber: false, hasSpecial: false
  };

  constructor(
    private readonly fb:    FormBuilder,
    private readonly auth:  AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr:   ChangeDetectorRef
  ) {
    this.pwForm = this.fb.group({
      newPassword:     ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });

    // Update requirements checklist in real time as the user types.
    this.pwForm.get('newPassword')!.valueChanges.subscribe((val: string) => {
      this.reqs = this.checkRequirements(val ?? '');
      this.cdr.markForCheck();
    });
  }

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const tokenHash = params.get('token_hash');
    const type      = params.get('type') as 'invite' | 'recovery' | null;
    const reason    = params.get('reason');

    // Expired password redirect from login — session is already active (CC-AUTH-001).
    if (reason === 'expired') {
      this.isExpiredReason = true;
      this.scenario        = 'recovery';
      this.pageState       = 'form';
      this.cdr.markForCheck();
      return;
    }

    if (!tokenHash || !type) {
      this.pageState = 'error';
      this.cdr.markForCheck();
      return;
    }

    this.scenario = type === 'invite' ? 'invite' : 'recovery';

    const result = await this.auth.verifyToken(tokenHash, type);

    if (result.error) {
      if (result.isExpired) {
        this.pageState = 'expired';
      } else if (result.isUsed) {
        this.pageState = 'used';
      } else {
        this.pageState = 'error';
      }
    } else {
      this.pageState = 'form';
    }

    this.cdr.markForCheck();
  }

  get allRequirementsMet(): boolean {
    return Object.values(this.reqs).every(v => v);
  }

  async onSubmit(): Promise<void> {
    this.pwForm.markAllAsTouched();
    this.mismatchError = false;
    this.submitError   = '';

    const { newPassword, confirmPassword } = this.pwForm.value as {
      newPassword: string; confirmPassword: string;
    };

    // Validate requirements before submit (D-140 — validation fires on submit).
    if (!this.allRequirementsMet) {
      this.cdr.markForCheck();
      return;
    }

    if (newPassword !== confirmPassword) {
      this.mismatchError = true;
      this.cdr.markForCheck();
      return;
    }

    this.pageState = 'saving';
    this.cdr.markForCheck();

    const result = await this.auth.updatePassword(newPassword);

    if (result.error) {
      this.pageState = 'form';
      if (result.isReuse) {
        this.submitError = 'You cannot reuse a recent password. Please choose a different password.';
      } else {
        this.submitError = 'Could not set password. Please try again.';
      }
      this.cdr.markForCheck();
      return;
    }

    // Sign out so the user sees a clean login screen (not auto-logged-in with the temp token).
    await this.auth.signOut();

    // Navigate to login with success banner state.
    await this.router.navigate(['/login'], {
      replaceUrl: true,
      state: { setPasswordSuccess: true }
    });
  }

  goToForgotPassword(): void {
    // Navigate to login — the "Forgot password?" link is always visible there (D-303).
    void this.router.navigate(['/login']);
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  private checkRequirements(val: string): PasswordRequirements {
    return {
      minLength:  val.length >= 8,
      hasUpper:   /[A-Z]/.test(val),
      hasLower:   /[a-z]/.test(val),
      hasNumber:  /[0-9]/.test(val),
      hasSpecial: /[^A-Za-z0-9]/.test(val)
    };
  }
}
