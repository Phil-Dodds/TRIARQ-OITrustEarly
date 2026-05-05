// delivery-cycle-edit-panel.component.ts — Pathways OI Trust
// Responsible for: mutable field editing of a Delivery Cycle (8 fields per spec).
// NOT responsible for: gate approval, stage advancement, artifact operations,
//   destructive actions (Cancel/Un-cancel) — those live in delivery-cycle-detail.component.ts.
//   Per D-226 (Responsibility Declaration).
//
// Trigger: Edit Cycle action in View pushes this panel onto the navigation stack per S-006.
// Save: calls update_delivery_cycle (CC-Decision-2026-04-10-D), logs field_edit events (D-229).
// Cancel: emits cancelled event — no save, no re-query.
//
// Contract 9 changes:
//   B-23: ep-overlay overflow:hidden removed — sticky header now works against outer scroll container.
//   B-24: Required indicators removed from Division and Tier in Edit — required at creation only (D-165).
//   B-25: Division change no longer auto-clears Workstream. Shows amber inline warning instead (D-297).
//   B-26: DS and CB replaced with UserPickerComponent (D-182). Select elements removed.
//   B-22: isTrustLevelDivision getter added; passed to WorkstreamPickerComponent (D-206).
//   B-17: Constraint violation error messages replaced with user-friendly text.
//
// Division change behavior (spec Section 2.4):
//   - Re-scopes WorkstreamPickerComponent to new Division.
//   - B-25: Does NOT clear Workstream — shows amber warning if WS is from a different Division.
//   - Approver comparison stubbed — get_division_gate_approvers not yet built (CC-Decision-2026-04-10-E).
//
// D-228: Amber non-blocking warning when Tier changes on a cycle with existing gate records.
// D-207: QPathways design tokens throughout.
// D-93: No direct Supabase access — DeliveryService → MCP only.
// ChangeDetection: OnPush.

import {
  Component, OnInit, OnDestroy, OnChanges, SimpleChanges,
  AfterViewInit,
  Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef, HostListener,
  ElementRef, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import { CommonModule }  from '@angular/common';
import { IonicModule }   from '@ionic/angular';
import { Subscription }  from 'rxjs';
import { filter, take }  from 'rxjs/operators';

import { DeliveryService }           from '../../../core/services/delivery.service';
import { UserProfileService }        from '../../../core/services/user-profile.service';
import { McpService }                from '../../../core/services/mcp.service';
import { WorkstreamPickerComponent } from '../../../shared/pickers/workstream-picker/workstream-picker.component';
import { UserPickerComponent }       from '../../../shared/pickers/user-picker/user-picker.component';
import {
  DeliveryCycle, DeliveryWorkstream, Division, User,
  TierClassification, McpResponse
} from '../../../core/types/database';

// Utility helpers (mirrored from create-panel to keep component standalone)
const AVATAR_COLORS_EP = [
  '#257099', '#00274E', '#E96127', '#F2A620',
  '#2E7D32', '#1565C0', '#6A1B9A', '#00695C'
];
function epNameInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) { return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
  return (parts[0] || '?').substring(0, 2).toUpperCase();
}
function epAvatarColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return AVATAR_COLORS_EP[Math.abs(hash) % AVATAR_COLORS_EP.length];
}

@Component({
  selector: 'app-delivery-cycle-edit-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, WorkstreamPickerComponent, UserPickerComponent],
  template: `
    <!-- S-006: Edit surface — pushes onto navigation stack, View remains below.
         Positioned as an absolute overlay within the detail panel container. -->
    <!-- B-23: overflow:visible (was overflow:hidden) so position:sticky on ep-header
         resolves to the outer scroll container (dashboard wrapper), not this element. Source: Contract 9. -->
    <div class="ep-overlay" #epOverlay>

        <!-- Panel header: Deep Navy, Save + Cancel always visible (spec 2.2) -->
        <!-- D-291: position:sticky;top:0 sticks to outer scroll container. B-23 fix: works now
             because ep-overlay no longer has overflow:hidden. Source: D-291, Contract 9. -->
        <div class="ep-header">
          <h2 class="ep-title">Edit Delivery Cycle</h2>
          <div class="ep-header-actions">
            <button type="button" class="ep-btn-cancel-header"
                    [disabled]="saving"
                    (click)="requestCancel()">
              Cancel
            </button>
            <button type="button" class="ep-btn-save"
                    [disabled]="form.invalid || saving"
                    (click)="onSave()">
              <ion-spinner *ngIf="saving" name="crescent"
                           style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">
              </ion-spinner>
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>

        <!-- Panel body: 8 fields in spec order -->
        <!-- B-36: scrolled to top on open (ngAfterViewInit). Source: Contract 10 §3 B-36. -->
        <div class="ep-body" #epBody>
          <form [formGroup]="form" novalidate>

            <!-- 1. Delivery Cycle Title -->
            <div class="ep-field">
              <label class="ep-label">
                Delivery Cycle Title <span class="ep-required">*</span>
              </label>
              <input formControlName="cycle_title" class="ep-input"
                     type="text" maxlength="120" />
              <!-- B-38: S-025 Pattern 1 guidance text. Source: Contract 10 §3 B-38. -->
              <div class="ep-hint">The name used across all views and reports.</div>
              <div *ngIf="f['cycle_title'].invalid && f['cycle_title'].touched"
                   class="ep-field-error">Delivery Cycle Title is required.</div>
            </div>

            <!-- 2. Division -->
            <!-- B-24 fix: required asterisk removed — Division is required at creation only.
                 In Edit the cycle already has a Division; required indicator is misleading. Source: D-165, Contract 9. -->
            <div class="ep-field">
              <label class="ep-label">Division</label>
              <select formControlName="division_id" class="ep-input"
                      (change)="onDivisionChange()">
                <option value="">— Select Division —</option>
                <option *ngFor="let d of availableDivisions" [value]="d.id">
                  {{ d.division_name }}
                </option>
              </select>
              <!-- B-38: S-025 Pattern 1 guidance text. Source: Contract 10 §3 B-38. -->
              <div class="ep-hint">The Division that owns this Delivery Cycle.</div>
              <div *ngIf="f['division_id'].invalid && f['division_id'].touched"
                   class="ep-field-error">Division is required.</div>
              <!-- Approver change note — stubbed per CC-Decision-2026-04-10-E -->
              <div *ngIf="approverChangeNote" class="ep-amber-note">
                {{ approverChangeNote }}
              </div>
            </div>

            <!-- 3. Outcome Statement -->
            <div class="ep-field">
              <label class="ep-label">Outcome Statement</label>
              <textarea formControlName="outcome_statement" class="ep-input ep-textarea"
                        rows="3">
              </textarea>
              <div class="ep-hint">Should be set before Brief Review Gate.</div>
            </div>

            <!-- 4. Delivery Workstream (entity picker, re-scopes on Division change) -->
            <!-- B-14 fix: Workstream is optional at edit time per D-165. Removed required asterisk
                 and required validation. Gate-enforcement only (Brief Review gate). Source: D-165. -->
            <div class="ep-field">
              <label class="ep-label">Delivery Workstream</label>
              <!-- B-25 fix: Division change no longer auto-clears Workstream. Shows amber warning
                   when WS belongs to a different Division. User saves freely. Source: D-165, D-297, D-228, Contract 9. -->
              <div *ngIf="workstreamDivisionNote" class="ep-amber-note">
                {{ workstreamDivisionNote }}
              </div>
              <button type="button" class="ep-picker-trigger"
                      (click)="openWorkstreamPicker()">
                <span *ngIf="!selectedWorkstream" class="ep-picker-placeholder">
                  — Select Workstream —
                </span>
                <span *ngIf="selectedWorkstream">
                  <span class="ep-entity-chip">{{ selectedWorkstream.workstream_name }}</span>
                </span>
              </button>
              <button *ngIf="selectedWorkstream" type="button"
                      class="ep-chip-remove"
                      (click)="clearWorkstream()">✕ Remove</button>
              <div class="ep-hint">Required before Brief Review Gate.</div>
            </div>

            <!-- 5. Tier Classification (dropdown in Edit — not option cards; spec 2.3 note 4) -->
            <!-- B-24 fix: required asterisk removed — Tier is required at creation only.
                 In Edit the cycle already has a Tier. Source: D-165, Contract 9. -->
            <div class="ep-field">
              <label class="ep-label">Tier Classification</label>
              <select formControlName="tier_classification" class="ep-input"
                      (change)="onTierChange()">
                <option value="">— Select Tier —</option>
                <option value="tier_1">Tier 1 — Fast Lane</option>
                <option value="tier_2">Tier 2 — Structured</option>
                <option value="tier_3">Tier 3 — Governed</option>
              </select>
              <!-- B-38: S-025 Pattern 1 guidance text. Source: Contract 10 §3 B-38. -->
              <div class="ep-hint">
                Tier 1: workflow changes. Tier 2: platform changes. Tier 3: agent deployments or compliance scope changes.
              </div>
              <div *ngIf="f['tier_classification'].invalid && f['tier_classification'].touched"
                   class="ep-field-error">Tier Classification is required.</div>
              <!-- D-228: amber non-blocking warning when Tier changed on cycle with gate records -->
              <div *ngIf="showTierChangeWarning" class="ep-amber-note">
                Changing Tier may affect gate requirements. Existing gate records are not modified.
              </div>
            </div>

            <!-- 6. Assigned Domain Strategist — B-26: UserPickerComponent replaces <select>. Source: D-182, Contract 9. -->
            <div class="ep-field">
              <label class="ep-label">Assigned Domain Strategist</label>
              <div *ngIf="selectedDs; else noDsPicked" class="ep-user-chip-row">
                <span class="ep-entity-chip" style="display:inline-flex;align-items:center;gap:6px;">
                  <span class="ep-user-avatar" [style.background]="selectedDsColor">{{ selectedDsInitials }}</span>
                  {{ selectedDs.display_name }}
                </span>
                <button type="button" class="ep-chip-remove" (click)="clearDs()">✕ Remove</button>
              </div>
              <ng-template #noDsPicked>
                <button type="button" class="ep-picker-trigger ep-picker-trigger--empty"
                        (click)="openDsPicker()">
                  <span class="ep-picker-placeholder">— Unassigned —</span>
                </button>
              </ng-template>
              <button *ngIf="!selectedDs" type="button" class="ep-picker-trigger"
                      style="display:none;" (click)="openDsPicker()"></button>
              <div class="ep-hint">Required before Brief Review Gate.</div>
            </div>

            <!-- 7. Assigned Capability Builder — B-26: UserPickerComponent replaces <select>. Source: D-182, Contract 9. -->
            <div class="ep-field">
              <label class="ep-label">Assigned Capability Builder</label>
              <div *ngIf="selectedCb; else noCbPicked" class="ep-user-chip-row">
                <span class="ep-entity-chip" style="display:inline-flex;align-items:center;gap:6px;">
                  <span class="ep-user-avatar" [style.background]="selectedCbColor">{{ selectedCbInitials }}</span>
                  {{ selectedCb.display_name }}
                </span>
                <button type="button" class="ep-chip-remove" (click)="clearCb()">✕ Remove</button>
              </div>
              <ng-template #noCbPicked>
                <button type="button" class="ep-picker-trigger ep-picker-trigger--empty"
                        (click)="openCbPicker()">
                  <span class="ep-picker-placeholder">— Unassigned —</span>
                </button>
              </ng-template>
              <div class="ep-hint">Required before Go to Build Gate.</div>
            </div>

            <!-- 8. Jira Epic Link -->
            <div class="ep-field">
              <label class="ep-label">Jira Epic Link</label>
              <input formControlName="jira_epic_key" class="ep-input"
                     type="text" placeholder="e.g. PS-2026-041" />
              <div class="ep-hint">Required before Go to Build Gate.</div>
            </div>

            <!-- Save error (D-200 Pattern 3) -->
            <div *ngIf="saveError" class="ep-save-error" role="alert">
              {{ saveError }}
            </div>

          </form>
        </div>

        <!-- D-292: Discard unsaved changes confirm panel. Source: D-292.
             B-70 (Contract 12): scoped to the edit panel via position:absolute on the
             ep-overlay containing block, instead of position:fixed which spilled
             across the full viewport. Maintains spatial relationship with the panel
             it belongs to. Source: Contract 12 §3 B-70. -->
        <div *ngIf="showDiscardConfirm"
             style="position:absolute;inset:0;z-index:1000;background:rgba(255,255,255,0.97);
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    padding:32px;">
          <div style="max-width:360px;text-align:center;">
            <div style="font:600 16px Roboto,sans-serif;color:#1E1E1E;margin-bottom:8px;">
              Discard unsaved changes?
            </div>
            <div style="font:400 13px Roboto,sans-serif;color:#5A5A5A;margin-bottom:24px;">
              Your edits have not been saved.
            </div>
            <div style="display:flex;gap:12px;justify-content:center;">
              <button type="button" (click)="keepEditing()"
                      style="background:#fff;border:1.5px solid #D0D0D0;border-radius:5px;
                             padding:10px 20px;font:500 14px Roboto,sans-serif;color:#5A5A5A;cursor:pointer;">
                Keep Editing
              </button>
              <button type="button" (click)="confirmDiscard()"
                      style="background:#E96127;border:none;border-radius:5px;
                             padding:10px 20px;font:500 14px Roboto,sans-serif;color:#fff;cursor:pointer;">
                Discard
              </button>
            </div>
          </div>
        </div>

    </div>

    <!-- Workstream Picker modal (D-182, CC-002) -->
    <!-- B-22: [isTrustLevelDivision] passed so Trust scope pill is suppressed when cycle
         Division is Trust-level (D-206). Source: D-206, Contract 9. -->
    <app-workstream-picker
      *ngIf="showWorkstreamPicker"
      [cycleDivisionId]="form.get('division_id')?.value || null"
      [isTrustLevelDivision]="isTrustLevelDivision"
      [currentWorkstreamId]="selectedWorkstream?.workstream_id ?? null"
      (workstreamSelected)="onWorkstreamSelected($event)">
    </app-workstream-picker>

    <!-- DS User Picker modal — B-26: replaces <select>. Source: D-182, Contract 9. -->
    <app-user-picker
      *ngIf="showDsPicker"
      userRole="ds"
      [divisionId]="form.get('division_id')?.value || null"
      [currentUserId]="selectedDs?.id ?? null"
      (userSelected)="onDsSelected($event)">
    </app-user-picker>

    <!-- CB User Picker modal — B-26: replaces <select>. Source: D-182, Contract 9. -->
    <app-user-picker
      *ngIf="showCbPicker"
      userRole="cb"
      [divisionId]="form.get('division_id')?.value || null"
      [currentUserId]="selectedCb?.id ?? null"
      (userSelected)="onCbSelected($event)">
    </app-user-picker>
  `,
  styles: [`
    /* Overlay — covers the detail panel content, View stays behind */
    /* B-23 fix: overflow:visible (was overflow:hidden). Removes the scroll-container boundary
       that blocked position:sticky on ep-header. The outer dashboard wrapper (overflow-y:auto)
       now serves as the sticky scroll container. Source: D-291, Contract 9. */
    .ep-overlay {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.98);
      z-index: 10;
      display: flex; flex-direction: column;
      overflow: visible;
    }

    /* Header — Deep Navy, Save + Cancel always visible (spec 2.2) */
    /* D-291: position:sticky so header stays visible when outer scroll container scrolls.
       B-23: now works because ep-overlay no longer has overflow:hidden. Source: D-291, Contract 9. */
    .ep-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 64px; flex-shrink: 0;
      background: #12274A;
      position: sticky; top: 0; z-index: 5;
    }
    .ep-title {
      margin: 0; font: 700 20px/1.2 Roboto, sans-serif; color: #fff;
    }
    .ep-header-actions {
      display: flex; align-items: center; gap: 10px;
    }
    .ep-btn-cancel-header {
      background: none; border: 1.5px solid rgba(255,255,255,0.5);
      border-radius: 5px; padding: 7px 16px;
      font: 500 13px Roboto, sans-serif; color: rgba(255,255,255,0.85);
      cursor: pointer;
    }
    .ep-btn-cancel-header:hover:not(:disabled) { border-color: #fff; color: #fff; }
    .ep-btn-cancel-header:disabled { opacity: 0.4; cursor: not-allowed; }
    .ep-btn-save {
      background: #257099; border: none; border-radius: 5px;
      padding: 7px 18px; font: 500 13px Roboto, sans-serif; color: #fff;
      cursor: pointer; display: flex; align-items: center;
    }
    .ep-btn-save:hover:not(:disabled) { background: #1d5878; }
    .ep-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Body */
    .ep-body {
      flex: 1; padding: 24px;
    }

    /* Fields */
    .ep-field { margin-bottom: 16px; }
    .ep-label {
      display: block; margin-bottom: 6px;
      font: 500 13px/1.3 Roboto, sans-serif; color: #5A5A5A;
    }
    .ep-required { color: #E96127; margin-left: 2px; }

    /* Shared input + picker-trigger base (Step 7 CSS consolidation). */
    .ep-input, .ep-picker-trigger {
      width: 100%; border: 1.5px solid #D0D0D0; border-radius: 5px;
      padding: 10px 12px; font: 400 14px Roboto, sans-serif; background: #fff; color: #262626;
    }
    .ep-input { box-sizing: border-box; }
    .ep-input:focus {
      outline: none; border-color: #257099;
      box-shadow: 0 0 0 3px rgba(37,112,153,0.15);
    }
    select.ep-input { appearance: auto; }
    .ep-textarea { min-height: 80px; resize: vertical; }

    .ep-field-error {
      margin-top: 4px; font: 400 12px Roboto, sans-serif; color: #C62828;
    }
    .ep-hint {
      margin-top: 4px; font: 400 12px italic Roboto, sans-serif; color: #9E9E9E;
    }

    /* Amber non-blocking note — D-228, Division change, Workstream warning */
    .ep-amber-note {
      margin-top: 6px; background: #FFF8E1;
      border-left: 3px solid #F2A620; border-radius: 4px;
      padding: 8px 12px;
      font: 400 12px italic Roboto, sans-serif; color: #5A5A5A;
    }

    /* Picker trigger */
    .ep-picker-trigger { text-align: left; cursor: pointer; }
    .ep-picker-trigger:hover { border-color: #257099; }
    .ep-picker-placeholder { color: #9E9E9E; }
    .ep-entity-chip {
      display: inline-flex; align-items: center;
      background: rgba(37,112,153,0.08); border-radius: 999px;
      padding: 3px 10px; font: 400 13px Roboto, sans-serif; color: #262626;
    }
    .ep-chip-remove {
      display: block; margin-top: 4px;
      background: none; border: none; cursor: pointer;
      font: 400 12px Roboto, sans-serif; color: #9E9E9E; padding: 2px 0;
    }
    .ep-chip-remove:hover { color: #C62828; }

    /* User chip row — B-26 DS/CB entity picker chips */
    .ep-user-chip-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ep-user-avatar {
      width: 22px; height: 22px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font: 600 9px Roboto, sans-serif; color: #fff; flex-shrink: 0;
    }

    /* Save error */
    .ep-save-error {
      margin-top: 8px; padding: 10px 12px;
      background: #FFEBEE; border-left: 3px solid #C62828; border-radius: 4px;
      font: 400 13px Roboto, sans-serif; color: #C62828;
    }
  `]
})
export class DeliveryCycleEditPanelComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

  // B-36: ep-body scroll container reference for scrollTop=0 on open. Source: Contract 10 §3 B-36.
  @ViewChild('epBody')    epBody?:    ElementRef<HTMLDivElement>;
  @ViewChild('epOverlay') epOverlay?: ElementRef<HTMLDivElement>;

  // The cycle to edit — passed from the View panel.
  @Input() cycle!: DeliveryCycle;
  // All users accessible in the caller's context — used to pre-populate DS/CB pickers.
  @Input() allUsers: User[] = [];
  // D-292: Dashboard/detail increments to signal cancel (scrim click). Source: D-292.
  // B-12 fix: cancelSignal routes through requestCancel() — dirty-state check fires correctly.
  @Input() cancelSignal = 0;

  // Emitted on successful save (View re-queries unconditionally per S-008).
  @Output() saved     = new EventEmitter<void>();
  // Emitted on cancel (no re-query — spec 2.6).
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;

  saving    = false;
  saveError = '';
  // D-292: dirty-state discard confirmation. Source: D-292.
  showDiscardConfirm = false;

  // Populated on init from get_user_divisions MCP call.
  availableDivisions: Division[] = [];

  // Workstream picker state.
  showWorkstreamPicker                    = false;
  selectedWorkstream: DeliveryWorkstream | null = null;
  // B-25: warning shown when Workstream belongs to a different Division after Division change.
  // Does NOT clear the Workstream. Source: D-165, D-297, D-228, Contract 9.
  workstreamDivisionNote                  = '';

  // Inline notes.
  approverChangeNote = ''; // Stubbed — CC-Decision-2026-04-10-E.

  // D-228: shown when Tier changed on a cycle that already has gate records.
  showTierChangeWarning = false;
  private originalTier: TierClassification = '' as TierClassification;

  // B-26: DS entity picker state. Source: D-182, Contract 9.
  showDsPicker       = false;
  selectedDs:        User | null = null;
  selectedDsInitials = '';
  selectedDsColor    = '#257099';

  // B-26: CB entity picker state. Source: D-182, Contract 9.
  showCbPicker       = false;
  selectedCb:        User | null = null;
  selectedCbInitials = '';
  selectedCbColor    = '#257099';

  private subs = new Subscription();

  get f() { return this.form.controls; }

  // B-22: true when the currently selected Division is Trust-level (D-206).
  // Used to suppress the Trust scope pill in the Workstream Picker. Source: D-206, Contract 9.
  get isTrustLevelDivision(): boolean {
    const divId = this.form?.get('division_id')?.value;
    if (!divId) { return false; }
    const div = this.availableDivisions.find(d => d.id === divId);
    return div?.division_level === 1;
  }

  // Whether the cycle has existing gate records — used for D-228 Tier change warning.
  private get cycleHasGateRecords(): boolean {
    return (this.cycle.gate_records?.length ?? 0) > 0 ||
           (this.cycle.milestone_dates?.length ?? 0) > 0;
  }

  constructor(
    private readonly fb:       FormBuilder,
    private readonly delivery: DeliveryService,
    private readonly profile:  UserProfileService,
    private readonly mcp:      McpService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialise form with current cycle values.
    // B-24 fix: Division and Tier no longer required in the form since they're already set.
    // Required validators kept so Save doesn't succeed if they're accidentally cleared,
    // but the asterisk indicators are removed from the labels. Source: D-165, Contract 9.
    this.form = this.fb.group({
      cycle_title:         [this.cycle.cycle_title,         [Validators.required, Validators.maxLength(120)]],
      division_id:         [this.cycle.division_id,          Validators.required],
      outcome_statement:   [this.cycle.outcome_statement ?? ''],
      tier_classification: [this.cycle.tier_classification,  Validators.required],
      jira_epic_key:       [this.cycle.jira_epic_key        ?? '']
    });

    // Pre-populate Workstream from cycle.
    if (this.cycle.workstream_id) {
      this.selectedWorkstream = {
        workstream_id:        this.cycle.workstream_id,
        workstream_name:      this.cycle.workstream?.workstream_name ?? '(Workstream)',
        home_division_id:     this.cycle.division_id,
        home_division_name:   null,
        active_status:        true,
        active_cycle_count:   null,
        lead_display_name:    null
      } as unknown as DeliveryWorkstream;
    }

    // B-26: Pre-populate DS from cycle data + allUsers.
    if (this.cycle.assigned_ds_user_id) {
      const dsUser = this.allUsers.find(u => u.id === this.cycle.assigned_ds_user_id);
      if (dsUser) {
        this.selectedDs = dsUser;
        this.updateDsChip(dsUser);
      } else {
        // User not in allUsers (e.g. inactive or cross-division) — build minimal object
        this.selectedDs = { id: this.cycle.assigned_ds_user_id, display_name: this.cycle.assigned_ds_display_name ?? 'Assigned DS' } as User;
        this.updateDsChip(this.selectedDs);
      }
    }

    // B-26: Pre-populate CB from cycle data + allUsers.
    if (this.cycle.assigned_cb_user_id) {
      const cbUser = this.allUsers.find(u => u.id === this.cycle.assigned_cb_user_id);
      if (cbUser) {
        this.selectedCb = cbUser;
        this.updateCbChip(cbUser);
      } else {
        this.selectedCb = { id: this.cycle.assigned_cb_user_id, display_name: this.cycle.assigned_cb_display_name ?? 'Assigned CB' } as User;
        this.updateCbChip(this.selectedCb);
      }
    }

    // Store original Tier for D-228 comparison.
    this.originalTier = this.cycle.tier_classification;

    // Load accessible divisions for the Division dropdown.
    this.loadDivisions();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  /** B-36: scroll edit panel form to top on open. Source: Contract 10 §3 B-36. */
  ngAfterViewInit(): void {
    // Scroll the inner form body to the top.
    if (this.epBody?.nativeElement) {
      this.epBody.nativeElement.scrollTop = 0;
    }
    // Also scroll the outer host element (the page/panel scroll container) so the
    // overlay header is in view — needed when user opened Edit while detail view was scrolled.
    if (this.epOverlay?.nativeElement) {
      const host = this.epOverlay.nativeElement;
      // Find the scrollable ancestor and scroll it so this panel's top is in view.
      let parent: HTMLElement | null = host.parentElement;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          parent.scrollTop = 0;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }

  // D-292: cancelSignal from detail component (proxied from dashboard scrim click). Source: D-292.
  // B-12 fix: route through requestCancel() so dirty-state check fires before closing.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cancelSignal'] && !changes['cancelSignal'].firstChange) {
      this.requestCancel();
    }
  }

  // ── Division loading ─────────────────────────────────────────────────────────
  private loadDivisions(): void {
    this.subs.add(
      this.profile.profile$.pipe(filter(p => p !== null), take(1)).subscribe(profile => {
        if (!profile?.id) { return; }
        this.subs.add(
          this.mcp.call<{
            all_accessible_divisions: Division[];
            directly_assigned_divisions: Division[];
          }>('division', 'get_user_divisions', { user_id: profile.id }).subscribe(res => {
            this.availableDivisions = res.data?.all_accessible_divisions ?? [];
            this.cdr.markForCheck();
          })
        );
      })
    );
  }

  // ── Division change (spec 2.4) ────────────────────────────────────────────────
  // B-25 fix: Do NOT auto-clear Workstream on Division change. Instead show amber warning
  // when the WS belongs to a different Division. User saves freely. Source: D-165, D-297, D-228, Contract 9.
  onDivisionChange(): void {
    const newDivisionId = this.form.get('division_id')?.value;
    this.workstreamDivisionNote = '';

    if (this.selectedWorkstream) {
      const wsHomeDivId = (this.selectedWorkstream as DeliveryWorkstream & { home_division_id?: string }).home_division_id;
      if (wsHomeDivId && wsHomeDivId !== newDivisionId) {
        this.workstreamDivisionNote =
          'The selected Workstream belongs to a different Division — confirm or select a new one.';
        // B-25 fix: Workstream NOT cleared. Source: Contract 9.
      } else {
        this.workstreamDivisionNote = '';
      }
    }

    this.cdr.markForCheck();
  }

  // ── Tier change — D-228 ───────────────────────────────────────────────────────
  onTierChange(): void {
    const currentTier = this.form.get('tier_classification')?.value;
    this.showTierChangeWarning =
      this.cycleHasGateRecords &&
      currentTier !== '' &&
      currentTier !== this.originalTier;
    this.cdr.markForCheck();
  }

  // ── Workstream picker ─────────────────────────────────────────────────────────
  openWorkstreamPicker(): void {
    this.showWorkstreamPicker = true;
    this.cdr.markForCheck();
  }

  onWorkstreamSelected(ws: DeliveryWorkstream | null): void {
    this.showWorkstreamPicker  = false;
    this.workstreamDivisionNote = '';
    if (ws) { this.selectedWorkstream = ws; }
    this.cdr.markForCheck();
  }

  clearWorkstream(): void {
    this.selectedWorkstream    = null;
    this.workstreamDivisionNote = '';
    this.cdr.markForCheck();
  }

  // ── DS picker — B-26 ─────────────────────────────────────────────────────────
  openDsPicker(): void { this.showDsPicker = true; this.cdr.markForCheck(); }

  onDsSelected(user: User | null): void {
    this.showDsPicker = false;
    if (user) {
      this.selectedDs = user;
      this.updateDsChip(user);
    }
    this.cdr.markForCheck();
  }

  clearDs(): void { this.selectedDs = null; this.cdr.markForCheck(); }

  private updateDsChip(user: User): void {
    this.selectedDsInitials = epNameInitials(user.display_name || '');
    this.selectedDsColor    = epAvatarColorFromName(user.display_name || '');
  }

  // ── CB picker — B-26 ─────────────────────────────────────────────────────────
  openCbPicker(): void { this.showCbPicker = true; this.cdr.markForCheck(); }

  onCbSelected(user: User | null): void {
    this.showCbPicker = false;
    if (user) {
      this.selectedCb = user;
      this.updateCbChip(user);
    }
    this.cdr.markForCheck();
  }

  clearCb(): void { this.selectedCb = null; this.cdr.markForCheck(); }

  private updateCbChip(user: User): void {
    this.selectedCbInitials = epNameInitials(user.display_name || '');
    this.selectedCbColor    = epAvatarColorFromName(user.display_name || '');
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  onSave(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.saving) { return; }

    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    const v = this.form.value as {
      cycle_title:         string;
      division_id:         string;
      outcome_statement:   string;
      tier_classification: TierClassification;
      jira_epic_key:       string;
    };

    // Build changed-fields-only payload — only send fields that differ from original.
    const payload: Parameters<DeliveryService['updateCycle']>[0] = {
      delivery_cycle_id: this.cycle.delivery_cycle_id
    };

    if (v.cycle_title.trim() !== this.cycle.cycle_title) {
      payload.cycle_title = v.cycle_title.trim();
    }
    if (v.division_id !== this.cycle.division_id) {
      payload.division_id = v.division_id;
    }
    const newOutcome = v.outcome_statement?.trim() || null;
    if (newOutcome !== (this.cycle.outcome_statement ?? null)) {
      payload.outcome_statement = newOutcome;
    }
    const newWorkstreamId = this.selectedWorkstream?.workstream_id ?? null;
    if (newWorkstreamId !== (this.cycle.workstream_id ?? null)) {
      payload.workstream_id = newWorkstreamId;
    }
    if (v.tier_classification !== this.cycle.tier_classification) {
      payload.tier_classification = v.tier_classification;
    }
    // B-26: DS/CB from picker state (no longer form controls).
    const newDsId = this.selectedDs?.id ?? null;
    if (newDsId !== (this.cycle.assigned_ds_user_id ?? null)) {
      payload.assigned_ds_user_id = newDsId;
    }
    const newCbId = this.selectedCb?.id ?? null;
    if (newCbId !== (this.cycle.assigned_cb_user_id ?? null)) {
      payload.assigned_cb_user_id = newCbId;
    }
    const newJira = v.jira_epic_key?.trim() || null;
    if (newJira !== (this.cycle.jira_epic_key ?? null)) {
      payload.jira_epic_key = newJira;
    }

    // If nothing changed, treat as a cancel (no MCP round-trip needed).
    const changedKeys = Object.keys(payload).filter(k => k !== 'delivery_cycle_id');
    if (changedKeys.length === 0) {
      this.saving = false;
      this.cdr.markForCheck();
      this.cancelled.emit();
      return;
    }

    this.delivery.updateCycle(payload).subscribe({
      next: (res: McpResponse<DeliveryCycle>) => {
        if (res.success) {
          this.saved.emit();
        } else {
          this.saveError = this.friendlyError(res.error ?? 'Save failed. Please try again.');
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.saveError = this.friendlyError(err?.error ?? 'Save failed. Please try again.');
        this.saving    = false;
        this.cdr.markForCheck();
      }
    });
  }

  // B-17: Convert raw Supabase constraint errors to user-friendly messages. Source: Contract 9.
  private friendlyError(raw: string): string {
    if (!raw) { return 'Save failed. Please try again.'; }
    const lower = raw.toLowerCase();
    if (lower.includes('unique') || lower.includes('duplicate') || lower.includes('already exists')) {
      return 'A Delivery Cycle with this title already exists in this Division. Use a different title.';
    }
    if (lower.includes('foreign key') || lower.includes('violates') || lower.includes('constraint')) {
      return 'Save failed — one of the selected values is no longer valid. Refresh and try again.';
    }
    return raw;
  }

  // ── Cancel / dirty-state (D-292) ─────────────────────────────────────────────

  // D-292: ESC key triggers dirty-state check. Source: D-292.
  @HostListener('document:keydown.escape')
  onEscKey(): void { this.requestCancel(); }

  // D-292: Check dirty state before cancelling. If dirty → show confirm; if clean → emit cancelled.
  requestCancel(): void {
    if (this.showDiscardConfirm) { return; }
    if (this.isDirty()) {
      this.showDiscardConfirm = true;
      this.cdr.markForCheck();
    } else {
      this.cancelled.emit();
    }
  }

  // D-292: Any form field differs from original cycle value, or Workstream/DS/CB has changed.
  isDirty(): boolean {
    const f = this.form.value as Record<string, unknown>;
    return (
      f['cycle_title']         !== this.cycle.cycle_title ||
      f['division_id']         !== this.cycle.division_id ||
      f['outcome_statement']   !== (this.cycle.outcome_statement   ?? '') ||
      f['tier_classification'] !== this.cycle.tier_classification ||
      f['jira_epic_key']       !== (this.cycle.jira_epic_key       ?? '') ||
      (this.selectedWorkstream?.workstream_id ?? null) !== (this.cycle.workstream_id ?? null) ||
      (this.selectedDs?.id ?? null) !== (this.cycle.assigned_ds_user_id ?? null) ||
      (this.selectedCb?.id ?? null) !== (this.cycle.assigned_cb_user_id ?? null)
    );
  }

  confirmDiscard(): void {
    this.showDiscardConfirm = false;
    this.cancelled.emit();
  }

  /** B-42: After "Keep Editing", scroll the form back to the top so the user can resume from
   *  a known position. The dirty trigger field is not tracked individually — top is the safe
   *  default (matches Contract 10 §3 B-42 fallback). Source: Contract 10 §3 B-42. */
  keepEditing(): void {
    this.showDiscardConfirm = false;
    this.cdr.markForCheck();
    if (this.epBody?.nativeElement) {
      this.epBody.nativeElement.scrollTop = 0;
    }
    if (this.epOverlay?.nativeElement) {
      let parent: HTMLElement | null = this.epOverlay.nativeElement.parentElement;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          parent.scrollTop = 0;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
}
