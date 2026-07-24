// initiative-participation-section.component.ts — Pathways OI Trust
// Contract G4 (D-563/D-564): Consulted/Informed participation on the
// Initiative detail panel. One-tap Informed claim/remove for the viewer;
// role-scoped Consulted attach (trio / awaiting approver / DL / Admin —
// server-enforced, mirrored here for affordance visibility); removing another
// party's stake requires a note (inline prompt).
// Replaces the read-only D-458 array pill blocks — the arrays are retired
// (migration 084).

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnChanges, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ParticipationRecord, SpecialtyGroup, User } from '../../../core/types/database';

@Component({
  selector: 'app-initiative-participation-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pp-root">
      <!-- Consulted -->
      <div>
        <div class="pp-zone-label">Consulted</div>
        <div class="pp-chips">
          <span *ngFor="let rec of consulted" class="pp-chip">
            {{ rec.holder_display_name || rec.holder_group_name || 'Unknown' }}
            <button *ngIf="canAttach" type="button" class="pp-chip-x"
                    [attr.aria-label]="'Remove ' + (rec.holder_display_name || rec.holder_group_name)"
                    (click)="startRemove(rec)">✕</button>
          </span>
          <span *ngIf="consulted.length === 0" class="pp-empty">Consulted: none yet</span>
          <button *ngIf="canAttach" type="button" class="pp-add" (click)="attachOpen = !attachOpen">
            + Add Consulted
          </button>
        </div>
      </div>

      <!-- Attach picker (progressive disclosure: one tap deeper) -->
      <div *ngIf="attachOpen" class="pp-attach">
        <select class="pp-select" [(ngModel)]="attachSelection">
          <option value="">Select a person or Specialty Group…</option>
          <optgroup label="Specialty Groups">
            <option *ngFor="let g of activeGroups" [value]="'group:' + g.group_id">{{ g.group_name }}</option>
          </optgroup>
          <optgroup label="People">
            <option *ngFor="let u of activeUsers" [value]="'user:' + u.id">{{ u.display_name }}</option>
          </optgroup>
        </select>
        <button type="button" class="pp-btn" [disabled]="!attachSelection || busy"
                (click)="attachConsulted()">
          {{ busy && busyAction === 'attach' ? 'Adding…' : 'Add' }}
        </button>
        <button type="button" class="pp-btn-ghost" [disabled]="busy" (click)="attachOpen = false">Cancel</button>
      </div>

      <!-- Informed -->
      <div>
        <div class="pp-zone-label">Informed</div>
        <div class="pp-chips">
          <span *ngFor="let rec of informed" class="pp-chip pp-chip--informed">
            {{ rec.holder_display_name || rec.holder_group_name || 'Unknown' }}
            <button *ngIf="canAttach && !isViewerStake(rec)" type="button" class="pp-chip-x"
                    (click)="startRemove(rec)">✕</button>
          </span>
          <span *ngIf="informed.length === 0" class="pp-empty">Informed: none yet</span>
          <!-- D-564 one-tap Informed claim / remove -->
          <button type="button" class="pp-add" [disabled]="busy" (click)="toggleFollow()">
            {{ busy && busyAction === 'follow' ? 'Saving…' : (viewerInformedRecord ? '✓ Following — tap to stop' : '+ Follow (Informed)') }}
          </button>
        </div>
        <div class="pp-hint">Informed parties receive gate decisions; they are never waited on.</div>
      </div>

      <!-- Removal note prompt (D-564: required when remover ≠ holder) -->
      <div *ngIf="removeTarget" class="pp-remove-confirm">
        <div class="pp-remove-text">
          Removing {{ removeTarget.holder_display_name || removeTarget.holder_group_name }}'s
          {{ removeTarget.letter === 'C' ? 'Consulted' : 'Informed' }} stake requires a note — they will be notified.
        </div>
        <input class="pp-note-input" type="text" maxlength="300"
               placeholder="Why is this stake being removed?"
               [(ngModel)]="removeNote" />
        <div class="pp-remove-actions">
          <button type="button" class="pp-btn" [disabled]="busy || !removeNote.trim()"
                  (click)="confirmRemove()">
            {{ busy && busyAction === 'remove' ? 'Removing…' : 'Remove Stake' }}
          </button>
          <button type="button" class="pp-btn-ghost" [disabled]="busy" (click)="cancelRemove()">Cancel</button>
        </div>
      </div>

      <div *ngIf="errorText" class="pp-error" role="alert">{{ errorText }}</div>
    </div>
  `,
  styles: [`
    .pp-root { display: flex; flex-direction: column; gap: 12px; }
    .pp-zone-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--triarq-color-text-secondary); margin-bottom: 4px;
    }
    .pp-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .pp-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      border-radius: 999px; background: rgba(37,112,153,0.08); color: #257099; font-size: 12px;
    }
    .pp-chip--informed { background: rgba(0,39,78,0.06); color: #00274E; }
    .pp-chip-x { background: none; border: none; color: inherit; cursor: pointer; font-size: 11px; padding: 0; }
    .pp-empty { font-style: italic; font-size: 12px; color: #9E9E9E; }
    .pp-add {
      background: none; border: 1px dashed #B9C4CE; border-radius: 999px;
      padding: 3px 10px; font-size: 12px; color: #257099; cursor: pointer;
    }
    .pp-hint { margin-top: 4px; font: italic 11px Roboto, sans-serif; color: #5A5A5A; }
    .pp-attach { display: flex; gap: 8px; align-items: center; }
    .pp-select { flex: 1; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 8px; font-size: 12px; }
    .pp-btn {
      background: #257099; border: none; border-radius: 5px; padding: 6px 14px;
      font: 500 12px Roboto, sans-serif; color: #fff; cursor: pointer;
    }
    .pp-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .pp-btn-ghost {
      background: none; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 14px;
      font: 500 12px Roboto, sans-serif; color: #00274E; cursor: pointer;
    }
    .pp-remove-confirm {
      border-left: 3px solid #F2A620; background: rgba(242,166,32,0.08);
      padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;
    }
    .pp-remove-text { font: 400 12px Roboto, sans-serif; color: #1a1a1a; }
    .pp-note-input { border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 10px; font-size: 12px; }
    .pp-remove-actions { display: flex; gap: 8px; }
    .pp-error {
      border: 2px solid #d32f2f; border-radius: 5px; padding: 6px 10px;
      font-size: 12px; color: #d32f2f;
    }
  `]
})
export class InitiativeParticipationSectionComponent implements OnChanges {
  @Input() deliveryCycleId!: string;
  @Input() viewerUserId: string | null = null;
  /** Affordance visibility only — the server enforces role-scoped attach (G4). */
  @Input() canAttach = false;
  @Input() allUsers: User[] = [];
  @Output() participationChanged = new EventEmitter<void>();

  records: ParticipationRecord[] = [];
  groups: SpecialtyGroup[] = [];
  attachOpen = false;
  attachSelection = '';
  removeTarget: ParticipationRecord | null = null;
  removeNote = '';
  busy = false;
  busyAction: 'attach' | 'follow' | 'remove' | null = null;
  errorText = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deliveryCycleId'] && this.deliveryCycleId) {
      this.reload();
      if (this.groups.length === 0) { this.loadGroups(); }
    }
  }

  get consulted(): ParticipationRecord[] { return this.records.filter(r => r.letter === 'C'); }
  get informed():  ParticipationRecord[] { return this.records.filter(r => r.letter === 'I'); }

  get viewerInformedRecord(): ParticipationRecord | null {
    return this.informed.find(r => r.holder_user_id === this.viewerUserId) ?? null;
  }

  get activeGroups(): SpecialtyGroup[] { return this.groups.filter(g => g.active_status !== false); }
  get activeUsers(): User[] { return this.allUsers.filter(u => u.is_active !== false); }

  isViewerStake(rec: ParticipationRecord): boolean {
    return rec.holder_user_id === this.viewerUserId;
  }

  private reload(): void {
    this.delivery.listParticipation({ delivery_cycle_id: this.deliveryCycleId }).subscribe({
      next: (res) => {
        this.records = (res.success && res.data?.participation_records) || [];
        this.cdr.markForCheck();
      },
      error: () => { /* section renders empty states */ }
    });
  }

  private loadGroups(): void {
    this.delivery.listSpecialtyGroups().subscribe({
      next: (res) => {
        this.groups = (res.success && res.data?.specialty_groups) || [];
        this.cdr.markForCheck();
      },
      error: () => { /* group options omitted */ }
    });
  }

  toggleFollow(): void {
    if (!this.viewerUserId || this.busy) { return; }
    this.busy = true;
    this.busyAction = 'follow';
    this.errorText = '';
    const existing = this.viewerInformedRecord;
    const call = existing
      ? this.delivery.removeParticipation({ record_id: existing.record_id })
      : this.delivery.addParticipation({
          delivery_cycle_id: this.deliveryCycleId,
          letter: 'I',
          holder_user_id: this.viewerUserId,
          set_via: 'self'
        });
    call.subscribe({
      next: (res) => {
        this.busy = false; this.busyAction = null;
        if (!res.success) { this.errorText = res.error ?? 'Could not update your Informed stake.'; }
        this.reload();
        this.participationChanged.emit();
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false; this.busyAction = null;
        this.errorText = err.error ?? 'Could not update your Informed stake.';
        this.cdr.markForCheck();
      }
    });
  }

  attachConsulted(): void {
    if (!this.attachSelection || this.busy) { return; }
    const [kind, id] = this.attachSelection.split(':');
    this.busy = true;
    this.busyAction = 'attach';
    this.errorText = '';
    this.delivery.addParticipation({
      delivery_cycle_id: this.deliveryCycleId,
      letter: 'C',
      ...(kind === 'user' ? { holder_user_id: id } : { holder_group_id: id }),
      set_via: 'trio'
    }).subscribe({
      next: (res) => {
        this.busy = false; this.busyAction = null;
        if (res.success) {
          this.attachOpen = false;
          this.attachSelection = '';
          this.reload();
          this.participationChanged.emit();
        } else {
          this.errorText = res.error ?? 'Could not attach the Consulted stake.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false; this.busyAction = null;
        this.errorText = err.error ?? 'Could not attach the Consulted stake.';
        this.cdr.markForCheck();
      }
    });
  }

  startRemove(rec: ParticipationRecord): void {
    // Own stake removes without a note (D-564) — go straight through.
    if (this.isViewerStake(rec)) {
      this.removeTarget = rec;
      this.removeNote = '';
      this.confirmRemove(true);
      return;
    }
    this.removeTarget = rec;
    this.removeNote = '';
    this.errorText = '';
    this.cdr.markForCheck();
  }

  confirmRemove(ownStake = false): void {
    if (!this.removeTarget || this.busy) { return; }
    if (!ownStake && !this.removeNote.trim()) { return; }
    this.busy = true;
    this.busyAction = 'remove';
    this.errorText = '';
    this.delivery.removeParticipation({
      record_id: this.removeTarget.record_id,
      ...(this.removeNote.trim() ? { note: this.removeNote.trim() } : {})
    }).subscribe({
      next: (res) => {
        this.busy = false; this.busyAction = null;
        if (res.success) {
          this.removeTarget = null;
          this.removeNote = '';
          this.reload();
          this.participationChanged.emit();
        } else {
          this.errorText = res.error ?? 'Could not remove the stake.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false; this.busyAction = null;
        this.errorText = err.error ?? 'Could not remove the stake.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelRemove(): void {
    this.removeTarget = null;
    this.removeNote = '';
    this.cdr.markForCheck();
  }
}
