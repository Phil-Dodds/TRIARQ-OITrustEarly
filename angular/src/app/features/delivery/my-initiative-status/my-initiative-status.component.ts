// my-initiative-status.component.ts — Contract 32 (WS3)
// "My Initiative Status" screen (D-484). My Actions nav. Two tabs with count
// badges: Updates Due and Needs Acknowledgment. Refresh Status triggers the
// overdue recompute (D-482) and shows the last-calculated time (D-484).
//
// D-346 Context A (Refresh button), Context B (skeleton on load). S-018 row tap
// opens the initiative detail panel. S-036 column sort persisted per D-171.

import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { IonicModule }     from '@ionic/angular';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ScreenStateService, SCREEN_KEYS } from '../../../core/services/screen-state.service';
import { DeliveryCycleDetailComponent } from '../detail/delivery-cycle-detail.component';
import { InitiativeStatusUpdatePanelComponent } from '../status-panel/initiative-status-update-panel.component';
import { MyStatusDueRow, MyAcknowledgmentDueRow } from '../../../core/types/initiative-status';

type DueSort = 'initiative' | 'division' | 'last_update' | 'cadence' | 'next_meeting';
type AckSort = 'initiative' | 'division' | 'updated_by' | 'updated_at';

@Component({
  selector: 'app-my-initiative-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule, DeliveryCycleDetailComponent, InitiativeStatusUpdatePanelComponent],
  template: `
    <div class="oi-page" style="max-width:1100px;margin:0 auto;padding:var(--triarq-space-lg);">

      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <h2 style="margin:0;">My Initiative Status</h2>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;color:var(--triarq-color-text-secondary);">
            Status last calculated: {{ lastCalculated }}
          </span>
          <button class="oi-btn-secondary" (click)="refresh()" [disabled]="refreshing">
            {{ refreshing ? 'Refreshing…' : 'Refresh Status' }}
          </button>
        </div>
      </div>
      <div *ngIf="refreshError" class="oi-err" style="margin-top:6px;">{{ refreshError }}</div>

      <!-- Tabs -->
      <div class="mis-tabs">
        <button class="mis-tab" [class.mis-tab-active]="tab === 'due'" (click)="tab = 'due'">
          Updates Due <span class="mis-badge">{{ dueRows.length }}</span>
        </button>
        <button class="mis-tab" [class.mis-tab-active]="tab === 'ack'" (click)="tab = 'ack'">
          Needs Acknowledgment <span class="mis-badge">{{ ackRows.length }}</span>
        </button>
      </div>

      <!-- D-346 Context B skeleton -->
      <div *ngIf="loading" class="oi-card" style="margin-top:12px;">
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
        <ion-skeleton-text animated style="width:100%;height:40px;"></ion-skeleton-text>
      </div>

      <ng-container *ngIf="!loading">

        <!-- ===== Tab 1: Updates Due ===== -->
        <div *ngIf="tab === 'due'" class="oi-card" style="margin-top:12px;">
          <div *ngIf="dueRows.length === 0" class="mis-empty">
            ✓ No initiatives currently require a status update.
          </div>
          <table *ngIf="dueRows.length" class="mis-table">
            <thead>
              <tr>
                <th (click)="sortDue('initiative')">Initiative Name {{ dueArrow('initiative') }}</th>
                <th (click)="sortDue('division')">Division {{ dueArrow('division') }}</th>
                <th (click)="sortDue('last_update')">Last Update {{ dueArrow('last_update') }}</th>
                <th (click)="sortDue('cadence')">Cadence {{ dueArrow('cadence') }}</th>
                <th (click)="sortDue('next_meeting')">Next Meeting {{ dueArrow('next_meeting') }}</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of dueRowsSorted">
                <td><a class="mis-link" (click)="openDetail(r.initiative_id)">{{ r.cycle_title }}</a></td>
                <td>{{ r.division_name || '—' }}</td>
                <td>{{ r.last_saved_at ? formatDateTime(r.last_saved_at) : neverText() }}</td>
                <td>{{ r.cadence || '—' }}</td>
                <td>{{ nextMeeting(r.status_due_at) }}</td>
                <td><button class="oi-btn-secondary mis-sm" (click)="openUpdate(r.initiative_id, r.cycle_title)">Update Status</button></td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="dueRows.length" class="mis-foot">{{ dueRows.length }} initiatives</div>
        </div>

        <!-- ===== Tab 2: Needs Acknowledgment ===== -->
        <div *ngIf="tab === 'ack'" class="oi-card" style="margin-top:12px;">
          <div *ngIf="ackRows.length === 0" class="mis-empty">No status updates pending your review.</div>
          <table *ngIf="ackRows.length" class="mis-table">
            <thead>
              <tr>
                <th (click)="sortAck('initiative')">Initiative Name {{ ackArrow('initiative') }}</th>
                <th (click)="sortAck('division')">Division {{ ackArrow('division') }}</th>
                <th (click)="sortAck('updated_by')">Updated By {{ ackArrow('updated_by') }}</th>
                <th (click)="sortAck('updated_at')">Updated At {{ ackArrow('updated_at') }}</th>
                <th>View &amp; Acknowledge</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of ackRowsSorted">
                <td><a class="mis-link" (click)="openDetail(r.initiative_id)">{{ r.cycle_title }}</a></td>
                <td>{{ r.division_name || '—' }}</td>
                <td>{{ r.saved_by_name }}</td>
                <td>{{ formatDateTime(r.saved_at) }}</td>
                <td><button class="oi-btn-secondary mis-sm" (click)="openReview(r.initiative_id, r.cycle_title)">View &amp; Acknowledge</button></td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="ackRows.length" class="mis-foot">{{ ackRows.length }} updates</div>
        </div>
      </ng-container>
    </div>

    <!-- Embedded initiative detail — standard right panel (S-006), fixed overlay + scrim. -->
    <div *ngIf="detailCycleId" class="oi-scrim oi-scrim-detail" (click)="detailCycleId = null; reload()"></div>
    <div *ngIf="detailCycleId"
         style="position:fixed;top:0;right:0;width:60%;max-width:980px;height:100vh;background:#fff;
                border-left:1px solid #E0E0E0;overflow-y:auto;z-index:1000;">
      <app-delivery-cycle-detail
        [cycleId]="detailCycleId"
        (close)="detailCycleId = null; reload()">
      </app-delivery-cycle-detail>
    </div>

    <!-- Embedded status panels -->
    <app-initiative-status-update-panel
      *ngIf="editId"
      [initiativeId]="editId"
      [initiativeName]="editName"
      mode="edit"
      [deriveApplicability]="true"
      (saved)="onPanelSaved()"
      (cancelled)="editId = null">
    </app-initiative-status-update-panel>

    <app-initiative-status-update-panel
      *ngIf="reviewId"
      [initiativeId]="reviewId"
      [initiativeName]="reviewName"
      mode="read"
      (acknowledged)="onAcknowledged()"
      (viewInitiative)="openDetail(reviewId); reviewId = null"
      (cancelled)="reviewId = null">
    </app-initiative-status-update-panel>
  `,
  styles: [`
    :host { display:block; }
    .mis-tabs { display:flex; gap:8px; margin-top:16px; border-bottom:1px solid var(--triarq-color-border,#e0e0e0); }
    .mis-tab { background:none; border:none; padding:8px 12px; cursor:pointer; font-size:14px;
               color:var(--triarq-color-text-secondary); border-bottom:2px solid transparent; }
    .mis-tab-active { color:var(--triarq-color-primary,#257099); border-bottom-color:var(--triarq-color-primary,#257099); font-weight:500; }
    .mis-badge { display:inline-block; background:var(--triarq-color-primary,#257099); color:#fff;
                 border-radius:999px; padding:0 7px; font-size:11px; margin-left:4px; }
    .mis-table { width:100%; border-collapse:collapse; font-size:13px; }
    .mis-table th { text-align:left; padding:8px; border-bottom:1px solid var(--triarq-color-border,#e0e0e0);
                    cursor:pointer; user-select:none; color:var(--triarq-color-text-secondary); font-weight:500; }
    .mis-table td { padding:8px; border-bottom:1px solid var(--triarq-color-fog,#f4f4f4); }
    .mis-link { color:var(--triarq-color-primary,#257099); cursor:pointer; }
    .mis-sm { font-size:11px; padding:3px 8px; }
    .mis-empty { padding:16px; color:#5A5A5A; font-style:italic; }
    .mis-foot { padding:8px; font-size:12px; color:var(--triarq-color-text-secondary); }
  `]
})
export class MyInitiativeStatusComponent implements OnInit {
  tab: 'due' | 'ack' = 'due';
  loading    = false;
  refreshing = false;
  refreshError: string | null = null;
  lastCalculated = 'Not yet calculated';

  dueRows: MyStatusDueRow[] = [];
  ackRows: MyAcknowledgmentDueRow[] = [];

  dueSortField: DueSort = 'last_update';
  dueSortDir: 'asc' | 'desc' = 'asc';     // oldest first = most urgent
  ackSortField: AckSort = 'updated_at';
  ackSortDir: 'asc' | 'desc' = 'desc';

  detailCycleId: string | null = null;
  editId:   string | null = null;
  editName  = '';
  reviewId: string | null = null;
  reviewName = '';

  constructor(
    private readonly delivery:    DeliveryService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.screenState.restore(SCREEN_KEYS.MY_INITIATIVE_STATUS_DUE).then(s => {
      if (s?.sort_state) {
        this.dueSortField = (s.sort_state['field'] as DueSort) ?? this.dueSortField;
        this.dueSortDir = (s.sort_state['dir'] as 'asc' | 'desc') ?? this.dueSortDir;
      }
    });
    this.screenState.restore(SCREEN_KEYS.MY_INITIATIVE_STATUS_ACKNOWLEDGMENTS).then(s => {
      if (s?.sort_state) {
        this.ackSortField = (s.sort_state['field'] as AckSort) ?? this.ackSortField;
        this.ackSortDir = (s.sort_state['dir'] as 'asc' | 'desc') ?? this.ackSortDir;
      }
    });
    this.loadLastRun();
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.cdr.markForCheck();
    let pending = 2;
    const done = () => { if (--pending === 0) { this.loading = false; this.cdr.markForCheck(); } };
    this.delivery.getMyStatusDue().subscribe({
      next: (res) => { this.dueRows = (res.success && res.data) ? res.data : []; done(); },
      error: () => { this.dueRows = []; done(); }
    });
    this.delivery.getMyAcknowledgmentsDue().subscribe({
      next: (res) => { this.ackRows = (res.success && res.data) ? res.data : []; done(); },
      error: () => { this.ackRows = []; done(); }
    });
  }

  private loadLastRun(): void {
    this.delivery.getStatusRefreshLastRun().subscribe({
      next: (res) => { this.lastCalculated = this.fmtLastRun(res.success ? res.data?.last_run : null); this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  refresh(): void {
    this.refreshing = true;
    this.refreshError = null;
    this.cdr.markForCheck();
    this.delivery.triggerStatusRefresh().subscribe({
      next: (res) => {
        this.refreshing = false;
        if (!res.success) { this.refreshError = res.error || 'Status refresh failed.'; }
        this.loadLastRun();   // always re-read the authoritative timestamp from system_config
        this.reload();
      },
      error: (err) => {
        this.refreshing = false;
        this.refreshError = (err && err.error) ? err.error : 'Status refresh failed.';
        this.loadLastRun();
        this.cdr.markForCheck();
      }
    });
  }

  // ── Row actions ───────────────────────────────────────────────────────────
  openDetail(id: string): void { this.detailCycleId = id; this.cdr.markForCheck(); }
  openUpdate(id: string, name: string): void { this.editId = id; this.editName = name; this.cdr.markForCheck(); }
  openReview(id: string, name: string): void { this.reviewId = id; this.reviewName = name; this.cdr.markForCheck(); }
  onPanelSaved(): void { this.editId = null; this.reload(); }
  onAcknowledged(): void { this.reviewId = null; this.reload(); }

  // ── Sorting (S-036, persisted D-171) ────────────────────────────────────────
  sortDue(field: DueSort): void {
    if (this.dueSortField === field) { this.dueSortDir = this.dueSortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.dueSortField = field; this.dueSortDir = 'asc'; }
    this.screenState.save(SCREEN_KEYS.MY_INITIATIVE_STATUS_DUE, {}, { field: this.dueSortField, dir: this.dueSortDir });
  }
  sortAck(field: AckSort): void {
    if (this.ackSortField === field) { this.ackSortDir = this.ackSortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.ackSortField = field; this.ackSortDir = 'asc'; }
    this.screenState.save(SCREEN_KEYS.MY_INITIATIVE_STATUS_ACKNOWLEDGMENTS, {}, { field: this.ackSortField, dir: this.ackSortDir });
  }
  dueArrow(f: DueSort): string { return this.dueSortField === f ? (this.dueSortDir === 'asc' ? '↑' : '↓') : '↕'; }
  ackArrow(f: AckSort): string { return this.ackSortField === f ? (this.ackSortDir === 'asc' ? '↑' : '↓') : '↕'; }

  get dueRowsSorted(): MyStatusDueRow[] {
    const dir = this.dueSortDir === 'asc' ? 1 : -1;
    const key = (r: MyStatusDueRow): string => {
      switch (this.dueSortField) {
        case 'initiative':   return r.cycle_title || '';
        case 'division':     return r.division_name || '';
        case 'last_update':  return r.last_saved_at || '';
        case 'cadence':      return r.cadence || '';
        case 'next_meeting': return r.status_due_at || '';
      }
    };
    return [...this.dueRows].sort((a, b) => key(a).localeCompare(key(b)) * dir);
  }

  get ackRowsSorted(): MyAcknowledgmentDueRow[] {
    const dir = this.ackSortDir === 'asc' ? 1 : -1;
    const key = (r: MyAcknowledgmentDueRow): string => {
      switch (this.ackSortField) {
        case 'initiative': return r.cycle_title || '';
        case 'division':   return r.division_name || '';
        case 'updated_by': return r.saved_by_name || '';
        case 'updated_at': return r.saved_at || '';
      }
    };
    return [...this.ackRows].sort((a, b) => key(a).localeCompare(key(b)) * dir);
  }

  // ── Formatting ──────────────────────────────────────────────────────────────
  neverText(): string { return 'Never'; }
  nextMeeting(statusDueAt: string | null): string {
    if (!statusDueAt) { return '—'; }
    const d = new Date(statusDueAt);
    if (isNaN(d.getTime())) { return '—'; }
    d.setDate(d.getDate() + 1); // status_due_at = next_meeting − 1 day
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return iso; }
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  private fmtLastRun(iso: string | null | undefined): string {
    if (!iso) { return 'Not yet calculated'; }
    const d = new Date(iso);
    if (isNaN(d.getTime())) { return 'Not yet calculated'; }
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
