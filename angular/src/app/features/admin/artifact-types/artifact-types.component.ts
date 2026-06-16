// artifact-types.component.ts — Pathways OI Trust
// Route: /admin/artifact-types  (Admin role only — D-437 origin, D-438 Contract 25 schema).
//
// Manages the Artifact Type catalog used by Initiative attachment slots and
// gate suggestion warnings. Standard grid + right panel per S-005, S-018,
// S-019. Create via S-016 right-panel form. Deactivation only — no delete.
//
// D-438 (Contract 25): "Suggested Before Gate" column replaced by "Primary
// Gate". New Gate Warning dropdown binds gate_warning_behavior. Grid filter
// panel (when added) must target primary_gate not required_at_gate.
//
// Scope:
//   - Grid: Name · Stage · Primary Gate · Active Status
//   - View + Edit + Create right-panel pattern
//   - Deactivation blocked when cycle_artifacts references exist (MCP enforced)
//   - S-036 sort: all four columns sortable; default Stage asc + sort_order asc
//
// Deferred (CC-candidates):
//   - Full S-010..S-013 slide-in filter panel — when added, must filter on primary_gate
//   - +Add Artifact Type panel (Create surface) — V1 ships read/edit only
//   - Sort persistence beyond in-session
//
// Source: D-437, D-438, S-005, S-018, S-019, S-036, S-001, S-014, S-024.

import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  HostListener, OnInit
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule }       from '@angular/router';
import { IonicModule }        from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { DeliveryService }    from '../../../core/services/delivery.service';
import { ArtifactTypeRow }    from '../../../core/types/database';
import {
  SortState, applySortToggle, sortIndicator, compareString, compareNumber
} from '../../../core/utils/sort-state';

type AtSortColumn =
  | 'artifact_type_name'
  | 'lifecycle_stage'
  | 'primary_gate'
  | 'active_status';

const DEFAULT_AT_SORT: SortState<AtSortColumn> = {
  column:    'lifecycle_stage',
  direction: 'asc'
};

const STAGE_ORDER: Record<string, number> = {
  BRIEF: 1, DESIGN: 2, SPEC: 3, BUILD: 4, VALIDATE: 5,
  UAT: 6, PILOT: 7, RELEASE: 8, OUTCOME: 9, ANY: 99
};
const GATE_DISPLAY: Record<string, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const WARNING_BEHAVIOR_DISPLAY: Record<string, string> = {
  none:                   'No warning',
  primary_only:           'Warn at primary gate',
  primary_and_subsequent: 'Warn at primary gate and subsequent'
};

type PanelMode = 'view' | 'edit' | null;

@Component({
  selector:        'app-artifact-types',
  standalone:      true,
  imports:         [CommonModule, RouterModule, IonicModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="at-shell">

      <div class="at-header">
        <h3 class="at-title">Artifact Types</h3>
        <p class="at-subtitle">
          Suggested artifact types organized by lifecycle stage. The system uses
          these to recommend the right document before each gate. Deactivating
          a type hides it from new attachments — historical attachments stay in
          place.
        </p>
      </div>

      <div class="at-grid">
        <div class="at-row at-header-row">
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('artifact_type_name')"
                (click)="onSortColumn('artifact_type_name')">
            Name {{ glyph('artifact_type_name') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('lifecycle_stage')"
                (click)="onSortColumn('lifecycle_stage')">
            Stage {{ glyph('lifecycle_stage') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('primary_gate')"
                (click)="onSortColumn('primary_gate')">
            Primary Gate {{ glyph('primary_gate') }}
          </span>
          <span class="oi-sort-th"
                [class.oi-sort-active]="isSorted('active_status')"
                (click)="onSortColumn('active_status')">
            Active Status {{ glyph('active_status') }}
          </span>
        </div>

        <ng-container *ngIf="loading && rows.length === 0">
          <div class="at-row" *ngFor="let _ of skeletonRows">
            <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
            <ion-skeleton-text animated style="height:14px;"></ion-skeleton-text>
          </div>
        </ng-container>

        <div *ngIf="!loading && rows.length === 0" class="at-empty">
          No artifact types defined.
        </div>

        <div class="at-row at-data"
             *ngFor="let row of sortedRows"
             [class.at-selected]="selectedId === row.artifact_type_id"
             (click)="openView(row)">
          <span class="at-cell">{{ row.artifact_type_name }}</span>
          <span class="at-cell at-stage">{{ row.lifecycle_stage }}</span>
          <span class="at-cell">{{ gateLabel(row.primary_gate) }}</span>
          <span>
            <span class="at-pill"
                  [class.at-pill-active]="row.active_status"
                  [class.at-pill-inactive]="!row.active_status">
              {{ row.active_status ? 'Active' : 'Inactive' }}
            </span>
          </span>
        </div>
      </div>

      <!-- Right panel (S-018 View / S-019 Edit) -->
      <div class="oi-scrim" *ngIf="panelMode === 'edit'" (click)="onScrimClick()"></div>
      <div class="oi-side-panel" *ngIf="panelMode" role="dialog" aria-modal="true">
        <div class="oi-side-head">
          <strong>{{ panelMode === 'edit' ? 'Edit Artifact Type' : 'Artifact Type' }}</strong>
          <button class="oi-close-btn" (click)="closePanel()" aria-label="Close">✕</button>
        </div>
        <div class="oi-side-body" *ngIf="selectedRow">
          <ng-container *ngIf="panelMode === 'view'">
            <dl class="at-dl">
              <dt>Name</dt>          <dd>{{ selectedRow.artifact_type_name }}</dd>
              <dt>Stage</dt>         <dd>{{ selectedRow.lifecycle_stage }}</dd>
              <dt>Primary Gate</dt>  <dd>{{ gateLabel(selectedRow.primary_gate) }}</dd>
              <dt>Gate Warning</dt>  <dd>{{ warningLabel(selectedRow.gate_warning_behavior) }}</dd>
              <dt>Guidance</dt>      <dd>{{ selectedRow.guidance_text }}</dd>
              <dt>Sort Order</dt>    <dd>{{ selectedRow.sort_order }}</dd>
              <dt>Active Status</dt> <dd>{{ selectedRow.active_status ? 'Active' : 'Inactive' }}</dd>
            </dl>
          </ng-container>

          <ng-container *ngIf="panelMode === 'edit'">
            <form [formGroup]="editForm" novalidate class="at-form">
              <label class="at-label">Name</label>
              <input formControlName="artifact_type_name" class="at-input" />

              <label class="at-label">Stage</label>
              <select formControlName="lifecycle_stage" class="at-input">
                <option *ngFor="let s of allStages" [value]="s">{{ s }}</option>
              </select>

              <label class="at-label">Primary Gate</label>
              <select formControlName="primary_gate" class="at-input">
                <option [ngValue]="null">— None —</option>
                <option value="brief_review">Brief Review</option>
                <option value="go_to_build">Go to Build</option>
                <option value="go_to_deploy">Go to Deploy</option>
                <option value="go_to_release">Go to Release</option>
                <option value="close_review">Close Review</option>
              </select>

              <label class="at-label">Gate Warning</label>
              <select formControlName="gate_warning_behavior" class="at-input">
                <option value="none">No warning</option>
                <option value="primary_only">Warn at primary gate</option>
                <option value="primary_and_subsequent">Warn at primary gate and subsequent</option>
              </select>

              <label class="at-label">Guidance Text</label>
              <textarea formControlName="guidance_text" class="at-input at-textarea"
                        rows="3"></textarea>

              <label class="at-label">Sort Order</label>
              <input type="number" formControlName="sort_order" class="at-input" />

              <label class="at-checkbox">
                <input type="checkbox" formControlName="active" />
                Active
              </label>

              <div *ngIf="saveError" class="at-error">{{ saveError }}</div>
            </form>
          </ng-container>
        </div>
        <div class="oi-side-foot" *ngIf="panelMode === 'view'">
          <button class="oi-btn-secondary" (click)="closePanel()">Close</button>
          <button class="oi-btn-primary"   (click)="openEdit()">Edit</button>
        </div>
        <div class="oi-side-foot" *ngIf="panelMode === 'edit'">
          <button class="oi-btn-secondary" (click)="cancelEdit()">Cancel</button>
          <button class="oi-btn-primary"
                  [disabled]="editForm.invalid || saving"
                  (click)="saveEdit()">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .at-shell { padding: var(--triarq-space-md); }
    .at-header { margin-bottom: var(--triarq-space-md); }
    .at-title  { margin: 0; font-size: 18px; font-weight: 600; color: #1E1E1E; }
    .at-subtitle { margin: 4px 0 0; font-size: 11px; font-style: italic; color: #5A5A5A; }

    .at-grid {
      border: 1px solid var(--triarq-color-border);
      border-radius: 6px; background: #fff; overflow: hidden;
    }
    .at-row {
      display: grid; grid-template-columns: 2fr 100px 200px 120px;
      gap: var(--triarq-space-sm);
      padding: 8px var(--triarq-space-md);
      border-bottom: 1px solid #E8E8E8;
      align-items: center; font-size: 13px;
    }
    .at-header-row {
      background: #12274A; color: #fff; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.3px; font-size: 12px;
    }
    .at-header-row span { color: #fff; }
    .at-data       { cursor: pointer; }
    .at-data:hover { background: #F0F4F8; }
    .at-selected   { background: #E8F0FE; }
    .at-stage      { color: #5A5A5A; }
    .at-pill {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 500;
    }
    .at-pill-active   { background: rgba(46,125,50,0.10);  color: #2E7D32; }
    .at-pill-inactive { background: rgba(233,97,39,0.10);  color: #E96127; }
    .at-empty   { padding: var(--triarq-space-xl); text-align: center; color: #5A5A5A; }

    .at-dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 12px; font-size: 13px; }
    .at-dl dt { color: #5A5A5A; }
    .at-dl dd { margin: 0; color: #1E1E1E; }

    .at-form  { display: flex; flex-direction: column; gap: 8px; }
    .at-label { font-size: 12px; color: #5A5A5A; font-weight: 500; }
    .at-input {
      padding: 8px 12px; border: 1px solid #D6D6D6; border-radius: 5px;
      font-size: 13px; font-family: Roboto, sans-serif; background: #fff;
    }
    .at-textarea { resize: vertical; min-height: 60px; }
    .at-checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .at-error { color: var(--triarq-color-error, #C62828); font-size: 12px; }
  `]
})
export class ArtifactTypesComponent implements OnInit {

  rows:             ArtifactTypeRow[] = [];
  loading           = false;
  loadError         = '';

  sortState: SortState<AtSortColumn> = { ...DEFAULT_AT_SORT };

  panelMode:  PanelMode      = null;
  selectedId: string | null  = null;
  selectedRow: ArtifactTypeRow | null = null;
  editForm:   FormGroup;
  saving      = false;
  saveError   = '';

  readonly skeletonRows = [1, 2, 3, 4, 5, 6];
  readonly allStages: string[] = [
    'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','UAT','PILOT','RELEASE','OUTCOME','ANY'
  ];

  constructor(
    private readonly delivery: DeliveryService,
    private readonly fb:       FormBuilder,
    private readonly cdr:      ChangeDetectorRef
  ) {
    this.editForm = this.fb.group({
      artifact_type_name:    ['', Validators.required],
      lifecycle_stage:       ['BRIEF', Validators.required],
      primary_gate:          [null],
      gate_warning_behavior: ['none', Validators.required],
      guidance_text:         ['', Validators.required],
      sort_order:            [10, [Validators.required, Validators.min(0)]],
      active:                [true]
    });
  }

  ngOnInit(): void { this.load(); }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.panelMode) { this.closePanel(); }
  }

  get sortedRows(): ArtifactTypeRow[] {
    const { column, direction } = this.sortState;
    return [...this.rows].sort((a, b) => {
      switch (column) {
        case 'artifact_type_name':
          return compareString(a.artifact_type_name, b.artifact_type_name, direction);
        case 'lifecycle_stage': {
          const oa = STAGE_ORDER[a.lifecycle_stage] ?? 50;
          const ob = STAGE_ORDER[b.lifecycle_stage] ?? 50;
          const cmp = direction === 'asc' ? (oa - ob) : (ob - oa);
          if (cmp !== 0) { return cmp; }
          return compareNumber(a.sort_order, b.sort_order, 'asc');
        }
        case 'primary_gate':
          return compareString(
            this.gateLabel(a.primary_gate),
            this.gateLabel(b.primary_gate),
            direction
          );
        case 'active_status':
          if (a.active_status === b.active_status) { return 0; }
          if (direction === 'asc')                 { return a.active_status ? -1 : 1; }
          return a.active_status ? 1 : -1;
      }
    });
  }

  onSortColumn(column: AtSortColumn): void {
    this.sortState = applySortToggle(this.sortState, column);
    this.cdr.markForCheck();
  }
  isSorted(column: AtSortColumn): boolean { return this.sortState.column === column; }
  glyph(column: AtSortColumn): '↑' | '↓' | '' { return sortIndicator(this.sortState, column); }

  gateLabel(g: string | null | undefined): string {
    if (!g) { return '—'; }
    return GATE_DISPLAY[g] ?? g;
  }

  warningLabel(w: string | null | undefined): string {
    if (!w) { return WARNING_BEHAVIOR_DISPLAY['none']; }
    return WARNING_BEHAVIOR_DISPLAY[w] ?? w;
  }

  openView(row: ArtifactTypeRow): void {
    this.selectedId  = row.artifact_type_id;
    this.selectedRow = row;
    this.panelMode   = 'view';
    this.cdr.markForCheck();
  }

  openEdit(): void {
    if (!this.selectedRow) { return; }
    this.editForm.reset({
      artifact_type_name:    this.selectedRow.artifact_type_name,
      lifecycle_stage:       this.selectedRow.lifecycle_stage,
      primary_gate:          this.selectedRow.primary_gate ?? null,
      gate_warning_behavior: this.selectedRow.gate_warning_behavior ?? 'none',
      guidance_text:         this.selectedRow.guidance_text,
      sort_order:            this.selectedRow.sort_order,
      active:                this.selectedRow.active_status
    });
    this.saveError = '';
    this.panelMode = 'edit';
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.panelMode = 'view';
    this.saveError = '';
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode   = null;
    this.selectedId  = null;
    this.selectedRow = null;
    this.cdr.markForCheck();
  }

  onScrimClick(): void {
    if (this.editForm.dirty) {
      if (!window.confirm('Discard unsaved changes?')) { return; }
    }
    this.cancelEdit();
  }

  saveEdit(): void {
    if (!this.selectedRow || this.editForm.invalid) { return; }
    const v = this.editForm.value;
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    this.delivery.updateArtifactType({
      artifact_type_id:       this.selectedRow.artifact_type_id,
      artifact_type_name:     v.artifact_type_name,
      lifecycle_stage:        v.lifecycle_stage,
      primary_gate:           v.primary_gate ?? null,
      gate_warning_behavior:  v.gate_warning_behavior ?? 'none',
      guidance_text:          v.guidance_text,
      sort_order:             v.sort_order,
      active:                 v.active
    }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success && res.data) {
          this.rows = this.rows.map(r =>
            r.artifact_type_id === res.data!.artifact_type_id ? res.data! : r
          );
          this.selectedRow = res.data;
          this.panelMode   = 'view';
        } else {
          this.saveError = res.error ?? 'Could not save changes.';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving    = false;
        this.saveError = 'Could not save changes.';
        this.cdr.markForCheck();
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.delivery.listArtifactTypes().subscribe({
      next: res => {
        if (res.success && Array.isArray(res.data)) {
          this.rows = res.data;
        } else {
          this.loadError = res.error ?? 'Could not load artifact types.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = 'Could not load artifact types.';
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }
}
