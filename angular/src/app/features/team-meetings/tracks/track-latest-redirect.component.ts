// track-latest-redirect.component.ts — Pathways OI Trust
// Series share URL: /team-meetings/track/:track_id/latest
// Resolves the series' latest meeting and navigates to it. Members only —
// non-members get the blocked-action message (Decision 140).

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TeamMeetingsService }           from '../team-meetings.service';

@Component({
  selector:        'app-track-latest-redirect',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="tlr-shell">
      <div *ngIf="!error" class="tlr-loading">Opening latest meeting…</div>
      <div *ngIf="error" class="tlr-blocked">
        <p class="tlr-blocked-primary">{{ error }}</p>
        <p class="tlr-blocked-secondary">If you believe you should have access, ask a series leader to invite you.</p>
        <a routerLink="/team-meetings" class="tlr-link">← Team Meetings</a>
      </div>
    </div>
  `,
  styles: [`
    .tlr-shell { padding: 48px 32px; }
    .tlr-loading { font: 14px Roboto, sans-serif; color: #757575; }
    .tlr-blocked-primary { font: 14px Roboto, sans-serif; color: #1A1A1A; margin: 0 0 6px; }
    .tlr-blocked-secondary { font: 12px Roboto, sans-serif; color: #757575; margin: 0 0 16px; }
    .tlr-link { font: 13px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); }
  `]
})
export class TrackLatestRedirectComponent implements OnInit {
  error = '';

  constructor(
    private readonly svc:    TeamMeetingsService,
    private readonly route:  ActivatedRoute,
    private readonly router: Router,
    private readonly cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const trackId = this.route.snapshot.paramMap.get('track_id') ?? '';
    if (!trackId) { this.error = 'Series not found.'; return; }

    this.svc.getLatestMeeting(trackId).subscribe({
      next: res => {
        if (res.success && res.data?.meeting_id) {
          this.router.navigate(['/team-meetings', res.data.meeting_id], { replaceUrl: true });
        } else if (res.success) {
          // Series exists but has no meetings yet — land on the series page.
          this.router.navigate(['/team-meetings/track', trackId], { replaceUrl: true });
        } else {
          this.error = res.error ?? 'Unable to open this series.';
          this.cdr.markForCheck();
        }
      },
      error: err => {
        this.error = err?.error ?? 'Unable to open this series. Check your connection.';
        this.cdr.markForCheck();
      }
    });
  }
}
