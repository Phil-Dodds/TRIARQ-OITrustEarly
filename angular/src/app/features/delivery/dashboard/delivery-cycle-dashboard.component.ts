// delivery-cycle-dashboard.component.ts — DeliveryCycleDashboardComponent
// Route: /delivery
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

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule }       from '@angular/common';
import { RouterModule }       from '@angular/router';
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
import {
  DeliveryCycle,
  Division,
  DeliveryWorkstream,
  TierClassification,
  LifecycleStage,
  GateName,
  GateStateMap
} from '../../../core/types/database';

const GATE_LABELS: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, IonicModule, StageTrackComponent],
  template: `
    <div style="max-width:1200px;margin:var(--triarq-space-2xl) auto;padding:0 var(--triarq-space-md);">

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

      <!-- ── Create form ──────────────────────────────────────────────────── -->
      <div *ngIf="showCreateForm" class="oi-card"
           style="margin-bottom:var(--triarq-space-md);padding:var(--triarq-space-md);">
        <h4 style="margin:0 0 4px 0;font-size:var(--triarq-text-body);">New Delivery Cycle</h4>
        <p style="margin:0 0 var(--triarq-space-sm) 0;font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);">
          The cycle starts in Brief stage. Set a title that describes the deliverable,
          not the team or initiative name.
        </p>
        <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
          <div style="display:grid;gap:var(--triarq-space-sm);grid-template-columns:3fr 2fr 1fr;">
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
            <div>
              <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
                Delivery Workstream
                <span style="font-weight:400;color:var(--triarq-color-text-secondary);"> — recommended</span>
              </label>
              <select formControlName="workstream_id" class="oi-input">
                <option value="">— Assign later —</option>
                <option *ngFor="let ws of activeWorkstreams" [value]="ws.workstream_id">
                  {{ ws.workstream_name }}
                </option>
              </select>
              <div style="font-size:var(--triarq-text-caption);color:var(--triarq-color-text-secondary);margin-top:3px;">
                Required before Brief Review gate. Can be assigned after creation.
              </div>
              <div *ngIf="activeWorkstreams.length === 0"
                   style="color:var(--triarq-color-sunray,#f5a623);font-size:var(--triarq-text-small);margin-top:2px;">
                No active Workstreams found. Go to
                <a routerLink="/admin/workstreams" style="color:var(--triarq-color-sunray,#f5a623);">Admin → Workstreams</a>
                to create and activate one.
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
                Tier is required. Tier is set at Brief stage and locked thereafter.
              </div>
            </div>
          </div>
          <div style="margin-top:var(--triarq-space-sm);max-width:400px;">
            <label style="display:block;font-size:var(--triarq-text-small);margin-bottom:4px;">
              Owner Division *
            </label>
            <select formControlName="division_id" class="oi-input">
              <option value="">— Select Division —</option>
              <option *ngFor="let d of divisions" [value]="d.id">{{ d.division_name }}</option>
            </select>
          </div>
          <div style="margin-top:var(--triarq-space-sm);display:flex;gap:var(--triarq-space-sm);align-items:center;">
            <button type="submit" class="oi-btn-primary"
                    [disabled]="createForm.invalid || creating">
              {{ creating ? 'Creating…' : 'Create Cycle' }}
            </button>
            <div *ngIf="createError"
                 style="font-size:var(--triarq-text-small);">
              <span style="color:var(--triarq-color-error);font-weight:500;">{{ createError }}</span>
              <span style="color:var(--triarq-color-text-secondary);margin-left:6px;">
                Check that the Workstream is active and you have Division access.
              </span>
            </div>
          </div>
        </form>
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

        <span *ngIf="filterStage || filterTier || filterWorkstream"
              (click)="clearFilters()"
              style="font-size:var(--triarq-text-small);color:var(--triarq-color-primary);
                     cursor:pointer;text-decoration:underline;">
          Clear filters
        </span>
      </div>

      <!-- ── Loading ──────────────────────────────────────────────────────── -->
      <div *ngIf="loading"
           style="text-align:center;padding:var(--triarq-space-xl);
                  color:var(--triarq-color-text-secondary);">
        Loading cycles…
      </div>

      <!-- ── Table header with sort ───────────────────────────────────────── -->
      <div *ngIf="!loading && filtered.length > 0"
           style="display:grid;grid-template-columns:3fr 1fr 2fr 1fr 110px 130px 130px 24px;
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
        <span>Gate Track</span>
        <span>Pilot Start Date</span>
        <span>Release Date</span>
        <span></span>
      </div>

      <!-- ── Cycle rows ───────────────────────────────────────────────────── -->
      <div *ngFor="let cycle of filtered">
        <div
          [routerLink]="['/delivery', cycle.delivery_cycle_id]"
          style="display:grid;grid-template-columns:3fr 1fr 2fr 1fr 110px 130px 130px 24px;
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
      <div *ngIf="!loading && filtered.length === 0"
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
export class DeliveryCycleDashboardComponent implements OnInit {

  cycles:            DeliveryCycle[]       = [];
  filtered:          DeliveryCycle[]       = [];
  workstreams:       DeliveryWorkstream[]  = [];
  activeWorkstreams: DeliveryWorkstream[]  = [];
  divisions:         Division[]            = [];
  // D-166: user's directly-assigned divisions for the division filter dropdown
  userDivisions:     Division[]            = [];
  loading            = false;
  hasDivision        = true;   // assumed true until division check completes
  divisionChecked    = false;
  canCreateCycle     = false;
  showCreateForm     = false;
  creating           = false;
  createError        = '';
  createForm!:       FormGroup;

  // Filter state (ngModel bindings — not reactive form controls)
  filterStage:              string  = '';
  filterTier:               string  = '';
  // '__none__' = show cycles with no workstream assigned (D-167)
  filterWorkstream:         string  = '';
  // D-166: division filter — server-side reload when changed
  filterDivision:           string  = '';
  includeChildDivisions:    boolean = false;

  // Sort state
  sortField: 'cycle_title' | 'current_lifecycle_stage' | 'tier_classification' = 'cycle_title';
  sortDir:   'asc' | 'desc' = 'asc';

  // Expose constants to template
  readonly STAGE_LABEL_MAP = STAGE_LABEL_MAP;

  readonly stages: LifecycleStage[] = [
    'BRIEF','DESIGN','SPEC','BUILD','VALIDATE','PILOT','UAT','RELEASE','OUTCOME','COMPLETE','ON_HOLD','CANCELLED'
  ];

  constructor(
    private readonly delivery: DeliveryService,
    private readonly mcp:      McpService,
    private readonly profile:  UserProfileService,
    private readonly fb:       FormBuilder,
    private readonly cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // D-165: workstream_id is optional at creation — no Validators.required.
    this.createForm = this.fb.group({
      cycle_title:         ['', Validators.required],
      workstream_id:       [''],
      tier_classification: ['', Validators.required],
      division_id:         ['', Validators.required]
    });
    const role = this.profile.getCurrentProfile()?.system_role;
    this.canCreateCycle = role === 'ds' || role === 'phil' || role === 'admin';
    this.checkUserDivisions();
    this.loadWorkstreams();
    this.loadDivisions();
    this.loadCycles();
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

  private loadDivisions(): void {
    this.mcp.call<Division[]>('division', 'list_divisions', {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.divisions = Array.isArray(res.data) ? res.data : [];
          this.cdr.markForCheck();
        }
      },
      error: () => {}
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
          this.cycles = Array.isArray(res.data) ? res.data : [];
          this.applyFilters();
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

  // Called when division filter or include_child_divisions changes — reloads from server
  onDivisionFilterChange(): void {
    this.loadCycles();
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
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.filterStage           = '';
    this.filterTier            = '';
    this.filterWorkstream      = '';
    // Division filter requires server reload — only clear client-side filters here.
    // Division is intentionally NOT cleared by "Clear filters" (it's a scope selection,
    // not a content filter). User explicitly changes division via its own dropdown.
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.filterStage           = '';
    this.filterTier            = '';
    this.filterWorkstream      = '';
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
    if (this.showCreateForm) { this.createForm.reset(); }
    this.cdr.markForCheck();
  }

  submitCreate(): void {
    if (this.createForm.invalid) { return; }
    this.creating    = true;
    this.createError = '';
    this.cdr.markForCheck();

    // D-165: workstream_id is optional at creation. Only include if selected.
    const workstreamId = this.createForm.value.workstream_id as string | '';
    this.delivery.createCycle({
      cycle_title:         this.createForm.value.cycle_title         as string,
      ...(workstreamId ? { workstream_id: workstreamId } : {}),
      tier_classification: this.createForm.value.tier_classification as TierClassification,
      division_id:         this.createForm.value.division_id         as string
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.showCreateForm = false;
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
}
