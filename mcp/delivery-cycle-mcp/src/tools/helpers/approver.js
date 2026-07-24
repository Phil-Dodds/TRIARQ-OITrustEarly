// approver.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (Contract 29 WS3).
//
// Resolve the Accountable approver for a gate at submission time (D-463).
// Resolution order (spec WS3 + Session 2026-03-29-C escalation):
//   1. gate_approver_configs row for (division_id, gate_name)
//   2. divisions.owner_user_id (Division Owner escalation)
//   3. Phil (users.is_super_admin = true) — see helpers/phil.js, CC-29-5
//
// Returns the resolved approver_user_id and which source produced it.

'use strict';

const { supabase }       = require('../../db');
const { getPhilUserId }  = require('./phil');

/**
 * @param {object} args
 * @param {string} args.division_id
 * @param {string} args.gate_name
 * @returns {Promise<{ approver_user_id: string|null, source: string }>}
 *   source ∈ 'config' | 'division_owner' | 'phil' | 'unresolved'
 */
async function resolveGateApprover({ division_id, gate_name }) {
  // Build the resolution tiers in priority order, then return the FIRST tier
  // whose user is live (not soft-deleted). A configured approver or division
  // owner who was later soft-deleted must NOT be returned — that would route
  // the gate to a user who can never act and silently drop the submission
  // email. Falling through to the next tier (ultimately Phil) keeps the gate
  // approvable. Phil's own row is already deleted_at-checked in getPhilUserId.
  const candidates = [];

  if (division_id) {
    // 1. Configured approver for this Division + gate.
    const { data: config } = await supabase
      .from('gate_approver_configs')
      .select('approver_user_id')
      .eq('division_id', division_id)
      .eq('gate_name', gate_name)
      .maybeSingle();
    if (config?.approver_user_id) {
      candidates.push({ id: config.approver_user_id, source: 'config' });
    }

    // 2. Division Owner escalation.
    const { data: division } = await supabase
      .from('divisions')
      .select('owner_user_id')
      .eq('id', division_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (division?.owner_user_id) {
      candidates.push({ id: division.owner_user_id, source: 'division_owner' });
    }
  }

  // 3. Phil fallback.
  const philId = await getPhilUserId();
  if (philId) {
    candidates.push({ id: philId, source: 'phil' });
  }

  // Return the first candidate that is a live (non-deleted) user.
  for (const c of candidates) {
    const { data: live } = await supabase
      .from('users')
      .select('id')
      .eq('id', c.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (live) {
      return { approver_user_id: c.id, source: c.source };
    }
  }

  return { approver_user_id: null, source: 'unresolved' };
}

// ── Contract G2 — Approver Resolution v2 (D-557/D-561/D-570) ─────────────────

/**
 * Is this user "leadership" FOR THIS CYCLE at L3 (Checkpoint 2026-07-23,
 * CC-G2-01 CORRECTED): Phil (is_super_admin), the cycle's own Division
 * Leader, or the leader of any ANCESTOR Division in the parent chain.
 * Owners of Divisions outside the cycle's ancestor chain are NOT leadership
 * for that cycle. IE joins this set at G8.
 */
async function isLeadershipForCycle(user_id, division_id) {
  if (!user_id) { return false; }
  const { data: userRow } = await supabase
    .from('users')
    .select('id, is_super_admin')
    .eq('id', user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!userRow) { return false; }
  if (userRow.is_super_admin === true) { return true; }

  // Walk the Division parent chain (Trust → Service Line → Functional Team is
  // 3 levels today; depth-guarded against accidental cycles).
  let currentDivisionId = division_id;
  let depth = 0;
  while (currentDivisionId && depth < 10) {
    const { data: division } = await supabase
      .from('divisions')
      .select('id, owner_user_id, parent_division_id')
      .eq('id', currentDivisionId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!division) { break; }
    if (division.owner_user_id === user_id) { return true; }
    currentDivisionId = division.parent_division_id;
    depth += 1;
  }
  return false;
}

/** Live (non-deleted) user check shared by v2 tiers. */
async function isLiveUser(user_id) {
  if (!user_id) { return false; }
  const { data: live } = await supabase
    .from('users')
    .select('id')
    .eq('id', user_id)
    .is('deleted_at', null)
    .maybeSingle();
  return !!live;
}

/**
 * Contract G2 — effective-level-aware approver resolution (D-557 chain,
 * D-561 oversight, D-570 transition rulings, S-C4).
 *
 * Levels:
 *   NULL (unsized) → legacy resolveGateApprover, dual_write=false (D-570b).
 *                    Oversight ignored (CC-G2 lean: unsized = "exactly as
 *                    today", strictly legacy).
 *   L1  → oversight set → runs as L2: oversight person (S-C4).
 *         Otherwise legacy chain unchanged, dual_write=true (D-570a).
 *   L2  → oversight → gate_approver_configs → Division Leader → Phil.
 *         dual_write=true.
 *   L3  → leadership only: oversight (only when the person is leadership —
 *         non-leadership oversight ignored with warning) → DL → Phil.
 *         gate_approver_configs ignored entirely; a config row naming a
 *         non-leadership person adds warnings[]
 *         'level3_sub_leadership_config_ignored' (D-570c, S-C1).
 *         dual_write=true.
 *
 * @param {object} args
 * @param {object} args.cycle — delivery_cycles row incl. division_id,
 *                              baseline_level, set_level, oversight_user_id
 * @param {string} args.gate_name
 * @returns {Promise<{ approver_user_id: string|null, source: string,
 *   effective_level: number|null, warnings: string[], dual_write: boolean }>}
 *   source ∈ 'oversight' | 'config' | 'division_owner' | 'phil' |
 *            'legacy_config' | 'legacy_division_owner' | 'legacy_phil' |
 *            'unresolved'
 */
async function resolveGateApproverV2({ cycle, gate_name }) {
  const effective_level = cycle.set_level ?? cycle.baseline_level ?? null;
  const warnings = [];

  // Unsized → legacy exactly as today (D-570b). No dual-write.
  if (effective_level === null) {
    const legacy = await resolveGateApprover({ division_id: cycle.division_id, gate_name });
    return {
      approver_user_id: legacy.approver_user_id,
      source: `legacy_${legacy.source}`,
      effective_level: null,
      warnings,
      dual_write: false
    };
  }

  // Oversight (D-561). At L1/L2 it wins outright (S-C4: L1 + oversight runs
  // as L2). At L3 only a leadership person may hold it.
  if (cycle.oversight_user_id && await isLiveUser(cycle.oversight_user_id)) {
    if (effective_level !== 3) {
      return {
        approver_user_id: cycle.oversight_user_id,
        source: 'oversight',
        effective_level,
        warnings,
        dual_write: true
      };
    }
    if (await isLeadershipForCycle(cycle.oversight_user_id, cycle.division_id)) {
      return {
        approver_user_id: cycle.oversight_user_id,
        source: 'oversight',
        effective_level,
        warnings,
        dual_write: true
      };
    }
    warnings.push('level3_sub_leadership_config_ignored');
  }

  // L1 without oversight → consensus route (Contract G5 — D-570a RETIRED).
  // approver_user_id NULL is the real state: the gate collects approvals from
  // the trio + consulted parties instead of routing a single approver. No
  // 'assigned' dual-write — trio_member rows are written as approvals arrive.
  if (effective_level === 1) {
    return {
      approver_user_id: null,
      source: 'l1_consensus',
      effective_level,
      warnings,
      dual_write: false
    };
  }

  // L2: config tier. L3: config ignored — warn when it names non-leadership.
  if (cycle.division_id) {
    const { data: config } = await supabase
      .from('gate_approver_configs')
      .select('approver_user_id')
      .eq('division_id', cycle.division_id)
      .eq('gate_name', gate_name)
      .maybeSingle();

    if (config?.approver_user_id) {
      if (effective_level === 2) {
        if (await isLiveUser(config.approver_user_id)) {
          return {
            approver_user_id: config.approver_user_id,
            source: 'config',
            effective_level,
            warnings,
            dual_write: true
          };
        }
      } else if (!(await isLeadershipForCycle(config.approver_user_id, cycle.division_id))) {
        // L3 (D-570c/S-C1): sub-leadership config exists and is ignored.
        if (!warnings.includes('level3_sub_leadership_config_ignored')) {
          warnings.push('level3_sub_leadership_config_ignored');
        }
      }
    }
  }

  // Shared L2/L3 terminal chain: Division Leader → Phil.
  if (cycle.division_id) {
    const { data: division } = await supabase
      .from('divisions')
      .select('owner_user_id')
      .eq('id', cycle.division_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (division?.owner_user_id && await isLiveUser(division.owner_user_id)) {
      return {
        approver_user_id: division.owner_user_id,
        source: 'division_owner',
        effective_level,
        warnings,
        dual_write: true
      };
    }
  }

  const philId = await getPhilUserId();
  if (philId && await isLiveUser(philId)) {
    return { approver_user_id: philId, source: 'phil', effective_level, warnings, dual_write: true };
  }

  return { approver_user_id: null, source: 'unresolved', effective_level, warnings, dual_write: false };
}

/**
 * Contract G2 dual-write (D-570a / spec §2): record the resolved assignment in
 * gate_approvals as 'assigned' so the G5 transition has a truthful history.
 * Dup guard (CC-G2 lean): one 'assigned' row per (gate, approver) — a
 * resubmission resolving the same person adds no duplicate; a different
 * resolution is a new history row. Non-fatal on failure (returns error string
 * for the caller's server log; the submission itself already succeeded).
 *
 * @returns {Promise<{ written: boolean, error: string|null }>}
 */
async function recordAssignedDualWrite(gate_record_id, approver_user_id) {
  const { data: existingAssigned } = await supabase
    .from('gate_approvals')
    .select('approval_id')
    .eq('gate_record_id', gate_record_id)
    .eq('approver_user_id', approver_user_id)
    .eq('approval_type', 'assigned')
    .maybeSingle();
  if (existingAssigned) { return { written: false, error: null }; }

  const { error: insertErr } = await supabase
    .from('gate_approvals')
    .insert({ gate_record_id, approver_user_id, approval_type: 'assigned' });
  if (insertErr) { return { written: false, error: insertErr.message }; }
  return { written: true, error: null };
}

module.exports = { resolveGateApprover, resolveGateApproverV2, recordAssignedDualWrite, isLeadershipForCycle };
