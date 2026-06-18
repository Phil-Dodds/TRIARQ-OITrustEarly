// cycle-headline.utils.ts — Pure computeHeadline for the All Initiatives grid.
//
// Section H Contract 23 Item 2.2 / D-267 / Session 2026-03-24-C.
// Pure function — no Angular, no DOM, no service injection. Unit-testable in isolation.
//
// Six-rule priority order, top-down — first match wins. Output is never null:
//   1. Any gate awaiting_approval → "Awaiting [Gate] approval · [target if set]"           (default color)
//   2. Any gate overdue (target<today, not approved) → "[Gate] approval overdue · X days"  (Oravive)
//   3. Pre-deploy stage + Go to Deploy target set → "Next: [next] [date] · Deploy [date]"  (Sunray on next date)
//   4. Pre-deploy stage + no Go to Deploy target → "Next: [next] [date if set]"            (Sunray on date)
//   5. Pre-deploy stage, no overdue/pending      → "In [Stage] · Next: [next] [date]"      (Sunray on date)
//   6. Post-deploy (PILOT/RELEASE/OUTCOME/COMPLETE) → "Deploy [date] · Release [date]"     (default color)

import { LifecycleStage, GateName, DeliveryCycle } from '../../../core/types/database';

export const GATE_DISPLAY_NAMES: Record<GateName, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

export const STAGE_DISPLAY_NAMES: Partial<Record<LifecycleStage, string>> = {
  BRIEF: 'Brief', DESIGN: 'Design', SPEC: 'Spec', BUILD: 'Build',
  VALIDATE: 'Validate', UAT: 'UAT', PILOT: 'Pilot', RELEASE: 'Release',
  OUTCOME: 'Outcome', COMPLETE: 'Complete', CANCELLED: 'Cancelled', ON_HOLD: 'On Hold'
};

export const GATE_SEQUENCE: GateName[] = [
  'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
];

export const PRE_DEPLOY_STAGES: LifecycleStage[] = ['BRIEF', 'DESIGN', 'SPEC', 'BUILD', 'VALIDATE', 'UAT'];
export const POST_DEPLOY_STAGES: LifecycleStage[] = ['PILOT', 'RELEASE', 'OUTCOME', 'COMPLETE'];

export type HeadlineColor = 'default' | 'sunray' | 'oravive';

export interface HeadlineResult {
  text:  string;
  color: HeadlineColor;
}

// Module-local date helpers. No central date utility exists in the codebase;
// inlining here keeps the function pure and unit-testable. Source: Item 2.2 spec.

/** Returns YYYY-MM-DD today, or override (for test determinism). */
function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Days from today (positive = future, negative = past). null if iso invalid. */
function daysFromToday(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (!iso) { return null; }
  const target = new Date(iso);
  if (isNaN(target.getTime())) { return null; }
  const t0 = new Date(now.toISOString().slice(0, 10)).getTime();
  const t1 = new Date(iso.slice(0, 10)).getTime();
  return Math.round((t1 - t0) / 86_400_000);
}

/**
 * Date display per Item 2.2 spec:
 *   - relative when |Δ| < 14 days: "in 3 days" / "today" / "2 days ago"
 *   - else short date: "Jun 18"
 */
export function formatHeadlineDate(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) { return ''; }
  const d = daysFromToday(iso, now);
  if (d === null) { return ''; }
  if (Math.abs(d) < 14) {
    if (d === 0)  { return 'today'; }
    if (d === 1)  { return 'in 1 day'; }
    if (d === -1) { return '1 day ago'; }
    return d > 0 ? `in ${d} days` : `${-d} days ago`;
  }
  // Short date — locale-independent "Mon DD" via Intl.
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

interface MilestoneLite { gate_name: GateName; target_date?: string | null; actual_date?: string | null; }
interface GateRecordLite { gate_name: GateName; gate_status: string; }

/** First gate in GATE_SEQUENCE that is not yet approved. null when all five are approved. */
function nextUnapprovedGate(records: GateRecordLite[] | undefined): GateName | null {
  const byName = new Map<GateName, string>();
  (records ?? []).forEach(r => { byName.set(r.gate_name, r.gate_status); });
  for (const g of GATE_SEQUENCE) {
    const s = byName.get(g);
    // D-447 amendment: 'skipped' is a resolved state — treat as transparent
    // in the walkback chain like 'approved'.
    if (s !== 'approved' && s !== 'skipped') { return g; }
  }
  return null;
}

function milestoneFor(gate: GateName, milestones: MilestoneLite[] | undefined): MilestoneLite | undefined {
  return (milestones ?? []).find(m => m.gate_name === gate);
}

/**
 * Six-rule headline. Pure — no DI. Returns text + color hint.
 * Color hint maps in the caller: 'sunray' → #F2A620, 'oravive' → #E96127, 'default' → token text-secondary.
 */
export function computeHeadline(cycle: DeliveryCycle, now: Date = new Date()): HeadlineResult {
  const stage      = cycle.current_lifecycle_stage;
  const milestones = cycle.milestone_dates as MilestoneLite[] | undefined;
  const gates      = cycle.gate_records   as GateRecordLite[] | undefined;
  const today      = todayIso(now);

  // Rule 1 — Any gate awaiting_approval
  const awaiting = (gates ?? []).find(g => g.gate_status === 'awaiting_approval');
  if (awaiting) {
    const ms   = milestoneFor(awaiting.gate_name, milestones);
    const date = formatHeadlineDate(ms?.target_date, now);
    return {
      text:  `Awaiting ${GATE_DISPLAY_NAMES[awaiting.gate_name]} approval${date ? ` · ${date}` : ''}`,
      color: 'default'
    };
  }

  // Rule 2 — Any gate overdue (target_date < today, not approved)
  // D-447: skipped gates are terminal; they cannot be "overdue".
  for (const g of GATE_SEQUENCE) {
    const ms = milestoneFor(g, milestones);
    if (!ms?.target_date || ms.actual_date) { continue; }
    const rec = (gates ?? []).find(r => r.gate_name === g);
    if (rec?.gate_status === 'approved') { continue; }
    if (rec?.gate_status === 'skipped')  { continue; }
    if (ms.target_date < today) {
      const d = daysFromToday(ms.target_date, now) ?? 0;
      const days = Math.abs(d);
      return {
        text:  `${GATE_DISPLAY_NAMES[g]} approval overdue · ${days} ${days === 1 ? 'day' : 'days'}`,
        color: 'oravive'
      };
    }
  }

  const nextGate    = nextUnapprovedGate(gates);
  const nextLabel   = nextGate ? GATE_DISPLAY_NAMES[nextGate] : '';
  const nextMs      = nextGate ? milestoneFor(nextGate, milestones) : undefined;
  const nextDateStr = nextMs?.target_date ? formatHeadlineDate(nextMs.target_date, now) : '';
  const deployMs    = milestoneFor('go_to_deploy', milestones);

  const isPreDeploy  = PRE_DEPLOY_STAGES.includes(stage);
  const isPostDeploy = POST_DEPLOY_STAGES.includes(stage);

  // Rule 3 — Pre-deploy AND Go to Deploy target set
  if (isPreDeploy && deployMs?.target_date && nextGate) {
    const deployStr = formatHeadlineDate(deployMs.target_date, now);
    return {
      text:  `Next: ${nextLabel}${nextDateStr ? ` ${nextDateStr}` : ''} · Deploy ${deployStr}`,
      color: 'sunray'
    };
  }

  // Rule 4 — Pre-deploy AND no Go to Deploy target
  if (isPreDeploy && !deployMs?.target_date && nextGate) {
    return {
      text:  `Next: ${nextLabel}${nextDateStr ? ` ${nextDateStr}` : ''}`,
      color: 'sunray'
    };
  }

  // Rule 6 — Post-deploy (PILOT/RELEASE/OUTCOME/COMPLETE)
  if (isPostDeploy) {
    const deployDate  = deployMs?.actual_date ?? deployMs?.target_date ?? null;
    const releaseMs   = milestoneFor('go_to_release', milestones);
    const releaseDate = releaseMs?.actual_date ?? releaseMs?.target_date ?? null;
    const parts: string[] = [];
    if (deployDate)  { parts.push(`Deploy ${formatHeadlineDate(deployDate, now)}`); }
    if (releaseDate) { parts.push(`Release ${formatHeadlineDate(releaseDate, now)}`); }
    if (parts.length === 0) {
      // Fall through to rule 5 shape when no dates are known on a post-deploy cycle.
      return {
        text:  `In ${STAGE_DISPLAY_NAMES[stage] ?? stage}${nextLabel ? ` · Next: ${nextLabel}` : ''}`,
        color: 'default'
      };
    }
    return { text: parts.join(' · '), color: 'default' };
  }

  // Rule 5 — Default: "In [Stage] · Next: [next gate] [date]"
  const stageLabel = STAGE_DISPLAY_NAMES[stage] ?? stage;
  if (!nextGate) {
    return { text: `In ${stageLabel}`, color: 'default' };
  }
  return {
    text:  `In ${stageLabel} · Next: ${nextLabel}${nextDateStr ? ` ${nextDateStr}` : ''}`,
    color: 'sunray'
  };
}

/** Convenience: maps HeadlineColor token to CSS color value. Used by the dashboard cell. */
export function headlineColorCss(color: HeadlineColor): string {
  switch (color) {
    case 'oravive': return '#E96127';
    case 'sunray':  return '#F2A620';
    default:        return 'var(--triarq-color-text-secondary, #5A5A5A)';
  }
}
