// cancel-request-banner.component.ts — Pathways OI Trust
// Contract G10 (D-566): request-cancel surfaces on the Initiative panel.
//   - Open request → amber banner with the reason; the authority (or IE/
//     Admin) executes via the existing Cancel flow or declines with a note.
//   - No open request → trio members get "Request Cancel…" (reason required)
//     when they lack direct cancel authority. Server enforces everything.

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnChanges, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService, CancelRequest } from '../../../core/services/delivery.service';

@Component({
  selector: 'app-cancel-request-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Open request banner -->
    <div *ngIf="request" class="crb-banner">
      <div class="crb-icon">⚠</div>
      <div class="crb-body">
        <div class="crb-text">
          <strong>Cancellation requested</strong> by
          {{ request!.requested_by_display_name || 'a trio member' }} —
          “{{ request!.reason }}”
        </div>
        <div class="crb-actions">
          <button type="button" class="crb-btn" [disabled]="busy" (click)="executeRequested.emit()">
            Cancel the Initiative…
          </button>
          <button type="button" class="crb-btn-ghost" [disabled]="busy"
                  (click)="declineOpen = !declineOpen">Decline…</button>
        </div>
        <div *ngIf="declineOpen" class="crb-decline">
          <input type="text" maxlength="300" placeholder="Why does the work continue? (the requester is notified)"
                 [(ngModel)]="declineNote" [disabled]="busy" class="crb-input" />
          <button type="button" class="crb-btn" [disabled]="busy || !declineNote.trim()"
                  (click)="decline()">{{ busy ? 'Saving…' : 'Decline Request' }}</button>
        </div>
      </div>
    </div>

    <!-- Request affordance (trio, no open request) -->
    <div *ngIf="!request && showRequestAffordance" class="crb-request">
      <button *ngIf="!requestOpen" type="button" class="crb-link" (click)="requestOpen = true">
        Request Cancel…
      </button>
      <div *ngIf="requestOpen" class="crb-decline">
        <input type="text" maxlength="300" placeholder="Why should this Initiative be cancelled? (required)"
               [(ngModel)]="requestReason" [disabled]="busy" class="crb-input" />
        <button type="button" class="crb-btn" [disabled]="busy || !requestReason.trim()"
                (click)="submitRequest()">{{ busy ? 'Sending…' : 'Send Request' }}</button>
        <button type="button" class="crb-btn-ghost" [disabled]="busy" (click)="requestOpen = false">Cancel</button>
      </div>
    </div>

    <div *ngIf="errorText" class="crb-error" role="alert">{{ errorText }}</div>
  `,
  styles: [`
    .crb-banner {
      display: flex; gap: 10px; border-left: 3px solid #F2A620;
      background: rgba(242,166,32,0.08); padding: 10px 12px; margin: 8px 0;
    }
    .crb-icon { color: #F2A620; }
    .crb-body { display: flex; flex-direction: column; gap: 6px; }
    .crb-text { font: 400 13px Roboto, sans-serif; color: #1a1a1a; }
    .crb-actions, .crb-decline { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .crb-btn {
      background: #257099; border: none; border-radius: 5px; padding: 6px 14px;
      font: 500 12px Roboto, sans-serif; color: #fff; cursor: pointer;
    }
    .crb-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .crb-btn-ghost {
      background: none; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 14px;
      font: 500 12px Roboto, sans-serif; color: #00274E; cursor: pointer;
    }
    .crb-input { flex: 1; min-width: 200px; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 10px; font-size: 12px; }
    .crb-request { margin: 4px 0; }
    .crb-link { background: none; border: none; color: #257099; cursor: pointer; font-size: 12px; text-decoration: underline; padding: 0; }
    .crb-error { border: 2px solid #d32f2f; border-radius: 5px; padding: 6px 10px; font-size: 12px; color: #d32f2f; margin-top: 4px; }
  `]
})
export class CancelRequestBannerComponent implements OnChanges {
  @Input() deliveryCycleId!: string;
  /** Affordance visibility only — the server enforces authority (D-566). */
  @Input() showRequestAffordance = false;
  @Output() executeRequested = new EventEmitter<void>();
  @Output() requestChanged = new EventEmitter<void>();

  request: CancelRequest | null = null;
  declineOpen = false;
  declineNote = '';
  requestOpen = false;
  requestReason = '';
  busy = false;
  errorText = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deliveryCycleId'] && this.deliveryCycleId) { this.reload(); }
  }

  reload(): void {
    this.delivery.getOpenCancelRequest({ delivery_cycle_id: this.deliveryCycleId }).subscribe({
      next: (res) => {
        this.request = (res.success && res.data?.request) || null;
        this.cdr.markForCheck();
      },
      error: () => { /* banner just stays hidden */ }
    });
  }

  submitRequest(): void {
    const reason = this.requestReason.trim();
    if (!reason || this.busy) { return; }
    this.busy = true;
    this.errorText = '';
    this.delivery.requestCancel({ delivery_cycle_id: this.deliveryCycleId, reason }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) {
          this.requestOpen = false;
          this.requestReason = '';
          this.reload();
          this.requestChanged.emit();
        } else {
          this.errorText = res.error ?? 'Could not send the cancel request.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not send the cancel request.';
        this.cdr.markForCheck();
      }
    });
  }

  decline(): void {
    if (!this.request || this.busy || !this.declineNote.trim()) { return; }
    this.busy = true;
    this.errorText = '';
    this.delivery.declineCancelRequest({
      request_id: this.request.request_id,
      note: this.declineNote.trim()
    }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) {
          this.declineOpen = false;
          this.declineNote = '';
          this.reload();
          this.requestChanged.emit();
        } else {
          this.errorText = res.error ?? 'Could not decline the request.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not decline the request.';
        this.cdr.markForCheck();
      }
    });
  }
}
