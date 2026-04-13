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
    <div class="login-wrapper">

      <!-- LEFT PANEL -->
      <div class="login-left">

        <!-- Logo block -->
        <div class="logo-block">
          <img
            src="assets/images/TRIARQ_Logo_rgb.svg"
            alt="TRIARQ Health"
            style="width: 180px; height: auto; display: block;"
          />
          <p class="logo-sub">Pathways Operating System</p>
        </div>

        <!-- Product name + purpose -->
        <div class="product-block">
          <h1 class="product-name">Pathways OI Trust</h1>
          <p class="product-description">
            TRIARQ's platform for delivery workflows, organizational intelligence, and governance.
          </p>
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
            <label class="field-label" for="email">Work Email</label>
            <input id="email"
                   class="email-input"
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
                  class="signin-button"
                  [disabled]="state === 'signing-in'">
            {{ state === 'signing-in' ? 'Signing in…' : 'Sign in' }}
          </button>

        </form>

        <!-- Tagline footer -->
        <div class="tagline-footer">
          <p class="tagline-text">Empower · Optimize · Partner</p>
        </div>

      </div>

      <!-- RIGHT PANEL -->
      <div class="login-right">

        <h2 class="rp-headline">Delivery Cycle management<br/>is in UAT.</h2>

        <div class="feature-list">

          <!-- Bullet 1: AI-First (no subtext) -->
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

          <!-- Bullet 2: Delivery Cycle Tracking -->
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

          <!-- Bullet 3: MCP architecture -->
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

          <!-- Bullet 4: Angular 19 platform foundation -->
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

        <!-- Coming soon footer -->
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
    /* ── Wrapper ── */
    .login-wrapper {
      display: flex;
      min-height: 100vh;
      width: 100%;
      font-family: Arial, sans-serif;
    }

    /* ── Left + right panels (shared layout — Step 7 CSS consolidation) ── */
    .login-left, .login-right {
      flex: 1; display: flex; flex-direction: column; justify-content: center;
    }
    .login-left { background: #ffffff; padding: 3rem 3.5rem; }
    .login-right { background: #12274A; padding: 3rem 3rem; }

    /* ── Logo block ── */
    .logo-block { margin-bottom: 2.5rem; }
    .logo-sub {
      font-size: 10px;
      color: #5A5A5A;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-top: 6px;
      margin-bottom: 0;
    }

    /* ── Product block ── */
    .product-block { margin-bottom: 2rem; }
    .product-name {
      font-size: 26px;
      font-weight: 700;
      color: #12274A;
      line-height: 1.2;
      margin: 0 0 10px 0;
    }
    .product-description {
      font-size: 14px;
      color: #5A5A5A;
      line-height: 1.6;
      max-width: 320px;
      margin: 0;
    }

    /* ── Email field ── */
    .oi-field { margin-bottom: 0; }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #12274A;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .email-input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 14px;
      border: 1.5px solid #d0d4da;
      border-radius: 8px;
      font-size: 14px;
      color: #12274A;
      background: #fafafa;
      outline: none;
      margin-bottom: 1.5rem;
    }
    .email-input:focus { border-color: #0071AF; }
    .oi-input-error { border-color: var(--triarq-color-error) !important; }
    .oi-field-error { color: var(--triarq-color-error); font-size: 12px; margin: -1rem 0 1rem 0; }

    /* ── Sign in button ── */
    .signin-button {
      width: 100%;
      padding: 13px;
      background: #E96127;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.3px;
      cursor: pointer;
    }
    .signin-button:hover:not(:disabled) { background: #c94f1e; }
    .signin-button:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Tagline footer ── */
    .tagline-footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 0.5px solid #e8eaed;
    }
    .tagline-text {
      font-size: 11px;
      color: #A6A6A6;
      letter-spacing: 0.3px;
      margin: 0;
    }

    /* ── Callback error notice ── */
    .oi-callback-notice {
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 1rem;
    }
    .oi-notice-primary { font-size: 13px; font-weight: 600; margin: 0 0 4px 0; color: #12274A; }
    .oi-notice-secondary { font-size: 12px; color: #5A5A5A; margin: 0; }

    /* ── Right panel: headline ── */
    .rp-headline {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      margin: 0 0 1.75rem 0;
    }

    /* ── Feature bullets ── */
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .feature-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .feature-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(233, 97, 39, 0.2);
      border: 1px solid #E96127;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .feature-label {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 2px 0;
    }
    .feature-description {
      font-size: 12px;
      color: #A6A6A6;
      line-height: 1.5;
      margin: 0;
    }

    /* ── Coming soon footer ── */
    .coming-soon {
      border-top: 0.5px solid rgba(255, 255, 255, 0.12);
      padding-top: 1.25rem;
    }
    .coming-soon-label {
      font-size: 11px;
      color: #F2A620;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .coming-soon-items {
      font-size: 12px;
      color: #A6A6A6;
      line-height: 1.6;
      margin: 0;
    }
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
