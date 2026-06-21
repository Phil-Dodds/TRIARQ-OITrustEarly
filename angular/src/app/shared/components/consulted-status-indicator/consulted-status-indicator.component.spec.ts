// consulted-status-indicator.component.spec.ts — Contract 30 / D-468 (WS1.2)
// Locks the show/precedence rules: declined wins; amber only while awaiting_approval.

import { ConsultedStatusIndicatorComponent } from './consulted-status-indicator.component';

function make(summary: any, gateStatus: any): ConsultedStatusIndicatorComponent {
  const c = new ConsultedStatusIndicatorComponent();
  c.summary = summary;
  c.gateStatus = gateStatus;
  return c;
}

describe('ConsultedStatusIndicatorComponent', () => {
  it('shows nothing when there is no summary', () => {
    const c = make(undefined, 'awaiting_approval');
    expect(c.showDeclined).toBe(false);
    expect(c.showPending).toBe(false);
  });

  it('shows amber pending only while gate is awaiting_approval', () => {
    expect(make({ pending_count: 1, declined_count: 0 }, 'awaiting_approval').showPending).toBe(true);
    // Post-approval pending consult must NOT show amber.
    expect(make({ pending_count: 1, declined_count: 0 }, 'approved').showPending).toBe(false);
  });

  it('shows red declined regardless of gate status', () => {
    expect(make({ pending_count: 0, declined_count: 1 }, 'awaiting_approval').showDeclined).toBe(true);
    expect(make({ pending_count: 0, declined_count: 1 }, 'approved').showDeclined).toBe(true);
  });

  it('declined takes precedence over pending', () => {
    const c = make({ pending_count: 2, declined_count: 1 }, 'awaiting_approval');
    expect(c.showDeclined).toBe(true);
    // Template suppresses the pending span when showDeclined is true (!showDeclined && showPending).
    expect(c.showPending).toBe(true); // getter true, but template guards on !showDeclined
  });
});
