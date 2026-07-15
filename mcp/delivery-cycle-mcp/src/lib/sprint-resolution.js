// sprint-resolution.js — Contract 37 (D-551/D-552)
// Pure sprint/relative gate-date-rule resolution for delivery-cycle-mcp.
// No DB access — callers load sprints and milestone rows and pass them in.
// Angular mirrors this algorithm for the live "Resolves to" preview
// (angular/src/app/core/utils/sprint-resolution.ts) — keep the two in sync.
//
// All dates are 'YYYY-MM-DD' strings end-to-end. ISO date strings compare
// correctly with < / >, and arithmetic goes through Date.UTC — the Date(string)
// constructor is never used (D-520 timezone-shift hazard).
//
// One grammar (D-551): target = anchor + (X sprints) + (Z days).
//   manual   — no rule; date picker.
//   sprint   — anchor = selected sprint's start or end edge.
//   relative — anchor = prior gate's TARGET date (never its actual, D-552).

'use strict';

const { GATE_FORWARD_ORDER } = require('./gate-resolution');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Add days to a YYYY-MM-DD string without the Date(string) constructor. */
function addDaysToIsoDate(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  const yy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Non-deleted sprints ordered by start_date (never by sprint_id — D-549). */
function sortSprintsByStartDate(sprints) {
  return [...(sprints || [])]
    .filter(s => !s.deleted_at)
    .sort((a, b) => (a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0));
}

/** Index of the sprint whose [start_date, end_date] contains isoDate, else -1. */
function findSprintIndexContaining(sortedSprints, isoDate) {
  return sortedSprints.findIndex(s => s.start_date <= isoDate && isoDate <= s.end_date);
}

/**
 * Resolve a sprint-mode rule: selected sprint's start/end edge + Z days.
 * @returns {{ resolved_date: string } | { error: string }}
 */
function resolveSprintRule(sprints, rule_sprint_id, rule_anchor, rule_day_offset) {
  const sorted = sortSprintsByStartDate(sprints);
  const sprint = sorted.find(s => s.sprint_id === rule_sprint_id);
  if (!sprint) {
    return { error: `Sprint '${rule_sprint_id}' is not in the effective calendar.` };
  }
  if (rule_anchor !== 'start' && rule_anchor !== 'end') {
    return { error: `rule_anchor must be 'start' or 'end'.` };
  }
  const edge = rule_anchor === 'start' ? sprint.start_date : sprint.end_date;
  return { resolved_date: addDaysToIsoDate(edge, rule_day_offset || 0) };
}

/**
 * Resolve a relative-mode rule: prior gate's TARGET date, advanced X sprints
 * along the effective calendar, + Z days (spec §5 semantics):
 *   X = 0 → the prior gate's target itself + Z days.
 *   X > 0 → the END date of the sprint X positions after the sprint containing
 *           the prior target. When the prior target falls outside any sprint,
 *           X counts from the next sprint that starts on or after that date
 *           (X = 1 → that next sprint's end).
 * @returns {{ resolved_date: string } | { error: string }}
 */
function resolveRelativeRule(sprints, priorGateTargetDate, rule_sprint_count, rule_day_offset) {
  if (!priorGateTargetDate || !ISO_DATE_RE.test(priorGateTargetDate)) {
    return { error: 'The prior gate has no target date to anchor to.' };
  }
  const x = rule_sprint_count || 0;
  const z = rule_day_offset || 0;
  if (x < 0) {
    return { error: 'rule_sprint_count must be 0 or greater.' };
  }
  if (x === 0) {
    return { resolved_date: addDaysToIsoDate(priorGateTargetDate, z) };
  }
  const sorted = sortSprintsByStartDate(sprints);
  const containingIdx = findSprintIndexContaining(sorted, priorGateTargetDate);
  let targetIdx;
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

/**
 * Dispatch a rule to its resolver.
 * @param {object} rule — { date_rule_type, rule_sprint_id, rule_anchor,
 *                          rule_sprint_count, rule_day_offset }
 * @param {Array} sprints — effective calendar sprints (may be empty)
 * @param {string|null} priorGateTargetDate — required for relative rules
 * @returns {{ resolved_date: string } | { error: string }}
 */
function resolveRule(rule, sprints, priorGateTargetDate) {
  switch (rule.date_rule_type) {
    case 'sprint':
      return resolveSprintRule(sprints, rule.rule_sprint_id, rule.rule_anchor, rule.rule_day_offset);
    case 'relative':
      return resolveRelativeRule(sprints, priorGateTargetDate, rule.rule_sprint_count, rule.rule_day_offset);
    default:
      return { error: `date_rule_type '${rule.date_rule_type}' does not resolve — manual dates come from the picker.` };
  }
}

/**
 * D-552 cascade: given a gate whose TARGET just changed, recompute every
 * downstream 'relative' gate in lifecycle order, chaining target-to-target.
 * 'manual' and 'sprint' gates never move from an upstream change, but their
 * (unchanged) targets still anchor the next relative gate.
 *
 * Pure — computes shifts without writing. Callers use the result both for the
 * pre-flight confirmation list and for the committed write set.
 *
 * @param {Array} milestones — cycle_milestone_dates rows (gate_name,
 *   target_date, date_rule_type, rule_sprint_count, rule_day_offset, rule_stale)
 * @param {string} changedGateName — gate whose target changed
 * @param {string|null} newTargetDate — its new target (null = cleared)
 * @param {Array} sprints — effective calendar sprints
 * @returns {{ shifts: Array<{gate_name, old_target_date, new_target_date}>,
 *             unresolved: Array<{gate_name, reason}> }}
 *   shifts — relative gates whose resolved date actually changes.
 *   unresolved — relative gates whose rule no longer resolves (→ rule_stale,
 *   date HOLDS per §6.5; no cascade fires through an unresolved gate's
 *   unchanged date beyond normal chaining).
 */
function computeCascade(milestones, changedGateName, newTargetDate, sprints) {
  const byGate = new Map((milestones || []).map(m => [m.gate_name, m]));
  const startIdx = GATE_FORWARD_ORDER.indexOf(changedGateName);
  const shifts = [];
  const unresolved = [];
  if (startIdx === -1) return { shifts, unresolved };

  // Effective targets as the chain progresses (target-to-target, D-552).
  const effectiveTargets = new Map();
  for (const m of byGate.values()) effectiveTargets.set(m.gate_name, m.target_date ?? null);
  effectiveTargets.set(changedGateName, newTargetDate);

  for (let i = startIdx + 1; i < GATE_FORWARD_ORDER.length; i++) {
    const gateName = GATE_FORWARD_ORDER[i];
    const m = byGate.get(gateName);
    if (!m || m.date_rule_type !== 'relative') continue;

    const priorTarget = effectiveTargets.get(GATE_FORWARD_ORDER[i - 1]) ?? null;
    const result = resolveRelativeRule(sprints, priorTarget, m.rule_sprint_count, m.rule_day_offset);
    if (result.error) {
      unresolved.push({ gate_name: gateName, reason: result.error });
      continue; // date holds; downstream chains from the held value
    }
    if (result.resolved_date !== (m.target_date ?? null)) {
      shifts.push({
        gate_name: gateName,
        old_target_date: m.target_date ?? null,
        new_target_date: result.resolved_date
      });
    }
    effectiveTargets.set(gateName, result.resolved_date);
  }
  return { shifts, unresolved };
}

module.exports = {
  ISO_DATE_RE,
  addDaysToIsoDate,
  sortSprintsByStartDate,
  findSprintIndexContaining,
  resolveSprintRule,
  resolveRelativeRule,
  resolveRule,
  computeCascade
};
