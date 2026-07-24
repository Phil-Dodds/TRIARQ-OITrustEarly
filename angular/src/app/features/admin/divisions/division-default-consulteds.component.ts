// division-default-consulteds.component.ts — Pathways OI Trust
// Contract G4 (D-563): Division default Consulted parties. Maintained by the
// Division Leader (or an Admin) on the Divisions admin surface; attached
// automatically as Consulted stakes when a new Initiative is created in the
// Division (create_delivery_cycle). Server enforces DL/admin auth.

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DivisionDefaultConsulted, SpecialtyGroup, User } from '../../../core/types/database';

@Component({
  selector: 'app-division-default-consulteds',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ddc-root">
      <div class="ddc-label">Default Consulted Parties</div>
      <div class="ddc-desc">
        Attached as Consulted on every new Initiative created in this Division.
      </div>

      <div class="ddc-chips">
        <span *ngFor="let d of defaults" class="ddc-chip">
          {{ d.holder_display_name || d.holder_group_name || 'Unknown' }}
          <button *ngIf="canEdit" type="button" class="ddc-chip-x"
                  [disabled]="busy"
                  (click)="remove(d)">✕</button>
        </span>
        <span *ngIf="defaults.length === 0" class="ddc-empty">None configured</span>
      </div>

      <div *ngIf="canEdit" class="ddc-add-row">
        <select class="ddc-select" [(ngModel)]="selection" [disabled]="busy">
          <option value="">Add a person or Specialty Group…</option>
          <optgroup label="Specialty Groups">
            <option *ngFor="let g of activeGroups" [value]="'group:' + g.group_id">{{ g.group_name }}</option>
          </optgroup>
          <optgroup label="People">
            <option *ngFor="let u of activeUsers" [value]="'user:' + u.id">{{ u.display_name }}</option>
          </optgroup>
        </select>
        <button type="button" class="ddc-btn" [disabled]="!selection || busy" (click)="add()">
          {{ busy ? 'Saving…' : 'Add' }}
        </button>
      </div>

      <div *ngIf="errorText" class="ddc-error" role="alert">{{ errorText }}</div>
    </div>
  `,
  styles: [`
    .ddc-root { display: flex; flex-direction: column; gap: 6px; }
    .ddc-label {
      font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: var(--triarq-color-text-secondary);
    }
    .ddc-desc { font: italic 11px Roboto, sans-serif; color: #5A5A5A; }
    .ddc-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .ddc-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
      border-radius: 999px; background: rgba(37,112,153,0.08); color: #257099; font-size: 12px;
    }
    .ddc-chip-x { background: none; border: none; color: inherit; cursor: pointer; font-size: 11px; padding: 0; }
    .ddc-empty { font-style: italic; font-size: 12px; color: #9E9E9E; }
    .ddc-add-row { display: flex; gap: 8px; align-items: center; }
    .ddc-select { flex: 1; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 8px; font-size: 12px; }
    .ddc-btn {
      background: #257099; border: none; border-radius: 5px; padding: 6px 14px;
      font: 500 12px Roboto, sans-serif; color: #fff; cursor: pointer;
    }
    .ddc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .ddc-error {
      border: 2px solid #d32f2f; border-radius: 5px; padding: 6px 10px;
      font-size: 12px; color: #d32f2f;
    }
  `]
})
export class DivisionDefaultConsultedsComponent implements OnChanges {
  @Input() divisionId!: string;
  /** Affordance visibility — server enforces DL/admin (G4). */
  @Input() canEdit = false;
  @Input() allUsers: User[] = [];

  defaults: DivisionDefaultConsulted[] = [];
  groups: SpecialtyGroup[] = [];
  selection = '';
  busy = false;
  errorText = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['divisionId'] && this.divisionId) {
      this.reload();
      if (this.groups.length === 0) { this.loadGroups(); }
    }
  }

  get activeGroups(): SpecialtyGroup[] { return this.groups.filter(g => g.active_status !== false); }
  get activeUsers(): User[] { return this.allUsers.filter(u => u.is_active !== false); }

  private reload(): void {
    this.delivery.listDivisionDefaultConsulteds({ division_id: this.divisionId }).subscribe({
      next: (res) => {
        this.defaults = (res.success && res.data?.division_default_consulteds) || [];
        this.cdr.markForCheck();
      },
      error: () => { /* renders empty state */ }
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

  add(): void {
    if (!this.selection || this.busy) { return; }
    const [kind, id] = this.selection.split(':');
    this.busy = true;
    this.errorText = '';
    this.delivery.addDivisionDefaultConsulted({
      division_id: this.divisionId,
      ...(kind === 'user' ? { holder_user_id: id } : { holder_group_id: id })
    }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) { this.selection = ''; this.reload(); }
        else { this.errorText = res.error ?? 'Could not add the default Consulted party.'; }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not add the default Consulted party.';
        this.cdr.markForCheck();
      }
    });
  }

  remove(d: DivisionDefaultConsulted): void {
    if (this.busy) { return; }
    this.busy = true;
    this.errorText = '';
    this.delivery.removeDivisionDefaultConsulted({ default_consulted_id: d.default_consulted_id }).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success) { this.reload(); }
        else { this.errorText = res.error ?? 'Could not remove the default Consulted party.'; }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.busy = false;
        this.errorText = err.error ?? 'Could not remove the default Consulted party.';
        this.cdr.markForCheck();
      }
    });
  }
}
