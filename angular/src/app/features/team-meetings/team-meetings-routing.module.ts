// team-meetings-routing.module.ts — Pathways OI Trust
// Routes for Team Meetings feature (D-490).
// /team-meetings       — meeting list
// /team-meetings/:id   — meeting prep/run (or read-only for prior meetings)

import { Routes } from '@angular/router';

export const TEAM_MEETINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/team-meetings-list.component').then(m => m.TeamMeetingsListComponent)
  },
  {
    path: ':meeting_id',
    loadComponent: () =>
      import('./detail/team-meetings-detail.component').then(m => m.TeamMeetingsDetailComponent)
  }
];
