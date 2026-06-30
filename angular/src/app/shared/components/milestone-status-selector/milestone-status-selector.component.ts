// milestone-status-selector.component.ts — Contract 32 (WS2)
// Shared, single-definition selector for the five user-controlled milestone
// statuses (D-205). Created to satisfy D-477's "single source" intent — the
// confidence fields in the Status Update panel use THIS control. (Extraction
// approved by Phil; the detail view's existing gate rows are a future S-031
// pattern-sweep candidate — not swapped this contract.)
//
// Presentation only. Inputs: value, disabled. Output: valueChange.

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusConfidence } from '../../../core/types/initiative-status';

interface StatusOption { value: StatusConfidence; label: string; color: string; }

// D-205 five-value model + exact colors.
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'not_started', label: 'Not Started', color: '#9E9E9E' },
  { value: 'on_track',    label: 'On Track',    color: '#22c55e' },
  { value: 'at_risk',     label: 'At Risk',     color: '#F2A620' },
  { value: 'behind',      label: 'Behind',      color: '#E96127' },
  { value: 'complete',    label: 'Complete',    color: '#257099' }
];

@Component({
  selector: 'app-milestone-status-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="mss" role="radiogroup" [attr.aria-disabled]="disabled">
      <button type="button"
              *ngFor="let opt of options"
              class="mss-opt"
              role="radio"
              [attr.aria-checked]="value === opt.value"
              [class.mss-selected]="value === opt.value"
              [disabled]="disabled"
              [style.--mss-color]="opt.color"
              (click)="select(opt.value)">
        <span class="mss-dot" [style.background]="opt.color"></span>
        <span class="mss-label">{{ opt.label }}</span>
      </button>
    </div>
  `,
  styles: [`
    .mss { display:flex; flex-wrap:wrap; gap:6px; }
    .mss-opt {
      display:inline-flex; align-items:center; gap:6px;
      border:1px solid var(--triarq-color-border, #e0e0e0);
      background:#fff; border-radius:var(--radius-pill, 999px);
      padding:4px 10px; cursor:pointer; font-size:12px; font-family:Roboto, sans-serif;
      color:var(--triarq-color-text-primary, #1a1a1a);
    }
    .mss-opt:hover:not(:disabled) { background:var(--triarq-color-fog, #f4f4f4); }
    .mss-opt:disabled { cursor:default; opacity:0.6; }
    .mss-selected {
      border-color:var(--mss-color);
      box-shadow:inset 0 0 0 1px var(--mss-color);
      font-weight:500;
    }
    .mss-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  `]
})
export class MilestoneStatusSelectorComponent {
  @Input() value: StatusConfidence | null = null;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<StatusConfidence>();

  readonly options = STATUS_OPTIONS;

  select(v: StatusConfidence): void {
    if (this.disabled) { return; }
    this.value = v;
    this.valueChange.emit(v);
  }
}
