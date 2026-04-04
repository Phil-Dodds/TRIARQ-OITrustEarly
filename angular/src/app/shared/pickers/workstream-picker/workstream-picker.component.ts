// workstream-picker.component.ts — Pathways OI Trust
// Picker modal for selecting a Delivery Workstream.
//
// CC-002 (Workstream Picker Design Session 2026-04-04):
// - Scope radio controls list contents (not a filter field on the list itself)
//   Scopes: Cycle's Division (division_tree) | Trust | My Divisions | All
// - Columns: Division Name, Workstream Name, inline (Inactive) badge
// - Echo section: lead name, division, status, active cycle count
// - "Show inactive" toggle — off by default; when on, inactive rows shown with badge but not selectable
// - Pre-selects current workstream row if one is already set on the cycle
// - OK: emits selected workstream; Cancel: emits null
//
// Inactive Workstreams are NOT selectable in the Delivery Cycle workflow (D-165, ARCH-23).
// They are shown (when toggle is on) so the user can see why the previous selection may be blocked.
//
// D-93: No direct Supabase access — calls DeliveryService which calls MCP.
// ChangeDetection: OnPush.

import {
  Component, OnInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DeliveryWorkstream } from '../../../core/types/database';

type ScopeType = 'division_tree' | 'trust' | 'user_divisions' | 'all';

@Component({
  selector:        'app-workstream-picker',
  standalone:      true,
  imports:         [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ws-picker-overlay" (click)="onOverlayClick($event)">
      <div class="ws-picker-modal" role="dialog" aria-modal="true" aria-label="Select Workstream">

        <!-- Header -->
        <div class="ws-picker-header">
          <h2 class="ws-picker-title">Select Workstream</h2>
          <button class="ws-picker-close" (click)="cancel()" aria-label="Close picker">✕</button>
        </div>

        <!-- Scope radio -->
        <div class="ws-scope-row">
          <span class="ws-scope-label">Scope:</span>
          <label *ngFor="let opt of scopeOptions" class="ws-scope-option">
            <input type="radio" [value]="opt.value" [formControl]="scopeCtrl" />
            {{ opt.label }}
          </label>
        </div>

        <!-- Show inactive toggle -->
        <div class="ws-inactive-toggle">
          <label class="ws-toggle-label">
            <input type="checkbox" [formControl]="showInactiveCtrl" />
            Show inactive Workstreams
          </label>
        </div>

        <!-- Error message -->
        <div *ngIf="loadError" class="ws-load-error" role="alert">
          <span class="ws-error-primary">Could not load Workstreams.</span>
          <span class="ws-error-secondary">{{ loadError }}</span>
        </div>

        <!-- Loading state -->
        <div *ngIf="loading && !loadError" class="ws-loading">
          Loading Workstreams…
        </div>

        <!-- Workstream list -->
        <div *ngIf="!loading && !loadError" class="ws-list-container">
          <div *ngIf="rows.length === 0" class="ws-empty">
            No Workstreams found for this scope.
          </div>

          <table *ngIf="rows.length > 0" class="ws-table" role="grid">
            <thead>
              <tr>
                <th scope="col">Division</th>
                <th scope="col">Workstream</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ws of rows"
                  [class.ws-row-selected]="selectedId === ws.workstream_id"
                  [class.ws-row-inactive]="!ws.active_status"
                  [attr.aria-selected]="selectedId === ws.workstream_id"
                  (click)="selectRow(ws)"
                  role="row">
                <td class="ws-cell-division">{{ ws.home_division_name ?? '—' }}</td>
                <td class="ws-cell-name">
                  {{ ws.workstream_name }}
                  <span *ngIf="!ws.active_status" class="ws-inactive-badge">Inactive</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Echo section — shows details for the highlighted row -->
        <div *ngIf="echoWorkstream" class="ws-echo-section">
          <div class="ws-echo-row">
            <span class="ws-echo-label">Lead:</span>
            <span class="ws-echo-value">{{ echoWorkstream.lead_display_name ?? '—' }}</span>
          </div>
          <div class="ws-echo-row">
            <span class="ws-echo-label">Division:</span>
            <span class="ws-echo-value">{{ echoWorkstream.home_division_name ?? '—' }}</span>
          </div>
          <div class="ws-echo-row">
            <span class="ws-echo-label">Status:</span>
            <span class="ws-echo-value" [class.ws-echo-inactive]="!echoWorkstream.active_status">
              {{ echoWorkstream.active_status ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="ws-echo-row">
            <span class="ws-echo-label">Active cycles:</span>
            <span class="ws-echo-value">{{ echoWorkstream.active_cycle_count ?? 0 }}</span>
          </div>
        </div>

        <!-- Inactive selection warning -->
        <div *ngIf="echoWorkstream && !echoWorkstream.active_status" class="ws-inactive-warning" role="alert">
          <span class="ws-error-primary">This Workstream is inactive and cannot be selected.</span>
          <span class="ws-error-secondary">A Division Admin must reactivate it before it can be assigned to a cycle.</span>
        </div>

        <!-- Footer -->
        <div class="ws-picker-footer">
          <button class="ws-btn-cancel" (click)="cancel()">Cancel</button>
          <button class="ws-btn-ok"
                  [disabled]="!canConfirm"
                  (click)="confirm()">
            OK
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .ws-picker-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .ws-picker-modal {
      background: #fff;
      border-radius: 10px;
      width: 620px; max-width: 95vw;
      max-height: 80vh;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.24);
    }
    .ws-picker-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--triarq-space-md) var(--triarq-space-lg);
      border-bottom: 1px solid #e5e5e5;
    }
    .ws-picker-title {
      font-size: var(--triarq-text-h4, 16px);
      font-weight: var(--triarq-font-weight-bold);
      color: var(--triarq-color-text-primary);
      margin: 0;
    }
    .ws-picker-close {
      background: none; border: none; cursor: pointer;
      font-size: 18px; color: var(--triarq-color-text-secondary);
      line-height: 1;
    }
    .ws-scope-row {
      display: flex; align-items: center; gap: var(--triarq-space-md);
      flex-wrap: wrap;
      padding: var(--triarq-space-sm) var(--triarq-space-lg);
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
    }
    .ws-scope-label {
      font-size: var(--triarq-text-caption); font-weight: var(--triarq-font-weight-bold);
      color: var(--triarq-color-text-secondary);
    }
    .ws-scope-option {
      display: flex; align-items: center; gap: 4px;
      font-size: var(--triarq-text-caption);
      cursor: pointer;
    }
    .ws-inactive-toggle {
      padding: var(--triarq-space-xs) var(--triarq-space-lg);
      background: #fafafa;
    }
    .ws-toggle-label {
      font-size: var(--triarq-text-caption);
      display: flex; align-items: center; gap: 6px;
      cursor: pointer;
    }
    .ws-load-error, .ws-loading, .ws-empty {
      padding: var(--triarq-space-md) var(--triarq-space-lg);
      font-size: var(--triarq-text-body);
    }
    .ws-error-primary { display: block; color: var(--triarq-color-error, #e53935); }
    .ws-error-secondary { display: block; font-size: var(--triarq-text-caption); color: var(--triarq-color-text-secondary); margin-top: 2px; }
    .ws-list-container { flex: 1; overflow-y: auto; }
    .ws-table { width: 100%; border-collapse: collapse; }
    .ws-table th {
      text-align: left;
      font-size: var(--triarq-text-caption);
      font-weight: var(--triarq-font-weight-bold);
      color: var(--triarq-color-text-secondary);
      padding: var(--triarq-space-xs) var(--triarq-space-md);
      border-bottom: 1px solid #e5e5e5;
      position: sticky; top: 0; background: #fff;
    }
    .ws-table td {
      padding: var(--triarq-space-xs) var(--triarq-space-md);
      font-size: var(--triarq-text-body);
      border-bottom: 1px solid #f5f5f5;
      vertical-align: middle;
    }
    .ws-table tr { cursor: pointer; }
    .ws-row-selected td { background: rgba(37,112,153,0.1); }
    .ws-row-inactive { opacity: 0.6; cursor: default; }
    .ws-row-inactive:hover td { background: none; }
    .ws-table tr:not(.ws-row-inactive):hover td { background: #f5f9fb; }
    .ws-inactive-badge {
      display: inline-block;
      background: rgba(0,0,0,0.08);
      color: var(--triarq-color-text-secondary);
      font-size: 10px;
      border-radius: 999px;
      padding: 1px 6px;
      margin-left: 6px;
      vertical-align: middle;
    }
    .ws-echo-section {
      border-top: 1px solid #e5e5e5;
      background: #f5f9fb;
      padding: var(--triarq-space-sm) var(--triarq-space-lg);
      display: grid; grid-template-columns: 1fr 1fr;
      gap: var(--triarq-space-xs);
    }
    .ws-echo-row { display: contents; }
    .ws-echo-label { font-size: var(--triarq-text-caption); color: var(--triarq-color-text-secondary); }
    .ws-echo-value { font-size: var(--triarq-text-caption); color: var(--triarq-color-text-primary); }
    .ws-echo-inactive { color: var(--triarq-color-error, #e53935); }
    .ws-inactive-warning {
      padding: var(--triarq-space-xs) var(--triarq-space-lg);
      background: #fff8f0;
      border-top: 1px solid #ffe0b2;
    }
    .ws-picker-footer {
      display: flex; justify-content: flex-end; gap: var(--triarq-space-sm);
      padding: var(--triarq-space-sm) var(--triarq-space-lg);
      border-top: 1px solid #e5e5e5;
    }
    .ws-btn-cancel {
      background: none;
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: var(--triarq-space-xs) var(--triarq-space-md);
      cursor: pointer;
      font-size: var(--triarq-text-body);
    }
    .ws-btn-ok {
      background: var(--triarq-color-primary, #257099);
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: var(--triarq-space-xs) var(--triarq-space-md);
      cursor: pointer;
      font-size: var(--triarq-text-body);
      font-weight: var(--triarq-font-weight-bold);
    }
    .ws-btn-ok:disabled { opacity: 0.45; cursor: not-allowed; }
  `]
})
export class WorkstreamPickerComponent implements OnInit, OnDestroy {
  /** Division ID of the cycle being created/edited. Used as default scope_division_id. */
  @Input() cycleDivisionId: string | null = null;

  /** Currently assigned workstream ID — pre-selects this row on open. */
  @Input() currentWorkstreamId: string | null = null;

  /** Emits the selected workstream on OK, or null on Cancel. */
  @Output() workstreamSelected = new EventEmitter<DeliveryWorkstream | null>();

  scopeOptions: { value: ScopeType; label: string }[] = [
    { value: 'division_tree', label: "Cycle's Division" },
    { value: 'trust',         label: 'Trust'           },
    { value: 'user_divisions', label: 'My Divisions'   },
    { value: 'all',           label: 'All'             },
  ];

  scopeCtrl       = new FormControl<ScopeType>('division_tree');
  showInactiveCtrl = new FormControl<boolean>(false);

  rows:            DeliveryWorkstream[] = [];
  loading          = false;
  loadError:       string | null = null;
  selectedId:      string | null = null;
  echoWorkstream:  DeliveryWorkstream | null = null;

  private subs = new Subscription();

  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly cdr:             ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedId = this.currentWorkstreamId;

    // Re-load whenever scope or toggle changes
    this.subs.add(
      this.scopeCtrl.valueChanges.subscribe(() => this.loadWorkstreams())
    );
    this.subs.add(
      this.showInactiveCtrl.valueChanges.subscribe(() => this.loadWorkstreams())
    );

    this.loadWorkstreams();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get canConfirm(): boolean {
    return !!this.selectedId && !!this.echoWorkstream && this.echoWorkstream.active_status;
  }

  private loadWorkstreams(): void {
    this.loading   = true;
    this.loadError = null;
    this.rows      = [];
    this.cdr.markForCheck();

    const scopeType     = this.scopeCtrl.value ?? 'division_tree';
    const includeInactive = this.showInactiveCtrl.value ?? false;

    const params: Parameters<typeof this.deliveryService.listWorkstreams>[0] = {
      scope_type:       scopeType,
      include_inactive: includeInactive
    };

    // Scope division_tree requires scope_division_id
    if (scopeType === 'division_tree') {
      if (!this.cycleDivisionId) {
        // Fall back to Trust scope if no division is set on the cycle yet
        params.scope_type = 'trust';
      } else {
        params.scope_division_id = this.cycleDivisionId;
      }
    }

    this.deliveryService.listWorkstreams(params).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.rows = res.data;
          // Restore echo if previously selected row is still in the list
          const match = this.rows.find(w => w.workstream_id === this.selectedId);
          this.echoWorkstream = match ?? null;
          if (!match) { this.selectedId = null; }
        } else {
          this.loadError = res.error ?? 'Unknown error loading Workstreams.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadError = 'Network error — could not reach the MCP server. Check your connection and try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  selectRow(ws: DeliveryWorkstream): void {
    if (!ws.active_status) {
      // Inactive: show echo for visibility but do not set as selectedId (cannot confirm)
      this.echoWorkstream = ws;
      this.cdr.markForCheck();
      return;
    }
    this.selectedId     = ws.workstream_id;
    this.echoWorkstream = ws;
    this.cdr.markForCheck();
  }

  confirm(): void {
    if (!this.canConfirm) { return; }
    this.workstreamSelected.emit(this.echoWorkstream);
  }

  cancel(): void {
    this.workstreamSelected.emit(null);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('ws-picker-overlay')) {
      this.cancel();
    }
  }
}
