// user-profile.service.ts — Pathways OI Trust
// Resolves and caches the authenticated user's public.users profile.
// system_role from this profile drives role-aware UI (home screen cards, D-150).
// Called once after login; cached for the session.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { McpService } from './mcp.service';
import { AuthService } from './auth.service';
import { User, SystemRole } from '../types/database';

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
    const devEmail = this.auth.getDevEmail();
    const authUser = this.auth.getCurrentUser();

    // Require either a dev bypass email or a real Supabase session
    if (!devEmail && !authUser) return null;

    this._loading$.next(true);
    try {
      const response = await firstValueFrom(
        this.mcp.call<User[]>('division', 'list_users', {})
      );
      if (!response.success || !response.data) return null;

      // Dev bypass: match by email. Magic link: match by Supabase user ID.
      const profile = devEmail
        ? (response.data.find(u => u.email?.toLowerCase() === devEmail) ?? null)
        : (response.data.find(u => u.id === authUser!.id) ?? null);

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

  getCurrentRole(): SystemRole | null {
    return this._profile$.value?.system_role ?? null;
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
   * Returns all active users whose system_role is 'phil' or 'admin'.
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
              .filter(u => u.is_active && (u.system_role === 'phil' || u.system_role === 'admin'))
              .sort((a, b) => {
                // Phil first, then alphabetical by display_name
                if (a.system_role === 'phil') return -1;
                if (b.system_role === 'phil') return 1;
                return (a.display_name ?? '').localeCompare(b.display_name ?? '');
              });
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
