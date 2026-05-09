// delivery-cycle-detail.component.ts — DeliveryCycleDetailComponent
// Route: /delivery/:cycle_id  (also used as embedded right panel via @Input cycleId)
// Spec: build-c-spec Section 5.3 | Contract 1 2026-04-10
//
// Contract 1 changes: S-005/S-006 View surface — display-only fields, action zone.
// Contract 4 changes: D-273 zone reorder (Stage Track above Outcome), D-275 editable gate table, D-276 Outcome display-only (no inline link).
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
  EventEmitter,
  HostListener
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeliveryService }         from '../../../core/services/delivery.service';
import { UserProfileService }      from '../../../core/services/user-profile.service';
import { StageTrackComponent, LIFECYCLE_TRACK } from '../stage-track/stage-track.component';
import { LoadingOverlayComponent }          from '../../../shared/components/loading-overlay/loading-overlay.component';
import { DeliveryCycleEditPanelComponent }  from '../edit-panel/delivery-cycle-edit-panel.component';
import {
  GateRecordModalComponent,
  GateRecordModalData,
  GateRecordModalResult
} from '../gate-record-modal/gate-record-modal.component';
import { User }                    from '../../../core/types/database';
import {
  DeliveryCycle,
  CycleMilestoneDate,
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
  go_to_deploy:   'Go to Deploy',
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
  VALIDATE: 'Validate', UAT: 'UAT', PILOT: 'Pilot', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

@Component({
  selector: 'app-delivery-cycle-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, MatDialogModule, StageTrackComponent, LoadingOverlayComponent, DeliveryCycleEditPanelComponent],
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
    <!-- position:relative required for Edit panel absolute overlay per S-006. Contract 2 2026-04-10. -->
    <div *ngIf="!loading && cycle"
         style="position:relative;"
         [ngStyle]="panelMode
           ? {padding: 'var(--triarq-space-md)'}
           : {'max-width': '860px', margin: 'var(--triarq-space-xl) auto', padding: '0 var(--triarq-space-md)'}">

      <!-- Edit Cycle panel overlay — S-006 push pattern. Replaces editCycleStub(). Contract 2 2026-04-10. -->
      <!-- B-12 fix: [cancelSignal] routes scrim-click through edit panel's dirty-state check. -->
      <app-delivery-cycle-edit-panel
        *ngIf="showEditPanel && cycle"
        [cycle]="cycle"
        [allUsers]="allUsers"
        [cancelSignal]="cancelEditSignal"
        (saved)="onEditSaved()"
        (cancelled)="onEditCancelled()">
      </app-delivery-cycle-edit-panel>

      <!-- D-291: sticky outer wrapper — B-11 fix: close button + header card both sticky.
           Close button was a separate non-sticky element above the card; scrolled away
           leaving × inaccessible. Now both are inside one sticky container. Source: D-291. -->
      <div style="position:sticky;top:0;z-index:5;background:#fff;">

      <!-- Close X moved into the cycle-header right cluster (B-76).
           Previously rendered above the card on its own row, which placed it visually
           higher than the title. Now sits inline with the action buttons in the card
           header, vertically centred with the title. Source: Contract 12 §3 B-76. -->

      <!-- ── Cycle Header ───────────────────────────────────────────────── -->
      <!-- D-291: in sticky outer wrapper. Source: D-291. -->
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

            <!-- DS/CB moved to Identity zone below Stage Track. D-273. -->
          </div>
          <!-- ── Action Zone — D-348 Tier 2 + D-349 dual entry point + B-75/B-76 ──── -->
          <!-- Single-row layout right-aligned with the cycle title. Close X lives at
               the rightmost edge so it sits at the same vertical position as the
               title. Source: Contract 12 §3 B-75, B-76; D-348; D-349. -->
          <div style="display:flex;flex-direction:row;align-items:center;
                      gap:var(--triarq-space-sm);flex-wrap:wrap;flex-shrink:0;">

            <!-- 1. Edit Cycle — opens Edit panel per S-006. Contract 2 2026-04-10. -->
            <button (click)="openEditPanel()"
                    class="oi-btn-primary"
                    style="white-space:nowrap;font-size:var(--triarq-text-small);">
              ✎ Edit Cycle
            </button>

            <!-- 2. D-349 dual entry point — submittable: opens gate sub-panel
                    (the action zone). Submit confirmation happens inside the
                    sub-panel; this button no longer fires the MCP submit
                    directly. Source: Contract 12 D-349. -->
            <button *ngIf="headerGate && headerGateState === 'submittable' && callerCanSubmitGates"
                    (click)="openGatePanel(headerGate)"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              ↑ Submit {{ GATE_NAME_DISPLAY[headerGate] }} for Approval
            </button>

            <!-- 2b. D-297 awaiting_approval — non-interactive informs user the
                     gate is already submitted. Clicking still opens the sub-panel
                     so the approver/withdrawer can act on it. Source: D-297, D-349. -->
            <button *ngIf="headerGate && headerGateState === 'awaiting_approval'"
                    (click)="openGatePanel(headerGate)"
                    style="white-space:nowrap;font-size:11px;
                           color:var(--triarq-color-text-secondary);
                           background:#f6f3e7;border:1px solid #e0d8b8;
                           border-radius:5px;padding:3px 8px;cursor:pointer;"
                    [title]="'Awaiting approval — open the gate record to act on it'">
              Awaiting Approval
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
              Cancel Cycle
            </button>

            <!-- 5. Un-cancel Cycle — CANCELLED stage only -->
            <button *ngIf="cycle.current_lifecycle_stage === 'CANCELLED' && !uncancelConfirming"
                    (click)="uncancelConfirming = true"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              ↺ Un-cancel Cycle
            </button>

            <!-- B-76: Close X aligned within the panel header (was a separate row above). -->
            <button *ngIf="panelMode"
                    (click)="close.emit()"
                    title="Close panel"
                    aria-label="Close panel"
                    style="background:none;border:none;cursor:pointer;
                           color:var(--triarq-color-text-secondary);font-size:20px;
                           line-height:1;padding:4px 8px;margin-left:var(--triarq-space-xs);">✕</button>

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
              {{ cancelBusy ? 'Cancelling…' : 'Cancel Cycle' }}
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

      </div><!-- end D-291 sticky outer wrapper (B-11) -->

      <!-- ── Stage Track — Full mode (D-273: above Outcome) ────────────────────── -->
      <!-- Label fixed "Lifecycle Track" → "Stage Track" per S-002 and Contract 3 Block 4 Fix 1. -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);position:relative;">
        <div style="font-weight:500;margin-bottom:4px;">Stage Track</div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                    margin-bottom:var(--triarq-space-sm);">
          Click a gate diamond to open its record and record a decision.
        </div>

        <!-- D-360 Surface 1: Current State chip ────────────────────────────── -->
        <div style="margin-bottom:var(--triarq-space-sm);">
          <span [style.background]="currentStateChipBg"
                [style.color]="currentStateChipColor"
                style="display:inline-flex;align-items:center;padding:3px 12px;
                       border-radius:999px;font-size:12px;font-weight:600;">
            {{ currentStateChipLabel }}
          </span>
        </div>

        <app-stage-track
          [currentStageId]="cycle.current_lifecycle_stage"
          [gateStateMap]="gateStateMap"
          displayMode="full"
          (gateClicked)="openGatePanel($event)"
          (stageAdvanceRequested)="requestStageAdvance($event)"
        ></app-stage-track>

        <!-- D-360 Surface 3: inline two-step confirm (D-183 pattern) ────────── -->
        <div *ngIf="pendingAdvanceTo"
             style="margin-top:var(--triarq-space-md);padding:var(--triarq-space-sm) var(--triarq-space-md);
                    background:rgba(37,112,153,0.06);border-left:3px solid var(--triarq-color-primary);
                    border-radius:5px;">
          <div style="font-size:13px;color:var(--triarq-color-text-primary);margin-bottom:var(--triarq-space-sm);">
            Advance to <strong>{{ pendingAdvanceLabel }}</strong>?
            This records that <strong>{{ currentStageLabel }}</strong> work is complete.
          </div>
          <div style="display:flex;gap:var(--triarq-space-sm);">
            <button type="button"
                    [disabled]="advancingStage"
                    (click)="confirmStageAdvance()"
                    style="background:var(--triarq-color-primary);color:#fff;border:none;border-radius:5px;
                           padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">
              {{ advancingStage ? 'Advancing…' : 'Advance to ' + pendingAdvanceLabel }}
            </button>
            <button type="button"
                    [disabled]="advancingStage"
                    (click)="cancelStageAdvance()"
                    style="background:#fff;color:var(--triarq-color-text-primary);
                           border:1px solid var(--triarq-color-border);border-radius:5px;
                           padding:7px 14px;font-size:13px;cursor:pointer;">
              Cancel
            </button>
          </div>

          <!-- D-200 Pattern 3: error block, primary + secondary -->
          <div *ngIf="advanceError"
               style="margin-top:var(--triarq-space-sm);padding:8px 12px;
                      background:#fdecea;border-left:3px solid var(--triarq-color-error, #c0392b);
                      border-radius:5px;">
            <div style="font-size:13px;color:var(--triarq-color-error, #c0392b);font-weight:500;">
              {{ advanceError }}
            </div>
            <div style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:2px;">
              Cancel to dismiss, or Advance again to retry.
            </div>
          </div>
        </div>

        <!-- D-346 panel overlay during MCP advance call -->
        <div *ngIf="advancingStage"
             aria-hidden="true"
             style="position:absolute;inset:0;background:rgba(255,255,255,0.55);
                    border-radius:10px;z-index:5;pointer-events:all;"></div>
      </div>

      <!-- ── Outcome Statement — display only (D-276: no inline Add/Edit link). ── -->
      <!-- D-273: below Stage Track. No amber box (D-276). Gray guidance when null.  -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="font-weight:500;font-size:var(--triarq-text-body);margin-bottom:var(--triarq-space-xs);">
          Outcome Statement
        </div>
        <!-- When null: gray guidance text. D-200 Pattern 1. No inline Add link per D-276. -->
        <div *ngIf="!cycle.outcome_statement"
             style="color:var(--triarq-color-text-secondary);font-size:14px;
                    font-style:italic;font-family:Roboto,sans-serif;">
          Not set — should be added before Brief Review Gate. Edit via the Edit Cycle button above.
        </div>
        <!-- When set: regular body text, not italic. D-296 amends D-276. Source: D-296. -->
        <div *ngIf="cycle.outcome_statement"
             style="font-size:14px;font-family:Roboto,sans-serif;
                    color:#262626;white-space:pre-wrap;">
          {{ cycle.outcome_statement }}
        </div>
      </div>

      <!-- ── Identity zone — D-273 zone 4: Division / Workstream / DS / CB / Tier / Jira Epic ── -->
      <!-- D-181: tappable chips. 2-column grid. Unset values: dashed-border chip italic gray.    -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="font-weight:500;margin-bottom:var(--triarq-space-sm);">Identity</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--triarq-space-sm);">

          <!-- Division -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Division</div>
            <span *ngIf="cycle.division_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(90,90,90,0.08);color:#5A5A5A;font-size:12px;">
              {{ cycle.division_name }}
            </span>
            <!-- B-9 fix: prefix field label on empty states. Source: D-184. -->
            <span *ngIf="!cycle.division_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Division: Not set
            </span>
          </div>

          <!-- Workstream -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Workstream</div>
            <!-- D-203: display_name_short preferred; fallback to workstream_name when null. Source: Contract 5 Block 2.4. -->
            <span *ngIf="cycle.workstream?.workstream_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(90,90,90,0.08);color:#5A5A5A;font-size:12px;">
              {{ cycle.workstream!.display_name_short ?? cycle.workstream!.workstream_name }}
            </span>
            <!-- B-9 fix: prefix field label on empty states. Source: D-184. -->
            <span *ngIf="!cycle.workstream?.workstream_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Workstream: Not set
            </span>
          </div>

          <!-- DS (Domain Strategist) -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Domain Strategist</div>
            <span *ngIf="cycle.assigned_ds_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:12px;">
              {{ cycle.assigned_ds_display_name }}
            </span>
            <!-- B-9 fix: prefix field label on empty states. Source: D-184. -->
            <span *ngIf="!cycle.assigned_ds_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Domain Strategist: Unassigned
            </span>
          </div>

          <!-- CB (Capability Builder) -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Capability Builder</div>
            <span *ngIf="cycle.assigned_cb_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:12px;">
              {{ cycle.assigned_cb_display_name }}
            </span>
            <!-- B-9 fix: prefix field label on empty states. Source: D-184. -->
            <span *ngIf="!cycle.assigned_cb_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Capability Builder: Unassigned
            </span>
          </div>

          <!-- Tier — badge chip per Visual Layout Standards 1.7. CC-Decision-2026-04-12-A: Contract 5 restores badge. -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Tier</div>
            <span *ngIf="cycle.tier_classification"
                  [style.background]="tierBadgeBg(cycle.tier_classification)"
                  [style.color]="tierBadgeColor(cycle.tier_classification)"
                  style="display:inline-block;border-radius:4px;padding:3px 8px;
                         font-size:12px;font-weight:500;font-family:Roboto,sans-serif;">
              Tier {{ tierLabel(cycle.tier_classification) }} —
              {{ cycle.tier_classification === 'tier_1' ? 'Fast Lane' : cycle.tier_classification === 'tier_2' ? 'Structured' : 'Governed' }}
            </span>
            <!-- B-9 fix: prefix field label on empty states. Source: D-184. -->
            <span *ngIf="!cycle.tier_classification"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Tier: Not set
            </span>
          </div>

          <!-- Jira Epic Link -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Jira Epic</div>
            <span *ngIf="jiraLink?.jira_epic_key"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:12px;">
              {{ jiraLink!.jira_epic_key }}
            </span>
            <!-- B-9 fix: prefix field label on empty states. Source: D-184. -->
            <span *ngIf="!jiraLink?.jira_epic_key"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Jira Epic: Not linked
            </span>
          </div>

        </div>
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

      <!-- ── Gates & Milestone Dates — D-273 zone 5, D-275 editable gate rows ──── -->
      <!-- 4-column table: Gate (diamond+name) / Target Date (editable) / Actual Date / Status -->
      <!-- D-275: target date, actual date, status editable directly in View gate rows.         -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="font-weight:500;margin-bottom:var(--triarq-space-sm);">Gates &amp; Milestone Dates</div>

        <!-- Table header row -->
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 120px;
                    gap:var(--triarq-space-sm);padding:6px 0;
                    border-bottom:2px solid var(--triarq-color-border);
                    font-size:10px;font-weight:600;letter-spacing:0.06em;
                    text-transform:uppercase;color:var(--triarq-color-text-secondary);">
          <span>Gate</span>
          <span>Target Date</span>
          <span>Actual Date</span>
          <span>Status</span>
        </div>

        <!-- Gate rows — D-275: target date, actual date, and status editable in View.
             B-60: sorted by gate sequence (Brief Review → Close Review).
             D-360 Surface 4: active gate row gets 3px primary left border + primary gate name. -->
        <div *ngFor="let m of sortedMilestoneDates; trackBy: trackByMilestoneId"
             [style.border-left]="isActiveGate(m.gate_name) ? '3px solid var(--triarq-color-primary)' : '3px solid transparent'"
             [style.padding-left]="'8px'"
             style="border-bottom:1px solid var(--triarq-color-border);">

          <div style="display:grid;grid-template-columns:2fr 1fr 1fr 120px;
                      gap:var(--triarq-space-sm);padding:10px 0;
                      font-size:var(--triarq-text-small);align-items:center;cursor:pointer;"
               (click)="openGatePanel(m.gate_name)">

            <!-- Col 1: Gate diamond + name + approval narrative -->
            <div style="display:flex;align-items:flex-start;gap:8px;">
              <!-- Gate diamond icon -->
              <span style="display:inline-flex;align-items:center;justify-content:center;
                           flex-shrink:0;margin-top:1px;">
                <svg width="14" height="14" viewBox="0 0 14 14"
                     [attr.fill]="gateDetailStatusBg(m.gate_name)"
                     [attr.stroke]="gateApprovalNarrativeColor(m.gate_name)"
                     stroke-width="1.5">
                  <rect x="2" y="2" width="10" height="10" rx="1" transform="rotate(45 7 7)"/>
                </svg>
              </span>
              <div>
                <span [style.color]="isActiveGate(m.gate_name) ? 'var(--triarq-color-primary)' : null"
                      style="font-weight:500;">{{ GATE_LABELS[m.gate_name] }}</span>
                <div *ngIf="gateApprovalNarrative(m.gate_name)"
                     [style.color]="gateApprovalNarrativeColor(m.gate_name)"
                     style="font-size:11px;margin-top:2px;">
                  {{ gateApprovalNarrative(m.gate_name) }}
                </div>
                <!-- B-103 (Contract 15) — D-205 Condition A: status = Complete AND
                     (actual_date IS NULL OR gate not approved). Either side fires. -->
                <span *ngIf="effectiveDateStatus(m) === 'complete' && (!m.actual_date || !isGateApproved(m.gate_name))"
                      style="font-size:11px;color:var(--triarq-color-sunray,#f5a623);"
                      [attr.title]="!m.actual_date
                        ? 'Status set to Complete but actual date not set'
                        : 'Status set to Complete but gate not yet approved'">⚠</span>
                <!-- B-103 (Contract 15) — D-205 Condition B: target date past today AND
                     status not in (complete, behind). Requires target_date IS NOT NULL. -->
                <span *ngIf="isTargetDateOverdue(m) && effectiveDateStatus(m) !== 'behind' && effectiveDateStatus(m) !== 'complete'"
                      style="font-size:11px;color:var(--triarq-color-sunray,#f5a623);"
                      title="Target date has passed — consider updating the milestone status">⚠</span>
              </div>
            </div>

            <!-- Col 2: Target Date — editable date input. D-275. -->
            <div (click)="$event.stopPropagation()">
              <ng-container *ngIf="editingMilestoneGate === m.gate_name; else targetDateDisplay">
                <input [formControl]="milestoneDateControl"
                       type="date"
                       class="oi-input"
                       style="width:100%;font-size:12px;padding:3px 6px;" />
                <div style="display:flex;gap:4px;margin-top:4px;">
                  <button (click)="saveMilestoneDate(m.gate_name)"
                          [disabled]="savingMilestone"
                          style="font-size:11px;padding:2px 8px;background:var(--triarq-color-primary);
                                 color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    {{ savingMilestone ? 'Saving…' : 'Save' }}
                  </button>
                  <button (click)="cancelMilestoneEdit()"
                          style="font-size:11px;padding:2px 8px;background:none;
                                 border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                    Cancel
                  </button>
                </div>
                <div *ngIf="milestoneError" style="font-size:11px;color:var(--triarq-color-error);margin-top:2px;">{{ milestoneError }}</div>
              </ng-container>
              <ng-template #targetDateDisplay>
                <!-- D-300 / B-15 fix: date text neutral black — status dot and label carry color, not date text. -->
                <span *ngIf="m.target_date"
                      (click)="startMilestoneEdit(m)"
                      style="cursor:pointer;text-decoration:underline dotted;color:#1a1a1a;"
                      title="Click to edit target date">
                  {{ m.target_date }}
                </span>
                <span *ngIf="!m.target_date"
                      (click)="startMilestoneEdit(m)"
                      style="font-style:italic;color:#9E9E9E;cursor:pointer;
                             border-bottom:1px dashed #C0C0C0;"
                      title="Click to set target date">
                  Set date
                </span>
              </ng-template>
            </div>

            <!-- Col 3: Actual Date — system-set, user-editable. D-275. -->
            <div (click)="$event.stopPropagation()">
              <ng-container *ngIf="editingActualDateGate === m.gate_name; else actualDateDisplay">
                <input [formControl]="actualDateControl"
                       type="date"
                       class="oi-input"
                       style="width:100%;font-size:12px;padding:3px 6px;" />
                <div style="display:flex;gap:4px;margin-top:4px;">
                  <button (click)="saveActualDate(m.gate_name)"
                          [disabled]="savingActualDate"
                          style="font-size:11px;padding:2px 8px;background:var(--triarq-color-primary);
                                 color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    {{ savingActualDate ? 'Saving…' : 'Save' }}
                  </button>
                  <button (click)="cancelActualDateEdit()"
                          style="font-size:11px;padding:2px 8px;background:none;
                                 border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                    Cancel
                  </button>
                </div>
                <div *ngIf="actualDateError" style="font-size:11px;color:var(--triarq-color-error);margin-top:2px;">{{ actualDateError }}</div>
              </ng-container>
              <ng-template #actualDateDisplay>
                <!-- D-300 / B-15 fix: date text neutral black — removed overdue error-color binding on date text. -->
                <span *ngIf="m.actual_date"
                      (click)="startActualDateEdit(m.gate_name)"
                      style="cursor:pointer;text-decoration:underline dotted;color:#1a1a1a;"
                      title="Click to edit actual date">
                  {{ m.actual_date }}
                </span>
                <span *ngIf="!m.actual_date"
                      (click)="startActualDateEdit(m.gate_name)"
                      style="font-style:italic;color:#9E9E9E;cursor:pointer;"
                      title="Click to set actual date">
                  Not set
                </span>
              </ng-template>
            </div>

            <!-- Col 4: Status — colored dot (11px) + dropdown. D-275 / D-205: user controls freely. -->
            <div (click)="$event.stopPropagation()">
              <ng-container *ngIf="editingMilestoneStatus === m.gate_name; else statusDisplay">
                <select [(ngModel)]="milestoneStatusValue"
                        class="oi-input"
                        style="font-size:12px;padding:3px 6px;width:100%;">
                  <option value="not_started">Not Started</option>
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="behind">Behind</option>
                  <option value="complete">Complete</option>
                </select>
                <div style="display:flex;gap:4px;margin-top:4px;">
                  <button (click)="saveMilestoneStatus(m.gate_name)"
                          [disabled]="savingMilestoneStatus"
                          style="font-size:11px;padding:2px 8px;background:var(--triarq-color-primary);
                                 color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    {{ savingMilestoneStatus ? 'Saving…' : 'Save' }}
                  </button>
                  <button (click)="cancelMilestoneStatusEdit()"
                          style="font-size:11px;padding:2px 8px;background:none;
                                 border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                    Cancel
                  </button>
                </div>
                <div *ngIf="milestoneStatusError" style="font-size:11px;color:var(--triarq-color-error);margin-top:2px;">{{ milestoneStatusError }}</div>
              </ng-container>
              <ng-template #statusDisplay>
                <div style="display:flex;align-items:center;gap:5px;cursor:pointer;"
                     (click)="startMilestoneStatusEdit(m)"
                     title="Click to change status">
                  <span [style.background]="milestoneStatusDotColor(effectiveDateStatus(m))"
                        style="display:inline-block;width:11px;height:11px;border-radius:50%;flex-shrink:0;">
                  </span>
                  <span [style.color]="milestoneStatusDotColor(effectiveDateStatus(m))"
                        style="font-size:11px;font-weight:500;">
                    {{ milestoneStatusLabel(effectiveDateStatus(m)) }}
                  </span>
                  <!-- B-19 / D-205: alert when Behind is set but no target date exists. Source: D-205, Contract 9. -->
                  <span *ngIf="m.date_status === 'behind' && !m.target_date"
                        style="font-size:11px;color:var(--triarq-color-sunray,#f5a623);"
                        title="Behind is set but no target date exists">⚠</span>
                </div>
              </ng-template>
            </div>

          </div><!-- end row div -->

        </div><!-- end *ngFor milestone rows -->

        <!-- Status legend below table -->
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:var(--triarq-space-sm);
                    font-size:11px;color:var(--triarq-color-text-secondary);">
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#9E9E9E;"></span> Not Started</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#2E7D32;"></span> On Track</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#F2A620;"></span> At Risk</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#D32F2F;"></span> Behind</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#257099;"></span> Complete</span>
        </div>


        <!-- ── Gate Record entry instruction (D-355) ──────────────────────── -->
        <!-- The inline gate sub-panel is retired in Contract 13. Clicking either
             the small gate diamond or the large filled circle on the Stage Track
             opens the Gate Record Modal (D-355, ARCH-25). -->
        <p style="margin:var(--triarq-space-sm) 0 0 0;font-size:11px;font-style:italic;color:#5A5A5A;">
          Click a gate diamond on the Stage Track to open its record.
        </p>
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
        <!-- CC-Decision-2026-04-12-D: Zone explanatory text 11px italic #5A5A5A. Source: Contract 5 Block 2.5. -->
        <p style="margin:0 0 var(--triarq-space-sm) 0;font-size:11px;font-style:italic;color:#5A5A5A;">
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
          <!-- CC-Decision-2026-04-12-D: Zone explanatory text 11px italic #5A5A5A. Source: Contract 5 Block 2.5. -->
          <div style="font-size:11px;font-style:italic;color:#5A5A5A;
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
        <!-- CC-Decision-2026-04-12-D: Zone explanatory text 11px italic #5A5A5A. Source: Contract 5 Block 2.5. -->
        <div style="font-size:11px;font-style:italic;color:#5A5A5A;
                    margin-bottom:var(--triarq-space-sm);">
          Append-only record of all stage advances, gate decisions, artifact attachments,
          and outcome changes. Newest events at top.
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

    </div>
  `
})
export class DeliveryCycleDetailComponent implements OnInit, OnChanges {

  /** Panel mode: cycleId provided as @Input from dashboard. Route mode: read from ActivatedRoute. */
  @Input() cycleId?: string;
  /** Emitted when user clicks the panel close button. Dashboard handles S-008 re-query. */
  @Output() close = new EventEmitter<void>();
  /** D-292: Emitted when edit panel opens — dashboard activates scrim. Source: D-292. */
  @Output() editPanelOpened = new EventEmitter<void>();
  /** D-292: Emitted when edit panel closes (saved or cancelled) — dashboard deactivates scrim. Source: D-292. */
  @Output() editPanelClosed = new EventEmitter<void>();
  /** D-292: Dashboard increments to signal cancel to edit panel when scrim is clicked. Source: D-292. */
  @Input() cancelEditSignal = 0;

  /** D-345 §8: when set, auto-expand the named gate sub-panel after data load.
   *  Used by ActionQueueComponent — user lands at approval controls without extra tap. */
  @Input() autoExpandGate?: GateName;

  /** True when component is embedded as a right panel (cycleId provided via @Input). */
  get panelMode(): boolean { return !!this.cycleId; }

  cycle:         DeliveryCycle | null    = null;
  events:        CycleEventLogEntry[]    = [];
  loading        = false;
  loadingEvents  = false;
  loadError      = '';

  // Edit Cycle panel — S-006 push/pop. Contract 2 2026-04-10.
  showEditPanel  = false;

  // Outcome
  editingOutcome = false;
  savingOutcome  = false;
  outcomeError   = '';
  outcomeControl = new FormControl('', Validators.required);

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

  // D-360 Surface 3: free stage advance inline confirmation
  pendingAdvanceTo: LifecycleStage | null = null;
  advancingStage    = false;
  advanceError      = '';

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
    private readonly cdr:            ChangeDetectorRef,
    private readonly dialog:         MatDialog
  ) {}

  ngOnInit(): void {
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
    // D-292: cancelEditSignal proxied to edit panel via [cancelSignal] binding.
    // B-12 fix: edit panel's ngOnChanges calls requestCancel() — dirty-state check fires correctly.
    // No action needed here; Angular binding propagates the signal to the edit panel directly.
  }

  // D-292: ESC key in panel mode — close edit panel if open, otherwise close the detail panel. Source: D-292.
  // B-20/B-12 fix: was calling onEditCancelled() directly, which set showEditPanel=false immediately,
  // destroying the edit panel before its own onEscKey handler could show the dirty-state confirm overlay.
  // Fix: increment cancelEditSignal so ESC routes through the same signal path as scrim click, letting
  // the edit panel's requestCancel() perform the dirty-state check. Source: Contract 9.
  //
  // B-97 (Contract 15): when a MatDialog is open above the panel (Gate Record Modal),
  // the dialog owns the Escape key. Without this guard, the document-level handler
  // here would also fire — closing the panel and triggering a parent list reload —
  // on top of the modal close. Source: Contract 15.
  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (!this.panelMode) { return; }
    if (this.dialog.openDialogs.length > 0) { return; }
    if (this.showEditPanel) {
      this.cancelEditSignal++;
      this.cdr.markForCheck();
    } else {
      this.close.emit();
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
          // B-69: Stage Track scrollIntoView (B-61) and panel mount sometimes leave
          // an ambient text selection on Gate Record content. Clear it once on load.
          if (typeof window !== 'undefined') {
            window.getSelection()?.removeAllRanges();
          }
          // D-345 §8: open the requested gate sub-panel after data loads.
          if (this.autoExpandGate) {
            const gateToOpen = this.autoExpandGate;
            // Defer to next tick so view binds first.
            setTimeout(() => this.openGatePanel(gateToOpen), 0);
          }
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
      if (!record)                                     { map[gate] = 'upcoming';          continue; }
      if (record.gate_status === 'approved')           { map[gate] = 'complete';          continue; }
      if (record.gate_status === 'blocked')            { map[gate] = 'blocked';           continue; }
      if (record.gate_status === 'awaiting_approval')  { map[gate] = 'awaiting_approval'; continue; }
      if (record.gate_status === 'not_started')        { map[gate] = 'not_started';       continue; }
      // 'pending' (legacy) and 'returned' surface as pending (sunray).
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
      'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','COMPLETE'
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
  // D-345: 'awaiting_approval' is the new submitted state (was 'pending' pre-Migration 029).
  get pendingGateForSubmit(): GateName | null {
    if (!this.cycle) { return null; }
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage as LifecycleStage];
    if (!nextGate) { return null; }
    const record = this.cycle.gate_records?.find(r => r.gate_name === nextGate);
    if (record?.gate_status === 'awaiting_approval') { return null; }
    if (record?.gate_status === 'pending')           { return null; }
    if (record?.gate_status === 'approved')          { return null; }
    return nextGate;
  }

  /**
   * D-349: header gate slot for the dual entry point. Returns the next gate for
   * the current stage regardless of its status — the header label and
   * interactivity is decided by headerGateState below.
   */
  get headerGate(): GateName | null {
    if (!this.cycle) { return null; }
    return NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage as LifecycleStage] ?? null;
  }

  /**
   * D-349 + D-297: drives the header button.
   *   'submittable'        → "Submit {Gate} for Approval", click opens sub-panel.
   *   'awaiting_approval'  → "Awaiting Approval", non-interactive (informs user).
   *   'absent'             → button hidden (no submittable gate exists).
   */
  get headerGateState(): 'submittable' | 'awaiting_approval' | 'absent' {
    const gate = this.headerGate;
    if (!gate) { return 'absent'; }
    const record = this.cycle?.gate_records?.find(r => r.gate_name === gate);
    if (record?.gate_status === 'awaiting_approval') { return 'awaiting_approval'; }
    if (record?.gate_status === 'approved')          { return 'absent'; }
    return 'submittable';
  }

  /** D-345: gate name display strings for sub-panel UI text. */
  readonly GATE_NAME_DISPLAY: Record<GateName, string> = {
    brief_review:  'Brief Review',
    go_to_build:   'Go to Build',
    go_to_deploy:  'Go to Deploy',
    go_to_release: 'Go to Release',
    close_review:  'Close Review'
  };

  /** D-345: gate records sorted by lifecycle gate order. Defensive sort for B-60. */
  get sortedMilestoneDates(): CycleMilestoneDate[] {
    const order: GateName[] = ['brief_review','go_to_build','go_to_deploy','go_to_release','close_review'];
    const list = this.cycle?.milestone_dates ?? [];
    return [...list].sort((a, b) => order.indexOf(a.gate_name) - order.indexOf(b.gate_name));
  }

  /** Relative time string for the "Submitted [time] by [name]" line. */
  submittedRelative(at: string | null | undefined): string {
    if (!at) { return ''; }
    const ms = Date.now() - Date.parse(at);
    if (Number.isNaN(ms) || ms < 0) { return new Date(at).toLocaleDateString(); }
    const days = Math.floor(ms / 86400000);
    if (days === 0) { return 'Today'; }
    if (days === 1) { return 'Yesterday'; }
    if (days < 14)  { return `${days} days ago`; }
    return new Date(at).toLocaleDateString();
  }

  // B-19 fix: D-205 — user sets all five statuses freely at any time regardless of target date.
  // Previous logic overrode 'behind' to 'not_started' when no target date, making Behind appear blocked.
  // Now returns raw date_status always. Alert icon shown separately when behind + no target date.
  // Source: D-205, Contract 9.
  effectiveDateStatus(m: { target_date?: string | null; date_status: DateStatus }): DateStatus {
    return m.date_status;
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

  // D-245 + D-345: Gate Approval Status as contextual narrative text.
  // Contract 3 Block 4 Fix 3: "Under Review" only shown for the CURRENT gate (the gate this
  // cycle's lifecycle stage is heading toward). Gates not yet reached show nothing when pending.
  // Returned: short form "↩ [first 60 chars of approver_notes]…" — gate-flow-spec §5.
  gateApprovalNarrative(gateName: GateName): string {
    const record = this.cycle?.gate_records?.find(r => r.gate_name === gateName);
    if (!record) { return ''; }
    const currentGate = this.cycle ? NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage] : null;
    switch (record.gate_status) {
      case 'awaiting_approval': return 'Awaiting approval';
      case 'pending':           return gateName === currentGate ? 'Under Review — awaiting decision' : '';
      case 'approved':          return 'Approved';
      case 'returned': {
        const notes = (record.approver_notes ?? '').trim();
        if (!notes) { return '↩ Returned for revision'; }
        const shortNotes = notes.length > 60 ? `${notes.slice(0, 60)}…` : notes;
        return `↩ ${shortNotes}`;
      }
      case 'blocked':  return 'Blocked — workstream inactive';
      default:         return '';
    }
  }

  // D-245: Color for Gate Approval Status narrative.
  gateApprovalNarrativeColor(gateName: GateName): string {
    const record = this.cycle?.gate_records?.find(r => r.gate_name === gateName);
    switch (record?.gate_status) {
      case 'approved':          return 'var(--triarq-color-primary)';
      case 'returned':          return '#E96127'; // Oravive per gate-flow-spec §5
      case 'blocked':           return 'var(--triarq-color-error)';
      case 'awaiting_approval': return 'var(--triarq-color-sunray,#F2A620)';
      case 'pending':           return 'var(--triarq-color-sunray,#F2A620)';
      default:                  return 'var(--triarq-color-text-secondary)';
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

  /** Returns true when a gate has been approved — used for alert icon check. D-275. */
  isGateApproved(gate: GateName): boolean {
    return this.cycle?.gate_records?.find(g => g.gate_name === gate)?.gate_status === 'approved';
  }

  /** Returns true when today is past the target date and the gate is not yet completed. D-275. */
  isTargetDateOverdue(m: CycleMilestoneDate): boolean {
    if (!m.target_date || m.actual_date) { return false; }
    const today = new Date().toISOString().slice(0, 10);
    return m.target_date < today;
  }

  /** Display label for milestone status dot. Distinct from gateStatusDisplayLabel (different label set). */
  milestoneStatusLabel(dateStatus: DateStatus | undefined): string {
    const labels: Record<string, string> = {
      not_started: 'Not Started',
      on_track:    'On Track',
      at_risk:     'At Risk',
      behind:      'Behind',
      complete:    'Complete'
    };
    return labels[dateStatus ?? 'not_started'] ?? (dateStatus ?? 'Not Started');
  }

  /** Group cycle artifacts by lifecycle_stage for the artifacts panel.
   *  Group C: isFuture=true when the stage is beyond the current lifecycle stage — slots are dimmed. */
  get artifactsByStage(): { stage: string; slots: CycleArtifact[]; isFuture: boolean }[] {
    const artifacts = this.cycle?.artifacts;
    if (!artifacts?.length) { return []; }
    const STAGE_ORDER: string[] = [
      'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','COMPLETE'
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

  // Opens Edit Cycle panel — S-006 push. Replaces editCycleStub() from Contract 1.
  // Contract 2 2026-04-10.
  openEditPanel(): void {
    this.showEditPanel = true;
    // D-292: notify dashboard to show scrim. Source: D-292.
    this.editPanelOpened.emit();
    this.cdr.markForCheck();
  }

  // Edit saved: pop Edit from stack, re-query cycle unconditionally per S-008.
  onEditSaved(): void {
    this.showEditPanel = false;
    // D-292: notify dashboard to hide scrim. Source: D-292.
    this.editPanelClosed.emit();
    this.loadCycle(this.cycle!.delivery_cycle_id);   // S-008: unconditional re-query on every stack pop.
    this.cdr.markForCheck();
  }

  // Edit cancelled: pop Edit from stack. No re-query (spec 2.6).
  onEditCancelled(): void {
    this.showEditPanel = false;
    // D-292: notify dashboard to hide scrim. Source: D-292.
    this.editPanelClosed.emit();
    this.cdr.markForCheck();
  }

  // Cancel Cycle action — D-183 two-step pattern. State: cancelConfirming guards the button.
  // ── D-360 Surface 3: free stage advance inline confirmation ───────────────

  /** Surface 3 trigger — fired by StageTrackComponent when next-free stage is clicked. */
  requestStageAdvance(stageId: string): void {
    this.pendingAdvanceTo = stageId as LifecycleStage;
    this.advanceError     = '';
    this.cdr.markForCheck();
  }

  cancelStageAdvance(): void {
    if (this.advancingStage) return;
    this.pendingAdvanceTo = null;
    this.advanceError     = '';
    this.cdr.markForCheck();
  }

  confirmStageAdvance(): void {
    if (!this.cycle || !this.pendingAdvanceTo) return;
    this.advancingStage = true;
    this.advanceError   = '';
    this.cdr.markForCheck();

    this.delivery.advanceStage(this.cycle.delivery_cycle_id).subscribe({
      next: (res) => {
        if (res.success) {
          this.pendingAdvanceTo = null;
          this.advancingStage   = false;
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.advancingStage = false;
          this.advanceError   = res.error ?? 'Stage advance failed. Please try again.';
          this.cdr.markForCheck();
        }
      },
      error: (err: { error?: string }) => {
        this.advancingStage = false;
        this.advanceError   = err.error ?? 'Stage advance failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  /** D-360 Surface 1 helpers + Surface 3 confirmation labels */

  get currentStageLabel(): string {
    return STAGE_LABEL_MAP[this.cycle?.current_lifecycle_stage as LifecycleStage] ?? '';
  }

  /** Stage id and gate id between the current stage and the next stage in LIFECYCLE_TRACK. */
  private get nextStageInTrack(): { stageId: LifecycleStage | null; gateId: GateName | null; gateLabel: string } {
    const currentId = this.cycle?.current_lifecycle_stage;
    if (!currentId) return { stageId: null, gateId: null, gateLabel: '' };
    const idx = LIFECYCLE_TRACK.findIndex(n => n.type === 'stage' && n.id === currentId);
    if (idx === -1) return { stageId: null, gateId: null, gateLabel: '' };
    let interveningGate: GateName | null = null;
    let interveningGateLabel = '';
    for (let i = idx + 1; i < LIFECYCLE_TRACK.length; i++) {
      const node = LIFECYCLE_TRACK[i];
      if (node.type === 'gate') {
        interveningGate      = node.id as GateName;
        interveningGateLabel = node.label;
        continue;
      }
      if (node.type === 'stage') {
        return { stageId: node.id as LifecycleStage, gateId: interveningGate, gateLabel: interveningGateLabel };
      }
    }
    return { stageId: null, gateId: interveningGate, gateLabel: interveningGateLabel };
  }

  get pendingAdvanceLabel(): string {
    return STAGE_LABEL_MAP[this.pendingAdvanceTo as LifecycleStage] ?? this.pendingAdvanceTo ?? '';
  }

  /** Surface 1: which gate (if any) currently determines the chip state. */
  private get currentStateGate(): { gateId: GateName | null; gateLabel: string; status: GateStatus | null } {
    const { gateId, gateLabel } = this.nextStageInTrack;
    if (!gateId) return { gateId: null, gateLabel, status: null };
    const record = this.cycle?.gate_records?.find(g => g.gate_name === gateId);
    return { gateId, gateLabel, status: (record?.gate_status ?? null) as GateStatus | null };
  }

  /** Surface 1 chip label per D-360 logic. */
  get currentStateChipLabel(): string {
    const { gateLabel, status } = this.currentStateGate;
    if (status === 'awaiting_approval' || status === 'pending') return `${gateLabel} — Awaiting Approval`;
    if (status === 'returned')                                  return `${gateLabel} — Returned`;
    return `In ${this.currentStageLabel}`;
  }

  /** Surface 1 chip background colour. */
  get currentStateChipBg(): string {
    const { status } = this.currentStateGate;
    if (status === 'awaiting_approval' || status === 'pending') return 'rgba(242, 166, 32, 0.12)';
    if (status === 'returned')                                  return 'rgba(233, 97, 39, 0.12)';
    return 'rgba(37, 112, 153, 0.12)';
  }

  /** Surface 1 chip text colour. */
  get currentStateChipColor(): string {
    const { status } = this.currentStateGate;
    if (status === 'awaiting_approval' || status === 'pending') return 'var(--triarq-color-sunray, #F2A620)';
    if (status === 'returned')                                  return '#E96127';
    return 'var(--triarq-color-primary, #257099)';
  }

  /**
   * D-360 Surface 4: returns the single currently active gate, or null. Active =
   * record status not_started / pending / awaiting_approval / returned. Approved
   * gates are not active. Only one row highlighted at a time — first gate in
   * lifecycle order whose status is in the active set.
   */
  get activeGateName(): GateName | null {
    if (!this.cycle) return null;
    const ACTIVE_STATUSES: GateStatus[] = ['not_started', 'pending', 'awaiting_approval', 'returned'];
    const ORDERED_GATES: GateName[] = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];
    for (const gateName of ORDERED_GATES) {
      const record = this.cycle.gate_records?.find(g => g.gate_name === gateName);
      if (record && ACTIVE_STATUSES.includes(record.gate_status)) return gateName;
    }
    return null;
  }

  isActiveGate(gateName: GateName): boolean {
    return this.activeGateName === gateName;
  }

  // ─────────────────────────────────────────────────────────────────────────

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

  /**
   * D-355: open the Gate Record Modal centered on the page. Replaces the
   * retired inline gate sub-panel. The modal owns submit / approve / return /
   * withdraw writes and closes with a refreshKind so the caller can reload the
   * cycle in line with D-345 panel refresh rules.
   */
  openGatePanel(gate: GateName): void {
    if (!this.cycle) return;

    const data: GateRecordModalData = {
      cycle:                this.cycle,
      gateName:             gate,
      allUsers:             this.allUsers,
      callerCanSubmitGates: this.callerCanSubmitGates,
      checklist:            this.gateChecklist(gate)
    };

    const ref = this.dialog.open<GateRecordModalComponent, GateRecordModalData, GateRecordModalResult>(
      GateRecordModalComponent,
      {
        data,
        panelClass: 'oi-gate-record-modal-panel',
        width: '640px',
        maxWidth: '92vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true
      }
    );

    ref.afterClosed().subscribe((result) => {
      if (!result || result.refreshKind === 'none') return;
      // D-345: full reload after approve/return (stage advance / state churn);
      // partial in-place reload after submit/withdraw.
      if (this.cycle?.delivery_cycle_id) {
        this.loadCycle(this.cycle.delivery_cycle_id);
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

  // ── Gate display helpers (used by gate rows + Gate Record Modal) ──────────

  /** Compute the display status label for the gate — Section 2.3 of Part 2 spec.
   *  CC-Decision-2026-04-12-B: 'not_started' is the seed status for new gate records.
   *  D-345: 'awaiting_approval' is the post-submission state.
   *  'pending' is legacy seed (pre-D-282) and now treated as Under Review.
   *  Source: Contract 5 Block 2.2, gate-submission-flow-spec-2026-04-19. */
  gateDetailStatus(gate: GateName): string {
    const record = this.cycle?.gate_records?.find(g => g.gate_name === gate);
    if (record?.gate_status === 'approved')          { return 'Approved'; }
    if (record?.gate_status === 'blocked')           { return 'Blocked'; }
    if (record?.gate_status === 'returned')          { return 'Returned'; }
    if (record?.gate_status === 'awaiting_approval') { return 'Awaiting Approval'; }
    if (record?.gate_status === 'pending')           { return 'Under Review'; }
    if (record?.gate_status === 'not_started')       { return 'Not Started'; }
    if (this.isGateNotYetActive(gate))               { return 'Not Yet Active'; }
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle?.current_lifecycle_stage as LifecycleStage ?? 'BRIEF'];
    if (nextGate === gate) { return 'Pending'; }
    return 'Upcoming';
  }

  gateDetailStatusBg(gate: GateName): string {
    const s = this.gateDetailStatus(gate);
    if (s === 'Approved')           { return '#e8f5e9'; }
    if (s === 'Blocked')            { return '#fdecea'; }
    if (s === 'Returned')           { return '#fff8e1'; }
    if (s === 'Awaiting Approval')  { return '#fff3e0'; } // sunray tint
    if (s === 'Under Review')       { return '#e3f2fd'; }
    if (s === 'Pending')            { return 'var(--triarq-color-background-subtle)'; }
    if (s === 'Not Started')        { return '#f5f5f5'; }
    return '#f5f5f5';
  }

  gateDetailStatusColor(gate: GateName): string {
    const s = this.gateDetailStatus(gate);
    if (s === 'Approved')           { return '#2e7d32'; }
    if (s === 'Blocked')            { return 'var(--triarq-color-error)'; }
    if (s === 'Returned')           { return '#E96127'; } // Oravive per gate-flow-spec §5
    if (s === 'Awaiting Approval')  { return '#E65100'; }
    if (s === 'Under Review')       { return 'var(--triarq-color-primary)'; }
    if (s === 'Not Started')        { return '#9E9E9E'; }
    return 'var(--triarq-color-text-secondary)';
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
      case 'close_review': {
        const closeReviewRecord = c.gate_records?.find(r => r.gate_name === 'close_review');
        return [
          { label: 'Outcome measurement record attached',                          met: hasName(outcomeArts, 'outcome measurement') },
          { label: 'Outcome Statement matches demonstrated result (confirm in notes)', met: !!closeReviewRecord?.approver_notes },
          ...(isTier3 ? [
            { label: 'Wiz continuous monitoring baseline attached (Tier 3)',       met: hasName(outcomeArts, 'wiz') },
          ] : []),
        ];
      }
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
          // B-17 fix: translate raw DB constraint errors to plain language. Source: D-140.
          this.actualDateError = translateMilestoneError(res.error ?? 'Save failed.');
        }
        this.savingActualDate = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        // B-17 fix: translate raw DB constraint errors to plain language. Source: D-140.
        this.actualDateError  = translateMilestoneError(err?.error ?? 'Save failed. Try again.');
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
      'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','COMPLETE'
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

// ── B-17: Error translation helper ────────────────────────────────────────────
// Translates raw DB constraint error messages to plain-language user messages.
// Raw constraint names must never appear in the UI per D-140. Source: B-17.
function translateMilestoneError(raw: string): string {
  if (raw.includes('cycle_milestone_dates_date_status_check') ||
      raw.includes('check constraint')) {
    return 'Could not save date — the status value may be incompatible with this gate. ' +
           'Try setting the status to \'Not Started\' and saving again.';
  }
  return raw;
}
