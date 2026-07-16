// egg-basket.component.ts — Easter Egg Hunt (spec §7, §9)
// Wicker basket for the "My Easter Eggs" card header. Shows a few egg tops
// peeking over the rim, scaled to how many of the ten are found, and a
// celebratory "full" treatment at 10/10. Pure presentation (Arch-2).

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-egg-basket',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 80 80"
         xmlns="http://www.w3.org/2000/svg" role="img"
         [attr.aria-label]="found + ' of ' + total + ' eggs collected'">
      <title>{{ found }} of {{ total }} eggs collected</title>

      <!-- Eggs peeking over the rim — one per found egg, up to a tidy cap -->
      <g>
        <ellipse *ngFor="let e of peekEggs; let i = index"
                 [attr.cx]="peekX(i)" [attr.cy]="peekY(i)" rx="6" ry="8"
                 [attr.fill]="peekColor(i)" stroke="#854F0B" stroke-width="1" />
      </g>

      <!-- Basket body -->
      <path d="M14 40 L66 40 L60 70 Q40 76 20 70 Z"
            fill="#D8A24E" stroke="#854F0B" stroke-width="2" />
      <!-- Weave lines -->
      <g stroke="#854F0B" stroke-width="1.5" opacity="0.7">
        <path d="M20 48 H60 M18 56 H62 M20 64 H60" fill="none" />
        <path d="M28 41 L26 71 M40 41 L40 73 M52 41 L54 71" fill="none" />
      </g>
      <!-- Rim -->
      <rect x="12" y="36" width="56" height="7" rx="3.5"
            fill="#B9822F" stroke="#854F0B" stroke-width="2" />
      <!-- Handle -->
      <path d="M22 38 Q40 14 58 38" fill="none" stroke="#854F0B" stroke-width="3" />

      <!-- Full-basket sparkle at 10/10 -->
      <g *ngIf="complete" fill="#EF9F27">
        <path d="M12 20l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z"/>
        <path d="M66 24l1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4z"/>
      </g>
    </svg>
  `,
  styles: [`:host { display: inline-flex; line-height: 0; }`]
})
export class EggBasketComponent {
  @Input() found = 0;
  @Input() total = 10;
  @Input() size = 64;

  private readonly PEEK_CAP = 5;
  private readonly PALETTE = ['#5DCAA5', '#F0997B', '#AFA9EC', '#85B7EB', '#EF9F27', '#ED93B1'];

  get complete(): boolean { return this.total > 0 && this.found >= this.total; }

  get peekEggs(): number[] {
    const n = Math.min(this.found, this.PEEK_CAP);
    return Array.from({ length: n }, (_, i) => i);
  }

  peekX(i: number): number { return 22 + i * 9; }
  peekY(i: number): number { return i % 2 === 0 ? 34 : 30; }
  peekColor(i: number): string { return this.PALETTE[i % this.PALETTE.length]; }
}
