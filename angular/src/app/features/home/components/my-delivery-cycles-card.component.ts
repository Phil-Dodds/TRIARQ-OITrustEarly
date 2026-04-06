// my-delivery-cycles-card.component.ts
// Home screen card — My Delivery Cycles summary.
// Shows active cycles where the current user is the assigned DS or CB (assigned_to_current_user).
// Build C supplement: uses assigned_to_current_user filter to scope to this user's own cycles.
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
import { IonicModule }  from '@ionic/angular';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DeliveryCycle, LifecycleStage, GateName, TierClassification } from '../../../core/types/database';

const STAGE_LABEL: Partial<Record<LifecycleStage, string>> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build',
  VALIDATE: 'Validate', PILOT: 'Pilot', UAT: 'UAT', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

const GATE_LABEL: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// D-189: next gate derived from stage — mirrors NEXT_GATE_BY_STAGE in delivery-cycle-detail
const NEXT_GATE_BY_STAGE: Partial<Record<LifecycleStage, GateName>> = {
  BRIEF:    'brief_review',
  DESIGN:   'go_to_build',
  SPEC:     'go_to_build',
  BUILD:    'go_to_deploy',
  VALIDATE: 'go_to_deploy',
  PILOT:    'go_to_release',
  UAT:      'go_to_release',
  RELEASE:  'close_review',
  OUTCOME:  'close_review'
};

const TERMINAL: LifecycleStage[] = ['COMPLETE', 'CANCELLED'];

@Component({
  selector: 'app-my-delivery-cycles-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, IonicModule],
  template: `
    <div class="oi-card oi-home-card">
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);">
        <h4 style="margin:0;font-size:var(--triarq-text-h4);">My Delivery Cycles</h4>
      </div>

      <!-- D-178 Tier 1: Skeleton for initial load -->
      <div *ngIf="loading">
        <div *ngFor="let _ of [1,2,3]"
             style="padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);">
          <ion-skeleton-text animated style="width:60%;height:14px;border-radius:4px;margin-bottom:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="width:40%;height:11px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Attention banner -->
      <div *ngIf="!loading && attentionCount > 0"
           style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                  border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:500;
                  margin-bottom:var(--triarq-space-sm);">
        ⚠ {{ attentionCount }} cycle{{ attentionCount === 1 ? '' : 's' }} need{{ attentionCount === 1 ? 's' : '' }} attention
      </div>

      <!-- Active cycle list — S6: next gate + target date + tier badge per row -->
      <div *ngIf="!loading && activeCycles.length > 0">
        <div *ngFor="let cycle of activeCycles"
             style="padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);">

          <!-- Row 1: cycle title + tier badge + attention indicator -->
          <div style="display:flex;align-items:center;gap:var(--triarq-space-xs);
                      margin-bottom:2px;flex-wrap:wrap;">
            <a [routerLink]="['/delivery', cycle.delivery_cycle_id]"
               style="color:var(--triarq-color-text-primary);text-decoration:none;
                      font-weight:500;font-size:var(--triarq-text-small);
                      flex:1;min-width:0;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
               [title]="cycle.cycle_title">
              {{ cycle.cycle_title }}
            </a>
            <!-- Tier badge — S6 -->
            <span class="oi-pill"
                  [style.background]="tierPillBg(cycle.tier_classification)"
                  style="font-size:9px;flex-shrink:0;">
              T{{ tierShort(cycle.tier_classification) }}
            </span>
            <span *ngIf="needsAttention(cycle)"
                  style="color:var(--triarq-color-sunray,#f5a623);flex-shrink:0;font-size:12px;"
                  title="Needs attention">⚠</span>
          </div>

          <!-- Row 2: next gate + target date (S6) -->
          <div style="font-size:10px;color:var(--triarq-color-text-secondary);
                      display:flex;align-items:center;gap:var(--triarq-space-xs);">
            <span *ngIf="nextGateLabel(cycle)" style="display:flex;align-items:center;gap:4px;">
              <span style="font-weight:500;color:var(--triarq-color-text-primary);">
                {{ nextGateLabel(cycle) }}
              </span>
              <span *ngIf="nextGateTargetDate(cycle)"
                    [style.color]="nextGateDateColor(cycle)">
                · {{ nextGateTargetDate(cycle) }}
              </span>
              <span *ngIf="!nextGateTargetDate(cycle)"
                    style="font-style:italic;">— no target date set</span>
            </span>
            <span *ngIf="!nextGateLabel(cycle)"
                  style="font-style:italic;">
              {{ STAGE_LABEL[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
            </span>
          </div>

        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && activeCycles.length === 0"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
        No active cycles assigned to you.
      </div>

      <!-- Footer: "View all [N] cycles →" (S6) -->
      <div style="margin-top:var(--triarq-space-sm);padding-top:var(--triarq-space-xs);
                  border-top:1px solid var(--triarq-color-border);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                  text-decoration:none;">
          View all {{ totalActive > 0 ? totalActive + ' ' : '' }}cycle{{ totalActive === 1 ? '' : 's' }} →
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
  private readonly TODAY = new Date().toISOString().slice(0, 10);

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listCycles({ assigned_to_current_user: true }).subscribe({
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
    if (cycle.gate_records?.some(g => g.gate_status === 'blocked')) { return true; }
    if (cycle.milestone_dates?.some(m => m.target_date && !m.actual_date && m.target_date < this.TODAY)) {
      return true;
    }
    return false;
  }

  /** S6: next gate name label for this cycle, null when terminal */
  nextGateLabel(cycle: DeliveryCycle): string | null {
    const gate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage];
    return gate ? GATE_LABEL[gate] : null;
  }

  /** S6: target date for the next gate's milestone row */
  nextGateTargetDate(cycle: DeliveryCycle): string | null {
    const gate = NEXT_GATE_BY_STAGE[cycle.current_lifecycle_stage];
    if (!gate) { return null; }
    return cycle.milestone_dates?.find(m => m.gate_name === gate)?.target_date ?? null;
  }

  /** S6: color the target date based on proximity to today */
  nextGateDateColor(cycle: DeliveryCycle): string {
    const date = this.nextGateTargetDate(cycle);
    if (!date) { return 'var(--triarq-color-text-secondary)'; }
    if (date < this.TODAY) { return 'var(--triarq-color-error)'; }
    // Within 7 days → amber
    const daysAway = (new Date(date).getTime() - new Date(this.TODAY).getTime()) / 86_400_000;
    if (daysAway <= 7) { return 'var(--triarq-color-sunray,#f5a623)'; }
    return 'var(--triarq-color-text-secondary)';
  }

  /** S6: tier badge pill color */
  tierPillBg(tier: TierClassification): string {
    return tier === 'tier_1'
      ? '#e8f5e9'
      : tier === 'tier_2'
        ? '#fff8e1'
        : '#fce4ec';
  }

  /** S6: tier short label "1" | "2" | "3" */
  tierShort(tier: TierClassification): string {
    return tier.replace('tier_', '');
  }
}
