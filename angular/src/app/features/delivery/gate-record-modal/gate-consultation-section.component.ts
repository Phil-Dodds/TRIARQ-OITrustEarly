// gate-consultation-section.component.ts — Pathways OI Trust
// Contract 29 WS2 (D-461/D-462). Consulted summary section for the Gate Record
// Modal. Extracted as a standalone component per the build-c-spec structural
// note (the modal already exceeds 400 lines).
//
// Behavior (D-460/D-461):
//   - Lists all gate_consultations for the gate (list_gate_consultations).
//   - Hidden entirely when there are no consultation records.
//   - Summary line: "N of N reviewed · X approved, Y declined" (stone, 11px, D-284).
//   - One row per consulted party: name chip + response status chip + notes
//     icon (expands inline) + "Edit response" on the CURRENT user's own row only.
//   - Edit response: inline picker Approved / Declined / (Declined Post-Approval
//     when the gate is already approved). Optional notes. Save → record_consultation_response.
//     Reversible (no D-183 two-step).
//
// Presentation + data via DeliveryService only (D-93). OnPush.

import {
  Component, Input, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { GateConsultation, ConsultationResponse, GateStatus } from '../../../core/types/database';

@Component({
  selector:        'app-gate-consultation-section',
  standalone:      true,
  imports:         [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section *ngIf="consultations.length > 0" class="gcs-section">
      <div class="gcs-header">
        <span class="gcs-label">Consulted</span>
        <span class="gcs-summary">{{ summaryLine }}</span>
      </div>

      <div *ngFor="let c of consultations" class="gcs-row">
        <span class="gcs-chip">{{ c.display_name }}</span>

        <span class="gcs-status" [style.color]="responseColor(c.response)"
              [class.gcs-status-italic]="c.response === 'declined_post_approval'">
          {{ responseLabel(c.response) }}
        </span>

        <button *ngIf="c.notes" type="button" class="gcs-notes-btn"
                (click)="toggleNotes(c.id)" [attr.aria-expanded]="expandedNotesId === c.id"
                aria-label="Show notes">🗨</button>

        <button *ngIf="c.consulted_user_id === currentUserId && editingId !== c.id"
                type="button" class="gcs-edit-btn" (click)="startEdit(c)">
          Edit response
        </button>

        <div *ngIf="expandedNotesId === c.id && c.notes" class="gcs-notes">{{ c.notes }}</div>

        <!-- Inline response editor — current user's own row only -->
        <div *ngIf="editingId === c.id" class="gcs-editor">
          <label class="gcs-opt">
            <input type="radio" name="resp" value="approved" [(ngModel)]="draftResponse" /> Approved
          </label>
          <label class="gcs-opt">
            <input type="radio" name="resp" value="declined" [(ngModel)]="draftResponse" /> Declined
          </label>
          <label *ngIf="gateStatus === 'approved'" class="gcs-opt">
            <input type="radio" name="resp" value="declined_post_approval" [(ngModel)]="draftResponse" />
            Declined (post-approval)
          </label>
          <textarea class="gcs-notes-input" [(ngModel)]="draftNotes" rows="2"
                    placeholder="Optional notes…"></textarea>
          <div *ngIf="editError" class="gcs-edit-error">{{ editError }}</div>
          <div class="gcs-editor-actions">
            <button type="button" class="gcs-save" [disabled]="!draftResponse || saving"
                    (click)="saveEdit(c)">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="gcs-cancel" [disabled]="saving" (click)="cancelEdit()">Cancel</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .gcs-section { padding: 12px 0; border-top: 1px solid #E8E8E8; margin-top: 8px; }
    .gcs-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
    .gcs-label { font: 600 10px/1 Roboto; letter-spacing: 0.06em; text-transform: uppercase; color: #5A5A5A; }
    .gcs-summary { font: 400 11px/1.2 Roboto; color: #5A5A5A; }
    .gcs-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 5px 0; }
    .gcs-chip { display: inline-block; padding: 3px 10px; border-radius: 999px; background: rgba(37,112,153,0.08); color: #257099; font: 400 12px Roboto; }
    .gcs-status { font: 500 12px Roboto; }
    .gcs-status-italic { font-style: italic; }
    .gcs-notes-btn, .gcs-edit-btn { background: none; border: none; cursor: pointer; padding: 2px 4px; font: 400 12px Roboto; }
    .gcs-notes-btn { color: #5A5A5A; }
    .gcs-edit-btn { color: #257099; margin-left: auto; }
    .gcs-edit-btn:hover { text-decoration: underline; }
    .gcs-notes { flex-basis: 100%; padding: 6px 10px; margin: 2px 0 0; background: #FAFAFA; border-radius: 5px; font: 400 12px/1.4 Roboto; color: #262626; }
    .gcs-editor { flex-basis: 100%; display: flex; flex-direction: column; gap: 6px; padding: 8px 0 2px; }
    .gcs-opt { font: 400 13px Roboto; color: #262626; display: inline-flex; align-items: center; gap: 6px; }
    .gcs-notes-input { width: 100%; box-sizing: border-box; border: 1.5px solid #D0D0D0; border-radius: 5px; padding: 6px 8px; font: 400 13px Roboto; resize: vertical; }
    .gcs-notes-input:focus { outline: none; border-color: #257099; }
    .gcs-edit-error { font: 400 12px Roboto; color: #C62828; }
    .gcs-editor-actions { display: flex; gap: 8px; }
    .gcs-save { background: #257099; border: none; border-radius: 5px; padding: 6px 16px; color: #fff; font: 500 13px Roboto; cursor: pointer; }
    .gcs-save:disabled { opacity: 0.45; cursor: not-allowed; }
    .gcs-cancel { background: #fff; border: 1.5px solid #D0D0D0; border-radius: 5px; padding: 6px 14px; color: #5A5A5A; font: 500 13px Roboto; cursor: pointer; }
  `]
})
export class GateConsultationSectionComponent implements OnChanges {
  /** Gate whose consultations to load. */
  @Input() gateRecordId: string | null = null;
  /** Current gate status — gates the 'declined_post_approval' option. */
  @Input() gateStatus: GateStatus | null = null;
  /** Current user — only their own row gets the Edit affordance. */
  @Input() currentUserId: string | null = null;

  consultations: GateConsultation[] = [];

  expandedNotesId: string | null = null;
  editingId:       string | null = null;
  draftResponse:   ConsultationResponse | null = null;
  draftNotes = '';
  saving = false;
  editError = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gateRecordId']) { this.load(); }
  }

  private load(): void {
    if (!this.gateRecordId) { this.consultations = []; this.cdr.markForCheck(); return; }
    this.delivery.listGateConsultations(this.gateRecordId).subscribe({
      next: (res) => {
        this.consultations = res.success ? (res.data ?? []) : [];
        this.cdr.markForCheck();
      },
      error: () => { this.consultations = []; this.cdr.markForCheck(); }
    });
  }

  get summaryLine(): string {
    const total    = this.consultations.length;
    const reviewed = this.consultations.filter(c => c.response !== 'pending').length;
    const approved = this.consultations.filter(c => c.response === 'approved').length;
    const declined = this.consultations.filter(
      c => c.response === 'declined' || c.response === 'declined_post_approval'
    ).length;
    return `${reviewed} of ${total} reviewed · ${approved} approved, ${declined} declined`;
  }

  responseLabel(r: ConsultationResponse): string {
    switch (r) {
      case 'approved':               return 'Approved ✓';
      case 'declined':               return 'Declined ✗';
      case 'declined_post_approval': return 'Declined (post-approval)';
      default:                       return 'Pending ·';
    }
  }

  responseColor(r: ConsultationResponse): string {
    switch (r) {
      case 'approved':               return '#22c55e';
      case 'declined':               return '#E96127';
      case 'declined_post_approval': return '#5A5A5A';
      default:                       return '#5A5A5A';
    }
  }

  toggleNotes(id: string): void {
    this.expandedNotesId = this.expandedNotesId === id ? null : id;
  }

  startEdit(c: GateConsultation): void {
    this.editingId = c.id;
    this.draftResponse = (c.response === 'pending') ? null : c.response;
    this.draftNotes = c.notes ?? '';
    this.editError = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.draftResponse = null;
    this.draftNotes = '';
    this.editError = '';
  }

  saveEdit(c: GateConsultation): void {
    if (!this.draftResponse || !this.gateRecordId) { return; }
    this.saving = true;
    this.editError = '';
    this.delivery.recordConsultationResponse({
      gate_record_id: this.gateRecordId,
      response:       this.draftResponse,
      notes:          this.draftNotes.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.cancelEdit();
          this.load();
        } else {
          this.editError = res.error ?? 'Could not save your response.';
          this.cdr.markForCheck();
        }
      },
      error: (err: { error?: string }) => {
        this.saving = false;
        this.editError = err?.error ?? 'Could not save your response.';
        this.cdr.markForCheck();
      }
    });
  }
}
