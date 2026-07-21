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
import { UserProfileService }   from '../../../core/services/user-profile.service';
import { TrackListItem }        from '../../../core/types/team-meetings';
import { MEETING_TEMPLATES }    from './meeting-templates';
import { parseOutlookDrop, OutlookImport } from './outlook-import';

// Business rule (session 2026-07-11): series creation restricted to Phil for now.
// Series creation is open to any authenticated user (Phil 2026-07-14 —
// pdodds-only during the Contract 33 pilot).

@Component({
  selector:        'app-tracks-list',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="tk-shell">
      <div class="tk-header">
        <div>
          <h1 class="tk-title">Meeting Collab</h1>
          <p class="tk-subtitle">
            Plan the agenda before the meeting, organize and take notes during it — everyone edits
            live — and pull items forward from last time. Your series, most recent first;
            bold = the latest meeting has activity you haven't seen.
          </p>
        </div>
        <div class="tk-header-actions">
          <div class="tk-actions-row">
            <button class="tk-btn-primary" (click)="openNewPanel()" type="button">
              + New Series
            </button>
          </div>
          <p class="tk-create-hint">
            Anyone can start a series — 1:1s, team check-ins, working sessions. You'll be its leader.
          </p>
        </div>
      </div>

      <!-- Admin toggle -->
      <label *ngIf="isAdmin" class="tk-admin-toggle">
        <input type="checkbox" [checked]="includeAll" (change)="toggleIncludeAll()">
        Show meetings that you do not participate in (Admins)
      </label>
      <!-- Deleted-series toggle — admins, only when something is deleted (transient) -->
      <label *ngIf="isAdmin && deletedSeriesCount > 0" class="tk-admin-toggle">
        <input type="checkbox" [checked]="showDeletedSeries" (change)="showDeletedSeries = !showDeletedSeries">
        Show deleted series ({{ deletedSeriesCount }})
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
        <a routerLink="/team-meetings/public" class="tk-link">Search public series to join</a>, or create a new series.
      </div>

      <!-- Series grid — sorted by most recent meeting date; bold = unread latest meeting -->
      <div *ngIf="!loading && !loadError && tracks.length > 0" class="tk-list">
        <div class="tk-list-header">
          <span>Series</span>
          <span>Members</span>
          <span>Latest Meeting</span>
          <span>Latest Change</span>
          <span></span>
        </div>
        <div *ngFor="let t of visibleTracks"
             class="tk-row"
             [class.tk-row-deleted]="t.deleted_at"
             [class.tk-row-unread]="t.unread && !t.deleted_at"
             role="button" tabindex="0"
             (click)="!t.deleted_at && openTrack(t)"
             (keydown.enter)="!t.deleted_at && openTrack(t)">
          <span class="tk-track-name">
            {{ t.track_name }}
            <span *ngIf="t.is_leader" class="tk-leader-chip">Leader</span>
            <span *ngIf="!t.is_leader && t.first_leader_name" class="tk-leadername-chip" [title]="'Series leader'">{{ t.first_leader_name }}</span>
            <span *ngIf="t.is_public" class="tk-public-chip">Public</span>
            <span *ngIf="t.deleted_at" class="tk-deleted-chip">Deleted</span>
            <span *ngIf="isAdmin && !t.is_member" class="tk-nonmember-chip">Not a member</span>
          </span>
          <span class="tk-muted">{{ t.member_count }}</span>
          <span class="tk-muted tk-latest-date">
            <ng-container *ngIf="t.latest_meeting">{{ t.latest_meeting.meeting_date | date:'MMM d, y' }}</ng-container>
            <ng-container *ngIf="!t.latest_meeting">—</ng-container>
          </span>
          <!-- Latest-change preview: WHAT changed (bold when unseen — the row bold marks THAT) -->
          <span class="tk-activity-cell" [title]="t.latest_activity?.snippet || ''">
            <ng-container *ngIf="t.latest_activity">
              “{{ t.latest_activity.snippet }}”<ng-container *ngIf="t.latest_activity.author_name"> — {{ initials(t.latest_activity.author_name) }}</ng-container>
            </ng-container>
            <ng-container *ngIf="!t.latest_activity">—</ng-container>
          </span>
          <span class="tk-row-actions" (click)="$event.stopPropagation()">
            <ng-container *ngIf="isAdmin && t.deleted_at">
              <button class="tk-mini-btn" type="button" [disabled]="adminBusyId === t.track_id"
                      (click)="restore(t)">{{ adminBusyId === t.track_id ? '…' : 'Restore' }}</button>
              <button *ngIf="confirmPurgeId !== t.track_id" class="tk-mini-btn tk-danger" type="button"
                      [disabled]="adminBusyId === t.track_id"
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

    <!-- CC-38 f20 (Phil #3): public search demoted from header button to quiet link. -->
    <p style="margin:18px 0 0;font-size:12px;">
      <a routerLink="/team-meetings/public"
         style="color:var(--triarq-color-primary,#257099);text-decoration:underline;">
        Search public meeting series to join
      </a>
    </p>

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

        <!-- CC-38 f20 (Phil #2): Outlook drop-import. Parsed entirely in the
             browser — the file never leaves this machine. -->
        <div class="tk-field">
          <div (dragover)="$event.preventDefault(); dropActive = true"
               (dragleave)="dropActive = false"
               (drop)="onOutlookDrop($event)"
               (click)="msgFileInput.click()"
               [style.border-color]="dropActive ? 'var(--triarq-color-primary,#257099)' : '#C0C0C0'"
               [style.background]="dropActive ? 'rgba(37,112,153,0.06)' : 'none'"
               style="border:2px dashed #C0C0C0;border-radius:8px;padding:12px 14px;cursor:pointer;
                      font-size:12px;color:#5A5A5A;text-align:center;">
            <ng-container *ngIf="!importDraft">
              Drag an <strong>Outlook meeting or email</strong> here to prefill — or click to browse.
            </ng-container>
            <ng-container *ngIf="importDraft">
              <strong>Imported {{ importDraft.kind === 'meeting' ? 'meeting' : 'email' }}:</strong>
              {{ importSummary }}
              <a (click)="clearImport($event)" style="color:#B3261E;margin-left:8px;text-decoration:underline;">Remove</a>
            </ng-container>
          </div>
          <input #msgFileInput type="file" accept=".msg" hidden
                 (change)="onOutlookBrowse($event)">
          <span *ngIf="importError" class="tk-field-error">{{ importError }}</span>
        </div>

        <!-- Meeting type — pre-loads sections + suggested cadence; everything editable after -->
        <div class="tk-field">
          <label class="tk-label">Meeting Type</label>
          <div *ngFor="let t of templates"
               class="tk-template-card"
               [class.tk-template-selected]="selectedTemplateKey === t.key"
               role="radio"
               [attr.aria-checked]="selectedTemplateKey === t.key"
               tabindex="0"
               (click)="selectedTemplateKey = t.key"
               (keydown.enter)="selectedTemplateKey = t.key">
            <span class="tk-template-label">{{ t.label }}</span>
            <span class="tk-template-desc">{{ t.description }}</span>
          </div>
        </div>

        <!-- CC-38 f20 (Phil #3): Public checkbox removed from create — new
             series are private; making one public is a deliberate act in
             Series Settings. -->

        <!-- Invite at creation — same Outlook format as series settings -->
        <div class="tk-field">
          <label class="tk-label">Invite Members (optional)</label>
          <textarea class="tk-input" rows="2" formControlName="invites"
                    placeholder="cbickford@triarqhealth.com; Julie Lundberg <jlundberg@triarqhealth.com>"></textarea>
        </div>

        <p class="tk-create-hint">
          After creating, series setup opens automatically — participants, presenter
          sections, meeting cadence, and the share link all live there (⚙ on the series page anytime).
        </p>

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
    .tk-header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .tk-actions-row { display: flex; align-items: center; gap: 10px; }
    .tk-btn-primary { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 8px 16px; font: 500 14px Roboto, sans-serif; cursor: pointer; white-space: nowrap; }
    .tk-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .tk-btn-ghost { background: transparent; color: var(--triarq-color-primary, #257099); border: 1px solid var(--triarq-color-primary, #257099); border-radius: 5px; padding: 8px 16px; font: 500 14px Roboto, sans-serif; cursor: pointer; text-decoration: none; white-space: nowrap; }
    .tk-admin-toggle { display: flex; align-items: center; gap: 8px; font: 13px Roboto, sans-serif; color: #5A5A5A; margin-bottom: 12px; cursor: pointer; }
    .tk-list-header, .tk-row { display: grid; grid-template-columns: 1.2fr 70px 110px 1fr auto; gap: 8px; padding: 10px 12px; align-items: center; }
    .tk-list-header { font: 600 12px Roboto, sans-serif; color: #757575; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #E0E0E0; }
    .tk-row { border-bottom: 1px solid #F5F5F5; cursor: pointer; transition: background 0.1s; border-radius: 4px; }
    .tk-row:hover { background: #F5F9FC; }
    .tk-row-deleted { opacity: 0.65; cursor: default; }
    .tk-track-name { font: 500 14px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tk-leader-chip { background: #E3F0F7; color: #257099; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .tk-leadername-chip { background: #F0F0F0; color: #5A5A5A; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .tk-public-chip { background: #E8F5E9; color: #2E7D32; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    /* Unread = latest meeting never opened or changed since last view */
    .tk-row-unread .tk-track-name, .tk-row-unread .tk-latest-date { font-weight: 700; color: #1A1A1A; }
    .tk-row-unread .tk-track-name { color: var(--triarq-color-primary, #257099); }
    /* Latest Change column — wraps to two lines then ellipses; bold when unread */
    .tk-activity-cell { font: italic 11px/1.5 Roboto, sans-serif; color: #757575; min-width: 0;
                        display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
                        overflow: hidden; }
    .tk-row-unread .tk-activity-cell { font-weight: 700; color: #1A1A1A; }
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
    .tk-template-card {
      display: flex; flex-direction: column; gap: 2px;
      border: 1px solid #E0E0E0; border-radius: 10px;
      padding: 10px 12px; margin-bottom: 8px;
      cursor: pointer; transition: border-color 0.1s, background 0.1s;
    }
    .tk-template-card:hover { border-color: var(--triarq-color-primary, #257099); }
    .tk-template-selected { border-color: var(--triarq-color-primary, #257099); background: #F0F7FB; }
    .tk-template-label { font: 600 13px Roboto, sans-serif; color: #1A1A1A; }
    .tk-template-desc { font: 11px/1.4 Roboto, sans-serif; color: #757575; }
    .tk-create-hint { font: italic 11px/1.5 Roboto, sans-serif; color: #757575; margin: 0; }
  `]
})
export class TracksListComponent implements OnInit {
  tracks: TrackListItem[] = [];
  loading    = false;
  loadError  = '';
  includeAll = false;
  isAdmin    = false;

  /** Scope toggle SWAPS the view (Phil 2026-07-14): checked = only meetings
   *  you do NOT participate in; unchecked = yours. Deleted visibility is the
   *  SEPARATE showDeletedSeries toggle (state, not scope) — admin-only since
   *  restore/purge is admin-only, rendered only when something is deleted. */
  showDeletedSeries = false;

  private get scopeTracks(): TrackListItem[] {
    return this.includeAll
      ? this.tracks.filter(t => !t.is_member)
      : this.tracks.filter(t => t.is_member);
  }
  get deletedSeriesCount(): number {
    return this.scopeTracks.filter(t => !!t.deleted_at).length;
  }
  get visibleTracks(): TrackListItem[] {
    return this.showDeletedSeries
      ? this.scopeTracks.filter(t => !!t.deleted_at)
      : this.scopeTracks.filter(t => !t.deleted_at);
  }

  /** "Phil Dodds" → "PD" for the Latest Change column. */
  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  }

  showNewPanel = false;
  saving       = false;
  saveError    = '';
  confirmPurgeId: string | null = null;

  readonly templates = MEETING_TEMPLATES;
  selectedTemplateKey: 'team' | 'one-on-one' | 'blank' = 'team';

  newForm!: FormGroup;

  constructor(
    private readonly svc:     TeamMeetingsService,
    private readonly profile: UserProfileService,
    private readonly fb:      FormBuilder,
    private readonly router:  Router,
    private readonly cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = !!this.profile.getCurrentProfile()?.is_admin;
    this.newForm = this.fb.group({
      track_name: ['', Validators.required],
      is_public:  [false],
      invites:    ['']
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
          // Most recent meeting date first; series with no meetings sink to the
          // bottom alphabetically.
          this.tracks = (res.data ?? []).slice().sort((a, b) => {
            const ad = a.latest_meeting?.meeting_date ?? '';
            const bd = b.latest_meeting?.meeting_date ?? '';
            if (ad !== bd) return bd.localeCompare(ad);
            return a.track_name.localeCompare(b.track_name);
          });
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
    this.showDeletedSeries = false; // state toggle resets when scope changes
    this.load();
  }

  openTrack(t: TrackListItem): void {
    // CC-38 f20 (Phil #4): land directly on the latest meeting — prep happens
    // there. The full meeting list stays reachable from the meeting's series link.
    this.router.navigate(['/team-meetings/track', t.track_id, 'latest']);
  }

  openNewPanel(): void {
    this.newForm.reset({ track_name: '', is_public: false, invites: '' });
    this.selectedTemplateKey = 'team';
    this.saveError    = '';
    this.showNewPanel = true;
  }

  closeNewPanel(): void {
    if (this.saving) return;
    this.showNewPanel = false;
  }

  // ── CC-38 f20: Outlook drop-import state ────────────────────────────────────
  dropActive = false;
  importDraft: OutlookImport | null = null;
  importError = '';

  get importSummary(): string {
    const d = this.importDraft;
    if (!d) { return ''; }
    const bits: string[] = [];
    if (d.cadence && d.weekday_label) { bits.push(`Weekly ${d.weekday_label}`); }
    if (d.meeting_time) { bits.push(`${d.meeting_time} ET + reminders`); }
    bits.push(`${d.invite_emails.length} member${d.invite_emails.length === 1 ? '' : 's'}`);
    if (d.presenter_emails.length) { bits.push(`${d.presenter_emails.length} presenter${d.presenter_emails.length === 1 ? '' : 's'}`); }
    return bits.join(' · ');
  }

  onOutlookDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dropActive = false;
    const file = ev.dataTransfer?.files?.[0];
    if (file) { this.applyOutlookFile(file); }
  }

  onOutlookBrowse(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) { this.applyOutlookFile(file); }
    input.value = '';
  }

  private applyOutlookFile(file: File): void {
    this.importError = '';
    parseOutlookDrop(file).then(draft => {
      this.importDraft = draft;
      this.newForm.patchValue({
        track_name: draft.series_name,
        invites:    draft.invite_emails.join('; ')
      });
      this.cdr.markForCheck();
    }).catch((e: Error) => {
      this.importError = e.message;
      this.cdr.markForCheck();
    });
  }

  clearImport(ev: Event): void {
    ev.stopPropagation();
    this.importDraft = null;
    this.importError = '';
    this.newForm.patchValue({ invites: '' });
    this.cdr.markForCheck();
  }

  createTrack(): void {
    if (this.newForm.invalid || this.saving) return;
    const { track_name, invites } = this.newForm.value as { track_name: string; invites: string };
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();
    const template = this.templates.find(t => t.key === this.selectedTemplateKey);
    // Import wins for cadence when present; invites go through create_track
    // atomically (CC-38 f20) so time/reminders/presenters land in one call.
    const cadence = this.importDraft?.cadence ?? template?.suggested_cadence;
    this.svc.createTrack(track_name, /* is_public — always private at create */ false,
      template?.sections, cadence, {
        ...(this.importDraft?.meeting_time ? {
          meeting_time: this.importDraft.meeting_time,
          reminder_lead_minutes: 120
        } : {}),
        ...(invites?.trim() ? { invite_emails: invites } : {}),
        ...(this.importDraft?.presenter_emails.length ? { presenter_emails: this.importDraft.presenter_emails } : {})
      }).subscribe({
      next: res => {
        if (res.success && res.data) {
          const trackId = res.data.track_id;
          const finish = () => {
            this.saving       = false;
            this.showNewPanel = false;
            this.importDraft  = null;
            // Land on the series with setup open — participants/sections/cadence right there.
            this.router.navigate(['/team-meetings/track', trackId], { queryParams: { setup: 1 } });
          };
          finish();
        } else {
          this.saving    = false;
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

  adminBusyId: string | null = null;

  restore(t: TrackListItem): void {
    if (this.adminBusyId) return;
    this.adminBusyId = t.track_id;
    this.cdr.markForCheck();
    this.svc.restoreTrack(t.track_id).subscribe({
      next: () => { this.adminBusyId = null; this.load(); },
      error: () => { this.adminBusyId = null; this.cdr.markForCheck(); }
    });
  }

  purge(t: TrackListItem): void {
    if (this.adminBusyId) return;
    this.confirmPurgeId = null;
    this.adminBusyId = t.track_id;
    this.cdr.markForCheck();
    this.svc.purgeTrack(t.track_id).subscribe({
      next: () => { this.adminBusyId = null; this.load(); },
      error: () => { this.adminBusyId = null; this.cdr.markForCheck(); }
    });
  }
}
