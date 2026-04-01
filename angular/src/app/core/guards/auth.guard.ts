// auth.guard.ts — Pathways OI Trust
// Redirects unauthenticated users to /login.
// Functional guard (Angular 15+ style).
//
// IMPORTANT: The guard is async so it waits for AuthService.waitForInit()
// before checking the session. Without this, the guard fires synchronously
// before Supabase has processed the magic-link tokens in window.location.hash,
// causing a false redirect to /login on every OTP callback.

import { inject }              from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }         from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Wait for the initial getSession() call to resolve. This ensures magic-link
  // tokens in the URL are exchanged for a session before we make the decision.
  await auth.waitForInit();

  if (auth.isAuthenticated()) return true;

  router.navigate(['/login']);
  return false;
};
