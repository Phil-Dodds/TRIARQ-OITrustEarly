// cancel_requests.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G10 (D-566)
// Request-cancel: the trio initiates at every level (reason required); the
// request routes to the cancel authority and appears in their queue. The
// authority executes (cancel_delivery_cycle closes the request) or declines
// with a note. The IE release valve applies to stuck requests.

'use strict';

const { supabase } = require('../db');
const { resolveCancelAuthority } = require('./helpers/cancel-authority');
const { sendGateNotificationEmail } = require('./helpers/notification-email');

/**
 * @param {string} params.delivery_cycle_id
 * @param {string} params.reason — required (D-566)
 */
async function request_cancel(params, caller_user_id) {
  const { delivery_cycle_id, reason } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  if (!reason || !String(reason).trim()) {
    return { success: false, error: 'A reason is required to request cancellation (D-566).' };
  }

  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, division_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, baseline_level, set_level, oversight_user_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .is('deleted_at', null)
    .single();
  if (cycleErr || !cycle) {
    return { success: false, error: 'Initiative not found or has been deleted.' };
  }
  if (cycle.current_lifecycle_stage === 'CANCELLED' || cycle.current_lifecycle_stage === 'COMPLETE') {
    return { success: false, error: `"${cycle.cycle_title}" is ${cycle.current_lifecycle_stage} — nothing to request.` };
  }

  const isTrioMember = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
    .includes(caller_user_id);
  if (!isTrioMember) {
    return { success: false, error: 'Requesting cancellation is a trio action (DCS, EPO, or DOL on this Initiative).' };
  }

  const { data: existing } = await supabase
    .from('cancel_requests')
    .select('request_id')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('request_status', 'open')
    .maybeSingle();
  if (existing) {
    return { success: false, error: 'A cancel request is already open on this Initiative.' };
  }

  const authority = await resolveCancelAuthority(cycle);
  if (authority.error) {
    return { success: false, error: `Failed to resolve the cancel authority: ${authority.error}` };
  }

  const { data: request, error: insertErr } = await supabase
    .from('cancel_requests')
    .insert({
      delivery_cycle_id,
      requested_by_user_id: caller_user_id,
      reason:               String(reason).trim(),
      authority_user_id:    authority.mode === 'approver' ? authority.authority_user_id : null
    })
    .select()
    .single();
  if (insertErr) {
    return { success: false, error: `Failed to record the cancel request: ${insertErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id,
    event_type:        'cancel_requested',
    event_description: `Cancellation requested. Reason: ${String(reason).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { request_id: request.request_id, authority_user_id: request.authority_user_id }
  });

  // Route: email the authority (approver mode) or the other trio members.
  const notifyIds = authority.mode === 'approver'
    ? [authority.authority_user_id].filter(Boolean)
    : [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
        .filter(id => id && id !== caller_user_id);
  if (notifyIds.length > 0) {
    const { data: recipientsRows } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', notifyIds)
      .is('deleted_at', null);
    const recipients = (recipientsRows || []).filter(u => u.email)
      .map(u => ({ email: u.email, display_name: u.display_name }));
    if (recipients.length > 0) {
      await sendGateNotificationEmail({
        recipients,
        subject:          `${cycle.cycle_title} — cancellation requested`,
        initiativeName:   cycle.cycle_title,
        gateNameDisplay:  'Cancel request',
        contextParagraph: `A trio member requested cancellation of ${cycle.cycle_title}. ` +
                          `Reason: ${String(reason).trim()}. ` +
                          (authority.mode === 'approver'
                            ? 'You are the resolved cancel authority — execute or decline from the Initiative panel.'
                            : 'Any trio member can execute the cancellation from the Initiative panel.'),
        delivery_cycle_id,
        email_type:       'cancel_requested'
      });
    }
  }

  return { success: true, data: request };
}

/**
 * Decline an open cancel request (the authority, an IE, or an Admin).
 * Executing = cancel_delivery_cycle (it closes the request itself).
 * @param {string} params.request_id
 * @param {string} params.note — required on decline
 */
async function decline_cancel_request(params, caller_user_id) {
  const { request_id, note } = params;
  if (!request_id) {
    return { success: false, error: 'request_id is required.' };
  }
  if (!note || !String(note).trim()) {
    return { success: false, error: 'A note is required when declining a cancel request — the requester is notified.' };
  }

  const { data: request, error: requestErr } = await supabase
    .from('cancel_requests')
    .select('request_id, delivery_cycle_id, requested_by_user_id, authority_user_id, request_status, reason')
    .eq('request_id', request_id)
    .single();
  if (requestErr || !request) {
    return { success: false, error: 'Cancel request not found.' };
  }
  if (request.request_status !== 'open') {
    return { success: false, error: 'This cancel request has already been resolved.' };
  }

  let authorized = request.authority_user_id === caller_user_id;
  if (!authorized) {
    // Trio-authority requests (authority NULL): any trio member may decline.
    const { data: cycle } = await supabase
      .from('delivery_cycles')
      .select('assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, cycle_title')
      .eq('delivery_cycle_id', request.delivery_cycle_id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!request.authority_user_id && cycle) {
      authorized = [cycle.assigned_dcs_user_id, cycle.assigned_epo_user_id, cycle.assigned_dol_user_id]
        .includes(caller_user_id);
    }
    if (!authorized) {
      const { data: caller } = await supabase
        .from('users')
        .select('is_admin, is_super_admin, is_initiative_executive')
        .eq('id', caller_user_id)
        .is('deleted_at', null)
        .maybeSingle();
      authorized = caller?.is_admin === true || caller?.is_super_admin === true ||
                   caller?.is_initiative_executive === true;
    }
  }
  if (!authorized) {
    return { success: false, error: 'Declining this request requires the cancel authority, an Initiative Executive, or an Admin.' };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('cancel_requests')
    .update({
      request_status:      'declined',
      resolved_by_user_id: caller_user_id,
      resolution_note:     String(note).trim(),
      resolved_at:         new Date().toISOString()
    })
    .eq('request_id', request_id)
    .select()
    .single();
  if (updateErr) {
    return { success: false, error: `Failed to decline the request: ${updateErr.message}` };
  }

  await supabase.from('cycle_event_log').insert({
    delivery_cycle_id: request.delivery_cycle_id,
    event_type:        'cancel_request_declined',
    event_description: `Cancel request declined. Note: ${String(note).trim()}`,
    actor_user_id:     caller_user_id,
    event_metadata:    { request_id }
  });

  // Notify the requester.
  const { data: requester } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', request.requested_by_user_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (requester?.email) {
    const { data: cycleRow } = await supabase
      .from('delivery_cycles')
      .select('cycle_title')
      .eq('delivery_cycle_id', request.delivery_cycle_id)
      .maybeSingle();
    await sendGateNotificationEmail({
      recipients:       [{ email: requester.email, display_name: requester.display_name }],
      subject:          `${cycleRow?.cycle_title ?? 'Initiative'} — cancel request declined`,
      initiativeName:   cycleRow?.cycle_title ?? 'Initiative',
      gateNameDisplay:  'Cancel request',
      contextParagraph: `Your cancellation request was declined. Note: ${String(note).trim()}`,
      delivery_cycle_id: request.delivery_cycle_id,
      email_type:       'cancel_request_declined'
    });
  }

  return { success: true, data: updated };
}

/** Open cancel request on a cycle (detail-panel banner). */
async function get_open_cancel_request(params, caller_user_id) {
  const { delivery_cycle_id } = params;
  if (!delivery_cycle_id) {
    return { success: false, error: 'delivery_cycle_id is required.' };
  }
  const { data: request } = await supabase
    .from('cancel_requests')
    .select('*')
    .eq('delivery_cycle_id', delivery_cycle_id)
    .eq('request_status', 'open')
    .maybeSingle();
  if (!request) {
    return { success: true, data: { request: null } };
  }
  const { data: requester } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', request.requested_by_user_id)
    .maybeSingle();
  return {
    success: true,
    data: { request: { ...request, requested_by_display_name: requester?.display_name ?? null } }
  };
}

module.exports = { request_cancel, decline_cancel_request, get_open_cancel_request };
