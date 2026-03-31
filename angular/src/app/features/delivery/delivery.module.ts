// delivery.module.ts — DeliveryModule (lazy-loaded, D-143)
// Build A: shell only. delivery_cycles table and screens wired in Build C.

import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('./delivery.component').then(c => c.DeliveryComponent) }
    ])
  ]
})
export class DeliveryModule {}
