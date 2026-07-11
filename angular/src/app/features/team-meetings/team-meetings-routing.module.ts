// team-meetings-routing.module.ts — Pathways OI Trust
// Routes for Team Meetings feature (D-490 + Tracks Phase A+B).
// /team-meetings                        — series list (all users)
// /team-meetings/public                 — search public series to join
// /team-meetings/track/:track_id        — meetings list within a series
// /team-meetings/track/:track_id/latest — series share URL → latest meeting
// /team-meetings/:meeting_id            — meeting prep/run
// Order matters: 'public' and 'track/...' must precede ':meeting_id'.

import { Routes } from '@angular/router';

export const TEAM_MEETINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tracks/tracks-list.component').then(m => m.TracksListComponent)
  },
  {
    path: 'public',
    loadComponent: () =>
      import('./tracks/public-tracks.component').then(m => m.PublicTracksComponent)
  },
  {
    path: 'track/:track_id/latest',
    loadComponent: () =>
      import('./tracks/track-latest-redirect.component').then(m => m.TrackLatestRedirectComponent)
  },
  {
    path: 'track/:track_id',
    loadComponent: () =>
      import('./list/team-meetings-list.component').then(m => m.TeamMeetingsListComponent)
  },
  {
    path: ':meeting_id',
    loadComponent: () =>
      import('./detail/team-meetings-detail.component').then(m => m.TeamMeetingsDetailComponent)
  }
];
