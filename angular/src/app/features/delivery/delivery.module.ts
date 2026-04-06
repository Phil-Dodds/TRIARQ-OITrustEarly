// delivery.module.ts — DeliveryModule (lazy-loaded, D-143)
// Build C + dashboard redesign: hub, summary views, cycle list, cycle detail.
//
// Sub-routes (D-188):
//   /delivery               → DeliveryHubComponent       (hub — no data, 4 option cards)
//   /delivery/workstreams   → WorkstreamSummaryComponent (WIP counts per workstream)
//   /delivery/divisions     → DivisionSummaryComponent   (cycle counts per division)
//   /delivery/gates         → GatesSummaryComponent      (upcoming/overdue gate counts)
//   /delivery/cycles        → DeliveryCycleDashboardComponent (full list, with filters)
//   /delivery/:cycle_id     → DeliveryCycleDetailComponent
//
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
      // ── Summary views ─────────────────────────────────────────────────────
      {
        path: 'workstreams',
        loadComponent: () =>
          import('./workstream-summary/workstream-summary.component')
            .then(c => c.WorkstreamSummaryComponent)
      },
      {
        path: 'divisions',
        loadComponent: () =>
          import('./division-summary/division-summary.component')
            .then(c => c.DivisionSummaryComponent)
      },
      {
        path: 'gates',
        loadComponent: () =>
          import('./gates-summary/gates-summary.component')
            .then(c => c.GatesSummaryComponent)
      },
      // ── Full cycle list (moved from '' to 'cycles' — D-188) ───────────────
      {
        path: 'cycles',
        loadComponent: () =>
          import('./dashboard/delivery-cycle-dashboard.component')
            .then(c => c.DeliveryCycleDashboardComponent)
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
