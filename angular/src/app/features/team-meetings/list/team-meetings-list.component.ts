// team-meetings-list.component.ts — Pathways OI Trust
// Meetings list within a series (D-490 Step 3 + Tracks Phase A).
// Route: /team-meetings/track/:track_id — series members + admins.
// Row tap → navigate to /team-meetings/:id (full-screen prep/run; CC-002 deviation from S-018).
// "+ New Meeting" → right panel (S-016 create panel, S-017 modal scrim).
// Gear → series settings panel (members, leaders, sections, share URL).

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule }           from '@ionic/angular';
import { TeamMeetingsService }   from '../team-meetings.service';
import { AuthService }           from '../../../core/services/auth.service';
import { TrackSettingsComponent } from '../tracks/track-settings.component';
import { TeamMeetingListItem }   from '../../../core/types/team-meetings';

function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday;
}

function formatMonday(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dd = String(d.getDate()).padStart(2, '0');
  return `${months[d.getMonth()]} ${dd}, ${d.getFullYear()}`;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

@Component({
  selector:        'app-team-meetings-list',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IonicModule, TrackSettingsComponent],
  template: `
    <!-- S-001: visible context on every surface -->
    <div class="tm-shell">
      <div class="tm-header">
        <div>
          <a routerLink="/team-meetings" class="tm-back">← Team Meetings</a>
          <h1 class="tm-title">{{ trackName || 'Meetings' }}</h1>
          <p class="tm-subtitle">Meeting prep and run notes for this series.</p>
        </div>
        <div class="tm-header-actions">
          <button class="tm-gear-btn" (click)="showSettings = true" type="button" title="Series settings">⚙</button>
          <button class="tm-btn-primary" (click)="openNewMeeting()" type="button">
            + New Meeting
          </button>
        </div>
      </div>

      <!-- Loading state — S-028 Context B skeleton rows -->
      <div *ngIf="loading" class="tm-list">
        <div *ngFor="let i of [1,2,3]" class="tm-skeleton-row"></div>
      </div>

      <!-- Error state -->
      <div *ngIf="loadError && !loading" class="tm-error">
        <span class="tm-error-icon">⚠</span>
        {{ loadError }}
        <button class="tm-link-btn" (click)="loadMeetings()" type="button">Retry</button>
      </div>

      <!-- Empty state — S-001 -->
      <div *ngIf="!loading && !loadError && meetings.length === 0" class="tm-empty">
        No meetings yet. Create your first meeting to get started.
      </div>

      <!-- Meeting grid -->
      <div *ngIf="!loading && !loadError && meetings.length > 0" class="tm-list">
        <!-- Deleted-meetings toggle — leaders/admins, only when something is deleted -->
        <label *ngIf="isLeader && deletedCount > 0" class="tm-deleted-toggle">
          <input type="checkbox" [checked]="showDeleted" (change)="toggleShowDeleted()">
          Show deleted meetings ({{ deletedCount }})
        </label>

        <div class="tm-list-header">
          <span class="tm-col-title">Meeting Title</span>
          <span class="tm-col-date">Meeting Date</span>
          <span class="tm-col-updated">Last Updated</span>
          <span>Latest Change</span>
          <span></span>
        </div>
        <!-- D-308 / S-005: full-row tap navigates to meeting prep/run screen.
             CC-38 f20 (Phil #4): only the two meetings of interest (next/latest
             + prior) show by default; the older tail collapses. -->
        <div *ngFor="let m of visibleMeetings"
             class="tm-row"
             [class.tm-row-deleting]="deletingId === m.id"
             [class.tm-row-unread]="m.unread"
             role="button"
             tabindex="0"
             (click)="!showDeleted && confirmDeleteId !== m.id && editingMeeting?.id !== m.id && openMeeting(m.id)"
             (keydown.enter)="!showDeleted && confirmDeleteId !== m.id && editingMeeting?.id !== m.id && openMeeting(m.id)">
          <span class="tm-col-title tm-meeting-name">
            {{ m.title }}
            <span *ngIf="showDeleted" class="tm-deleted-chip">Deleted</span>
          </span>
          <span class="tm-col-date">{{ m.meeting_date | date:'MMM d, y' }}</span>
          <!-- content_updated_at = anything changed by anyone (incl. deletes/moves,
               which is why it can run ahead of the Latest Change preview) -->
          <span class="tm-col-updated tm-muted">{{ m.content_updated_at | date:'MMM d, y h:mm a' }}</span>
          <!-- Latest-change preview: WHAT changed (bold with the row when unread) -->
          <span class="tm-activity-cell" [title]="m.latest_activity?.snippet || ''">
            <ng-container *ngIf="m.latest_activity">
              “{{ m.latest_activity.snippet }}”<ng-container *ngIf="m.latest_activity.author_name"> — {{ initials(m.latest_activity.author_name) }}</ng-container>
            </ng-container>
            <ng-container *ngIf="!m.latest_activity">—</ng-container>
          </span>
          <!-- Row actions — edit + delete (live view) / restore (deleted view) -->
          <span class="tm-row-actions" (click)="$event.stopPropagation()">
            <button *ngIf="showDeleted" class="tm-restore-btn" type="button"
                    [disabled]="restoringId === m.id"
                    (click)="restoreMeeting(m)">{{ restoringId === m.id ? 'Restoring…' : 'Restore' }}</button>
            <ng-container *ngIf="!showDeleted">
              <ng-container *ngIf="confirmDeleteId !== m.id">
                <button class="tm-edit-btn"
                        type="button"
                        title="Edit meeting"
                        (click)="openEditMeeting(m)">
                  ✎
                </button>
                <button class="tm-delete-btn"
                        type="button"
                        [disabled]="deletingId === m.id"
                        title="Delete meeting"
                        (click)="confirmDeleteId = m.id">
                  {{ deletingId === m.id ? '…' : '🗑' }}
                </button>
              </ng-container>
              <span *ngIf="confirmDeleteId === m.id" class="tm-delete-confirm">
                Delete?
                <button class="tm-delete-confirm-btn" type="button" (click)="deleteMeeting(m)">Yes</button>
                <button class="tm-delete-cancel-btn" type="button" (click)="confirmDeleteId = null">Cancel</button>
              </span>
            </ng-container>
          </span>
        </div>
        <!-- CC-38 f20 (Phil #4): older-meetings collapse toggle. -->
        <button *ngIf="!showAllMeetings && meetings.length > 2" type="button"
                (click)="showAllMeetings = true"
                style="background:none;border:none;cursor:pointer;padding:8px 0;
                       color:var(--triarq-color-primary,#257099);font-size:12px;text-decoration:underline;">
          Show earlier meetings ({{ meetings.length - 2 }})
        </button>
      </div>
    </div>

    <!-- Series settings panel -->
    <app-track-settings *ngIf="showSettings"
                        [trackId]="trackId"
                        [currentUserId]="currentUserId"
                        (close)="showSettings = false"
                        (changed)="loadMeetings()"
                        (deleted)="onTrackDeleted()">
    </app-track-settings>

    <!-- Meeting panel — New (S-016/S-017) or Edit mode -->
    <div *ngIf="showNewPanel" class="tm-scrim" (click)="closeNewPanel()"></div>
    <div *ngIf="showNewPanel" class="tm-panel">
      <div class="tm-panel-header">
        <span class="tm-panel-title">{{ editingMeeting ? 'Edit Meeting' : 'New Meeting' }}</span>
        <button class="tm-close-btn" (click)="closeNewPanel()" type="button" aria-label="Close">×</button>
      </div>

      <form [formGroup]="newMeetingForm" (ngSubmit)="saveNewMeeting()" class="tm-panel-body">
        <div class="tm-field">
          <label class="tm-label">Meeting Date</label>
          <input class="tm-input"
                 formControlName="meeting_date"
                 type="date"
                 (change)="onDateChanged()">
        </div>

        <div class="tm-field">
          <label class="tm-label">Meeting Title</label>
          <input class="tm-input"
                 formControlName="title"
                 type="text"
                 placeholder="Meeting title"
                 (input)="titleEdited = true">
          <span *ngIf="newMeetingForm.get('title')?.invalid && newMeetingForm.get('title')?.touched"
                class="tm-field-error">Title is required.</span>
        </div>

        <div *ngIf="saveError" class="tm-form-error">{{ saveError }}</div>

        <div class="tm-panel-actions">
          <button class="tm-btn-ghost" (click)="closeNewPanel()" type="button">Cancel</button>
          <button class="tm-btn-primary"
                  type="submit"
                  [disabled]="saving || newMeetingForm.invalid">
            {{ saving ? (editingMeeting ? 'Saving…' : 'Creating…') : (editingMeeting ? 'Save Changes' : 'Create Meeting') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .tm-shell {
      padding: 24px 32px;
      max-width: 960px;
    }
    .tm-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .tm-back { font: 13px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); text-decoration: none; }
    .tm-header-actions { display: flex; align-items: center; gap: 10px; }
    .tm-gear-btn { background: none; border: 1px solid #BDBDBD; border-radius: 5px; color: #5A5A5A; font-size: 16px; padding: 6px 10px; cursor: pointer; }
    .tm-gear-btn:hover { border-color: var(--triarq-color-primary, #257099); color: var(--triarq-color-primary, #257099); }
    .tm-title {
      font: 600 22px/1.2 Roboto, sans-serif;
      color: var(--triarq-text-primary, #1A1A1A);
      margin: 0 0 4px;
    }
    /* S-015 surface description */
    .tm-subtitle {
      font: italic 11px/1.4 Roboto, sans-serif;
      color: #5A5A5A;
      margin: 0;
    }
    .tm-btn-primary {
      background: var(--triarq-color-primary, #257099);
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: 8px 16px;
      font: 500 14px Roboto, sans-serif;
      cursor: pointer;
      white-space: nowrap;
    }
    .tm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .tm-btn-ghost {
      background: transparent;
      color: var(--triarq-color-primary, #257099);
      border: 1px solid var(--triarq-color-primary, #257099);
      border-radius: 5px;
      padding: 8px 16px;
      font: 500 14px Roboto, sans-serif;
      cursor: pointer;
    }
    .tm-list-header, .tm-row {
      display: grid;
      grid-template-columns: 1.2fr 105px 150px 1fr 80px;
      gap: 8px;
      padding: 10px 12px;
      align-items: center;
    }
    .tm-list-header {
      font: 600 12px Roboto, sans-serif;
      color: #757575;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #E0E0E0;
    }
    .tm-row {
      border-bottom: 1px solid #F5F5F5;
      cursor: pointer;
      transition: background 0.1s;
      border-radius: 4px;
    }
    .tm-row:hover { background: #F5F9FC; }
    .tm-row-deleting { opacity: 0.4; pointer-events: none; }
    /* Unread = meeting changed since your last view (or never viewed) */
    .tm-row-unread .tm-meeting-name { font-weight: 700; }
    .tm-row-unread .tm-col-date, .tm-row-unread .tm-col-updated { font-weight: 700; color: #1A1A1A; }
    .tm-meeting-name { font: 500 14px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); min-width: 0; }
    /* Latest Change column — two-line clamp; bolds with the row when unread */
    .tm-activity-cell { font: italic 11px/1.5 Roboto, sans-serif; color: #757575; min-width: 0;
                        display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
                        overflow: hidden; }
    .tm-row-unread .tm-activity-cell { font-weight: 700; color: #1A1A1A; }
    .tm-deleted-toggle { display: flex; align-items: center; gap: 8px; font: 13px Roboto, sans-serif;
                         color: #5A5A5A; margin: 0 0 10px; cursor: pointer; }
    .tm-deleted-chip { background: #9E9E9E; color: #fff; border-radius: 999px; padding: 1px 8px;
                       font: 500 10px Roboto, sans-serif; margin-left: 6px; vertical-align: middle; }
    .tm-restore-btn { background: none; border: 1px solid var(--triarq-color-primary, #257099);
                      color: var(--triarq-color-primary, #257099); border-radius: 5px; padding: 3px 10px;
                      font: 12px Roboto, sans-serif; cursor: pointer; }
    .tm-restore-btn:disabled { opacity: 0.6; cursor: default; }
    .tm-muted { color: #757575; font-size: 13px; }
    .tm-row-actions { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
    .tm-edit-btn { background: none; border: none; color: #BDBDBD; cursor: pointer; font-size: 16px; padding: 2px 4px; border-radius: 3px; transition: color 0.1s; }
    .tm-edit-btn:hover { color: var(--triarq-color-primary, #257099); }
    .tm-delete-btn { background: none; border: none; color: #BDBDBD; cursor: pointer; font-size: 16px; padding: 2px 4px; border-radius: 3px; transition: color 0.1s; }
    .tm-delete-btn:hover { color: #D32F2F; }
    .tm-delete-confirm { display: flex; align-items: center; gap: 6px; font: 12px Roboto, sans-serif; color: #D32F2F; white-space: nowrap; }
    .tm-delete-confirm-btn { background: #D32F2F; color: #fff; border: none; border-radius: 3px; padding: 2px 8px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .tm-delete-cancel-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 11px; }
    .tm-skeleton-row {
      height: 44px;
      background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .tm-empty { color: #757575; font: 14px Roboto, sans-serif; padding: 32px 12px; }
    .tm-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #FFF3F3;
      border-left: 3px solid #D32F2F;
      color: #1A1A1A;
      font-size: 14px;
      border-radius: 4px;
    }
    .tm-error-icon { color: #D32F2F; }
    .tm-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 14px; }
    /* Right panel — S-016, S-017 */
    .tm-scrim {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.3);
      z-index: 100;
    }
    .tm-panel {
      position: fixed; top: 0; right: 0;
      width: 420px; height: 100vh;
      background: #fff;
      box-shadow: -4px 0 16px rgba(0,0,0,0.12);
      z-index: 101;
      display: flex; flex-direction: column;
      border-radius: 10px 0 0 10px;
    }
    .tm-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #E0E0E0;
    }
    .tm-panel-title { font: 600 16px Roboto, sans-serif; }
    .tm-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #757575; }
    .tm-panel-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .tm-field { display: flex; flex-direction: column; gap: 4px; }
    .tm-label { font: 600 13px Roboto, sans-serif; color: #1A1A1A; }
    .tm-input {
      border: 1px solid #BDBDBD; border-radius: 5px;
      padding: 8px 10px; font: 14px Roboto, sans-serif;
      outline: none; transition: border-color 0.15s;
    }
    .tm-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .tm-field-error { font-size: 12px; color: #D32F2F; }
    .tm-form-error {
      padding: 8px 12px; background: #FFF3F3;
      border-left: 3px solid #D32F2F;
      font-size: 13px; color: #1A1A1A; border-radius: 4px;
    }
    .tm-panel-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: auto; }
  `]
})
export class TeamMeetingsListComponent implements OnInit {
  meetings: TeamMeetingListItem[] = [];
  loading   = false;
  loadError = '';

  trackId       = '';
  // CC-38 f20 (Phil #4): default view = the two meetings of interest
  // (next/latest + prior); the older tail collapses behind a toggle.
  showAllMeetings = false;
  // Memoized — fresh-array getters feeding *ngFor cause CD churn (CC-38-65 lesson).
  private visCache: { src: unknown; all: boolean; out: typeof this.meetings } | null = null;
  get visibleMeetings() {
    const all = this.showAllMeetings || this.showDeleted;
    if (this.visCache?.src !== this.meetings || this.visCache.all !== all) {
      this.visCache = { src: this.meetings, all, out: all ? this.meetings : this.meetings.slice(0, 2) };
    }
    return this.visCache.out;
  }
  trackName     = '';
  isLeader      = false;
  showSettings  = false;
  currentUserId = '';

  showNewPanel    = false;
  saving          = false;
  saveError       = '';
  confirmDeleteId: string | null           = null;
  deletingId:      string | null           = null;
  editingMeeting:  TeamMeetingListItem | null = null;

  newMeetingForm!: FormGroup;

  constructor(
    private readonly svc: TeamMeetingsService,
    private readonly auth: AuthService,
    private readonly fb:  FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.trackId       = this.route.snapshot.paramMap.get('track_id') ?? '';
    this.currentUserId = this.auth.getCurrentUser()?.id ?? '';
    // Fresh-series flow: ?setup=1 lands with the settings panel already open.
    if (this.route.snapshot.queryParamMap.get('setup')) {
      this.showSettings = true;
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
    this.initForm();
    this.loadMeetings();
  }

  // Default meeting title = "<Series Name> — <Set Date>". Auto-updates when the
  // date changes until the user types their own title.
  titleEdited = false;

  private defaultTitle(dateIso: string): string {
    const d = new Date(dateIso + 'T00:00:00');
    const series = this.trackName || 'Meeting';
    return `${series} — ${formatMonday(d)}`;
  }

  // Cadence-suggested date for the next meeting (from list_team_meetings track
  // info). Suggestion only — user can pick any date (D-205 nudge philosophy).
  suggestedDate = '';

  private initForm(): void {
    const date = this.suggestedDate || todayIso();
    this.titleEdited = false;
    this.newMeetingForm = this.fb.group({
      meeting_date: [date, Validators.required],
      title:        [this.defaultTitle(date), Validators.required]
    });
  }

  onDateChanged(): void {
    if (this.titleEdited || this.editingMeeting) return;
    const date = this.newMeetingForm.get('meeting_date')?.value as string;
    if (date) this.newMeetingForm.get('title')?.setValue(this.defaultTitle(date));
  }

  loadMeetings(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listMeetings(this.trackId, 20, 0, this.showDeleted).subscribe({
      next: res => {
        if (res.success) {
          this.meetings = res.data ?? [];
          const trackInfo = (res as unknown as { track?: { track_name: string; is_leader: boolean; deleted_count?: number; suggested_next_meeting_date?: string } }).track;
          if (trackInfo) {
            this.trackName     = trackInfo.track_name;
            this.isLeader      = trackInfo.is_leader;
            this.deletedCount  = trackInfo.deleted_count ?? 0;
            this.suggestedDate = trackInfo.suggested_next_meeting_date ?? '';
          }
          // Graveyard emptied (last restore) → drop back to the live list.
          if (this.showDeleted && this.deletedCount === 0) {
            this.showDeleted = false;
            this.loadMeetings();
            return;
          }
        } else {
          this.loadError = res.error ?? 'Failed to load meetings.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load meetings. Check your connection.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  onTrackDeleted(): void {
    this.showSettings = false;
    this.router.navigate(['/team-meetings']);
  }

  /** "Phil Dodds" → "PD" for the latest-change preview line. */
  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  }

  // ── Deleted meetings (graveyard) view — leaders/admins, transient ────────────
  showDeleted  = false;
  deletedCount = 0;
  restoringId: string | null = null;

  toggleShowDeleted(): void {
    this.showDeleted = !this.showDeleted;
    this.loadMeetings();
  }

  restoreMeeting(m: TeamMeetingListItem): void {
    if (this.restoringId) { return; }
    this.restoringId = m.id;
    this.cdr.markForCheck();
    this.svc.restoreMeeting(m.id).subscribe({
      next: res => {
        this.restoringId = null;
        if (res.success) { this.loadMeetings(); }
        else { this.loadError = res.error ?? 'Failed to restore the meeting.'; this.cdr.markForCheck(); }
      },
      error: () => { this.restoringId = null; this.loadError = 'Failed to restore the meeting.'; this.cdr.markForCheck(); }
    });
  }

  openMeeting(id: string): void {
    this.router.navigate(['/team-meetings', id]);
  }

  openNewMeeting(): void {
    this.initForm();
    this.saveError   = '';
    this.showNewPanel = true;
  }

  closeNewPanel(): void {
    if (this.saving) return;
    this.showNewPanel   = false;
    this.editingMeeting = null;
  }

  openEditMeeting(m: TeamMeetingListItem): void {
    this.editingMeeting = m;
    this.saveError      = '';
    this.newMeetingForm = this.fb.group({
      title:        [m.title, Validators.required],
      meeting_date: [m.meeting_date, Validators.required]
    });
    this.showNewPanel = true;
  }

  deleteMeeting(m: TeamMeetingListItem): void {
    this.deletingId      = m.id;
    this.confirmDeleteId = null;
    this.cdr.markForCheck();
    this.svc.deleteMeeting(m.id).subscribe({
      next: res => {
        this.deletingId = null;
        if (res.success) {
          this.meetings = this.meetings.filter(x => x.id !== m.id);
          // Refresh the cadence-suggested date — it was computed before this
          // deletion and would otherwise anchor on the deleted meeting.
          this.loadMeetings();
        }
        this.cdr.markForCheck();
      },
      error: () => { this.deletingId = null; this.cdr.markForCheck(); }
    });
  }

  saveNewMeeting(): void {
    if (this.newMeetingForm.invalid || this.saving) return;
    const { title, meeting_date } = this.newMeetingForm.value as { title: string; meeting_date: string };

    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    if (this.editingMeeting) {
      const targetId = this.editingMeeting.id;
      this.svc.updateMeeting(targetId, title, meeting_date).subscribe({
        next: res => {
          this.saving = false;
          if (res.success && res.data) {
            this.meetings = this.meetings.map(m =>
              m.id === targetId
                ? { ...m, title: res.data!.title, meeting_date: res.data!.meeting_date, updated_at: res.data!.updated_at }
                : m
            );
            this.showNewPanel   = false;
            this.editingMeeting = null;
          } else {
            this.saveError = res.error ?? 'Failed to save changes.';
          }
          this.cdr.markForCheck();
        },
        error: err => {
          this.saving    = false;
          this.saveError = err?.error ?? 'Unable to save changes. Check your connection.';
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.svc.createMeeting(this.trackId, title, meeting_date).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.showNewPanel = false;
          this.router.navigate(['/team-meetings', res.data.id]);
        } else {
          this.saveError = res.error ?? 'Failed to create meeting.';
          this.cdr.markForCheck();
        }
      },
      error: err => {
        this.saving    = false;
        this.saveError = err?.error ?? 'Unable to create meeting. Check your connection.';
        this.cdr.markForCheck();
      }
    });
  }
}
