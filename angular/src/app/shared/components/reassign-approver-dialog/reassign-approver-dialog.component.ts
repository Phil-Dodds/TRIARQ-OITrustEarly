// reassign-approver-dialog.component.ts — Pathways OI Trust
// Contract 40 follow-on (CC-40-Q): shared "Reassign approver" dialog used by
// All Pending Gates, the Initiative grid, and the My Actions approval queue.
// Reassign = set the initiative's oversight approver (CC-40-O), which re-routes
// any in-flight gate to that person immediately, notifies the trio + displaced
// approver in-app, and lands the gate in the new approver's queue.
// Authority is enforced server-side (DL / IE / Phil); a rejection shows inline.
// Presentation only (Arch-2): data via services.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DeliveryService } from '../../../core/services/delivery.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { User } from '../../../core/types/database';

export interface ReassignApproverDialogData {
  delivery_cycle_id: string;
  cycle_title: string;
  gate_name_display?: string | null;
  current_approver_name?: string | null;
}

@Component({
  selector: 'app-reassign-approver-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rad-root">
      <h3 class="rad-title">Reassign approver</h3>
      <div class="rad-sub">{{ data.cycle_title }}<span *ngIf="data.gate_name_display"> · {{ data.gate_name_display }}</span></div>

      <div class="rad-current">
        Current approver: <strong>{{ data.current_approver_name || 'Follows defaults' }}</strong>
      </div>

      <label class="rad-label" for="rad-user">New approver</label>
      <select id="rad-user" class="rad-select" [(ngModel)]="selectedUserId" [disabled]="loadingUsers || saving">
        <option value="">{{ loadingUsers ? 'Loading people…' : 'Select a person…' }}</option>
        <option *ngFor="let u of activeUsers" [value]="u.id">{{ u.display_name }}</option>
      </select>

      <div class="rad-note">
        The gate routes to this person immediately and lands in their approval
        queue; the initiative trio and the current approver are notified.
      </div>

      <div *ngIf="errorText" class="rad-error" role="alert">{{ errorText }}</div>

      <div class="rad-actions">
        <button type="button" class="rad-primary" [disabled]="!selectedUserId || saving" (click)="save()">
          {{ saving ? 'Reassigning…' : 'Reassign' }}
        </button>
        <button type="button" class="rad-ghost" [disabled]="saving" (click)="ref.close()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .rad-root { padding: 4px 4px 0; font-family: Roboto, sans-serif; min-width: 320px; }
    .rad-title { margin: 0 0 2px; font: 600 16px Roboto; color: #00274E; }
    .rad-sub { font: 400 12px Roboto; color: #5A5A5A; margin-bottom: 12px; }
    .rad-current { font: 400 13px Roboto; color: #1E1E1E; margin-bottom: 12px; }
    .rad-label { display: block; font: 600 10px Roboto; letter-spacing: 0.05em; text-transform: uppercase; color: #5A5A5A; margin-bottom: 4px; }
    .rad-select { width: 100%; border: 1px solid #B9C4CE; border-radius: 5px; padding: 6px 8px; font: 400 13px Roboto; }
    .rad-note { font: italic 11px Roboto; color: #5A5A5A; margin: 8px 0; }
    .rad-error { border: 1px solid #C62828; border-radius: 5px; padding: 6px 8px; font: 400 12px Roboto; color: #C62828; margin-bottom: 8px; }
    .rad-actions { display: flex; gap: 8px; margin-top: 8px; }
    .rad-primary { background: #257099; border: none; border-radius: 5px; padding: 7px 16px; font: 600 13px Roboto; color: #fff; cursor: pointer; }
    .rad-primary:disabled { opacity: .5; cursor: not-allowed; }
    .rad-ghost { background: #fff; border: 1px solid #B9C4CE; border-radius: 5px; padding: 7px 14px; font: 500 13px Roboto; color: #00274E; cursor: pointer; }
  `]
})
export class ReassignApproverDialogComponent implements OnInit {
  users: User[] = [];
  loadingUsers = true;
  selectedUserId = '';
  saving = false;
  errorText = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReassignApproverDialogData,
    public ref: MatDialogRef<ReassignApproverDialogComponent>,
    private readonly delivery: DeliveryService,
    private readonly profile: UserProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get activeUsers(): User[] { return this.users.filter(u => u.is_active !== false); }

  ngOnInit(): void {
    this.profile.listUsers().subscribe({
      next: (list) => { this.users = list ?? []; this.loadingUsers = false; this.cdr.markForCheck(); },
      error: () => { this.loadingUsers = false; this.cdr.markForCheck(); }
    });
  }

  save(): void {
    if (!this.selectedUserId || this.saving) { return; }
    this.saving = true; this.errorText = ''; this.cdr.markForCheck();
    this.delivery.setOversight({ delivery_cycle_id: this.data.delivery_cycle_id, user_id: this.selectedUserId })
      .subscribe({
        next: (res) => {
          if (res.success) { this.ref.close({ reassigned: true, user_id: this.selectedUserId }); }
          else { this.saving = false; this.errorText = res.error ?? 'Reassignment failed.'; this.cdr.markForCheck(); }
        },
        error: (err: { error?: string }) => {
          this.saving = false; this.errorText = err.error ?? 'Reassignment failed.'; this.cdr.markForCheck();
        }
      });
  }
}
