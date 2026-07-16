// news-ticker.service.ts — bottom news banner feed.
// Thin wrapper over division-mcp get_news_ticker (Arch-1). Presentation
// components subscribe; no logic here beyond the call.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { McpService } from './mcp.service';

export interface NewsTickerItem {
  kind: 'gate' | 'meeting' | 'egg' | 'user';
  text: string;
  asset_ref?: string | null;
  occurred_at: string;
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
}
