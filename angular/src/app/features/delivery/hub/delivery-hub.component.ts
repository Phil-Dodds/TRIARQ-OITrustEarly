// delivery-hub.component.ts — DeliveryHubComponent
// Route: /delivery  (D-171, D-172)
//
// Hub page for Delivery Cycle Tracking. Shows four option cards.
// No data is loaded at hub level — the hub is purely navigational.
// Principle 3: each card states What, Why, and How for its view.
// D-163: entry point for Delivery Cycle Tracking (all roles see sidebar → /delivery).

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface HubCard {
  title:       string;
  description: string;
  route:       string;
  icon:        string;
}

const HUB_CARDS: HubCard[] = [
  {
    title:       'Workstream Summary',
    route:       '/delivery/workstreams',
    icon:        '⟳',
    description: 'WIP counts per workstream across Prep, Build, and Outcome stages. ' +
                 'Identify workstreams over the 4-cycle WIP limit and see how many cycles ' +
                 'are queued at each gate. Click a count to see the matching cycles.'
  },
  {
    title:       'Division Summary',
    route:       '/delivery/divisions',
    icon:        '◫',
    description: 'Active cycle count by Division, displayed in hierarchy order. ' +
                 'Use this to see which Divisions have the most in-flight work. ' +
                 'Click a Division to see all its cycles in the full list.'
  },
  {
    title:       'Upcoming Gate Summary',
    route:       '/delivery/gates',
    icon:        '▷',
    description: 'Gates coming up in the next 7 days and gates with overdue target dates. ' +
                 'Use this to prioritize approval actions and identify stalled cycles. ' +
                 'Click a Gate row to see the Delivery Cycles waiting on it.'
  },
  {
    title:       'All Delivery Cycles',
    route:       '/delivery/cycles',
    icon:        '≡',
    description: 'The full list of active cycles with filtering by stage, tier, workstream, ' +
                 'division, and next gate. Use this when you know the cycle you are looking ' +
                 'for, or want to apply a combination of filters.'
  }
];

@Component({
  selector:        'app-delivery-hub',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule],
  template: `
    <div style="max-width:880px;margin:var(--triarq-space-2xl) auto;
                padding:0 var(--triarq-space-md);">

      <!-- Page header -->
      <div style="margin-bottom:var(--triarq-space-lg);">
        <h3 style="margin:0 0 4px 0;">Delivery Cycle Tracking</h3>
        <p style="margin:0;font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);max-width:620px;">
          Select a view to explore active delivery cycles across your divisions.
          Each view groups and filters cycles differently — choose the one that
          matches your current question.
        </p>
      </div>

      <!-- 2-column card grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;
                  gap:var(--triarq-space-md);">
        <a *ngFor="let card of cards"
           [routerLink]="card.route"
           style="display:block;padding:var(--triarq-space-lg);
                  text-decoration:none;cursor:pointer;
                  border:1px solid var(--triarq-color-border);
                  border-radius:10px;
                  background:var(--triarq-color-background-subtle, #fff);
                  transition:border-color 0.15s, box-shadow 0.15s;"
           (mouseenter)="onCardEnter($event)"
           (mouseleave)="onCardLeave($event)">

          <div style="font-size:28px;margin-bottom:var(--triarq-space-xs);
                      color:var(--triarq-color-primary);">
            {{ card.icon }}
          </div>

          <div style="font-weight:600;color:var(--triarq-color-text-primary);
                      margin-bottom:var(--triarq-space-xs);
                      font-size:var(--triarq-text-body);">
            {{ card.title }}
          </div>

          <div style="font-size:var(--triarq-text-small);
                      color:var(--triarq-color-text-secondary);
                      line-height:1.55;">
            {{ card.description }}
          </div>

          <div style="margin-top:var(--triarq-space-sm);
                      font-size:var(--triarq-text-small);
                      color:var(--triarq-color-primary);font-weight:500;">
            Open view →
          </div>
        </a>
      </div>
    </div>
  `
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
