// dcs-reference-panel.component.ts — Pathways OI Trust
// DCS Initiative Reference Panel (D-490 Step 5).
// Right-column panel showing DCS users and their active initiatives.
// D-415/S-034: avatar 32px, name + role pill on same horizontal line.
// D-419: gate_status dot color from walkback result (on_track/at_risk/off_track/complete/not_started).

import {
  Component, OnInit, Input, Output, EventEmitter,
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
          No DCS users found.
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
                <span class="drp-role-pill">DCS</span>
              </div>
              <span class="drp-chevron">{{ isDcsExpanded(dcs.id) ? '▾' : '▸' }}</span>
            </div>

            <!-- Initiative list (expanded) -->
            <div *ngIf="isDcsExpanded(dcs.id)" class="drp-initiatives">
              <div *ngIf="dcs.initiatives.length === 0" class="drp-no-initiatives">
                No active initiatives
              </div>
              <div *ngFor="let init of dcs.initiatives" class="drp-initiative-row">
                <div class="drp-initiative-main">
                  <!-- D-419 gate status dot -->
                  <span class="drp-status-dot"
                        [style.background]="gateStatusColor(init.gate_status)"
                        [title]="gateStatusLabel(init.gate_status)">
                  </span>
                  <span class="drp-initiative-name">{{ init.name }}</span>
                </div>
                <div class="drp-initiative-meta">
                  <span class="drp-stage-badge">{{ init.stage }}</span>
                  <span *ngIf="init.last_status_update_date" class="drp-last-update">
                    {{ init.last_status_update_date | date:'MMM d' }}
                  </span>
                </div>
                <button class="drp-add-btn"
                        type="button"
                        [disabled]="isAdding(init.id)"
                        (click)="addToMeeting(init)">
                  {{ addedLabel(init.id) }}
                </button>
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
    .drp-chevron { color: #757575; font-size: 11px; flex-shrink: 0; }
    .drp-initiatives { padding: 0 0 4px 54px; }
    .drp-no-initiatives { font: italic 12px Roboto, sans-serif; color: #9E9E9E; padding: 6px 12px; }
    .drp-initiative-row {
      padding: 6px 12px 6px 0;
      display: flex; flex-direction: column; gap: 3px;
      border-bottom: 1px solid #F5F5F5;
    }
    .drp-initiative-main { display: flex; align-items: center; gap: 6px; }
    /* D-419 status dot */
    .drp-status-dot {
      width: 8px; height: 8px;
      border-radius: 50%; flex-shrink: 0;
    }
    .drp-initiative-name { font: 13px Roboto, sans-serif; color: #1A1A1A; }
    .drp-initiative-meta { display: flex; align-items: center; gap: 8px; padding-left: 14px; }
    .drp-stage-badge {
      font: 500 10px Roboto, sans-serif;
      background: #F5F5F5; color: #5A5A5A;
      border-radius: 999px; padding: 1px 7px;
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .drp-last-update { font: italic 11px Roboto, sans-serif; color: #9E9E9E; }
    .drp-add-btn {
      align-self: flex-end;
      background: none;
      border: 1px solid var(--triarq-color-primary, #257099);
      color: var(--triarq-color-primary, #257099);
      border-radius: 5px;
      padding: 2px 10px;
      font: 500 11px Roboto, sans-serif;
      cursor: pointer;
      white-space: nowrap;
      margin-top: 2px;
    }
    .drp-add-btn:disabled { opacity: 0.6; cursor: default; }
    .drp-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 12px; }
  `]
})
export class DcsReferencePanelComponent implements OnInit {
  @Input()  initiativesGatesSectionId!: string;
  @Output() bulletAdded = new EventEmitter<{ section_id: string; initiative_id: string; initiative_name: string }>();

  dcsUsers:  DcsUserWithInitiatives[] = [];
  loading    = false;
  loadError  = '';
  collapsed  = false;

  private expandedDcsIds = new Set<string>();
  private addingIds      = new Set<string>();
  private addedIds       = new Map<string, ReturnType<typeof setTimeout>>();

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

  load(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.listDcsUsersWithInitiatives().subscribe({
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

  isDcsExpanded(id: string): boolean { return this.expandedDcsIds.has(id); }
  isAdding(id: string): boolean       { return this.addingIds.has(id); }

  addedLabel(initiativeId: string): string {
    return this.addedIds.has(initiativeId) ? 'Added ✓' : '+ Add';
  }

  addToMeeting(init: DcsInitiativeRef): void {
    if (!this.initiativesGatesSectionId || this.addingIds.has(init.id)) return;
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
