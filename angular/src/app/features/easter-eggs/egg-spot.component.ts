// egg-spot.component.ts — Easter Egg Hunt (spec §5)
// Drop <app-egg-spot [placementKey]="EGG_KEYS.X"> at a hidden spot. It renders a
// subtle egg glyph only when an active, not-yet-found egg lives at that key.
// On click: records the find, plays a brief burst + names it, then disappears —
// and never returns for this user (EE-04/EE-06). Other users still see it.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { EasterEggService } from '../../core/services/easter-egg.service';
import { EggIconComponent, EggAssetRef } from './egg-icon.component';

type Phase = 'hidden' | 'available' | 'finding' | 'burst';

@Component({
  selector: 'app-egg-spot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, EggIconComponent],
  template: `
    <span *ngIf="phase !== 'hidden'" class="egg-spot" [class.egg-burst]="phase === 'burst'">

      <button *ngIf="phase === 'available' || phase === 'finding'"
              type="button" class="egg-spot-btn" [disabled]="phase === 'finding'"
              (click)="onClick()" aria-label="Something is hiding here"
              title="Hmm… what's this?">
        <app-egg-icon [assetRef]="assetRef" [size]="24"></app-egg-icon>
      </button>

      <span *ngIf="phase === 'burst'" class="egg-spot-found">
        <app-egg-icon [assetRef]="assetRef" [size]="26" [label]="foundName"></app-egg-icon>
        <span class="egg-spot-msg">Found: {{ foundName }} · {{ foundCount }} of {{ totalCount }}</span>
      </span>

    </span>
  `,
  styles: [`
    .egg-spot { display:inline-flex; align-items:center; vertical-align:middle; }
    .egg-spot-btn {
      background:none; border:none; padding:2px; cursor:pointer; line-height:0;
      opacity:0.5; transition:opacity .15s, transform .15s;
      animation: eggBob 2.8s ease-in-out infinite;
    }
    .egg-spot-btn:hover { opacity:1; transform:scale(1.15) rotate(-4deg); }
    .egg-spot-btn:disabled { cursor:progress; }
    @keyframes eggBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-2px); } }
    .egg-spot-found { display:inline-flex; align-items:center; gap:6px; }
    .egg-spot-msg { font-size:12px; font-weight:500; color:var(--triarq-color-primary,#257099); }
    .egg-burst { animation: eggPop .5s ease-out; }
    @keyframes eggPop { 0% { transform:scale(0.6); } 60% { transform:scale(1.25); } 100% { transform:scale(1); } }
  `]
})
export class EggSpotComponent implements OnInit, OnDestroy {
  @Input() placementKey!: string;

  phase: Phase = 'hidden';
  assetRef: EggAssetRef = 'egg-01';
  foundName = '';
  foundCount = 0;
  totalCount = 10;

  private sub?: Subscription;

  constructor(private readonly eggs: EasterEggService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.eggs.ensureLoaded();
    this.sub = this.eggs.basket$.subscribe(state => {
      if (this.phase === 'burst' || this.phase === 'finding') { return; } // don't yank mid-interaction
      if (!state) { this.phase = 'hidden'; this.cdr.markForCheck(); return; }
      const row = state.rows.find(r => r.placement_key === this.placementKey);
      if (row && !row.found) {
        this.assetRef = (row.asset_ref as EggAssetRef) || 'egg-01';
        this.phase = 'available';
      } else {
        this.phase = 'hidden';
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  async onClick(): Promise<void> {
    if (this.phase !== 'available') { return; }
    this.phase = 'finding';
    this.cdr.markForCheck();
    const res = await this.eggs.recordFind(this.placementKey);
    if (res && (res.newly_found || res.already_found)) {
      this.foundName = res.egg.egg_name || 'an egg';
      this.foundCount = res.total_found;
      this.totalCount = res.total_eggs;
      this.assetRef = (res.egg.asset_ref as EggAssetRef) || this.assetRef;
      this.phase = 'burst';
      this.cdr.markForCheck();
      setTimeout(() => { this.phase = 'hidden'; this.cdr.markForCheck(); }, 2200);
    } else {
      this.phase = 'available'; // failed — let them try again
      this.cdr.markForCheck();
    }
  }
}
