// egg-celebration.component.ts — Easter Egg Hunt (spec §13)
// The locked celebration artwork: TRIARQ Q top-left, confetti, cartoon bunny
// hugging an egg beside a basket brimming with all ten eggs, then two lines of
// copy with the finder's display name large. Pure presentation (Arch-2).
// Reused by the completion overlay and the My Easter Eggs card complete-state.

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-egg-celebration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div style="position:relative; overflow:hidden; text-align:center; padding:1.25rem 1rem 1.5rem;">

      <svg width="34" height="32" viewBox="304 14 84 80" style="position:absolute; top:10px; left:12px;"
           role="img" aria-label="TRIARQ">
        <title>TRIARQ</title>
        <path fill="#12274A" d="M364.5,27.5c-5.5-3.8-12.2-6.1-19.5-5.9C325.6,22,310.2,38,310.2,56.9c0,7.4,2.5,14.2,6.5,19.6c-6.2-6.2-10.1-14.8-10.1-24.3c0-18.9,15.3-34.2,34.2-34.2C350,18,358.3,21.6,364.5,27.5z"/>
        <path fill="#E96127" d="M383.4,90l-12.7-12c4.7-6,7.9-13.8,8.1-23c0.3-11.1-5.4-21.4-14.3-27.5c6.5,6.2,10.6,15,10.6,24.7c0,18.9-15.3,34.2-34.2,34.2c-9.4,0-18-3.8-24.1-10C323,85,333.3,90.3,344,90c7.6-0.3,14.7-2.2,20.9-8.3l1.3,1.3c0,0,0,0,0,0l7.8,7L383.4,90z"/>
        <circle fill="#E96127" cx="358.6" cy="70.5" r="6.1"/>
      </svg>

      <svg width="90%" height="30" viewBox="0 0 460 30" preserveAspectRatio="none"
           style="position:absolute; top:2px; left:5%; z-index:0;" aria-hidden="true">
        <circle cx="150" cy="12" r="4" fill="#F0997B"/><rect x="200" y="4" width="7" height="11" rx="1" fill="#AFA9EC" transform="rotate(-15 203 10)"/><circle cx="252" cy="9" r="4" fill="#EF9F27"/><rect x="300" y="7" width="7" height="11" rx="1" fill="#ED93B1" transform="rotate(25 303 13)"/><circle cx="352" cy="12" r="4" fill="#97C459"/><rect x="402" y="5" width="7" height="11" rx="1" fill="#85B7EB" transform="rotate(-20 405 11)"/>
      </svg>

      <div style="display:flex; align-items:flex-end; justify-content:center; gap:14px; position:relative; z-index:1; margin-top:6px;">
        <svg width="120" height="146" viewBox="0 0 140 170" role="img" aria-label="Bunny holding an egg">
          <title>Bunny holding an egg</title>
          <ellipse cx="54" cy="38" rx="12" ry="38" fill="#FFFFFF" stroke="#9A9890" stroke-width="2.5" transform="rotate(-14 54 38)"/>
          <ellipse cx="54" cy="40" rx="6" ry="28" fill="#F7C7D6" transform="rotate(-14 54 40)"/>
          <ellipse cx="86" cy="38" rx="12" ry="38" fill="#FFFFFF" stroke="#9A9890" stroke-width="2.5" transform="rotate(14 86 38)"/>
          <ellipse cx="86" cy="40" rx="6" ry="28" fill="#F7C7D6" transform="rotate(14 86 40)"/>
          <ellipse cx="70" cy="140" rx="34" ry="28" fill="#FFFFFF" stroke="#9A9890" stroke-width="2.5"/>
          <ellipse cx="52" cy="163" rx="12" ry="8" fill="#FFFFFF" stroke="#9A9890" stroke-width="2.5"/>
          <ellipse cx="88" cy="163" rx="12" ry="8" fill="#FFFFFF" stroke="#9A9890" stroke-width="2.5"/>
          <ellipse cx="70" cy="140" rx="16" ry="20" fill="#FAC775" stroke="#854F0B" stroke-width="2"/>
          <path d="M55 134 h30 M57 146 h26" stroke="#854F0B" stroke-width="2"/>
          <ellipse cx="54" cy="139" rx="7" ry="5.5" fill="#FFFFFF" stroke="#9A9890" stroke-width="2"/>
          <ellipse cx="86" cy="139" rx="7" ry="5.5" fill="#FFFFFF" stroke="#9A9890" stroke-width="2"/>
          <circle cx="70" cy="92" r="36" fill="#FFFFFF" stroke="#9A9890" stroke-width="2.5"/>
          <circle cx="50" cy="99" r="7" fill="#F7C7D6" opacity="0.7"/><circle cx="90" cy="99" r="7" fill="#F7C7D6" opacity="0.7"/>
          <circle cx="57" cy="88" r="5.5" fill="#2C2C2A"/><circle cx="83" cy="88" r="5.5" fill="#2C2C2A"/>
          <circle cx="59" cy="86" r="1.8" fill="#FFFFFF"/><circle cx="85" cy="86" r="1.8" fill="#FFFFFF"/>
          <ellipse cx="70" cy="97" rx="3.6" ry="2.6" fill="#D4537E"/>
          <path d="M70 100 v3 M70 103 q-5 4 -9 1 M70 103 q5 4 9 1" stroke="#9A9890" stroke-width="1.6" fill="none"/>
          <path d="M42 91 h-16 M42 96 h-17 M98 91 h16 M98 96 h17" stroke="#C9C7BF" stroke-width="1.5"/>
        </svg>

        <svg width="128" height="128" viewBox="0 0 100 100" role="img" aria-label="Basket full of ten eggs">
          <title>Basket full of ten eggs</title>
          <ellipse cx="22" cy="30" rx="6.5" ry="8.5" fill="#5DCAA5" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="37" cy="26" rx="6.5" ry="8.5" fill="#F0997B" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="52" cy="26" rx="6.5" ry="8.5" fill="#AFA9EC" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="67" cy="30" rx="6.5" ry="8.5" fill="#85B7EB" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="45" cy="16" rx="6.5" ry="8.5" fill="#FAC775" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="18" cy="42" rx="6.5" ry="8.5" fill="#EF9F27" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="33" cy="43" rx="6.5" ry="8.5" fill="#ED93B1" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="48" cy="44" rx="6.5" ry="8.5" fill="#97C459" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="63" cy="43" rx="6.5" ry="8.5" fill="#B4B2A9" stroke="#854F0B" stroke-width="1"/>
          <ellipse cx="77" cy="42" rx="6.5" ry="8.5" fill="#185FA5" stroke="#854F0B" stroke-width="1"/>
          <path d="M16 56 L84 56 L77 90 Q50 97 23 90 Z" fill="#D8A24E" stroke="#854F0B" stroke-width="2"/>
          <g stroke="#854F0B" stroke-width="1.5" opacity="0.7" fill="none"><path d="M22 64 H78 M20 73 H80 M24 82 H76"/><path d="M34 57 L32 91 M50 57 L50 93 M66 57 L68 91"/></g>
          <rect x="13" y="50" width="74" height="9" rx="4" fill="#B9822F" stroke="#854F0B" stroke-width="2"/>
        </svg>
      </div>

      <div style="font-size:26px; font-weight:500; margin-top:8px; position:relative; z-index:1;">Congrats, {{ displayName || 'friend' }}!</div>
      <div style="font-size:15px; color:var(--triarq-color-text-secondary,#5A5A5A); margin-top:2px;">
        You found all ten Easter eggs{{ inOiTrust ? ' in OI Trust' : '' }}!
      </div>
    </div>
  `,
  styles: [`:host { display:block; }`]
})
export class EggCelebrationComponent {
  @Input() displayName = '';
  @Input() inOiTrust = false;
}
