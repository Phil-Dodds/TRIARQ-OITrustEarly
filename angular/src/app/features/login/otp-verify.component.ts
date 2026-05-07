// otp-verify.component.ts — Pathways OI Trust
// Route: /auth/verify-otp
// Receives email via router state from /login (D-354). User enters 6-digit code,
// component calls verifyOtp, navigates to /home on success. Resend link calls
// signInWithOtp again with a 60-second countdown lockout per send.
//
// D-302 (amended by D-354): failed verification message is
// "Invalid or expired code. Please try again." — no account-existence info leaked.
// D-200 Pattern 3: inline error adjacent to submit button.
// S-028 Context A: button label changes to present participle during call.
// S-015: orienting text 11px italic Stone (#5A5A5A).
//
// Direct navigation to this route without email state redirects to /login
// (no orphan OTP-entry surface).

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type OtpState = 'idle' | 'verifying' | 'sending' | 'error';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector:        'app-otp-verify',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, ReactiveFormsModule],
  template: `
    <div class="otp-wrapper">
      <div class="otp-card">

        <!-- Logo -->
        <div class="otp-logo-block">
          <img
            src="assets/images/TRIARQ_Logo_rgb.svg"
            alt="TRIARQ Health"
            style="width: 150px; height: auto; display: block;"
          />
        </div>

        <h1 class="otp-title">Check your email</h1>

        <!-- Orienting text — S-015: 11px italic Stone -->
        <p class="otp-orient">
          We sent a 6-digit code to <strong>{{ email }}</strong>. Enter it below.
        </p>

        <form [formGroup]="otpForm" (ngSubmit)="onSubmit()" novalidate>

          <div class="oi-field">
            <label class="field-label" for="code">Verification Code</label>
            <input id="code"
                   class="oi-text-input"
                   type="text"
                   inputmode="numeric"
                   autocomplete="one-time-code"
                   maxlength="6"
                   formControlName="code"
                   #codeInput
                   placeholder="000000"
                   [class.oi-input-error]="state === 'error'" />
          </div>

          <!-- D-200 Pattern 3: inline error adjacent to submit -->
          <div *ngIf="state === 'error'" class="oi-error-inline">
            <p class="oi-error-text">{{ errorMessage }}</p>
          </div>

          <button type="submit" class="otp-submit" [disabled]="state === 'verifying' || otpForm.invalid">
            {{ state === 'verifying' ? 'Verifying…' : 'Verify Code' }}
          </button>

        </form>

        <!-- Resend block -->
        <div class="otp-resend">
          <span *ngIf="resendCountdown > 0" class="resend-countdown">
            Resend in {{ resendCountdown }}s
          </span>
          <button *ngIf="resendCountdown === 0"
                  type="button"
                  class="resend-link"
                  [disabled]="state === 'sending'"
                  (click)="onResend()">
            {{ state === 'sending' ? 'Sending…' : "Didn't receive a code? Resend" }}
          </button>
        </div>

        <div class="otp-footer">
          <button type="button" class="back-link" (click)="goToLogin()">← Back to Sign In</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .otp-wrapper {
      min-height: 100vh; background: #f5f6fa;
      display: flex; align-items: center; justify-content: center;
      font-family: Arial, sans-serif; padding: 2rem;
    }
    .otp-card {
      background: #ffffff; border-radius: 12px;
      box-shadow: 0 4px 24px rgba(18,39,74,0.10);
      padding: 2.5rem; width: 100%; max-width: 420px;
    }
    .otp-logo-block { margin-bottom: 1.75rem; }
    .otp-title {
      font-size: 22px; font-weight: 700; color: #12274A;
      margin: 0 0 8px 0; line-height: 1.2;
    }
    /* S-015: 11px italic Stone */
    .otp-orient {
      font-size: 11px; font-style: italic; color: #5A5A5A;
      margin: 0 0 1.5rem 0; line-height: 1.5;
    }
    .otp-orient strong { font-style: normal; font-weight: 600; color: #12274A; }

    .oi-field { margin-bottom: 1rem; }
    .field-label {
      display: block; font-size: 12px; font-weight: 600; color: #12274A;
      letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 6px;
    }
    .oi-text-input {
      width: 100%; box-sizing: border-box; padding: 12px 14px;
      border: 1.5px solid #d0d4da; border-radius: 8px;
      font-size: 18px; letter-spacing: 4px; text-align: center;
      color: #12274A; background: #fafafa; outline: none;
    }
    .oi-text-input:focus { border-color: #0071AF; }
    .oi-input-error { border-color: var(--triarq-color-error, #c0392b) !important; }

    /* D-200 Pattern 3: inline error message below the field, above the submit */
    .oi-error-inline { margin-bottom: 1rem; }
    .oi-error-text { color: var(--triarq-color-error, #c0392b); font-size: 12px; margin: 0; }

    .otp-submit {
      width: 100%; padding: 13px; background: #E96127;
      color: #ffffff; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .otp-submit:hover:not(:disabled) { background: #c94f1e; }
    .otp-submit:disabled { opacity: 0.6; cursor: not-allowed; }

    .otp-resend {
      margin-top: 1.25rem; text-align: center;
      font-size: 13px;
    }
    .resend-countdown { color: #5A5A5A; }
    .resend-link {
      background: none; border: none; padding: 0;
      color: #0071AF; cursor: pointer; text-decoration: underline;
      font-size: 13px;
    }
    .resend-link:disabled { opacity: 0.6; cursor: not-allowed; }

    .otp-footer {
      margin-top: 1.5rem; padding-top: 1rem;
      border-top: 0.5px solid #e8eaed; text-align: center;
    }
    .back-link {
      background: none; border: none; padding: 0;
      color: #5A5A5A; font-size: 12px; cursor: pointer;
    }
  `]
})
export class OtpVerifyComponent implements OnInit, OnDestroy {
  state: OtpState = 'idle';
  errorMessage = '';
  email = '';
  rememberMe = true;

  resendCountdown = 0;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  otpForm: FormGroup;

  constructor(
    private readonly fb:     FormBuilder,
    private readonly auth:   AuthService,
    private readonly router: Router,
    private readonly cdr:    ChangeDetectorRef
  ) {
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    const navState = history.state as { email?: string; rememberMe?: boolean } | null;

    if (!navState?.email) {
      void this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.email      = navState.email;
    this.rememberMe = navState.rememberMe ?? true;

    // Start the 60-second resend cooldown immediately — the OTP was just sent.
    this.startResendCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  async onSubmit(): Promise<void> {
    this.otpForm.markAllAsTouched();
    if (this.otpForm.invalid) return;

    this.state        = 'verifying';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const code = this.otpForm.value.code as string;
    const result = await this.auth.verifyOtp(this.email, code);

    if (!result.success) {
      this.state        = 'error';
      this.errorMessage = 'Invalid or expired code. Please try again.';
      this.cdr.markForCheck();
      return;
    }

    await this.router.navigate(['/home'], { replaceUrl: true });
  }

  async onResend(): Promise<void> {
    if (this.resendCountdown > 0 || this.state === 'sending') return;

    this.state        = 'sending';
    this.errorMessage = '';
    this.cdr.markForCheck();

    const result = await this.auth.signInWithOtp(this.email, this.rememberMe);

    if (!result.success) {
      this.state        = 'error';
      this.errorMessage = 'Something went wrong. Please try again.';
      this.cdr.markForCheck();
      return;
    }

    // Clear any previously entered code so the user types the new one fresh.
    this.otpForm.reset();
    this.state = 'idle';
    this.startResendCountdown();
    this.cdr.markForCheck();
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }

  private startResendCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.resendCountdown = RESEND_COOLDOWN_SECONDS;
    this.cdr.markForCheck();

    this.countdownTimer = setInterval(() => {
      this.resendCountdown -= 1;
      if (this.resendCountdown <= 0) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.cdr.markForCheck();
    }, 1000);
  }
}
