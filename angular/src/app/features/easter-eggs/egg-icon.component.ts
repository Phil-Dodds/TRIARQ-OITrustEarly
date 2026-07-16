// egg-icon.component.ts — Easter Egg Hunt (spec §7, EE-03)
// Renders one of the ten distinct egg designs by asset_ref (egg-01..egg-10).
// Pure presentation (Arch-2): no data access, no business logic. The MCP egg
// definition's asset_ref selects the design; egg_name feeds the aria-label.
//
// Ten looks: 01 teal stripes · 02 coral dots · 03 purple chevrons · 04 blue
// waves · 05 amber lattice · 06 pink verticals · 07 green diamonds · 08 gray
// rings · 09 navy stars · 10 gilded scallops. Flat fills only (no gradients) —
// crisp from 20px to 120px. Colours drawn from the CDS/triarq ramps.

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EggAssetRef =
  | 'egg-01' | 'egg-02' | 'egg-03' | 'egg-04' | 'egg-05'
  | 'egg-06' | 'egg-07' | 'egg-08' | 'egg-09' | 'egg-10';

export const EGG_ASSET_REFS: readonly EggAssetRef[] = [
  'egg-01', 'egg-02', 'egg-03', 'egg-04', 'egg-05',
  'egg-06', 'egg-07', 'egg-08', 'egg-09', 'egg-10'
];

@Component({
  selector: 'app-egg-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size" [attr.height]="heightFor(size)" viewBox="0 0 60 70"
         xmlns="http://www.w3.org/2000/svg" role="img"
         [attr.aria-label]="label || 'Easter egg'">
      <title>{{ label || 'Easter egg' }}</title>
      <defs>
        <clipPath [attr.id]="clipId">
          <ellipse cx="30" cy="35" rx="23" ry="29" />
        </clipPath>
      </defs>

      <ng-container [ngSwitch]="assetRef">

        <g *ngSwitchCase="'egg-01'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#5DCAA5" />
          <g [attr.clip-path]="clipRef" stroke="#0F6E56" stroke-width="3">
            <path d="M0 14H60 M0 22H60 M0 30H60 M0 38H60 M0 46H60 M0 54H60" />
          </g>
        </g>

        <g *ngSwitchCase="'egg-02'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#F0997B" />
          <g [attr.clip-path]="clipRef" fill="#993C1D">
            <circle cx="18" cy="18" r="3"/><circle cx="30" cy="22" r="3"/><circle cx="42" cy="18" r="3"/>
            <circle cx="24" cy="33" r="3"/><circle cx="36" cy="33" r="3"/>
            <circle cx="18" cy="47" r="3"/><circle cx="30" cy="50" r="3"/><circle cx="42" cy="47" r="3"/>
          </g>
        </g>

        <g *ngSwitchCase="'egg-03'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#AFA9EC" />
          <g [attr.clip-path]="clipRef" stroke="#3C3489" stroke-width="3" fill="none">
            <path d="M4 22l8 6 8-6 8 6 8-6 8 6 8-6" />
            <path d="M4 36l8 6 8-6 8 6 8-6 8 6 8-6" />
            <path d="M4 50l8 6 8-6 8 6 8-6 8 6 8-6" />
          </g>
        </g>

        <g *ngSwitchCase="'egg-04'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#85B7EB" />
          <g [attr.clip-path]="clipRef" stroke="#0C447C" stroke-width="3" fill="none">
            <path d="M2 22 q13 -8 26 0 t26 0" />
            <path d="M2 34 q13 -8 26 0 t26 0" />
            <path d="M2 46 q13 -8 26 0 t26 0" />
          </g>
        </g>

        <g *ngSwitchCase="'egg-05'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#EF9F27" />
          <g [attr.clip-path]="clipRef" stroke="#633806" stroke-width="2">
            <path d="M6 2 L58 54 M-6 14 L46 66 M18 2 L58 42 M6 -10 L46 30" />
            <path d="M54 2 L2 54 M66 14 L14 66 M42 2 L2 42 M54 -10 L14 30" />
          </g>
        </g>

        <g *ngSwitchCase="'egg-06'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#ED93B1" />
          <g [attr.clip-path]="clipRef" stroke="#72243E" stroke-width="3">
            <path d="M14 4V66 M22 4V66 M30 4V66 M38 4V66 M46 4V66" />
          </g>
        </g>

        <g *ngSwitchCase="'egg-07'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#97C459" />
          <g [attr.clip-path]="clipRef" fill="#27500A">
            <path d="M30 12l5 8-5 8-5-8z"/><path d="M18 28l5 8-5 8-5-8z"/><path d="M42 28l5 8-5 8-5-8z"/>
            <path d="M30 44l5 8-5 8-5-8z"/>
          </g>
        </g>

        <g *ngSwitchCase="'egg-08'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#B4B2A9" />
          <g [attr.clip-path]="clipRef" stroke="#2C2C2A" stroke-width="2.5" fill="none">
            <circle cx="30" cy="35" r="6"/><circle cx="30" cy="35" r="13"/><circle cx="30" cy="35" r="20"/>
          </g>
        </g>

        <g *ngSwitchCase="'egg-09'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#185FA5" />
          <g [attr.clip-path]="clipRef" fill="#B5D4F4">
            <path d="M30 15l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"/>
            <path d="M18 37l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z"/>
            <path d="M42 39l1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z"/>
            <path d="M30 50l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>
          </g>
        </g>

        <g *ngSwitchCase="'egg-10'">
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="#FAC775" />
          <g [attr.clip-path]="clipRef" stroke="#854F0B" stroke-width="2.5" fill="none">
            <path d="M6 22 q12 12 24 0 t24 0" />
            <path d="M6 34 q12 12 24 0 t24 0" />
            <path d="M6 46 q12 12 24 0 t24 0" />
          </g>
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="none" stroke="#854F0B"
                   stroke-width="2" stroke-dasharray="2 3" />
        </g>

        <g *ngSwitchDefault>
          <ellipse cx="30" cy="35" rx="23" ry="29" fill="var(--triarq-color-fog, #D3D1C7)" />
        </g>

      </ng-container>
    </svg>
  `,
  styles: [`:host { display: inline-flex; line-height: 0; }`]
})
export class EggIconComponent {
  /** Which of the ten designs to render. */
  @Input() assetRef: EggAssetRef = 'egg-01';
  /** Rendered width in px; height keeps the 60:70 ratio. */
  @Input() size = 44;
  /** Accessible name — pass the egg_name once found; omit while hidden. */
  @Input() label = '';

  // Per-instance clipPath id so multiple eggs on one screen never collide.
  private static seq = 0;
  readonly clipId = `ee-clip-${EggIconComponent.seq++}`;
  get clipRef(): string { return `url(#${this.clipId})`; }

  heightFor(width: number): number {
    return Math.round((width * 70) / 60);
  }
}
