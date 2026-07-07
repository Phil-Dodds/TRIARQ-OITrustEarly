// team-meetings-detail.component.ts — Pathways OI Trust
// Meeting prep/run screen (D-490 Steps 4, 6, 7).
// Route: /team-meetings/:meeting_id
// Two-column layout (≥1024px): 65% sections + 35% DCS reference panel.
// Read-only mode: any meeting that is not the most recent (determined by meeting_date).

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }              from '@angular/common';
import { RouterModule, Router,
         ActivatedRoute }            from '@angular/router';
import { FormsModule }               from '@angular/forms';
import { IonicModule }               from '@ionic/angular';
import { TeamMeetingsService }       from '../team-meetings.service';
import { DcsReferencePanelComponent } from './dcs-reference-panel.component';
import {
  TeamMeeting, TeamMeetingSection, TeamMeetingBullet,
  SECTION_CONFIGS, SectionKey
} from '../../../core/types/team-meetings';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

interface InitiativeSearchResult {
  id:    string;
  name:  string;
  stage: string;
}

@Component({
  selector:        'app-team-meetings-detail',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule, IonicModule,
    DcsReferencePanelComponent
  ],
  template: `
    <!-- Loading state -->
    <div *ngIf="loading" class="tmd-loading">Loading meeting…</div>

    <!-- Error state -->
    <div *ngIf="loadError && !loading" class="tmd-full-error">
      <span>⚠ {{ loadError }}</span>
      <button class="tmd-link-btn" (click)="loadMeeting()" type="button">Retry</button>
    </div>

    <ng-container *ngIf="meeting && !loading">
      <!-- Read-only banner (Step 7) -->
      <div *ngIf="isReadOnly" class="tmd-readonly-banner">
        <span>{{ meeting.title }} — {{ meeting.meeting_date | date:'MMMM d, y' }} · Read only</span>
        <a *ngIf="latestMeetingId"
           [routerLink]="['/team-meetings', latestMeetingId]"
           class="tmd-banner-link">
          → Prep this week's meeting
        </a>
        <a *ngIf="!latestMeetingId"
           routerLink="/team-meetings"
           class="tmd-banner-link">
          → Create this week's meeting
        </a>
      </div>

      <div class="tmd-shell" [class.tmd-wide]="!isReadOnly">
        <!-- Left column: sections (65%) -->
        <div class="tmd-sections-col">
          <div class="tmd-meeting-title-row">
            <a routerLink="/team-meetings" class="tmd-back-link">← Team Meetings</a>
            <h1 class="tmd-title">{{ meeting.title }}</h1>
            <span class="tmd-meeting-date">{{ meeting.meeting_date | date:'EEEE, MMMM d, y' }}</span>
          </div>

          <!-- Sections -->
          <div *ngFor="let section of meeting.sections" class="tmd-section">
            <ng-container *ngIf="getSectionConfig(section.section_key) as cfg">
              <!-- Section header (D-308 collapse pattern) -->
              <div class="tmd-section-header"
                   role="button"
                   tabindex="0"
                   (click)="toggleSection(section)"
                   (keydown.enter)="toggleSection(section)"
                   [style.border-left-color]="cfg.bar_color">
                <div class="tmd-section-header-text">
                  <span class="tmd-section-title">{{ cfg.title }}</span>
                  <!-- S-015 zone explanation -->
                  <span class="tmd-section-sublabel">{{ cfg.sub_label }}</span>
                </div>
                <span class="tmd-section-chevron">{{ section.collapsed ? '▸' : '▾' }}</span>
              </div>

              <div *ngIf="!section.collapsed" class="tmd-section-body">
                <!-- Bullet list -->
                <div class="tmd-bullets">
                  <div *ngIf="section.bullets.length === 0 && isReadOnly" class="tmd-no-bullets">
                    No items recorded.
                  </div>
                  <div *ngFor="let bullet of section.bullets" class="tmd-bullet-row">
                    <span class="tmd-bullet-dot" [style.background]="cfg.bar_color"></span>
                    <!-- Initiative chip (tappable per D-478/S-021) -->
                    <span *ngIf="bullet.initiative" class="tmd-initiative-chip"
                          role="button" tabindex="0"
                          [title]="bullet.initiative.name"
                          (click)="openInitiativeDetail(bullet.initiative.id)"
                          (keydown.enter)="openInitiativeDetail(bullet.initiative.id)">
                      {{ bullet.initiative.name }}
                    </span>
                    <!-- Plain text bullet -->
                    <span *ngIf="!bullet.initiative" class="tmd-bullet-text">{{ bullet.text }}</span>

                    <!-- Carry-forward tap target (read-only mode, Step 7) -->
                    <span *ngIf="isReadOnly" class="tmd-carry-btn-wrap">
                      <ng-container *ngIf="!carryingBulletId || carryingBulletId !== bullet.id">
                        <button class="tmd-carry-btn"
                                type="button"
                                (click)="initiateCarryForward(bullet)">
                          → This week
                        </button>
                      </ng-container>
                      <!-- Inline confirmation (Step 6) -->
                      <span *ngIf="carryingBulletId === bullet.id && carryTarget" class="tmd-carry-confirm">
                        Carry to {{ carryTarget.title }}?
                        <button class="tmd-carry-confirm-btn" (click)="confirmCarry(bullet)" type="button">
                          {{ carryingSaving ? 'Carrying…' : 'Confirm' }}
                        </button>
                        <button class="tmd-carry-cancel-btn" (click)="cancelCarry()" type="button">Cancel</button>
                      </span>
                      <span *ngIf="carryingBulletId === bullet.id && !carryTarget && !carryingSaving" class="tmd-carry-prompt">
                        No current meeting found —
                        <a routerLink="/team-meetings" class="tmd-link">+ New Meeting</a>
                      </span>
                      <span *ngIf="carriedBulletIds.has(bullet.id)" class="tmd-carried-label">
                        Carried to {{ carriageTargetTitle }}
                      </span>
                    </span>

                    <!-- Remove button (prep/run mode only) -->
                    <button *ngIf="!isReadOnly"
                            class="tmd-remove-btn"
                            type="button"
                            [disabled]="removingBulletId === bullet.id"
                            [attr.aria-label]="'Remove: ' + bullet.text"
                            (click)="removeBullet(section, bullet)">
                      ×
                    </button>
                  </div>
                </div>

                <!-- Add-bullet input (prep/run mode) -->
                <div *ngIf="!isReadOnly" class="tmd-add-bullet-row">
                  <div class="tmd-add-input-wrap">
                    <input class="tmd-bullet-input"
                           type="text"
                           [placeholder]="addPlaceholder"
                           [(ngModel)]="addInputs[section.id]"
                           (input)="onBulletInput($event, section)"
                           (keydown.enter)="addBulletFromInput(section)"
                           (keydown.escape)="closeInitiativePicker()">
                    <!-- @ initiative picker dropdown -->
                    <div *ngIf="pickerSectionId === section.id && initiativeResults.length > 0"
                         class="tmd-picker-dropdown">
                      <div *ngFor="let result of initiativeResults"
                           class="tmd-picker-item"
                           role="option"
                           (click)="selectInitiativeFromPicker(section, result)">
                        <span class="tmd-picker-name">{{ result.name }}</span>
                        <span class="tmd-picker-stage">{{ result.stage }}</span>
                      </div>
                    </div>
                  </div>
                  <button class="tmd-add-btn"
                          type="button"
                          [disabled]="!addInputs[section.id]?.trim() || addingBulletSectionId === section.id"
                          (click)="addBulletFromInput(section)">
                    {{ addingBulletSectionId === section.id ? 'Adding…' : 'Add' }}
                  </button>
                </div>

                <!-- Notes textarea (prep/run mode) / plain text (read-only) -->
                <div class="tmd-notes-zone">
                  <!-- S-015 zone explanation -->
                  <label class="tmd-notes-label">NOTES / COMMENTS</label>
                  <textarea *ngIf="!isReadOnly"
                            class="tmd-notes-textarea"
                            placeholder="Capture discussion, decisions, or follow-ups here…"
                            [value]="getNotes(section)"
                            (blur)="onNotesBlur(section, $event)"
                            rows="3">
                  </textarea>
                  <p *ngIf="isReadOnly && section.notes?.notes_text" class="tmd-notes-readonly">
                    {{ section.notes?.notes_text }}
                  </p>
                </div>
              </div><!-- /section-body -->
            </ng-container>
          </div><!-- /section -->
        </div><!-- /sections-col -->

        <!-- Right column: DCS reference panel (Step 5) — hidden in read-only mode (Step 7) -->
        <div *ngIf="!isReadOnly" class="tmd-ref-col">
          <app-dcs-reference-panel
            [initiativesGatesSectionId]="initiativesGatesSectionId"
            (bulletAdded)="onRefPanelAddBullet($event)">
          </app-dcs-reference-panel>
        </div>
      </div>
    </ng-container>

    <!-- Initiative detail panel overlay — D-478 read-only mode -->
    <div *ngIf="showInitiativePanel" class="tmd-overlay-scrim" (click)="closeInitiativeDetail()"></div>
    <div *ngIf="showInitiativePanel" class="tmd-initiative-overlay">
      <div class="tmd-overlay-header">
        <span class="tmd-overlay-title">Initiative Detail</span>
        <button class="tmd-close-btn" (click)="closeInitiativeDetail()" type="button">×</button>
      </div>
      <div class="tmd-overlay-body">
        <p class="tmd-overlay-note">
          Open the full Initiative detail via
          <a [routerLink]="['/initiatives', selectedInitiativeId]" class="tmd-link">View Initiative →</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .tmd-loading { padding: 48px 32px; color: #757575; font: 14px Roboto, sans-serif; }
    .tmd-full-error { display: flex; align-items: center; gap: 10px; padding: 24px 32px; color: #D32F2F; font: 14px Roboto, sans-serif; }
    .tmd-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 14px; }

    .tmd-readonly-banner {
      background: #FFF8E1;
      border-bottom: 2px solid #F2A620;
      padding: 10px 24px;
      display: flex; align-items: center; justify-content: space-between;
      font: 13px Roboto, sans-serif; color: #1A1A1A;
    }
    .tmd-banner-link { color: var(--triarq-color-primary, #257099); text-decoration: none; font-weight: 500; }

    .tmd-shell {
      display: flex;
      min-height: calc(100vh - 56px);
    }
    .tmd-sections-col { flex: 65; min-width: 0; padding: 24px 28px; }
    .tmd-ref-col { flex: 35; min-width: 280px; max-width: 380px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }

    @media (max-width: 1023px) {
      .tmd-shell { flex-direction: column; }
      .tmd-ref-col { max-width: 100%; height: auto; position: relative; }
    }

    .tmd-meeting-title-row { margin-bottom: 20px; }
    .tmd-back-link { font: 13px Roboto, sans-serif; color: var(--triarq-color-primary, #257099); text-decoration: none; display: block; margin-bottom: 8px; }
    .tmd-title { font: 600 22px Roboto, sans-serif; color: #1A1A1A; margin: 0 0 4px; }
    .tmd-meeting-date { font: italic 13px Roboto, sans-serif; color: #757575; }

    /* Section */
    .tmd-section { margin-bottom: 16px; border-radius: 10px; border: 1px solid #E8E8E8; overflow: hidden; }
    .tmd-section-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 12px 16px;
      background: #FAFAFA;
      border-left: 4px solid;
      cursor: pointer;
      user-select: none;
    }
    .tmd-section-header:hover { background: #F5F5F5; }
    .tmd-section-header-text { display: flex; flex-direction: column; gap: 2px; }
    .tmd-section-title { font: 600 14px Roboto, sans-serif; color: #1A1A1A; }
    /* S-015 zone explanation */
    .tmd-section-sublabel { font: italic 11px Roboto, sans-serif; color: #5A5A5A; }
    .tmd-section-chevron { font-size: 12px; color: #757575; flex-shrink: 0; margin-top: 2px; }

    .tmd-section-body { padding: 12px 16px 8px; }

    /* Bullets */
    .tmd-bullets { margin-bottom: 8px; }
    .tmd-bullet-row {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 0;
      border-bottom: 1px solid #F5F5F5;
    }
    .tmd-bullet-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    /* S-021: initiative chip tappable */
    .tmd-initiative-chip {
      font: 500 13px Roboto, sans-serif;
      color: var(--triarq-color-primary, #257099);
      text-decoration: underline;
      cursor: pointer; flex: 1;
    }
    .tmd-bullet-text { font: 13px Roboto, sans-serif; color: #1A1A1A; flex: 1; }
    .tmd-remove-btn {
      background: none; border: none; color: #9E9E9E; cursor: pointer;
      font-size: 16px; padding: 0 4px; line-height: 1;
      flex-shrink: 0;
    }
    .tmd-remove-btn:hover { color: #D32F2F; }
    .tmd-remove-btn:disabled { opacity: 0.4; cursor: default; }
    .tmd-no-bullets { font: italic 12px Roboto, sans-serif; color: #9E9E9E; padding: 4px 0 8px; }

    /* Carry-forward (read-only mode) */
    .tmd-carry-btn-wrap { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .tmd-carry-btn { background: none; border: none; font: 11px Roboto, sans-serif; color: #9E9E9E; cursor: pointer; white-space: nowrap; }
    .tmd-carry-btn:hover { color: var(--triarq-color-primary, #257099); }
    .tmd-carry-confirm, .tmd-carry-prompt, .tmd-carried-label { font: 11px Roboto, sans-serif; color: #5A5A5A; display: flex; align-items: center; gap: 6px; }
    .tmd-carry-confirm-btn { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 3px; padding: 2px 8px; font: 500 11px Roboto, sans-serif; cursor: pointer; }
    .tmd-carry-cancel-btn { background: none; border: none; color: #9E9E9E; cursor: pointer; font-size: 11px; }
    .tmd-carried-label { color: #4CAF50; }

    /* Add bullet input */
    .tmd-add-bullet-row { display: flex; gap: 8px; margin-bottom: 8px; position: relative; }
    .tmd-add-input-wrap { flex: 1; position: relative; }
    .tmd-bullet-input {
      width: 100%; border: 1px solid #BDBDBD; border-radius: 5px;
      padding: 6px 10px; font: 13px Roboto, sans-serif;
      outline: none; box-sizing: border-box;
    }
    .tmd-bullet-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .tmd-add-btn {
      background: var(--triarq-color-primary, #257099); color: #fff;
      border: none; border-radius: 5px; padding: 6px 14px;
      font: 500 13px Roboto, sans-serif; cursor: pointer; white-space: nowrap;
    }
    .tmd-add-btn:disabled { opacity: 0.5; cursor: default; }

    /* @ picker dropdown */
    .tmd-picker-dropdown {
      position: absolute; top: 100%; left: 0; right: 0;
      background: #fff; border: 1px solid #E0E0E0; border-radius: 5px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 50;
      max-height: 200px; overflow-y: auto;
    }
    .tmd-picker-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; cursor: pointer;
    }
    .tmd-picker-item:hover { background: #F5F9FC; }
    .tmd-picker-name { font: 13px Roboto, sans-serif; color: #1A1A1A; }
    .tmd-picker-stage { font: 11px Roboto, sans-serif; color: #9E9E9E; text-transform: uppercase; }

    /* Notes */
    .tmd-notes-zone { margin-top: 8px; }
    .tmd-notes-label { display: block; font: 600 10px Roboto, sans-serif; color: #9E9E9E; letter-spacing: 0.06em; margin-bottom: 4px; }
    .tmd-notes-textarea {
      width: 100%; border: 1px solid #E0E0E0; border-radius: 5px;
      padding: 8px 10px; font: 13px Roboto, sans-serif;
      resize: vertical; outline: none; box-sizing: border-box;
    }
    .tmd-notes-textarea:focus { border-color: var(--triarq-color-primary, #257099); }
    .tmd-notes-readonly { font: 13px Roboto, sans-serif; color: #1A1A1A; margin: 0; white-space: pre-wrap; }

    /* Initiative detail overlay — D-478 */
    .tmd-overlay-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.15); z-index: 200; }
    .tmd-initiative-overlay {
      position: fixed; top: 0; right: 0;
      width: 440px; height: 100vh;
      background: #fff; box-shadow: -4px 0 20px rgba(0,0,0,0.12);
      z-index: 201; display: flex; flex-direction: column;
      border-radius: 10px 0 0 10px;
    }
    .tmd-overlay-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #E0E0E0;
    }
    .tmd-overlay-title { font: 600 16px Roboto, sans-serif; }
    .tmd-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #757575; }
    .tmd-overlay-body { padding: 20px; }
    .tmd-overlay-note { font: 14px Roboto, sans-serif; color: #5A5A5A; }
    .tmd-link { color: var(--triarq-color-primary, #257099); }
  `]
})
export class TeamMeetingsDetailComponent implements OnInit, OnDestroy {
  meeting:   TeamMeeting | null = null;
  loading    = false;
  loadError  = '';
  isReadOnly = false;
  latestMeetingId: string | null = null;

  // Add-bullet state per section (keyed by section_id).
  addInputs:          Record<string, string>  = {};
  addingBulletSectionId: string | null        = null;
  removingBulletId:      string | null        = null;

  // @ initiative picker state.
  pickerSectionId:    string | null          = null;
  initiativeResults:  InitiativeSearchResult[] = [];
  private atQuery     = '';

  readonly addPlaceholder = 'Add a bullet… (type @ to mention an Initiative)';

  // Carry-forward state (Step 6).
  carryingBulletId:   string | null = null;
  carryTarget:        { id: string; title: string } | null = null;
  carryingSaving      = false;
  carriedBulletIds    = new Set<string>();
  carriageTargetTitle = '';

  // Initiative detail overlay (D-478).
  showInitiativePanel = false;
  selectedInitiativeId: string | null = null;

  get initiativesGatesSectionId(): string {
    return this.meeting?.sections.find(s => s.section_key === 'initiatives-gates')?.id ?? '';
  }

  private meetingId = '';
  private destroy$  = new Subject<void>();

  constructor(
    private readonly svc:   TeamMeetingsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr:   ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.meetingId = this.route.snapshot.paramMap.get('meeting_id') ?? '';
    this.loadMeeting();
    this.determineReadOnlyMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMeeting(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.svc.getMeeting(this.meetingId).subscribe({
      next: res => {
        if (res.success) {
          this.meeting = res.data ?? null;
          // Init add inputs per section.
          (res.data?.sections ?? []).forEach(s => {
            if (!(s.id in this.addInputs)) this.addInputs[s.id] = '';
          });
        } else {
          this.loadError = res.error ?? 'Failed to load meeting.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = err?.error ?? 'Unable to load meeting.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private determineReadOnlyMode(): void {
    // Read-only = not the most recent meeting. Load first 2 to compare dates.
    this.svc.listMeetings(2).subscribe({
      next: res => {
        if (!res.success || !res.data?.length) return;
        const meetings = res.data;
        this.latestMeetingId = meetings[0].id;
        // Current meeting is read-only if it is not the most recent by meeting_date.
        this.isReadOnly = meetings[0].id !== this.meetingId;
        this.cdr.markForCheck();
      }
    });
  }

  getSectionConfig(key: SectionKey) {
    return SECTION_CONFIGS.find(c => c.section_key === key) ?? null;
  }

  getNotes(section: TeamMeetingSection): string {
    return section.notes?.notes_text ?? '';
  }

  // ── Section collapse ────────────────────────────────────────────────────────
  toggleSection(section: TeamMeetingSection): void {
    section.collapsed = !section.collapsed;
    this.cdr.markForCheck();
    this.svc.updateSectionCollapsed(section.id, section.collapsed).subscribe();
  }

  // ── Bullets ─────────────────────────────────────────────────────────────────
  onBulletInput(event: Event, section: TeamMeetingSection): void {
    const val = (event.target as HTMLInputElement).value;
    this.addInputs[section.id] = val;
    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
      this.atQuery         = val.slice(atIdx + 1).toLowerCase();
      this.pickerSectionId = section.id;
      this.searchInitiatives(this.atQuery);
    } else {
      this.closeInitiativePicker();
    }
  }

  private searchInitiatives(query: string): void {
    if (!this.meeting) return;
    // Search all initiatives referenced in this meeting as a quick-filter.
    // For a full search the component would call list_delivery_cycles via DeliveryService.
    // Phase 1: filter from already-loaded bullet initiatives.
    const seen = new Set<string>();
    const results: InitiativeSearchResult[] = [];
    for (const s of this.meeting.sections) {
      for (const b of s.bullets) {
        if (b.initiative && !seen.has(b.initiative.id)) {
          seen.add(b.initiative.id);
          if (!query || b.initiative.name.toLowerCase().includes(query)) {
            results.push({ id: b.initiative.id, name: b.initiative.name, stage: b.initiative.stage });
          }
        }
      }
    }
    this.initiativeResults = results.slice(0, 8);
    this.cdr.markForCheck();
  }

  closeInitiativePicker(): void {
    this.pickerSectionId   = null;
    this.initiativeResults = [];
    this.atQuery           = '';
    this.cdr.markForCheck();
  }

  selectInitiativeFromPicker(section: TeamMeetingSection, result: InitiativeSearchResult): void {
    this.addInputs[section.id] = result.name;
    this.closeInitiativePicker();
    this.submitBullet(section, result.name, result.id);
  }

  addBulletFromInput(section: TeamMeetingSection): void {
    const text = this.addInputs[section.id]?.trim();
    if (!text || this.addingBulletSectionId === section.id) return;
    this.closeInitiativePicker();
    this.submitBullet(section, text, undefined);
  }

  private submitBullet(section: TeamMeetingSection, text: string, initiativeId?: string): void {
    this.addingBulletSectionId = section.id;
    this.cdr.markForCheck();
    this.svc.addBullet(section.id, text, initiativeId).subscribe({
      next: res => {
        this.addingBulletSectionId = null;
        if (res.success && res.data) {
          section.bullets = [...section.bullets, {
            id:                     res.data.id,
            text:                   res.data.text,
            sort_order:             res.data.sort_order,
            carried_from_bullet_id: res.data.carried_from_bullet_id,
            initiative:             null  // Refreshing on next load is acceptable; initiative already shown by name
          }];
          this.addInputs[section.id] = '';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.addingBulletSectionId = null;
        this.cdr.markForCheck();
      }
    });
  }

  removeBullet(section: TeamMeetingSection, bullet: TeamMeetingBullet): void {
    this.removingBulletId = bullet.id;
    this.cdr.markForCheck();
    this.svc.removeBullet(bullet.id).subscribe({
      next: res => {
        this.removingBulletId = null;
        if (res.success) {
          section.bullets = section.bullets.filter(b => b.id !== bullet.id);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.removingBulletId = null;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Notes auto-save ─────────────────────────────────────────────────────────
  onNotesBlur(section: TeamMeetingSection, event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.svc.updateNotes(section.id, text).subscribe({
      next: res => {
        if (res.success) {
          if (!section.notes) section.notes = { notes_text: text, updated_at: new Date().toISOString(), updated_by_display_name: null };
          else section.notes.notes_text = text;
          this.cdr.markForCheck();
        }
      }
    });
  }

  // ── Carry-forward (Step 6) ───────────────────────────────────────────────────
  initiateCarryForward(bullet: TeamMeetingBullet): void {
    this.carryingBulletId = bullet.id;
    this.carryTarget      = null;
    this.cdr.markForCheck();

    this.svc.listMeetings(5).subscribe({
      next: res => {
        if (!res.success || !res.data) return;
        // Find most recent meeting that is not the one being viewed.
        const candidate = (res.data).find(m => m.id !== this.meetingId);
        if (candidate) {
          this.carryTarget = { id: candidate.id, title: candidate.title };
        }
        this.cdr.markForCheck();
      }
    });
  }

  confirmCarry(bullet: TeamMeetingBullet): void {
    if (!this.carryTarget || this.carryingSaving) return;
    this.carryingSaving = true;
    this.cdr.markForCheck();

    this.svc.carryForwardBullet(bullet.id, this.carryTarget.id).subscribe({
      next: res => {
        this.carryingSaving = false;
        if (res.success) {
          if (!res.data?.bullet?.carried_from_bullet_id) {
            // FK was not set — surface error per D-490 Step 6 critical note.
            alert('Carry-forward failed: carried_from_bullet_id was not set. Please try again.');
          } else {
            this.carriageTargetTitle = this.carryTarget?.title ?? '';
            this.carriedBulletIds.add(bullet.id);
          }
        }
        this.carryingBulletId = null;
        this.carryTarget      = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.carryingSaving   = false;
        this.carryingBulletId = null;
        this.carryTarget      = null;
        this.cdr.markForCheck();
      }
    });
  }

  cancelCarry(): void {
    this.carryingBulletId = null;
    this.carryTarget      = null;
    this.cdr.markForCheck();
  }

  // ── Reference panel → add bullet ────────────────────────────────────────────
  onRefPanelAddBullet(event: { section_id: string; initiative_id: string; initiative_name: string }): void {
    const section = this.meeting?.sections.find(s => s.id === event.section_id);
    if (!section) return;
    // Auto-expand initiatives-gates section if collapsed.
    if (section.collapsed) {
      section.collapsed = false;
      this.svc.updateSectionCollapsed(section.id, false).subscribe();
    }
    this.submitBullet(section, event.initiative_name, event.initiative_id);
  }

  // ── Initiative detail overlay (D-478) ───────────────────────────────────────
  openInitiativeDetail(id: string): void {
    this.selectedInitiativeId = id;
    this.showInitiativePanel  = true;
    this.cdr.markForCheck();
  }

  closeInitiativeDetail(): void {
    this.showInitiativePanel  = false;
    this.selectedInitiativeId = null;
    this.cdr.markForCheck();
  }
}
