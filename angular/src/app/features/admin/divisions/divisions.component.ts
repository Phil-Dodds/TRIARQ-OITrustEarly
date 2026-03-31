// divisions.component.ts — Admin Division Hierarchy Management
// Build A: Creates the nine-Trust hierarchy and recursive child Divisions.
// Acceptance criteria: all nine Trusts created via this UI; child Divisions
//   created at least two levels deep (Build A Section 9).
// Roles: phil + admin (route protected by authGuard).
// D-93:  McpService only — no direct Supabase access.
// D-140: Blocked action UX on all errors.

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
        <button
          class="oi-btn-primary"
          (click)="toggleCreateForm()"
          style="font-size:var(--triarq-text-small);white-space:nowrap;"
        >{{ showCreateForm ? 'Cancel' : isAtRoot ? '+ New Trust' : '+ New Division' }}</button>
      </div>

      <!-- D-140 blocked action ──────────────────────────────────────────── -->
      <app-blocked-action
        *ngIf="blockedMessage"
        [primaryMessage]="blockedMessage"
        [secondaryMessage]="blockedHint"
      ></app-blocked-action>

      <!-- Create form ───────────────────────────────────────────────────── -->
      <div
        *ngIf="showCreateForm"
        style="background:var(--triarq-color-background-subtle);
               border-radius:8px;padding:var(--triarq-space-md);
               margin-bottom:var(--triarq-space-md);"
      >
        <h4 style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-body);">
          {{ isAtRoot ? 'Create Trust' : 'Create Division under "' + currentParentName + '"' }}
        </h4>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
          <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:1fr 1fr;">
            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Division Name *
              </label>
              <input
                formControlName="division_name"
                class="oi-input"
                placeholder="e.g. Midwest Trust"
              />
              <div
                *ngIf="createForm.get('division_name')?.invalid && createForm.get('division_name')?.touched"
                style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;"
              >Division name is required.</div>
            </div>
            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Division Type
              </label>
              <select formControlName="division_type_label" class="oi-input">
                <option value="">— Select type (optional) —</option>
                <option *ngFor="let t of divisionTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
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
        >
          {{ isAtRoot
              ? 'No Trusts yet. Use "+ New Trust" to create the first one.'
              : 'No child Divisions. Use "+ New Division" to add one.' }}
        </div>

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
          <div>
            <div style="font-weight:500;color:var(--triarq-color-text-primary);">
              {{ div.division_name }}
            </div>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              <span *ngIf="div.division_type_label">{{ div.division_type_label }} · </span>
              Level {{ div.division_level }}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
            <span
              class="oi-pill"
              style="background:var(--triarq-color-background-subtle);
                     color:var(--triarq-color-text-secondary);"
            >{{ div.division_level === 1 ? 'Trust' : 'Division' }}</span>
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
  breadcrumb:        Crumb[]    = [{ id: null, name: 'All Trusts' }];
  currentDivisions:  Division[] = [];
  loading            = false;
  showCreateForm     = false;
  creating           = false;
  createError        = '';
  createSuccess      = false;
  blockedMessage     = '';
  blockedHint        = '';
  createForm!:       FormGroup;

  readonly divisionTypes = [
    'Trust', 'Region', 'Practice', 'Department',
    'Team', 'Specialty', 'Market', 'Entity', 'Clinical'
  ];

  constructor(
    private readonly mcp: McpService,
    private readonly fb:  FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      division_name:       ['', [Validators.required, Validators.maxLength(120)]],
      division_type_label: ['']
    });
    this.loadDivisions(null);
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  get isAtRoot(): boolean {
    return this.breadcrumb.length === 1;
  }

  get currentParentName(): string {
    return this.breadcrumb[this.breadcrumb.length - 1]?.name ?? '';
  }

  get currentParentId(): string | null {
    return this.breadcrumb[this.breadcrumb.length - 1]?.id ?? null;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  navigateTo(division: Division): void {
    this.breadcrumb.push({ id: division.id, name: division.division_name });
    this.showCreateForm = false;
    this.createSuccess = false;
    this.loadDivisions(division.id);
  }

  navigateBreadcrumb(index: number): void {
    this.breadcrumb    = this.breadcrumb.slice(0, index + 1);
    this.showCreateForm = false;
    this.loadDivisions(this.breadcrumb[index].id);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  private loadDivisions(parentId: string | null): void {
    this.loading        = true;
    this.blockedMessage = '';
    this.cdr.markForCheck();

    this.mcp
      .call<{ divisions: Division[]; total_count: number }>(
        'division',
        'list_divisions',
        { parent_division_id: parentId }
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.currentDivisions = res.data.divisions;
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
    if (this.showCreateForm) { this.createForm.reset(); }
  }

  submitCreate(): void {
    if (this.createForm.invalid) { return; }
    this.creating      = true;
    this.createError   = '';
    this.createSuccess = false;
    this.cdr.markForCheck();

    const params: Record<string, unknown> = {
      division_name:      this.createForm.value.division_name as string,
      parent_division_id: this.currentParentId
    };
    const typeLabel = this.createForm.value.division_type_label as string;
    if (typeLabel) { params['division_type_label'] = typeLabel; }

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

  private setBlocked(primary: string, hint: string): void {
    this.blockedMessage = primary;
    this.blockedHint    = hint;
  }
}
