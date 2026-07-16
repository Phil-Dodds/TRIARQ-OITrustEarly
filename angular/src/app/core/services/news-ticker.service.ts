// news-ticker.service.ts — bottom news banner feed.
// Thin wrapper over division-mcp get_news_ticker (Arch-1). Presentation
// components subscribe; no logic here beyond the call.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McpService } from './mcp.service';

export type ReactionEmoji = 'heart' | 'clap' | 'triarq';

export interface NewsReaction {
  emoji: ReactionEmoji;
  count: number;
  mine: boolean;
}

export interface NewsTickerItem {
  kind: 'gate' | 'meeting' | 'egg' | 'user' | 'status' | 'ack';
  news_item_key: string;
  text: string;
  asset_ref?: string | null;
  occurred_at: string;
  reactions: NewsReaction[];
}

@Injectable({ providedIn: 'root' })
export class NewsTickerService {
  constructor(private readonly mcp: McpService) {}

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
