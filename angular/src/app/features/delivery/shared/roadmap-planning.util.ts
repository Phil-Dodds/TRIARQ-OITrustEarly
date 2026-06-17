// roadmap-planning.util.ts — Contract 27 (D-445, D-446)
//
// Shared helpers for the Deploy by Quarter views (EPO Deploy + Workstream
// Deploy Schedule). Quarter math is duplicated in both views today —
// extracted here so the Quarter Pivot Control and Planned vs. Actual symbol
// algorithm share one source of truth.
//
// No Angular dependencies — pure functions, testable in isolation.

import {
  DeliveryCycle,
  MilestoneTargetDateChangeEvent
} from '../../../core/types/database';

/** Calendar quarter (1–4) and year for a given Date. */
export interface QuarterRef {
  year: number;
  q:    number;        // 1, 2, 3, 4
  label: string;       // "Q2 2026"
}

/** Build a QuarterRef from a Date. */
export function quarterOfDate(d: Date): QuarterRef {
  const year = d.getFullYear();
  const q    = Math.floor(d.getMonth() / 3) + 1;
  return { year, q, label: `Q${q} ${year}` };
}

/** Build a QuarterRef from an ISO date string ("YYYY-MM-DD" or full ISO). */
export function quarterFromIso(iso: string | null | undefined): QuarterRef | null {
  if (!iso) { return null; }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) { return null; }
  return quarterOfDate(d);
}

/** Inclusive start date of a QuarterRef. */
export function quarterStart(q: QuarterRef): Date {
  return new Date(q.year, (q.q - 1) * 3, 1);
}

/** Inclusive end date of a QuarterRef (last day of the quarter). */
export function quarterEnd(q: QuarterRef): Date {
  // Day 0 of month X = last day of month X-1.
  return new Date(q.year, q.q * 3, 0);
}

/** Quarter offset from a reference quarter (positive = forward, negative = back). */
export function shiftQuarter(ref: QuarterRef, offset: number): QuarterRef {
  let q    = ref.q + offset;
  let year = ref.year;
  while (q < 1) { q += 4; year -= 1; }
  while (q > 4) { q -= 4; year += 1; }
  return { year, q, label: `Q${q} ${year}` };
}

/** Comparable monotonic integer index for ordering. */
export function quarterIndex(q: QuarterRef): number {
  return q.year * 4 + q.q;
}

/** True if the calendar quarter containing `iso` equals `target`. */
export function isoInQuarter(iso: string | null | undefined, target: QuarterRef): boolean {
  const q = quarterFromIso(iso);
  return !!q && q.year === target.year && q.q === target.q;
}

// ── Prior Quarter Planned vs. Actual symbol (D-446) ───────────────────────

export type PriorQuarterSymbol =
  | 'planned-deployed'      // ✓ pointed to prior quarter as-of baseline AND actually shipped in prior quarter
  | 'planned-not-deployed'  // ✕ pointed to prior quarter as-of baseline AND did NOT ship in prior quarter
  | 'unplanned-deployed';   // ✚ shipped in prior quarter but did NOT point to prior quarter as-of baseline

/**
 * D-446 algorithm: classify an Initiative's Go to Deploy state for the prior
 * quarter, as-of a given baseline date.
 *
 * Inputs are intentionally raw — no Angular service dependencies. The caller
 * supplies the cycle, its event log, the selected baseline ISO date, and the
 * prior quarter window.
 *
 * Returns null when the algorithm cannot run (missing baselineDate, missing
 * event log). Returns one of the three symbol kinds otherwise.
 */
export function computePriorQuarterSymbol(
  cycle:          DeliveryCycle,
  baselineDate:   string | null,
  priorQuarter:   QuarterRef,
  eventLog?:      MilestoneTargetDateChangeEvent[]
): PriorQuarterSymbol | null {
  if (!baselineDate) { return null; }

  const deployMilestone = cycle.milestone_dates?.find(m => m.gate_name === 'go_to_deploy');
  const actualDate      = deployMilestone?.actual_date ?? null;
  const hasActualInPriorQuarter = actualDate != null && isoInQuarter(actualDate, priorQuarter);

  const eventsBeforeBaseline = (eventLog ?? cycle.target_date_change_events ?? [])
    .filter(e =>
      e.gate_name === 'go_to_deploy' &&
      e.created_at != null &&
      new Date(e.created_at).getTime() <= new Date(baselineDate).getTime()
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const targetAsOfBaseline = eventsBeforeBaseline.length > 0
    ? eventsBeforeBaseline[0].new_target_date
    : null;

  const targetPointedToPriorQuarter =
    targetAsOfBaseline != null && isoInQuarter(targetAsOfBaseline, priorQuarter);

  if (targetPointedToPriorQuarter && hasActualInPriorQuarter)  { return 'planned-deployed'; }
  if (targetPointedToPriorQuarter && !hasActualInPriorQuarter) { return 'planned-not-deployed'; }
  if (!targetPointedToPriorQuarter && hasActualInPriorQuarter) { return 'unplanned-deployed'; }
  return null;
}

/** Visual representation for each symbol — character + color hex. Decorative only (no tooltip). */
export const PRIOR_QUARTER_SYMBOL_DISPLAY: Record<PriorQuarterSymbol, { char: string; color: string }> = {
  'planned-deployed':     { char: '✓', color: '#22c55e' },   // green check
  'planned-not-deployed': { char: '✕', color: '#E96127' },   // red X
  'unplanned-deployed':   { char: '✚', color: '#22c55e' }    // green plus
};
