// auth.service.ts — Pathways OI Trust
// Manages authentication state.
// This is the ONLY file in the Angular app that imports @supabase/supabase-js.
//
// Current mode: DEV BYPASS — user enters TRIARQ email, no verification.
// Magic link (D-142) is preserved below. Re-enable by:
//   1. Calling sendMagicLink() from login.component.ts instead of devSignIn()
//   2. Removing DEV_BYPASS_TOKEN from Render environment variables

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// localStorage key for the dev-bypass email.
const DEV_EMAIL_KEY = 'oi_dev_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient;

  private _session$     = new BehaviorSubject<Session | null>(null);
  private _user$        = new BehaviorSubject<User | null>(null);
  // Resolves to true once getSession() has returned — covers magic link token
  // exchange on the first page load. Guards await this before checking session.
  private _initialized$ = new BehaviorSubject<boolean>(false);

  session$:     Observable<Session | null> = this._session$.asObservable();
  user$:        Observable<User | null>    = this._user$.asObservable();
  initialized$: Observable<boolean>        = this._initialized$.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession:   true,
          autoRefreshToken: true,
          // PKCE flow: Supabase sends ?code=xxx in the callback URL instead of
          // #access_token=xxx in the hash. The code can only be exchanged by the
          // browser that initiated the sign-in (code verifier in localStorage).
          // This defeats Mimecast / Proofpoint link-scanning — they visit the URL
          // but cannot complete the exchange without the verifier, so the code
          // remains valid for the real user's click.
          flowType: 'pkce'
        }
      }
    );

    // getSession() resolves AFTER Supabase has processed any magic-link tokens
    // in window.location.hash — so awaiting this guarantees the session is set
    // before the auth guard makes its allow/deny decision.
    this.supabase.auth.getSession().then(({ data }) => {
      this._session$.next(data.session);
      this._user$.next(data.session?.user ?? null);
      this._initialized$.next(true);
    });

    // Keep in sync with Supabase auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session$.next(session);
      this._user$.next(session?.user ?? null);
    });
  }

  /** Resolves once the initial session check is complete. Used by authGuard. */
  waitForInit(): Promise<boolean> {
    return firstValueFrom(this._initialized$.pipe(filter(v => v)));
  }

  // ── Dev bypass ─────────────────────────────────────────────────────────────

  /**
   * Dev-mode sign-in. Stores email in localStorage — no verification.
   * Any @triarqhealth.com address is accepted.
   * Replace with sendMagicLink() call in login.component.ts to re-enable magic link.
   */
  devSignIn(email: string): { error: string | null } {
    const normalised = email.trim().toLowerCase();
    if (!normalised.endsWith('@triarqhealth.com')) {
      return { error: 'Use your @triarqhealth.com work email.' };
    }
    localStorage.setItem(DEV_EMAIL_KEY, normalised);
    return { error: null };
  }

  /** Returns the stored dev-bypass email, or null if not in dev mode. */
  getDevEmail(): string | null {
    return localStorage.getItem(DEV_EMAIL_KEY);
  }

  // ── Shared ─────────────────────────────────────────────────────────────────

  /** Signs out — clears both Supabase session and dev bypass email. */
  async signOut(): Promise<void> {
    localStorage.removeItem(DEV_EMAIL_KEY);
    await this.supabase.auth.signOut();
  }

  /**
   * Returns the token string for MCP Authorization headers.
   * Real Supabase session (magic link) → returns the JWT directly.
   * Dev bypass → returns devbypass::<token>::<email>, decoded by MCP middleware.
   * McpService sends this as: Authorization: Bearer <value>.
   */
  getAccessToken(): string | null {
    // Real session takes precedence (magic link re-enable path)
    if (this._session$.value?.access_token) {
      return this._session$.value.access_token;
    }
    // Dev bypass — packed into the single token string so McpService needs no changes
    const devEmail = localStorage.getItem(DEV_EMAIL_KEY);
    if (devEmail) {
      return `devbypass::${environment.devBypassToken}::${devEmail}`;
    }
    return null;
  }

  /** Returns the current authenticated user (Supabase User or null). */
  getCurrentUser(): User | null {
    return this._user$.value;
  }

  /** True if a valid Supabase session OR a dev bypass email is stored. */
  isAuthenticated(): boolean {
    return !!this._session$.value || !!localStorage.getItem(DEV_EMAIL_KEY);
  }

  // ── Magic link (D-142) — preserved for re-enable ───────────────────────────

  /** Sends a magic link to the given email (D-142). Re-enable in login.component.ts. */
  async sendMagicLink(email: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo:  environment.appUrl
      }
    });
    return { error: error?.message ?? null };
  }
}
