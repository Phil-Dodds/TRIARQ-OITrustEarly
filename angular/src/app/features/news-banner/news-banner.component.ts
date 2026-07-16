// news-banner.component.ts — bottom scrolling news banner (all screens).
// A slim fixed strip that celebrates recent positive activity, scrolling
// slowly right-to-left and looping. Polls every few minutes. Pauses on hover.
// Presentation only — data via NewsTickerService → division-mcp.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, timer, switchMap } from 'rxjs';
import { NewsTickerService, NewsTickerItem } from '../../core/services/news-ticker.service';
import { EggIconComponent, EggAssetRef } from '../easter-eggs/egg-icon.component';

const POLL_MS = 180000;        // refresh every 3 minutes
const SECONDS_PER_ITEM = 6;    // scroll pace — higher = slower

@Component({
  selector: 'app-news-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EggIconComponent],
  template: `
    <div class="nb" *ngIf="items.length > 0" aria-label="Recent activity">
      <span class="nb-tag">OI Trust</span>
      <div class="nb-viewport">
        <div class="nb-track" [style.animation-duration.s]="durationSec">
          <!-- items twice for a seamless loop -->
          <span class="nb-item" *ngFor="let it of loopItems; let i = index">
            <app-egg-icon *ngIf="it.kind === 'egg'" [assetRef]="asset(it.asset_ref)" [size]="16"></app-egg-icon>
            <span class="nb-text">{{ it.text }}</span>
            <span class="nb-sep" aria-hidden="true">•</span>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nb {
      position: fixed; left: 0; right: 0; bottom: 0; height: 30px; z-index: 900;
      display: flex; align-items: center; gap: 10px;
      background: var(--triarq-color-deep-navy, #12274A); color: #fff;
      overflow: hidden; font-size: 12.5px;
    }
    .nb-tag {
      flex-shrink: 0; padding: 0 12px; height: 100%; display: flex; align-items: center;
      background: var(--triarq-color-primary, #257099); font-weight: 500;
      letter-spacing: 0.04em; text-transform: uppercase; font-size: 11px;
    }
    .nb-viewport { flex: 1; overflow: hidden; }
    .nb-track {
      display: inline-flex; align-items: center; white-space: nowrap;
      will-change: transform; animation-name: nbScroll; animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    .nb:hover .nb-track { animation-play-state: paused; }
    .nb-item { display: inline-flex; align-items: center; gap: 8px; padding-right: 4px; }
    .nb-text { opacity: 0.95; }
    .nb-sep { opacity: 0.4; padding: 0 14px; }
    @keyframes nbScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  `]
})
export class NewsBannerComponent implements OnInit, OnDestroy {
  items: NewsTickerItem[] = [];
  loopItems: NewsTickerItem[] = [];
  durationSec = 60;
  private sub?: Subscription;

  constructor(private readonly news: NewsTickerService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = timer(0, POLL_MS).pipe(switchMap(() => this.news.getTicker())).subscribe(items => {
      this.items = items;
      this.loopItems = [...items, ...items]; // duplicate for the -50% loop
      this.durationSec = Math.max(30, items.length * SECONDS_PER_ITEM);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  asset(ref: string | null | undefined): EggAssetRef { return (ref as EggAssetRef) || 'egg-01'; }
}
