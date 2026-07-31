// raci-glyphs.component.ts — Pathways OI Trust
// Contract 40 WS5 (D-599, supersedes D-597): render ONLY the RACI letters the
// current user holds on an initiative, in fixed order R, A, C, I, with no ghost
// row (unheld letters are absent). The hollow-i is the ever-present follow
// affordance — persistent, low-contrast (Fog), tappable on touch.
//
// Standing-relationship display; urgency is NOT carried here — it rides the
// WS4 Gate Wait Chip amber state. A steady A means "you're accountable for the
// next gate", never "act now" (the D-599 balance point).
//
// Affordances: I toggles (the only interactive letter); A → next gate; C →
// participation panel; R → initiative. Tooltips carry meaning + action.
//
// CC-40-B (Code judgment, recorded in CodeClose): glyphs are 18px circular
// hit targets at 12px letter, 3px gap; the hollow-i uses Fog (#A6A6A6) 1px
// ring on transparent fill so the common single-glyph row reads quiet, while
// staying an easy ≥18px tap target on touch. Held letters use filled tokens.
// The set never wraps — max four 18px chips + gaps = 84px, within the cell.

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MyRaciEntry } from '../../../core/services/delivery.service';

@Component({
  selector:        'app-raci-glyphs',
  standalone:      true,
  imports:         [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="rg-set" (click)="$event.stopPropagation()">
      <!-- R — Responsible (trio). Indicator → initiative. -->
      <a *ngIf="raci?.r" class="rg-glyph rg-r"
         [routerLink]="['/initiatives', deliveryCycleId]"
         title="You are Responsible — a member of this Initiative's trio.">R</a>

      <!-- A — Accountable (resolved next-gate approver). Indicator → next gate. -->
      <a *ngIf="raci?.a" class="rg-glyph rg-a"
         [routerLink]="['/initiatives', deliveryCycleId]"
         [queryParams]="raci?.a_gate_name ? { gate: raci?.a_gate_name } : {}"
         [title]="'You are Accountable — approver of the next gate' + (raci?.a_gate_name ? ' (' + gateLabel(raci!.a_gate_name!) + ')' : '') + '.'">A</a>

      <!-- C — Consulted. Provisional (dashed, muted) until Go to Build cast committed. -->
      <a *ngIf="raci?.c" class="rg-glyph rg-c" [class.rg-c--provisional]="raci?.c_provisional"
         [routerLink]="['/initiatives', deliveryCycleId]"
         [title]="raci?.c_provisional
           ? 'You are Consulted (provisional until Go to Build) — tap to view participation.'
           : 'You are Consulted — tap to view participation.'">C</a>

      <!-- I — Informed. The only interactive letter: filled = following; the
           ever-present hollow-i is the follow affordance on every row.
           Contract 41: readonly surfaces render I only when actually held —
           the hollow follow affordance belongs on a grid you can act in, not on
           a summary card. -->
      <button *ngIf="!readonly" type="button" class="rg-glyph rg-i" [class.rg-i--filled]="raci?.i"
              [disabled]="busy"
              [title]="raci?.i ? 'You are Informed — tap to remove.' : 'Follow this Initiative (Informed).'"
              (click)="toggleI.emit()">i</button>
      <span *ngIf="readonly && raci?.i" class="rg-glyph rg-i rg-i--filled"
            title="You are Informed on this Initiative.">i</span>
    </span>
  `,
  styles: [`
    .rg-set { display: inline-flex; align-items: center; gap: 3px; }
    .rg-glyph {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 999px; box-sizing: border-box;
      font: 700 11px Roboto, sans-serif; text-decoration: none; cursor: pointer;
      border: 1px solid transparent; padding: 0; line-height: 1;
    }
    /* Held letters — filled tokens (standing relationship, quiet not loud). */
    .rg-r { background: rgba(37,112,153,0.12); color: #257099; }
    .rg-a { background: rgba(0,39,78,0.12); color: #00274E; }
    .rg-c { background: rgba(37,112,153,0.12); color: #257099; }
    /* D-593 provisional — muted + dashed, never a warning colour. */
    .rg-c--provisional { background: transparent; color: #5A5A5A; border: 1px dashed #C0C0C0; }
    /* I — hollow default in Fog; filled amber-free when following. */
    .rg-i { background: transparent; color: #A6A6A6; border: 1px solid #A6A6A6;
            font-style: italic; }
    .rg-i--filled { background: rgba(37,112,153,0.12); color: #257099; border-color: transparent; }
    .rg-i:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class RaciGlyphsComponent {
  @Input() raci: MyRaciEntry | null | undefined = null;
  @Input() deliveryCycleId!: string;
  @Input() busy = false;
  /**
   * Contract 41: display-only mode for summary surfaces (the R/C/I Home card).
   * Suppresses the always-present hollow follow affordance so the row shows
   * exactly the letters held. Defaults false — the three existing consumers
   * (Initiative grid, My Initiative Status, My Initiatives card) are unchanged.
   */
  @Input() readonly = false;
  /** Emitted when the I glyph is tapped — parent adds/removes the Informed stake. */
  @Output() toggleI = new EventEmitter<void>();

  private readonly labels: Record<string, string> = {
    brief_review: 'Brief Review', go_to_build: 'Go to Build', go_to_deploy: 'Go to Deploy',
    go_to_release: 'Go to Release', close_review: 'Close Review'
  };
  gateLabel(g: string): string { return this.labels[g] ?? g; }
}
