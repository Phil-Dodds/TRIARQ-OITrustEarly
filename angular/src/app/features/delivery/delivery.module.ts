// delivery.module.ts — DeliveryModule (lazy-loaded, D-143)
// Build C: Delivery Cycle Dashboard, Detail, and Workstream Admin screens.
// Routes:
//   /delivery               → DeliveryCycleDashboardComponent
//   /delivery/:cycle_id     → DeliveryCycleDetailComponent

import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/delivery-cycle-dashboard.component')
            .then(c => c.DeliveryCycleDashboardComponent)
      },
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
