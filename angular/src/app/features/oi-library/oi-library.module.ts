// oi-library.module.ts — OILibraryModule (lazy-loaded, D-143)

import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('./oi-library.component').then(c => c.OILibraryComponent) },
      { path: ':id', loadComponent: () => import('./artifact-detail.component').then(c => c.ArtifactDetailComponent) }
    ])
  ]
})
export class OILibraryModule {}
