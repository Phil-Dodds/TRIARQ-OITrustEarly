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
// Division change behavior (spec Section 2.4):
//   - Re-scopes WorkstreamPickerComponent to new Division.
//   - Clears Workstream if current Workstream unavailable in new Division.
//   - Approver comparison stubbed — get_division_gate_approvers not yet built (CC-Decision-2026-04-10-E).
//
// D-228: Amber non-blocking warning when Tier changes on a cycle with existing gate records.
// D-207: QPathways design tokens throughout.
// D-93: No direct Supabase access — DeliveryService → MCP only.
// ChangeDetection: OnPush.

import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef, HostListener
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
import {
  DeliveryCycle, DeliveryWorkstream, Division, User,
  TierClassification, McpResponse
} from '../../../core/types/database';

@Component({
  selector: 'app-delivery-cycle-edit-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, WorkstreamPickerComponent],
  template: `
    <!-- S-006: Edit surface — pushes onto navigation stack, View remains below.
         Positioned as an absolute overlay within the detail panel container. -->
    <div class="ep-overlay">

        <!-- Panel header: Deep Navy, Save + Cancel always visible (spec 2.2) -->
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
        <div class="ep-body">
          <form [formGroup]="form" novalidate>

            <!-- 1. Delivery Cycle Title -->
            <div class="ep-field">
              <label class="ep-label">
                Delivery Cycle Title <span class="ep-required">*</span>
              </label>
              <input formControlName="cycle_title" class="ep-input"
                     type="text" maxlength="120" />
              <div *ngIf="f['cycle_title'].invalid && f['cycle_title'].touched"
                   class="ep-field-error">Delivery Cycle Title is required.</div>
            </div>

            <!-- 2. Division -->
            <div class="ep-field">
              <label class="ep-label">
                Division <span class="ep-required">*</span>
              </label>
              <select formControlName="division_id" class="ep-input"
                      (change)="onDivisionChange()">
                <option value="">— Select Division —</option>
                <option *ngFor="let d of availableDivisions" [value]="d.id">
                  {{ d.division_name }}
                </option>
              </select>
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
            <div class="ep-field">
              <label class="ep-label">
                Delivery Workstream <span class="ep-required">*</span>
              </label>
              <!-- Workstream cleared notice after division change -->
              <div *ngIf="workstreamClearedNote" class="ep-amber-note">
                {{ workstreamClearedNote }}
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
              <div *ngIf="workstreamRequired && !selectedWorkstream"
                   class="ep-field-error">Delivery Workstream is required.</div>
            </div>

            <!-- 5. Tier Classification (dropdown in Edit — not option cards; spec 2.3 note 4) -->
            <div class="ep-field">
              <label class="ep-label">
                Tier Classification <span class="ep-required">*</span>
              </label>
              <select formControlName="tier_classification" class="ep-input"
                      (change)="onTierChange()">
                <option value="">— Select Tier —</option>
                <option value="tier_1">Tier 1 — Fast Lane</option>
                <option value="tier_2">Tier 2 — Structured</option>
                <option value="tier_3">Tier 3 — Governed</option>
              </select>
              <div *ngIf="f['tier_classification'].invalid && f['tier_classification'].touched"
                   class="ep-field-error">Tier Classification is required.</div>
              <!-- D-228: amber non-blocking warning when Tier changed on cycle with gate records -->
              <div *ngIf="showTierChangeWarning" class="ep-amber-note">
                Changing Tier may affect gate requirements. Existing gate records are not modified.
              </div>
            </div>

            <!-- 6. Assigned Domain Strategist -->
            <div class="ep-field">
              <label class="ep-label">Assigned Domain Strategist</label>
              <select formControlName="assigned_ds_user_id" class="ep-input">
                <option value="">— Unassigned —</option>
                <option *ngFor="let u of dsUsers" [value]="u.id">{{ u.display_name }}</option>
              </select>
              <div class="ep-hint">Required before Brief Review Gate.</div>
            </div>

            <!-- 7. Assigned Capability Builder -->
            <div class="ep-field">
              <label class="ep-label">Assigned Capability Builder</label>
              <select formControlName="assigned_cb_user_id" class="ep-input">
                <option value="">— Unassigned —</option>
                <option *ngFor="let u of cbUsers" [value]="u.id">{{ u.display_name }}</option>
              </select>
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

        <!-- D-292: Discard unsaved changes confirm panel. Source: D-292. -->
        <div *ngIf="showDiscardConfirm"
             style="position:absolute;inset:0;z-index:20;background:rgba(255,255,255,0.97);
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    padding:32px;">
          <div style="max-width:320px;text-align:center;">
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
    <app-workstream-picker
      *ngIf="showWorkstreamPicker"
      [cycleDivisionId]="form.get('division_id')?.value || null"
      [currentWorkstreamId]="selectedWorkstream?.workstream_id ?? null"
      (workstreamSelected)="onWorkstreamSelected($event)">
    </app-workstream-picker>
  `,
  styles: [`
    /* Overlay — covers the detail panel content, View stays behind */
    .ep-overlay {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.98);
      z-index: 10;
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    /* Header — Deep Navy, Save + Cancel always visible (spec 2.2) */
    /* D-291: sticky so header stays visible when panel body scrolls. Source: D-291. */
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
      flex: 1; overflow-y: auto; padding: 24px;
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

    /* Amber non-blocking note — D-228, Division change, Workstream cleared */
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

    /* Save error */
    .ep-save-error {
      margin-top: 8px; padding: 10px 12px;
      background: #FFEBEE; border-left: 3px solid #C62828; border-radius: 4px;
      font: 400 13px Roboto, sans-serif; color: #C62828;
    }
  `]
})
export class DeliveryCycleEditPanelComponent implements OnInit, OnDestroy {

  // The cycle to edit — passed from the View panel.
  @Input() cycle!: DeliveryCycle;
  // All users accessible in the caller's context — used to filter DS/CB dropdowns.
  @Input() allUsers: User[] = [];

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
  workstreamClearedNote                   = '';

  // Inline notes.
  approverChangeNote = ''; // Stubbed — CC-Decision-2026-04-10-E.

  // D-228: shown when Tier changed on a cycle that already has gate records.
  showTierChangeWarning = false;
  private originalTier: TierClassification = '' as TierClassification;

  // Validation guard: Workstream is required (D-165 — optional at creation, required by Brief Review).
  // In Edit, we enforce it if the cycle already has one or if form was submitted.
  workstreamRequired = false;

  private subs = new Subscription();

  get f() { return this.form.controls; }

  // DS users filtered to currently selected Division.
  get dsUsers(): User[] {
    const divId = this.form.get('division_id')?.value;
    return this.allUsers.filter(u =>
      u.system_role === 'ds' &&
      (!divId || (u as unknown as { division_id?: string }).division_id === divId)
    );
  }

  // CB users filtered to currently selected Division.
  get cbUsers(): User[] {
    const divId = this.form.get('division_id')?.value;
    return this.allUsers.filter(u =>
      u.system_role === 'cb' &&
      (!divId || (u as unknown as { division_id?: string }).division_id === divId)
    );
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
    this.form = this.fb.group({
      cycle_title:          [this.cycle.cycle_title,          [Validators.required, Validators.maxLength(120)]],
      division_id:          [this.cycle.division_id,          Validators.required],
      outcome_statement:    [this.cycle.outcome_statement ?? ''],
      tier_classification:  [this.cycle.tier_classification,  Validators.required],
      assigned_ds_user_id:  [this.cycle.assigned_ds_user_id  ?? ''],
      assigned_cb_user_id:  [this.cycle.assigned_cb_user_id  ?? ''],
      jira_epic_key:        [this.cycle.jira_epic_key        ?? '']
    });

    // Pre-populate Workstream from cycle.
    // Workstream is represented outside the form (entity picker pattern).
    if (this.cycle.workstream_id) {
      // Build a minimal DeliveryWorkstream for display from cycle data.
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

    // Store original Tier for D-228 comparison.
    this.originalTier = this.cycle.tier_classification;

    // Load accessible divisions for the Division dropdown.
    this.loadDivisions();
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

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
  onDivisionChange(): void {
    const newDivisionId = this.form.get('division_id')?.value;
    this.workstreamClearedNote = '';

    // Clear Workstream if it belongs to a different Division.
    // CC-Decision-2026-04-10-E: approver comparison stubbed — tool not yet built.
    if (this.selectedWorkstream) {
      const wsHomeDivId = (this.selectedWorkstream as DeliveryWorkstream & { home_division_id?: string }).home_division_id;
      if (wsHomeDivId && wsHomeDivId !== newDivisionId) {
        this.selectedWorkstream    = null;
        this.workstreamClearedNote =
          'Workstream cleared — the current Workstream is not available in the selected Division. ' +
          'Please select a new Workstream.';
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
    this.workstreamClearedNote = '';
    if (ws) { this.selectedWorkstream = ws; }
    this.cdr.markForCheck();
  }

  clearWorkstream(): void {
    this.selectedWorkstream    = null;
    this.workstreamClearedNote = '';
    this.cdr.markForCheck();
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  onSave(): void {
    this.form.markAllAsTouched();
    this.workstreamRequired = true;

    if (this.form.invalid || this.saving) { return; }

    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    const v = this.form.value as {
      cycle_title:         string;
      division_id:         string;
      outcome_statement:   string;
      tier_classification: TierClassification;
      assigned_ds_user_id: string;
      assigned_cb_user_id: string;
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
    const newDsId = v.assigned_ds_user_id || null;
    if (newDsId !== (this.cycle.assigned_ds_user_id ?? null)) {
      payload.assigned_ds_user_id = newDsId;
    }
    const newCbId = v.assigned_cb_user_id || null;
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
      this.cancelled.emit(); // No changes — behave like Cancel per spec intent.
      return;
    }

    this.delivery.updateCycle(payload).subscribe({
      next: (res: McpResponse<DeliveryCycle>) => {
        if (res.success) {
          this.saved.emit(); // View re-queries unconditionally per S-008.
        } else {
          this.saveError = res.error ?? 'Save failed. Please try again.';
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.saveError = err?.error ?? 'Save failed. Please try again.';
        this.saving    = false;
        this.cdr.markForCheck();
      }
    });
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

  // D-292: Any form field differs from original cycle value, or Workstream has changed.
  isDirty(): boolean {
    const f = this.form.value as Record<string, unknown>;
    return (
      f['cycle_title']         !== this.cycle.cycle_title ||
      f['division_id']         !== this.cycle.division_id ||
      f['outcome_statement']   !== (this.cycle.outcome_statement   ?? '') ||
      f['tier_classification'] !== this.cycle.tier_classification ||
      f['assigned_ds_user_id'] !== (this.cycle.assigned_ds_user_id ?? '') ||
      f['assigned_cb_user_id'] !== (this.cycle.assigned_cb_user_id ?? '') ||
      f['jira_epic_key']       !== (this.cycle.jira_epic_key       ?? '') ||
      (this.selectedWorkstream?.workstream_id ?? null) !== (this.cycle.workstream_id ?? null)
    );
  }

  confirmDiscard(): void {
    this.showDiscardConfirm = false;
    this.cancelled.emit();
  }

  keepEditing(): void {
    this.showDiscardConfirm = false;
    this.cdr.markForCheck();
  }
}
