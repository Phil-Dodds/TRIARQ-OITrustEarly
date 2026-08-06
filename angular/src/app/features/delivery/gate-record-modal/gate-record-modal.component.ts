// gate-record-modal.component.ts — Pathways OI Trust
// D-355 Gate Record Modal. Replaces the inline gate sub-panel rendering on
// DeliveryCycleDetailComponent. Triggered by StageTrackComponent.gateClicked
// (from either the small diamond OR — D-355/ARCH-25 — the current-stage filled
// circle), and by tapping a gate row on the cycle's milestone table.
//
// Governing decisions:
//   D-355 — modal centered on full page; detail panel dimmed behind. Action area
//           is context-sensitive by gate state.
//   D-345 — gate state machine + MCP calls (submit_gate_for_approval,
//           record_gate_decision, withdraw_gate_submission). Panel refresh rules.
//   D-183 — Approve and Withdraw require two-step inline confirmation. Return is
//           not destructive — notes textarea inline, submit directly.
//   S-028 — Context A on action buttons (present-participle label change +
//           disabled during call). Context D non-interactive overlay covers the
//           entire modal during MCP write calls (× included).
//   S-014 — Angular Material baseline. MatDialog is the MD3 reference.
//
// Modal returns via dialogRef.close():
//   { refreshKind: 'full' }   — caller does full reload (approval, return, regression)
//   { refreshKind: 'partial' } — caller does in-place reload (submit, withdraw)
//   undefined / { refreshKind: 'none' } — dismissed without action
//
// Caller pattern (in DeliveryCycleDetailComponent):
//   this.dialog.open(GateRecordModalComponent, {
//     data: { cycle, gateName, allUsers, callerCanSubmitGates, checklist },
//     panelClass: 'oi-gate-record-modal-panel',
//     width: '640px',
//     maxWidth: '92vw',
//     autoFocus: 'first-tabbable'
//   }).afterClosed().subscribe(...);

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryService } from '../../../core/services/delivery.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { GateConsultationSectionComponent } from './gate-consultation-section.component';
// Contract G6 (D-565): thread + conditions, one tap deep.
import { GateThreadConditionsComponent } from './gate-thread-conditions.component';
// Contract G3 (D-567/D-558): sizing interstitial + Go to Build confirm step.
import { InitiativeSizingFormComponent, SizingFormPayload } from '../sizing-form/initiative-sizing-form.component';
// GA-1 (D-579): GATE_PURPOSES retired from confirm surfaces — the assessment
// form's header carries the per-gate purpose sentence instead.
import { GATE_COACHING_SHORT } from '../../../shared/constants/gate-coaching.constants';
// Contract GA-1 (D-579): assessment collection + read-only display.
import { GateAssessmentFormComponent, AssessmentChange } from '../gate-assessment/gate-assessment-form.component';
import { GateAssessmentDisplayComponent, GateAssessmentRow } from '../gate-assessment/gate-assessment-display.component';
import {
  DeliveryCycle,
  GateName,
  GateRecord,
  CycleMilestoneDate,
  User,
  DateStatus,
  EpoWipWarning,
  GateDecisionResult,
  GateSkipInterstitialPayload,
  DeployGateSkipBlockedPayload,
  InitiativeSizing
} from '../../../core/types/database';

export interface GateRecordModalData {
  cycle:                DeliveryCycle;
  gateName:             GateName;
  allUsers:             User[];
  callerCanSubmitGates: boolean;
  checklist:            { label: string; met: boolean }[];
  // CC-38 follow-on 13: unmet hard requirements for THIS gate. Non-empty →
  // Submit disabled with a D-140 explanation. Mirrors the server-side ladder
  // in submit_gate_for_approval (double enforcement).
  hardStops:            string[];
  /** Contract 40 follow-on (Phil 2026-07-30): missing recommended artifacts for
   *  THIS gate. Advisory — rendered as an amber panel and shown to whoever opens
   *  the gate, submitter or approver. Never disables an action. */
  artifactWarnings:     string[];
}

export type GateRecordModalResult =
  | { refreshKind: 'full' }
  | { refreshKind: 'partial' }
  | { refreshKind: 'none' };

const GATE_LABELS: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

@Component({
  selector:        'app-gate-record-modal',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, ReactiveFormsModule, FormsModule, IonicModule, MatDialogModule, GateConsultationSectionComponent, InitiativeSizingFormComponent, GateThreadConditionsComponent, GateAssessmentFormComponent, GateAssessmentDisplayComponent],
  template: `
    <div class="grm-shell" [attr.aria-busy]="processing ? 'true' : null">

      <!-- ── Header ───────────────────────────────────────────────────────── -->
      <div class="grm-header">
        <div class="grm-titles">
          <div class="grm-title">{{ gateLabel }}</div>
          <div class="grm-subtitle">
            <!-- D-583 (Contract 39): "· Tier N" suffix retired. -->
            {{ data.cycle.cycle_title }}
          </div>
          <!-- D-527: one-line gate meaning at read point; unknown label renders nothing.
               "More →" deep-links to the Initiative Guide's section for this gate. -->
          <div *ngIf="gateCoaching" class="grm-coaching">
            {{ gateCoaching }}
            <a class="grm-coaching-more" (click)="openGuide()">More →</a>
          </div>
        </div>
        <button class="grm-close"
                type="button"
                [disabled]="processing"
                aria-label="Close Gate Record"
                (click)="onDismiss()">
          ×
        </button>
      </div>

      <!-- ── Body ─────────────────────────────────────────────────────────── -->
      <div class="grm-body">

        <!-- GATE STATUS + MILESTONE DATE side by side to save vertical space. -->
        <div class="grm-status-milestone-row">
        <!-- GATE STATUS -->
        <section class="grm-section">
          <div class="grm-label">Gate Status</div>
          <div class="grm-status-row">
            <span class="grm-pill"
                  [style.background]="statusBg"
                  [style.color]="statusColor">
              {{ statusLabel }}
            </span>
            <span *ngIf="statusLabel === 'Not Yet Active'" class="grm-status-hint">
              Advance the Initiative through earlier stages to unlock this Gate.
            </span>
            <span *ngIf="record?.workstream_active_at_clearance === false"
                  class="grm-status-error">
              Workstream was inactive at last clearance attempt. Reactivate the
              Workstream in Admin → Delivery Workstream Registry, then resubmit.
            </span>
          </div>
        </section>

        <!-- MILESTONE DATE — hidden when no dates exist yet (Phil 2026-07-26:
             empty "Target: — Actual: —" rows are noise; dates are managed on
             the Initiative panel). -->
        <section *ngIf="milestone && (milestone!.target_date || milestone!.actual_date)" class="grm-section">
          <div class="grm-label">Milestone Date</div>
          <div class="grm-milestone">
            <div>
              <span class="grm-meta">Target: </span>
              <span [style.color]="targetDateColor">{{ milestone!.target_date ?? '—' }}</span>
            </div>
            <div>
              <span class="grm-meta">Actual: </span>
              <span>{{ milestone!.actual_date ?? '—' }}</span>
            </div>
            <span class="grm-pill"
                  [style.background]="dateStatusBg(milestone!.date_status)"
                  [style.color]="dateStatusColor(milestone!.date_status)">
              {{ dateStatusLabel(milestone!.date_status) }}
            </span>
          </div>
        </section>
        </div>

        <!-- APPROVAL ROUTING -->
        <section class="grm-section">
          <div class="grm-label">Approval Routing</div>
          <div class="grm-routing-row">
            <span class="grm-raci-badge">A</span>
            <span class="grm-raci-role">Accountable</span>
            <span *ngIf="record?.approver_user_id" class="grm-raci-name">
              {{ record!.approver_display_name || approverDisplayName(record!.approver_user_id!) }}
            </span>
            <span *ngIf="!record?.approver_user_id" class="grm-raci-default">
              {{ escalationDefaultLabel }}
            </span>
          </div>
        </section>

        <!-- SUBMISSION JUSTIFICATION — D-489. Above the Consulted section (D-461).
             Set at submission; immutable afterward. Visible to everyone who can
             open the sub-panel (approver + consulted are the audiences of record). -->
        <section *ngIf="record?.submission_note" class="grm-section">
          <div class="grm-label">Why is this gate ready?</div>
          <div class="grm-submission-note">{{ record!.submission_note }}</div>
        </section>

        <!-- Contract 39 (D-585): outcome verdict block — read point for the
             approver (above the assessment items) and the record afterward.
             Approval ratifies the verdict; return per existing mechanics. -->
        <section *ngIf="data.gateName === 'close_review' && record?.outcome_verdict
                        && (record?.gate_status === 'awaiting_approval'
                            || record?.gate_status === 'approved'
                            || record?.gate_status === 'returned')"
                 id="grm-verdict-block" class="grm-section">
          <div class="grm-label">Outcome verification</div>
          <div *ngIf="record!.outcome_verdict === 'not_met' && record!.gate_status === 'approved'"
               style="display:inline-block;margin:4px 0;padding:3px 10px;border-radius:4px;
                      background:#FDECEA;color:#C62828;font:600 12px Roboto;">
            Closed — outcome not met
          </div>
          <div class="grm-meta" style="margin-top:4px;">Declared outcome</div>
          <div class="grm-submission-note">{{ data.cycle.outcome_statement || '— (stated retrospectively below)' }}</div>
          <div class="grm-meta" style="margin-top:6px;">Actual result</div>
          <div class="grm-submission-note">{{ record!.outcome_actual }}</div>
          <div class="grm-meta" style="margin-top:6px;">Verdict</div>
          <div style="font:500 13px Roboto;"
               [style.color]="record!.outcome_verdict === 'not_met' ? '#C62828' : '#2E7D32'">
            {{ record!.outcome_verdict === 'not_met' ? 'Not met — documented' : 'Met — demonstrated' }}
          </div>
          <div class="grm-meta" style="margin-top:6px;">
            {{ record!.outcome_verdict === 'not_met' ? 'What happened' : 'Evidence' }}
          </div>
          <div class="grm-submission-note">{{ record!.outcome_evidence }}</div>
          <div *ngIf="record!.gate_status === 'awaiting_approval'" class="grm-meta" style="margin-top:4px;">
            Approving this gate ratifies the verdict. If it is unsupported, return the gate.
          </div>
        </section>

        <!-- CONSULTED — Contract 29 WS2 (D-461). Self-hides when no records. -->
        <app-gate-consultation-section
          [gateRecordId]="record?.gate_record_id ?? null"
          [gateStatus]="record?.gate_status ?? null"
          [currentUserId]="currentUserId"
          [gateName]="data.gateName"
          [castCommitted]="castCommitted"
          [assessmentLinkUrl]="assessmentLinkUrl">
        </app-gate-consultation-section>

        <!-- Contract GA-1 (D-579): post-decision, all attempt answers are
             visible to the trio and consulted on the gate record. -->
        <app-gate-assessment-display
          *ngIf="(record?.gate_status === 'approved' || record?.gate_status === 'returned')
                 && (record?.assessments?.length ?? 0) > 0"
          [rows]="approverVisibleAssessments"
          [notMetFlag]="closeReviewNotMetFlag"
          (verdictLinkClick)="scrollToVerdictBlock()"
          title="Gate assessments">
        </app-gate-assessment-display>

        <!-- THREAD & CONDITIONS — Contract G6 (D-565). One line, one tap deep. -->
        <app-gate-thread-conditions
          *ngIf="record?.gate_record_id"
          [gateRecordId]="record!.gate_record_id"
          [canManageConditions]="!!record?.current_user_gate_authority?.can_approve || !!data.callerCanSubmitGates"
          (openConditionsCount)="philOpenConditions = $event">
        </app-gate-thread-conditions>

        <!-- GATE CHECKLIST — hidden entirely when the gate defines none
             (Phil 2026-07-26: no "no items" filler). -->
        <section *ngIf="data.checklist.length > 0" class="grm-section">
          <div class="grm-label">Gate Checklist</div>
          <!-- Two columns to save vertical space. -->
          <div class="grm-checklist-grid">
            <div *ngFor="let item of data.checklist" class="grm-checklist-row">
              <span class="grm-checklist-icon"
                    [style.color]="item.met ? '#2e7d32' : '#f5a623'">
                {{ item.met ? '✓' : '⚠' }}
              </span>
              <span [style.color]="item.met ? 'var(--triarq-color-text-primary)' : 'var(--triarq-color-text-secondary)'">
                {{ item.label }}
              </span>
            </div>
          </div>
        </section>

        <!-- REVIEW NOTES (returned/blocked notes only).
             WS2.3 (D-469): notes are the approver's return/block reason. Once the gate is
             re-submitted (gate_status → awaiting_approval) the prior return notes must NOT be
             visible in the active sub-panel. Gating to returned/blocked hides them on re-submit
             without nulling the record (notes stay on gate_records for history). D-345 forbids
             copying approver_notes into the event log, so display-gating — not event-log move —
             is how "cleared from active display" is satisfied. See CC-30. -->
        <section *ngIf="record?.approver_notes && (record?.gate_status === 'returned' || record?.gate_status === 'blocked')"
                 class="grm-section">
          <div class="grm-label">Review Notes</div>
          <div class="grm-review-notes">{{ record!.approver_notes }}</div>
        </section>

        <!-- ── CONDITIONS (Phil 2026-07-26): prominent, durable work items.
             Open ones block approval AND resubmission; resolved/withdrawn
             stay visible with their fate. -->
        <section *ngIf="gateConditions.length > 0 && record?.gate_status !== 'approved'"
                 class="grm-section"
                 style="border:1px solid #f5a623;border-radius:8px;padding:10px 12px;background:#FFFDF5;">
          <div class="grm-label" style="color:#B26A00;">
            {{ openGateConditions.length > 0
                ? (record?.gate_status === 'returned'
                    ? 'Returned with conditions — resolve these before resubmitting'
                    : 'Open conditions — must be resolved before this gate can be approved')
                : 'Conditions — all addressed' }}
          </div>
          <div *ngFor="let c of gateConditions"
               style="display:flex;align-items:baseline;gap:8px;padding:4px 0;flex-wrap:wrap;">
            <span [style.color]="c.condition_status === 'open' ? '#f5a623'
                                  : c.condition_status === 'resolved' ? '#2e7d32' : '#757575'">
              {{ c.condition_status === 'open' ? '⚠' : c.condition_status === 'resolved' ? '✓' : '⊘' }}
            </span>
            <span style="flex:1;min-width:0;font:400 12px/1.4 Roboto,sans-serif;"
                  [style.text-decoration]="c.condition_status === 'withdrawn' ? 'line-through' : 'none'">
              {{ c.condition_text }}
              <span *ngIf="c.resolution_note" style="font-style:italic;color:#5A5A5A;">
                — {{ c.resolution_note }}</span>
            </span>
            <ng-container *ngIf="c.condition_status === 'open'">
              <button *ngIf="canActOnConditions" type="button" class="grm-btn-secondary"
                      style="padding:2px 10px;font-size:11px;"
                      [disabled]="conditionBusyId === c.condition_id"
                      (click)="resolveCondition(c)">
                {{ conditionBusyId === c.condition_id ? 'Saving…' : 'Mark resolved' }}
              </button>
              <button *ngIf="canWithdrawConditions && withdrawingId !== c.condition_id"
                      type="button"
                      style="background:none;border:none;color:#757575;cursor:pointer;font-size:11px;text-decoration:underline;"
                      (click)="withdrawingId = c.condition_id; withdrawReason = ''">
                No longer applies…
              </button>
              <span *ngIf="withdrawingId === c.condition_id"
                    style="display:flex;gap:6px;align-items:center;flex-basis:100%;">
                <input type="text" maxlength="300" placeholder="Why it no longer applies (required)"
                       [(ngModel)]="withdrawReason" [ngModelOptions]="{standalone: true}"
                       style="flex:1;border:1px solid #B9C4CE;border-radius:5px;padding:4px 8px;font:400 12px Roboto,sans-serif;" />
                <button type="button" class="grm-btn-secondary" style="padding:2px 10px;font-size:11px;"
                        [disabled]="!withdrawReason.trim() || conditionBusyId === c.condition_id"
                        (click)="confirmWithdraw(c)">
                  {{ conditionBusyId === c.condition_id ? 'Saving…' : 'Withdraw' }}
                </button>
                <button type="button" style="background:none;border:none;color:#757575;cursor:pointer;font-size:11px;"
                        (click)="withdrawingId = null">Cancel</button>
              </span>
            </ng-container>
          </div>
          <div *ngIf="conditionActionError" class="oi-field-error">{{ conditionActionError }}</div>
        </section>

        <!-- ── ACTION AREA — context-sensitive by gate state ──────────────── -->

        <!-- Submitted-meta (shown above action buttons during awaiting_approval) -->
        <div *ngIf="record?.gate_status === 'awaiting_approval' && record?.submitted_at"
             class="grm-submitted-meta"
             [title]="record!.submitted_at!">
          Submitted {{ submittedRelative(record!.submitted_at) }}
          by {{ record!.submitted_by_display_name ?? 'Unknown' }}<ng-container
            *ngIf="canShowApproverActions && !record?.l1_consensus"> — awaiting your approval</ng-container>
        </div>

        <!-- D-200 Pattern 3: inline error block -->
        <div *ngIf="actionError" class="oi-inline-error">
          <div class="oi-inline-error-primary">{{ actionError }}</div>
          <div *ngIf="actionHint" class="oi-inline-error-secondary">{{ actionHint }}</div>
        </div>

        <!-- DEFAULT action area — replaced inline by confirmation when active -->
        <ng-container *ngIf="confirmMode === 'none'">

          <!-- D-447 / D-449: skipped gate state — hollow Oravive badge,
               no Submit / Approve / Return, Backdate affordance. -->
          <ng-container *ngIf="isSkippedGate">
            <div style="display:inline-flex;align-items:center;gap:8px;padding:4px 12px 4px 8px;
                        border-radius:999px;background:rgba(233,97,39,0.06);margin-bottom:8px;">
              <span style="width:14px;height:14px;box-sizing:border-box;background:transparent;
                           border:2px solid #E96127;border-radius:2px;transform:rotate(45deg);
                           flex-shrink:0;"></span>
              <span style="font-size:12px;font-weight:600;color:#E96127;letter-spacing:0.04em;">Skipped</span>
            </div>
            <div class="grm-meta">
              This gate was skipped — the Initiative entered OI Trust past this
              gate. If it was completed outside OI Trust, you can record the
              actual date below.
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;max-width:280px;">
              <label class="grm-label-strong" for="grm-backdate-date">
                Actual completion date
              </label>
              <input id="grm-backdate-date"
                     type="date"
                     [value]="backdateDateInput"
                     [disabled]="processing"
                     (input)="onBackdateInput($any($event.target).value)"
                     style="box-sizing:border-box;width:100%;border:1.5px solid var(--triarq-color-border);
                            border-radius:5px;padding:8px 10px;font-size:13px;font-family:var(--triarq-font-family);" />
              <div *ngIf="backdateError" class="oi-field-error">
                {{ backdateError }}
              </div>
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing || !backdateDateInput"
                      (click)="onBackdateRequest()">
                Record Date
              </button>
            </div>
          </ng-container>

          <!-- Contract 40 follow-on (Phil 2026-07-30): missing recommended
               artifacts — amber, advisory, never blocking. Placed OUTSIDE the
               submit/approve blocks deliberately so the submitter AND the
               approver both see the same omissions while the gate is open.
               Replaces the Context Brief hard stop at Go to Build. -->
          <div *ngIf="data.artifactWarnings.length > 0" class="grm-artifact-warn">
            <div class="grm-artifact-warn-title">
              ⚠ Recommended document{{ data.artifactWarnings.length === 1 ? '' : 's' }} not attached
            </div>
            <div *ngFor="let name of data.artifactWarnings" class="grm-artifact-warn-row">• {{ name }}</div>
            <div class="grm-artifact-warn-foot">
              This does not block the gate. Attach in the Artifacts section, or proceed and note why it is not needed.
            </div>
          </div>

          <!-- Not yet active — advancement guidance, no action -->
          <div *ngIf="!record && isNotYetActive" class="grm-meta">
            Advance the Initiative through earlier stages to unlock this Gate.
          </div>

          <!-- pending / not_started — Submit for Approval (DS/CB) -->
          <ng-container *ngIf="canShowSubmit">
            <!-- CC-38 f13: hard stops — D-140 blocked-action UX. -->
            <div *ngIf="data.hardStops.length > 0" class="grm-hardstops">
              <div class="grm-hardstops-title">This gate cannot be submitted yet</div>
              <div *ngFor="let stop of data.hardStops" class="grm-hardstops-row">• {{ stop }}</div>
              <!-- Phil 2026-07-24: cleanup/testing lever — Phil only. -->
              <button *ngIf="viewerIsPhil"
                      class="grm-btn-secondary" type="button"
                      style="margin-top:8px;"
                      [disabled]="processing"
                      (click)="confirmMode = 'phil-override-submit'">
                Submit anyway (override)…
              </button>
            </div>
            <!-- Contract GA-1 (D-579): submitter self-assessment — required
                 from genuine trio participants before Submit enables. Hidden
                 for an Admin submitting on behalf (server skips them too). -->
            <app-gate-assessment-form
              *ngIf="viewerIsTrioParticipant"
              [gateKey]="data.gateName"
              role="submitter"
              [linkUrl]="assessmentLinkUrl"
              [disabled]="processing"
              (changed)="submitAssessment = $event">
            </app-gate-assessment-form>
            <!-- Contract 39 (D-585): Close Review outcome verification block.
                 Submission is blocked until actual result, verdict, and
                 evidence/explanation are populated. Not met is a passing state. -->
            <div *ngIf="data.gateName === 'close_review'" class="grm-note-field">
              <div class="grm-label">Outcome verification</div>
              <div class="grm-meta">
                Close Review verifies whether this Initiative met the outcome it
                declared. Not met is an honest close — failed work closes honestly.
              </div>
              <div class="grm-label" style="margin-top:8px;">Declared outcome</div>
              <div class="grm-submission-note">
                {{ data.cycle.outcome_statement
                    || 'No Outcome Statement was declared — state the intended outcome retrospectively in the actual result below.' }}
              </div>
              <label class="grm-label" for="grm-cr-actual" style="margin-top:8px;display:block;">Actual result</label>
              <textarea id="grm-cr-actual" class="grm-note-textarea" rows="2"
                        [disabled]="processing"
                        [(ngModel)]="crActualDraft"
                        placeholder="What actually happened against the declared outcome?"></textarea>
              <div class="grm-label" style="margin-top:8px;">Outcome verdict</div>
              <div style="display:flex;gap:16px;padding:4px 0;">
                <label style="font:400 13px Roboto;display:inline-flex;align-items:center;gap:6px;">
                  <input type="radio" name="cr-verdict" value="met"
                         [disabled]="processing" [(ngModel)]="crVerdict" /> Met — demonstrated
                </label>
                <label style="font:400 13px Roboto;display:inline-flex;align-items:center;gap:6px;">
                  <input type="radio" name="cr-verdict" value="not_met"
                         [disabled]="processing" [(ngModel)]="crVerdict" /> Not met — documented
                </label>
              </div>
              <label class="grm-label" for="grm-cr-evidence" style="margin-top:4px;display:block;">
                {{ crVerdict === 'not_met' ? 'What happened' : 'Where is the result demonstrated' }}
              </label>
              <textarea id="grm-cr-evidence" class="grm-note-textarea" rows="2"
                        [disabled]="processing"
                        [(ngModel)]="crEvidenceDraft"
                        [placeholder]="crVerdict === 'not_met'
                          ? 'Explain what happened — this closes the Initiative honestly.'
                          : 'Where the result is demonstrated (report, dashboard, metric…).'"></textarea>
            </div>
            <!-- D-489: submission justification — encouraged, not required -->
            <div class="grm-note-field">
              <label class="grm-label" for="grm-submission-note">Why is this gate ready?</label>
              <textarea id="grm-submission-note"
                        class="grm-note-textarea"
                        rows="2"
                        [disabled]="processing"
                        [(ngModel)]="submissionNoteDraft"
                        placeholder="Optional — a short justification the approver and consulted parties will see."></textarea>
            </div>
            <!-- Conditions loop: open conditions block resubmission (server twin). -->
            <div *ngIf="openGateConditions.length > 0" class="grm-meta" style="color:#B26A00;">
              {{ openGateConditions.length }} open condition{{ openGateConditions.length === 1 ? '' : 's' }}
              must be resolved (see the Conditions section above) before this gate can be resubmitted.
            </div>
            <button class="grm-btn-primary"
                    type="button"
                    [disabled]="processing || data.hardStops.length > 0
                                || openGateConditions.length > 0
                                || (viewerIsTrioParticipant && !submitAssessment.complete)
                                || !closeReviewBlockComplete"
                    (click)="onSubmit()">
              {{ processing && processingAction === 'submit'
                  ? (resubmitMode ? 'Re-submitting…' : 'Submitting…')
                  : (resubmitMode ? 'Re-submit for Approval' : 'Submit for Approval') }}
            </button>
            <div *ngIf="!data.callerCanSubmitGates" class="grm-meta">
              Only the assigned Domain Capability Strategist, Engineering Product Owner, Domain Outcome Lead, or an Admin can submit this Gate.
            </div>
          </ng-container>

          <!-- awaiting_approval (DS/CB viewing) — Withdraw -->
          <ng-container *ngIf="canShowWithdraw">
            <div class="grm-meta">Awaiting {{ approverNameOrDefault }} approval.</div>
            <button class="grm-btn-secondary"
                    type="button"
                    [disabled]="processing"
                    (click)="confirmMode = 'withdraw'">
              Withdraw Submission
            </button>
          </ng-container>

          <!-- Contract G7 (D-565 item 4): THE waiting-on line — identical on
               every surface (computed once, server-side). -->
          <!-- Phil 2026-07-26 declutter: suppressed when the viewer IS the
               single approver — the submitted-meta line already says
               "awaiting your approval". L1 rosters stay (multi-party). -->
          <div *ngIf="record?.gate_status === 'awaiting_approval' && (record?.waiting_on || record?.l1_waiting_on)
                       && !(canShowApproverActions && !record?.l1_consensus)"
               class="grm-meta">
            {{ record?.waiting_on?.line ?? ('Waiting on: ' + l1WaitingLine) }}
          </div>
          <!-- G7 (AC #3): trio roster per party on L1 gates. -->
          <div *ngIf="record?.gate_status === 'awaiting_approval' && record?.l1_waiting_on?.approved_trio_display_names?.length"
               class="grm-meta">
            Trio approved: {{ record!.l1_waiting_on!.approved_trio_display_names!.join(', ') }}
          </div>

          <!-- awaiting_approval (Approver viewing) — Approve + Return -->
          <ng-container *ngIf="canShowApproverActions">
            <!-- Phil 2026-07-26 declutter: single-approver duplicate line
                 removed (submitted-meta covers it); L1 keeps its explainer. -->
            <div *ngIf="record?.l1_consensus" class="grm-meta">
              {{ gateLabel + ' collects trio and consulted approvals — yours is pending.' }}
            </div>
            <!-- Contract GA-1 (Phil 2026-07-26): everything BEFORE the Approve
                 button — answers collected so far, then your own assessment.
                 Approve stays disabled until your assessment is complete. -->
            <app-gate-assessment-display
              *ngIf="(record?.assessments?.length ?? 0) > 0"
              [rows]="approverVisibleAssessments"
              title="Answers collected so far">
            </app-gate-assessment-display>
            <app-gate-assessment-form
              *ngIf="approveAssessmentRequired"
              [gateKey]="data.gateName"
              [role]="record?.l1_consensus ? 'trio_member' : 'approver'"
              [linkUrl]="assessmentLinkUrl"
              [disabled]="processing"
              (changed)="approveAssessment = $event">
            </app-gate-assessment-form>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing || (approveAssessmentRequired && !approveAssessment.complete)"
                      (click)="confirmMode = 'approve'">
                Approve
              </button>
              <button class="grm-btn-secondary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'return'">
                Return
              </button>
              <button class="grm-btn-secondary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'return-with-conditions'">
                Return with Set Conditions
              </button>
              <button *ngIf="showPhilOverrideApprove"
                      class="grm-btn-secondary" type="button"
                      style="margin-left:auto;"
                      [disabled]="processing"
                      (click)="confirmMode = 'phil-override-approve'">
                Override: approve without requirements…
              </button>
            </div>
          </ng-container>

          <!-- Phil 2026-07-26: override lever when NO normal action row renders
               for Phil (not the approver / not trio) — right-justified, and
               only when actually needed (showPhilOverrideApprove). -->
          <div *ngIf="showPhilOverrideApprove && !canShowApproverActions
                       && !(record?.gate_status === 'pending' && record?.current_user_gate_authority?.can_approve)"
               class="grm-action-row" style="justify-content:flex-end;">
            <button class="grm-btn-secondary" type="button"
                    [disabled]="processing"
                    (click)="confirmMode = 'phil-override-approve'">
              Override: approve without requirements…
            </button>
          </div>

          <!-- awaiting_approval — neither approver nor submitter (read-only) -->
          <div *ngIf="record?.gate_status === 'awaiting_approval'
                       && !record?.current_user_gate_authority?.can_approve
                       && !record?.current_user_gate_authority?.can_withdraw"
               class="grm-meta">
            Only the designated approver or Phil can record a decision on this gate.
          </div>

          <!-- Phil 2026-07-26: the standalone override button moved into the
               action rows above (same row, right-justified, only when plain
               Approve can't do the job — showPhilOverrideApprove). -->

          <!-- Contract G8 (D-560): the loud IE override — release valve. -->
          <button *ngIf="canShowIeOverride"
                  class="grm-btn-secondary" type="button"
                  [disabled]="processing"
                  (click)="confirmMode = 'ie-override'">
            Initiative Executive Override…
          </button>

          <!-- approved — the approver has no further action, but a consulted
               reviewer can still record their response in the Consulted section above. -->
          <div *ngIf="record?.gate_status === 'approved'" class="grm-meta">
            This gate has been approved. Consulted reviewers can still record their response above.
          </div>

          <!-- legacy 'pending' with approver authority -->
          <ng-container *ngIf="record?.gate_status === 'pending'
                                 && record?.current_user_gate_authority?.can_approve">
            <div class="grm-meta">
              This gate was not submitted through the standard approval flow. You can approve or return it directly.
            </div>
            <app-gate-assessment-form
              *ngIf="approveAssessmentRequired"
              [gateKey]="data.gateName"
              [role]="record?.l1_consensus ? 'trio_member' : 'approver'"
              [linkUrl]="assessmentLinkUrl"
              [disabled]="processing"
              (changed)="approveAssessment = $event">
            </app-gate-assessment-form>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing || (approveAssessmentRequired && !approveAssessment.complete)"
                      (click)="confirmMode = 'approve'">
                Approve
              </button>
              <button class="grm-btn-secondary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'return'">
                Return
              </button>
              <button *ngIf="showPhilOverrideApprove"
                      class="grm-btn-secondary" type="button"
                      style="margin-left:auto;"
                      [disabled]="processing"
                      (click)="confirmMode = 'phil-override-approve'">
                Override: approve without requirements…
              </button>
            </div>
          </ng-container>
        </ng-container>

        <!-- ── CONFIRM: Approve (D-183 inline replacement; D-200 Pattern 2) ── -->
        <div *ngIf="confirmMode === 'approve'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              {{ record?.l1_consensus
                  ? 'Approving records your Level 1 approval. The gate passes — and the Initiative advances — the moment the last collected party approves.'
                  : 'Approving this gate will advance the Initiative. This cannot be undone without a stage regression.' }}
            </div>
            <!-- Contract GA-1 (Phil 2026-07-26): the assessment now lives on
                 the main gate panel BEFORE the Approve button — this confirm
                 is decision-only (warning + optional note). -->
            <input type="text" maxlength="500"
                   placeholder="Approver note (optional)"
                   [(ngModel)]="approveNoteDraft" [ngModelOptions]="{standalone: true}"
                   [disabled]="processing"
                   style="width:100%;border:1px solid #B9C4CE;border-radius:5px;
                          padding:6px 10px;font:400 12px Roboto,sans-serif;margin-bottom:8px;" />
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing || (approveAssessmentRequired && !approveAssessment.complete)"
                      (click)="onApproveConfirm()">
                {{ processing && processingAction === 'approve' ? 'Approving…' : 'Confirm Approval' }}
              </button>
              <button class="grm-btn-ghost"
                      type="button"
                      [disabled]="processing"
                      (click)="cancelConfirm()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Phil override submit (Phil 2026-07-24) ────────────── -->
        <div *ngIf="confirmMode === 'phil-override-submit'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              <strong>Override.</strong> This submits {{ gateLabel }} bypassing every
              submission rule — sizing, role assignments, artifacts, Jira, and AI checks.
              The override is recorded in the Initiative's activity log. Continue?
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button" [disabled]="processing"
                      (click)="onPhilOverrideSubmit()">
                {{ processing && processingAction === 'submit' ? 'Submitting…' : 'Confirm Override Submit' }}
              </button>
              <button class="grm-btn-ghost" type="button" [disabled]="processing"
                      (click)="cancelConfirm()">Cancel</button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Phil override approve (Phil 2026-07-24) ───────────── -->
        <div *ngIf="confirmMode === 'phil-override-approve'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              <strong>Override.</strong> This approves {{ gateLabel }} immediately —
              bypassing trio consensus, open conditions, and consultation returns — and
              advances the Initiative. The override is recorded in the activity log. Continue?
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button" [disabled]="processing"
                      (click)="onPhilOverrideApprove()">
                {{ processing && processingAction === 'approve' ? 'Approving…' : 'Confirm Override Approval' }}
              </button>
              <button class="grm-btn-ghost" type="button" [disabled]="processing"
                      (click)="cancelConfirm()">Cancel</button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Skip interstitial (D-448) ─────────────────────────── -->
        <div *ngIf="confirmMode === 'skip-interstitial'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              The following gates will be marked as skipped:
            </div>
            <ul style="margin:6px 0 10px;padding-left:20px;font-size:12px;color:var(--triarq-color-text-primary);">
              <li *ngFor="let label of pendingSkipLabels">{{ label }}</li>
            </ul>
            <div class="oi-confirm-text">
              Continue to submit <strong>{{ gateLabel }}</strong> for approval?
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
                      (click)="onConfirmSkip()">
                {{ processing && processingAction === 'confirm-skip' ? 'Submitting…' : 'Skip & Submit' }}
              </button>
              <button class="grm-btn-ghost"
                      type="button"
                      [disabled]="processing"
                      (click)="onCancelSkip()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONTRACT G3 (D-567): sizing required interstitial ──────────── -->
        <div *ngIf="confirmMode === 'sizing-required'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              Sizing is required before this gate can be submitted. Answer the
              five questions — the submission continues once sizing is saved.
            </div>
            <app-initiative-sizing-form
              [dcsUserId]="data.cycle.assigned_dcs_user_id ?? null"
              (payloadChange)="onSizingPayloadChange($event)">
            </app-initiative-sizing-form>
            <!-- Contract 39 (D-584): cast confirmation — the last cheap moment.
                 Shown beside the D-567 sizing confirmation; proceeding confirms
                 the cast (one-tap when it's right, not a re-selection). -->
            <div *ngIf="data.gateName === 'go_to_build'" style="margin-top:10px;">
              <div class="grm-label">Consultation cast</div>
              <div class="grm-meta">
                These parties are Consulted from Go to Build onward. Proceeding
                confirms the cast; removing a Consulted party after Go to Build
                requires a note and notifies them.
              </div>
              <div *ngFor="let m of castList" style="display:flex;align-items:center;gap:8px;padding:3px 0;">
                <span style="display:inline-block;padding:3px 10px;border-radius:999px;
                             background:rgba(37,112,153,0.08);color:#257099;font:400 12px Roboto;">
                  {{ m.label }}
                </span>
                <span style="font:400 11px Roboto;color:#9E9E9E;">{{ m.origin }}</span>
              </div>
              <div *ngIf="castList.length === 0" class="grm-meta">
                No Consulted parties are attached beyond the Initiative trio.
              </div>
            </div>
            <div *ngIf="sizingSaveError" class="oi-inline-error" role="alert">
              <div class="oi-inline-error-primary">{{ sizingSaveError }}</div>
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button"
                      [disabled]="processing"
                      (click)="onSaveSizingAndSubmit()">
                {{ processing && processingAction === 'save-sizing' ? 'Saving…' : 'Save Sizing & Submit Gate' }}
              </button>
              <button class="grm-btn-ghost" type="button"
                      [disabled]="processing"
                      (click)="onCancelSizing()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONTRACT G3: Go to Build confirm — re-present the answers ──── -->
        <div *ngIf="confirmMode === 'sizing-confirm'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              Confirm the sizing answers before submitting Go to Build — do they
              still look right?
            </div>
            <app-initiative-sizing-form
              [initialSizing]="confirmSizing"
              [dcsUserId]="data.cycle.assigned_dcs_user_id ?? null"
              [readOnly]="true"
              [showGovernancePanel]="false"
              (payloadChange)="onSizingPayloadChange($event)">
            </app-initiative-sizing-form>
            <!-- Contract 39 (D-584): cast confirmation — the last cheap moment.
                 Shown beside the D-567 sizing confirmation; proceeding confirms
                 the cast (one-tap when it's right, not a re-selection). -->
            <div *ngIf="data.gateName === 'go_to_build'" style="margin-top:10px;">
              <div class="grm-label">Consultation cast</div>
              <div class="grm-meta">
                These parties are Consulted from Go to Build onward. Proceeding
                confirms the cast; removing a Consulted party after Go to Build
                requires a note and notifies them.
              </div>
              <div *ngFor="let m of castList" style="display:flex;align-items:center;gap:8px;padding:3px 0;">
                <span style="display:inline-block;padding:3px 10px;border-radius:999px;
                             background:rgba(37,112,153,0.08);color:#257099;font:400 12px Roboto;">
                  {{ m.label }}
                </span>
                <span style="font:400 11px Roboto;color:#9E9E9E;">{{ m.origin }}</span>
              </div>
              <div *ngIf="castList.length === 0" class="grm-meta">
                No Consulted parties are attached beyond the Initiative trio.
              </div>
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button"
                      [disabled]="processing"
                      (click)="onConfirmSizingProceed()">
                Confirm & Submit
              </button>
              <button class="grm-btn-ghost" type="button"
                      [disabled]="processing"
                      (click)="onCancelSizing()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONTRACT G8 (D-560): IE override — loud, reason required ───── -->
        <div *ngIf="confirmMode === 'ie-override'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              This approves the gate as an Initiative Executive override — the
              assigned approver is notified, the override is recorded on the
              gate face and counted in analytics. One-line reason required.
            </div>
            <input type="text" maxlength="300" placeholder="Why is this override warranted?"
                   [(ngModel)]="ieOverrideReasonDraft" [ngModelOptions]="{standalone: true}"
                   [disabled]="processing"
                   style="width:100%;border:1px solid #B9C4CE;border-radius:5px;
                          padding:6px 10px;font:400 12px Roboto,sans-serif;margin-bottom:8px;" />
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button"
                      [disabled]="processing || !ieOverrideReasonDraft.trim()"
                      (click)="onIeOverrideConfirm()">
                {{ processing && processingAction === 'approve' ? 'Overriding…' : 'Override & Approve' }}
              </button>
              <button class="grm-btn-ghost" type="button" [disabled]="processing" (click)="cancelConfirm()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONTRACT G8 (D-569): approving over a returned consultation ── -->
        <div *ngIf="confirmMode === 'over-returned-reason'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              A consulted party returned this gate{{ overReturnedParties.length ? ' (' + overReturnedParties.join(', ') + ')' : '' }}.
              Approving over a returned consultation is recorded on the gate face
              and the returning party is notified with your reasoning. Reason required.
            </div>
            <input type="text" maxlength="500" placeholder="Your reasoning (required — D-569)"
                   [(ngModel)]="overReturnedReasonDraft" [ngModelOptions]="{standalone: true}"
                   [disabled]="processing"
                   style="width:100%;border:1px solid #B9C4CE;border-radius:5px;
                          padding:6px 10px;font:400 12px Roboto,sans-serif;margin-bottom:8px;" />
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button"
                      [disabled]="processing || !overReturnedReasonDraft.trim()"
                      (click)="onOverReturnedConfirm()">
                {{ processing && processingAction === 'approve' ? 'Approving…' : 'Approve Over Return' }}
              </button>
              <button class="grm-btn-ghost" type="button" [disabled]="processing" (click)="cancelConfirm()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── BLOCKED: Deploy gate cannot be skipped (D-450) ─────────────── -->
        <div *ngIf="confirmMode === 'deploy-blocked'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              The Deploy gate cannot be skipped.
            </div>
            <div class="oi-confirm-text">
              To submit Go to Deploy for approval, the following gates must be
              completed or backdated first:
            </div>
            <ul style="margin:6px 0 10px;padding-left:20px;font-size:12px;color:var(--triarq-color-text-primary);">
              <li *ngFor="let label of deployBlockedLabels">{{ label }}</li>
            </ul>
            <div class="oi-confirm-text">
              You can backdate gates that were completed outside OI Trust.
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-secondary"
                      type="button"
                      (click)="onCloseDeployBlocked()">
                Close
              </button>
              <!-- CC-0804-10: Phil-only override. The backend has allowed this
                   since 2026-07-24; there was simply no control to arm it from
                   here, so the flow dead-ended. -->
              <button *ngIf="viewerIsPhil"
                      class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
                      (click)="onPhilOverrideSkip()">
                Skip anyway (override)…
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Submitted for approval — Contract 29 WS3 (D-463/AC-32) ── -->
        <div *ngIf="confirmMode === 'submitted'"
             style="display:flex;gap:12px;padding:14px;border-radius:8px;
                    background:rgba(46,125,50,0.06);border-left:3px solid #2e7d32;margin-top:8px;">
          <div style="color:#2e7d32;font-size:18px;line-height:1;">✓</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text" *ngIf="submittedApprover?.display_name">
              Submitted for approval by
              <span style="display:inline-block;padding:2px 10px;border-radius:999px;
                           background:rgba(37,112,153,0.10);color:#257099;font-size:12px;font-weight:500;">
                {{ submittedApprover!.display_name }}</span>.
            </div>
            <div class="oi-confirm-text" *ngIf="!submittedApprover?.display_name">
              Submitted for approval.
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button" (click)="onSubmittedDone()">Done</button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Backdate skipped gate (D-449) ─────────────────────── -->
        <div *ngIf="confirmMode === 'backdate-confirm'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              This will mark <strong>{{ gateLabel }}</strong> as completed on
              <strong>{{ backdateDateInput }}</strong> and remove the skipped
              status. The gate will be recorded as complete without a formal
              approval. Continue?
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
                      (click)="onConfirmBackdate()">
                {{ processing && processingAction === 'backdate' ? 'Recording…' : 'Confirm' }}
              </button>
              <button class="grm-btn-ghost"
                      type="button"
                      [disabled]="processing"
                      (click)="onCancelBackdate()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Withdraw (D-183 inline replacement) ──────────────── -->
        <div *ngIf="confirmMode === 'withdraw'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              Withdrawing this submission will reset the gate to Not Started.
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
                      (click)="onWithdrawConfirm()">
                {{ processing && processingAction === 'withdraw' ? 'Withdrawing…' : 'Confirm Withdrawal' }}
              </button>
              <button class="grm-btn-ghost"
                      type="button"
                      [disabled]="processing"
                      (click)="cancelConfirm()">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Contract 24 (AC-18 / D-437): post-approval WIP alert.
             D-200 Pattern 2 (amber). Contract 40 follow-on (CC-40-J): the
             artifact "typically attached" reminder was removed from this step —
             it no longer holds the modal after approval. WIP alert only. -->
        <div *ngIf="confirmMode === 'post-approve-warning'" class="oi-warn-pattern2">
          <div class="oi-warn-icon">⚠</div>
          <div class="oi-warn-body">
            <div class="oi-warn-text" *ngIf="postApproveWipWarning">
              <strong>WIP alert:</strong> {{ postApproveWipWarning.message }}
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      (click)="acknowledgePostApproveWarning()">
                Acknowledge
              </button>
            </div>
          </div>
        </div>

        <!-- ── CONFIRM: Return with Set Conditions (Phil 2026-07-26) ──────── -->
        <div *ngIf="confirmMode === 'return-with-conditions'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              Returning with conditions: the gate goes back to the team, and it
              cannot be resubmitted until every condition below is marked
              resolved (or you withdraw it).
            </div>
            <label class="grm-label-strong">Return notes <span class="grm-required">*</span></label>
            <textarea rows="2" class="grm-textarea"
                      [(ngModel)]="rwcNotes" [ngModelOptions]="{standalone: true}"
                      [disabled]="processing"
                      placeholder="The overall message to the team."></textarea>
            <label class="grm-label-strong" style="margin-top:6px;">Conditions to resolve <span class="grm-required">*</span></label>
            <div *ngFor="let d of rwcConditionDrafts; let i = index; trackBy: trackByIndex"
                 style="display:flex;gap:6px;margin:3px 0;">
              <input type="text" maxlength="500"
                     [(ngModel)]="rwcConditionDrafts[i]" [ngModelOptions]="{standalone: true}"
                     [disabled]="processing"
                     placeholder="What needs fixing — one item per line"
                     style="flex:1;border:1px solid #B9C4CE;border-radius:5px;padding:5px 8px;font:400 12px Roboto,sans-serif;" />
              <button *ngIf="rwcConditionDrafts.length > 1" type="button"
                      style="background:none;border:none;color:#B3261E;cursor:pointer;"
                      [disabled]="processing"
                      (click)="removeRwcConditionRow(i)">✕</button>
            </div>
            <button type="button"
                    style="background:none;border:none;color:#257099;cursor:pointer;font-size:12px;text-decoration:underline;padding:0;"
                    [disabled]="processing"
                    (click)="addRwcConditionRow()">+ Add another condition</button>
            <div *ngIf="rwcError" class="oi-field-error">{{ rwcError }}</div>
            <div class="grm-action-row">
              <button class="grm-btn-primary" type="button" [disabled]="processing"
                      (click)="onReturnWithConditionsConfirm()">
                {{ processing && processingAction === 'return' ? 'Returning…' : 'Return with Conditions' }}
              </button>
              <button class="grm-btn-ghost" type="button" [disabled]="processing"
                      (click)="cancelConfirm()">Cancel</button>
            </div>
          </div>
        </div>

        <!-- ── RETURN form (single-step — notes are required) ─────────────── -->
        <form *ngIf="confirmMode === 'return'"
              [formGroup]="returnForm"
              (ngSubmit)="onReturnConfirm()"
              class="grm-return-form">
          <label class="grm-label-strong" for="return-notes">
            Return notes <span class="grm-required">*</span>
          </label>
          <textarea id="return-notes"
                    formControlName="approver_notes"
                    rows="3"
                    placeholder="Describe what needs to change before re-submission."
                    class="grm-textarea"
                    [class.oi-input-error]="returnNotesError"></textarea>
          <div *ngIf="returnNotesError" class="oi-field-error">
            Return notes are required.
          </div>
          <div class="grm-action-row">
            <button type="submit"
                    class="grm-btn-primary"
                    [disabled]="processing">
              {{ processing && processingAction === 'return' ? 'Returning…' : 'Confirm Return' }}
            </button>
            <button type="button"
                    class="grm-btn-ghost"
                    [disabled]="processing"
                    (click)="cancelConfirm()">
              Cancel
            </button>
          </div>
        </form>

      </div>

      <!-- ── Footer ───────────────────────────────────────────────────────── -->
      <div class="grm-footer">
        <button type="button"
                class="grm-btn-ghost"
                [disabled]="processing"
                (click)="onDismiss()">
          Cancel
        </button>
      </div>

      <!-- S-028 Context D: full non-interactive overlay during MCP writes -->
      <div *ngIf="processing" class="grm-processing-overlay" aria-hidden="true">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .grm-shell {
      position: relative; background: #fff; border-radius: 10px;
      font-family: var(--triarq-font-family); color: var(--triarq-color-text-primary);
      max-height: calc(100vh - 32px); display: flex; flex-direction: column;
    }
    .grm-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; padding: 18px 20px 12px;
      border-bottom: 1px solid var(--triarq-color-border);
    }
    .grm-titles { min-width: 0; }
    .grm-title { font-size: 18px; font-weight: 600; }
    .grm-subtitle { font-size: 12px; color: var(--triarq-color-text-secondary); margin-top: 2px; }
    .grm-coaching { font-size: 11px; font-style: italic; color: #757575; margin-top: 4px; max-width: 560px; line-height: 1.5; }
    .grm-coaching-more { color: var(--triarq-color-primary, #257099); cursor: pointer; font-style: normal; white-space: nowrap; }
    .grm-close {
      width: 28px; height: 28px; border-radius: 50%; background: none; border: none;
      cursor: pointer; font-size: 22px; line-height: 1;
      color: var(--triarq-color-text-secondary); flex-shrink: 0;
    }
    .grm-close:hover:not(:disabled) { background: rgba(0,0,0,0.05); }
    .grm-body { padding: 14px 20px; overflow-y: auto; flex: 1; }
    .grm-section { margin-bottom: 14px; }
    .grm-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--triarq-color-text-secondary);
      margin-bottom: 6px;
    }
    .grm-label-strong {
      display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;
    }
    .grm-required { color: var(--triarq-color-error); }
    .grm-pill {
      display: inline-flex; align-items: center; padding: 2px 10px;
      border-radius: 999px; font-size: 11px; font-weight: 500;
    }
    .grm-status-row, .grm-routing-row, .grm-action-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .grm-status-hint, .grm-meta, .grm-checklist-empty, .grm-raci-default, .grm-routing-note {
      font-size: 12px; color: var(--triarq-color-text-secondary);
    }
    .grm-meta { margin: 6px 0; }
    .grm-status-error { font-size: 12px; color: var(--triarq-color-error); }
    .grm-milestone { display: flex; gap: 24px; flex-wrap: wrap; font-size: 12px; }
    .grm-routing-row { gap: 8px; font-size: 12px; }
    .grm-raci-badge {
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--triarq-color-primary); color: #fff;
      font-size: 9px; font-weight: 700;
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .grm-raci-role { color: var(--triarq-color-text-secondary); min-width: 76px; }
    .grm-raci-name {
      padding: 2px 10px; border-radius: 999px;
      background: rgba(37,112,153,0.09); color: var(--triarq-color-primary); font-size: 11px;
    }
    .grm-raci-default, .grm-routing-note { font-style: italic; font-size: 11px; }
    .grm-routing-note { margin-top: 4px; }
    /* Gate Status + Milestone Date side by side; stacks when the modal is narrow. */
    .grm-status-milestone-row { display: flex; gap: 32px; flex-wrap: wrap; align-items: flex-start; }
    .grm-status-milestone-row > .grm-section { flex: 1 1 220px; min-width: 200px; }
    /* Two-column checklist — saves vertical height; collapses to one column when narrow. */
    .grm-checklist-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px;
    }
    @media (max-width: 520px) { .grm-checklist-grid { grid-template-columns: 1fr; } }
    .grm-checklist-row {
      display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 12px;
    }
    .grm-checklist-icon { flex-shrink: 0; font-weight: 700; }
    /* CC-38 f13: hard-stop block — red banded warning grammar. */
    .grm-hardstops {
      border-left: 3px solid #D32F2F; background: rgba(211,47,47,0.08);
      border-radius: 0 5px 5px 0; padding: 8px 10px; margin-bottom: 8px;
      font-size: 12px; color: #8E1B1B;
    }
    .grm-hardstops-title { font-weight: 600; margin-bottom: 4px; }
    .grm-hardstops-row { margin-top: 2px; line-height: 1.4; }
    /* Contract 40 follow-on: amber advisory band — deliberately the same
       banded grammar as the red hard-stop block, in warning amber, so the
       visual weight reads as "loud but not blocking". */
    .grm-artifact-warn {
      border-left: 3px solid var(--triarq-color-warning, #F2A620);
      background: rgba(242,166,32,0.10);
      border-radius: 0 5px 5px 0; padding: 8px 10px; margin-bottom: 8px;
      font-size: 12px; color: #8a5b00;
    }
    .grm-artifact-warn-title { font-weight: 600; margin-bottom: 4px; }
    .grm-artifact-warn-row { margin-top: 2px; line-height: 1.4; }
    .grm-artifact-warn-foot { margin-top: 5px; font-style: italic; opacity: 0.85; }
    .grm-review-notes {
      background: var(--triarq-color-background-subtle); border-radius: 6px;
      padding: 8px 12px; font-size: 12px;
    }
    /* D-489: submission justification — read display + submit-time entry field */
    .grm-submission-note {
      background: var(--triarq-color-background-subtle); border-radius: 6px;
      padding: 8px 12px; font-size: 12px; white-space: pre-wrap;
    }
    .grm-note-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
    .grm-note-textarea {
      box-sizing: border-box; width: 100%;
      border: 1.5px solid var(--triarq-color-border); border-radius: 5px;
      padding: 8px 10px; font-size: 13px; font-family: var(--triarq-font-family);
      resize: vertical; outline: none;
    }
    .grm-note-textarea:focus { border-color: var(--triarq-color-primary); }
    .grm-submitted-meta {
      font-size: 11px; color: var(--triarq-color-text-secondary); margin-bottom: 8px;
    }
    .grm-btn-primary, .grm-btn-secondary, .grm-btn-ghost {
      border-radius: 5px; font-size: 13px; cursor: pointer;
      padding: 9px 16px; font-weight: 500;
    }
    .grm-btn-primary {
      border: none; background: var(--triarq-color-primary); color: #fff; font-weight: 600;
    }
    .grm-btn-primary:hover:not(:disabled) { background: var(--triarq-color-primary-dark); }
    .grm-btn-secondary {
      padding: 8px 14px; background: #fff;
      border: 1px solid var(--triarq-color-border);
      color: var(--triarq-color-text-primary);
    }
    .grm-btn-ghost {
      padding: 8px 14px; background: none; border: none;
      color: var(--triarq-color-text-secondary);
    }
    .grm-btn-primary:disabled, .grm-btn-secondary:disabled, .grm-btn-ghost:disabled, .grm-close:disabled {
      opacity: 0.6; cursor: not-allowed;
    }
    .grm-return-form { padding-top: 4px; }
    .grm-textarea {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid var(--triarq-color-border); border-radius: 5px;
      padding: 10px 12px; font-size: 13px; font-family: var(--triarq-font-family);
      resize: vertical; min-height: 84px; margin-bottom: 8px;
    }
    .grm-textarea:focus { outline: none; border-color: var(--triarq-color-primary); }
    .grm-footer {
      display: flex; justify-content: flex-end; padding: 12px 20px;
      border-top: 1px solid var(--triarq-color-border);
    }
    .grm-processing-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.55);
      display: flex; align-items: center; justify-content: center;
      border-radius: 10px; z-index: 5;
    }
    .grm-processing-overlay ion-spinner { color: var(--triarq-color-primary); }
    @media (max-width: 599px) {
      .grm-shell {
        max-height: 100vh; height: 100vh; border-radius: 0;
      }
    }
  `]
})
export class GateRecordModalComponent {
  readonly gateLabel: string;
  readonly gateCoaching: string | null;
  record:    GateRecord | null = null;
  milestone: CycleMilestoneDate | null = null;

  /** Action state machine — drives inline confirmation replacement of action area.
   *  'post-approve-warning' (Contract 24, AC-18): the gate has just been approved
   *  and the response carried a wip_warning and/or suggestion_warnings. The modal
   *  stays open showing the warnings until the approver acknowledges.
   *  Contract 28 / D-448 / D-449 / D-450: three new modes for the gate skip flow.
   *    'skip-interstitial'  — submission attempt found unapproved predecessors;
   *                            user must confirm marking them as skipped.
   *    'deploy-blocked'     — Deploy gate cannot be skipped; shows list of gates
   *                            requiring action; Close-only.
   *    'backdate-confirm'   — user entered an actual_date on a skipped gate;
   *                            confirm before mutating gate state. */
  confirmMode:
    | 'none'
    | 'approve'
    | 'withdraw'
    | 'return'
    | 'post-approve-warning'
    | 'skip-interstitial'
    | 'deploy-blocked'
    | 'submitted'                       // Contract 29 WS3 — post-submit approver confirmation
    | 'backdate-confirm'
    | 'sizing-required'                 // Contract G3 (D-567) — migration interstitial
    | 'sizing-confirm'                  // Contract G3 — Go to Build answer re-presentation
    | 'ie-override'                     // Contract G8 (D-560) — loud override w/ reason
    | 'over-returned-reason'            // Contract G8 (D-569) — reasoning prompt
    | 'phil-override-submit'            // Phil 2026-07-24 — cleanup/testing lever
    | 'phil-override-approve'           // Phil 2026-07-24 — cleanup/testing lever
    | 'return-with-conditions' = 'none'; // Conditions loop (Phil 2026-07-26)
  /** Phil override: when armed, submit/skip calls carry phil_override:true. */
  philOverrideArmed = false;
  /** Contract 29 WS3 (D-463/AC-32): resolved approver shown in the submit confirmation. */
  submittedApprover: { id: string; display_name: string | null } | null = null;
  /** D-489: "Why is this gate ready?" draft — sent with submit, trimmed to null server-side. */
  submissionNoteDraft = '';
  /** G7 (D-565 item 5): the one approver note field on the approve confirm. */
  approveNoteDraft = '';
  /** G8 (D-560/D-569): override + over-returned reasoning drafts. */
  ieOverrideReasonDraft = '';
  overReturnedReasonDraft = '';
  overReturnedParties: string[] = [];

  // GA-1 (D-579): the G7 rotating approvalPurposeReminder is retired from
  // this surface — the assessment header carries the per-gate purpose.

  // ── Contract 39 (D-585): Close Review outcome verdict drafts ───────────────
  crVerdict: '' | 'met' | 'not_met' = '';
  crActualDraft = '';
  crEvidenceDraft = '';

  /** D-585: verdict block complete (always true off close_review). */
  get closeReviewBlockComplete(): boolean {
    if (this.data.gateName !== 'close_review') { return true; }
    return !!this.crVerdict && !!this.crActualDraft.trim() && !!this.crEvidenceDraft.trim();
  }

  /** Contract 40 WS7 (D-589): declared → actual flag for a Not-met close. Null
   *  otherwise (no static line on met/unanswered — D-548 amber-means-attend). */
  get closeReviewNotMetFlag(): { declared: string; actual: string } | null {
    if (this.data.gateName !== 'close_review') { return null; }
    if (this.record?.outcome_verdict !== 'not_met') { return null; }
    return {
      declared: this.data.cycle.outcome_statement || '(no declared outcome)',
      actual:   this.record?.outcome_actual || '(not recorded)'
    };
  }

  /** WS7: bring the outcome verdict block into view from the not-met flag. */
  scrollToVerdictBlock(): void {
    if (typeof document === 'undefined') { return; }
    document.getElementById('grm-verdict-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── Contract 39 (D-584): consultation cast confirmation state ──────────────
  /** Cast list shown beside the sizing confirmation at Go to Build. */
  castList: { label: string; origin: string }[] = [];
  private castLoaded = false;

  /** D-584: cast is committed once Go to Build confirmation is recorded. */
  get castCommitted(): boolean {
    const gtb = this.data.cycle.gate_records?.find(g => g.gate_name === 'go_to_build');
    return !!gtb && (!!gtb.cast_confirmed_at || gtb.gate_status === 'approved' || gtb.gate_status === 'skipped');
  }

  /** D-584: load the consultation set (trio + C stakes with origin) once. */
  private loadCastList(): void {
    if (this.castLoaded) { return; }
    this.castLoaded = true;
    const c = this.data.cycle;
    const nameOf = (id: string | null | undefined) =>
      id ? (this.data.allUsers.find(u => u.id === id)?.display_name ?? null) : null;
    const trio: { label: string; origin: string }[] = [];
    const dcsName = nameOf(c.assigned_dcs_user_id); if (dcsName) { trio.push({ label: dcsName, origin: 'Trio — DCS' }); }
    const epoName = nameOf(c.assigned_epo_user_id); if (epoName) { trio.push({ label: epoName, origin: 'Trio — EPO' }); }
    const dolName = nameOf(c.assigned_dol_user_id); if (dolName) { trio.push({ label: dolName, origin: 'Trio — DOL' }); }
    this.castList = trio;
    this.delivery.listParticipation({ delivery_cycle_id: c.delivery_cycle_id }).subscribe({
      next: (res) => {
        const originLabels: Record<string, string> = {
          rule: 'Suggestion', division_default: 'Division default', trio: 'Trio add',
          self: 'Self-request', approver: 'Approver add', leadership: 'Leadership add'
        };
        const stakes = (res.data?.participation_records ?? [])
          .filter(r => r.letter === 'C')
          .map(r => ({
            label:  r.holder_display_name || r.holder_group_name || 'Unknown',
            origin: originLabels[r.set_via] ?? r.set_via
          }));
        this.castList = [...trio, ...stakes];
        this.cdr.markForCheck();
      },
      error: () => { /* trio-only list is still a truthful confirmation surface */ }
    });
  }

  // ── Contract GA-1 (D-579): assessment state ────────────────────────────────
  submitAssessment:  AssessmentChange = { complete: false, items: [] };
  approveAssessment: AssessmentChange = { complete: false, items: [] };

  /** Genuine participant = assigned trio member (server requires exactly them). */
  get viewerIsTrioParticipant(): boolean {
    const me = this.currentUserId;
    const c  = this.data.cycle;
    return !!me && [c.assigned_dcs_user_id, c.assigned_epo_user_id, c.assigned_dol_user_id].includes(me);
  }

  /** Per-gate best-practices link (blank/absent = hidden). */
  get assessmentLinkUrl(): string | null {
    return this.data.cycle.gate_coaching_links?.[this.data.gateName] || null;
  }

  /** Open-condition count reported by the thread/conditions child. */
  philOpenConditions = 0;

  // ── Conditions loop (Phil 2026-07-26) ──────────────────────────────────────
  gateConditions: import('../../../core/types/database').GateConditionRecord[] = [];
  conditionBusyId: string | null = null;
  withdrawingId:   string | null = null;
  withdrawReason = '';
  conditionActionError = '';
  /** "Return with Set Conditions" composer state. */
  rwcNotes = '';
  rwcConditionDrafts: string[] = [''];
  rwcError = '';

  get openGateConditions() {
    return this.gateConditions.filter(c => c.condition_status === 'open');
  }

  /** Resolve authority mirrors the server: submit-authority holders, the
   *  approver, or Phil. */
  get canActOnConditions(): boolean {
    return this.data.callerCanSubmitGates
        || !!this.record?.current_user_gate_authority?.can_approve
        || this.viewerIsPhil;
  }

  get canWithdrawConditions(): boolean {
    return this.record?.approver_user_id === this.currentUserId || this.viewerIsPhil;
  }

  loadConditions(): void {
    if (!this.record?.gate_record_id) { return; }
    this.delivery.listGateConditions({ gate_record_id: this.record.gate_record_id }).subscribe({
      next: (res) => {
        this.gateConditions = res.data?.gate_conditions ?? [];
        this.philOpenConditions = this.openGateConditions.length;
        this.cdr.markForCheck();
      },
      error: () => { /* block renders empty */ }
    });
  }

  resolveCondition(c: { condition_id: string }): void {
    if (this.conditionBusyId) { return; }
    this.conditionBusyId = c.condition_id;
    this.conditionActionError = '';
    this.delivery.resolveGateCondition({ condition_id: c.condition_id }).subscribe({
      next: (res) => {
        this.conditionBusyId = null;
        if (!res.success) { this.conditionActionError = res.error ?? 'Could not resolve the condition.'; }
        this.loadConditions();
      },
      error: (err: { error?: string }) => {
        this.conditionBusyId = null;
        this.conditionActionError = err?.error ?? 'Could not resolve the condition.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmWithdraw(c: { condition_id: string }): void {
    const reason = this.withdrawReason.trim();
    if (!reason || this.conditionBusyId) { return; }
    this.conditionBusyId = c.condition_id;
    this.conditionActionError = '';
    this.delivery.withdrawGateCondition({ condition_id: c.condition_id, reason }).subscribe({
      next: (res) => {
        this.conditionBusyId = null;
        this.withdrawingId = null;
        this.withdrawReason = '';
        if (!res.success) { this.conditionActionError = res.error ?? 'Could not withdraw the condition.'; }
        this.loadConditions();
      },
      error: (err: { error?: string }) => {
        this.conditionBusyId = null;
        this.conditionActionError = err?.error ?? 'Could not withdraw the condition.';
        this.cdr.markForCheck();
      }
    });
  }

  addRwcConditionRow(): void { this.rwcConditionDrafts.push(''); }
  removeRwcConditionRow(i: number): void { this.rwcConditionDrafts.splice(i, 1); }
  trackByIndex(i: number): number { return i; }

  onReturnWithConditionsConfirm(): void {
    const notes = this.rwcNotes.trim();
    const conditions = this.rwcConditionDrafts.map(t => t.trim()).filter(Boolean)
      .map(condition_text => ({ condition_text }));
    if (!notes) { this.rwcError = 'Return notes are required.'; return; }
    if (conditions.length === 0) { this.rwcError = 'Add at least one condition — or use plain Return.'; return; }
    this.rwcError = '';
    this.startProcessing('return');
    this.delivery.recordGateDecision({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName,
      decision:          'returned',
      approver_notes:    notes,
      conditions
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.endProcessing();
          this.onGateActionComplete('full');
        } else {
          this.endProcessing(res.error ?? 'Return failed. Please try again.');
        }
      },
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Return failed. Please try again.');
      }
    });
  }

  /** Phil 2026-07-26: the override-approve lever renders ONLY when plain
   *  Approve can't do the job — viewer can't approve normally, an L1 gate is
   *  still collecting, or open conditions block the approval. */
  get showPhilOverrideApprove(): boolean {
    if (!this.viewerIsPhil) { return false; }
    const s = this.record?.gate_status;
    if (s !== 'awaiting_approval' && s !== 'pending') { return false; }
    return !this.record?.current_user_gate_authority?.can_approve
        || !!this.record?.l1_consensus
        || this.philOpenConditions > 0;
  }

  /** Approver-side collection: L1 trio member, or the designated approver.
   *  Admin fallback / overrides are on-behalf — server skips, form hidden. */
  get approveAssessmentRequired(): boolean {
    if (this.record?.l1_consensus) { return this.viewerIsTrioParticipant; }
    return !!this.record?.approver_user_id && this.record.approver_user_id === this.currentUserId;
  }

  /** Rows the server already visibility-filtered for this viewer. */
  get approverVisibleAssessments(): GateAssessmentRow[] {
    return (this.record?.assessments ?? []) as GateAssessmentRow[];
  }

  processing      = false;
  processingAction:
    | 'submit'
    | 'approve'
    | 'return'
    | 'withdraw'
    | 'confirm-skip'
    | 'backdate'
    | 'save-sizing'
    | null = null;

  /** Contract G3 (D-567/D-558): sizing interstitial + Go to Build confirm state. */
  sizingPayload: SizingFormPayload | null = null;
  sizingSaveError = '';
  confirmSizing: InitiativeSizing | null = null;   // loaded answers for the GtB re-present
  private gtbSizingConfirmed = false;

  /** Sized = baseline cached (recompute writes it on every sizing upsert) or a set level exists. */
  get cycleIsSized(): boolean {
    return this.data.cycle.baseline_level != null || this.data.cycle.set_level != null;
  }

  /** Contract 28 / D-448 — list of predecessor gates flagged to be marked as
   *  skipped. Populated when submit_gate_for_approval returns
   *  REQUIRES_SKIP_CONFIRMATION. Cleared when the user cancels or confirms. */
  pendingSkipGates: GateName[] = [];

  /** Contract 28 / D-450 — list of unresolved predecessor gates blocking the
   *  Deploy submission. Surfaced in the 'deploy-blocked' confirm state. */
  deployBlockedGates: GateName[] = [];

  /** Contract 28 / D-449 — user-entered date in the backdate input. Set when
   *  the user types in the Backdate field on a skipped gate. */
  backdateDateInput = '';
  backdateError     = '';

  actionError = '';
  actionHint  = '';

  /** Contract 24 (AC-18 / D-437): warnings captured from record_gate_decision
   *  response. Surfaced in the modal post-approval as a D-200 Pattern 2 block. */
  postApproveWipWarning: EpoWipWarning | null = null;
  postApproveSuggestions: string[]            = [];

  returnForm: FormGroup;
  returnNotesError = false;

  constructor(
    private readonly fb:        FormBuilder,
    private readonly delivery:  DeliveryService,
    private readonly profile:   UserProfileService,
    private readonly cdr:       ChangeDetectorRef,
    private readonly router:    Router,
    private readonly dialogRef: MatDialogRef<GateRecordModalComponent, GateRecordModalResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: GateRecordModalData
  ) {
    this.gateLabel    = GATE_LABELS[data.gateName];
    // D-527: coaching keyed by canonical label; missing key → renders nothing.
    this.gateCoaching = GATE_COACHING_SHORT[this.gateLabel] ?? null;

    this.record    = data.cycle.gate_records?.find(g => g.gate_name === data.gateName) ?? null;
    this.milestone = data.cycle.milestone_dates?.find(m => m.gate_name === data.gateName) ?? null;

    // Conditions loop (Phil 2026-07-26): the modal owns the prominent
    // conditions block — loaded here, refreshed after every condition action.
    this.loadConditions();

    this.returnForm = this.fb.group({ approver_notes: [''] });

    // Default open: backdrop and Escape allowed (handled below). Toggled to
    // disableClose=true during MCP writes per S-028 Context D.
    this.dialogRef.disableClose = false;
  }

  // B-97: ESC fires onDismiss only — never the action-complete refresh path.
  // MatDialog's default Escape handler also closes (with `undefined` result);
  // afterClosed in the parent treats `undefined` and `{refreshKind:'none'}`
  // identically (no refresh), so duplicate closes are safe.
  //
  // B-97 (Contract 16): stopPropagation on happy path — defense-in-depth so
  // the keydown event does not continue bubbling to other document-level
  // listeners (e.g. parent panel onEscKey) regardless of CDK overlay
  // dispatcher registration order. Detail's gateModalOpen flag is the primary
  // guard; this is a second line.
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(ev: KeyboardEvent): void {
    if (this.processing) {
      ev.stopPropagation();
      ev.preventDefault();
      return;
    }
    ev.stopPropagation();
    this.onDismiss();
  }

  // ── Computed flags driving action area ──────────────────────────────────────

  get isNotYetActive(): boolean {
    if (this.record) return false;
    const GATE_MIN_STAGE_IDX: Partial<Record<GateName, number>> = {
      go_to_build:   2,  // SPEC
      go_to_deploy:  5,  // UAT (gate gates UAT→PILOT)
      go_to_release: 6,  // PILOT (gate gates PILOT→RELEASE)
      close_review:  8   // OUTCOME
    };
    const STAGE_ORDER = ['BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','COMPLETE'];
    const minIdx = GATE_MIN_STAGE_IDX[this.data.gateName];
    if (minIdx === undefined) return false;
    const currentIdx = STAGE_ORDER.indexOf(this.data.cycle.current_lifecycle_stage);
    return currentIdx >= 0 && currentIdx < minIdx;
  }

  get resubmitMode(): boolean {
    return this.record?.gate_status === 'returned';
  }

  get canShowSubmit(): boolean {
    // D-447: skipped is terminal — no Submit affordance. Backdate (D-449) is
    // the only path off skipped, and renders via isSkippedGate below.
    if (this.record?.gate_status === 'skipped') return false;
    if (!this.data.callerCanSubmitGates) return !!this.record && this.record.gate_status !== 'awaiting_approval' && this.record.gate_status !== 'approved' && this.showSubmitMessageOnly;
    if (!this.record) return !this.isNotYetActive;
    return this.record.gate_status === 'returned'
        || this.record.gate_status === 'not_started'
        || this.record.gate_status === 'pending';
  }

  /** D-447 / D-449: skipped gate renders the dedicated sub-panel state —
   *  status badge "Skipped" + no Submit / Approve / Return + Backdate
   *  affordance. */
  get isSkippedGate(): boolean {
    return this.record?.gate_status === 'skipped';
  }

  get showSubmitMessageOnly(): boolean {
    return !this.data.callerCanSubmitGates;
  }

  get canShowWithdraw(): boolean {
    return this.record?.gate_status === 'awaiting_approval'
        && !!this.record?.current_user_gate_authority?.can_withdraw
        && !this.record?.current_user_gate_authority?.can_approve;
  }

  get canShowApproverActions(): boolean {
    return this.record?.gate_status === 'awaiting_approval'
        && !!this.record?.current_user_gate_authority?.can_approve;
  }

  /** Contract G5: interim waiting list on awaiting L1 gates (pre-G7). */
  get l1WaitingLine(): string {
    const w = this.record?.l1_waiting_on;
    if (!w) { return ''; }
    const parts: string[] = [...(w.pending_trio_display_names ?? [])];
    if (w.pending_consulted_count > 0) {
      parts.push(`${w.pending_consulted_count} consulted ${w.pending_consulted_count === 1 ? 'party' : 'parties'}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'no one — finalizing';
  }

  /** Phil 2026-07-26: no personal names in routing fallbacks. */
  get approverNameOrDefault(): string {
    const id = this.record?.approver_user_id;
    if (id) return this.approverDisplayName(id);
    return 'escalation default';
  }

  /** B-95 amended (Phil 2026-07-26): neutral wording, no name shown. */
  get escalationDefaultLabel(): string {
    return 'Escalation default — no Accountable configured';
  }

  /** Contract 29 WS2: current user id for the Consulted section's own-row edit. */
  get currentUserId(): string | null {
    return this.profile.getCurrentProfile()?.id ?? null;
  }

  /** Phil 2026-07-24: viewer is Phil (super admin) — override levers render. */
  get viewerIsPhil(): boolean {
    return this.profile.getCurrentProfile()?.is_super_admin === true;
  }

  /** Contract G8 (D-560): viewer holds the IE role (or is Phil). */
  get viewerIsIE(): boolean {
    const p = this.profile.getCurrentProfile();
    return p?.is_initiative_executive === true || p?.is_super_admin === true;
  }

  /** G8: the loud override affordance — IEs on awaiting gates they can't
   *  approve through the normal route. Board gates rejected server-side. */
  get canShowIeOverride(): boolean {
    return this.viewerIsIE
        && this.record?.gate_status === 'awaiting_approval'
        && !this.record?.current_user_gate_authority?.can_approve;
  }

  private get currentUserDisplayName(): string {
    return this.profile.getCurrentProfile()?.display_name ?? 'Phil';
  }

  // ── Status display (mirrors detail component logic) ─────────────────────────

  get statusLabel(): string {
    if (this.record?.gate_status === 'approved')          return 'Approved';
    if (this.record?.gate_status === 'blocked')           return 'Blocked';
    if (this.record?.gate_status === 'returned')          return 'Returned';
    if (this.record?.gate_status === 'awaiting_approval') return 'Awaiting Approval';
    if (this.record?.gate_status === 'pending')           return 'Under Review';
    if (this.record?.gate_status === 'not_started')       return 'Not Started';
    if (this.isNotYetActive)                              return 'Not Yet Active';
    return 'Pending';
  }

  get statusBg(): string {
    switch (this.statusLabel) {
      case 'Approved':           return '#e8f5e9';
      case 'Blocked':            return '#fdecea';
      case 'Returned':           return '#fff8e1';
      case 'Awaiting Approval':  return '#fff3e0';
      case 'Under Review':       return '#e3f2fd';
      case 'Not Started':        return '#f5f5f5';
      default:                   return 'var(--triarq-color-background-subtle, #f5f6fa)';
    }
  }

  get statusColor(): string {
    switch (this.statusLabel) {
      case 'Approved':           return '#2e7d32';
      case 'Blocked':            return 'var(--triarq-color-error, #c0392b)';
      case 'Returned':           return '#E96127';
      case 'Awaiting Approval':  return '#E65100';
      case 'Under Review':       return 'var(--triarq-color-primary, #257099)';
      case 'Not Started':        return '#9E9E9E';
      default:                   return 'var(--triarq-color-text-secondary, #5A5A5A)';
    }
  }

  get targetDateColor(): string {
    if (!this.milestone?.target_date || this.milestone.actual_date) {
      return 'var(--triarq-color-primary, #257099)';
    }
    const today = new Date().toISOString().slice(0, 10);
    const diff  = Math.ceil(
      (new Date(this.milestone.target_date).getTime() - new Date(today).getTime()) / 86400000
    );
    if (diff < 0)  return 'var(--triarq-color-error, #d32f2f)';
    if (diff <= 4) return 'var(--triarq-color-sunray, #f5a623)';
    return 'var(--triarq-color-primary, #257099)';
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  cancelConfirm(): void {
    this.confirmMode = 'none';
    this.actionError = '';
    this.actionHint  = '';
    this.returnForm.reset();
    this.returnNotesError = false;
    this.cdr.markForCheck();
  }

  /**
   * B-97: dismissal path. Used by Escape, backdrop click, Cancel button, and
   * × button. Closes the modal with refreshKind:'none' — never triggers a
   * panel refresh in the parent.
   */
  onDismiss(): void {
    if (this.processing) return;
    // A gate was just submitted in this session (confirmation showing) — even
    // if the user dismisses via the ✕, the submission succeeded, so the parent
    // must refresh to show the new awaiting_approval state (Contract 29 WS3).
    const refreshKind = this.confirmMode === 'submitted' ? 'partial' : 'none';
    this.dialogRef.close({ refreshKind });
  }

  /** D-527: "More →" — close and deep-link to this gate's Guide section. */
  openGuide(): void {
    if (this.processing) return;
    const anchor = this.gateLabel.toLowerCase().replace(/\s+/g, '-');
    this.onDismiss();
    this.router.navigate(['/initiatives/guide'], { fragment: anchor });
  }

  /**
   * B-97: action-complete path. Used only after a successful MCP write.
   * Closes the modal with the correct refresh kind so the parent reloads
   * the cycle per D-345.
   */
  private onGateActionComplete(refreshKind: 'full' | 'partial'): void {
    this.dialogRef.close({ refreshKind });
  }

  /** Contract 29 WS3: dismiss the post-submit approver confirmation and trigger
   *  the same partial refresh the immediate-close path used. */
  onSubmittedDone(): void {
    this.submittedApprover = null;
    this.confirmMode = 'none';
    this.onGateActionComplete('partial');
  }

  /** Submit / Re-submit for Approval — partial refresh per D-345 panel rules.
   *  Contract 28 / D-448 / D-450: response dispatcher branches into the skip
   *  interstitial or deploy-blocked state when the backend pre-check finds
   *  unapproved predecessors. Normal path is unchanged. */
  onSubmit(): void {
    // Contract G3: Go to Build confirmation step — re-present the sizing
    // answers before submission; proceed = confirm (D-567). Skipped when the
    // answers were just entered via the sizing interstitial in this session.
    if (this.data.gateName === 'go_to_build' && this.cycleIsSized && !this.gtbSizingConfirmed
        && !this.philOverrideArmed) {
      this.startProcessing('submit');
      this.delivery.getInitiativeSizing({ delivery_cycle_id: this.data.cycle.delivery_cycle_id })
        .subscribe({
          next: (res) => {
            this.endProcessing();
            if (res.success && res.data?.sizing) {
              this.confirmSizing = res.data.sizing;
              this.confirmMode = 'sizing-confirm';
              this.loadCastList();   // D-584: cast panel beside the sizing confirmation
            } else {
              // No sizing row despite level columns — fall through to the
              // server, which will interpose REQUIRES_SIZING if needed.
              this.gtbSizingConfirmed = true;
              this.onSubmit();
              return;
            }
            this.cdr.markForCheck();
          },
          error: () => {
            // Read failure — proceed; the server enforces D-567 regardless.
            this.endProcessing();
            this.gtbSizingConfirmed = true;
            this.onSubmit();
          }
        });
      return;
    }

    this.startProcessing('submit');

    const note = this.submissionNoteDraft.trim();
    this.delivery.submitGateForApproval({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName,
      // D-489: optional justification travels with the submission.
      ...(note ? { submission_note: note } : {}),
      // Phil 2026-07-24: override armed via the confirmed Phil lever only.
      ...(this.philOverrideArmed ? { phil_override: true } : {}),
      // GA-1 (D-579): submitter assessment (genuine participants only).
      ...(this.viewerIsTrioParticipant && !this.philOverrideArmed
            ? { assessment: this.submitAssessment.items } : {}),
      // Contract 39 (D-584): the confirmation screens above were the cast
      // confirmation — proceeding past them confirms the cast.
      ...(this.data.gateName === 'go_to_build' ? { cast_confirmed: true } : {}),
      // Contract 39 (D-585): Close Review outcome verdict block.
      ...(this.data.gateName === 'close_review' && this.crVerdict
            ? { outcome_verdict: this.crVerdict,
                outcome_actual:   this.crActualDraft.trim(),
                outcome_evidence: this.crEvidenceDraft.trim() } : {})
    }).subscribe({
      next: (res) => {
        // Contract G3 (D-567): sizing interstitial — the Initiative has no
        // sizing row; interpose the form, then continue in the same flow.
        if (res.success && res.status === 'REQUIRES_SIZING') {
          this.endProcessing();
          this.confirmMode = 'sizing-required';
          this.loadCastList();   // D-584: cast panel beside the sizing form
          this.cdr.markForCheck();
          return;
        }
        // D-448: skip interstitial — non-error response (success:true) that
        // carries gates_to_skip and asks the user to confirm.
        if (res.success && res.status === 'REQUIRES_SKIP_CONFIRMATION') {
          const payload = (res.data ?? {}) as Partial<GateSkipInterstitialPayload>;
          this.pendingSkipGates = (payload.gates_to_skip ?? []) as GateName[];
          this.endProcessing();
          this.confirmMode = 'skip-interstitial';
          this.cdr.markForCheck();
          return;
        }
        // D-450: Deploy gate cannot be skipped — error response with code.
        // CC-0806-04: also handled in error() below, which is the branch that
        // actually fires (success:false → HTTP 400 → thrown body).
        if (this.handleDeploySkipBlocked(res)) { return; }
        if (res.success) {
          // Contract 29 WS3 (D-463/AC-32): show the resolved approver before
          // closing, so the submitter sees who the gate routed to. The submit
          // already succeeded server-side, so any way the user leaves this
          // confirmation must still trigger the parent's partial refresh —
          // block ESC/backdrop dismissal (forces the Done button), and
          // onDismiss() also maps the 'submitted' state to a partial refresh.
          this.submittedApprover = res.assigned_approver ?? null;
          this.dialogRef.disableClose = true;
          this.endProcessing();
          this.confirmMode = 'submitted';
          this.cdr.markForCheck();
        } else {
          this.endProcessing(res.error ?? 'Submission failed. Please try again.');
        }
      },
      error: (err: unknown) => {
        if (this.handleDeploySkipBlocked(err)) { return; }
        const msg = (err as { error?: string })?.error;
        this.endProcessing(
          typeof msg === 'string' ? msg : 'Submission failed. Please try again.');
      }
    });
  }

  // ── Contract 28 / D-448: skip interstitial — confirm + cancel ──────────────

  /** D-448: list of skip-flagged gate labels for the interstitial message. */
  get pendingSkipLabels(): string[] {
    return this.pendingSkipGates.map(g => GATE_LABELS[g] ?? g);
  }

  /** D-450: list of blocking gate labels for the deploy-blocked message. */
  get deployBlockedLabels(): string[] {
    return this.deployBlockedGates.map(g => GATE_LABELS[g] ?? g);
  }

  onConfirmSkip(): void {
    if (this.pendingSkipGates.length === 0) return;
    this.startProcessing('confirm-skip');

    this.delivery.confirmGateSkip({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gates_to_skip:     this.pendingSkipGates,
      submitted_gate:    this.data.gateName,
      // Contract 40 WS1 (D-489/D-596): submission note rides the skip path too.
      ...(this.submissionNoteDraft.trim() ? { submission_note: this.submissionNoteDraft.trim() } : {}),
      ...(this.philOverrideArmed ? { phil_override: true } : {}),
      // GA-1: the assessment rides through the skip interstitial round-trip.
      ...(this.viewerIsTrioParticipant && !this.philOverrideArmed
            ? { assessment: this.submitAssessment.items } : {}),
      // Contract 39 (D-584/D-585): cast confirmation + outcome verdict ride through.
      ...(this.data.gateName === 'go_to_build' ? { cast_confirmed: true } : {}),
      ...(this.data.gateName === 'close_review' && this.crVerdict
            ? { outcome_verdict: this.crVerdict,
                outcome_actual:   this.crActualDraft.trim(),
                outcome_evidence: this.crEvidenceDraft.trim() } : {})
    }).subscribe({
      next: (res) => {
        if (res.success) {
          // Skip writes succeeded AND submit_gate_for_approval ran to completion.
          // Full refresh — skipped gates change Stage Track, status dot, and the
          // submitted gate transitions to awaiting_approval.
          this.pendingSkipGates = [];
          this.endProcessing();
          this.onGateActionComplete('full');
        } else if (!this.handleDeploySkipBlocked(res)) {
          this.endProcessing(res.error ?? 'Skip confirmation failed. Please try again.');
        }
      },
      // CC-0806-04: this is the branch that actually fires for a blocked skip.
      // confirm_gate_skip returns { success:false }, index.js maps that to HTTP
      // 400, and mcp.service rethrows the parsed body — so the error lands here,
      // not in next(). The CC-0804-10 handling sat in next() only, which for a
      // success:false response is unreachable, and the raw DEPLOY_GATE_SKIP_BLOCKED
      // code went on rendering in the interstitial exactly as before the fix.
      error: (err: unknown) => {
        if (this.handleDeploySkipBlocked(err)) { return; }
        const msg = (err as { error?: string })?.error;
        this.endProcessing(
          typeof msg === 'string' ? msg : 'Skip confirmation failed. Please try again.');
      }
    });
  }

  /**
   * D-450 deploy-skip block → the explanatory state, from either subscribe
   * callback. Returns true when it recognised and handled the response.
   *
   * Shared deliberately: the same payload can arrive as a next() value or as a
   * thrown body depending on the HTTP status, and the user-visible behaviour
   * must not depend on which.
   */
  private handleDeploySkipBlocked(res: unknown): boolean {
    const body = res as { error?: string; data?: Partial<DeployGateSkipBlockedPayload> };
    if (body?.error !== 'DEPLOY_GATE_SKIP_BLOCKED') { return false; }

    this.deployBlockedGates = (body.data?.gates_requiring_action
      ?? this.pendingSkipGates.filter(g => g === 'go_to_deploy')) as GateName[];
    this.endProcessing();
    this.confirmMode = 'deploy-blocked';
    this.cdr.markForCheck();
    return true;
  }

  /**
   * CC-0804-10 — Phil-only: arm the override and retry the skip.
   *
   * submit_gate_for_approval has relaxed the D-450 deploy block for Phil since
   * 2026-07-24, but confirm_gate_skip did not, and no UI path armed the override
   * from this state — "Submit anyway (override)…" renders only inside the
   * hardStops block, and a deploy-skip block is not a hard stop. So the override
   * existed and was unreachable.
   */
  onPhilOverrideSkip(): void {
    this.philOverrideArmed = true;
    this.confirmMode       = 'skip-interstitial';
    this.onConfirmSkip();
  }

  onCancelSkip(): void {
    this.pendingSkipGates = [];
    this.confirmMode      = 'none';
    this.cdr.markForCheck();
  }

  // ── Contract G3 (D-567/D-558): sizing interstitial + GtB confirm ───────────

  onSizingPayloadChange(payload: SizingFormPayload): void {
    this.sizingPayload = payload;
    if (payload.valid) { this.sizingSaveError = ''; }
    this.cdr.markForCheck();
  }

  /** Migration step: save the interposed sizing, then continue the original
   *  gate submission in the same flow (AC #3). Entering the answers here IS
   *  the Go to Build confirmation when this gate is Go to Build. */
  onSaveSizingAndSubmit(): void {
    if (!this.sizingPayload?.valid) {
      this.sizingSaveError = 'Answer all five sizing questions to continue.';
      this.cdr.markForCheck();
      return;
    }
    this.startProcessing('save-sizing');
    this.delivery.upsertInitiativeSizing({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      answers: this.sizingPayload.answers,
      subs:    this.sizingPayload.subs,
      notes:   this.sizingPayload.notes
    }).subscribe({
      next: (res) => {
        if (res.success && res.data && !res.status) {
          // Keep the modal's cycle in sync so cycleIsSized flips (level chip
          // refresh happens on the parent's post-close reload).
          this.data.cycle.baseline_level = res.data.baseline_level ?? null;
          // Contract G9 (D-563): apply the trio's suggestion decisions.
          for (const [rule_key, decision] of Object.entries(this.sizingPayload?.suggestionDecisions ?? {})) {
            this.delivery.applySuggestionDecision({
              delivery_cycle_id: this.data.cycle.delivery_cycle_id,
              rule_key: rule_key as 'q4_security' | 'q5_ux',
              action: decision.action,
              ...(decision.note ? { note: decision.note } : {})
            }).subscribe({ next: () => {}, error: () => {} });
          }
          this.gtbSizingConfirmed = true;   // answers just entered = confirmed
          this.confirmMode = 'none';
          this.endProcessing();
          this.onSubmit();                  // submission continues in the same flow
        } else {
          this.endProcessing();
          this.sizingSaveError = res.error ?? res.data?.message ?? 'Sizing save failed. Please try again.';
          this.cdr.markForCheck();
        }
      },
      error: (err: { error?: string }) => {
        this.endProcessing();
        this.sizingSaveError = err.error ?? 'Sizing save failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  onCancelSizing(): void {
    this.confirmMode = 'none';
    this.sizingSaveError = '';
    this.cdr.markForCheck();
  }

  /** Go to Build: user confirmed the re-presented answers — proceed = confirm. */
  onConfirmSizingProceed(): void {
    this.gtbSizingConfirmed = true;
    this.confirmMode = 'none';
    this.cdr.markForCheck();
    this.onSubmit();
  }

  onCloseDeployBlocked(): void {
    this.deployBlockedGates = [];
    this.confirmMode        = 'none';
    this.cdr.markForCheck();
  }

  // ── Contract 28 / D-449: backdate skipped gate to complete ─────────────────

  onBackdateInput(value: string): void {
    this.backdateDateInput = value;
    this.backdateError     = '';
  }

  /** D-183 two-step: validate date input, then move to backdate-confirm. */
  onBackdateRequest(): void {
    const date = this.backdateDateInput.trim();
    if (!date) {
      this.backdateError = 'Enter the date this gate was completed (YYYY-MM-DD).';
      this.cdr.markForCheck();
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      this.backdateError = 'Date must be in YYYY-MM-DD format.';
      this.cdr.markForCheck();
      return;
    }
    // No future-date guard — backend stores whatever the user records. Visual
    // confirmation step happens next.
    this.backdateError = '';
    this.confirmMode   = 'backdate-confirm';
    this.cdr.markForCheck();
  }

  onCancelBackdate(): void {
    this.confirmMode = 'none';
    this.cdr.markForCheck();
  }

  onConfirmBackdate(): void {
    this.startProcessing('backdate');

    this.delivery.setMilestoneActualDate({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName,
      actual_date:       this.backdateDateInput
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.backdateDateInput = '';
          this.endProcessing();
          // D-449: gate transitions skipped → approved (no approver). Full
          // refresh — status dot, Stage Track, and milestone row all change.
          this.onGateActionComplete('full');
        } else {
          this.endProcessing(res.error ?? 'Could not record the actual date.');
        }
      },
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Could not record the actual date.');
      }
    });
  }

  onApproveConfirm(): void {
    this.performApproval({});
  }

  /** G8 (D-560): loud IE override — reason travels as override_reason. */
  onIeOverrideConfirm(): void {
    const reason = this.ieOverrideReasonDraft.trim();
    if (!reason) { return; }
    this.performApproval({ ie_override: true, override_reason: reason });
  }

  /** G8 (D-569): retry the approval carrying the over-returned reasoning. */
  onOverReturnedConfirm(): void {
    const reason = this.overReturnedReasonDraft.trim();
    if (!reason) { return; }
    this.performApproval({ over_returned_reason: reason });
  }

  /** Phil 2026-07-24: confirmed override submit — arm the flag, run the flow. */
  onPhilOverrideSubmit(): void {
    this.philOverrideArmed = true;
    this.confirmMode = 'none';
    this.onSubmit();
  }

  /** Phil 2026-07-24: confirmed override approval. */
  onPhilOverrideApprove(): void {
    this.confirmMode = 'none';
    this.performApproval({ phil_override: true });
  }

  private performApproval(extra: { ie_override?: boolean; override_reason?: string; over_returned_reason?: string; phil_override?: boolean }): void {
    this.startProcessing('approve');

    const note = this.approveNoteDraft.trim();
    this.delivery.recordGateDecision({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName,
      decision:          'approved',
      // G7 (D-565 item 5): the one approver note field.
      ...(note ? { approver_notes: note } : {}),
      // GA-1 (D-579): approver / trio-member assessment (overrides skip it).
      ...(this.approveAssessmentRequired && !extra.ie_override && !extra.phil_override
            ? { assessment: this.approveAssessment.items } : {}),
      ...extra
    }).subscribe({
      next: (res) => {
        // G8 (D-569): a returned consultation demands reasoning — prompt and retry.
        // CC-0806-04: handled in error() too — that is the branch that fires.
        if (this.handleOverReturnedRequired(res)) { return; }
        if (res.success) {
          this.endProcessing();
          // Contract 24 (AC-18 / D-437): hold the modal open for the WIP alert
          // only. Contract 40 follow-on (CC-40-J, Phil 2026-07-28): the artifact
          // "typically attached" reminder no longer holds the modal after
          // approval — approval is already recorded, so a post-hoc acknowledge
          // on a non-blocking nudge is pure ceremony. Suggestions still ride the
          // server response (unchanged) and surface at submit time; they just no
          // longer gate the close here. The EPO WIP alert is an operational
          // signal and still requires acknowledgement.
          const result: GateDecisionResult | undefined = res.data ?? undefined;
          const hasWipWarning  = !!result?.wip_warning;
          if (hasWipWarning) {
            this.postApproveWipWarning  = result?.wip_warning ?? null;
            this.postApproveSuggestions = [];
            this.confirmMode            = 'post-approve-warning';
            this.cdr.markForCheck();
          } else {
            this.onGateActionComplete('full');
          }
        } else {
          this.endProcessing(
            res.error ?? 'Decision record failed.',
            'Check Workstream status and try again. If the Workstream is inactive, reactivate it first.'
          );
        }
      },
      error: (err: unknown) => {
        if (this.handleOverReturnedRequired(err)) { return; }
        const msg = (err as { error?: string })?.error;
        this.endProcessing(typeof msg === 'string' ? msg : 'Decision record failed.');
      }
    });
  }

  /**
   * D-569 over-returned reason prompt, from either subscribe callback.
   * Returns true when it recognised and handled the response. See
   * handleDeploySkipBlocked for why both callbacks must be covered.
   */
  private handleOverReturnedRequired(res: unknown): boolean {
    const body = res as { error?: string; data?: { returned_consultation_user_ids?: string[] } };
    if (body?.error !== 'RETURNED_CONSULTATION_REQUIRES_REASON') { return false; }

    this.overReturnedParties = (body.data?.returned_consultation_user_ids ?? [])
      .map(id => this.approverDisplayName(id));
    this.endProcessing();
    this.confirmMode = 'over-returned-reason';
    this.cdr.markForCheck();
    return true;
  }

  /** Contract 24 (AC-18): approver acknowledges the post-approval warning
   *  block. Closes the modal with refreshKind:'full' so the parent reloads. */
  acknowledgePostApproveWarning(): void {
    this.confirmMode            = 'none';
    this.postApproveWipWarning  = null;
    this.postApproveSuggestions = [];
    this.onGateActionComplete('full');
  }

  onReturnConfirm(): void {
    const notes = ((this.returnForm.value.approver_notes as string) ?? '').trim();
    if (!notes) {
      this.returnNotesError = true;
      this.cdr.markForCheck();
      return;
    }
    this.returnNotesError = false;

    this.startProcessing('return');

    this.delivery.recordGateDecision({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName,
      decision:          'returned',
      approver_notes:    notes
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.endProcessing();
          // Return resets gate to returned; caller refreshes cycle (D-345).
          this.onGateActionComplete('full');
        } else {
          this.endProcessing(
            res.error ?? 'Decision record failed.',
            'Provide notes explaining the return reason so the team can act on it.'
          );
        }
      },
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Decision record failed.');
      }
    });
  }

  onWithdrawConfirm(): void {
    this.startProcessing('withdraw');

    this.delivery.withdrawGateSubmission({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.endProcessing();
          this.onGateActionComplete('partial');
        } else {
          this.endProcessing(res.error ?? 'Withdrawal failed. Please try again.');
        }
      },
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Withdrawal failed. Please try again.');
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private startProcessing(
    action: 'submit' | 'approve' | 'return' | 'withdraw' | 'confirm-skip' | 'backdate' | 'save-sizing'
  ): void {
    this.processing       = true;
    this.processingAction = action;
    this.actionError      = '';
    this.actionHint       = '';
    this.dialogRef.disableClose = true; // S-028 Context D
    this.cdr.markForCheck();
  }

  private endProcessing(error = '', hint = ''): void {
    this.processing       = false;
    this.processingAction = null;
    this.dialogRef.disableClose = false;
    this.actionError = error;
    this.actionHint  = hint;
    this.cdr.markForCheck();
  }

  /**
   * B-95: resolve approver UUID → display_name. If the user is not present
   * in the loaded allUsers list (e.g. not yet loaded or not in scope), fall
   * back to a graceful placeholder rather than rendering the raw UUID.
   */
  approverDisplayName(userId: string): string {
    return this.data.allUsers.find(u => u.id === userId)?.display_name ?? 'Unknown user';
  }

  submittedRelative(at: string | null | undefined): string {
    if (!at) return '';
    const ms = Date.now() - Date.parse(at);
    if (Number.isNaN(ms) || ms < 0) return new Date(at).toLocaleDateString();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 14)  return `${days} days ago`;
    return new Date(at).toLocaleDateString();
  }

  dateStatusLabel(s: DateStatus): string {
    const labels: Record<DateStatus, string> = {
      not_started: 'Not Started',
      on_track:    'On Track',
      at_risk:     'At Risk',
      behind:      'Behind',
      complete:    'Complete',
      // D-447: skipped milestone — initiative entered system past this gate.
      skipped:     'Skipped'
    };
    return labels[s] ?? s;
  }

  dateStatusBg(s: DateStatus): string {
    if (s === 'on_track') return '#e8f5e9';
    if (s === 'at_risk')  return '#fff8e1';
    if (s === 'behind')   return '#fdecea';
    if (s === 'complete') return '#e3f2fd';
    return 'var(--triarq-color-background-subtle, #f5f6fa)';
  }

  dateStatusColor(s: DateStatus): string {
    if (s === 'on_track') return '#2e7d32';
    if (s === 'at_risk')  return '#e65100';
    if (s === 'behind')   return 'var(--triarq-color-error, #c0392b)';
    if (s === 'complete') return 'var(--triarq-color-primary, #257099)';
    return 'var(--triarq-color-text-secondary, #5A5A5A)';
  }
}
