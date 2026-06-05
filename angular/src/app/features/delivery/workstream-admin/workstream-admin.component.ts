// workstream-admin.component.ts — WorkstreamAdminComponent
// Route: /admin/workstreams (Admin role only)
// Contract 17 §9 — full redesign.
//
// Conforms to:
//   S-005 Universal Entity Detail Pattern
//   S-006 Entity Detail Navigation Stack
//   S-008 Parent Refresh on Return
//   S-010 Filter Panel Structure
//   S-016 Create Surface Panel Behavior
//   S-017 Panel Modality by Surface Type (View non-modal; Edit/Create modal scrim)
//   S-018 List → View Pattern
//   S-019 View → Edit Pattern
//   D-181 Tappable Entity Chips
//   D-183 Destructive Action Confirmation (two-step)
//   D-291 Panel Header Sticky
//   D-348 Panel Action Button Placement
//   D-203 / ARCH-29 display_name_short
//   D-380 ScreenStateService → MCP screen-state persistence (screen key
//         `admin.workstreams`)
//
// Pattern reference: All Initiatives (/initiatives/list).

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  HostListener
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { IonicModule }              from '@ionic/angular';
import { DeliveryService }          from '../../../core/services/delivery.service';
import { McpService }               from '../../../core/services/mcp.service';
import {
  ScreenStateService,
  SCREEN_KEYS
}                                    from '../../../core/services/screen-state.service';
import { DeliveryWorkstream, Division, User } from '../../../core/types/database';
import { LoadingOverlayComponent }  from '../../../shared/components/loading-overlay/loading-overlay.component';

type StatusFilter = 'active' | 'inactive' | 'all';
type WsSortField  = 'workstream_name' | 'display_name_short' | 'home_division_name'
                  | 'lead_display_name' | 'active_cycle_count' | 'active_status';
type SortDir      = 'asc' | 'desc';
type PanelMode    = 'none' | 'view' | 'edit' | 'create';

@Component({
  selector: 'app-workstream-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, LoadingOverlayComponent],
  template: `
    <!-- Two-pane layout: list (left) + entity panel slot (right) when active.
         When Edit/Create panel is open: scrim overlays list (S-017). -->
    <div style="display:flex;min-height:100vh;background:var(--triarq-color-surface);">

      <!-- ── List pane ───────────────────────────────────────────────────── -->
      <div [style.width]="panelMode === 'none' ? '100%' : '40%'"
           style="flex-shrink:0;overflow-y:auto;transition:width 150ms ease;">
        <div style="padding:var(--triarq-space-md);">

          <!-- Page header ─ counts + Filters + + New Workstream -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;
                      gap:var(--triarq-space-md);margin-bottom:var(--triarq-space-md);">
            <div>
              <h3 style="margin:0 0 4px 0;">Delivery Workstreams</h3>
              <!-- S-015 surface description (11px italic Stone). -->
              <div style="font-size:11px;font-style:italic;color:#5A5A5A;">
                Persistent delivery teams. Each Initiative belongs to exactly one Workstream.
              </div>

              <!-- Counts row (shown when no filters active) -->
              <div *ngIf="!anyFiltersActive"
                   style="display:flex;gap:var(--triarq-space-md);margin-top:var(--triarq-space-sm);
                          font-size:var(--triarq-text-small);">
                <span><strong>{{ activeCount }}</strong>
                  <span style="color:var(--triarq-color-text-secondary);">&nbsp;Active</span>
                </span>
                <span *ngIf="inactiveCount > 0">
                  <strong>{{ inactiveCount }}</strong>
                  <span style="color:var(--triarq-color-text-secondary);">&nbsp;Inactive</span>
                </span>
              </div>
            </div>

            <!-- Header actions (D-348 right cluster) -->
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-shrink:0;">
              <!-- S-010 Filters button with count badge -->
              <button (click)="openFilterPanel()"
                      class="oi-btn-secondary"
                      style="font-size:var(--triarq-text-small);">
                Filters
                <span *ngIf="activeFilterCount > 0"
                      style="background:var(--triarq-color-primary);color:#fff;
                             border-radius:999px;padding:1px 8px;
                             margin-left:6px;font-size:11px;">
                  {{ activeFilterCount }}
                </span>
              </button>
              <!-- S-016 Create button -->
              <button (click)="openCreatePanel()"
                      class="oi-btn-primary"
                      style="font-size:var(--triarq-text-small);white-space:nowrap;">
                + New Workstream
              </button>
            </div>
          </div>

          <!-- S-012 Active filter chips -->
          <div *ngIf="anyFiltersActive"
               style="display:flex;flex-wrap:wrap;gap:var(--triarq-space-xs);
                      margin-bottom:var(--triarq-space-sm);">
            <span *ngIf="statusFilter !== 'active'"
                  style="display:inline-flex;align-items:center;gap:6px;
                         background:var(--triarq-color-background);
                         border:1px solid var(--triarq-color-border);
                         border-radius:999px;padding:3px 10px;
                         font-size:var(--triarq-text-small);">
              Status: {{ statusFilter === 'all' ? 'All' : 'Inactive' }}
              <button (click)="clearStatusFilter()"
                      style="background:none;border:none;cursor:pointer;
                             font-size:14px;line-height:1;color:#5A5A5A;"
                      aria-label="Remove status filter">×</button>
            </span>
            <span *ngIf="homeDivisionFilter"
                  style="display:inline-flex;align-items:center;gap:6px;
                         background:var(--triarq-color-background);
                         border:1px solid var(--triarq-color-border);
                         border-radius:999px;padding:3px 10px;
                         font-size:var(--triarq-text-small);">
              Home Division: {{ divisionName(homeDivisionFilter) }}
              <button (click)="clearDivisionFilter()"
                      style="background:none;border:none;cursor:pointer;
                             font-size:14px;line-height:1;color:#5A5A5A;"
                      aria-label="Remove division filter">×</button>
            </span>
          </div>

          <!-- Skeleton on initial load -->
          <div *ngIf="loading">
            <div *ngFor="let r of skeletonRows"
                 style="display:flex;gap:var(--triarq-space-sm);padding:var(--triarq-space-sm) 0;
                        border-bottom:1px solid var(--triarq-color-border);">
              <ion-skeleton-text animated style="width:32px;height:32px;border-radius:50%;"></ion-skeleton-text>
              <div style="flex:1;">
                <ion-skeleton-text animated style="width:50%;height:14px;margin-bottom:6px;"></ion-skeleton-text>
                <ion-skeleton-text animated style="width:30%;height:12px;"></ion-skeleton-text>
              </div>
            </div>
          </div>

          <!-- Load error -->
          <div *ngIf="!loading && loadError"
               style="color:var(--triarq-color-error);padding:var(--triarq-space-md);
                      border:1px solid var(--triarq-color-error);border-radius:8px;">
            <div style="font-weight:500;margin-bottom:4px;">{{ loadError }}</div>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              Check your connection or refresh the page. Contact your System Admin if the problem persists.
            </div>
          </div>

          <!-- Grid -->
          <div *ngIf="!loading && !loadError">
            <div *ngIf="filteredSortedWorkstreams.length === 0"
                 style="padding:var(--triarq-space-xl);text-align:center;
                        color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);">
              No Workstreams match the current filters.
              <button *ngIf="anyFiltersActive"
                      (click)="clearAllFilters()"
                      style="background:none;border:none;color:var(--triarq-color-primary);
                             cursor:pointer;text-decoration:underline;padding:0;margin-left:6px;">
                Clear filters
              </button>
            </div>

            <table *ngIf="filteredSortedWorkstreams.length > 0"
                   style="width:100%;border-collapse:collapse;font-size:var(--triarq-text-small);">
              <thead>
                <tr style="border-bottom:2px solid var(--triarq-color-border);">
                  <th style="text-align:left;padding:8px 4px;width:36px;"></th>
                  <th (click)="toggleSort('workstream_name')"
                      style="text-align:left;padding:8px 4px;cursor:pointer;user-select:none;">
                    Workstream Name {{ sortGlyph('workstream_name') }}
                  </th>
                  <th (click)="toggleSort('display_name_short')"
                      style="text-align:left;padding:8px 4px;cursor:pointer;user-select:none;">
                    Short Name {{ sortGlyph('display_name_short') }}
                  </th>
                  <th (click)="toggleSort('home_division_name')"
                      style="text-align:left;padding:8px 4px;cursor:pointer;user-select:none;">
                    Home Division {{ sortGlyph('home_division_name') }}
                  </th>
                  <th (click)="toggleSort('lead_display_name')"
                      style="text-align:left;padding:8px 4px;cursor:pointer;user-select:none;">
                    Workstream Lead {{ sortGlyph('lead_display_name') }}
                  </th>
                  <th (click)="toggleSort('active_cycle_count')"
                      style="text-align:right;padding:8px 4px;cursor:pointer;user-select:none;">
                    Active Initiatives {{ sortGlyph('active_cycle_count') }}
                  </th>
                  <th (click)="toggleSort('active_status')"
                      style="text-align:left;padding:8px 4px;cursor:pointer;user-select:none;">
                    Status {{ sortGlyph('active_status') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let w of filteredSortedWorkstreams"
                    (click)="openViewPanel(w)"
                    [style.background]="selectedWs?.workstream_id === w.workstream_id ? 'var(--triarq-color-background)' : ''"
                    style="border-bottom:1px solid var(--triarq-color-border);cursor:pointer;">
                  <td style="padding:8px 4px;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;
                                 width:28px;height:28px;border-radius:50%;
                                 background:var(--triarq-color-primary);color:#fff;
                                 font-size:11px;font-weight:500;">
                      {{ wsInitials(w.workstream_name) }}
                    </span>
                  </td>
                  <td style="padding:8px 4px;font-weight:500;">{{ w.workstream_name }}</td>
                  <td style="padding:8px 4px;color:var(--triarq-color-text-secondary);">
                    {{ w.display_name_short || '—' }}
                  </td>
                  <td style="padding:8px 4px;">{{ w.home_division_name ?? divisionName(w.home_division_id) }}</td>
                  <td style="padding:8px 4px;">{{ w.lead_display_name ?? leadName(w.workstream_lead_user_id) }}</td>
                  <td style="padding:8px 4px;text-align:right;">{{ w.active_cycle_count ?? 0 }}</td>
                  <td style="padding:8px 4px;">
                    <span [style.background]="w.active_status ? '#E8F5E9' : '#F5F5F5'"
                          [style.color]="w.active_status ? '#2E7D32' : '#757575'"
                          style="border-radius:4px;padding:2px 8px;font-size:11px;">
                      {{ w.active_status ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Grid footer -->
            <div *ngIf="filteredSortedWorkstreams.length > 0"
                 style="padding:var(--triarq-space-sm) 4px;font-size:11px;
                        color:var(--triarq-color-text-secondary);font-style:italic;">
              <ng-container *ngIf="!anyFiltersActive">
                Showing {{ filteredSortedWorkstreams.length }} workstreams
              </ng-container>
              <ng-container *ngIf="anyFiltersActive">
                {{ filteredSortedWorkstreams.length }} of {{ workstreams.length }} workstreams — filtered view
              </ng-container>
            </div>
          </div>

        </div>
      </div>

      <!-- S-017 Scrim — list inert while Edit or Create is open -->
      <div *ngIf="panelMode === 'edit' || panelMode === 'create'"
           (click)="onScrimClick()"
           style="position:fixed;inset:0;background:rgba(0,0,0,0.32);z-index:40;"></div>

      <!-- ── Right panel slot ───────────────────────────────────────────── -->
      <div *ngIf="panelMode !== 'none'"
           style="width:60%;border-left:1px solid var(--triarq-color-border);
                  background:#fff;position:sticky;top:0;height:100vh;
                  overflow-y:auto;flex-shrink:0;z-index:50;">

        <!-- View state ─ S-018 -->
        <div *ngIf="panelMode === 'view' && selectedWs"
             style="position:relative;">

          <!-- D-291 sticky header -->
          <div style="position:sticky;top:0;background:#fff;z-index:5;
                      padding:var(--triarq-space-md);
                      border-bottom:1px solid var(--triarq-color-border);
                      display:flex;align-items:center;justify-content:space-between;
                      gap:var(--triarq-space-sm);">
            <h3 style="margin:0;">{{ selectedWs.workstream_name }}</h3>
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
              <!-- D-348 Tier 2 Edit -->
              <button (click)="openEditPanel()"
                      class="oi-btn-secondary"
                      style="font-size:var(--triarq-text-small);">
                ✎ Edit
              </button>
              <!-- Activate (no confirmation) -->
              <button *ngIf="!selectedWs.active_status && !togglingId"
                      (click)="activateWorkstream(selectedWs)"
                      style="background:none;border:1px solid var(--triarq-color-primary);
                             color:var(--triarq-color-primary);border-radius:5px;
                             padding:3px 10px;cursor:pointer;font-size:var(--triarq-text-small);">
                Activate
              </button>
              <!-- Deactivate inline confirm (D-183) -->
              <ng-container *ngIf="selectedWs.active_status">
                <ng-container *ngIf="confirmDeactivateWsId !== selectedWs.workstream_id; else deactivateConfirm">
                  <button (click)="startDeactivateConfirm(selectedWs)"
                          [disabled]="togglingId === selectedWs.workstream_id"
                          style="background:none;border:1px solid var(--triarq-color-error);
                                 color:var(--triarq-color-error);border-radius:5px;
                                 padding:3px 10px;cursor:pointer;font-size:var(--triarq-text-small);">
                    Deactivate
                  </button>
                </ng-container>
                <ng-template #deactivateConfirm>
                  <span style="font-size:11px;color:var(--triarq-color-text-secondary);">
                    Deactivating blocks gate clearance on
                    {{ selectedWs.active_cycle_count ?? 0 }} active cycle{{ (selectedWs.active_cycle_count ?? 0) === 1 ? '' : 's' }}.
                    Deactivate?
                  </span>
                  <button (click)="confirmDeactivate(selectedWs)"
                          [disabled]="togglingId === selectedWs.workstream_id"
                          style="background:var(--triarq-color-error);color:#fff;border:none;
                                 border-radius:5px;padding:3px 10px;cursor:pointer;font-size:var(--triarq-text-small);">
                    Confirm
                  </button>
                  <button (click)="cancelDeactivate()"
                          [disabled]="togglingId === selectedWs.workstream_id"
                          style="background:none;border:1px solid var(--triarq-color-border);
                                 color:#5A5A5A;border-radius:5px;padding:3px 10px;cursor:pointer;font-size:var(--triarq-text-small);">
                    Cancel
                  </button>
                </ng-template>
              </ng-container>
              <!-- Close X -->
              <button (click)="closePanel()"
                      title="Close panel"
                      aria-label="Close panel"
                      style="background:none;border:none;cursor:pointer;
                             color:var(--triarq-color-text-secondary);font-size:20px;
                             line-height:1;padding:4px 8px;">✕</button>
            </div>
          </div>

          <div style="padding:var(--triarq-space-md);">

            <div *ngIf="toggleError && toggleErrorWsId === selectedWs.workstream_id"
                 style="border-left:3px solid var(--triarq-color-error);
                        background:rgba(198,40,40,0.08);padding:var(--triarq-space-sm);
                        margin-bottom:var(--triarq-space-md);font-size:var(--triarq-text-small);">
              {{ toggleError }}
            </div>

            <!-- Zone 1 — Identity -->
            <section style="margin-bottom:var(--triarq-space-lg);">
              <h4 style="margin:0 0 4px 0;font-size:var(--triarq-text-small);
                         text-transform:uppercase;letter-spacing:0.5px;color:#5A5A5A;">
                Identity
              </h4>
              <dl style="margin:0;display:grid;grid-template-columns:160px 1fr;
                         gap:var(--triarq-space-xs) var(--triarq-space-md);font-size:var(--triarq-text-small);">
                <dt style="color:#5A5A5A;">Workstream Name</dt>
                <dd style="margin:0;">{{ selectedWs.workstream_name }}</dd>
                <dt style="color:#5A5A5A;">Short Name</dt>
                <dd style="margin:0;">{{ selectedWs.display_name_short || '—' }}</dd>
                <dt style="color:#5A5A5A;">Home Division</dt>
                <dd style="margin:0;">
                  <!-- D-181 Tappable Entity Chip -->
                  <span class="oi-entity-chip"
                        (click)="$event.stopPropagation()"
                        style="display:inline-flex;align-items:center;gap:6px;
                               background:rgba(220,225,231,0.5);
                               border-radius:999px;padding:3px 10px;
                               font-size:var(--triarq-text-small);cursor:default;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;
                                 width:20px;height:20px;border-radius:50%;
                                 background:var(--triarq-color-primary);color:#fff;
                                 font-size:10px;font-weight:500;">
                      {{ wsInitials(selectedWs.home_division_name ?? divisionName(selectedWs.home_division_id)) }}
                    </span>
                    {{ selectedWs.home_division_name ?? divisionName(selectedWs.home_division_id) }}
                  </span>
                </dd>
                <dt style="color:#5A5A5A;">Workstream Lead</dt>
                <dd style="margin:0;">
                  <span class="oi-entity-chip"
                        (click)="$event.stopPropagation()"
                        style="display:inline-flex;align-items:center;gap:6px;
                               background:rgba(220,225,231,0.5);
                               border-radius:999px;padding:3px 10px;
                               font-size:var(--triarq-text-small);cursor:default;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;
                                 width:20px;height:20px;border-radius:50%;
                                 background:#5A5A5A;color:#fff;
                                 font-size:10px;font-weight:500;">
                      {{ wsInitials(selectedWs.lead_display_name ?? leadName(selectedWs.workstream_lead_user_id)) }}
                    </span>
                    {{ selectedWs.lead_display_name ?? leadName(selectedWs.workstream_lead_user_id) }}
                  </span>
                </dd>
                <dt style="color:#5A5A5A;">Status</dt>
                <dd style="margin:0;">
                  <span [style.background]="selectedWs.active_status ? '#E8F5E9' : '#F5F5F5'"
                        [style.color]="selectedWs.active_status ? '#2E7D32' : '#757575'"
                        style="border-radius:4px;padding:2px 8px;font-size:11px;">
                    {{ selectedWs.active_status ? 'Active' : 'Inactive' }}
                  </span>
                </dd>
              </dl>
            </section>

            <!-- Zone 3 — Activity -->
            <section style="margin-bottom:var(--triarq-space-lg);">
              <h4 style="margin:0 0 4px 0;font-size:var(--triarq-text-small);
                         text-transform:uppercase;letter-spacing:0.5px;color:#5A5A5A;">
                Activity
              </h4>
              <div style="font-size:var(--triarq-text-small);">
                <strong>{{ selectedWs.active_cycle_count ?? 0 }}</strong> active Cycles
                <button (click)="goToCyclesForWorkstream(selectedWs.workstream_id)"
                        style="background:none;border:none;color:var(--triarq-color-primary);
                               cursor:pointer;text-decoration:underline;margin-left:8px;
                               font-size:var(--triarq-text-small);padding:0;">
                  View Initiatives →
                </button>
              </div>
            </section>

            <!-- Zone 4 — Members -->
            <section>
              <h4 style="margin:0 0 4px 0;font-size:var(--triarq-text-small);
                         text-transform:uppercase;letter-spacing:0.5px;color:#5A5A5A;">
                Members
              </h4>
              <div style="font-size:11px;font-style:italic;color:#5A5A5A;">
                All members of {{ selectedWs.home_division_name ?? divisionName(selectedWs.home_division_id) }}
                have access. Manage membership in Division Admin.
              </div>
            </section>
          </div>
        </div>

        <!-- Edit state ─ S-019 -->
        <div *ngIf="panelMode === 'edit' && selectedWs" style="position:relative;">
          <app-loading-overlay [visible]="saving" message="Saving…"></app-loading-overlay>

          <div style="position:sticky;top:0;background:#fff;z-index:5;
                      padding:var(--triarq-space-md);
                      border-bottom:1px solid var(--triarq-color-border);
                      display:flex;align-items:center;justify-content:space-between;
                      gap:var(--triarq-space-sm);">
            <h3 style="margin:0;">Edit Workstream</h3>
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
              <button (click)="saveEdit()"
                      [disabled]="editForm.invalid || !isEditDirty() || saving"
                      class="oi-btn-primary"
                      style="font-size:var(--triarq-text-small);">
                Save
              </button>
              <button (click)="cancelEdit()"
                      [disabled]="saving"
                      class="oi-btn-secondary"
                      style="font-size:var(--triarq-text-small);">
                Cancel
              </button>
            </div>
          </div>

          <form [formGroup]="editForm" style="padding:var(--triarq-space-md);
                                              display:grid;gap:var(--triarq-space-md);">

            <div *ngIf="saveError"
                 style="border-left:3px solid var(--triarq-color-error);
                        background:rgba(198,40,40,0.08);padding:var(--triarq-space-sm);
                        font-size:var(--triarq-text-small);">
              {{ saveError }}
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Workstream Name *
              </label>
              <input formControlName="workstream_name" class="oi-input" />
              <div *ngIf="editForm.get('workstream_name')?.invalid && editForm.get('workstream_name')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Workstream Name is required.
              </div>
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Short Name *
              </label>
              <input formControlName="display_name_short"
                     class="oi-input"
                     maxlength="20" />
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
                <span style="color:#5A5A5A;font-style:italic;">
                  20 characters max. Used in grids and workstream picker.
                </span>
                <span style="color:#5A5A5A;">
                  {{ (editForm.get('display_name_short')?.value || '').length }}/20
                </span>
              </div>
              <div *ngIf="editForm.get('display_name_short')?.invalid && editForm.get('display_name_short')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Short Name is required.
              </div>
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Home Division *
              </label>
              <select formControlName="home_division_id" class="oi-input">
                <option value="">— Select Division —</option>
                <option *ngFor="let d of activeDivisions" [value]="d.id">{{ d.division_name }}</option>
              </select>
              <div *ngIf="editForm.get('home_division_id')?.invalid && editForm.get('home_division_id')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Home Division is required.
              </div>
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Workstream Lead *
              </label>
              <select formControlName="workstream_lead_user_id" class="oi-input">
                <option value="">— Select Lead —</option>
                <option *ngFor="let u of activeUsers" [value]="u.id">{{ u.display_name }}</option>
              </select>
              <div style="color:#5A5A5A;font-size:11px;font-style:italic;margin-top:2px;">
                Accountable for gate reviews on cycles within this Workstream.
              </div>
              <div *ngIf="editForm.get('workstream_lead_user_id')?.invalid && editForm.get('workstream_lead_user_id')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Workstream Lead is required.
              </div>
            </div>
          </form>
        </div>

        <!-- Create state ─ S-016 -->
        <div *ngIf="panelMode === 'create'" style="position:relative;">
          <app-loading-overlay [visible]="creating" message="Creating…"></app-loading-overlay>

          <div style="position:sticky;top:0;background:#fff;z-index:5;
                      padding:var(--triarq-space-md);
                      border-bottom:1px solid var(--triarq-color-border);
                      display:flex;align-items:center;justify-content:space-between;
                      gap:var(--triarq-space-sm);">
            <h3 style="margin:0;">New Workstream</h3>
            <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
              <button (click)="submitCreate()"
                      [disabled]="createForm.invalid || creating"
                      class="oi-btn-primary"
                      style="font-size:var(--triarq-text-small);">
                Create
              </button>
              <button (click)="cancelCreate()"
                      [disabled]="creating"
                      class="oi-btn-secondary"
                      style="font-size:var(--triarq-text-small);">
                Cancel
              </button>
            </div>
          </div>

          <form [formGroup]="createForm" (ngSubmit)="submitCreate()"
                style="padding:var(--triarq-space-md);display:grid;gap:var(--triarq-space-md);">

            <div *ngIf="createError"
                 style="border-left:3px solid var(--triarq-color-error);
                        background:rgba(198,40,40,0.08);padding:var(--triarq-space-sm);
                        font-size:var(--triarq-text-small);">
              {{ createError }}
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Workstream Name *
              </label>
              <input formControlName="workstream_name"
                     class="oi-input"
                     placeholder="e.g. Clinical Operations Delivery" />
              <div *ngIf="createForm.get('workstream_name')?.invalid && createForm.get('workstream_name')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Workstream Name is required.
              </div>
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Short Name *
              </label>
              <input formControlName="display_name_short"
                     class="oi-input"
                     maxlength="20"
                     placeholder="e.g. ClinOps Delivery" />
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px;">
                <span style="color:#5A5A5A;font-style:italic;">
                  20 characters max. Used in grids and workstream picker.
                </span>
                <span style="color:#5A5A5A;">
                  {{ (createForm.get('display_name_short')?.value || '').length }}/20
                </span>
              </div>
              <div *ngIf="createForm.get('display_name_short')?.invalid && createForm.get('display_name_short')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Short Name is required.
              </div>
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Home Division *
              </label>
              <select formControlName="home_division_id" class="oi-input">
                <option value="">— Select Division —</option>
                <option *ngFor="let d of activeDivisions" [value]="d.id">{{ d.division_name }}</option>
              </select>
              <div *ngIf="createForm.get('home_division_id')?.invalid && createForm.get('home_division_id')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Home Division is required.
              </div>
            </div>

            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Workstream Lead *
              </label>
              <select formControlName="workstream_lead_user_id" class="oi-input">
                <option value="">— Select Lead —</option>
                <option *ngFor="let u of activeUsers" [value]="u.id">{{ u.display_name }}</option>
              </select>
              <div style="color:#5A5A5A;font-size:11px;font-style:italic;margin-top:2px;">
                Accountable for gate reviews on cycles within this Workstream.
              </div>
              <div *ngIf="createForm.get('workstream_lead_user_id')?.invalid && createForm.get('workstream_lead_user_id')?.touched"
                   style="color:var(--triarq-color-error);font-size:11px;margin-top:2px;">
                Workstream Lead is required.
              </div>
            </div>
          </form>
        </div>

      </div>

      <!-- ── Slide-in Filter Panel — S-010 ─────────────────────────────── -->
      <div *ngIf="showFilterPanel"
           (click)="closeFilterPanel()"
           style="position:fixed;inset:0;background:rgba(0,0,0,0.32);z-index:60;"></div>
      <aside *ngIf="showFilterPanel"
             style="position:fixed;top:0;right:0;width:380px;height:100vh;
                    background:#fff;box-shadow:-2px 0 16px rgba(0,0,0,0.16);
                    z-index:70;display:flex;flex-direction:column;">
        <header style="padding:var(--triarq-space-md);border-bottom:1px solid var(--triarq-color-border);
                       display:flex;justify-content:space-between;align-items:center;">
          <h4 style="margin:0;">Filters</h4>
          <button (click)="closeFilterPanel()"
                  aria-label="Close filters"
                  style="background:none;border:none;font-size:20px;line-height:1;cursor:pointer;">✕</button>
        </header>

        <div style="flex:1;overflow-y:auto;padding:var(--triarq-space-md);">

          <!-- Status filter -->
          <div style="margin-bottom:var(--triarq-space-lg);">
            <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:6px;">Status</div>
            <label style="display:block;padding:4px 0;font-size:var(--triarq-text-small);">
              <input type="radio" name="statusFilter"
                     [value]="'active'"
                     [(ngModel)]="statusFilter"
                     (ngModelChange)="onStatusFilterChange()" />
              Active
            </label>
            <label style="display:block;padding:4px 0;font-size:var(--triarq-text-small);">
              <input type="radio" name="statusFilter"
                     [value]="'inactive'"
                     [(ngModel)]="statusFilter"
                     (ngModelChange)="onStatusFilterChange()" />
              Inactive
            </label>
            <label style="display:block;padding:4px 0;font-size:var(--triarq-text-small);">
              <input type="radio" name="statusFilter"
                     [value]="'all'"
                     [(ngModel)]="statusFilter"
                     (ngModelChange)="onStatusFilterChange()" />
              All
            </label>
          </div>

          <!-- Home Division filter -->
          <div>
            <div style="font-size:var(--triarq-text-small);font-weight:500;margin-bottom:6px;">Home Division</div>
            <label style="display:block;padding:4px 0;font-size:var(--triarq-text-small);">
              <input type="radio" name="homeDivisionFilter"
                     [value]="''"
                     [(ngModel)]="homeDivisionFilter"
                     (ngModelChange)="onDivisionFilterChange()" />
              All Divisions
            </label>
            <label *ngFor="let d of divisions"
                   style="display:block;padding:4px 0;font-size:var(--triarq-text-small);">
              <input type="radio" name="homeDivisionFilter"
                     [value]="d.id"
                     [(ngModel)]="homeDivisionFilter"
                     (ngModelChange)="onDivisionFilterChange()" />
              {{ d.division_name }}
            </label>
          </div>
        </div>
      </aside>
    </div>
  `
})
export class WorkstreamAdminComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────
  workstreams: DeliveryWorkstream[] = [];
  divisions:   Division[]           = [];
  users:       User[]               = [];

  loading      = false;
  loadError    = '';

  // Filter / sort
  statusFilter:        StatusFilter = 'active';
  homeDivisionFilter:  string       = '';
  sortField:           WsSortField  = 'workstream_name';
  sortDir:             SortDir      = 'asc';
  showFilterPanel:     boolean      = false;

  // Panel state
  panelMode:    PanelMode = 'none';
  selectedWs:   DeliveryWorkstream | null = null;
  editForm!:    FormGroup;
  createForm!:  FormGroup;
  saving        = false;
  creating      = false;
  saveError     = '';
  createError   = '';
  togglingId:        string | null = null;
  toggleError        = '';
  toggleErrorWsId:   string | null = null;
  confirmDeactivateWsId: string | null = null;

  // Edit snapshot for dirty detection
  private editSnapshot: Record<string, string> = {};

  readonly skeletonRows = [1, 2, 3, 4, 5];

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly mcp:         McpService,
    private readonly router:      Router,
    private readonly screenState: ScreenStateService,
    private readonly fb:          FormBuilder,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      workstream_name:         ['', Validators.required],
      display_name_short:      ['', [Validators.required, Validators.maxLength(20)]],
      home_division_id:        ['', Validators.required],
      workstream_lead_user_id: ['', Validators.required]
    });
    this.createForm = this.fb.group({
      workstream_name:         ['', Validators.required],
      display_name_short:      ['', [Validators.required, Validators.maxLength(20)]],
      home_division_id:        ['', Validators.required],
      workstream_lead_user_id: ['', Validators.required]
    });
    this.restoreScreenState();
    this.loadDivisions();
    this.loadUsers();
    this.loadWorkstreams();
  }

  // ── Screen state (D-380 / D-171) ───────────────────────────────────────
  private async restoreScreenState(): Promise<void> {
    const saved = await this.screenState.restore(SCREEN_KEYS.ADMIN_WORKSTREAMS);
    if (!saved) { return; }
    const filter = saved.filter_state ?? {};
    const sort   = saved.sort_state   ?? {};
    if (filter['statusFilter'] === 'active' || filter['statusFilter'] === 'inactive' || filter['statusFilter'] === 'all') {
      this.statusFilter = filter['statusFilter'];
    }
    if (typeof filter['homeDivisionFilter'] === 'string') {
      this.homeDivisionFilter = filter['homeDivisionFilter'];
    }
    if (typeof sort['sortField'] === 'string') {
      this.sortField = sort['sortField'] as WsSortField;
    }
    if (sort['sortDir'] === 'asc' || sort['sortDir'] === 'desc') {
      this.sortDir = sort['sortDir'];
    }
    this.cdr.markForCheck();
  }

  private saveScreenState(): void {
    this.screenState.save(
      SCREEN_KEYS.ADMIN_WORKSTREAMS,
      {
        statusFilter:        this.statusFilter,
        homeDivisionFilter:  this.homeDivisionFilter
      },
      {
        sortField: this.sortField,
        sortDir:   this.sortDir
      }
    );
  }

  // ── Data loaders ──────────────────────────────────────────────────────
  private loadDivisions(): void {
    this.mcp.call<Division[]>('division', 'list_divisions', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisions = Array.isArray(res.data) ? res.data : [];
          this.cdr.markForCheck();
        }
      },
      error: () => { /* non-fatal */ }
    });
  }

  private loadUsers(): void {
    this.mcp.call<User[]>('division', 'list_users', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.users = Array.isArray(res.data) ? res.data : [];
        }
        this.cdr.markForCheck();
      },
      error: () => { /* non-fatal */ }
    });
  }

  private loadWorkstreams(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();
    // include_inactive: true so Inactive/All filters can show inactive rows
    this.delivery.listWorkstreams({ include_inactive: true }).subscribe({
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

  // ── Filter / sort plumbing ────────────────────────────────────────────
  get activeFilterCount(): number {
    let n = 0;
    if (this.statusFilter !== 'active') { n++; }
    if (this.homeDivisionFilter)        { n++; }
    return n;
  }
  get anyFiltersActive(): boolean { return this.activeFilterCount > 0; }

  get activeCount(): number   { return this.workstreams.filter(w => w.active_status).length; }
  get inactiveCount(): number { return this.workstreams.filter(w => !w.active_status).length; }

  get activeDivisions(): Division[] {
    // Divisions returned from list_divisions are already non-deleted; no
    // additional active flag exists on Division. Surface all returned rows.
    return this.divisions;
  }
  get activeUsers(): User[] {
    return this.users.filter(u => u.is_active);
  }

  get filteredSortedWorkstreams(): DeliveryWorkstream[] {
    let rows = [...this.workstreams];
    if (this.statusFilter === 'active')   { rows = rows.filter(w => w.active_status); }
    if (this.statusFilter === 'inactive') { rows = rows.filter(w => !w.active_status); }
    if (this.homeDivisionFilter)          { rows = rows.filter(w => w.home_division_id === this.homeDivisionFilter); }

    rows.sort((a, b) => {
      const av = this.sortValue(a, this.sortField);
      const bv = this.sortValue(b, this.sortField);
      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }

  private sortValue(w: DeliveryWorkstream, field: WsSortField): string | number {
    switch (field) {
      case 'workstream_name':    return w.workstream_name ?? '';
      case 'display_name_short': return w.display_name_short ?? '';
      case 'home_division_name': return w.home_division_name ?? this.divisionName(w.home_division_id);
      case 'lead_display_name':  return w.lead_display_name  ?? this.leadName(w.workstream_lead_user_id);
      case 'active_cycle_count': return w.active_cycle_count ?? 0;
      case 'active_status':      return w.active_status ? 'Active' : 'Inactive';
    }
  }

  toggleSort(field: WsSortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir   = 'asc';
    }
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  sortGlyph(field: WsSortField): string {
    if (this.sortField !== field) { return ''; }
    return this.sortDir === 'asc' ? '▲' : '▼';
  }

  openFilterPanel(): void  { this.showFilterPanel = true;  this.cdr.markForCheck(); }
  closeFilterPanel(): void { this.showFilterPanel = false; this.cdr.markForCheck(); }

  onStatusFilterChange(): void   { this.saveScreenState(); this.cdr.markForCheck(); }
  onDivisionFilterChange(): void { this.saveScreenState(); this.cdr.markForCheck(); }

  clearStatusFilter(): void   { this.statusFilter = 'active';     this.saveScreenState(); this.cdr.markForCheck(); }
  clearDivisionFilter(): void { this.homeDivisionFilter = '';     this.saveScreenState(); this.cdr.markForCheck(); }
  clearAllFilters(): void {
    this.statusFilter       = 'active';
    this.homeDivisionFilter = '';
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  // ── Panel transitions ──────────────────────────────────────────────────
  openViewPanel(w: DeliveryWorkstream): void {
    this.selectedWs           = w;
    this.panelMode            = 'view';
    this.toggleError          = '';
    this.toggleErrorWsId      = null;
    this.confirmDeactivateWsId = null;
    this.cdr.markForCheck();
  }

  openEditPanel(): void {
    if (!this.selectedWs) { return; }
    const w = this.selectedWs;
    this.editForm.reset({
      workstream_name:         w.workstream_name ?? '',
      display_name_short:      w.display_name_short ?? '',
      home_division_id:        w.home_division_id ?? '',
      workstream_lead_user_id: w.workstream_lead_user_id ?? ''
    });
    this.editSnapshot = { ...this.editForm.value };
    this.saveError = '';
    this.panelMode = 'edit';
    this.cdr.markForCheck();
  }

  openCreatePanel(): void {
    this.createForm.reset({
      workstream_name:         '',
      display_name_short:      '',
      home_division_id:        '',
      workstream_lead_user_id: ''
    });
    this.createError = '';
    this.selectedWs  = null;
    this.panelMode   = 'create';
    this.cdr.markForCheck();
  }

  closePanel(): void {
    this.panelMode  = 'none';
    this.selectedWs = null;
    this.confirmDeactivateWsId = null;
    this.cdr.markForCheck();
  }

  // S-019 / S-017 Dirty-state check on scrim/ESC/Cancel.
  isEditDirty(): boolean {
    const cur = this.editForm.value;
    return JSON.stringify(cur) !== JSON.stringify(this.editSnapshot);
  }

  onScrimClick(): void {
    if (this.panelMode === 'edit') {
      this.cancelEdit();
    } else if (this.panelMode === 'create') {
      this.cancelCreate();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.panelMode === 'edit')   { this.cancelEdit();   return; }
    if (this.panelMode === 'create') { this.cancelCreate(); return; }
    if (this.panelMode === 'view')   { this.closePanel();   return; }
    if (this.showFilterPanel)        { this.closeFilterPanel(); }
  }

  cancelEdit(): void {
    if (this.saving) { return; }
    if (this.isEditDirty()) {
      const ok = confirm('Discard unsaved changes?');
      if (!ok) { return; }
    }
    this.panelMode = 'view';
    this.saveError = '';
    this.cdr.markForCheck();
  }

  cancelCreate(): void {
    if (this.creating) { return; }
    const dirty = Object.values(this.createForm.value).some(v => v !== '' && v != null);
    if (dirty) {
      const ok = confirm('Discard unsaved changes?');
      if (!ok) { return; }
    }
    this.panelMode = 'none';
    this.createError = '';
    this.cdr.markForCheck();
  }

  // ── MCP writes ─────────────────────────────────────────────────────────
  saveEdit(): void {
    if (this.editForm.invalid || !this.selectedWs) { return; }
    this.saving    = true;
    this.saveError = '';
    this.cdr.markForCheck();

    const v = this.editForm.value;
    this.delivery.updateWorkstream({
      workstream_id:            this.selectedWs.workstream_id,
      workstream_name:          v.workstream_name as string,
      display_name_short:       (v.display_name_short as string) || null,
      home_division_id:         v.home_division_id as string,
      workstream_lead_user_id:  v.workstream_lead_user_id as string
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedWs = res.data;
          this.panelMode  = 'view';
          this.loadWorkstreams(); // S-008 parent refresh
        } else {
          this.saveError = res.error ?? 'Save failed.';
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.saveError = err?.error ?? 'Save failed. Check your connection and try again.';
        this.saving    = false;
        this.cdr.markForCheck();
      }
    });
  }

  submitCreate(): void {
    if (this.createForm.invalid) { return; }
    this.creating    = true;
    this.createError = '';
    this.cdr.markForCheck();

    const v = this.createForm.value;
    this.delivery.createWorkstream({
      workstream_name:         v.workstream_name as string,
      display_name_short:      (v.display_name_short as string) || undefined,
      home_division_id:        v.home_division_id as string,
      workstream_lead_user_id: v.workstream_lead_user_id as string
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.panelMode = 'none';
          this.loadWorkstreams(); // S-008
        } else {
          this.createError = res.error ?? 'Create failed.';
        }
        this.creating = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.createError = err?.error ?? 'Create failed. Check permissions and try again.';
        this.creating    = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Activate / Deactivate (D-183) ──────────────────────────────────────
  startDeactivateConfirm(w: DeliveryWorkstream): void {
    this.confirmDeactivateWsId = w.workstream_id;
    this.toggleError           = '';
    this.toggleErrorWsId       = null;
    this.cdr.markForCheck();
  }
  cancelDeactivate(): void {
    this.confirmDeactivateWsId = null;
    this.cdr.markForCheck();
  }
  confirmDeactivate(w: DeliveryWorkstream): void {
    this.setActiveStatus(w, false);
  }
  activateWorkstream(w: DeliveryWorkstream): void {
    this.setActiveStatus(w, true);
  }

  private setActiveStatus(w: DeliveryWorkstream, active: boolean): void {
    this.togglingId      = w.workstream_id;
    this.toggleError     = '';
    this.toggleErrorWsId = null;
    this.cdr.markForCheck();

    this.delivery.updateWorkstream({
      workstream_id: w.workstream_id,
      active_status: active
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedWs = res.data;
          this.confirmDeactivateWsId = null;
          this.loadWorkstreams(); // S-008
        } else {
          this.toggleError     = res.error ?? 'Status change failed.';
          this.toggleErrorWsId = w.workstream_id;
        }
        this.togglingId = null;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.toggleError     = err?.error ?? 'Status change failed. Check permissions and try again.';
        this.toggleErrorWsId = w.workstream_id;
        this.togglingId      = null;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  divisionName(divisionId: string): string {
    return this.divisions.find(d => d.id === divisionId)?.division_name ?? divisionId;
  }
  leadName(userId: string): string {
    return this.users.find(u => u.id === userId)?.display_name ?? userId;
  }
  wsInitials(name: string): string {
    if (!name) { return '?'; }
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  /** "View Initiatives →" link. Pre-set workstream filter on dashboard.
   *  D-171: pre-set shortcuts from drill-in do not write to filter memory. */
  goToCyclesForWorkstream(workstreamId: string): void {
    this.router.navigate(['/initiatives/list'], { queryParams: { workstream_id: workstreamId } });
  }
}
