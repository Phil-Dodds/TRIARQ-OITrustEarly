// stage-track.component.spec.ts
// Protects gate-diamond rendering logic. Added Contract 30 / D-469 (WS2.2):
// 'returned' gates render as a hollow Oravive diamond (transparent fill + Oravive
// stroke) — the same visual as 'skipped', distinguished only by tooltip. The
// awaiting_approval / skipped / complete baselines are asserted so the WS2.2
// change cannot regress them (Regression Protection items 5; S-031 test ratchet).
//
// StageTrackComponent has no DI — instantiate directly and drive gateStateMap.

import { StageTrackComponent } from './stage-track.component';
import { GateStateMap, GateName } from '../../../core/types/database';

const ORAVIVE = 'var(--triarq-color-oravive, #E96127)';

function withState(state: GateStateMap['brief_review']): StageTrackComponent {
  const c = new StageTrackComponent();
  c.gateStateMap = { brief_review: state } as GateStateMap;
  return c;
}

describe('StageTrackComponent gate diamond rendering', () => {
  const gate: GateName = 'brief_review';

  describe('D-469 (WS2.2) — returned diamond', () => {
    it('renders a transparent fill for a returned gate', () => {
      expect(withState('returned').gateColor(gate)).toBe('transparent');
    });

    it('renders a 2px Oravive stroke for a returned gate', () => {
      expect(withState('returned').gateBorder(gate)).toBe(`2px solid ${ORAVIVE}`);
    });

    it('surfaces a "returned for revision" tooltip', () => {
      expect(withState('returned').gateTitle(gate)).toContain('returned for revision');
    });
  });

  describe('regression — states WS2.2 must not change', () => {
    it('awaiting_approval stays sunray-filled with no border (Regression item 5)', () => {
      const c = withState('awaiting_approval');
      expect(c.gateColor(gate)).toBe('var(--triarq-color-sunray, #f5a623)');
      expect(c.gateBorder(gate)).toBe('none');
    });

    it('skipped keeps its hollow Oravive treatment (D-447)', () => {
      const c = withState('skipped');
      expect(c.gateColor(gate)).toBe('transparent');
      expect(c.gateBorder(gate)).toBe(`2px solid ${ORAVIVE}`);
    });

    it('complete stays primary-filled with no border', () => {
      const c = withState('complete');
      expect(c.gateColor(gate)).toBe('var(--triarq-color-primary)');
      expect(c.gateBorder(gate)).toBe('none');
    });
  });
});
