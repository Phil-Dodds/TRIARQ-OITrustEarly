// tracks-list.component.ts — Pathways OI Trust
// Meeting series (tracks) landing screen. Route: /team-meetings — all users.
// Shows series the user participates in. Admin toggle reveals all series incl.
// soft-deleted (restore / purge). "+ New Series" restricted to the track creator.

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamMeetingsService }  from '../team-meetings.service';
import { AuthService }          from '../../../core/services/auth.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import { TrackListItem }        from '../../../core/types/team-meetings';

// Business rule (session 2026-07-11): series creation restricted to Phil for now.
const TRACK_CREATOR_EMAIL = 'pdodds@triarqhealth.com';

@Component({
  selector:        'app-tracks-list',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="tk-shell">
      <div class="tk-header">
        <div>
          <h1 class="tk-title">Team Meetings</h1>
          <p class="tk-subtitle">Your meeting series. Open a series to see its meetings.</p>
        </div>
        <div class="tk-header-actions">
          <a class="tk-btn-ghost" routerLink="/team-meetings/public">Search Public Meetings to Join</a>
          <button *ngIf="canCreate" class="tk-btn-primary" (click)="openNewPanel()" type="button">
            + New Series
          </button>
        </div>
      </div>

      <!-- Admin toggle -->
      <label *ngIf="isAdmin" class="tk-admin-toggle">
        <input type="checkbox" [checked]="includeAll" (change)="toggleIncludeAll()">
        Include meetings that you do not participate (Admins)
      </label>

      <!-- Loading -->
      <div *ngIf="loading" class="tk-list">
        <div *ngFor="let i of [1,2,3]" class="tk-skeleton-row"></div>
      </div>

      <!-- Error -->
      <div *ngIf="loadError && !loading" class="tk-error">
        <span class="tk-error-icon">⚠</span> {{ loadError }}
        <button class="tk-link-btn" (click)="load()" type="button">Retry</button>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !loadError && tracks.length === 0" class="tk-empty">
        You are not part of any meeting series yet.
        <a routerLink="/team-meetings/public" class="tk-link">Search public series to join</a><ng-container *ngIf="canCreate">, or create a new series</ng-container>.
      </div>

      <!-- Series grid -->
      <div *ngIf="!loading && !loadError && tracks.length > 0" class="tk-list">
        <div class="tk-list-header">
          <span>Series</span>
          <span>Members</span>
          <span>Latest Meeting</span>
          <span>Visibility</span>
          <span></span>
        </div>
        <div *ngFor="let t of tracks"
             class="tk-row"
             [class.tk-row-deleted]="t.deleted_at"
             role="button" tabindex="0"
             (click)="!t.deleted_at && openTrack(t)"
             (keydown.enter)="!t.deleted_at && openTrack(t)">
          <span class="tk-track-name">
            {{ t.track_name }}
            <span *ngIf="t.is_leader" class="tk-leader-chip">Leader</span>
            <span *ngIf="t.deleted_at" class="tk-deleted-chip">Deleted</span>
            <span *ngIf="isAdmin && !t.is_member" class="tk-nonmember-chip">Not a member</span>
          </span>
          <span class="tk-muted">{{ t.member_count }}</span>
          <span class="tk-muted">
            <ng-container *ngIf="t.latest_meeting">
              {{ t.latest_meeting.title }} · {{ t.latest_meeting.meeting_date | date:'MMM d, y' }}
            </ng-container>
            <ng-container *ngIf="!t.latest_meeting">—</ng-container>
          </span>
          <span class="tk-muted">{{ t.is_public ? 'Public' : 'Private' }}</span>
          <span class="tk-row-actions" (click)="$event.stopPropagation()">
            <ng-container *ngIf="isAdmin && t.deleted_at">
              <button class="tk-mini-btn" type="button" (click)="restore(t)">Restore</button>
              <button *ngIf="confirmPurgeId !== t.track_id" class="tk-mini-btn tk-danger" type="button"
                      (click)="confirmPurgeId = t.track_id">Purge</button>
              <span *ngIf="confirmPurgeId === t.track_id" class="tk-confirm">
                Permanently hide this series and all its meetings?
                <button class="tk-confirm-btn" type="button" (click)="purge(t)">Yes, purge</button>
                <button class="tk-cancel-btn" type="button" (click)="confirmPurgeId = null">Cancel</button>
              </span>
            </ng-container>
          </span>
        </div>
      </div>
    </div>

    <!-- New Series panel -->
    <div *ngIf="showNewPanel" class="tk-scrim" (click)="closeNewPanel()"></div>
    <div *ngIf="showNewPanel" class="tk-panel">
      <div class="tk-panel-header">
        <span class="tk-panel-title">New Series</span>
        <button class="tk-close-btn" (click)="closeNewPanel()" type="button" aria-label="Close">×</button>
      </div>
      <form [formGroup]="newForm" (ngSubmit)="createTrack()" class="tk-panel-body">
        <div class="tk-field">
          <label class="tk-label">Series Name</label>
          <input class="tk-input" formControlName="track_name" type="text" placeholder="e.g. Product Ops">
          <span *ngIf="newForm.get('track_name')?.invalid && newForm.get('track_name')?.touched"
                class="tk-field-error">Series name is required.</span>
        </div>
        <div class="tk-field">
          <label class="tk-label-inline">
            <input type="checkbox" formControlName="is_public">
            Public — anyone can find and join this series
          </label>
        </div>
        <div *ngIf="saveError" class="tk-form-error">{{ saveError }}</div>
        <div class="tk-panel-actions">
          <button class="tk-btn-ghost" (click)="closeNewPanel()" type="button">Cancel</button>
          <button class="tk-btn-primary" type="submit" [disabled]="saving || newForm.invalid">
            {{ saving ? 'Creating…' : 'Create Series' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .tk-shell { padding: 24px 32px; max-width: 1080px; }
    .tk-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .tk-title { font: 600 22px/1.2 Roboto, sans-serif; color: var(--triarq-text-primary, #1A1A1A); margin: 0 0 4px; }
    .tk-subtitle { font: italic 11px/1.4 Roboto, sans-serif; color: #5A5A5A; margin: 0; }
    .tk-header-actions { display: flex; align-items: center; gap: 10px; }
    .tk-btn-primary { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 8px 16px; font: 500 14px Roboto, sans-serif; cursor: pointer; white-space: nowrap; }
    .tk-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .tk-btn-ghost { background: transparent; color: var(--triarq-color-primary, #257099); border: 1px solid var(--triarq-color-primary, #257099); border-radius: 5px; padding: 8px 16px; font: 500 14px Roboto, sans-serif; cursor: pointer; text-decoration: none; white-space: nowrap; }
    .tk-admin-toggle { display: flex; align-items: center; gap: 8px; font: 13px Roboto, sans-serif; color: #5A5A5A; margin-bottom: 12px; cursor: pointer; }
    .tk-list-header, .tk-row { display: grid; grid-template-columns: 1fr 90px 280px 90px 220px; gap: 8px; padding: 10px 12px; align-items: center; }
    .tk-list-header { font: 600 12px Roboto, sans-serif; color: #757575; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #E0E0E0; }
    .tk-row { border-bottom: 1px solid #F5F5F5; cursor: pointer; transition: background 0.1s; border-radius: 4px; }
    .tk-row:hover { background: #F5F9FC; }
    .tk-row-deleted { opacity: 0.65; cursor: default; }
    .tk-track-name { font: 500 14px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tk-leader-chip { background: #E3F0F7; color: #257099; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .tk-deleted-chip { background: #FDECEA; color: #D32F2F; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .tk-nonmember-chip { background: #F0F0F0; color: #757575; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .tk-muted { color: #757575; font: 13px Roboto, sans-serif; }
    .tk-row-actions { display: flex; align-items: center; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
    .tk-mini-btn { background: none; border: 1px solid #BDBDBD; border-radius: 5px; color: #5A5A5A; padding: 2px 10px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .tk-mini-btn.tk-danger { border-color: #D32F2F; color: #D32F2F; }
    .tk-confirm { display: flex; align-items: center; gap: 6px; font: 11px Roboto, sans-serif; color: #D32F2F; }
    .tk-confirm-btn { background: #D32F2F; color: #fff; border: none; border-radius: 3px; padding: 2px 8px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .tk-cancel-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 11px; }
    .tk-skeleton-row { height: 44px; background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%); background-size: 200% 100%; animation: tk-shimmer 1.4s infinite; border-radius: 4px; margin-bottom: 8px; }
    @keyframes tk-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .tk-empty { color: #757575; font: 14px Roboto, sans-serif; padding: 32px 12px; }
    .tk-link { color: var(--triarq-color-primary, #257099); }
    .tk-error { display: flex; align-items: center; gap: 8px; padding: 12px; background: #FFF3F3; border-left: 3px solid #D32F2F; color: #1A1A1A; font-size: 14px; border-radius: 4px; }
    .tk-error-icon { color: #D32F2F; }
    .tk-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 14px; }
    .tk-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; }
    .tk-panel { position: fixed; top: 0; right: 0; width: 420px; height: 100vh; background: #fff; box-shadow: -4px 0 16px rgba(0,0,0,0.12); z-index: 101; display: flex; flex-direction: column; border-radius: 10px 0 0 10px; }
    .tk-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #E0E0E0; }
    .tk-panel-title { font: 600 16px Roboto, sans-serif; }
    .tk-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #757575; }
    .tk-panel-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .tk-field { display: flex; flex-direction: column; gap: 4px; }
    .tk-label { font: 600 13px Roboto, sans-serif; color: #1A1A1A; }
    .tk-label-inline { display: flex; align-items: center; gap: 8px; font: 13px Roboto, sans-serif; color: #1A1A1A; cursor: pointer; }
    .tk-input { border: 1px solid #BDBDBD; border-radius: 5px; padding: 8px 10px; font: 14px Roboto, sans-serif; outline: none; transition: border-color 0.15s; }
    .tk-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .tk-field-error { font-size: 12px; color: #D32F2F; }
    .tk-form-error { padding: 8px 12px; background: #FFF3F3; border-left: 3px solid #D32F2F; font-size: 13px; color: #1A1A1A; border-radius: 4px; }
    .tk-panel-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: auto; }
  `]
})
export class TracksListComponent implements OnInit {
  tracks: TrackListItem[] = [];
  loading    = false;
  loadError  = '';
  includeAll = false;
  isAdmin    = false;
  canCreate  = false;

  showNewPanel = false;
  saving       = false;
  saveError    = '';
  confirmPurgeId: string | null = null;

  newForm!: FormGroup;

  constructor(
    private readonly svc:     TeamMeetingsService,
    private readonly auth:    AuthService,
    private readonly profile: UserProfileService,
    private readonly fb:      FormBuilder,
    private readonly router:  Router,
    private readonly cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const email = this.auth.getCurrentUser()?.email?.toLowerCase() ?? '';
    this.canCreate = email === TRACK_CREATOR_EMAIL;
    this.isAdmin   = !!this.profile.getCurrentProfile()?.is_admin;
    this.newForm = this.fb.group({
      track_name: ['', Validators.required],
      is_public:  [false]
    });
    this.load();
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listMyTracks(this.includeAll).subscribe({
      next: res => {
        if (res.success) {
          this.tracks = res.data ?? [];
          if (this.tracks.some(t => !t.is_member)) this.isAdmin = true;
        } else {
          this.loadError = res.error ?? 'Failed to load meeting series.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load meeting series. Check your connection.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleIncludeAll(): void {
    this.includeAll = !this.includeAll;
    this.load();
  }

  openTrack(t: TrackListItem): void {
    this.router.navigate(['/team-meetings/track', t.track_id]);
  }

  openNewPanel(): void {
    this.newForm.reset({ track_name: '', is_public: false });
    this.saveError    = '';
    this.showNewPanel = true;
  }

  closeNewPanel(): void {
    if (this.saving) return;
    this.showNewPanel = false;
  }

  createTrack(): void {
    if (this.newForm.invalid || this.saving) return;
    const { track_name, is_public } = this.newForm.value as { track_name: string; is_public: boolean };
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();
    this.svc.createTrack(track_name, !!is_public).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.showNewPanel = false;
          this.router.navigate(['/team-meetings/track', res.data.track_id]);
        } else {
          this.saveError = res.error ?? 'Failed to create series.';
          this.cdr.markForCheck();
        }
      },
      error: err => {
        this.saving    = false;
        this.saveError = err?.error ?? 'Unable to create series. Check your connection.';
        this.cdr.markForCheck();
      }
    });
  }

  restore(t: TrackListItem): void {
    this.svc.restoreTrack(t.track_id).subscribe({ next: () => this.load() });
  }

  purge(t: TrackListItem): void {
    this.confirmPurgeId = null;
    this.svc.purgeTrack(t.track_id).subscribe({ next: () => this.load() });
  }
}
