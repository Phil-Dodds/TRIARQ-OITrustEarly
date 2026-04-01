// auth-callback.component.ts — Pathways OI Trust
// Silent landing page for Supabase magic-link redirects.
//
// Why this exists:
//   Supabase magic links deliver tokens in the URL hash fragment:
//   .../auth/callback#access_token=xxx&refresh_token=xxx&type=magiclink
//
//   Angular's PathLocationStrategy redirects ('' → 'home') strip the hash
//   before Supabase can read it. By sending emailRedirectTo here instead of
//   the app root, Angular never performs that redirect — this component loads,
//   waits for AuthService.waitForInit() (which calls getSession(), which
//   processes the hash), then navigates to /home or /login based on result.
//
//   No authGuard is placed on this route.

import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-callback-shell">
      <p class="oi-callback-message">Signing you in…</p>
    </div>
  `,
  styles: [`
    .oi-callback-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--triarq-color-background);
    }
    .oi-callback-message {
      color: var(--triarq-color-text-secondary);
      font-family: var(--triarq-font-family);
      font-size: var(--triarq-text-body);
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private readonly auth:   AuthService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    // Check for error params Supabase puts in the hash when OTP verification fails.
    // e.g. #error=access_denied&error_code=otp_expired&error_description=...
    const hash   = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const error  = params.get('error');
    const errorCode = params.get('error_code');
    const errorDesc = params.get('error_description');

    if (error) {
      console.error('[OI Trust] Auth callback error:', error, errorCode, errorDesc);
      // Pass error reason to LoginComponent via navigation state so it can
      // show a contextual message explaining why the user is back on login.
      this.router.navigate(['/login'], {
        replaceUrl: true,
        state: { callbackError: errorCode ?? error }
      });
      return;
    }

    // Wait for Supabase to finish processing the hash tokens.
    await this.auth.waitForInit();

    console.log('[OI Trust] Auth callback — authenticated:', this.auth.isAuthenticated());

    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/home'], { replaceUrl: true });
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
