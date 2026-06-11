// user-create-form.component.ts — Pathways OI Trust
//
// Shared Create User form. Used by:
//   - UsersComponent (Admin → User Management → + Add User)  — S-016 right-panel Create
//   - UserPickerComponent (D-420 Admin inline + Add User)    — modal-over-picker overlay
//
// Form body + actions only. No title/header chrome — parent provides the
// modal/panel wrapper appropriate to its context.
//
// Fields per UM Create form: Email (+ Outlook paste-parse per D-412), Name,
// Roles (at least one required, D-394), Divisions (optional, S-032 excludes
// inactive). Submits via `division.submit_member_invite`.
//
// Outputs:
//   - userCreated  — emitted with the created User row on success
//   - cancelled    — emitted when Cancel button tapped
//
// Inputs:
//   - allDivisions      — pre-loaded Division list from parent
//   - defaultRoleFlag   — optional role to pre-check (used by picker so a
//                         user added via the EPO picker auto-gets EPO role)
//
// D-93: McpService only. ChangeDetection: OnPush.

import {
  Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
  ValidationErrors, Validators
} from '@angular/forms';
import { McpService } from '../../../core/services/mcp.service';
import { User, Division } from '../../../core/types/database';
import {
  ALL_ROLE_FLAGS,
  ROLE_FLAG_ABBREVIATIONS,
  ROLE_FLAG_DISPLAY_NAMES,
  RoleFlag
} from '../../../core/constants/roles';

/** At least one role flag must be checked (D-394). */
function atLeastOneRoleValidator(group: AbstractControl): ValidationErrors | null {
  const v = group.value as Record<string, unknown>;
  const any =
    v['is_admin'] === true ||
    v['is_dcs']   === true ||
    v['is_epo']   === true ||
    v['is_dol']   === true ||
    v['is_ce']    === true;
  return any ? null : { noRoleSelected: true };
}

@Component({
  selector: 'app-user-create-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <div class="oi-field-row">
        <label class="oi-field-label">Email Address *</label>
        <input formControlName="email" type="email" class="oi-input"
               placeholder="user@triarqhealth.com"
               (paste)="onEmailPaste($event)" />
        <div class="oi-hint">
          Tip: paste directly from Outlook — e.g.
          <em>Philip Dodds &lt;pdodds&#64;triarqhealth.com&gt;</em>.
          Name and email will be parsed automatically.
        </div>
        <div class="oi-err"
             *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
          Valid email is required.
        </div>
      </div>

      <div class="oi-field-row">
        <label class="oi-field-label">Name *</label>
        <input formControlName="display_name" class="oi-input" placeholder="First Last" />
        <div class="oi-err"
             *ngIf="form.get('display_name')?.invalid && form.get('display_name')?.touched">
          Name is required.
        </div>
      </div>

      <div class="oi-field-row">
        <label class="oi-field-label">Roles * (one or more)</label>
        <div class="ucf-role-checkboxes" [formGroup]="form">
          <label class="ucf-role-check" *ngFor="let flag of ALL_ROLE_FLAGS">
            <input type="checkbox" [formControlName]="flag" />
            <span>{{ flagAbbrev(flag) }} — {{ flagDisplay(flag) }}</span>
          </label>
        </div>
        <div class="oi-err"
             *ngIf="form.errors?.['noRoleSelected'] && form.touched">
          Select at least one role.
        </div>
      </div>

      <div class="oi-field-row">
        <label class="oi-field-label">Divisions (optional)</label>
        <div class="oi-zone-explain">Inactive Divisions are excluded.</div>
        <div class="ucf-div-list">
          <label class="oi-picker-row" *ngFor="let div of selectableDivisions">
            <span>
              <input type="checkbox"
                     [checked]="divisionIds.includes(div.id)"
                     (change)="toggleDivision(div.id)" />
              {{ div.division_name }}
            </span>
          </label>
          <div *ngIf="selectableDivisions.length === 0"
               class="ucf-div-empty">
            No active Divisions available.
          </div>
        </div>
      </div>

      <div class="oi-err" *ngIf="submitError">{{ submitError }}</div>
    </form>

    <div class="ucf-actions">
      <button type="button" class="oi-btn-secondary"
              (click)="onCancel()"
              [disabled]="busy">
        Cancel
      </button>
      <button type="button" class="oi-btn-primary"
              [disabled]="form.invalid || busy"
              (click)="onSubmit()">
        {{ busy ? 'Creating…' : 'Create User' }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ucf-role-checkboxes { display: flex; flex-wrap: wrap; gap: 6px; }
    .ucf-role-check {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; cursor: pointer; padding: 6px 10px;
      border: 1px solid var(--triarq-color-border); border-radius: 5px;
      background: #fff; user-select: none;
    }
    .ucf-div-list {
      max-height: 160px; overflow-y: auto;
      border: 1px solid var(--triarq-color-border); border-radius: 5px;
      padding: 4px; margin-top: 6px;
    }
    .ucf-div-empty {
      padding: 6px; font-size: 12px;
      color: var(--triarq-color-text-secondary);
    }
    .ucf-actions {
      display: flex; justify-content: space-between;
      gap: 12px; padding-top: 12px; margin-top: 12px;
      border-top: 1px solid var(--triarq-color-border);
    }
  `]
})
export class UserCreateFormComponent implements OnInit, OnChanges {
  /** Pre-loaded Division list from parent — drives the optional checkbox list. */
  @Input() allDivisions: Division[] = [];
  /** Optional role flag to pre-check when the form opens. */
  @Input() defaultRoleFlag: RoleFlag | null = null;

  /** Emitted on successful creation with the newly created User row. */
  @Output() userCreated = new EventEmitter<User>();
  /** Emitted on Cancel — parent decides what to do (close panel / restore picker). */
  @Output() cancelled   = new EventEmitter<void>();

  form!: FormGroup;
  divisionIds: string[] = [];
  busy        = false;
  submitError = '';

  readonly ALL_ROLE_FLAGS = ALL_ROLE_FLAGS;

  constructor(
    private readonly fb:  FormBuilder,
    private readonly mcp: McpService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email:        ['', [Validators.required, Validators.email]],
      display_name: ['', Validators.required],
      is_admin:     [false],
      is_dcs:       [false],
      is_epo:       [false],
      is_dol:       [false],
      is_ce:        [false]
    }, { validators: atLeastOneRoleValidator });
    this.applyDefaultRole();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultRoleFlag'] && this.form) {
      this.applyDefaultRole();
    }
  }

  private applyDefaultRole(): void {
    if (!this.form || !this.defaultRoleFlag) { return; }
    // Reset all role flags first, then pre-check the requested role.
    const patch: Record<string, boolean> = {
      is_admin: false, is_dcs: false, is_epo: false, is_dol: false, is_ce: false
    };
    patch[this.defaultRoleFlag] = true;
    this.form.patchValue(patch, { emitEvent: false });
    this.cdr.markForCheck();
  }

  /** True if the user has typed anything or selected any Division. Used by parent
   *  for the S-017 dirty-state confirmation when the panel is closed mid-create. */
  get isDirty(): boolean {
    return (this.form?.dirty ?? false) || this.divisionIds.length > 0;
  }

  get selectableDivisions(): Division[] {
    return this.allDivisions.filter(
      d => (d as { active_status?: boolean }).active_status !== false
    );
  }

  toggleDivision(id: string): void {
    if (this.divisionIds.includes(id)) {
      this.divisionIds = this.divisionIds.filter(x => x !== id);
    } else {
      this.divisionIds = [...this.divisionIds, id];
    }
    this.cdr.markForCheck();
  }

  flagAbbrev(flag: RoleFlag): string {
    return ROLE_FLAG_ABBREVIATIONS[flag] ?? flag;
  }
  flagDisplay(flag: RoleFlag): string {
    return ROLE_FLAG_DISPLAY_NAMES[flag] ?? flag;
  }

  /** D-412 Outlook paste-parse: "Display Name <email@domain.com>" fills both fields. */
  onEmailPaste(ev: ClipboardEvent): void {
    const raw = ev.clipboardData?.getData('text') ?? '';
    const match = raw.match(/^\s*([^<]+?)\s*<\s*([^>\s]+)\s*>\s*$/);
    if (!match) { return; }
    ev.preventDefault();
    const displayName = match[1].trim();
    const emailValue  = match[2].trim();
    this.form.patchValue({
      display_name: this.form.value.display_name || displayName,
      email:        emailValue
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    this.busy = true;
    this.submitError = '';
    this.cdr.markForCheck();

    const v = this.form.value as Record<string, unknown>;
    this.mcp.call<User>('division', 'submit_member_invite', {
      email:        v['email']        as string,
      display_name: v['display_name'] as string,
      is_admin:     v['is_admin'] === true,
      is_dcs:       v['is_dcs']   === true,
      is_epo:       v['is_epo']   === true,
      is_dol:       v['is_dol']   === true,
      is_ce:        v['is_ce']    === true,
      division_ids: this.divisionIds.length > 0 ? [...this.divisionIds] : undefined
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.userCreated.emit(res.data);
          this.busy = false;
          this.cdr.markForCheck();
        } else {
          this.submitError = res.error ?? 'Create failed.';
          this.busy = false;
          this.cdr.markForCheck();
        }
      },
      error: (err: { error?: string }) => {
        this.submitError = err.error ?? 'Create failed.';
        this.busy = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
