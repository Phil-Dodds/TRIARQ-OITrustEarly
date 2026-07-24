// gate-thread-conditions.component.ts — Pathways OI Trust
// Contract G6 (D-565): the gate thread + approver conditions, one tap deep on
// the gate modal (progressive disclosure — one line + one action first).
// Thread: chronological messages; the submission note is message #1 (written
// server-side). Conditions: individually resolvable "nearly there" items;
// consultation_required conditions auto-resolve when the target approves
// (S-B5, server-side); open conditions hold the gate's approval.

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnChanges, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { GateConditionRecord, GateConsultation, GateThreadMessage } from '../../../core/types/database';

@Component({
  selector: 'app-gate-thread-conditions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gtc-root">
      <!-- One line + one action first (D-565 UI discipline). -->
      <button type="button" class="gtc-toggle" (click)="expanded = !expanded">
        {{ expanded ? '▾' : '▸' }} Thread & conditions
        <span class="gtc-counts">
          {{ messages.length }} message{{ messages.length === 1 ? '' : 's' }}<ng-container *ngIf="openConditions.length > 0">
            · {{ openConditions.length }} open condition{{ openConditions.length === 1 ? '' : 's' }}</ng-container>
        </span>
      </button>

      <div *ngIf="expanded" class="gtc-body">
        <!-- Conditions -->
        <div *ngIf="conditions.length > 0 || canManageConditions" class="gtc-section">
          <div class="gtc-section-title">Conditions</div>
          <div *ngFor="let c of conditions" class="gtc-condition"
               [class.gtc-condition--resolved]="c.condition_status === 'resolved'">
            <span class="gtc-cond-icon">{{ c.condition_status === 'resolved' ? '✓' : '◌' }}</span>
            <span class="gtc-cond-text">
              {{ c.condition_text }}
              <span *ngIf="c.condition_type === 'consultation_required'" class="gtc-cond-tag">consultation required</span>
              <span *ngIf="c.resolution_note" class="gtc-cond-note">— {{ c.resolution_note }}</span>
            </span>
            <button *ngIf="c.condition_status === 'open' && canManageConditions"
                    type="button" class="gtc-link" [disabled]="busy"
                    (click)="resolve(c)">Resolve</button>
          </div>
          <div *ngIf="conditions.length === 0" class="gtc-empty">No conditions on this gate.</div>

          <div *ngIf="canManageConditions" class="gtc-add-row">
            <select class="gtc-select-narrow" [(ngModel)]="newConditionType" [disabled]="busy">
              <option value="general">General</option>
              <option value="consultation_required" [disabled]="pendingConsultations.length === 0">
                Consultation required
              </option>
            </select>
            <select *ngIf="newConditionType === 'consultation_required'"
                    class="gtc-select-narrow" [(ngModel)]="newConditionTarget" [disabled]="busy">
              <option value="">Choose the consultation…</option>
              <option *ngFor="let cons of pendingConsultations" [value]="cons.id">{{ cons.display_name }}</option>
            </select>
            <input class="gtc-input" type="text" maxlength="400"
                   placeholder="Nearly there — what needs fixing?"
                   [(ngModel)]="newConditionText" [disabled]="busy" />
            <button type="button" class="gtc-btn" [disabled]="busy || !canAddCondition"
                    (click)="addCondition()">Add</button>
          </div>
        </div>

        <!-- Thread -->
        <div class="gtc-section">
          <div class="gtc-section-title">Thread</div>
          <div *ngFor="let m of messages" class="gtc-message">
            <span class="gtc-msg-author">{{ m.author_display_name || 'Unknown' }}</span>
            <span class="gtc-msg-time">{{ m.created_at | date:'MMM d, h:mm a' }}</span>
            <div class="gtc-msg-text">{{ m.message_text }}</div>
          </div>
          <div *ngIf="messages.length === 0" class="gtc-empty">
            No messages yet — the submission note opens the thread.
          </div>
          <div class="gtc-composer">
            <input class="gtc-input" type="text" maxlength="1000"
                   placeholder="Questions, meeting requests, prompts — all ordinary messages"
                   [(ngModel)]="draft" [disabled]="busy"
                   (keyup.enter)="post()" />
            <button type="button" class="gtc-btn" [disabled]="busy || !draft.trim()" (click)="post()">
              {{ busy ? 'Posting…' : 'Post' }}
            </button>
          </div>
        </div>

        <div *ngIf="errorText" class="gtc-error" role="alert">{{ errorText }}</div>
      </div>
    </div>
  `,
  styles: [`
    .gtc-root { margin-top: 10px; }
    .gtc-toggle {
      background: none; border: none; padding: 4px 0; cursor: pointer;
      font: 500 12px Roboto, sans-serif; color: #257099;
    }
    .gtc-counts { font-weight: 400; color: #5A5A5A; margin-left: 6px; }
    .gtc-body { display: flex; flex-direction: column; gap: 12px; padding: 8px 0 0 14px; }
    .gtc-section-title {
      font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--triarq-color-text-secondary); margin-bottom: 4px;
    }
    .gtc-condition { display: flex; gap: 8px; align-items: baseline; font: 400 12px Roboto, sans-serif; padding: 2px 0; }
    .gtc-condition--resolved { color: #9E9E9E; }
    .gtc-cond-icon { color: #F2A620; }
    .gtc-condition--resolved .gtc-cond-icon { color: #2e7d32; }
    .gtc-cond-tag {
      margin-left: 6px; padding: 1px 8px; border-radius: 999px;
      background: rgba(242,166,32,0.15); color: #8a5b00; font-size: 10px;
    }
    .gtc-cond-note { font-style: italic; color: #5A5A5A; }
    .gtc-link { background: none; border: none; color: #257099; cursor: pointer; font-size: 11px; text-decoration: underline; }
    .gtc-empty { font: italic 11px Roboto, sans-serif; color: #9E9E9E; }
    .gtc-add-row { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
    .gtc-select-narrow { border: 1px solid #B9C4CE; border-radius: 5px; padding: 5px 6px; font-size: 11px; }
    .gtc-input { flex: 1; min-width: 160px; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 10px; font-size: 12px; }
    .gtc-btn {
      background: #257099; border: none; border-radius: 5px; padding: 6px 14px;
      font: 500 12px Roboto, sans-serif; color: #fff; cursor: pointer;
    }
    .gtc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .gtc-message { padding: 4px 0; border-bottom: 1px solid #EEF3F6; }
    .gtc-msg-author { font: 500 12px Roboto, sans-serif; color: #00274E; }
    .gtc-msg-time { font: 400 10px Roboto, sans-serif; color: #9E9E9E; margin-left: 8px; }
    .gtc-msg-text { font: 400 12px Roboto, sans-serif; color: #1a1a1a; white-space: pre-wrap; }
    .gtc-composer { display: flex; gap: 6px; margin-top: 6px; }
    .gtc-error {
      border: 2px solid #d32f2f; border-radius: 5px; padding: 6px 10px;
      font-size: 12px; color: #d32f2f;
    }
  `]
})
export class GateThreadConditionsComponent implements OnChanges {
  @Input() gateRecordId!: string;
  /** Approver / trio / admin — server re-enforces (G6). */
  @Input() canManageConditions = false;
  @Output() conditionsChanged = new EventEmitter<void>();

  /** Self-loaded — targets for consultation_required conditions. */
  consultations: GateConsultation[] = [];

  expanded = false;
  messages: GateThreadMessage[] = [];
  conditions: GateConditionRecord[] = [];
  draft = '';
  newConditionType: 'general' | 'consultation_required' = 'general';
  newConditionTarget = '';
  newConditionText = '';
  busy = false;
  errorText = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gateRecordId'] && this.gateRecordId) { this.reload(); }
  }

  get openConditions(): GateConditionRecord[] {
    return this.conditions.filter(c => c.condition_status === 'open');
  }

  get pendingConsultations(): GateConsultation[] {
    return this.consultations.filter(c => c.response === 'pending');
  }

  get canAddCondition(): boolean {
    if (!this.newConditionText.trim()) { return false; }
    if (this.newConditionType === 'consultation_required' && !this.newConditionTarget) { return false; }
    return true;
  }

  private reload(): void {
    this.delivery.listGateThread({ gate_record_id: this.gateRecordId }).subscribe({
      next: (res) => {
        this.messages = (res.success && res.data?.gate_thread_messages) || [];
        this.cdr.markForCheck();
      },
      error: () => { /* renders empty */ }
    });
    this.delivery.listGateConditions({ gate_record_id: this.gateRecordId }).subscribe({
      next: (res) => {
        this.conditions = (res.success && res.data?.gate_conditions) || [];
        this.cdr.markForCheck();
      },
      error: () => { /* renders empty */ }
    });
    this.delivery.listGateConsultations(this.gateRecordId).subscribe({
      next: (res) => {
        this.consultations = (res.success && res.data) || [];
        this.cdr.markForCheck();
      },
      error: () => { /* picker just offers no targets */ }
    });
  }

  post(): void {
    const text = this.draft.trim();
    if (!text || this.busy) { return; }
    this.busy = true;
    this.errorText = '';
    this.delivery.addGateThreadMessage({ gate_record_id: this.gateRecordId, text }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) { this.draft = ''; this.reload(); }
        else { this.errorText = res.error ?? 'Could not post the message.'; }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not post the message.';
        this.cdr.markForCheck();
      }
    });
  }

  addCondition(): void {
    if (!this.canAddCondition || this.busy) { return; }
    this.busy = true;
    this.errorText = '';
    this.delivery.addGateCondition({
      gate_record_id: this.gateRecordId,
      type: this.newConditionType,
      text: this.newConditionText.trim(),
      ...(this.newConditionType === 'consultation_required'
        ? { target_consultation_id: this.newConditionTarget } : {})
    }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) {
          this.newConditionText = '';
          this.newConditionTarget = '';
          this.newConditionType = 'general';
          this.reload();
          this.conditionsChanged.emit();
        } else {
          this.errorText = res.error ?? 'Could not add the condition.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not add the condition.';
        this.cdr.markForCheck();
      }
    });
  }

  resolve(c: GateConditionRecord): void {
    if (this.busy) { return; }
    this.busy = true;
    this.errorText = '';
    this.delivery.resolveGateCondition({ condition_id: c.condition_id }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) { this.reload(); this.conditionsChanged.emit(); }
        else { this.errorText = res.error ?? 'Could not resolve the condition.'; }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not resolve the condition.';
        this.cdr.markForCheck();
      }
    });
  }
}
