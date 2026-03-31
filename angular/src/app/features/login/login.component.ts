// login.component.ts — Pathways OI Trust
// Email OTP / magic link login. No password field (D-142).
// Reactive form. Presentation only — auth logic delegated to AuthService.

import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router }      from '@angular/router';

type LoginState = 'idle' | 'sending' | 'sent' | 'error';

@Component({
  selector:        'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-login-shell">
      <div class="oi-login-card oi-card">

        <div class="oi-login-brand">
          <h3>Pathways OI Trust</h3>
          <p class="oi-login-subtitle">Organisational Intelligence Platform</p>
        </div>

        <!-- Idle / sending state -->
        <form *ngIf="state === 'idle' || state === 'sending' || state === 'error'"
              [formGroup]="loginForm"
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
            [secondaryMessage]="'Check the email address and try again. If you don\'t have an account, contact your System Admin.'">
          </app-blocked-action>

          <button type="submit"
                  class="oi-btn-primary"
                  [disabled]="state === 'sending'">
            {{ state === 'sending' ? 'Sending link…' : 'Send magic link' }}
          </button>

        </form>

        <!-- Sent state -->
        <div *ngIf="state === 'sent'" class="oi-login-sent">
          <p class="oi-sent-primary">Check your email</p>
          <p class="oi-sent-secondary">
            A sign-in link has been sent to <strong>{{ loginForm.value.email }}</strong>.
            Click the link to access your workspace. The link expires in 1 hour.
          </p>
          <button class="oi-btn-ghost" (click)="reset()">Try a different email</button>
        </div>

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

    .oi-login-sent { text-align: center; }
    .oi-sent-primary { font-size: var(--triarq-text-h4); font-weight: var(--triarq-font-weight-medium); margin-bottom: var(--triarq-space-sm); }
    .oi-sent-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); line-height: 1.6; }
    .oi-btn-ghost { background: none; border: none; color: var(--triarq-color-primary); cursor: pointer; font-size: var(--triarq-text-small); margin-top: var(--triarq-space-md); text-decoration: underline; }
  `]
})
export class LoginComponent {
  state:        LoginState = 'idle';
  errorMessage  = '';

  loginForm: FormGroup;

  constructor(
    private readonly fb:   FormBuilder,
    private readonly auth: AuthService,
    private readonly cdr:  ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get emailInvalid(): boolean {
    const ctrl = this.loginForm.get('email');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  async onSubmit(): Promise<void> {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.state = 'sending';
    this.cdr.markForCheck();

    const { error } = await this.auth.sendMagicLink(this.loginForm.value.email);

    if (error) {
      this.state        = 'error';
      this.errorMessage = 'We couldn\'t send the sign-in link.';
    } else {
      this.state = 'sent';
    }

    this.cdr.markForCheck();
  }

  reset(): void {
    this.state = 'idle';
    this.loginForm.reset();
    this.cdr.markForCheck();
  }
}
