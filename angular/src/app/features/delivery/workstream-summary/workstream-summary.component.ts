// workstream-summary.component.ts — WorkstreamSummaryComponent
// Route: /delivery/workstreams  (D-188)
//
// Shows WIP counts per workstream grouped by home Division.
// Prep/Build/Outcome WIP with exceeded-limit indicator (D-190).
// Gate count columns per D-189 NEXT_GATE_BY_STAGE mapping.
// Click a count → drill down to /delivery/cycles with query params (D-175).
// Toggle: "Display only my Divisions" — hidden for phil/admin (D-170).
//
// D-93: DeliveryService only — no direct Supabase access.
// Principle 3: loading states and empty states answer What/Why/How.
// D-178: Three-tier loading standard applied — Tier 1 skeleton only.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule }          from '@angular/forms';
import { IonicModule }          from '@ionic/angular';
import { firstValueFrom, Subscription } from 'rxjs';
import { filter, take }         from 'rxjs/operators';
import { DeliveryService }      from '../../../core/services/delivery.service';
import { McpService }           from '../../../core/services/mcp.service';
import { UserProfileService }   from '../../../core/services/user-profile.service';
import { ScreenStateService, SCREEN_KEYS } from '../../../core/services/screen-state.service';
import {
  WorkstreamSummaryItem,
  GateName,
  Division
} from '../../../core/types/database';

// Item 4 (Part 3): screen key declared at top of file — Principle 4 (self-clarifying names)
const SCREEN_KEY = SCREEN_KEYS.DELIVERY_WORKSTREAMS;
type WorkstreamSortCol = 'workstream_name' | 'total_active';

// D-189: gate labels for column headers
const GATE_LABELS: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const ALL_GATES: GateName[] = [
  'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
];

@Component({
  selector:        'app-workstream-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div style="max-width:1100px;margin:var(--triarq-space-2xl) auto;
                padding:0 var(--triarq-space-md);">

      <!-- Back + title -->
      <div style="margin-bottom:var(--triarq-space-md);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);
                  color:var(--triarq-color-primary);text-decoration:none;">
          ← Delivery Cycle Tracking
        </a>
        <h3 style="margin:8px 0 4px 0;">Workstream Summary</h3>
        <p style="margin:0;font-size:var(--triarq-text-small);
                  color:var(--triarq-color-text-secondary);">
          Active Delivery Cycle count and WIP breakdown per Workstream. Prep = Brief/Design/Spec, Build = Build/Validate,
          Outcome = Pilot/UAT/Release/Outcome. Limit is 4 per category.
          Click any count to see the matching cycles.
        </p>
      </div>

      <!-- Toggle: only shown for non-privileged roles -->
      <label *ngIf="!isPrivileged"
             style="display:flex;align-items:center;gap:8px;
                    font-size:var(--triarq-text-small);
                    color:var(--triarq-color-text-secondary);
                    margin-bottom:var(--triarq-space-md);cursor:pointer;">
        <input type="checkbox"
               [(ngModel)]="showMyDivisionsOnly"
               (ngModelChange)="onToggleChange()" />
        Display only my Divisions
      </label>

      <!-- ── Loading skeleton (D-178 Tier 1) ─────────────────────────────── -->
      <div *ngIf="loading">
        <div *ngFor="let _ of skeletonRows"
             style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height:16px;border-radius:4px;"></ion-skeleton-text>
        </div>
      </div>

      <!-- Error (D-140: state what is blocked and what needs to change) -->
      <div *ngIf="loadError && !loading"
           style="padding:var(--triarq-space-md);max-width:560px;">
        <div style="color:var(--triarq-color-error);font-weight:500;margin-bottom:4px;">
          Workstream summary could not load.
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ loadError }}
        </div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !loadError && groups.length === 0"
           style="text-align:center;padding:var(--triarq-space-xl);
                  color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);">
        No active Workstreams found with Delivery Cycles in your Divisions.
        <span *ngIf="!isPrivileged && showMyDivisionsOnly">
          Try unchecking "Display only my Divisions" to see all accessible Workstreams.
        </span>
      </div>

      <!-- Table header -->
      <div *ngIf="!loading && groups.length > 0"
           style="display:grid;grid-template-columns:2fr 60px 80px 80px 80px repeat(5,70px);
                  gap:var(--triarq-space-xs);
                  padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:500;
                  color:var(--triarq-color-text-secondary);
                  border-bottom:2px solid var(--triarq-color-border);">
        <span>Workstream</span>
        <span style="text-align:center;">Active Cycles</span>
        <span style="text-align:center;">Prep</span>
        <span style="text-align:center;">Build</span>
        <span style="text-align:center;">Outcome</span>
        <span *ngFor="let gate of gates" style="text-align:center;font-size:10px;line-height:1.3;">
          {{ gateLabel(gate) }}
        </span>
      </div>

      <!-- Groups by division -->
      <div *ngFor="let group of groups" style="margin-bottom:var(--triarq-space-md);">

        <!-- Division header row -->
        <div style="padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    background:var(--triarq-color-background-subtle);
                    font-size:var(--triarq-text-small);font-weight:600;
                    color:var(--triarq-color-text-secondary);
                    border-bottom:1px solid var(--triarq-color-border);">
          {{ group.divisionName || '—' }}
        </div>

        <!-- Workstream rows -->
        <div *ngFor="let ws of group.workstreams"
             style="display:grid;grid-template-columns:2fr 60px 80px 80px 80px repeat(5,70px);
                    gap:var(--triarq-space-xs);
                    padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);
                    font-size:var(--triarq-text-small);align-items:center;">

          <!-- Workstream name -->
          <div>
            <span style="font-weight:500;color:var(--triarq-color-text-primary);">
              {{ ws.workstream_name }}
            </span>
            <span *ngIf="!ws.active_status"
                  style="margin-left:6px;font-size:10px;
                         color:var(--triarq-color-sunray,#f5a623);">
              (inactive)
            </span>
          </div>

          <!-- Total -->
          <span style="text-align:center;font-weight:500;">
            {{ ws.total_active_cycles }}
          </span>

          <!-- Prep WIP -->
          <span style="text-align:center;cursor:pointer;"
                [style.color]="ws.wip_prep_exceeded ? 'var(--triarq-color-sunray,#f5a623)' : 'inherit'"
                [style.fontWeight]="ws.wip_prep_exceeded ? '600' : '400'"
                [title]="ws.wip_prep_exceeded ? 'WIP limit exceeded (>' + wipLimit + ')' : ''"
                (click)="drillDown({ workstream_id: ws.workstream_id })">
            {{ ws.wip_prep }}
            <span *ngIf="ws.wip_prep_exceeded" style="font-size:10px;">⚠</span>
          </span>

          <!-- Build WIP -->
          <span style="text-align:center;cursor:pointer;"
                [style.color]="ws.wip_build_exceeded ? 'var(--triarq-color-sunray,#f5a623)' : 'inherit'"
                [style.fontWeight]="ws.wip_build_exceeded ? '600' : '400'"
                [title]="ws.wip_build_exceeded ? 'WIP limit exceeded (>' + wipLimit + ')' : ''"
                (click)="drillDown({ workstream_id: ws.workstream_id })">
            {{ ws.wip_build }}
            <span *ngIf="ws.wip_build_exceeded" style="font-size:10px;">⚠</span>
          </span>

          <!-- Outcome WIP -->
          <span style="text-align:center;cursor:pointer;"
                [style.color]="ws.wip_outcome_exceeded ? 'var(--triarq-color-sunray,#f5a623)' : 'inherit'"
                [style.fontWeight]="ws.wip_outcome_exceeded ? '600' : '400'"
                [title]="ws.wip_outcome_exceeded ? 'WIP limit exceeded (>' + wipLimit + ')' : ''"
                (click)="drillDown({ workstream_id: ws.workstream_id })">
            {{ ws.wip_outcome }}
            <span *ngIf="ws.wip_outcome_exceeded" style="font-size:10px;">⚠</span>
          </span>

          <!-- Gate counts (one column per gate) -->
          <span *ngFor="let gate of gates"
                style="text-align:center;"
                [style.cursor]="ws.cycles_by_next_gate[gate] > 0 ? 'pointer' : 'default'"
                [style.color]="ws.cycles_by_next_gate[gate] > 0 ? 'var(--triarq-color-primary)' : 'var(--triarq-color-text-secondary)'"
                (click)="ws.cycles_by_next_gate[gate] > 0 && drillDown({ workstream_id: ws.workstream_id, next_gate: gate })">
            {{ ws.cycles_by_next_gate[gate] || '—' }}
          </span>
        </div>
      </div>

      <!-- Total row -->
      <div *ngIf="!loading && groups.length > 0"
           style="display:grid;grid-template-columns:2fr 60px 80px 80px 80px repeat(5,70px);
                  gap:var(--triarq-space-xs);
                  padding:var(--triarq-space-xs) var(--triarq-space-sm);
                  font-size:var(--triarq-text-small);font-weight:600;
                  border-top:2px solid var(--triarq-color-border);
                  color:var(--triarq-color-text-primary);">
        <span>All Workstreams</span>
        <span style="text-align:center;">{{ totalCycles }}</span>
        <span style="text-align:center;"
              [style.color]="totalPrep > wipLimit ? 'var(--triarq-color-sunray,#f5a623)' : 'inherit'">
          {{ totalPrep }}
        </span>
        <span style="text-align:center;"
              [style.color]="totalBuild > wipLimit ? 'var(--triarq-color-sunray,#f5a623)' : 'inherit'">
          {{ totalBuild }}
        </span>
        <span style="text-align:center;"
              [style.color]="totalOutcome > wipLimit ? 'var(--triarq-color-sunray,#f5a623)' : 'inherit'">
          {{ totalOutcome }}
        </span>
        <span *ngFor="let gate of gates"
              style="text-align:center;">
          {{ totalByGate[gate] || '—' }}
        </span>
      </div>
    </div>
  `
})
export class WorkstreamSummaryComponent implements OnInit, OnDestroy {

  loading            = false;
  loadError          = '';
  isPrivileged       = false;
  showMyDivisionsOnly = true;
  userDivisionIds:   string[] = [];

  workstreamSummaries: WorkstreamSummaryItem[] = [];

  // Item 4 (Part 3): sort state persisted via ScreenStateService
  sortCol: WorkstreamSortCol  = 'workstream_name';
  sortDir: 'asc' | 'desc'    = 'asc';

  readonly gates    = ALL_GATES;
  readonly wipLimit = 4;

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4];

  private currentUserId    = '';
  private readonly profileSub = new Subscription();

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly mcp:         McpService,
    private readonly profile:     UserProfileService,
    private readonly screenState: ScreenStateService,
    private readonly router:      Router,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Wait for profile$ to emit a non-null User — avoids race condition where
    // getCurrentProfile() returns null before async loadProfile() completes (D-177 fix).
    this.profileSub.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(profile => {
        this.currentUserId = profile.id ?? '';
        // Item 4: restore saved sort state (Principle 9: skeleton shows during restore load)
        const saved = this.screenState.restore(SCREEN_KEY, this.currentUserId);
        if (saved) {
          if (typeof saved['sortCol'] === 'string') { this.sortCol = saved['sortCol'] as WorkstreamSortCol; }
          if (saved['sortDir'] === 'asc' || saved['sortDir'] === 'desc') { this.sortDir = saved['sortDir']; }
        }
        const role        = profile.system_role;
        this.isPrivileged = role === 'phil' || role === 'admin';
        if (!this.isPrivileged) {
          this.loadUserDivisions(this.currentUserId);
        } else {
          this.loadSummary();
        }
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.profileSub.unsubscribe();
  }

  private async loadUserDivisions(userId: string): Promise<void> {
    if (!userId) {
      this.loadSummary();
      return;
    }
    try {
      const res = await firstValueFrom(
        this.mcp.call<{ directly_assigned_divisions: Division[] }>(
          'division', 'get_user_divisions', { user_id: userId }
        )
      );
      this.userDivisionIds = (res.data?.directly_assigned_divisions ?? []).map(d => d.id);
    } catch {
      this.userDivisionIds = [];
    }
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading   = true;
    this.loadError = '';
    this.cdr.markForCheck();

    const params: { division_ids?: string[] } = {};
    if (!this.isPrivileged && this.showMyDivisionsOnly && this.userDivisionIds.length > 0) {
      params.division_ids = this.userDivisionIds;
    }

    this.delivery.getDeliverySummary(params).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.workstreamSummaries = res.data.workstream_summaries;
        } else {
          this.loadError = this.friendlyError(res.error);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.loadError = this.friendlyError(err?.error);
        this.loading   = false;
        this.cdr.markForCheck();
      }
    });
  }

  private friendlyError(serverMsg?: string): string {
    if (!serverMsg) {
      return 'Unable to reach the server. Check your connection and try again.';
    }
    if (serverMsg.includes('not found') && serverMsg.includes('get_delivery_summary')) {
      return 'The summary feature is still deploying to the server. ' +
             'This takes 1–2 minutes after a new release. Reload the page to try again.';
    }
    if (serverMsg.includes('not found')) {
      // Phil and Admin always have access to all Divisions (D-170), so this is a server error.
      return serverMsg;
    }
    return serverMsg;
  }

  onToggleChange(): void {
    this.loadSummary();
  }

  // Item 4: sort controls (within each Division group)
  setSort(col: WorkstreamSortCol): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = col === 'workstream_name' ? 'asc' : 'desc';
    }
    this.saveState();
    this.cdr.markForCheck();
  }

  sortIndicator(col: WorkstreamSortCol): string {
    if (this.sortCol !== col) { return ''; }
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  saveState(): void {
    if (!this.currentUserId) { return; }
    this.screenState.save(SCREEN_KEY, this.currentUserId, {
      sortCol: this.sortCol,
      sortDir: this.sortDir,
    });
  }

  drillDown(params: { workstream_id?: string | null; next_gate?: GateName }): void {
    const queryParams: Record<string, string> = {};
    if (params.workstream_id) { queryParams['workstream_id'] = params.workstream_id; }
    if (params.next_gate)     { queryParams['next_gate']     = params.next_gate; }
    this.router.navigate(['/delivery/cycles'], { queryParams });
  }

  // ── Grouping ───────────────────────────────────────────────────────────────

  get groups(): { divisionName: string; workstreams: WorkstreamSummaryItem[] }[] {
    const map = new Map<string, WorkstreamSummaryItem[]>();
    for (const ws of this.workstreamSummaries) {
      const key = ws.home_division_name || '(No Division assigned)';
      if (!map.has(key)) { map.set(key, []); }
      map.get(key)!.push(ws);
    }
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return Array.from(map.entries())
      .map(([divisionName, workstreams]) => ({
        divisionName,
        // Item 4: sort workstreams within each Division group per sortCol/sortDir
        workstreams: workstreams.slice().sort((a, b) => {
          if (this.sortCol === 'workstream_name') {
            return dir * a.workstream_name.localeCompare(b.workstream_name);
          }
          return dir * (a.total_active - b.total_active);
        })
      }))
      .sort((a, b) => a.divisionName.localeCompare(b.divisionName));
  }

  // ── Totals ─────────────────────────────────────────────────────────────────

  get totalCycles(): number {
    return this.workstreamSummaries.reduce((s, w) => s + w.total_active_cycles, 0);
  }
  get totalPrep(): number {
    return this.workstreamSummaries.reduce((s, w) => s + w.wip_prep, 0);
  }
  get totalBuild(): number {
    return this.workstreamSummaries.reduce((s, w) => s + w.wip_build, 0);
  }
  get totalOutcome(): number {
    return this.workstreamSummaries.reduce((s, w) => s + w.wip_outcome, 0);
  }

  get totalByGate(): Record<GateName, number> {
    const totals: Partial<Record<GateName, number>> = {};
    for (const gate of ALL_GATES) {
      totals[gate] = this.workstreamSummaries.reduce(
        (s, w) => s + (w.cycles_by_next_gate[gate] ?? 0), 0
      );
    }
    return totals as Record<GateName, number>;
  }

  gateLabel(gate: GateName): string {
    return GATE_LABELS[gate];
  }
}
