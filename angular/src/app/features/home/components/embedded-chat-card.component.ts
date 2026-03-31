// embedded-chat-card.component.ts — All roles (D-150)
// STUB ONLY in Build A. Card shell present, no chat skill wired, no Vertex AI.
// Session 2026-03-29-A: embedded chat moved to Build B.

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector:        'app-embedded-chat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-home-card oi-card-shell">
      <h4>OI Assistant</h4>
      <p class="oi-shell-message">
        AI-powered knowledge chat is coming in Build B.
      </p>
      <p class="oi-shell-sub">
        You'll be able to ask questions across your Division's knowledge library
        and receive cited, source-linked answers.
      </p>
    </div>
  `,
  styles: [`
    h4 { margin: 0 0 var(--triarq-space-sm) 0; font-size: var(--triarq-text-h4); }
    .oi-card-shell { border: 1px dashed var(--triarq-color-border); }
    .oi-shell-message { color: var(--triarq-color-text-secondary); font-size: var(--triarq-text-small); margin: 0 0 var(--triarq-space-xs) 0; }
    .oi-shell-sub { color: var(--triarq-color-text-disabled); font-size: var(--triarq-text-caption); margin: 0; }
  `]
})
export class EmbeddedChatCardComponent {}
