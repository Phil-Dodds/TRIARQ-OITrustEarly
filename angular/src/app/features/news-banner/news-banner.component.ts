// news-banner.component.ts — bottom scrolling news banner (all screens).
// A slim fixed strip celebrating recent positive activity, scrolling slowly
// and looping. Hover pauses it; hovering an item reveals a ☺﹢ react button
// that opens an inline emoji picker (❤️ 👏 TRIARQ-Q). Reactions show as chips
// with counts. Polls every 3 min; own reactions update optimistically, others'
// appear on the next poll. Presentation only — data via NewsTickerService.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, timer, switchMap } from 'rxjs';
import { NewsTickerService, NewsTickerItem, NewsReaction, ReactionEmoji } from '../../core/services/news-ticker.service';
import { EggIconComponent, EggAssetRef } from '../easter-eggs/egg-icon.component';

const POLL_MS = 180000;
const SECONDS_PER_ITEM = 6;
const EMOJIS: ReactionEmoji[] = ['heart', 'clap', 'triarq'];

@Component({
  selector: 'app-news-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EggIconComponent],
  template: `
    <!-- Full banner — shown when not hidden and there's something to show -->
    <div class="nb" *ngIf="!hidden && items.length > 0" aria-label="Recent activity" (mouseleave)="onLeave()">
      <div class="nb-tagwrap">
        <button type="button" class="nb-tag" (click)="toggleMenu($event)" aria-label="News banner menu">OI Trust</button>
        <div class="nb-menu" *ngIf="menuOpen" (click)="$event.stopPropagation()">
          <button type="button" (click)="setHidden(true)">Hide news banner</button>
        </div>
      </div>
      <div class="nb-viewport">
        <div class="nb-track" [style.animation-duration.s]="durationSec">
          <span class="nb-item" *ngFor="let it of loopItems; let i = index">
            <app-egg-icon *ngIf="it.kind === 'egg'" [assetRef]="asset(it.asset_ref)" [size]="16"></app-egg-icon>
            <span class="nb-text">{{ it.text }}</span>

            <!-- reaction chips (results): 1 → one icon, no number; 2–3 → that many
                 icons; 4+ → one icon + a count. -->
            <button type="button" class="nb-chip" *ngFor="let r of it.reactions" [class.nb-chip-mine]="r.mine"
                    (click)="react(it, r.emoji); $event.stopPropagation()"
                    [attr.aria-label]="'Toggle your ' + r.emoji + ' reaction'"
                    title="Add yours">
              <ng-container *ngFor="let _ of iconSlots(r.count)">
                <ng-container [ngTemplateOutlet]="glyph" [ngTemplateOutletContext]="{ $implicit: r.emoji, size: 12 }"></ng-container>
              </ng-container>
              <span class="nb-chip-n" *ngIf="r.count > 3">{{ r.count }}</span>
            </button>

            <!-- inline picker (choices) — only for the open item -->
            <span class="nb-picker" *ngIf="openIndex === i">
              <button type="button" class="nb-emoji" *ngFor="let e of emojis"
                      [class.nb-emoji-on]="hasMine(it, e)" (click)="react(it, e)"
                      [attr.aria-label]="'React ' + e">
                <ng-container [ngTemplateOutlet]="glyph" [ngTemplateOutletContext]="{ $implicit: e, size: 16 }"></ng-container>
              </button>
            </span>

            <!-- ☺﹢ react affordance — appears on item hover -->
            <button type="button" class="nb-react-btn" *ngIf="openIndex !== i"
                    (click)="openPicker(i)" aria-label="Add a reaction">☺﹢</button>

            <span class="nb-sep" aria-hidden="true">•</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Collapsed handle — always available to bring the banner back -->
    <div class="nb-handle" *ngIf="hidden">
      <button type="button" class="nb-tag nb-tag-handle" (click)="toggleMenu($event)" aria-label="News banner menu">OI Trust ▸</button>
      <div class="nb-menu nb-menu-handle" *ngIf="menuOpen" (click)="$event.stopPropagation()">
        <button type="button" (click)="setHidden(false)">Show news banner</button>
      </div>
    </div>

    <!-- reaction glyph: heart/clap unicode, triarq = mini Q emblem -->
    <ng-template #glyph let-emoji let-size="size">
      <span *ngIf="emoji === 'heart'" class="nb-g">❤️</span>
      <span *ngIf="emoji === 'clap'" class="nb-g">👏</span>
      <!-- TRIARQ Q on a white disc so the navy arc reads against the dark banner -->
      <span *ngIf="emoji === 'triarq'" class="nb-q">
        <svg [attr.width]="size" [attr.height]="size" viewBox="304 14 84 80" aria-label="TRIARQ">
          <path fill="#12274A" d="M364.5,27.5c-5.5-3.8-12.2-6.1-19.5-5.9C325.6,22,310.2,38,310.2,56.9c0,7.4,2.5,14.2,6.5,19.6c-6.2-6.2-10.1-14.8-10.1-24.3c0-18.9,15.3-34.2,34.2-34.2C350,18,358.3,21.6,364.5,27.5z"/>
          <path fill="#E96127" d="M383.4,90l-12.7-12c4.7-6,7.9-13.8,8.1-23c0.3-11.1-5.4-21.4-14.3-27.5c6.5,6.2,10.6,15,10.6,24.7c0,18.9-15.3,34.2-34.2,34.2c-9.4,0-18-3.8-24.1-10C323,85,333.3,90.3,344,90c7.6-0.3,14.7-2.2,20.9-8.3l1.3,1.3c0,0,0,0,0,0l7.8,7L383.4,90z"/>
          <circle fill="#E96127" cx="358.6" cy="70.5" r="6.1"/>
        </svg>
      </span>
    </ng-template>
  `,
  styles: [`
    .nb {
      position: fixed; left: 0; right: 0; bottom: 0; height: 30px; z-index: 900;
      display: flex; align-items: center; gap: 10px;
      background: var(--triarq-color-deep-navy, #12274A); color: #fff; font-size: 12.5px;
    }
    .nb-tagwrap { position: relative; flex-shrink: 0; height: 100%; }
    .nb-tag {
      flex-shrink: 0; padding: 0 12px; height: 100%; display: flex; align-items: center;
      background: var(--triarq-color-primary, #257099); color: #fff; border: none; cursor: pointer;
      font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; font-size: 11px;
    }
    .nb-menu {
      position: absolute; bottom: 100%; left: 0; margin-bottom: 4px; z-index: 901;
      background: #fff; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.25); overflow: hidden;
    }
    .nb-menu button {
      display: block; width: 100%; text-align: left; white-space: nowrap;
      background: none; border: none; cursor: pointer; padding: 8px 14px;
      font-size: 12px; color: var(--triarq-color-text-primary, #1a1a1a);
    }
    .nb-menu button:hover { background: var(--triarq-color-fog, #F1EFE8); }
    .nb-handle { position: fixed; left: 0; bottom: 0; z-index: 900; }
    .nb-tag-handle {
      height: 24px; border-radius: 0 6px 0 0; opacity: 0.85; font-size: 10px;
    }
    .nb-tag-handle:hover { opacity: 1; }
    .nb-menu-handle { bottom: 24px; }
    .nb-viewport { flex: 1; overflow: hidden; }
    .nb-track {
      display: inline-flex; align-items: center; white-space: nowrap; will-change: transform;
      animation-name: nbScroll; animation-timing-function: linear; animation-iteration-count: infinite;
    }
    .nb:hover .nb-track { animation-play-state: paused; }
    .nb-item { display: inline-flex; align-items: center; gap: 6px; padding-right: 4px; }
    .nb-text { opacity: 0.95; }
    .nb-g { font-size: 12px; line-height: 1; }
    .nb-q { display: inline-flex; align-items: center; justify-content: center;
            background: #fff; border-radius: 50%; padding: 1px; line-height: 0; }
    .nb-chip {
      display: inline-flex; align-items: center; gap: 3px; padding: 1px 6px;
      background: rgba(255,255,255,0.12); border: none; color: #fff; cursor: pointer;
      border-radius: 999px; font-size: 11px;
    }
    .nb-chip:hover { background: rgba(255,255,255,0.28); }
    .nb-chip-mine { background: rgba(233,97,39,0.35); }
    .nb-chip-mine:hover { background: rgba(233,97,39,0.5); }
    .nb-chip-n { opacity: 0.9; }
    .nb-picker { display: inline-flex; align-items: center; gap: 2px; }
    .nb-emoji {
      background: rgba(255,255,255,0.1); border: none; border-radius: 999px; cursor: pointer;
      padding: 2px 6px; display: inline-flex; align-items: center; line-height: 0;
    }
    .nb-emoji:hover { background: rgba(255,255,255,0.25); }
    .nb-emoji-on { background: rgba(233,97,39,0.5); }
    .nb-react-btn {
      background: none; border: none; color: #fff; cursor: pointer; font-size: 12px;
      opacity: 0; padding: 0 2px; transition: opacity .12s;
    }
    .nb-item:hover .nb-react-btn { opacity: 0.85; }
    .nb-react-btn:hover { opacity: 1; }
    .nb-sep { opacity: 0.4; padding: 0 12px; }
    @keyframes nbScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  `]
})
export class NewsBannerComponent implements OnInit, OnDestroy {
  items: NewsTickerItem[] = [];
  loopItems: NewsTickerItem[] = [];
  durationSec = 60;
  openIndex: number | null = null;
  hidden = false;
  menuOpen = false;
  readonly emojis = EMOJIS;
  private static readonly HIDE_KEY = 'oi.newsBanner.hidden';
  private sub?: Subscription;

  constructor(private readonly news: NewsTickerService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    try { this.hidden = localStorage.getItem(NewsBannerComponent.HIDE_KEY) === '1'; } catch { /* ignore */ }
    this.sub = timer(0, POLL_MS).pipe(switchMap(() => this.news.getTicker())).subscribe(items => {
      this.items = items;
      this.rebuildLoop();
      this.durationSec = Math.max(30, items.length * SECONDS_PER_ITEM);
      this.openIndex = null;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private rebuildLoop(): void { this.loopItems = [...this.items, ...this.items]; }

  asset(ref: string | null | undefined): EggAssetRef { return (ref as EggAssetRef) || 'egg-01'; }

  openPicker(i: number): void { this.openIndex = i; this.cdr.markForCheck(); }
  closePicker(): void { this.openIndex = null; this.cdr.markForCheck(); }
  // Hover only affects the reaction picker; the tag menu is a pure click toggle
  // (stays open until an option or the tag is clicked again).
  onLeave(): void { this.openIndex = null; this.cdr.markForCheck(); }

  toggleMenu(event: Event): void { event.stopPropagation(); this.menuOpen = !this.menuOpen; this.cdr.markForCheck(); }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.menuOpen = false;
    try { localStorage.setItem(NewsBannerComponent.HIDE_KEY, hidden ? '1' : '0'); } catch { /* ignore */ }
    this.cdr.markForCheck();
  }

  hasMine(item: NewsTickerItem, emoji: ReactionEmoji): boolean {
    return !!item.reactions.find(r => r.emoji === emoji && r.mine);
  }

  /** 1–3 → that many icon slots (no number); 4+ → one slot (number shown). */
  iconSlots(count: number): number[] {
    return Array.from({ length: count <= 3 ? Math.max(count, 1) : 1 }, (_, i) => i);
  }

  react(item: NewsTickerItem, emoji: ReactionEmoji): void {
    // Optimistic toggle on every item sharing this key (both loop copies share
    // the same object refs from this.items, so mutate the underlying items).
    for (const it of this.items) {
      if (it.news_item_key !== item.news_item_key) { continue; }
      it.reactions = applyToggle(it.reactions, emoji);
    }
    this.rebuildLoop();
    this.openIndex = null;
    this.cdr.markForCheck();
    this.news.toggleReaction(item.news_item_key, emoji).subscribe(); // fire-and-forget; poll reconciles
  }
}

/** Pure optimistic toggle of the caller's reaction on a copy of the array. */
function applyToggle(reactions: NewsReaction[], emoji: ReactionEmoji): NewsReaction[] {
  const next = reactions.map(r => ({ ...r }));
  const existing = next.find(r => r.emoji === emoji);
  if (existing) {
    if (existing.mine) { existing.mine = false; existing.count = Math.max(0, existing.count - 1); }
    else { existing.mine = true; existing.count += 1; }
    return next.filter(r => r.count > 0);
  }
  next.push({ emoji, count: 1, mine: true });
  return next;
}
