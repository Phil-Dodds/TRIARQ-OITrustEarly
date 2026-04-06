// delivery-cycle-create-panel.component.ts — Pathways OI Trust
// Create Cycle right-panel form. Rebuilt per correction spec 2026-04-05.
//
// D-180 (Right-Panel Entity Detail, Principle 10):
//   Opens as a right panel alongside the dashboard — dashboard stays visible.
//   No route change on open/close.
//
// D-182 (Entity Picker Pattern, Principle 12):
//   Workstream uses WorkstreamPickerComponent (CC-002).
//   DS and CB use UserPickerComponent (D-182 DS/CB scope logic, CC-007 two-scope).
//
// D-165: Delivery Workstream is optional at creation. Required before Brief Review gate.
//   CC-correction: correction spec 2026-04-05 incorrectly marked Workstream as Required.
//   D-165 takes precedence — field remains optional. Noted for Design Chat review.
//
// D-174: DS and CB are nullable at creation. Gate enforcement at MCP level only.
//
// CC-008: Field order is Division → Delivery Cycle Title (not Title → Division as correction spec states).
//   Phil confirmed Division-first order (2026-04-05 session). CC-004 order preserved.
//
// CC-009: Target Dates removed from create form per correction spec 2026-04-05.
//   They belong on cycle detail view, not creation.
//
// D-151, D-184: QPathways design tokens applied throughout. Roboto font. Entity names capitalized.
// D-178: Tier 2 button spinner during submission, Tier 3 overlay on create operation.
// D-93: No direct Supabase access — all data via DeliveryService → MCP.
// ChangeDetection: OnPush.

import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { DeliveryService }           from '../../../core/services/delivery.service';
import { UserProfileService }        from '../../../core/services/user-profile.service';
import { LoadingOverlayComponent }   from '../../../shared/components/loading-overlay/loading-overlay.component';
import { WorkstreamPickerComponent } from '../../../shared/pickers/workstream-picker/workstream-picker.component';
import { UserPickerComponent }       from '../../../shared/pickers/user-picker/user-picker.component';
import { Division, DeliveryWorkstream, DeliveryCycle, TierClassification, User } from '../../../core/types/database';

@Component({
  selector: 'app-delivery-cycle-create-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, IonicModule,
    LoadingOverlayComponent, WorkstreamPickerComponent, UserPickerComponent
  ],
  template: `
    <!-- D-180: Right panel — Deep Navy header, body with 24px padding -->
    <div class="cp-panel" style="position:relative;">

      <!-- D-178 Tier 3 overlay during submit -->
      <app-loading-overlay [visible]="submitting" message="Creating Delivery Cycle…"></app-loading-overlay>

      <!-- Panel header -->
      <div class="cp-header">
        <h2 class="cp-title">New Delivery Cycle</h2>
        <button class="cp-close" type="button" (click)="close()" aria-label="Close panel">✕</button>
      </div>

      <!-- Panel body -->
      <div class="cp-body">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- 1. Division -->
          <div class="cp-field">
            <label class="cp-label">
              Division <span class="cp-required" aria-hidden="true">*</span>
            </label>
            <select formControlName="division_id" class="cp-input"
                    (change)="onDivisionChange()">
              <option value="">— Select Division —</option>
              <option *ngFor="let d of divisions" [value]="d.id">{{ d.division_name }}</option>
            </select>
            <div *ngIf="f['division_id'].invalid && f['division_id'].touched"
                 class="cp-field-error">Division is required.</div>
          </div>

          <!-- 2. Delivery Cycle Title (CC-008: Division first, per Phil's instruction) -->
          <div class="cp-field">
            <label class="cp-label">
              Delivery Cycle Title <span class="cp-required" aria-hidden="true">*</span>
            </label>
            <input formControlName="cycle_title" class="cp-input"
                   type="text" maxlength="120"
                   placeholder="e.g. Member Attribution Model" />
            <div *ngIf="f['cycle_title'].invalid && f['cycle_title'].touched"
                 class="cp-field-error">Delivery Cycle Title is required.</div>
          </div>

          <!-- 3. Delivery Workstream (optional per D-165, picker per D-182/CC-002) -->
          <div class="cp-field">
            <label class="cp-label">
              Delivery Workstream
              <span class="cp-optional-tag"> — recommended</span>
            </label>
            <button type="button" class="cp-picker-trigger"
                    (click)="openWorkstreamPicker()">
              <span *ngIf="!selectedWorkstream" class="cp-picker-placeholder">
                — Assign later —
              </span>
              <span *ngIf="selectedWorkstream" class="cp-picker-value">
                <span class="cp-entity-chip">
                  {{ selectedWorkstream.workstream_name }}
                  <span class="cp-chip-meta">({{ selectedWorkstream.home_division_name ?? '' }})</span>
                </span>
              </span>
            </button>
            <button *ngIf="selectedWorkstream" type="button"
                    class="cp-chip-remove"
                    (click)="selectedWorkstream = null"
                    aria-label="Remove Workstream">✕ Remove</button>
            <div class="cp-gate-note">Required before Brief Review Gate.</div>
          </div>

          <!-- 4. Tier Classification (radio, no default — D-124) -->
          <div class="cp-field">
            <label class="cp-label">
              Tier Classification <span class="cp-required" aria-hidden="true">*</span>
            </label>
            <div class="cp-radio-group" role="radiogroup" aria-label="Tier Classification">
              <label class="cp-radio-option">
                <input type="radio" formControlName="tier_classification" value="tier_1" />
                Tier 1
              </label>
              <label class="cp-radio-option">
                <input type="radio" formControlName="tier_classification" value="tier_2" />
                Tier 2
              </label>
              <label class="cp-radio-option">
                <input type="radio" formControlName="tier_classification" value="tier_3" />
                Tier 3
              </label>
            </div>
            <div *ngIf="f['tier_classification'].invalid && f['tier_classification'].touched"
                 class="cp-field-error">Tier Classification is required.</div>
          </div>

          <!-- 5. Assigned Domain Strategist (optional, UserPicker per D-182) -->
          <div class="cp-field">
            <label class="cp-label">Assigned Domain Strategist</label>
            <div *ngIf="selectedDs; else noDsPicked" class="cp-user-chip-row">
              <span class="cp-entity-chip">
                <span class="cp-user-avatar"
                      [style.background]="selectedDsColor">{{ selectedDsInitials }}</span>
                {{ selectedDs.display_name }}
              </span>
              <button type="button" class="cp-chip-remove"
                      (click)="clearDs()">✕ Remove</button>
            </div>
            <ng-template #noDsPicked>
              <button type="button" class="cp-picker-trigger"
                      (click)="openDsPicker()">
                — Assign later —
              </button>
            </ng-template>
            <div class="cp-gate-note">Required before Brief Review Gate.</div>
          </div>

          <!-- 6. Assigned Capability Builder (optional, UserPicker per D-182) -->
          <div class="cp-field">
            <label class="cp-label">Assigned Capability Builder</label>
            <div *ngIf="selectedCb; else noCbPicked" class="cp-user-chip-row">
              <span class="cp-entity-chip">
                <span class="cp-user-avatar"
                      [style.background]="selectedCbColor">{{ selectedCbInitials }}</span>
                {{ selectedCb.display_name }}
              </span>
              <button type="button" class="cp-chip-remove"
                      (click)="clearCb()">✕ Remove</button>
            </div>
            <ng-template #noCbPicked>
              <button type="button" class="cp-picker-trigger"
                      (click)="openCbPicker()">
                — Assign later —
              </button>
            </ng-template>
            <div class="cp-gate-note">Required before Go to Build Gate.</div>
          </div>

          <!-- 7. Outcome Statement (optional, amber warning when empty) -->
          <div class="cp-field">
            <label class="cp-label">Outcome Statement</label>
            <textarea formControlName="outcome_statement" class="cp-input cp-textarea"
                      rows="3"
                      placeholder="What measurable result will this Delivery Cycle deliver?">
            </textarea>
            <!-- Persistent amber warning per correction spec — shown when field is empty -->
            <div *ngIf="!f['outcome_statement'].value?.trim()"
                 class="cp-amber-warning">
              Outcome Statement should be set before Brief Review. You can add it now or after creation.
            </div>
          </div>

          <!-- 8. Jira Epic Link (optional) -->
          <div class="cp-field">
            <label class="cp-label">Jira Epic Link</label>
            <input formControlName="jira_epic_key" class="cp-input"
                   type="text" placeholder="e.g. PS-2026-041" />
            <div class="cp-gate-note">Required before Go to Build Gate.</div>
          </div>

          <!-- Submission error -->
          <div *ngIf="submitError" class="cp-submit-error" role="alert">
            {{ submitError }}
          </div>

          <!-- Footer -->
          <div class="cp-footer">
            <button type="button" class="cp-btn-cancel" (click)="close()">Cancel</button>
            <!-- D-178 Tier 2: spinner replaces label during submit -->
            <button type="submit" class="cp-btn-create"
                    [disabled]="form.invalid || submitting">
              <ion-spinner *ngIf="submitting" name="crescent"
                           style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
              </ion-spinner>
              {{ submitting ? 'Creating…' : 'Create Delivery Cycle' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Workstream Picker modal (D-182, CC-002) -->
    <app-workstream-picker
      *ngIf="showWorkstreamPicker"
      [cycleDivisionId]="form.get('division_id')?.value || null"
      [currentWorkstreamId]="selectedWorkstream?.workstream_id ?? null"
      (workstreamSelected)="onWorkstreamSelected($event)">
    </app-workstream-picker>

    <!-- DS User Picker modal (D-182) -->
    <app-user-picker
      *ngIf="showDsPicker"
      userRole="ds"
      [divisionId]="form.get('division_id')?.value || null"
      [currentUserId]="selectedDs?.id ?? null"
      (userSelected)="onDsSelected($event)">
    </app-user-picker>

    <!-- CB User Picker modal (D-182) -->
    <app-user-picker
      *ngIf="showCbPicker"
      userRole="cb"
      [divisionId]="form.get('division_id')?.value || null"
      [currentUserId]="selectedCb?.id ?? null"
      (userSelected)="onCbSelected($event)">
    </app-user-picker>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .cp-panel {
      display: flex; flex-direction: column;
      height: 100%; background: #fff;
      border-left: 1px solid #E0E0E0;
      overflow: hidden;
    }

    /* Header — Deep Navy per visual layout standards */
    .cp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; height: 64px; flex-shrink: 0;
      background: #12274A;
    }
    .cp-title {
      margin: 0; font: 700 20px/1.2 Roboto, sans-serif; color: #fff;
    }
    .cp-close {
      background: none; border: none; color: rgba(255,255,255,0.7);
      font-size: 20px; cursor: pointer; padding: 4px 8px; line-height: 1;
    }
    .cp-close:hover { color: #fff; }

    /* Body */
    .cp-body {
      flex: 1; overflow-y: auto; padding: 24px;
    }

    /* Fields */
    .cp-field { margin-bottom: 16px; }
    .cp-label {
      display: block; margin-bottom: 6px;
      font: 500 13px/1.3 Roboto, sans-serif; color: #5A5A5A;
    }
    .cp-required { color: #E96127; margin-left: 2px; }
    .cp-optional-tag { font-weight: 400; color: #9E9E9E; }

    .cp-input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #D0D0D0; border-radius: 5px;
      padding: 10px 12px; font: 400 14px Roboto, sans-serif; color: #262626;
      background: #fff;
    }
    .cp-input:focus {
      outline: none; border-color: #257099;
      box-shadow: 0 0 0 3px rgba(37,112,153,0.15);
    }
    select.cp-input { appearance: auto; }
    .cp-textarea { min-height: 80px; resize: vertical; }

    .cp-field-error {
      margin-top: 4px; font: 400 12px Roboto, sans-serif; color: #C62828;
    }
    .cp-gate-note {
      margin-top: 4px; font: 400 12px italic Roboto, sans-serif; color: #9E9E9E;
    }

    /* Radio group */
    .cp-radio-group { display: flex; gap: 24px; align-items: center; padding: 8px 0; }
    .cp-radio-option {
      display: flex; align-items: center; gap: 8px;
      font: 400 14px Roboto, sans-serif; color: #262626; cursor: pointer;
    }

    /* Picker trigger */
    .cp-picker-trigger {
      width: 100%; text-align: left; cursor: pointer;
      border: 1.5px solid #D0D0D0; border-radius: 5px;
      padding: 10px 12px; font: 400 14px Roboto, sans-serif;
      background: #fff; color: #262626;
    }
    .cp-picker-trigger:hover { border-color: #257099; }
    .cp-picker-placeholder { color: #9E9E9E; }

    /* Entity chips */
    .cp-entity-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(37,112,153,0.08); border-radius: 999px;
      padding: 4px 12px 4px 8px;
      font: 400 13px Roboto, sans-serif; color: #262626;
    }
    .cp-chip-meta { font-size: 11px; color: #5A5A5A; }
    .cp-user-avatar {
      width: 22px; height: 22px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font: 600 9px Roboto, sans-serif; color: #fff; flex-shrink: 0;
    }

    .cp-user-chip-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .cp-chip-remove {
      background: none; border: none; cursor: pointer;
      font: 400 12px Roboto, sans-serif; color: #9E9E9E; padding: 2px 4px;
    }
    .cp-chip-remove:hover { color: #C62828; }

    /* Amber warning — Outcome Statement */
    .cp-amber-warning {
      margin-top: 6px;
      background: #FFF8E1;
      border-left: 3px solid #F2A620;
      border-radius: 4px;
      padding: 10px 12px;
      font: 400 12px italic Roboto, sans-serif;
      color: #5A5A5A;
    }

    /* Submit error */
    .cp-submit-error {
      margin-bottom: 12px; padding: 10px 12px;
      background: #FFEBEE; border-left: 3px solid #C62828; border-radius: 4px;
      font: 400 13px Roboto, sans-serif; color: #C62828;
    }

    /* Footer */
    .cp-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding-top: 20px; margin-top: 8px;
      border-top: 1px solid #E8E8E8;
    }
    .cp-btn-cancel {
      background: #fff; border: 1.5px solid #D0D0D0; border-radius: 5px;
      padding: 10px 20px; font: 500 14px Roboto, sans-serif; color: #5A5A5A;
      cursor: pointer;
    }
    .cp-btn-cancel:hover { background: #F5F5F5; }
    .cp-btn-create {
      background: #257099; border: none; border-radius: 5px;
      padding: 10px 24px; font: 500 14px Roboto, sans-serif; color: #fff;
      cursor: pointer; display: flex; align-items: center; gap: 4px;
    }
    .cp-btn-create:hover:not(:disabled) { background: #1d5878; }
    .cp-btn-create:disabled { opacity: 0.45; cursor: not-allowed; }
  `]
})
export class DeliveryCycleCreatePanelComponent implements OnInit, OnDestroy {
  @Input() divisions: Division[] = [];

  @Output() cycleCreated = new EventEmitter<DeliveryCycle>();
  @Output() panelClosed  = new EventEmitter<void>();

  form!: FormGroup;

  submitting  = false;
  submitError = '';

  // Workstream picker state (CC-002)
  showWorkstreamPicker = false;
  selectedWorkstream: DeliveryWorkstream | null = null;

  // DS picker state (D-182)
  showDsPicker = false;
  selectedDs:       User | null = null;
  selectedDsInitials = '';
  selectedDsColor    = '#257099';

  // CB picker state (D-182)
  showCbPicker = false;
  selectedCb:       User | null = null;
  selectedCbInitials = '';
  selectedCbColor    = '#257099';

  private subs = new Subscription();

  get f() { return this.form.controls; }

  constructor(
    private readonly fb:       FormBuilder,
    private readonly delivery: DeliveryService,
    private readonly profile:  UserProfileService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      division_id:         ['', Validators.required],
      cycle_title:         ['', [Validators.required, Validators.maxLength(120)]],
      tier_classification: ['', Validators.required],
      outcome_statement:   [''],
      jira_epic_key:       ['']
    });

    // Pre-populate DS if caller is DS role (CC-004 auto-assignment rule)
    this.subs.add(
      this.profile.profile$.pipe(filter(p => p !== null), take(1)).subscribe(p => {
        if (p?.system_role === 'ds' && p.id && p.display_name) {
          this.selectedDs = p as unknown as User;
          this.updateDsChip(this.selectedDs);
          this.cdr.markForCheck();
        }
        // If user has only one Division, pre-select it
        if (this.divisions.length === 1) {
          this.form.patchValue({ division_id: this.divisions[0].id });
          this.cdr.markForCheck();
        }
      })
    );

    // Auto-select single Division read-only
    if (this.divisions.length === 1) {
      this.form.patchValue({ division_id: this.divisions[0].id });
      this.form.get('division_id')?.disable();
    }
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  onDivisionChange(): void {
    // Clear workstream selection when Division changes — scope changes per CC-002
    this.selectedWorkstream = null;
    this.cdr.markForCheck();
  }

  // ── Workstream picker ───────────────────────────────────────────────────────
  openWorkstreamPicker(): void { this.showWorkstreamPicker = true; this.cdr.markForCheck(); }

  onWorkstreamSelected(ws: DeliveryWorkstream | null): void {
    this.showWorkstreamPicker = false;
    if (ws) {
      this.selectedWorkstream = ws;
      // Supplement spec 3.3: Workstream home Division pre-populates Division if not yet set
      if (!this.form.get('division_id')?.value && ws.home_division_id) {
        this.form.patchValue({ division_id: ws.home_division_id });
      }
    }
    this.cdr.markForCheck();
  }

  // ── DS picker ───────────────────────────────────────────────────────────────
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
    this.selectedDsInitials = nameInitials(user.display_name || '');
    this.selectedDsColor    = avatarColorFromName(user.display_name || '');
  }

  // ── CB picker ───────────────────────────────────────────────────────────────
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
    this.selectedCbInitials = nameInitials(user.display_name || '');
    this.selectedCbColor    = avatarColorFromName(user.display_name || '');
  }

  // ── Submission ───────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting) { return; }

    this.submitting  = true;
    this.submitError = '';
    this.cdr.markForCheck();

    const v = this.form.value as {
      division_id: string; cycle_title: string;
      tier_classification: TierClassification;
      outcome_statement: string; jira_epic_key: string;
    };

    this.delivery.createCycle({
      cycle_title:         v.cycle_title.trim(),
      division_id:         v.division_id,
      tier_classification: v.tier_classification,
      // D-165: workstream optional at creation
      ...(this.selectedWorkstream ? { workstream_id: this.selectedWorkstream.workstream_id } : {}),
      // D-174: DS/CB nullable at creation
      ...(this.selectedDs ? { assigned_ds_user_id: this.selectedDs.id } : {}),
      ...(this.selectedCb ? { assigned_cb_user_id: this.selectedCb.id } : {}),
      // Optional fields — only send if non-empty
      ...(v.outcome_statement?.trim() ? { outcome_statement: v.outcome_statement.trim() } : {}),
      ...(v.jira_epic_key?.trim()     ? { jira_epic_key:     v.jira_epic_key.trim()     } : {})
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycleCreated.emit(res.data);
        } else {
          this.submitError = res.error ?? 'Create failed. Check permissions and try again.';
        }
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.submitError = err?.error ?? 'Create failed. Check permissions and try again.';
        this.submitting  = false;
        this.cdr.markForCheck();
      }
    });
  }

  close(): void { this.panelClosed.emit(); }
}

// ── Utility functions (duplicated from user-picker to keep component standalone) ──
const AVATAR_COLORS_CP = [
  '#257099', '#00274E', '#E96127', '#F2A620',
  '#2E7D32', '#1565C0', '#6A1B9A', '#00695C'
];

function nameInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) { return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
  return (parts[0] || '?').substring(0, 2).toUpperCase();
}

function avatarColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return AVATAR_COLORS_CP[Math.abs(hash) % AVATAR_COLORS_CP.length];
}
