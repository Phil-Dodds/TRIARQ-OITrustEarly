// division-tree-picker.component.ts — Pathways OI Trust
// Hierarchical tree multi-select picker for Division assignment. Replaces the flat
// "Assign a Trust" / inline checkbox list on User Management Assign Divisions.
//
// Governing: D-417 — modal overlay (D-182 pattern). Trust rows bold no indent,
// Service Line rows 24px indent, Functional Team rows 48px indent. All Trusts
// expanded by default. Checkboxes on every row; selecting a parent does NOT
// cascade to children (access inheritance per D-135 is downward and lives
// server-side). Search filters by name and auto-expands matched branches.
// Inactive Divisions dimmed and non-selectable per S-032. Echo section below
// tree as dismissible chips. Pre-checks currently-assigned Divisions on open.
//
// Caller is responsible for the MCP diff: this component emits the new
// selection set on confirm; parent diffs against currentlyAssignedIds and
// calls assign_user_to_division / revoke_division_membership only for changed
// items per D-414.
//
// D-93: no direct Supabase access. ChangeDetection: OnPush.

import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Division } from '../../../core/types/database';

interface TreeRow {
  division:  Division;
  depth:     number;
  hasChildren: boolean;
  hidden:    boolean;  // hidden because parent collapsed
  searchHit: boolean;  // matches active search query
}

@Component({
  selector:        'app-division-tree-picker',
  standalone:      true,
  imports:         [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dtp-overlay" (click)="onOverlayClick($event)">
      <div class="dtp-modal" role="dialog" aria-modal="true" aria-label="Assign Divisions">

        <!-- Header — D-416: × in sticky panel header at title vertical center -->
        <div class="dtp-header">
          <h2 class="dtp-title">Assign Divisions</h2>
          <button class="dtp-close" (click)="onCancel()" aria-label="Close picker">✕</button>
        </div>

        <!-- Search -->
        <div class="dtp-search-row">
          <input class="dtp-search-input"
                 type="text"
                 [(ngModel)]="searchQuery"
                 (ngModelChange)="onSearchChange()"
                 placeholder="Search Divisions…"
                 aria-label="Search Divisions" />
        </div>

        <!-- Tree list -->
        <div class="dtp-list-container">
          <div *ngIf="visibleRows.length === 0" class="dtp-empty">
            No Divisions match this search.
          </div>

          <div *ngFor="let row of visibleRows; trackBy: trackByDivisionId"
               class="dtp-row"
               [class.dtp-row-trust]="row.depth === 0"
               [class.dtp-row-inactive]="!isActive(row.division)"
               [style.padding-left.px]="20 + row.depth * 24">

            <!-- Expand chevron OR placeholder -->
            <button *ngIf="row.hasChildren"
                    class="dtp-chev"
                    (click)="toggleExpand(row.division.id)"
                    [attr.aria-expanded]="isExpanded(row.division.id)"
                    [attr.aria-label]="(isExpanded(row.division.id) ? 'Collapse ' : 'Expand ') + row.division.division_name">
              {{ isExpanded(row.division.id) ? '▼' : '▶' }}
            </button>
            <span *ngIf="!row.hasChildren" class="dtp-chev dtp-chev-placeholder">·</span>

            <!-- Checkbox -->
            <input type="checkbox"
                   class="dtp-checkbox"
                   [checked]="isSelected(row.division.id)"
                   [disabled]="!isActive(row.division)"
                   (change)="toggleSelect(row.division.id)"
                   [attr.aria-label]="row.division.division_name" />

            <!-- Name -->
            <span class="dtp-name" [class.dtp-name-bold]="row.depth === 0">
              {{ row.division.division_name }}
              <span *ngIf="!isActive(row.division)" class="dtp-inactive-badge">⊘ Inactive</span>
            </span>
          </div>
        </div>

        <!-- Echo section -->
        <div class="dtp-echo-section" *ngIf="selectedChips.length > 0">
          <div class="dtp-echo-label">Selected ({{ selectedChips.length }})</div>
          <div class="dtp-echo-chips">
            <span class="dtp-echo-chip" *ngFor="let chip of selectedChips">
              {{ chip.division_name }}
              <button class="dtp-echo-x"
                      (click)="toggleSelect(chip.id)"
                      [attr.aria-label]="'Remove ' + chip.division_name">×</button>
            </span>
          </div>
        </div>
        <div *ngIf="selectedChips.length === 0" class="dtp-echo-empty">
          No Divisions selected.
        </div>

        <!-- D-140 Blocked Action UX — Confirm stays enabled. Clicking with no
             changes shows the reason inline rather than hiding it behind a
             disabled button. -->
        <div *ngIf="confirmBlockedReason" class="dtp-block-msg" role="alert">
          {{ confirmBlockedReason }}
        </div>

        <!-- Footer -->
        <div class="dtp-footer">
          <button class="dtp-btn-cancel" type="button" (click)="onCancel()">Cancel</button>
          <button class="dtp-btn-confirm" type="button"
                  (click)="onConfirm()">
            Confirm
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dtp-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1100;
    }
    .dtp-modal {
      background: #fff; border-radius: 10px;
      width: 560px; max-width: 95vw; max-height: 80vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }
    .dtp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; background: #12274A;
    }
    .dtp-title { margin: 0; font: 600 18px/1.2 Roboto, sans-serif; color: #fff; }
    .dtp-close {
      background: none; border: none; color: rgba(255,255,255,0.7);
      font-size: 18px; cursor: pointer; padding: 4px 8px;
    }
    .dtp-close:hover { color: #fff; }

    .dtp-search-row { padding: 12px 20px; border-bottom: 1px solid #E8E8E8; }
    .dtp-search-input {
      width: 100%; box-sizing: border-box;
      border: 1.5px solid #D0D0D0; border-radius: 5px;
      padding: 8px 12px; font: 400 14px Roboto, sans-serif; color: #262626;
    }
    .dtp-search-input:focus {
      outline: none; border-color: #257099;
      box-shadow: 0 0 0 3px rgba(37,112,153,0.15);
    }

    .dtp-list-container { overflow-y: auto; flex: 1; padding: 4px 0; }
    .dtp-empty {
      padding: 20px; text-align: center;
      font: 400 13px Roboto, sans-serif; color: #5A5A5A;
    }

    .dtp-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 20px;
      cursor: default;
      border-left: 3px solid transparent;
    }
    .dtp-row:hover { background: #F0F4F8; }
    .dtp-row-inactive { opacity: 0.55; }

    .dtp-chev {
      width: 20px; height: 20px;
      background: none; border: none; cursor: pointer; padding: 0;
      font: 11px/1 Roboto, sans-serif; color: #5A5A5A;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .dtp-chev:hover { color: #257099; }
    .dtp-chev-placeholder { visibility: hidden; cursor: default; }

    .dtp-checkbox {
      width: 16px; height: 16px; cursor: pointer; flex-shrink: 0;
      accent-color: #257099;
    }
    .dtp-checkbox:disabled { cursor: not-allowed; }

    .dtp-name {
      flex: 1; font: 400 13px/1.3 Roboto, sans-serif; color: #1E1E1E;
      display: flex; align-items: center; gap: 8px;
    }
    .dtp-name-bold { font-weight: 600; }

    .dtp-inactive-badge {
      background: #F5F5F5; color: #757575;
      border-radius: 4px; padding: 1px 6px;
      font: 500 10px Roboto, sans-serif;
    }

    .dtp-echo-section {
      padding: 10px 20px;
      border-top: 1px solid #E8E8E8;
      background: #FAFAFA;
      max-height: 30%; overflow-y: auto;
    }
    .dtp-echo-label {
      font: 500 11px Roboto, sans-serif; color: #5A5A5A;
      text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;
    }
    .dtp-echo-chips {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .dtp-echo-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: rgba(37,112,153,0.1); color: #257099;
      border-radius: 999px; padding: 4px 10px;
      font: 400 12px Roboto, sans-serif;
    }
    .dtp-echo-x {
      background: none; border: none; color: #257099; cursor: pointer;
      font: 500 14px/1 Roboto, sans-serif; padding: 0 0 0 2px;
    }
    .dtp-echo-x:hover { color: #1d5878; }
    .dtp-echo-empty {
      padding: 10px 20px; border-top: 1px solid #E8E8E8;
      font: 400 italic 12px Roboto, sans-serif; color: #9E9E9E;
      background: #FAFAFA;
    }

    .dtp-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding: 14px 20px; border-top: 1px solid #E8E8E8;
    }
    .dtp-btn-cancel {
      background: #fff; border: 1.5px solid #D0D0D0; border-radius: 5px;
      padding: 8px 20px; font: 500 14px Roboto, sans-serif; color: #5A5A5A;
      cursor: pointer;
    }
    .dtp-btn-cancel:hover { background: #F5F5F5; }
    .dtp-btn-confirm {
      background: #257099; border: none; border-radius: 5px;
      padding: 8px 24px; font: 500 14px Roboto, sans-serif; color: #fff;
      cursor: pointer;
    }
    .dtp-btn-confirm:hover { background: #1d5878; }
    /* D-140 inline block-message — appears above footer when Confirm clicked with no changes. */
    .dtp-block-msg {
      padding: 8px 20px; border-top: 1px solid #E8E8E8;
      background: rgba(243,150,30,0.08); border-left: 3px solid #F3961E;
      font: 400 12px Roboto, sans-serif; color: #5A5A5A;
    }
  `]
})
export class DivisionTreePickerComponent implements OnInit, OnChanges {
  /** All Divisions (active and inactive). Inactive shown dimmed, not selectable. */
  @Input() allDivisions: Division[] = [];
  /** Division IDs currently assigned to the user — pre-checked on open. */
  @Input() currentlyAssignedIds: string[] = [];

  /** Emits the diff (toAdd / toRemove) when Confirm tapped. */
  @Output() confirmed = new EventEmitter<{ toAdd: string[]; toRemove: string[] }>();
  /** Emits on Cancel / overlay click / × close. */
  @Output() cancelled = new EventEmitter<void>();

  searchQuery = '';

  /** D-140 — inline reason shown when Confirm is clicked with no actionable change. */
  confirmBlockedReason = '';

  /** Currently selected Division IDs in this session (starts == currentlyAssignedIds). */
  selectedIds = new Set<string>();

  /** Trust IDs expanded by default; user can toggle. Children of expanded parents render. */
  expandedIds = new Set<string>();

  /** Built tree rows in display order (root → children, depth-first). */
  private allRows: TreeRow[] = [];

  /** Rows currently visible — filtered by collapse state and search. */
  visibleRows: TreeRow[] = [];

  /** Initial assignment snapshot for diff. */
  private initialAssignedSet = new Set<string>();

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initialAssignedSet = new Set(this.currentlyAssignedIds);
    this.selectedIds = new Set(this.currentlyAssignedIds);
    this.expandAllTrusts();
    this.rebuildTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allDivisions'] || changes['currentlyAssignedIds']) {
      this.initialAssignedSet = new Set(this.currentlyAssignedIds);
      this.selectedIds = new Set(this.currentlyAssignedIds);
      this.expandAllTrusts();
      this.rebuildTree();
    }
  }

  // ── Tree construction ───────────────────────────────────────────────────

  private expandAllTrusts(): void {
    this.expandedIds = new Set(
      this.allDivisions
        .filter(d => d.division_level === 0)
        .map(d => d.id)
    );
  }

  /**
   * Build the depth-first ordered display rows from the flat division list.
   * Pure structural transformation — does not consider expand state or search;
   * those are applied by computeVisibility().
   */
  private rebuildTree(): void {
    const byParent = new Map<string | null, Division[]>();
    for (const d of this.allDivisions) {
      const pid = d.parent_division_id;
      const bucket = byParent.get(pid) ?? [];
      bucket.push(d);
      byParent.set(pid, bucket);
    }
    // Sort children alphabetically within each parent
    for (const arr of byParent.values()) {
      arr.sort((a, b) => a.division_name.localeCompare(b.division_name));
    }

    const rows: TreeRow[] = [];
    const walk = (parentId: string | null, depth: number): void => {
      const children = byParent.get(parentId) ?? [];
      for (const d of children) {
        const grandchildren = byParent.get(d.id) ?? [];
        rows.push({
          division:    d,
          depth,
          hasChildren: grandchildren.length > 0,
          hidden:      false,
          searchHit:   false
        });
        walk(d.id, depth + 1);
      }
    };
    walk(null, 0);

    this.allRows = rows;
    this.computeVisibility();
  }

  /**
   * Recompute which rows are visible based on (a) collapse state of ancestors
   * and (b) active search query. Search-active rows force-expand all ancestors.
   */
  private computeVisibility(): void {
    const q = this.searchQuery.trim().toLowerCase();
    const searchActive = q.length > 0;

    // Mark search hits
    for (const row of this.allRows) {
      row.searchHit = searchActive
        ? row.division.division_name.toLowerCase().includes(q)
        : false;
    }

    // When search active, derive set of ancestors of hit rows — force-expand them.
    const forceExpand = new Set<string>();
    if (searchActive) {
      // Build child → parent lookup for traversal
      const byId = new Map<string, Division>();
      for (const d of this.allDivisions) { byId.set(d.id, d); }
      for (const row of this.allRows) {
        if (!row.searchHit) { continue; }
        let pid = row.division.parent_division_id;
        while (pid) {
          forceExpand.add(pid);
          pid = byId.get(pid)?.parent_division_id ?? null;
        }
      }
    }

    // A row is visible if:
    //   - search inactive: ancestor chain all expanded
    //   - search active:   row hits OR has descendant hit (ancestor in forceExpand chain),
    //                      AND ancestor chain all expanded (via forceExpand union with expandedIds)
    const effectiveExpanded = new Set<string>([...this.expandedIds, ...forceExpand]);
    const byId = new Map<string, Division>();
    for (const d of this.allDivisions) { byId.set(d.id, d); }

    const visible: TreeRow[] = [];
    for (const row of this.allRows) {
      // Walk ancestor chain
      let pid = row.division.parent_division_id;
      let ancestorsAllExpanded = true;
      while (pid) {
        if (!effectiveExpanded.has(pid)) {
          ancestorsAllExpanded = false;
          break;
        }
        pid = byId.get(pid)?.parent_division_id ?? null;
      }
      if (!ancestorsAllExpanded) { continue; }

      if (searchActive) {
        // Visible if row hits OR any descendant hits.
        const descendantHit = this.hasDescendantHit(row.division.id, byId);
        if (!row.searchHit && !descendantHit) { continue; }
      }

      visible.push(row);
    }
    this.visibleRows = visible;
    this.cdr.markForCheck();
  }

  private hasDescendantHit(divisionId: string, byId: Map<string, Division>): boolean {
    // Walk allRows after divisionId, including only rows whose parent chain
    // includes divisionId. Efficient enough for the expected hierarchy depth (3).
    const childIdSet = new Set<string>();
    const collect = (id: string): void => {
      for (const d of this.allDivisions) {
        if (d.parent_division_id === id) {
          childIdSet.add(d.id);
          collect(d.id);
        }
      }
    };
    collect(divisionId);
    for (const id of childIdSet) {
      const d = byId.get(id);
      if (!d) { continue; }
      if (d.division_name.toLowerCase().includes(this.searchQuery.trim().toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  // ── User interactions ───────────────────────────────────────────────────

  onSearchChange(): void {
    this.computeVisibility();
  }

  toggleExpand(divisionId: string): void {
    if (this.expandedIds.has(divisionId)) {
      this.expandedIds.delete(divisionId);
    } else {
      this.expandedIds.add(divisionId);
    }
    this.computeVisibility();
  }

  isExpanded(divisionId: string): boolean {
    return this.expandedIds.has(divisionId);
  }

  toggleSelect(divisionId: string): void {
    const div = this.allDivisions.find(d => d.id === divisionId);
    if (div && !this.isActive(div)) { return; }
    if (this.selectedIds.has(divisionId)) {
      this.selectedIds.delete(divisionId);
    } else {
      this.selectedIds.add(divisionId);
    }
    // D-140: any selection change clears the inline reason — the user is acting.
    this.confirmBlockedReason = '';
    this.cdr.markForCheck();
  }

  isSelected(divisionId: string): boolean {
    return this.selectedIds.has(divisionId);
  }

  isActive(division: Division): boolean {
    return division.active_status !== false;
  }

  get selectedChips(): Division[] {
    const arr: Division[] = [];
    for (const id of this.selectedIds) {
      const d = this.allDivisions.find(x => x.id === id);
      if (d) { arr.push(d); }
    }
    arr.sort((a, b) => a.division_name.localeCompare(b.division_name));
    return arr;
  }

  get hasChanges(): boolean {
    if (this.selectedIds.size !== this.initialAssignedSet.size) { return true; }
    for (const id of this.selectedIds) {
      if (!this.initialAssignedSet.has(id)) { return true; }
    }
    return false;
  }

  onConfirm(): void {
    // D-140: Confirm stays enabled; if no diff against initial set, show the
    // reason inline rather than disabling the button silently.
    if (!this.hasChanges) {
      this.confirmBlockedReason =
        'No Division changes to apply. Check or uncheck a Division, or tap Cancel to close.';
      this.cdr.markForCheck();
      return;
    }
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    for (const id of this.selectedIds) {
      if (!this.initialAssignedSet.has(id)) { toAdd.push(id); }
    }
    for (const id of this.initialAssignedSet) {
      if (!this.selectedIds.has(id)) { toRemove.push(id); }
    }
    this.confirmed.emit({ toAdd, toRemove });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dtp-overlay')) {
      this.onCancel();
    }
  }

  trackByDivisionId(_index: number, row: TreeRow): string {
    return row.division.id;
  }
}
