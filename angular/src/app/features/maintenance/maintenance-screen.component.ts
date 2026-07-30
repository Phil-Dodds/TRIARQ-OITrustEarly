// maintenance-screen.component.ts
// Pathways OI Trust | Build C | D-MaintenanceMode
//
// Standalone component. No auth dependency. No MCP calls.
// Rendered by AppComponent when system_config.maintenance_mode = true.
// Suppresses all routing — no navigation elements.

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-maintenance-screen',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  template: `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--triarq-color-background-subtle, #f7f8fa);
      font-family: Roboto, sans-serif;
    ">
      <div style="
        text-align: center;
        max-width: 480px;
        padding: var(--triarq-space-2xl, 48px) var(--triarq-space-xl, 32px);
      ">
        <!-- TRIARQ logo — same asset as login screen -->
        <img
          src="assets/images/TRIARQ_Logo_rgb.svg"
          alt="TRIARQ Health"
          style="height: 48px; margin-bottom: var(--triarq-space-xl, 32px);"
        />

        <!-- Primary message -->
        <p style="
          font-size: var(--triarq-text-body, 16px);
          color: var(--triarq-color-text-primary, #262626);
          margin: 0 0 var(--triarq-space-sm, 8px) 0;
          font-weight: 500;
        ">
          Pathways OI Trust is currently being updated.
        </p>

        <!-- Optional maintenance message from system_config -->
        <p *ngIf="maintenanceMessage" style="
          font-size: var(--triarq-text-small, 14px);
          color: var(--triarq-color-text-secondary, #5A5A5A);
          margin: 0 0 var(--triarq-space-sm, 8px) 0;
        ">
          {{ maintenanceMessage }}
        </p>

        <!-- Check back message -->
        <p style="
          font-size: var(--triarq-text-small, 14px);
          color: #5A5A5A;
          margin: 0;
        ">
          Check back shortly.
        </p>
      </div>
    </div>
  `
})
export class MaintenanceScreenComponent {
  @Input() maintenanceMessage: string | null = null;
}
