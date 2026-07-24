// sizing-edit-dialog.component.ts — Pathways OI Trust
// Contract G3 (D-567/D-562): post-creation sizing edit. Reuses
// InitiativeSizingFormComponent. Post-Go-to-Build edits hit the MCP guard —
// the REQUIRES_APPROVER_CONFIRMATION preview renders as an inline two-step
// confirm (S-023) showing the level change before the confirmed second call.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryService } from '../../../core/services/delivery.service';
import { InitiativeSizing } from '../../../core/types/database';
import { InitiativeSizingFormComponent, SizingFormPayload } from './initiative-sizing-form.component';

export interface SizingEditDialogData {
  delivery_cycle_id: string;
  cycle_title:       string;
  dcs_user_id:       string | null;
}

@Component({
  selector: 'app-sizing-edit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, InitiativeSizingFormComponent],
  template: `
    <div class="sed-shell">
      <div class="sed-header">
        <div class="sed-title">Edit Sizing — {{ data.cycle_title }}</div>
        <button class="sed-close" type="button" [disabled]="saving" (click)="dialogRef.close(false)">×</button>
      </div>

      <div class="sed-body">
        <div *ngIf="loading" class="sed-loading">Loading sizing…</div>

        <app-initiative-sizing-form *ngIf="!loading"
          [initialSizing]="sizing"
          [dcsUserId]="data.dcs_user_id"
          (payloadChange)="onPayloadChange($event)">
        </app-initiative-sizing-form>

        <!-- Post-GtB approver confirmation (S-023 inline two-step) -->
        <div *ngIf="confirmPreview" class="sed-confirm">
          <div class="sed-confirm-icon">⚠</div>
          <div>
            <div class="sed-confirm-text">{{ confirmPreview.message }}</div>
            <div class="sed-confirm-levels">
              Baseline: Level {{ confirmPreview.current ?? '—' }} → Level {{ confirmPreview.next ?? '—' }}
            </div>
          </div>
        </div>

        <div *ngIf="saveError" class="sed-error" role="alert">{{ saveError }}</div>

        <div class="sed-footer">
          <button class="sed-btn-primary" type="button"
                  [disabled]="saving || loading"
                  (click)="onSave()">
            {{ saving ? 'Saving…' : (confirmPreview ? 'Confirm & Save' : 'Save Sizing') }}
          </button>
          <button class="sed-btn-ghost" type="button" [disabled]="saving" (click)="dialogRef.close(false)">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sed-shell { display: flex; flex-direction: column; max-height: 82vh; }
    .sed-header {
      display: flex; justify-content: space-between; align-items: center;
      background: #00274E; color: #fff; padding: 14px 20px; border-radius: 10px 10px 0 0;
    }
    .sed-title { font: 500 15px Roboto, sans-serif; }
    .sed-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
    .sed-body { padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
    .sed-loading { font: italic 12px Roboto, sans-serif; color: #5A5A5A; }
    .sed-confirm {
      display: flex; gap: 10px; border-left: 3px solid #F2A620;
      background: rgba(242, 166, 32, 0.08); padding: 10px 12px;
    }
    .sed-confirm-icon { color: #F2A620; }
    .sed-confirm-text { font: 400 13px Roboto, sans-serif; color: #1a1a1a; }
    .sed-confirm-levels { font: 500 12px Roboto, sans-serif; color: #00274E; margin-top: 4px; }
    .sed-error {
      border: 2px solid #d32f2f; border-radius: 5px; padding: 8px 12px;
      font: 400 12px Roboto, sans-serif; color: #d32f2f;
    }
    .sed-footer { display: flex; gap: 10px; justify-content: flex-end; }
    .sed-btn-primary {
      background: #257099; border: none; border-radius: 5px; padding: 9px 20px;
      font: 500 13px Roboto, sans-serif; color: #fff; cursor: pointer;
    }
    .sed-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .sed-btn-ghost {
      background: none; border: 1px solid #B9C4CE; border-radius: 5px; padding: 9px 20px;
      font: 500 13px Roboto, sans-serif; color: #00274E; cursor: pointer;
    }
  `]
})
export class SizingEditDialogComponent implements OnInit {
  sizing: InitiativeSizing | null = null;
  payload: SizingFormPayload | null = null;
  loading = true;
  saving = false;
  saveError = '';
  confirmPreview: { message: string; current: number | null; next: number | null } | null = null;

  constructor(
    public readonly dialogRef: MatDialogRef<SizingEditDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public readonly data: SizingEditDialogData,
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.getInitiativeSizing({ delivery_cycle_id: this.data.delivery_cycle_id })
      .subscribe({
        next: (res) => {
          this.sizing = res.success ? (res.data?.sizing ?? null) : null;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  onPayloadChange(payload: SizingFormPayload): void {
    this.payload = payload;
    // Any change invalidates a pending confirmation preview.
    this.confirmPreview = null;
    this.cdr.markForCheck();
  }

  onSave(): void {
    if (!this.payload?.valid) {
      this.saveError = 'Answer all five sizing questions.';
      this.cdr.markForCheck();
      return;
    }
    this.saving = true;
    this.saveError = '';
    const confirmed = !!this.confirmPreview;
    this.delivery.upsertInitiativeSizing({
      delivery_cycle_id: this.data.delivery_cycle_id,
      answers: this.payload.answers,
      subs:    this.payload.subs,
      notes:   this.payload.notes,
      ...(confirmed ? { approver_confirmed: true } : {})
    }).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success && res.status === 'REQUIRES_APPROVER_CONFIRMATION') {
          this.confirmPreview = {
            message: res.data?.message ?? 'Go to Build has been approved — confirm this sizing edit.',
            current: res.data?.current_baseline_level ?? null,
            next:    res.data?.new_baseline_level ?? null
          };
          this.cdr.markForCheck();
          return;
        }
        if (res.success) {
          this.dialogRef.close(true);
          return;
        }
        this.saveError = res.error ?? 'Sizing save failed. Please try again.';
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.saving = false;
        this.saveError = err.error ?? 'Sizing save failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
