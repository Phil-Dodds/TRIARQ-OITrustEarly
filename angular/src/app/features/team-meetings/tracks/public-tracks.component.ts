// public-tracks.component.ts — Pathways OI Trust
// Search Public Meetings to Join. Route: /team-meetings/public — all users.
// Shows: Series Name + Leaders + most recent meeting title/date. Instant join.

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { TeamMeetingsService }  from '../team-meetings.service';
import { PublicTrackListItem }  from '../../../core/types/team-meetings';

@Component({
  selector:        'app-public-tracks',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="pt-shell">
      <div class="pt-header">
        <div>
          <a routerLink="/team-meetings" class="pt-back">← Team Meetings</a>
          <h1 class="pt-title">Search Public Meetings to Join</h1>
          <p class="pt-subtitle">Public meeting series anyone can join. Joining adds you as a participant immediately.</p>
        </div>
      </div>

      <input class="pt-search" type="text" placeholder="Filter by series name…"
             [(ngModel)]="filter" (ngModelChange)="cdrMark()">

      <div *ngIf="loading" class="pt-list">
        <div *ngFor="let i of [1,2,3]" class="pt-skeleton-row"></div>
      </div>

      <div *ngIf="loadError && !loading" class="pt-error">
        <span class="pt-error-icon">⚠</span> {{ loadError }}
        <button class="pt-link-btn" (click)="load()" type="button">Retry</button>
      </div>

      <div *ngIf="!loading && !loadError && filtered.length === 0" class="pt-empty">
        No public meeting series found.
      </div>

      <div *ngIf="!loading && !loadError && filtered.length > 0" class="pt-list">
        <div class="pt-list-header">
          <span>Series</span>
          <span>Leaders</span>
          <span>Most Recent Meeting</span>
          <span></span>
        </div>
        <div *ngFor="let t of filtered" class="pt-row">
          <span class="pt-track-name">{{ t.track_name }}</span>
          <span class="pt-muted">{{ t.leaders.length ? t.leaders.join(', ') : '—' }}</span>
          <span class="pt-muted">
            <ng-container *ngIf="t.latest_meeting">
              {{ t.latest_meeting.title }} · {{ t.latest_meeting.meeting_date | date:'MMM d, y' }}
            </ng-container>
            <ng-container *ngIf="!t.latest_meeting">—</ng-container>
          </span>
          <span class="pt-actions">
            <button *ngIf="!t.is_member" class="pt-join-btn" type="button"
                    [disabled]="joiningId === t.track_id"
                    (click)="join(t)">
              {{ joiningId === t.track_id ? 'Joining…' : 'Join' }}
            </button>
            <a *ngIf="t.is_member" class="pt-member-link" [routerLink]="['/team-meetings/track', t.track_id]">
              Member — open
            </a>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pt-shell { padding: 24px 32px; max-width: 1080px; }
    .pt-back { font: 13px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); text-decoration: none; }
    .pt-title { font: 600 22px/1.2 Roboto, sans-serif; color: var(--triarq-text-primary, #1A1A1A); margin: 6px 0 4px; }
    .pt-subtitle { font: italic 11px/1.4 Roboto, sans-serif; color: #5A5A5A; margin: 0 0 16px; }
    .pt-search { width: 320px; border: 1px solid #BDBDBD; border-radius: 5px; padding: 8px 10px; font: 14px Roboto, sans-serif; outline: none; margin-bottom: 16px; }
    .pt-search:focus { border-color: var(--triarq-color-primary, #257099); }
    .pt-list-header, .pt-row { display: grid; grid-template-columns: 1fr 240px 300px 140px; gap: 8px; padding: 10px 12px; align-items: center; }
    .pt-list-header { font: 600 12px Roboto, sans-serif; color: #757575; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #E0E0E0; }
    .pt-row { border-bottom: 1px solid #F5F5F5; border-radius: 4px; }
    .pt-track-name { font: 500 14px Roboto, sans-serif; color: #1A1A1A; }
    .pt-muted { color: #757575; font: 13px Roboto, sans-serif; }
    .pt-actions { display: flex; justify-content: flex-end; }
    .pt-join-btn { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 5px 16px; font: 500 13px Roboto, sans-serif; cursor: pointer; }
    .pt-join-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .pt-member-link { font: 500 12px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); }
    .pt-skeleton-row { height: 44px; background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%); background-size: 200% 100%; animation: pt-shimmer 1.4s infinite; border-radius: 4px; margin-bottom: 8px; }
    @keyframes pt-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .pt-empty { color: #757575; font: 14px Roboto, sans-serif; padding: 32px 12px; }
    .pt-error { display: flex; align-items: center; gap: 8px; padding: 12px; background: #FFF3F3; border-left: 3px solid #D32F2F; color: #1A1A1A; font-size: 14px; border-radius: 4px; }
    .pt-error-icon { color: #D32F2F; }
    .pt-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 14px; }
  `]
})
export class PublicTracksComponent implements OnInit {
  tracks: PublicTrackListItem[] = [];
  loading   = false;
  loadError = '';
  filter    = '';
  joiningId: string | null = null;

  constructor(
    private readonly svc:    TeamMeetingsService,
    private readonly router: Router,
    private readonly cdr:    ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  get filtered(): PublicTrackListItem[] {
    const q = this.filter.trim().toLowerCase();
    return q ? this.tracks.filter(t => t.track_name.toLowerCase().includes(q)) : this.tracks;
  }

  cdrMark(): void { this.cdr.markForCheck(); }

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listPublicTracks().subscribe({
      next: res => {
        if (res.success) this.tracks = res.data ?? [];
        else this.loadError = res.error ?? 'Failed to load public series.';
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load public series. Check your connection.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  join(t: PublicTrackListItem): void {
    this.joiningId = t.track_id;
    this.cdr.markForCheck();
    this.svc.joinPublicTrack(t.track_id).subscribe({
      next: res => {
        this.joiningId = null;
        if (res.success) {
          this.router.navigate(['/team-meetings/track', t.track_id]);
        }
        this.cdr.markForCheck();
      },
      error: () => { this.joiningId = null; this.cdr.markForCheck(); }
    });
  }
}
