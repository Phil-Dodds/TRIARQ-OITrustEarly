// sprint-resolution.ts — Contract 37 (D-551/D-553)
// Angular mirror of mcp/delivery-cycle-mcp/src/lib/sprint-resolution.js —
// SAME algorithm, used only for the live "Resolves to" preview and rule chip
// labels. The server resolves at save and its result is canonical (D-551);
// keep the two implementations in sync.
//
// All dates are 'YYYY-MM-DD' strings. String-parse only — never the
// Date(string) constructor (D-520 timezone-shift hazard).

import { SprintRow, SprintAnchor } from '../types/database';

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SprintRuleResolution {
  resolved_date?: string;
  error?: string;
}

/** Add days to a YYYY-MM-DD string without the Date(string) constructor. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Sprints ordered by start_date — never by sprint_id (D-549). */
export function sortSprintsByStartDate(sprints: SprintRow[]): SprintRow[] {
  return [...(sprints || [])]
    .sort((a, b) => (a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0));
}

/** D-520 display format: "Mon DD", year appended only when ≠ current year. */
export function formatTargetDateDisplay(isoDate: string | null | undefined, todayIso?: string): string {
  if (!isoDate || !ISO_DATE_RE.test(isoDate)) { return ''; }
  const [y, m, d] = isoDate.split('-').map(Number);
  const currentYear = todayIso && ISO_DATE_RE.test(todayIso)
    ? Number(todayIso.slice(0, 4))
    : new Date().getFullYear();
  const base = `${MONTH_LABELS[m - 1]} ${d}`;
  return y === currentYear ? base : `${base}, ${y}`;
}

/** Sprint-mode resolution: selected sprint's start/end edge + Z days. */
export function resolveSprintRule(
  sprints: SprintRow[],
  ruleSprintId: string,
  ruleAnchor: SprintAnchor,
  ruleDayOffset: number
): SprintRuleResolution {
  const sprint = (sprints || []).find(s => s.sprint_id === ruleSprintId);
  if (!sprint) {
    return { error: `Sprint '${ruleSprintId}' is not in the effective calendar.` };
  }
  const edge = ruleAnchor === 'start' ? sprint.start_date : sprint.end_date;
  return { resolved_date: addDaysToIsoDate(edge, ruleDayOffset || 0) };
}

/**
 * Relative-mode resolution (spec §5): prior gate's TARGET date advanced X
 * sprints + Z days. X = 0 → the prior target itself. X > 0 → the END of the
 * sprint X positions after the sprint containing the prior target; when the
 * prior target falls outside any sprint, X counts from the next sprint that
 * starts on or after it.
 */
export function resolveRelativeRule(
  sprints: SprintRow[],
  priorGateTargetDate: string | null,
  ruleSprintCount: number,
  ruleDayOffset: number
): SprintRuleResolution {
  if (!priorGateTargetDate || !ISO_DATE_RE.test(priorGateTargetDate)) {
    return { error: 'The prior gate has no target date to anchor to.' };
  }
  const x = ruleSprintCount || 0;
  const z = ruleDayOffset || 0;
  if (x < 0) { return { error: 'Sprint count must be 0 or greater.' }; }
  if (x === 0) { return { resolved_date: addDaysToIsoDate(priorGateTargetDate, z) }; }

  const sorted = sortSprintsByStartDate(sprints);
  const containingIdx = sorted.findIndex(
    s => s.start_date <= priorGateTargetDate && priorGateTargetDate <= s.end_date
  );
  let targetIdx: number;
  if (containingIdx >= 0) {
    targetIdx = containingIdx + x;
  } else {
    const nextIdx = sorted.findIndex(s => s.start_date >= priorGateTargetDate);
    if (nextIdx === -1) {
      return { error: 'The prior gate target falls after the last sprint in the effective calendar.' };
    }
    targetIdx = nextIdx + (x - 1);
  }
  if (targetIdx >= sorted.length) {
    return { error: `The effective calendar ends before ${x} sprint(s) after the prior gate target.` };
  }
  return { resolved_date: addDaysToIsoDate(sorted[targetIdx].end_date, z) };
}

/** Editor dropdown label (spec §7.1): "2026.11 · Jul 27 – Aug 14". */
export function sprintDropdownLabel(sprint: SprintRow): string {
  return `${sprint.sprint_id} · ${formatTargetDateDisplay(sprint.start_date, sprint.start_date)} – ${formatTargetDateDisplay(sprint.end_date, sprint.end_date)}`;
}

/**
 * Grid rule chip label (D-553 §7.2): "Sprint 2026.11 start",
 * "Sprint 2026.11 end + 14d", "[Prior Gate] + 2 sprints + 3d", '' for manual.
 */
export function ruleChipLabel(rule: {
  date_rule_type?: string;
  rule_sprint_id?: string | null;
  rule_anchor?: string | null;
  rule_sprint_count?: number | null;
  rule_day_offset?: number | null;
}, priorGateLabel: string): string {
  const days = rule.rule_day_offset || 0;
  const daysSuffix = days !== 0 ? ` ${days > 0 ? '+' : '−'} ${Math.abs(days)}d` : '';
  if (rule.date_rule_type === 'sprint' && rule.rule_sprint_id) {
    return `Sprint ${rule.rule_sprint_id} ${rule.rule_anchor}${daysSuffix}`;
  }
  if (rule.date_rule_type === 'relative') {
    const x = rule.rule_sprint_count || 0;
    const sprintPart = x !== 0 ? ` + ${x} sprint${x === 1 ? '' : 's'}` : '';
    return `${priorGateLabel}${sprintPart}${daysSuffix}` + (x === 0 && days === 0 ? ' (same date)' : '');
  }
  return '';
}
