// auth.service.ts — Pathways OI Trust
// Email OTP authentication (D-354). Persistent session via hybrid localStorage/
// sessionStorage adapter (D-351). This is the ONLY file in the Angular app that
// imports @supabase/supabase-js.
//
// CCode-decision CC-AUTH-004 (Contract 12 B-29): hybrid storage adapter routes
//   Supabase auth state to localStorage when the user opts into persistent mode
//   ("Keep me signed in") and to sessionStorage otherwise. sessionStorage is
//   wiped automatically when the browser closes, so transient sessions become
//   correctly transient without any beforeunload hook. Persistent sessions live
//   in localStorage where they belong.
//
// Migration note: signInWithPassword retired by D-354 in favor of email OTP.
// resetPasswordForEmail / verifyToken / updatePassword removed — Forgot Password
// surface no longer exists. Email change is admin-only via update_user_email
// MCP tool (D-169).

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

// localStorage flag: set to 'true' when the user opts into a persistent session
// ("Keep me signed in"). Drives the hybrid storage adapter below. D-351.
const REMEMBER_FLAG_KEY = 'oi_session_persistent';

const hybridSupabaseStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REMEMBER_FLAG_KEY) === 'true'
      ? window.localStorage.getItem(key)
      : window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(REMEMBER_FLAG_KEY) === 'true') {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
};

export type SendOtpResult =
  | { success: true }
  | { success: false; error: string };

export type VerifyOtpResult =
  | { success: true }
  | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient;

  private _session$     = new BehaviorSubject<Session | null>(null);
  private _user$        = new BehaviorSubject<User | null>(null);
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
          storage: hybridSupabaseStorage,
          // navigator.locks bypass — contested locks on GitHub Pages static
          // hosting cause "Acquiring an exclusive Navigator LockManager lock"
          // warnings and stale auth state across tabs. Single-tab safe.
          lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
        }
      }
    );

    this.supabase.auth.getSession().then(({ data }) => {
      this._session$.next(data.session);
      this._user$.next(data.session?.user ?? null);
      this._initialized$.next(true);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session$.next(session);
      this._user$.next(session?.user ?? null);
    });
  }

  /** Resolves once getSession() has completed. Guards await this. */
  waitForInit(): Promise<boolean> {
    return firstValueFrom(this._initialized$.pipe(filter(v => v)));
  }

  // ── Sign in (D-354) ──────────────────────────────────────────────────────────

  /**
   * Sends a 6-digit OTP to the user's email (D-354).
   * rememberMe=true: session will persist in localStorage after verifyOtp succeeds.
   * rememberMe=false: session lives in sessionStorage and clears when the browser closes.
   * D-351: REMEMBER_FLAG_KEY is written BEFORE the signInWithOtp call so the
   * hybrid storage adapter routes Supabase's setItem calls correctly.
   */
  async signInWithOtp(email: string, rememberMe: boolean): Promise<SendOtpResult> {
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        window.localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
      } else {
        window.localStorage.removeItem(REMEMBER_FLAG_KEY);
      }
    }

    const { error } = await this.supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase()
    });

    if (error) {
      return { success: false, error: error.message ?? 'send_failed' };
    }
    return { success: true };
  }

  /**
   * Verifies a 6-digit OTP and establishes a session (D-354).
   * type: 'email' covers both login and invite flows — Supabase issues the same
   * OTP shape from signInWithOtp() and inviteUserByEmail() once the email
   * template uses {{ .Token }}.
   */
  async verifyOtp(email: string, token: string): Promise<VerifyOtpResult> {
    const { data, error } = await this.supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type:  'email'
    });

    if (error) {
      return { success: false, error: error.message ?? 'verify_failed' };
    }
    if (!data.session) {
      return { success: false, error: 'no_session' };
    }
    return { success: true };
  }

  // ── Session ───────────────────────────────────────────────────────────────────

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(REMEMBER_FLAG_KEY);
    }
    await this.supabase.auth.signOut();
  }

  /** Supabase JWT for MCP Authorization headers — McpService sends as Bearer. */
  getAccessToken(): string | null {
    return this._session$.value?.access_token ?? null;
  }

  getCurrentUser(): User | null {
    return this._user$.value;
  }

  isAuthenticated(): boolean {
    return !!this._session$.value;
  }
}
