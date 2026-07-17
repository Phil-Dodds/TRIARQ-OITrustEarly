// initiative-status-dashboard.component.ts — Contract 32 (WS4),
// redesigned Contract 36 (D-510 columns, D-511 person filters, D-512 meeting run).
// Columns: Name · Division short (hidden on single-division view) · Next Gate ·
// Target Date · Team (grid parity) · Updated By (merged, chain-root age) ·
// Escalation · Confidence · Needs Review · View Status.
// Offered sorts (D-512): Next Gate Target Date asc; EPO then Target Date.
// Prev/Next panel navigation walks the in-effect filter + sort. 10s polling
// via status_dashboard_changed_since while the route is active (D-499/CC-021).
//
// Full-rewrite note (D-252): Contract 36 touched every zone — recorded as a
// CC-decision; preserved behaviors: S-010/S-011/S-012 filter panel, D-171
// memory, S-036 header sort, D-346 skeleton, S-018 row tap → detail.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { IonicModule }     from '@ionic/angular';
import { Subject, interval } from 'rxjs';
import { takeUntil }       from 'rxjs/operators';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ScreenStateService, SCREEN_KEYS } from '../../../core/services/screen-state.service';
import { DeliveryCycleDetailComponent } from '../detail/delivery-cycle-detail.component';
import { InitiativeStatusUpdatePanelComponent } from '../status-panel/initiative-status-update-panel.component';
import { InitiativeStatusDashboardRow } from '../../../core/types/initiative-status';

type DashSort =
  | 'initiative' | 'division' | 'next_gate' | 'target_date'
  | 'updated_by' | 'epo_target' | 'epo_gate_division' | 'epo_div_gate_target';

/** Lifecycle order for gate sorts — Brief Review first, never alphabetical. */
const GATE_SORT_ORDER: Record<string, number> = {
  brief_review: 0, go_to_build: 1, go_to_deploy: 2, go_to_release: 3, close_review: 4
};

const POLL_INTERVAL_MS = 10000;   // D-512 / D-499

const CONFIDENCE = {
  not_started: { label: 'Not Started', color: '#9E9E9E' },
  on_track:    { label: 'On Track',    color: '#22c55e' },
  at_risk:     { label: 'At Risk',     color: '#F2A620' },
  behind:      { label: 'Behind',      color: '#E96127' },
  complete:    { label: 'Complete',    color: '#257099' }
} as Record<string, { label: string; color: string }>;

type PersonRole = 'dcs' | 'epo' | 'dol';

@Component({
  selector: 'app-initiative-status-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, DeliveryCycleDetailComponent, InitiativeStatusUpdatePanelComponent],
  template: `
    <div class="oi-page" style="max-width:1400px;margin:0 auto;padding:var(--triarq-space-lg);">

      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <h2 class="isd-title">Initiative Status Dashboard</h2>
          <p class="isd-subtitle">Org-wide initiative status for meeting-ready triage — latest update, confidence, escalation, and why each row needs review. Live: changes made anywhere appear within ~10 seconds.</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <!-- D-512: two offered sorts for running the meeting -->
          <select class="isd-sort-select" [value]="offeredSortValue" (change)="applyOfferedSort($any($event.target).value)">
            <option value="">Sort…</option>
            <option value="target_date">Next Gate Target Date</option>
            <option value="epo_target">EPO · Target Date</option>
            <option value="epo_gate_division">EPO · Next Gate · Division</option>
            <option value="epo_div_gate_target">EPO · Division · Next Gate · Target Date</option>
          </select>
          <label class="isd-toggle">
            <input type="checkbox" [checked]="needsReviewOnly" (change)="toggleNeedsReview()" />
            <span>Needs Review only</span>
          </label>
          <button class="oi-btn-secondary isd-sm" (click)="openFilters()">
            Filters <span *ngIf="activeFilterCount" class="isd-badge">{{ activeFilterCount }}</span>
          </button>
        </div>
      </div>

      <!-- Active filter chips (S-012; D-511 chip displays match the grid standard) -->
      <div *ngIf="activeFilterCount" class="isd-chips">
        <span class="isd-chip" *ngFor="let id of selectedDivisionIds">
          Division: {{ divisionLabel(id) }}
          <span class="isd-chip-x" (click)="removeDivision(id)">✕</span>
        </span>
        <span class="isd-chip" *ngFor="let g of selectedGates">
          Next Gate: {{ gateOptionLabel(g) }}
          <span class="isd-chip-x" (click)="removeGate(g)">✕</span>
        </span>
        <span class="isd-chip" *ngIf="personFilter.dcs">
          DCS: {{ personLabel('dcs', personFilter.dcs) }}
          <span class="isd-chip-x" (click)="clearPerson('dcs')">✕</span>
        </span>
        <span class="isd-chip" *ngIf="personFilter.epo">
          EPO: {{ personLabel('epo', personFilter.epo) }}
          <span class="isd-chip-x" (click)="clearPerson('epo')">✕</span>
        </span>
        <span class="isd-chip" *ngIf="personFilter.dol">
          DOL: {{ personLabel('dol', personFilter.dol) }}
          <span class="isd-chip-x" (click)="clearPerson('dol')">✕</span>
        </span>
      </div>

      <!-- D-346 Context B skeleton -->
      <div *ngIf="loading" class="oi-card" style="margin-top:12px;">
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
      </div>

      <div *ngIf="!loading" class="oi-card" style="margin-top:12px;overflow-x:auto;">
        <div *ngIf="visibleRows.length === 0" class="isd-empty">No initiatives match the current view.</div>
        <table *ngIf="visibleRows.length" class="isd-table">
          <thead>
            <tr>
              <!-- D-510: Division short name (left of Initiative); hidden when the view resolves to one division -->
              <th *ngIf="showDivisionColumn" class="isd-sortable isd-fit" [class.isd-sorted]="sortField==='division'" (click)="setSort('division')">Division{{ activeArrow('division') }}</th>
              <th class="isd-sortable isd-name" [class.isd-sorted]="sortField==='initiative'" (click)="setSort('initiative')">Initiative Name{{ activeArrow('initiative') }}</th>
              <th class="isd-sortable isd-fit" [class.isd-sorted]="sortField==='next_gate'" (click)="setSort('next_gate')">Next Gate{{ activeArrow('next_gate') }}</th>
              <th class="isd-sortable isd-fit" [class.isd-sorted]="sortField==='target_date'" (click)="setSort('target_date')">Target Date{{ activeArrow('target_date') }}</th>
              <th>Team</th>
              <th class="isd-sortable" [class.isd-sorted]="sortField==='updated_by'" (click)="setSort('updated_by')">Updated By{{ activeArrow('updated_by') }}</th>
              <th>Escalation</th>
              <th>Confidence</th>
              <th>Needs Review Reason</th>
              <th>View Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of visibleRows; trackBy: trackByRow">
              <td *ngIf="showDivisionColumn" class="isd-fit">{{ r.division_display_name_short || '—' }}</td>
              <td class="isd-name"><a class="isd-link" (click)="openDetail(r.initiative_id)">{{ r.cycle_title }}</a></td>
              <!-- Chip on its own line: inline it inflates the whole column's nowrap width -->
              <td class="isd-fit">
                <div>{{ r.next_gate_label || '—' }}</div>
                <div *ngIf="r.next_gate_pending_approval"><span class="isd-pending-chip">Pending Approval</span></div>
              </td>
              <td class="isd-fit">
                <span *ngIf="r.next_gate_target_date"
                      [class.isd-overdue]="isPastDate(r.next_gate_target_date)">{{ gateDate(r.next_gate_target_date) }}</span>
                <span *ngIf="!r.next_gate_target_date">—</span>
              </td>
              <!-- D-510: Team — grid-parity role chips -->
              <td class="isd-team">
                <span *ngIf="r.assigned_dcs_display_name" class="isd-team-chip" [title]="'DCS: ' + r.assigned_dcs_display_name">{{ r.assigned_dcs_display_name }}</span>
                <span *ngIf="r.assigned_epo_display_name" class="isd-team-chip" [title]="'EPO: ' + r.assigned_epo_display_name">{{ r.assigned_epo_display_name }}</span>
                <span *ngIf="r.assigned_dol_display_name" class="isd-team-chip" [title]="'DOL: ' + r.assigned_dol_display_name">{{ r.assigned_dol_display_name }}</span>
                <span *ngIf="!r.assigned_dcs_display_name && !r.assigned_epo_display_name && !r.assigned_dol_display_name">—</span>
              </td>
              <!-- D-510 merged Updated By: trio author = initials; non-trio = full name (external emphasis);
                   age from chain root on its own line so "3 days" never splits -->
              <td class="isd-fit">
                <ng-container *ngIf="r.saved_at; else neverUpdated">
                  <div>
                    <span *ngIf="r.is_trio_author" class="isd-author-initials" [title]="r.saved_by_name || ''">{{ initials(r.saved_by_name) }}</span>
                    <span *ngIf="!r.is_trio_author" class="isd-author-external">{{ r.saved_by_name || 'Unknown' }}</span>
                  </div>
                  <div class="isd-age">{{ ageLabel(r.root_saved_at || r.saved_at) }}</div>
                </ng-container>
                <ng-template #neverUpdated><span class="isd-never">Never</span></ng-template>
              </td>
              <td>
                <span *ngIf="r.escalation_needed" class="isd-esc">Yes</span>
                <span *ngIf="!r.escalation_needed">—</span>
              </td>
              <td>
                <ng-container *ngIf="confidenceOf(r) as cf; else noConf">
                  <span class="isd-dot" [style.background]="cf.color"></span> {{ cf.label }}
                </ng-container>
                <ng-template #noConf>—</ng-template>
              </td>
              <td>
                <span *ngIf="r.needs_review_reasons.length === 0">—</span>
                <!-- CC-38-42: banded block — same grammar as the grid headline. -->
                <!-- CC-38-44: no title line; one bolded bullet per reason. -->
                <div *ngIf="r.needs_review_reasons.length > 0"
                     class="isd-reason-band"
                     [class.isd-band-red]="reasonBandRed(r.needs_review_reasons)"
                     [class.isd-band-amber]="!reasonBandRed(r.needs_review_reasons)">
                  <div *ngFor="let reason of r.needs_review_reasons"
                       class="isd-reason-line"
                       [style.color]="reasonIsRed(reason) ? '#791F1F' : '#7A5A2A'">• <strong>{{ reason }}</strong></div>
                </div>
              </td>
              <td><button class="oi-btn-secondary isd-sm" (click)="openStatus(r.initiative_id, r.cycle_title)">View Status</button></td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="visibleRows.length" class="isd-foot">
          {{ needsReviewOnly ? (visibleRows.length + ' of ' + rows.length + ' initiatives') : (visibleRows.length + ' initiatives') }}
        </div>
      </div>
    </div>

    <!-- Filter panel (S-010/S-011; D-511 person filters per the grid pattern) -->
    <div *ngIf="filterOpen" class="oi-scrim oi-scrim-detail" (click)="filterOpen = false"></div>
    <div *ngIf="filterOpen" class="oi-side-panel oi-side-detail" role="dialog" aria-label="Filters">
      <div class="oi-side-head">
        <strong>Filters</strong>
        <button class="oi-close-btn" (click)="filterOpen = false" aria-label="Close">✕</button>
      </div>
      <div class="oi-side-body">
        <div class="oi-zone-title">Division</div>
        <label class="isd-check" *ngFor="let d of divisionOptions">
          <input type="checkbox" [checked]="draftDivisionIds.includes(d.id)" (change)="toggleDraft(d.id)" />
          <span>{{ d.name }}</span>
        </label>
        <div *ngIf="divisionOptions.length === 0" class="oi-zone-explain">No divisions in the current results.</div>

        <div class="oi-zone-title" style="margin-top:14px;">Next Gate</div>
        <label class="isd-check" *ngFor="let g of gateFilterOptions">
          <input type="checkbox" [checked]="draftGates.includes(g.name)" (change)="toggleDraftGate(g.name)" />
          <span>{{ g.label }}</span>
        </label>

        <!-- D-511: EPO / DOL / DCS person filters (grid pattern: single-select per role) -->
        <ng-container *ngFor="let role of personRoles">
          <div class="oi-zone-title" style="margin-top:14px;">{{ role.toUpperCase() }}</div>
          <label class="isd-check">
            <input type="radio" [name]="'pf-' + role" [checked]="!draftPerson[role]" (change)="draftPerson[role] = ''" />
            <span>All</span>
          </label>
          <label class="isd-check" *ngFor="let p of personOptions(role)">
            <input type="radio" [name]="'pf-' + role" [checked]="draftPerson[role] === p.id" (change)="draftPerson[role] = p.id" />
            <span>{{ p.name }}</span>
          </label>
        </ng-container>
      </div>
      <div class="oi-side-foot oi-side-foot-split">
        <button class="oi-btn-secondary" (click)="clearFilters()">Clear all</button>
        <button class="oi-btn-primary" (click)="applyFilters()">Apply filters</button>
      </div>
    </div>

    <!-- Row-tap detail — standard right panel (S-006), fixed overlay + scrim.
         Close refreshes SILENTLY (no skeleton, rows merge in place via trackBy)
         so viewing an initiative never flashes the whole grid (Phil 2026-07-13). -->
    <div *ngIf="detailCycleId" class="oi-scrim oi-scrim-detail" (click)="detailCycleId = null; load(true)"></div>
    <div *ngIf="detailCycleId"
         style="position:fixed;top:0;right:0;width:60%;max-width:980px;height:100vh;background:#fff;
                border-left:1px solid #E0E0E0;overflow-y:auto;z-index:1000;">
      <app-delivery-cycle-detail
        [cycleId]="detailCycleId"
        (close)="detailCycleId = null; load(true)">
      </app-delivery-cycle-detail>
    </div>

    <!-- View Status panel — D-512: Prev/Next walk the in-effect filter + sort;
         act-from-panel (Update Status / Edit / Acknowledge) lives inside. -->
    <app-initiative-status-update-panel
      #statusPanel
      *ngIf="viewId"
      [initiativeId]="viewId"
      [initiativeName]="viewName"
      mode="read"
      [hasPrev]="viewIndex > 0"
      [hasNext]="viewIndex >= 0 && viewIndex < visibleRows.length - 1"
      (prev)="stepView(-1)"
      (next)="stepView(1)"
      (saved)="load(true)"
      (acknowledged)="load(true)"
      (viewInitiative)="openDetail(viewId!); viewId = null"
      (cancelled)="viewId = null">
    </app-initiative-status-update-panel>
  `,
  styles: [`
    :host { display:block; }
    .isd-toggle { display:inline-flex; align-items:center; gap:6px; font-size:13px; cursor:pointer; }
    .isd-sm { font-size:11px; padding:3px 8px; }
    .isd-badge { background:var(--triarq-color-primary,#257099); color:#fff; border-radius:999px; padding:0 6px; font-size:11px; }
    .isd-sort-select { border:1px solid var(--triarq-color-border,#e0e0e0); border-radius:5px; padding:4px 8px; font-size:12px; background:#fff; }
    .isd-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .isd-chip { background:var(--triarq-color-fog,#f4f4f4); border-radius:999px; padding:2px 10px; font-size:12px; display:inline-flex; align-items:center; gap:6px; }
    .isd-chip-x { cursor:pointer; color:var(--triarq-color-text-secondary); }
    .isd-table { width:100%; border-collapse:collapse; font-size:13px; }
    .isd-title { font-family:'Gill Sans', var(--triarq-font-family, Roboto), sans-serif; font-weight:700;
                 color:var(--triarq-color-deep-navy,#1a2b4a); font-size:28px; margin:0; }
    .isd-subtitle { font-size:11px; font-style:italic; color:#5A5A5A; margin:4px 0 0; max-width:640px; line-height:1.5; }
    .isd-never { font-style:italic; color:#5A5A5A; }
    .isd-table th { text-align:left; padding:8px; border-bottom:1px solid var(--triarq-color-border,#e0e0e0); color:var(--triarq-color-text-secondary); font-weight:500; white-space:nowrap; }
    .isd-table th.isd-sortable { cursor:pointer; user-select:none; }
    .isd-table th.isd-sortable.isd-sorted { color:var(--triarq-color-primary,#257099); font-weight:600; }
    .isd-table th.isd-sortable:not(.isd-sorted):hover::after { content:' ↕'; opacity:0.5; }
    .isd-table td { padding:8px; border-bottom:1px solid var(--triarq-color-fog,#f4f4f4); vertical-align:top; }
    .isd-link { color:var(--triarq-color-primary,#257099); cursor:pointer; }
    .isd-esc { background:var(--triarq-color-error,#E96127); color:#fff; border-radius:999px; padding:1px 8px; font-size:11px; }
    .isd-dot { display:inline-block; width:10px; height:10px; border-radius:50%; vertical-align:middle; }
    .isd-reason-band { padding:6px 10px; max-width:340px; }
    .isd-band-red   { border-left:3px solid #A32D2D; background:rgba(211,47,47,0.09); }
    .isd-band-amber { border-left:3px solid #BA7517; background:rgba(242,166,32,0.12); }
    .isd-reason-band .isd-reason-title { font-size:12px; font-weight:500; }
    .isd-band-red .isd-reason-title    { color:#791F1F; }
    .isd-band-amber .isd-reason-title  { color:#633806; }
    .isd-reason-line { font-size:11.5px; margin-top:1px; white-space:nowrap; }
    .isd-reason-line strong { font-weight:600; }
    .isd-empty { padding:16px; color:#5A5A5A; font-style:italic; }
    .isd-foot { padding:8px; font-size:12px; color:var(--triarq-color-text-secondary); }
    .isd-check { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:13px; }
    .isd-overdue { color:var(--triarq-color-error,#E96127); font-weight:600; }
    .isd-pending-chip { display:inline-block; background:#FFF8E1; color:#B26A00; border:1px solid #F2A620;
                        border-radius:999px; padding:0 8px; font-size:10px; font-weight:600; margin-left:6px; white-space:nowrap; }
    .isd-team { max-width:180px; }
    .isd-team-chip { display:inline-block; background:#F0F5F8; color:#257099; border-radius:999px; padding:1px 8px; font-size:11px; margin:0 4px 3px 0; white-space:nowrap; }
    .isd-author-initials { background:#E3F0F7; color:#257099; border-radius:999px; padding:1px 8px; font-size:11px; font-weight:600; }
    .isd-author-external { font-weight:600; color:#1A1A1A; }
    .isd-age { color:var(--triarq-color-text-secondary); font-size:12px; margin-top:3px; white-space:nowrap; }
    /* Shrink-to-content columns — collapses the dead width between Next Gate and Target Date. */
    .isd-table th.isd-fit, .isd-table td.isd-fit { width:1%; white-space:nowrap; }
    /* Initiative Name claims the freed width so shrink columns pack together. */
    .isd-table th.isd-name, .isd-table td.isd-name { width:30%; min-width:220px; }
    .isd-pending-chip { margin-left:0; margin-top:3px; }
  `]
})
export class InitiativeStatusDashboardComponent implements OnInit, OnDestroy {
  loading = false;
  rows: InitiativeStatusDashboardRow[] = [];
  needsReviewOnly = false;

  // Division filter (S-010/S-011/S-012, memory D-171).
  filterOpen = false;
  selectedDivisionIds: string[] = [];
  draftDivisionIds: string[] = [];

  // Next Gate filter (Phil 2026-07-13) — multi-select on the canonical five.
  selectedGates: string[] = [];
  draftGates:    string[] = [];
  readonly gateFilterOptions: { name: string; label: string }[] = [
    { name: 'brief_review',  label: 'Brief Review'  },
    { name: 'go_to_build',   label: 'Go to Build'   },
    { name: 'go_to_deploy',  label: 'Go to Deploy'  },
    { name: 'go_to_release', label: 'Go to Release' },
    { name: 'close_review',  label: 'Close Review'  }
  ];

  // D-511: person filters (single-select per role, grid pattern).
  readonly personRoles: PersonRole[] = ['epo', 'dol', 'dcs'];
  personFilter: Record<PersonRole, string> = { dcs: '', epo: '', dol: '' };
  draftPerson:  Record<PersonRole, string> = { dcs: '', epo: '', dol: '' };

  sortField: DashSort = 'initiative';
  sortDir: 'asc' | 'desc' = 'asc';

  detailCycleId: string | null = null;
  viewId: string | null = null;
  viewName = '';

  @ViewChild('statusPanel') statusPanel?: InitiativeStatusUpdatePanelComponent;

  // D-512 polling state.
  private destroy$ = new Subject<void>();
  private lastCheckedAt: string | null = null;
  private pollInFlight = false;

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.screenState.restore(SCREEN_KEYS.INITIATIVE_STATUS_DASHBOARD).then(s => {
      if (s?.filter_state?.['division_ids']) {
        this.selectedDivisionIds = (s.filter_state['division_ids'] as string[]) || [];
      }
      if (Array.isArray(s?.filter_state?.['gate_names'])) {
        this.selectedGates = (s!.filter_state['gate_names'] as string[]).filter(x => typeof x === 'string');
      }
      const pf = s?.filter_state?.['person_filter'] as Record<PersonRole, string> | undefined;
      if (pf) { this.personFilter = { dcs: pf.dcs || '', epo: pf.epo || '', dol: pf.dol || '' }; }
      if (s?.sort_state) {
        this.sortField = (s.sort_state['field'] as DashSort) ?? this.sortField;
        this.sortDir = (s.sort_state['dir'] as 'asc' | 'desc') ?? this.sortDir;
      }
      this.load();
    });

    // D-512/D-499: poll only while this route is active (component destroyed on leave).
    interval(POLL_INTERVAL_MS).pipe(takeUntil(this.destroy$)).subscribe(() => this.poll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private poll(): void {
    if (this.pollInFlight || this.loading) { return; }
    this.pollInFlight = true;
    this.delivery.statusDashboardChangedSince(
      this.lastCheckedAt,
      this.selectedDivisionIds.length ? this.selectedDivisionIds : undefined
    ).subscribe({
      next: (res) => {
        this.pollInFlight = false;
        if (res.success && res.data) {
          if (res.data.changed) {
            this.load(/*silent*/ true);
            // Open View Status panel refreshes its own initiative on the same signal.
            this.statusPanel?.refresh();
          }
          this.lastCheckedAt = res.data.checked_at;
        }
      },
      error: () => { this.pollInFlight = false; }
    });
  }

  load(silent = false): void {
    if (!silent) { this.loading = true; this.cdr.markForCheck(); }
    this.delivery.getInitiativeStatusDashboard({ needs_review_only: this.needsReviewOnly }).subscribe({
      next: (res) => {
        // Silent merge (CC-021 mechanics): row array swaps; trackBy keeps DOM
        // rows stable so focus/scroll survive.
        this.rows = (res.success && res.data) ? res.data : [];
        if (!this.lastCheckedAt) { this.lastCheckedAt = new Date().toISOString(); }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.rows = []; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  trackByRow(_i: number, r: InitiativeStatusDashboardRow): string { return r.initiative_id; }

  toggleNeedsReview(): void { this.needsReviewOnly = !this.needsReviewOnly; this.load(); }

  // ── Filters ─────────────────────────────────────────────────────────────────
  get divisionOptions(): { id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const r of this.rows) { if (r.division_id) { seen.set(r.division_id, r.division_name || r.division_id); } }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  divisionLabel(id: string): string {
    return this.divisionOptions.find(d => d.id === id)?.name || id;
  }

  /** Typed accessors for the role-keyed columns (avoids dynamic-index TS errors). */
  private personId(r: InitiativeStatusDashboardRow, role: PersonRole): string | null {
    switch (role) {
      case 'dcs': return r.assigned_dcs_user_id;
      case 'epo': return r.assigned_epo_user_id;
      case 'dol': return r.assigned_dol_user_id;
    }
  }
  private personName(r: InitiativeStatusDashboardRow, role: PersonRole): string | null {
    switch (role) {
      case 'dcs': return r.assigned_dcs_display_name;
      case 'epo': return r.assigned_epo_display_name;
      case 'dol': return r.assigned_dol_display_name;
    }
  }

  /** D-511: person options per role, derived from caller-scoped rows. */
  personOptions(role: PersonRole): { id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const r of this.rows) {
      const id   = this.personId(r, role);
      const name = this.personName(r, role);
      if (id && name) { seen.set(id, name); }
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  personLabel(role: PersonRole, id: string): string {
    return this.personOptions(role).find(p => p.id === id)?.name || id;
  }
  clearPerson(role: PersonRole): void {
    this.personFilter = { ...this.personFilter, [role]: '' };
    this.persistFilter();
    this.cdr.markForCheck();
  }

  toggleDraft(id: string): void {
    this.draftDivisionIds = this.draftDivisionIds.includes(id)
      ? this.draftDivisionIds.filter(x => x !== id)
      : [...this.draftDivisionIds, id];
  }
  toggleDraftGate(name: string): void {
    this.draftGates = this.draftGates.includes(name)
      ? this.draftGates.filter(x => x !== name)
      : [...this.draftGates, name];
  }
  gateOptionLabel(name: string): string {
    return this.gateFilterOptions.find(g => g.name === name)?.label || name;
  }
  applyFilters(): void {
    this.selectedDivisionIds = [...this.draftDivisionIds];
    this.selectedGates = [...this.draftGates];
    this.personFilter = { ...this.draftPerson };
    this.filterOpen = false;
    this.persistFilter();
  }
  clearFilters(): void {
    this.draftDivisionIds = [];
    this.draftGates = [];
    this.draftPerson = { dcs: '', epo: '', dol: '' };
  }
  removeDivision(id: string): void {
    this.selectedDivisionIds = this.selectedDivisionIds.filter(x => x !== id);
    this.persistFilter();
  }
  removeGate(name: string): void {
    this.selectedGates = this.selectedGates.filter(x => x !== name);
    this.persistFilter();
    this.cdr.markForCheck();
  }
  openFilters(): void {
    this.draftDivisionIds = [...this.selectedDivisionIds];
    this.draftGates = [...this.selectedGates];
    this.draftPerson = { ...this.personFilter };
    this.filterOpen = true;
  }
  get activeFilterCount(): number {
    return this.selectedDivisionIds.length + this.selectedGates.length +
      (this.personFilter.dcs ? 1 : 0) + (this.personFilter.epo ? 1 : 0) + (this.personFilter.dol ? 1 : 0);
  }
  private persistFilter(): void {
    this.screenState.save(SCREEN_KEYS.INITIATIVE_STATUS_DASHBOARD,
      { division_ids: this.selectedDivisionIds, gate_names: this.selectedGates, person_filter: this.personFilter },
      { field: this.sortField, dir: this.sortDir });
  }

  /** D-510: Division column hidden when the view resolves to a single division. */
  get showDivisionColumn(): boolean {
    if (this.selectedDivisionIds.length === 1) { return false; }
    const distinct = new Set(this.visibleRowsUnsorted.map(r => r.division_id));
    return distinct.size !== 1;
  }

  private get visibleRowsUnsorted(): InitiativeStatusDashboardRow[] {
    let out = this.rows;
    if (this.selectedDivisionIds.length) {
      out = out.filter(r => this.selectedDivisionIds.includes(r.division_id));
    }
    if (this.selectedGates.length) {
      out = out.filter(r => r.next_gate_name && this.selectedGates.includes(r.next_gate_name));
    }
    for (const role of this.personRoles) {
      const id = this.personFilter[role];
      if (id) { out = out.filter(r => this.personId(r, role) === id); }
    }
    return out;
  }

  get visibleRows(): InitiativeStatusDashboardRow[] {
    const out = this.visibleRowsUnsorted;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    const FAR_FUTURE = '9999-12-31';
    const EPOCH = '0000-01-01';
    const cmp = (a: InitiativeStatusDashboardRow, b: InitiativeStatusDashboardRow): number => {
      switch (this.sortField) {
        case 'initiative':  return (a.cycle_title || '').localeCompare(b.cycle_title || '') * dir;
        case 'division':    return (a.division_display_name_short || '').localeCompare(b.division_display_name_short || '') * dir;
        case 'next_gate':   return (a.next_gate_label || '').localeCompare(b.next_gate_label || '') * dir;
        // Offered sort (a): target date asc, blanks last.
        case 'target_date': return ((a.next_gate_target_date || FAR_FUTURE).localeCompare(b.next_gate_target_date || FAR_FUTURE)) * dir;
        // Offered sort (b): EPO, then target date.
        case 'epo_target': {
          const e = (a.assigned_epo_display_name || 'zzz').localeCompare(b.assigned_epo_display_name || 'zzz');
          if (e !== 0) { return e * dir; }
          return ((a.next_gate_target_date || FAR_FUTURE).localeCompare(b.next_gate_target_date || FAR_FUTURE)) * dir;
        }
        // Offered sort (c): EPO → Next Gate (lifecycle order) → Division.
        case 'epo_gate_division': {
          const e = (a.assigned_epo_display_name || 'zzz').localeCompare(b.assigned_epo_display_name || 'zzz');
          if (e !== 0) { return e * dir; }
          const g = this.gateRank(a) - this.gateRank(b);
          if (g !== 0) { return g * dir; }
          return (a.division_display_name_short || '').localeCompare(b.division_display_name_short || '') * dir;
        }
        // Offered sort (d): EPO → Division → Next Gate → Target Date.
        case 'epo_div_gate_target': {
          const e = (a.assigned_epo_display_name || 'zzz').localeCompare(b.assigned_epo_display_name || 'zzz');
          if (e !== 0) { return e * dir; }
          const d = (a.division_display_name_short || '').localeCompare(b.division_display_name_short || '');
          if (d !== 0) { return d * dir; }
          const g = this.gateRank(a) - this.gateRank(b);
          if (g !== 0) { return g * dir; }
          return ((a.next_gate_target_date || FAR_FUTURE).localeCompare(b.next_gate_target_date || FAR_FUTURE)) * dir;
        }
        // D-512: "Never updated" rows sort oldest under Updated By sort.
        case 'updated_by': {
          const ka = a.root_saved_at || a.saved_at || EPOCH;
          const kb = b.root_saved_at || b.saved_at || EPOCH;
          return ka.localeCompare(kb) * dir;
        }
      }
    };
    return [...out].sort(cmp);
  }

  setSort(field: DashSort): void {
    if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.persistFilter();
  }
  activeArrow(f: DashSort): string { return this.sortField === f ? (this.sortDir === 'asc' ? ' ↑' : ' ↓') : ''; }

  /** Gates rank in lifecycle order; rows with no next gate sort last. */
  private gateRank(r: InitiativeStatusDashboardRow): number {
    return r.next_gate_name != null ? (GATE_SORT_ORDER[r.next_gate_name] ?? 98) : 99;
  }

  /** D-512 offered sorts — dropdown maps to the offered sorts (asc). */
  private static readonly OFFERED_SORTS: DashSort[] =
    ['target_date', 'epo_target', 'epo_gate_division', 'epo_div_gate_target'];
  get offeredSortValue(): string {
    return InitiativeStatusDashboardComponent.OFFERED_SORTS.includes(this.sortField) && this.sortDir === 'asc'
      ? this.sortField : '';
  }
  applyOfferedSort(v: string): void {
    if (!InitiativeStatusDashboardComponent.OFFERED_SORTS.includes(v as DashSort)) { return; }
    this.sortField = v as DashSort;
    this.sortDir = 'asc';
    this.persistFilter();
    this.cdr.markForCheck();
  }

  // ── Panel navigation (D-512): walk visibleRows in the in-effect order ──────
  get viewIndex(): number {
    return this.viewId ? this.visibleRows.findIndex(r => r.initiative_id === this.viewId) : -1;
  }
  stepView(delta: number): void {
    const idx = this.viewIndex;
    if (idx < 0) { return; }
    const target = this.visibleRows[idx + delta];
    if (!target) { return; }
    this.viewId = target.initiative_id;
    this.viewName = target.cycle_title;
    this.cdr.markForCheck();
  }

  openDetail(id: string): void { this.detailCycleId = id; this.cdr.markForCheck(); }
  openStatus(id: string, name: string): void { this.viewId = id; this.viewName = name; this.cdr.markForCheck(); }

  confidenceOf(r: InitiativeStatusDashboardRow): { label: string; color: string } | null {
    const v = r.pilot_confidence || r.close_confidence;
    return v ? (CONFIDENCE[v] || null) : null;
  }
  initials(name: string | null): string {
    return (name || '').split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || '—';
  }
  /** D-510 age from chain root: "Today", "1 day", "X days". */
  ageLabel(iso: string): string {
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor(Date.now() / dayMs) - Math.floor(new Date(iso).getTime() / dayMs);
    if (days <= 0) { return 'Today'; }
    return days === 1 ? '1 day' : `${days} days`;
  }
  isPastDate(iso: string): boolean {
    return iso < new Date().toISOString().split('T')[0];
  }
  /** Target Date display: "Jul 13"; year appended only when not the current year.
   *  Parses the YYYY-MM-DD string directly — no Date() timezone shift. */
  gateDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (!y || !m || !d) { return iso; }
    const base = `${MONTHS[m - 1]} ${d}`;
    return y === new Date().getFullYear() ? base : `${base}, ${y}`;
  }

  /** CC-38-42: red reasons dominate the band; slips/at-risk are amber. */
  private static readonly RED_REASON_PREFIXES = ['Escalation', 'Status Update Overdue', 'Missing Target Date', 'Missing Deploy Date', 'Gate Overdue'];

  reasonIsRed(reason: string): boolean {
    return InitiativeStatusDashboardComponent.RED_REASON_PREFIXES.some(p => reason.startsWith(p));
  }

  reasonBandRed(reasons: string[]): boolean {
    return reasons.some(r => this.reasonIsRed(r));
  }
}
