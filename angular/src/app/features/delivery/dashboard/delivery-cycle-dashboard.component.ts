// delivery-cycle-dashboard.component.ts — DeliveryCycleDashboardComponent
// Route: /delivery/cycles  (moved from /delivery — D-172)
// Spec: build-c-spec Section 5.2
//
// 5-column grid (Contract 1, 2026-04-10): Tier dot | Division | Cycle Name | Outcome | Stage | Team
// Row tap opens right panel (S-005/S-006) — no full-page navigation.
// Filters: stage, tier, workstream, gate status, assigned person, division.
// Create button for DS, Phil, Admin, and CB roles.
//
// D-93: DeliveryService only — no Supabase.
// D-140: Blocked action UX.
// Rule 2: Presentation only.
// Session 2026-03-24-B: blank date cells when date not set — no placeholder text.
// Session 2026-03-24-C: headline 6-rule priority logic.
// Design Principle 4.2: every screen states What/Why/How for empty states.
// D-178: Three-tier loading standard applied — Tier 1 skeleton, Tier 2 button spinner, Tier 3 overlay.
// CC-Decision-2026-04-10-A: Division chip uses division_name from MCP response. display_name_short gap
//   to be resolved when ARCH-29 propagation reaches list query.
// CC-Decision-2026-04-10-B: filterGateStatus 'overdue' value confirmed present — no addition needed.
// CC-Decision-2026-04-10-C: Team cell lift-up per Phil direction — CB / Workstream / DS; if all null
//   render single muted "Unassigned" label.
// CC-Decision-2026-04-11-A: Freeze fix — three root causes identified and fixed:
//   (1) buildGateStateMap() was called in *ngFor template, creating new object references every CD cycle.
//       With OnPush on StageTrackComponent, each new reference forced re-render of all 20+ track rows.
//       Fix: memoize into gateStateMapsCache (Map<cycleId, GateStateMap>), populated once per applyFilters().
//   (2) assignedPersonOptions getter returned new array every CD cycle, rebuilding filter DOM on every tick.
//       Fix: converted to readonly class field.
//   (3) toggleFilterPanel() did not call cdr.markForCheck(), so filter panel state change was not visible
//       until the next unrelated CD cycle triggered a repaint.
//       Fix: added markForCheck() call. Source: Contract 3 Block 1.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { firstValueFrom, filter, take } from 'rxjs';
import { CommonModule }                   from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { IonicModule }          from '@ionic/angular';
import { FormsModule }          from '@angular/forms';
import { DeliveryService }      from '../../../core/services/delivery.service';
import { McpService }           from '../../../core/services/mcp.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import { StageTrackComponent }  from '../stage-track/stage-track.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { WorkstreamPickerComponent } from '../../../shared/pickers/workstream-picker/workstream-picker.component';
import { DeliveryCycleDetailComponent } from '../detail/delivery-cycle-detail.component';
import {
  DeliveryCycle,
  Division,
  DeliveryWorkstream,
  DeliverySummary,
  TierClassification,
  LifecycleStage,
  GateName,
  GateStateMap
} from '../../../core/types/database';
import { ScreenStateService, SCREEN_KEYS } from '../../../core/services/screen-state.service';

const GATE_LABELS: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

// D-173: next gate derived from lifecycle stage (mirrors lifecycle.js NEXT_GATE_BY_STAGE)
const NEXT_GATE_BY_STAGE: Partial<Record<LifecycleStage, GateName>> = {
  BRIEF:    'brief_review',
  DESIGN:   'go_to_build',
  SPEC:     'go_to_build',
  BUILD:    'go_to_deploy',
  VALIDATE: 'go_to_deploy',
  PILOT:    'go_to_release',
  UAT:      'go_to_release',
  RELEASE:  'close_review',
  OUTCOME:  'close_review'
  // COMPLETE, CANCELLED, ON_HOLD → no next gate (omitted = null)
};

const STAGE_LABEL_MAP: Partial<Record<LifecycleStage, string>> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build',
  VALIDATE: 'Validate', PILOT: 'Pilot', UAT: 'UAT', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

/** Stages in lifecycle order — used for overdue detection */
const POST_DEPLOY_STAGES: LifecycleStage[] = ['PILOT', 'UAT', 'RELEASE', 'OUTCOME'];

@Component({
  selector: 'app-delivery-cycle-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, StageTrackComponent, LoadingOverlayComponent, WorkstreamPickerComponent, DeliveryCycleDetailComponent],
  template: `
    <!-- S-006: flex container — grid left, detail panel right when cycle selected -->
    <div style="display:flex;align-items:flex-start;min-height:100%;">

    <!-- ── Left: grid content ─────────────────────────────────────────────── -->
    <div style="flex:1;min-width:0;max-width:1200px;padding:var(--triarq-space-2xl) var(--triarq-space-md);">

      <!-- ── Back link (D-172) ───────────────────────────────────────────── -->
      <div style="margin-bottom:var(--triarq-space-sm);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);
                  color:var(--triarq-color-primary);text-decoration:none;">
          ← Delivery Cycle Tracking
        </a>
      </div>

      <!-- ── Page header ──────────────────────────────────────────────────── -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;
                  margin-bottom:var(--triarq-space-md);gap:var(--triarq-space-md);">
        <div>
          <h3 style="margin:0 0 4px 0;">Delivery Cycles</h3>
          <p style="margin:0;font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);max-width:600px;">
            Each row is one active Delivery Cycle — a scoped unit of work moving through
            the 12-stage lifecycle. Click a row to open the full cycle record, set milestone
            dates, review gate decisions, and attach artifacts.
          </p>
        </div>
        <button *ngIf="canCreateCycle"
                class="oi-btn-primary"
                (click)="toggleCreateForm()"
                style="font-size:var(--triarq-text-small);white-space:nowrap;flex-shrink:0;">
          + New Cycle
        </button>
      </div>

      <!-- ── Create form (D-178 Tier 3: section overlay) ────────────────── -->
      <!-- D-194: Field order: Division → Title → Outcome → Workstream → Tier → DS → CB → Jira → Gate dates -->
      <!-- D-189: Right panel header: Deep Navy, white text, × close button (Section 3.5) -->
      <div *ngIf="showCreateForm" style="position:relative;">
        <app-loading-overlay [visible]="creating" message="Creating Cycle…"></app-loading-overlay>
        <div class="oi-card"
             style="margin-bottom:var(--triarq-space-md);padding:0;overflow:hidden;">

          <!-- Panel header — Deep Navy per Section 3.5 -->
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:var(--triarq-space-sm) var(--triarq-space-md);
                      background:var(--triarq-color-navy,#1a3a4f);color:#fff;">
            <span style="font-weight:600;font-size:var(--triarq-text-body);">New Delivery Cycle</span>
            <button type="button"
                    (click)="toggleCreateForm()"
                    style="background:none;border:none;cursor:pointer;color:#fff;
                           font-size:18px;line-height:1;padding:0 4px;"
                    title="Close">×</button>
          </div>

          <div style="padding:var(--triarq-space-md);">

          <form [formGroup]="createForm" (ngSubmit)="submitCreate()">

            <!-- Row 1: Division + Cycle Title -->
            <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:1fr 2fr;
                        margin-bottom:var(--triarq-space-sm);">
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Owner Division *
                </label>
                <select formControlName="division_id" class="oi-input"
                        (change)="onCreateDivisionChange()">
                  <option value="">— Select Division —</option>
                  <option *ngFor="let d of divisions" [value]="d.id">{{ d.division_name }}</option>
                </select>
                <div *ngIf="createForm.get('division_id')?.invalid && createForm.get('division_id')?.touched"
                     style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                  Division is required.
                </div>
              </div>
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Cycle Title *
                </label>
                <input formControlName="cycle_title" class="oi-input"
                       placeholder="e.g. Member Attribution Model — Q2 Build" />
                <div *ngIf="createForm.get('cycle_title')?.invalid && createForm.get('cycle_title')?.touched"
                     style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                  Cycle title is required.
                </div>
              </div>
            </div>

            <!-- Row 2: Outcome Statement (D-194: moved to position 3 — the "why" belongs adjacent to title) -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Outcome Statement
              </label>
              <textarea formControlName="outcome_statement"
                        class="oi-input"
                        rows="2"
                        style="resize:vertical;"
                        placeholder="What measurable result will this cycle deliver?">
              </textarea>
              <!-- D-190 Pattern 1: Field Guidance — gray sub-text, no banner -->
              <div style="font-size:12px;color:var(--triarq-color-stone,#8a9ba8);margin-top:3px;">
                Recommended. Required before Brief Review Gate. You can add it now or after creation.
              </div>
            </div>

            <!-- Row 3: Delivery Workstream picker (D-194 position 4) -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Delivery Workstream
              </label>
              <div style="display:flex;align-items:center;gap:var(--triarq-space-sm);">
                <button type="button" class="oi-input"
                        style="text-align:left;cursor:pointer;background:#fff;flex:1;"
                        (click)="openWorkstreamPicker()">
                  <span *ngIf="!createSelectedWorkstream"
                        style="color:var(--triarq-color-text-secondary);">
                    — Assign later —
                  </span>
                  <span *ngIf="createSelectedWorkstream">
                    {{ createSelectedWorkstream.workstream_name }}
                    <span style="font-size:10px;color:var(--triarq-color-text-secondary);margin-left:4px;">
                      ({{ createSelectedWorkstream.home_division_name ?? '' }})
                    </span>
                  </span>
                </button>
                <button *ngIf="createSelectedWorkstream" type="button"
                        (click)="clearCreateWorkstream()"
                        style="background:none;border:none;cursor:pointer;
                               color:var(--triarq-color-text-secondary);font-size:12px;"
                        title="Remove Workstream">✕</button>
              </div>
              <!-- D-190 Pattern 1 -->
              <div style="font-size:12px;color:var(--triarq-color-stone,#8a9ba8);margin-top:3px;">
                Recommended. Required before Brief Review Gate.
              </div>
            </div>

            <!-- Row 4: Tier Classification — dropdown with descriptions (D-191) -->
            <div style="margin-bottom:var(--triarq-space-sm);max-width:480px;">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Tier Classification *
              </label>
              <select formControlName="tier_classification" class="oi-input">
                <option value="">Select tier classification</option>
                <option value="tier_1">Tier 1 — Fast Lane: Workflow changes, config updates, no platform dependencies</option>
                <option value="tier_2">Tier 2 — Structured: Platform changes, integrations, cross-domain dependencies</option>
                <option value="tier_3">Tier 3 — Governed: Agent deployments, compliance scope changes, AI Governance Board required</option>
              </select>
              <div *ngIf="createForm.get('tier_classification')?.invalid && createForm.get('tier_classification')?.touched"
                   style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                Tier Classification is required.
              </div>
            </div>

            <!-- Row 5: Assigned Domain Strategist (D-194 position 6) -->
            <div style="margin-bottom:var(--triarq-space-sm);max-width:400px;">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Assigned Domain Strategist
              </label>
              <div *ngIf="autoAssignedDsDisplayName"
                   style="font-size:var(--triarq-text-small);padding:6px var(--triarq-space-sm);
                          background:var(--triarq-color-background-subtle);border-radius:5px;
                          border:1px solid var(--triarq-color-border);">
                {{ autoAssignedDsDisplayName }}
                <span style="font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);margin-left:6px;">
                  (pre-assigned — you)
                </span>
              </div>
              <div *ngIf="!autoAssignedDsDisplayName"
                   style="font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);
                          padding:6px 0;border:1px solid var(--triarq-color-border);
                          border-radius:5px;padding:6px var(--triarq-space-sm);
                          background:var(--triarq-color-background-subtle);">
                Assign after creation
              </div>
              <!-- D-190 Pattern 1 -->
              <div style="font-size:12px;color:var(--triarq-color-stone,#8a9ba8);margin-top:3px;">
                Required before Brief Review Gate.
              </div>
            </div>

            <!-- Row 6: Assigned Capability Builder (D-194 position 7) -->
            <div style="margin-bottom:var(--triarq-space-sm);max-width:400px;">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Assigned Capability Builder
              </label>
              <div *ngIf="autoAssignedCbDisplayName"
                   style="font-size:var(--triarq-text-small);padding:6px var(--triarq-space-sm);
                          background:var(--triarq-color-background-subtle);border-radius:5px;
                          border:1px solid var(--triarq-color-border);">
                {{ autoAssignedCbDisplayName }}
                <span style="font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);margin-left:6px;">
                  (pre-assigned — you)
                </span>
              </div>
              <div *ngIf="!autoAssignedCbDisplayName"
                   style="font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);
                          border:1px solid var(--triarq-color-border);
                          border-radius:5px;padding:6px var(--triarq-space-sm);
                          background:var(--triarq-color-background-subtle);">
                Assign after creation
              </div>
              <!-- D-190 Pattern 1 -->
              <div style="font-size:12px;color:var(--triarq-color-stone,#8a9ba8);margin-top:3px;">
                Required before Go to Build Gate.
              </div>
            </div>

            <!-- Row 7: Jira Epic Key (D-194 position 8) -->
            <div style="margin-bottom:var(--triarq-space-sm);max-width:300px;">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Jira Epic Link
              </label>
              <input formControlName="jira_epic_key" class="oi-input"
                     placeholder="e.g. PROJ-123" />
              <!-- D-190 Pattern 1 -->
              <div style="font-size:12px;color:var(--triarq-color-stone,#8a9ba8);margin-top:3px;">
                Required before Go to Build Gate.
              </div>
            </div>

            <!-- Row 8: Gate target dates -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <div style="font-size:var(--triarq-text-small);font-weight:500;
                          margin-bottom:var(--triarq-space-xs);">
                Target Dates
                <span style="font-weight:400;color:var(--triarq-color-text-secondary);"> — all optional at creation</span>
              </div>
              <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:repeat(5,1fr);">
                <div>
                  <label style="display:block;font-size:var(--triarq-text-caption);
                                margin-bottom:3px;color:var(--triarq-color-text-secondary);">
                    Brief Review
                  </label>
                  <input type="date" formControlName="milestone_brief_review" class="oi-input"
                         style="font-size:var(--triarq-text-small);" />
                </div>
                <div>
                  <label style="display:block;font-size:var(--triarq-text-caption);
                                margin-bottom:3px;color:var(--triarq-color-text-secondary);">
                    Go to Build
                  </label>
                  <input type="date" formControlName="milestone_go_to_build" class="oi-input"
                         style="font-size:var(--triarq-text-small);" />
                </div>
                <div>
                  <label style="display:block;font-size:var(--triarq-text-caption);
                                margin-bottom:3px;color:var(--triarq-color-text-secondary);">
                    Pilot Start (Go to Deploy)
                  </label>
                  <input type="date" formControlName="milestone_go_to_deploy" class="oi-input"
                         style="font-size:var(--triarq-text-small);" />
                </div>
                <div>
                  <label style="display:block;font-size:var(--triarq-text-caption);
                                margin-bottom:3px;color:var(--triarq-color-text-secondary);">
                    Production Release (Go to Release)
                  </label>
                  <input type="date" formControlName="milestone_go_to_release" class="oi-input"
                         style="font-size:var(--triarq-text-small);" />
                </div>
                <div>
                  <label style="display:block;font-size:var(--triarq-text-caption);
                                margin-bottom:3px;color:var(--triarq-color-text-secondary);">
                    Close Review
                  </label>
                  <input type="date" formControlName="milestone_close_review" class="oi-input"
                         style="font-size:var(--triarq-text-small);" />
                </div>
              </div>
            </div>

            <!-- Submit row -->
            <div style="display:flex;gap:var(--triarq-space-sm);align-items:center;
                        margin-top:var(--triarq-space-sm);">
              <!-- D-178 Tier 2: button spinner while creating -->
              <button type="submit" class="oi-btn-primary"
                      [disabled]="createForm.invalid || creating">
                <ion-spinner *ngIf="creating" name="crescent"
                             style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">
                </ion-spinner>
                {{ creating ? 'Creating…' : 'Create Delivery Cycle' }}
              </button>
              <div *ngIf="createError"
                   style="font-size:var(--triarq-text-small);">
                <span style="color:var(--triarq-color-error);font-weight:500;">{{ createError }}</span>
                <span style="color:var(--triarq-color-text-secondary);margin-left:6px;">
                  Check that the Division is valid and you have the required role.
                </span>
              </div>
            </div>
          </form>
          </div><!-- /padding wrapper -->
        </div>
      </div>

      <!-- ── Workstream Picker modal ─────────────────────────────────────── -->
      <app-workstream-picker
        *ngIf="showWorkstreamPicker"
        [cycleDivisionId]="createForm.get('division_id')?.value || null"
        [isTrustLevelDivision]="createDivisionIsTrustLevel"
        [currentWorkstreamId]="createSelectedWorkstream?.workstream_id ?? null"
        (workstreamSelected)="onWorkstreamSelected($event)">
      </app-workstream-picker>

      <!-- ── Summary Cards — Three compact count cards (D-HubCounts-2026-04-06) ─────── -->
      <!-- Active Cycles: always shown, NOT tappable. My Cycles + Overdue Gates: tappable, -->
      <!-- set filter, do NOT write to filter memory. Hidden when count is zero.            -->
      <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;align-items:flex-start;">

        <!-- Card 1: Active Cycles — always shown, not tappable -->
        <div style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);
                    padding:12px;min-width:110px;flex:0 0 auto;">
          <div style="font-size:28px;font-weight:700;color:var(--triarq-color-primary);line-height:1.1;">
            {{ activeCycleCount }}
          </div>
          <div style="font-size:13px;color:#5A5A5A;">Active Cycles</div>
        </div>

        <!-- Card 2: My Cycles — hidden at zero, tappable -> Assigned Person filter -->
        <div *ngIf="myCyclesCount > 0"
             (click)="onMyCyclesTap()"
             style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);
                    padding:12px;min-width:110px;flex:0 0 auto;cursor:pointer;"
             (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 8px rgba(37,112,153,0.2)'"
             (mouseleave)="$any($event.currentTarget).style.boxShadow='0 1px 3px rgba(0,0,0,0.08)'">
          <div style="font-size:28px;font-weight:700;color:var(--triarq-color-primary);line-height:1.1;">
            {{ myCyclesCount }}
          </div>
          <div style="font-size:13px;color:#5A5A5A;">My Cycles</div>
        </div>

        <!-- Card 3: Overdue Gates — hidden at zero, tappable -> Gate Status filter -->
        <div *ngIf="overdueGateCount > 0"
             (click)="onOverdueGatesTap()"
             style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);
                    padding:12px;min-width:110px;flex:0 0 auto;cursor:pointer;"
             (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 8px rgba(233,97,39,0.2)'"
             (mouseleave)="$any($event.currentTarget).style.boxShadow='0 1px 3px rgba(0,0,0,0.08)'">
          <div style="font-size:28px;font-weight:700;color:var(--triarq-color-sunray,#F2A620);line-height:1.1;">
            {{ overdueGateCount }}
          </div>
          <div style="font-size:13px;color:#5A5A5A;">Overdue Gates</div>
        </div>

      </div>

      <!-- ── Item 5: Drill-down filter visual confirmation — Principle 3 ──── -->
      <!-- When landing from a drill-down (query params set), show the applied filter clearly. -->
      <!-- User can see what filter landed them here and remove it. -->
      <div *ngIf="drillDownActive"
           style="display:flex;align-items:center;gap:var(--triarq-space-sm);flex-wrap:wrap;
                  margin-bottom:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  background:#e3f2fd;border-radius:6px;font-size:var(--triarq-text-small);">
        <span style="color:var(--triarq-color-primary);font-weight:500;">Filtered view:</span>
        <span *ngIf="drillDownWorkstreamLabel"
              style="display:inline-flex;align-items:center;gap:4px;
                     padding:2px 8px;border-radius:999px;
                     background:rgba(37,112,153,0.12);color:var(--triarq-color-primary);">
          Workstream: {{ drillDownWorkstreamLabel }}
          <button (click)="clearDrillDownWorkstream()"
                  style="background:none;border:none;cursor:pointer;
                         font-size:12px;color:var(--triarq-color-primary);
                         padding:0;line-height:1;">✕</button>
        </span>
        <span *ngIf="drillDownGateLabel"
              style="display:inline-flex;align-items:center;gap:4px;
                     padding:2px 8px;border-radius:999px;
                     background:rgba(37,112,153,0.12);color:var(--triarq-color-primary);">
          Gate: {{ drillDownGateLabel }}
          <button (click)="clearDrillDownGate()"
                  style="background:none;border:none;cursor:pointer;
                         font-size:12px;color:var(--triarq-color-primary);
                         padding:0;line-height:1;">✕</button>
        </span>
        <span *ngIf="drillDownDivisionLabel"
              style="display:inline-flex;align-items:center;gap:4px;
                     padding:2px 8px;border-radius:999px;
                     background:rgba(37,112,153,0.12);color:var(--triarq-color-primary);">
          Division: {{ drillDownDivisionLabel }}
          <button (click)="clearDrillDownDivision()"
                  style="background:none;border:none;cursor:pointer;
                         font-size:12px;color:var(--triarq-color-primary);
                         padding:0;line-height:1;">✕</button>
        </span>
        <button (click)="clearDrillDown()"
                style="margin-left:auto;font-size:var(--triarq-text-small);
                       background:none;border:none;cursor:pointer;
                       color:var(--triarq-color-text-secondary);text-decoration:underline;">
          Remove all filters
        </button>
      </div>

      <!-- ── Filters button + active chips (D-HubFilter-2026-04-06) ─────────── -->
      <!-- Inline dropdowns removed. Filters button opens slide-in panel with 6 filters.  -->
      <!-- Active filter chips render below button when any filter is set.                -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <!-- Filters button with active count badge -->
        <button (click)="toggleFilterPanel()"
                style="position:relative;background:var(--triarq-color-primary,#257099);color:#fff;
                       font-size:14px;font-family:Roboto,sans-serif;font-weight:500;
                       border:none;border-radius:5px;padding:10px 20px;cursor:pointer;">
          Filters
          <span *ngIf="activeFilterCount > 0"
                style="position:absolute;top:-7px;right:-7px;
                       background:#E96127;color:#fff;font-size:11px;font-weight:700;
                       border-radius:999px;padding:1px 6px;min-width:18px;text-align:center;line-height:16px;">
            {{ activeFilterCount }}
          </span>
        </button>
        <!-- Active filter chips -->
        <span *ngIf="filterStage"
              style="display:inline-flex;align-items:center;gap:4px;background:#fff;
                     border:1.5px solid var(--triarq-color-primary,#257099);
                     color:var(--triarq-color-primary,#257099);border-radius:999px;
                     padding:4px 12px;font-size:13px;">
          {{ stageLabelFor(filterStage) }}
          <button (click)="filterStage='';applyFilters()" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:16px;line-height:1;">x</button>
        </span>
        <span *ngIf="filterTier"
              style="display:inline-flex;align-items:center;gap:4px;background:#fff;
                     border:1.5px solid var(--triarq-color-primary,#257099);
                     color:var(--triarq-color-primary,#257099);border-radius:999px;
                     padding:4px 12px;font-size:13px;">
          Tier {{ tierLabel($any(filterTier)) }}
          <button (click)="filterTier='';applyFilters()" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:16px;line-height:1;">x</button>
        </span>
        <span *ngIf="filterWorkstream"
              style="display:inline-flex;align-items:center;gap:4px;background:#fff;
                     border:1.5px solid var(--triarq-color-primary,#257099);
                     color:var(--triarq-color-primary,#257099);border-radius:999px;
                     padding:4px 12px;font-size:13px;">
          {{ filterWorkstream === '__none__' ? 'No Workstream' : workstreamName(filterWorkstream) }}
          <button (click)="filterWorkstream='';applyFilters()" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:16px;line-height:1;">x</button>
        </span>
        <span *ngIf="filterGateStatus"
              style="display:inline-flex;align-items:center;gap:4px;background:#fff;
                     border:1.5px solid var(--triarq-color-primary,#257099);
                     color:var(--triarq-color-primary,#257099);border-radius:999px;
                     padding:4px 12px;font-size:13px;">
          Gates: {{ filterGateStatus === 'overdue' ? 'Overdue' : filterGateStatus === 'pending' ? 'Pending' : 'Approved' }}
          <button (click)="filterGateStatus='';applyFilters()" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:16px;line-height:1;">x</button>
        </span>
        <span *ngIf="filterAssignedPerson"
              style="display:inline-flex;align-items:center;gap:4px;background:#fff;
                     border:1.5px solid var(--triarq-color-primary,#257099);
                     color:var(--triarq-color-primary,#257099);border-radius:999px;
                     padding:4px 12px;font-size:13px;">
          {{ filterAssignedPerson === 'my_cycles' ? 'My Cycles' : filterAssignedPerson === 'unassigned_ds' ? 'Unassigned DS' : 'Unassigned CB' }}
          <button (click)="filterAssignedPerson='';applyFilters()" style="background:none;border:none;cursor:pointer;color:inherit;padding:0;font-size:16px;line-height:1;">x</button>
        </span>
      </div>

      <!-- ── Slide-in filter panel (D-HubFilter-2026-04-06) ───────────────── -->
      <!-- Six drill-in filters. State persists per D-171. Count card shortcuts  -->
      <!-- do NOT write to filter memory (persist=false flag).                   -->
      <div *ngIf="showFilterPanel"
           style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.15);"
           (click)="showFilterPanel=false"></div>
      <div *ngIf="showFilterPanel"
           style="position:fixed;top:0;right:0;bottom:0;width:360px;background:#fff;
                  box-shadow:-4px 0 24px rgba(0,0,0,0.14);z-index:1001;
                  display:flex;flex-direction:column;overflow:hidden;"
           (click)="$event.stopPropagation()">
        <div style="background:#12274A;color:#fff;padding:16px 20px;
                    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
          <span style="font-size:16px;font-weight:500;">Filters</span>
          <button (click)="showFilterPanel=false" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0;line-height:1;">x</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px 20px;">
          <!-- Filter 1: Division -->
          <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:500;color:#5A5A5A;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Division</div>
            <select [(ngModel)]="filterDivision" (ngModelChange)="onDivisionFilterChange()" class="oi-input" style="width:100%;">
              <option value="">My Divisions</option>
              <option *ngFor="let d of filterDivisionOptions" [value]="d.id">{{ d.division_name }}</option>
            </select>
            <label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;color:#5A5A5A;cursor:pointer;">
              <input type="checkbox" [(ngModel)]="includeChildDivisions" (ngModelChange)="onDivisionFilterChange()" />
              Include child divisions
            </label>
          </div>
          <!-- Filter 2: Assigned Person -->
          <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:500;color:#5A5A5A;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Assigned Person</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <label *ngFor="let opt of assignedPersonOptions" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#1E1E1E;">
                <input type="radio" [value]="opt.value" [(ngModel)]="filterAssignedPerson" (ngModelChange)="applyFilters()" />
                {{ opt.label }}
              </label>
            </div>
          </div>
          <!-- Filter 3: Lifecycle Stage -->
          <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:500;color:#5A5A5A;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Lifecycle Stage</div>
            <select [(ngModel)]="filterStage" (ngModelChange)="applyFilters()" class="oi-input" style="width:100%;">
              <option value="">All Stages</option>
              <option *ngFor="let s of stages" [value]="s">{{ STAGE_LABEL_MAP[s] ?? s }}</option>
            </select>
          </div>
          <!-- Filter 4: Gate Status -->
          <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:500;color:#5A5A5A;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Gate Status</div>
            <select [(ngModel)]="filterGateStatus" (ngModelChange)="applyFilters()" class="oi-input" style="width:100%;">
              <option value="">All</option>
              <option value="overdue">Overdue</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <!-- Filter 5: Tier -->
          <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:500;color:#5A5A5A;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Tier</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#1E1E1E;">
                <input type="radio" value="" [(ngModel)]="filterTier" (ngModelChange)="applyFilters()" />All Tiers
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#1E1E1E;">
                <input type="radio" value="tier_1" [(ngModel)]="filterTier" (ngModelChange)="applyFilters()" />
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#4CAF50;flex-shrink:0;"></span>Tier 1 - Fast Lane
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#1E1E1E;">
                <input type="radio" value="tier_2" [(ngModel)]="filterTier" (ngModelChange)="applyFilters()" />
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--triarq-color-sunray,#F2A620);flex-shrink:0;"></span>Tier 2 - Structured
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:#1E1E1E;">
                <input type="radio" value="tier_3" [(ngModel)]="filterTier" (ngModelChange)="applyFilters()" />
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--triarq-color-primary,#257099);flex-shrink:0;"></span>Tier 3 - Governed
              </label>
            </div>
          </div>
          <!-- Filter 6: Workstream (D-167: inactive shown as separate group) -->
          <div style="margin-bottom:20px;">
            <div style="font-size:13px;font-weight:500;color:#5A5A5A;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Workstream</div>
            <select [(ngModel)]="filterWorkstream" (ngModelChange)="applyFilters()" class="oi-input" style="width:100%;">
              <option value="">All Workstreams</option>
              <option value="__none__">No Workstream Assigned</option>
              <optgroup *ngIf="activeWorkstreams.length > 0" label="Active">
                <option *ngFor="let ws of activeWorkstreams" [value]="ws.workstream_id">{{ ws.workstream_name }}</option>
              </optgroup>
              <optgroup *ngIf="inactiveWorkstreams.length > 0" label="Inactive">
                <option *ngFor="let ws of inactiveWorkstreams" [value]="ws.workstream_id">{{ ws.workstream_name }} (Inactive)</option>
              </optgroup>
            </select>
          </div>
        </div>
        <div style="padding:12px 20px;border-top:1px solid #E8E8E8;flex-shrink:0;display:flex;gap:8px;justify-content:flex-end;">
          <button (click)="clearAllFilters();showFilterPanel=false" style="background:#fff;border:1px solid #D0D0D0;color:#5A5A5A;border-radius:5px;padding:8px 16px;cursor:pointer;font-size:14px;">Clear All</button>
          <button (click)="showFilterPanel=false" style="background:var(--triarq-color-primary,#257099);color:#fff;border:none;border-radius:5px;padding:8px 20px;cursor:pointer;font-size:14px;font-weight:500;">Done</button>
        </div>
      </div>

            <!-- ── Loading skeleton (D-178 Tier 1) — 7-column (Contract 3 Block 3: DS/CB split) ── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:grid;grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;
                    gap:8px;padding:16px;
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
          <ion-skeleton-text animated style="height:40px;border-radius:50%;width:40px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:4px;width:70px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:40px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- ── Load error (D-140) ─────────────────────────────────────────── -->
      <div *ngIf="loadError && !loading"
           style="padding:var(--triarq-space-md);max-width:600px;">
        <div style="color:var(--triarq-color-error);font-weight:500;margin-bottom:4px;">
          Delivery Cycles could not load.
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ loadError }}
        </div>
      </div>

      <!-- ── Column header row — D-196: 7 columns, always rendered ─────────────── -->
      <!-- Contract 1 2026-04-10: supersedes D-172 11-column.                        -->
      <!-- Contract 3 Block 3: Team column split into DS + CB. Source: contract-3-spec.md. -->
      <!-- D-196: headers always shown even when no rows.                             -->
      <div *ngIf="!loading"
           style="display:grid;
                  grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;
                  gap:8px;padding:8px 16px;
                  font-size:13px;font-weight:500;color:#fff;text-transform:uppercase;
                  background:#12274A;border-radius:6px 6px 0 0;letter-spacing:0.3px;">
        <span></span>
        <span>Division</span>
        <span>Cycle Name</span>
        <span>Outcome</span>
        <span>Stage</span>
        <span>DS</span>
        <span>CB</span>
      </div>

      <!-- ── Cycle rows — 7-column (Contract 3 Block 3: DS/CB split) ───────────────────── -->
      <!-- Col order: tier-dot | division | cycle-name+tier-badge | outcome | stage(3-line) | DS | CB -->
      <!-- S-005: full-row tap opens right panel (not routerLink navigation). Source: Contract 1.     -->
      <div *ngFor="let cycle of filtered">
        <div
          (click)="openCyclePanel(cycle.delivery_cycle_id)"
          [style.background]="selectedCycleId === cycle.delivery_cycle_id ? '#E8F0FE' : ''"
          [style.border-left]="selectedCycleId === cycle.delivery_cycle_id ? '3px solid var(--triarq-color-primary,#257099)' : '3px solid transparent'"
          style="display:grid;
                 grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;
                 gap:8px;padding:16px;
                 border-bottom:1px solid #E8E8E8;
                 align-items:start;cursor:pointer;min-height:88px;"
          (mouseenter)="$any($event.currentTarget).style.background = selectedCycleId === cycle.delivery_cycle_id ? '#E8F0FE' : '#F0F4F8'"
          (mouseleave)="$any($event.currentTarget).style.background = selectedCycleId === cycle.delivery_cycle_id ? '#E8F0FE' : ''">

          <!-- Col 1: Tier dot — 48px contained circle (D-197) -->
          <div style="display:flex;justify-content:center;align-items:flex-start;padding-top:4px;">
            <div [style.background]="tierDotColor(cycle.tier_classification)"
                 style="width:48px;height:48px;border-radius:50%;flex-shrink:0;"></div>
          </div>

          <!-- Col 2: Division chip — D-203: always chip, empty chip if null -->
          <!-- CC-Decision-2026-04-10-A: using division_name from MCP; display_name_short pending ARCH-29 -->
          <div style="overflow:hidden;padding-top:6px;">
            <span style="display:inline-block;padding:2px 6px;border-radius:4px;
                         background:rgba(90,90,90,0.08);color:#5A5A5A;font-size:11px;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                         max-width:80px;cursor:pointer;"
                  title="{{ cycle.division_name ?? '' }}">
              {{ cycle.division_name ?? '' }}
            </span>
          </div>

          <!-- Col 3: Cycle Name (2-line clamp) + Tier badge below -->
          <div>
            <div style="font-size:14px;font-weight:600;color:#1E1E1E;margin-bottom:4px;
                        display:-webkit-box;-webkit-line-clamp:2;
                        -webkit-box-orient:vertical;overflow:hidden;"
                 title="{{ cycle.cycle_title }}">
              {{ cycle.cycle_title }}
            </div>
            <span [style.background]="tierBadgeBg(cycle.tier_classification)"
                  [style.color]="tierBadgeColor(cycle.tier_classification)"
                  style="display:inline-block;border-radius:4px;padding:3px 8px;
                         font-size:12px;font-weight:500;">
              Tier {{ tierLabel(cycle.tier_classification) }}
            </span>
          </div>

          <!-- Col 4: Outcome — 1-line truncation, amber dot when null -->
          <div style="display:flex;align-items:flex-start;gap:4px;overflow:hidden;padding-top:2px;">
            <span *ngIf="!cycle.outcome_statement"
                  style="display:inline-block;width:8px;height:8px;flex-shrink:0;margin-top:4px;
                         border-radius:50%;background:var(--triarq-color-sunray,#F2A620);"
                  title="Outcome Statement not set"></span>
            <span style="font-size:13px;color:#5A5A5A;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {{ cycle.outcome_statement || '&#8212;' }}
            </span>
          </div>

          <!-- Col 5: Stage — 3-line structure per Contract 1 spec -->
          <!-- Line 1: stage label | Line 2: condensed track | Line 3: headline text -->
          <div style="overflow:hidden;" (click)="$event.stopPropagation(); openCyclePanel(cycle.delivery_cycle_id)">
            <div style="font-size:13px;color:#5A5A5A;margin-bottom:2px;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {{ STAGE_LABEL_MAP[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
            </div>
            <app-stage-track
              [currentStageId]="cycle.current_lifecycle_stage"
              [gateStateMap]="gateStateMapsCache.get(cycle.delivery_cycle_id) ?? buildGateStateMap(cycle)"
              displayMode="condensed"
            ></app-stage-track>
            <div style="font-size:11px;margin-top:2px;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                 [style.color]="headlineColor(cycle)">
              {{ headline(cycle) }}
            </div>
          </div>

          <!-- Col 6: Assigned DS — tappable chip per D-181. Contract 3 Block 3. -->
          <div style="overflow:hidden;padding-top:6px;" (click)="$event.stopPropagation()">
            <span *ngIf="cycle.assigned_ds_display_name; else noDsCell"
                  style="display:inline-block;padding:2px 6px;border-radius:4px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:11px;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                         max-width:84px;cursor:default;"
                  title="{{ cycle.assigned_ds_display_name }}">
              {{ cycle.assigned_ds_display_name }}
            </span>
            <ng-template #noDsCell>
              <span style="color:#9E9E9E;font-style:italic;font-size:11px;">—</span>
            </ng-template>
          </div>

          <!-- Col 7: Assigned CB — tappable chip per D-181. Contract 3 Block 3. -->
          <div style="overflow:hidden;padding-top:6px;" (click)="$event.stopPropagation()">
            <span *ngIf="cycle.assigned_cb_display_name; else noCbCell"
                  style="display:inline-block;padding:2px 6px;border-radius:4px;
                         background:rgba(37,112,153,0.08);color:#257099;font-size:11px;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                         max-width:84px;cursor:default;"
                  title="{{ cycle.assigned_cb_display_name }}">
              {{ cycle.assigned_cb_display_name }}
            </span>
            <ng-template #noCbCell>
              <span style="color:#9E9E9E;font-style:italic;font-size:11px;">—</span>
            </ng-template>
          </div>

        </div>
      </div>

      <!-- ── Empty state — D-196: lives inside grid area, below column headers ─ -->
      <!-- Column headers always render above this. Empty state row spans all columns. -->
      <div *ngIf="!loading && !loadError && filtered.length === 0"
           style="display:grid;
                  grid-template-columns:48px 88px 180px 1fr 118px 88px 88px;
                  border-bottom:1px solid #E8E8E8;">
        <div style="grid-column:1/-1;min-height:200px;
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    padding:var(--triarq-space-xl) var(--triarq-space-md);text-align:center;">

          <!-- State 1: No Division assignment -->
          <ng-container *ngIf="divisionChecked && !hasDivision">
            <div style="font-size:40px;margin-bottom:var(--triarq-space-sm);">◫</div>
            <div style="font-weight:500;color:var(--triarq-color-text-primary);margin-bottom:6px;">
              No Division assignment yet
            </div>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                        max-width:400px;line-height:1.6;">
              Contact your administrator to be assigned to a Division.
            </div>
          </ng-container>

          <!-- State 2: Has Division, no cycles -->
          <ng-container *ngIf="hasDivision && cycles.length === 0">
            <div style="font-weight:500;color:var(--triarq-color-text-primary);margin-bottom:6px;">
              No active Delivery Cycles in your Divisions
            </div>
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                        max-width:400px;line-height:1.6;">
              <span *ngIf="canCreateCycle">Use "+ New Cycle" above to create the first one.</span>
              <span *ngIf="!canCreateCycle">No cycles have been created yet in your Divisions.</span>
            </div>
          </ng-container>

          <!-- State 3: Cycles exist but filters exclude all results -->
          <ng-container *ngIf="hasDivision && cycles.length > 0">
            <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
              No cycles match the current filters.
              <span (click)="clearFilters()"
                    style="color:var(--triarq-color-primary);cursor:pointer;
                           text-decoration:underline;margin-left:4px;">
                Clear filters
              </span>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- ── Result count ─────────────────────────────────────────────────── -->
      <div *ngIf="!loading && cycles.length > 0"
           style="margin-top:var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);">
        Showing {{ filtered.length }}<span *ngIf="filtered.length < cycles.length"> of {{ cycles.length }}</span>
        cycle{{ cycles.length === 1 ? '' : 's' }}
        <span *ngIf="sortField"> · sorted by {{ sortLabel() }}</span>
      </div>
    </div><!-- /left panel -->

    <!-- ── Right: Detail Panel — S-005/S-006 right panel on row tap ──────── -->
    <div *ngIf="selectedCycleId"
         style="width:60%;border-left:1px solid #E0E0E0;background:#fff;
                position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;">
      <app-delivery-cycle-detail
        [cycleId]="selectedCycleId"
        (close)="closePanel()">
      </app-delivery-cycle-detail>
    </div>

    </div><!-- /flex container -->
  `
})
export class DeliveryCycleDashboardComponent implements OnInit, OnDestroy {
  private profileSub?: Subscription;

  // S-005/S-006: right panel — selected cycle drives detail panel visibility
  selectedCycleId: string | null = null;

  cycles:            DeliveryCycle[]       = [];
  filtered:          DeliveryCycle[]       = [];
  workstreams:       DeliveryWorkstream[]  = [];
  activeWorkstreams: DeliveryWorkstream[]  = [];
  divisions:         Division[]            = [];
  // D-166: user's directly-assigned divisions for the division filter dropdown
  userDivisions:     Division[]            = [];
  loading            = false;
  loadError          = '';
  hasDivision        = true;   // assumed true until division check completes
  divisionChecked    = false;
  canCreateCycle     = false;
  showCreateForm     = false;
  creating           = false;
  createError        = '';
  createForm!:       FormGroup;

  // CC-004: Create form — workstream picker state
  showWorkstreamPicker      = false;
  createSelectedWorkstream: DeliveryWorkstream | null = null;

  // CC-006: DS auto-assignment — pre-populate if current user is DS role
  autoAssignedDsUserId:       string | null = null;
  autoAssignedDsDisplayName:  string | null = null;

  // D-194: CB auto-assignment — pre-populate if current user is CB role
  autoAssignedCbUserId:       string | null = null;
  autoAssignedCbDisplayName:  string | null = null;

  // D-193: Workstream tab strip removed in view correction 2026-04-09-D per D-HubFilter-2026-04-06.
  // Variable kept for screen state backward-compat only.
  activeWorkstreamTab = '';

  // D-HubFilter-2026-04-06: Slide-in filter panel
  showFilterPanel = false;

  // Gate status filter: 'overdue' | 'pending' | 'approved' | ''
  filterGateStatus: string = '';

  // Assigned person shortcut: 'my_cycles' | 'unassigned_ds' | 'unassigned_cb' | ''
  filterAssignedPerson: string = '';

  // Filter state (ngModel bindings — not reactive form controls)
  filterStage:              string  = '';
  filterTier:               string  = '';
  // '__none__' = show cycles with no workstream assigned (D-167)
  filterWorkstream:         string  = '';
  // D-166: division filter — server-side reload when changed
  filterDivision:           string  = '';
  includeChildDivisions:    boolean = false;
  // D-173/D-175: next gate filter — computed client-side from lifecycle stage
  filterNextGate:           string  = '';
  // D-172: Assigned DS and Assigned CB filters — client-side, derived from loaded cycles
  filterDs:                 string  = '';
  filterCb:                 string  = '';

  // S7: Hub summary card state — derived from loaded cycles + delivery summary
  deliverySummary: DeliverySummary | null = null;

  // Item 5: Drill-down visual confirmation — tracks which filters came from query params
  drillDownFromQp = false;  // set true when query params were present on init

  // Sort state
  sortField: 'cycle_title' | 'current_lifecycle_stage' | 'tier_classification' = 'cycle_title';
  sortDir:   'asc' | 'desc' = 'asc';

  // Expose constants to template
  readonly STAGE_LABEL_MAP = STAGE_LABEL_MAP;
  readonly GATE_LABELS     = GATE_LABELS;

  readonly stages: LifecycleStage[] = [
    'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE','ON_HOLD','CANCELLED'
  ];

  readonly gateNames: GateName[] = [
    'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
  ];

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4, 5];

  // Block 1 freeze fix (CC-Decision-2026-04-11-A): stable references so OnPush StageTrackComponent
  // does not re-render every CD cycle. Populated at the end of applyFilters(). Source: Contract 3 Block 1.
  // Not private — Angular template compilation requires non-private for template binding access.
  gateStateMapsCache = new Map<string, GateStateMap>();

  // Block 1 freeze fix (CC-Decision-2026-04-11-A): readonly field avoids new array reference every CD cycle.
  readonly assignedPersonOptions: { value: string; label: string }[] = [
    { value: '',               label: 'Anyone' },
    { value: 'my_cycles',     label: 'My Cycles' },
    { value: 'unassigned_ds', label: 'Unassigned DS' },
    { value: 'unassigned_cb', label: 'Unassigned CB' }
  ];

  constructor(
    private readonly delivery:     DeliveryService,
    private readonly mcp:          McpService,
    private readonly profile:      UserProfileService,
    private readonly fb:           FormBuilder,
    private readonly route:        ActivatedRoute,
    private readonly router:       Router,
    private readonly screenState:  ScreenStateService,
    private readonly cdr:          ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // CC-004: Rich create form — field order: Division → Title → Workstream → Tier → Outcome → Jira → Dates.
    // workstream_id is stored separately in createSelectedWorkstream (not a form control — uses picker modal).
    // assigned_ds_user_id comes from autoAssignedDsUserId (auto-populated, not a form field).
    // D-165: workstream is optional at creation. CC-006: DS nullable at creation.
    this.createForm = this.fb.group({
      division_id:              ['', Validators.required],
      cycle_title:              ['', Validators.required],
      tier_classification:      ['', Validators.required],
      outcome_statement:        [''],
      jira_epic_key:            [''],
      milestone_brief_review:   [''],
      milestone_go_to_build:    [''],
      milestone_go_to_deploy:   [''],
      milestone_go_to_release:  [''],
      milestone_close_review:   ['']
    });
    // D-175: read query params from summary view drill-down and apply as initial filters.
    // Item 5: set drillDownFromQp so the visual confirmation banner renders.
    const qp = this.route.snapshot.queryParams;
    if (qp['workstream_id']) { this.filterWorkstream = qp['workstream_id'] as string; this.drillDownFromQp = true; }
    if (qp['next_gate'])     { this.filterNextGate   = qp['next_gate']     as string; this.drillDownFromQp = true; }
    if (qp['division_id'])   { this.filterDivision   = qp['division_id']   as string; this.drillDownFromQp = true; }

    // Item 4 (Part 3): Restore saved filter/sort state if no drill-down params present.
    // D-175 drill-down takes priority; restoreScreenState() skips if drillDownFromQp is set.
    // Principle 9: skeleton renders while cycles load — restored filters show on first paint.
    this.restoreScreenState();

    this.loadWorkstreams();
    this.loadDivisions();
    this.loadCycles();
    this.loadDeliverySummary();

    // Subscribe to profile — fires immediately if already loaded, or when it arrives.
    // canCreateCycle and checkUserDivisions() depend on system_role, which is only
    // available after the profile MCP call completes. Reading it synchronously here
    // produces null when the component is the first page loaded (race condition).
    this.profileSub = this.profile.profile$
      .pipe(filter(p => p !== null), take(1))
      .subscribe(() => {
        const p    = this.profile.getCurrentProfile();
        const role = p?.system_role;
        // S8: CE is read-only — can view cycles but not create them (enforced at MCP layer too).
        this.canCreateCycle = role === 'ds' || role === 'phil' || role === 'admin' || role === 'cb';

        // CC-006: Pre-populate DS if caller is DS role.
        if (role === 'ds' && p?.id && p?.display_name) {
          this.autoAssignedDsUserId      = p.id;
          this.autoAssignedDsDisplayName = p.display_name;
        }

        // D-194: Pre-populate CB if caller is CB role.
        if (role === 'cb' && p?.id && p?.display_name) {
          this.autoAssignedCbUserId      = p.id;
          this.autoAssignedCbDisplayName = p.display_name;
        }

        this.checkUserDivisions();
        this.cdr.markForCheck();
      });
  }

  private async checkUserDivisions(): Promise<void> {
    const currentProfile = this.profile.getCurrentProfile();
    const userId         = currentProfile?.id;
    const role           = currentProfile?.system_role;

    // D-170: Phil and Admin have implicit access to all Divisions — no assignment needed.
    // Skip MCP call entirely. Division filter will be populated from this.divisions
    // (loaded by loadDivisions()) via the filterDivisionOptions getter.
    if (role === 'phil' || role === 'admin') {
      this.hasDivision     = true;
      this.divisionChecked = true;
      this.profile.setHasDivision(true);
      this.cdr.markForCheck();
      return;
    }

    if (!userId) {
      this.hasDivision     = false;
      this.divisionChecked = true;
      this.cdr.markForCheck();
      return;
    }

    // Use cached value from home screen if available (avoids double call on normal navigation).
    if (this.profile.hasAnyDivision()) {
      this.hasDivision     = true;
      this.divisionChecked = true;
      this.cdr.markForCheck();
      // Still need to load userDivisions for the filter — fall through to MCP call below
      // only if userDivisions is empty (meaning we haven't loaded them yet this session).
      if (this.userDivisions.length > 0) { return; }
    }

    try {
      const res = await firstValueFrom(
        this.mcp.call<{
          all_accessible_divisions:    (Division & { access_type: string })[];
          directly_assigned_divisions: Division[];
        }>('division', 'get_user_divisions', { user_id: userId })
      );

      const allDivisions   = res.data?.all_accessible_divisions ?? [];
      this.hasDivision     = allDivisions.length > 0;
      this.divisionChecked = true;
      this.profile.setHasDivision(this.hasDivision);

      // D-166: store directly-assigned divisions for the division filter dropdown.
      this.userDivisions = (res.data?.directly_assigned_divisions ?? []) as Division[];
    } catch {
      this.hasDivision     = false;
      this.divisionChecked = true;
    }
    this.cdr.markForCheck();
  }

  // D-170: Phil and Admin use all loaded divisions for the filter (no assignment needed).
  // Other roles use only their directly-assigned divisions.
  get filterDivisionOptions(): Division[] {
    const role = this.profile.getCurrentProfile()?.system_role;
    if (role === 'phil' || role === 'admin') {
      return this.divisions;
    }
    return this.userDivisions;
  }

  // ── S7: Hub summary card computed getters ─────────────────────────────────

  private readonly TERMINAL_STAGES: LifecycleStage[] = ['COMPLETE', 'CANCELLED'];

  /** Card 1: count of non-terminal cycles across loaded result set */
  get activeCycleCount(): number {
    return this.cycles.filter(c => !this.TERMINAL_STAGES.includes(c.current_lifecycle_stage)).length;
  }

  /** Card 1: sub-stat — stage breakdown in priority order */
  get activeStageSummary(): string {
    const active = this.cycles.filter(c => !this.TERMINAL_STAGES.includes(c.current_lifecycle_stage));
    const counts = new Map<string, number>();
    for (const c of active) {
      const label = STAGE_LABEL_MAP[c.current_lifecycle_stage] ?? c.current_lifecycle_stage;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    if (counts.size === 0) { return 'No active cycles'; }
    return Array.from(counts.entries())
      .map(([l, n]) => `${n} in ${l}`)
      .join(' · ');
  }

  /** Card 2: count of gate records where caller can approve and gate is pending */
  get awaitingActionCount(): number {
    let count = 0;
    for (const c of this.cycles) {
      for (const g of c.gate_records ?? []) {
        if (g.gate_status === 'pending' && g.current_user_gate_authority?.can_approve) { count++; }
      }
    }
    return count;
  }

  /** Card 2: name of oldest awaiting gate */
  get oldestAwaitingGateName(): GateName | null {
    let oldest: { gate: GateName; date: string } | null = null;
    for (const c of this.cycles) {
      for (const g of c.gate_records ?? []) {
        if (g.gate_status === 'pending' && g.current_user_gate_authority?.can_approve) {
          if (!oldest || g.created_at < oldest.date) {
            oldest = { gate: g.gate_name, date: g.created_at };
          }
        }
      }
    }
    return oldest?.gate ?? null;
  }

  /** Card 2: days since oldest awaiting gate */
  get oldestAwaitingDays(): number {
    let oldest: string | null = null;
    for (const c of this.cycles) {
      for (const g of c.gate_records ?? []) {
        if (g.gate_status === 'pending' && g.current_user_gate_authority?.can_approve) {
          if (!oldest || g.created_at < oldest) { oldest = g.created_at; }
        }
      }
    }
    if (!oldest) { return 0; }
    return Math.floor((Date.now() - new Date(oldest).getTime()) / 86_400_000);
  }

  /** Card 3: count of overdue gate records (target_date < today, no actual_date, not approved) */
  get overdueGateCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    for (const c of this.cycles) {
      for (const m of c.milestone_dates ?? []) {
        if (m.target_date && !m.actual_date && m.target_date < today) {
          const gateRecord = c.gate_records?.find(g => g.gate_name === m.gate_name);
          if (gateRecord?.gate_status !== 'approved') { count++; }
        }
      }
    }
    return count;
  }

  /** Card 3: cycles with at least one overdue gate */
  get overdueCycleCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.cycles.filter(c =>
      (c.milestone_dates ?? []).some(m => {
        if (!m.target_date || m.actual_date || m.target_date >= today) { return false; }
        const gateRecord = c.gate_records?.find(g => g.gate_name === m.gate_name);
        return gateRecord?.gate_status !== 'approved';
      })
    ).length;
  }

  /** Card 4: active workstream count from summary or loaded list */
  get activeWorkstreamCount(): number {
    if (this.deliverySummary) {
      return this.deliverySummary.workstream_summaries.filter(w => w.active_status).length;
    }
    return this.activeWorkstreams.length;
  }

  /** Card 4: total active cycle count across all workstreams */
  get totalWorkstreamCycleCount(): number {
    if (this.deliverySummary) {
      return this.deliverySummary.workstream_summaries
        .filter(w => w.active_status)
        .reduce((sum, w) => sum + w.total_active_cycles, 0);
    }
    return this.activeCycleCount;
  }

  // ── Item 5: Drill-down filter visual confirmation getters ──────────────────

  get drillDownActive(): boolean {
    return this.drillDownFromQp && !!(this.filterWorkstream || this.filterNextGate || this.filterDivision);
  }

  get drillDownWorkstreamLabel(): string | null {
    if (!this.filterWorkstream || !this.drillDownFromQp) { return null; }
    if (this.filterWorkstream === '__none__') { return 'No Workstream assigned'; }
    return this.workstreams.find(w => w.workstream_id === this.filterWorkstream)?.workstream_name ?? this.filterWorkstream;
  }

  get drillDownGateLabel(): string | null {
    if (!this.filterNextGate || !this.drillDownFromQp) { return null; }
    return GATE_LABELS[this.filterNextGate as GateName] ?? this.filterNextGate;
  }

  get drillDownDivisionLabel(): string | null {
    if (!this.filterDivision || !this.drillDownFromQp) { return null; }
    return this.divisions.find(d => d.id === this.filterDivision)?.division_name ?? this.filterDivision;
  }

  clearDrillDownWorkstream(): void { this.filterWorkstream = ''; this.drillDownFromQp = !!this.filterNextGate || !!this.filterDivision; this.applyFilters(); }
  clearDrillDownGate():       void { this.filterNextGate   = ''; this.drillDownFromQp = !!this.filterWorkstream || !!this.filterDivision; this.applyFilters(); }
  clearDrillDownDivision():   void { this.filterDivision   = ''; this.drillDownFromQp = !!this.filterWorkstream || !!this.filterNextGate; this.onDivisionFilterChange(); }
  clearDrillDown():           void { this.filterWorkstream = ''; this.filterNextGate = ''; this.filterDivision = ''; this.drillDownFromQp = false; this.onDivisionFilterChange(); }

  /** Card 2 tap: filter to cycles where user has gates awaiting action */
  filterToAwaitingAction(): void {
    // Filter in-place: keep only cycles where can_approve + pending gate
    this.filtered = this.cycles.filter(c =>
      (c.gate_records ?? []).some(g => g.gate_status === 'pending' && g.current_user_gate_authority?.can_approve)
    );
    this.cdr.markForCheck();
  }

  /** Card 3 tap: filter to cycles with overdue gates */
  filterToOverdue(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.filtered = this.cycles.filter(c =>
      (c.milestone_dates ?? []).some(m => {
        if (!m.target_date || m.actual_date || m.target_date >= today) { return false; }
        const gateRecord = c.gate_records?.find(g => g.gate_name === m.gate_name);
        return gateRecord?.gate_status !== 'approved';
      })
    );
    this.cdr.markForCheck();
  }

  /** Card 4 tap: navigate to workstream registry (Admin) */
  navigateToWorkstreams(): void {
    this.router.navigate(['/admin/workstreams']);
  }

  private loadDeliverySummary(): void {
    this.delivery.getDeliverySummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.deliverySummary = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {} // summary is supplemental — fail silently
    });
  }

  private loadWorkstreams(): void {
    this.delivery.listWorkstreams().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workstreams       = Array.isArray(res.data) ? res.data : [];
          this.activeWorkstreams = this.workstreams.filter(w =>  w.active_status);
          // inactiveWorkstreams is a getter — no separate field needed
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  // D-167: inactive workstreams shown as a separate group in the workstream filter.
  // They are NOT merged with "no workstream" — different states require separate visibility.
  get inactiveWorkstreams(): DeliveryWorkstream[] {
    return this.workstreams.filter(w => !w.active_status);
  }

  // D-172: Unique DS options derived from loaded cycles — only show people who appear in current result set.
  get dsFilterOptions(): { user_id: string; display_name: string }[] {
    const seen = new Map<string, string>();
    for (const c of this.cycles) {
      if (c.assigned_ds_user_id && c.assigned_ds_display_name) {
        seen.set(c.assigned_ds_user_id, c.assigned_ds_display_name);
      }
    }
    return Array.from(seen.entries())
      .map(([user_id, display_name]) => ({ user_id, display_name }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }

  // D-172: Unique CB options derived from loaded cycles.
  get cbFilterOptions(): { user_id: string; display_name: string }[] {
    const seen = new Map<string, string>();
    for (const c of this.cycles) {
      if (c.assigned_cb_user_id && c.assigned_cb_display_name) {
        seen.set(c.assigned_cb_user_id, c.assigned_cb_display_name);
      }
    }
    return Array.from(seen.entries())
      .map(([user_id, display_name]) => ({ user_id, display_name }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }

  private loadDivisions(): void {
    // all_levels:true returns all divisions across the hierarchy, not just root trusts.
    // Needed so the Owner Division create-form dropdown has a full list to choose from.
    this.mcp.call<Division[]>('division', 'list_divisions', { all_levels: true }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisions = Array.isArray(res.data) ? res.data : [];
        } else if (!res.success) {
          this.loadError = res.error ?? 'Could not load Divisions.';
        }
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = err?.error ?? 'Could not load Divisions.';
        this.cdr.markForCheck();
      }
    });
  }

  private loadCycles(): void {
    this.loading = true;
    this.cdr.markForCheck();

    // D-166: division filter is server-side — pass to MCP so access scoping is correct.
    const params: Parameters<typeof this.delivery.listCycles>[0] = {};
    if (this.filterDivision) {
      params.division_id             = this.filterDivision;
      params.include_child_divisions = this.includeChildDivisions;
    }

    this.delivery.listCycles(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cycles    = Array.isArray(res.data) ? res.data : [];
          this.loadError = '';
          this.applyFilters();
        } else {
          this.loadError = res.error ?? 'Delivery Cycles could not be loaded.';
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

  // Called when division filter or include_child_divisions changes — reloads from server
  onDivisionFilterChange(): void {
    this.saveScreenState();
    this.loadCycles();
  }

  // ── Item 4 (Part 3): Screen state save/restore ──────────────────────────────
  // SCREEN_STATE_RECENCY_DAYS = 7. Search text is never persisted (Principle 4).
  // Save: filter dropdowns + sort field + sort dir + division scope.
  // Restore: only when no drill-down query params are active (D-175 takes priority).

  private saveScreenState(): void {
    const userId = this.profile.getCurrentProfile()?.id;
    if (!userId) { return; }  // profile not yet loaded — skip
    this.screenState.save(SCREEN_KEYS.DELIVERY_CYCLES, userId, {
      filterStage:           this.filterStage,
      filterTier:            this.filterTier,
      filterWorkstream:      this.filterWorkstream,
      filterDivision:        this.filterDivision,
      includeChildDivisions: this.includeChildDivisions,
      filterNextGate:        this.filterNextGate,
      filterDs:              this.filterDs,
      filterCb:              this.filterCb,
      filterGateStatus:      this.filterGateStatus,
      filterAssignedPerson:  this.filterAssignedPerson,
      sortField:             this.sortField,
      sortDir:               this.sortDir
    });
  }

  private restoreScreenState(): void {
    // D-175: drill-down query params take priority — do not overwrite with saved state
    if (this.drillDownFromQp) { return; }
    const userId = this.profile.getCurrentProfile()?.id;
    if (!userId) { return; }
    const saved = this.screenState.restore(SCREEN_KEYS.DELIVERY_CYCLES, userId);
    if (!saved) { return; }
    if (typeof saved['filterStage']      === 'string') { this.filterStage      = saved['filterStage']; }
    if (typeof saved['filterTier']       === 'string') { this.filterTier       = saved['filterTier']; }
    if (typeof saved['filterWorkstream'] === 'string') { this.filterWorkstream = saved['filterWorkstream']; }
    if (typeof saved['filterDivision']   === 'string') { this.filterDivision   = saved['filterDivision']; }
    if (typeof saved['filterNextGate']   === 'string') { this.filterNextGate   = saved['filterNextGate']; }
    if (typeof saved['filterDs']             === 'string') { this.filterDs             = saved['filterDs']; }
    if (typeof saved['filterCb']             === 'string') { this.filterCb             = saved['filterCb']; }
    if (typeof saved['filterGateStatus']     === 'string') { this.filterGateStatus     = saved['filterGateStatus']; }
    if (typeof saved['filterAssignedPerson'] === 'string') { this.filterAssignedPerson = saved['filterAssignedPerson']; }
    if (typeof saved['sortField']        === 'string') {
      this.sortField = saved['sortField'] as 'cycle_title' | 'current_lifecycle_stage' | 'tier_classification';
    }
    if (typeof saved['sortDir'] === 'string') {
      this.sortDir = saved['sortDir'] as 'asc' | 'desc';
    }
    if (typeof saved['includeChildDivisions'] === 'boolean') {
      this.includeChildDivisions = saved['includeChildDivisions'];
    }
  }

  // persist=false used by count card shortcuts — set filter without writing to memory. Source: D-HubCounts-2026-04-06.
  applyFilters(persist: boolean = true): void {
    let result = this.cycles.filter(c => {
      if (this.filterStage && c.current_lifecycle_stage !== this.filterStage) { return false; }
      if (this.filterTier  && c.tier_classification    !== this.filterTier)  { return false; }

      // D-167: workstream filter — '__none__' shows cycles with no workstream assigned
      if (this.filterWorkstream === '__none__') {
        if (c.workstream_id) { return false; }
      } else if (this.filterWorkstream) {
        if (c.workstream_id !== this.filterWorkstream) { return false; }
      }

      // D-173/D-175: next gate filter — computed from lifecycle stage
      if (this.filterNextGate) {
        const nextGate = NEXT_GATE_BY_STAGE[c.current_lifecycle_stage] ?? null;
        if (nextGate !== this.filterNextGate) { return false; }
      }

      // D-172: Assigned DS filter
      if (this.filterDs && c.assigned_ds_user_id !== this.filterDs) { return false; }

      // D-172: Assigned CB filter
      if (this.filterCb && c.assigned_cb_user_id !== this.filterCb) { return false; }

      // D-HubFilter-2026-04-06: Assigned Person shortcut filter
      if (this.filterAssignedPerson) {
        const userId = this.profile.getCurrentProfile()?.id ?? '';
        if (this.filterAssignedPerson === 'my_cycles') {
          if (c.assigned_ds_user_id !== userId && c.assigned_cb_user_id !== userId) { return false; }
        } else if (this.filterAssignedPerson === 'unassigned_ds') {
          if (c.assigned_ds_user_id) { return false; }
        } else if (this.filterAssignedPerson === 'unassigned_cb') {
          if (c.assigned_cb_user_id) { return false; }
        }
      }

      // D-HubFilter-2026-04-06: Gate status filter
      if (this.filterGateStatus) {
        const today = new Date().toISOString().slice(0, 10);
        if (this.filterGateStatus === 'overdue') {
          const hasOverdue = (c.milestone_dates ?? []).some(m =>
            m.target_date && !m.actual_date && m.target_date < today &&
            c.gate_records?.find(g => g.gate_name === m.gate_name)?.gate_status !== 'approved'
          );
          if (!hasOverdue) { return false; }
        } else if (this.filterGateStatus === 'pending') {
          if (!c.gate_records?.some(g => g.gate_status === 'pending')) { return false; }
        } else if (this.filterGateStatus === 'approved') {
          if (!c.gate_records?.some(g => g.gate_status === 'approved')) { return false; }
        }
      }

      return true;
    });

    // Sort
    result = result.slice().sort((a, b) => {
      let va = '', vb = '';
      switch (this.sortField) {
        case 'cycle_title':             va = a.cycle_title;             vb = b.cycle_title;             break;
        case 'current_lifecycle_stage': va = a.current_lifecycle_stage; vb = b.current_lifecycle_stage; break;
        case 'tier_classification':     va = a.tier_classification;     vb = b.tier_classification;     break;
      }
      return this.sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    this.filtered = result;
    // Block 1 freeze fix: rebuild gate state map cache once per filter run so template
    // receives stable object references — prevents OnPush re-render cascade. Source: CC-Decision-2026-04-11-A.
    this.gateStateMapsCache = new Map(
      this.cycles.map(c => [c.delivery_cycle_id, this.buildGateStateMap(c)])
    );
    if (persist) { this.saveScreenState(); }
    this.cdr.markForCheck();
  }

  // D-193: Workstream tab strip — select a tab; '' = All Workstreams
  selectWorkstreamTab(wsId: string): void {
    this.activeWorkstreamTab = wsId;
    this.filterWorkstream    = wsId;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterStage           = '';
    this.filterTier            = '';
    this.filterWorkstream      = '';
    this.activeWorkstreamTab   = '';
    this.filterNextGate        = '';
    this.filterDs              = '';
    this.filterCb              = '';
    // Division filter requires server reload — not cleared here.
    // Division is intentionally NOT cleared by "Clear filters" (it's a scope selection).
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.filterStage           = '';
    this.filterTier            = '';
    this.filterWorkstream      = '';
    this.filterNextGate        = '';
    this.filterDs              = '';
    this.filterCb              = '';
    this.filterGateStatus      = '';
    this.filterAssignedPerson  = '';
    this.filterDivision        = '';
    this.includeChildDivisions = false;
    this.loadCycles();
  }

  setSort(field: 'cycle_title' | 'current_lifecycle_stage' | 'tier_classification'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir   = 'asc';
    }
    this.applyFilters();
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) { return '↕'; }
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  sortLabel(): string {
    const labels: Record<string, string> = {
      cycle_title:             'cycle title',
      current_lifecycle_stage: 'stage',
      tier_classification:     'tier'
    };
    return labels[this.sortField] ?? this.sortField;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.createError    = '';
    if (this.showCreateForm) {
      this.createForm.reset();
      this.createSelectedWorkstream = null;
      this.showWorkstreamPicker     = false;
    }
    this.cdr.markForCheck();
  }

  // CC-002: Workstream picker — open/close/select/clear
  openWorkstreamPicker(): void {
    this.showWorkstreamPicker = true;
    this.cdr.markForCheck();
  }

  onWorkstreamSelected(ws: DeliveryWorkstream | null): void {
    this.showWorkstreamPicker = false;
    if (ws) {
      this.createSelectedWorkstream = ws;
    }
    this.cdr.markForCheck();
  }

  clearCreateWorkstream(): void {
    this.createSelectedWorkstream = null;
    this.cdr.markForCheck();
  }

  // Called when the Division dropdown changes in the create form.
  // Clears the workstream selection since it was scoped to the previous division.
  onCreateDivisionChange(): void {
    this.createSelectedWorkstream = null;
    this.cdr.markForCheck();
  }

  /**
   * D-195: Returns true when the selected create-form division is a Trust (depth=1).
   * Trust is identified by checking if the division has no parent — i.e., it IS the top of the tree.
   * Divisions loaded via list_divisions include a parent_division_id field.
   * When parent_division_id is null, the division is a Trust-level node.
   */
  get createDivisionIsTrustLevel(): boolean {
    const divId = this.createForm?.get('division_id')?.value as string | undefined;
    if (!divId) { return false; }
    const div = this.divisions.find(d => d.id === divId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Division type may not carry parent_id in current typedef
    return div ? !(div as any).parent_division_id : false;
  }

  submitCreate(): void {
    if (this.createForm.invalid) { return; }
    this.creating    = true;
    this.createError = '';
    this.cdr.markForCheck();

    const v = this.createForm.value;

    // Build milestone_target_dates object — only include gates where a date was entered
    const milestone_target_dates: Record<string, string> = {};
    if (v.milestone_brief_review)  { milestone_target_dates['brief_review']  = v.milestone_brief_review  as string; }
    if (v.milestone_go_to_build)   { milestone_target_dates['go_to_build']   = v.milestone_go_to_build   as string; }
    if (v.milestone_go_to_deploy)  { milestone_target_dates['go_to_deploy']  = v.milestone_go_to_deploy  as string; }
    if (v.milestone_go_to_release) { milestone_target_dates['go_to_release'] = v.milestone_go_to_release as string; }
    if (v.milestone_close_review)  { milestone_target_dates['close_review']  = v.milestone_close_review  as string; }

    this.delivery.createCycle({
      cycle_title:         v.cycle_title         as string,
      tier_classification: v.tier_classification as TierClassification,
      division_id:         v.division_id         as string,
      // D-165: workstream optional — only include if user selected one via picker
      ...(this.createSelectedWorkstream ? { workstream_id: this.createSelectedWorkstream.workstream_id } : {}),
      // CC-006: DS auto-assignment — only include if auto-populated (caller is DS role)
      ...(this.autoAssignedDsUserId ? { assigned_ds_user_id: this.autoAssignedDsUserId } : {}),
      // D-194: CB auto-assignment — only include if auto-populated (caller is CB role)
      ...(this.autoAssignedCbUserId ? { assigned_cb_user_id: this.autoAssignedCbUserId } : {}),
      // Optional fields — only send if non-empty
      ...(v.outcome_statement?.trim() ? { outcome_statement: v.outcome_statement.trim() as string } : {}),
      ...(v.jira_epic_key?.trim()     ? { jira_epic_key:     v.jira_epic_key.trim()     as string } : {}),
      ...(Object.keys(milestone_target_dates).length > 0 ? { milestone_target_dates } : {})
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCreateForm           = false;
          this.createSelectedWorkstream = null;
          this.createForm.reset();
          this.loadCycles();
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

  // ── Presentation helpers ───────────────────────────────────────────────────

  workstreamName(wsId: string): string {
    return this.workstreams.find(w => w.workstream_id === wsId)?.workstream_name ?? wsId;
  }

  // ── Getters and helpers added in view correction session 2026-04-09-D ──────────────

  /** My Cycles count — active cycles where current user is DS or CB. Source: D-HubCounts-2026-04-06. */
  get myCyclesCount(): number {
    const userId = this.profile.getCurrentProfile()?.id;
    if (!userId) { return 0; }
    return this.cycles.filter(c =>
      !this.TERMINAL_STAGES.includes(c.current_lifecycle_stage) &&
      (c.assigned_ds_user_id === userId || c.assigned_cb_user_id === userId)
    ).length;
  }

  /** Active filter count — for the badge on the Filters button. */
  get activeFilterCount(): number {
    let n = 0;
    if (this.filterStage)          { n++; }
    if (this.filterTier)           { n++; }
    if (this.filterWorkstream)     { n++; }
    if (this.filterGateStatus)     { n++; }
    if (this.filterAssignedPerson) { n++; }
    if (this.filterDivision)       { n++; }
    return n;
  }

  // assignedPersonOptions getter removed — replaced by readonly field. Source: CC-Decision-2026-04-11-A.

  /** Toggle filter panel open/close. Block 1 freeze fix: markForCheck() required for OnPush. Source: CC-Decision-2026-04-11-A. */
  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
    this.cdr.markForCheck();
  }

  /** Count card tap: My Cycles — sets assigned person filter, does NOT persist to memory. Source: D-HubCounts-2026-04-06. */
  onMyCyclesTap(): void {
    this.filterAssignedPerson = 'my_cycles';
    this.applyFilters(false);
  }

  /** Count card tap: Overdue Gates — sets gate status filter, does NOT persist to memory. Source: D-HubCounts-2026-04-06. */
  onOverdueGatesTap(): void {
    this.filterGateStatus = 'overdue';
    this.applyFilters(false);
  }

  /** Tier badge background per Visual Layout Standards 1.7 (border-radius 4px, not pill). */
  tierBadgeBg(tier: TierClassification): string {
    if (tier === 'tier_1') { return '#E3F2FD'; }
    if (tier === 'tier_2') { return '#E0F2F1'; }
    return '#FFF3E0';
  }

  /** Tier badge text color per Visual Layout Standards 1.7. */
  tierBadgeColor(tier: TierClassification): string {
    if (tier === 'tier_1') { return '#1565C0'; }
    if (tier === 'tier_2') { return '#00695C'; }
    return '#E65100';
  }

  tierLabel(tier: TierClassification): string {
    return tier === 'tier_1' ? '1' : tier === 'tier_2' ? '2' : '3';
  }

  /** Safe stage label lookup — accepts plain string for filter chip display. */
  stageLabelFor(stage: string): string {
    return STAGE_LABEL_MAP[stage as LifecycleStage] ?? stage;
  }

  tierPillBg(tier: TierClassification): string {
    return tier === 'tier_1' ? '#e3f2fd' : tier === 'tier_2' ? '#f3e5f5' : '#e8f5e9';
  }

  // D-197: Avatar dot color — Tier 1 green, Tier 2 amber, Tier 3 teal (primary)
  tierDotColor(tier: TierClassification): string {
    if (tier === 'tier_1') { return '#4CAF50'; }
    if (tier === 'tier_2') { return 'var(--triarq-color-sunray, #f5a623)'; }
    return 'var(--triarq-color-primary, #257099)';
  }

  // D-197: Tier pill color for badge in cycle name column
  tierPillColor(tier: TierClassification): string {
    if (tier === 'tier_1') { return '#4CAF50'; }
    if (tier === 'tier_2') { return 'var(--triarq-color-sunray, #f5a623)'; }
    return 'var(--triarq-color-primary, #257099)';
  }

  stagePillBg(stage: LifecycleStage): string {
    if (stage === 'COMPLETE')  { return '#e8f5e9'; }
    if (stage === 'CANCELLED') { return '#fdecea'; }
    if (stage === 'ON_HOLD')   { return '#fff8e1'; }
    return 'var(--triarq-color-background-subtle)';
  }

  /** Headline text color per spec: amber for awaiting gate, red for overdue, body for in-progress */
  headlineColor(cycle: DeliveryCycle): string {
    const stage = cycle.current_lifecycle_stage;
    if (stage === 'COMPLETE' || stage === 'CANCELLED') {
      return 'var(--triarq-color-text-secondary)';
    }
    // Blocked or overdue → amber
    const blockedGate = cycle.gate_records?.find(g => g.gate_status === 'blocked');
    if (blockedGate) { return 'var(--triarq-color-sunray,#f5a623)'; }
    const today = new Date().toISOString().slice(0, 10);
    const overdueMilestone = cycle.milestone_dates?.find(
      m => m.target_date && !m.actual_date && m.target_date < today
    );
    if (overdueMilestone) { return 'var(--triarq-color-error,#d32f2f)'; }
    // Awaiting approval → amber
    const pendingGate = cycle.gate_records?.find(g => g.gate_status === 'pending');
    if (pendingGate) { return 'var(--triarq-color-sunray,#f5a623)'; }
    return 'var(--triarq-color-text-secondary)';
  }

  /**
   * Intelligent cycle headline — Session 2026-03-24-C, 6-rule priority order:
   * 1. Terminal states (COMPLETE, CANCELLED, ON_HOLD)
   * 2. Blocked gate — Workstream inactive
   * 3. Milestone target date overdue — no actual_date, target_date in the past
   * 4. Gate awaiting approval — gate_status = pending
   * 5. Post-deploy context anchor — Pilot Start Date when in late stages
   * 6. Default — "In [Stage Label]"
   */
  headline(cycle: DeliveryCycle): string {
    const stage = cycle.current_lifecycle_stage;

    // Rule 1: terminal states
    if (stage === 'COMPLETE')  { return 'Cycle complete'; }
    if (stage === 'CANCELLED') { return 'Cycle cancelled'; }
    if (stage === 'ON_HOLD')   { return 'On hold'; }

    // Rule 2: blocked gate (workstream inactive)
    const blockedGate = cycle.gate_records?.find(g => g.gate_status === 'blocked');
    if (blockedGate) {
      return `Gate blocked — ${GATE_LABELS[blockedGate.gate_name]} · Reactivate Workstream to continue`;
    }

    // Rule 3: overdue milestone target
    const today = new Date().toISOString().slice(0, 10);
    const overdueMilestone = cycle.milestone_dates?.find(
      m => m.target_date && !m.actual_date && m.target_date < today
    );
    if (overdueMilestone) {
      return `Target date overdue — ${GATE_LABELS[overdueMilestone.gate_name]}`;
    }

    // Rule 4: gate awaiting approval
    const pendingGate = cycle.gate_records?.find(g => g.gate_status === 'pending');
    if (pendingGate) {
      return `Awaiting approval — ${GATE_LABELS[pendingGate.gate_name]}`;
    }

    // Rule 5: post-deploy context — show Pilot Start reference
    if (POST_DEPLOY_STAGES.includes(stage)) {
      const pilotMilestone = cycle.milestone_dates?.find(m => m.gate_name === 'go_to_deploy');
      if (pilotMilestone?.actual_date) {
        return `Pilot started ${pilotMilestone.actual_date} · ${STAGE_LABEL_MAP[stage] ?? stage}`;
      }
      if (pilotMilestone?.target_date) {
        return `Pilot target ${pilotMilestone.target_date} · ${STAGE_LABEL_MAP[stage] ?? stage}`;
      }
    }

    // Rule 6: default
    return `In ${STAGE_LABEL_MAP[stage] ?? stage}`;
  }

  /** Build gate display state map from cycle's gate records */
  buildGateStateMap(cycle: DeliveryCycle): GateStateMap {
    const gates: GateName[] = ['brief_review','go_to_build','go_to_deploy','go_to_release','close_review'];
    const map: Partial<GateStateMap> = {};
    for (const gate of gates) {
      const record = cycle.gate_records?.find(g => g.gate_name === gate);
      if (!record)                                { map[gate] = 'upcoming'; continue; }
      if (record.gate_status === 'approved')      { map[gate] = 'complete'; continue; }
      if (record.gate_status === 'blocked')       { map[gate] = 'blocked';  continue; }
      if (record.gate_status === 'pending' || record.gate_status === 'returned') {
        map[gate] = 'pending';
      } else {
        map[gate] = 'upcoming';
      }
    }
    return map as GateStateMap;
  }

  /**
   * Date display — Session 2026-03-24-B.
   * Shows actual_date if set, else target_date if set, else blank (no placeholder).
   */
  dateDisplay(cycle: DeliveryCycle, gate: GateName): string {
    const milestone = cycle.milestone_dates?.find(m => m.gate_name === gate);
    if (!milestone) { return ''; }
    return milestone.actual_date ?? milestone.target_date ?? '';
  }

  dateColor(cycle: DeliveryCycle, gate: GateName): string {
    const terminal = ['COMPLETE','CANCELLED'].includes(cycle.current_lifecycle_stage);
    if (terminal) { return 'var(--triarq-color-text-secondary)'; }

    const milestone = cycle.milestone_dates?.find(m => m.gate_name === gate);
    if (!milestone?.target_date) { return 'var(--triarq-color-text-secondary)'; }
    if (milestone.actual_date)   { return 'var(--triarq-color-text-secondary)'; }

    // Commitment mode: colour by proximity to target_date
    const today = new Date().toISOString().slice(0, 10);
    const diff  = Math.ceil(
      (new Date(milestone.target_date).getTime() - new Date(today).getTime()) / 86400000
    );
    if (diff < 0)  { return 'var(--triarq-color-error, #d32f2f)'; }   // overdue
    if (diff <= 4) { return 'var(--triarq-color-sunray, #f5a623)'; }  // within 4 days
    return 'var(--triarq-color-text-secondary)';
  }

  // ── Right panel — S-005/S-006 push/pop navigation ──────────────────────────

  /** Open the detail right panel for the given cycle. S-008: parent re-queries on close. */
  openCyclePanel(cycleId: string): void {
    this.selectedCycleId = cycleId;
    this.cdr.markForCheck();
  }

  /** Close the detail right panel. S-008: unconditionally re-query cycles on close. */
  closePanel(): void {
    this.selectedCycleId = null;
    this.loadCycles(); // S-008: parent always re-queries on stack pop
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }
}
