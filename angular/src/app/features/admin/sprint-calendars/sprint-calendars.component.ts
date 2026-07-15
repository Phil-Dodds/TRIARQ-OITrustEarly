// sprint-calendars.component.ts — Admin Sprint Calendars screen
// Route: /admin/sprint-calendars
// Spec: Contract 37 §4.1 (D-549, D-550). Decision authority: D-140, D-183, D-547.
//
// Single responsibility (S-030): manage sprint calendars — list calendars,
// edit each calendar's sprint grid (add / edit / delete rows), create and
// delete calendars. Division assignment lives on the Divisions admin screen.
//
// Patterns applied:
//   Arch-1      — all DB access via SprintCalendarService → delivery-cycle-mcp.
//   D-140       — blocked-action UX (non-admin; calendar delete while referenced).
//   D-183       — two-step confirms: calendar delete, sprint delete, and the
//                 sprint-date-change recompute (server two-call pattern with
//                 affected-initiative count, spec §6.3).
//   D-549       — sprint ids are TEXT ('2026.10' keeps its zero); rows ordered
//                 by start_date, never by sprint_id.
//   S-001       — title + purpose description + clear next action.
//   S-028       — Context A busy labels on all MCP-calling buttons; Context B
//                 skeleton rows during load.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { RouterModule }  from '@angular/router';
import { IonicModule }   from '@ionic/angular';
import { filter, take, Subscription } from 'rxjs';

import { SprintCalendarService, UpsertSprintsResult } from '../../../core/services/sprint-calendar.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { SprintCalendar, SprintRow } from '../../../core/types/database';

interface SprintRowEdit extends SprintRow {
  delete_confirming?: boolean;
  deleting?: boolean;
}

@Component({
  selector: 'app-sprint-calendars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, IonicModule],
  template: `
    <div class="scal-shell">

      <a routerLink="/admin" class="scal-back-link">← Administration</a>

      <div class="scal-header">
        <div class="scal-header-row">
          <h3 class="scal-title">Sprint Calendars</h3>
          <button *ngIf="!showCreate" type="button" class="scal-primary-btn"
                  (click)="showCreate = true">+ New Calendar</button>
        </div>
        <p class="scal-subtitle">
          Sprint calendars let teams set Gate target dates by sprint instead of picking
          raw dates. Assign a calendar to a Division on the Divisions screen — child
          Divisions inherit it. Editing sprint dates recomputes rule-based Gate targets
          for Initiatives on that calendar, behind a confirmation.
        </p>
      </div>

      <!-- Blocked state — non-admin (D-140) -->
      <div *ngIf="blockedReason" class="scal-blocked">
        <div class="scal-blocked-primary">Sprint Calendar management is restricted.</div>
        <div class="scal-blocked-secondary">{{ blockedReason }}</div>
      </div>

      <ng-container *ngIf="!blockedReason">

        <!-- Create calendar (inline) -->
        <div *ngIf="showCreate" class="scal-create-row">
          <input [(ngModel)]="newCalendarName" class="scal-input" placeholder="Calendar name — e.g. TRIARQ Standard 2027"
                 style="flex:1;" maxlength="120" />
          <button type="button" class="scal-primary-btn" [disabled]="creating || !newCalendarName.trim()"
                  (click)="createCalendar()">{{ creating ? 'Creating…' : 'Create' }}</button>
          <button type="button" class="scal-ghost-btn" [disabled]="creating"
                  (click)="showCreate = false; newCalendarName = ''; createError = '';">Cancel</button>
        </div>
        <div *ngIf="createError" class="scal-error-text">{{ createError }}</div>

        <div *ngIf="loadError && !loading" class="scal-error">
          <div class="scal-error-primary">Sprint Calendars could not load.</div>
          <div class="scal-error-secondary">{{ loadError }}</div>
        </div>

        <!-- Column headers -->
        <div class="scal-grid scal-grid-header">
          <span>Calendar Name</span>
          <span class="num">Sprints</span>
          <span class="num">Divisions Using</span>
          <span>Active</span>
          <span></span>
        </div>

        <!-- Skeleton (S-028 Context B) -->
        <div *ngIf="loading">
          <div *ngFor="let _ of [1,2]" class="scal-grid scal-grid-row">
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;border-radius:4px;"></ion-skeleton-text>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && !loadError && calendars.length === 0" class="scal-empty">
          <div class="scal-empty-primary">No Sprint Calendars yet.</div>
          <div class="scal-empty-secondary">Create one with "+ New Calendar", add its sprints, then assign it to Divisions on the Divisions screen.</div>
        </div>

        <!-- Calendar rows -->
        <ng-container *ngIf="!loading && !loadError">
          <div *ngFor="let c of calendars; trackBy: trackByCalendarId">
            <div class="scal-grid scal-grid-row scal-row-click" (click)="toggleCalendar(c)">
              <span class="scal-cal-name">{{ c.calendar_name }} <span class="scal-caret">{{ expandedCalendarId === c.id ? '▾' : '▸' }}</span></span>
              <span class="num">{{ c.sprint_count ?? 0 }}</span>
              <span class="num">{{ c.divisions_using ?? 0 }}</span>
              <span (click)="$event.stopPropagation()">
                <label class="scal-active-toggle">
                  <input type="checkbox" [checked]="c.active_status"
                         [disabled]="togglingActiveId === c.id"
                         (change)="toggleActive(c)" />
                  {{ togglingActiveId === c.id ? 'Saving…' : (c.active_status ? 'Active' : 'Inactive') }}
                </label>
              </span>
              <span (click)="$event.stopPropagation()" class="scal-delete-cell">
                <a *ngIf="deleteConfirmingId !== c.id" class="scal-delete-link" (click)="deleteConfirmingId = c.id">Delete</a>
                <span *ngIf="deleteConfirmingId === c.id" class="scal-row-confirm">
                  Delete "{{ c.calendar_name }}"? Divisions must be unassigned first.
                  <button type="button" class="scal-primary-btn" [disabled]="deletingId === c.id"
                          (click)="deleteCalendar(c)">{{ deletingId === c.id ? 'Deleting…' : 'Confirm' }}</button>
                  <button type="button" class="scal-ghost-btn" [disabled]="deletingId === c.id"
                          (click)="deleteConfirmingId = null; deleteError = '';">Cancel</button>
                </span>
              </span>
            </div>
            <div *ngIf="deleteError && deleteConfirmingId === c.id" class="scal-error-text">{{ deleteError }}</div>

            <!-- Sprint grid editor (spec §4.1) -->
            <div *ngIf="expandedCalendarId === c.id" class="scal-sprint-editor">
              <div *ngIf="sprintsLoading" style="padding:8px;">
                <ion-skeleton-text animated style="height:14px;border-radius:4px;width:60%;"></ion-skeleton-text>
              </div>
              <ng-container *ngIf="!sprintsLoading">
                <div class="scal-sprint-grid scal-sprint-header">
                  <span>Sprint ID</span><span>Start</span><span>End</span><span></span>
                </div>
                <div *ngFor="let s of sprintEdits; let i = index" class="scal-sprint-grid scal-sprint-row">
                  <input [(ngModel)]="s.sprint_id" class="scal-input" placeholder="2026.01" />
                  <input [(ngModel)]="s.start_date" type="date" class="scal-input" />
                  <input [(ngModel)]="s.end_date" type="date" class="scal-input" />
                  <span>
                    <ng-container *ngIf="s.id; else unsavedRemove">
                      <a *ngIf="!s.delete_confirming" class="scal-delete-link" (click)="s.delete_confirming = true">Delete</a>
                      <span *ngIf="s.delete_confirming" class="scal-row-confirm">
                        Delete sprint {{ s.sprint_id }}? Gate rules using it keep their dates but are flagged stale.
                        <button type="button" class="scal-primary-btn" [disabled]="s.deleting"
                                (click)="deleteSprint(c, s)">{{ s.deleting ? 'Deleting…' : 'Confirm' }}</button>
                        <button type="button" class="scal-ghost-btn" [disabled]="s.deleting"
                                (click)="s.delete_confirming = false">Cancel</button>
                      </span>
                    </ng-container>
                    <ng-template #unsavedRemove>
                      <a class="scal-delete-link" (click)="removeUnsavedRow(i)">Remove</a>
                    </ng-template>
                  </span>
                </div>

                <div class="scal-sprint-actions">
                  <button type="button" class="scal-ghost-btn" (click)="addSprintRow()">+ Add Sprint</button>
                  <button type="button" class="scal-primary-btn" [disabled]="savingSprints || sprintEdits.length === 0"
                          (click)="saveSprints(c, false)">{{ savingSprints ? 'Saving…' : 'Save Sprints' }}</button>
                </div>

                <!-- §6.3 / D-183: sprint-date-change recompute confirmation (server two-call). -->
                <div *ngIf="recomputeConfirm" class="scal-warn-box">
                  <div style="margin-bottom:6px;">
                    Changing dates on sprint(s) {{ recomputeConfirm.changed_sprints?.join(', ') }} recomputes
                    rule-based Gate targets on {{ recomputeConfirm.affected_initiative_count }} Initiative(s)
                    whose effective calendar is this one. Proceed?
                  </div>
                  <button type="button" class="scal-primary-btn" [disabled]="savingSprints"
                          (click)="saveSprints(c, true)">{{ savingSprints ? 'Saving…' : 'Confirm — save and recompute' }}</button>
                  <button type="button" class="scal-ghost-btn" [disabled]="savingSprints"
                          (click)="recomputeConfirm = null">Cancel</button>
                </div>

                <!-- Overlap warnings — warn, not block (spec §4.1). -->
                <div *ngFor="let w of sprintWarnings" class="scal-warn-box" style="margin-top:4px;">⚠ {{ w }}</div>
                <div *ngIf="sprintError" class="scal-error-text">{{ sprintError }}</div>
              </ng-container>
            </div>
          </div>
        </ng-container>

      </ng-container>
    </div>
  `,
  styles: [`
    .scal-shell { max-width: 1000px; margin: var(--triarq-space-2xl) auto; padding: 0 var(--triarq-space-md); }
    .scal-back-link { font-size: var(--triarq-text-small); color: var(--triarq-color-primary); text-decoration: none; }
    .scal-header { margin-bottom: var(--triarq-space-md); }
    .scal-header-row { display: flex; align-items: center; justify-content: space-between; gap: var(--triarq-space-md); margin: 8px 0 4px 0; }
    .scal-title { margin: 0; }
    .scal-subtitle { margin: 4px 0 12px 0; font-size: 11px; font-style: italic; color: #5A5A5A; max-width: 720px; line-height: 1.6; }
    .scal-primary-btn { background: var(--triarq-color-primary, #257099); color: #fff; border: none; border-radius: 5px; padding: 6px 14px; font-size: var(--triarq-text-small); cursor: pointer; }
    .scal-primary-btn:disabled { opacity: 0.6; cursor: wait; }
    .scal-ghost-btn { background: transparent; color: var(--triarq-color-text-secondary); border: 1px solid var(--triarq-color-border, #ccc); border-radius: 5px; padding: 5px 12px; font-size: 12px; cursor: pointer; }
    .scal-create-row { display: flex; gap: 8px; margin-bottom: var(--triarq-space-sm); }
    .scal-input { padding: 5px 8px; border: 1px solid var(--triarq-color-border, #ccc); border-radius: 5px; font-size: var(--triarq-text-small); }
    .scal-input:focus { outline: none; border-color: var(--triarq-color-primary, #257099); }
    .scal-grid { display: grid; grid-template-columns: 2.2fr 90px 130px 120px 1.6fr; gap: var(--triarq-space-sm); padding: var(--triarq-space-xs) var(--triarq-space-sm); align-items: center; }
    .scal-grid-header { font-size: var(--triarq-text-small); font-weight: 500; color: var(--triarq-color-text-secondary); border-bottom: 2px solid var(--triarq-color-border); }
    .scal-grid-row { border-bottom: 1px solid var(--triarq-color-border); font-size: var(--triarq-text-small); min-height: 44px; }
    .scal-row-click { cursor: pointer; }
    .scal-row-click:hover { background: rgba(37,112,153,0.04); }
    .scal-cal-name { font-weight: 500; color: var(--triarq-color-text-primary); }
    .scal-caret { color: var(--triarq-color-text-secondary); font-size: 10px; }
    .num { text-align: center; }
    .scal-active-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
    .scal-delete-cell { text-align: right; }
    .scal-delete-link { font-size: 11px; color: var(--triarq-color-stone, #5A5A5A); cursor: pointer; text-decoration: underline; }
    .scal-delete-link:hover { color: var(--triarq-color-error, #c0392b); }
    .scal-row-confirm { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 5px; padding: 4px 8px; flex-wrap: wrap; }
    .scal-sprint-editor { margin: 0 0 var(--triarq-space-md) var(--triarq-space-lg); padding: var(--triarq-space-sm); border-left: 3px solid var(--triarq-color-border); background: rgba(0,0,0,0.015); border-radius: 0 5px 5px 0; }
    .scal-sprint-grid { display: grid; grid-template-columns: 140px 170px 170px 1fr; gap: 8px; align-items: center; padding: 3px 0; }
    .scal-sprint-header { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--triarq-color-text-secondary); }
    .scal-sprint-actions { display: flex; gap: 8px; margin-top: 8px; }
    .scal-warn-box { background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 0 5px 5px 0; padding: 8px 10px; font-size: 11px; margin-top: 8px; }
    .scal-error-text { font-size: 11px; color: var(--triarq-color-error, #c0392b); margin: 4px 0; }
    .scal-empty { padding: var(--triarq-space-xl); text-align: center; }
    .scal-empty-primary { font-size: var(--triarq-text-body); color: var(--triarq-color-text-primary); margin-bottom: 4px; }
    .scal-empty-secondary, .scal-error-secondary, .scal-blocked-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
    .scal-error { padding: var(--triarq-space-md); max-width: 560px; }
    .scal-error-primary { color: var(--triarq-color-error); font-weight: 500; margin-bottom: 4px; }
    .scal-blocked { max-width: 560px; padding: var(--triarq-space-md); background: rgba(245,166,35,0.08); border-left: 3px solid var(--triarq-color-sunray, #f5a623); border-radius: 5px; }
    .scal-blocked-primary { font-weight: 500; color: var(--triarq-color-text-primary); margin-bottom: 4px; }
  `]
})
export class SprintCalendarsComponent implements OnInit {

  loading       = false;
  loadError     = '';
  blockedReason = '';

  calendars: SprintCalendar[] = [];

  showCreate      = false;
  creating        = false;
  newCalendarName = '';
  createError     = '';

  togglingActiveId:   string | null = null;
  deleteConfirmingId: string | null = null;
  deletingId:         string | null = null;
  deleteError         = '';

  expandedCalendarId: string | null = null;
  sprintsLoading = false;
  sprintEdits: SprintRowEdit[] = [];
  savingSprints  = false;
  sprintError    = '';
  sprintWarnings: string[] = [];
  recomputeConfirm: UpsertSprintsResult | null = null;

  private readonly subs = new Subscription();

  constructor(
    private readonly calendarService: SprintCalendarService,
    private readonly profile: UserProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(profile => {
        if (profile.is_admin !== true) {
          this.blockedReason =
            'You need Admin role to manage Sprint Calendars. ' +
            'Contact your System Admin if you need access to this screen.';
          this.cdr.markForCheck();
          return;
        }
        this.loadCalendars();
      })
    );
  }

  // ── Calendars ───────────────────────────────────────────────────────────────

  private loadCalendars(): void {
    this.loading = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.calendarService.listSprintCalendars().subscribe({
      next: (res) => {
        if (res.success && res.data) { this.calendars = res.data; }
        else { this.loadError = res.error ?? 'Unable to reach the server. Check your connection and try again.'; }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Unable to reach the server. Check your connection and try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  createCalendar(): void {
    const name = this.newCalendarName.trim();
    if (!name) { return; }
    this.creating = true;
    this.createError = '';
    this.cdr.markForCheck();
    this.calendarService.createSprintCalendar(name).subscribe({
      next: (res) => {
        this.creating = false;
        if (res.success) {
          this.showCreate = false;
          this.newCalendarName = '';
          this.loadCalendars();
        } else {
          this.createError = res.error ?? 'Could not create the calendar. Try again.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.creating = false;
        this.createError = err?.error ?? 'Could not create the calendar. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  toggleActive(c: SprintCalendar): void {
    this.togglingActiveId = c.id;
    this.cdr.markForCheck();
    this.calendarService.updateSprintCalendar(c.id, { active_status: !c.active_status }).subscribe({
      next: (res) => {
        this.togglingActiveId = null;
        if (res.success && res.data) { c.active_status = res.data.active_status; }
        this.cdr.markForCheck();
      },
      error: () => { this.togglingActiveId = null; this.cdr.markForCheck(); }
    });
  }

  deleteCalendar(c: SprintCalendar): void {
    this.deletingId = c.id;
    this.deleteError = '';
    this.cdr.markForCheck();
    this.calendarService.deleteSprintCalendar(c.id).subscribe({
      next: (res) => {
        this.deletingId = null;
        if (res.success) {
          this.deleteConfirmingId = null;
          if (this.expandedCalendarId === c.id) { this.expandedCalendarId = null; }
          this.loadCalendars();
        } else {
          // D-140: server message names what blocks it and what unblocks it.
          this.deleteError = res.error ?? 'Delete failed.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.deletingId = null;
        this.deleteError = err?.error ?? 'Delete failed.';
        this.cdr.markForCheck();
      }
    });
  }

  // ── Sprint grid editor ─────────────────────────────────────────────────────

  toggleCalendar(c: SprintCalendar): void {
    if (this.expandedCalendarId === c.id) {
      this.expandedCalendarId = null;
      this.cdr.markForCheck();
      return;
    }
    this.expandedCalendarId = c.id;
    this.recomputeConfirm = null;
    this.sprintError = '';
    this.sprintWarnings = [];
    this.loadSprints(c.id);
  }

  private loadSprints(calendarId: string): void {
    this.sprintsLoading = true;
    this.cdr.markForCheck();
    this.calendarService.listSprints(calendarId).subscribe({
      next: (res) => {
        this.sprintEdits = res.success && res.data ? res.data.map(s => ({ ...s })) : [];
        this.sprintsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.sprintEdits = [];
        this.sprintsLoading = false;
        this.sprintError = 'Sprints could not load. Try again.';
        this.cdr.markForCheck();
      }
    });
  }

  addSprintRow(): void {
    this.sprintEdits = [...this.sprintEdits, { sprint_id: '', start_date: '', end_date: '' }];
    this.cdr.markForCheck();
  }

  removeUnsavedRow(index: number): void {
    this.sprintEdits = this.sprintEdits.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  saveSprints(c: SprintCalendar, confirmed: boolean): void {
    const rows = this.sprintEdits
      .filter(s => s.sprint_id.trim() || s.start_date || s.end_date)
      .map(s => ({ id: s.id, sprint_id: s.sprint_id.trim(), start_date: s.start_date, end_date: s.end_date }));
    if (rows.length === 0) { return; }
    this.savingSprints = true;
    this.sprintError = '';
    this.sprintWarnings = [];
    this.cdr.markForCheck();
    this.calendarService.upsertSprints(c.id, rows, confirmed).subscribe({
      next: (res) => {
        this.savingSprints = false;
        if (!res.success || !res.data) {
          this.sprintError = res.error ?? 'Save failed.';
          this.cdr.markForCheck();
          return;
        }
        if (res.data.requires_confirmation) {
          // §6.3 / D-183: second call commits + recomputes.
          this.recomputeConfirm = res.data;
          this.cdr.markForCheck();
          return;
        }
        this.recomputeConfirm = null;
        this.sprintWarnings = res.data.warnings ?? [];
        this.sprintEdits = (res.data.sprints ?? []).map(s => ({ ...s }));
        this.loadCalendars(); // refresh sprint counts
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.savingSprints = false;
        this.sprintError = err?.error ?? 'Save failed.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteSprint(c: SprintCalendar, s: SprintRowEdit): void {
    if (!s.id) { return; }
    s.deleting = true;
    this.cdr.markForCheck();
    this.calendarService.deleteSprint(s.id).subscribe({
      next: (res) => {
        s.deleting = false;
        if (res.success) {
          this.sprintEdits = this.sprintEdits.filter(x => x.id !== s.id);
          this.loadCalendars();
        } else {
          this.sprintError = res.error ?? 'Delete failed.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        s.deleting = false;
        this.sprintError = err?.error ?? 'Delete failed.';
        this.cdr.markForCheck();
      }
    });
  }

  trackByCalendarId(_: number, c: SprintCalendar): string {
    return c.id;
  }
}
