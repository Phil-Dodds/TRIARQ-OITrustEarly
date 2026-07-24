// all-pending-gates-card.component.ts — Pathways OI Trust
// Contract G8 (D-560): optional home count for Initiative Executives — how
// many gates are awaiting approval company-wide, aging count highlighted.
// Pull-only summary; taps through to the All Pending Gates view.

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';

@Component({
  selector: 'app-all-pending-gates-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apgc-card" [routerLink]="['/initiatives/all-pending-gates']">
      <div class="apgc-title">All Pending Gates</div>
      <div class="apgc-count">{{ loading ? '…' : count }}</div>
      <div class="apgc-sub">
        awaiting approval company-wide<span *ngIf="agingCount > 0"> · {{ agingCount }} aging</span>
      </div>
    </div>
  `,
  styles: [`
    .apgc-card {
      border: 1px solid #DDE5EA; border-radius: 10px; padding: 16px 20px;
      background: #fff; cursor: pointer;
    }
    .apgc-card:hover { background: #F7FAFC; }
    .apgc-title {
      font: 500 12px Roboto, sans-serif; text-transform: uppercase;
      letter-spacing: 0.05em; color: #5A5A5A;
    }
    .apgc-count { font: 700 28px Roboto, sans-serif; color: #00274E; margin: 4px 0; }
    .apgc-sub { font: 400 12px Roboto, sans-serif; color: #5A5A5A; }
  `]
})
export class AllPendingGatesCardComponent implements OnInit {
  count = 0;
  agingCount = 0;
  loading = true;

  constructor(
    private readonly delivery: DeliveryService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.delivery.listAllPendingGates().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.count = res.data.pending_gates.length;
          this.agingCount = res.data.pending_gates.filter(g => g.aging).length;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
}
