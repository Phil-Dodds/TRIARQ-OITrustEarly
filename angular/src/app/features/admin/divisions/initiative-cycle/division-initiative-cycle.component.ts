// division-initiative-cycle.component.ts — Contract 32 (WS5)
// "Initiative Update Cycle" surface, embedded as a section in the Division
// admin View panel (CC-32: spec §4.7 "tab" maps to a section here — the panel
// has no tab strip; existing component is the blueprint per D-252).
//
// Extracted as its own component (S-030) so the 1298-line divisions.component
// does not grow. Owns the recurrence picker, live preview, view↔edit sub-state,
// and D-183 two-step Clear.
//
// D-93:  McpService only. D-178: Tier-1 skeleton on load. D-200: Pattern 2
// inherited banner (amber), Pattern 3 inline validation error. D-346: Context A
// button labels (Saving…/Clearing…). D-480/D-481: cadence model + inheritance.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { IonicModule }         from '@ionic/angular';
import { McpService }          from '../../../../core/services/mcp.service';
import { McpResponse }         from '../../../../core/types/database';

type Cadence    = 'weekly' | 'triweekly' | 'monthly';
type Occurrence = 'first' | 'second' | 'third' | 'fourth' | 'last';

interface CadenceConfig {
  id:                string;
  division_id:       string;
  cadence:           Cadence;
  day_of_week:       number;
  anchor_date:       string | null;
  month_occurrence:  Occurrence | null;
}

interface ResolvedConfig {
  config:                CadenceConfig | null;
  inherited:             boolean;
  source_division_id?:   string;
  source_division_name?: string | null;
}

const DAY_LABELS: string[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];
const OCCURRENCE_LABELS: Record<Occurrence, string> = {
  first: 'First', second: 'Second', third: 'Third', fourth: 'Fourth', last: 'Last'
};

@Component({
  selector: 'app-division-initiative-cycle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  template: `
    <!-- Tier-1 skeleton (D-178) -->
    <div *ngIf="loading" class="dic-skel" aria-hidden="true">
      <ion-skeleton-text animated style="width:60%;height:14px;"></ion-skeleton-text>
      <ion-skeleton-text animated style="width:40%;height:14px;"></ion-skeleton-text>
    </div>

    <ng-container *ngIf="!loading">

      <!-- ===================== VIEW ===================== -->
      <ng-container *ngIf="mode === 'view'">

        <!-- Local config present -->
        <ng-container *ngIf="resolved?.config && !resolved!.inherited">
          <div class="oi-field-row">
            <span class="oi-field-label">Update Cadence</span>
            <span>{{ cadenceLabel(resolved!.config!.cadence) }}</span>
          </div>
          <div class="oi-field-row">
            <span class="oi-field-label">Meeting Day</span>
            <span>{{ dayLabel(resolved!.config!.day_of_week) }}</span>
          </div>
          <div class="oi-field-row" *ngIf="resolved!.config!.cadence === 'triweekly'">
            <span class="oi-field-label">Starting From</span>
            <span>{{ formatDate(resolved!.config!.anchor_date) }}</span>
          </div>
          <div class="oi-field-row" *ngIf="resolved!.config!.cadence === 'monthly'">
            <span class="oi-field-label">Occurrence</span>
            <span>{{ occurrenceLabel(resolved!.config!.month_occurrence) }}</span>
          </div>
          <div class="dic-preview">{{ previewFor(resolved!.config!) }}</div>
          <div style="margin-top:8px;">
            <button class="oi-btn-primary" (click)="startEdit()">Edit Cycle Config</button>
          </div>
        </ng-container>

        <!-- Inherited from a parent Division (D-200 Pattern 2 amber) -->
        <ng-container *ngIf="resolved?.config && resolved!.inherited">
          <div class="dic-warn">
            <span class="dic-warn-icon">⚠</span>
            <span>Inherited from: <strong>{{ resolved!.source_division_name || 'parent Division' }}</strong></span>
          </div>
          <div class="oi-field-row">
            <span class="oi-field-label">Update Cadence</span>
            <span>{{ cadenceLabel(resolved!.config!.cadence) }}</span>
          </div>
          <div class="oi-field-row">
            <span class="oi-field-label">Meeting Day</span>
            <span>{{ dayLabel(resolved!.config!.day_of_week) }}</span>
          </div>
          <div class="dic-preview">{{ previewFor(resolved!.config!) }}</div>
          <div style="margin-top:8px;">
            <button class="oi-btn-secondary" (click)="startEdit()">Set Local Configuration</button>
          </div>
        </ng-container>

        <!-- No config anywhere in the chain -->
        <ng-container *ngIf="!resolved?.config">
          <div class="oi-zone-explain">No update cycle configured for this Division.</div>
          <div style="margin-top:8px;">
            <button class="oi-btn-primary" (click)="startEdit()">Configure Update Cycle</button>
          </div>
        </ng-container>
      </ng-container>

      <!-- ===================== EDIT ===================== -->
      <ng-container *ngIf="mode === 'edit'">
        <form [formGroup]="form">
          <div class="oi-field-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
            <label class="oi-field-label">Update Cadence</label>
            <select class="oi-input" formControlName="cadence" (change)="onCadenceChange()">
              <option value="weekly">Weekly</option>
              <option value="triweekly">Triweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div class="oi-field-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
            <label class="oi-field-label">Meeting Day</label>
            <select class="oi-input" formControlName="day_of_week"
                    [class.dic-invalid]="showError && form.value.day_of_week === null">
              <option [ngValue]="null" disabled>Select a day…</option>
              <option *ngFor="let d of dayOptions" [ngValue]="d.value">{{ d.label }}</option>
            </select>
          </div>

          <div class="oi-field-row" *ngIf="form.value.cadence === 'triweekly'"
               style="flex-direction:column;align-items:flex-start;gap:4px;">
            <label class="oi-field-label">Starting From</label>
            <input type="date" class="oi-input" formControlName="anchor_date"
                   [class.dic-invalid]="showError && !form.value.anchor_date" />
            <span class="oi-field-hint">First meeting date the 3-week cycle counts from.</span>
          </div>

          <div class="oi-field-row" *ngIf="form.value.cadence === 'monthly'"
               style="flex-direction:column;align-items:flex-start;gap:4px;">
            <label class="oi-field-label">Occurrence</label>
            <select class="oi-input" formControlName="month_occurrence"
                    [class.dic-invalid]="showError && !form.value.month_occurrence">
              <option [ngValue]="null" disabled>Select…</option>
              <option value="first">First</option>
              <option value="second">Second</option>
              <option value="third">Third</option>
              <option value="fourth">Fourth</option>
              <option value="last">Last</option>
            </select>
          </div>

          <div class="dic-preview dic-preview-live">{{ livePreview() }}</div>

          <div class="oi-err" *ngIf="error">{{ error }}</div>

          <div class="dic-actions">
            <button type="button" class="oi-btn-secondary"
                    (click)="cancel()" [disabled]="saving || clearing">Cancel</button>
            <button type="button" class="oi-btn-primary"
                    (click)="save()" [disabled]="saving || clearing">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>

          <!-- Clear Configuration — only when a LOCAL config exists (D-183 two-step) -->
          <ng-container *ngIf="hasLocalConfig">
            <div class="dic-clear">
              <button type="button" class="dic-clear-btn"
                      *ngIf="!pendingClear"
                      (click)="pendingClear = true" [disabled]="saving || clearing">
                Clear Configuration
              </button>
              <div class="dic-confirm" *ngIf="pendingClear">
                Clear update cycle configuration for <strong>{{ divisionName }}</strong>?
                Initiatives in this Division will no longer have overdue tracking
                unless a parent Division has a configuration.
                <div class="dic-actions">
                  <button type="button" class="oi-btn-secondary"
                          (click)="pendingClear = false" [disabled]="clearing">Cancel</button>
                  <button type="button" class="oi-btn-primary"
                          (click)="confirmClear()" [disabled]="clearing">
                    {{ clearing ? 'Clearing…' : 'Clear Configuration' }}
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </form>
      </ng-container>

    </ng-container>
  `,
  styles: [`
    :host { display:block; }
    .dic-skel { display:flex; flex-direction:column; gap:8px; }
    .dic-preview {
      margin-top:8px; font-size:13px; color:var(--triarq-color-text-secondary);
      font-style:italic;
    }
    .dic-preview-live { font-style:normal; color:var(--triarq-color-primary); }
    .oi-field-hint { font-size:11px; color:var(--triarq-color-stone, #5A5A5A); }
    /* D-200 Pattern 2 — amber warning band */
    .dic-warn {
      display:flex; align-items:center; gap:6px;
      border-left:3px solid var(--triarq-color-sunray, #F2A620);
      background:rgba(242,166,32,0.08);
      padding:6px 8px; border-radius:5px; margin-bottom:8px; font-size:13px;
    }
    .dic-warn-icon { color:var(--triarq-color-sunray, #F2A620); }
    /* D-200 Pattern 3 — error border */
    .dic-invalid { border:2px solid var(--triarq-color-error, #E96127) !important; }
    .dic-actions { display:flex; gap:8px; margin-top:12px; }
    .dic-clear { margin-top:16px; padding-top:12px; border-top:1px solid var(--triarq-color-border, #e0e0e0); }
    .dic-clear-btn {
      background:none; border:none; color:var(--triarq-color-error, #E96127);
      cursor:pointer; font-size:13px; padding:0;
    }
    .dic-confirm {
      font-size:13px; background:rgba(233,97,39,0.06);
      border-radius:5px; padding:8px; line-height:1.4;
    }
  `]
})
export class DivisionInitiativeCycleComponent implements OnChanges {
  @Input() divisionId!: string;
  @Input() divisionName = 'this Division';

  loading  = true;
  mode: 'view' | 'edit' = 'view';
  resolved: ResolvedConfig | null = null;

  saving      = false;
  clearing    = false;
  pendingClear = false;
  showError   = false;
  error: string | null = null;

  form: FormGroup;

  readonly dayOptions = DAY_LABELS.map((label, value) => ({ value, label }));

  constructor(
    private readonly fb:  FormBuilder,
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      cadence:          ['weekly' as Cadence],
      day_of_week:      [null as number | null],
      anchor_date:      [null as string | null],
      month_occurrence: [null as Occurrence | null]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['divisionId'] && this.divisionId) {
      this.mode = 'view';
      this.pendingClear = false;
      this.load();
    }
  }

  get hasLocalConfig(): boolean {
    return !!this.resolved?.config && !this.resolved.inherited;
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.mcp.call<ResolvedConfig>('division', 'get_division_status_config', {
      division_id: this.divisionId
    }).subscribe({
      next: (res: McpResponse<ResolvedConfig>) => {
        this.resolved = (res?.success && res.data) ? res.data : { config: null, inherited: false };
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.resolved = { config: null, inherited: false };
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  startEdit(): void {
    this.showError = false;
    this.error = null;
    this.pendingClear = false;
    // Seed the form from the LOCAL config only; inherited/none start blank.
    const c = this.hasLocalConfig ? this.resolved!.config! : null;
    this.form.reset({
      cadence:          c?.cadence ?? 'weekly',
      day_of_week:      c?.day_of_week ?? null,
      anchor_date:      c?.anchor_date ?? null,
      month_occurrence: c?.month_occurrence ?? null
    });
    this.mode = 'edit';
  }

  onCadenceChange(): void {
    // Clear fields not relevant to the selected cadence.
    const cadence = this.form.value.cadence as Cadence;
    if (cadence !== 'triweekly') { this.form.patchValue({ anchor_date: null }); }
    if (cadence !== 'monthly')   { this.form.patchValue({ month_occurrence: null }); }
  }

  save(): void {
    this.error = null;
    const v = this.form.value;

    // Validation mirrors save_division_status_config (D-480) — Pattern 3 inline.
    if (v.day_of_week === null || v.day_of_week === undefined) {
      this.showError = true; this.error = 'Meeting Day is required.'; return;
    }
    if (v.cadence === 'triweekly' && !v.anchor_date) {
      this.showError = true; this.error = 'Starting From date is required for a triweekly cadence.'; return;
    }
    if (v.cadence === 'monthly' && !v.month_occurrence) {
      this.showError = true; this.error = 'Occurrence is required for a monthly cadence.'; return;
    }

    this.saving = true;
    this.mcp.call<CadenceConfig>('division', 'save_division_status_config', {
      division_id:      this.divisionId,
      cadence:          v.cadence,
      day_of_week:      v.day_of_week,
      anchor_date:      v.cadence === 'triweekly' ? v.anchor_date : null,
      month_occurrence: v.cadence === 'monthly'   ? v.month_occurrence : null
    }).subscribe({
      next: (res: McpResponse<CadenceConfig>) => {
        this.saving = false;
        if (res?.success) {
          this.mode = 'view';
          this.load();
        } else {
          this.error = res?.error || 'Could not save the update cycle.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error || 'Could not save the update cycle.';
        this.cdr.markForCheck();
      }
    });
  }

  confirmClear(): void {
    this.clearing = true;
    this.mcp.call<unknown>('division', 'clear_division_status_config', {
      division_id: this.divisionId
    }).subscribe({
      next: (res: McpResponse<unknown>) => {
        this.clearing = false;
        this.pendingClear = false;
        if (res?.success) {
          this.mode = 'view';
          this.load();
        } else {
          this.error = res?.error || 'Could not clear the update cycle.';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.clearing = false;
        this.pendingClear = false;
        this.error = err?.error || 'Could not clear the update cycle.';
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.pendingClear = false;
    this.showError = false;
    this.error = null;
    this.mode = 'view';
  }

  // ── Display helpers ─────────────────────────────────────────────────────
  cadenceLabel(c: Cadence): string {
    return c === 'weekly' ? 'Weekly' : c === 'triweekly' ? 'Triweekly' : 'Monthly';
  }
  dayLabel(d: number): string { return DAY_LABELS[d] ?? '—'; }
  occurrenceLabel(o: Occurrence | null): string { return o ? OCCURRENCE_LABELS[o] : '—'; }

  formatDate(iso: string | null): string {
    if (!iso) { return '—'; }
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  previewFor(c: CadenceConfig): string {
    const day = this.dayLabel(c.day_of_week);
    if (c.cadence === 'weekly')   { return `Every ${day}`; }
    if (c.cadence === 'triweekly') {
      return `Every 3 weeks on ${day}, starting ${this.formatDate(c.anchor_date)}`;
    }
    return `${this.occurrenceLabel(c.month_occurrence)} ${day} of every month`;
  }

  livePreview(): string {
    const v = this.form.value;
    if (v.day_of_week === null || v.day_of_week === undefined) { return 'Select a meeting day to preview.'; }
    return this.previewFor({
      id: '', division_id: '',
      cadence: v.cadence as Cadence,
      day_of_week: v.day_of_week as number,
      anchor_date: v.anchor_date as string | null,
      month_occurrence: v.month_occurrence as Occurrence | null
    });
  }
}
