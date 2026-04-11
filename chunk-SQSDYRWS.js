import {
  __async
} from "./chunk-DSWO3WHD.js";

// src/app/core/services/mcp.service.ts
import { Injectable as Injectable2 } from "@angular/core";
import { HttpHeaders } from "@angular/common/http";
import { throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

// src/environments/environment.ts
var environment = {
  production: false,
  supabaseUrl: "https://dpnkxrrtqfqkhuzbljbw.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmt4cnJ0cWZxa2h1emJsamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjEzMjMsImV4cCI6MjA5MDM5NzMyM30.iAUiT3qpUpjxg1JMkybHII48hiEeJW449Gp3rl_UHFQ",
  appUrl: "http://localhost:4201/auth/callback",
  // Dev bypass — must match DEV_BYPASS_TOKEN env var on both Render MCP services.
  // Remove from Render env vars when re-enabling magic link auth.
  devBypassToken: "dev-bypass-oi-trust-2026",
  divisionMcpUrl: "http://localhost:3001",
  documentMcpUrl: "http://localhost:3002",
  deliveryCycleMcpUrl: "http://localhost:3003"
  // Replace with Render URL after deploy
};

// src/app/core/services/mcp.service.ts
import * as i02 from "@angular/core";
import * as i1 from "@angular/common/http";

// src/app/core/services/auth.service.ts
import { Injectable } from "@angular/core";
import { createClient } from "@supabase/supabase-js";
import { BehaviorSubject, filter, firstValueFrom } from "rxjs";
import * as i0 from "@angular/core";
var DEV_EMAIL_KEY = "oi_dev_email";
var AuthService = class _AuthService {
  constructor() {
    this._session$ = new BehaviorSubject(null);
    this._user$ = new BehaviorSubject(null);
    this._initialized$ = new BehaviorSubject(false);
    this.session$ = this._session$.asObservable();
    this.user$ = this._user$.asObservable();
    this.initialized$ = this._initialized$.asObservable();
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PKCE flow: Supabase sends ?code=xxx in the callback URL instead of
        // #access_token=xxx in the hash. The code can only be exchanged by the
        // browser that initiated the sign-in (code verifier in localStorage).
        // This defeats Mimecast / Proofpoint link-scanning — they visit the URL
        // but cannot complete the exchange without the verifier, so the code
        // remains valid for the real user's click.
        flowType: "pkce"
      }
    });
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
  /**
   * Resolves once auth state is ready for the guard to check.
   * Dev bypass: resolves immediately — no token exchange needed.
   * Magic link: waits for getSession() to complete so any hash token is processed.
   */
  waitForInit() {
    if (localStorage.getItem(DEV_EMAIL_KEY)) {
      return Promise.resolve(true);
    }
    return firstValueFrom(this._initialized$.pipe(filter((v) => v)));
  }
  // ── Dev bypass ─────────────────────────────────────────────────────────────
  /**
   * Dev-mode sign-in. Stores email in localStorage — no verification.
   * Any @triarqhealth.com address is accepted.
   * Replace with sendMagicLink() call in login.component.ts to re-enable magic link.
   */
  devSignIn(email) {
    const normalised = email.trim().toLowerCase();
    if (!normalised.endsWith("@triarqhealth.com")) {
      return { error: "Use your @triarqhealth.com work email." };
    }
    localStorage.setItem(DEV_EMAIL_KEY, normalised);
    return { error: null };
  }
  /** Returns the stored dev-bypass email, or null if not in dev mode. */
  getDevEmail() {
    return localStorage.getItem(DEV_EMAIL_KEY);
  }
  // ── Shared ─────────────────────────────────────────────────────────────────
  /** Signs out — clears both Supabase session and dev bypass email. */
  signOut() {
    return __async(this, null, function* () {
      localStorage.removeItem(DEV_EMAIL_KEY);
      yield this.supabase.auth.signOut();
    });
  }
  /**
   * Returns the token string for MCP Authorization headers.
   * Real Supabase session (magic link) → returns the JWT directly.
   * Dev bypass → returns devbypass::<token>::<email>, decoded by MCP middleware.
   * McpService sends this as: Authorization: Bearer <value>.
   */
  getAccessToken() {
    if (this._session$.value?.access_token) {
      return this._session$.value.access_token;
    }
    const devEmail = localStorage.getItem(DEV_EMAIL_KEY);
    if (devEmail) {
      return `devbypass::${environment.devBypassToken}::${devEmail}`;
    }
    return null;
  }
  /** Returns the current authenticated user (Supabase User or null). */
  getCurrentUser() {
    return this._user$.value;
  }
  /** True if a valid Supabase session OR a dev bypass email is stored. */
  isAuthenticated() {
    return !!this._session$.value || !!localStorage.getItem(DEV_EMAIL_KEY);
  }
  // ── Magic link (D-142) — preserved for re-enable ───────────────────────────
  /** Sends a magic link to the given email (D-142). Re-enable in login.component.ts. */
  sendMagicLink(email) {
    return __async(this, null, function* () {
      const { error } = yield this.supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: environment.appUrl
        }
      });
      return { error: error?.message ?? null };
    });
  }
  static {
    this.\u0275fac = function AuthService_Factory(t) {
      return new (t || _AuthService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ i0.\u0275\u0275defineInjectable({ token: _AuthService, factory: _AuthService.\u0275fac, providedIn: "root" });
  }
};

// src/app/core/services/mcp.service.ts
var McpService = class _McpService {
  constructor(http, auth) {
    this.http = http;
    this.auth = auth;
  }
  /**
   * Calls a tool on an MCP server.
   * @param server  - 'division' | 'document'
   * @param tool    - tool name (verb_noun)
   * @param params  - tool parameters object
   */
  call(server, tool, params = {}) {
    const baseUrl = server === "division" ? environment.divisionMcpUrl : server === "delivery" ? environment.deliveryCycleMcpUrl : environment.documentMcpUrl;
    const token = this.auth.getAccessToken();
    if (!token) {
      return throwError(() => new Error("No active session. Please sign in."));
    }
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    });
    return this.http.post(`${baseUrl}/tools/${tool}`, params, { headers }).pipe(map((response) => response), catchError((err) => {
      if (err.status === 401) {
        const serverMsg = err.error?.error ?? "Server authentication failed (401). If you are in dev mode, confirm DEV_BYPASS_TOKEN is set on every MCP server in Render and redeploy.";
        return throwError(() => ({ success: false, error: serverMsg }));
      }
      if (err.error?.success === false) {
        return throwError(() => err.error);
      }
      return throwError(() => ({
        success: false,
        error: "Unable to reach the server. Check your connection and try again."
      }));
    }));
  }
  static {
    this.\u0275fac = function McpService_Factory(t) {
      return new (t || _McpService)(i02.\u0275\u0275inject(i1.HttpClient), i02.\u0275\u0275inject(AuthService));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ i02.\u0275\u0275defineInjectable({ token: _McpService, factory: _McpService.\u0275fac, providedIn: "root" });
  }
};

export {
  AuthService,
  McpService
};
//# sourceMappingURL=chunk-SQSDYRWS.js.map
