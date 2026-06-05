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

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface HubCard {
  title:       string;
  description: string;
  route:       string;
  icon:        string;
  /** D-356: render the "Coming Soon" badge on cards whose view has not been built yet. */
  comingSoon?: boolean;
}

// Contract 20 Session 2 (D-396): hub expands from 4 → 7 cards. EPO-organized
// views (positions 2–4) precede Workstream-organized views (positions 5–7).
// Per CC-20-03, the existing route names /initiatives/gates and
// /initiatives/deploy-schedule are retained — spec §4 paths
// /initiatives/schedule and /initiatives/deploy are treated as descriptive
// typos; live routes are bookmarked and deployed.
const HUB_CARDS: HubCard[] = [
  {
    title:       'All Initiatives',
    route:       '/initiatives/list',
    icon:        '≡',
    description: 'The full list of active Initiatives with filtering by stage, tier, workstream, ' +
                 'division, and next gate. Use this when you know the Initiative you are looking ' +
                 'for, or want to apply a combination of filters.'
  },
  {
    title:       'EPO Summary',
    route:       '/initiatives/epo-summary',
    icon:        '◐',
    description: 'WIP counts per EPO across Pre-Build, Build, and Post-Deploy zones. ' +
                 'Identify EPOs at or over their configured WIP limit. Click an EPO ' +
                 'to see their matching Initiatives.'
  },
  {
    title:       'EPO Gate Schedule',
    route:       '/initiatives/epo-schedule',
    icon:        '◑',
    description: 'Overdue and upcoming gates organized by EPO. Use this to balance ' +
                 'approval workload across owners and identify which EPO needs ' +
                 'attention this week.'
  },
  {
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
  imports:         [CommonModule, RouterModule],
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
  `]
})
export class DeliveryHubComponent {
  readonly cards = HUB_CARDS;

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
