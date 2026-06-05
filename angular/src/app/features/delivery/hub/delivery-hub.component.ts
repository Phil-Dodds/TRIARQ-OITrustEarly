// delivery-hub.component.ts — DeliveryHubComponent
// Route: /initiatives  (D-171, D-188, D-392)
//
// Hub page for Initiative Tracking. Shows four option cards.
// No data is loaded at hub level — the hub is purely navigational.
// Principle 3: each card states What, Why, and How for its view.
// D-163: entry point for Initiative Tracking (all roles see sidebar → /initiatives).
//
// D-356 / S-015 (Contract 13): card descriptions and page subtitle render at
// 11px italic Stone (#5A5A5A). Cards for unbuilt views carry a "Coming Soon"
// pill badge — Vital Blue (#0071AF) background, white 11px text, top-right
// corner, fully rounded. The badge is removed from a card as that view is
// implemented. The "Open view →" link remains active on every card.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

import { DeliveryService } from '../../../core/services/delivery.service';
import { DeliverySummary } from '../../../core/types/database';

interface HubCard {
  title:       string;
  description: string;
  route:       string;
  icon:        string;
  /** D-356: render the "Coming Soon" badge on cards whose view has not been built yet. */
  comingSoon?: boolean;
  /** Optional id; required for cards that surface an async headline (D-396 / spec §4). */
  id?:         'all-initiatives' | 'epo-summary' | 'epo-schedule' | 'epo-deploy'
            |  'workstream-summary' | 'gate-schedule' | 'deploy-schedule';
}

/** Spec §4 headline color semantics. */
type HeadlineTone = 'green' | 'amber' | 'red';

interface CardHeadline {
  text: string;
  tone: HeadlineTone;
}

// Contract 20 Session 2 (D-396): hub expands from 4 → 7 cards. EPO-organized
// views (positions 2–4) precede Workstream-organized views (positions 5–7).
// Per CC-20-03, the existing route names /initiatives/gates and
// /initiatives/deploy-schedule are retained — spec §4 paths
// /initiatives/schedule and /initiatives/deploy are treated as descriptive
// typos; live routes are bookmarked and deployed.
const HUB_CARDS: HubCard[] = [
  {
    id:          'all-initiatives',
    title:       'All Initiatives',
    route:       '/initiatives/list',
    icon:        '≡',
    description: 'The full list of active Initiatives with filtering by stage, tier, workstream, ' +
                 'division, and next gate. Use this when you know the Initiative you are looking ' +
                 'for, or want to apply a combination of filters.'
  },
  {
    id:          'epo-summary',
    title:       'EPO Summary',
    route:       '/initiatives/epo-summary',
    icon:        '◐',
    description: 'WIP counts per EPO across Pre-Build, Build, and Post-Deploy zones. ' +
                 'Identify EPOs at or over their configured WIP limit. Click an EPO ' +
                 'to see their matching Initiatives.'
  },
  {
    id:          'epo-schedule',
    title:       'EPO Gate Schedule',
    route:       '/initiatives/epo-schedule',
    icon:        '◑',
    description: 'Overdue and upcoming gates organized by EPO. Use this to balance ' +
                 'approval workload across owners and identify which EPO needs ' +
                 'attention this week.'
  },
  {
    id:          'epo-deploy',
    title:       'EPO Deploy by Quarter',
    route:       '/initiatives/epo-deploy',
    icon:        '◒',
    description: 'Deploy gate cadence per EPO across the prior quarter, current ' +
                 'quarter, and other active Initiatives. Use this to track each ' +
                 'EPO’s commitment against target dates.'
  },
  {
    title:       'Workstream Summary',
    route:       '/initiatives/workstreams',
    icon:        '⟳',
    description: 'WIP throughput per Workstream across Pre-Build, Build, and Post-Deploy ' +
                 'stages. WIP limits live per EPO — see the EPO Summary view for ' +
                 'over-limit alerts. Click the Workstream name to see the matching Initiatives.'
  },
  {
    title:       'Gate Schedule',
    route:       '/initiatives/gates',
    icon:        '▷',
    description: 'Gates coming up in the next 7 days and gates with overdue target dates. ' +
                 'Use this to prioritize approval actions and identify stalled Initiatives. ' +
                 'Click an Initiative row to open it.'
  },
  {
    title:       'Deploy Gate by Quarter',
    route:       '/initiatives/deploy-schedule',
    icon:        '◫',
    description: 'Go to Deploy gates grouped by quarter. See which Initiatives are scheduled ' +
                 'to reach production each quarter and track commitment against target dates. ' +
                 'Use this for release planning and capacity conversations.'
  }
];

@Component({
  selector:        'app-delivery-hub',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, IonicModule],
  template: `
    <div class="dh-shell">

      <!-- Page header -->
      <div class="dh-header">
        <h3 class="dh-title">Initiative Tracking</h3>
        <!-- S-015: 11px italic #5A5A5A subtitle -->
        <p class="dh-subtitle">
          Select a view to explore active Initiatives across your divisions.
          Each view groups and filters Initiatives differently — choose the one that
          matches your current question.
        </p>
      </div>

      <!-- 2-column card grid -->
      <div class="dh-grid">
        <a *ngFor="let card of cards"
           [routerLink]="card.route"
           class="dh-card"
           (mouseenter)="onCardEnter($event)"
           (mouseleave)="onCardLeave($event)">

          <!-- D-356: Coming Soon pill on unbuilt views -->
          <span *ngIf="card.comingSoon" class="dh-coming-soon">Coming Soon</span>

          <div class="dh-icon">{{ card.icon }}</div>
          <div class="dh-card-title">{{ card.title }}</div>

          <!-- Async headline strip (D-396, spec §4). Three EPO cards carry
               a headline; loading state shows a skeleton, settled state
               renders the headline with tone-driven color. S-028 authorizes
               async on hub headlines. -->
          <ng-container *ngIf="card.id && hasHeadline(card.id)">
            <div *ngIf="headlinesLoading" class="dh-headline-skeleton">
              <ion-skeleton-text animated style="height:11px;width:60%;border-radius:4px;"></ion-skeleton-text>
            </div>
            <div *ngIf="!headlinesLoading && headlines[card.id!]"
                 class="dh-headline"
                 [class.dh-headline-green]="headlines[card.id!]!.tone === 'green'"
                 [class.dh-headline-amber]="headlines[card.id!]!.tone === 'amber'"
                 [class.dh-headline-red]="headlines[card.id!]!.tone === 'red'">
              {{ headlines[card.id!]!.text }}
            </div>
          </ng-container>

          <!-- S-015: 11px italic #5A5A5A description -->
          <div class="dh-card-description">{{ card.description }}</div>

          <div class="dh-open-link">Open view →</div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dh-shell {
      max-width: 880px;
      margin: var(--triarq-space-2xl) auto;
      padding: 0 var(--triarq-space-md);
    }
    .dh-header { margin-bottom: var(--triarq-space-lg); }
    .dh-title { margin: 0 0 4px 0; }
    /* S-015 */
    .dh-subtitle {
      margin: 0;
      font-size: 11px;
      font-style: italic;
      color: #5A5A5A;
      max-width: 620px;
      line-height: 1.6;
    }

    /* Card grid — Section 8 spec: target all four cards visible without
       scrolling on 1280×800 desktop. Tightened paddings + S-015 11px text
       hold the grid within ~600px tall. */
    .dh-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--triarq-space-md);
    }

    .dh-card {
      position: relative;
      display: block;
      padding: var(--triarq-space-md) var(--triarq-space-lg);
      text-decoration: none;
      cursor: pointer;
      border: 1px solid var(--triarq-color-border);
      border-radius: 10px;
      background: var(--triarq-color-background-subtle, #fff);
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .dh-icon {
      font-size: 24px;
      margin-bottom: var(--triarq-space-xs);
      color: var(--triarq-color-primary);
      line-height: 1;
    }
    .dh-card-title {
      font-weight: 600;
      color: var(--triarq-color-text-primary);
      margin-bottom: 4px;
      font-size: var(--triarq-text-body);
    }
    /* S-015 */
    .dh-card-description {
      font-size: 11px;
      font-style: italic;
      color: #5A5A5A;
      line-height: 1.5;
    }
    .dh-open-link {
      margin-top: var(--triarq-space-sm);
      font-size: var(--triarq-text-small);
      color: var(--triarq-color-primary);
      font-weight: 500;
    }

    /* D-356: Vital Blue Coming Soon pill, top-right of card */
    .dh-coming-soon {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #0071AF;
      color: #ffffff;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.2px;
      padding: 2px 10px;
      border-radius: 999px;
    }

    /* D-396 async headline strip — tone color per spec §4 table */
    .dh-headline {
      margin: 2px 0 6px 0;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.1px;
    }
    .dh-headline-green { color: #2c8a3a; }
    .dh-headline-amber { color: #b07000; }
    .dh-headline-red   { color: #c0392b; }
    .dh-headline-skeleton { margin: 2px 0 6px 0; }
  `]
})
export class DeliveryHubComponent implements OnInit {
  readonly cards = HUB_CARDS;

  /**
   * Async headlines per card id. Loading state is shared — single
   * getDeliverySummary call backs all three EPO headlines (S-028 authorizes
   * the async pattern on hub card headlines only).
   */
  headlines: Partial<Record<NonNullable<HubCard['id']>, CardHeadline>> = {};
  headlinesLoading = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.getDeliverySummary({}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.buildHeadlines(res.data);
        }
        this.headlinesLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // Non-fatal — hub remains navigable even when headlines fail.
        this.headlinesLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Derive headline text + tone for each EPO card per spec §4 table.
   *
   * EPO Summary — total active EPOs + count with any zone exceeded.
   * EPO Gate Schedule — sum overdue + upcoming counts across EPO-assigned
   *   cycles only (CC-20-08). Matches what the EPO Gate Schedule screen
   *   shows. The previous implementation summed gate_summaries which is
   *   all-Initiative scope including unassigned EPOs.
   * EPO Deploy by Quarter — per CC-20-06, simplified to total active EPOs
   *   only. Full spec wording ("X with prior-quarter misses") requires a
   *   per-cycle deploy-gate target-date check that get_delivery_summary does
   *   not currently surface — recorded as a follow-on item.
   */
  private buildHeadlines(summary: DeliverySummary): void {
    const epoRows = summary.epo_summaries ?? [];
    const eposExceeded = epoRows.filter(e =>
      e.wip_pre_build_exceeded || e.wip_build_exceeded || e.wip_post_deploy_exceeded
    ).length;
    const epoCount = epoRows.length;

    this.headlines['epo-summary'] = epoCount === 0
      ? { text: 'No EPOs with active Initiatives', tone: 'green' }
      : eposExceeded === 0
        ? { text: `${epoCount} EPOs · No WIP alerts`, tone: 'green' }
        : { text: `${epoCount} EPOs · ${eposExceeded} with active WIP alerts`, tone: 'amber' };

    // CC-20-08: EPO-scoped overdue/upcoming. Sum the per-EPO counts so the
    // headline matches the EPO Gate Schedule screen exactly. Pre-CC-20-08
    // this read from gate_summaries which includes unassigned-EPO cycles.
    const overdueTotal  = epoRows.reduce((sum, e) => sum + (e.overdue_count  ?? 0), 0);
    const upcomingTotal = epoRows.reduce((sum, e) => sum + (e.upcoming_count ?? 0), 0);

    this.headlines['epo-schedule'] = overdueTotal > 0
      ? {
          text: `${overdueTotal} overdue · ${upcomingTotal} due in 7 days`,
          tone: 'red'
        }
      : {
          text: `No overdue gates · ${upcomingTotal} due in 7 days`,
          tone: 'green'
        };

    // CC-20-06: simplified deploy headline — full prior-quarter-miss count
    // requires per-cycle deploy-gate date check, deferred to a follow-on.
    this.headlines['epo-deploy'] = epoCount === 0
      ? { text: 'No EPOs with active Initiatives', tone: 'green' }
      : { text: `${epoCount} EPOs · Deploy cadence loaded`, tone: 'green' };
  }

  /** Template helper — gate the headline strip to ids we configure here. */
  hasHeadline(id: NonNullable<HubCard['id']>): boolean {
    return id === 'epo-summary' || id === 'epo-schedule' || id === 'epo-deploy';
  }

  onCardEnter(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.style.borderColor = 'var(--triarq-color-primary)';
    el.style.boxShadow   = '0 2px 8px rgba(0,0,0,0.08)';
  }

  onCardLeave(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.style.borderColor = 'var(--triarq-color-border)';
    el.style.boxShadow   = '';
  }
}
