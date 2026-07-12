// team-meetings-detail.component.ts — Pathways OI Trust
// Meeting prep/run screen (D-490 Steps 4, 6, 7 + Tracks Phase A+B).
// Route: /team-meetings/:meeting_id
// Two-column layout (≥1024px): 65% sections + 35% reference panel.
// All meetings fully editable by track members. isLatestMeeting controls
// carry-forward visibility and past-meeting banner (scoped to the track).
// Live collaboration: 10s poll via meeting_changed_since; full refetch only on
// change; merge preserves focused textareas so the screen doesn't rewrite.

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }              from '@angular/common';
import { RouterModule, Router,
         ActivatedRoute }            from '@angular/router';
import { FormsModule }               from '@angular/forms';
import { IonicModule }               from '@ionic/angular';
import { TeamMeetingsService }           from '../team-meetings.service';
import { AuthService }                   from '../../../core/services/auth.service';
import { DcsReferencePanelComponent }    from './dcs-reference-panel.component';
import { DeliveryCycleDetailComponent }  from '../../delivery/detail/delivery-cycle-detail.component';
import { TrackSettingsComponent }        from '../tracks/track-settings.component';
import {
  TeamMeeting, TeamMeetingSection, TeamMeetingBullet
} from '../../../core/types/team-meetings';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const POLL_INTERVAL_MS = 10000;

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
    DcsReferencePanelComponent, DeliveryCycleDetailComponent, TrackSettingsComponent
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
      <!-- Past-meeting banner (shown when not the most recently created meeting) -->
      <div *ngIf="!isLatestMeeting" class="tmd-readonly-banner">
        <span>Past meeting — {{ meeting.meeting_date | date:'MMMM d, y' }}</span>
        <a *ngIf="latestMeetingId"
           [routerLink]="['/team-meetings', latestMeetingId]"
           class="tmd-banner-link">
          → Latest meeting
        </a>
        <a *ngIf="!latestMeetingId"
           routerLink="/team-meetings"
           class="tmd-banner-link">
          → All meetings
        </a>
      </div>

      <div class="tmd-shell tmd-wide">
        <!-- Left column: sections (65%) -->
        <div class="tmd-sections-col">
          <div class="tmd-meeting-title-row">
            <div class="tmd-back-row">
              <a [routerLink]="meeting.track ? ['/team-meetings/track', meeting.track.track_id] : ['/team-meetings']"
                 class="tmd-back-link">← {{ meeting.track?.track_name || 'Team Meetings' }}</a>
              <button *ngIf="meeting.track?.is_leader"
                      class="tmd-series-btn" type="button"
                      title="Series settings — sections, members, invites"
                      (click)="showSettings = true">⚙ Series</button>
            </div>
            <!-- Inline title edit -->
            <div *ngIf="!editingTitle" class="tmd-title-display">
              <h1 class="tmd-title">{{ meeting.title }}</h1>
              <button class="tmd-edit-title-btn" type="button"
                      title="Edit title"
                      (click)="startEditTitle()">✎</button>
            </div>
            <div *ngIf="editingTitle" class="tmd-title-edit-row">
              <input class="tmd-title-input"
                     type="text"
                     [(ngModel)]="titleDraft"
                     (keydown.enter)="saveTitle()"
                     (keydown.escape)="cancelEditTitle()"
                     (blur)="saveTitle()"
                     [attr.aria-label]="'Edit meeting title'">
              <span *ngIf="savingTitle" class="tmd-title-saving">Saving…</span>
            </div>
            <span class="tmd-meeting-date">{{ meeting.meeting_date | date:'EEEE, MMMM d, y' }}</span>
            <!-- Pull from last meeting — master (all sections), dedupes automatically -->
            <div *ngIf="previousMeetingId" class="tmd-pull-row">
              <button class="tmd-pull-btn" type="button" [disabled]="pulling" (click)="pullAll()">
                {{ pulling ? 'Pulling…' : '⟲ Pull from last meeting' }}
              </button>
              <span *ngIf="pullResult" class="tmd-pull-result">{{ pullResult }}</span>
              <a [routerLink]="['/team-meetings', previousMeetingId]" class="tmd-prev-meeting-link">
                ← Open last meeting
              </a>
            </div>
          </div>

          <!-- Sections — snapshot title/color from the series template at creation.
               Drop targets for bullet drag & drop. -->
          <div *ngFor="let section of meeting.sections"
               class="tmd-section"
               [class.tmd-section-dragover]="dragOverSectionId === section.id"
               (dragover)="onSectionDragOver($event, section)"
               (dragleave)="dragOverSectionId === section.id && (dragOverSectionId = null)"
               (drop)="onSectionDrop($event, section)">
            <ng-container>
              <!-- Section header (D-308 collapse pattern) -->
              <div class="tmd-section-header"
                   role="button"
                   tabindex="0"
                   (click)="toggleSection(section)"
                   (keydown.enter)="toggleSection(section)"
                   [style.border-left-color]="section.bar_color">
                <div class="tmd-section-header-text">
                  <span class="tmd-section-title">{{ section.title }}</span>
                  <!-- S-015 zone explanation -->
                  <span *ngIf="section.sub_label" class="tmd-section-sublabel">{{ section.sub_label }}</span>
                </div>
                <span class="tmd-section-header-actions">
                  <!-- Subtle per-section pull -->
                  <button *ngIf="previousMeetingId"
                          class="tmd-section-pull-btn"
                          type="button"
                          title="Pull this section's bullets from the last meeting"
                          [disabled]="pullingSectionId === section.id"
                          (click)="pullSection(section, $event)">⟲</button>
                  <span class="tmd-section-chevron">{{ section.collapsed ? '▸' : '▾' }}</span>
                </span>
              </div>

              <div *ngIf="!section.collapsed" class="tmd-section-body">
                <!-- Bullet list -->
                <div class="tmd-bullets">
                  <div *ngIf="section.bullets.length === 0" class="tmd-no-bullets">
                    No items recorded.
                  </div>
                  <div *ngFor="let bullet of section.bullets"
                       class="tmd-bullet-row"
                       [class.tmd-bullet-dragging]="draggingBulletId === bullet.id">
                    <!-- Drag handle = the main row only, so note textareas keep normal text selection -->
                    <div class="tmd-bullet-main-row"
                         draggable="true"
                         (dragstart)="onBulletDragStart($event, section, bullet)"
                         (dragend)="onBulletDragEnd()">
                    <span class="tmd-bullet-dot" [style.background]="section.bar_color"></span>
                    <!-- Contributor initials — Phase D attribution. Hidden on single-member series. -->
                    <span *ngIf="bullet.created_by_display_name && (meeting.track?.member_count ?? 0) > 1"
                          class="tmd-bullet-author"
                          [title]="'Added by ' + bullet.created_by_display_name">{{ initials(bullet.created_by_display_name) }}</span>
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

                    <!-- Assigned person + next gate — right-aligned, any section with an initiative bullet -->
                    <span *ngIf="bullet.initiative && (bullet.initiative.dcs_name || bullet.initiative.next_gate)"
                          class="tmd-bullet-meta">
                      <span *ngIf="bullet.initiative.dcs_name" class="tmd-bullet-dcs">{{ bullet.initiative.dcs_name }}</span>
                      <span *ngIf="bullet.initiative.dcs_name && bullet.initiative.next_gate" class="tmd-bullet-meta-sep">·</span>
                      <span *ngIf="bullet.initiative.next_gate" class="tmd-bullet-gate">{{ bullet.initiative.next_gate.label }}<ng-container *ngIf="bullet.initiative.next_gate.target_date"> &rarr; {{ bullet.initiative.next_gate.target_date | date:'MMM d' }}</ng-container></span>
                    </span>

                    <!-- Carry-forward tap target — available on any past meeting -->
                    <span *ngIf="!isLatestMeeting" class="tmd-carry-btn-wrap">
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
                        <a [routerLink]="meeting.track ? ['/team-meetings/track', meeting.track.track_id] : ['/team-meetings']" class="tmd-link">+ New Meeting</a>
                      </span>
                      <span *ngIf="carriedBulletIds.has(bullet.id)" class="tmd-carried-label">
                        Carried to {{ carriageTargetTitle }}
                      </span>
                    </span>

                    <!-- Remove button -->
                    <button class="tmd-remove-btn"
                            type="button"
                            [disabled]="removingBulletId === bullet.id"
                            [attr.aria-label]="'Remove: ' + bullet.text"
                            (click)="removeBullet(section, bullet)">
                      ×
                    </button>
                    </div><!-- /tmd-bullet-main-row -->
                    <!-- Per-bullet note — inviting tint when empty, white when focused/filled, autogrows -->
                    <textarea class="tmd-bullet-note"
                              [class.tmd-note-filled]="!!bullet.bullet_note"
                              [placeholder]="'Add a note…'"
                              [value]="bullet.bullet_note ?? ''"
                              (focus)="focusedBulletNoteId = bullet.id"
                              (input)="autoGrow($event)"
                              (blur)="focusedBulletNoteId = null; onBulletNoteBlur(bullet, $event)"
                              rows="1">
                    </textarea>
                  </div>
                </div>

                <!-- Add-bullet input -->
                <div class="tmd-add-bullet-row">
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

                <!-- Notes textarea -->
                <div class="tmd-notes-zone">
                  <label class="tmd-notes-label">NOTES / COMMENTS</label>
                  <textarea class="tmd-notes-textarea"
                            placeholder="Capture discussion, decisions, or follow-ups here…"
                            [value]="getNotes(section)"
                            (focus)="focusedNotesSectionId = section.id"
                            (blur)="focusedNotesSectionId = null; onNotesBlur(section, $event)"
                            rows="3">
                  </textarea>
                </div>
              </div><!-- /section-body -->
            </ng-container>
          </div><!-- /section -->
        </div><!-- /sections-col -->

        <!-- Right column: reference panel (person type set per series) -->
        <div class="tmd-ref-col">
          <app-dcs-reference-panel
            [initiativesGatesSectionId]="initiativesGatesSectionId"
            [existingInitiativeIds]="existingInitiativeIds"
            [personType]="meeting.track?.ref_panel_person_type ?? 'dcs'"
            [trackId]="meeting.track?.track_id ?? ''"
            (bulletAdded)="onRefPanelAddBullet($event)"
            (initiativeSelected)="openInitiativeDetail($event)"
            (personTypeChanged)="onPersonTypeChanged($event)">
          </app-dcs-reference-panel>
        </div>
      </div>
    </ng-container>

    <!-- Section chooser — initiative add with no presenter section and no Initiatives & Gates -->
    <div *ngIf="showSectionChooser" class="tmd-overlay-scrim" (click)="cancelSectionChooser()"></div>
    <div *ngIf="showSectionChooser && meeting" class="tmd-chooser">
      <div class="tmd-chooser-title">Which section should {{ pendingAdds.length === 1 ? 'this initiative' : 'these ' + pendingAdds.length + ' initiatives' }} go to?</div>
      <div class="tmd-chooser-hint">No presenter section matches this person and this meeting has no Initiatives and Gates section.</div>
      <button *ngFor="let s of meeting.sections"
              class="tmd-chooser-option" type="button"
              (click)="chooseSectionForPending(s)">
        <span class="tmd-chooser-bar" [style.background]="s.bar_color"></span>{{ s.title }}
      </button>
      <button class="tmd-chooser-cancel" type="button" (click)="cancelSectionChooser()">Cancel</button>
    </div>

    <!-- Series settings panel — leaders: sections (applies to this meeting too), invites, members -->
    <app-track-settings *ngIf="showSettings && meeting?.track"
                        [trackId]="meeting!.track!.track_id"
                        [meetingId]="meeting!.id"
                        [currentUserId]="currentUserId"
                        (close)="onSettingsClosed()"
                        (changed)="loadMeeting()"
                        (deleted)="onTrackDeleted()">
    </app-track-settings>

    <!-- Initiative detail panel overlay — D-478 / reuses app-delivery-cycle-detail panel mode -->
    <div *ngIf="showInitiativePanel" class="tmd-overlay-scrim" (click)="closeInitiativeDetail()"></div>
    <div *ngIf="showInitiativePanel" class="tmd-initiative-overlay">
      <app-delivery-cycle-detail
        *ngIf="selectedInitiativeId"
        [cycleId]="selectedInitiativeId"
        (close)="closeInitiativeDetail()">
      </app-delivery-cycle-detail>
    </div>
  `,
  styles: [`
    .tmd-loading { padding: 48px 32px; color: #757575; font: 14px Roboto; }
    .tmd-full-error { display: flex; align-items: center; gap: 10px; padding: 24px 32px; color: #D32F2F; font: 14px Roboto; }
    .tmd-link-btn { background: none; border: none; color: var(--triarq-color-primary, #257099); cursor: pointer; text-decoration: underline; font-size: 14px; }

    .tmd-readonly-banner { background:#FFF8E1; border-bottom:2px solid #F2A620; padding:10px 24px; display:flex; align-items:center; justify-content:space-between; font:13px Roboto; color:#1A1A1A; }
    .tmd-banner-link { color:var(--triarq-color-primary,#257099); text-decoration:none; font-weight:500; }
    .tmd-shell { display:flex; min-height:calc(100vh - 56px); }
    .tmd-sections-col { flex: 65; min-width: 0; padding: 24px 28px; }
    .tmd-ref-col { flex: 35; min-width: 280px; max-width: 380px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }

    @media (max-width: 1023px) {
      .tmd-shell { flex-direction: column; }
      .tmd-ref-col { max-width: 100%; height: auto; position: relative; }
    }

    .tmd-meeting-title-row { margin-bottom: 20px; }
    .tmd-back-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .tmd-back-link { font: 13px Roboto; color: var(--triarq-color-primary, #257099); text-decoration: none; }
    .tmd-series-btn { background: none; border: 1px solid #BDBDBD; border-radius: 5px; color: #5A5A5A; font: 500 12px Roboto; padding: 4px 10px; cursor: pointer; }
    .tmd-series-btn:hover { border-color: var(--triarq-color-primary, #257099); color: var(--triarq-color-primary, #257099); }
    .tmd-title { font: 600 22px Roboto; color: #1A1A1A; margin: 0 0 4px; }
    .tmd-title-display { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .tmd-title-display .tmd-title { margin: 0; }
    .tmd-edit-title-btn { background: none; border: none; color: #9E9E9E; cursor: pointer; font-size: 15px; padding: 0 2px; }
    .tmd-edit-title-btn:hover,.tmd-prev-meeting-link:hover { color: #257099; }
    .tmd-title-edit-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .tmd-title-input { font: 600 22px Roboto; border: 1px solid #257099; border-radius: 5px; padding: 2px 8px; outline: none; width: 100%; box-sizing: border-box; }
    .tmd-title-saving { font: 12px Roboto; color: #9E9E9E; white-space: nowrap; }
    .tmd-meeting-date { font: italic 13px Roboto; color: #757575; }
    .tmd-prev-meeting-link { display: block; margin-top: 6px; font: 12px Roboto; color: #9E9E9E; text-decoration: none; }
    .tmd-prev-meeting-link:hover { text-decoration: underline; }

    .tmd-section { margin-bottom: 16px; border-radius: 10px; border: 1px solid #E8E8E8; overflow: hidden; }
    .tmd-section-header { display:flex; align-items:flex-start; justify-content:space-between; padding:12px 16px; background:#FAFAFA; border-left:4px solid; cursor:pointer; user-select:none; }
    .tmd-section-header:hover { background: #F5F5F5; }
    .tmd-section-header-text { display: flex; flex-direction: column; gap: 2px; }
    .tmd-section-title { font: 600 14px Roboto; color: #1A1A1A; }
    .tmd-section-sublabel { font: italic 11px Roboto; color: #5A5A5A; }
    .tmd-section-chevron { font-size: 12px; color: #757575; flex-shrink: 0; margin-top: 2px; }

    .tmd-section-body { padding: 12px 16px 8px; }

    .tmd-bullets { margin-bottom: 8px; }
    .tmd-bullet-row {
      display: flex; flex-direction: column;
      padding: 5px 0;
      border-bottom: 1px solid #F5F5F5;
    }
    .tmd-bullet-main-row { display:flex; align-items:center; gap:8px; }
    .tmd-bullet-meta { display:flex; align-items:center; gap:5px; margin-left:auto; flex-shrink:0; white-space:nowrap; }
    .tmd-bullet-dcs  { font:11px Roboto; color:#257099; }
    .tmd-bullet-meta-sep { font:11px Roboto; color:#BDBDBD; }
    .tmd-bullet-gate { font:11px Roboto; color:#757575; }
    /* Bullet note — inviting tint when empty, white + bordered when focused/filled, autogrows */
    .tmd-bullet-note {
      margin:3px 0 2px 14px; width:calc(100% - 14px); box-sizing:border-box;
      border:1px solid #E3EBF0; border-radius:5px;
      background:#F4F7F9; resize:none; outline:none; overflow:hidden;
      font:italic 12px/1.5 Roboto; color:#757575; padding:4px 8px;
      transition:background .15s, border-color .15s;
    }
    .tmd-bullet-note:focus, .tmd-bullet-note.tmd-note-filled {
      background:#fff; border-color:#E0E0E0; color:#1A1A1A;
    }
    .tmd-bullet-note:focus { border-color:var(--triarq-color-primary, #257099); }
    .tmd-bullet-note::placeholder { color:#9FB4C0; }
    .tmd-bullet-note-readonly { margin:2px 0 0 14px; font:italic 12px Roboto; color:#757575;
    }
    .tmd-bullet-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .tmd-bullet-author {
      flex-shrink: 0;
      background: #F0F0F0; color: #757575;
      border-radius: 999px; padding: 1px 6px;
      font: 500 9px Roboto; letter-spacing: 0.04em;
      cursor: default;
    }
    .tmd-initiative-chip {
      font: 500 13px Roboto;
      color: var(--triarq-color-primary, #257099);
      text-decoration: underline;
      cursor: pointer; flex: 1;
    }
    .tmd-bullet-text { font: 13px Roboto; color: #1A1A1A; flex: 1; }
    .tmd-remove-btn { background:none; border:none; color:#9E9E9E; cursor:pointer; font-size:16px; padding:0 4px; line-height:1; flex-shrink:0; }
    .tmd-remove-btn:hover { color:#D32F2F; }
    .tmd-remove-btn:disabled { opacity:.4; cursor:default; }
    .tmd-no-bullets { font: italic 12px Roboto; color: #9E9E9E; padding: 4px 0 8px; }

    .tmd-carry-btn-wrap { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .tmd-carry-btn { background: none; border: none; font: 11px Roboto; color: #9E9E9E; cursor: pointer; white-space: nowrap; }
    .tmd-carry-btn:hover { color: var(--triarq-color-primary, #257099); }
    .tmd-carry-confirm, .tmd-carry-prompt, .tmd-carried-label { font: 11px Roboto; color: #5A5A5A; display: flex; align-items: center; gap: 6px; }
    .tmd-carry-confirm-btn { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 3px; padding: 2px 8px; font: 500 11px Roboto; cursor: pointer; }
    .tmd-carry-cancel-btn { background: none; border: none; color: #9E9E9E; cursor: pointer; font-size: 11px; }
    .tmd-carried-label { color: #4CAF50; }

    .tmd-add-bullet-row { display: flex; gap: 8px; margin-bottom: 8px; position: relative; }
    .tmd-add-input-wrap { flex: 1; position: relative; }
    .tmd-bullet-input {
      width: 100%; border: 1px solid #BDBDBD; border-radius: 5px;
      padding: 6px 10px; font: 13px Roboto;
      outline: none; box-sizing: border-box;
    }
    .tmd-bullet-input:focus { border-color: var(--triarq-color-primary, #257099); }
    .tmd-add-btn { background:var(--triarq-color-primary,#257099); color:#fff; border:none; border-radius:5px; padding:6px 14px; font:500 13px Roboto; cursor:pointer; white-space:nowrap; }
    .tmd-add-btn:disabled { opacity:.5; cursor:default; }
    .tmd-picker-dropdown { position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #E0E0E0; border-radius:5px; box-shadow:0 4px 16px rgba(0,0,0,.1); z-index:50; max-height:200px; overflow-y:auto; }
    .tmd-picker-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; cursor:pointer; }
    .tmd-picker-item:hover { background: #F5F9FC; }
    .tmd-picker-name { font: 13px Roboto; color: #1A1A1A; }
    .tmd-picker-stage { font: 11px Roboto; color: #9E9E9E; text-transform: uppercase; }

    .tmd-notes-zone { margin-top: 8px; }
    .tmd-notes-label { display: block; font: 600 10px Roboto; color: #9E9E9E; letter-spacing: 0.06em; margin-bottom: 4px; }
    .tmd-notes-textarea { width:100%; border:1px solid #E0E0E0; border-radius:5px; padding:8px 10px; font:13px Roboto; resize:vertical; outline:none; box-sizing:border-box; }
    .tmd-notes-textarea:focus { border-color:var(--triarq-color-primary,#257099); }
    .tmd-notes-readonly { font: 13px Roboto; color: #1A1A1A; margin: 0; white-space: pre-wrap; }

    /* Pull from last meeting */
    .tmd-pull-row { display:flex; align-items:center; gap:12px; margin-top:6px; flex-wrap:wrap; }
    .tmd-pull-btn { background:none; border:1px solid var(--triarq-color-primary,#257099); color:var(--triarq-color-primary,#257099); border-radius:5px; padding:3px 12px; font:500 12px Roboto; cursor:pointer; }
    .tmd-pull-btn:disabled { opacity:.6; cursor:default; }
    .tmd-pull-result { font:italic 12px Roboto; color:#4CAF50; }
    .tmd-section-header-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .tmd-section-pull-btn { background:none; border:none; color:#BDBDBD; cursor:pointer; font-size:14px; padding:0 2px; line-height:1; }
    .tmd-section-pull-btn:hover { color:var(--triarq-color-primary,#257099); }
    /* Drag & drop */
    .tmd-bullet-main-row[draggable="true"] { cursor:grab; }
    .tmd-bullet-dragging { opacity:.4; }
    .tmd-section-dragover { outline:2px dashed var(--triarq-color-primary,#257099); outline-offset:-2px; }
    /* Section chooser popover */
    .tmd-chooser {
      position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
      background:#fff; border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,.18);
      z-index:210; padding:18px 20px; width:min(420px, 92vw);
      display:flex; flex-direction:column; gap:6px;
    }
    .tmd-chooser-title { font:600 14px Roboto; color:#1A1A1A; }
    .tmd-chooser-hint { font:italic 11px/1.4 Roboto; color:#757575; margin-bottom:6px; }
    .tmd-chooser-option {
      display:flex; align-items:center; gap:10px;
      background:none; border:1px solid #E0E0E0; border-radius:5px;
      padding:8px 12px; font:13px Roboto; color:#1A1A1A; cursor:pointer; text-align:left;
    }
    .tmd-chooser-option:hover { border-color:var(--triarq-color-primary,#257099); background:#F0F7FB; }
    .tmd-chooser-bar { width:4px; height:16px; border-radius:2px; flex-shrink:0; }
    .tmd-chooser-cancel { background:none; border:none; color:#757575; font:12px Roboto; cursor:pointer; margin-top:4px; align-self:flex-end; }
    .tmd-overlay-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.15); z-index: 200; }
    .tmd-initiative-overlay {
      position: fixed; top: 0; right: 0;
      width: min(860px, 100vw); height: 100vh;
      background: #fff; box-shadow: -4px 0 20px rgba(0,0,0,0.12);
      z-index: 201; overflow-y: auto;
      border-radius: 10px 0 0 10px;
    }
    .tmd-close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #757575; }
  `]
})
export class TeamMeetingsDetailComponent implements OnInit, OnDestroy {
  meeting:   TeamMeeting | null = null;
  loading    = false;
  loadError  = '';
  isLatestMeeting     = true;
  latestMeetingId:    string | null = null;
  previousMeetingId:  string | null = null;

  // Inline title editing.
  editingTitle = false;
  titleDraft   = '';
  savingTitle  = false;

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

  // Series settings panel (leaders).
  showSettings  = false;
  currentUserId = '';

  // Live-collab merge guards — the focused textarea is never rewritten by a poll refresh.
  focusedNotesSectionId: string | null = null;
  focusedBulletNoteId:   string | null = null;

  get initiativesGatesSectionId(): string {
    return this.meeting?.sections.find(s => s.section_key === 'initiatives-gates')?.id ?? '';
  }

  // Initiative IDs already present ANYWHERE in the meeting — presenter routing
  // means initiatives can live in any section, and the panel checkbox reflects
  // "in this meeting", not "in one particular section".
  get existingInitiativeIds(): Set<string> {
    const ids = new Set<string>();
    for (const s of this.meeting?.sections ?? []) {
      for (const b of s.bullets) {
        if (b.initiative?.id) ids.add(b.initiative.id);
      }
    }
    return ids;
  }

  private meetingId = '';
  private destroy$  = new Subject<void>();
  private lastContentStamp: string | null = null;
  private pollInFlight = false;

  constructor(
    private readonly svc:   TeamMeetingsService,
    private readonly auth:  AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr:   ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUser()?.id ?? '';
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.meetingId       = params.get('meeting_id') ?? '';
      this.meeting         = null;
      this.addInputs       = {};
      this.isLatestMeeting = true;
      this.previousMeetingId = null;
      this.lastContentStamp  = null;
      this.loadMeeting();
    });

    // Live-collab poll: cheap timestamp check every 10s; full refetch only on change.
    interval(POLL_INTERVAL_MS).pipe(takeUntil(this.destroy$)).subscribe(() => this.pollForChanges());
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
          this.lastContentStamp = res.data?.content_updated_at ?? null;
          // Init add inputs per section.
          (res.data?.sections ?? []).forEach(s => {
            if (!(s.id in this.addInputs)) this.addInputs[s.id] = '';
          });
          this.determineLatestMeeting();
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

  // ── Polling sync ─────────────────────────────────────────────────────────────
  private pollForChanges(): void {
    if (!this.meeting || this.pollInFlight || this.loading) return;
    this.pollInFlight = true;
    this.svc.meetingChangedSince(this.meetingId, this.lastContentStamp).subscribe({
      next: res => {
        this.pollInFlight = false;
        if (res.success && res.data?.changed) {
          this.refetchAndMerge();
        }
      },
      error: () => { this.pollInFlight = false; }
    });
  }

  private refetchAndMerge(): void {
    this.svc.getMeeting(this.meetingId).subscribe({
      next: res => {
        if (!res.success || !res.data || !this.meeting) return;
        const incoming = res.data;
        this.lastContentStamp = incoming.content_updated_at;

        // Title/date — skip if user editing the title.
        if (!this.editingTitle) {
          this.meeting.title        = incoming.title;
          this.meeting.meeting_date = incoming.meeting_date;
        }
        this.meeting.track = incoming.track;

        // Merge sections in place: only the changed pieces re-render.
        const currentById = new Map(this.meeting.sections.map(s => [s.id, s]));
        const merged: TeamMeetingSection[] = incoming.sections.map(inc => {
          const cur = currentById.get(inc.id);
          if (!cur) {
            // New section (leader added mid-meeting on another screen).
            if (!(inc.id in this.addInputs)) this.addInputs[inc.id] = '';
            return inc;
          }
          cur.title      = inc.title;
          cur.sub_label  = inc.sub_label;
          cur.bar_color  = inc.bar_color;
          cur.sort_order = inc.sort_order;
          cur.collapsed  = inc.collapsed;
          // Bullets: preserve object identity for the bullet whose note is being edited.
          cur.bullets = inc.bullets.map(ib => {
            if (ib.id === this.focusedBulletNoteId) {
              const existing = cur.bullets.find(b => b.id === ib.id);
              return existing ?? ib;
            }
            return ib;
          });
          // Notes: never rewrite the textarea the user is typing in.
          if (cur.id !== this.focusedNotesSectionId) {
            cur.notes = inc.notes;
          }
          return cur;
        });
        this.meeting.sections = merged;
        this.cdr.markForCheck();
      }
    });
  }

  private determineLatestMeeting(): void {
    const trackId = this.meeting?.track?.track_id;
    if (!trackId) return;
    this.svc.listMeetings(trackId, 3).subscribe({
      next: res => {
        if (!res.success || !res.data?.length) return;
        const meetings = res.data; // sorted by created_at DESC
        this.latestMeetingId  = meetings[0].id;
        this.isLatestMeeting  = meetings[0].id === this.meetingId;
        // On the latest meeting: show link to the previous one so user can carry bullets forward.
        if (this.isLatestMeeting && meetings.length > 1) {
          this.previousMeetingId = meetings[1].id;
        }
        this.cdr.markForCheck();
      }
    });
  }

  getNotes(section: TeamMeetingSection): string {
    return section.notes?.notes_text ?? '';
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
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

  private submitBullet(section: TeamMeetingSection, text: string, initiativeId?: string, initiativeName?: string): void {
    this.addingBulletSectionId = section.id;
    this.cdr.markForCheck();
    this.svc.addBullet(section.id, text, initiativeId).subscribe({
      next: res => {
        this.addingBulletSectionId = null;
        if (res.success && res.data) {
          section.bullets = [...section.bullets, {
            id:                     res.data.id,
            text:                   res.data.text,
            bullet_note:            null,
            sort_order:             res.data.sort_order,
            carried_from_bullet_id: res.data.carried_from_bullet_id,
            created_by_display_name: null,
            initiative:             initiativeId && initiativeName
                                      ? { id: initiativeId, name: initiativeName, stage: '', gate_status: '', dcs_name: null, next_gate: null }
                                      : null
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

  // ── Notes auto-save (optimistic concurrency — reload-or-overwrite on conflict) ─
  onNotesBlur(section: TeamMeetingSection, event: Event): void {
    const el   = event.target as HTMLTextAreaElement;
    const text = el.value;
    if (text === (section.notes?.notes_text ?? '')) return; // no change
    this.saveNotes(section, text, false);
  }

  private saveNotes(section: TeamMeetingSection, text: string, force: boolean): void {
    this.svc.updateNotes(section.id, text, section.notes?.updated_at, force).subscribe({
      next: res => {
        if (res.success && res.data) {
          section.notes = {
            notes_text:              text,
            updated_at:              (res.data as { updated_at?: string }).updated_at ?? new Date().toISOString(),
            updated_by_display_name: null
          };
          this.cdr.markForCheck();
        } else if ((res as { conflict?: boolean }).conflict) {
          const serverText = (res.data as unknown as { server_notes_text?: string })?.server_notes_text ?? '';
          const overwrite = window.confirm(
            `${res.error}\n\nOK = keep YOUR version (overwrites theirs).\nCancel = load THEIR version (your edit is discarded).`
          );
          if (overwrite) {
            this.saveNotes(section, text, true);
          } else {
            section.notes = {
              notes_text:              serverText,
              updated_at:              (res.data as unknown as { server_updated_at?: string })?.server_updated_at ?? new Date().toISOString(),
              updated_by_display_name: (res.data as unknown as { editor?: string })?.editor ?? null
            };
            this.cdr.markForCheck();
          }
        }
      }
    });
  }

  onBulletNoteBlur(bullet: TeamMeetingBullet, event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    const trimmed = text.trim();
    if (trimmed === (bullet.bullet_note ?? '')) return; // no change
    this.svc.updateBulletNote(bullet.id, trimmed).subscribe({
      next: res => {
        if (res.success) {
          bullet.bullet_note = trimmed || null;
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

    const trackId = this.meeting?.track?.track_id ?? '';
    this.svc.listMeetings(trackId, 5).subscribe({
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

  // ── Title editing (fix 3) ───────────────────────────────────────────────────
  startEditTitle(): void {
    if (!this.meeting) return;
    this.titleDraft  = this.meeting.title;
    this.editingTitle = true;
    this.cdr.markForCheck();
  }

  saveTitle(): void {
    if (!this.meeting || this.savingTitle) return;
    const trimmed = this.titleDraft.trim();
    if (!trimmed || trimmed === this.meeting.title) {
      this.editingTitle = false;
      this.cdr.markForCheck();
      return;
    }
    this.savingTitle = true;
    this.cdr.markForCheck();
    this.svc.updateMeeting(this.meeting.id, trimmed).subscribe({
      next: res => {
        this.savingTitle  = false;
        this.editingTitle = false;
        if (res.success && this.meeting) this.meeting.title = trimmed;
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingTitle  = false;
        this.editingTitle = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelEditTitle(): void {
    this.editingTitle = false;
    this.cdr.markForCheck();
  }

  // ── Reference panel → add bullet (presenter-section routing, 2026-07-12) ─────
  // Route by the person whose row was clicked: their presenter section →
  // else Initiatives and Gates → else ask which section (popover).
  onRefPanelAddBullet(event: { section_id: string; initiative_id: string; initiative_name: string; person_id: string }): void {
    if (!this.meeting) return;
    const target =
      this.meeting.sections.find(s => s.presenter_user_id === event.person_id) ??
      this.meeting.sections.find(s => s.section_key === 'initiatives-gates');

    if (!target) {
      // No obvious home — queue and ask. Add All queues several; one answer places all.
      this.pendingAdds.push({ initiative_id: event.initiative_id, initiative_name: event.initiative_name });
      this.showSectionChooser = true;
      this.cdr.markForCheck();
      return;
    }
    this.addToSection(target, event.initiative_id, event.initiative_name);
  }

  private addToSection(section: TeamMeetingSection, initiativeId: string, initiativeName: string): void {
    if (section.collapsed) {
      section.collapsed = false;
      this.svc.updateSectionCollapsed(section.id, false).subscribe();
    }
    this.submitBullet(section, initiativeName, initiativeId, initiativeName);
  }

  // Section chooser popover state.
  pendingAdds: { initiative_id: string; initiative_name: string }[] = [];
  showSectionChooser = false;

  chooseSectionForPending(section: TeamMeetingSection): void {
    const pending = [...this.pendingAdds];
    this.pendingAdds = [];
    this.showSectionChooser = false;
    pending.forEach(p => this.addToSection(section, p.initiative_id, p.initiative_name));
    this.cdr.markForCheck();
  }

  cancelSectionChooser(): void {
    this.pendingAdds = [];
    this.showSectionChooser = false;
    this.cdr.markForCheck();
  }

  // ── Drag & drop bullets between sections (desktop, HTML5) ────────────────────
  draggingBulletId: string | null = null;
  private dragSourceSectionId: string | null = null;
  dragOverSectionId: string | null = null;

  onBulletDragStart(event: DragEvent, section: TeamMeetingSection, bullet: TeamMeetingBullet): void {
    this.draggingBulletId    = bullet.id;
    this.dragSourceSectionId = section.id;
    event.dataTransfer?.setData('text/plain', bullet.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onBulletDragEnd(): void {
    this.draggingBulletId    = null;
    this.dragSourceSectionId = null;
    this.dragOverSectionId   = null;
    this.cdr.markForCheck();
  }

  onSectionDragOver(event: DragEvent, section: TeamMeetingSection): void {
    if (!this.draggingBulletId || section.id === this.dragSourceSectionId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this.dragOverSectionId !== section.id) {
      this.dragOverSectionId = section.id;
      this.cdr.markForCheck();
    }
  }

  onSectionDrop(event: DragEvent, target: TeamMeetingSection): void {
    event.preventDefault();
    const bulletId = this.draggingBulletId;
    const sourceId = this.dragSourceSectionId;
    this.onBulletDragEnd();
    if (!bulletId || !sourceId || sourceId === target.id || !this.meeting) return;

    const source = this.meeting.sections.find(s => s.id === sourceId);
    const bullet = source?.bullets.find(b => b.id === bulletId);
    if (!source || !bullet) return;

    // Optimistic move; server confirms (poll corrects on failure).
    source.bullets  = source.bullets.filter(b => b.id !== bulletId);
    target.bullets  = [...target.bullets, bullet];
    if (target.collapsed) {
      target.collapsed = false;
      this.svc.updateSectionCollapsed(target.id, false).subscribe();
    }
    this.cdr.markForCheck();
    this.svc.moveBullet(bulletId, target.id).subscribe({
      next: res => { if (!res.success) this.refetchAndMerge(); },
      error: () => this.refetchAndMerge()
    });
  }

  // ── Pull from last meeting ────────────────────────────────────────────────────
  pulling = false;
  pullingSectionId: string | null = null;
  pullResult = '';

  pullAll(): void {
    if (!this.meeting || this.pulling) return;
    this.pulling    = true;
    this.pullResult = '';
    this.cdr.markForCheck();
    this.svc.pullFromLastMeeting(this.meeting.id).subscribe({
      next: res => {
        this.pulling = false;
        if (res.success && res.data) {
          this.pullResult = res.data.no_previous
            ? 'No earlier meeting in this series.'
            : `Pulled ${res.data.pulled} item${res.data.pulled === 1 ? '' : 's'}${res.data.skipped ? ` · ${res.data.skipped} skipped as duplicates` : ''}.`;
          if (res.data.pulled) this.refetchAndMerge();
        } else {
          this.pullResult = res.error ?? 'Pull failed.';
        }
        this.cdr.markForCheck();
      },
      error: () => { this.pulling = false; this.pullResult = 'Pull failed.'; this.cdr.markForCheck(); }
    });
  }

  pullSection(section: TeamMeetingSection, event: Event): void {
    event.stopPropagation();
    if (!this.meeting || this.pullingSectionId) return;
    this.pullingSectionId = section.id;
    this.cdr.markForCheck();
    this.svc.pullFromLastMeeting(this.meeting.id, section.id).subscribe({
      next: res => {
        this.pullingSectionId = null;
        if (res.success && res.data?.pulled) this.refetchAndMerge();
        this.cdr.markForCheck();
      },
      error: () => { this.pullingSectionId = null; this.cdr.markForCheck(); }
    });
  }

  // ── Bullet note autogrow ──────────────────────────────────────────────────────
  autoGrow(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
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

  // ── Reference panel person type ──────────────────────────────────────────────
  // Anyone switches live (local only). A leader's choice persists to the series
  // so it carries forward to the next meeting. Default: dcs.
  onPersonTypeChanged(pt: 'dcs' | 'dol' | 'epo'): void {
    const track = this.meeting?.track;
    if (!track?.is_leader || track.ref_panel_person_type === pt) return;
    this.svc.updateTrack(track.track_id, { ref_panel_person_type: pt }).subscribe({
      next: res => { if (res.success && this.meeting?.track) this.meeting.track.ref_panel_person_type = pt; }
    });
  }

  // ── Series settings panel ────────────────────────────────────────────────────
  onSettingsClosed(): void {
    this.showSettings = false;
    // Sections may have been added/removed against this meeting — refresh.
    this.refetchAndMerge();
    this.cdr.markForCheck();
  }

  onTrackDeleted(): void {
    this.showSettings = false;
    this.router.navigate(['/team-meetings']);
  }
}
