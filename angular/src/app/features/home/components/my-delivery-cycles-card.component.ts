// my-delivery-cycles-card.component.ts
// Home screen card — My Initiatives summary (D-392, D-423).
// Shows active Initiatives where the caller is the assigned DCS, EPO, or DOL (D-391).
// Server scopes via assigned_to_current_user.
//
// D-423 deltas (per D-252 — applied as delta on existing implementation):
//   - 5 rows visible (was 3)
//   - Division short name chip per D-203
//   - Status dot per D-419 walkback (Go to Deploy → Go to Build → Brief Review)
//   - Sort by updated_at desc
//   - "View all [N] →" navigates to All Initiatives with Assigned Person filter
//   - Visible to all roles (home.component.ts toggle)
//
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
import { DeliveryCycle, LifecycleStage, GateName, DateStatus } from '../../../core/types/database';

// D-419 walkback chain — first gate with non-default status wins the row dot.
const WALKBACK_CHAIN: readonly GateName[] = ['go_to_deploy', 'go_to_build', 'brief_review'];

const STATUS_COLOR: Record<DateStatus, string> = {
  not_started: '#9E9E9E',
  on_track:    '#22c55e',
  at_risk:     '#F2A620',
  behind:      '#E96127',
  complete:    '#257099'
};

const STAGE_LABEL: Partial<Record<LifecycleStage, string>> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build',
  VALIDATE: 'Validate', UAT: 'UAT', PILOT: 'Pilot', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
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
        <h4 style="margin:0;font-size:var(--triarq-text-h4);">My Initiatives</h4>
      </div>

      <!-- D-178 Tier 1: Skeleton for initial load — D-423 async load per D-346. -->
      <div *ngIf="loading">
        <div *ngFor="let _ of [1,2,3,4,5]"
             style="padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);">
          <ion-skeleton-text animated style="width:60%;height:14px;border-radius:4px;margin-bottom:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="width:40%;height:11px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Active Initiative list — D-423 row layout: name + Division short + stage + status dot. -->
      <div *ngIf="!loading && activeCycles.length > 0">
        <div *ngFor="let cycle of activeCycles"
             style="padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);">

          <!-- Row 1: Initiative title (tappable) + Division short + Stage badge + Status dot per D-423 -->
          <div style="display:flex;align-items:center;gap:var(--triarq-space-xs);
                      margin-bottom:2px;flex-wrap:wrap;">
            <a [routerLink]="['/initiatives', cycle.delivery_cycle_id]"
               style="color:var(--triarq-color-text-primary);text-decoration:none;
                      font-weight:500;font-size:var(--triarq-text-small);
                      flex:1;min-width:0;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
               [title]="cycle.cycle_title">
              {{ cycle.cycle_title }}
            </a>
            <!-- D-423 + D-203: Division short name. Falls back to division_name. -->
            <span *ngIf="divisionShort(cycle)"
                  style="font-size:9px;color:#5A5A5A;flex-shrink:0;
                         max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                  [title]="cycle.division_name ?? ''">
              {{ divisionShort(cycle) }}
            </span>
            <!-- Stage badge -->
            <span class="oi-pill"
                  style="font-size:9px;flex-shrink:0;
                         background:var(--triarq-color-background-subtle);">
              {{ STAGE_LABEL[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
            </span>
            <!-- D-423: Status dot per D-419 walkback. -->
            <span style="display:inline-block;width:9px;height:9px;border-radius:50%;flex-shrink:0;"
                  [style.background]="statusDotColor(cycle)"
                  [title]="statusDotLabel(cycle)"></span>
          </div>

        </div>
      </div>

      <!-- Empty state — D-423: "No Initiatives assigned to you yet." -->
      <div *ngIf="!loading && activeCycles.length === 0"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
        No Initiatives assigned to you yet.
      </div>

      <!-- Footer — D-423: "View all [N] →" navigates to All Initiatives with
           Assigned Person filter set to "My Initiatives". -->
      <div *ngIf="!loading && totalActive > 0"
           style="margin-top:var(--triarq-space-sm);padding-top:var(--triarq-space-xs);
                  border-top:1px solid var(--triarq-color-border);">
        <a [routerLink]="['/initiatives/list']"
           [queryParams]="{ assigned_person: 'me' }"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                  text-decoration:none;">
          View all {{ totalActive }} →
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
  private readonly MAX_SHOWN = 5;   // D-423: 5 rows visible.
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
          // D-423: Active only (also exclude ON_HOLD per spec).
          const active = all.filter(c =>
            !TERMINAL.includes(c.current_lifecycle_stage) &&
            c.current_lifecycle_stage !== 'ON_HOLD'
          );
          // D-423: Sort by updated_at descending (most recently updated first).
          active.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
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

  /** D-423 + D-203 — short Division name for the row chip. */
  divisionShort(cycle: DeliveryCycle): string | null {
    const c = cycle as unknown as { display_name_short?: string; division_name?: string };
    return c.display_name_short ?? c.division_name ?? null;
  }

  /** D-423 — status dot color via D-419 walkback. */
  statusDotColor(cycle: DeliveryCycle): string {
    const m = this.walkbackMilestone(cycle);
    return STATUS_COLOR[m?.date_status ?? 'not_started'] ?? STATUS_COLOR.not_started;
  }

  /** D-423 — tooltip label matching the walkback'd milestone status. */
  statusDotLabel(cycle: DeliveryCycle): string {
    const m = this.walkbackMilestone(cycle);
    if (!m) { return 'Not Started'; }
    const map: Record<DateStatus, string> = {
      not_started: 'Not Started',
      on_track:    'On Track',
      at_risk:     'At Risk',
      behind:      'Behind',
      complete:    'Complete'
    };
    return map[m.date_status];
  }

  /** D-419 walkback: Go to Deploy → Go to Build → Brief Review. */
  private walkbackMilestone(cycle: DeliveryCycle) {
    for (const gate of WALKBACK_CHAIN) {
      const m = cycle.milestone_dates?.find(x => x.gate_name === gate);
      if (m && m.date_status && m.date_status !== 'not_started') { return m; }
    }
    return null;
  }
}
