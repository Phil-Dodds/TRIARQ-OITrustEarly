// auth.service.ts — Pathways OI Trust
// Manages Supabase Auth session (email OTP / magic link, D-142).
// Exposes current user and session as observables.
// This is the ONLY file in the Angular app that imports @supabase/supabase-js.
// All MCP calls use the JWT from this service's session.

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient;

  private _session$ = new BehaviorSubject<Session | null>(null);
  private _user$    = new BehaviorSubject<User | null>(null);

  session$: Observable<Session | null> = this._session$.asObservable();
  user$:    Observable<User | null>    = this._user$.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );

    // Initialise from stored session
    this.supabase.auth.getSession().then(({ data }) => {
      this._session$.next(data.session);
      this._user$.next(data.session?.user ?? null);
    });

    // Keep in sync with Supabase auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session$.next(session);
      this._user$.next(session?.user ?? null);
    });
  }

  /** Sends a magic link to the given email (D-142: email OTP, no password). */
  async sendMagicLink(email: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false } // users are created via division-mcp create_user
    });
    return { error: error?.message ?? null };
  }

  /** Signs out and clears session. */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /** Returns the current access token for MCP Authorization headers. */
  getAccessToken(): string | null {
    return this._session$.value?.access_token ?? null;
  }

  /** Returns the current authenticated user. */
  getCurrentUser(): User | null {
    return this._user$.value;
  }

  /** True if a valid session exists. */
  isAuthenticated(): boolean {
    return !!this._session$.value;
  }
}
