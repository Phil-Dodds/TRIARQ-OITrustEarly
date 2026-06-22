// user-profile.service.ts — Pathways OI Trust
// Resolves and caches the authenticated user's public.users profile.
// Contract 19 (D-394): boolean role flags on the profile drive role-aware UI.
// Called once after login; cached for the session.
// Matches profile by Supabase user ID (D-248 — email+password auth, no dev bypass).

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { McpService } from './mcp.service';
import { AuthService } from './auth.service';
import { User } from '../types/database';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private _profile$ = new BehaviorSubject<User | null>(null);
  private _loading$ = new BehaviorSubject<boolean>(false);

  profile$: Observable<User | null>  = this._profile$.asObservable();
  loading$: Observable<boolean>      = this._loading$.asObservable();

  constructor(
    private readonly mcp:  McpService,
    private readonly auth: AuthService
  ) {}

  /** Loads the current user's public.users profile via division-mcp. */
  async loadProfile(): Promise<User | null> {
    const authUser = this.auth.getCurrentUser();
    if (!authUser) return null;

    this._loading$.next(true);
    try {
      const response = await firstValueFrom(
        this.mcp.call<User[]>('division', 'list_users', {})
      );
      if (!response.success || !response.data) return null;

      // Match by Supabase user ID — the public.users.id is the Supabase auth UUID (D-248).
      const profile = response.data.find(u => u.id === authUser.id) ?? null;

      this._profile$.next(profile);
      return profile;
    } catch {
      return null;
    } finally {
      this._loading$.next(false);
    }
  }

  getCurrentProfile(): User | null {
    return this._profile$.value;
  }

  /**
   * Security gate helper. Resolves whether the authenticated identity is allowed
   * into the app, distinguishing a definitive refusal from a transient failure:
   *   'registered'   — an active public.users row matches the Supabase auth id.
   *   'unregistered' — the lookup SUCCEEDED but no active row matched (refuse).
   *   'error'        — the lookup failed (transient) — do NOT sign a user out on this.
   * Supabase OTP authenticates any email, so this is what actually gates access.
   */
  async resolveAccess(): Promise<'registered' | 'unregistered' | 'error'> {
    const authUser = this.auth.getCurrentUser();
    if (!authUser) return 'error';

    this._loading$.next(true);
    try {
      const response = await firstValueFrom(
        this.mcp.call<User[]>('division', 'list_users', {})
      );
      if (!response.success || !response.data) return 'error';

      const profile = response.data.find(u => u.id === authUser.id) ?? null;
      this._profile$.next(profile);

      if (!profile) return 'unregistered';
      if (profile.is_active === false) return 'unregistered';
      return 'registered';
    } catch {
      return 'error';
    } finally {
      this._loading$.next(false);
    }
  }

  /** True if user has at least one Division membership (determines onboarding vs home). */
  hasAnyDivision(): boolean {
    // Resolved by checking get_user_divisions in the home screen component
    // This is a session-level flag set after the Division check
    return this._hasDivision;
  }

  private _hasDivision = false;

  setHasDivision(value: boolean): void {
    this._hasDivision = value;
  }

  /**
   * Returns all active users sorted by display_name.
   * Used by DS/CB assignment pickers — available to all roles.
   */
  listUsers(): Observable<User[]> {
    return new Observable(observer => {
      firstValueFrom(this.mcp.call<User[]>('division', 'list_users', {}))
        .then(response => {
          if (!response.success || !response.data) {
            observer.next([]);
          } else {
            const users = response.data
              .filter(u => u.is_active)
              .sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''));
            observer.next(users);
          }
          observer.complete();
        })
        .catch(() => { observer.next([]); observer.complete(); });
    });
  }

  /**
   * Returns all active users with is_admin = true.
   * Contract 19 (CC-19-01): phil collapsed into is_admin; the "phil-first" sort
   * is retired and admins are sorted purely by display_name.
   * Used by the Contact an Admin screen — available to all roles.
   */
  listAdmins(): Observable<User[]> {
    return new Observable(observer => {
      firstValueFrom(this.mcp.call<User[]>('division', 'list_users', {}))
        .then(response => {
          if (!response.success || !response.data) {
            observer.next([]);
          } else {
            const admins = response.data
              .filter(u => u.is_active && u.is_admin === true)
              .sort((a, b) => (a.display_name ?? '').localeCompare(b.display_name ?? ''));
            observer.next(admins);
          }
          observer.complete();
        })
        .catch(() => {
          observer.next([]);
          observer.complete();
        });
    });
  }

  clearProfile(): void {
    this._profile$.next(null);
    this._hasDivision = false;
  }
}
