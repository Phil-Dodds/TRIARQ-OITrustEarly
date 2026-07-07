// team-meetings.module.ts — Pathways OI Trust
// Lazy-loaded module for Team Meetings feature (D-490, Admin-only).

import { NgModule }            from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import { FormsModule,
         ReactiveFormsModule } from '@angular/forms';
import { IonicModule }         from '@ionic/angular';
import { TEAM_MEETINGS_ROUTES } from './team-meetings-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(TEAM_MEETINGS_ROUTES)
  ]
})
export class TeamMeetingsModule {}
