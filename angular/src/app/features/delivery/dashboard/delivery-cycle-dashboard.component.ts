// delivery-cycle-dashboard.component.ts — DeliveryCycleDashboardComponent
// Route: /delivery/cycles  (moved from /delivery — D-172)
// Spec: build-c-spec Section 5.2
//
// Displays all Delivery Cycles visible to the current user.
// Row columns: cycle title + headline, lifecycle stage, workstream, tier,
//              condensed track, Pilot Start Date, Production Release Date.
// Filters: stage, tier, workstream. Sorting: title, stage, tier.
// Create button for DS, Phil, and Admin roles.
//
// D-93: DeliveryService only — no Supabase.
// D-140: Blocked action UX.
// Rule 2: Presentation only.
// Session 2026-03-24-B: blank date cells when date not set — no placeholder text.
// Session 2026-03-24-C: headline 6-rule priority logic.
// Design Principle 4.2: every screen states What/Why/How for empty states.
// D-178: Three-tier loading standard applied — Tier 1 skeleton, Tier 2 button spinner, Tier 3 overlay.

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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, StageTrackComponent, LoadingOverlayComponent, WorkstreamPickerComponent],
  template: `
    <div style="max-width:1200px;margin:var(--triarq-space-2xl) auto;padding:0 var(--triarq-space-md);">

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
          {{ showCreateForm ? 'Cancel' : '+ New Cycle' }}
        </button>
      </div>

      <!-- ── Create form (D-178 Tier 3: section overlay) ────────────────── -->
      <!-- CC-004: Rich creation page — field order: Division → Title → Workstream → Tier → DS → Outcome → Jira → Gate dates -->
      <div *ngIf="showCreateForm" style="position:relative;">
        <app-loading-overlay [visible]="creating" message="Creating Cycle…"></app-loading-overlay>
        <div class="oi-card"
             style="margin-bottom:var(--triarq-space-md);padding:var(--triarq-space-md);">
          <h4 style="margin:0 0 4px 0;font-size:var(--triarq-text-body);">New Delivery Cycle</h4>
          <p style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);">
            The cycle starts in Brief stage. Title should describe the deliverable, not the team or initiative.
          </p>
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

            <!-- Row 2: Workstream (picker) + Tier -->
            <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:2fr 1fr;
                        margin-bottom:var(--triarq-space-sm);">
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Delivery Workstream
                  <span style="font-weight:400;color:var(--triarq-color-text-secondary);"> — recommended</span>
                </label>
                <!-- Picker trigger row -->
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
                <div style="font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);margin-top:3px;">
                  Required before Brief Review gate. Assign now or after creation.
                </div>
              </div>
              <div>
                <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                  Tier Classification *
                </label>
                <select formControlName="tier_classification" class="oi-input">
                  <option value="">— Select Tier —</option>
                  <option value="tier_1">Tier 1</option>
                  <option value="tier_2">Tier 2</option>
                  <option value="tier_3">Tier 3</option>
                </select>
                <div *ngIf="createForm.get('tier_classification')?.invalid && createForm.get('tier_classification')?.touched"
                     style="color:var(--triarq-color-error);font-size:var(--triarq-text-small);margin-top:2px;">
                  Tier is required. Set at Brief stage and locked thereafter.
                </div>
              </div>
            </div>

            <!-- Row 3: DS assignment (auto-populated or blank) -->
            <div style="margin-bottom:var(--triarq-space-sm);max-width:400px;">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Delivery Specialist
                <span style="font-weight:400;color:var(--triarq-color-text-secondary);"> — required before Brief Review gate</span>
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
                          padding:6px 0;">
                DS assignment can be added after creation. Required before Brief Review gate can proceed.
              </div>
            </div>

            <!-- Row 4: Outcome Statement -->
            <div style="margin-bottom:var(--triarq-space-sm);">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Outcome Statement
                <span style="font-weight:400;color:var(--triarq-color-text-secondary);"> — optional at creation</span>
              </label>
              <textarea formControlName="outcome_statement"
                        class="oi-input"
                        rows="2"
                        style="resize:vertical;"
                        placeholder="What measurable result will this cycle deliver?">
              </textarea>
            </div>

            <!-- Row 5: Jira Epic Key -->
            <div style="margin-bottom:var(--triarq-space-sm);max-width:300px;">
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Jira Epic Key
                <span style="font-weight:400;color:var(--triarq-color-text-secondary);"> — optional</span>
              </label>
              <input formControlName="jira_epic_key" class="oi-input"
                     placeholder="e.g. PROJ-123" />
            </div>

            <!-- Row 6: Gate target dates -->
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
        </div>
      </div>

      <!-- ── Workstream Picker modal ─────────────────────────────────────── -->
      <app-workstream-picker
        *ngIf="showWorkstreamPicker"
        [cycleDivisionId]="createForm.get('division_id')?.value || null"
        [currentWorkstreamId]="createSelectedWorkstream?.workstream_id ?? null"
        (workstreamSelected)="onWorkstreamSelected($event)">
      </app-workstream-picker>

      <!-- ── S7: Hub Summary Cards — 4 tap-target cards above cycle list ──── -->
      <!-- Cards derive from loaded cycles and delivery summary. Each card taps to filter. -->
      <!-- D-171: /delivery is purely navigational — these cards live on /delivery/cycles. -->
      <div *ngIf="!loading"
           style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--triarq-space-sm);
                  margin-bottom:var(--triarq-space-md);">

        <!-- Card 1: Active Cycles -->
        <div class="oi-card"
             style="cursor:pointer;transition:box-shadow 0.1s;"
             (click)="clearFilters()"
             (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 8px rgba(0,0,0,0.12)'"
             (mouseleave)="$any($event.currentTarget).style.boxShadow=''">
          <div style="font-size:var(--triarq-text-small);font-weight:500;
                      color:var(--triarq-color-text-secondary);margin-bottom:4px;">Active Cycles</div>
          <div style="font-size:28px;font-weight:700;color:var(--triarq-color-primary);line-height:1;">
            {{ activeCycleCount }}
          </div>
          <div style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:4px;">
            {{ activeStageSummary }}
          </div>
        </div>

        <!-- Card 2: Gates Awaiting Your Action -->
        <div class="oi-card"
             style="cursor:pointer;transition:box-shadow 0.1s;"
             (click)="filterToAwaitingAction()"
             (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 8px rgba(0,0,0,0.12)'"
             (mouseleave)="$any($event.currentTarget).style.boxShadow=''">
          <div style="font-size:var(--triarq-text-small);font-weight:500;
                      color:var(--triarq-color-text-secondary);margin-bottom:4px;">
            Gates Awaiting Your Action
          </div>
          <div style="font-size:28px;font-weight:700;line-height:1;"
               [style.color]="awaitingActionCount > 0 ? 'var(--triarq-color-primary)' : 'var(--triarq-color-text-secondary)'">
            {{ awaitingActionCount }}
          </div>
          <div *ngIf="oldestAwaitingGateName"
               style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:4px;">
            Oldest: {{ GATE_LABELS[oldestAwaitingGateName] }} · {{ oldestAwaitingDays }} day{{ oldestAwaitingDays === 1 ? '' : 's' }}
          </div>
          <div *ngIf="!oldestAwaitingGateName && awaitingActionCount === 0"
               style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:4px;">
            No gates pending your review
          </div>
        </div>

        <!-- Card 3: Overdue Gates — amber accent when >0 -->
        <div class="oi-card"
             style="cursor:pointer;transition:box-shadow 0.1s;"
             [style.border-left]="overdueGateCount > 0 ? '4px solid var(--triarq-color-sunray,#f5a623)' : ''"
             (click)="filterToOverdue()"
             (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 8px rgba(0,0,0,0.12)'"
             (mouseleave)="$any($event.currentTarget).style.boxShadow=''">
          <div style="font-size:var(--triarq-text-small);font-weight:500;
                      color:var(--triarq-color-text-secondary);margin-bottom:4px;">Overdue Gates</div>
          <div style="font-size:28px;font-weight:700;line-height:1;"
               [style.color]="overdueGateCount > 0 ? 'var(--triarq-color-sunray,#f5a623)' : 'var(--triarq-color-text-secondary)'">
            {{ overdueGateCount }}
          </div>
          <div style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:4px;">
            Across {{ overdueCycleCount }} cycle{{ overdueCycleCount === 1 ? '' : 's' }}
          </div>
        </div>

        <!-- Card 4: Active Workstreams -->
        <div class="oi-card"
             style="cursor:pointer;transition:box-shadow 0.1s;"
             (click)="navigateToWorkstreams()"
             (mouseenter)="$any($event.currentTarget).style.boxShadow='0 2px 8px rgba(0,0,0,0.12)'"
             (mouseleave)="$any($event.currentTarget).style.boxShadow=''">
          <div style="font-size:var(--triarq-text-small);font-weight:500;
                      color:var(--triarq-color-text-secondary);margin-bottom:4px;">Active Workstreams</div>
          <div style="font-size:28px;font-weight:700;color:var(--triarq-color-primary);line-height:1;">
            {{ activeWorkstreamCount }}
          </div>
          <div style="font-size:11px;color:var(--triarq-color-text-secondary);margin-top:4px;">
            {{ totalWorkstreamCycleCount }} active cycle{{ totalWorkstreamCycleCount === 1 ? '' : 's' }} total
          </div>
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

      <!-- ── Filters + sort row ──────────────────────────────────────────── -->
      <div style="display:flex;gap:var(--triarq-space-sm);flex-wrap:wrap;
                  margin-bottom:var(--triarq-space-md);align-items:center;">

        <!-- D-166/D-170: Division filter — server-side reload.
             Phil/Admin see all divisions; others see their directly-assigned divisions.
             Only shown when there is more than one option to choose from. -->
        <select *ngIf="filterDivisionOptions.length > 1"
                [(ngModel)]="filterDivision"
                (ngModelChange)="onDivisionFilterChange()"
                class="oi-input"
                style="max-width:200px;font-size:var(--triarq-text-small);">
          <option value="">All Divisions</option>
          <option *ngFor="let d of filterDivisionOptions" [value]="d.id">{{ d.division_name }}</option>
        </select>

        <!-- D-166: Include child divisions — only visible when a division is selected -->
        <label *ngIf="filterDivision"
               style="display:flex;align-items:center;gap:6px;
                      font-size:var(--triarq-text-small);
                      color:var(--triarq-color-text-secondary);
                      cursor:pointer;white-space:nowrap;">
          <input type="checkbox"
                 [(ngModel)]="includeChildDivisions"
                 (ngModelChange)="onDivisionFilterChange()" />
          Include child Divisions
        </label>

        <!-- Stage filter -->
        <select [(ngModel)]="filterStage" (ngModelChange)="applyFilters()" class="oi-input"
                style="max-width:160px;font-size:var(--triarq-text-small);">
          <option value="">All Stages</option>
          <option *ngFor="let s of stages" [value]="s">{{ STAGE_LABEL_MAP[s] ?? s }}</option>
        </select>

        <!-- Tier filter -->
        <select [(ngModel)]="filterTier" (ngModelChange)="applyFilters()" class="oi-input"
                style="max-width:130px;font-size:var(--triarq-text-small);">
          <option value="">All Tiers</option>
          <option value="tier_1">Tier 1</option>
          <option value="tier_2">Tier 2</option>
          <option value="tier_3">Tier 3</option>
        </select>

        <!-- D-167: Workstream filter — "No workstream assigned" + active + inactive (separate groups) -->
        <select [(ngModel)]="filterWorkstream" (ngModelChange)="applyFilters()" class="oi-input"
                style="max-width:220px;font-size:var(--triarq-text-small);">
          <option value="">All Workstreams</option>
          <option value="__none__">— No workstream assigned —</option>
          <optgroup label="Active">
            <option *ngFor="let ws of activeWorkstreams" [value]="ws.workstream_id">
              {{ ws.workstream_name }}
            </option>
          </optgroup>
          <optgroup *ngIf="inactiveWorkstreams.length > 0" label="Inactive">
            <option *ngFor="let ws of inactiveWorkstreams" [value]="ws.workstream_id">
              {{ ws.workstream_name }} (inactive)
            </option>
          </optgroup>
        </select>

        <!-- D-173: Next Gate filter — computed from lifecycle stage client-side -->
        <select [(ngModel)]="filterNextGate" (ngModelChange)="applyFilters()" class="oi-input"
                style="max-width:180px;font-size:var(--triarq-text-small);">
          <option value="">All Next Gates</option>
          <option *ngFor="let gate of gateNames" [value]="gate">
            {{ GATE_LABELS[gate] }}
          </option>
        </select>

        <!-- D-172: Assigned DS filter — only shown when there are multiple DS in the loaded result set -->
        <select *ngIf="dsFilterOptions.length > 1"
                [(ngModel)]="filterDs" (ngModelChange)="applyFilters()" class="oi-input"
                style="max-width:180px;font-size:var(--triarq-text-small);">
          <option value="">All Domain Strategists</option>
          <option *ngFor="let ds of dsFilterOptions" [value]="ds.user_id">{{ ds.display_name }}</option>
        </select>

        <!-- D-172: Assigned CB filter — only shown when there are multiple CB in the loaded result set -->
        <select *ngIf="cbFilterOptions.length > 1"
                [(ngModel)]="filterCb" (ngModelChange)="applyFilters()" class="oi-input"
                style="max-width:180px;font-size:var(--triarq-text-small);">
          <option value="">All Capability Builders</option>
          <option *ngFor="let cb of cbFilterOptions" [value]="cb.user_id">{{ cb.display_name }}</option>
        </select>

        <span *ngIf="filterStage || filterTier || filterWorkstream || filterNextGate || filterDs || filterCb"
              (click)="clearFilters()"
              style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                     cursor:pointer;text-decoration:underline;">
          Clear filters
        </span>
      </div>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:grid;grid-template-columns:3fr 1fr 2fr 1fr 100px 100px 110px 130px 130px 24px;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:999px;width:60px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:20px;border-radius:999px;width:40px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:70px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:14px;border-radius:4px;width:70px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;width:16px;"></ion-skeleton-text>
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

      <!-- ── Table header with sort ───────────────────────────────────────── -->
      <div *ngIf="!loading && filtered.length > 0"
           style="display:grid;grid-template-columns:3fr 1fr 2fr 1fr 100px 100px 110px 130px 130px 24px;
                  gap:var(--triarq-space-sm);padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:500;
                  color:var(--triarq-color-text-secondary);
                  border-bottom:2px solid var(--triarq-color-border);">
        <span style="cursor:pointer;user-select:none;" (click)="setSort('cycle_title')">
          Cycle {{ sortIcon('cycle_title') }}
        </span>
        <span style="cursor:pointer;user-select:none;" (click)="setSort('current_lifecycle_stage')">
          Stage {{ sortIcon('current_lifecycle_stage') }}
        </span>
        <span>Workstream</span>
        <span style="cursor:pointer;user-select:none;" (click)="setSort('tier_classification')">
          Tier {{ sortIcon('tier_classification') }}
        </span>
        <span>DS</span>
        <span>CB</span>
        <span>Gate Track</span>
        <span>Pilot Start</span>
        <span>Release Date</span>
        <span></span>
      </div>

      <!-- ── Cycle rows ───────────────────────────────────────────────────── -->
      <div *ngFor="let cycle of filtered">
        <div
          [routerLink]="['/delivery', cycle.delivery_cycle_id]"
          style="display:grid;grid-template-columns:3fr 1fr 2fr 1fr 100px 100px 110px 130px 130px 24px;
                 gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                 border-bottom:1px solid var(--triarq-color-border);
                 font-size:var(--triarq-text-small);align-items:center;
                 cursor:pointer;transition:background 0.1s;"
          (mouseenter)="$any($event.currentTarget).style.background='var(--triarq-color-background-subtle)'"
          (mouseleave)="$any($event.currentTarget).style.background=''"
        >
          <!-- Cycle title + headline + outcome warning -->
          <div>
            <div style="font-weight:500;color:var(--triarq-color-text-primary);">
              {{ cycle.cycle_title }}
            </div>
            <div style="font-size:var(--triarq-text-small);
                        color:var(--triarq-color-text-secondary);margin-top:2px;">
              {{ headline(cycle) }}
            </div>
            <div *ngIf="!cycle.outcome_statement"
                 style="margin-top:3px;font-size:var(--triarq-text-small);
                        color:var(--triarq-color-sunray,#f5a623);font-weight:500;">
              ⚠ Outcome statement not set
            </div>
          </div>

          <!-- Lifecycle stage badge -->
          <span class="oi-pill"
                [style.background]="stagePillBg(cycle.current_lifecycle_stage)"
                style="font-size:10px;white-space:nowrap;justify-self:start;">
            {{ STAGE_LABEL_MAP[cycle.current_lifecycle_stage] ?? cycle.current_lifecycle_stage }}
          </span>

          <!-- Workstream — may be null (D-165: optional at creation) -->
          <span style="color:var(--triarq-color-text-secondary);">
            <span *ngIf="cycle.workstream_id">
              {{ cycle.workstream?.workstream_name ?? workstreamName(cycle.workstream_id!) }}
            </span>
            <span *ngIf="!cycle.workstream_id"
                  style="color:var(--triarq-color-sunray,#f5a623);font-size:var(--triarq-text-small);">
              ⚠ No workstream
            </span>
          </span>

          <!-- Tier badge -->
          <span class="oi-pill"
                [style.background]="tierPillBg(cycle.tier_classification)"
                style="font-size:10px;justify-self:start;">
            {{ tierLabel(cycle.tier_classification) }}
          </span>

          <!-- Delivery Specialist -->
          <span style="color:var(--triarq-color-text-secondary);overflow:hidden;
                       text-overflow:ellipsis;white-space:nowrap;"
                [title]="cycle.assigned_ds_display_name ?? ''">
            <span *ngIf="cycle.assigned_ds_display_name">{{ cycle.assigned_ds_display_name }}</span>
            <span *ngIf="!cycle.assigned_ds_display_name"
                  style="font-style:italic;font-size:10px;">—</span>
          </span>

          <!-- Capability Builder -->
          <span style="color:var(--triarq-color-text-secondary);overflow:hidden;
                       text-overflow:ellipsis;white-space:nowrap;"
                [title]="cycle.assigned_cb_display_name ?? ''">
            <span *ngIf="cycle.assigned_cb_display_name">{{ cycle.assigned_cb_display_name }}</span>
            <span *ngIf="!cycle.assigned_cb_display_name"
                  style="font-style:italic;font-size:10px;">—</span>
          </span>

          <!-- Condensed gate track -->
          <div (click)="$event.stopPropagation()">
            <app-stage-track
              [currentStageId]="cycle.current_lifecycle_stage"
              [gateStateMap]="buildGateStateMap(cycle)"
              displayMode="condensed"
            ></app-stage-track>
          </div>

          <!-- Pilot Start Date (go_to_deploy milestone) -->
          <span [style.color]="dateColor(cycle, 'go_to_deploy')"
                style="font-size:var(--triarq-text-small);">
            {{ dateDisplay(cycle, 'go_to_deploy') }}
          </span>

          <!-- Production Release Date (go_to_release milestone) -->
          <span [style.color]="dateColor(cycle, 'go_to_release')"
                style="font-size:var(--triarq-text-small);">
            {{ dateDisplay(cycle, 'go_to_release') }}
          </span>

          <!-- Drill-down arrow -->
          <span style="color:var(--triarq-color-text-secondary);">›</span>
        </div>
      </div>

      <!-- ── Empty states ─────────────────────────────────────────────────── -->
      <div *ngIf="!loading && !loadError && filtered.length === 0"
           style="padding:var(--triarq-space-xl) 0;text-align:center;">

        <!-- State 1: No Division assignment — user can't see any cycles yet -->
        <div *ngIf="divisionChecked && !hasDivision">
          <div style="font-size:48px;margin-bottom:var(--triarq-space-sm);">◫</div>
          <div style="font-weight:500;color:var(--triarq-color-text-primary);margin-bottom:8px;">
            No Division assignment yet
          </div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                      max-width:440px;margin:0 auto;line-height:1.6;">
            Delivery Cycles are scoped to Divisions — you need to be assigned to at least
            one Division before cycles appear here.
          </div>
          <div style="margin-top:var(--triarq-space-sm);font-size:var(--triarq-text-small);
                      color:var(--triarq-color-text-secondary);">
            Contact your administrator to be assigned to a Division.
          </div>
        </div>

        <!-- State 2: Has Division, no cycles at all -->
        <div *ngIf="hasDivision && cycles.length === 0">
          <div style="font-weight:500;color:var(--triarq-color-text-primary);margin-bottom:8px;">
            No active Delivery Cycles in your Divisions
          </div>
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);
                      max-width:440px;margin:0 auto;line-height:1.6;">
            <span *ngIf="canCreateCycle">
              Use "+ New Cycle" above to create the first one. A Delivery Cycle represents
              a scoped unit of work moving through the 12-stage lifecycle. You'll need an
              active Workstream — if none exist, go to
              <a routerLink="/admin/workstreams"
                 style="color:var(--triarq-color-primary);">Admin → Workstreams</a> first.
            </span>
            <span *ngIf="!canCreateCycle">
              No cycles have been created yet in your Divisions. A DS, Phil, or Admin user
              can create cycles from this screen.
            </span>
          </div>
        </div>

        <!-- State 3: Cycles exist but filters exclude all results -->
        <div *ngIf="hasDivision && cycles.length > 0">
          <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
            No cycles match the selected filters.
            <span (click)="clearFilters()"
                  style="color:var(--triarq-color-primary);cursor:pointer;
                         text-decoration:underline;margin-left:4px;">
              Clear filters
            </span>
            to see all {{ cycles.length }} cycle{{ cycles.length === 1 ? '' : 's' }}.
          </div>
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
    </div>
  `
})
export class DeliveryCycleDashboardComponent implements OnInit, OnDestroy {
  private profileSub?: Subscription;

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
        // Most cycles are created by their own DS — this eliminates a required picker call for the common case.
        if (role === 'ds' && p?.id && p?.display_name) {
          this.autoAssignedDsUserId      = p.id;
          this.autoAssignedDsDisplayName = p.display_name;
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
    if (typeof saved['filterDs']         === 'string') { this.filterDs         = saved['filterDs']; }
    if (typeof saved['filterCb']         === 'string') { this.filterCb         = saved['filterCb']; }
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

  applyFilters(): void {
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
    this.saveScreenState();
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.filterStage           = '';
    this.filterTier            = '';
    this.filterWorkstream      = '';
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

  tierLabel(tier: TierClassification): string {
    return tier === 'tier_1' ? 'T1' : tier === 'tier_2' ? 'T2' : 'T3';
  }

  tierPillBg(tier: TierClassification): string {
    return tier === 'tier_1' ? '#e3f2fd' : tier === 'tier_2' ? '#f3e5f5' : '#e8f5e9';
  }

  stagePillBg(stage: LifecycleStage): string {
    if (stage === 'COMPLETE')  { return '#e8f5e9'; }
    if (stage === 'CANCELLED') { return '#fdecea'; }
    if (stage === 'ON_HOLD')   { return '#fff8e1'; }
    return 'var(--triarq-color-background-subtle)';
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

  ngOnDestroy(): void {
    this.profileSub?.unsubscribe();
  }
}
