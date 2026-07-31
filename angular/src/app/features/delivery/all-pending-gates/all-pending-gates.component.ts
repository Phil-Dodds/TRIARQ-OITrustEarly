// all-pending-gates.component.ts — Pathways OI Trust
// Contract G8 (D-560) + Contract 40 follow-on. Every gate awaiting approval in
// the widest scope the viewer is allowed (IE/Admin/Phil = all divisions;
// Division Leader = their division(s)). Filter to narrow. Rows drill into the
// gate panel. Reassignment lives on the initiative detail (Set approver…), not
// here (Phil 2026-07-29). Pull-only; push obligations stay in My Actions.
//
// Contract 41 (Phil 2026-07-31) — three changes:
//
//  1. Grid chrome matches the All Initiatives list: navy #12274A header row,
//     white uppercase labels, sticky on scroll, 6px top corners. The
//     2026-07-29 reskin used a pale #F7FAFC header, which is not what the
//     Initiative list does.
//  2. Submitter is shown and filterable. gate_records.submitted_by_user_id was
//     always read by the MCP tool but never returned.
//  3. Targeted refresh on return. Opening a gate navigates to the Initiative;
//     the Back link returns here carrying ?refresh=<cycle id>, and only that
//     Initiative's rows are re-queried — the rest of the queue is restored from
//     a short-lived snapshot rather than refetched.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DeliveryService, AllPendingGateRow } from '../../../core/services/delivery.service';

type ApgSort = 'days' | 'initiative' | 'division' | 'level' | 'approver' | 'submitter';

/**
 * Snapshot key for the targeted-refresh round trip. Rule 4: declared once as a
 * named constant, never built from runtime values. This is NOT filter/sort
 * memory — it is a transient list snapshot in sessionStorage, deliberately kept
 * out of user_screen_state.
 */
const APG_SNAPSHOT_KEY = 'oitrust.delivery.all-pending-gates.snapshot';

/**
 * How long a snapshot may back a targeted refresh. Past this the queue is
 * refetched in full, because rows for OTHER Initiatives would be stale and this
 * screen's whole job is telling you what is genuinely waiting.
 */
const APG_SNAPSHOT_TTL_MS = 60_000;

interface ApgSnapshot {
  saved_at_ms:          number;
  rows:                 AllPendingGateRow[];
  aging_threshold_days: number;
}

@Component({
  selector: 'app-all-pending-gates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apg-page">
      <div class="apg-header">
        <h2>All Pending Gates</h2>
        <div class="apg-desc">
          Every gate awaiting approval in your scope — rows past
          {{ agingThresholdDays }} days are highlighted. To change an approver,
          open the initiative and use “Set approver…”.
        </div>
      </div>

      <!-- Filters (inline; client-side over the loaded rows) -->
      <div *ngIf="!loading && !errorText && rows.length > 0" class="apg-filters">
        <input type="text" class="apg-f" placeholder="Search initiative…" [(ngModel)]="search" (ngModelChange)="cdr.markForCheck()" />
        <select class="apg-f" [(ngModel)]="filterDivision" (ngModelChange)="cdr.markForCheck()">
          <option value="">Division: any</option>
          <option *ngFor="let d of divisionOptions" [value]="d">{{ d }}</option>
        </select>
        <select class="apg-f" [(ngModel)]="filterApprover" (ngModelChange)="cdr.markForCheck()">
          <option value="">Approver: any</option>
          <option *ngFor="let a of approverOptions" [value]="a">{{ a }}</option>
        </select>
        <!-- Contract 41: submitter filter, options derived from the loaded rows. -->
        <select class="apg-f" [(ngModel)]="filterSubmitter" (ngModelChange)="cdr.markForCheck()">
          <option value="">Submitted by: any</option>
          <option *ngFor="let s of submitterOptions" [value]="s">{{ s }}</option>
        </select>
        <select class="apg-f" [(ngModel)]="filterLevel" (ngModelChange)="cdr.markForCheck()">
          <option value="">Level: any</option>
          <option value="1">L1</option><option value="2">L2</option><option value="3">L3</option>
        </select>
        <label class="apg-check"><input type="checkbox" [(ngModel)]="filterAging" (ngModelChange)="cdr.markForCheck()" /> Overdue only ({{ agingThresholdDays }}d+)</label>
        <button *ngIf="anyFilterActive" type="button" class="apg-clear" (click)="clearFilters()">Clear</button>
        <span class="apg-count">{{ visibleRows.length }} of {{ rows.length }}</span>
      </div>

      <!-- Contract 41: outcome of the targeted refresh after a submit / return.
           S-001 — says what changed rather than silently redrawing the row. -->
      <div *ngIf="refreshNotice" class="apg-refresh-note">
        <span class="apg-refresh-icon">✓</span>{{ refreshNotice }}
      </div>

      <div *ngIf="loading" class="apg-empty">Loading…</div>
      <div *ngIf="!loading && errorText" class="apg-error" role="alert">{{ errorText }}</div>
      <div *ngIf="!loading && !errorText && rows.length === 0" class="apg-empty">
        Nothing is waiting — every submitted gate has been decided.
      </div>
      <div *ngIf="!loading && !errorText && rows.length > 0 && visibleRows.length === 0" class="apg-empty">
        No gates match these filters.
      </div>

      <div *ngIf="!loading && visibleRows.length > 0" class="apg-card">
        <table class="apg-table">
          <thead>
            <tr>
              <th class="apg-sortable" (click)="setSort('initiative')">Initiative {{ arrow('initiative') }}</th>
              <th>Gate</th>
              <th class="apg-sortable" (click)="setSort('division')">Division {{ arrow('division') }}</th>
              <th class="apg-sortable" (click)="setSort('level')">Level {{ arrow('level') }}</th>
              <th class="apg-sortable" (click)="setSort('submitter')">Submitted by {{ arrow('submitter') }}</th>
              <th class="apg-sortable" (click)="setSort('approver')">Approver {{ arrow('approver') }}</th>
              <th class="apg-sortable apg-num" (click)="setSort('days')">Days {{ arrow('days') }}</th>
              <th>Waiting on</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of visibleRows"
                class="apg-row"
                [class.apg-row--aging]="r.aging"
                [class.apg-row--refreshed]="r.delivery_cycle_id === refreshedCycleId"
                (click)="open(r)">
              <td class="apg-strong">{{ r.cycle_title }}</td>
              <td>{{ r.gate_name_display }}</td>
              <td>{{ r.division_display_name_short || '—' }}</td>
              <td>{{ r.effective_level ? 'L' + r.effective_level : '—' }}</td>
              <td>{{ r.submitted_by_display_name || '—' }}</td>
              <td>{{ r.approver_display_name || (r.effective_level === 1 ? 'Trio (Level 1)' : 'Unassigned') }}</td>
              <td class="apg-num" [style.fontWeight]="r.aging ? '700' : '400'">{{ r.days_waiting }}</td>
              <td class="apg-waiting">{{ r.waiting_on?.line || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .apg-page { padding: var(--triarq-space-lg, 24px); }
    .apg-header h2 { margin: 0 0 4px 0; font-family: Roboto, sans-serif; font-weight: 500; font-size: 22px; color: var(--triarq-color-deep-navy, #00274E); }
    .apg-desc { font: italic 11px Roboto, sans-serif; color: var(--triarq-color-text-secondary, #5A5A5A); margin-bottom: 14px; }
    .apg-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
    .apg-f { border: 1px solid var(--triarq-color-border, #B9C4CE); border-radius: var(--triarq-radius-input, 5px); padding: 5px 8px; font: 400 12px Roboto; }
    .apg-check { font: 400 12px Roboto; color: #1E1E1E; display: inline-flex; align-items: center; gap: 5px; }
    .apg-clear { background: none; border: none; color: var(--triarq-color-primary, #257099); font: 500 12px Roboto; cursor: pointer; text-decoration: underline; }
    .apg-count { font: italic 11px Roboto; color: var(--triarq-color-text-secondary, #5A5A5A); margin-left: auto; }
    .apg-empty { font: italic 12px Roboto, sans-serif; color: var(--triarq-color-text-secondary, #5A5A5A); padding: 24px 0; }
    .apg-error { border: 2px solid #d32f2f; border-radius: 5px; padding: 8px 12px; font-size: 12px; color: #d32f2f; }

    /* Contract 41: targeted-refresh confirmation — D-200 Pattern 2 geometry in
       the primary tint, because nothing here needs attention. */
    .apg-refresh-note { display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 12px;
                        background: rgba(37,112,153,0.07); border-left: 3px solid var(--triarq-color-primary, #257099);
                        border-radius: 5px; font: 400 12px Roboto, sans-serif; color: #1a1a1a; }
    .apg-refresh-icon { color: var(--triarq-color-primary, #257099); font-weight: 700; }

    /* Card surface — radius 10 + token border, per the Initiative list. */
    .apg-card { background: #fff; border: 1px solid var(--triarq-color-border, #DDE5EA); border-radius: var(--triarq-radius-card, 10px); overflow: hidden; }
    .apg-table { width: 100%; border-collapse: collapse; font: 400 13px Roboto, sans-serif; }

    /* Contract 41: header chrome copied from the All Initiatives grid — navy
       ground, white uppercase labels, sticky. The prior pale #F7FAFC header did
       not match the screen this one is supposed to look like. */
    .apg-table thead th { text-align: left; padding: 8px 14px;
                          font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px;
                          color: #fff; background: #12274A;
                          position: sticky; top: 0; z-index: 3; }
    .apg-table thead th:first-child { border-top-left-radius: 6px; }
    .apg-table thead th:last-child  { border-top-right-radius: 6px; }
    .apg-num { text-align: right; }
    .apg-sortable { cursor: pointer; user-select: none; }
    /* Hover must stay legible on navy — lighten, never drop to the link blue. */
    .apg-table thead th.apg-sortable:hover { background: #1B355F; }

    .apg-row td { padding: 11px 14px; border-bottom: 1px solid #E8E8E8; color: #1a1a1a; }
    .apg-row:last-child td { border-bottom: none; }
    .apg-row { cursor: pointer; }
    .apg-row:nth-child(even) td { background: #FBFDFE; }
    .apg-row:hover td { background: #F0F4F8; }
    .apg-strong { font-weight: 600; }
    .apg-row--aging td { background: rgba(242, 166, 32, 0.08); }
    .apg-row--aging td:first-child { border-left: 3px solid var(--triarq-color-warning, #F2A620); }
    /* The Initiative just acted on — selected treatment from the Initiative grid. */
    .apg-row--refreshed td { background: #E8F0FE; }
    .apg-row--refreshed td:first-child { border-left: 3px solid var(--triarq-color-primary, #257099); }
    .apg-waiting { font-style: italic; color: var(--triarq-color-text-secondary, #5A5A5A); }
  `]
})
export class AllPendingGatesComponent implements OnInit {
  rows: AllPendingGateRow[] = [];
  agingThresholdDays = 7;
  loading = true;
  errorText = '';

  // Filters (client-side over the loaded rows).
  search = '';
  filterDivision = '';
  filterApprover = '';
  filterSubmitter = '';
  filterLevel = '';
  filterAging = false;

  sortField: ApgSort = 'days';
  sortDir: 'asc' | 'desc' = 'desc';

  /** Contract 41: the Initiative just returned from, highlighted on arrival. */
  refreshedCycleId: string | null = null;
  refreshNotice = '';

  constructor(
    private readonly delivery: DeliveryService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Contract 41: ?refresh=<cycle id> means we came back from acting on a gate.
    const refreshId = this.route.snapshot.queryParamMap.get('refresh');
    const snapshot = this.readSnapshot();

    if (refreshId && snapshot) {
      this.refreshedCycleId = refreshId;
      this.refreshOneCycle(refreshId, snapshot);
    } else {
      // No snapshot to splice into (direct visit, reload, or an expired
      // snapshot) — a full load is the only honest option.
      this.refreshedCycleId = refreshId;
      this.load();
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  private load(): void {
    this.loading = true; this.cdr.markForCheck();
    this.delivery.listAllPendingGates().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.rows = res.data.pending_gates;
          this.agingThresholdDays = res.data.aging_threshold_days;
          this.writeSnapshot();
        } else { this.errorText = res.error ?? 'Could not load pending gates.'; }
        this.loading = false; this.cdr.markForCheck();
      },
      error: (err: { error?: string }) => {
        this.errorText = err.error ?? 'Could not load pending gates.';
        this.loading = false; this.cdr.markForCheck();
      }
    });
  }

  /**
   * Contract 41: re-query ONE Initiative and splice its rows into the snapshot,
   * leaving every other row as it was. This is the "refreshed on the one
   * initiative only" behaviour — the queue does not flash and reorder around a
   * decision the user just made.
   *
   * Any failure falls back to a full load rather than showing a stale queue.
   */
  private refreshOneCycle(cycleId: string, snapshot: ApgSnapshot): void {
    this.loading = true; this.cdr.markForCheck();
    this.delivery.listPendingGatesForCycle(cycleId).subscribe({
      next: (res) => {
        if (!res.success || !res.data) { this.load(); return; }

        const others = snapshot.rows.filter(r => r.delivery_cycle_id !== cycleId);
        const before = snapshot.rows.length - others.length;
        const fresh  = res.data.pending_gates;

        this.rows = [...others, ...fresh];
        this.agingThresholdDays = res.data.aging_threshold_days;
        this.refreshNotice = this.buildRefreshNotice(before, fresh);
        this.writeSnapshot();
        this.loading = false; this.cdr.markForCheck();
      },
      error: () => { this.load(); }
    });
  }

  /** Plain-language account of what the targeted refresh changed (S-001). */
  private buildRefreshNotice(gatesBefore: number, fresh: AllPendingGateRow[]): string {
    const title = fresh[0]?.cycle_title ?? '';
    if (fresh.length === 0) {
      return gatesBefore > 0
        ? 'Updated — that Initiative has no gates awaiting approval any more.'
        : 'Updated — that Initiative still has no gates awaiting approval.';
    }
    const subject = title ? `${title}` : 'That Initiative';
    return fresh.length === 1
      ? `Updated — ${subject} has 1 gate awaiting approval.`
      : `Updated — ${subject} has ${fresh.length} gates awaiting approval.`;
  }

  // ── Snapshot (transient; sessionStorage, never user_screen_state) ──────────

  private writeSnapshot(): void {
    try {
      const snap: ApgSnapshot = {
        saved_at_ms:          Date.now(),
        rows:                 this.rows,
        aging_threshold_days: this.agingThresholdDays
      };
      sessionStorage.setItem(APG_SNAPSHOT_KEY, JSON.stringify(snap));
    } catch {
      // Storage unavailable or over quota — the round trip degrades to a full
      // load, which is correct behaviour, not an error worth surfacing.
    }
  }

  private readSnapshot(): ApgSnapshot | null {
    try {
      const raw = sessionStorage.getItem(APG_SNAPSHOT_KEY);
      if (!raw) { return null; }
      const snap = JSON.parse(raw) as ApgSnapshot;
      if (!Array.isArray(snap?.rows)) { return null; }
      // Past the TTL the other rows cannot be trusted — force a full load.
      if (Date.now() - (snap.saved_at_ms ?? 0) > APG_SNAPSHOT_TTL_MS) { return null; }
      return snap;
    } catch {
      return null;
    }
  }

  // ── Filter options ─────────────────────────────────────────────────────────

  get divisionOptions(): string[] {
    return [...new Set(this.rows.map(r => r.division_display_name_short).filter(Boolean))].sort();
  }
  get approverOptions(): string[] {
    return [...new Set(this.rows.map(r => r.approver_display_name).filter((n): n is string => !!n))].sort();
  }
  /** Contract 41: submitters present in the loaded queue. */
  get submitterOptions(): string[] {
    return [...new Set(this.rows.map(r => r.submitted_by_display_name).filter((n): n is string => !!n))].sort();
  }
  get anyFilterActive(): boolean {
    return !!(this.search.trim() || this.filterDivision || this.filterApprover ||
              this.filterSubmitter || this.filterLevel || this.filterAging);
  }
  clearFilters(): void {
    this.search = ''; this.filterDivision = ''; this.filterApprover = '';
    this.filterSubmitter = ''; this.filterLevel = ''; this.filterAging = false;
    this.cdr.markForCheck();
  }

  get visibleRows(): AllPendingGateRow[] {
    const q = this.search.trim().toLowerCase();
    let out = this.rows.filter(r =>
      (!q || r.cycle_title.toLowerCase().includes(q)) &&
      (!this.filterDivision || r.division_display_name_short === this.filterDivision) &&
      (!this.filterApprover || r.approver_display_name === this.filterApprover) &&
      (!this.filterSubmitter || r.submitted_by_display_name === this.filterSubmitter) &&
      (!this.filterLevel || String(r.effective_level ?? '') === this.filterLevel) &&
      (!this.filterAging || r.aging)
    );
    const dir = this.sortDir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      switch (this.sortField) {
        case 'days':       return (a.days_waiting - b.days_waiting) * dir;
        case 'initiative': return a.cycle_title.localeCompare(b.cycle_title) * dir;
        case 'division':   return (a.division_display_name_short || '').localeCompare(b.division_display_name_short || '') * dir;
        case 'level':      return ((a.effective_level ?? 0) - (b.effective_level ?? 0)) * dir;
        case 'submitter':  return (a.submitted_by_display_name || '').localeCompare(b.submitted_by_display_name || '') * dir;
        case 'approver':   return (a.approver_display_name || '').localeCompare(b.approver_display_name || '') * dir;
      }
    });
    return out;
  }

  setSort(f: ApgSort): void {
    if (this.sortField === f) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = f; this.sortDir = f === 'days' ? 'desc' : 'asc'; }
    this.cdr.markForCheck();
  }
  arrow(f: ApgSort): string { return this.sortField === f ? (this.sortDir === 'asc' ? '↑' : '↓') : '↕'; }

  open(r: AllPendingGateRow): void {
    // Snapshot before leaving so the return trip can splice rather than reload.
    this.writeSnapshot();
    this.router.navigate(['/initiatives', r.delivery_cycle_id], {
      queryParams: {
        gate: r.gate_name,
        // Contract 41: the Back link returns here and names the Initiative to
        // re-query. Kept as one string because the detail component navigates
        // by URL (navigateByUrl), not by a params array.
        //
        // The absolute path matters. This was previously 'all-pending-gates',
        // which navigateByUrl resolves as the ROOT path /all-pending-gates —
        // a route that does not exist. The real route is nested under
        // /initiatives (delivery.module.ts). The Back link from a gate opened
        // here has been dead since Contract G8; this fixes it.
        returnTo: `/initiatives/all-pending-gates?refresh=${r.delivery_cycle_id}`
      }
    });
  }
}
