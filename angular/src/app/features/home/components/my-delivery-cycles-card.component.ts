// my-delivery-cycles-card.component.ts
// Home screen card — Delivery Cycle Tracking summary.
// Shows active cycles for the current user's divisions with attention flags.
// Wired to DeliveryService in Build C.
// D-93: DeliveryService only — no direct Supabase.
// Rule 2: Presentation only.

import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DeliveryCycle, LifecycleStage, GateName } from '../../../core/types/database';

const STAGE_LABEL: Partial<Record<LifecycleStage, string>> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build',
  VALIDATE: 'Validate', PILOT: 'Pilot', UAT: 'UAT', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

const TERMINAL: LifecycleStage[] = ['COMPLETE', 'CANCELLED'];

@Component({
  selector: 'app-my-delivery-cycles-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="oi-card oi-home-card">
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);">
        <h4 style="margin:0;font-size:var(--triarq-text-h4);">Delivery Cycle Tracking</h4>
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                  text-decoration:none;">
          View all →
        </a>
      </div>

      <!-- Loading -->
      <div *ngIf="loading"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
        Loading cycles…
      </div>

      <!-- Attention banner -->
      <div *ngIf="!loading && attentionCount > 0"
           style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                  border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:500;
                  margin-bottom:var(--triarq-space-sm);">
        ⚠ {{ attentionCount }} cycle{{ attentionCount === 1 ? '' : 's' }} need{{ attentionCount === 1 ? 's' : '' }} attention
      </div>

      <!-- Active cycle list -->
      <div *ngIf="!loading && activeCycles.length > 0">
        <div *ngFor="let cycle of activeCycles"
             style="display:flex;align-items:center;justify-content:space-between;
                    padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);
                    font-size:var(--triarq-text-small);gap:var(--triarq-space-sm);">
          <a [routerLink]="['/delivery', cycle.delivery_cycle_id]"
             style="color:var(--triarq-color-text-primary);text-decoration:none;
                    font-weight:500;flex:1;min-width:0;
                    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
             [title]="cycle.cycle_title">
            {{ cycle.cycle_title }}
          </a>
          <span style="font-size:10px;padding:2px 8px;border-radius:999px;
                       background:var(--triarq-color-background-subtle);
                       color:var(--triarq-color-text-secondary);white-space:nowrap;flex-shrink:0;">
            {{ STAGE_LABEL[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
          </span>
          <span *ngIf="needsAttention(cycle)"
                style="color:var(--triarq-color-sunray,#f5a623);flex-shrink:0;"
                title="Needs attention">⚠</span>
        </div>

        <!-- Show more link if truncated -->
        <div *ngIf="totalActive > activeCycles.length"
             style="margin-top:var(--triarq-space-xs);font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);">
          <a routerLink="/delivery"
             style="color:var(--triarq-color-primary);text-decoration:none;">
            + {{ totalActive - activeCycles.length }} more active cycle{{ totalActive - activeCycles.length === 1 ? '' : 's' }}
          </a>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && activeCycles.length === 0"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
        No active Delivery Cycles in your Divisions.
        <a routerLink="/delivery"
           style="color:var(--triarq-color-primary);text-decoration:none;display:block;margin-top:4px;">
          Go to Delivery Cycle Tracking →
        </a>
      </div>
    </div>
  `,
  styles: [`h4 { margin: 0 0 var(--triarq-space-md) 0; }`]
})
export class MyDeliveryCyclesCardComponent implements OnInit {
  @Input() userId = '';

  loading      = true;
  activeCycles: DeliveryCycle[] = [];
  totalActive  = 0;

  readonly STAGE_LABEL = STAGE_LABEL;
  private readonly MAX_SHOWN = 5;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listCycles().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const all = Array.isArray(res.data) ? res.data : [];
          const active = all.filter(c => !TERMINAL.includes(c.current_lifecycle_stage));
          this.totalActive  = active.length;
          this.activeCycles = active.slice(0, this.MAX_SHOWN);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get attentionCount(): number {
    return this.activeCycles.filter(c => this.needsAttention(c)).length;
  }

  needsAttention(cycle: DeliveryCycle): boolean {
    // Blocked gate
    if (cycle.gate_records?.some(g => g.gate_status === 'blocked')) { return true; }
    // Overdue milestone
    const today = new Date().toISOString().slice(0, 10);
    if (cycle.milestone_dates?.some(m => m.target_date && !m.actual_date && m.target_date < today)) {
      return true;
    }
    return false;
  }
}
