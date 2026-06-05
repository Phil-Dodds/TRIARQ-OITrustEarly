// version-check.service.ts — Pathways OI Trust
//
// Detects new deploys without forcing the user to hard-reload (Ctrl+Shift+R).
// Designed for the GitHub Pages deploy flow where the index.html may be
// served from cache for up to ~10 minutes after a deploy.
//
// Flow:
//   1. On bootstrap, fetch version.json (no-store) and store the value as
//      `bootVersion`.
//   2. On a 5-minute interval AND on every NavigationEnd, fetch version.json
//      again. If the returned `build_version` differs from `bootVersion`, set
//      updateAvailable to true.
//   3. AppComponent subscribes to `updateAvailable$` and renders a banner
//      with a Reload button. Reload is user-controlled — no auto-redirect.
//
// version.json is emitted by scripts/write-version.js as a postbuild step
// (see package.json). Its shape:
//   { "build_version": "<git sha or ISO timestamp>", "built_at": "<ISO>" }
//
// Failure modes are silent — version-check is quality-of-life, not core.
// First fetch failing means `bootVersion` is null; subsequent fetches that
// fail don't change state. The banner only appears on confirmed mismatch.
//
// CC-20-09 (Contract 20 — operational cache-busting).

import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  filter,
  interval
} from 'rxjs';

/** Polling interval. 5 minutes balances freshness against network noise. */
const POLL_INTERVAL_MS = 5 * 60 * 1000;

/** Relative URL — resolves against `<base href>` so deploys to a subpath
 *  (GitHub Pages /TRIARQ-OITrustEarly/) work without code changes. */
const VERSION_JSON_PATH = 'version.json';

interface VersionPayload {
  build_version: string;
  built_at:      string;
}

@Injectable({ providedIn: 'root' })
export class VersionCheckService implements OnDestroy {

  private readonly updateAvailable = new BehaviorSubject<boolean>(false);
  readonly updateAvailable$: Observable<boolean> = this.updateAvailable.asObservable();

  private bootVersion: string | null = null;
  private bootCaptured              = false;

  private readonly subs = new Subscription();

  constructor(private readonly router: Router) {}

  /** Called once from AppComponent ngOnInit. Starts the initial fetch +
   *  interval + nav-end subscription. */
  init(): void {
    this.checkOnce(); // bootstrap capture

    // Periodic poll. Every 5 minutes — enough to surface a deploy within
    // one coffee-break window without nagging the network.
    this.subs.add(
      interval(POLL_INTERVAL_MS).subscribe(() => this.checkOnce())
    );

    // Navigation-driven check. Cheap, and ensures the user sees the banner
    // as soon as they hop routes after a deploy lands.
    this.subs.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => this.checkOnce())
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  /** Fetch version.json with cache disabled and compare to the boot value. */
  private async checkOnce(): Promise<void> {
    try {
      // Cache-buster query string is belt-and-suspenders alongside no-store.
      // Some intermediate proxies (and old browsers) ignore the cache option
      // but always respect a unique URL.
      const url = `${VERSION_JSON_PATH}?t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store', method: 'GET' });
      if (!res.ok) { return; }
      const payload = (await res.json()) as VersionPayload;
      if (!payload?.build_version) { return; }

      if (!this.bootCaptured) {
        this.bootVersion  = payload.build_version;
        this.bootCaptured = true;
        return;
      }

      if (payload.build_version !== this.bootVersion) {
        if (!this.updateAvailable.value) {
          this.updateAvailable.next(true);
        }
      }
    } catch {
      // Silent — version-check failures must not affect the app's core flow.
    }
  }

  /** Hard reload. Banner Reload button calls this. */
  reloadNow(): void {
    // location.reload() defaults to using the cache; the explicit no-store
    // path above plus the meta tags on index.html should serve the new
    // index, which in turn references the new hashed bundles.
    window.location.reload();
  }
}
