// divisions.component.ts — Admin Division Hierarchy Management
// Build A: Creates the nine-Trust hierarchy and recursive child Divisions.
// Acceptance criteria: all nine Trusts created via this UI; child Divisions
//   created at least two levels deep (Build A Section 9).
// Roles: phil + admin (route protected by authGuard).
// D-93:  McpService only — no direct Supabase access.
// D-140: Blocked action UX on all errors.
//
// Hierarchy: Trust (level 0) → Service Line (level 1) → Function (level 2).
// Labels are interim pending Mike confirmation of D-L2/L3.
// Full terms per spec: Trust / Service Line Division / Function Division.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { IonicModule }                 from '@ionic/angular';
import { McpService }                  from '../../../core/services/mcp.service';
import { BlockedActionComponent }      from '../../../shared/components/blocked-action/blocked-action.component';
import { Division }                    from '../../../core/types/database';

interface Crumb { id: string | null; name: string; }

// Short labels used in buttons and pills (interim: D-L2/L3 pending Mike).
const LEVEL_LABELS: Record<number, string> = {
  0: 'Trust',
  1: 'Service Line',
  2: 'Function'
};

// Full type_label values stored in the DB (match spec Section 4.1).
const TYPE_LABELS: Record<number, string> = {
  0: 'Trust',
  1: 'Service Line Division',
  2: 'Function Division'
};

@Component({
  selector: 'app-divisions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonicModule,
    BlockedActionComponent
  ],
  template: `
    <div class="oi-card" style="max-width:900px;margin:var(--triarq-space-2xl) auto;">

      <!-- Header + breadcrumb ───────────────────────────────────────────── -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);">
        <div>
          <h3 style="margin:0 0 4px 0;">Division Hierarchy</h3>
          <nav style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
            <span *ngFor="let crumb of breadcrumb; let i = index; let last = last">
              <span
                *ngIf="!last"
                (click)="navigateBreadcrumb(i)"
                style="cursor:pointer;color:var(--triarq-color-primary);text-decoration:underline;"
              >{{ crumb.name }}</span>
              <span *ngIf="last">{{ crumb.name }}</span>
              <span *ngIf="!last"> › </span>
            </span>
          </nav>
        </div>
        <div style="display:flex;gap:var(--triarq-space-sm);align-items:center;">
          <button
            *ngIf="!isAtRoot"
            (click)="toggleEditForm()"
            style="font-size:var(--triarq-text-small);white-space:nowrap;
                   background:none;border:1px solid var(--triarq-color-border);
                   border-radius:5px;padding:6px 12px;cursor:pointer;
                   color:var(--triarq-color-text-primary);"
          >{{ showEditForm ? 'Cancel Edit' : 'Edit ' + editLabel }}</button>
          <button
            *ngIf="showCreateForm || canCreate"
            class="oi-btn-primary"
            (click)="toggleCreateForm()"
            style="font-size:var(--triarq-text-small);white-space:nowrap;"
          >{{ showCreateForm ? 'Cancel' : '+ New ' + levelLabel }}</button>
        </div>
      </div>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Edit form ─────────────────────────────────────────────────────── -->
      <div
        *ngIf="showEditForm"
        style="background:var(--triarq-color-background-subtle);
               border-radius:8px;padding:var(--triarq-space-md);
               margin-bottom:var(--triarq-space-md);"
      >
        <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
          Rename {{ editLabel }}
        </h4>
        <form [formGroup]="editDivisionForm" (ngSubmit)="submitEditDivision()">
          <div>
            <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
              {{ editLabel }} Name *
            </label>
            <input
              formControlName="division_name"
              class="oi-input"
              style="width:100%;max-width:420px;"
            />
            <div
              *ngIf="editDivisionForm.get('division_name')?.invalid && editDivisionForm.get('division_name')?.touched"
              style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
            >Name is required.</div>
          </div>
          <div style="margin-top:var(--triarq-space-sm);display:flex;gap:var(--triarq-space-sm);align-items:center;">
            <button type="submit" class="oi-btn-primary" [disabled]="editDivisionForm.invalid || savingDivision">
              {{ savingDivision ? 'Saving…' : 'Save' }}
            </button>
            <span
              *ngIf="editDivisionError"
              style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);"
            >{{ editDivisionError }}</span>
          </div>
        </form>
      </div>

      <!-- Create form ───────────────────────────────────────────────────── -->
      <div
        *ngIf="showCreateForm"
        style="background:var(--triarq-color-background-subtle);
               border-radius:8px;padding:var(--triarq-space-md);
               margin-bottom:var(--triarq-space-md);"
      >
        <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
          Create {{ levelLabel }}{{ isAtRoot ? '' : ' under "' + currentParentName + '"' }}
        </h4>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
          <div>
            <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
              {{ levelLabel }} Name *
            </label>
            <input
              formControlName="division_name"
              class="oi-input"
              [placeholder]="namePlaceholder"
              style="width:100%;max-width:420px;"
            />
            <div
              *ngIf="createForm.get('division_name')?.invalid && createForm.get('division_name')?.touched"
              style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
            >{{ levelLabel }} name is required.</div>
          </div>
          <div style="margin-top:var(--triarq-space-sm);display:flex;gap:var(--triarq-space-sm);align-items:center;">
            <button type="submit" class="oi-btn-primary" [disabled]="createForm.invalid || creating">
              {{ creating ? 'Creating…' : 'Create' }}
            </button>
            <span
              *ngIf="createError"
              style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);"
            >{{ createError }}</span>
            <span
              *ngIf="createSuccess"
              style="color:var(--triarq-color-success,#2e7d32);font-size:var(--triarq-text-small);"
            >Created successfully.</span>
          </div>
        </form>
      </div>

      <!-- Loading ───────────────────────────────────────────────────────── -->
      <div
        *ngIf="loading"
        style="text-align:center;padding:var(--triarq-space-xl);
               color:var(--triarq-color-text-secondary);"
      >Loading…</div>

      <!-- Division list ─────────────────────────────────────────────────── -->
      <div *ngIf="!loading">
        <div
          *ngIf="currentDivisions.length === 0 && !blockedMessage"
          style="color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);
                 padding:var(--triarq-space-lg) 0;text-align:center;"
        >{{ emptyMessage }}</div>

        <div
          *ngFor="let div of currentDivisions"
          (click)="navigateTo(div)"
          style="display:flex;align-items:center;justify-content:space-between;
                 padding:var(--triarq-space-sm) var(--triarq-space-md);
                 border-radius:6px;margin-bottom:6px;cursor:pointer;
                 border:1px solid var(--triarq-color-border);
                 transition:background 0.15s;"
          onmouseenter="this.style.background='var(--triarq-color-background-subtle)'"
          onmouseleave="this.style.background=''"
        >
          <div style="font-weight:500;color:var(--triarq-color-text-primary);">
            {{ div.division_name }}
          </div>
          <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
            <span
              class="oi-pill"
              style="background:var(--triarq-color-background-subtle);
                     color:var(--triarq-color-text-secondary);"
            >{{ getLevelLabel(div.division_level) }}</span>
            <span style="color:var(--triarq-color-text-tertiary);font-size:20px;">›</span>
          </div>
        </div>
      </div>

      <!-- Footer nav ────────────────────────────────────────────────────── -->
      <div
        style="margin-top:var(--triarq-space-lg);padding-top:var(--triarq-space-md);
               border-top:1px solid var(--triarq-color-border);
               display:flex;gap:var(--triarq-space-lg);"
      >
        <a
          routerLink="/admin/users"
          style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);"
        >Manage Users →</a>
      </div>
    </div>
  `
})
export class DivisionsComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────
  breadcrumb:         Crumb[]    = [{ id: null, name: 'All Trusts' }];
  currentDivisions:   Division[] = [];
  loading             = false;
  showCreateForm      = false;
  creating            = false;
  createError         = '';
  createSuccess       = false;
  showEditForm        = false;
  editDivisionError   = '';
  savingDivision      = false;
  blockedMessage      = '';
  blockedHint         = '';
  createForm!:        FormGroup;
  editDivisionForm!:  FormGroup;

  constructor(
    private readonly mcp: McpService,
    private readonly fb:  FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      division_name: ['', [Validators.required, Validators.maxLength(120)]]
    });
    this.editDivisionForm = this.fb.group({
      division_name: ['', [Validators.required, Validators.maxLength(120)]]
    });
    this.loadDivisions(null);
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  get isAtRoot(): boolean {
    return this.breadcrumb.length === 1;
  }

  /** DB level of the items currently displayed (0=Trust, 1=Service Line, 2=Function). */
  get currentLevel(): number {
    return this.breadcrumb.length - 1;
  }

  /** Short label for what is being created at the current level (interim: D-L2/L3). */
  get levelLabel(): string {
    return LEVEL_LABELS[this.currentLevel] ?? 'Division';
  }

  /** Short label for the division we navigated into (one level above items being displayed). */
  get editLabel(): string {
    return LEVEL_LABELS[this.currentLevel - 1] ?? 'Division';
  }

  /** True when the current level supports creating children (Trust/Service Line/Function only). */
  get canCreate(): boolean {
    return this.currentLevel <= 2;
  }

  get currentParentName(): string {
    return this.breadcrumb[this.breadcrumb.length - 1]?.name ?? '';
  }

  get currentParentId(): string | null {
    return this.breadcrumb[this.breadcrumb.length - 1]?.id ?? null;
  }

  get namePlaceholder(): string {
    switch (this.currentLevel) {
      case 0:  return 'e.g. Practice Services Trust';
      case 1:  return 'e.g. Revenue Cycle Management';
      case 2:  return 'e.g. Coding & Billing';
      default: return '';
    }
  }

  get emptyMessage(): string {
    if (this.isAtRoot) {
      return 'No Trusts yet. Use "+ New Trust" to create the first one.';
    }
    if (!this.canCreate) {
      return `${this.currentParentName} has no child Divisions.`;
    }
    return `No ${this.levelLabel}s yet. Use "+ New ${this.levelLabel}" to add one.`;
  }

  /** Returns the short display label for a Division row's level. */
  getLevelLabel(level: number): string {
    return LEVEL_LABELS[level] ?? 'Division';
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  navigateTo(division: Division): void {
    this.breadcrumb.push({ id: division.id, name: division.division_name });
    this.showCreateForm    = false;
    this.showEditForm      = false;
    this.createSuccess     = false;
    this.editDivisionError = '';
    this.loadDivisions(division.id);
  }

  navigateBreadcrumb(index: number): void {
    this.breadcrumb        = this.breadcrumb.slice(0, index + 1);
    this.showCreateForm    = false;
    this.showEditForm      = false;
    this.editDivisionError = '';
    this.loadDivisions(this.breadcrumb[index].id);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private loadDivisions(parentId: string | null): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<Division[]>(
        'division',
        'list_divisions',
        { parent_division_id: parentId }
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.currentDivisions = Array.isArray(res.data) ? res.data : [];
          } else {
            this.setBlocked(
              res.error ?? 'Could not load divisions.',
              'Ensure you have admin access and your session is active.'
            );
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.setBlocked(
            err.error ?? 'Could not load divisions.',
            'Ensure you have admin access and your session is active.'
          );
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.createError    = '';
    this.createSuccess  = false;
    if (this.showCreateForm) {
      this.showEditForm = false;
      this.createForm.reset();
    }
  }

  submitCreate(): void {
    if (this.createForm.invalid) { return; }
    this.creating      = true;
    this.createError   = '';
    this.createSuccess = false;
    this.cdr.markForCheck();

    const params: Record<string, unknown> = {
      division_name:       this.createForm.value.division_name as string,
      parent_division_id:  this.currentParentId,
      // Auto-set type label from level — no manual selection needed (D-L2/L3 interim).
      division_type_label: TYPE_LABELS[this.currentLevel] ?? ''
    };

    this.mcp
      .call<{ division: Division }>('division', 'create_division', params)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.createSuccess  = true;
            this.showCreateForm = false;
            this.createForm.reset();
            this.loadDivisions(this.currentParentId);
          } else {
            this.createError = res.error ?? 'Create failed.';
          }
          this.creating = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.createError = err.error ?? 'Create failed. Check permissions and try again.';
          this.creating    = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  toggleEditForm(): void {
    this.showEditForm      = !this.showEditForm;
    this.editDivisionError = '';
    if (this.showEditForm) {
      this.showCreateForm = false;
      this.editDivisionForm.setValue({ division_name: this.currentParentName });
    }
  }

  submitEditDivision(): void {
    if (this.editDivisionForm.invalid || !this.currentParentId) { return; }
    this.savingDivision    = true;
    this.editDivisionError = '';
    this.cdr.markForCheck();

    this.mcp
      .call<Division>('division', 'update_division', {
        division_id: this.currentParentId,
        updates: { division_name: this.editDivisionForm.value.division_name as string }
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            // Update breadcrumb name immediately — no reload needed.
            this.breadcrumb[this.breadcrumb.length - 1].name =
              this.editDivisionForm.value.division_name as string;
            this.showEditForm = false;
            this.editDivisionForm.reset();
          } else {
            this.editDivisionError = res.error ?? 'Save failed.';
          }
          this.savingDivision = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          this.editDivisionError = err.error ?? 'Save failed. Check permissions and try again.';
          this.savingDivision    = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}
