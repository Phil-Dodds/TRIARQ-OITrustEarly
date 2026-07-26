// gate-assessment-form.component.ts — Contract GA-1 (D-579)
// The ONE compact assessment screen (spec §7): header = gate purpose sentence
// + optional best-practices link; one row per item with six tap-chips
// (unselected = blank); inline comment expands per item only when tapped.
// The parent's action button stays disabled until every item is non-blank —
// this component reports completeness via (changed).

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ASSESSMENT_GRADES, AssessmentGrade, AssessmentRole, AssessmentItemDef, assessmentItemsFor
} from '../../../shared/constants/gate-assessment.constants';
import { GATE_COACHING_SHORT } from '../../../shared/constants/gate-coaching.constants';

export interface AssessmentPayloadItem { item_key: string; grade: AssessmentGrade; comment?: string; }
export interface AssessmentChange { complete: boolean; items: AssessmentPayloadItem[]; }

interface DraftRow { def: AssessmentItemDef; grade: AssessmentGrade | ''; comment: string; commentOpen: boolean; }

const GATE_LABEL_BY_KEY: Record<string, string> = {
  brief_review: 'Brief Review', go_to_build: 'Go to Build', go_to_deploy: 'Go to Deploy',
  go_to_release: 'Go to Release', close_review: 'Close Review'
};

@Component({
  selector: 'app-gate-assessment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ga-root">
      <!-- Header: the per-gate purpose sentence replaces the retired rotating
           GATE_PURPOSES line (GA-1 §1). Link renders iff a URL is configured. -->
      <div class="ga-header">
        <span class="ga-purpose">{{ purposeLine }}</span>
        <a *ngIf="linkUrl" class="ga-link" [href]="linkUrl" target="_blank" rel="noopener">
          Full best practices for this gate →
        </a>
      </div>

      <div *ngFor="let row of rows" class="ga-item">
        <div class="ga-item-row">
          <span class="ga-item-text">{{ row.def.text }}</span>
          <span class="ga-chips">
            <button *ngFor="let g of grades" type="button"
                    class="ga-chip"
                    [class.ga-chip--on]="row.grade === g"
                    [disabled]="disabled"
                    (click)="setGrade(row, g)">
              {{ g === 'NA' ? 'N/A' : g }}
            </button>
            <button type="button" class="ga-comment-toggle" [disabled]="disabled"
                    [class.ga-comment-toggle--on]="row.commentOpen || row.comment"
                    (click)="row.commentOpen = !row.commentOpen; emit()"
                    title="Add a comment (optional)">✎</button>
          </span>
        </div>
        <input *ngIf="row.commentOpen" type="text" maxlength="500"
               class="ga-comment" placeholder="Optional comment"
               [disabled]="disabled"
               [(ngModel)]="row.comment" (ngModelChange)="emit()"
               [ngModelOptions]="{standalone: true}" />
      </div>
    </div>
  `,
  styles: [`
    .ga-root { border: 1px solid #DDE5EA; border-radius: 8px; padding: 10px 12px; margin: 8px 0; background: #FBFDFE; }
    .ga-header { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
    .ga-purpose { font: italic 11px/1.4 Roboto, sans-serif; color: #5A5A5A; }
    .ga-link { font: 500 11px Roboto, sans-serif; color: #257099; text-decoration: underline; }
    .ga-item { padding: 4px 0; border-top: 1px solid #EEF3F6; }
    .ga-item:first-of-type { border-top: none; }
    .ga-item-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .ga-item-text { font: 400 12px/1.35 Roboto, sans-serif; color: #1A1A1A; flex: 1; min-width: 0; }
    .ga-chips { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }
    .ga-chip {
      min-width: 26px; padding: 3px 6px; border-radius: 999px; cursor: pointer;
      border: 1px solid #B9C4CE; background: #fff; color: #5A5A5A;
      font: 600 11px Roboto, sans-serif;
    }
    .ga-chip--on { background: #257099; border-color: #257099; color: #fff; }
    .ga-chip:disabled { opacity: 0.55; cursor: not-allowed; }
    .ga-comment-toggle {
      border: none; background: none; cursor: pointer; color: #B9C4CE;
      font-size: 12px; padding: 2px;
    }
    .ga-comment-toggle--on { color: #257099; }
    .ga-comment {
      width: 100%; margin-top: 4px; border: 1px solid #B9C4CE; border-radius: 5px;
      padding: 4px 8px; font: 400 12px Roboto, sans-serif;
    }
  `]
})
export class GateAssessmentFormComponent implements OnChanges {
  @Input() gateKey = '';
  @Input() role: AssessmentRole = 'submitter';
  @Input() linkUrl: string | null = null;
  @Input() disabled = false;
  @Output() changed = new EventEmitter<AssessmentChange>();

  grades = ASSESSMENT_GRADES;
  rows: DraftRow[] = [];

  get purposeLine(): string {
    const label = GATE_LABEL_BY_KEY[this.gateKey] ?? this.gateKey;
    return GATE_COACHING_SHORT[label] ?? '';
  }

  ngOnChanges(): void {
    const defs = assessmentItemsFor(this.gateKey, this.role);
    // Rebuild only when the item set actually changes — grade state survives
    // unrelated input churn.
    if (this.rows.length !== defs.length || this.rows.some((r, i) => r.def.key !== defs[i].key)) {
      this.rows = defs.map(def => ({ def, grade: '', comment: '', commentOpen: false }));
      this.emit();
    }
  }

  setGrade(row: DraftRow, g: AssessmentGrade): void {
    row.grade = row.grade === g ? '' : g;
    this.emit();
  }

  emit(): void {
    const complete = this.rows.length > 0 && this.rows.every(r => r.grade !== '');
    const items: AssessmentPayloadItem[] = this.rows
      .filter(r => r.grade !== '')
      .map(r => ({
        item_key: r.def.key,
        grade:    r.grade as AssessmentGrade,
        ...(r.comment.trim() ? { comment: r.comment.trim() } : {})
      }));
    this.changed.emit({ complete, items });
  }
}
