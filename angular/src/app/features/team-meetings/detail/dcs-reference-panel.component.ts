// dcs-reference-panel.component.ts — Pathways OI Trust
// DCS Initiative Reference Panel (D-490 Step 5).
// Right-column panel showing DCS users and their active initiatives.
// D-415/S-034: avatar 32px, name + role pill on same horizontal line.
// D-419: gate_status dot color from walkback result (on_track/at_risk/off_track/complete/not_started).

import {
  Component, OnInit, OnChanges, SimpleChanges,
  Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { TeamMeetingsService }   from '../team-meetings.service';
import { DcsUserWithInitiatives, DcsInitiativeRef } from '../../../core/types/team-meetings';

// D-419 gate status → dot color mapping (reusing existing color semantics).
function gateStatusColor(status: string): string {
  switch (status) {
    case 'on_track':  return '#4CAF50'; // green
    case 'at_risk':   return '#F2A620'; // sunray amber
    case 'off_track': return '#D32F2F'; // red
    case 'complete':  return '#257099'; // primary blue
    default:          return '#BDBDBD'; // grey — not_started or unknown
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
        <!-- Person type selector — anyone can switch live; leader's choice persists to the series -->
        <div class="drp-type-row" role="radiogroup" aria-label="Reference panel people type">
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

        <!-- Empty -->
        <div *ngIf="!loading && !loadError && dcsUsers.length === 0" class="drp-empty">
          No {{ personTypeLabel }} users found.
        </div>

        <!-- DCS user rows — D-415/S-034 compact person row -->
        <ng-container *ngIf="!loading && !loadError">
          <div *ngFor="let dcs of dcsUsers" class="drp-dcs-block">
            <div class="drp-dcs-row"
                 role="button"
                 tabindex="0"
                 (click)="toggleDcs(dcs.id)"
                 (keydown.enter)="toggleDcs(dcs.id)">
              <!-- S-034: avatar 32px -->
              <div class="drp-avatar"
                   [style.background]="dcs.avatar_url ? 'transparent' : avatarColor(dcs.id)">
                <img *ngIf="dcs.avatar_url" [src]="dcs.avatar_url" class="drp-avatar-img" [alt]="dcs.display_name">
                <span *ngIf="!dcs.avatar_url">{{ initials(dcs.display_name) }}</span>
              </div>
              <!-- S-034: name + role pill on same horizontal line -->
              <div class="drp-dcs-name-row">
                <span class="drp-dcs-name">{{ dcs.display_name }}</span>
                <span class="drp-role-pill">{{ personTypeLabel }}</span>
                <span *ngIf="dcs.initiatives.length > 0" class="drp-count-badge">{{ dcs.initiatives.length }}</span>
              </div>
              <!-- Add All button — skips initiatives already in meeting -->
              <button *ngIf="dcs.initiatives.length > 0"
                      class="drp-add-all-btn"
                      type="button"
                      [disabled]="isAddingAll(dcs.id)"
                      (click)="addAllToMeeting(dcs, $event)">
                {{ addAllLabel(dcs.id) }}
              </button>
              <span class="drp-chevron">{{ isDcsExpanded(dcs.id) ? '▾' : '▸' }}</span>
            </div>

            <!-- Initiative list (expanded) -->
            <div *ngIf="isDcsExpanded(dcs.id)" class="drp-initiatives">
              <div *ngIf="dcs.initiatives.length === 0" class="drp-no-initiatives">
                No active initiatives
              </div>
              <div *ngFor="let init of dcs.initiatives"
                   class="drp-initiative-row"
                   [class.drp-initiative-checked]="isInitiativeAdded(init.id)"
                   (click)="!isInitiativeAdded(init.id) && addToMeeting(init); $event.stopPropagation()"
                   [attr.role]="isInitiativeAdded(init.id) ? null : 'button'"
                   [attr.tabindex]="isInitiativeAdded(init.id) ? null : 0"
                   (keydown.enter)="!isInitiativeAdded(init.id) && addToMeeting(init)">
                <!-- Checkbox -->
                <span class="drp-checkbox"
                      [class.drp-checkbox-checked]="isInitiativeAdded(init.id)"
                      [title]="isInitiativeAdded(init.id) ? 'In meeting' : 'Add to meeting'">
                  <span *ngIf="isInitiativeAdded(init.id)" class="drp-checkmark">✓</span>
                </span>
                <!-- D-419 status dot -->
                <span class="drp-status-dot"
                      [style.background]="gateStatusColor(init.gate_status)"
                      [title]="gateStatusLabel(init.gate_status)">
                </span>
                <!-- Name (tappable for detail) -->
                <span class="drp-initiative-name drp-initiative-link"
                      role="button"
                      tabindex="0"
                      (click)="initiativeSelected.emit(init.id); $event.stopPropagation()"
                      (keydown.enter)="initiativeSelected.emit(init.id)">
                  {{ init.name }}
                </span>
                <!-- Stage badge -->
                <span class="drp-stage-badge">{{ init.stage }}</span>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
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
    .drp-skeleton-row {
      height: 48px; margin: 4px 12px;
      background: linear-gradient(90deg, #EEEEEE 25%, #E5E5E5 50%, #EEEEEE 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .drp-error, .drp-empty {
      padding: 16px; font-size: 13px; color: #757575;
    }
    .drp-dcs-block { border-bottom: 1px solid #F0F0F0; }
    /* D-415/S-034: compact person row */
    .drp-dcs-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; cursor: pointer;
      transition: background 0.1s;
    }
    .drp-dcs-row:hover { background: #F0F5F8; }
    /* S-034: avatar 32px */
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
    /* S-034: name + role pill on same line */
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
    /* Person type pills */
    .drp-type-row { display: flex; gap: 6px; padding: 8px 12px 4px; }
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
    /* D-419 status dot */
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
export class DcsReferencePanelComponent implements OnInit, OnChanges {
  @Input()  initiativesGatesSectionId!: string;
  @Input()  existingInitiativeIds: Set<string> = new Set();
  // Tracks Phase B: person type — groups the panel by DCS, DOL, or EPO.
  // Seeded from the series' remembered choice; any participant may switch live.
  @Input()  personType: 'dcs' | 'dol' | 'epo' = 'dcs';
  @Output() bulletAdded          = new EventEmitter<{ section_id: string; initiative_id: string; initiative_name: string }>();
  @Output() initiativeSelected   = new EventEmitter<string>();
  // Fires when a user switches the type — parent persists to the series if leader.
  @Output() personTypeChanged    = new EventEmitter<'dcs' | 'dol' | 'epo'>();

  readonly personTypeOptions: ('dcs' | 'dol' | 'epo')[] = ['dcs', 'dol', 'epo'];

  get personTypeLabel(): string { return this.personType.toUpperCase(); }

  selectPersonType(pt: 'dcs' | 'dol' | 'epo'): void {
    if (pt === this.personType) return;
    this.personType = pt;
    this.load();
    this.personTypeChanged.emit(pt);
  }

  dcsUsers:  DcsUserWithInitiatives[] = [];
  loading    = false;
  loadError  = '';
  collapsed  = false;

  private expandedDcsIds  = new Set<string>();
  private addingIds       = new Set<string>();
  private addedIds        = new Map<string, ReturnType<typeof setTimeout>>();
  private addingAllIds    = new Set<string>();
  private addedAllIds     = new Map<string, ReturnType<typeof setTimeout>>();

  // Expose helpers to template.
  readonly gateStatusColor  = gateStatusColor;
  readonly gateStatusLabel  = gateStatusLabel;
  readonly initials         = initials;
  readonly avatarColor      = avatarColor;

  constructor(
    private readonly svc: TeamMeetingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personType'] && !changes['personType'].firstChange) {
      this.load();
    }
    if (changes['existingInitiativeIds']) {
      // Remove from optimistic addedIds any initiative no longer in the meeting.
      // This fires when a bullet is removed via × so the checkbox unchecks.
      for (const id of Array.from(this.addedIds.keys())) {
        if (!this.existingInitiativeIds.has(id)) this.addedIds.delete(id);
      }
      this.cdr.markForCheck();
    }
  }

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listDcsUsersWithInitiatives(this.personType).subscribe({
      next: res => {
        if (res.success) {
          this.dcsUsers = res.data ?? [];
          // Auto-expand first DCS if only one.
          if (this.dcsUsers.length === 1) {
            this.expandedDcsIds.add(this.dcsUsers[0].id);
          }
        } else {
          this.loadError = res.error ?? 'Failed to load DCS data.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load DCS data.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.cdr.markForCheck();
  }

  toggleDcs(id: string): void {
    if (this.expandedDcsIds.has(id)) this.expandedDcsIds.delete(id);
    else                              this.expandedDcsIds.add(id);
    this.cdr.markForCheck();
  }

  isDcsExpanded(id: string): boolean  { return this.expandedDcsIds.has(id); }
  isAdding(id: string): boolean        { return this.addingIds.has(id); }
  isAddingAll(dcsId: string): boolean  { return this.addingAllIds.has(dcsId); }

  isInitiativeAdded(id: string): boolean {
    return this.existingInitiativeIds.has(id) || this.addedIds.has(id);
  }

  addedLabel(initiativeId: string): string {
    return this.addedIds.has(initiativeId) ? 'Added ✓' : '+ Add';
  }

  addAllLabel(dcsId: string): string {
    return this.addedAllIds.has(dcsId) ? 'All Added ✓' : '+ Add All';
  }

  addAllToMeeting(dcs: DcsUserWithInitiatives, event: Event): void {
    event.stopPropagation();
    if (!this.initiativesGatesSectionId || this.addingAllIds.has(dcs.id)) return;
    const toAdd = dcs.initiatives.filter(i => !this.existingInitiativeIds.has(i.id));
    if (!toAdd.length) return;

    this.addingAllIds.add(dcs.id);
    this.cdr.markForCheck();

    toAdd.forEach(init => {
      this.bulletAdded.emit({
        section_id:      this.initiativesGatesSectionId,
        initiative_id:   init.id,
        initiative_name: init.name
      });
      // Mark individual add buttons added too.
      const t = setTimeout(() => { this.addedIds.delete(init.id); this.cdr.markForCheck(); }, 2500);
      this.addedIds.set(init.id, t);
    });

    this.addingAllIds.delete(dcs.id);
    const at = setTimeout(() => { this.addedAllIds.delete(dcs.id); this.cdr.markForCheck(); }, 2500);
    this.addedAllIds.set(dcs.id, at);
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

    // Optimistic feedback — parent confirms success; revert timer for UI label.
    const timer = setTimeout(() => {
      this.addedIds.delete(init.id);
      this.cdr.markForCheck();
    }, 1500);

    this.addingIds.delete(init.id);
    this.addedIds.set(init.id, timer);
    this.cdr.markForCheck();
  }
}
