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
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
import { McpService }              from '../../../core/services/mcp.service';
import { UserProfileService }      from '../../../core/services/user-profile.service';
import { StageTrackComponent, LIFECYCLE_TRACK } from '../stage-track/stage-track.component';
import { LoadingOverlayComponent }          from '../../../shared/components/loading-overlay/loading-overlay.component';
import { DeliveryCycleEditPanelComponent }  from '../edit-panel/delivery-cycle-edit-panel.component';
import { InitiativeStatusUpdatePanelComponent }  from '../status-panel/initiative-status-update-panel.component';
import { InitiativeStatusHistoryPanelComponent } from '../status-panel/initiative-status-history-panel.component';
import { LatestInitiativeStatus } from '../../../core/types/initiative-status';
import { GATE_DATE_SEMANTICS } from '../../../shared/constants/gate-coaching.constants';
import { buildUnifiedGateStateMap, gateDateConflict, nextGateInOrder, nextGateIsSubmitted, nextGateUndated, aiBoardGateFor } from '../gate-visual.utils';
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
  Division,
  JiraLink,
  GateName,
  GateStatus,
  GateStateMap,
  TierClassification,
  LifecycleStage,
  DateStatus,
  // Contract 37 (D-549–D-553)
  EffectiveSprintCalendar,
  GateDateRuleType,
  SprintAnchor,
  SprintRow,
  GateDateShift
} from '../../../core/types/database';
import {
  resolveSprintRule,
  resolveRelativeRule,
  formatTargetDateDisplay,
  sprintDropdownLabel,
  ruleChipLabel
} from '../../../core/utils/sprint-resolution';
import { EggSpotComponent } from '../../easter-eggs/egg-spot.component';
// Contract G3 (D-567/D-562): post-creation sizing edit dialog.
import { SizingEditDialogComponent, SizingEditDialogData } from '../sizing-form/sizing-edit-dialog.component';
// Contract G4 (D-563/D-564): participation section (replaces D-458 array pills).
import { InitiativeParticipationSectionComponent } from '../participation/initiative-participation-section.component';
import { EGG_KEYS }         from '../../../core/constants/easter-egg.constants';

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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, MatDialogModule, StageTrackComponent, LoadingOverlayComponent, DeliveryCycleEditPanelComponent, InitiativeStatusUpdatePanelComponent, InitiativeStatusHistoryPanelComponent, EggSpotComponent, InitiativeParticipationSectionComponent],
  styles: [`:host { display: block; position: relative; }`],
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
        <a routerLink="/initiatives" style="color:var(--triarq-color-primary);">Initiative Tracking</a>.
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

      <!-- Contract 30: Back to origin (My Actions tab / Home card) when deep-linked. -->
      <a *ngIf="!panelMode && returnTo"
         role="button" tabindex="0"
         (click)="goBack()" (keydown.enter)="goBack()"
         style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;
                color:var(--triarq-color-primary,#257099);font-size:13px;
                margin-bottom:12px;text-decoration:none;">← Back</a>

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

      <!-- Contract 32 (WS2): Initiative Status Update panel (edit mode) — D-478. -->
      <app-initiative-status-update-panel
        *ngIf="showStatusPanel && cycle"
        [initiativeId]="cycle.delivery_cycle_id"
        [initiativeName]="cycle.cycle_title"
        mode="edit"
        [pilotApplicable]="pilotConfidenceApplicable"
        [closeApplicable]="closeConfidenceApplicable"
        (saved)="onStatusSaved()"
        (cancelled)="onStatusCancelled()">
      </app-initiative-status-update-panel>

      <!-- Contract 32 (WS2): Status History panel — D-478 §4.3. -->
      <app-initiative-status-history-panel
        *ngIf="showHistoryPanel && cycle"
        [initiativeId]="cycle.delivery_cycle_id"
        [initiativeName]="cycle.cycle_title"
        (close)="showHistoryPanel = false">
      </app-initiative-status-history-panel>

      <!-- D-291 (amended by D-416): sticky outer wrapper. × close button lives
           INSIDE this sticky wrapper at upper-right so it stays visible while the
           panel content scrolls (Phil 2026-06-15: × was falling off when content
           was tall enough to scroll past the top of viewport). Destructive actions
           are visually segregated from non-destructive by an Oravive fill + 1px
           fog vertical rule per D-416 Rule 2. -->
      <div style="position:sticky;top:0;z-index:5;background:#fff;">
        <!-- Sticky × close button — sits at top-right of every scroll position. -->
        <button *ngIf="panelMode"
                class="oi-close-btn"
                (click)="close.emit()"
                title="Close panel"
                aria-label="Close panel"
                style="position:absolute;top:12px;right:12px;z-index:10;background:#fff;">
          ✕
        </button>



      <!-- ── Cycle Header ───────────────────────────────────────────────── -->
      <!-- D-291: in sticky outer wrapper. Source: D-291. -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">

        <div style="display:flex;align-items:flex-start;justify-content:space-between;
                    flex-wrap:wrap;gap:var(--triarq-space-sm);">
          <div>
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;
                        margin-bottom:var(--triarq-space-xs);">
              <!-- Stage badge — Visual Layout Standards 1.7/3.1: 4px radius, not pill.
                   Contract 17 §1: read through currentStageLabel() getter so the badge
                   resolves the label from the current cycle reference on every CD pass.
                   D-345 full reload replaces this.cycle; OnPush + markForCheck propagate. -->
              <span style="background:var(--triarq-color-primary,#257099);color:#fff;
                           font-size:12px;font-weight:500;font-family:Roboto,sans-serif;
                           border-radius:4px;padding:3px 8px;text-transform:uppercase;
                           letter-spacing:0.5px;">
                {{ currentStageLabel || cycle.current_lifecycle_stage }}
              </span>
              <!-- Contract G3 (D-567): sized Initiatives show the governance
                   level chip; unsized legacy keeps the tier badge (AC #4). -->
              <span *ngIf="cycleIsSized"
                    style="font-size:12px;font-weight:500;font-family:Roboto,sans-serif;
                           border-radius:999px;padding:3px 10px;background:#257099;color:#fff;"
                    [title]="levelChipTooltip">
                {{ levelChipText }}
              </span>
              <!-- Tier badge — Visual Layout Standards 1.7/3.1: tier colors, 4px radius -->
              <span *ngIf="!cycleIsSized"
                    [style.background]="tierBadgeBg(cycle.tier_classification)"
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
              ✎ Edit Initiative…
            </button>
            <!-- CC-38 f25 (Phil): status actions moved into the Current Status
                 box — actions live where their data lives; floater keeps only
                 initiative-level commands. -->

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

            <!-- D-416 Rule 2: 1px fog vertical rule separating non-destructive from
                 destructive actions. Renders only when destructive action is present. -->
            <div *ngIf="canCancelCycle && !cancelConfirming"
                 style="width:1px;align-self:stretch;background:#A6A6A6;
                        margin:0 12px;flex-shrink:0;"></div>

            <!-- 4. Cancel Initiative — destructive. D-416: Oravive fill, far right of
                 action bar. D-183 two-step inline confirm preserved. -->
            <button *ngIf="canCancelCycle && !cancelConfirming"
                    (click)="cancelConfirming = true"
                    style="white-space:nowrap;font-size:11px;color:#fff;
                           background:#E96127;border:none;
                           border-radius:5px;padding:3px 10px;cursor:pointer;font-weight:500;">
              Cancel Initiative
            </button>

            <!-- 5. Un-cancel Initiative — constructive (reverses cancellation). CANCELLED stage only. -->
            <button *ngIf="cycle.current_lifecycle_stage === 'CANCELLED' && !uncancelConfirming"
                    (click)="uncancelConfirming = true"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              ↺ Un-cancel Initiative
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
            Cancel this Initiative?
          </div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);margin-bottom:6px;">
            The Initiative will be marked CANCELLED. You can un-cancel it later from this panel.
          </div>
          <div style="display:flex;gap:6px;">
            <button class="oi-btn-primary"
                    (click)="cancelCycleAction()"
                    [disabled]="cancelBusy"
                    style="font-size:11px;padding:3px 10px;background:var(--triarq-color-error);
                           display:flex;align-items:center;gap:4px;">
              <ion-spinner *ngIf="cancelBusy" name="crescent" style="width:10px;height:10px;"></ion-spinner>
              {{ cancelBusy ? 'Cancelling…' : 'Cancel Initiative' }}
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
          [nextGateId]="haloNextGateId"
          [nextGateSubmitted]="haloNextGateSubmitted"
          [nextGateUndated]="haloNextGateUndated"
          [gateSkippedAtMap]="gateSkippedAtMap"
          [boardGateId]="aiBoardGateId"
          [boardApproved]="cycle.ai_board_approved === true"
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
          Not set — should be added before Brief Review Gate. Edit via the Edit Initiative button above.
        </div>
        <!-- When set: regular body text, not italic. D-296 amends D-276. Source: D-296. -->
        <div *ngIf="cycle.outcome_statement"
             style="font-size:14px;font-family:Roboto,sans-serif;
                    color:#262626;white-space:pre-wrap;">
          {{ cycle.outcome_statement }}
        </div>
      </div>

      <!-- ── Contract 32: Current Status — D-478 §4.4 A (below Outcome per UAT) ── -->
      <div class="oi-card" style="margin-bottom:var(--triarq-space-md);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--triarq-space-sm);">
          <span style="font-weight:500;">Current Status</span>
          <!-- D-506 (Contract 36): any user with visibility may author.
               CC-38 f25: View Status History joins Update Status here. -->
          <span style="display:flex;gap:6px;">
            <button (click)="openStatusPanel()"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:1px solid var(--triarq-color-primary);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              Update Status…
            </button>
            <button (click)="openHistoryPanel()"
                    style="white-space:nowrap;font-size:11px;color:var(--triarq-color-text-secondary);
                           background:none;border:1px solid var(--triarq-color-border,#e0e0e0);
                           border-radius:5px;padding:3px 8px;cursor:pointer;">
              View Status History
            </button>
          </span>
        </div>

        <!-- D-346 Context B skeleton — loads independently of the rest of the panel. -->
        <div *ngIf="loadingStatus" style="display:flex;flex-direction:column;gap:6px;">
          <ion-skeleton-text animated style="width:45%;height:13px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="width:85%;height:13px;"></ion-skeleton-text>
        </div>

        <ng-container *ngIf="!loadingStatus">
          <div *ngIf="!latestStatus?.latest"
               style="font-size:13px;font-style:italic;color:#5A5A5A;">
            No status updates recorded.
          </div>

          <ng-container *ngIf="latestStatus?.latest as u">
            <div style="font-size:12px;color:var(--triarq-color-text-secondary);margin-bottom:8px;">
              Last updated: {{ latestStatus!.saved_by_name || 'Unknown' }} · {{ formatStatusDateTime(u.saved_at) }}
            </div>
            <!-- CC-38-30: staleness nudge — this status predates the current next gate. -->
            <div *ngIf="statusAsOfNote(u)"
                 style="font-size:11px;font-style:italic;color:var(--triarq-color-sunray,#B87700);margin-bottom:8px;">
              ⚠ {{ statusAsOfNote(u) }}
            </div>
            <div style="margin-bottom:6px;"><span style="font-weight:500;">Accomplished Last Cycle:</span>
              {{ truncate(u.accomplished_last_cycle) }}</div>
            <div style="margin-bottom:6px;"><span style="font-weight:500;">Plan for Next Cycle:</span>
              {{ truncate(u.plan_next_cycle) }}</div>
            <div style="margin-bottom:6px;"><span style="font-weight:500;">Blockers:</span>
              {{ truncate(u.blockers) }}</div>
            <div style="margin-bottom:6px;">
              <span style="font-weight:500;">Escalation Needed:</span>
              <span *ngIf="u.escalation_needed"
                    style="background:var(--triarq-color-error,#E96127);color:#fff;border-radius:999px;padding:1px 8px;font-size:11px;margin-left:4px;">Yes</span>
              <span *ngIf="!u.escalation_needed" style="color:#5A5A5A;"> No</span>
            </div>
            <div *ngIf="u.pilot_confidence_applicable" style="margin-bottom:6px;">
              <span style="font-weight:500;">Go to Deploy Confidence:</span> {{ confidenceLabel(u.pilot_confidence) }}
            </div>
            <div *ngIf="u.close_confidence_applicable" style="margin-bottom:6px;">
              <span style="font-weight:500;">Close Review Confidence:</span> {{ confidenceLabel(u.close_confidence) }}
            </div>

            <!-- D-513 (Contract 36): acknowledgment chips — non-trio-authored updates
                 only (the only case generating invitations). One chip per trio
                 member; own pending chip = one-click Acknowledge. -->
            <div *ngIf="latestStatus!.is_trio_author === false && latestStatus!.acknowledgments.length"
                 style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0;">
              <span style="font-weight:500;font-size:12px;">Acknowledgments:</span>
              <ng-container *ngFor="let a of latestStatus!.acknowledgments">
                <button *ngIf="isCurrentUser(a.user_id) && !a.acknowledged"
                        type="button"
                        [disabled]="ackingStatus"
                        (click)="acknowledgeCurrentStatus(u.id)"
                        style="background:var(--triarq-color-primary,#257099);color:#fff;border:none;border-radius:999px;
                               padding:2px 10px;font-size:11px;font-weight:600;cursor:pointer;"
                        [title]="a.display_name">
                  {{ ackingStatus ? 'Acknowledging…' : 'Acknowledge' }}
                </button>
                <span *ngIf="!isCurrentUser(a.user_id) || a.acknowledged"
                      [style.background]="a.acknowledged ? '#E8F5E9' : '#F0F0F0'"
                      [style.color]="a.acknowledged ? '#2E7D32' : '#9E9E9E'"
                      style="border-radius:999px;padding:2px 10px;font-size:11px;font-weight:600;"
                      [title]="a.acknowledged ? (a.display_name + ' — acknowledged ' + formatStatusDateTime(a.acknowledged_at!))
                              : (a.acknowledged_earlier ? (a.display_name + ' — acknowledged an earlier version') : (a.display_name + ' — not acknowledged'))">
                  {{ statusInitials(a.display_name) }}<ng-container *ngIf="a.acknowledged"> ✓</ng-container>
                </span>
                <span *ngIf="!a.acknowledged && a.acknowledged_earlier"
                      style="font-size:10px;font-style:italic;color:#757575;">acknowledged an earlier version</span>
              </ng-container>
            </div>

            <!-- CC-38-42: banded needs-review block (was pills) — grid grammar. -->
            <div *ngIf="latestStatus!.needs_review_reasons.length"
                 style="margin-top:6px;padding:6px 10px;max-width:420px;"
                 [style.border-left]="reasonBandRed(latestStatus!.needs_review_reasons) ? '3px solid #A32D2D' : '3px solid #BA7517'"
                 [style.background]="reasonBandRed(latestStatus!.needs_review_reasons) ? 'rgba(211,47,47,0.09)' : 'rgba(242,166,32,0.12)'">
              <!-- CC-38-44: no title line; bolded bullets. -->
              <div *ngFor="let r of latestStatus!.needs_review_reasons"
                   style="font-size:11.5px;margin-top:1px;font-weight:600;"
                   [style.color]="reasonIsRed(r) ? '#791F1F' : '#7A5A2A'">• {{ r }}</div>
            </div>

            <button *ngIf="statusHasLongText"
                    (click)="statusExpanded = !statusExpanded"
                    style="background:none;border:none;color:var(--triarq-color-primary,#257099);cursor:pointer;font-size:12px;padding:4px 0 0 0;">
              {{ statusExpanded ? 'Show less' : 'Show more' }}
            </button>
          </ng-container>
        </ng-container>
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

          <!-- DCS (Domain Capability Strategist) — D-389 -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Domain Capability Strategist</div>
            <span *ngIf="cycle.assigned_dcs_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:12px;">
              {{ cycle.assigned_dcs_display_name }}
            </span>
            <span *ngIf="!cycle.assigned_dcs_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Domain Capability Strategist: Unassigned
            </span>
          </div>

          <!-- EPO (Engineering Product Owner) — D-390 -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Engineering Product Owner</div>
            <span *ngIf="cycle.assigned_epo_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:12px;">
              {{ cycle.assigned_epo_display_name }}
            </span>
            <span *ngIf="!cycle.assigned_epo_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Engineering Product Owner: Unassigned
            </span>
          </div>

          <!-- DOL (Domain Outcome Lead) — D-391 -->
          <div>
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Domain Outcome Lead</div>
            <span *ngIf="cycle.assigned_dol_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:12px;">
              {{ cycle.assigned_dol_display_name }}
            </span>
            <span *ngIf="!cycle.assigned_dol_display_name"
                  style="display:inline-block;padding:3px 10px;border-radius:999px;
                         border:1px dashed #C0C0C0;color:#9E9E9E;font-style:italic;font-size:12px;">
              Domain Outcome Lead: Unassigned
            </span>
          </div>

          <!-- Contract G4 (D-563/D-564): participation section replaces the
               D-458 array pill blocks (arrays retired by migration 084). -->
          <app-initiative-participation-section
            [deliveryCycleId]="cycle.delivery_cycle_id"
            [viewerUserId]="viewerUserId"
            [canAttach]="callerCanSubmitGates"
            [allUsers]="allUsers">
          </app-initiative-participation-section>

          <!-- Contract G3 (D-562/D-567): Governance level for sized Initiatives;
               legacy tier badge retained for never-sized ones (AC #4). -->
          <div *ngIf="cycleIsSized">
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">Governance Level</div>
            <span style="display:inline-block;border-radius:999px;padding:3px 10px;
                         font-size:12px;font-weight:500;font-family:Roboto,sans-serif;
                         background:#257099;color:#fff;"
                  [title]="levelChipTooltip">
              {{ levelChipText }}
            </span>
            <div *ngIf="levelAttributionLine"
                 style="margin-top:4px;font-size:11px;font-style:italic;color:#5A5A5A;">
              {{ levelAttributionLine }}
            </div>
            <!-- Contract G8 (S-C6/D-562): baseline rose above the set level —
                 the setter (or leadership) confirms or releases. Never silent. -->
            <div *ngIf="showSetLevelDivergencePrompt"
                 style="margin-top:6px;padding:8px 10px;border-left:3px solid #F2A620;
                        background:rgba(242,166,32,0.08);font:400 12px Roboto,sans-serif;color:#1a1a1a;">
              The computed baseline (Level {{ cycle!.baseline_level }}) has risen above the set
              Level {{ cycle!.set_level }}. Confirm the set level or release it to the baseline.
              <div style="display:flex;gap:8px;margin-top:6px;">
                <button type="button" [disabled]="levelPromptBusy"
                        (click)="confirmSetLevel()"
                        style="background:#257099;border:none;border-radius:5px;padding:5px 12px;
                               font:500 12px Roboto,sans-serif;color:#fff;cursor:pointer;">
                  {{ levelPromptBusy ? 'Saving…' : 'Confirm Level ' + cycle!.set_level }}
                </button>
                <button type="button" [disabled]="levelPromptBusy"
                        (click)="releaseSetLevel()"
                        style="background:none;border:1px solid #B9C4CE;border-radius:5px;padding:5px 12px;
                               font:500 12px Roboto,sans-serif;color:#00274E;cursor:pointer;">
                  Release to baseline
                </button>
              </div>
            </div>
            <button *ngIf="callerCanSubmitGates" type="button"
                    (click)="openSizingEdit()"
                    style="margin-top:4px;background:none;border:none;padding:0;
                           font-size:11px;color:#257099;cursor:pointer;text-decoration:underline;">
              Edit sizing
            </button>
          </div>
          <!-- Tier — badge chip per Visual Layout Standards 1.7. CC-Decision-2026-04-12-A: Contract 5 restores badge. -->
          <div *ngIf="!cycleIsSized">
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

          <!-- AI Governance — CC-38 f13. Chip when the Initiative includes AI;
               AI Prod Board status inline. Hidden when No/blank/unknown. -->
          <div *ngIf="cycle.ai_functionality === 'yes'">
            <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                        color:var(--triarq-color-text-secondary);margin-bottom:4px;">AI Governance</div>
            <span style="display:inline-block;border-radius:4px;padding:3px 8px;font-size:12px;
                         font-weight:500;background:rgba(126,87,194,0.10);color:#4A2F80;"
                  [attr.title]="aiChipTooltip">
              {{ cycle.ai_delivery_form === 'analytics_outputs' ? 'AI · Analytics' : 'AI' }}
              <ng-container *ngIf="cycle.ai_audience"> · {{ cycle.ai_audience === 'external' ? 'External' : 'Internal' }}</ng-container>
            </span>
            <span *ngIf="aiBoardGateId"
                  [style.background]="cycle.ai_board_approved ? 'rgba(37,112,153,0.08)' : 'rgba(242,166,32,0.12)'"
                  [style.color]="cycle.ai_board_approved ? '#257099' : '#8a5b00'"
                  style="display:inline-block;border-radius:999px;padding:3px 10px;font-size:12px;margin-left:6px;">
              {{ cycle.ai_board_approved ? 'AI Prod Board: Approved' : 'AI Prod Board: Approval pending' }}
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
      <!-- "[N] Milestone(s) are missing actual dates for Gates this Initiative has already passed." -->
      <div *ngIf="missingActualDateGateNames.length > 0"
           style="margin-bottom:var(--triarq-space-md);
                  background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                  border-radius:0 6px 6px 0;padding:var(--triarq-space-sm) var(--triarq-space-md);">
        <div style="font-weight:500;font-size:var(--triarq-text-small);margin-bottom:4px;">
          ⚠ {{ missingActualDateGateNames.length }} Milestone{{ missingActualDateGateNames.length > 1 ? 's are' : ' is' }} missing actual dates for Gates this Initiative has already passed.
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

        <!-- CC-38-39: undated next gate — D-200 Pattern 2 amber band pointing at the fix. -->
        <div *ngIf="haloNextGateUndated"
             style="border-left:3px solid var(--triarq-color-sunray,#F2A620);
                    background:rgba(242,166,32,0.08);padding:8px 12px;
                    margin-bottom:var(--triarq-space-sm);font-size:12.5px;color:#1A1A1A;">
          ⚠ <strong style="font-weight:500;">{{ haloNextGateLabel }}</strong> is the next gate but has no
          target date — overdue tracking and the Next Gates schedule can't see it.
          Click <em>Set date</em> on that row below to fix it.
        </div>

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

          <!-- CC-38 follow-on 13: full-row click REMOVED — approval dialogs were
               firing from accidental row clicks. Modal opens only from the
               diamond + gate name (col 1), the big track diamond, or Submit. -->
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr 120px;
                      gap:var(--triarq-space-sm);padding:10px 0;
                      font-size:var(--triarq-text-small);align-items:center;">

            <!-- Col 1: Gate diamond + name + approval narrative — opens gate panel -->
            <div style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;"
                 title="Open gate record"
                 (click)="openGatePanel(m.gate_name)">
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

            <!-- Col 2: Target Date — editable. D-275; Contract 37 (D-553) rule editor:
                 mode toggle Date · Sprint · After prior gate, live "Resolves to" preview. -->
            <div (click)="$event.stopPropagation()">
              <ng-container *ngIf="editingMilestoneGate === m.gate_name; else targetDateDisplay">
                <!-- Mode toggle — Sprint/relative render only when an effective
                     calendar resolves (§4.3); relative hidden on Brief Review. -->
                <div *ngIf="sprintModesAvailable"
                     style="display:flex;gap:2px;margin-bottom:4px;flex-wrap:wrap;">
                  <button *ngFor="let mode of ['manual','sprint','relative']"
                          [hidden]="mode === 'relative' && m.gate_name === 'brief_review'"
                          (click)="setDateRuleMode($any(mode))"
                          [style.background]="dateRuleMode === mode ? 'var(--triarq-color-primary)' : 'none'"
                          [style.color]="dateRuleMode === mode ? '#fff' : '#5A5A5A'"
                          [style.border]="dateRuleMode === mode ? 'none' : '1px solid #D0D0D0'"
                          style="font-size:10px;padding:2px 7px;border-radius:999px;cursor:pointer;">
                    {{ mode === 'manual' ? 'Date' : (mode === 'sprint' ? 'Sprint' : 'After prior gate') }}
                  </button>
                </div>

                <!-- Date mode (today's behavior) -->
                <input *ngIf="dateRuleMode === 'manual'"
                       [formControl]="milestoneDateControl"
                       type="date"
                       class="oi-input"
                       style="width:100%;font-size:12px;padding:3px 6px;" />

                <!-- Sprint mode: sprint dropdown + Start/End + ±days (§7.1) -->
                <ng-container *ngIf="dateRuleMode === 'sprint'">
                  <select [(ngModel)]="ruleSprintId" class="oi-input"
                          style="width:100%;font-size:12px;padding:3px 6px;margin-bottom:3px;">
                    <option value="">Select sprint…</option>
                    <option *ngFor="let s of effectiveSprints" [value]="s.sprint_id">{{ sprintOptionLabel(s) }}</option>
                  </select>
                  <div style="display:flex;gap:3px;align-items:center;">
                    <select [(ngModel)]="ruleAnchor" class="oi-input" style="font-size:12px;padding:3px 6px;flex:1;">
                      <option value="start">Start</option>
                      <option value="end">End</option>
                    </select>
                    <input type="number" [(ngModel)]="ruleDayOffset" class="oi-input" placeholder="0"
                           title="+ days (negative allowed)"
                           style="width:56px;font-size:12px;padding:3px 6px;" />
                    <span style="font-size:10px;color:#757575;">days</span>
                  </div>
                </ng-container>

                <!-- Relative mode: X sprints + Z days after the prior gate's target (§7.1) -->
                <ng-container *ngIf="dateRuleMode === 'relative'">
                  <div style="font-size:10px;color:#757575;margin-bottom:2px;">
                    After {{ priorGateLabelFor(m.gate_name) }} target:
                  </div>
                  <div style="display:flex;gap:3px;align-items:center;">
                    <input type="number" min="0" [(ngModel)]="ruleSprintCount" class="oi-input" placeholder="0"
                           title="+ sprints" style="width:48px;font-size:12px;padding:3px 6px;" />
                    <span style="font-size:10px;color:#757575;">sprints</span>
                    <input type="number" [(ngModel)]="ruleDayOffset" class="oi-input" placeholder="0"
                           title="+ days (negative allowed)" style="width:48px;font-size:12px;padding:3px 6px;" />
                    <span style="font-size:10px;color:#757575;">days</span>
                  </div>
                </ng-container>

                <!-- Live "Resolves to" preview (§7.1). Server recomputes at save — its result is canonical (D-551). -->
                <div *ngIf="dateRuleMode !== 'manual'" style="font-size:11px;margin-top:3px;">
                  <ng-container *ngIf="rulePreview(m.gate_name).date as previewDate">
                    <span style="color:#1a1a1a;">Resolves to <strong>{{ formatTargetDate(previewDate) }}</strong></span>
                  </ng-container>
                  <span *ngIf="rulePreview(m.gate_name).error" style="color:#757575;font-style:italic;">
                    {{ rulePreview(m.gate_name).error }}
                  </span>
                </div>

                <div style="display:flex;gap:4px;margin-top:4px;">
                  <!-- D-501 (AC 5): Save enables on any difference incl. set→blank (clear). -->
                  <button (click)="saveMilestoneDate(m.gate_name)"
                          [disabled]="ruleSaveDisabled(m)"
                          style="font-size:11px;padding:2px 8px;background:var(--triarq-color-primary);
                                 color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    {{ savingMilestone ? 'Saving…' : (confirmRuleRemovalGate === m.gate_name ? 'Confirm' : 'Save') }}
                  </button>
                  <button (click)="cancelMilestoneEdit()"
                          style="font-size:11px;padding:2px 8px;background:none;
                                 border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                    Cancel
                  </button>
                </div>
                <!-- §6.4: direct date edit on a ruled gate removes its rule — inline confirm. -->
                <div *ngIf="confirmRuleRemovalGate === m.gate_name"
                     style="font-size:11px;color:var(--triarq-color-sunray,#F2A620);margin-top:2px;">
                  This gate follows a rule ({{ ruleChip(m) }}). Saving a date directly removes the rule. Press Confirm to proceed.
                </div>
                <div *ngIf="milestoneError" style="font-size:11px;color:var(--triarq-color-error);margin-top:2px;">{{ milestoneError }}</div>
              </ng-container>
              <ng-template #targetDateDisplay>
                <!-- D-300 / B-15 fix: date text neutral black — status dot and label carry color, not date text. -->
                <!-- D-553 §7.2: resolved date primary (D-520 format), muted rule chip beneath. -->
                <span *ngIf="m.target_date"
                      (click)="startMilestoneEdit(m)"
                      style="cursor:pointer;text-decoration:underline dotted;color:#1a1a1a;"
                      [title]="'Click to edit target date (' + m.target_date + ')'">
                  {{ formatTargetDate(m.target_date) }}
                </span>
                <span *ngIf="!m.target_date"
                      (click)="startMilestoneEdit(m)"
                      [style.color]="setDateEmphasis(m) ? '#B87700' : '#9E9E9E'"
                      [style.font-weight]="setDateEmphasis(m) ? '500' : null"
                      [style.border-bottom]="setDateEmphasis(m) ? '1px dashed #B87700' : '1px dashed #C0C0C0'"
                      style="font-style:italic;cursor:pointer;"
                      title="Click to set target date">
                  Set date
                </span>
                <!-- Rule chip: muted; warning treatment + suffix when stale (§6.5/§7.2). -->
                <div *ngIf="ruleChip(m)"
                     [style.color]="m.rule_stale ? 'var(--triarq-color-sunray,#F2A620)' : '#757575'"
                     style="font-size:10px;margin-top:2px;">
                  <span *ngIf="m.rule_stale">⚠ </span>{{ ruleChip(m) }}<span *ngIf="m.rule_stale"> — not in current calendar</span>
                </div>
                <!-- D-503: non-blocking retained-status note after a clear. -->
                <div *ngIf="milestoneNote && milestoneNoteGate === m.gate_name"
                     style="font-size:10px;font-style:italic;color:#757575;margin-top:2px;">
                  {{ milestoneNote }}
                </div>
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
                  <!-- D-501 (AC 5) disabled-when-unchanged. D-503/D-183: first Save on a
                       Complete-gate clear arms the inline confirm below. -->
                  <button (click)="saveActualDate(m.gate_name)"
                          [disabled]="savingActualDate || actualDateUnchanged(m.gate_name)"
                          style="font-size:11px;padding:2px 8px;background:var(--triarq-color-primary);
                                 color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    {{ savingActualDate ? 'Saving…' : (confirmClearCompleteGate === m.gate_name ? 'Confirm Clear' : 'Save') }}
                  </button>
                  <button (click)="cancelActualDateEdit()"
                          style="font-size:11px;padding:2px 8px;background:none;
                                 border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                    Cancel
                  </button>
                </div>
                <div *ngIf="confirmClearCompleteGate === m.gate_name"
                     style="font-size:11px;color:var(--triarq-color-sunray,#F2A620);margin-top:2px;">
                  This gate is marked Complete. Clear the actual date anyway? Press Confirm Clear to proceed — status stays Complete.
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
                          [disabled]="savingMilestoneStatus || revertConfirmGate === m.gate_name"
                          style="font-size:11px;padding:2px 8px;background:var(--triarq-color-primary);
                                 color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    {{ savingMilestoneStatus ? 'Saving…' : 'Save' }}
                  </button>
                  <button (click)="cancelMilestoneStatusEdit()"
                          [disabled]="savingMilestoneStatus"
                          style="font-size:11px;padding:2px 8px;background:none;
                                 border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                    Cancel
                  </button>
                </div>
                <!-- D-451: inline revert confirmation. Triggered when the
                     dropdown changes on a milestone with actual_date set. -->
                <div *ngIf="revertConfirmGate === m.gate_name"
                     style="margin-top:6px;padding:8px 10px;border-left:3px solid var(--triarq-color-sunray, #f5a623);
                            background:rgba(245,166,35,0.08);border-radius:0 5px 5px 0;font-size:11px;">
                  <div style="margin-bottom:6px;color:var(--triarq-color-text-primary);">
                    You are reverting a completed gate. This will be logged.
                  </div>
                  <div style="display:flex;gap:4px;">
                    <button (click)="confirmRevertContinue(m.gate_name)"
                            [disabled]="savingMilestoneStatus"
                            style="font-size:11px;padding:2px 10px;background:var(--triarq-color-primary);
                                   color:#fff;border:none;border-radius:4px;cursor:pointer;">
                      {{ savingMilestoneStatus ? 'Saving…' : 'Continue' }}
                    </button>
                    <button (click)="cancelRevertConfirm()"
                            [disabled]="savingMilestoneStatus"
                            style="font-size:11px;padding:2px 10px;background:none;
                                   border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                      Cancel
                    </button>
                  </div>
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
                  <!-- CC-38-31 ⚠ principle: date passed but status disagrees — flag, never recolor. -->
                  <span *ngIf="gateStatusDateConflict(m)"
                        style="font-size:11px;color:var(--triarq-color-sunray,#f5a623);"
                        title="Target date has passed, but the status is set by the team (D-205). Consider updating the status or the date.">⚠</span>
                </div>
              </ng-template>
            </div>

            <!-- Contract 37 §6.3 (D-552/D-183/S-023): cascade pre-flight confirmation.
                 Inline, full-span; lists every downstream shift old → new. Cancel
                 aborts the whole save — the server wrote nothing on the pre-flight. -->
            <div *ngIf="cascadeConfirmGate === m.gate_name && cascadeShifts.length > 0"
                 (click)="$event.stopPropagation()"
                 style="grid-column:1 / -1;margin:4px 0 6px 22px;padding:8px 10px;
                        border-left:3px solid var(--triarq-color-sunray,#f5a623);
                        background:rgba(245,166,35,0.08);border-radius:0 5px 5px 0;
                        font-size:11px;cursor:default;">
              <div style="margin-bottom:6px;color:var(--triarq-color-text-primary);">
                Also moves:
                <span *ngFor="let s of cascadeShifts; let last = last">
                  {{ s.gate_label }} {{ formatTargetDate(s.old_target_date) || 'not set' }} → {{ formatTargetDate(s.new_target_date) }}<span *ngIf="!last">, </span>
                </span>
              </div>
              <div style="display:flex;gap:4px;">
                <button (click)="confirmCascadeSave(m.gate_name)"
                        [disabled]="savingMilestone"
                        style="font-size:11px;padding:2px 10px;background:var(--triarq-color-primary);
                               color:#fff;border:none;border-radius:4px;cursor:pointer;">
                  {{ savingMilestone ? 'Saving…' : 'Confirm — move these dates' }}
                </button>
                <button (click)="cancelCascadeConfirm()"
                        [disabled]="savingMilestone"
                        style="font-size:11px;padding:2px 10px;background:none;
                               border:1px solid #D0D0D0;border-radius:4px;cursor:pointer;color:#5A5A5A;">
                  Cancel
                </button>
              </div>
            </div>

            <!-- D-527: date-semantics coaching — always visible while either date
                 editor is open on this gate. Last grid child + full span so it
                 renders as its own row under the four columns (D-514 style). -->
            <div *ngIf="editingMilestoneGate === m.gate_name || editingActualDateGate === m.gate_name"
                 (click)="$event.stopPropagation()"
                 style="grid-column:1 / -1;font-size:11px;font-style:italic;color:#757575;
                        padding:2px 0 4px 22px;line-height:1.5;cursor:default;">
              <!-- §7.1 caption: sprint real dates + rule restated, then the D-530 line
                   (the rule editor coexists with it — never removed or duplicated). -->
              <span *ngIf="editingMilestoneGate === m.gate_name && ruleEditorCaption(m.gate_name)">
                {{ ruleEditorCaption(m.gate_name) }} ·
              </span>
              {{ GATE_DATE_SEMANTICS }}
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
          <span style="font-weight:500;">Documents/Artifacts</span>
        </div>
        <!-- CC-Decision-2026-04-12-D: Zone explanatory text 11px italic #5A5A5A. Source: Contract 5 Block 2.5.
             D-438 Amendment 1: "lifecycle stage" → "primary gate". -->
        <p style="margin:0 0 var(--triarq-space-sm) 0;font-size:11px;font-style:italic;color:#5A5A5A;">
          Artifacts are grouped by the primary gate they support. Attach an external URL
          to fill a slot, or use "+ Attach Document" inside a group to add an ad-hoc reference.
          Use "→ OI Library" to record the artifact in the OI Library (full submission completes in Build B).
        </p>

        <!-- Promote stub message — inline, not alert -->
        <div *ngIf="promoteStubMessage"
             style="background:#e3f2fd;border-left:4px solid var(--triarq-color-primary);
                    border-radius:0 6px 6px 0;padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    font-size:var(--triarq-text-small);margin-bottom:var(--triarq-space-sm);">
          {{ promoteStubMessage }}
        </div>

        <!-- Gate groups — collapsible (Principle 5).
             D-438 Amendment 1 (Contract 25 Part 2): grouped by primary_gate
             instead of lifecycle_stage. "Unscheduled" group (null-gate) renders
             last when populated. trackBy keeps DOM stable across cycle refresh
             so attach-form inputs don't lose focus (Phil 2026-06-15). -->
        <div *ngFor="let group of artifactsByGate; trackBy: trackByGate"
             style="margin-bottom:var(--triarq-space-xs);">

          <!-- Gate section header — ▼/▶ toggle + name + "N of M attached" count.
               D-418: no future-gate gating — every group renders the same. -->
          <button (click)="toggleGateExpand(group.key)"
                  style="width:100%;background:none;border:none;cursor:pointer;
                         display:flex;align-items:center;justify-content:space-between;
                         padding:var(--triarq-space-xs) var(--triarq-space-xs);
                         border-radius:5px;margin-bottom:2px;
                         background:var(--triarq-color-background-subtle);">
            <span style="display:flex;align-items:center;gap:var(--triarq-space-xs);">
              <span style="font-size:11px;color:var(--triarq-color-text-secondary);
                           transition:transform 0.15s;"
                    [style.transform]="isGateExpanded(group.key) ? 'rotate(0)' : 'rotate(-90deg)'">
                ▼
              </span>
              <span style="font-weight:500;font-size:var(--triarq-text-small);
                           color:var(--triarq-color-primary);">
                {{ group.gate_display_name }}
              </span>
            </span>
            <span style="font-size:10px;color:var(--triarq-color-text-secondary);">
              {{ attachedCountInGroup(group.slots) }} of {{ group.slots.length }} attached
            </span>
          </button>

          <!-- Expanded body -->
          <div *ngIf="isGateExpanded(group.key)">

            <!-- Slot rows — trackBy by artifact_type_id for stable DOM. -->
            <div *ngFor="let slot of group.slots; trackBy: trackBySlot"
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

                  <!-- Empty slot placeholder — Phil 2026-06-15: every slot active. -->
                  <div *ngIf="!slot.external_url && !slot.oi_library_artifact_id"
                       style="margin-top:4px;font-size:10px;color:var(--triarq-color-text-secondary);
                              font-style:italic;">
                    Not yet attached
                  </div>
                </div>

                <!-- Action column: Attach / Replace + → OI Library.
                     Phil 2026-06-15: every slot has functional action regardless of stage. -->
                <div style="display:flex;flex-direction:column;align-items:flex-end;
                            gap:4px;flex-shrink:0;">
                  <button *ngIf="!slot.external_url && !slot.is_adhoc"
                          (click)="openAttachForm(slot.artifact_type_id ?? '')"
                          style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                                 background:none;border:none;cursor:pointer;padding:0;">
                    Attach
                  </button>
                  <button *ngIf="slot.external_url && !slot.is_adhoc"
                          (click)="openAttachForm(slot.artifact_type_id ?? '')"
                          style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                                 background:none;border:none;cursor:pointer;padding:0;">
                    Replace
                  </button>
                  <button *ngIf="slot.external_url && slot.pointer_status === 'external_only' && !slot.is_adhoc"
                          (click)="promoteArtifact(slot)"
                          style="font-size:10px;color:var(--triarq-color-text-secondary);
                                 background:none;border:none;cursor:pointer;padding:0;"
                          title="Record in OI Library (submission completes in Build B)">
                    → OI Library
                  </button>
                  <!-- Contract 25 Part 2 follow-on: Edit + Remove on filled rows (slot + ad-hoc). -->
                  <button *ngIf="slot.cycle_artifact_id && slot.external_url"
                          (click)="openEditArtifact(slot)"
                          style="font-size:10px;color:var(--triarq-color-text-secondary);
                                 background:none;border:none;cursor:pointer;padding:0;">
                    Edit
                  </button>
                  <button *ngIf="slot.cycle_artifact_id && slot.external_url"
                          (click)="requestRemoveArtifact(slot)"
                          [disabled]="removingId === slot.cycle_artifact_id"
                          [style.color]="removeConfirmingId === slot.cycle_artifact_id ? 'var(--triarq-color-error)' : 'var(--triarq-color-text-secondary)'"
                          style="font-size:10px;background:none;border:none;cursor:pointer;padding:0;">
                    {{ removingId === slot.cycle_artifact_id
                       ? 'Removing…'
                       : (removeConfirmingId === slot.cycle_artifact_id ? 'Click again to confirm' : 'Remove') }}
                  </button>
                  <!-- Ad-hoc row marker: visual hint that this isn't a seeded slot.
                       Contract 25 Part 2 follow-on. -->
                  <span *ngIf="slot.is_adhoc"
                        style="font-size:10px;color:var(--triarq-color-text-secondary);
                               font-style:italic;">
                    Ad-hoc
                  </span>
                </div>
              </div>

              <!-- Remove error inline (rare). -->
              <div *ngIf="removeError && removingId === null && removeConfirmingId === slot.cycle_artifact_id"
                   style="color:var(--triarq-color-error);font-size:10px;margin-top:4px;">
                {{ removeError }}
              </div>

              <!-- Inline edit form — Contract 25 Part 2 follow-on. -->
              <div *ngIf="editingArtifactId === slot.cycle_artifact_id"
                   style="margin-top:var(--triarq-space-xs);
                          background:var(--triarq-color-background-subtle);
                          border-radius:5px;padding:var(--triarq-space-xs);
                          position:relative;">
                <app-loading-overlay [visible]="savingEdit" message="Saving…"></app-loading-overlay>
                <form [formGroup]="attachForm" (ngSubmit)="submitEditArtifact()">
                  <div style="display:grid;gap:var(--triarq-space-xs);
                              grid-template-columns:2fr 3fr auto;align-items:end;">
                    <div>
                      <label style="display:block;font-size:10px;margin-bottom:2px;">
                        Artifact Title <span style="color:var(--triarq-color-error);">*</span>
                      </label>
                      <input formControlName="display_name" class="oi-input"
                             style="font-size:var(--triarq-text-small);" />
                    </div>
                    <div>
                      <label style="display:block;font-size:10px;margin-bottom:2px;">
                        External URL <span style="color:var(--triarq-color-error);">*</span>
                      </label>
                      <input formControlName="external_url" class="oi-input" type="url"
                             style="font-size:var(--triarq-text-small);" />
                    </div>
                    <div style="display:flex;gap:4px;">
                      <button type="submit" class="oi-btn-primary"
                              [disabled]="attachForm.invalid || savingEdit"
                              style="font-size:var(--triarq-text-small);white-space:nowrap;
                                     display:flex;align-items:center;gap:6px;">
                        <ion-spinner *ngIf="savingEdit" name="crescent" style="width:14px;height:14px;"></ion-spinner>
                        <span>{{ savingEdit ? '…' : 'Save' }}</span>
                      </button>
                      <button type="button" (click)="cancelEditArtifact()"
                              style="background:none;border:none;cursor:pointer;
                                     font-size:var(--triarq-text-small);
                                     color:var(--triarq-color-text-secondary);">✕</button>
                    </div>
                  </div>
                  <div *ngIf="editingError"
                       style="color:var(--triarq-color-error);font-size:10px;margin-top:4px;">
                    {{ editingError }}
                  </div>
                </form>
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

            <!-- Ad hoc attach link at bottom of each expanded gate group.
                 D-418: every group's ad-hoc attach is fully active regardless of cycle stage. -->
            <div style="padding:var(--triarq-space-xs) var(--triarq-space-xs);">
              <!-- Ad hoc form open for this gate group -->
              <div *ngIf="showAttachForm && attachingForTypeId === '__adhoc__' + group.key"
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
              <button *ngIf="!(showAttachForm && attachingForTypeId === '__adhoc__' + group.key)"
                      (click)="openAttachForm('__adhoc__' + group.key)"
                      style="font-size:10px;color:var(--triarq-color-primary);
                             background:none;border:none;cursor:pointer;padding:0;">
                + Attach Document
              </button>
            </div>

          </div><!-- end expanded body -->

        </div><!-- end gate group loop -->

        <!-- Empty state — D-418: removed "slots become available as the cycle advances"
             text; that gating no longer applies. Attach is available at any gate. -->
        <div *ngIf="artifactsByGate.length === 0"
             style="font-size:14px;font-style:italic;font-family:Roboto,sans-serif;
                    color:#9E9E9E;padding:16px;">
          No artifacts attached yet.
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

        <!-- State 1: No Jira link yet — show + Link button and inline form.
             Contract 24 AC-23: prominent "Not linked" label per spec. -->
        <div *ngIf="!jiraLink">
          <div style="font-size:var(--triarq-text-small);color:#5A5A5A;
                      margin-bottom:var(--triarq-space-xs);">
            Status: <strong style="color:#1E1E1E;">Not linked</strong>
          </div>
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
          <div *ngIf="!showJiraLinkForm" style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
            <span>Epic: <strong>{{ jiraLink.jira_epic_key }}</strong></span>
            <button (click)="openJiraEditForm()"
                    style="font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;">
              Edit
            </button>
          </div>
          <div style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                      border-radius:0 6px 6px 0;
                      padding:var(--triarq-space-xs) var(--triarq-space-sm);
                      margin-top:var(--triarq-space-xs);">
            <div style="font-weight:500;margin-bottom:2px;">Jira sync unavailable — API not yet configured</div>
            <div style="color:var(--triarq-color-text-secondary);">{{ syncStubMessage }}</div>
          </div>
        </div>

        <!-- State 3: Link present + configured -->
        <div *ngIf="jiraLink && !syncStubMessage">
          <div *ngIf="!showJiraLinkForm" style="font-size:var(--triarq-text-small);">
            Epic: <strong>{{ jiraLink.jira_epic_key }}</strong>
            <button (click)="openJiraEditForm()"
                    style="margin-left:var(--triarq-space-sm);font-size:11px;color:var(--triarq-color-primary);
                           background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;">
              Edit
            </button>
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

        <!-- Edit form — reused for both State 2 and State 3 when showJiraLinkForm is true. -->
        <div *ngIf="jiraLink && showJiraLinkForm"
             style="display:flex;align-items:center;gap:var(--triarq-space-sm);
                    flex-wrap:wrap;margin-top:var(--triarq-space-xs);">
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
            <span>Save</span>
          </button>
          <button (click)="cancelJiraEditForm()"
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

        <!-- Easter Egg Hunt spot — foot of the Event Log -->
        <div style="text-align:center; padding:14px 0 4px;">
          <app-egg-spot [placementKey]="EGG_KEYS.EVENT_LOG_FOOTER"></app-egg-spot>
        </div>
      </div>

    </div>
  `
})
export class DeliveryCycleDetailComponent implements OnInit, OnChanges {
  readonly EGG_KEYS = EGG_KEYS;

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

  /** Contract 30: ?returnTo= origin (My Actions tab / Home card). Route mode only. */
  returnTo: string | null = null;

  /** Navigate back to the originating surface when arrived via a returnTo deep link. */
  goBack(): void {
    if (this.returnTo) { this.router.navigateByUrl(this.returnTo); }
  }

  cycle:         DeliveryCycle | null    = null;
  events:        CycleEventLogEntry[]    = [];
  loading        = false;
  loadingEvents  = false;
  loadError      = '';

  // Edit Cycle panel — S-006 push/pop. Contract 2 2026-04-10.
  showEditPanel  = false;

  // Contract 32 (WS2): Initiative Status surfaces.
  showStatusPanel  = false;
  showHistoryPanel = false;
  latestStatus: LatestInitiativeStatus | null = null;
  loadingStatus    = false;
  statusExpanded   = false;
  private readonly STATUS_TRUNC = 200;

  // B-97 (Contract 16): tracked synchronously around dialog.open / afterClosed
  // to guard onEscKey against firing close.emit while the Gate Record Modal is
  // open. Replaces unreliable dialog.openDialogs.length check.
  gateModalOpen = false;

  // Outcome
  editingOutcome = false;
  savingOutcome  = false;
  outcomeError   = '';
  outcomeControl = new FormControl('', Validators.required);

  // Milestone dates
  editingMilestoneGate: GateName | null = null;
  savingMilestone       = false;
  milestoneError        = '';
  // D-503: non-blocking retained-status note after a target-date clear.
  milestoneNote         = '';
  milestoneNoteGate: GateName | null = null;
  // D-503/D-183: two-step inline confirm for clearing the actual date on a Complete gate.
  confirmClearCompleteGate: GateName | null = null;
  milestoneDateControl  = new FormControl('');

  // Contract 37 (D-551/D-552/D-553): gate date rule editor state.
  // Loaded once per cycle — calendar null means sprint/relative modes hidden.
  effectiveSprintCalendar: EffectiveSprintCalendar | null = null;
  dateRuleMode: GateDateRuleType = 'manual';
  ruleSprintId    = '';
  ruleAnchor: SprintAnchor = 'end';
  ruleSprintCount = 0;
  ruleDayOffset   = 0;
  // §6.4: inline confirm — direct Date save on a ruled gate removes the rule.
  confirmRuleRemovalGate: GateName | null = null;
  // §6.3: cascade pre-flight confirmation state (server returned shifts).
  cascadeConfirmGate: GateName | null = null;
  cascadeShifts: GateDateShift[] = [];
  private pendingRuleSave: {
    date_rule_type: GateDateRuleType;
    target_date?: string | null;
    rule_sprint_id?: string;
    rule_anchor?: SprintAnchor;
    rule_sprint_count?: number;
    rule_day_offset?: number;
  } | null = null;

  // Artifacts
  showAttachForm    = false;
  attaching         = false;
  attachError       = '';
  attachingForTypeId   = '';
  promoteStubMessage = '';
  attachForm!:      FormGroup;

  // Contract 25 Part 2 follow-on: edit + remove on filled artifact rows.
  // Reuses attachForm (same field set: display_name + external_url).
  editingArtifactId: string | null = null;
  editingError      = '';
  savingEdit        = false;
  // Two-step remove confirmation. First click sets removeConfirmingId; second
  // click within the timeout fires detach. Timeout clears confirm state.
  removeConfirmingId: string | null = null;
  removingId:         string | null = null;
  removeError       = '';
  private removeConfirmTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

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

  // Role assignments rendered in Identity zone — editing happens via the Edit panel
  // (delivery-cycle-edit-panel.component.ts), so no inline edit state lives here.
  allUsers:   User[] = [];

  // Item 1: Milestone status edit — status dropdown per row
  editingMilestoneStatus:  GateName | null = null;
  milestoneStatusValue:    string          = '';
  savingMilestoneStatus    = false;
  milestoneStatusError     = '';
  // Contract 28 / D-451 — inline confirmation panel shown when the user
  // changes the status dropdown on a milestone with actual_date set. Tracks
  // the gate awaiting confirmation; null when no revert is pending.
  revertConfirmGate:       GateName | null = null;
  // Captured previous status — used to restore the dropdown on Cancel.
  revertPriorStatus:       DateStatus | null = null;
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

  // Zone 6: Artifact gate expand/collapse — Principle 5
  // D-438 Amendment 1 (Contract 25 Part 2): gate-keyed (was stage-keyed).
  // Populated on cycle load: current + past gates expanded; future + Unscheduled collapsed.
  // Keys are gate name values (brief_review/.../close_review) plus 'unscheduled' for null-gate group.
  expandedGates = new Set<string>();

  // Expose constants to template
  readonly GATE_LABELS         = GATE_LABELS;
  readonly STAGE_LABEL_MAP     = STAGE_LABEL_MAP;
  readonly GATE_DATE_SEMANTICS = GATE_DATE_SEMANTICS;

  constructor(
    private readonly route:          ActivatedRoute,
    private readonly router:         Router,
    private readonly delivery:       DeliveryService,
    private readonly mcp:            McpService,
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
    // Contract 29: in route mode (deep link from the Action Queue), read ?gate=
    // to auto-expand the relevant gate after load — reuses the D-345 §8 mechanism.
    if (!this.cycleId && !this.autoExpandGate) {
      const gateParam = this.route.snapshot.queryParamMap.get('gate');
      if (gateParam) { this.autoExpandGate = gateParam as GateName; }
    }
    // Contract 30 follow-up: ?returnTo= lets the routed detail offer a "Back" link
    // to the originating surface (My Actions tab / Home card) instead of a dead end.
    if (!this.cycleId) {
      this.returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    }
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
  // B-97 (Contract 16): the Contract 15 guard `dialog.openDialogs.length > 0` is
  // unreliable — CDK-internal array mutation races document keydown listeners
  // depending on overlay registration order. Replaced with a self-tracked flag
  // set synchronously in openGatePanel before dialog.open() and cleared in
  // afterClosed (after exit animation, after all keydown handlers complete).
  @HostListener('document:keydown.escape')
  onEscKey(): void {
    if (!this.panelMode) { return; }
    if (this.gateModalOpen) { return; }
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
          this.rebuildArtifactsByGate();   // stable reference for *ngFor (B-69 / focus-loss fix)
          this.initExpandedGates(); // Zone 6: expand current + past gates by default
          this.loadEvents(cycleId);
          this.loadLatestStatus(cycleId); // Contract 32 (WS2): Current Status section
          this.loadEffectiveSprintCalendar(res.data.division_id); // Contract 37 (D-550)
          this.loadDivisionRequirements(res.data.division_id);    // CC-38 f13: DOL/Jira gate exemptions
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

  // CC-38 follow-on 13: per-Division gate exemptions (dol_required D-424,
  // jira_epic_required migration 074) feed gateHardStops(). null = unknown
  // (treat as required — the server is authoritative either way).
  divisionDolRequired:  boolean | null = null;
  divisionJiraRequired: boolean | null = null;

  private loadDivisionRequirements(divisionId: string | null): void {
    this.divisionDolRequired  = null;
    this.divisionJiraRequired = null;
    if (!divisionId) { return; }
    this.mcp.call<Division[]>('division', 'list_divisions', {}).subscribe({
      next: (res) => {
        const div = (res.data ?? []).find(d => d.id === divisionId);
        if (div) {
          this.divisionDolRequired  = div.dol_required !== false;
          this.divisionJiraRequired = div.jira_epic_required !== false;
          this.cdr.markForCheck();
        }
      },
      error: () => { /* exemptions unknown — hard stops default to required; server enforces */ }
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

  // ── Contract 32 (WS2): Initiative Status ─────────────────────────────────

  private loadLatestStatus(cycleId: string): void {
    this.loadingStatus = true;
    this.statusExpanded = false;
    this.cdr.markForCheck();
    this.delivery.getLatestInitiativeStatus(cycleId).subscribe({
      next: (res) => {
        this.latestStatus = (res.success && res.data) ? res.data : null;
        this.loadingStatus = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingStatus = false; this.cdr.markForCheck(); }
    });
  }

  // ── D-513 (Contract 36): Current Status acknowledgment chips ──────────────
  ackingStatus = false;

  isCurrentUser(userId: string): boolean {
    return this.profileService.getCurrentProfile()?.id === userId;
  }

  statusInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  }

  acknowledgeCurrentStatus(statusUpdateId: string): void {
    if (this.ackingStatus || !this.cycle) { return; }
    this.ackingStatus = true;
    this.cdr.markForCheck();
    this.delivery.acknowledgeStatusUpdate(statusUpdateId).subscribe({
      next: () => {
        this.ackingStatus = false;
        this.loadLatestStatus(this.cycle!.delivery_cycle_id);   // chips from server truth
      },
      error: () => { this.ackingStatus = false; this.cdr.markForCheck(); }
    });
  }

  /** True when the logged-in user is DOL/DCS/EPO on this Initiative (D-478). */
  get callerIsTrioMember(): boolean {
    const me = this.profileService.getCurrentProfile()?.id;
    const c = this.cycle;
    if (!me || !c) { return false; }
    return [c.assigned_dol_user_id, c.assigned_dcs_user_id, c.assigned_epo_user_id].includes(me);
  }

  /** D-479 applicability for the edit panel's confidence fields. */
  private confidenceApplicability(): { pilot: boolean; close: boolean } {
    const c = this.cycle;
    if (!c) { return { pilot: false, close: false }; }
    const ORDER = ['BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE'];
    const idx = ORDER.indexOf(c.current_lifecycle_stage as string);
    const reached = idx >= 0 && idx >= ORDER.indexOf('PILOT');
    const md = c.milestone_dates || [];
    const gd = md.find(m => m.gate_name === 'go_to_deploy')?.date_status;
    const cr = md.find(m => m.gate_name === 'close_review')?.date_status;
    const bothComplete = gd === 'complete' && cr === 'complete';
    return { pilot: !bothComplete && !reached, close: !bothComplete && reached };
  }
  get pilotConfidenceApplicable(): boolean { return this.confidenceApplicability().pilot; }
  get closeConfidenceApplicable(): boolean { return this.confidenceApplicability().close; }

  openStatusPanel(): void { this.showStatusPanel = true; this.cdr.markForCheck(); }
  onStatusSaved(): void {
    this.showStatusPanel = false;
    if (this.cycle) { this.loadCycle(this.cycle.delivery_cycle_id); } // S-008 refresh
  }
  onStatusCancelled(): void { this.showStatusPanel = false; this.cdr.markForCheck(); }
  openHistoryPanel(): void { this.showHistoryPanel = true; this.cdr.markForCheck(); }

  get statusHasLongText(): boolean {
    const u = this.latestStatus?.latest;
    if (!u) { return false; }
    return [u.accomplished_last_cycle, u.plan_next_cycle, u.blockers]
      .some(t => (t?.length ?? 0) > this.STATUS_TRUNC);
  }

  truncate(text: string | null): string {
    if (!text) { return '—'; }
    if (this.statusExpanded || text.length <= this.STATUS_TRUNC) { return text; }
    return text.slice(0, this.STATUS_TRUNC) + '…';
  }

  confidenceLabel(v: string | null): string {
    const map: Record<string, string> = {
      not_started: 'Not Started', on_track: 'On Track', at_risk: 'At Risk',
      behind: 'Behind', complete: 'Complete'
    };
    return v ? (map[v] || v) : 'N/A';
  }

  formatStatusDateTime(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  }

  // ── Computed properties ────────────────────────────────────────────────────

  /** CC-38-28: shared resolver — panel track now matches the grid track
   *  exactly (user D-205 status fills; approved blue; purple on the halo). */
  get gateStateMap(): GateStateMap {
    return buildUnifiedGateStateMap(this.cycle?.gate_records, this.cycle?.milestone_dates);
  }

  /** CC-38-32 halo marker inputs. */
  get haloNextGateId(): GateName | null { return nextGateInOrder(this.cycle?.gate_records); }

  /** CC-38 f13: AI chip tooltip — where the AI Production Board stop lands. */
  get aiChipTooltip(): string {
    const g = this.aiBoardGateId;
    if (!g) {
      return 'Delivered analytics outputs (Track 2) — no AI Production Board stop; AI Delivery Requirements Record expected before Go to Deploy.';
    }
    const label = g === 'go_to_deploy' ? 'Go to Deploy' : 'Go to Release';
    return this.cycle?.ai_board_approved
      ? `AI Production Board approval received (applies at ${label}).`
      : `AI Production Board approval required before ${label}.`;
  }

  /** CC-38 f13: gate carrying the AI Production Board half-diamond marker.
   *  embedded+external → go_to_deploy; internal AI (either form) →
   *  go_to_release; analytics+external (Track 2) and non-AI → none. */
  get aiBoardGateId(): GateName | null { return aiBoardGateFor(this.cycle); }
  get haloNextGateSubmitted(): boolean  { return nextGateIsSubmitted(this.cycle?.gate_records); }
  get haloNextGateUndated(): boolean    { return nextGateUndated(this.cycle?.gate_records, this.cycle?.milestone_dates); }
  /** CC-38-42: banded warnings — red reasons dominate; slips/at-risk amber. */
  private static readonly RED_REASONS = ['Escalation', 'Status Update Overdue', 'Missing Target Date', 'Missing Deploy Date', 'Gate Overdue'];
  reasonIsRed(reason: string): boolean {
    return DeliveryCycleDetailComponent.RED_REASONS.some(p => reason.startsWith(p));
  }
  reasonBandRed(reasons: string[]): boolean { return reasons.some(r => this.reasonIsRed(r)); }

  /** CC-38-39: amber emphasis on the undated NEXT gate's Set date cell. */
  setDateEmphasis(m: { gate_name: GateName }): boolean {
    return this.haloNextGateUndated && nextGateInOrder(this.cycle?.gate_records) === m.gate_name;
  }

  get haloNextGateLabel(): string {
    const g = nextGateInOrder(this.cycle?.gate_records);
    return g ? (LIFECYCLE_TRACK.find(n => n.id === g)?.label ?? g) : '';
  }

  /** D-447 tooltip data — ISO timestamp per skipped gate, read from the event
   *  log. Surfaced to StageTrackComponent via [gateSkippedAtMap] so the
   *  "Skipped — [MMM D, YYYY]" tooltip can render. Reads this.events, the
   *  cycle event log loaded alongside the cycle by loadCycle(). */
  get gateSkippedAtMap(): Partial<Record<GateName, string | null>> {
    const out: Partial<Record<GateName, string | null>> = {};
    if (!Array.isArray(this.events) || this.events.length === 0) return out;
    // Walk newest-first so the latest skip event wins per gate.
    const ordered = [...this.events].sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    for (const e of ordered) {
      if (e.event_type !== 'gate_skipped') continue;
      const meta = e.event_metadata ?? {};
      const gateName = meta['gate_name'] as GateName | undefined;
      if (!gateName || out[gateName] !== undefined) continue;
      out[gateName] = (meta['skipped_at'] as string | undefined) ?? e.created_at ?? null;
    }
    return out;
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

  /** CC-38-31 ⚠ principle: target date passed but neither the user status nor
   *  the workflow reflects it. Flags — never recolors the user's choice. */
  gateStatusDateConflict(m: { gate_name: GateName; target_date?: string | null; actual_date?: string | null }): boolean {
    const rec = this.cycle?.gate_records?.find(g => g.gate_name === m.gate_name);
    return gateDateConflict(rec?.gate_status, this.effectiveDateStatus(m as never), m.target_date, m.actual_date);
  }

  /** CC-38-30: "as of [gate]" staleness note on the Current Status section —
   *  shown when the initiative has moved past the gate that was next when the
   *  status was posted. Empty string hides the note. */
  statusAsOfNote(u: { next_gate_name?: string | null }): string {
    const snapGate = u.next_gate_name;
    if (!snapGate) { return ''; }
    const currentNext = nextGateInOrder(this.cycle?.gate_records);
    if (!currentNext || currentNext === snapGate) { return ''; }
    const label   = LIFECYCLE_TRACK.find(n => n.id === snapGate)?.label ?? snapGate;
    const current = LIFECYCLE_TRACK.find(n => n.id === currentNext)?.label ?? currentNext;
    return `Status given while ${label} was the next gate — the Initiative has since moved to ${current}. Consider a fresh update.`;
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

  /** Cached artifact slot groups. Rebuilt only when cycle data changes via
   *  rebuildArtifactsByGate(). Phil 2026-06-15 bug fix: returning a new
   *  array from a getter on every CD tick destroyed the inline attach form
   *  inputs on each keystroke (focus lost after first char). Stable reference
   *  pattern is the same fix used for StageTrackComponent inputs in the
   *  dashboard grid per CC-Decision-2026-04-11-A.
   *
   *  D-438 Amendment 1 (Contract 25 Part 2): groups keyed by primary_gate
   *  (was lifecycle_stage). `key` is gate name or 'unscheduled' for null-gate. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  artifactsByGate: { key: string; gate: string | null; gate_display_name: string; slots: any[] }[] = [];

  /** trackBy for artifactsByGate *ngFor — keeps DOM stable on rebuild so
   *  inline attach-form inputs don't lose focus. */
  trackByGate = (_i: number, g: { key: string }): string => g.key;

  /** trackBy for slot rows — artifact_type_id is the stable key for type-driven
   *  slots; cycle_artifact_id is the stable key for ad-hoc rows (Contract 25
   *  Part 2 follow-on). */
  trackBySlot = (_i: number, s: { artifact_type_id?: string | null; cycle_artifact_id?: string }): string =>
    s.artifact_type_id ?? (s.cycle_artifact_id ? `adhoc-${s.cycle_artifact_id}` : `slot-${_i}`);

  /** Build artifactsByGate from the current cycle. Called after cycle is
   *  loaded or after an attachment/promotion call refreshes the cycle.
   *
   *  Groups artifact slots by primary_gate. Renders five named gate groups
   *  in sequence order (brief_review → close_review) then "Unscheduled" for
   *  null-gate types. Empty groups are suppressed. */
  private rebuildArtifactsByGate(): void {
    const types       = this.cycle?.artifact_types ?? [];
    const attachments = this.cycle?.artifacts ?? [];

    if (!types.length) {
      this.artifactsByGate = [];
      return;
    }

    // Index attachments by artifact_type_id.
    const attachByTypeId: Record<string, CycleArtifact> = {};
    attachments.forEach(a => {
      if (a.artifact_type_id) { attachByTypeId[a.artifact_type_id] = a; }
    });

    // Build one slot per type — merge attachment when present.
    const slots = types.map(t => {
      const att = attachByTypeId[t.artifact_type_id];
      return {
        artifact_type_id:        t.artifact_type_id,
        artifact_type_name:      t.artifact_type_name,
        primary_gate:            t.primary_gate ?? null,
        guidance_text:           t.guidance_text,
        sort_order:              t.sort_order,
        cycle_artifact_id:       att?.cycle_artifact_id,
        display_name:            att?.display_name,
        external_url:            att?.external_url,
        oi_library_artifact_id:  att?.oi_library_artifact_id,
        pointer_status:          att?.pointer_status,
        attached_by_user_id:     att?.attached_by_user_id,
        attached_by_display_name: att?.attached_by_display_name,
        attached_at:             att?.attached_at
      };
    });

    // Gate sequence + display labels. Unscheduled (null gate) renders last.
    const GATE_GROUPS: { key: string; gate: string | null; gate_display_name: string }[] = [
      { key: 'brief_review',  gate: 'brief_review',  gate_display_name: 'Brief Review'  },
      { key: 'go_to_build',   gate: 'go_to_build',   gate_display_name: 'Go to Build'   },
      { key: 'go_to_deploy',  gate: 'go_to_deploy',  gate_display_name: 'Go to Deploy'  },
      { key: 'go_to_release', gate: 'go_to_release', gate_display_name: 'Go to Release' },
      { key: 'close_review',  gate: 'close_review',  gate_display_name: 'Close Review'  },
      { key: 'unscheduled',   gate: null,            gate_display_name: 'Unscheduled'   }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupMap: Record<string, any[]> = {};
    slots.forEach(s => {
      const k = s.primary_gate ?? 'unscheduled';
      (groupMap[k] = groupMap[k] || []).push(s);
    });
    Object.values(groupMap).forEach(arr =>
      arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    );

    // Contract 25 Part 2 follow-on: append ad-hoc attachments to their gate
    // group's slot list. Ad-hocs are cycle_artifacts rows with
    // artifact_type_id IS NULL. They render below the seeded slot rows in
    // their gate_affinity group; legacy null-type/null-affinity rows from
    // before Migration 042 land in the Unscheduled group so they remain
    // visible and the user can Edit or Remove them. is_adhoc gates Replace /
    // → OI Library buttons so they don't open the slot-attach flow.
    attachments
      .filter(a => !a.artifact_type_id)
      .forEach(a => {
        const k = (a.gate_affinity as string) || 'unscheduled';
        const adhocSlot = {
          artifact_type_id:        null,
          artifact_type_name:      undefined,
          primary_gate:            k === 'unscheduled' ? null : k,
          guidance_text:           '',
          sort_order:              Number.POSITIVE_INFINITY,
          is_adhoc:                true,
          cycle_artifact_id:       a.cycle_artifact_id,
          display_name:            a.display_name,
          external_url:            a.external_url,
          oi_library_artifact_id:  a.oi_library_artifact_id,
          pointer_status:          a.pointer_status,
          attached_by_user_id:     a.attached_by_user_id,
          attached_by_display_name: a.attached_by_display_name,
          attached_at:             a.attached_at
        };
        (groupMap[k] = groupMap[k] || []).push(adhocSlot);
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: { key: string; gate: string | null; gate_display_name: string; slots: any[] }[] = [];
    GATE_GROUPS.forEach(g => {
      const list = groupMap[g.key];
      if (list?.length) {
        out.push({ ...g, slots: list });
      }
    });

    this.artifactsByGate = out;
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
        if (res.success) {
          this.cancelConfirming = false;
          // Re-query with full joined enrichment per the setOnHold pattern.
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.cancelError = res.error ?? 'Cancel failed. Please try again.';
        }
        this.cancelBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.cancelError = err.error ?? 'Cancel failed. Please try again.';
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
        if (res.success) {
          this.uncancelConfirming = false;
          // Re-query with full joined enrichment per the setOnHold pattern.
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.uncancelError = res.error ?? 'Restore failed. Please try again.';
        }
        this.uncancelBusy = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.uncancelError = err.error ?? 'Restore failed. Please try again.';
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
      checklist:            this.gateChecklist(gate),
      // CC-38 f13: unmet hard requirements — modal disables Submit and lists
      // them; server re-enforces in submit_gate_for_approval.
      hardStops:            this.gateHardStops(gate)
    };

    this.gateModalOpen = true;
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
      // B-97 (Contract 16 second pass): defer the flag clear via setTimeout
      // so it lands AFTER all synchronous keydown listeners in the current
      // event have completed. The app uses NoopAnimationsModule (federation
      // compat) — exit animation is 0ms, so afterClosed fires synchronously
      // inside dialogRef.close(). If the CDK OverlayKeyboardDispatcher is
      // registered on the document before detail's @HostListener (any
      // earlier overlay this session — tooltip, MatSelect — triggers that),
      // CDK fires first → dialogRef.close → afterClosed sync → flag cleared
      // → detail.onEscKey then fires with the flag false → close.emit fires
      // → grid reload. Deferring the clear keeps the flag true through the
      // entire keydown event, so detail's guard holds.
      setTimeout(() => { this.gateModalOpen = false; }, 0);
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
    this.milestoneError    = '';
    this.milestoneNote     = '';
    this.milestoneNoteGate = null;
    // Contract 37 (D-553): open in the gate's current mode with its rule
    // pre-loaded; manual (or missing metadata) opens in Date mode.
    this.dateRuleMode    = (m.date_rule_type === 'sprint' || m.date_rule_type === 'relative')
      ? m.date_rule_type : 'manual';
    this.ruleSprintId    = m.rule_sprint_id ?? '';
    this.ruleAnchor      = (m.rule_anchor === 'start' || m.rule_anchor === 'end') ? m.rule_anchor : 'end';
    this.ruleSprintCount = m.rule_sprint_count ?? 0;
    this.ruleDayOffset   = m.rule_day_offset ?? 0;
    this.confirmRuleRemovalGate = null;
    this.clearCascadeConfirm();
    this.cdr.markForCheck();
  }

  cancelMilestoneEdit(): void {
    this.editingMilestoneGate = null;
    this.milestoneError       = '';
    this.confirmRuleRemovalGate = null;
    this.clearCascadeConfirm();
    this.cdr.markForCheck();
  }

  // ── Contract 37 (D-550–D-553): gate date rules ─────────────────────────────

  private loadEffectiveSprintCalendar(divisionId: string): void {
    this.delivery.getEffectiveSprintCalendar(divisionId).subscribe({
      next: (res) => {
        this.effectiveSprintCalendar = res.success && res.data ? res.data : null;
        this.cdr.markForCheck();
      },
      error: () => {
        // No calendar = Date mode only — the editor degrades per spec §4.3.
        this.effectiveSprintCalendar = null;
        this.cdr.markForCheck();
      }
    });
  }

  /** Sprint + relative modes render only when an effective calendar resolves (§7.1). */
  get sprintModesAvailable(): boolean {
    return !!this.effectiveSprintCalendar?.calendar
        && (this.effectiveSprintCalendar?.sprints?.length ?? 0) > 0;
  }

  get effectiveSprints(): SprintRow[] {
    return this.effectiveSprintCalendar?.sprints ?? [];
  }

  setDateRuleMode(mode: GateDateRuleType): void {
    this.dateRuleMode = mode;
    this.milestoneError = '';
    this.confirmRuleRemovalGate = null;
    this.clearCascadeConfirm();
    this.cdr.markForCheck();
  }

  sprintOptionLabel(s: SprintRow): string {
    return sprintDropdownLabel(s);
  }

  /** Prior gate in the canonical five-gate order (D-108/D-154); null on Brief Review. */
  priorGateLabelFor(gate: GateName): string | null {
    const order: GateName[] = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];
    const idx = order.indexOf(gate);
    return idx > 0 ? GATE_LABELS[order[idx - 1]] : null;
  }

  private priorGateTargetFor(gate: GateName): string | null {
    const order: GateName[] = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];
    const idx = order.indexOf(gate);
    if (idx <= 0) { return null; }
    return this.cycle?.milestone_dates?.find(m => m.gate_name === order[idx - 1])?.target_date ?? null;
  }

  /** Live "Resolves to" preview (§7.1) — same algorithm as the server lib. */
  rulePreview(gate: GateName): { date?: string; error?: string } {
    if (this.dateRuleMode === 'sprint') {
      if (!this.ruleSprintId) { return { error: 'Select a sprint.' }; }
      const r = resolveSprintRule(this.effectiveSprints, this.ruleSprintId, this.ruleAnchor, Number(this.ruleDayOffset) || 0);
      return r.error ? { error: r.error } : { date: r.resolved_date };
    }
    if (this.dateRuleMode === 'relative') {
      const r = resolveRelativeRule(this.effectiveSprints, this.priorGateTargetFor(gate),
        Number(this.ruleSprintCount) || 0, Number(this.ruleDayOffset) || 0);
      return r.error ? { error: r.error } : { date: r.resolved_date };
    }
    return {};
  }

  /** D-520 display for target dates + previews. */
  formatTargetDate(iso: string | null | undefined): string {
    return formatTargetDateDisplay(iso);
  }

  /** Grid rule chip (§7.2) — empty string for manual rows. */
  ruleChip(m: CycleMilestoneDate): string {
    return ruleChipLabel(m, this.priorGateLabelFor(m.gate_name) ?? '');
  }

  /** §7.1 caption: sprint real dates + rule restated. Empty in Date mode. */
  ruleEditorCaption(gate: GateName): string {
    if (this.dateRuleMode === 'sprint' && this.ruleSprintId) {
      const s = this.effectiveSprints.find(x => x.sprint_id === this.ruleSprintId);
      if (!s) { return ''; }
      const days = Number(this.ruleDayOffset) || 0;
      const daysPart = days !== 0 ? ` ${days > 0 ? '+' : '−'} ${Math.abs(days)} days` : '';
      return `Sprint ${s.sprint_id} runs ${this.formatTargetDate(s.start_date)} – ${this.formatTargetDate(s.end_date)}; target = sprint ${this.ruleAnchor}${daysPart}`;
    }
    if (this.dateRuleMode === 'relative') {
      const prior = this.priorGateLabelFor(gate);
      if (!prior) { return ''; }
      const x = Number(this.ruleSprintCount) || 0;
      const days = Number(this.ruleDayOffset) || 0;
      const parts = [`${x} sprint${x === 1 ? '' : 's'}`, `${days} day${days === 1 ? '' : 's'}`];
      return `Target = ${prior} target + ${parts.join(' + ')}; recomputes when ${prior} moves`;
    }
    return '';
  }

  ruleSaveDisabled(m: CycleMilestoneDate): boolean {
    if (this.savingMilestone || this.cascadeConfirmGate === m.gate_name) { return true; }
    if (this.dateRuleMode === 'manual') {
      // Unchanged-date guard applies only when the gate is already manual —
      // switching a ruled gate to Date mode with the same date still converts it (§6.4).
      const hasRule = m.date_rule_type === 'sprint' || m.date_rule_type === 'relative';
      return !hasRule && this.milestoneTargetUnchanged(m.gate_name);
    }
    if (this.dateRuleMode === 'sprint') { return !this.ruleSprintId; }
    return !this.rulePreview(m.gate_name).date;
  }

  private clearCascadeConfirm(): void {
    this.cascadeConfirmGate = null;
    this.cascadeShifts      = [];
    this.pendingRuleSave    = null;
  }

  /** §6.3: user cancelled the cascade confirmation — abort, nothing written. */
  cancelCascadeConfirm(): void {
    this.clearCascadeConfirm();
    this.cdr.markForCheck();
  }

  /** §6.3: user confirmed — commit the save plus every listed shift. */
  confirmCascadeSave(gate: GateName): void {
    if (!this.pendingRuleSave) { return; }
    this.executeRuleSave(gate, this.pendingRuleSave, true);
  }

  private executeRuleSave(gate: GateName, rule: NonNullable<typeof this.pendingRuleSave>, confirmed: boolean): void {
    if (!this.cycle) { return; }
    const milestone = this.cycle.milestone_dates?.find(m => m.gate_name === gate);
    const isClear = rule.date_rule_type === 'manual' && rule.target_date === null;
    // Pre-save status capture — same D-503 / Behind-reset handling as before.
    const wasBehind = !isClear && milestone?.date_status === 'behind';
    const trackedStatus = ['on_track', 'at_risk', 'behind'].includes(milestone?.date_status ?? '');

    this.savingMilestone = true;
    this.milestoneError  = '';
    this.milestoneNote   = '';
    this.cdr.markForCheck();

    this.delivery.setGateDateRule({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name: gate,
      rule,
      confirmed
    }).subscribe({
      next: (res) => {
        this.savingMilestone = false;
        if (!res.success || !res.data) {
          this.milestoneError = res.error ?? 'Save failed.';
          this.cdr.markForCheck();
          return;
        }
        if (res.data.requires_confirmation) {
          // §6.3: nothing written yet — show the shift list inline.
          this.cascadeConfirmGate = gate;
          this.cascadeShifts      = res.data.shifts;
          this.pendingRuleSave    = rule;
          this.cdr.markForCheck();
          return;
        }
        // Committed: merge the gate row + apply cascade shifts locally.
        if (res.data.milestone && this.cycle!.milestone_dates) {
          const idx = this.cycle!.milestone_dates.findIndex(m => m.gate_name === gate);
          if (idx !== -1) {
            const updated = { ...this.cycle!.milestone_dates[idx], ...res.data.milestone };
            if (wasBehind && updated.date_status === 'behind') {
              updated.date_status = 'not_started';
            }
            this.cycle!.milestone_dates[idx] = updated;
          }
        }
        for (const shift of res.data.shifts ?? []) {
          const row = this.cycle!.milestone_dates?.find(m => m.gate_name === shift.gate_name);
          if (row) { row.target_date = shift.new_target_date; row.rule_stale = false; }
        }
        for (const u of res.data.unresolved ?? []) {
          const row = this.cycle!.milestone_dates?.find(m => m.gate_name === u.gate_name);
          if (row) { row.rule_stale = true; }
        }
        this.editingMilestoneGate = null;
        this.confirmRuleRemovalGate = null;
        this.clearCascadeConfirm();
        if (isClear && trackedStatus) {
          this.milestoneNote     = 'Status retained; no target date to track against.';
          this.milestoneNoteGate = gate;
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.milestoneError  = err.error ?? 'Save failed.';
        this.savingMilestone = false;
        this.cdr.markForCheck();
      }
    });
  }

  /** D-501 (AC 5): Save enables only when the field differs from the stored
   *  value — including set → blank (a clear). Blank → blank stays disabled. */
  milestoneTargetUnchanged(gate: GateName): boolean {
    const m = this.cycle?.milestone_dates?.find(x => x.gate_name === gate);
    const newVal = this.milestoneDateControl.value || null;
    return newVal === (m?.target_date ?? null);
  }

  /** Contract 37: every target-date save routes through set_gate_date_rule —
   *  the server resolves, writes date + rule atomically, and runs the D-552
   *  cascade (with pre-flight confirmation when downstream gates would move). */
  saveMilestoneDate(gate: GateName): void {
    if (!this.cycle) { return; }
    const milestone = this.cycle.milestone_dates?.find(m => m.gate_name === gate);
    if (!milestone) { return; }

    let rule: NonNullable<typeof this.pendingRuleSave>;
    if (this.dateRuleMode === 'sprint') {
      if (!this.ruleSprintId) { this.milestoneError = 'Select a sprint.'; this.cdr.markForCheck(); return; }
      rule = {
        date_rule_type: 'sprint',
        rule_sprint_id: this.ruleSprintId,
        rule_anchor: this.ruleAnchor,
        rule_day_offset: Number(this.ruleDayOffset) || 0
      };
    } else if (this.dateRuleMode === 'relative') {
      rule = {
        date_rule_type: 'relative',
        rule_sprint_count: Number(this.ruleSprintCount) || 0,
        rule_day_offset: Number(this.ruleDayOffset) || 0
      };
    } else {
      // D-501: blank persists as NULL — clear is a first-class save (and also
      // clears any rule).
      const newVal: string | null = this.milestoneDateControl.value || null;
      const hasRule = milestone.date_rule_type === 'sprint' || milestone.date_rule_type === 'relative';
      if (!hasRule && newVal === (milestone.target_date ?? null)) { return; }  // no-op guard (AC 5)
      // §6.4: direct date edit on a ruled gate converts it to manual — inline
      // confirmation before the first save click proceeds.
      if (hasRule && this.confirmRuleRemovalGate !== gate) {
        this.confirmRuleRemovalGate = gate;
        this.cdr.markForCheck();
        return;
      }
      rule = { date_rule_type: 'manual', target_date: newVal };
    }

    this.executeRuleSave(gate, rule, false);
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

    // Ad-hoc form uses sentinel '__adhoc__<gate-key>' for attachingForTypeId — that
    // is NOT a UUID. Extract the gate group key as gate_affinity so the MCP can
    // record it on cycle_artifacts.gate_affinity (Migration 042) and Zone 6 can
    // render the attachment inside its gate group.
    let typeIdParam: string | undefined;
    let gateAffinityParam: string | undefined;
    if (!this.attachingForTypeId || this.attachingForTypeId.startsWith('__adhoc__')) {
      typeIdParam = undefined;
      gateAffinityParam = this.attachingForTypeId
        ? this.attachingForTypeId.slice('__adhoc__'.length)
        : undefined;
    } else {
      typeIdParam = this.attachingForTypeId;
      gateAffinityParam = undefined;
    }

    this.delivery.attachArtifact({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      artifact_type_id:  typeIdParam,
      gate_affinity:     gateAffinityParam,
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

  // ── Edit + remove on filled artifact rows (Contract 25 Part 2 follow-on) ──

  /** Open the inline edit form for a filled artifact slot or ad-hoc row.
   *  Reuses attachForm — same field set (display_name + external_url). */
  openEditArtifact(slot: { cycle_artifact_id?: string; display_name?: string; external_url?: string | null }): void {
    if (!slot.cycle_artifact_id) { return; }
    // Close any other edit/attach/remove state in progress.
    this.showAttachForm = false;
    this.attachingForTypeId = '';
    this.cancelRemoveConfirm();
    this.editingArtifactId = slot.cycle_artifact_id;
    this.editingError = '';
    this.attachForm.reset({
      display_name: slot.display_name  ?? '',
      external_url: slot.external_url  ?? ''
    });
    this.cdr.markForCheck();
  }

  cancelEditArtifact(): void {
    this.editingArtifactId = null;
    this.editingError = '';
    this.savingEdit = false;
    this.cdr.markForCheck();
  }

  submitEditArtifact(): void {
    if (!this.cycle || !this.editingArtifactId || this.attachForm.invalid) { return; }
    this.savingEdit = true;
    this.editingError = '';
    this.cdr.markForCheck();

    this.delivery.updateArtifact({
      cycle_artifact_id: this.editingArtifactId,
      display_name:      this.attachForm.value.display_name as string,
      external_url:      this.attachForm.value.external_url as string
    }).subscribe({
      next: (res) => {
        this.savingEdit = false;
        if (res.success) {
          this.editingArtifactId = null;
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.editingError = res.error ?? 'Save failed.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.savingEdit = false;
        this.editingError = err.error ?? 'Save failed. Check the URL and try again.';
        this.cdr.markForCheck();
      }
    });
  }

  /** Two-step remove. First call sets confirm state + 5s timeout to reset.
   *  Second call (while confirm pending) fires the detach. */
  requestRemoveArtifact(slot: { cycle_artifact_id?: string }): void {
    if (!slot.cycle_artifact_id || !this.cycle) { return; }
    if (this.removeConfirmingId === slot.cycle_artifact_id) {
      // Second click — execute.
      this.performRemoveArtifact(slot.cycle_artifact_id);
      return;
    }
    // First click — enter confirm state, start timeout.
    this.cancelRemoveConfirm();
    this.removeConfirmingId = slot.cycle_artifact_id;
    this.removeError = '';
    this.removeConfirmTimeoutHandle = setTimeout(() => {
      this.removeConfirmingId = null;
      this.cdr.markForCheck();
    }, 5000);
    this.cdr.markForCheck();
  }

  private performRemoveArtifact(cycleArtifactId: string): void {
    if (!this.cycle) { return; }
    this.cancelRemoveConfirm();
    this.removingId = cycleArtifactId;
    this.removeError = '';
    this.cdr.markForCheck();

    this.delivery.detachArtifact({ cycle_artifact_id: cycleArtifactId }).subscribe({
      next: (res) => {
        this.removingId = null;
        if (res.success) {
          this.loadCycle(this.cycle!.delivery_cycle_id);
        } else {
          this.removeError = res.error ?? 'Remove failed.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.removingId = null;
        this.removeError = err.error ?? 'Remove failed.';
        this.cdr.markForCheck();
      }
    });
  }

  private cancelRemoveConfirm(): void {
    if (this.removeConfirmTimeoutHandle) {
      clearTimeout(this.removeConfirmTimeoutHandle);
      this.removeConfirmTimeoutHandle = null;
    }
    this.removeConfirmingId = null;
  }

  // ── Jira sync ──────────────────────────────────────────────────────────────

  /** Open the Edit form on an already-linked Jira epic. Pre-populates the
   *  input with the current key so the user can amend rather than retype. */
  openJiraEditForm(): void {
    this.jiraEpicKeyCtrl.setValue(this.jiraLink?.jira_epic_key ?? '');
    this.jiraLinkError    = '';
    this.showJiraLinkForm = true;
    this.cdr.markForCheck();
  }

  /** Cancel out of an in-progress Jira link/edit form. */
  cancelJiraEditForm(): void {
    this.showJiraLinkForm = false;
    this.jiraLinkError    = '';
    this.jiraEpicKeyCtrl.reset();
    this.cdr.markForCheck();
  }

  /** State 1: Link a Jira epic to this cycle using the epic key form.
   *  Phil 2026-06-15 bug fix: now calls link_jira_epic MCP which CREATES
   *  the jira_links row. Previous code called sync_jira_epic which
   *  silently dropped the input when no link row existed yet. */
  linkJiraEpic(): void {
    if (!this.cycle || !this.jiraEpicKeyCtrl.value?.trim()) { return; }
    this.linkingJiraEpic = true;
    this.jiraLinkError   = '';
    this.cdr.markForCheck();

    this.delivery.linkJiraEpic({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      jira_epic_key:     this.jiraEpicKeyCtrl.value.trim()
    }).subscribe({
      next: (res) => {
        if (res.success) {
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
  // ── Contract G3 (D-562/D-567): governance level chip + sizing edit ─────────

  /** Contract G4: viewer identity for the participation section (one-tap Informed). */
  get viewerUserId(): string | null {
    return this.profileService.getCurrentProfile()?.id ?? null;
  }

  /** Sized = baseline cached or a set level exists (recompute writes baseline
   *  on every sizing upsert). Unsized legacy keeps the tier badge (AC #4). */
  get cycleIsSized(): boolean {
    return this.cycle?.baseline_level != null || this.cycle?.set_level != null;
  }

  get effectiveGovernanceLevel(): number | null {
    return this.cycle?.set_level ?? this.cycle?.baseline_level ?? null;
  }

  get levelChipText(): string {
    const level = this.effectiveGovernanceLevel;
    return level ? `Level ${level}` : 'Unsized';
  }

  /** D-562 attribution when set diverges from computed; D-570a interim line at L1. */
  get levelAttributionLine(): string {
    const c = this.cycle;
    if (!c || c.set_level == null) { return ''; }
    if (c.set_level === c.baseline_level) { return ''; }
    const setter = this.allUsers.find(u => u.id === c.set_level_by_user_id)?.display_name ?? 'leadership';
    const computed = c.baseline_level != null ? `Level ${c.baseline_level}` : 'unsized';
    const reason = c.set_level_reason ? ` — ${c.set_level_reason}` : '';
    return `Level ${c.set_level} — set by ${setter}; computed: ${computed}${reason}`;
  }

  get levelChipTooltip(): string {
    // G5: the G3 interim "coming release" line is retired — L1 consensus is live.
    if (this.effectiveGovernanceLevel === 1) {
      return 'Level 1 — the Initiative trio and consulted parties approve gates together.';
    }
    return this.levelAttributionLine || 'Governance level derived from the sizing answers.';
  }

  // ── Contract G8 (S-C6/D-562): set-level divergence prompt ──────────────────
  levelPromptBusy = false;

  /** Visible to the setter or any leadership viewer when baseline > set. */
  get showSetLevelDivergencePrompt(): boolean {
    const c = this.cycle;
    if (!c || c.set_level == null || c.baseline_level == null) { return false; }
    if (c.baseline_level <= c.set_level) { return false; }
    const me = this.profileService.getCurrentProfile();
    return c.set_level_by_user_id === me?.id || me?.is_admin === true ||
           me?.is_super_admin === true || me?.is_initiative_executive === true;
  }

  confirmSetLevel(): void {
    if (!this.cycle || this.levelPromptBusy) { return; }
    this.levelPromptBusy = true;
    this.delivery.setEffectiveLevel({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      level: this.cycle.set_level as 1 | 2 | 3,
      reason: `Confirmed after the computed baseline rose to Level ${this.cycle.baseline_level} (S-C6).`
    }).subscribe({
      next: () => { this.levelPromptBusy = false; this.loadCycle(this.cycle!.delivery_cycle_id); },
      error: () => { this.levelPromptBusy = false; this.cdr.markForCheck(); }
    });
  }

  releaseSetLevel(): void {
    if (!this.cycle || this.levelPromptBusy) { return; }
    this.levelPromptBusy = true;
    this.delivery.clearEffectiveLevel({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      reason: `Released to the computed baseline (Level ${this.cycle.baseline_level}) after it rose above the set level (S-C6).`
    }).subscribe({
      next: () => { this.levelPromptBusy = false; this.loadCycle(this.cycle!.delivery_cycle_id); },
      error: () => { this.levelPromptBusy = false; this.cdr.markForCheck(); }
    });
  }

  /** Contract G3: post-creation sizing edit (MCP guards post-GtB edits). */
  openSizingEdit(): void {
    if (!this.cycle) { return; }
    this.dialog.open(SizingEditDialogComponent, {
      data: {
        delivery_cycle_id: this.cycle.delivery_cycle_id,
        cycle_title:       this.cycle.cycle_title,
        dcs_user_id:       this.cycle.assigned_dcs_user_id ?? null
      } as SizingEditDialogData,
      width: '560px',
      maxWidth: '92vw'
    }).afterClosed().subscribe(saved => {
      if (saved && this.cycle) { this.loadCycle(this.cycle.delivery_cycle_id); } // S-008 refresh
    });
  }

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

    // D-438 Amendment 1 (Contract 25 Part 2): replaced lifecycle_stage filter
    // with primary_gate lookup via artifact_types map. The prior a.lifecycle_stage
    // field was never populated on attachments (joined comment notwithstanding),
    // so checklist "attached" rows were always false-negative; this gate-based
    // lookup is the first time the check actually evaluates against attachment data.
    const typeIdToGate: Record<string, GateName | null> = {};
    (c.artifact_types ?? []).forEach(t => {
      typeIdToGate[t.artifact_type_id] = (t.primary_gate ?? null) as (GateName | null);
    });
    const byGate = (gate: GateName) => arts.filter(a =>
      !!a.artifact_type_id &&
      typeIdToGate[a.artifact_type_id] === gate &&
      a.external_url
    );
    const briefArts   = byGate('brief_review');
    const specArts    = byGate('go_to_build');
    const buildArts   = byGate('go_to_deploy');
    const uatArts     = byGate('go_to_deploy');
    const pilotArts   = byGate('go_to_release');
    const outcomeArts = byGate('close_review');

    const hasName = (list: CycleArtifact[], ...terms: string[]) =>
      list.some(a => terms.some(t => (a.artifact_type_name ?? '').toLowerCase().includes(t)));

    const isTier3 = c.tier_classification === 'tier_3';

    // CC-38 follow-on 13 (Phil 2026-07-17): checklist = advisory ambers only.
    // Everything mandatory moved to gateHardStops() + server enforcement in
    // submit_gate_for_approval. Tech Spec and MCP scope items removed from
    // Go to Build (MCP scope removal deferred to Design for a future policy).
    // isTier3 retired with the removed Tier-3 items — void reference keeps
    // strict mode quiet without deleting the classification context above.
    void isTier3; void specArts; void buildArts; void outcomeArts; void pilotArts;

    const aiYes = c.ai_functionality === 'yes';
    switch (gate) {
      case 'brief_review':
        return [
          { label: 'Scenario document attached',                                   met: hasName(briefArts, 'scenario') },
          { label: 'Outcome Statement set',                                        met: !!c.outcome_statement },
          // Contract G3 (D-558/D-567): sized Initiatives get the advisory
          // review question (always amber — a prompt, not a completable check);
          // unsized legacy keeps the tier row until migration.
          ...(this.cycleIsSized
            ? [{ label: 'Do the sizing answers still look right now that the brief is written?', met: false }]
            : [{ label: 'Tier classification set', met: !!c.tier_classification }]),
        ];
      case 'go_to_deploy':
        return [
          ...(aiYes && c.ai_delivery_form === 'product_embedded' && c.ai_audience === 'external' ? [
            { label: 'AI Production Governance Report attached',                   met: hasName(uatArts, 'ai production governance') },
          ] : []),
          ...(aiYes && c.ai_delivery_form === 'analytics_outputs' && c.ai_audience === 'external' ? [
            { label: 'AI Delivery Requirements Record attached (data lineage, reproducibility, AI disclosure)',
              met: hasName(uatArts, 'ai delivery requirements') },
          ] : []),
        ];
      case 'go_to_release':
        return [
          ...(aiYes && c.ai_audience === 'internal' ? [
            { label: 'AI Production Governance Report attached',                   met: hasName(byGate('go_to_deploy'), 'ai production governance') },
          ] : []),
        ];
      // go_to_build and close_review: no advisory items (Phil 2026-07-17).
      default:
        return [];
    }
  }

  /**
   * CC-38 follow-on 13: client-side twin of the submit_gate_for_approval
   * hard-stop ladder. Unmet items disable Submit in the gate modal with a
   * D-140 explanation; the server re-enforces the same rules for any request
   * that skips the UI (double-enforcement approach, Phil 2026-07-17).
   */
  gateHardStops(gate: GateName): string[] {
    if (!this.cycle) { return []; }
    const c = this.cycle;
    const stops: string[] = [];

    const typeIdToGate: Record<string, GateName | null> = {};
    (c.artifact_types ?? []).forEach(t => {
      typeIdToGate[t.artifact_type_id] = (t.primary_gate ?? null) as (GateName | null);
    });
    const hasContextBrief = (c.artifacts ?? []).some(a =>
      (a.artifact_type_name ?? '').toLowerCase().includes('context brief') && a.external_url);

    if (gate === 'brief_review') {
      if (!c.assigned_dcs_user_id) {
        stops.push('No Domain Capability Strategist is assigned. Assign a DCS in the Initiative edit panel.');
      }
      if (!c.assigned_dol_user_id && this.divisionDolRequired !== false) {
        stops.push('No Domain Outcome Lead is assigned. Assign a DOL in the Initiative edit panel.');
      }
    }

    if (gate === 'go_to_build') {
      if (!hasContextBrief) {
        stops.push('No Context Brief is attached. Attach it in the Artifacts section.');
      }
      if (!c.jira_epic_key && this.divisionJiraRequired !== false) {
        stops.push('No Jira epic is linked. Link it in the Initiative edit panel (or ask an Admin to exempt this Division).');
      }
      if (!c.assigned_epo_user_id) {
        stops.push('No Engineering Product Owner is assigned. Assign an EPO in the Initiative edit panel.');
      }
      if (!c.ai_functionality) {
        stops.push('The "Includes AI functionality" question is unanswered. Answer it (Yes, No, or I do not know) in the Initiative edit panel.');
      }
    }

    if (gate === 'go_to_deploy') {
      if (c.ai_functionality !== 'yes' && c.ai_functionality !== 'no') {
        stops.push('The "Includes AI functionality" question must be resolved to Yes or No before deployment. Update it in the Initiative edit panel.');
      } else if (c.ai_functionality === 'yes') {
        if (!c.ai_delivery_form || !c.ai_audience) {
          stops.push('The AI profile is incomplete. Set the delivery form and audience in the Initiative edit panel.');
        } else if (c.ai_delivery_form === 'product_embedded' && c.ai_audience === 'external' && !c.ai_board_approved) {
          stops.push('External user-facing AI requires AI Production Board approval before pilot. Record AI Prod Board approval on the Initiative.');
        }
      }
    }

    if (gate === 'go_to_release' &&
        c.ai_functionality === 'yes' && c.ai_audience === 'internal' && !c.ai_board_approved) {
      stops.push('Internal AI requires AI Production Board approval before production release. Record AI Prod Board approval on the Initiative.');
    }

    return stops;
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
      // D-447: skipped milestone — initiative entered system past this gate.
      skipped:     'Skipped',
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
    this.revertConfirmGate      = null;
    this.revertPriorStatus      = null;
    this.cdr.markForCheck();
  }

  saveMilestoneStatus(gate: GateName): void {
    if (!this.cycle || !this.milestoneStatusValue) { return; }

    // Contract 28 / D-451 — revert confirmation gate.
    // When the milestone has an actual_date, any status change is a revert and
    // must pass through the inline confirmation panel. The MCP also enforces
    // this with REVERT_CONFIRMATION_REQUIRED — Angular gates first so the
    // user never sees that error.
    const milestone = this.cycle.milestone_dates?.find(m => m.gate_name === gate);
    const hasActualDate = !!milestone?.actual_date;
    const isChanging   = milestone?.date_status !== this.milestoneStatusValue;
    if (hasActualDate && isChanging && this.revertConfirmGate !== gate) {
      this.revertConfirmGate  = gate;
      this.revertPriorStatus  = milestone?.date_status ?? null;
      this.milestoneStatusError = '';
      this.cdr.markForCheck();
      return;
    }

    this.savingMilestoneStatus = true;
    this.milestoneStatusError  = '';
    this.cdr.markForCheck();

    // D-451: when this is a confirmed revert, pass the system token so the
    // MCP can persist the override reason marker and emit the
    // milestone_status_reverted event.
    const isConfirmedRevert = hasActualDate && isChanging;

    this.delivery.updateMilestoneStatus({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      date_status:       this.milestoneStatusValue as DateStatus,
      ...(isConfirmedRevert ? { status_override_reason: 'confirmed-revert' } : {})
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const idx = this.cycle!.milestone_dates?.findIndex(m => m.gate_name === gate) ?? -1;
          if (idx !== -1 && this.cycle!.milestone_dates) {
            this.cycle!.milestone_dates[idx] = res.data;
          }
          this.editingMilestoneStatus = null;
          this.revertConfirmGate      = null;
          this.revertPriorStatus      = null;
          if (isConfirmedRevert) {
            // Activity feed needs the new event to render.
            this.loadEvents(this.cycle!.delivery_cycle_id);
          }
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

  /** D-451: user clicked Continue on the revert confirmation panel. Resume the
   *  save flow — saveMilestoneStatus now sees revertConfirmGate === gate and
   *  proceeds to the MCP call. */
  confirmRevertContinue(gate: GateName): void {
    // revertConfirmGate is already set to gate; saveMilestoneStatus will skip
    // the confirmation guard on this call.
    this.saveMilestoneStatus(gate);
  }

  /** D-451: user clicked Cancel on the revert confirmation panel. Restore the
   *  dropdown value, dismiss the panel, stay in edit mode so the user can
   *  pick again. */
  cancelRevertConfirm(): void {
    if (this.revertPriorStatus) {
      this.milestoneStatusValue = this.revertPriorStatus;
    }
    this.revertConfirmGate    = null;
    this.revertPriorStatus    = null;
    this.cdr.markForCheck();
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
    // D-501: seed with the stored value so the dirty check (AC 5) is truthful
    // and Clear on the native picker registers as set → blank.
    const m = this.cycle?.milestone_dates?.find(x => x.gate_name === gate);
    this.actualDateControl.setValue(m?.actual_date ?? '');
    this.actualDateError = '';
    this.confirmClearCompleteGate = null;
    this.cdr.markForCheck();
  }

  cancelActualDateEdit(): void {
    this.editingActualDateGate = null;
    this.actualDateError       = '';
    this.confirmClearCompleteGate = null;
    this.cdr.markForCheck();
  }

  /** D-501 (AC 5): unchanged (incl. blank/blank) → Save disabled. */
  actualDateUnchanged(gate: GateName): boolean {
    const m = this.cycle?.milestone_dates?.find(x => x.gate_name === gate);
    const newVal = this.actualDateControl.value || null;
    return newVal === (m?.actual_date ?? null);
  }

  saveActualDate(gate: GateName): void {
    if (!this.cycle) { return; }
    const newVal: string | null = this.actualDateControl.value || null;
    const milestone = this.cycle.milestone_dates?.find(m => m.gate_name === gate);
    if (newVal === (milestone?.actual_date ?? null)) { return; }  // no-op guard (AC 5)

    // D-503/D-183: clearing the actual date on a Complete gate takes a
    // two-step inline confirm. First Save press arms it; Confirm proceeds.
    const isClear = newVal === null;
    if (isClear && milestone?.date_status === 'complete' && this.confirmClearCompleteGate !== gate) {
      this.confirmClearCompleteGate = gate;
      this.cdr.markForCheck();
      return;
    }
    this.confirmClearCompleteGate = null;

    this.savingActualDate = true;
    this.actualDateError  = '';
    this.cdr.markForCheck();

    this.delivery.setMilestoneActualDate({
      delivery_cycle_id: this.cycle.delivery_cycle_id,
      gate_name:         gate,
      actual_date:       newVal
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
          // Contract 16 UAT fix: removed translateMilestoneError per D-205.
          // The previous translation framed any save error as a status-block,
          // contradicting D-205 (user sets statuses freely, no restriction on
          // actual_date save). MCP tool now returns human-readable errors;
          // surface them verbatim, fall back to neutral generic otherwise.
          this.actualDateError = res.error ?? 'Save failed.';
        }
        this.savingActualDate = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.actualDateError  = err?.error ?? 'Save failed. Try again.';
        this.savingActualDate = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Zone 6: Artifact gate expand/collapse ─────────────────────────────────
  // D-438 Amendment 1 (Contract 25 Part 2): gate-keyed (was stage-keyed).

  /** Initialise expandedGates: gates up to and including the cycle's current
   *  next gate are expanded; later gates + Unscheduled stay collapsed.
   *  Terminal cycles (no next gate) expand all scheduled gates by default. */
  private initExpandedGates(): void {
    if (!this.cycle) { return; }
    const GATE_ORDER = [
      'brief_review','go_to_build','go_to_deploy','go_to_release','close_review'
    ];
    const nextGate = NEXT_GATE_BY_STAGE[this.cycle.current_lifecycle_stage as LifecycleStage] ?? null;
    const currentIdx = nextGate ? GATE_ORDER.indexOf(nextGate) : -1;
    const expanded = currentIdx >= 0
      ? GATE_ORDER.filter((_, i) => i <= currentIdx)
      : GATE_ORDER.slice();
    this.expandedGates = new Set(expanded);
  }

  /** Toggle a gate section open or closed. */
  toggleGateExpand(key: string): void {
    if (this.expandedGates.has(key)) {
      this.expandedGates.delete(key);
    } else {
      this.expandedGates.add(key);
    }
    this.cdr.markForCheck();
  }

  isGateExpanded(key: string): boolean {
    return this.expandedGates.has(key);
  }

  /** Count attached artifacts in a gate group */
  attachedCountInGroup(slots: CycleArtifact[]): number {
    return slots.filter(s => s.external_url || s.oi_library_artifact_id).length;
  }
}

// translateMilestoneError removed in Contract 16 UAT pass per D-205.
// The function framed any check-constraint failure as a "status incompatible"
// block, contradicting D-205 (user sets all statuses freely; no save block
// based on status). The underlying constraint failures it caught are also
// resolved upstream — the rewritten set_milestone_actual_date MCP tool writes
// only date_status='complete' (a CHECK-valid value), so the constraint no
// longer fires from this path. Raw DB errors are still constrained by the
// MCP error format ({ success:false, error:<readable string> }), so D-140's
// no-raw-DB-errors guarantee still holds at the MCP boundary.
