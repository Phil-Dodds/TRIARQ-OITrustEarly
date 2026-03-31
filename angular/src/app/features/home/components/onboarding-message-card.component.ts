// onboarding-message-card.component.ts
// Shown to authenticated users who have no Division assignment.
// Presentation only — static content. (D-150)

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector:        'app-onboarding-message-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oi-card oi-onboarding-card">
      <h3>Welcome, {{ displayName }}</h3>
      <p class="oi-onboarding-primary">
        You're not assigned to any Division yet.
      </p>
      <p class="oi-onboarding-secondary">
        Contact your System Admin to be assigned to a Division.
        Once assigned, your home screen will show your workspace cards.
      </p>
    </div>
  `,
  styles: [`
    .oi-onboarding-card {
      max-width: 520px;
      margin: 64px auto;
      text-align: center;
      padding: var(--triarq-space-2xl);
    }
    h3 { color: var(--triarq-color-primary); margin-bottom: var(--triarq-space-md); }
    .oi-onboarding-primary  { font-size: var(--triarq-text-body); font-weight: var(--triarq-font-weight-medium); }
    .oi-onboarding-secondary { font-size: var(--triarq-text-small); color: var(--triarq-color-text-secondary); }
  `]
})
export class OnboardingMessageCardComponent {
  @Input() displayName = '';
}
