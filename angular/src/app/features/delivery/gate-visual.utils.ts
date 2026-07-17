// gate-visual.utils.ts — canonical gate color resolution (CC-38-28..31).
// ONE rule for every gate-colored surface: grid diamonds, panel stage track,
// panel STATUS column, and both headline sections. Session 2026-07-16 design:
//   1. Approved gate            → blue (reserved for completion — never submission)
//   2. Submitted / awaiting     → purple (blue "almost done" + red "stopped at gate")
//   3. Otherwise                → the USER'S D-205 date_status color, verbatim:
//      on_track green · at_risk amber · behind red · complete blue · not_started grey
// The user's status is never overridden by date math — when system rules
// disagree (e.g. target date passed but status says on_track), surfaces show a
// small ⚠ with a tooltip instead of changing the color (recorded principle).
// skipped / returned keep their hollow-Oravive D-447/D-469 treatment.

import { GateName, DateStatus, GateStateMap, GateDisplayState } from '../../core/types/database';

export const GATE_ORDER: GateName[] = [
  'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
];

/** Submission purple — sits between completion blue and stop red. */
export const GATE_SUBMITTED_PURPLE = '#7E57C2';

/** D-244 user-status palette, single source. */
export const DATE_STATUS_COLORS: Record<string, string> = {
  not_started: '#9E9E9E',
  on_track:    '#2E7D32',
  at_risk:     '#F2A620',
  behind:      '#D32F2F',
  complete:    '#257099'
};

interface GateRecordLite    { gate_name: GateName; gate_status: string; }
interface MilestoneLite     { gate_name: GateName; date_status?: DateStatus | null; target_date?: string | null; actual_date?: string | null; }

/** Canonical per-gate display state. Workflow overrides first, then user status. */
export function resolveGateDisplayState(
  workflowStatus: string | undefined,
  userDateStatus: DateStatus | null | undefined
): GateDisplayState {
  if (workflowStatus === 'approved')           { return 'complete'; }
  // CC-38-32 (amends CC-38-29): a submitted gate keeps the USER's status fill —
  // purple lives on the halo ring only, so submission never hides team status.
  if (workflowStatus === 'blocked')            { return 'blocked'; }
  if (workflowStatus === 'skipped')            { return 'skipped'; }
  if (workflowStatus === 'returned')           { return 'returned'; }
  switch (userDateStatus) {
    case 'on_track':  return 'on_track';
    case 'at_risk':   return 'at_risk';
    case 'behind':    return 'behind';
    case 'complete':  return 'complete';   // user-declared complete — same blue (user wins)
    default:          return 'not_started';
  }
}

/** Shared builder — replaces the divergent dashboard/detail copies so the
 *  grid track and the panel track can never disagree again. */
export function buildUnifiedGateStateMap(
  gateRecords: GateRecordLite[] | undefined,
  milestones: MilestoneLite[] | undefined
): GateStateMap {
  const map: Partial<GateStateMap> = {};
  for (const gate of GATE_ORDER) {
    const record    = (gateRecords ?? []).find(g => g.gate_name === gate);
    const milestone = (milestones ?? []).find(m => m.gate_name === gate);
    map[gate] = resolveGateDisplayState(record?.gate_status, milestone?.date_status);
  }
  return map as GateStateMap;
}

/** First gate in order not approved/skipped — the walkback "next gate". */
export function nextGateInOrder(gateRecords: GateRecordLite[] | undefined): GateName | null {
  const byName = new Map<GateName, string>();
  (gateRecords ?? []).forEach(g => byName.set(g.gate_name, g.gate_status));
  for (const gate of GATE_ORDER) {
    const s = byName.get(gate);
    if (s !== 'approved' && s !== 'skipped') { return gate; }
  }
  return null;
}

/** True when the walkback next gate has neither a target nor an actual date —
 *  drives the dashed-red halo (CC-38-36: an undated working gate is a problem,
 *  and the dash+red beats every other ring treatment, including purple). */
export function nextGateUndated(
  gateRecords: GateRecordLite[] | undefined,
  milestones: MilestoneLite[] | undefined
): boolean {
  const next = nextGateInOrder(gateRecords);
  if (!next) { return false; }
  const ms = (milestones ?? []).find(m => m.gate_name === next);
  return !ms?.target_date && !ms?.actual_date;
}

/** True when the walkback next gate is sitting with an approver — drives the
 *  purple halo (CC-38-32). */
export function nextGateIsSubmitted(gateRecords: GateRecordLite[] | undefined): boolean {
  const next = nextGateInOrder(gateRecords);
  if (!next) { return false; }
  const rec = (gateRecords ?? []).find(g => g.gate_name === next);
  return rec?.gate_status === 'awaiting_approval' || rec?.gate_status === 'pending';
}

/** Warning principle: system disagreement never recolors — it flags. True when
 *  the gate's target date has passed but neither the user status nor the
 *  workflow reflects it (not behind / not submitted / not resolved). */
export function gateDateConflict(
  workflowStatus: string | undefined,
  userDateStatus: DateStatus | null | undefined,
  targetDate: string | null | undefined,
  actualDate: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!targetDate || actualDate) { return false; }
  if (['approved', 'skipped', 'returned', 'awaiting_approval', 'pending'].includes(workflowStatus ?? '')) { return false; }
  if (userDateStatus === 'behind' || userDateStatus === 'complete') { return false; }
  return targetDate < now.toISOString().slice(0, 10);
}
