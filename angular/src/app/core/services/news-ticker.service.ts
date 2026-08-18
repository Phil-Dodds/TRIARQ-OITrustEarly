// news-ticker.service.ts — bottom news banner feed.
// Thin wrapper over division-mcp get_news_ticker (Arch-1). Presentation
// components subscribe; no logic here beyond the call.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { McpService } from './mcp.service';

export type ReactionEmoji = 'heart' | 'clap' | 'triarq';

export interface NewsReaction {
  emoji: ReactionEmoji;
  count: number;
  mine: boolean;
}

export interface NewsTickerItem {
  // 'notice' is a pinned operator announcement driven by the NEWS_TICKER_NOTICE
  // env var on division-mcp, not synthesised from activity like the others.
  // It always sorts first and carries no reactions.
  kind: 'gate' | 'meeting' | 'egg' | 'user' | 'status' | 'ack' | 'notice';
  news_item_key: string;
  text: string;
  asset_ref?: string | null;
  occurred_at: string;
  reactions: NewsReaction[];
}

@Injectable({ providedIn: 'root' })
export class NewsTickerService {
  // Whether the banner strip is actually rendered (not hidden AND has items).
  // The banner component reports it; the app shell reserves/reclaims the
  // bottom 38px accordingly — content never sits under the banner, and the
  // space comes back the moment the banner hides.
  private readonly bannerVisibleSubject = new BehaviorSubject<boolean>(false);
  readonly bannerVisible$: Observable<boolean> = this.bannerVisibleSubject.asObservable();

  constructor(private readonly mcp: McpService) {}

  setBannerVisible(visible: boolean): void {
    if (this.bannerVisibleSubject.value !== visible) this.bannerVisibleSubject.next(visible);
  }

  getTicker(): Observable<NewsTickerItem[]> {
    return new Observable<NewsTickerItem[]>(sub => {
      this.mcp.call<{ items: NewsTickerItem[] }>('division', 'get_news_ticker', {}).subscribe({
        next: (res) => { sub.next(res.success && res.data ? res.data.items : []); sub.complete(); },
        error: () => { sub.next([]); sub.complete(); }
      });
    });
  }

  /** Toggle the caller's reaction; returns the resulting reacted state. */
  toggleReaction(news_item_key: string, emoji: ReactionEmoji): Observable<boolean> {
    return new Observable<boolean>(sub => {
      this.mcp.call<{ reacted: boolean }>('division', 'toggle_news_banner_reaction', { news_item_key, emoji }).subscribe({
        next: (res) => { sub.next(!!(res.success && res.data && res.data.reacted)); sub.complete(); },
        error: () => { sub.next(false); sub.complete(); }
      });
    });
  }
}
