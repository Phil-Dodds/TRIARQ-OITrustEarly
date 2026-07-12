// dcs-reference-panel.component.ts — Pathways OI Trust
// Initiative Reference Panel (D-490 Step 5 + Tracks participant-aware redesign,
// session 2026-07-11).
//
// Two modes:
//   Participants-only (default ON): meeting participants (leaders + members)
//     with initiatives merged across all three roles (DCS/DOL/EPO).
//   Toggle OFF: participants stay pinned on top; DCS/DOL/EPO pills appear and
//     the chosen type's non-participant people append below a divider.
//
// Per-user memory (Option A, ScreenStateService): toggle, pill, and per-person
// expand/collapse are remembered per track and default the next meeting.
// Defaults when nothing saved: toggle ON, series person type, leaders collapsed,
// non-leader participants expanded, others collapsed.
//
// D-415/S-034 person row. D-419 gate-status dot colors.

import {
  Component, OnInit, OnChanges, OnDestroy, SimpleChanges,
  Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { TeamMeetingsService }   from '../team-meetings.service';
import { ScreenStateService, SCREEN_KEYS } from '../../../core/services/screen-state.service';
import {
  DcsInitiativeRef, RefPanelPerson, RefPanelPersonType, RefPanelTrackState
} from '../../../core/types/team-meetings';

// D-419 gate status → dot color mapping (reusing existing color semantics).
function gateStatusColor(status: string): string {
  switch (status) {
    case 'on_track':  return '#4CAF50';
    case 'at_risk':   return '#F2A620';
    case 'off_track': return '#D32F2F';
    case 'complete':  return '#257099';
    default:          return '#BDBDBD';
  }
}

function gateStatusLabel(status: string): string {
  switch (status) {
    case 'on_track':  return 'On Track';
    case 'at_risk':   return 'At Risk';
    case 'off_track': return 'Off Track';
    case 'complete':  return 'Complete';
    default:          return 'Not Started';
  }
}

function initials(name: string): string {
  return name.split(' ').map(p => p[0] || '').join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#257099','#534AB7','#E96127','#0071AF','#5A5A5A',
  '#F2A620','#4CAF50','#D32F2F','#795548','#607D8B'
];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const SAVE_DEBOUNCE_MS = 800;

@Component({
  selector:        'app-dcs-reference-panel',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  template: `
    <div class="drp-panel" [class.drp-collapsed]="collapsed">
      <!-- Panel header -->
      <div class="drp-header">
        <span class="drp-header-label">Initiative Reference</span>
        <button class="drp-collapse-btn"
                (click)="toggleCollapsed()"
                type="button"
                [attr.aria-label]="collapsed ? 'Expand reference panel' : 'Collapse reference panel'">
          {{ collapsed ? '▸' : '◂' }}
        </button>
      </div>

      <div *ngIf="!collapsed" class="drp-body">
        <!-- Participants-only toggle (remembered per user per series) -->
        <label class="drp-toggle-row">
          <input type="checkbox"
                 [checked]="participantsOnly"
                 (change)="toggleParticipantsOnly()">
          Show only initiatives for meeting participants
        </label>

        <!-- Person type pills — only when browsing beyond participants -->
        <div *ngIf="!participantsOnly" class="drp-type-row" role="radiogroup" aria-label="Additional people type">
          <button *ngFor="let pt of personTypeOptions"
                  type="button"
                  class="drp-type-pill"
                  [class.drp-type-pill-active]="personType === pt"
                  (click)="selectPersonType(pt)">
            {{ pt.toUpperCase() }}
          </button>
        </div>

        <!-- Loading skeleton — S-028 Context B -->
        <ng-container *ngIf="loading">
          <div *ngFor="let i of [1,2,3]" class="drp-skeleton-row"></div>
        </ng-container>

        <!-- Error -->
        <div *ngIf="loadError && !loading" class="drp-error">
          <span>⚠ {{ loadError }}</span>
          <button class="drp-link-btn" (click)="load()" type="button">Retry</button>
        </div>

        <ng-container *ngIf="!loading && !loadError">
          <!-- Participants -->
          <div *ngIf="participants.length === 0" class="drp-empty">
            No participants in this series yet.
          </div>
          <ng-container *ngFor="let person of participants">
            <ng-container *ngTemplateOutlet="personBlock; context: { person: person, isParticipant: true }"></ng-container>
          </ng-container>

          <!-- Others (toggle OFF) -->
          <ng-container *ngIf="!participantsOnly">
            <div class="drp-divider">Others — {{ personTypeLabel }}</div>
            <div *ngIf="others.length === 0" class="drp-empty">
              No additional {{ personTypeLabel }} users found.
            </div>
            <ng-container *ngFor="let person of others">
              <ng-container *ngTemplateOutlet="personBlock; context: { person: person, isParticipant: false }"></ng-container>
            </ng-container>
          </ng-container>
        </ng-container>
      </div>
    </div>

    <!-- Shared person row + initiative list -->
    <ng-template #personBlock let-person="person" let-isParticipant="isParticipant">
      <div class="drp-dcs-block">
        <div class="drp-dcs-row"
             role="button"
             tabindex="0"
             (click)="togglePerson(person.id)"
             (keydown.enter)="togglePerson(person.id)">
          <!-- S-034: avatar 32px -->
          <div class="drp-avatar"
               [style.background]="person.avatar_url ? 'transparent' : avatarColor(person.id)">
            <img *ngIf="person.avatar_url" [src]="person.avatar_url" class="drp-avatar-img" [alt]="person.display_name">
            <span *ngIf="!person.avatar_url">{{ initials(person.display_name) }}</span>
          </div>
          <!-- S-034: name + pills on same horizontal line -->
          <div class="drp-dcs-name-row">
            <span class="drp-dcs-name">{{ person.display_name }}</span>
            <span *ngIf="person.is_leader" class="drp-role-pill drp-leader-pill">Leader</span>
            <span *ngIf="!isParticipant" class="drp-role-pill">{{ personTypeLabel }}</span>
            <span *ngIf="person.initiatives.length > 0" class="drp-count-badge">{{ person.initiatives.length }}</span>
          </div>
          <!-- Add All — disabled (not hidden) when every initiative is already added -->
          <button *ngIf="person.initiatives.length > 0"
                  class="drp-add-all-btn"
                  type="button"
                  [disabled]="isAddingAll(person.id) || allAdded(person)"
                  [title]="allAdded(person) ? 'All initiatives already in this meeting' : ''"
                  (click)="addAllToMeeting(person, $event)">
            {{ allAdded(person) ? 'All Added ✓' : addAllLabel(person.id) }}
          </button>
          <span class="drp-chevron">{{ isPersonExpanded(person.id) ? '▾' : '▸' }}</span>
        </div>

        <!-- Initiative list (expanded) -->
        <div *ngIf="isPersonExpanded(person.id)" class="drp-initiatives">
          <div *ngIf="person.initiatives.length === 0" class="drp-no-initiatives">
            No active initiatives
          </div>
          <div *ngFor="let init of person.initiatives"
               class="drp-initiative-row"
               [class.drp-initiative-checked]="isInitiativeAdded(init.id)"
               (click)="!isInitiativeAdded(init.id) && addToMeeting(init); $event.stopPropagation()"
               [attr.role]="isInitiativeAdded(init.id) ? null : 'button'"
               [attr.tabindex]="isInitiativeAdded(init.id) ? null : 0"
               (keydown.enter)="!isInitiativeAdded(init.id) && addToMeeting(init)">
            <span class="drp-checkbox"
                  [class.drp-checkbox-checked]="isInitiativeAdded(init.id)"
                  [title]="isInitiativeAdded(init.id) ? 'In meeting' : 'Add to meeting'">
              <span *ngIf="isInitiativeAdded(init.id)" class="drp-checkmark">✓</span>
            </span>
            <span class="drp-status-dot"
                  [style.background]="gateStatusColor(init.gate_status)"
                  [title]="gateStatusLabel(init.gate_status)">
            </span>
            <span class="drp-initiative-name drp-initiative-link"
                  role="button"
                  tabindex="0"
                  (click)="initiativeSelected.emit(init.id); $event.stopPropagation()"
                  (keydown.enter)="initiativeSelected.emit(init.id)">
              {{ init.name }}
            </span>
            <span class="drp-stage-badge">{{ init.stage }}</span>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .drp-panel {
      height: 100%;
      border-left: 1px solid #E0E0E0;
      background: #FAFAFA;
      display: flex;
      flex-direction: column;
      transition: width 0.2s;
    }
    .drp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #E0E0E0;
      background: #fff;
    }
    .drp-header-label {
      font: 600 13px Roboto, sans-serif;
      color: #1A1A1A;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .drp-collapse-btn {
      background: none; border: none; cursor: pointer;
      font-size: 14px; color: #757575; padding: 2px 6px;
    }
    .drp-body { flex: 1; overflow-y: auto; padding: 8px 0; }
    .drp-toggle-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px 4px;
      font: 12px Roboto, sans-serif; color: #5A5A5A;
      cursor: pointer; user-select: none;
    }
    .drp-divider {
      margin: 10px 12px 2px;
      padding-top: 8px;
      border-top: 1px solid #E0E0E0;
      font: 600 10px Roboto, sans-serif;
      color: #9E9E9E;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .drp-skeleton-row {
      height: 48px; margin: 4px 12px;
      background: linear-gradient(90deg, #EEEEEE 25%, #E5E5E5 50%, #EEEEEE 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .drp-error, .drp-empty {
      padding: 12px 16px; font-size: 13px; color: #757575;
    }
    .drp-dcs-block { border-bottom: 1px solid #F0F0F0; }
    .drp-dcs-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; cursor: pointer;
      transition: background 0.1s;
    }
    .drp-dcs-row:hover { background: #F0F5F8; }
    .drp-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font: 600 12px Roboto, sans-serif;
      color: #fff;
      flex-shrink: 0;
      overflow: hidden;
    }
    .drp-avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .drp-dcs-name-row {
      display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;
    }
    .drp-dcs-name { font: 500 13px Roboto, sans-serif; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .drp-role-pill {
      font: 500 10px Roboto, sans-serif;
      background: #E3F0F7; color: #257099;
      border-radius: 999px; padding: 1px 7px;
      white-space: nowrap;
    }
    .drp-leader-pill { background: #257099; color: #fff; }
    .drp-count-badge {
      background: #257099; color: #fff;
      border-radius: 999px; padding: 0 6px;
      font: 600 10px Roboto; line-height: 16px;
      flex-shrink: 0;
    }
    .drp-add-all-btn {
      background: none;
      border: 1px solid var(--triarq-color-primary, #257099);
      color: var(--triarq-color-primary, #257099);
      border-radius: 5px; padding: 1px 8px;
      font: 500 10px Roboto; cursor: pointer; white-space: nowrap;
      flex-shrink: 0;
    }
    .drp-add-all-btn:disabled { opacity: 0.6; cursor: default; }
    .drp-chevron { color: #757575; font-size: 11px; flex-shrink: 0; }
    .drp-initiatives { padding: 0 0 4px 54px; }
    .drp-no-initiatives { font: italic 12px Roboto, sans-serif; color: #9E9E9E; padding: 6px 12px; }
    .drp-initiative-row {
      padding: 5px 12px 5px 8px;
      display: flex; flex-direction: row; align-items: center; gap: 6px;
      border-bottom: 1px solid #F5F5F5;
      cursor: pointer; transition: background 0.1s;
    }
    .drp-initiative-row:hover:not(.drp-initiative-checked) { background: #F0F7FB; }
    .drp-initiative-checked { cursor: default; opacity: 0.7; }
    .drp-checkbox {
      width: 15px; height: 15px; flex-shrink: 0;
      border: 1.5px solid #BDBDBD; border-radius: 3px;
      display: flex; align-items: center; justify-content: center;
      background: #fff; transition: border-color 0.1s, background 0.1s;
    }
    .drp-checkbox-checked {
      background: var(--triarq-color-primary, #257099);
      border-color: var(--triarq-color-primary, #257099);
    }
    .drp-checkmark { font-size: 10px; color: #fff; line-height: 1; }
    .drp-type-row { display: flex; gap: 6px; padding: 4px 12px; }
    .drp-type-pill {
      background: #fff; border: 1px solid #BDBDBD; border-radius: 999px;
      color: #5A5A5A; padding: 2px 12px; font: 500 11px Roboto, sans-serif;
      cursor: pointer; transition: all 0.1s;
    }
    .drp-type-pill-active {
      background: var(--triarq-color-primary, #257099);
      border-color: var(--triarq-color-primary, #257099);
      color: #fff;
    }
    .drp-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .drp-initiative-name { font: 13px Roboto, sans-serif; color: #1A1A1A; flex: 1; min-width: 0; }
    .drp-initiative-link { cursor: pointer; }
    .drp-initiative-link:hover { color: var(--triarq-color-primary, #257099); text-decoration: underline; }
    .drp-stage-badge {
      font: 500 10px Roboto, sans-serif; flex-shrink: 0;
      background: #F5F5F5; color: #5A5A5A;
      border-radius: 999px; padding: 1px 7px;
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .drp-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 12px; }
  `]
})
export class DcsReferencePanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input()  initiativesGatesSectionId!: string;
  @Input()  existingInitiativeIds: Set<string> = new Set();
  // Series default person type (leader-persisted). A per-user saved choice overrides it.
  @Input()  personType: RefPanelPersonType = 'dcs';
  // Track scope for the participant-aware listing + per-user view memory.
  @Input()  trackId = '';
  @Output() bulletAdded        = new EventEmitter<{ section_id: string; initiative_id: string; initiative_name: string }>();
  @Output() initiativeSelected = new EventEmitter<string>();
  // Fires when a user switches the type — parent persists to the series if leader.
  @Output() personTypeChanged  = new EventEmitter<RefPanelPersonType>();

  readonly personTypeOptions: RefPanelPersonType[] = ['dcs', 'dol', 'epo'];

  participants: RefPanelPerson[] = [];
  others:       RefPanelPerson[] = [];
  participantsOnly = true;
  loading    = false;
  loadError  = '';
  collapsed  = false;

  // Per-person expand/collapse. Loaded from saved state; defaults applied on load:
  // leaders collapsed, non-leader participants expanded, others collapsed.
  private expandedById: Record<string, boolean> = {};
  // True once the user (or their saved state) chose a type — series-default changes stop applying.
  private userChoseType = false;

  private addingIds    = new Set<string>();
  private addedIds     = new Map<string, ReturnType<typeof setTimeout>>();
  private addingAllIds = new Set<string>();
  private addedAllIds  = new Map<string, ReturnType<typeof setTimeout>>();

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  // Full saved byTrack map — read-modify-write so other tracks' state survives.
  private savedByTrack: Record<string, RefPanelTrackState> = {};

  // Expose helpers to template.
  readonly gateStatusColor = gateStatusColor;
  readonly gateStatusLabel = gateStatusLabel;
  readonly initials        = initials;
  readonly avatarColor     = avatarColor;

  get personTypeLabel(): string { return this.personType.toUpperCase(); }

  constructor(
    private readonly svc:         TeamMeetingsService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreState().then(() => this.load());
  }

  ngOnDestroy(): void {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.flushState(); }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personType'] && !changes['personType'].firstChange && !this.userChoseType) {
      // Series default changed elsewhere and this user has no override — follow it.
      this.load();
    }
    if (changes['existingInitiativeIds']) {
      // Unchecks checkboxes when a bullet is removed via ×.
      for (const id of Array.from(this.addedIds.keys())) {
        if (!this.existingInitiativeIds.has(id)) this.addedIds.delete(id);
      }
      this.cdr.markForCheck();
    }
  }

  // ── Per-user view memory (Option A) ─────────────────────────────────────────
  private async restoreState(): Promise<void> {
    if (!this.trackId) return;
    const saved = await this.screenState.restore(SCREEN_KEYS.TEAM_MEETINGS_REF_PANEL);
    const byTrack = (saved?.filter_state?.['byTrack'] ?? {}) as Record<string, RefPanelTrackState>;
    this.savedByTrack = byTrack;
    const s = byTrack[this.trackId];
    if (!s) return;
    if (s.participants_only !== undefined) this.participantsOnly = !!s.participants_only;
    if (s.person_type) {
      this.personType    = s.person_type;
      this.userChoseType = true;
    }
    if (s.expanded) this.expandedById = { ...s.expanded };
    this.cdr.markForCheck();
  }

  private queueSave(): void {
    if (!this.trackId) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushState(), SAVE_DEBOUNCE_MS);
  }

  private flushState(): void {
    this.saveTimer = null;
    if (!this.trackId) return;
    this.savedByTrack[this.trackId] = {
      participants_only: this.participantsOnly,
      ...(this.userChoseType ? { person_type: this.personType } : {}),
      expanded: this.expandedById
    };
    this.screenState.save(SCREEN_KEYS.TEAM_MEETINGS_REF_PANEL, { byTrack: this.savedByTrack });
  }

  // ── Data ────────────────────────────────────────────────────────────────────
  load(): void {
    if (!this.trackId) return;
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listTrackInitiativeReference(this.trackId, this.personType).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.participants = res.data.participants ?? [];
          this.others       = res.data.others ?? [];
          this.applyDefaultExpansion();
        } else {
          this.loadError = res.error ?? 'Failed to load initiative reference.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load initiative reference.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Defaults for people with no saved state: leaders collapsed, participants expanded, others collapsed. */
  private applyDefaultExpansion(): void {
    for (const p of this.participants) {
      if (!(p.id in this.expandedById)) this.expandedById[p.id] = !p.is_leader;
    }
    for (const o of this.others) {
      if (!(o.id in this.expandedById)) this.expandedById[o.id] = false;
    }
  }

  // ── View state ──────────────────────────────────────────────────────────────
  toggleParticipantsOnly(): void {
    this.participantsOnly = !this.participantsOnly;
    this.cdr.markForCheck();
    this.queueSave();
  }

  selectPersonType(pt: RefPanelPersonType): void {
    if (pt === this.personType) return;
    this.personType    = pt;
    this.userChoseType = true;
    this.load();
    this.queueSave();
    this.personTypeChanged.emit(pt);
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.cdr.markForCheck();
  }

  togglePerson(id: string): void {
    this.expandedById[id] = !this.expandedById[id];
    this.cdr.markForCheck();
    this.queueSave();
  }

  isPersonExpanded(id: string): boolean { return !!this.expandedById[id]; }
  isAddingAll(id: string): boolean      { return this.addingAllIds.has(id); }

  isInitiativeAdded(id: string): boolean {
    return this.existingInitiativeIds.has(id) || this.addedIds.has(id);
  }

  allAdded(person: RefPanelPerson): boolean {
    return person.initiatives.length > 0 && person.initiatives.every(i => this.isInitiativeAdded(i.id));
  }

  addAllLabel(personId: string): string {
    return this.addedAllIds.has(personId) ? 'All Added ✓' : '+ Add All';
  }

  // ── Add to meeting ──────────────────────────────────────────────────────────
  addAllToMeeting(person: RefPanelPerson, event: Event): void {
    event.stopPropagation();
    if (!this.initiativesGatesSectionId || this.addingAllIds.has(person.id)) return;
    const toAdd = person.initiatives.filter(i => !this.isInitiativeAdded(i.id));
    if (!toAdd.length) return;

    this.addingAllIds.add(person.id);
    this.cdr.markForCheck();

    toAdd.forEach(init => {
      this.bulletAdded.emit({
        section_id:      this.initiativesGatesSectionId,
        initiative_id:   init.id,
        initiative_name: init.name
      });
      const t = setTimeout(() => { this.addedIds.delete(init.id); this.cdr.markForCheck(); }, 2500);
      this.addedIds.set(init.id, t);
    });

    this.addingAllIds.delete(person.id);
    const at = setTimeout(() => { this.addedAllIds.delete(person.id); this.cdr.markForCheck(); }, 2500);
    this.addedAllIds.set(person.id, at);
    this.cdr.markForCheck();
  }

  addToMeeting(init: DcsInitiativeRef): void {
    if (!this.initiativesGatesSectionId || this.addingIds.has(init.id) || this.isInitiativeAdded(init.id)) return;
    this.addingIds.add(init.id);
    this.cdr.markForCheck();

    this.bulletAdded.emit({
      section_id:      this.initiativesGatesSectionId,
      initiative_id:   init.id,
      initiative_name: init.name
    });

    const timer = setTimeout(() => {
      this.addedIds.delete(init.id);
      this.cdr.markForCheck();
    }, 1500);

    this.addingIds.delete(init.id);
    this.addedIds.set(init.id, timer);
    this.cdr.markForCheck();
  }
}
