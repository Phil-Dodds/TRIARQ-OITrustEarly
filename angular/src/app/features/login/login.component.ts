// login.component.ts — Pathways OI Trust
// Dev-mode login: user enters TRIARQ email, no verification required.
// Magic link (D-142) re-enable: swap devSignIn() call back to sendMagicLink()
// and restore the 'sent' state template.

import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router }      from '@angular/router';

type LoginState = 'idle' | 'signing-in' | 'error';

@Component({
  selector:        'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-login-shell">
      <div class="oi-login-card oi-card">

        <div class="oi-login-brand">
          <h3>Pathways OI Trust</h3>
          <p class="oi-login-subtitle">Organizational Intelligence Platform</p>
        </div>

        <!-- Callback error notice — shown when redirected back from a failed magic link -->
        <div *ngIf="callbackErrorPrimary" class="oi-callback-notice">
          <p class="oi-notice-primary">{{ callbackErrorPrimary }}</p>
          <p class="oi-notice-secondary">{{ callbackErrorSecondary }}</p>
        </div>

        <!-- Email form -->
        <form [formGroup]="loginForm"
              (ngSubmit)="onSubmit()"
              novalidate>

          <div class="oi-field">
            <label for="email">Work email</label>
            <input id="email"
                   type="email"
                   formControlName="email"
                   autocomplete="email"
                   placeholder="you@triarqhealth.com"
                   [class.oi-input-error]="emailInvalid" />
            <p *ngIf="emailInvalid" class="oi-field-error">Enter a valid email address.</p>
          </div>

          <!-- D-140 blocked action pattern for auth errors -->
          <app-blocked-action
            *ngIf="state === 'error'"
            [primaryMessage]="errorMessage"
            [secondaryMessage]="''">
          </app-blocked-action>

          <button type="submit"
                  class="oi-btn-primary"
                  [disabled]="state === 'signing-in'">
            {{ state === 'signing-in' ? 'Signing in…' : 'Sign in' }}
          </button>

        </form>

      </div>
    </div>
  `,
  styles: [`
    .oi-login-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--triarq-color-background);
    }
    .oi-login-card {
      width: 100%;
      max-width: 400px;
      padding: var(--triarq-space-2xl);
    }
    .oi-login-brand { text-align: center; margin-bottom: var(--triarq-space-xl); }
    .oi-login-brand h3 { color: var(--triarq-color-primary); margin: 0 0 var(--triarq-space-xs) 0; }
    .oi-login-subtitle { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); margin: 0; }

    .oi-field { margin-bottom: var(--triarq-space-md); }
    label { display: block; font-size: var(--triarq-text-small); font-weight: var(--triarq-font-weight-medium); margin-bottom: var(--triarq-space-xs); }
    input[type="email"] {
      width: 100%;
      padding: var(--triarq-space-sm) var(--triarq-space-md);
      border: 1px solid var(--triarq-color-border);
      border-radius: var(--triarq-radius-input);
      font-family: var(--triarq-font-family);
      font-size: var(--triarq-text-body);
      box-sizing: border-box;
    }
    input[type="email"]:focus { outline: 2px solid var(--triarq-color-primary); border-color: transparent; }
    .oi-input-error { border-color: var(--triarq-color-error); }
    .oi-field-error { color: var(--triarq-color-error); font-size: var(--triarq-text-caption); margin: var(--triarq-space-xs) 0 0 0; }

    .oi-btn-primary {
      width: 100%;
      padding: var(--triarq-space-sm) var(--triarq-space-md);
      background: var(--triarq-color-primary);
      color: #fff;
      border: none;
      border-radius: var(--triarq-radius-button);
      font-family: var(--triarq-font-family);
      font-size: var(--triarq-text-body);
      font-weight: var(--triarq-font-weight-medium);
      cursor: pointer;
      margin-top: var(--triarq-space-md);
    }
    .oi-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .oi-btn-primary:hover:not(:disabled) { background: var(--triarq-color-primary-dark); }

    .oi-callback-notice {
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: var(--triarq-radius-card);
      padding: var(--triarq-space-sm) var(--triarq-space-md);
      margin-bottom: var(--triarq-space-md);
    }
    .oi-notice-primary { font-size: var(--triarq-text-small); font-weight: var(--triarq-font-weight-medium); margin: 0 0 var(--triarq-space-xs) 0; color: var(--triarq-color-text-primary); }
    .oi-notice-secondary { font-size: var(--triarq-text-caption); color: var(--triarq-color-text-secondary); margin: 0; }

    .oi-login-sent { text-align: center; }
    .oi-sent-primary { font-size: var(--triarq-text-h4); font-weight: var(--triarq-font-weight-medium); margin-bottom: var(--triarq-space-sm); }
    .oi-sent-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); line-height: 1.6; margin-bottom: var(--triarq-space-xs); }
    .oi-sent-expiry { font-size: var(--triarq-text-caption); color: var(--triarq-color-text-secondary); margin: 0 0 var(--triarq-space-sm) 0; }
    .oi-sent-browser-note {
      font-size: var(--triarq-text-caption);
      color: var(--triarq-color-text-secondary);
      background: var(--triarq-color-surface);
      border-radius: var(--triarq-radius-card);
      padding: var(--triarq-space-xs) var(--triarq-space-sm);
      margin: var(--triarq-space-sm) 0;
      line-height: 1.5;
    }
    .oi-btn-ghost { background: none; border: none; color: var(--triarq-color-primary); cursor: pointer; font-size: var(--triarq-text-small); margin-top: var(--triarq-space-md); text-decoration: underline; }
  `]
})
export class LoginComponent implements OnInit {
  state:        LoginState = 'idle';
  errorMessage  = '';

  // Shown when redirected back from a failed magic-link callback (re-enable path).
  callbackErrorPrimary   = '';
  callbackErrorSecondary = '';

  loginForm: FormGroup;

  constructor(
    private readonly fb:     FormBuilder,
    private readonly auth:   AuthService,
    private readonly router: Router,
    private readonly cdr:    ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Reads error reason passed via navigation state from AuthCallbackComponent
    // (magic link re-enable path — harmless no-op in dev bypass mode).
    const navState = history.state as { callbackError?: string };
    if (navState?.callbackError) {
      const code = navState.callbackError;
      if (code === 'otp_expired') {
        this.callbackErrorPrimary   = 'Your sign-in link has expired.';
        this.callbackErrorSecondary = 'Links are valid for 1 hour. Request a new one below.';
      } else if (code === 'otp_disabled') {
        this.callbackErrorPrimary   = 'Sign-in links are not enabled for this account.';
        this.callbackErrorSecondary = 'Contact your System Admin.';
      } else {
        this.callbackErrorPrimary   = 'Your sign-in link is invalid.';
        this.callbackErrorSecondary = 'This can happen if the link was already used. Request a new one below.';
      }
    }
  }

  get emailInvalid(): boolean {
    const ctrl = this.loginForm.get('email');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  async onSubmit(): Promise<void> {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.state = 'signing-in';
    this.cdr.markForCheck();

    // Dev bypass — no email sent, navigates directly to home.
    // Re-enable magic link: replace this block with sendMagicLink() call.
    const { error } = this.auth.devSignIn(this.loginForm.value.email);

    if (error) {
      this.state        = 'error';
      this.errorMessage = error;
      this.cdr.markForCheck();
      return;
    }

    await this.router.navigate(['/home'], { replaceUrl: true });
  }
}
