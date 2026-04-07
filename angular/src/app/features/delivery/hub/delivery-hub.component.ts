// delivery-hub.component.ts — DeliveryHubComponent
// Route: /delivery  (D-171, D-188)
//
// Hub landing page for Delivery Cycle Tracking. Four view cards — navigation only.
// No data on load per D-171. Async headline strips load after card render (skeleton
// animation while loading per D-178 Tier 1 pattern). Card headlines use
// get_delivery_summary for gate/workstream data, and listCycles for assigned count.
//
// D-163: entry point (all roles sidebar /delivery).
// D-198: primary workflow clarity — cards are the primary content.
// Session Brief 2026-04-06-E: replacing Division Summary with Deploy Gate by Quarter.

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterModule }    from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { firstValueFrom }  from 'rxjs';

interface HeadlineState {
  loading: boolean;
  text:    string;
  amber:   boolean;
}

interface HubCard {
  title:       string;
  description: string;
  route:       string;
  headlineKey: 'cycles' | 'workstreams' | 'gates' | 'deploySchedule';
}

const HUB_CARDS: HubCard[] = [
  {
    title:       'All Delivery Cycles',
    route:       '/delivery/cycles',
    headlineKey: 'cycles',
    description: 'Full filterable list of Delivery Cycles in your Divisions. ' +
                 'Filter by stage, tier, workstream, division, and assigned person.'
  },
  {
    title:       'Workstream Summary',
    route:       '/delivery/workstreams',
    headlineKey: 'workstreams',
    description: 'WIP capacity view — cycles per workstream by zone. ' +
                 'Identify workstreams at or over their WIP limit.'
  },
  {
    title:       'Gate Schedule',
    route:       '/delivery/gates',
    headlineKey: 'gates',
    description: 'Overdue and upcoming gates within 7 days. ' +
                 'Prioritize approval actions and identify stalled cycles.'
  },
  {
    title:       'Deploy Gate by Quarter',
    route:       '/delivery/deploy-schedule',
    headlineKey: 'deploySchedule',
    description: 'Cycles organized by Go to Deploy quarter per workstream. ' +
                 'Track deployment cadence and spot prior-quarter misses.'
  }
];

@Component({
  selector:        'app-delivery-hub',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule],
  styles: [`
    .hub-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--triarq-space-md, 16px);
    }
    .hub-card {
      display: block;
      padding: var(--triarq-space-lg, 24px);
      text-decoration: none;
      cursor: pointer;
      border: 1px solid var(--triarq-color-border, #E0E0E0);
      border-radius: 10px;
      background: var(--triarq-color-background-subtle, #fff);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .hub-card:hover {
      border-color: var(--triarq-color-primary, #257099);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .skeleton {
      display: inline-block;
      width: 180px;
      height: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
      background-size: 400% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
  `],
  template: `
    <div style="max-width:900px;margin:var(--triarq-space-2xl, 48px) auto;
                padding:0 var(--triarq-space-md, 16px);">

      <div style="margin-bottom:var(--triarq-space-lg, 24px);">
        <h3 style="margin:0 0 4px 0;color:var(--triarq-color-text-primary, #262626);">
          Delivery Cycle Tracking
        </h3>
        <p style="margin:0;font-size:var(--triarq-text-small, 14px);
                  color:var(--triarq-color-text-secondary, #5A5A5A);max-width:580px;">
          Select a view to explore active delivery cycles across your divisions.
        </p>
      </div>

      <div class="hub-grid">
        <a *ngFor="let card of cards"
           [routerLink]="card.route"
           class="hub-card">

          <div style="font-weight:600;color:var(--triarq-color-deep-navy, #0D2240);
                      margin-bottom:var(--triarq-space-xs, 4px);
                      font-size:var(--triarq-text-body, 16px);">
            {{ card.title }}
          </div>

          <div style="margin-bottom:var(--triarq-space-xs, 4px);
                      min-height:18px;font-size:var(--triarq-text-small, 14px);">
            <span *ngIf="headlines[card.headlineKey].loading" class="skeleton"></span>
            <span *ngIf="!headlines[card.headlineKey].loading"
                  [style.color]="headlines[card.headlineKey].amber
                    ? 'var(--triarq-color-sunray, #D4960A)'
                    : 'var(--triarq-color-text-secondary, #5A5A5A)'">
              {{ headlines[card.headlineKey].text }}
            </span>
          </div>

          <div style="font-size:var(--triarq-text-small, 14px);
                      color:var(--triarq-color-text-secondary, #5A5A5A);
                      line-height:1.55;margin-bottom:var(--triarq-space-sm, 8px);">
            {{ card.description }}
          </div>

          <div style="font-size:var(--triarq-text-small, 14px);
                      color:var(--triarq-color-primary, #257099);font-weight:500;">
            Open view
          </div>
        </a>
      </div>
    </div>
  `
})
export class DeliveryHubComponent implements OnInit {
  readonly cards = HUB_CARDS;

  headlines: Record<HubCard['headlineKey'], HeadlineState> = {
    cycles:         { loading: true, text: '', amber: false },
    workstreams:    { loading: true, text: '', amber: false },
    gates:          { loading: true, text: '', amber: false },
    deploySchedule: { loading: true, text: '', amber: false }
  };

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.loadHeadlines();
  }

  private async loadHeadlines(): Promise<void> {
    await Promise.all([
      this.loadCyclesHeadline(),
      this.loadSummaryHeadlines()
    ]);
  }

  private async loadCyclesHeadline(): Promise<void> {
    try {
      const [assignedResp, activeResp] = await Promise.all([
        firstValueFrom(this.delivery.listCycles({ assigned_to_current_user: true })),
        firstValueFrom(this.delivery.listCycles({}))
      ]);
      const assigned = assignedResp.success ? (assignedResp.data?.length ?? 0) : 0;
      const active   = activeResp.success   ? (activeResp.data?.length   ?? 0) : 0;
      this.headlines.cycles = {
        loading: false,
        text:    assigned > 0
          ? 'You are assigned to ' + assigned + ' cycle' + (assigned === 1 ? '' : 's')
          : active + ' active cycle' + (active === 1 ? '' : 's') + ' in your divisions',
        amber: false
      };
    } catch {
      this.headlines.cycles = { loading: false, text: 'View all active cycles', amber: false };
    }
    this.cdr.markForCheck();
  }

  private async loadSummaryHeadlines(): Promise<void> {
    try {
      const resp = await firstValueFrom(this.delivery.getDeliverySummary());
      if (!resp.success || !resp.data) { this.setFallbackHeadlines(); return; }

      const { gate_summaries, workstream_summaries } = resp.data;

      const totalOverdue  = gate_summaries.reduce((s, g) => s + g.overdue_count,  0);
      const totalUpcoming = gate_summaries.reduce((s, g) => s + g.upcoming_count, 0);

      if (totalOverdue > 0) {
        this.headlines.gates = {
          loading: false,
          text:    totalOverdue + ' overdue, ' + totalUpcoming + ' due in 7 days',
          amber:   true
        };
      } else if (totalUpcoming > 0) {
        this.headlines.gates = {
          loading: false,
          text:    totalUpcoming + ' gate' + (totalUpcoming === 1 ? '' : 's') + ' due in 7 days',
          amber:   false
        };
      } else {
        this.headlines.gates = { loading: false, text: 'No overdue or upcoming gates', amber: false };
      }

      const overLimit = workstream_summaries.filter(
        w => w.wip_prep_exceeded || w.wip_build_exceeded || w.wip_outcome_exceeded
      ).length;
      const wsCount = workstream_summaries.length;

      this.headlines.workstreams = overLimit > 0
        ? { loading: false, text: overLimit + ' workstream' + (overLimit === 1 ? '' : 's') + ' at WIP capacity', amber: true }
        : { loading: false, text: wsCount + ' active workstream' + (wsCount === 1 ? '' : 's'), amber: false };

      this.headlines.deploySchedule = {
        loading: false,
        text:    wsCount + ' workstream' + (wsCount === 1 ? '' : 's') + ' tracked',
        amber:   false
      };
    } catch {
      this.setFallbackHeadlines();
    }
    this.cdr.markForCheck();
  }

  private setFallbackHeadlines(): void {
    this.headlines.gates          = { loading: false, text: 'View gate schedule',      amber: false };
    this.headlines.workstreams    = { loading: false, text: 'View workstream capacity', amber: false };
    this.headlines.deploySchedule = { loading: false, text: 'View deploy schedule',     amber: false };
    this.cdr.markForCheck();
  }
}
