// gates-summary.component.ts — GatesSummaryComponent
// Route: /delivery/gates  (D-188)
//
// Shows upcoming and overdue gate counts per gate type (D-189).
// "Upcoming" = next gate target date within 7 days and not yet passed.
// "Overdue"  = next gate target date is in the past, no actual date set.
// Click a row → drill down to /delivery/cycles?next_gate=X (D-175).
// Toggle: "Display only my Divisions" — hidden for phil/admin (D-170).
//
// D-93: DeliveryService only — no direct Supabase access.
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
import { GateSummaryItem, GateName, Division } from '../../../core/types/database';

// Item 4 (Part 3): screen key declared at top of file — Principle 4 (self-clarifying names)
const SCREEN_KEY = SCREEN_KEYS.DELIVERY_GATES;
type GateSortCol = 'gate_name' | 'total_pending_count' | 'upcoming_count' | 'overdue_count';

const GATE_LABELS: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

@Component({
  selector:        'app-gates-summary',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, FormsModule, IonicModule],
  template: `
    <div style="max-width:800px;margin:var(--triarq-space-2xl) auto;
                padding:0 var(--triarq-space-md);">

      <!-- Back + title -->
      <div style="margin-bottom:var(--triarq-space-md);">
        <a routerLink="/delivery"
           style="font-size:var(--triarq-text-small);
                  color:var(--triarq-color-primary);text-decoration:none;">
          ← Delivery Cycle Tracking
        </a>
        <h3 style="margin:8px 0 4px 0;">Upcoming Gate Summary</h3>
        <!-- S-015 / D-288: surface description text. Source: Contract 6 Step 4.3. -->
        <p style="margin:4px 0 12px 0;font-size:11px;font-style:italic;color:#5A5A5A;">
          View upcoming and overdue gates across all active delivery cycles.
        </p>
      </div>

      <!-- Toggle -->
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
             style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;
                    gap:var(--triarq-space-sm);padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);align-items:center;">
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
          Gate summary could not load.
        </div>
        <div style="font-size:var(--triarq-text-small);color:var(--triarq-color-text-secondary);">
          {{ loadError }}
        </div>
      </div>

      <!-- Table -->
      <div *ngIf="!loading && !loadError">

        <!-- Gate type filter + sort controls (Item 4) -->
        <div style="display:flex;gap:var(--triarq-space-sm);flex-wrap:wrap;
                    margin-bottom:var(--triarq-space-sm);align-items:center;">
          <select [(ngModel)]="filterGateType" (ngModelChange)="saveState()"
                  class="oi-input" style="font-size:var(--triarq-text-small);max-width:200px;">
            <option value="">All Gate Types</option>
            <option *ngFor="let g of allGateNames" [value]="g">{{ gateLabel(g) }}</option>
          </select>
        </div>

        <!-- Header (sortable columns) -->
        <div style="display:grid;grid-template-columns:2fr 120px 140px 120px;
                    gap:var(--triarq-space-sm);
                    padding:var(--triarq-space-xs) var(--triarq-space-sm);
                    font-size:var(--triarq-text-small);font-weight:500;
                    color:var(--triarq-color-text-secondary);
                    border-bottom:2px solid var(--triarq-color-border);">
          <span (click)="setSort('gate_name')" style="cursor:pointer;user-select:none;">
            Gate {{ sortIndicator('gate_name') }}
          </span>
          <span (click)="setSort('total_pending_count')" style="text-align:center;cursor:pointer;user-select:none;">
            Total Pending {{ sortIndicator('total_pending_count') }}
          </span>
          <span (click)="setSort('upcoming_count')" style="text-align:center;cursor:pointer;user-select:none;">
            Upcoming (≤7 days) {{ sortIndicator('upcoming_count') }}
          </span>
          <span (click)="setSort('overdue_count')" style="text-align:center;cursor:pointer;user-select:none;">
            Overdue {{ sortIndicator('overdue_count') }}
          </span>
        </div>

        <!-- Rows -->
        <div *ngFor="let gate of sortedGateSummaries"
             style="display:grid;grid-template-columns:2fr 120px 140px 120px;
                    gap:var(--triarq-space-sm);
                    padding:var(--triarq-space-sm);
                    border-bottom:1px solid var(--triarq-color-border);
                    font-size:var(--triarq-text-small);align-items:center;
                    cursor:pointer;transition:background 0.1s;"
             (mouseenter)="$any($event.currentTarget).style.background='var(--triarq-color-background-subtle)'"
             (mouseleave)="$any($event.currentTarget).style.background=''"
             (click)="drillDown(gate.gate_name)">

          <!-- Gate name -->
          <span style="font-weight:500;color:var(--triarq-color-text-primary);">
            {{ gateLabel(gate.gate_name) }}
          </span>

          <!-- Total pending -->
          <span style="text-align:center;"
                [style.color]="gate.total_pending_count > 0 ? 'var(--triarq-color-primary)' : 'var(--triarq-color-text-secondary)'">
            {{ gate.total_pending_count || '—' }}
          </span>

          <!-- Upcoming -->
          <span style="text-align:center;"
                [style.color]="gate.upcoming_count > 0 ? 'var(--triarq-color-sunray,#f5a623)' : 'var(--triarq-color-text-secondary)'"
                [style.fontWeight]="gate.upcoming_count > 0 ? '600' : '400'">
            {{ gate.upcoming_count > 0 ? gate.upcoming_count : '—' }}
          </span>

          <!-- Overdue -->
          <span style="text-align:center;"
                [style.color]="gate.overdue_count > 0 ? 'var(--triarq-color-error,#d32f2f)' : 'var(--triarq-color-text-secondary)'"
                [style.fontWeight]="gate.overdue_count > 0 ? '600' : '400'">
            {{ gate.overdue_count > 0 ? gate.overdue_count : '—' }}
          </span>
        </div>

        <!-- Empty state -->
        <div *ngIf="gateSummaries.length === 0"
             style="text-align:center;padding:var(--triarq-space-xl);
                    color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);">
          No active Delivery Cycles found in your Divisions.
        </div>

        <!-- Summary callout: overdue alert -->
        <div *ngIf="totalOverdue > 0"
             style="margin-top:var(--triarq-space-md);padding:var(--triarq-space-sm) var(--triarq-space-md);
                    background:#fff8f0;border:1px solid var(--triarq-color-sunray,#f5a623);
                    border-radius:5px;font-size:var(--triarq-text-small);">
          <strong style="color:var(--triarq-color-sunray,#f5a623);">
            {{ totalOverdue }} overdue gate{{ totalOverdue === 1 ? '' : 's' }}
          </strong>
          <span style="color:var(--triarq-color-text-secondary);margin-left:6px;">
            — these Delivery Cycles have passed their target Gate date with no approval recorded.
            Click the relevant Gate row to identify the Delivery Cycles.
          </span>
        </div>
      </div>
    </div>
  `
})
export class GatesSummaryComponent implements OnInit, OnDestroy {

  loading            = false;
  loadError          = '';
  isPrivileged       = false;
  showMyDivisionsOnly = true;
  userDivisionIds:   string[] = [];
  gateSummaries:     GateSummaryItem[] = [];

  // Item 4 (Part 3): filter + sort state persisted via ScreenStateService
  filterGateType: string      = '';
  sortCol:        GateSortCol = 'gate_name';
  sortDir:        'asc' | 'desc' = 'asc';

  readonly allGateNames: GateName[] = [
    'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
  ];

  // D-178 Tier 1: skeleton rows for loading state
  readonly skeletonRows = [1, 2, 3, 4, 5];

  private currentUserId = '';
  private readonly profileSub = new Subscription();

  constructor(
    private readonly delivery:     DeliveryService,
    private readonly mcp:          McpService,
    private readonly profile:      UserProfileService,
    private readonly screenState:  ScreenStateService,
    private readonly router:       Router,
    private readonly cdr:          ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Wait for profile$ to emit a non-null User — avoids race condition (D-177 fix).
    this.profileSub.add(
      this.profile.profile$.pipe(
        filter((p): p is NonNullable<typeof p> => p !== null),
        take(1)
      ).subscribe(profile => {
        this.currentUserId = profile.id ?? '';
        // Item 4: restore saved filter/sort state before loading (Principle 9: skeleton shows during restore)
        const saved = this.screenState.restore(SCREEN_KEY, this.currentUserId);
        if (saved) {
          if (typeof saved['filterGateType'] === 'string') { this.filterGateType = saved['filterGateType']; }
          if (typeof saved['sortCol']         === 'string') { this.sortCol = saved['sortCol'] as GateSortCol; }
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
    if (!userId) { this.loadSummary(); return; }
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
          this.gateSummaries = res.data.gate_summaries;
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
    return serverMsg;
  }

  onToggleChange(): void {
    this.loadSummary();
  }

  // Item 4: sort controls
  setSort(col: GateSortCol): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = col === 'gate_name' ? 'asc' : 'desc'; // counts default descending
    }
    this.saveState();
    this.cdr.markForCheck();
  }

  sortIndicator(col: GateSortCol): string {
    if (this.sortCol !== col) { return ''; }
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  saveState(): void {
    if (!this.currentUserId) { return; }
    this.screenState.save(SCREEN_KEY, this.currentUserId, {
      filterGateType: this.filterGateType,
      sortCol:        this.sortCol,
      sortDir:        this.sortDir,
    });
  }

  get sortedGateSummaries(): GateSummaryItem[] {
    let rows = this.filterGateType
      ? this.gateSummaries.filter(g => g.gate_name === this.filterGateType)
      : [...this.gateSummaries];
    rows = rows.slice().sort((a, b) => {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      if (this.sortCol === 'gate_name') {
        return dir * a.gate_name.localeCompare(b.gate_name);
      }
      return dir * ((a[this.sortCol] as number) - (b[this.sortCol] as number));
    });
    return rows;
  }

  drillDown(gate: GateName): void {
    this.router.navigate(['/delivery/cycles'], { queryParams: { next_gate: gate } });
  }

  gateLabel(gate: GateName): string {
    return GATE_LABELS[gate];
  }

  get totalOverdue(): number {
    return this.gateSummaries.reduce((s, g) => s + g.overdue_count, 0);
  }
}
