// quarter-deploy-goal-card.component.ts — Pathways OI Trust
// Contract G10 (D-568 family C): THE one v1 KPI — the personal quarter
// deploy-goal home card. Four numbers: done, remaining, recent weekly pace,
// needed pace. Division roll-up rows for Division Leaders. Target movement is
// shown, not hidden. Diagnostic, not a target (D-568 standing principle).

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryService, QuarterDeployGoal } from '../../../core/services/delivery.service';

@Component({
  selector: 'app-quarter-deploy-goal-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qdg-card" *ngIf="!loading && goal">
      <div class="qdg-title">Deploy Goal — {{ goal!.quarter }}</div>

      <div *ngIf="goal!.personal.initiative_count === 0" class="qdg-empty">
        No assigned Initiatives target Go to Deploy this quarter.
      </div>

      <div *ngIf="goal!.personal.initiative_count > 0" class="qdg-numbers">
        <div class="qdg-num"><span class="qdg-value">{{ goal!.personal.gates_done }}</span><span class="qdg-label">gates done</span></div>
        <div class="qdg-num"><span class="qdg-value">{{ goal!.personal.gates_remaining }}</span><span class="qdg-label">remaining</span></div>
        <div class="qdg-num"><span class="qdg-value">{{ goal!.personal.weekly_pace }}</span><span class="qdg-label">per week (recent)</span></div>
        <div class="qdg-num" [class.qdg-num--behind]="goal!.personal.needed_pace > goal!.personal.weekly_pace">
          <span class="qdg-value">{{ goal!.personal.needed_pace }}</span><span class="qdg-label">per week needed</span>
        </div>
      </div>
      <div *ngIf="goal!.personal.target_changes_this_quarter > 0" class="qdg-moved">
        {{ goal!.personal.target_changes_this_quarter }} deploy
        target{{ goal!.personal.target_changes_this_quarter === 1 ? '' : 's' }} moved this quarter
      </div>

      <div *ngFor="let r of goal!.division_rollups" class="qdg-rollup">
        <span class="qdg-rollup-name">{{ r.division_name }}</span>
        {{ r.gates_done }} done · {{ r.gates_remaining }} remaining ·
        {{ r.weekly_pace }}/wk vs {{ r.needed_pace }}/wk needed
      </div>

      <div class="qdg-foot">Diagnostic, not a target — pace informs conversations, never rankings.</div>
    </div>
  `,
  styles: [`
    /* CC-38-21 home-card standard height (Phil 2026-07-28: match the other cards). */
    :host { display: block; }
    .qdg-card { border: 1px solid #DDE5EA; border-radius: 10px; padding: 16px 20px; background: #fff;
      height: 340px; overflow-y: auto; box-sizing: border-box; }
    .qdg-title {
      font: 500 12px Roboto, sans-serif; text-transform: uppercase;
      letter-spacing: 0.05em; color: #5A5A5A; margin-bottom: 8px;
    }
    .qdg-empty { font: italic 12px Roboto, sans-serif; color: #9E9E9E; }
    .qdg-numbers { display: flex; gap: 18px; flex-wrap: wrap; }
    .qdg-num { display: flex; flex-direction: column; }
    .qdg-value { font: 700 22px Roboto, sans-serif; color: #00274E; }
    .qdg-num--behind .qdg-value { color: #E96127; }
    .qdg-label { font: 400 11px Roboto, sans-serif; color: #5A5A5A; }
    .qdg-moved { margin-top: 6px; font: italic 11px Roboto, sans-serif; color: #8a5b00; }
    .qdg-rollup { margin-top: 8px; font: 400 12px Roboto, sans-serif; color: #1a1a1a; }
    .qdg-rollup-name { font-weight: 500; color: #00274E; margin-right: 6px; }
    .qdg-foot { margin-top: 10px; font: italic 10px Roboto, sans-serif; color: #9E9E9E; }
  `]
})
export class QuarterDeployGoalCardComponent implements OnInit {
  goal: QuarterDeployGoal | null = null;
  loading = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.getQuarterDeployGoal().subscribe({
      next: (res) => {
        this.goal = (res.success && res.data) || null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
