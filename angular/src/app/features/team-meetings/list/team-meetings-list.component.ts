// team-meetings-list.component.ts — Pathways OI Trust
// Team Meetings list screen (D-490 Step 3).
// Route: /team-meetings — Admin-only.
// Row tap → navigate to /team-meetings/:id (full-screen prep/run; CC-002 deviation from S-018).
// "+ New Meeting" → right panel (S-016 create panel, S-017 modal scrim).

import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { RouterModule, Router }  from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule }           from '@ionic/angular';
import { TeamMeetingsService }   from '../team-meetings.service';
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IonicModule],
  template: `
    <!-- S-001: visible context on every surface -->
    <div class="tm-shell">
      <div class="tm-header">
        <div>
          <h1 class="tm-title">Team Meetings</h1>
          <p class="tm-subtitle">Product Ops meeting prep and run notes — Admin only.</p>
        </div>
        <button class="tm-btn-primary" (click)="openNewMeeting()" type="button">
          + New Meeting
        </button>
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
        <div class="tm-list-header">
          <span class="tm-col-title">Meeting Title</span>
          <span class="tm-col-date">Meeting Date</span>
          <span class="tm-col-updated">Last Updated</span>
          <span></span>
        </div>
        <!-- D-308 / S-005: full-row tap navigates to meeting prep/run screen -->
        <div *ngFor="let m of meetings"
             class="tm-row"
             role="button"
             tabindex="0"
             (click)="confirmDeleteId !== m.id && openMeeting(m.id)"
             (keydown.enter)="confirmDeleteId !== m.id && openMeeting(m.id)">
          <span class="tm-col-title tm-meeting-name">{{ m.title }}</span>
          <span class="tm-col-date">{{ m.meeting_date | date:'MMM d, y' }}</span>
          <span class="tm-col-updated tm-muted">{{ m.updated_at | date:'MMM d, y' }}</span>
          <!-- Inline delete — confirm before executing -->
          <span (click)="$event.stopPropagation()">
            <ng-container *ngIf="confirmDeleteId !== m.id">
              <button class="tm-delete-btn"
                      type="button"
                      [disabled]="deletingId === m.id"
                      title="Delete meeting"
                      (click)="confirmDeleteId = m.id">
                🗑
              </button>
            </ng-container>
            <span *ngIf="confirmDeleteId === m.id" class="tm-delete-confirm">
              Delete?
              <button class="tm-delete-confirm-btn" type="button" (click)="deleteMeeting(m)">Yes</button>
              <button class="tm-delete-cancel-btn" type="button" (click)="confirmDeleteId = null">Cancel</button>
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- New Meeting creation panel — S-016 (right panel), S-017 (modal scrim) -->
    <div *ngIf="showNewPanel" class="tm-scrim" (click)="closeNewPanel()"></div>
    <div *ngIf="showNewPanel" class="tm-panel">
      <div class="tm-panel-header">
        <span class="tm-panel-title">New Meeting</span>
        <button class="tm-close-btn" (click)="closeNewPanel()" type="button" aria-label="Close">×</button>
      </div>

      <form [formGroup]="newMeetingForm" (ngSubmit)="saveNewMeeting()" class="tm-panel-body">
        <div class="tm-field">
          <label class="tm-label">Meeting Title</label>
          <input class="tm-input"
                 formControlName="title"
                 type="text"
                 placeholder="Meeting title">
          <span *ngIf="newMeetingForm.get('title')?.invalid && newMeetingForm.get('title')?.touched"
                class="tm-field-error">Title is required.</span>
        </div>

        <div class="tm-field">
          <label class="tm-label">Meeting Date</label>
          <input class="tm-input"
                 formControlName="meeting_date"
                 type="date">
        </div>

        <div *ngIf="saveError" class="tm-form-error">{{ saveError }}</div>

        <div class="tm-panel-actions">
          <button class="tm-btn-ghost" (click)="closeNewPanel()" type="button">Cancel</button>
          <button class="tm-btn-primary"
                  type="submit"
                  [disabled]="saving || newMeetingForm.invalid">
            {{ saving ? 'Creating…' : 'Create Meeting' }}
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
      grid-template-columns: 1fr 140px 140px 40px;
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
    .tm-meeting-name { font: 500 14px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); }
    .tm-muted { color: #757575; font-size: 13px; }
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

  showNewPanel    = false;
  saving          = false;
  saveError       = '';
  confirmDeleteId: string | null = null;
  deletingId:      string | null = null;

  newMeetingForm!: FormGroup;

  constructor(
    private readonly svc: TeamMeetingsService,
    private readonly fb:  FormBuilder,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMeetings();
  }

  private initForm(): void {
    const monday = getMondayOfCurrentWeek();
    this.newMeetingForm = this.fb.group({
      title:        [`Product Ops Prep — Week of ${formatMonday(monday)}`, Validators.required],
      meeting_date: [todayIso(), Validators.required]
    });
  }

  loadMeetings(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listMeetings().subscribe({
      next: res => {
        if (res.success) {
          this.meetings = res.data ?? [];
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
    this.showNewPanel = false;
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

    this.svc.createMeeting(title, meeting_date).subscribe({
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
