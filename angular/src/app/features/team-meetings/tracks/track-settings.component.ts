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
  TrackDetail, CatalogSection, InviteReport, RefPanelPersonType, PERSON_TYPE_LABELS
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

        <!-- Reference panel person type -->
        <div class="ts-block">
          <label class="ts-label">Initiative Reference Panel — People Type</label>
          <p class="ts-hint">Groups the reference panel (Initiatives and Gates) by this role. Remembered for all meetings in this series.</p>
          <div class="ts-radio-row">
            <label *ngFor="let pt of personTypes" class="ts-radio">
              <input type="radio" name="ptype" [value]="pt"
                     [checked]="track.ref_panel_person_type === pt"
                     [disabled]="!track.is_leader"
                     (change)="setPersonType(pt)">
              {{ personTypeLabels[pt] }}
            </label>
          </div>
        </div>

        <!-- Members -->
        <div class="ts-block">
          <label class="ts-label">Members ({{ track.members.length }})</label>
          <div *ngFor="let m of track.members" class="ts-member-row">
            <span class="ts-member-name">{{ m.display_name }}</span>
            <span *ngIf="m.is_leader" class="ts-leader-chip">Leader</span>
            <span class="ts-member-actions">
              <button *ngIf="track.is_leader" class="ts-mini-btn" type="button"
                      (click)="toggleLeader(m.user_id, !m.is_leader)">
                {{ m.is_leader ? 'Remove leader' : 'Make leader' }}
              </button>
              <button *ngIf="track.is_leader || m.user_id === currentUserId"
                      class="ts-mini-btn ts-danger" type="button"
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
          <p class="ts-hint">Applied to new meetings in this series, in this order. Existing meetings are unchanged.</p>
          <div *ngFor="let s of track.sections; let i = index" class="ts-section-row">
            <span class="ts-section-bar" [style.background]="s.bar_color"></span>
            <span class="ts-section-title">{{ s.title }}</span>
            <span *ngIf="track.is_leader" class="ts-section-actions">
              <button class="ts-icon-btn" type="button" [disabled]="i === 0" title="Move up"
                      (click)="move(i, -1)">↑</button>
              <button class="ts-icon-btn" type="button" [disabled]="i === track.sections.length - 1" title="Move down"
                      (click)="move(i, 1)">↓</button>
              <button class="ts-icon-btn ts-danger" type="button" title="Remove from series"
                      (click)="removeSection(s.id)">×</button>
            </span>
          </div>

          <div *ngIf="track.is_leader" class="ts-add-section">
            <select class="ts-select" [(ngModel)]="selectedCatalogId">
              <option value="">Add from shared list…</option>
              <option *ngFor="let c of availableCatalog" [value]="c.id">{{ c.title }}</option>
            </select>
            <button class="ts-mini-primary" type="button" [disabled]="!selectedCatalogId"
                    (click)="addCatalogSection()">Add</button>
          </div>
          <div *ngIf="track.is_leader" class="ts-add-section">
            <input class="ts-input" type="text" [(ngModel)]="customTitle" placeholder="Or create a custom section title…">
            <button class="ts-mini-primary" type="button" [disabled]="!customTitle.trim()"
                    (click)="addCustomSection()">Create</button>
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
    .ts-invite { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
    .ts-invite-report { font: 12px Roboto, sans-serif; color: #2E7D32; display: flex; flex-direction: column; gap: 2px; }
    .ts-invite-notfound { color: #D32F2F; }
    .ts-section-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #F5F5F5; }
    .ts-section-bar { width: 4px; height: 18px; border-radius: 2px; flex-shrink: 0; }
    .ts-section-title { font: 13px Roboto, sans-serif; flex: 1; }
    .ts-section-actions { display: flex; gap: 2px; }
    .ts-icon-btn { background: none; border: none; color: #757575; cursor: pointer; font-size: 14px; padding: 2px 5px; }
    .ts-icon-btn:disabled { opacity: 0.3; cursor: default; }
    .ts-icon-btn.ts-danger { color: #D32F2F; }
    .ts-add-section { display: flex; gap: 8px; margin-top: 6px; }
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

  readonly personTypes: RefPanelPersonType[] = ['dcs', 'dol', 'epo'];
  readonly personTypeLabels = PERSON_TYPE_LABELS;

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

  setPersonType(pt: RefPanelPersonType): void {
    if (!this.track || this.track.ref_panel_person_type === pt) return;
    this.svc.updateTrack(this.trackId, { ref_panel_person_type: pt }).subscribe({
      next: res => {
        if (res.success && this.track) {
          this.track.ref_panel_person_type = pt;
          this.changed.emit();
        }
        this.cdr.markForCheck();
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
    this.svc.removeTrackMember(this.trackId, userId).subscribe({
      next: res => {
        if (res.success) {
          if (userId === this.currentUserId) { this.deleted.emit(); return; }
          this.load();
        }
      }
    });
  }

  toggleLeader(userId: string, isLeader: boolean): void {
    this.svc.setTrackLeader(this.trackId, userId, isLeader).subscribe({
      next: res => { if (res.success) this.load(); }
    });
  }

  move(index: number, dir: -1 | 1): void {
    if (!this.track) return;
    const arr = [...this.track.sections];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    this.track.sections = arr;
    this.cdr.markForCheck();
    this.svc.reorderTrackSections(this.trackId, arr.map(s => s.id)).subscribe();
  }

  addCatalogSection(): void {
    if (!this.selectedCatalogId) return;
    this.svc.addTrackSection(this.trackId, { catalog_id: this.selectedCatalogId, ...(this.meetingId ? { meeting_id: this.meetingId } : {}) }).subscribe({
      next: res => {
        if (res.success) { this.selectedCatalogId = ''; this.load(); }
        else { this.loadError = res.error ?? 'Failed to add section.'; this.cdr.markForCheck(); }
      }
    });
  }

  addCustomSection(): void {
    const title = this.customTitle.trim();
    if (!title) return;
    this.svc.addTrackSection(this.trackId, { title, ...(this.meetingId ? { meeting_id: this.meetingId } : {}) }).subscribe({
      next: res => {
        if (res.success) { this.customTitle = ''; this.load(); }
        else { this.loadError = res.error ?? 'Failed to create section.'; this.cdr.markForCheck(); }
      }
    });
  }

  removeSection(trackSectionId: string): void {
    this.svc.removeTrackSection(this.trackId, trackSectionId, this.meetingId).subscribe({
      next: res => { if (res.success) this.load(); }
    });
  }

  deleteTrack(): void {
    this.confirmDelete = false;
    this.svc.deleteTrack(this.trackId).subscribe({
      next: res => { if (res.success) this.deleted.emit(); }
    });
  }
}
