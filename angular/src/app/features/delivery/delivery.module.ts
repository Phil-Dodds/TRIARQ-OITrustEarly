// delivery.module.ts — DeliveryModule (lazy-loaded, D-143)
// Build C + dashboard redesign: hub, summary views, cycle list, cycle detail.
//
// Sub-routes (D-188, Session Brief 2026-04-06-E):
//   /delivery                 → DeliveryHubComponent            (hub — 4 option cards)
//   /delivery/cycles          → DeliveryCycleDashboardComponent (full list, filter panel)
//   /delivery/gates           → GatesSummaryComponent           (overdue + upcoming sections)
//   /delivery/deploy-schedule → DeployScheduleComponent         (Session 2 — cycles by quarter)
//   /delivery/workstreams     → WorkstreamSummaryComponent      (WIP counts per workstream)
//   /delivery/:cycle_id       → DeliveryCycleDetailComponent
//
// /delivery/divisions removed — Division Summary replaced by Deploy Gate by Quarter.
// Named routes declared before :cycle_id to prevent routing conflicts.

import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      // ── Hub (D-171) ───────────────────────────────────────────────────────
      {
        path: '',
        loadComponent: () =>
          import('./hub/delivery-hub.component')
            .then(c => c.DeliveryHubComponent)
      },
      // ── All Delivery Cycles (filter panel — D-188, Block 3) ───────────────
      {
        path: 'cycles',
        loadComponent: () =>
          import('./dashboard/delivery-cycle-dashboard.component')
            .then(c => c.DeliveryCycleDashboardComponent)
      },
      // ── Gate Schedule (Block 4 — Session 2) ───────────────────────────────
      {
        path: 'gates',
        loadComponent: () =>
          import('./gates-summary/gates-summary.component')
            .then(c => c.GatesSummaryComponent)
      },
      // ── Deploy Gate by Quarter (Block 5 — Session 2) ──────────────────────
      {
        path: 'deploy-schedule',
        loadComponent: () =>
          import('./deploy-schedule/deploy-schedule.component')
            .then(c => c.DeployScheduleComponent)
      },
      // ── Workstream Summary (Block 6 — Session 2) ──────────────────────────
      {
        path: 'workstreams',
        loadComponent: () =>
          import('./workstream-summary/workstream-summary.component')
            .then(c => c.WorkstreamSummaryComponent)
      },
      // ── Cycle detail — must be last (param route) ─────────────────────────
      {
        path: ':cycle_id',
        loadComponent: () =>
          import('./detail/delivery-cycle-detail.component')
            .then(c => c.DeliveryCycleDetailComponent)
      }
    ])
  ]
})
export class DeliveryModule {}
