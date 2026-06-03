// delivery.component.ts — Build A shell
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-delivery', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card" style="max-width:600px;margin:var(--triarq-space-2xl) auto;text-align:center;">
      <h3>Initiatives</h3>
      <p style="color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);">
        Initiative management is coming in Build C.
      </p>
    </div>`
})
export class DeliveryComponent {}
