// admin.module.ts — AdminModule (lazy-loaded, D-143)
// Build A: Division hierarchy management + User management screens.

import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule }  from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '',            loadComponent: () => import('./admin-hub.component').then(c => c.AdminHubComponent) },
      { path: 'divisions',   loadComponent: () => import('./divisions/divisions.component').then(c => c.DivisionsComponent) },
      { path: 'users',       loadComponent: () => import('./users/users.component').then(c => c.UsersComponent) },
      { path: 'workstreams', loadComponent: () => import('../delivery/workstream-admin/workstream-admin.component').then(c => c.WorkstreamAdminComponent) }
    ])
  ]
})
export class AdminModule {}
