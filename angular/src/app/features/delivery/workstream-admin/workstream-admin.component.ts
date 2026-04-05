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
// D-178: Three-tier loading standard applied — Tier 1 skeleton, Tier 2 button spinner, Tier 3 overlay.

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
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-workstream-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IonicModule, LoadingOverlayComponent],
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

      <!-- ── Create form (D-178 Tier 3: section overlay) ────────────────── -->
      <div *ngIf="showCreateForm" style="position:relative;">
        <app-loading-overlay [visible]="creating" message="Creating Workstream…"></app-loading-overlay>
        <div style="background:var(--triarq-color-background-subtle);
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
              <!-- D-178 Tier 2: button spinner while creating -->
              <button type="submit" class="oi-btn-primary"
                      [disabled]="createForm.invalid || creating">
                <ion-spinner *ngIf="creating" name="crescent"
                             style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
                </ion-spinner>
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
      </div>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:grid;grid-template-columns:3fr 2fr 2fr 80px 1fr 100px;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- ── Load error (D-140) ─────────────────────────────────────────── -->
      <div *ngIf="loadError && !loading"
           style="padding:var(--triarq-space-md);max-width:600px;">
        <div style="color:var(--triarq-color-error);font-weight:500;margin-bottom:4px;">
          Workstreams could not load.
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ loadError }}
        </div>
      </div>

      <!-- ── Filter toggle: Active / Inactive / All ────────────────────────── -->
      <div *ngIf="!loading && workstreams.length > 0"
           style="display:flex;gap:4px;margin-bottom:var(--triarq-space-sm);">
        <button *ngFor="let f of ['active','inactive','all']"
                (click)="activeFilter = f"
                [style.fontWeight]="activeFilter === f ? '600' : '400'"
                [style.color]="activeFilter === f ? 'var(--triarq-color-primary)' : 'var(--triarq-color-text-secondary)'"
                [style.borderColor]="activeFilter === f ? 'var(--triarq-color-primary)' : 'var(--triarq-color-border)'"
                style="font-size:var(--triarq-text-small);background:none;
                       border:1px solid;border-radius:5px;padding:3px 10px;cursor:pointer;">
          {{ f | titlecase }}
        </button>
        <span style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                     margin-left:8px;align-self:center;">
          {{ filteredWorkstreams.length }} of {{ workstreams.length }}
        </span>
      </div>

      <!-- ── Workstream list ──────────────────────────────────────────────── -->
      <div *ngIf="!loading && workstreams.length > 0"
           style="display:flex;gap:var(--triarq-space-md);">

        <!-- List panel -->
        <div style="flex:1;min-width:0;">
          <div style="display:grid;grid-template-columns:3fr 2fr 2fr 80px 1fr 100px;
                      gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);
                      font-size:var(--triarq-text-small);font-weight:500;
                      color:var(--triarq-color-text-secondary);
                      border-bottom:2px solid var(--triarq-color-border);">
            <span>Workstream Name</span>
            <span>Home Division</span>
            <span>Workstream Lead</span>
            <span style="text-align:center;">Active Cycles</span>
            <span>Status</span>
            <span></span>
          </div>

          <div *ngFor="let ws of filteredWorkstreams">
            <!-- Row — click to open detail panel -->
            <div (click)="selectWorkstream(ws)"
                 style="display:grid;grid-template-columns:3fr 2fr 2fr 80px 1fr 100px;
                        gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                        border-bottom:1px solid var(--triarq-color-border);
                        font-size:var(--triarq-text-small);align-items:center;cursor:pointer;"
                 [style.background]="selectedWs?.workstream_id === ws.workstream_id
                   ? 'var(--triarq-color-background-subtle)'
                   : ws.active_status ? 'transparent' : '#fff8f8'">
              <span style="font-weight:500;color:var(--triarq-color-text-primary);">
                {{ ws.workstream_name }}
              </span>
              <span style="color:var(--triarq-color-text-secondary);">
                {{ ws.home_division_name ?? divisionName(ws.home_division_id) }}
              </span>
              <span style="color:var(--triarq-color-text-secondary);">
                {{ ws.lead_display_name ?? leadName(ws.workstream_lead_user_id) }}
              </span>
              <span style="text-align:center;color:var(--triarq-color-text-secondary);">
                {{ ws.active_cycle_count ?? '—' }}
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
              <span style="display:flex;justify-content:flex-end;" (click)="$event.stopPropagation()">
                <!-- D-178 Tier 2: spinner on toggle button -->
                <!-- Activate: immediate; Deactivate: inline confirmation per P13 / D-183 -->
                <button *ngIf="!ws.active_status"
                  (click)="toggleActive(ws)"
                  [disabled]="togglingId === ws.workstream_id"
                  style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                         background:none;border:none;cursor:pointer;padding:0;
                         display:flex;align-items:center;gap:4px;">
                  <ion-spinner *ngIf="togglingId === ws.workstream_id" name="crescent"
                               style="width:14px;height:14px;vertical-align:middle;">
                  </ion-spinner>
                  {{ togglingId === ws.workstream_id ? '…' : 'Activate' }}
                </button>
                <!-- Deactivate: show confirmation trigger first -->
                <button *ngIf="ws.active_status && confirmDeactivateWsId !== ws.workstream_id"
                  (click)="startDeactivateConfirm(ws)"
                  style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                         background:none;border:none;cursor:pointer;padding:0;">
                  Deactivate
                </button>
                <span *ngIf="ws.active_status && confirmDeactivateWsId === ws.workstream_id"
                      style="font-size:var(--triarq-text-small);">
                  <button (click)="confirmDeactivateWsId = null"
                          style="background:none;border:none;cursor:pointer;
                                 color:var(--triarq-color-text-secondary);font-size:10px;
                                 margin-right:4px;">Cancel</button>
                </span>
              </span>
            </div>

            <!-- Amber warning band for inactive workstreams -->
            <div *ngIf="!ws.active_status"
                 style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                        padding:var(--triarq-space-xs) var(--triarq-space-md);
                        font-size:var(--triarq-text-small);">
              <span style="font-weight:500;">Inactive</span>
              <span style="color:var(--triarq-color-text-secondary);margin-left:6px;">
                Gate review is blocked for all cycles on this Workstream.
                <span *ngIf="(ws.active_cycle_count ?? 0) > 0">
                  {{ ws.active_cycle_count }} open cycle{{ ws.active_cycle_count === 1 ? '' : 's' }} affected.
                </span>
                Reactivate to restore gate clearance.
              </span>
            </div>

            <!-- S5 / P13 / D-183: Inline deactivation confirmation — states exactly what changes -->
            <!-- Principle 13: destructive confirmation inline, not modal; names the count of affected cycles -->
            <div *ngIf="confirmDeactivateWsId === ws.workstream_id"
                 style="background:#fff8e1;border-left:4px solid var(--triarq-color-sunray,#f5a623);
                        padding:var(--triarq-space-sm) var(--triarq-space-md);
                        font-size:var(--triarq-text-small);">
              <div style="font-weight:500;margin-bottom:4px;">
                Deactivate {{ ws.workstream_name }}?
              </div>
              <div style="color:var(--triarq-color-text-secondary);margin-bottom:var(--triarq-space-sm);">
                Gate review will be blocked for
                <strong>{{ ws.active_cycle_count ?? 0 }}
                  Delivery Cycle{{ (ws.active_cycle_count ?? 0) === 1 ? '' : 's' }}</strong>
                on this Workstream. They cannot advance past any gate until this Workstream is
                reactivated. This action is reversible — use Activate to restore gate clearance.
              </div>
              <div style="display:flex;gap:var(--triarq-space-sm);align-items:center;">
                <button (click)="toggleActive(ws)"
                        [disabled]="togglingId === ws.workstream_id"
                        class="oi-btn-primary"
                        style="font-size:var(--triarq-text-small);padding:4px 14px;
                               display:flex;align-items:center;gap:4px;
                               background:var(--triarq-color-error);">
                  <ion-spinner *ngIf="togglingId === ws.workstream_id" name="crescent"
                               style="width:14px;height:14px;"></ion-spinner>
                  {{ togglingId === ws.workstream_id ? 'Deactivating…' : 'Confirm Deactivate' }}
                </button>
                <button (click)="confirmDeactivateWsId = null"
                        style="background:none;border:none;cursor:pointer;
                               font-size:var(--triarq-text-small);
                               color:var(--triarq-color-text-secondary);">
                  Cancel
                </button>
              </div>
            </div>

            <!-- D-140: Post-toggle warning — what changed and what to do to reverse -->
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

          <div *ngIf="filteredWorkstreams.length === 0 && workstreams.length > 0"
               style="padding:var(--triarq-space-md);font-size:var(--triarq-text-small);
                      color:var(--triarq-color-text-secondary);">
            No {{ activeFilter }} workstreams. Use the filter above to switch views.
          </div>
        </div>

        <!-- Detail right panel — shown when a workstream is selected -->
        <div *ngIf="selectedWs"
             style="width:260px;flex-shrink:0;border-left:1px solid var(--triarq-color-border);
                    padding-left:var(--triarq-space-md);">
          <div style="display:flex;align-items:center;justify-content:space-between;
                      margin-bottom:var(--triarq-space-sm);">
            <span style="font-weight:500;font-size:var(--triarq-text-small);">Workstream Details</span>
            <button (click)="selectedWs = null"
                    style="background:none;border:none;cursor:pointer;
                           color:var(--triarq-color-text-secondary);font-size:14px;">✕</button>
          </div>
          <div style="font-size:var(--triarq-text-small);display:grid;
                      gap:var(--triarq-space-xs);">
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Name</div>
              <div style="font-weight:500;">{{ selectedWs.workstream_name }}</div>
            </div>
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Home Division</div>
              <div>{{ selectedWs.home_division_name ?? divisionName(selectedWs.home_division_id) }}</div>
            </div>
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:4px;">Workstream Lead</div>
              <!-- D-181: Lead as tappable entity chip -->
              <span class="oi-pill"
                    style="font-size:11px;cursor:default;
                           background:var(--triarq-color-fog,#f0f4f8);
                           color:var(--triarq-color-text-primary);">
                {{ selectedWs.lead_display_name ?? leadName(selectedWs.workstream_lead_user_id) }}
              </span>
            </div>
            <!-- Members note: Division scopes visibility (D-170); no separate member table on workstream -->
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Members</div>
              <div style="font-size:10px;color:var(--triarq-color-text-secondary);font-style:italic;">
                All members of {{ selectedWs.home_division_name ?? divisionName(selectedWs.home_division_id) }}
                have access. Manage membership in Division Admin.
              </div>
            </div>
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Status</div>
              <span class="oi-pill"
                    [style.background]="selectedWs.active_status
                      ? 'var(--triarq-color-background-subtle)'
                      : 'var(--triarq-color-error-light,#fdecea)'"
                    [style.color]="selectedWs.active_status
                      ? 'var(--triarq-color-text-secondary)'
                      : 'var(--triarq-color-error)'">
                {{ selectedWs.active_status ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div>
              <div style="color:var(--triarq-color-text-secondary);font-size:10px;margin-bottom:2px;">Active Cycles</div>
              <div>{{ selectedWs.active_cycle_count ?? '—' }}</div>
            </div>
            <div style="margin-top:var(--triarq-space-xs);">
              <a [routerLink]="['/delivery']"
                 [queryParams]="{ workstream_id: selectedWs.workstream_id }"
                 style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                        text-decoration:none;">
                View cycles →
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty state — Design Principle 4.2 ───────────────────────────── -->
      <div *ngIf="!loading && !loadError && workstreams.length === 0"
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
  loadError          = '';
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

  // Group F: filter toggle + detail panel
  activeFilter: string               = 'active';
  selectedWs:   DeliveryWorkstream | null = null;

  // S5 / P13 / D-183: inline deactivation confirmation
  confirmDeactivateWsId: string | null = null;

  get filteredWorkstreams(): DeliveryWorkstream[] {
    if (this.activeFilter === 'active')   { return this.workstreams.filter(w => w.active_status); }
    if (this.activeFilter === 'inactive') { return this.workstreams.filter(w => !w.active_status); }
    return this.workstreams;
  }

  selectWorkstream(ws: DeliveryWorkstream): void {
    this.selectedWs = this.selectedWs?.workstream_id === ws.workstream_id ? null : ws;
    this.cdr.markForCheck();
  }

  /** P13 / D-183: open inline deactivation confirmation for a specific workstream */
  startDeactivateConfirm(ws: DeliveryWorkstream): void {
    this.confirmDeactivateWsId = ws.workstream_id;
    this.toggleWarning         = '';
    this.toggleWarningWsId     = null;
    this.toggleError           = '';
    this.toggleErrorWsId       = null;
    this.cdr.markForCheck();
  }

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4, 5];

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
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    this.delivery.listWorkstreams().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workstreams = Array.isArray(res.data) ? res.data : [];
        } else {
          this.loadError = res.error ?? 'Workstreams could not be loaded.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Unable to reach the server. Check your connection and try again.';
        this.loading   = false;
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
    this.togglingId            = ws.workstream_id;
    this.toggleWarning         = '';
    this.toggleWarningWsId     = null;
    this.toggleError           = '';
    this.toggleErrorWsId       = null;
    this.confirmDeactivateWsId = null;  // clear confirm state
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
