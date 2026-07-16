// easter-egg.service.ts — Easter Egg Hunt (spec §5, §6, §9)
// The single Angular gateway to the egg MCP tools (Arch-1: components never
// touch Supabase). Loads the caller's basket once, tracks which spots are
// live/found, records finds, and emits a completion signal for the celebration
// overlay. All calls go through division-mcp.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { McpService } from './mcp.service';

export interface EggBasketRow {
  egg_id: string;
  asset_ref: string;
  sort_order: number;
  placement_key: string;
  found: boolean;
  egg_name: string | null;   // revealed only once found (EE-01)
  found_at: string | null;
}

export interface EggBasketState {
  rows: EggBasketRow[];
  totalFound: number;
  totalEggs: number;
  completed: boolean;
  activeKeys: Set<string>;
  foundKeys: Set<string>;
}

export interface EggFindResult {
  egg: { egg_name: string; asset_ref: string; placement_key: string };
  newly_found: boolean;
  already_found: boolean;
  total_found: number;
  total_eggs: number;
  just_completed: boolean;
}

export interface RecentEggFeed {
  finds: Array<{ kind: 'find'; display_name: string; asset_ref: string | null; is_own: boolean; egg_name: string | null; found_at: string }>;
  achievements: Array<{ kind: 'achievement'; display_name: string; achieved_at: string }>;
}

@Injectable({ providedIn: 'root' })
export class EasterEggService {
  private readonly state$ = new BehaviorSubject<EggBasketState | null>(null);
  private readonly completion$ = new Subject<void>();
  private loadStarted = false;

  constructor(private readonly mcp: McpService) {}

  /** Basket state stream — null until first load. */
  get basket$(): Observable<EggBasketState | null> { return this.state$.asObservable(); }

  /** Fires when the caller finds their tenth egg (drives the celebration overlay). */
  get completed$(): Observable<void> { return this.completion$.asObservable(); }

  /** Load once per app session; safe to call from many spots/cards. */
  ensureLoaded(): void {
    if (this.loadStarted) { return; }
    this.loadStarted = true;
    this.reload();
  }

  reload(): void {
    this.mcp.call<{ basket: EggBasketRow[]; total_found: number; total_eggs: number; completed: boolean }>(
      'division', 'get_my_egg_basket', {}
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) { this.publish(res.data); }
      },
      error: () => { /* leave state null — spots simply don't render */ }
    });
  }

  private publish(data: { basket: EggBasketRow[]; total_found: number; total_eggs: number; completed: boolean }): void {
    const rows = data.basket ?? [];
    this.state$.next({
      rows,
      totalFound: data.total_found ?? 0,
      totalEggs: data.total_eggs ?? 0,
      completed: !!data.completed,
      activeKeys: new Set(rows.map(r => r.placement_key)),
      foundKeys: new Set(rows.filter(r => r.found).map(r => r.placement_key))
    });
  }

  /** True when an active, not-yet-found egg sits at this spot (snapshot). */
  isSpotAvailable(key: string): boolean {
    const s = this.state$.value;
    return !!s && s.activeKeys.has(key) && !s.foundKeys.has(key);
  }

  /** Record a find. Returns the result; updates basket + fires completion. */
  async recordFind(placement_key: string): Promise<EggFindResult | null> {
    const res = await firstValueFrom(
      this.mcp.call<EggFindResult>('division', 'find_egg', { placement_key })
    );
    if (!res.success || !res.data) { return null; }
    const data = res.data;
    if (data.newly_found || data.already_found) {
      // Optimistically mark found so every spot/card hides it immediately.
      const s = this.state$.value;
      if (s) {
        s.foundKeys.add(placement_key);
        this.state$.next({ ...s, foundKeys: new Set(s.foundKeys) });
      }
      this.reload(); // refresh names + counts for the cards
    }
    if (data.just_completed) { this.completion$.next(); }
    return data;
  }

  getRecentFinds(limit = 15): Observable<RecentEggFeed> {
    return new Observable<RecentEggFeed>(sub => {
      this.mcp.call<RecentEggFeed>('division', 'get_recent_egg_finds', { limit }).subscribe({
        next: (res) => { sub.next(res.success && res.data ? res.data : { finds: [], achievements: [] }); sub.complete(); },
        error: () => { sub.next({ finds: [], achievements: [] }); sub.complete(); }
      });
    });
  }
}
