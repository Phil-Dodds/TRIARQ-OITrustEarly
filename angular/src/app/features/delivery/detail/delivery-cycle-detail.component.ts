// delivery-cycle-detail.component.ts — DeliveryCycleDetailComponent
// Route: /delivery/:cycle_id
// Spec: build-c-spec Section 5.3
//
// Sections:
//  - Cycle header (title, owner, division, workstream, tier, stage)
//  - Outcome Statement (inline edit, amber warning when null)
//  - StageTrackComponent Full mode — gate nodes open gate record panel
//  - Session 2026-03-24-F: amber warning when gate cleared but actual_date not recorded
//  - Milestone dates panel (5 rows, target date editable, actual date displayed)
//  - Gate record panel (opens on gate node click, explains what gates are when empty)
//  - Artifact slots panel (by stage, with placeholders + attach button)
//  - Jira sync panel
//  - Event log (append-only, chronological, bottom)
//
// D-93: DeliveryService only — no Supabase.
// D-140: All blocked actions state what is blocked AND what would need to change.
// Rule 2: Presentation only.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { IonicModule }         from '@ionic/angular';
import { DeliveryService }         from '../../../core/services/delivery.service';
import { StageTrackComponent }     from '../stage-track/stage-track.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import {
  DeliveryCycle,
  CycleMilestoneDate,
  GateRecord,
  CycleArtifact,
  CycleEventLogEntry,
  JiraLink,
  GateName,
  GateStatus,
  GateStateMap,
  TierClassification,
  LifecycleStage
} from '../../../core/types/database';

const GATE_LABELS: Record<GateName, string> = {
  brief_review:   'Brief Review',
  go_to_build:    'Go to Build',
  go_to_deploy:   'Go to Deploy (Pilot Start)',
  go_to_release:  'Go to Release',
  close_review:   'Close Review'
};

const STAGE_LABEL_MAP: Partial<Record<LifecycleStage, string>> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build',
  VALIDATE: 'Validate', PILOT: 'Pilot', UAT: 'UAT', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

@Component({
  selector: 'app-delivery-cycle-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IonicModule, StageTrackComponent, LoadingOverlayComponent],
  template: `
    <!-- D-178 Tier 1: Skeleton screen for initial cycle load -->
    <div *ngIf="loading" style="max-width:1100px;margin:var(--triarq-space-xl) auto;
                                padding:0 var(--triarq-space-md);">
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <ion-skeleton-text animated style="width:28%;height:16px;border-radius:4px;margin-bottom:8px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:55%;height:22px;border-radius:4px;margin-bottom:6px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:38%;height:13px;border-radius:4px;"></ion-skeleton-text>
      </div>
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <ion-skeleton-text animated style="width:22%;height:15px;border-radius:4px;margin-bottom:8px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:78%;height:13px;border-radius:4px;margin-bottom:4px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:55%;height:13px;border-radius:4px;"></ion-skeleton-text>
      </div>
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <ion-skeleton-text animated style="width:18%;height:15px;border-radius:4px;margin-bottom:10px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:100%;height:44px;border-radius:8px;"></ion-skeleton-text>
      </div>
    </div>

    <!-- Load error — D-140: what is blocked + what to do -->
    <div *ngIf="!loading && loadError"
         style="max-width:700px;margin:var(--triarq-space-2xl) auto;" class="oi-card">
      <div style="color:var(--triarq-color-error);font-weight:500;margin-bottom:8px;">
        {{ loadError }}
      </div>
      <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
        Check that you have access to this Division, or return to the
        <a routerLink="/delivery" style="color:var(--triarq-color-primary);">Delivery Dashboard</a>.
        If access has been granted recently, try refreshing.
      </div>
    </div>

    <div *ngIf="!loading && cycle" style="max-width:1100px;margin:var(--triarq-space-xl) auto;
                                          padding:0 var(--triarq-space-md);">

      <!-- ── Cycle Header ───────────────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;
                    flex-wrap:wrap;gap:var(--triarq-space-sm);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;
                        margin-bottom:var(--triarq-space-xs);">
              <span class="oi-pill"
                    [style.background]="stagePillBg(cycle.current_lifecycle_stage)"
                    style="font-size:11px;">
                {{ STAGE_LABEL_MAP[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
              </span>
              <span class="oi-pill"
                    [style.background]="tierPillBg(cycle.tier_classification)"
                    style="font-size:11px;">
                {{ cycle.tier_classification.replace('_',' ').toUpperCase() }}
              </span>
            </div>
            <h3 style="margin:0 0 4px 0;">{{ cycle.cycle_title }}</h3>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              {{ cycle.workstream?.workstream_name ?? cycle.workstream_id }}
              &nbsp;·&nbsp;
              {{ cycle.division_name ?? cycle.division_id }}
            </div>
          </div>
          <button
            *ngIf="canAdvance"
            class="oi-btn-primary"
            (click)="advanceStage()"
            [disabled]="advancing"
            style="white-space:nowrap;font-size:var(--triarq-text-small);
                   display:flex;align-items:center;gap:6px;">
            <ion-spinner *ngIf="advancing" name="crescent" style="width:14px;height:14px;"></ion-spinner>
            <span>{{ advancing ? 'Advancing…' : 'Advance Stage' }}</span>
          </button>
        </div>
        <!-- Advance error — D-140 -->
        <div *ngIf="advanceError"
             style="margin-top:var(--triarq-space-xs);font-size:var(--triarq-text-small);">
          <span style="color:var(--triarq-color-error);font-weight:500;">{{ advanceError }}</span>
          <span style="color:var(--triarq-color-text-secondary);margin-left:6px;">
            Clear the required gate before advancing. If the gate shows as blocked,
            reactivate the Workstream first.
          </span>
        </div>
      </div>

      <!-- ── Outcome Statement ──────────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:var(--triarq-space-xs);">
          <span style="font-weight:500;font-size:var(--triarq-text-body);">Outcome Statement</span>
          <button *ngIf="!editingOutcome"
                  (click)="startOutcomeEdit()"
                  style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                         background:none;border:none;cursor:pointer;padding:0;">
            {{ cycle.outcome_statement ? 'Edit' : 'Add' }}
          </button>
        </div>

        <!-- Amber warning when not set -->
        <div *ngIf="!cycle.outcome_statement && !editingOutcome"
             style="color:var(--triarq-color-sunray,#f5a623);font-size:var(--triarq-text-small);
                    font-weight:500;margin-bottom:var(--triarq-space-xs);">
          ⚠ Outcome statement not yet set. Use "Add" to describe what this cycle is expected to deliver.
        </div>

        <div *ngIf="cycle.outcome_statement && !editingOutcome"
             style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-primary);
                    white-space:pre-wrap;">
          {{ cycle.outcome_statement }}
        </div>

        <!-- Inline edit -->
        <div *ngIf="editingOutcome">
          <textarea
            [formControl]="outcomeControl"
            class="oi-input"
            rows="3"
            placeholder="Describe the outcome this cycle is expected to deliver…"
            style="width:100%;resize:vertical;"
          ></textarea>
          <div style="margin-top:var(--triarq-space-xs);display:flex;gap:var(--triarq-space-sm);align-items:center;">
            <button class="oi-btn-primary" (click)="saveOutcome()" [disabled]="savingOutcome"
                    style="display:flex;align-items:center;gap:6px;">
              <ion-spinner *ngIf="savingOutcome" name="crescent" style="width:14px;height:14px;"></ion-spinner>
              <span>{{ savingOutcome ? 'Saving…' : 'Save' }}</span>
            </button>
            <button (click)="cancelOutcomeEdit()"
                    style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                           background:none;border:none;cursor:pointer;">Cancel</button>
            <span *ngIf="outcomeError"
                  style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);">
              {{ outcomeError }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Stage Track — Full mode ─────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="font-weight:500;margin-bottom:4px;">Lifecycle Track</div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                    margin-bottom:var(--triarq-space-sm);">
          Click a gate diamond to open its record and record a decision.
        </div>
        <app-stage-track
          [currentStageId]="cycle.current_lifecycle_stage"
          [gateStateMap]="gateStateMap"
          displayMode="full"
          (gateClicked)="openGatePanel($event)"
        ></app-stage-track>
      </div>

      <!-- ── Session 2026-03-24-F: missing actual date warning ───────────── -->
      <div *ngIf="missingActualDateWarnings.length > 0"
           style="margin-bottom:var(--triarq-space-md);
                  background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                  border-radius:0 6px 6px 0;padding:var(--triarq-space-sm) var(--triarq-space-md);">
        <div style="font-weight:500;font-size:var(--triarq-text-small);margin-bottom:4px;">
          ⚠ Actual date not recorded for cleared gate{{ missingActualDateWarnings.length > 1 ? 's' : '' }}
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ missingActualDateWarnings.join(', ') }} —
          gate{{ missingActualDateWarnings.length > 1 ? 's were' : ' was' }} cleared but the actual
          date was not recorded. Set the Actual Date in the Milestone Dates panel to preserve
          accurate milestone history.
        </div>
      </div>

      <!-- Two-column: Milestones + Gate panel -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--triarq-space-md);
                  margin-bottom:var(--triarq-space-md);">

        <!-- ── Milestone Dates ──────────────────────────────────────────── -->
        <div class="oi-card">
          <div style="font-weight:500;margin-bottom:4px;">Milestone Dates</div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                      margin-bottom:var(--triarq-space-sm);">
            Click a Target Date to edit it. Actual Date is set automatically when a gate is cleared.
          </div>

          <div *ngFor="let m of cycle.milestone_dates; trackBy: trackByMilestoneId"
               style="display:grid;grid-template-columns:2fr 1fr 1fr;
                      gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) 0;
                      border-bottom:1px solid var(--triarq-color-border);
                      font-size:var(--triarq-text-small);align-items:start;">

            <span style="font-weight:500;padding-top:2px;">{{ GATE_LABELS[m.gate_name] }}</span>

            <!-- Target Date cell with inline edit -->
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">
                Target Date
              </div>
              <span *ngIf="editingMilestoneGate !== m.gate_name"
                    [style.color]="milestoneTargetColor(m)"
                    [style.cursor]="'pointer'"
                    style="text-decoration:underline dotted;"
                    (click)="startMilestoneEdit(m)"
                    title="Click to set target date">
                {{ m.target_date ?? '' }}
              </span>
              <span *ngIf="editingMilestoneGate !== m.gate_name && !m.target_date"
                    style="color:var(--triarq-color-primary);cursor:pointer;font-size:10px;"
                    (click)="startMilestoneEdit(m)">
                Set date
              </span>
              <div *ngIf="editingMilestoneGate === m.gate_name"
                   style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                <input [formControl]="milestoneDateControl" type="date"
                       class="oi-input" style="font-size:11px;padding:2px 4px;" />
                <button class="oi-btn-primary"
                        (click)="saveMilestoneDate(m.gate_name)"
                        [disabled]="savingMilestone"
                        style="font-size:10px;padding:2px 6px;white-space:nowrap;
                               display:flex;align-items:center;gap:4px;">
                  <ion-spinner *ngIf="savingMilestone" name="crescent" style="width:12px;height:12px;"></ion-spinner>
                  <span>{{ savingMilestone ? '…' : 'Set' }}</span>
                </button>
                <button (click)="cancelMilestoneEdit()"
                        style="background:none;border:none;cursor:pointer;
                               font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
                  ✕
                </button>
              </div>
              <div *ngIf="milestoneError && editingMilestoneGate === m.gate_name"
                   style="color:var(--triarq-color-error);font-size:10px;margin-top:2px;">
                {{ milestoneError }}
              </div>
            </div>

            <!-- Actual Date column -->
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">
                Actual Date
              </div>
              <span [style.color]="m.actual_date
                      ? (m.actual_date <= (m.target_date ?? m.actual_date)
                          ? 'var(--triarq-color-text-secondary)'
                          : 'var(--triarq-color-error)')
                      : 'var(--triarq-color-text-secondary)'">
                {{ m.actual_date ?? '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Gate Record Panel ────────────────────────────────────────── -->
        <!-- D-178 Tier 3: position:relative required for overlay -->
        <div class="oi-card" style="position:relative;">
          <app-loading-overlay [visible]="gateActionBusy" message="Processing gate…"></app-loading-overlay>
          <div style="font-weight:500;margin-bottom:var(--triarq-space-sm);">
            Gate Record
            <span *ngIf="selectedGate" style="font-weight:400;color:var(--triarq-color-text-secondary);">
              — {{ GATE_LABELS[selectedGate] }}
            </span>
          </div>

          <!-- Empty state — explain what gates are and how to interact -->
          <div *ngIf="!selectedGate"
               style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
            <p style="margin:0 0 8px 0;">
              Gates are formal checkpoints in the lifecycle. Each gate must be approved
              before the cycle can advance past it.
            </p>
            <p style="margin:0;">
              Click a gate diamond on the Lifecycle Track above to view the gate record,
              submit for approval, or record an Approve or Return decision.
            </p>
          </div>

          <!-- Gate selected, no record yet -->
          <div *ngIf="selectedGate && !selectedGateRecord"
               style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
            <p style="margin:0 0 8px 0;">
              <strong>{{ GATE_LABELS[selectedGate] }}</strong> has not been submitted yet.
            </p>
            <p style="margin:0;">
              Use the "Submit for Approval" button below when the cycle is ready for this gate review.
            </p>
            <button class="oi-btn-primary"
                    style="margin-top:var(--triarq-space-sm);font-size:var(--triarq-text-small);
                           display:flex;align-items:center;gap:6px;"
                    (click)="submitGate(selectedGate!)"
                    [disabled]="gateActionBusy">
              <ion-spinner *ngIf="gateActionBusy" name="crescent" style="width:14px;height:14px;"></ion-spinner>
              <span>Submit for Approval</span>
            </button>
            <div *ngIf="gateActionError"
                 style="margin-top:var(--triarq-space-xs);font-size:var(--triarq-text-small);">
              <span style="color:var(--triarq-color-error);font-weight:500;">{{ gateActionError }}</span>
              <div style="color:var(--triarq-color-text-secondary);margin-top:4px;">
                {{ gateActionHint }}
              </div>
            </div>
          </div>

          <!-- Gate record exists -->
          <div *ngIf="selectedGate && selectedGateRecord">
            <!-- Status pill -->
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);
                        margin-bottom:var(--triarq-space-sm);">
              <span class="oi-pill"
                    [style.background]="gateStatusBg(selectedGateRecord.gate_status)"
                    [style.color]="gateStatusColor(selectedGateRecord.gate_status)"
                    style="font-size:11px;">
                {{ selectedGateRecord.gate_status.toUpperCase() }}
              </span>
              <!-- D-140: blocked explanation -->
              <span *ngIf="selectedGateRecord.workstream_active_at_clearance === false"
                    style="font-size:var(--triarq-text-small);color:var(--triarq-color-error);">
                Workstream was inactive at last clearance attempt.
                Reactivate the Workstream in Admin → Workstreams, then resubmit.
              </span>
            </div>

            <!-- Approver Return Notes -->
            <div *ngIf="selectedGateRecord.approver_notes"
                 style="font-size:var(--triarq-text-small);margin-bottom:var(--triarq-space-sm);
                        background:var(--triarq-color-background-subtle);
                        border-radius:6px;padding:var(--triarq-space-xs);">
              <span style="font-weight:500;">Approver Return Notes:</span>
              {{ selectedGateRecord.approver_notes }}
            </div>

            <!-- Submit action (gate pending, not yet submitted) -->
            <div *ngIf="selectedGateRecord.gate_status === 'returned' || selectedGateRecord.gate_status === 'pending'"
                 style="margin-bottom:var(--triarq-space-sm);">
              <button class="oi-btn-primary"
                      (click)="submitGate(selectedGate!)"
                      [disabled]="gateActionBusy"
                      style="font-size:var(--triarq-text-small);
                             display:flex;align-items:center;gap:6px;">
                <ion-spinner *ngIf="gateActionBusy" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                <span>Submit for Approval</span>
              </button>
            </div>

            <!-- Approver decision form — shown when gate is pending -->
            <div *ngIf="selectedGateRecord.gate_status === 'pending'"
                 style="border-top:1px solid var(--triarq-color-border);
                        padding-top:var(--triarq-space-sm);margin-top:var(--triarq-space-sm);">
              <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:4px;">
                Record Decision
              </div>
              <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                          margin-bottom:var(--triarq-space-xs);">
                Approver Return Notes are required when returning. Notes are optional for approval.
              </div>
              <form [formGroup]="gateDecisionForm" (ngSubmit)="recordDecision(selectedGate!)">
                <textarea
                  formControlName="approver_notes"
                  class="oi-input"
                  rows="2"
                  placeholder="Approver Return Notes (required if returning)"
                  style="width:100%;resize:none;font-size:var(--triarq-text-small);"
                ></textarea>
                <div style="display:flex;gap:var(--triarq-space-sm);margin-top:var(--triarq-space-xs);">
                  <button type="button" class="oi-btn-primary"
                          (click)="recordDecisionWithValue(selectedGate!, 'approved')"
                          [disabled]="gateActionBusy"
                          style="font-size:var(--triarq-text-small);
                                 display:flex;align-items:center;gap:6px;">
                    <ion-spinner *ngIf="gateActionBusy" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                    <span>✓ Approve</span>
                  </button>
                  <button type="button"
                          (click)="recordDecisionWithValue(selectedGate!, 'returned')"
                          [disabled]="gateActionBusy"
                          style="font-size:var(--triarq-text-small);color:var(--triarq-color-error);
                                 background:none;border:1px solid var(--triarq-color-error);
                                 border-radius:5px;padding:6px 12px;cursor:pointer;
                                 display:flex;align-items:center;gap:6px;">
                    <ion-spinner *ngIf="gateActionBusy" name="crescent"
                                 style="width:14px;height:14px;color:var(--triarq-color-error);"></ion-spinner>
                    <span>✗ Return</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Gate action feedback — D-140 -->
            <div *ngIf="gateActionError"
                 style="margin-top:var(--triarq-space-xs);font-size:var(--triarq-text-small);">
              <span style="color:var(--triarq-color-error);font-weight:500;">{{ gateActionError }}</span>
              <div *ngIf="gateActionHint"
                   style="color:var(--triarq-color-text-secondary);margin-top:4px;">
                {{ gateActionHint }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Artifact Slots ────────────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:var(--triarq-space-xs);">
          <span style="font-weight:500;">Cycle Artifacts</span>
          <button *ngIf="!showAttachForm"
                  (click)="openAttachForm('')"
                  style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                         background:none;border:none;cursor:pointer;padding:0;">
            + Attach ad hoc document
          </button>
        </div>
        <p style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);">
          Artifacts are grouped by the lifecycle stage they belong to. Attach an external URL
          to fill a slot. Use "→ OI Library" to record the artifact in the OI Library
          (full submission completes in Build B).
        </p>

        <!-- Attach form — D-178 Tier 3: position:relative for overlay -->
        <div *ngIf="showAttachForm"
             style="background:var(--triarq-color-background-subtle);
                    border-radius:6px;padding:var(--triarq-space-sm);
                    margin-bottom:var(--triarq-space-sm);position:relative;">
          <app-loading-overlay [visible]="attaching" message="Attaching artifact…"></app-loading-overlay>
          <form [formGroup]="attachForm" (ngSubmit)="submitAttach()">
            <div style="display:grid;gap:var(--triarq-space-xs);grid-template-columns:2fr 3fr auto;">
              <div>
                <label style="display:block;font-size:10px;margin-bottom:2px;">Artifact Title *</label>
                <input formControlName="display_name" class="oi-input"
                       style="font-size:var(--triarq-text-small);"
                       placeholder="e.g. Context Brief v2" />
              </div>
              <div>
                <label style="display:block;font-size:10px;margin-bottom:2px;">External URL *</label>
                <input formControlName="external_url" class="oi-input" type="url"
                       placeholder="https://…"
                       style="font-size:var(--triarq-text-small);" />
              </div>
              <div style="display:flex;align-items:flex-end;gap:4px;">
                <button type="submit" class="oi-btn-primary"
                        [disabled]="attachForm.invalid || attaching"
                        style="font-size:var(--triarq-text-small);white-space:nowrap;
                               display:flex;align-items:center;gap:6px;">
                  <ion-spinner *ngIf="attaching" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                  <span>{{ attaching ? 'Attaching…' : 'Attach' }}</span>
                </button>
                <button type="button" (click)="cancelAttach()"
                        style="background:none;border:none;cursor:pointer;
                               font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
                  ✕
                </button>
              </div>
            </div>
            <div *ngIf="attachError"
                 style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
              {{ attachError }}
            </div>
          </form>
        </div>

        <!-- Promote stub message — inline, not alert -->
        <div *ngIf="promoteStubMessage"
             style="background:#e3f2fd;border-left:4px solid var(--triarq-color-primary);
                    border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    font-size:var(--triarq-text-small);margin-bottom:var(--triarq-space-sm);">
          {{ promoteStubMessage }}
        </div>

        <!-- Artifacts by lifecycle stage -->
        <div *ngFor="let group of artifactsByStage">
          <div style="font-size:var(--triarq-text-small);font-weight:500;
                      color:var(--triarq-color-primary);
                      margin:var(--triarq-space-sm) 0 var(--triarq-space-xs) 0;">
            {{ group.stage }}
          </div>
          <div *ngFor="let slot of group.slots"
               style="display:grid;grid-template-columns:2fr 3fr 110px;
                      gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) 0;
                      border-bottom:1px solid var(--triarq-color-border);
                      font-size:var(--triarq-text-small);align-items:center;">
            <span style="color:var(--triarq-color-text-secondary);">{{ slot.artifact_type_name }}</span>
            <span *ngIf="slot.external_url">
              <a [href]="slot.external_url" target="_blank" rel="noopener noreferrer"
                 style="color:var(--triarq-color-primary);word-break:break-all;">
                {{ slot.display_name }}
              </a>
              <span *ngIf="slot.pointer_status === 'promoted'"
                    style="margin-left:6px;font-size:10px;color:var(--triarq-color-primary);
                           background:#e3f2fd;border-radius:4px;padding:1px 5px;">
                OI Library
              </span>
            </span>
            <span *ngIf="!slot.external_url && !slot.oi_library_artifact_id"
                  style="color:var(--triarq-color-text-secondary);font-style:italic;">
              Not yet attached
            </span>
            <span style="text-align:right;">
              <button *ngIf="!slot.external_url"
                      (click)="openAttachForm(slot.artifact_type_id ?? '')"
                      style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                             background:none;border:none;cursor:pointer;padding:0;">
                Attach
              </button>
              <button *ngIf="slot.external_url && slot.pointer_status === 'external_only'"
                      (click)="promoteArtifact(slot)"
                      style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                             background:none;border:none;cursor:pointer;padding:0;"
                      title="Record in OI Library (submission completes in Build B)">
                → OI Library
              </button>
            </span>
          </div>
        </div>

        <div *ngIf="artifactsByStage.length === 0"
             style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          No artifacts attached yet. Use "Attach ad hoc document" above or the Attach button
          next to a specific slot once artifact types are seeded.
        </div>
      </div>

      <!-- ── Jira Sync Panel ─────────────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:var(--triarq-space-xs);">
          <span style="font-weight:500;">Jira Sync</span>
          <button *ngIf="jiraLink"
                  class="oi-btn-primary"
                  (click)="triggerJiraSync()"
                  [disabled]="syncing"
                  style="font-size:var(--triarq-text-small);
                         display:flex;align-items:center;gap:6px;">
            <ion-spinner *ngIf="syncing" name="crescent" style="width:14px;height:14px;"></ion-spinner>
            <span>{{ syncing ? 'Syncing…' : 'Sync Now' }}</span>
          </button>
        </div>
        <div *ngIf="!jiraLink"
             style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          No Jira epic linked to this cycle. Link a Jira epic key to enable
          two-way sync of the five governance fields (ARCH-16).
        </div>
        <div *ngIf="jiraLink">
          <div style="font-size:var(--triarq-text-small);">
            Epic: <strong>{{ jiraLink.jira_epic_key }}</strong>
            &nbsp;·&nbsp; Sync Status:
            <span [style.color]="jiraLink.sync_status === 'synced'
                    ? 'var(--triarq-color-success,#2e7d32)'
                    : jiraLink.sync_status === 'error'
                      ? 'var(--triarq-color-error)'
                      : 'var(--triarq-color-text-secondary)'">
              {{ jiraLink.sync_status }}
            </span>
            <span *ngIf="jiraLink.last_synced_at"
                  style="color:var(--triarq-color-text-secondary);">
              &nbsp;· Last synced: {{ jiraLink.last_synced_at | date:'short' }}
            </span>
          </div>
          <div *ngIf="jiraLink.last_sync_error"
               style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
            Last sync error: {{ jiraLink.last_sync_error }}
          </div>
          <div *ngIf="syncStubMessage"
               style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                      margin-top:4px;">
            {{ syncStubMessage }}
          </div>
        </div>
      </div>

      <!-- ── Event Log ─────────────────────────────────────────────────── -->
      <div class="oi-card">
        <div style="font-weight:500;margin-bottom:4px;">Event Log</div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                    margin-bottom:var(--triarq-space-sm);">
          Append-only record of all stage advances, gate decisions, artifact attachments,
          and outcome changes. Oldest events at the top.
        </div>
        <!-- D-178 Tier 1: skeleton for event log load -->
        <div *ngIf="loadingEvents">
          <div *ngFor="let _ of [1,2,3]"
               style="display:grid;grid-template-columns:140px 1fr;gap:var(--triarq-space-sm);
                      padding:var(--triarq-space-xs) 0;border-bottom:1px solid var(--triarq-color-border);">
            <ion-skeleton-text animated style="height:13px;border-radius:4px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:13px;border-radius:4px;"></ion-skeleton-text>
          </div>
        </div>
        <div *ngIf="!loadingEvents && events.length === 0"
             style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          No events recorded yet. Events appear here as the cycle progresses.
        </div>
        <div *ngFor="let ev of events"
             style="display:grid;grid-template-columns:140px 1fr;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) 0;
                    border-bottom:1px solid var(--triarq-color-border);
                    font-size:var(--triarq-text-small);">
          <span style="color:var(--triarq-color-text-secondary);white-space:nowrap;">
            {{ ev.created_at | date:'short' }}
          </span>
          <span>
            <span class="oi-pill"
                  style="font-size:9px;background:var(--triarq-color-background-subtle);
                         margin-right:6px;">
              {{ ev.event_type }}
            </span>
            {{ ev.event_description }}
          </span>
        </div>
      </div>

      <!-- Footer nav -->
      <div style="margin-top:var(--triarq-space-lg);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);">
          ← Delivery Dashboard
        </a>
      </div>
    </div>
  `
})
export class DeliveryCycleDetailComponent implements OnInit {

  cycle:         DeliveryCycle | null    = null;
  events:        CycleEventLogEntry[]    = [];
  loading        = false;
  loadingEvents  = false;
  loadError      = '';

  // Outcome
  editingOutcome = false;
  savingOutcome  = false;
  outcomeError   = '';
  outcomeControl = new FormControl('', Validators.required);

  // Stage advance
  advancing     = false;
  advanceError  = '';

  // Gate panel
  selectedGate:       GateName | null   = null;
  selectedGateRecord: GateRecord | null = null;
  gateActionBusy      = false;
  gateActionError     = '';
  gateActionHint      = '';
  gateDecisionForm!:  FormGroup;

  // Milestone dates
  editingMilestoneGate: GateName | null = null;
  savingMilestone       = false;
  milestoneError        = '';
  milestoneDateControl  = new FormControl('');

  // Artifacts
  showAttachForm    = false;
  attaching         = false;
  attachError       = '';
  attachingTypeId   = '';
  promoteStubMessage = '';
  attachForm!:      FormGroup;

  // Jira
  syncing         = false;
  syncStubMessage = '';

  // Expose constants to template
  readonly GATE_LABELS     = GATE_LABELS;
  readonly STAGE_LABEL_MAP = STAGE_LABEL_MAP;

  constructor(
    private readonly route:    ActivatedRoute,
    private readonly delivery: DeliveryService,
    private readonly fb:       FormBuilder,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.gateDecisionForm = this.fb.group({ approver_notes: [''] });
    this.attachForm = this.fb.group({
      display_name: ['', Validators.required],
      external_url: ['', Validators.required]
    });
    const cycleId = this.route.snapshot.paramMap.get('cycle_id');
    if (cycleId) { this.loadCycle(cycleId); }
  }

  private loadCycle(cycleId: string): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.delivery.getCycle(cycleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle = res.data;
          this.loadEvents(cycleId);
        } else {
          this.loadError = res.error ?? 'Could not load this cycle.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err.error ?? 'Could not load cycle. Check your access and try again.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadEvents(cycleId: string): void {
    this.loadingEvents = true;
    this.cdr.markForCheck();
    this.delivery.getEventLog(cycleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events = Array.isArray(res.data) ? res.data : [];
        }
        this.loadingEvents = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingEvents = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Computed properties ────────────────────────────────────────────────────

  get gateStateMap(): GateStateMap {
    const gates: GateName[] = ['brief_review','go_to_build','go_to_deploy','go_to_release','close_review'];
    const map: Partial<GateStateMap> = {};
    for (const gate of gates) {
      const record = this.cycle?.gate_records?.find(g => g.gate_name === gate);
      if (!record)                           { map[gate] = 'upcoming'; continue; }
      if (record.gate_status === 'approved') { map[gate] = 'complete'; continue; }
      if (record.gate_status === 'blocked')  { map[gate] = 'blocked';  continue; }
      map[gate] = 'pending';
    }
    return map as GateStateMap;
  }

  get jiraLink(): JiraLink | null {
    return this.cycle?.jira_links?.[0] ?? null;
  }

  get canAdvance(): boolean {
    const terminal: LifecycleStage[] = ['COMPLETE', 'CANCELLED'];
    return !!this.cycle && !terminal.includes(this.cycle.current_lifecycle_stage);
  }

  /**
   * Session 2026-03-24-F: gates where gate_status = 'approved' but
   * the corresponding milestone has no actual_date.
   * Returns gate labels for display in the warning panel.
   */
  get missingActualDateWarnings(): string[] {
    if (!this.cycle) { return []; }
    const approvedGates = this.cycle.gate_records?.filter(g => g.gate_status === 'approved') ?? [];
    return approvedGates
      .filter(g => {
        const milestone = this.cycle!.milestone_dates?.find(m => m.gate_name === g.gate_name);
        return milestone && !milestone.actual_date;
      })
      .map(g => GATE_LABELS[g.gate_name]);
  }

  /** Group cycle artifacts by lifecycle_stage for the artifacts panel */
  get artifactsByStage(): { stage: string; slots: CycleArtifact[] }[] {
    const artifacts = this.cycle?.artifacts;
    if (!artifacts?.length) { return []; }
    const stages = [...new Set(artifacts.map(a => a.lifecycle_stage ?? 'General'))];
    return stages.map(stage => ({
      stage,
      slots: artifacts.filter(a => (a.lifecycle_stage ?? 'General') === stage)
    }));
  }

  // ── Outcome ────────────────────────────────────────────────────────────────

  startOutcomeEdit(): void {
    this.outcomeControl.setValue(this.cycle?.outcome_statement ?? '');
    this.editingOutcome = true;
    this.outcomeError   = '';
    this.cdr.markForCheck();
  }

  cancelOutcomeEdit(): void {
    this.editingOutcome = false;
    this.outcomeError   = '';
    this.cdr.markForCheck();
  }

  saveOutcome(): void {
    if (!this.cycle || !this.outcomeControl.value?.trim()) { return; }
    this.savingOutcome = true;
    this.outcomeError  = '';
    this.cdr.markForCheck();

    this.delivery.setOutcomeStatement({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      outcome_statement: this.outcomeControl.value.trim()
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle!.outcome_statement = res.data.outcome_statement;
          this.editingOutcome = false;
          this.loadEvents(this.cycle!.delivery_cycle_id);
        } else {
          this.outcomeError = res.error ?? 'Save failed.';
        }
        this.savingOutcome = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.outcomeError  = err.error ?? 'Save failed. Check permissions and try again.';
        this.savingOutcome = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Stage advance ──────────────────────────────────────────────────────────

  advanceStage(): void {
    if (!this.cycle) { return; }
    this.advancing    = true;
    this.advanceError = '';
    this.cdr.markForCheck();

    this.delivery.advanceStage(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.advanceError = res.error ?? 'Advance failed.';
        }
        this.advancing = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.advanceError = err.error ?? 'Advance failed. Check gate status and Workstream.';
        this.advancing    = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Gate panel ─────────────────────────────────────────────────────────────

  openGatePanel(gate: GateName): void {
    this.selectedGate       = gate;
    this.selectedGateRecord = this.cycle?.gate_records?.find(g => g.gate_name === gate) ?? null;
    this.gateActionError    = '';
    this.gateActionHint     = '';
    this.gateDecisionForm.reset();
    this.cdr.markForCheck();
  }

  submitGate(gate: GateName): void {
    if (!this.cycle) { return; }
    this.gateActionBusy  = true;
    this.gateActionError = '';
    this.gateActionHint  = '';
    this.cdr.markForCheck();

    this.delivery.submitGateForApproval({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.gateActionError = res.error ?? 'Submit failed.';
          this.gateActionHint  = 'Check that the Workstream is active. '
            + 'If it has been deactivated, an admin must reactivate it before gates can be submitted.';
        }
        this.gateActionBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.gateActionError = err.error ?? 'Submit failed.';
        this.gateActionHint  = 'Check that the Workstream is active before submitting for approval.';
        this.gateActionBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** No-op — decision submitted via recordDecisionWithValue buttons */
  recordDecision(_gate: GateName): void { /* intentionally empty */ }

  recordDecisionWithValue(gate: GateName, decision: 'approved' | 'returned'): void {
    if (!this.cycle) { return; }
    const notes = (this.gateDecisionForm.value.approver_notes as string) ?? '';

    // D-140: Return requires notes so the team can act on the feedback
    if (decision === 'returned' && !notes.trim()) {
      this.gateActionError = 'Approver Return Notes are required when returning a gate.';
      this.gateActionHint  = 'Add notes explaining what must be resolved before resubmission.';
      this.cdr.markForCheck();
      return;
    }

    this.gateActionBusy  = true;
    this.gateActionError = '';
    this.gateActionHint  = '';
    this.cdr.markForCheck();

    this.delivery.recordGateDecision({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      decision,
      approver_notes:    notes.trim() || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedGate       = null;
          this.selectedGateRecord = null;
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.gateActionError = res.error ?? 'Decision record failed.';
          this.gateActionHint  = decision === 'returned'
            ? 'Provide notes explaining the return reason so the team can act on it.'
            : 'Check Workstream status and try again. If the Workstream is inactive, reactivate it first.';
        }
        this.gateActionBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.gateActionError = err.error ?? 'Decision record failed.';
        this.gateActionBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Milestone dates ────────────────────────────────────────────────────────

  startMilestoneEdit(m: CycleMilestoneDate): void {
    this.editingMilestoneGate = m.gate_name;
    this.milestoneDateControl.setValue(m.target_date ?? '');
    this.milestoneError = '';
    this.cdr.markForCheck();
  }

  cancelMilestoneEdit(): void {
    this.editingMilestoneGate = null;
    this.milestoneError       = '';
    this.cdr.markForCheck();
  }

  saveMilestoneDate(gate: GateName): void {
    if (!this.cycle || !this.milestoneDateControl.value) { return; }
    this.savingMilestone = true;
    this.milestoneError  = '';
    this.cdr.markForCheck();

    this.delivery.setMilestoneTargetDate({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      target_date:       this.milestoneDateControl.value
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle!.milestone_dates?.findIndex(m => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle!.milestone_dates) {
            this.cycle!.milestone_dates[idx] = res.data;
          }
          this.editingMilestoneGate = null;
        } else {
          this.milestoneError = res.error ?? 'Save failed.';
        }
        this.savingMilestone = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.milestoneError  = err.error ?? 'Save failed.';
        this.savingMilestone = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Artifacts ──────────────────────────────────────────────────────────────

  openAttachForm(artifactTypeId: string): void {
    this.attachingTypeId   = artifactTypeId;
    this.showAttachForm    = true;
    this.attachError       = '';
    this.promoteStubMessage = '';
    this.attachForm.reset();
    this.cdr.markForCheck();
  }

  cancelAttach(): void {
    this.showAttachForm = false;
    this.attachError    = '';
    this.cdr.markForCheck();
  }

  submitAttach(): void {
    if (!this.cycle || this.attachForm.invalid) { return; }
    this.attaching   = true;
    this.attachError = '';
    this.cdr.markForCheck();

    this.delivery.attachArtifact({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      artifact_type_id:  this.attachingTypeId || undefined,
      display_name:      this.attachForm.value.display_name as string,
      external_url:      this.attachForm.value.external_url as string
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showAttachForm = false;
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.attachError = res.error ?? 'Attach failed.';
        }
        this.attaching = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.attachError = err.error ?? 'Attach failed. Check the URL and try again.';
        this.attaching   = false;
        this.cdr.markForCheck();
      }
    });
  }

  promoteArtifact(artifact: CycleArtifact): void {
    this.promoteStubMessage = '';
    this.delivery.promoteArtifact({
      cycle_artifact_id:      artifact.cycle_artifact_id,
      oi_library_artifact_id: artifact.cycle_artifact_id // placeholder until OI Library wired in Build B
    }).subscribe({
      next: (res) => {
        // Build C stub — show inline message, not alert
        if (res.stub_message) {
          this.promoteStubMessage = res.stub_message;
        } else if (res.success) {
          this.loadCycle(this.cycle!.delivery_cycle_id);
        }
        this.cdr.markForCheck();
      },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  // ── Jira sync ──────────────────────────────────────────────────────────────

  triggerJiraSync(): void {
    if (!this.cycle || !this.jiraLink) { return; }
    this.syncing         = true;
    this.syncStubMessage = '';
    this.cdr.markForCheck();

    this.delivery.syncJiraEpic({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      jira_epic_key:     this.jiraLink.jira_epic_key
    }).subscribe({
      next: (res) => {
        if (res.success && res.data?.['stub']) {
          this.syncStubMessage = (res.data['message'] as string) ?? '';
        } else if (!res.success) {
          this.syncStubMessage = res.error ?? 'Sync failed.';
        }
        this.loadCycle(this.cycle!.delivery_cycle_id);
        this.syncing = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.syncing = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Presentation helpers ───────────────────────────────────────────────────

  stagePillBg(stage: LifecycleStage): string {
    if (stage === 'COMPLETE')  { return '#e8f5e9'; }
    if (stage === 'CANCELLED') { return '#fdecea'; }
    if (stage === 'ON_HOLD')   { return '#fff8e1'; }
    return 'var(--triarq-color-background-subtle)';
  }

  tierPillBg(tier: TierClassification): string {
    return tier === 'tier_1' ? '#e3f2fd' : tier === 'tier_2' ? '#f3e5f5' : '#e8f5e9';
  }

  gateStatusBg(status: GateStatus): string {
    if (status === 'approved') { return '#e8f5e9'; }
    if (status === 'blocked')  { return '#fdecea'; }
    if (status === 'returned') { return '#fff8e1'; }
    return 'var(--triarq-color-background-subtle)';
  }

  gateStatusColor(status: GateStatus): string {
    if (status === 'approved') { return '#2e7d32'; }
    if (status === 'blocked')  { return 'var(--triarq-color-error)'; }
    if (status === 'returned') { return '#e65100'; }
    return 'var(--triarq-color-text-secondary)';
  }

  milestoneTargetColor(m: CycleMilestoneDate): string {
    if (!m.target_date || m.actual_date) { return 'var(--triarq-color-primary)'; }
    const today = new Date().toISOString().slice(0, 10);
    const diff  = Math.ceil(
      (new Date(m.target_date).getTime() - new Date(today).getTime()) / 86400000
    );
    if (diff < 0)  { return 'var(--triarq-color-error, #d32f2f)'; }
    if (diff <= 4) { return 'var(--triarq-color-sunray, #f5a623)'; }
    return 'var(--triarq-color-primary)';
  }

  trackByMilestoneId(_: number, m: CycleMilestoneDate): string {
    return m.milestone_id;
  }
}
