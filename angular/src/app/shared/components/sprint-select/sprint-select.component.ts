// sprint-select.component.ts — Pathways OI Trust
// Custom Sprint picker (replaces the native <select>, which can't colour
// options or collapse a subset). Phil 2026-07-28:
//   - Past sprints (end_date < today) always render in a lighter colour;
//     current + future render normal.
//   - Default visible set is anchored; older sprints tuck under "Older Sprints…":
//       * selected value is a PAST sprint → anchor at it (show it + everything
//         after; sprints OLDER than the selection go under the expander). A
//         past selection is never hidden.
//       * selected value is current/future/empty → anchor at the current sprint
//         (show current + future); ALL past sprints go under the expander.
//   - Expanding "Older Sprints…" reveals the hidden older ones (lighter).
// Reusable: two-way [(selectedId)]. Presentation only (Arch-2).

import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  HostListener, Input, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintRow } from '../../../core/types/database';
import { sprintDropdownLabel } from '../../../core/utils/sprint-resolution';

@Component({
  selector:        'app-sprint-select',
  standalone:      true,
  imports:         [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ss-root">
      <button type="button" class="ss-trigger" (click)="toggle($event)"
              [disabled]="!sprints.length">
        <span [class.ss-placeholder]="!selectedId">{{ triggerLabel }}</span>
        <span class="ss-caret">▾</span>
      </button>

      <div *ngIf="open" class="ss-pop">
        <!-- Older Sprints… expander (only when older sprints are hidden). -->
        <button *ngIf="hiddenOlder.length" type="button" class="ss-older"
                (click)="showOlder = !showOlder; $event.stopPropagation()">
          {{ showOlder ? '▾' : '▸' }} Older Sprints… ({{ hiddenOlder.length }})
        </button>
        <ng-container *ngIf="showOlder">
          <button *ngFor="let s of hiddenOlder" type="button"
                  class="ss-item ss-item--past" [class.ss-item--sel]="s.sprint_id === selectedId"
                  (click)="pick(s)">{{ label(s) }}</button>
        </ng-container>

        <!-- Anchor-forward set. Each coloured by its own past/current/future. -->
        <button *ngFor="let s of visibleSprints" type="button"
                class="ss-item" [class.ss-item--past]="isPast(s)"
                [class.ss-item--sel]="s.sprint_id === selectedId"
                (click)="pick(s)">{{ label(s) }}</button>

        <div *ngIf="!visibleSprints.length && !hiddenOlder.length" class="ss-empty">
          No sprints in this calendar.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ss-root { position: relative; }
    .ss-trigger {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      gap: 6px; border: 1px solid var(--triarq-color-border, #B9C4CE); border-radius: 5px;
      background: #fff; padding: 3px 8px; font: 400 12px Roboto, sans-serif; color: #1E1E1E;
      cursor: pointer; text-align: left;
    }
    .ss-trigger:disabled { opacity: .55; cursor: not-allowed; }
    .ss-placeholder { color: #9E9E9E; }
    .ss-caret { color: #9E9E9E; font-size: 10px; }
    .ss-pop {
      position: absolute; z-index: 50; top: calc(100% + 2px); left: 0; right: 0;
      max-height: 260px; overflow-y: auto; background: #fff;
      border: 1px solid var(--triarq-color-border, #B9C4CE); border-radius: 6px;
      box-shadow: 0 4px 14px rgba(0,0,0,.12); padding: 3px;
    }
    .ss-older {
      width: 100%; text-align: left; background: none; border: none; cursor: pointer;
      padding: 5px 8px; font: 600 11px Roboto, sans-serif; color: #257099;
      border-bottom: 1px solid #F0F0F0;
    }
    .ss-item {
      width: 100%; text-align: left; background: none; border: none; cursor: pointer;
      padding: 5px 8px; font: 400 12px Roboto, sans-serif; color: #1E1E1E; border-radius: 4px;
    }
    /* Past = lighter (Fog). */
    .ss-item--past { color: #9E9E9E; }
    .ss-item:hover { background: var(--triarq-color-background-subtle, #F4F7F9); }
    .ss-item--sel { background: rgba(37,112,153,0.10); font-weight: 600; }
    .ss-empty { padding: 8px; font: italic 11px Roboto, sans-serif; color: #9E9E9E; }
  `]
})
export class SprintSelectComponent {
  @Input() sprints: SprintRow[] = [];
  @Input() selectedId = '';
  @Output() selectedIdChange = new EventEmitter<string>();

  open = false;
  showOlder = false;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  private get todayStr(): string { return new Date().toISOString().slice(0, 10); }

  /** Chronological by start_date (defensive — calendars are usually ordered). */
  private get sorted(): SprintRow[] {
    return [...(this.sprints ?? [])].sort((a, b) => a.start_date.localeCompare(b.start_date));
  }

  isPast(s: SprintRow): boolean { return s.end_date < this.todayStr; }
  label(s: SprintRow): string { return sprintDropdownLabel(s); }

  /** Index of the first sprint shown by default (the anchor). */
  private get anchorIdx(): number {
    const arr = this.sorted;
    if (arr.length === 0) { return 0; }
    const today = this.todayStr;
    const sel = this.selectedId ? arr.find(s => s.sprint_id === this.selectedId) : null;
    // Past selection → anchor at it (never hide the selected past sprint).
    if (sel && sel.end_date < today) {
      return arr.findIndex(s => s.sprint_id === this.selectedId);
    }
    // Otherwise anchor at the first non-past (current, else next future).
    const firstNonPast = arr.findIndex(s => s.end_date >= today);
    return firstNonPast === -1 ? arr.length - 1 : firstNonPast;   // all-past calendar → show the latest
  }

  get hiddenOlder(): SprintRow[] { return this.sorted.slice(0, this.anchorIdx); }
  get visibleSprints(): SprintRow[] { return this.sorted.slice(this.anchorIdx); }

  get triggerLabel(): string {
    const sel = this.selectedId ? this.sorted.find(s => s.sprint_id === this.selectedId) : null;
    return sel ? this.label(sel) : 'Select sprint…';
  }

  toggle(ev: Event): void {
    ev.stopPropagation();
    this.open = !this.open;
    if (this.open) { this.showOlder = false; }
    this.cdr.markForCheck();
  }

  pick(s: SprintRow): void {
    this.selectedId = s.sprint_id;
    this.selectedIdChange.emit(s.sprint_id);
    this.open = false;
    this.cdr.markForCheck();
  }

  /** Close on any outside click. */
  @HostListener('document:click')
  onDocClick(): void {
    if (this.open) { this.open = false; this.cdr.markForCheck(); }
  }
}
