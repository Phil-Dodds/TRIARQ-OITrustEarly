// blocked-action.component.ts — Pathways OI Trust
// Implements the D-140 blocked action UX pattern.
// Primary message: what is blocked (normal font).
// Secondary message: what would need to change (smaller font).
// Used everywhere a user action is blocked — never show error codes or silent failures.

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-blocked-action',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  template: `
    <div class="oi-blocked-action" role="alert">
      <p class="oi-blocked-primary">{{ primaryMessage }}</p>
      <p class="oi-blocked-secondary" *ngIf="secondaryMessage">{{ secondaryMessage }}</p>
    </div>
  `
})
export class BlockedActionComponent {
  /** What is blocked — displayed at normal font weight. Required. */
  @Input() primaryMessage   = '';
  /** What would need to change — displayed at smaller font. Optional. */
  @Input() secondaryMessage = '';
}
