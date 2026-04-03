// workstream-admin.component.ts — WorkstreamAdminComponent
// Route: /admin/workstreams (Admin role only)
// Spec: build-c-spec Section 5.4
//
// - Explain what Workstreams are and why they exist (Design Principle 4.2)
// - List all Workstreams with active/inactive status
// - Create Workstream form — lead picked from user list, not raw UUID
// - Toggle active status — warning displayed if open cycles exist (D-140)
//
// D-93: McpService via DeliveryService only. No Supabase imports.
// D-140: Every blocked action states what is blocked AND what needs to change.
// Rule 2: Presentation only.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule }       from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { IonicModule }         from '@ionic/angular';
import { DeliveryService }     from '../../../core/services/delivery.service';
import { McpService }          from '../../../core/services/mcp.service';
import { DeliveryWorkstream, Division, User } from '../../../core/types/database';

@Component({
  selector: 'app-workstream-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IonicModule],
  template: `
    <div class="oi-card" style="max-width:960px;margin:var(--triarq-space-2xl) auto;">

      <!-- ── Page header ──────────────────────────────────────────────────── -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);gap:var(--triarq-space-md);">
        <div>
          <h3 style="margin:0 0 4px 0;">Delivery Workstreams</h3>
          <p style="margin:0;font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);max-width:560px;">
            A Workstream is a persistent delivery team or domain — the organising unit that
            Delivery Cycles belong to. Each cycle is assigned to exactly one Workstream.
            Gate clearance is blocked on cycles belonging to an inactive Workstream.
            Activate a Workstream to re-enable gate review for its cycles.
          </p>
        </div>
        <button class="oi-btn-primary" (click)="toggleCreateForm()"
                style="font-size:var(--triarq-text-small);white-space:nowrap;flex-shrink:0;">
          {{ showCreateForm ? 'Cancel' : '+ New Workstream' }}
        </button>
      </div>

      <!-- ── Create form ──────────────────────────────────────────────────── -->
      <div *ngIf="showCreateForm"
           style="background:var(--triarq-color-background-subtle);
                  border-radius:8px;padding:var(--triarq-space-md);
                  margin-bottom:var(--triarq-space-md);">
        <h4 style="margin:0 0 4px 0;font-size:var(--triarq-text-body);">New Workstream</h4>
        <p style="margin:0 0 var(--triarq-space-sm) 0;
                  font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          The Workstream Lead is accountable for gate reviews on cycles within this Workstream.
          The Home Division scopes which users can see cycles assigned here.
        </p>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
          <div style="display:grid;gap:var(--triarq-space-sm);
                      grid-template-columns:2fr 1fr 1fr;">
            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Workstream Name *
              </label>
              <input formControlName="workstream_name" class="oi-input"
                     placeholder="e.g. Clinical Operations Delivery" />
              <div *ngIf="createForm.get('workstream_name')?.invalid && createForm.get('workstream_name')?.touched"
                   style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                Workstream Name is required.
              </div>
            </div>
            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Home Division *
              </label>
              <select formControlName="home_division_id" class="oi-input">
                <option value="">— Select Division —</option>
                <option *ngFor="let d of divisions" [value]="d.id">{{ d.division_name }}</option>
              </select>
              <div *ngIf="createForm.get('home_division_id')?.invalid && createForm.get('home_division_id')?.touched"
                   style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                Home Division is required.
              </div>
            </div>
            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Workstream Lead *
              </label>
              <select formControlName="workstream_lead_user_id" class="oi-input">
                <option value="">— Select Lead —</option>
                <option *ngFor="let u of users" [value]="u.id">
                  {{ u.display_name }}
                </option>
              </select>
              <div *ngIf="createForm.get('workstream_lead_user_id')?.invalid && createForm.get('workstream_lead_user_id')?.touched"
                   style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                Workstream Lead is required.
              </div>
              <div *ngIf="users.length === 0 && !loadingUsers"
                   style="color:var(--triarq-color-sunray,#f5a623);font-size:var(--triarq-text-small);margin-top:2px;">
                No users found. Ensure users have been created in Admin → Users.
              </div>
            </div>
          </div>
          <div style="margin-top:var(--triarq-space-sm);display:flex;gap:var(--triarq-space-sm);align-items:center;">
            <button type="submit" class="oi-btn-primary"
                    [disabled]="createForm.invalid || creating">
              {{ creating ? 'Creating…' : 'Create Workstream' }}
            </button>
            <div *ngIf="createError"
                 style="font-size:var(--triarq-text-small);">
              <span style="color:var(--triarq-color-error);font-weight:500;">{{ createError }}</span>
              <span style="color:var(--triarq-color-text-secondary);margin-left:6px;">
                Check that the selected Division and Lead are valid.
              </span>
            </div>
          </div>
        </form>
      </div>

      <!-- ── Loading ──────────────────────────────────────────────────────── -->
      <div *ngIf="loading"
           style="text-align:center;padding:var(--triarq-space-xl);
                  color:var(--triarq-color-text-secondary);">
        Loading workstreams…
      </div>

      <!-- ── Workstream list ──────────────────────────────────────────────── -->
      <div *ngIf="!loading && workstreams.length > 0">
        <div style="display:grid;grid-template-columns:3fr 2fr 2fr 1fr 120px;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    font-size:var(--triarq-text-small);font-weight:500;
                    color:var(--triarq-color-text-secondary);
                    border-bottom:2px solid var(--triarq-color-border);">
          <span>Workstream Name</span>
          <span>Home Division</span>
          <span>Workstream Lead</span>
          <span>Active Status</span>
          <span></span>
        </div>

        <div *ngFor="let ws of workstreams">
          <!-- Row -->
          <div style="display:grid;grid-template-columns:3fr 2fr 2fr 1fr 120px;
                      gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                      border-bottom:1px solid var(--triarq-color-border);
                      font-size:var(--triarq-text-small);align-items:center;">
            <span style="font-weight:500;color:var(--triarq-color-text-primary);">
              {{ ws.workstream_name }}
            </span>
            <span style="color:var(--triarq-color-text-secondary);">
              {{ ws.home_division_name ?? divisionName(ws.home_division_id) }}
            </span>
            <span style="color:var(--triarq-color-text-secondary);">
              {{ ws.lead_display_name ?? leadName(ws.workstream_lead_user_id) }}
            </span>
            <span>
              <span class="oi-pill"
                    [style.background]="ws.active_status
                      ? 'var(--triarq-color-background-subtle)'
                      : 'var(--triarq-color-error-light,#fdecea)'"
                    [style.color]="ws.active_status
                      ? 'var(--triarq-color-text-secondary)'
                      : 'var(--triarq-color-error)'">
                {{ ws.active_status ? 'Active' : 'Inactive' }}
              </span>
            </span>
            <span style="display:flex;justify-content:flex-end;">
              <button
                (click)="toggleActive(ws)"
                [disabled]="togglingId === ws.workstream_id"
                style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                       background:none;border:none;cursor:pointer;padding:0;">
                {{ togglingId === ws.workstream_id ? '…' : (ws.active_status ? 'Deactivate' : 'Activate') }}
              </button>
            </span>
          </div>

          <!-- D-140: Deactivation warning — what changes and what the impact is -->
          <div *ngIf="toggleWarning && toggleWarningWsId === ws.workstream_id"
               style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                      padding:var(--triarq-space-sm) var(--triarq-space-md);
                      font-size:var(--triarq-text-small);">
            <div style="font-weight:500;margin-bottom:4px;">{{ toggleWarning }}</div>
            <div style="color:var(--triarq-color-text-secondary);">
              Open cycles on this Workstream cannot clear gates until it is reactivated.
              Reactivate this Workstream to restore gate review for its cycles.
            </div>
          </div>

          <!-- D-140: Toggle error — what failed and what to do -->
          <div *ngIf="toggleError && toggleErrorWsId === ws.workstream_id"
               style="background:var(--triarq-color-error-light,#fdecea);
                      border-left:4px solid var(--triarq-color-error);
                      padding:var(--triarq-space-sm) var(--triarq-space-md);
                      font-size:var(--triarq-text-small);">
            <div style="font-weight:500;color:var(--triarq-color-error);">{{ toggleError }}</div>
            <div style="color:var(--triarq-color-text-secondary);margin-top:4px;">
              Check your admin permissions and try again. Contact your System Admin if the problem persists.
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty state — Design Principle 4.2 ───────────────────────────── -->
      <div *ngIf="!loading && workstreams.length === 0"
           style="padding:var(--triarq-space-xl) 0;text-align:center;">
        <div style="font-weight:500;color:var(--triarq-color-text-primary);margin-bottom:8px;">
          No Workstreams yet
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                    max-width:440px;margin:0 auto;">
          Use "+ New Workstream" to create the first one. You need at least one active Workstream
          before a Delivery Cycle can be created. Workstreams are not deleted — use Deactivate
          to suspend a Workstream without removing its cycle history.
        </div>
      </div>

      <!-- ── Footer nav ───────────────────────────────────────────────────── -->
      <div style="margin-top:var(--triarq-space-lg);padding-top:var(--triarq-space-md);
                  border-top:1px solid var(--triarq-color-border);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);">
          ← Delivery Dashboard
        </a>
      </div>
    </div>
  `
})
export class WorkstreamAdminComponent implements OnInit {

  workstreams:       DeliveryWorkstream[] = [];
  divisions:         Division[]           = [];
  users:             User[]               = [];
  loading            = false;
  loadingUsers       = false;
  showCreateForm     = false;
  creating           = false;
  createError        = '';
  togglingId:        string | null        = null;
  toggleWarning      = '';
  toggleWarningWsId: string | null        = null;
  toggleError        = '';
  toggleErrorWsId:   string | null        = null;
  createForm!:       FormGroup;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly mcp:      McpService,
    private readonly fb:       FormBuilder,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      workstream_name:         ['', Validators.required],
      home_division_id:        ['', Validators.required],
      workstream_lead_user_id: ['', Validators.required]
    });
    this.loadDivisions();
    this.loadUsers();
    this.loadWorkstreams();
  }

  private loadDivisions(): void {
    this.mcp.call<Division[]>('division', 'list_divisions', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisions = Array.isArray(res.data) ? res.data : [];
          this.cdr.markForCheck();
        }
      },
      error: () => { /* non-fatal — picker shows empty */ }
    });
  }

  private loadUsers(): void {
    this.loadingUsers = true;
    this.cdr.markForCheck();
    this.mcp.call<User[]>('division', 'list_users', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users = Array.isArray(res.data) ? res.data : [];
        }
        this.loadingUsers = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingUsers = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadWorkstreams(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.delivery.listWorkstreams().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workstreams = Array.isArray(res.data) ? res.data : [];
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.createError    = '';
    if (this.showCreateForm) { this.createForm.reset(); }
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (this.createForm.invalid) { return; }
    this.creating    = true;
    this.createError = '';
    this.cdr.markForCheck();

    this.delivery.createWorkstream({
      workstream_name:         this.createForm.value.workstream_name         as string,
      home_division_id:        this.createForm.value.home_division_id        as string,
      workstream_lead_user_id: this.createForm.value.workstream_lead_user_id as string
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCreateForm = false;
          this.createForm.reset();
          this.loadWorkstreams();
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

  toggleActive(ws: DeliveryWorkstream): void {
    this.togglingId        = ws.workstream_id;
    this.toggleWarning     = '';
    this.toggleWarningWsId = null;
    this.toggleError       = '';
    this.toggleErrorWsId   = null;
    this.cdr.markForCheck();

    this.delivery.updateWorkstreamActiveStatus({
      workstream_id: ws.workstream_id,
      active_status: !ws.active_status
    }).subscribe({
      next: (res) => {
        if (res.success) {
          if (res.message) {
            this.toggleWarning     = res.message;
            this.toggleWarningWsId = ws.workstream_id;
          }
          this.loadWorkstreams();
        } else {
          this.toggleError     = res.error ?? 'Status change failed.';
          this.toggleErrorWsId = ws.workstream_id;
        }
        this.togglingId = null;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.toggleError     = err.error ?? 'Status change failed. Check permissions and try again.';
        this.toggleErrorWsId = ws.workstream_id;
        this.togglingId      = null;
        this.cdr.markForCheck();
      }
    });
  }

  divisionName(divisionId: string): string {
    return this.divisions.find(d => d.id === divisionId)?.division_name ?? divisionId;
  }

  leadName(userId: string): string {
    return this.users.find(u => u.id === userId)?.display_name ?? userId;
  }
}
