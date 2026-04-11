// delivery-cycle-detail.component.ts — DeliveryCycleDetailComponent
// Route: /delivery/:cycle_id  (also used as embedded right panel via @Input cycleId)
// Spec: build-c-spec Section 5.3 | Contract 1 2026-04-10
//
// Contract 1 changes: S-005/S-006 View surface — display-only fields, action zone.
//   - @Input() cycleId: accepts id from dashboard panel (route fallback for direct URL)
//   - @Output() close: emits when panel close is triggered (dashboard handles S-008 re-query)
//   - Panel mode: no full-page wrapper; route mode: max-width:860px per approved plan
//   - Inline field editing removed. Action zone added (5 actions per contract).
//   - Gate rows: Milestone Status 5-color dot + Gate Approval Status narrative (D-244/D-245).
//   - Gate sub-panel preserved (workflow actions, not field editing).
//   - All content sections preserved: Stage Track, Outcome display, Milestones display,
//     Gate sub-panel, Artifacts, Jira sync, Event log.
//
// D-93: DeliveryService only — no Supabase.
// D-140: All blocked actions state what is blocked AND what would need to change.
// Rule 2: Presentation only.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { IonicModule }         from '@ionic/angular';
import { DeliveryService }         from '../../../core/services/delivery.service';
import { UserProfileService }      from '../../../core/services/user-profile.service';
import { StageTrackComponent }     from '../stage-track/stage-track.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { User }                    from '../../../core/types/database';
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
  LifecycleStage,
  DateStatus
} from '../../../core/types/database';

const GATE_LABELS: Record<GateName, string> = {
  brief_review:   'Brief Review',
  go_to_build:    'Go to Build',
  go_to_deploy:   'Go to Deploy (Pilot Start)',
  go_to_release:  'Go to Release',
  close_review:   'Close Review'
};

// D-189: next gate derived from lifecycle stage — mirrors NEXT_GATE_BY_STAGE in lifecycle.js
const NEXT_GATE_BY_STAGE: Partial<Record<LifecycleStage, GateName>> = {
  BRIEF:    'brief_review',
  DESIGN:   'go_to_build',
  SPEC:     'go_to_build',
  BUILD:    'go_to_deploy',
  VALIDATE: 'go_to_deploy',
  PILOT:    'go_to_release',
  UAT:      'go_to_release',
  RELEASE:  'close_review',
  OUTCOME:  'close_review'
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, StageTrackComponent, LoadingOverlayComponent],
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

    <!-- Panel-aware wrapper: no max-width in panel mode; 860px max in route mode. Source: approved plan 2026-04-10 -->
    <div *ngIf="!loading && cycle"
         [ngStyle]="panelMode
           ? {padding: 'var(--triarq-space-md)'}
           : {'max-width': '860px', margin: 'var(--triarq-space-xl) auto', padding: '0 var(--triarq-space-md)'}">

      <!-- Panel close button — only in panel mode (S-006) -->
      <div *ngIf="panelMode"
           style="display:flex;justify-content:flex-end;margin-bottom:var(--triarq-space-sm);">
        <button (click)="close.emit()"
                style="background:none;border:none;cursor:pointer;
                       color:var(--triarq-color-text-secondary);font-size:20px;
                       line-height:1;padding:4px 8px;"
                title="Close panel">✕</button>
      </div>

      <!-- ── Cycle Header ───────────────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;
                    flex-wrap:wrap;gap:var(--triarq-space-sm);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;
                        margin-bottom:var(--triarq-space-xs);">
              <!-- Stage badge — Visual Layout Standards 1.7/3.1: 4px radius, not pill -->
              <span style="background:var(--triarq-color-primary,#257099);color:#fff;
                           font-size:12px;font-weight:500;font-family:Roboto,sans-serif;
                           border-radius:4px;padding:3px 8px;text-transform:uppercase;
                           letter-spacing:0.5px;">
                {{ STAGE_LABEL_MAP[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
              </span>
              <!-- Tier badge — Visual Layout Standards 1.7/3.1: tier colors, 4px radius -->
              <span [style.background]="tierBadgeBg(cycle.tier_classification)"
                    [style.color]="tierBadgeColor(cycle.tier_classification)"
                    style="font-size:12px;font-weight:500;font-family:Roboto,sans-serif;
                           border-radius:4px;padding:3px 8px;">
                Tier {{ tierLabel(cycle.tier_classification) }}
              </span>
            </div>
            <h3 style="margin:0 0 4px 0;">{{ cycle.cycle_title }}</h3>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              {{ cycle.workstream?.workstream_name ?? cycle.workstream_id }}
              &nbsp;·&nbsp;
              <!-- Division inherited from workstream. Source: build-c-view-correction-spec-2026-04-09 Section 2.5 -->
              <span *ngIf="cycle.workstream?.home_division_name">{{ cycle.workstream!.home_division_name }}</span>
              <span *ngIf="!cycle.workstream?.home_division_name"
                    style="color:#9E9E9E;font-style:italic;">Not set</span>
            </div>

            <!-- DS / CB display row — display only in View. Edit available via Edit Cycle action (Contract 2). -->
            <div style="display:flex;gap:var(--triarq-space-lg);margin-top:var(--triarq-space-sm);
                        flex-wrap:wrap;">
              <div style="font-size:var(--triarq-text-small);">
                <span style="color:var(--triarq-color-text-secondary);">DS: </span>
                <span *ngIf="cycle.assigned_ds_user_id" style="font-weight:500;">
                  {{ cycle.assigned_ds_display_name ?? cycle.assigned_ds_user_id }}
                </span>
                <span *ngIf="!cycle.assigned_ds_user_id"
                      style="color:var(--triarq-color-text-secondary);font-style:italic;">Unassigned</span>
              </div>
              <div style="font-size:var(--triarq-text-small);">
                <span style="color:var(--triarq-color-text-secondary);">CB: </span>
                <span *ngIf="cycle.assigned_cb_user_id" style="font-weight:500;">
                  {{ cycle.assigned_cb_display_name ?? cycle.assigned_cb_user_id }}
                </span>
                <span *ngIf="!cycle.assigned_cb_user_id"
                      style="color:var(--triarq-color-text-secondary);font-style:italic;">Unassigned</span>
              </div>
            </div>
          </div>
          <!-- ── Action Zone (5 actions per Contract 1 2026-04-10) ──────────── -->
          <!-- Actions: Edit Cycle | Submit Gate | Regress Stage | Cancel | Un-cancel -->
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;">

            <!-- 1. Edit Cycle — always shown; stub navigates to edit route (Contract 2) -->
            <button (click)="editCycleStub()"
                    class="oi-btn-primary"
                    style="white-space:nowrap;font-size:var(--triarq-text-small);">
              ✎ Edit Cycle
            </button>

            <!-- 2. Submit Gate for Approval — when pending gate exists and caller can submit -->
            <button *ngIf="pendingGateForSubmit && callerCanSubmitGates && !gateActionBusy"
                    (click)="submitGate(pendingGateForSubmit)"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              ↑ Submit Gate for Approval
            </button>
            <button *ngIf="pendingGateForSubmit && callerCanSubmitGates && gateActionBusy"
                    disabled
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;
                           display:flex;align-items:center;gap:4px;">
              <ion-spinner name="crescent" style="width:10px;height:10px;"></ion-spinner>
              Submitting…
            </button>

            <!-- 3. Regress Stage — canRegress, D-179 two-call pattern preserved -->
            <button *ngIf="canRegress && !regressConfirming"
                    (click)="initiateRegress()"
                    [disabled]="regressBusy"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-text-secondary);
                           background:none;border:1px solid var(--triarq-color-border);
                           border-radius:5px;padding:3px 8px;cursor:pointer;
                           display:flex;align-items:center;gap:4px;">
              <ion-spinner *ngIf="regressBusy" name="crescent" style="width:10px;height:10px;"></ion-spinner>
              ↩ Regress Stage
            </button>

            <!-- 4. Cancel Cycle — not terminal, D-183 two-step inline confirm -->
            <button *ngIf="canCancelCycle && !cancelConfirming"
                    (click)="cancelConfirming = true"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-error);
                           background:none;border:1px solid var(--triarq-color-error);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              ✕ Cancel Cycle
            </button>

            <!-- 5. Un-cancel Cycle — CANCELLED stage only -->
            <button *ngIf="cycle.current_lifecycle_stage === 'CANCELLED' && !uncancelConfirming"
                    (click)="uncancelConfirming = true"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              ↺ Un-cancel Cycle
            </button>

          </div>
        </div>

        <!-- ── Regress Stage confirm panel — D-179 ───────────────────────── -->
        <div *ngIf="regressConfirming && regressPreview"
             style="margin-top:var(--triarq-space-xs);padding:var(--triarq-space-xs);
                    border:1px solid var(--triarq-color-sunray,#f5a623);border-radius:5px;
                    background:#fff8e1;">
          <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:4px;">
            Regress to {{ regressPreview.target_stage }}?
          </div>
          <div *ngIf="regressPreview.gates_to_reset?.length"
               style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);margin-bottom:4px;">
            These gate records will be reset to pending:
            <strong style="color:var(--triarq-color-text-primary);">
              {{ regressPreview.gates_to_reset.join(', ') }}
            </strong>
          </div>
          <div *ngIf="regressPreview.warning"
               style="font-size:var(--triarq-text-small);color:var(--triarq-color-error);margin-bottom:6px;">
            {{ regressPreview.warning }}
          </div>
          <div style="display:flex;gap:6px;">
            <button class="oi-btn-primary"
                    (click)="confirmRegress()"
                    [disabled]="regressBusy"
                    style="font-size:11px;padding:3px 10px;background:var(--triarq-color-sunray,#f5a623);
                           display:flex;align-items:center;gap:4px;">
              <ion-spinner *ngIf="regressBusy" name="crescent" style="width:10px;height:10px;"></ion-spinner>
              {{ regressBusy ? 'Regressing…' : 'Confirm Regress' }}
            </button>
            <button (click)="cancelRegress()"
                    style="font-size:11px;background:none;border:none;cursor:pointer;
                           color:var(--triarq-color-text-secondary);">
              Cancel
            </button>
          </div>
          <div *ngIf="regressError"
               style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
            {{ regressError }}
          </div>
        </div>

        <!-- ── Cancel Cycle confirm panel — D-183 two-step ───────────────── -->
        <div *ngIf="cancelConfirming"
             style="margin-top:var(--triarq-space-xs);padding:var(--triarq-space-xs);
                    border:1px solid var(--triarq-color-error);border-radius:5px;
                    background:#FFF5F5;">
          <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:4px;
                      color:var(--triarq-color-error);">
            Cancel this cycle?
          </div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);margin-bottom:6px;">
            The cycle will be marked CANCELLED. You can un-cancel it later from this panel.
          </div>
          <div style="display:flex;gap:6px;">
            <button class="oi-btn-primary"
                    (click)="cancelCycleAction()"
                    [disabled]="cancelBusy"
                    style="font-size:11px;padding:3px 10px;background:var(--triarq-color-error);
                           display:flex;align-items:center;gap:4px;">
              <ion-spinner *ngIf="cancelBusy" name="crescent" style="width:10px;height:10px;"></ion-spinner>
              {{ cancelBusy ? 'Cancelling…' : 'Confirm Cancel' }}
            </button>
            <button (click)="cancelConfirming = false; cancelError = ''"
                    style="font-size:11px;background:none;border:none;cursor:pointer;
                           color:var(--triarq-color-text-secondary);">
              Keep Active
            </button>
          </div>
          <div *ngIf="cancelError"
               style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
            {{ cancelError }}
          </div>
        </div>

        <!-- ── Un-cancel Cycle confirm panel — D-183 two-step ────────────── -->
        <div *ngIf="uncancelConfirming"
             style="margin-top:var(--triarq-space-xs);padding:var(--triarq-space-xs);
                    border:1px solid var(--triarq-color-primary);border-radius:5px;
                    background:#F0F7FF;">
          <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:4px;">
            Restore this cycle?
          </div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);margin-bottom:6px;">
            The cycle will be returned to BRIEF stage and can resume the delivery workflow.
          </div>
          <div style="display:flex;gap:6px;">
            <button class="oi-btn-primary"
                    (click)="uncancelCycleAction()"
                    [disabled]="uncancelBusy"
                    style="font-size:11px;padding:3px 10px;display:flex;align-items:center;gap:4px;">
              <ion-spinner *ngIf="uncancelBusy" name="crescent" style="width:10px;height:10px;"></ion-spinner>
              {{ uncancelBusy ? 'Restoring…' : 'Confirm Restore' }}
            </button>
            <button (click)="uncancelConfirming = false; uncancelError = ''"
                    style="font-size:11px;background:none;border:none;cursor:pointer;
                           color:var(--triarq-color-text-secondary);">
              Cancel
            </button>
          </div>
          <div *ngIf="uncancelError"
               style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:4px;">
            {{ uncancelError }}
          </div>
        </div>

      </div>

      <!-- ── Outcome Statement — display only in View (S-005). Edit via Edit Cycle. ── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="font-weight:500;font-size:var(--triarq-text-body);margin-bottom:var(--triarq-space-xs);">
          Outcome Statement
        </div>
        <!-- Amber bordered box per Visual Layout Standards 3.3. Warning text when null. -->
        <div style="border:1.5px solid var(--triarq-color-sunray,#F2A620);background:#FFFBF0;
                    border-radius:6px;padding:12px;">
          <div *ngIf="!cycle.outcome_statement"
               style="color:var(--triarq-color-sunray,#F2A620);font-size:14px;
                      font-style:italic;font-family:Roboto,sans-serif;">
            No Outcome Statement set. Required before Brief Review gate.
          </div>
          <div *ngIf="cycle.outcome_statement"
               style="font-size:14px;font-style:italic;font-family:Roboto,sans-serif;
                      color:#262626;white-space:pre-wrap;">
            {{ cycle.outcome_statement }}
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
      <!-- Spec: "[N] Milestone(s) are missing actual dates for Gates this Delivery Cycle has already passed." -->
      <div *ngIf="missingActualDateGateNames.length > 0"
           style="margin-bottom:var(--triarq-space-md);
                  background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                  border-radius:0 6px 6px 0;padding:var(--triarq-space-sm) var(--triarq-space-md);">
        <div style="font-weight:500;font-size:var(--triarq-text-small);margin-bottom:4px;">
          ⚠ {{ missingActualDateGateNames.length }} Milestone{{ missingActualDateGateNames.length > 1 ? 's are' : ' is' }} missing actual dates for Gates this Delivery Cycle has already passed.
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          Actual dates are recorded automatically on Gate approval — if missing, the Gate may have been approved before date tracking was active. Add them manually to maintain a complete audit record.
        </div>
      </div>

      <!-- Two-column: Milestones + Gate panel -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--triarq-space-md);
                  margin-bottom:var(--triarq-space-md);">

        <!-- ── Milestone Dates ──────────────────────────────────────────── -->
        <!-- D-244: Milestone Status shown as 5-color dot indicator per gate row.    -->
        <!-- D-245: Gate Approval Status as contextual narrative text.               -->
        <!-- Display-only in View (S-005). Target/Actual date editing in Edit Cycle. -->
        <div class="oi-card">
          <div style="font-weight:500;margin-bottom:4px;">Milestone Dates</div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                      margin-bottom:var(--triarq-space-sm);">
            Actual date is set automatically when a gate is cleared.
            Target dates and milestone status are editable via Edit Cycle.
          </div>

          <!-- Gate row: Gate + Approval Status narrative | Target Date | Actual Date | Milestone Status dot -->
          <!-- D-244: 5-color dot for Milestone Status. D-245: Approval Status as narrative text.         -->
          <!-- Display-only in View (S-005). Target date editing and status override in Edit Cycle.        -->
          <div *ngFor="let m of cycle.milestone_dates; trackBy: trackByMilestoneId"
               style="display:grid;grid-template-columns:2fr 1fr 1fr 100px;
                      gap:var(--triarq-space-sm);padding:12px 0;
                      border-bottom:1px solid var(--triarq-color-border);
                      font-size:var(--triarq-text-small);align-items:start;">

            <!-- Col 1: Gate name + Gate Approval Status narrative (D-245) -->
            <div>
              <span style="font-weight:500;font-size:14px;">{{ GATE_LABELS[m.gate_name] }}</span>
              <div *ngIf="gateApprovalNarrative(m.gate_name)"
                   [style.color]="gateApprovalNarrativeColor(m.gate_name)"
                   style="font-size:11px;margin-top:3px;">
                {{ gateApprovalNarrative(m.gate_name) }}
              </div>
            </div>

            <!-- Col 2: Target Date — display only -->
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Target Date</div>
              <span *ngIf="m.target_date" [style.color]="milestoneTargetColor(m)">{{ m.target_date }}</span>
              <span *ngIf="!m.target_date" style="color:#9E9E9E;">—</span>
            </div>

            <!-- Col 3: Actual Date — display only; warn if gate approved but no actual date -->
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Actual Date</div>
              <span *ngIf="m.actual_date"
                    [style.color]="m.actual_date <= (m.target_date ?? m.actual_date)
                      ? 'var(--triarq-color-text-secondary)'
                      : 'var(--triarq-color-error)'">
                {{ m.actual_date }}
              </span>
              <span *ngIf="!m.actual_date && isMissingActualDate(m.gate_name)"
                    style="color:var(--triarq-color-sunray,#f5a623);"
                    title="Gate approved but actual date not recorded">⚠ missing</span>
              <span *ngIf="!m.actual_date && !isMissingActualDate(m.gate_name)"
                    style="color:#9E9E9E;">—</span>
            </div>

            <!-- Col 4: Milestone Status 5-color dot + label (D-244) -->
            <div style="display:flex;align-items:center;gap:6px;">
              <span [style.background]="milestoneStatusDotColor(m.date_status)"
                    style="display:inline-block;width:10px;height:10px;
                           border-radius:50%;flex-shrink:0;">
              </span>
              <span [style.color]="milestoneStatusDotColor(m.date_status)"
                    style="font-size:12px;font-weight:500;">
                {{ gateStatusDisplayLabel(m.date_status) }}
              </span>
            </div>

          </div><!-- end *ngFor milestone rows -->
        </div>

        <!-- ── Gate Detail Sub-Panel ────────────────────────────────────── -->
        <!-- S2 (Part 2 Supplement): Structured gate detail layout.         -->
        <!-- Principle 10: right-panel, no route change, dismissible.       -->
        <!-- D-178 Tier 3: position:relative required for loading overlay.  -->
        <div class="oi-card" style="position:relative;">
          <app-loading-overlay [visible]="gateActionBusy" message="Processing gate…"></app-loading-overlay>

          <!-- Panel header: gate name + breadcrumb + close button -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;
                      margin-bottom:var(--triarq-space-sm);">
            <div>
              <div style="font-weight:500;">
                Gate Record
                <span *ngIf="selectedGate" style="font-weight:400;color:var(--triarq-color-text-secondary);">
                  — {{ GATE_LABELS[selectedGate] }}
                </span>
              </div>
              <div *ngIf="cycle && selectedGate"
                   style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                          margin-top:2px;">
                {{ cycle.cycle_title }} · Tier {{ tierShortLabel(cycle.tier_classification) }}
              </div>
            </div>
            <button *ngIf="selectedGate"
                    (click)="closeGatePanel()"
                    aria-label="Close Gate panel"
                    style="background:none;border:none;cursor:pointer;
                           color:var(--triarq-color-text-secondary);font-size:18px;
                           line-height:1;padding:2px 4px;flex-shrink:0;">✕</button>
          </div>

          <!-- Empty state — no gate selected -->
          <div *ngIf="!selectedGate"
               style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
            <p style="margin:0 0 8px 0;">
              Gates are formal checkpoints in the lifecycle. Each Gate must be approved
              before the Delivery Cycle can advance past it.
            </p>
            <p style="margin:0;">
              Click a gate diamond on the Lifecycle Track above to view the Gate record,
              submit for approval, or record an Approve or Return decision.
            </p>
          </div>

          <!-- Gate selected — structured layout (Principle 10 / S2 spec) -->
          <ng-container *ngIf="selectedGate">

            <!-- ── GATE STATUS ─────────────────────────────────────────── -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;
                          text-transform:uppercase;color:var(--triarq-color-text-secondary);
                          margin-bottom:4px;">Gate Status</div>
              <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;">
                <span class="oi-pill"
                      [style.background]="gateDetailStatusBg(selectedGate)"
                      [style.color]="gateDetailStatusColor(selectedGate)"
                      style="font-size:11px;">
                  {{ gateDetailStatus(selectedGate) }}
                </span>
                <span *ngIf="gateDetailStatus(selectedGate) === 'Not Yet Active'"
                      style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
                  Advance the Delivery Cycle through earlier stages to unlock this Gate.
                </span>
                <!-- D-140: blocked — what is blocked + how to resolve -->
                <span *ngIf="selectedGateRecord?.workstream_active_at_clearance === false"
                      style="font-size:var(--triarq-text-small);color:var(--triarq-color-error);">
                  Workstream was inactive at last clearance attempt.
                  Reactivate the Workstream in Admin → Delivery Workstream Registry, then resubmit.
                </span>
              </div>
            </div>

            <!-- ── MILESTONE DATE ──────────────────────────────────────── -->
            <div *ngIf="selectedGateMilestone" style="margin-bottom:var(--triarq-space-sm);">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;
                          text-transform:uppercase;color:var(--triarq-color-text-secondary);
                          margin-bottom:4px;">Milestone Date</div>
              <div style="display:flex;gap:var(--triarq-space-lg);font-size:var(--triarq-text-small);
                          flex-wrap:wrap;align-items:center;">
                <div>
                  <span style="color:var(--triarq-color-text-secondary);">Target: </span>
                  <span [style.color]="milestoneTargetColor(selectedGateMilestone)">
                    {{ selectedGateMilestone.target_date ?? '—' }}
                  </span>
                </div>
                <div>
                  <span style="color:var(--triarq-color-text-secondary);">Actual: </span>
                  <span>{{ selectedGateMilestone.actual_date ?? '—' }}</span>
                </div>
                <span class="oi-pill"
                      [style.background]="dateStatusBg(selectedGateMilestone.date_status)"
                      [style.color]="dateStatusColor(selectedGateMilestone.date_status)"
                      style="font-size:10px;">
                  {{ dateStatusLabel(selectedGateMilestone.date_status) }}
                </span>
              </div>
            </div>

            <!-- ── APPROVAL ROUTING ───────────────────────────────────── -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;
                          text-transform:uppercase;color:var(--triarq-color-text-secondary);
                          margin-bottom:6px;">Approval Routing</div>
              <!-- Accountable (A badge) -->
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;
                          font-size:var(--triarq-text-small);">
                <span style="width:18px;height:18px;border-radius:50%;
                             background:var(--triarq-color-primary);color:#fff;
                             font-size:9px;font-weight:700;display:inline-flex;
                             align-items:center;justify-content:center;flex-shrink:0;">A</span>
                <span style="color:var(--triarq-color-text-secondary);min-width:72px;">Accountable</span>
                <span *ngIf="selectedGateRecord?.approver_user_id"
                      style="padding:2px 10px;border-radius:999px;
                             background:rgba(37,112,153,0.09);font-size:11px;">
                  {{ approverDisplayName(selectedGateRecord!.approver_user_id!) }}
                </span>
                <span *ngIf="!selectedGateRecord?.approver_user_id"
                      style="color:var(--triarq-color-text-secondary);font-style:italic;font-size:11px;">
                  Phil (escalation default — no Accountable configured)
                </span>
              </div>
              <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                          font-style:italic;">
                Consulted and Informed routing configured in Build D (RACI Management module).
              </div>
            </div>

            <!-- ── GATE CHECKLIST ─────────────────────────────────────── -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;
                          text-transform:uppercase;color:var(--triarq-color-text-secondary);
                          margin-bottom:6px;">Gate Checklist</div>
              <div *ngFor="let item of gateChecklist(selectedGate)"
                   style="display:flex;align-items:center;gap:6px;margin-bottom:3px;
                          font-size:var(--triarq-text-small);">
                <span style="flex-shrink:0;"
                      [style.color]="item.met ? 'var(--triarq-color-success,#2e7d32)' : 'var(--triarq-color-sunray,#f5a623)'">
                  {{ item.met ? '✓' : '⚠' }}
                </span>
                <span [style.color]="item.met ? 'var(--triarq-color-text-primary)' : 'var(--triarq-color-text-secondary)'">
                  {{ item.label }}
                </span>
              </div>
              <div *ngIf="gateChecklist(selectedGate).length === 0"
                   style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
                No checklist items defined for this Gate.
              </div>
            </div>

            <!-- ── REVIEW NOTES ───────────────────────────────────────── -->
            <div *ngIf="selectedGateRecord?.approver_notes"
                 style="margin-bottom:var(--triarq-space-sm);">
              <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;
                          text-transform:uppercase;color:var(--triarq-color-text-secondary);
                          margin-bottom:4px;">Review Notes</div>
              <div style="background:var(--triarq-color-background-subtle);border-radius:6px;
                          padding:var(--triarq-space-xs);font-size:var(--triarq-text-small);">
                {{ selectedGateRecord!.approver_notes }}
              </div>
            </div>

            <!-- Divider above action buttons -->
            <div style="border-top:1px solid var(--triarq-color-border);
                        margin:var(--triarq-space-sm) 0;"></div>

            <!-- ── ACTION AREA ────────────────────────────────────────── -->

            <!-- Not yet active — explain advancement path -->
            <div *ngIf="!selectedGateRecord && isGateNotYetActive(selectedGate)"
                 style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              Advance the Delivery Cycle through earlier stages to unlock this Gate.
            </div>

            <!-- No record yet, gate reachable -->
            <div *ngIf="!selectedGateRecord && !isGateNotYetActive(selectedGate)"
                 style="font-size:var(--triarq-text-small);">
              <p style="margin:0 0 8px 0;color:var(--triarq-color-text-secondary);">
                <strong>{{ GATE_LABELS[selectedGate] }}</strong> has not been submitted yet.
                Use the button below when the Delivery Cycle is ready for Gate review.
              </p>
              <button *ngIf="callerCanSubmitGates"
                      class="oi-btn-primary"
                      style="font-size:var(--triarq-text-small);display:flex;align-items:center;gap:6px;"
                      (click)="submitGate(selectedGate!)"
                      [disabled]="gateActionBusy">
                <ion-spinner *ngIf="gateActionBusy" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                <span>Submit for Approval</span>
              </button>
              <div *ngIf="!callerCanSubmitGates"
                   style="color:var(--triarq-color-text-secondary);">
                Only the assigned Domain Strategist, Capability Builder, or Phil can submit this Gate.
                Contact the cycle owner or an Admin to submit for approval.
              </div>
            </div>

            <!-- Gate record exists — action buttons -->
            <div *ngIf="selectedGateRecord">

              <!-- Submit / Resubmit -->
              <div *ngIf="(selectedGateRecord.gate_status === 'returned' || selectedGateRecord.gate_status === 'pending')
                          && selectedGateRecord.current_user_gate_authority?.can_submit !== false"
                   style="margin-bottom:var(--triarq-space-sm);">
                <button class="oi-btn-primary"
                        (click)="submitGate(selectedGate!)"
                        [disabled]="gateActionBusy"
                        style="font-size:var(--triarq-text-small);display:flex;align-items:center;gap:6px;">
                  <ion-spinner *ngIf="gateActionBusy" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                  <span>{{ selectedGateRecord.gate_status === 'returned' ? 'Resubmit for Approval' : 'Submit for Approval' }}</span>
                </button>
              </div>

              <!-- Approver decision form — approve/return -->
              <div *ngIf="selectedGateRecord.gate_status === 'pending'
                          && selectedGateRecord.current_user_gate_authority?.can_approve">
                <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:4px;">
                  Record Decision
                </div>
                <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                            margin-bottom:var(--triarq-space-xs);">
                  Return notes are required when returning. Notes are optional for approval.
                </div>
                <form [formGroup]="gateDecisionForm" (ngSubmit)="recordDecision(selectedGate!)">
                  <textarea formControlName="approver_notes" class="oi-input" rows="2"
                            placeholder="Approver notes (required if returning)"
                            style="width:100%;resize:none;font-size:var(--triarq-text-small);">
                  </textarea>
                  <div style="display:flex;gap:var(--triarq-space-sm);margin-top:var(--triarq-space-xs);
                              align-items:center;flex-wrap:wrap;">
                    <ng-container *ngIf="!approveConfirming">
                      <button type="button" class="oi-btn-primary"
                              (click)="approveConfirming = true"
                              [disabled]="gateActionBusy"
                              style="font-size:var(--triarq-text-small);">✓ Approve</button>
                    </ng-container>
                    <ng-container *ngIf="approveConfirming">
                      <span style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
                        Approve this Gate? This cannot be undone.
                      </span>
                      <button type="button" class="oi-btn-primary"
                              (click)="recordDecisionWithValue(selectedGate!, 'approved')"
                              [disabled]="gateActionBusy"
                              style="font-size:var(--triarq-text-small);display:flex;align-items:center;gap:6px;">
                        <ion-spinner *ngIf="gateActionBusy" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                        <span>Confirm Approve</span>
                      </button>
                      <button type="button" (click)="approveConfirming = false"
                              style="font-size:var(--triarq-text-small);background:none;border:none;
                                     cursor:pointer;color:var(--triarq-color-text-secondary);">Cancel</button>
                    </ng-container>
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

              <!-- No approve authority — gate pending but caller can't approve — D-140 -->
              <div *ngIf="selectedGateRecord.gate_status === 'pending'
                          && !selectedGateRecord.current_user_gate_authority?.can_approve"
                   style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
                This Gate is awaiting approval. Only the designated approver or Phil can record a decision.
              </div>
            </div>

            <!-- Gate action error feedback — D-140 -->
            <div *ngIf="gateActionError"
                 style="margin-top:var(--triarq-space-xs);font-size:var(--triarq-text-small);">
              <span style="color:var(--triarq-color-error);font-weight:500;">{{ gateActionError }}</span>
              <div *ngIf="gateActionHint"
                   style="color:var(--triarq-color-text-secondary);margin-top:4px;">
                {{ gateActionHint }}
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- ── Artifact Slots ────────────────────────────────────────────── -->
      <!-- Item 2 (Part 3): collapsible stage sections; Principle 5 (progressive disclosure). -->
      <!-- Current+past stages expanded by default; future stages collapsed.                  -->
      <!-- Inline attach form per stage group (no global form at top).                        -->
      <!-- D-181: "Attached by [Name chip]" on filled slots.                                  -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:var(--triarq-space-xs);">
          <span style="font-weight:500;">Cycle Artifacts</span>
        </div>
        <p style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);">
          Artifacts are grouped by the lifecycle stage they belong to. Attach an external URL
          to fill a slot. Use "→ OI Library" to record the artifact in the OI Library
          (full submission completes in Build B).
        </p>

        <!-- Promote stub message — inline, not alert -->
        <div *ngIf="promoteStubMessage"
             style="background:#e3f2fd;border-left:4px solid var(--triarq-color-primary);
                    border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    font-size:var(--triarq-text-small);margin-bottom:var(--triarq-space-sm);">
          {{ promoteStubMessage }}
        </div>

        <!-- Stage groups — collapsible (Principle 5) -->
        <div *ngFor="let group of artifactsByStage"
             style="margin-bottom:var(--triarq-space-xs);">

          <!-- Stage section header — ▼/▶ toggle + name + "N of M attached" count -->
          <button (click)="toggleStageExpand(group.stage)"
                  style="width:100%;background:none;border:none;cursor:pointer;
                         display:flex;align-items:center;justify-content:space-between;
                         padding:var(--triarq-space-xs) var(--triarq-space-xs);
                         border-radius:5px;margin-bottom:2px;
                         background:var(--triarq-color-background-subtle);"
                  [style.opacity]="group.isFuture ? '0.65' : '1'">
            <span style="display:flex;align-items:center;gap:var(--triarq-space-xs);">
              <span style="font-size:11px;color:var(--triarq-color-text-secondary);
                           transition:transform 0.15s;"
                    [style.transform]="isStageExpanded(group.stage) ? 'rotate(0)' : 'rotate(-90deg)'">
                ▼
              </span>
              <span style="font-weight:500;font-size:var(--triarq-text-small);"
                    [style.color]="group.isFuture ? 'var(--triarq-color-text-secondary)' : 'var(--triarq-color-primary)'">
                {{ group.stage }}
              </span>
              <span *ngIf="group.isFuture"
                    style="font-size:10px;color:var(--triarq-color-text-secondary);font-style:italic;">
                — Available when cycle reaches {{ group.stage }}
              </span>
            </span>
            <span style="font-size:10px;color:var(--triarq-color-text-secondary);">
              {{ attachedCountInGroup(group.slots) }} of {{ group.slots.length }} attached
            </span>
          </button>

          <!-- Expanded body -->
          <div *ngIf="isStageExpanded(group.stage)">

            <!-- Slot rows -->
            <div *ngFor="let slot of group.slots"
                 style="padding:var(--triarq-space-xs) var(--triarq-space-xs);
                        border-bottom:1px solid var(--triarq-color-border);
                        font-size:var(--triarq-text-small);">

              <!-- Slot type name + guidance text (Item 2 — guidance_text under name) -->
              <div style="display:flex;align-items:flex-start;justify-content:space-between;
                          gap:var(--triarq-space-sm);flex-wrap:wrap;">
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:500;color:var(--triarq-color-text-primary);">
                    {{ slot.artifact_type_name ?? slot.display_name }}
                  </div>
                  <!-- guidance_text from cycle_artifact_types — shown below name (Item 2 / D-182) -->
                  <div *ngIf="slot.guidance_text"
                       style="font-size:10px;color:var(--triarq-color-text-secondary);
                              margin-top:1px;font-style:italic;">
                    {{ slot.guidance_text }}
                  </div>

                  <!-- Filled slot — external_only: link + "Attached by [chip]" -->
                  <div *ngIf="slot.external_url && slot.pointer_status !== 'promoted'"
                       style="margin-top:4px;">
                    <a [href]="slot.external_url" target="_blank" rel="noopener noreferrer"
                       style="color:var(--triarq-color-primary);word-break:break-all;">
                      {{ slot.display_name }}
                    </a>
                    <!-- D-181: "Attached by [Name chip]" -->
                    <div style="margin-top:4px;display:flex;align-items:center;
                                gap:4px;flex-wrap:wrap;">
                      <span style="font-size:10px;color:var(--triarq-color-text-secondary);">
                        Attached by
                      </span>
                      <span *ngIf="slot.attached_by_display_name"
                            class="oi-pill"
                            style="font-size:10px;cursor:default;
                                   background:var(--triarq-color-fog, #f0f4f8);
                                   color:var(--triarq-color-text-primary);">
                        {{ slot.attached_by_display_name }}
                      </span>
                      <span *ngIf="!slot.attached_by_display_name"
                            style="font-size:10px;color:var(--triarq-color-text-secondary);">
                        Unknown
                      </span>
                      <span style="font-size:10px;color:var(--triarq-color-text-secondary);">
                        · {{ slot.attached_at | date:'dd MMM yyyy' }}
                      </span>
                    </div>
                  </div>

                  <!-- Filled slot — promoted: OI Library chip as primary, external URL as archived reference -->
                  <!-- Spec: pointer_status = promoted → OI Library artifact is primary tappable chip; external URL plain text -->
                  <div *ngIf="slot.pointer_status === 'promoted'" style="margin-top:4px;">
                    <!-- Primary: OI Library chip -->
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                      <span style="font-size:11px;color:var(--triarq-color-text-secondary);">OI Library:</span>
                      <span class="oi-pill"
                            style="font-size:10px;background:#e3f2fd;
                                   color:var(--triarq-color-primary);cursor:pointer;"
                            title="View in OI Library (full integration in Build B)">
                        {{ slot.display_name }}
                      </span>
                    </div>
                    <!-- Secondary: external URL as plain archived reference -->
                    <div *ngIf="slot.external_url"
                         style="font-size:10px;color:var(--triarq-color-text-secondary);
                                word-break:break-all;">
                      External: {{ slot.external_url }} · <em>Archived reference</em>
                    </div>
                  </div>

                  <!-- Empty slot placeholder -->
                  <div *ngIf="!slot.external_url && !slot.oi_library_artifact_id"
                       style="margin-top:4px;font-size:10px;color:var(--triarq-color-text-secondary);
                              font-style:italic;">
                    Not yet attached
                  </div>
                </div>

                <!-- Action column: Attach / Replace + → OI Library -->
                <div *ngIf="!group.isFuture"
                     style="display:flex;flex-direction:column;align-items:flex-end;
                            gap:4px;flex-shrink:0;">
                  <button *ngIf="!slot.external_url"
                          (click)="openAttachForm(slot.artifact_type_id ?? '')"
                          style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                                 background:none;border:none;cursor:pointer;padding:0;">
                    Attach
                  </button>
                  <button *ngIf="slot.external_url"
                          (click)="openAttachForm(slot.artifact_type_id ?? '')"
                          style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                                 background:none;border:none;cursor:pointer;padding:0;">
                    Replace
                  </button>
                  <button *ngIf="slot.external_url && slot.pointer_status === 'external_only'"
                          (click)="promoteArtifact(slot)"
                          style="font-size:10px;color:var(--triarq-color-text-secondary);
                                 background:none;border:none;cursor:pointer;padding:0;"
                          title="Record in OI Library (submission completes in Build B)">
                    → OI Library
                  </button>
                </div>
              </div>

              <!-- Inline attach form — opened per slot or from stage ad hoc link -->
              <div *ngIf="showAttachForm && attachingForTypeId === (slot.artifact_type_id ?? '')"
                   style="margin-top:var(--triarq-space-xs);
                          background:var(--triarq-color-background-subtle);
                          border-radius:5px;padding:var(--triarq-space-xs);
                          position:relative;">
                <app-loading-overlay [visible]="attaching" message="Attaching artifact…"></app-loading-overlay>
                <form [formGroup]="attachForm" (ngSubmit)="submitAttach()">
                  <div style="display:grid;gap:var(--triarq-space-xs);
                              grid-template-columns:2fr 3fr auto;align-items:end;">
                    <div>
                      <label style="display:block;font-size:10px;margin-bottom:2px;">
                        Artifact Title <span style="color:var(--triarq-color-error);">*</span>
                      </label>
                      <input formControlName="display_name" class="oi-input"
                             style="font-size:var(--triarq-text-small);"
                             placeholder="e.g. Context Brief v2" />
                    </div>
                    <div>
                      <label style="display:block;font-size:10px;margin-bottom:2px;">
                        External URL <span style="color:var(--triarq-color-error);">*</span>
                      </label>
                      <input formControlName="external_url" class="oi-input" type="url"
                             placeholder="https://…"
                             style="font-size:var(--triarq-text-small);" />
                    </div>
                    <div style="display:flex;gap:4px;">
                      <button type="submit" class="oi-btn-primary"
                              [disabled]="attachForm.invalid || attaching"
                              style="font-size:var(--triarq-text-small);white-space:nowrap;
                                     display:flex;align-items:center;gap:6px;">
                        <ion-spinner *ngIf="attaching" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                        <span>{{ attaching ? '…' : 'Attach' }}</span>
                      </button>
                      <button type="button" (click)="cancelAttach()"
                              style="background:none;border:none;cursor:pointer;
                                     font-size:var(--triarq-text-small);
                                     color:var(--triarq-color-text-secondary);">✕</button>
                    </div>
                  </div>
                  <div *ngIf="attachError"
                       style="color:var(--triarq-color-error);font-size:10px;margin-top:4px;">
                    {{ attachError }}
                  </div>
                </form>
              </div>

            </div><!-- end slot rows -->

            <!-- Ad hoc attach link at bottom of each expanded stage (not future) -->
            <div *ngIf="!group.isFuture"
                 style="padding:var(--triarq-space-xs) var(--triarq-space-xs);">
              <!-- Ad hoc form open for this stage -->
              <div *ngIf="showAttachForm && attachingForTypeId === '__adhoc__' + group.stage"
                   style="background:var(--triarq-color-background-subtle);
                          border-radius:5px;padding:var(--triarq-space-xs);
                          position:relative;">
                <app-loading-overlay [visible]="attaching" message="Attaching artifact…"></app-loading-overlay>
                <form [formGroup]="attachForm" (ngSubmit)="submitAttach()">
                  <div style="display:grid;gap:var(--triarq-space-xs);
                              grid-template-columns:2fr 3fr auto;align-items:end;">
                    <div>
                      <label style="display:block;font-size:10px;margin-bottom:2px;">
                        Artifact Title <span style="color:var(--triarq-color-error);">*</span>
                      </label>
                      <input formControlName="display_name" class="oi-input"
                             style="font-size:var(--triarq-text-small);"
                             placeholder="e.g. Context Brief v2" />
                    </div>
                    <div>
                      <label style="display:block;font-size:10px;margin-bottom:2px;">
                        External URL <span style="color:var(--triarq-color-error);">*</span>
                      </label>
                      <input formControlName="external_url" class="oi-input" type="url"
                             placeholder="https://…"
                             style="font-size:var(--triarq-text-small);" />
                    </div>
                    <div style="display:flex;gap:4px;">
                      <button type="submit" class="oi-btn-primary"
                              [disabled]="attachForm.invalid || attaching"
                              style="font-size:var(--triarq-text-small);white-space:nowrap;
                                     display:flex;align-items:center;gap:6px;">
                        <ion-spinner *ngIf="attaching" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                        <span>{{ attaching ? '…' : 'Attach' }}</span>
                      </button>
                      <button type="button" (click)="cancelAttach()"
                              style="background:none;border:none;cursor:pointer;
                                     font-size:var(--triarq-text-small);
                                     color:var(--triarq-color-text-secondary);">✕</button>
                    </div>
                  </div>
                  <div *ngIf="attachError"
                       style="color:var(--triarq-color-error);font-size:10px;margin-top:4px;">
                    {{ attachError }}
                  </div>
                </form>
              </div>
              <!-- Ad hoc link -->
              <button *ngIf="!(showAttachForm && attachingForTypeId === '__adhoc__' + group.stage)"
                      (click)="openAttachForm('__adhoc__' + group.stage)"
                      style="font-size:10px;color:var(--triarq-color-primary);
                             background:none;border:none;cursor:pointer;padding:0;">
                + Attach Document
              </button>
            </div>

          </div><!-- end expanded body -->

        </div><!-- end stage group loop -->

        <!-- Empty state per build-c-view-correction-spec-2026-04-09 Section 2.6 -->
        <div *ngIf="artifactsByStage.length === 0"
             style="font-size:14px;font-style:italic;font-family:Roboto,sans-serif;
                    color:#9E9E9E;padding:16px;">
          No artifacts attached yet. Artifact slots become available as the cycle advances through stages.
        </div>
      </div>

      <!-- ── Jira Sync Panel ─────────────────────────────────────────────── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:var(--triarq-space-xs);">
          <span style="font-weight:500;">Jira Sync</span>
          <!-- State 3: link present + configured — Sync Now button -->
          <button *ngIf="jiraLink && !syncStubMessage"
                  class="oi-btn-primary"
                  (click)="triggerJiraSync()"
                  [disabled]="syncing"
                  style="font-size:var(--triarq-text-small);
                         display:flex;align-items:center;gap:6px;">
            <ion-spinner *ngIf="syncing" name="crescent" style="width:14px;height:14px;"></ion-spinner>
            <span>{{ syncing ? 'Syncing…' : 'Sync Now' }}</span>
          </button>
        </div>

        <!-- State 1: No Jira link yet — show + Link button and inline form -->
        <div *ngIf="!jiraLink">
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                      margin-bottom:var(--triarq-space-xs);">
            No Jira epic linked to this cycle. Link a Jira epic key to enable
            two-way sync of the five governance fields (ARCH-16).
          </div>
          <div *ngIf="!showJiraLinkForm">
            <button (click)="showJiraLinkForm = true; jiraLinkError = ''"
                    style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                           background:none;border:none;cursor:pointer;padding:0;">
              + Link Jira Epic
            </button>
          </div>
          <div *ngIf="showJiraLinkForm"
               style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;">
            <input [formControl]="jiraEpicKeyCtrl"
                   class="oi-input"
                   placeholder="e.g. OIT-123"
                   style="font-size:var(--triarq-text-small);max-width:160px;" />
            <button class="oi-btn-primary"
                    (click)="linkJiraEpic()"
                    [disabled]="jiraEpicKeyCtrl.invalid || linkingJiraEpic"
                    style="font-size:var(--triarq-text-small);
                           display:flex;align-items:center;gap:6px;">
              <ion-spinner *ngIf="linkingJiraEpic" name="crescent"
                           style="width:14px;height:14px;"></ion-spinner>
              <span>Link</span>
            </button>
            <button (click)="showJiraLinkForm = false; jiraLinkError = ''"
                    style="font-size:var(--triarq-text-small);background:none;border:none;
                           cursor:pointer;color:var(--triarq-color-text-secondary);">
              Cancel
            </button>
            <span *ngIf="jiraLinkError"
                  style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);">
              {{ jiraLinkError }}
            </span>
          </div>
        </div>

        <!-- State 2: Link present but Jira not configured -->
        <div *ngIf="jiraLink && syncStubMessage"
             style="font-size:var(--triarq-text-small);">
          <div>
            Epic: <strong>{{ jiraLink.jira_epic_key }}</strong>
          </div>
          <div style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                      border-radius:0 6px 6px 0;
                      padding:var(--triarq-space-xs) var(--triarq-space-sm);
                      margin-top:var(--triarq-space-xs);">
            <div style="font-weight:500;margin-bottom:2px;">Jira sync not yet configured</div>
            <div style="color:var(--triarq-color-text-secondary);">{{ syncStubMessage }}</div>
          </div>
        </div>

        <!-- State 3: Link present + configured -->
        <div *ngIf="jiraLink && !syncStubMessage">
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
export class DeliveryCycleDetailComponent implements OnInit, OnChanges {

  /** Panel mode: cycleId provided as @Input from dashboard. Route mode: read from ActivatedRoute. */
  @Input() cycleId?: string;
  /** Emitted when user clicks the panel close button. Dashboard handles S-008 re-query. */
  @Output() close = new EventEmitter<void>();

  /** True when component is embedded as a right panel (cycleId provided via @Input). */
  get panelMode(): boolean { return !!this.cycleId; }

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
  attachingForTypeId   = '';
  promoteStubMessage = '';
  attachForm!:      FormGroup;

  // Jira
  syncing         = false;
  syncStubMessage = '';

  // Jira link form — State 1: no link yet
  showJiraLinkForm  = false;   // form visible toggle
  linkingJiraEpic   = false;   // API call in progress
  jiraEpicKeyCtrl   = new FormControl('', Validators.required);
  jiraLinkError     = '';

  // Gate approve confirmation step
  approveConfirming = false;

  // ON_HOLD
  holdBusy        = false;
  holdError       = '';
  showHoldReason  = false;
  holdReasonCtrl  = new FormControl('');

  // Stage regression (D-179 two-call pattern)
  regressPreview:    { target_stage: string; gates_to_reset: string[]; warning?: string } | null = null;
  regressConfirming  = false;  // awaiting confirm click
  regressBusy        = false;
  regressError       = '';

  // Cancel / Un-cancel (Contract 1 action zone, D-183 two-step pattern)
  cancelConfirming   = false;
  cancelBusy         = false;
  cancelError        = '';
  uncancelConfirming = false;
  uncancelBusy       = false;
  uncancelError      = '';

  // DS / CB assignment
  allUsers:   User[] = [];
  editingDs   = false;
  savingDs    = false;
  dsError     = '';
  dsControl   = new FormControl('');
  editingCb   = false;
  savingCb    = false;
  cbError     = '';
  cbControl   = new FormControl('');

  // S2: Gate detail sub-panel — additional status edit state
  // (selectedGate + selectedGateRecord already declared above)

  // Item 1: Milestone status edit — status dropdown per row
  editingMilestoneStatus:  GateName | null = null;
  milestoneStatusValue:    string          = '';
  savingMilestoneStatus    = false;
  milestoneStatusError     = '';
  // Item 1: Unset Complete inline confirmation — Principle 13
  unsetCompleteGate:       GateName | null = null;
  unsetCompleteReason      = new FormControl('', [Validators.required, Validators.minLength(10)]);
  unsetCompleteSaving      = false;
  unsetCompleteError       = '';
  // Session 2026-03-24-F: manual actual date entry for data quality path
  editingActualDateGate:   GateName | null = null;
  actualDateControl        = new FormControl('');
  savingActualDate         = false;
  actualDateError          = '';

  // Item 2: Artifact stage expand/collapse — Principle 5
  // Populated on cycle load: current + past stages expanded by default; future collapsed
  expandedStages = new Set<string>();

  // Expose constants to template
  readonly GATE_LABELS     = GATE_LABELS;
  readonly STAGE_LABEL_MAP = STAGE_LABEL_MAP;

  constructor(
    private readonly route:          ActivatedRoute,
    private readonly delivery:       DeliveryService,
    private readonly profileService: UserProfileService,
    private readonly fb:             FormBuilder,
    private readonly cdr:            ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.gateDecisionForm = this.fb.group({ approver_notes: [''] });
    this.attachForm = this.fb.group({
      display_name: ['', Validators.required],
      external_url: ['', Validators.required]
    });
    const id = this.cycleId ?? this.route.snapshot.paramMap.get('cycle_id');
    if (id) { this.loadCycle(id); }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cycleId'] && !changes['cycleId'].firstChange && this.cycleId) {
      this.loadCycle(this.cycleId);
    }
  }

  private loadAllUsers(): void {
    this.profileService.listUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private loadCycle(cycleId: string): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    this.delivery.getCycle(cycleId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle = res.data;
          this.initExpandedStages(); // Item 2: expand current + past stages by default
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

  /**
   * Supplement Section 1: can the current caller submit gates on this cycle?
   * Derived from can_submit on any gate record (same value for all — based on role/assignment).
   * Defaults true when no gate records have authority info yet.
   */
  get callerCanSubmitGates(): boolean {
    const gateWithAuth = this.cycle?.gate_records?.find(g => g.current_user_gate_authority != null);
    return gateWithAuth?.current_user_gate_authority?.can_submit ?? true;
  }

  /**
   * Returns true when the selected gate has not yet been reached in the lifecycle
   * and submitting it would be premature. Gates are "not yet active" when the cycle
   * is more than one stage before the gate's trigger point.
   */
  isGateNotYetActive(gateName: GateName): boolean {
    if (!this.cycle) { return false; }
    // Minimum stage index the cycle must be at before the gate becomes active
    const GATE_MIN_STAGE_IDX: Partial<Record<GateName, number>> = {
      go_to_build:   2,  // SPEC (index 2)
      go_to_deploy:  4,  // VALIDATE (index 4)
      go_to_release: 6,  // UAT (index 6)
      close_review:  8   // OUTCOME (index 8)
    };
    const STAGE_ORDER: LifecycleStage[] = [
      'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE'
    ];
    const minIdx = GATE_MIN_STAGE_IDX[gateName];
    if (minIdx === undefined) { return false; } // brief_review is always reachable from BRIEF
    const currentIdx = STAGE_ORDER.indexOf(this.cycle.current_lifecycle_stage);
    return currentIdx >= 0 && currentIdx < minIdx;
  }

  get canAdvance(): boolean {
    const terminal: LifecycleStage[] = ['COMPLETE', 'CANCELLED', 'ON_HOLD'];
    return !!this.cycle && !terminal.includes(this.cycle.current_lifecycle_stage);
  }

  get canRegress(): boolean {
    const blocked: LifecycleStage[] = ['BRIEF', 'COMPLETE', 'CANCELLED', 'ON_HOLD'];
    return !!this.cycle && !blocked.includes(this.cycle.current_lifecycle_stage);
  }

  get canPlaceOnHold(): boolean {
    const blocked: LifecycleStage[] = ['COMPLETE', 'CANCELLED', 'ON_HOLD'];
    return !!this.cycle && !blocked.includes(this.cycle.current_lifecycle_stage);
  }

  // Contract 1: Cancel Cycle — available when not CANCELLED and not COMPLETE.
  get canCancelCycle(): boolean {
    const terminal: LifecycleStage[] = ['COMPLETE', 'CANCELLED'];
    return !!this.cycle && !terminal.includes(this.cycle.current_lifecycle_stage);
  }

  // Contract 1: Submit Gate for Approval shortcut — next pending gate for current stage.
  // Returns null when no gate is pending or gate is already submitted/approved.
  get pendingGateForSubmit(): GateName | null {
    if (!this.cycle) { return null; }
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage as LifecycleStage];
    if (!nextGate) { return null; }
    const record = this.cycle.gate_records?.find(r => r.gate_name === nextGate);
    if (record?.gate_status === 'pending' || record?.gate_status === 'approved') { return null; }
    return nextGate;
  }

  // D-244: Milestone Status 5-color dot — maps date_status to color token.
  milestoneStatusDotColor(dateStatus: DateStatus | undefined): string {
    const map: Record<string, string> = {
      not_started: '#9E9E9E',
      on_track:    '#2E7D32',
      at_risk:     '#F2A620',
      behind:      '#D32F2F',
      complete:    '#257099'
    };
    return map[dateStatus ?? 'not_started'] ?? '#9E9E9E';
  }

  // D-245: Gate Approval Status as contextual narrative text.
  gateApprovalNarrative(gateName: GateName): string {
    const record = this.cycle?.gate_records?.find(r => r.gate_name === gateName);
    if (!record) { return ''; }
    switch (record.gate_status) {
      case 'pending':  return 'Under Review — awaiting decision';
      case 'approved': return 'Approved';
      case 'returned': return 'Returned for revision';
      case 'blocked':  return 'Blocked — workstream inactive';
      default:         return '';
    }
  }

  // D-245: Color for Gate Approval Status narrative.
  gateApprovalNarrativeColor(gateName: GateName): string {
    const record = this.cycle?.gate_records?.find(r => r.gate_name === gateName);
    switch (record?.gate_status) {
      case 'approved': return 'var(--triarq-color-primary)';
      case 'returned': return 'var(--triarq-color-error)';
      case 'blocked':  return 'var(--triarq-color-error)';
      case 'pending':  return 'var(--triarq-color-sunray,#F2A620)';
      default:         return 'var(--triarq-color-text-secondary)';
    }
  }

  /**
   * Session 2026-03-24-F: gates where gate_status = 'approved' but
   * the corresponding milestone has no actual_date.
   * Returns GateName[] for row-level checks and count in the warning banner.
   */
  get missingActualDateGateNames(): GateName[] {
    if (!this.cycle) { return []; }
    const approvedGates = this.cycle.gate_records?.filter(g => g.gate_status === 'approved') ?? [];
    return approvedGates
      .filter(g => {
        const milestone = this.cycle!.milestone_dates?.find(m => m.gate_name === g.gate_name);
        return milestone && !milestone.actual_date;
      })
      .map(g => g.gate_name);
  }

  isMissingActualDate(gate: GateName): boolean {
    return this.missingActualDateGateNames.includes(gate);
  }

  /** Group cycle artifacts by lifecycle_stage for the artifacts panel.
   *  Group C: isFuture=true when the stage is beyond the current lifecycle stage — slots are dimmed. */
  get artifactsByStage(): { stage: string; slots: CycleArtifact[]; isFuture: boolean }[] {
    const artifacts = this.cycle?.artifacts;
    if (!artifacts?.length) { return []; }
    const STAGE_ORDER: string[] = [
      'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE'
    ];
    const currentIdx = STAGE_ORDER.indexOf(this.cycle?.current_lifecycle_stage as string ?? '');
    const stages = [...new Set(artifacts.map(a => a.lifecycle_stage ?? 'General'))];
    return stages.map(stage => {
      const stageIdx = STAGE_ORDER.indexOf(stage);
      return {
        stage,
        slots:    artifacts.filter(a => (a.lifecycle_stage ?? 'General') === stage),
        isFuture: currentIdx >= 0 && stageIdx > currentIdx
      };
    });
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

  // ── DS / CB assignment ─────────────────────────────────────────────────────

  startDsEdit(): void {
    this.dsControl.setValue(this.cycle?.assigned_ds_user_id ?? '');
    this.editingDs = true;
    this.dsError   = '';
    this.cdr.markForCheck();
  }

  cancelDsEdit(): void { this.editingDs = false; this.dsError = ''; this.cdr.markForCheck(); }

  saveDs(): void {
    if (!this.cycle) { return; }
    this.savingDs = true;
    this.dsError  = '';
    this.cdr.markForCheck();

    this.delivery.assignDsCb({
      delivery_cycle_id:    this.cycle.delivery_cycle_id,
      assigned_ds_user_id:  this.dsControl.value || null
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle!.assigned_ds_user_id      = res.data.assigned_ds_user_id;
          this.cycle!.assigned_ds_display_name = this.allUsers.find(u => u.id === res.data!.assigned_ds_user_id)?.display_name;
          this.editingDs = false;
          this.loadEvents(this.cycle!.delivery_cycle_id);
        } else {
          this.dsError = res.error ?? 'Assignment failed.';
        }
        this.savingDs = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.dsError  = err.error ?? 'Assignment failed. Check permissions and try again.';
        this.savingDs = false;
        this.cdr.markForCheck();
      }
    });
  }

  startCbEdit(): void {
    this.cbControl.setValue(this.cycle?.assigned_cb_user_id ?? '');
    this.editingCb = true;
    this.cbError   = '';
    this.cdr.markForCheck();
  }

  cancelCbEdit(): void { this.editingCb = false; this.cbError = ''; this.cdr.markForCheck(); }

  saveCb(): void {
    if (!this.cycle) { return; }
    this.savingCb = true;
    this.cbError  = '';
    this.cdr.markForCheck();

    this.delivery.assignDsCb({
      delivery_cycle_id:    this.cycle.delivery_cycle_id,
      assigned_cb_user_id:  this.cbControl.value || null
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle!.assigned_cb_user_id      = res.data.assigned_cb_user_id;
          this.cycle!.assigned_cb_display_name = this.allUsers.find(u => u.id === res.data!.assigned_cb_user_id)?.display_name;
          this.editingCb = false;
          this.loadEvents(this.cycle!.delivery_cycle_id);
        } else {
          this.cbError = res.error ?? 'Assignment failed.';
        }
        this.savingCb = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.cbError  = err.error ?? 'Assignment failed. Check permissions and try again.';
        this.savingCb = false;
        this.cdr.markForCheck();
      }
    });
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

  // ── Stage regression — D-179 two-call pattern ─────────────────────────────

  /** Call 1: fetch preview (target stage + gates that will reset). */
  initiateRegress(): void {
    if (!this.cycle) { return; }
    this.regressBusy  = true;
    this.regressError = '';
    this.cdr.markForCheck();

    this.delivery.reverseStage({ delivery_cycle_id: this.cycle.delivery_cycle_id }).subscribe({
      next: (res) => {
        if (res.success && res.data?.['requires_confirmation']) {
          this.regressPreview    = res.data as { target_stage: string; gates_to_reset: string[]; warning?: string };
          this.regressConfirming = true;
        } else {
          this.regressError = res.error ?? 'Unable to preview stage regression.';
        }
        this.regressBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.regressError = err.error ?? 'Could not reach the server.';
        this.regressBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** Call 2: user confirmed — execute regression. */
  confirmRegress(): void {
    if (!this.cycle) { return; }
    this.regressBusy  = true;
    this.regressError = '';
    this.cdr.markForCheck();

    this.delivery.reverseStage({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      confirmed:         true
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.regressConfirming = false;
          this.regressPreview    = null;
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.regressError = res.error ?? 'Stage regression failed.';
        }
        this.regressBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.regressError = err.error ?? 'Stage regression failed.';
        this.regressBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelRegress(): void {
    this.regressConfirming = false;
    this.regressPreview    = null;
    this.regressError      = '';
    this.cdr.markForCheck();
  }

  // ── ON_HOLD ────────────────────────────────────────────────────────────────

  placeOnHold(): void {
    if (!this.cycle) { return; }
    this.holdBusy  = true;
    this.holdError = '';
    this.cdr.markForCheck();

    const reason = this.holdReasonCtrl.value?.trim() || undefined;
    this.delivery.setOnHold({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      ...(reason ? { hold_reason: reason } : {})
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showHoldReason = false;
          this.holdReasonCtrl.reset();
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.holdError = res.error ?? 'Could not place cycle on hold.';
        }
        this.holdBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.holdError = err.error ?? 'Could not place cycle on hold.';
        this.holdBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  resumeFromHold(): void {
    if (!this.cycle) { return; }
    this.holdBusy  = true;
    this.holdError = '';
    this.cdr.markForCheck();

    this.delivery.resumeFromHold(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.holdError = res.error ?? 'Could not resume cycle from hold.';
        }
        this.holdBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.holdError = err.error ?? 'Could not resume cycle from hold.';
        this.holdBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Contract 1 action zone methods ────────────────────────────────────────

  // Edit Cycle stub — Contract 2 will implement the edit route.
  // Source: Contract 1 action zone item 1, 2026-04-10.
  editCycleStub(): void {
    // Stub: Edit Cycle route not yet built. Contract 2 scope.
    window.alert('Edit Cycle — available in the next release.');
  }

  // Cancel Cycle action — D-183 two-step pattern. State: cancelConfirming guards the button.
  cancelCycleAction(): void {
    if (!this.cycle) { return; }
    this.cancelBusy  = true;
    this.cancelError = '';
    this.cdr.markForCheck();

    this.delivery.cancelCycle(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle           = res.data;
          this.cancelConfirming = false;
        } else {
          this.cancelError = res.error ?? 'Cancel failed. Please try again.';
        }
        this.cancelBusy = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cancelError = 'Cancel failed. Please try again.';
        this.cancelBusy  = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Un-cancel Cycle action — D-183 two-step pattern. State: uncancelConfirming guards the button.
  uncancelCycleAction(): void {
    if (!this.cycle) { return; }
    this.uncancelBusy  = true;
    this.uncancelError = '';
    this.cdr.markForCheck();

    this.delivery.uncancelCycle(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycle             = res.data;
          this.uncancelConfirming = false;
        } else {
          this.uncancelError = res.error ?? 'Restore failed. Please try again.';
        }
        this.uncancelBusy = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uncancelError = 'Restore failed. Please try again.';
        this.uncancelBusy  = false;
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
    this.approveConfirming  = false;
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

    // Capture pre-save status — if Behind, changing target date resets to Not Started (spec Item 1)
    const preSaveIdx = this.cycle.milestone_dates?.findIndex(m => m.gate_name === gate) ?? -1;
    const wasBehind  = preSaveIdx !== -1 && this.cycle.milestone_dates![preSaveIdx].date_status === 'behind';

    this.delivery.setMilestoneTargetDate({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      target_date:       this.milestoneDateControl.value
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle!.milestone_dates?.findIndex(m => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle!.milestone_dates) {
            const updated = res.data;
            // If milestone was Behind and target date changed, reset status to Not Started
            if (wasBehind && updated.date_status === 'behind') {
              updated.date_status = 'not_started';
            }
            this.cycle!.milestone_dates[idx] = updated;
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
    this.attachingForTypeId   = artifactTypeId;
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
      artifact_type_id:  this.attachingForTypeId || undefined,
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

  /** State 1: Link a Jira epic to this cycle using the epic key form. */
  linkJiraEpic(): void {
    if (!this.cycle || !this.jiraEpicKeyCtrl.value?.trim()) { return; }
    this.linkingJiraEpic = true;
    this.jiraLinkError   = '';
    this.cdr.markForCheck();

    this.delivery.syncJiraEpic({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      jira_epic_key:     this.jiraEpicKeyCtrl.value.trim()
    }).subscribe({
      next: (res) => {
        if (res.success || res.data?.['stub']) {
          this.showJiraLinkForm = false;
          this.jiraEpicKeyCtrl.reset();
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.jiraLinkError = res.error ?? 'Could not link epic. Check the key and try again.';
        }
        this.linkingJiraEpic = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.jiraLinkError   = 'Could not reach the server. Check your connection and try again.';
        this.linkingJiraEpic = false;
        this.cdr.markForCheck();
      }
    });
  }

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

  // ── Badge helpers (Visual Layout Standards 1.7/3.1 — 4px radius, not pill) ──

  tierBadgeBg(tier: TierClassification): string {
    if (tier === 'tier_1') { return '#E3F2FD'; }
    if (tier === 'tier_2') { return '#E0F2F1'; }
    return '#FFF3E0'; // tier_3
  }

  tierBadgeColor(tier: TierClassification): string {
    if (tier === 'tier_1') { return '#1565C0'; }
    if (tier === 'tier_2') { return '#00695C'; }
    return '#E65100'; // tier_3
  }

  tierLabel(tier: TierClassification): string {
    if (tier === 'tier_1') { return '1'; }
    if (tier === 'tier_2') { return '2'; }
    return '3';
  }

  // ── Gate status text display (Section 2.4 — display-only per date state model) ──

  /** Gate status text color per Visual Layout Standards 1.7 */
  gateStatusTextColor(dateStatus: DateStatus): string {
    if (dateStatus === 'on_track')   { return 'var(--triarq-color-sunray,#F2A620)'; }
    if (dateStatus === 'at_risk')    { return '#E96127'; }
    return '#9E9E9E'; // not_started
  }

  /** Gate status font weight per Visual Layout Standards 1.7 */
  gateStatusFontWeight(dateStatus: DateStatus): string {
    return dateStatus === 'not_started' ? '400' : '600';
  }

  /** Gate status display label (pending/awaiting = Sunray label) */
  gateStatusDisplayLabel(dateStatus: DateStatus): string {
    const labels: Record<string, string> = {
      not_started: 'Not Started',
      on_track:    'Awaiting Approval',
      at_risk:     'At Risk'
    };
    return labels[dateStatus] ?? dateStatus;
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

  // ── S2: Gate detail sub-panel methods ─────────────────────────────────────

  /** Close gate panel without navigating away — Principle 10 */
  closeGatePanel(): void {
    this.selectedGate       = null;
    this.selectedGateRecord = null;
    this.gateActionError    = '';
    this.gateActionHint     = '';
    this.approveConfirming  = false;
    this.cdr.markForCheck();
  }

  /** Compute the display status label for the gate — Section 2.3 of Part 2 spec */
  gateDetailStatus(gate: GateName): string {
    const record = this.cycle?.gate_records?.find(g => g.gate_name === gate);
    if (record?.gate_status === 'approved')  { return 'Approved'; }
    if (record?.gate_status === 'blocked')   { return 'Blocked'; }
    if (record?.gate_status === 'returned')  { return 'Returned'; }
    if (record?.gate_status === 'pending')   { return 'Under Review'; }
    if (this.isGateNotYetActive(gate))       { return 'Not Yet Active'; }
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle?.current_lifecycle_stage as LifecycleStage ?? 'BRIEF'];
    if (nextGate === gate) { return 'Pending'; }
    return 'Upcoming';
  }

  gateDetailStatusBg(gate: GateName): string {
    const s = this.gateDetailStatus(gate);
    if (s === 'Approved')       { return '#e8f5e9'; }
    if (s === 'Blocked')        { return '#fdecea'; }
    if (s === 'Returned')       { return '#fff8e1'; }
    if (s === 'Under Review')   { return '#e3f2fd'; }
    if (s === 'Pending')        { return 'var(--triarq-color-background-subtle)'; }
    return '#f5f5f5';
  }

  gateDetailStatusColor(gate: GateName): string {
    const s = this.gateDetailStatus(gate);
    if (s === 'Approved')       { return '#2e7d32'; }
    if (s === 'Blocked')        { return 'var(--triarq-color-error)'; }
    if (s === 'Returned')       { return '#e65100'; }
    if (s === 'Under Review')   { return 'var(--triarq-color-primary)'; }
    return 'var(--triarq-color-text-secondary)';
  }

  /** Milestone row matching the selected gate — shown in gate sub-panel MILESTONE DATE section */
  get selectedGateMilestone(): CycleMilestoneDate | null {
    if (!this.selectedGate || !this.cycle) { return null; }
    return this.cycle.milestone_dates?.find(m => m.gate_name === this.selectedGate) ?? null;
  }

  /** Gate checklist — computed from cycle state per gate name. Section 2.2, Part 2 spec. */
  gateChecklist(gate: GateName): { label: string; met: boolean }[] {
    if (!this.cycle) { return []; }
    const c    = this.cycle;
    const arts = c.artifacts ?? [];

    const byStage = (stage: string) => arts.filter(a => a.lifecycle_stage === stage && a.external_url);
    const briefArts   = byStage('BRIEF');
    const specArts    = byStage('SPEC');
    const buildArts   = byStage('BUILD');
    const uatArts     = byStage('UAT');
    const pilotArts   = byStage('PILOT');
    const outcomeArts = byStage('OUTCOME');

    const hasName = (list: CycleArtifact[], ...terms: string[]) =>
      list.some(a => terms.some(t => (a.artifact_type_name ?? '').toLowerCase().includes(t)));

    const isTier3 = c.tier_classification === 'tier_3';

    switch (gate) {
      case 'brief_review':
        return [
          { label: 'Context Package attached (at least one Brief Artifact)',      met: briefArts.length > 0 },
          { label: 'Outcome Statement set',                                        met: !!c.outcome_statement },
          { label: 'Tier classification set',                                      met: !!c.tier_classification },
          { label: 'Assigned Domain Strategist set',                               met: !!c.assigned_ds_user_id },
        ];
      case 'go_to_build':
        return [
          { label: 'Context Package attached',                                     met: briefArts.length > 0 },
          { label: 'Outcome Statement set',                                        met: !!c.outcome_statement },
          { label: 'Technical Specification complete',                             met: hasName(specArts, 'technical spec') },
          { label: 'Tier classification set',                                      met: !!c.tier_classification },
          { label: 'Jira epic linked',                                             met: !!(c.jira_links?.[0]?.jira_epic_key) },
          { label: 'MCP scope declared (Cursor Prompt or Agent Registry)',         met: hasName(specArts, 'cursor prompt', 'agent registry', 'mcp scope') },
          { label: 'Assigned Capability Builder set',                              met: !!c.assigned_cb_user_id },
        ];
      case 'go_to_deploy':
        return [
          { label: 'Delivery Cycle Build Report attached',                         met: hasName(buildArts, 'build report') },
          { label: 'UAT sign-off record attached',                                 met: hasName(uatArts, 'uat sign') },
          ...(isTier3 ? [
            { label: '7-step governance checklist attached (Tier 3)',              met: hasName(uatArts, '7-step', 'governance checklist') },
            { label: 'HITRUST/GRICS checklist attached (Tier 3)',                  met: hasName(uatArts, 'hitrust', 'grics') },
          ] : []),
        ];
      case 'go_to_release':
        return [
          { label: 'Pilot observations log attached',                              met: hasName(pilotArts, 'pilot observ') },
          ...(isTier3 ? [
            { label: 'AI Production Governance Board compliance check (Tier 3)',   met: false },
          ] : []),
        ];
      case 'close_review':
        return [
          { label: 'Outcome measurement record attached',                          met: hasName(outcomeArts, 'outcome measurement') },
          { label: 'Outcome Statement matches demonstrated result (confirm in notes)', met: !!this.selectedGateRecord?.approver_notes },
          ...(isTier3 ? [
            { label: 'Wiz continuous monitoring baseline attached (Tier 3)',       met: hasName(outcomeArts, 'wiz') },
          ] : []),
        ];
      default:
        return [];
    }
  }

  /** Short tier label for gate sub-panel breadcrumb — "1", "2", or "3" */
  tierShortLabel(tier: TierClassification): string {
    return tier === 'tier_1' ? '1' : tier === 'tier_2' ? '2' : '3';
  }

  /** Resolve approver display name from allUsers list */
  approverDisplayName(userId: string): string {
    return this.allUsers.find(u => u.id === userId)?.display_name ?? userId;
  }

  // ── Date status helpers (used in gate sub-panel + milestone rows) ──────────

  dateStatusLabel(s: DateStatus): string {
    const labels: Record<DateStatus, string> = {
      not_started: 'Not Started',
      on_track:    'On Track',
      at_risk:     'At Risk',
      behind:      'Behind',
      complete:    'Complete',
    };
    return labels[s] ?? s;
  }

  dateStatusBg(s: DateStatus): string {
    if (s === 'on_track') { return '#e8f5e9'; }
    if (s === 'at_risk')  { return '#fff8e1'; }
    if (s === 'behind')   { return '#fdecea'; }
    if (s === 'complete') { return '#e3f2fd'; }
    return 'var(--triarq-color-background-subtle)';
  }

  dateStatusColor(s: DateStatus): string {
    if (s === 'on_track') { return '#2e7d32'; }
    if (s === 'at_risk')  { return '#e65100'; }
    if (s === 'behind')   { return 'var(--triarq-color-error)'; }
    if (s === 'complete') { return 'var(--triarq-color-primary)'; }
    return 'var(--triarq-color-text-secondary)';
  }

  /** Options available to user for status dropdown based on current date_status */
  milestoneStatusOptions(current: DateStatus): { value: DateStatus; label: string }[] {
    const all: { value: DateStatus; label: string }[] = [
      { value: 'not_started', label: 'Not Started' },
      { value: 'on_track',    label: 'On Track' },
      { value: 'at_risk',     label: 'At Risk' },
    ];
    // Behind and Complete are system-set — not in user-selectable options
    return all.filter(o => o.value !== current);
  }

  // ── Item 1: Milestone status edit ─────────────────────────────────────────

  startMilestoneStatusEdit(m: CycleMilestoneDate): void {
    this.editingMilestoneStatus = m.gate_name;
    this.milestoneStatusValue   = m.date_status;
    this.milestoneStatusError   = '';
    this.cdr.markForCheck();
  }

  cancelMilestoneStatusEdit(): void {
    this.editingMilestoneStatus = null;
    this.milestoneStatusError   = '';
    this.cdr.markForCheck();
  }

  saveMilestoneStatus(gate: GateName): void {
    if (!this.cycle || !this.milestoneStatusValue) { return; }
    this.savingMilestoneStatus = true;
    this.milestoneStatusError  = '';
    this.cdr.markForCheck();

    this.delivery.updateMilestoneStatus({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      date_status:       this.milestoneStatusValue as DateStatus,
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle!.milestone_dates?.findIndex(m => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle!.milestone_dates) {
            this.cycle!.milestone_dates[idx] = res.data;
          }
          this.editingMilestoneStatus = null;
        } else {
          this.milestoneStatusError = res.error ?? 'Save failed.';
        }
        this.savingMilestoneStatus = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.milestoneStatusError  = err.error ?? 'Save failed. Try again.';
        this.savingMilestoneStatus = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Item 1: Unset Complete inline confirmation — Principle 13 ──────────────

  /** Begin the Unset Complete flow — show inline confirmation with impact statement. */
  startUnsetComplete(gate: GateName): void {
    this.unsetCompleteGate = gate;
    this.unsetCompleteReason.reset();
    this.unsetCompleteError = '';
    this.cdr.markForCheck();
  }

  cancelUnsetComplete(): void {
    this.unsetCompleteGate  = null;
    this.unsetCompleteError = '';
    this.cdr.markForCheck();
  }

  /** Save Unset Complete — requires reason ≥ 10 chars; logs to audit trail. */
  confirmUnsetComplete(): void {
    if (!this.cycle || !this.unsetCompleteGate || this.unsetCompleteReason.invalid) { return; }
    this.unsetCompleteSaving = true;
    this.unsetCompleteError  = '';
    this.cdr.markForCheck();

    this.delivery.updateMilestoneStatus({
      delivery_cycle_id:       this.cycle.delivery_cycle_id,
      gate_name:               this.unsetCompleteGate,
      date_status:             'not_started',
      status_override_reason:  this.unsetCompleteReason.value?.trim() ?? '',
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle!.milestone_dates?.findIndex(m => m.gate_name === this.unsetCompleteGate) ?? -1;
          if (idx !== -1 && this.cycle!.milestone_dates) {
            this.cycle!.milestone_dates[idx] = res.data;
          }
          this.unsetCompleteGate = null;
          this.loadEvents(this.cycle!.delivery_cycle_id);
        } else {
          this.unsetCompleteError = res.error ?? 'Save failed.';
        }
        this.unsetCompleteSaving = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.unsetCompleteError  = err.error ?? 'Save failed. Try again.';
        this.unsetCompleteSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Session 2026-03-24-F: manual actual date entry (data quality path) ────────

  startActualDateEdit(gate: GateName): void {
    this.editingActualDateGate = gate;
    this.actualDateControl.setValue('');
    this.actualDateError = '';
    this.cdr.markForCheck();
  }

  cancelActualDateEdit(): void {
    this.editingActualDateGate = null;
    this.actualDateError       = '';
    this.cdr.markForCheck();
  }

  saveActualDate(gate: GateName): void {
    if (!this.cycle || !this.actualDateControl.value) { return; }
    this.savingActualDate = true;
    this.actualDateError  = '';
    this.cdr.markForCheck();

    this.delivery.setMilestoneActualDate({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      actual_date:       this.actualDateControl.value,
      manually_entered:  true
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle!.milestone_dates?.findIndex(m => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle!.milestone_dates) {
            this.cycle!.milestone_dates[idx] = res.data;
          }
          this.editingActualDateGate = null;
          this.loadEvents(this.cycle!.delivery_cycle_id);
        } else {
          this.actualDateError = res.error ?? 'Save failed.';
        }
        this.savingActualDate = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.actualDateError  = err.error ?? 'Save failed. Try again.';
        this.savingActualDate = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Item 2: Artifact stage expand/collapse ─────────────────────────────────

  /** Initialise expandedStages: current + past stages expanded; future collapsed. */
  private initExpandedStages(): void {
    if (!this.cycle) { return; }
    const STAGE_ORDER = [
      'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE'
    ];
    const currentIdx = STAGE_ORDER.indexOf(this.cycle.current_lifecycle_stage);
    this.expandedStages = new Set(
      STAGE_ORDER.filter((_, i) => i <= currentIdx)
    );
  }

  /** Toggle a stage section open or closed. */
  toggleStageExpand(stage: string): void {
    if (this.expandedStages.has(stage)) {
      this.expandedStages.delete(stage);
    } else {
      this.expandedStages.add(stage);
    }
    this.cdr.markForCheck();
  }

  isStageExpanded(stage: string): boolean {
    return this.expandedStages.has(stage);
  }

  /** Count attached artifacts in a stage group */
  attachedCountInGroup(slots: CycleArtifact[]): number {
    return slots.filter(s => s.external_url || s.oi_library_artifact_id).length;
  }
}
