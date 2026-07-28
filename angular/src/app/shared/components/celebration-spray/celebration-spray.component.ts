// celebration-spray.component.ts — Pathways OI Trust (delight)
// A one-shot full-screen "spray": press the button, one image is picked at
// random (a heart, the TRIARQ Q, or one of the ten Easter-egg designs) and
// ~40 copies burst across the viewport, then clean up. Pure presentation
// (Arch-2) — no data, no persistence. Overlay is pointer-events:none so it
// never blocks the UI underneath.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EggIconComponent, EGG_ASSET_REFS, EggAssetRef } from '../../../features/easter-eggs/egg-icon.component';

interface SprayPiece {
  id: number;
  style: Record<string, string>;
}

type SprayKind = 'heart' | 'triarq' | EggAssetRef;

@Component({
  selector:        'app-celebration-spray',
  standalone:      true,
  imports:         [CommonModule, EggIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="pieces.length" class="cs-overlay" aria-hidden="true">
      <span *ngFor="let p of pieces" class="cs-piece" [ngStyle]="p.style">
        <ng-container [ngSwitch]="kindGroup">
          <svg *ngSwitchCase="'heart'" width="30" height="30" viewBox="0 0 24 24">
            <path d="M12 21s-7.5-4.9-10.2-9.2C-.2 8.3 1.6 4.5 5.2 4.5c2 0 3.4 1.1 4.3 2.6.4.6 1.4.6 1.8 0
                     .9-1.5 2.3-2.6 4.3-2.6 3.6 0 5.4 3.8 3.4 7.3C19.5 16.1 12 21 12 21z"
                  fill="#E4572E"/>
          </svg>
          <img *ngSwitchCase="'triarq'" src="assets/icons/triarq/triarq-q.svg" width="30" height="30" alt="" />
          <app-egg-icon *ngSwitchDefault [assetRef]="eggRef" [size]="30"></app-egg-icon>
        </ng-container>
      </span>
    </div>
  `,
  styles: [`
    .cs-overlay {
      position: fixed; inset: 0; z-index: 4000; pointer-events: none; overflow: hidden;
    }
    .cs-piece {
      position: fixed; left: 50%; top: 14%;
      /* per-piece vars set inline: --tx --ty --rot --dur --delay --scale */
      animation: cs-fly var(--dur) cubic-bezier(.2,.7,.3,1) var(--delay) forwards;
      opacity: 0;
      will-change: transform, opacity;
    }
    @keyframes cs-fly {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(.3) rotate(0deg); }
      12%  { opacity: 1; }
      70%  { opacity: 1; }
      100% { opacity: 0;
             transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty)))
                        scale(var(--scale)) rotate(var(--rot)); }
    }
    @media (prefers-reduced-motion: reduce) {
      .cs-piece { animation-duration: .01ms; opacity: 0; }
    }
  `]
})
export class CelebrationSprayComponent {
  pieces: SprayPiece[] = [];
  kind: SprayKind = 'heart';
  private seq = 0;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  /** kindGroup collapses the ten egg refs to 'egg' for the template switch. */
  get kindGroup(): 'heart' | 'triarq' | 'egg' {
    return this.kind === 'heart' ? 'heart' : this.kind === 'triarq' ? 'triarq' : 'egg';
  }
  get eggRef(): EggAssetRef {
    return (this.kind.startsWith('egg-') ? this.kind : 'egg-01') as EggAssetRef;
  }

  /** Fire one spray: pick a random image, burst ~40 copies across the screen. */
  fire(): void {
    const pool: SprayKind[] = ['heart', 'triarq', ...EGG_ASSET_REFS];
    this.kind = pool[Math.floor(Math.random() * pool.length)];

    const COUNT = 42;
    const pieces: SprayPiece[] = [];
    for (let i = 0; i < COUNT; i++) {
      const tx    = (Math.random() * 2 - 1) * 48;   // −48vw .. 48vw
      const ty    = 8 + Math.random() * 78;         // 8vh .. 86vh (spray downward/out)
      const rot   = (Math.random() * 2 - 1) * 720;  // up to ±2 turns
      const dur   = 1000 + Math.random() * 900;     // 1.0s .. 1.9s
      const delay = Math.random() * 280;            // slight stagger
      const scale = 0.6 + Math.random() * 0.9;
      pieces.push({
        id: this.seq++,
        style: {
          '--tx': `${tx}vw`, '--ty': `${ty}vh`, '--rot': `${rot}deg`,
          '--dur': `${dur}ms`, '--delay': `${delay}ms`, '--scale': `${scale}`
        }
      });
    }
    this.pieces = pieces;
    this.cdr.markForCheck();

    if (this.clearTimer) { clearTimeout(this.clearTimer); }
    this.clearTimer = setTimeout(() => {
      this.pieces = [];
      this.clearTimer = null;
      this.cdr.markForCheck();
    }, 2400);
  }
}
