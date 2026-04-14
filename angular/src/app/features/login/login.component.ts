// login.component.ts — Pathways OI Trust
// Email + password login with persistent session (D-248, D-301, D-302, D-303).
//
// CCode-decision CC-AUTH-002: Forgot Password placement — inline vs navigate.
//   Decision: inline expandable form below the "Forgot password?" link.
//   Rationale: keeps the user on the login screen, avoids a separate route/component,
//   and the confirmation resolves to the same surface the user started from.
//   A dedicated /auth/forgot-password route was considered but rejected as
//   unnecessary for a single email-field form.

import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService }   from '../../core/services/auth.service';
import { Router }        from '@angular/router';

type LoginState  = 'idle' | 'signing-in' | 'error';
type ForgotState = 'hidden' | 'form' | 'sending' | 'sent';

@Component({
  selector:        'app-login',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">

      <!-- LEFT PANEL -->
      <div class="login-left">

        <div class="logo-block">
          <img
            src="assets/images/TRIARQ_Logo_rgb.svg"
            alt="TRIARQ Health"
            style="width: 180px; height: auto; display: block;"
          />
          <p class="logo-sub">Pathways Operating System</p>
        </div>

        <div class="product-block">
          <h1 class="product-name">Pathways OI Trust</h1>
          <p class="product-description">
            TRIARQ's platform for delivery workflows, organizational intelligence, and governance.
          </p>
        </div>

        <!-- Success banner shown after redirecting from /auth/set-password -->
        <div *ngIf="successBanner" class="oi-success-notice">
          <p class="oi-notice-primary">{{ successBanner }}</p>
        </div>

        <!-- Sign in form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

          <div class="oi-field">
            <label class="field-label" for="email">Work Email</label>
            <input id="email"
                   class="oi-text-input"
                   type="email"
                   formControlName="email"
                   autocomplete="email"
                   placeholder="you@triarqhealth.com"
                   [class.oi-input-error]="emailInvalid" />
            <p *ngIf="emailInvalid" class="oi-field-error">Enter a valid email address.</p>
          </div>

          <div class="oi-field pw-field">
            <label class="field-label" for="password">Password</label>
            <input id="password"
                   class="oi-text-input"
                   [type]="showPassword ? 'text' : 'password'"
                   formControlName="password"
                   autocomplete="current-password"
                   placeholder="Enter your password"
                   [class.oi-input-error]="passwordInvalid" />
            <button type="button" class="show-hide-btn"
                    (click)="showPassword = !showPassword" tabindex="-1">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
            <p *ngIf="passwordInvalid" class="oi-field-error">Password is required.</p>
          </div>

          <!-- Remember me (default: checked) + Forgot password link (D-301, D-303) -->
          <div class="below-password-row">
            <label class="remember-me-label">
              <input type="checkbox" formControlName="rememberMe" class="remember-me-check" />
              Keep me signed in for 1 week
            </label>
            <button type="button" class="forgot-link" (click)="toggleForgotPassword()">
              Forgot password?
            </button>
          </div>

          <!-- Auth error (D-140, D-302) -->
          <div *ngIf="state === 'error'" class="oi-error-block">
            <p class="oi-error-primary">{{ errorMessage }}</p>
            <p *ngIf="errorHint" class="oi-error-secondary">{{ errorHint }}</p>
          </div>

          <button type="submit" class="signin-button" [disabled]="state === 'signing-in'">
            {{ state === 'signing-in' ? 'Signing in…' : 'Sign in' }}
          </button>

        </form>

        <!-- Forgot Password inline form (CC-AUTH-002) -->
        <div *ngIf="forgotState !== 'hidden'" class="forgot-panel">

          <div *ngIf="forgotState === 'sent'" class="oi-success-notice">
            <p class="oi-notice-primary">Check your inbox</p>
            <p class="oi-notice-secondary">
              If an account exists for this email, you'll receive a password reset link shortly.
            </p>
          </div>

          <form *ngIf="forgotState === 'form' || forgotState === 'sending'"
                [formGroup]="forgotForm" (ngSubmit)="onForgotSubmit()" novalidate>
            <p class="forgot-intro">Enter your email and we'll send a reset link.</p>
            <div class="oi-field">
              <label class="field-label" for="forgot-email">Email Address</label>
              <input id="forgot-email"
                     class="oi-text-input"
                     type="email"
                     formControlName="forgotEmail"
                     autocomplete="email"
                     placeholder="you@triarqhealth.com"
                     [class.oi-input-error]="forgotEmailInvalid" />
              <p *ngIf="forgotEmailInvalid" class="oi-field-error">Enter a valid email address.</p>
            </div>
            <button type="submit" class="signin-button" [disabled]="forgotState === 'sending'">
              {{ forgotState === 'sending' ? 'Sending…' : 'Send Reset Link' }}
            </button>
          </form>

        </div>

        <div class="tagline-footer">
          <p class="tagline-text">Empower · Optimize · Partner</p>
        </div>

      </div>

      <!-- RIGHT PANEL -->
      <div class="login-right">

        <h2 class="rp-headline">Delivery Cycle management<br/>is in UAT.</h2>

        <div class="feature-list">

          <div class="feature-item">
            <div class="feature-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline points="2,7 5,10 11,3"
                  stroke="#E96127" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <p class="feature-label">Developed 100% "AI-First" using Claude Code</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline points="2,7 5,10 11,3"
                  stroke="#E96127" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <p class="feature-label">Delivery Cycle Tracking</p>
              <p class="feature-description">Create and track delivery cycles from Context Brief through production release — with named gates, milestone dates, and role-based visibility for DSs and CBs.</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline points="2,7 5,10 11,3"
                  stroke="#E96127" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <p class="feature-label">100% MCP architecture</p>
              <p class="feature-description">Every data operation runs through a governed MCP layer — fully portable to the production AI.TRIARQPathways environment at launch.</p>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline points="2,7 5,10 11,3"
                  stroke="#E96127" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <p class="feature-label">Angular 19 platform foundation</p>
              <p class="feature-description">Built on the same design tokens and component architecture that will power the full Pathways OS — not a prototype, a production foundation.</p>
            </div>
          </div>

        </div>

        <div class="coming-soon">
          <p class="coming-soon-label">Coming soon</p>
          <p class="coming-soon-items">
            OI Library · Embedded AI chat · Analytics capability · Engineering governance
          </p>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .login-wrapper { display: flex; min-height: 100vh; width: 100%; font-family: Arial, sans-serif; }
    .login-left, .login-right { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .login-left  { background: #ffffff; padding: 3rem 3.5rem; }
    .login-right { background: #12274A; padding: 3rem 3rem; }

    .logo-block { margin-bottom: 2.5rem; }
    .logo-sub { font-size: 10px; color: #5A5A5A; letter-spacing: 0.6px; text-transform: uppercase; margin-top: 6px; margin-bottom: 0; }

    .product-block { margin-bottom: 2rem; }
    .product-name { font-size: 26px; font-weight: 700; color: #12274A; line-height: 1.2; margin: 0 0 10px 0; }
    .product-description { font-size: 14px; color: #5A5A5A; line-height: 1.6; max-width: 320px; margin: 0; }

    .oi-field { margin-bottom: 1rem; }
    .pw-field { position: relative; }
    .field-label { display: block; font-size: 12px; font-weight: 600; color: #12274A; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 6px; }
    .oi-text-input { width: 100%; box-sizing: border-box; padding: 12px 14px; border: 1.5px solid #d0d4da; border-radius: 8px; font-size: 14px; color: #12274A; background: #fafafa; outline: none; }
    .oi-text-input:focus { border-color: #0071AF; }
    .oi-input-error { border-color: var(--triarq-color-error) !important; }
    .oi-field-error { color: var(--triarq-color-error); font-size: 12px; margin: 4px 0 0 0; }

    .show-hide-btn { position: absolute; right: 12px; top: 34px; background: none; border: none; font-size: 12px; color: #0071AF; cursor: pointer; padding: 0; }

    .below-password-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .remember-me-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5A5A5A; cursor: pointer; }
    .remember-me-check { cursor: pointer; accent-color: #257099; }
    .forgot-link { background: none; border: none; font-size: 13px; color: #0071AF; cursor: pointer; padding: 0; text-decoration: underline; }

    .oi-error-block { background: #fff3f3; border: 1px solid #f5a0a0; border-radius: 8px; padding: 10px 14px; margin-bottom: 1rem; }
    .oi-error-primary { font-size: 13px; font-weight: 600; color: #c0392b; margin: 0 0 4px 0; }
    .oi-error-secondary { font-size: 12px; color: #5A5A5A; margin: 0; }

    .signin-button { width: 100%; padding: 13px; background: #E96127; color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px; cursor: pointer; }
    .signin-button:hover:not(:disabled) { background: #c94f1e; }
    .signin-button:disabled { opacity: 0.6; cursor: not-allowed; }

    .forgot-panel { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #e8eaed; }
    .forgot-intro { font-size: 13px; color: #5A5A5A; margin: 0 0 1rem 0; line-height: 1.5; }

    .oi-success-notice { background: #e8f5e9; border: 1px solid #81c784; border-radius: 10px; padding: 10px 14px; margin-bottom: 1rem; }
    .oi-notice-primary { font-size: 13px; font-weight: 600; margin: 0 0 4px 0; color: #12274A; }
    .oi-notice-secondary { font-size: 12px; color: #5A5A5A; margin: 0; }

    .tagline-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 0.5px solid #e8eaed; }
    .tagline-text { font-size: 11px; color: #A6A6A6; letter-spacing: 0.3px; margin: 0; }

    .rp-headline { font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3; margin: 0 0 1.75rem 0; }
    .feature-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    .feature-item { display: flex; gap: 14px; align-items: flex-start; }
    .feature-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(233,97,39,0.2); border: 1px solid #E96127; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .feature-label { font-size: 13px; font-weight: 600; color: #ffffff; margin: 0 0 2px 0; }
    .feature-description { font-size: 12px; color: #A6A6A6; line-height: 1.5; margin: 0; }
    .coming-soon { border-top: 0.5px solid rgba(255,255,255,0.12); padding-top: 1.25rem; }
    .coming-soon-label { font-size: 11px; color: #F2A620; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 6px 0; }
    .coming-soon-items { font-size: 12px; color: #A6A6A6; line-height: 1.6; margin: 0; }
  `]
})
export class LoginComponent implements OnInit {
  state:        LoginState  = 'idle';
  forgotState:  ForgotState = 'hidden';
  errorMessage  = '';
  errorHint     = '';
  showPassword  = false;
  successBanner = '';

  loginForm:  FormGroup;
  forgotForm: FormGroup;

  constructor(
    private readonly fb:     FormBuilder,
    private readonly auth:   AuthService,
    private readonly router: Router,
    private readonly cdr:    ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email:      ['', [Validators.required, Validators.email]],
      password:   ['', Validators.required],
      rememberMe: [true]
    });
    this.forgotForm = this.fb.group({
      forgotEmail: ['', [Validators.required, Validators.email]]
    });
  }

  async ngOnInit(): Promise<void> {
    // Show success banner if redirected from /auth/set-password after password set.
    const navState = history.state as { setPasswordSuccess?: boolean };
    if (navState?.setPasswordSuccess) {
      this.successBanner = 'Your password has been set. Please sign in.';
      this.cdr.markForCheck();
    }

    // D-301: if a valid session already exists, skip the login form entirely.
    await this.auth.waitForInit();
    if (this.auth.isAuthenticated()) {
      await this.router.navigate(['/home'], { replaceUrl: true });
    }
  }

  get emailInvalid(): boolean {
    const c = this.loginForm.get('email');
    return !!(c?.invalid && c?.touched);
  }

  get passwordInvalid(): boolean {
    const c = this.loginForm.get('password');
    return !!(c?.invalid && c?.touched);
  }

  get forgotEmailInvalid(): boolean {
    const c = this.forgotForm.get('forgotEmail');
    return !!(c?.invalid && c?.touched);
  }

  async onSubmit(): Promise<void> {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.state        = 'signing-in';
    this.errorMessage = '';
    this.errorHint    = '';
    this.cdr.markForCheck();

    const { email, password, rememberMe } = this.loginForm.value as {
      email: string; password: string; rememberMe: boolean;
    };

    const result = await this.auth.signInWithPassword(email, password, rememberMe);

    if (!result.success) {
      this.state = 'error';

      if (result.isLockout) {
        // Account locked — distinct message per HITRUST (D-248). Not a D-302 generic case.
        this.errorMessage = 'Your account has been temporarily locked. Please try again in 2 hours or reset your password.';
        this.errorHint    = 'Use "Forgot password?" below to reset immediately.';
      } else if (result.isExpired) {
        // Password expired — redirect to set-password with expiry context (D-248, CC-AUTH-001).
        await this.router.navigate(['/auth/set-password'], { queryParams: { reason: 'expired' } });
        return;
      } else {
        // D-302: same message for all other failures — no email enumeration.
        this.errorMessage = 'Invalid email or password.';
        this.errorHint    = '';
      }

      this.cdr.markForCheck();
      return;
    }

    await this.router.navigate(['/home'], { replaceUrl: true });
  }

  toggleForgotPassword(): void {
    this.forgotState = this.forgotState === 'hidden' ? 'form' : 'hidden';
    if (this.forgotState === 'form') this.forgotForm.reset();
    this.cdr.markForCheck();
  }

  async onForgotSubmit(): Promise<void> {
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.invalid) return;

    this.forgotState = 'sending';
    this.cdr.markForCheck();

    // Fire-and-forget — confirmation shows regardless of whether email exists (D-302).
    await this.auth.resetPasswordForEmail(this.forgotForm.value.forgotEmail as string);

    this.forgotState = 'sent';
    this.cdr.markForCheck();
  }
}
