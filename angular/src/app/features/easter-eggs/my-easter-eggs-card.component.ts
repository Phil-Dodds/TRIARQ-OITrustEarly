// my-easter-eggs-card.component.ts — Easter Egg Hunt (spec §9)
// Home card: the caller's basket. Found eggs show painted + named; unfound show
// a mystery "?" (EE-01). At ten of ten the card flips to the celebration.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EasterEggService, EggBasketState } from '../../core/services/easter-egg.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { EggIconComponent, EggAssetRef } from './egg-icon.component';
import { EggBasketComponent } from './egg-basket.component';
import { EggCelebrationComponent } from './egg-celebration.component';

@Component({
  selector: 'app-my-easter-eggs-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EggIconComponent, EggBasketComponent, EggCelebrationComponent],
  template: `
    <!-- No height:100% — the card sizes to its content instead of stretching
         to the tallest card in the Home grid row (Phil 2026-07-16). -->
    <div class="oi-card" style="box-sizing:border-box;" *ngIf="state as s">

      <ng-container *ngIf="!s.completed; else done">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <span style="font-weight:500;">My Easter Eggs</span>
          <span style="font-size:12px; color:var(--triarq-color-text-secondary,#5A5A5A);">{{ s.totalFound }} of {{ s.totalEggs }} found</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <app-egg-basket [found]="s.totalFound" [total]="s.totalEggs" [size]="52"></app-egg-basket>
          <div style="flex:1; height:6px; background:var(--triarq-color-fog,#F1EFE8); border-radius:999px; overflow:hidden;">
            <div [style.width.%]="pct(s)" style="height:100%; background:#1D9E75;"></div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(5,1fr); gap:10px;">
          <div *ngFor="let row of s.rows" style="text-align:center;">
            <app-egg-icon *ngIf="row.found" [assetRef]="asset(row.asset_ref)" [size]="34" [label]="row.egg_name || ''"></app-egg-icon>
            <svg *ngIf="!row.found" width="34" height="40" viewBox="0 0 60 70" aria-label="Hidden egg" role="img">
              <ellipse cx="30" cy="35" rx="23" ry="29" fill="var(--triarq-color-fog,#F1EFE8)" stroke="#C9C7BF" stroke-width="1.5" stroke-dasharray="3 3"/>
              <text x="30" y="42" text-anchor="middle" font-size="20" fill="#B4B2A9">?</text>
            </svg>
            <div style="font-size:10px; margin-top:2px; color:var(--triarq-color-text-secondary,#5A5A5A);">
              {{ row.found ? row.egg_name : 'Hidden' }}
            </div>
          </div>
        </div>
        <div style="font-size:11px; font-style:italic; color:#9E9E9E; margin-top:10px;">
          Eggs are tucked in quiet corners across OI Trust. Keep exploring.
        </div>
        <!-- Leader strip moved to the community card (CC-38-17) — hunt
             standings are community information, not personal progress. -->
      </ng-container>

      <ng-template #done>
        <app-egg-celebration [displayName]="displayName"></app-egg-celebration>
      </ng-template>

    </div>
  `
})
export class MyEasterEggsCardComponent implements OnInit, OnDestroy {
  state: EggBasketState | null = null;
  displayName = '';
  private subs = new Subscription();

  constructor(
    private readonly eggs: EasterEggService,
    private readonly profile: UserProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.eggs.ensureLoaded();
    this.subs.add(this.eggs.basket$.subscribe(s => { this.state = s; this.cdr.markForCheck(); }));
    this.subs.add(this.profile.profile$.subscribe(p => { this.displayName = p?.display_name ?? ''; this.cdr.markForCheck(); }));
  }
  ngOnDestroy(): void { this.subs.unsubscribe(); }

  pct(s: EggBasketState): number { return s.totalEggs ? Math.round((s.totalFound / s.totalEggs) * 100) : 0; }
  asset(ref: string): EggAssetRef { return (ref as EggAssetRef) || 'egg-01'; }
}
