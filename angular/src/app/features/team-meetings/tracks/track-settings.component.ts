// track-settings.component.ts — Pathways OI Trust
// Series settings slide-in panel. Rendered by the track meetings screen.
// Leaders: rename, public toggle, person type, invite members (Outlook format),
// remove members, grant/revoke leader, section template (add catalog/custom,
// remove, reorder), copy share URL, delete series. Members: read-only view + leave.

import {
  Component, Input, Output, EventEmitter, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { TeamMeetingsService } from '../team-meetings.service';
import {
  TrackDetail, TrackSection, CatalogSection, InviteReport, MeetingCadence
} from '../../../core/types/team-meetings';

@Component({
  selector:        'app-track-settings',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ts-scrim" (click)="close.emit()"></div>
    <div class="ts-panel">
      <div class="ts-panel-header">
        <span class="ts-panel-title">Series Settings</span>
        <button class="ts-close-btn" (click)="close.emit()" type="button" aria-label="Close">×</button>
      </div>

      <div *ngIf="loading" class="ts-loading">Loading…</div>
      <div *ngIf="loadError" class="ts-error">{{ loadError }}</div>

      <div *ngIf="track && !loading" class="ts-body">

        <!-- Name -->
        <div class="ts-block">
          <label class="ts-label">Series Name</label>
          <div class="ts-inline">
            <input class="ts-input" type="text" [(ngModel)]="editName" [disabled]="!track.is_leader">
            <button *ngIf="track.is_leader && editName.trim() !== track.track_name"
                    class="ts-mini-primary" type="button" (click)="saveName()">Save</button>
          </div>
        </div>

        <!-- Share URL -->
        <div class="ts-block">
          <label class="ts-label">Share Link</label>
          <p class="ts-hint">Opens the latest meeting in this series. Paste into Outlook invites.</p>
          <div class="ts-inline">
            <input class="ts-input ts-url" type="text" [value]="shareUrl" readonly>
            <button class="ts-mini-primary" type="button" (click)="copyUrl()">{{ copied ? 'Copied ✓' : 'Copy' }}</button>
          </div>
        </div>

        <!-- Visibility -->
        <div class="ts-block">
          <label class="ts-label-inline">
            <input type="checkbox" [checked]="track.is_public" [disabled]="!track.is_leader"
                   (change)="toggleVisibility()">
            Public — anyone can find and join this series
          </label>
        </div>

        <!-- Meeting cadence — drives the default date on "+ New Meeting" (suggestion only) -->
        <div class="ts-block">
          <label class="ts-label">Meeting Cadence</label>
          <p class="ts-hint">Suggests the date for the next meeting. You can always pick a different date.</p>
          <div class="ts-cadence-row">
            <select class="ts-select" [ngModel]="cadenceChoice" (ngModelChange)="onCadenceChoice($event)"
                    [disabled]="!track.is_leader">
              <option value="">None — default to today</option>
              <option value="interval-1">Every day</option>
              <option value="interval-7">Every 7 days</option>
              <option value="interval-14">Every 14 days</option>
              <option value="weekly">Weekly on…</option>
              <option value="biweekly">Bi-weekly on…</option>
              <option value="triweekly">Tri-weekly on…</option>
              <option value="monthly">Monthly on…</option>
            </select>
            <select *ngIf="cadenceNeedsDow" class="ts-select" [ngModel]="cadenceDow" (ngModelChange)="onCadenceDow($event)"
                    [disabled]="!track.is_leader">
              <option *ngFor="let d of weekdays; let i = index" [value]="i">{{ d }}</option>
            </select>
            <select *ngIf="cadenceChoice === 'monthly'" class="ts-select" [ngModel]="cadenceOccurrence" (ngModelChange)="onCadenceOccurrence($event)"
                    [disabled]="!track.is_leader">
              <option value="1">1st</option>
              <option value="2">2nd</option>
              <option value="3">3rd</option>
              <option value="4">4th</option>
              <option value="last">Last</option>
            </select>
          </div>
        </div>

        <!-- Members -->
        <div class="ts-block">
          <label class="ts-label">Members ({{ track.members.length }})</label>
          <p *ngIf="track.is_leader" class="ts-hint">Presenter section = a section in the meeting for that person's action items, escalations, blockers, and accomplishments. Initiatives added from the reference panel land in the presenter's section automatically.</p>
          <button *ngIf="track.is_leader" class="ts-mini-primary" type="button"
                  [disabled]="addingAllPresenters"
                  (click)="addPresenterSectionsForAll()">
            {{ addingAllPresenters ? 'Adding…' : '+ Presenter sections for all participants' }}
          </button>
          <div *ngFor="let m of track.members" class="ts-member-row">
            <span class="ts-member-name">{{ m.display_name }}</span>
            <span *ngIf="m.is_leader" class="ts-leader-chip">Leader</span>
            <label *ngIf="track.is_leader" class="ts-presenter-toggle" title="Presenter section in meetings">
              <input type="checkbox"
                     [checked]="hasPresenterSection(m.user_id)"
                     [disabled]="presenterBusy.has(m.user_id)"
                     (change)="togglePresenterSection(m.user_id, $event)">
              {{ presenterBusy.has(m.user_id) ? 'Saving…' : 'Presenter' }}
            </label>
            <span class="ts-member-actions">
              <button *ngIf="track.is_leader" class="ts-mini-btn" type="button"
                      [disabled]="memberBusy.has(m.user_id)"
                      (click)="toggleLeader(m.user_id, !m.is_leader)">
                {{ memberBusy.has(m.user_id) ? 'Saving…' : (m.is_leader ? 'Remove leader' : 'Make leader') }}
              </button>
              <button *ngIf="track.is_leader || m.user_id === currentUserId"
                      class="ts-mini-btn ts-danger" type="button"
                      [disabled]="memberBusy.has(m.user_id)"
                      (click)="removeMember(m.user_id)">
                {{ m.user_id === currentUserId ? 'Leave' : 'Remove' }}
              </button>
            </span>
          </div>

          <!-- Invite -->
          <div *ngIf="track.is_leader" class="ts-invite">
            <label class="ts-label">Invite Members</label>
            <p class="ts-hint">Single email, or Outlook format: "Name &lt;email&gt;; Name &lt;email&gt;". Invitees become participants immediately — no email is sent.</p>
            <textarea class="ts-textarea" rows="2" [(ngModel)]="inviteText"
                      placeholder="cbickford@triarqhealth.com; Julie Lundberg <jlundberg@triarqhealth.com>"></textarea>
            <button class="ts-mini-primary" type="button" [disabled]="inviting || !inviteText.trim()"
                    (click)="invite()">
              {{ inviting ? 'Inviting…' : 'Invite' }}
            </button>
            <div *ngIf="inviteReport" class="ts-invite-report">
              <div *ngIf="inviteReport.added.length">✓ Added: {{ joinNames(inviteReport.added) }}</div>
              <div *ngIf="inviteReport.already.length">Already members: {{ joinNames(inviteReport.already) }}</div>
              <div *ngIf="inviteReport.not_found.length" class="ts-invite-notfound">
                Not found (no account): {{ inviteReport.not_found.join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sections -->
        <div class="ts-block">
          <label class="ts-label">Sections</label>
          <p class="ts-hint">Applied to new meetings in this series, in this order — drag a section to reorder. Existing meetings are unchanged.</p>
          <div *ngFor="let s of track.sections" class="ts-section-row"
               [class.ts-section-dragging]="draggingSectionId === s.id"
               [class.ts-section-dragover]="dragOverSectionId === s.id"
               [draggable]="track.is_leader && editingSectionId !== s.id"
               (dragstart)="onSectionDragStart($event, s)"
               (dragend)="onSectionDragEnd()"
               (dragover)="onSectionDragOver($event, s)"
               (dragleave)="dragOverSectionId === s.id && (dragOverSectionId = null)"
               (drop)="onSectionDrop($event, s)">
            <span *ngIf="track.is_leader" class="ts-section-grip" aria-hidden="true" title="Drag to reorder">⋮⋮</span>
            <span class="ts-section-bar" [style.background]="s.bar_color"></span>
            <ng-container *ngIf="editingSectionId !== s.id">
              <span class="ts-section-text">
                <span class="ts-section-title">{{ s.title }}</span>
                <span *ngIf="s.sub_label" class="ts-section-sub">{{ s.sub_label }}</span>
              </span>
              <span *ngIf="track.is_leader" class="ts-section-actions">
                <button class="ts-icon-btn" type="button" title="Edit title and description"
                        (click)="startEditSection(s)">✎</button>
                <button class="ts-icon-btn ts-danger" type="button" title="Remove from series"
                        [disabled]="sectionBusy"
                        (click)="removeSection(s.id)">×</button>
              </span>
            </ng-container>
            <ng-container *ngIf="editingSectionId === s.id">
              <span class="ts-section-edit">
                <input class="ts-input" [(ngModel)]="sectionTitleDraft" placeholder="Section title">
                <input class="ts-input" [(ngModel)]="sectionSubDraft" placeholder="Description (optional)">
              </span>
              <span class="ts-section-actions">
                <button class="ts-mini-primary" type="button" [disabled]="!sectionTitleDraft.trim()"
                        (click)="saveSectionEdit(s)">Save</button>
                <button class="ts-mini-btn" type="button" (click)="editingSectionId = null">Cancel</button>
              </span>
            </ng-container>
          </div>

          <div *ngIf="track.is_leader" class="ts-add-section">
            <select class="ts-select" [(ngModel)]="selectedCatalogId">
              <option value="">Add from shared list…</option>
              <option *ngFor="let c of availableCatalog" [value]="c.id">{{ c.title }}</option>
            </select>
            <button class="ts-mini-primary" type="button" [disabled]="!selectedCatalogId || sectionBusy"
                    (click)="addCatalogSection()">{{ sectionBusy ? 'Saving…' : 'Add' }}</button>
          </div>
          <div *ngIf="track.is_leader" class="ts-add-section">
            <input class="ts-input" type="text" [(ngModel)]="customTitle" placeholder="Or create a custom section title…">
            <button class="ts-mini-primary" type="button" [disabled]="!customTitle.trim() || sectionBusy"
                    (click)="addCustomSection()">{{ sectionBusy ? 'Saving…' : 'Create' }}</button>
          </div>
        </div>

        <!-- Danger zone -->
        <div *ngIf="track.is_leader" class="ts-block ts-danger-zone">
          <label class="ts-label">Delete Series</label>
          <p class="ts-hint">Hides the series and its meetings from all members. Admins can restore it.</p>
          <button *ngIf="!confirmDelete" class="ts-mini-btn ts-danger" type="button"
                  (click)="confirmDelete = true">Delete series</button>
          <span *ngIf="confirmDelete" class="ts-confirm">
            Delete "{{ track.track_name }}"?
            <button class="ts-confirm-btn" type="button" (click)="deleteTrack()">Yes, delete</button>
            <button class="ts-cancel-btn" type="button" (click)="confirmDelete = false">Cancel</button>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ts-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; }
    .ts-panel { position: fixed; top: 0; right: 0; width: 480px; max-width: 100vw; height: 100vh; background: #fff; box-shadow: -4px 0 16px rgba(0,0,0,0.12); z-index: 101; display: flex; flex-direction: column; border-radius: 10px 0 0 10px; }
    .ts-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #E0E0E0; flex-shrink: 0; }
    .ts-panel-title { font: 600 16px Roboto, sans-serif; }
    .ts-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #757575; }
    .ts-loading { padding: 24px 20px; color: #757575; font: 14px Roboto, sans-serif; }
    .ts-error { margin: 16px 20px; padding: 8px 12px; background: #FFF3F3; border-left: 3px solid #D32F2F; font-size: 13px; border-radius: 4px; }
    .ts-body { padding: 16px 20px 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    .ts-block { display: flex; flex-direction: column; gap: 6px; }
    .ts-label { font: 600 13px Roboto, sans-serif; color: #1A1A1A; }
    .ts-label-inline { display: flex; align-items: center; gap: 8px; font: 13px Roboto, sans-serif; cursor: pointer; }
    .ts-hint { font: italic 11px/1.4 Roboto, sans-serif; color: #757575; margin: 0; }
    .ts-inline { display: flex; gap: 8px; align-items: center; }
    .ts-input { flex: 1; border: 1px solid #BDBDBD; border-radius: 5px; padding: 7px 10px; font: 13px Roboto, sans-serif; outline: none; }
    .ts-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .ts-input:disabled { background: #FAFAFA; color: #757575; }
    .ts-url { font-size: 11px; color: #5A5A5A; }
    .ts-textarea { border: 1px solid #BDBDBD; border-radius: 5px; padding: 7px 10px; font: 13px Roboto, sans-serif; outline: none; resize: vertical; }
    .ts-select { border: 1px solid #BDBDBD; border-radius: 5px; padding: 7px 10px; font: 13px Roboto, sans-serif; outline: none; flex: 1; background: #fff; }
    .ts-mini-primary { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 6px 14px; font: 500 12px Roboto, sans-serif; cursor: pointer; white-space: nowrap; align-self: flex-start; }
    .ts-mini-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .ts-mini-btn { background: none; border: 1px solid #BDBDBD; border-radius: 5px; color: #5A5A5A; padding: 3px 10px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .ts-mini-btn.ts-danger { border-color: #D32F2F; color: #D32F2F; }
    .ts-radio-row { display: flex; gap: 16px; }
    .ts-radio { display: flex; align-items: center; gap: 6px; font: 13px Roboto, sans-serif; cursor: pointer; }
    .ts-member-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; }
    .ts-member-name { font: 13px Roboto, sans-serif; color: #1A1A1A; flex: 1; }
    .ts-leader-chip { background: #E3F0F7; color: #257099; border-radius: 999px; padding: 1px 8px; font: 500 10px Roboto, sans-serif; }
    .ts-member-actions { display: flex; gap: 6px; }
    .ts-presenter-toggle { display: flex; align-items: center; gap: 4px; font: 11px Roboto, sans-serif; color: #5A5A5A; cursor: pointer; white-space: nowrap; }
    .ts-invite { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
    .ts-invite-report { font: 12px Roboto, sans-serif; color: #2E7D32; display: flex; flex-direction: column; gap: 2px; }
    .ts-invite-notfound { color: #D32F2F; }
    .ts-section-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; }
    .ts-section-row[draggable="true"] { cursor: grab; }
    .ts-section-grip { color: #C0C0C0; font-size: 11px; letter-spacing: -2px; flex-shrink: 0; }
    .ts-section-row:hover .ts-section-grip { color: #9E9E9E; }
    .ts-section-dragging { opacity: 0.45; }
    .ts-section-dragover { outline: 2px dashed var(--triarq-color-primary, #257099); outline-offset: -2px; }
    .ts-section-bar { width: 4px; height: 18px; border-radius: 2px; flex-shrink: 0; }
    .ts-section-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .ts-section-title { font: 13px Roboto, sans-serif; }
    .ts-section-sub { font: italic 11px Roboto, sans-serif; color: #757575; }
    .ts-section-edit { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .ts-section-actions { display: flex; gap: 2px; }
    .ts-icon-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 14px; padding: 2px 5px; }
    .ts-icon-btn:disabled { opacity: 0.3; cursor: default; }
    .ts-icon-btn.ts-danger { color: #D32F2F; }
    .ts-add-section { display: flex; gap: 8px; margin-top: 6px; }
    .ts-cadence-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .ts-danger-zone { border-top: 1px solid #F0F0F0; padding-top: 14px; }
    .ts-confirm { display: flex; align-items: center; gap: 8px; font: 12px Roboto, sans-serif; color: #D32F2F; flex-wrap: wrap; }
    .ts-confirm-btn { background: #D32F2F; color: #fff; border: none; border-radius: 3px; padding: 3px 10px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .ts-cancel-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 11px; }
  `]
})
export class TrackSettingsComponent implements OnInit {
  @Input({ required: true }) trackId!: string;
  @Input() currentUserId = '';
  // When set, section add/remove also applies to this live meeting (leader mid-meeting edits).
  @Input() meetingId?: string;
  @Output() close   = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();   // parent refreshes header/name
  @Output() deleted = new EventEmitter<void>();   // series soft-deleted → navigate away

  track: TrackDetail | null = null;
  catalog: CatalogSection[] = [];
  loading   = false;
  loadError = '';

  editName          = '';
  copied            = false;
  inviteText        = '';
  inviting          = false;
  inviteReport: InviteReport | null = null;
  selectedCatalogId = '';
  customTitle       = '';
  confirmDelete     = false;

  // Per-section title/description editing (leaders).
  editingSectionId: string | null = null;
  sectionTitleDraft = '';
  sectionSubDraft   = '';

  // Meeting cadence controls.
  readonly weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  cadenceChoice     = '';       // '' | 'interval-1' | 'interval-7' | 'interval-14' | 'weekly' | 'biweekly' | 'triweekly' | 'monthly'
  cadenceDow        = 1;
  cadenceOccurrence: '1' | '2' | '3' | '4' | 'last' = '1';

  get cadenceNeedsDow(): boolean {
    return ['weekly', 'biweekly', 'triweekly', 'monthly'].includes(this.cadenceChoice);
  }

  constructor(
    private readonly svc: TeamMeetingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
    this.svc.listSectionCatalog().subscribe({
      next: res => { if (res.success) { this.catalog = res.data ?? []; this.cdr.markForCheck(); } }
    });
  }

  get shareUrl(): string {
    // Relative-route safe: build from current origin + base href at runtime.
    const base = document.baseURI.replace(/\/$/, '');
    return `${base}/team-meetings/track/${this.trackId}/latest`;
  }

  get availableCatalog(): CatalogSection[] {
    const usedKeys = new Set((this.track?.sections ?? []).map(s => s.section_key));
    return this.catalog.filter(c => !usedKeys.has(c.section_key));
  }

  joinNames(list: { display_name: string }[]): string {
    return list.map(x => x.display_name).join(', ');
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.getTrack(this.trackId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.track    = res.data;
          this.editName = res.data.track_name;
          this.seedCadenceControls(res.data.meeting_cadence);
        } else {
          this.loadError = res.error ?? 'Failed to load series settings.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load series settings.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  saveName(): void {
    const name = this.editName.trim();
    if (!name || !this.track) return;
    this.svc.updateTrack(this.trackId, { track_name: name }).subscribe({
      next: res => {
        if (res.success && this.track) {
          this.track.track_name = name;
          this.changed.emit();
        }
        this.cdr.markForCheck();
      }
    });
  }

  copyUrl(): void {
    navigator.clipboard?.writeText(this.shareUrl).then(() => {
      this.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => { this.copied = false; this.cdr.markForCheck(); }, 2000);
    });
  }

  toggleVisibility(): void {
    if (!this.track) return;
    const next = !this.track.is_public;
    this.svc.updateTrack(this.trackId, { is_public: next }).subscribe({
      next: res => {
        if (res.success && this.track) this.track.is_public = next;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Presenter sections ───────────────────────────────────────────────────────
  addingAllPresenters = false;
  // In-flight guards — a click disables the control until the server answers,
  // so slow responses can't collect duplicate clicks.
  presenterBusy = new Set<string>();
  memberBusy    = new Set<string>();
  sectionBusy   = false;

  hasPresenterSection(userId: string): boolean {
    return !!this.track?.sections.some(s => s.presenter_user_id === userId);
  }

  togglePresenterSection(userId: string, event: Event): void {
    if (this.presenterBusy.has(userId)) return;
    const enabled = (event.target as HTMLInputElement).checked;
    this.presenterBusy.add(userId);
    this.cdr.markForCheck();
    this.svc.setPresenterSection(this.trackId, userId, enabled, this.meetingId).subscribe({
      next: res => {
        this.presenterBusy.delete(userId);
        if (res.success) { this.load(); this.changed.emit(); }
        else { this.loadError = res.error ?? 'Failed to update presenter section.'; }
        this.cdr.markForCheck();
      },
      error: () => { this.presenterBusy.delete(userId); this.cdr.markForCheck(); }
    });
  }

  addPresenterSectionsForAll(): void {
    if (this.addingAllPresenters) return;
    this.addingAllPresenters = true;
    this.cdr.markForCheck();
    this.svc.addPresenterSectionsAll(this.trackId, this.meetingId).subscribe({
      next: res => {
        this.addingAllPresenters = false;
        if (res.success) { this.load(); this.changed.emit(); }
        else { this.loadError = res.error ?? 'Failed to add presenter sections.'; }
        this.cdr.markForCheck();
      },
      error: () => { this.addingAllPresenters = false; this.cdr.markForCheck(); }
    });
  }

  // ── Meeting cadence ──────────────────────────────────────────────────────────
  private seedCadenceControls(cadence: MeetingCadence | null): void {
    if (!cadence) { this.cadenceChoice = ''; return; }
    if (cadence.type === 'interval') {
      this.cadenceChoice = `interval-${cadence.interval_days}`;
    } else {
      this.cadenceChoice = cadence.type;
      this.cadenceDow    = cadence.day_of_week ?? 1;
      if (cadence.type === 'monthly') this.cadenceOccurrence = cadence.month_occurrence ?? '1';
    }
  }

  private buildCadence(): MeetingCadence | null {
    if (!this.cadenceChoice) return null;
    if (this.cadenceChoice.startsWith('interval-')) {
      return { type: 'interval', interval_days: parseInt(this.cadenceChoice.split('-')[1], 10) as 1 | 7 | 14 };
    }
    const base: MeetingCadence = {
      type: this.cadenceChoice as MeetingCadence['type'],
      day_of_week: Number(this.cadenceDow)
    };
    if (base.type === 'monthly') base.month_occurrence = this.cadenceOccurrence;
    return base;
  }

  private saveCadence(): void {
    this.svc.updateTrack(this.trackId, { meeting_cadence: this.buildCadence() }).subscribe({
      next: res => {
        if (res.success) this.changed.emit();
        else { this.loadError = res.error ?? 'Failed to save cadence.'; }
        this.cdr.markForCheck();
      }
    });
  }

  onCadenceChoice(v: string): void      { this.cadenceChoice = v; this.saveCadence(); }
  onCadenceDow(v: string | number): void { this.cadenceDow = Number(v); this.saveCadence(); }
  onCadenceOccurrence(v: '1' | '2' | '3' | '4' | 'last'): void { this.cadenceOccurrence = v; this.saveCadence(); }

  startEditSection(s: { id: string; title: string; sub_label: string }): void {
    this.editingSectionId  = s.id;
    this.sectionTitleDraft = s.title;
    this.sectionSubDraft   = s.sub_label;
    this.cdr.markForCheck();
  }

  saveSectionEdit(s: { id: string }): void {
    const title = this.sectionTitleDraft.trim();
    if (!title) return;
    this.svc.updateTrackSection(this.trackId, s.id, { title, sub_label: this.sectionSubDraft }, this.meetingId).subscribe({
      next: res => {
        if (res.success) {
          this.editingSectionId = null;
          this.load();
          this.changed.emit();
        } else {
          this.loadError = res.error ?? 'Failed to save section.';
          this.cdr.markForCheck();
        }
      }
    });
  }

  invite(): void {
    if (!this.inviteText.trim() || this.inviting) return;
    this.inviting     = true;
    this.inviteReport = null;
    this.cdr.markForCheck();
    this.svc.addTrackMembers(this.trackId, this.inviteText).subscribe({
      next: res => {
        this.inviting = false;
        if (res.success && res.data) {
          this.inviteReport = res.data;
          this.inviteText   = '';
          this.load();
        } else {
          this.loadError = res.error ?? 'Invite failed.';
        }
        this.cdr.markForCheck();
      },
      error: () => { this.inviting = false; this.cdr.markForCheck(); }
    });
  }

  removeMember(userId: string): void {
    if (this.memberBusy.has(userId)) return;
    this.memberBusy.add(userId);
    this.cdr.markForCheck();
    this.svc.removeTrackMember(this.trackId, userId).subscribe({
      next: res => {
        this.memberBusy.delete(userId);
        if (res.success) {
          if (userId === this.currentUserId) { this.deleted.emit(); return; }
          this.load();
        }
        this.cdr.markForCheck();
      },
      error: () => { this.memberBusy.delete(userId); this.cdr.markForCheck(); }
    });
  }

  toggleLeader(userId: string, isLeader: boolean): void {
    if (this.memberBusy.has(userId)) return;
    this.memberBusy.add(userId);
    this.cdr.markForCheck();
    this.svc.setTrackLeader(this.trackId, userId, isLeader).subscribe({
      next: res => {
        this.memberBusy.delete(userId);
        if (res.success) this.load();
        this.cdr.markForCheck();
      },
      error: () => { this.memberBusy.delete(userId); this.cdr.markForCheck(); }
    });
  }

  // ── Section reorder — drag & drop (replaced the ↑↓ arrows). Dropped section
  // takes the target's position, matching the meeting-screen drag semantics. ──
  draggingSectionId: string | null = null;
  dragOverSectionId: string | null = null;

  onSectionDragStart(event: DragEvent, s: TrackSection): void {
    this.draggingSectionId = s.id;
    event.dataTransfer?.setData('text/plain', s.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onSectionDragEnd(): void {
    this.draggingSectionId = null;
    this.dragOverSectionId = null;
    this.cdr.markForCheck();
  }

  onSectionDragOver(event: DragEvent, s: TrackSection): void {
    if (!this.draggingSectionId || s.id === this.draggingSectionId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this.dragOverSectionId !== s.id) {
      this.dragOverSectionId = s.id;
      this.cdr.markForCheck();
    }
  }

  onSectionDrop(event: DragEvent, target: TrackSection): void {
    event.preventDefault();
    const draggedId = this.draggingSectionId;
    this.onSectionDragEnd();
    if (!draggedId || draggedId === target.id || !this.track) return;

    const arr  = [...this.track.sections];
    const from = arr.findIndex(x => x.id === draggedId);
    const to   = arr.findIndex(x => x.id === target.id);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    this.track.sections = arr;
    this.cdr.markForCheck();
    this.svc.reorderTrackSections(this.trackId, arr.map(x => x.id)).subscribe();
  }

  addCatalogSection(): void {
    if (!this.selectedCatalogId || this.sectionBusy) return;
    this.sectionBusy = true;
    this.cdr.markForCheck();
    this.svc.addTrackSection(this.trackId, { catalog_id: this.selectedCatalogId, ...(this.meetingId ? { meeting_id: this.meetingId } : {}) }).subscribe({
      next: res => {
        this.sectionBusy = false;
        if (res.success) { this.selectedCatalogId = ''; this.load(); }
        else { this.loadError = res.error ?? 'Failed to add section.'; }
        this.cdr.markForCheck();
      },
      error: () => { this.sectionBusy = false; this.cdr.markForCheck(); }
    });
  }

  addCustomSection(): void {
    const title = this.customTitle.trim();
    if (!title || this.sectionBusy) return;
    this.sectionBusy = true;
    this.cdr.markForCheck();
    this.svc.addTrackSection(this.trackId, { title, ...(this.meetingId ? { meeting_id: this.meetingId } : {}) }).subscribe({
      next: res => {
        this.sectionBusy = false;
        if (res.success) { this.customTitle = ''; this.load(); }
        else { this.loadError = res.error ?? 'Failed to create section.'; }
        this.cdr.markForCheck();
      },
      error: () => { this.sectionBusy = false; this.cdr.markForCheck(); }
    });
  }

  removeSection(trackSectionId: string): void {
    if (this.sectionBusy) return;
    this.sectionBusy = true;
    this.cdr.markForCheck();
    this.svc.removeTrackSection(this.trackId, trackSectionId, this.meetingId).subscribe({
      next: res => {
        this.sectionBusy = false;
        if (res.success) this.load();
        this.cdr.markForCheck();
      },
      error: () => { this.sectionBusy = false; this.cdr.markForCheck(); }
    });
  }

  deleteTrack(): void {
    this.confirmDelete = false;
    this.svc.deleteTrack(this.trackId).subscribe({
      next: res => { if (res.success) this.deleted.emit(); }
    });
  }
}
