// gate-wait-chip.component.ts — Pathways OI Trust
// Contract 40 WS4 (D-587, upgrades D-518): the Pending-Approval chip carrying
// waiting-on substance. One state by precedence (highest first):
//   1. "N open conditions"          — gate has ≥1 open condition (amber)
//   2. "Awaiting consultation: …"   — a consultation is outstanding (amber)
//   3. "Awaiting approval · Nd"     — awaiting approver decision, N days (amber)
// Zero state (no waiting_on): renders nothing.
//
// Reads the D-565 waiting_on rollup already on every list row — one computation
// source, rendered identically everywhere (grid, status dashboard, My
// Initiative Status). Tap deep-links to the awaiting gate (D-345 auto-expand).
// The amber/attention state is the single "act here" signal consumed by WS5/WS6.

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GateName } from '../../../core/types/database';

export interface GateWaitState {
  state: string;
  line: string;
  days_waiting: number;
  open_condition_count?: number;
  gate_name?: GateName;
}

@Component({
  selector:        'app-gate-wait-chip',
  standalone:      true,
  imports:         [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a *ngIf="waitingOn"
       class="gwc-chip"
       [routerLink]="deliveryCycleId ? ['/initiatives', deliveryCycleId] : null"
       [queryParams]="chipQueryParams"
       [title]="waitingOn.line"
       (click)="$event.stopPropagation()">
      {{ chipLabel }}
    </a>
  `,
  styles: [`
    /* D-200 Pattern 2 amber — a live governance obligation ("act here"). */
    .gwc-chip {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      background: #FFF8E1; color: #B26A00; border: 1px solid #F2A620;
      font: 600 12px Roboto, sans-serif; white-space: nowrap; text-decoration: none;
      cursor: pointer;
    }
    .gwc-chip:hover { background: #FFF3D6; }
  `]
})
export class GateWaitChipComponent {
  @Input() waitingOn: GateWaitState | null | undefined = null;
  @Input() deliveryCycleId: string | null = null;
  @Input() returnTo: string | null = null;

  /** Whether this chip signals a live governance obligation (always true when shown). */
  get isAttention(): boolean { return !!this.waitingOn; }

  get chipQueryParams(): Record<string, string> {
    const qp: Record<string, string> = {};
    if (this.waitingOn?.gate_name) { qp['gate'] = this.waitingOn.gate_name; }
    if (this.returnTo) { qp['returnTo'] = this.returnTo; }
    return qp;
  }

  get chipLabel(): string {
    const w = this.waitingOn;
    if (!w) { return ''; }
    // 1. Open conditions win.
    if (w.state === 'condition_open') {
      const n = w.open_condition_count ?? 1;
      return `${n} open condition${n === 1 ? '' : 's'}`;
    }
    // 2. Outstanding consultation (L1 trio/consulted collection).
    if (w.state === 'consultation_pending' || w.state === 'trio_pending') {
      // waiting_on.line = "Waiting on: consultation — X" / "trio — X"; show the party tail.
      const tail = w.line.replace(/^Waiting on:\s*(consultation|trio)\s*—\s*/i, '');
      return w.state === 'consultation_pending'
        ? `Awaiting consultation: ${tail}`
        : `Awaiting trio: ${tail}`;
    }
    // 3. Awaiting approver decision, with day count.
    return `Awaiting approval · ${w.days_waiting}d`;
  }
}
