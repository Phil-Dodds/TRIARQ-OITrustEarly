import {
  AuthService,
  McpService
} from "./chunk-SQSDYRWS.js";
import {
  __async
} from "./chunk-DSWO3WHD.js";

// src/app/core/services/user-profile.service.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";
import * as i0 from "@angular/core";
var UserProfileService = class _UserProfileService {
  constructor(mcp, auth) {
    this.mcp = mcp;
    this.auth = auth;
    this._profile$ = new BehaviorSubject(null);
    this._loading$ = new BehaviorSubject(false);
    this.profile$ = this._profile$.asObservable();
    this.loading$ = this._loading$.asObservable();
    this._hasDivision = false;
  }
  /** Loads the current user's public.users profile via division-mcp. */
  loadProfile() {
    return __async(this, null, function* () {
      const devEmail = this.auth.getDevEmail();
      const authUser = this.auth.getCurrentUser();
      if (!devEmail && !authUser)
        return null;
      this._loading$.next(true);
      try {
        const response = yield firstValueFrom(this.mcp.call("division", "list_users", {}));
        if (!response.success || !response.data)
          return null;
        const profile = devEmail ? response.data.find((u) => u.email?.toLowerCase() === devEmail) ?? null : response.data.find((u) => u.id === authUser.id) ?? null;
        this._profile$.next(profile);
        return profile;
      } catch {
        return null;
      } finally {
        this._loading$.next(false);
      }
    });
  }
  getCurrentProfile() {
    return this._profile$.value;
  }
  getCurrentRole() {
    return this._profile$.value?.system_role ?? null;
  }
  /** True if user has at least one Division membership (determines onboarding vs home). */
  hasAnyDivision() {
    return this._hasDivision;
  }
  setHasDivision(value) {
    this._hasDivision = value;
  }
  /**
   * Returns all active users sorted by display_name.
   * Used by DS/CB assignment pickers — available to all roles.
   */
  listUsers() {
    return new Observable((observer) => {
      firstValueFrom(this.mcp.call("division", "list_users", {})).then((response) => {
        if (!response.success || !response.data) {
          observer.next([]);
        } else {
          const users = response.data.filter((u) => u.is_active).sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));
          observer.next(users);
        }
        observer.complete();
      }).catch(() => {
        observer.next([]);
        observer.complete();
      });
    });
  }
  /**
   * Returns all active users whose system_role is 'phil' or 'admin'.
   * Used by the Contact an Admin screen — available to all roles.
   */
  listAdmins() {
    return new Observable((observer) => {
      firstValueFrom(this.mcp.call("division", "list_users", {})).then((response) => {
        if (!response.success || !response.data) {
          observer.next([]);
        } else {
          const admins = response.data.filter((u) => u.is_active && (u.system_role === "phil" || u.system_role === "admin")).sort((a, b) => {
            if (a.system_role === "phil")
              return -1;
            if (b.system_role === "phil")
              return 1;
            return (a.display_name ?? "").localeCompare(b.display_name ?? "");
          });
          observer.next(admins);
        }
        observer.complete();
      }).catch(() => {
        observer.next([]);
        observer.complete();
      });
    });
  }
  clearProfile() {
    this._profile$.next(null);
    this._hasDivision = false;
  }
  static {
    this.\u0275fac = function UserProfileService_Factory(t) {
      return new (t || _UserProfileService)(i0.\u0275\u0275inject(McpService), i0.\u0275\u0275inject(AuthService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({ token: _UserProfileService, factory: _UserProfileService.\u0275fac, providedIn: "root" });
  }
};

export {
  UserProfileService
};
//# sourceMappingURL=chunk-G46Y23DK.js.map
