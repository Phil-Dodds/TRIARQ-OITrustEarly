// actions-util.ts — Pathways OI Trust
// Stateless helpers shared by the My Actions tabs (Contract 30 / D-472, WS1.3).
// Kept out of the components so both tabs use one implementation, not copies.

import { GateName } from '../../core/types/database';

/** Canonical gate display names (D-154). The five governance gates, in order. */
export const GATE_DISPLAY: Record<string, string> = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

/** Ordered gate keys — used for the Gate filter option list. */
export const GATE_KEYS: GateName[] = [
  'brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'
];

/** My Actions default date window — last 21 days on created_at (spec WS1.3). */
export const ACTIONS_DEFAULT_FILTER_DAYS = 21;

/** Relative submitted date, e.g. "today", "1 day ago", "3 days ago". */
export function relativeDays(iso: string | null | undefined): string {
  if (!iso) { return '—'; }
  const then = Date.parse(iso);
  if (isNaN(then)) { return '—'; }
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) { return 'today'; }
  if (days === 1) { return '1 day ago'; }
  return `${days} days ago`;
}

/** ISO date (YYYY-MM-DD) for "N days ago from now" — for the default filter cutoff. */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** True when a gate target date is in the past (renders Oravive in the Due column). */
export function isPastDue(targetDate: string | null | undefined): boolean {
  if (!targetDate) { return false; }
  const today = new Date().toISOString().slice(0, 10);
  return targetDate < today;
}

/** Readable decision timestamp, e.g. "Jun 21, 2026, 3:45 PM". Empty when unset. */
export function decisionDateTime(iso: string | null | undefined): string {
  if (!iso) { return ''; }
  const d = new Date(iso);
  if (isNaN(d.getTime())) { return ''; }
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}
