// chat.module.ts — ChatModule (lazy-loaded, D-143)
// Build A: stub only. No chat skill, no Vertex AI. (Session 2026-03-29-A)

import { NgModule }     from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule }  from '@ionic/angular';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('./chat.component').then(c => c.ChatComponent) }
    ])
  ]
})
export class ChatModule {}
