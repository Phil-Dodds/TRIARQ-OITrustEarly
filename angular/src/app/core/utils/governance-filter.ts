// governance-filter.ts — Pathways OI Trust
// Contract G9 (D-563 Grade 1): interest-profile matching over sizing answers,
// sub-answers, Other-notes, Division, and stage.
// Semantics: OR-of-ANDs — a profile is a set of conditions; an Initiative
// matches when ANY condition is true; each condition is a small AND of its
// set fields. No arbitrary nested boolean logic (locked).

import { DeliveryCycle, InitiativeSizing, LifecycleStage } from '../types/database';

export interface InterestCondition {
  q1_investment?:      'small' | 'medium' | 'large' | 'xlarge' | '';
  q2_novelty?:         'standard' | 'major' | '';
  q3_wrongness?:       'contained' | 'significant' | 'large_hard' | '';
  q4_security_impact?: 'yes' | 'no' | '';
  q5_ux?:              'standard' | 'critical' | '';
  q2_sub_new_vendor?:  'yes' | 'no' | '';
  division_id?:        string;
  stage?:              LifecycleStage | '';
  /** Case-insensitive substring across the five Other-notes. */
  note_contains?:      string;
}

/** Row shape: a list_delivery_cycles row (sizing joined; null = unsized). */
export interface GovernanceFilterRow {
  division_id?: string | null;
  current_lifecycle_stage?: LifecycleStage | string | null;
  sizing?: InitiativeSizing | null;
}

function conditionMatches(row: GovernanceFilterRow, c: InterestCondition): boolean {
  const s = row.sizing ?? null;

  if (c.q1_investment)      { if (!s || s.q1_investment !== c.q1_investment) { return false; } }
  if (c.q2_novelty)         { if (!s || s.q2_novelty !== c.q2_novelty) { return false; } }
  if (c.q3_wrongness)       { if (!s || s.q3_wrongness !== c.q3_wrongness) { return false; } }
  if (c.q4_security_impact) {
    if (!s || s.q4_security_impact !== (c.q4_security_impact === 'yes')) { return false; }
  }
  if (c.q5_ux)              { if (!s || s.q5_ux !== c.q5_ux) { return false; } }
  if (c.q2_sub_new_vendor) {
    if (!s || (s.q2_sub_new_vendor === true) !== (c.q2_sub_new_vendor === 'yes')) { return false; }
  }
  if (c.division_id)        { if (row.division_id !== c.division_id) { return false; } }
  if (c.stage)              { if (row.current_lifecycle_stage !== c.stage) { return false; } }
  if (c.note_contains && c.note_contains.trim()) {
    const needle = c.note_contains.trim().toLowerCase();
    const haystack = [s?.q1_note, s?.q2_note, s?.q3_note, s?.q4_note, s?.q5_note]
      .filter(Boolean).join(' \n ').toLowerCase();
    if (!haystack.includes(needle)) { return false; }
  }
  return true;
}

/** True when the profile is empty OR any condition matches (OR-of-ANDs). */
export function matchesInterestProfile(
  row: GovernanceFilterRow | DeliveryCycle,
  conditions: InterestCondition[]
): boolean {
  const active = (conditions ?? []).filter(c => hasAnyField(c));
  if (active.length === 0) { return true; }
  return active.some(c => conditionMatches(row as GovernanceFilterRow, c));
}

export function hasAnyField(c: InterestCondition): boolean {
  return !!(c.q1_investment || c.q2_novelty || c.q3_wrongness || c.q4_security_impact ||
    c.q5_ux || c.q2_sub_new_vendor || c.division_id || c.stage ||
    (c.note_contains && c.note_contains.trim()));
}
