// division-assignment-picker.component.ts — D-436 Division Assignment Picker
// Single-select Division picker with scoping (D-436), Trust grouping (D-433),
// and picker history (D-380 user_screen_state).
//
// Non-Admin viewers: opens with "My Divisions + descendants" short list,
// "Show all divisions" link expands. Expansion doesn't persist.
// Admin viewers: opens with "Recently Used" section (last 5 selected via
// any assignment picker) then full grouped Division list.
//
// D-93 (MCP-only DB access): commit writes picker history via
//   upsert_user_screen_state under the shared `picker.division.recent` key.
// D-433: list rendered in Trust groups with 16px indent on non-Trust rows.
// D-178: open as a modal panel (matches user-picker pattern).
//
// Inputs:
//   - currentDivisionId  — the currently-selected Division id, or null
//   - isAdmin            — true when the calling user has admin role flag
//   - myDivisions        — caller's directly-assigned + descendant Divisions
//   - allDivisions       — full active Division set (S-032 filter applied
//                          upstream by the caller)
// Outputs:
//   - selected(divisionId: string) — committed selection
//   - cancelled()                  — picker closed without commit

import {
  Component, Input, Output, EventEmitter, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription }       from 'rxjs';
import { McpService }         from '../../../core/services/mcp.service';
import {
  ScreenStateService,
  SCREEN_KEYS
} from '../../../core/services/screen-state.service';
import { Division }           from '../../../core/types/database';
import {
  DivisionTrustGroup,
  groupDivisionsByTrust
} from '../../../core/utils/division-grouping';

/** D-436 picker history screen key — re-export for callers that need it. */
export const DIVISION_RECENT_SCREEN_KEY = SCREEN_KEYS.PICKER_DIVISION_RECENT;
/** D-436 picker history cap — last 5 selected Divisions per user. */
export const DIVISION_RECENT_MAX = 5;

@Component({
  selector:        'app-division-assignment-picker',
  standalone:      true,
  imports:         [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dap-overlay" (click)="onOverlayClick($event)">
      <div class="dap-modal" role="dialog" aria-modal="true" aria-label="Select Division">

        <div class="dap-header">
          <h2 class="dap-title">Select Division</h2>
          <button class="dap-close" (click)="cancel()" aria-label="Close">✕</button>
        </div>

        <div class="dap-search-row">
          <input class="dap-search-input"
                 type="text"
                 [formControl]="searchCtrl"
                 placeholder="Search divisions…"
                 aria-label="Search Divisions" />
        </div>

        <!-- Zero-assignment stone note (D-436 non-Admin path) -->
        <div *ngIf="!isAdmin && (myDivisions?.length ?? 0) === 0"
             class="dap-no-assigned">
          No divisions assigned to your account.
        </div>

        <div class="dap-list" role="listbox">

          <!-- Admin: Recently Used section (absent on first use) -->
          <ng-container *ngIf="isAdmin && recentDivisions.length > 0">
            <div class="dap-trust-label">Recently Used</div>
            <div *ngFor="let d of recentDivisions"
                 class="dap-row dap-row-indent"
                 [class.dap-selected]="d.id === selectedId"
                 (click)="onPick(d.id)"
                 role="option">
              <span class="dap-name">{{ d.division_name }}</span>
            </div>
          </ng-container>

          <!-- Group sections per D-433 -->
          <ng-container *ngFor="let g of visibleGroups">
            <!-- Trust label — non-selectable when more than one Trust visible
                 (D-436: omit Trust group header when only one Trust). -->
            <div *ngIf="visibleGroups.length > 1" class="dap-trust-label">
              {{ g.trust.division_name }}
            </div>
            <div *ngFor="let d of g.children"
                 class="dap-row"
                 [class.dap-row-indent]="visibleGroups.length > 1"
                 [class.dap-selected]="d.id === selectedId"
                 (click)="onPick(d.id)"
                 role="option">
              <span class="dap-name">{{ d.division_name }}</span>
            </div>
          </ng-container>

          <div *ngIf="visibleGroups.length === 0 && !searchCtrl.value"
               class="dap-empty">
            No divisions to display.
          </div>
          <div *ngIf="visibleGroups.length === 0 && searchCtrl.value"
               class="dap-empty">
            No divisions match "{{ searchCtrl.value }}".
          </div>
        </div>

        <!-- D-436: Show all / Show fewer toggle — non-Admin only, only when
             the user has at least one assigned Division. -->
        <div *ngIf="!isAdmin && (myDivisions?.length ?? 0) > 0"
             class="dap-show-all-row">
          <button type="button" class="dap-link"
                  (click)="toggleShowAll()">
            {{ showingAll ? 'Show fewer' : 'Show all divisions' }}
          </button>
        </div>

        <div class="dap-footer">
          <button type="button" class="dap-btn-secondary" (click)="cancel()">
            Cancel
          </button>
          <button type="button" class="dap-btn-primary"
                  [disabled]="!selectedId"
                  (click)="commit()">
            Select
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dap-overlay {
      position: fixed; inset: 0; background: rgba(18, 39, 74, 0.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .dap-modal {
      background: #fff; border-radius: 10px; width: min(520px, 90vw);
      max-height: 80vh; display: flex; flex-direction: column;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18); overflow: hidden;
    }
    .dap-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #E8E8E8;
    }
    .dap-title { margin: 0; font-size: 16px; font-weight: 600; color: #1E1E1E; }
    .dap-close {
      background: none; border: none; cursor: pointer; font-size: 18px;
      color: #5A5A5A; padding: 4px 8px;
    }
    .dap-search-row { padding: 12px 20px; border-bottom: 1px solid #F0F0F0; }
    .dap-search-input {
      width: 100%; padding: 8px 12px; font-size: 13px;
      border: 1px solid #D6D6D6; border-radius: 5px;
      font-family: Roboto, sans-serif;
    }
    .dap-no-assigned {
      padding: 8px 20px; color: #5A5A5A; font-size: 12px; font-style: italic;
    }
    .dap-list { flex: 1 1 auto; overflow-y: auto; padding: 8px 0; }
    .dap-trust-label {
      padding: 8px 20px 4px; font-size: 11px; font-weight: 600;
      color: #5A5A5A; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .dap-row {
      padding: 8px 20px; cursor: pointer; font-size: 13px;
      display: flex; align-items: center;
    }
    .dap-row:hover { background: #F0F4F8; }
    .dap-row-indent { padding-left: 36px; } /* 20 + 16px D-433 indent */
    .dap-selected   { background: #E8F0FE; }
    .dap-name       { color: #1E1E1E; }
    .dap-empty {
      padding: 16px 20px; color: #9E9E9E; font-style: italic; font-size: 12px;
    }
    .dap-show-all-row {
      padding: 8px 20px; border-top: 1px solid #F0F0F0;
    }
    .dap-link {
      background: none; border: none; color: var(--triarq-color-primary, #257099);
      cursor: pointer; font-size: 12px; padding: 0;
      font-family: Roboto, sans-serif;
    }
    .dap-link:hover { text-decoration: underline; }
    .dap-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 1px solid #E8E8E8;
    }
    .dap-btn-secondary {
      background: #fff; border: 1px solid #D6D6D6; border-radius: 5px;
      padding: 8px 16px; font-size: 13px; cursor: pointer;
      font-family: Roboto, sans-serif;
    }
    .dap-btn-primary {
      background: var(--triarq-color-primary, #257099); border: none;
      border-radius: 5px; padding: 8px 16px; font-size: 13px; color: #fff;
      cursor: pointer; font-family: Roboto, sans-serif;
    }
    .dap-btn-primary:disabled {
      opacity: 0.45; cursor: not-allowed;
    }
  `]
})
export class DivisionAssignmentPickerComponent implements OnInit {
  @Input() currentDivisionId: string | null = null;
  @Input() isAdmin:           boolean = false;
  @Input() myDivisions:       Division[] = [];
  @Input() allDivisions:      Division[] = [];

  @Output() selected  = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  selectedId: string | null = null;
  showingAll = false;
  recentDivisions: Division[] = [];

  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });
  private searchSub?: Subscription;
  /** Cached search lowercased — recomputed only when searchCtrl emits. */
  private searchTerm = '';

  constructor(
    private readonly mcp:        McpService,
    private readonly screenState: ScreenStateService,
    private readonly cdr:        ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedId = this.currentDivisionId;
    this.searchSub = this.searchCtrl.valueChanges.subscribe(v => {
      this.searchTerm = (v || '').toLowerCase().trim();
      this.cdr.markForCheck();
    });
    if (this.isAdmin) { this.loadRecentDivisions(); }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  /** D-436 visible Division set, filtered by search and scope. */
  get visibleGroups(): DivisionTrustGroup[] {
    const base = this.baseDivisions();
    const filtered = this.searchTerm
      ? base.filter(d =>
          d.division_name.toLowerCase().includes(this.searchTerm)
          || (d.display_name_short ?? '').toLowerCase().includes(this.searchTerm))
      : base;
    return groupDivisionsByTrust(filtered);
  }

  /** Source set for the picker — short list (non-Admin default) or full list. */
  private baseDivisions(): Division[] {
    // Admin: always full list (Recently Used is rendered separately above).
    if (this.isAdmin) { return this.allDivisions; }
    // Non-Admin, zero assignments: full list per D-436 zero-assignment path.
    if ((this.myDivisions?.length ?? 0) === 0) { return this.allDivisions; }
    // Non-Admin with assignments: short list unless toggled.
    return this.showingAll ? this.allDivisions : this.myDivisions;
  }

  toggleShowAll(): void {
    this.showingAll = !this.showingAll;
    this.cdr.markForCheck();
  }

  onPick(divisionId: string): void {
    this.selectedId = divisionId;
    this.cdr.markForCheck();
  }

  commit(): void {
    if (!this.selectedId) { return; }
    this.upsertPickerHistory(this.selectedId);
    this.selected.emit(this.selectedId);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(ev: Event): void {
    if (ev.target === ev.currentTarget) { this.cancel(); }
  }

  /** Load Admin's recent Division ids from user_screen_state. */
  private loadRecentDivisions(): void {
    this.screenState.restore(DIVISION_RECENT_SCREEN_KEY)
      .then(saved => {
        if (!saved) { return; }
        const filter = saved.filter_state as { ids?: unknown } | null;
        const ids    = Array.isArray(filter?.ids)
          ? (filter!.ids as unknown[]).filter((x): x is string => typeof x === 'string')
          : [];
        const byId = new Map<string, Division>();
        for (const d of this.allDivisions) { byId.set(d.id, d); }
        this.recentDivisions = ids
          .map(id => byId.get(id))
          .filter((d): d is Division => !!d);
        this.cdr.markForCheck();
      });
  }

  /** D-436 picker history upsert: prepend, dedupe, cap 5. Fire-and-forget. */
  private upsertPickerHistory(divisionId: string): void {
    this.screenState.restore(DIVISION_RECENT_SCREEN_KEY)
      .then(saved => {
        const existing = (saved?.filter_state as { ids?: unknown } | null);
        const priorIds: string[] = Array.isArray(existing?.ids)
          ? (existing!.ids as unknown[]).filter((x): x is string => typeof x === 'string')
          : [];
        const deduped = [divisionId, ...priorIds.filter(id => id !== divisionId)]
          .slice(0, DIVISION_RECENT_MAX);
        this.screenState.save(
          DIVISION_RECENT_SCREEN_KEY,
          { ids: deduped },
          {}
        );
      });
  }
}
