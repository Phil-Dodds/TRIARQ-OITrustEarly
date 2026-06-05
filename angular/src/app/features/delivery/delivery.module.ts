// delivery.module.ts — DeliveryModule (lazy-loaded, D-143)
// Build C + dashboard redesign: hub, summary views, Initiative list, Initiative detail.
//
// Sub-routes (D-188 / D-392):
//   /initiatives                → DeliveryHubComponent       (hub — no data, 4 option cards)
//   /initiatives/workstreams    → WorkstreamSummaryComponent (WIP counts per workstream)
//   /initiatives/divisions      → DivisionSummaryComponent   (Initiative counts per division)
//   /initiatives/gates          → GatesSummaryComponent      (upcoming/overdue gate counts)
//   /initiatives/list           → DeliveryCycleDashboardComponent (full list, with filters)
//   /initiatives/:cycle_id      → DeliveryCycleDetailComponent
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
      {
        path: 'deploy-schedule',
        loadComponent: () =>
          import('./deploy-schedule/deploy-schedule.component')
            .then(c => c.DeployScheduleComponent)
      },
      // Contract 20 Session 2 — EPO-organized hub views (D-396 / D-397 / D-398 / D-399)
      {
        path: 'epo-summary',
        loadComponent: () =>
          import('./epo-summary/epo-summary.component')
            .then(c => c.EpoSummaryComponent)
      },
      {
        path: 'epo-schedule',
        loadComponent: () =>
          import('./epo-schedule/epo-schedule.component')
            .then(c => c.EpoScheduleComponent)
      },
      {
        path: 'epo-deploy',
        loadComponent: () =>
          import('./epo-deploy/epo-deploy.component')
            .then(c => c.EpoDeployComponent)
      },
      // ── Full Initiative list (D-188 / D-392: 'cycles' renamed to 'list') ──
      {
        path: 'list',
        loadComponent: () =>
          import('./dashboard/delivery-cycle-dashboard.component')
            .then(c => c.DeliveryCycleDashboardComponent)
      },
      // Legacy child path — preserves bookmarks before D-392 rename.
      { path: 'cycles', redirectTo: 'list', pathMatch: 'full' },
      // ── Initiative detail — must be last (param route) ────────────────────
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
