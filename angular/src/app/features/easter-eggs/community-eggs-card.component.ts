// community-eggs-card.component.ts — Easter Egg Hunt (spec §9)
// Home card: recent finds across all users. Others' finds are anonymous eggs
// with the location withheld (EE-01); the caller's own rows show the name.
// Completion achievements are announced to everyone.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EasterEggService, RecentEggFeed, EggBasketState } from '../../core/services/easter-egg.service';
import { EggIconComponent, EggAssetRef } from './egg-icon.component';

@Component({
  selector: 'app-community-eggs-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EggIconComponent],
  template: `
    <!-- The 340px standard card (CC-38-21) provides the single scroll region —
         no inner feed scroller, or the card shows double scrollbars. -->
    <div class="oi-card" style="box-sizing:border-box;">
      <div style="font-weight:500; margin-bottom:12px;">Egg hunt — community</div>

      <!-- Current hunt leader (spec: name X of 10 + their most recent egg;
           moved here from My Easter Eggs, CC-38-17) — pinned above the feed. -->
      <div *ngIf="basket?.leader as ld"
           style="display:flex; align-items:center; gap:8px; margin-bottom:12px; padding:7px 10px;
                  background:var(--triarq-color-fog,#F1EFE8); border-radius:5px;">
        <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#9E9E9E;">Leader</span>
        <app-egg-icon [assetRef]="asset(ld.last_asset_ref || 'egg-01')" [size]="22"></app-egg-icon>
        <span style="font-size:13px; font-weight:500;">{{ ld.is_me ? 'You' : ld.display_name }}</span>
        <span style="font-size:12px; color:var(--triarq-color-text-secondary,#5A5A5A);">{{ ld.found_count }} of {{ basket?.totalEggs }}</span>
      </div>

      <!-- One reverse-chronological stream (Phil 2026-07-16): completions and
           finds interleave by time, so old "all ten eggs" banners sink as new
           individual finds arrive. Only the leader strip stays pinned. -->
      <div *ngIf="feed as f">
        <ng-container *ngFor="let row of mergedRows">
          <div *ngIf="row.kind === 'achievement'"
               style="display:flex; align-items:center; gap:8px; padding:7px 10px; margin:3px 0;
                      background:rgba(245,166,35,0.10); border-radius:5px;">
            <span aria-hidden="true">🏆</span>
            <span style="font-size:13px; color:#854F0B;">{{ row.display_name }} collected all ten eggs</span>
          </div>

          <div *ngIf="row.kind === 'find'" style="display:flex; align-items:center; gap:10px; padding:5px 0;">
            <app-egg-icon [assetRef]="asset(row.asset_ref)" [size]="22"></app-egg-icon>
            <div style="font-size:13px;">
              <span style="font-weight:500;">{{ row.is_own ? 'You' : row.display_name }}</span>
              <ng-container *ngIf="row.is_own && row.egg_name; else hiddenLoc">
                found <span style="color:var(--triarq-color-primary,#257099);">{{ row.egg_name }}</span>
              </ng-container>
              <ng-template #hiddenLoc>
                found an egg <span style="color:#9E9E9E;">· location hidden until you find it</span>
              </ng-template>
            </div>
          </div>
        </ng-container>

        <div *ngIf="f.finds.length === 0 && f.achievements.length === 0"
             style="font-size:12px; font-style:italic; color:#9E9E9E;">
          No eggs found yet. Be the first — they're hiding in the quiet corners.
        </div>
      </div>
    </div>
  `
})
export class CommunityEggsCardComponent implements OnInit, OnDestroy {
  feed: RecentEggFeed | null = null;
  basket: EggBasketState | null = null;
  /** Finds + completions interleaved newest-first. Rebuilt when the feed loads
   *  (not a getter — keeps *ngFor references stable under OnPush). */
  mergedRows: Array<RecentEggFeed['finds'][number] | RecentEggFeed['achievements'][number]> = [];
  private subs = new Subscription();

  private rebuildMergedRows(): void {
    const f = this.feed;
    if (!f) { this.mergedRows = []; return; }
    const stamp = (r: { kind: string; found_at?: string; achieved_at?: string }) =>
      (r.kind === 'find' ? r.found_at : r.achieved_at) ?? '';
    this.mergedRows = [...f.finds, ...f.achievements]
      .sort((a, b) => stamp(b).localeCompare(stamp(a)));
  }

  constructor(private readonly eggs: EasterEggService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.eggs.ensureLoaded();
    this.subs.add(this.eggs.getRecentFinds(15).subscribe(f => { this.feed = f; this.rebuildMergedRows(); this.cdr.markForCheck(); }));
    // Leader strip reads the shared basket state; also refresh the community
    // feed when the caller's own basket changes.
    this.subs.add(this.eggs.basket$.subscribe(s => {
      this.basket = s;
      this.cdr.markForCheck();
      this.subs.add(this.eggs.getRecentFinds(15).subscribe(f => { this.feed = f; this.rebuildMergedRows(); this.cdr.markForCheck(); }));
    }));
  }
  ngOnDestroy(): void { this.subs.unsubscribe(); }

  asset(ref: string | null): EggAssetRef { return (ref as EggAssetRef) || 'egg-01'; }
}
