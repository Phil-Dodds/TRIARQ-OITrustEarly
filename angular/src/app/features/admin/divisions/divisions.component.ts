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
// D-178: Three-tier loading standard applied — Tier 1 skeleton, Tier 2 button spinners, Tier 3 overlays.

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
import { LoadingOverlayComponent }     from '../../../shared/components/loading-overlay/loading-overlay.component';
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
    BlockedActionComponent,
    LoadingOverlayComponent
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
          <!-- B-50: "Edit" entry remains in header. Cancel during edit moves to form body. -->
          <button
            *ngIf="!isAtRoot && !showEditForm"
            (click)="toggleEditForm()"
            style="font-size:var(--triarq-text-small);white-space:nowrap;
                   background:none;border:1px solid var(--triarq-color-border);
                   border-radius:5px;padding:6px 12px;cursor:pointer;
                   color:var(--triarq-color-text-primary);"
          >Edit {{ editLabel }}</button>
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

      <!-- Edit form (D-178 Tier 3: section overlay) ─────────────────────── -->
      <div *ngIf="showEditForm" style="position:relative;">
        <app-loading-overlay [visible]="savingDivision" message="Saving…"></app-loading-overlay>
        <div
          style="background:var(--triarq-color-background-subtle);
                 border-radius:8px;padding:var(--triarq-space-md);
                 margin-bottom:var(--triarq-space-md);"
        >
          <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
            Edit {{ editLabel }}
          </h4>
          <form [formGroup]="editDivisionForm" (ngSubmit)="submitEditDivision()">

            <!-- Full Name -->
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
                *ngIf="(editAttempted || editDivisionForm.get('division_name')?.touched)
                       && editDivisionForm.get('division_name')?.invalid"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
              >Name is required.</div>
            </div>

            <!-- B-48: Short Name (max 10) — Contract 10 §6 B-48. -->
            <div style="margin-top:var(--triarq-space-sm);">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Short Name *
              </label>
              <input
                formControlName="display_name_short"
                class="oi-input"
                maxlength="10"
                style="width:100%;max-width:420px;"
              />
              <!-- N/10 counter -->
              <div style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:2px;">
                {{ displayNameShortCount }}/10
              </div>
              <!-- S-025 Pattern 1 hint -->
              <div style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:2px;font-style:italic;">
                10 characters max. Used in grids and filter chips.
              </div>
              <!-- B-63: Pattern 3 inline error only on submit attempt — never disable Save (D-297). -->
              <div
                *ngIf="editAttempted && editDivisionForm.get('display_name_short')?.invalid"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
              >Short name is required.</div>
            </div>

            <!-- B-49 + B-50: Cancel and Save at the bottom of the form, Cancel left of Save. -->
            <div style="margin-top:var(--triarq-space-md);display:flex;gap:var(--triarq-space-sm);align-items:center;">
              <button type="button"
                      (click)="closeEditForm()"
                      [disabled]="savingDivision"
                      style="font-size:var(--triarq-text-small);background:none;
                             border:1px solid var(--triarq-color-border);border-radius:5px;
                             padding:8px 16px;cursor:pointer;color:var(--triarq-color-text-primary);">
                Cancel
              </button>
              <!-- B-49: filled primary button. B-63: D-297 — Save NOT disabled by form.invalid; only by saving state. -->
              <button type="submit" class="oi-btn-primary" [disabled]="savingDivision">
                <ion-spinner *ngIf="savingDivision" name="crescent"
                             style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
                </ion-spinner>
                {{ savingDivision ? 'Saving…' : 'Save' }}
              </button>
              <span
                *ngIf="editDivisionError"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);"
              >{{ editDivisionError }}</span>
            </div>
          </form>
        </div>
      </div>

      <!-- Create form (D-178 Tier 3: section overlay) ───────────────────── -->
      <div *ngIf="showCreateForm" style="position:relative;">
        <app-loading-overlay [visible]="creating" message="Creating {{ levelLabel }}…"></app-loading-overlay>
        <div
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
              <!-- D-178 Tier 2: button spinner while creating -->
              <button type="submit" class="oi-btn-primary" [disabled]="createForm.invalid || creating">
                <ion-spinner *ngIf="creating" name="crescent"
                             style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
                </ion-spinner>
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
      </div>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:flex;align-items:center;justify-content:space-between;
                    padding:var(--triarq-space-sm) var(--triarq-space-md);
                    border-radius:6px;margin-bottom:6px;
                    border:1px solid var(--triarq-color-border);gap:var(--triarq-space-sm);">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;flex:1;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;width:80px;border-radius:999px;"></ion-skeleton-text>
        </div>
      </div>

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
  editAttempted       = false; // B-63: track submit attempt to drive inline validation per D-297
  savingDivision      = false;
  /** Division we navigated INTO (the one being edited via Edit form). Set on navigateTo. */
  currentParent: Division | null = null;
  blockedMessage      = '';
  blockedHint         = '';
  createForm!:        FormGroup;
  editDivisionForm!:  FormGroup;

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4, 5];

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
      division_name:      ['', [Validators.required, Validators.maxLength(120)]],
      // B-48 / Migration 030: Short Name max 10 chars, required at edit time. Source: Contract 10 §6 B-48.
      display_name_short: ['', [Validators.required, Validators.maxLength(10)]]
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
    this.currentParent     = division;
    this.showCreateForm    = false;
    this.showEditForm      = false;
    this.createSuccess     = false;
    this.editDivisionError = '';
    this.loadDivisions(division.id);
  }

  navigateBreadcrumb(index: number): void {
    this.breadcrumb        = this.breadcrumb.slice(0, index + 1);
    this.currentParent     = null; // Re-fetched if user opens Edit at this level.
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
            // B-80: never expose MCP field names or raw tool errors in the UI.
            console.warn('[divisions] create_division failed:', res.error);
            this.createError = 'Unable to save changes. Please try again.';
          }
          this.creating = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          console.warn('[divisions] create_division HTTP error:', err);
          this.createError = 'Unable to save changes. Please try again.';
          this.creating    = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  toggleEditForm(): void {
    this.showEditForm      = !this.showEditForm;
    this.editDivisionError = '';
    this.editAttempted     = false;
    if (this.showEditForm) {
      this.showCreateForm = false;
      this.editDivisionForm.reset();
      // Pre-populate with current values. If currentParent isn't cached (entered via breadcrumb),
      // fetch it via get_division to populate display_name_short correctly. CC-C11-003.
      if (this.currentParent) {
        this.editDivisionForm.patchValue({
          division_name:      this.currentParent.division_name,
          display_name_short: this.currentParent.display_name_short ?? ''
        });
      } else if (this.currentParentId) {
        this.mcp.call<Division>('division', 'get_division', { division_id: this.currentParentId })
          .subscribe(res => {
            if (res.success && res.data) {
              this.currentParent = res.data;
              this.editDivisionForm.patchValue({
                division_name:      res.data.division_name,
                display_name_short: res.data.display_name_short ?? ''
              });
              this.cdr.markForCheck();
            }
          });
      }
    }
  }

  /** B-50: Cancel button at the form bottom. Same effect as toggleEditForm when open. */
  closeEditForm(): void {
    this.showEditForm      = false;
    this.editDivisionError = '';
    this.editAttempted     = false;
    this.editDivisionForm.reset();
    this.cdr.markForCheck();
  }

  /** B-63 helper: char count for "N/10" counter. */
  get displayNameShortCount(): number {
    return ((this.editDivisionForm?.get('display_name_short')?.value as string) ?? '').length;
  }

  submitEditDivision(): void {
    // B-63: D-297 — never disable Save. Show inline validation errors only on submit attempt.
    this.editAttempted = true;
    if (this.editDivisionForm.invalid || !this.currentParentId) {
      this.cdr.markForCheck();
      return;
    }
    this.savingDivision    = true;
    this.editDivisionError = '';
    this.cdr.markForCheck();

    const v = this.editDivisionForm.value as { division_name: string; display_name_short: string };

    this.mcp
      .call<Division>('division', 'update_division', {
        division_id: this.currentParentId,
        updates: {
          division_name:      v.division_name,
          display_name_short: v.display_name_short.trim()
        }
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // Update breadcrumb name immediately — no reload needed.
            this.breadcrumb[this.breadcrumb.length - 1].name = v.division_name;
            this.currentParent = res.data;
            this.showEditForm  = false;
            this.editAttempted = false;
            this.editDivisionForm.reset();
          } else {
            // B-80: never expose MCP field names or raw tool errors in the UI.
            console.warn('[divisions] update_division failed:', res.error);
            this.editDivisionError = 'Unable to save changes. Please try again.';
          }
          this.savingDivision = false;
          this.cdr.markForCheck();
        },
        error: (err: { error?: string }) => {
          console.warn('[divisions] update_division HTTP error:', err);
          this.editDivisionError = 'Unable to save changes. Please try again.';
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
