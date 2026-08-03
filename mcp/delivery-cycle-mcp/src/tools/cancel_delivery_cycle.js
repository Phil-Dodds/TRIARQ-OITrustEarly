// cancel_delivery_cycle.js
// Pathways OI Trust — delivery-cycle-mcp
// Marks an Initiative as CANCELLED. Preserves the current lifecycle stage
// in pre_hold_lifecycle_stage so uncancel_delivery_cycle can restore it.
// Uses pre_hold_lifecycle_stage as a shared "preserved prior stage" column —
// a cycle cannot simultaneously be ON_HOLD and CANCELLED, so reuse is safe.
//
// Guards:
//   - Cannot cancel a cycle that is already CANCELLED.
//   - Cannot cancel a cycle that is COMPLETE (terminal).
//
// Returns the updated cycle row. Detail panel re-queries via get_delivery_cycle
// after this call (loadCycle pattern) so the full enriched cycle is rebuilt.
//
// Source: D-108 lifecycle stages; S-009 cancelled-item visibility.

'use strict';

const { supabase } = require('../db');
// Contract G10 (D-566): severity-based cancel authority + C/I notifications.
const { resolveCancelAuthority, participationHolderIds } = require('./helpers/cancel-authority');
const { enqueueNotifications } = require('./helpers/notification-queue');

async function cancel_delivery_cycle(params, caller_user_id) {
  const { delivery_cycle_id } = params;

  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, pre_hold_lifecycle_stage, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, baseline_level, set_level, oversight_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();

  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }

  // ── Contract G10 (D-566): cancellation authority follows severity ──────────
  // Pre-Brief-Review / L1 / unsized: any trio member. L2/L3 post-Brief-Review:
  // the resolved approver. Admin/Phil retain operational authority; an IE may
  // execute as the release valve for stuck cancel requests (D-566/D-560).
  {
    const { data: caller } = await supabase
      .from('users')
      .select('is_admin, is_super_admin, is_initiative_executive')
      .eq('id', caller_user_id)
      .is('deleted_at', null)
      .maybeSingle();
    const isPrivileged = caller?.is_admin === true || caller?.is_super_admin === true ||
                         caller?.is_initiative_executive === true;
    if (!isPrivileged) {
      const authority = await resolveCancelAuthority(cycle);
      const isTrioMember = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
        .includes(caller_user_id);
      const allowed = authority.mode === 'trio'
        ? isTrioMember
        : authority.authority_user_id === caller_user_id;
      if (!allowed) {
        return {
          success: false,
          error: authority.mode === 'trio'
            ? 'Cancelling this Initiative requires a trio member (Domain Capability Strategist, Engineering Product Owner, or Domain Outcome Lead).'
            : 'After Brief Review, cancelling a Level 2/3 Initiative requires the resolved approver. ' +
              'Trio members can use Request Cancel — the request routes to the approver with your reason (D-566).'
        };
      }
    }
  }

  if (cycle.current_lifecycle_stage === 'CANCELLED') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is already CANCELLED. Use Un-cancel to restore it.`
    };
  }
  if (cycle.current_lifecycle_stage === 'COMPLETE') {
    return {
      success: false,
      error: `"${cycle.cycle_title}" is COMPLETE and cannot be cancelled.`
    };
  }

  const priorStage = cycle.current_lifecycle_stage;

  const { data: updated, error: updateErr } = await supabase
    .from('delivery_cycles')
    .update({
      pre_hold_lifecycle_stage: priorStage,
      current_lifecycle_stage:  'CANCELLED'
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to cancel Initiative: ${updateErr.message}` };
  }

  await supabase
    .from('cycle_event_log')
    .insert({
      delivery_cycle_id,
      event_type:        'cycle_cancelled',
      event_description: `Initiative cancelled from ${priorStage}.`,
      actor_user_id:     caller_user_id,
      event_metadata:    { prior_stage: priorStage }
    });

  // ── Contract G10 (D-566): executing a cancel closes any open request ───────
  await supabase
    .from('cancel_requests')
    .update({
      request_status:      'executed',
      resolved_by_user_id: caller_user_id,
      resolved_at:         new Date().toISOString()
    })
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('request_status', 'open');

  // ── Contract G10 (D-566): cancellation notifies all C and I holders ────────
  try {
    const holderIds = (await participationHolderIds(delivery_cycle_id))
      .filter(id => id !== caller_user_id);
    if (holderIds.length > 0) {
      const { data: holders } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', holderIds)
        .is('deleted_at', null);
      // Contract 45 (D-642): queued rather than sent directly.
      // IMMEDIATE even for Informed parties — D-647 moves Informed gate
      // DECISIONS to the digest but keeps cancellation immediate, because a
      // cancelled Initiative invalidates work in progress rather than
      // reporting on it.
      const recipients = (holders || []).filter(u => u.email)
        .map(u => ({
          user_id:        u.id,
          email:          u.email,
          display_name:   u.display_name,
          delivery_class: 'immediate'
        }));
      if (recipients.length > 0) {
        await enqueueNotifications({
          event_type:      'cycle_cancelled',
          recipients,
          subject:         `${cycle.cycle_title} — Initiative cancelled`,
          initiativeName:  cycle.cycle_title,
          gateNameDisplay: 'Cancellation',
          headline:        `${cycle.cycle_title} was cancelled (from ${priorStage}).`,
          detail:          'You are notified as a Consulted or Informed party on the Initiative.',
          initiative_id:   delivery_cycle_id,
          actor_user_id:   caller_user_id
        });
      }
    }
  } catch (notifyErr) {
    console.error(JSON.stringify({
      tool_name: 'cancel_delivery_cycle', step: 'participation_notification',
      delivery_cycle_id, error: notifyErr?.message ?? String(notifyErr)
    }));
  }

  return { success: true, data: updated };
}

module.exports = { cancel_delivery_cycle };
