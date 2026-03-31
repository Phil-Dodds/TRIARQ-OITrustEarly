// chat.component.ts — Build A stub
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-chat', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card" style="max-width:600px;margin:var(--triarq-space-2xl) auto;text-align:center;">
      <h3>OI Assistant</h3>
      <p style="color:var(--triarq-color-text-secondary);font-size:var(--triarq-text-small);">
        AI-powered knowledge chat is coming in Build B.
      </p>
    </div>`
})
export class ChatComponent {}
