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
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryService } from '../../../core/services/delivery.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { GateConsultationSectionComponent } from './gate-consultation-section.component';
import {
  DeliveryCycle,
  GateName,
  GateRecord,
  CycleMilestoneDate,
  TierClassification,
  User,
  DateStatus,
  EpoWipWarning,
  GateDecisionResult,
  GateSkipInterstitialPayload,
  DeployGateSkipBlockedPayload
} from '../../../core/types/database';

export interface GateRecordModalData {
  cycle:                DeliveryCycle;
  gateName:             GateName;
  allUsers:             User[];
  callerCanSubmitGates: boolean;
  checklist:            { label: string; met: boolean }[];
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
  imports:         [CommonModule, ReactiveFormsModule, IonicModule, MatDialogModule, GateConsultationSectionComponent],
  template: `
    <div class="grm-shell" [attr.aria-busy]="processing ? 'true' : null">

      <!-- ── Header ───────────────────────────────────────────────────────── -->
      <div class="grm-header">
        <div class="grm-titles">
          <div class="grm-title">{{ gateLabel }}</div>
          <div class="grm-subtitle">
            {{ data.cycle.cycle_title }} · Tier {{ tierShortLabel(data.cycle.tier_classification) }}
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

        <!-- MILESTONE DATE -->
        <section *ngIf="milestone" class="grm-section">
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

        <!-- APPROVAL ROUTING -->
        <section class="grm-section">
          <div class="grm-label">Approval Routing</div>
          <div class="grm-routing-row">
            <span class="grm-raci-badge">A</span>
            <span class="grm-raci-role">Accountable</span>
            <span *ngIf="record?.approver_user_id" class="grm-raci-name">
              {{ approverDisplayName(record!.approver_user_id!) }}
            </span>
            <span *ngIf="!record?.approver_user_id" class="grm-raci-default">
              {{ escalationDefaultLabel }}
            </span>
          </div>
        </section>

        <!-- CONSULTED — Contract 29 WS2 (D-461). Self-hides when no records. -->
        <app-gate-consultation-section
          [gateRecordId]="record?.gate_record_id ?? null"
          [gateStatus]="record?.gate_status ?? null"
          [currentUserId]="currentUserId">
        </app-gate-consultation-section>

        <!-- GATE CHECKLIST -->
        <section class="grm-section">
          <div class="grm-label">Gate Checklist</div>
          <div *ngFor="let item of data.checklist" class="grm-checklist-row">
            <span class="grm-checklist-icon"
                  [style.color]="item.met ? '#2e7d32' : '#f5a623'">
              {{ item.met ? '✓' : '⚠' }}
            </span>
            <span [style.color]="item.met ? 'var(--triarq-color-text-primary)' : 'var(--triarq-color-text-secondary)'">
              {{ item.label }}
            </span>
          </div>
          <div *ngIf="data.checklist.length === 0" class="grm-checklist-empty">
            No checklist items defined for this Gate.
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

        <!-- ── ACTION AREA — context-sensitive by gate state ──────────────── -->

        <!-- Submitted-meta (shown above action buttons during awaiting_approval) -->
        <div *ngIf="record?.gate_status === 'awaiting_approval' && record?.submitted_at"
             class="grm-submitted-meta"
             [title]="record!.submitted_at!">
          Submitted {{ submittedRelative(record!.submitted_at) }}
          by {{ record!.submitted_by_display_name ?? 'Unknown' }}
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

          <!-- Not yet active — advancement guidance, no action -->
          <div *ngIf="!record && isNotYetActive" class="grm-meta">
            Advance the Initiative through earlier stages to unlock this Gate.
          </div>

          <!-- pending / not_started — Submit for Approval (DS/CB) -->
          <ng-container *ngIf="canShowSubmit">
            <button class="grm-btn-primary"
                    type="button"
                    [disabled]="processing"
                    (click)="onSubmit()">
              {{ processing && processingAction === 'submit'
                  ? (resubmitMode ? 'Re-submitting…' : 'Submitting…')
                  : (resubmitMode ? 'Re-submit for Approval' : 'Submit for Approval') }}
            </button>
            <div *ngIf="!data.callerCanSubmitGates" class="grm-meta">
              Only the assigned Domain Capability Strategist, Engineering Product Owner, Domain Outcome Lead, or Phil can submit this Gate.
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

          <!-- awaiting_approval (Approver viewing) — Approve + Return -->
          <ng-container *ngIf="canShowApproverActions">
            <div class="grm-meta">{{ gateLabel }} submitted for your approval.</div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'approve'">
                Approve
              </button>
              <button class="grm-btn-secondary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'return'">
                Return
              </button>
            </div>
          </ng-container>

          <!-- awaiting_approval — neither approver nor submitter (read-only) -->
          <div *ngIf="record?.gate_status === 'awaiting_approval'
                       && !record?.current_user_gate_authority?.can_approve
                       && !record?.current_user_gate_authority?.can_withdraw"
               class="grm-meta">
            Only the designated approver or Phil can record a decision on this gate.
          </div>

          <!-- approved — read-only -->
          <div *ngIf="record?.gate_status === 'approved'" class="grm-meta">
            This Gate has been approved. No further action available.
          </div>

          <!-- legacy 'pending' with approver authority -->
          <ng-container *ngIf="record?.gate_status === 'pending'
                                 && record?.current_user_gate_authority?.can_approve">
            <div class="grm-meta">
              This gate was not submitted through the standard approval flow. You can approve or return it directly.
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'approve'">
                Approve
              </button>
              <button class="grm-btn-secondary"
                      type="button"
                      [disabled]="processing"
                      (click)="confirmMode = 'return'">
                Return
              </button>
            </div>
          </ng-container>
        </ng-container>

        <!-- ── CONFIRM: Approve (D-183 inline replacement; D-200 Pattern 2) ── -->
        <div *ngIf="confirmMode === 'approve'" class="oi-confirm-warn">
          <div class="oi-confirm-icon">⚠</div>
          <div class="oi-confirm-body">
            <div class="oi-confirm-text">
              Approving this gate will advance the Initiative. This cannot be
              undone without a stage regression.
            </div>
            <div class="grm-action-row">
              <button class="grm-btn-primary"
                      type="button"
                      [disabled]="processing"
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

        <!-- Contract 24 (AC-18 / D-437): post-approval warnings block.
             D-200 Pattern 2 (amber, non-blocking). Renders when the just-
             recorded approval came back with wip_warning or suggestion_warnings.
             Approver clicks Acknowledge to close + refresh. -->
        <div *ngIf="confirmMode === 'post-approve-warning'" class="oi-warn-pattern2">
          <div class="oi-warn-icon">⚠</div>
          <div class="oi-warn-body">
            <div class="oi-warn-text" *ngIf="postApproveWipWarning">
              <strong>WIP alert:</strong> {{ postApproveWipWarning.message }}
            </div>
            <div class="oi-warn-text" *ngIf="postApproveSuggestions.length > 0">
              <strong>Typically attached before {{ gateLabel }}:</strong>
              {{ postApproveSuggestions.join(', ') }}.
              <br>
              <span style="color:#5A5A5A;">Approving without these is permitted — this is a reminder.</span>
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
    .grm-checklist-row {
      display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 12px;
    }
    .grm-checklist-icon { flex-shrink: 0; font-weight: 700; }
    .grm-review-notes {
      background: var(--triarq-color-background-subtle); border-radius: 6px;
      padding: 8px 12px; font-size: 12px;
    }
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
    | 'backdate-confirm' = 'none';
  /** Contract 29 WS3 (D-463/AC-32): resolved approver shown in the submit confirmation. */
  submittedApprover: { id: string; display_name: string | null } | null = null;
  processing      = false;
  processingAction:
    | 'submit'
    | 'approve'
    | 'return'
    | 'withdraw'
    | 'confirm-skip'
    | 'backdate'
    | null = null;

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
    private readonly dialogRef: MatDialogRef<GateRecordModalComponent, GateRecordModalResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: GateRecordModalData
  ) {
    this.gateLabel = GATE_LABELS[data.gateName];

    this.record    = data.cycle.gate_records?.find(g => g.gate_name === data.gateName) ?? null;
    this.milestone = data.cycle.milestone_dates?.find(m => m.gate_name === data.gateName) ?? null;

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

  get approverNameOrDefault(): string {
    const id = this.record?.approver_user_id;
    if (id) return this.approverDisplayName(id);
    return `${this.currentUserDisplayName} (escalation default)`;
  }

  /**
   * B-95: rendered when no Accountable is configured. Resolves the current
   * user's display name from the auth session via UserProfileService —
   * never a hardcoded "Phil" string.
   */
  get escalationDefaultLabel(): string {
    return `${this.currentUserDisplayName} (escalation default — no Accountable configured)`;
  }

  /** Contract 29 WS2: current user id for the Consulted section's own-row edit. */
  get currentUserId(): string | null {
    return this.profile.getCurrentProfile()?.id ?? null;
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
    this.startProcessing('submit');

    this.delivery.submitGateForApproval({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName
    }).subscribe({
      next: (res) => {
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
        if (!res.success && res.error === 'DEPLOY_GATE_SKIP_BLOCKED') {
          const payload = (res.data ?? {}) as Partial<DeployGateSkipBlockedPayload>;
          this.deployBlockedGates = (payload.gates_requiring_action ?? []) as GateName[];
          this.endProcessing();
          this.confirmMode = 'deploy-blocked';
          this.cdr.markForCheck();
          return;
        }
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
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Submission failed. Please try again.');
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
      submitted_gate:    this.data.gateName
    }).subscribe({
      next: (res) => {
        if (res.success) {
          // Skip writes succeeded AND submit_gate_for_approval ran to completion.
          // Full refresh — skipped gates change Stage Track, status dot, and the
          // submitted gate transitions to awaiting_approval.
          this.pendingSkipGates = [];
          this.endProcessing();
          this.onGateActionComplete('full');
        } else {
          this.endProcessing(res.error ?? 'Skip confirmation failed. Please try again.');
        }
      },
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Skip confirmation failed. Please try again.');
      }
    });
  }

  onCancelSkip(): void {
    this.pendingSkipGates = [];
    this.confirmMode      = 'none';
    this.cdr.markForCheck();
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
    this.startProcessing('approve');

    this.delivery.recordGateDecision({
      delivery_cycle_id: this.data.cycle.delivery_cycle_id,
      gate_name:         this.data.gateName,
      decision:          'approved'
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.endProcessing();
          // Contract 24 (AC-18 / D-437): if the response carries warnings,
          // hold the modal open in post-approve-warning state until the
          // approver acknowledges. Otherwise close + full refresh per D-345.
          const result: GateDecisionResult | undefined = res.data ?? undefined;
          const hasWipWarning  = !!result?.wip_warning;
          const hasSuggestions = (result?.suggestion_warnings ?? []).length > 0;
          if (hasWipWarning || hasSuggestions) {
            this.postApproveWipWarning  = result?.wip_warning ?? null;
            this.postApproveSuggestions = result?.suggestion_warnings ?? [];
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
      error: (err: { error?: string }) => {
        this.endProcessing(err.error ?? 'Decision record failed.');
      }
    });
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
    action: 'submit' | 'approve' | 'return' | 'withdraw' | 'confirm-skip' | 'backdate'
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

  tierShortLabel(tier: TierClassification): string {
    return tier === 'tier_1' ? '1' : tier === 'tier_2' ? '2' : '3';
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
