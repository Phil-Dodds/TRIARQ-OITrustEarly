// my-delivery-cycles-card.component.ts — DS + CB (D-150)
// Shell present in Build A — data wired in Build C (delivery_cycles table).

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector:        'app-my-delivery-cycles-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card oi-card-shell">
      <h4>My Delivery Cycles</h4>
      <p class="oi-shell-message">Delivery Cycles are coming in Build C.</p>
    </div>
  `,
  styles: [`
    h4 { margin: 0 0 var(--triarq-space-md) 0; font-size: var(--triarq-text-h4); }
    .oi-card-shell { border: 1px dashed var(--triarq-color-border); }
    .oi-shell-message { color: var(--triarq-color-text-disabled); font-size: var(--triarq-text-small); }
  `]
})
export class MyDeliveryCyclesCardComponent {
  @Input() userId = '';
}
