// auth.service.ts — Pathways OI Trust
// Manages authentication state via Supabase email+password with invite flow (D-248).
// Persistent session via localStorage (D-301).
// This is the ONLY file in the Angular app that imports @supabase/supabase-js.
//
// CCode-decision CC-AUTH-001: Supabase password expiry error for signInWithPassword.
//   Supabase does not publish a distinct "password_expired" error code from
//   signInWithPassword in the JS SDK v2. Password expiry is a project-level setting.
//   When triggered, Supabase likely returns an AuthApiError with a message substring
//   matching "password" and "expir". The implementation below uses regex matching.
//   This decision documents that the exact error code/message MUST be verified against
//   the live Supabase project after 90-day expiry is enabled in the dashboard.

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// sessionStorage key: marks the session as transient (Remember Me was unchecked).
// On beforeunload, sign out if this key is present.
const SESSION_TRANSIENT_KEY = 'oi_session_transient';

export type SignInResult =
  | { success: true }
  | { success: false; error: string; isLockout?: boolean; isExpired?: boolean };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient;

  private _session$     = new BehaviorSubject<Session | null>(null);
  private _user$        = new BehaviorSubject<User | null>(null);
  // Resolves to true once getSession() has returned.
  // Guards await this before checking session so URL tokens are processed first.
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
          // PKCE flow: Supabase sends ?code=xxx in callback URL instead of
          // #access_token=xxx in hash. Defeats Mimecast / Proofpoint link-scanning —
          // link-scanners visit the URL but cannot complete the exchange without the
          // PKCE code verifier stored in the originating browser.
          flowType: 'pkce'
        }
      }
    );

    // getSession() resolves after Supabase processes any URL tokens.
    // Awaiting _initialized$ guarantees session is set before auth guards fire.
    this.supabase.auth.getSession().then(({ data }) => {
      this._session$.next(data.session);
      this._user$.next(data.session?.user ?? null);
      this._initialized$.next(true);
    });

    // Stay in sync with Supabase auth state changes (token refresh, sign-out, etc.)
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session$.next(session);
      this._user$.next(session?.user ?? null);
    });

    // D-301: If Remember Me was not checked, sign out when the browser tab closes.
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (sessionStorage.getItem(SESSION_TRANSIENT_KEY)) {
          // Best-effort fire-and-forget on tab close.
          void this.supabase.auth.signOut();
        }
      });
    }
  }

  /**
   * Resolves once auth state is ready for the guard to check.
   * Waits for getSession() to complete so URL tokens are processed first.
   */
  waitForInit(): Promise<boolean> {
    return firstValueFrom(this._initialized$.pipe(filter(v => v)));
  }

  // ── Sign in ──────────────────────────────────────────────────────────────────

  /**
   * Signs in with email + password (D-248).
   * rememberMe=true (default): session persists in localStorage for up to 1 week via Supabase refresh token.
   * rememberMe=false: session cleared when the browser tab closes.
   */
  async signInWithPassword(email: string, password: string, rememberMe: boolean): Promise<SignInResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: password
    });

    if (error) {
      const msg = error.message ?? '';

      // Password expiry (CC-AUTH-001 — exact error code TBC from live Supabase testing).
      if (/password.*expir/i.test(msg) || (error as { code?: string }).code === 'password_expired') {
        return { success: false, error: msg, isExpired: true };
      }

      // Account lockout after 3 failed attempts within 120 min (HITRUST / D-248).
      // Supabase uses HTTP 429 or a rate-limit message for lockout.
      if (
        error.status === 429 ||
        /too.?many.*(request|attempt)/i.test(msg) ||
        /rate.?limit/i.test(msg) ||
        /account.*lock/i.test(msg)
      ) {
        return { success: false, error: msg, isLockout: true };
      }

      // All other failures return 'generic' so the component shows the D-302 message.
      return { success: false, error: 'generic' };
    }

    if (!data.session) {
      return { success: false, error: 'generic' };
    }

    // D-301 Remember Me: mark as transient if unchecked → sign out on tab close.
    if (!rememberMe) {
      sessionStorage.setItem(SESSION_TRANSIENT_KEY, '1');
    } else {
      sessionStorage.removeItem(SESSION_TRANSIENT_KEY);
    }

    return { success: true };
  }

  // ── Password reset ────────────────────────────────────────────────────────────

  /**
   * Sends a password reset email (D-248, D-303).
   * Intentionally void — caller shows the same confirmation regardless of outcome (D-302).
   */
  async resetPasswordForEmail(email: string): Promise<void> {
    await this.supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: environment.passwordSetUrl
    });
  }

  /**
   * Exchanges a token_hash from an invite or recovery link for a live session.
   * Called by SetPasswordComponent on route load. type: 'invite' | 'recovery'.
   */
  async verifyToken(
    tokenHash: string,
    type: 'invite' | 'recovery'
  ): Promise<{ error: string | null; isExpired: boolean; isUsed: boolean }> {
    const { error } = await this.supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) return { error: null, isExpired: false, isUsed: false };

    const msg = error.message ?? '';
    if (/expir/i.test(msg) || (error as { code?: string }).code === 'otp_expired') {
      return { error: msg, isExpired: true, isUsed: false };
    }
    if (/already.*used/i.test(msg) || /invalid.*token/i.test(msg)) {
      return { error: msg, isExpired: false, isUsed: true };
    }
    return { error: msg, isExpired: false, isUsed: false };
  }

  /**
   * Updates the current user's password after a successful verifyToken() exchange.
   */
  async updatePassword(password: string): Promise<{ error: string | null; isReuse: boolean }> {
    const { error } = await this.supabase.auth.updateUser({ password });

    if (!error) return { error: null, isReuse: false };

    const msg = error.message ?? '';
    if (/reuse/i.test(msg) || /same.*password/i.test(msg) || /password.*histor/i.test(msg)) {
      return { error: msg, isReuse: true };
    }
    return { error: msg, isReuse: false };
  }

  // ── Session ───────────────────────────────────────────────────────────────────

  /** Signs out — clears Supabase session and localStorage. */
  async signOut(): Promise<void> {
    sessionStorage.removeItem(SESSION_TRANSIENT_KEY);
    await this.supabase.auth.signOut();
  }

  /**
   * Returns the Supabase JWT access token for MCP Authorization headers.
   * McpService sends this as: Authorization: Bearer <token>.
   */
  getAccessToken(): string | null {
    return this._session$.value?.access_token ?? null;
  }

  /** Returns the current authenticated Supabase User, or null. */
  getCurrentUser(): User | null {
    return this._user$.value;
  }

  /** True if a valid Supabase session exists in memory (or localStorage). */
  isAuthenticated(): boolean {
    return !!this._session$.value;
  }
}
