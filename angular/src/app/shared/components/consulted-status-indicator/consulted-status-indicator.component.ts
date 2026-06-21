// consulted-status-indicator.component.ts — Pathways OI Trust
// Contract 30 / D-468 (WS1.2). Display-only Consulted status indicator, reused on the
// home Action Queue card and both My Actions tabs (build-once shared component per the
// Contract 30 Reuse Checklist item 4).
//
// Render rules (spec WS1.2):
//   • Red ✕   — at least one Consulted party has response = 'declined'. Takes precedence.
//   • Amber ○ — at least one Consulted party is 'pending' AND the gate is still
//               'awaiting_approval'. (Post-approval pending consults do NOT show amber.)
//   • Nothing — all Consulted responded, or no Consulted on this gate.
//
// The indicator changes nothing — it never alters the primary action (D-468).

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GateStatus } from '../../../core/types/database';

export interface ConsultedSummary {
  pending_count:  number;
  declined_count: number;
}

@Component({
  selector:        'app-consulted-status-indicator',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span *ngIf="showDeclined"
          class="csi csi--declined"
          aria-label="A consulted party declined"
          title="A consulted party declined">✕</span>
    <span *ngIf="!showDeclined && showPending"
          class="csi csi--pending"
          aria-label="A consulted party has not yet responded"
          title="Awaiting a consulted party's response">○</span>
  `,
  styles: [`
    .csi { display: inline-block; font-size: 10px; line-height: 1; font-weight: 700; flex-shrink: 0; }
    .csi--declined { color: var(--triarq-color-error, #d32f2f); }
    .csi--pending  { color: var(--triarq-color-sunray, #f5a623); }
  `]
})
export class ConsultedStatusIndicatorComponent {
  /** Per-gate Consulted summary from list_pending_approvals. Undefined = no consults. */
  @Input() summary?: ConsultedSummary;
  /** Gate status — amber only shows while the gate is still awaiting approval. */
  @Input() gateStatus?: GateStatus;

  /** Red ✕ — any declined consult. Takes precedence over the amber pending state. */
  get showDeclined(): boolean {
    return (this.summary?.declined_count ?? 0) > 0;
  }

  /** Amber ○ — a pending consult while the gate is still awaiting approval. */
  get showPending(): boolean {
    return (this.summary?.pending_count ?? 0) > 0
      && this.gateStatus === 'awaiting_approval';
  }
}
