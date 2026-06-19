// record_consultation_response.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 29 WS2, D-459/D-460/D-466).
//
// A Consulted party records or updates their response on a gate consultation.
// Valid responses: approved, declined, declined_post_approval (D-460).
//   - The caller must own a gate_consultations row for the gate (else rejected).
//   - declined_post_approval is only valid once the gate is 'approved'.
//   - The response window is open indefinitely — no block on post-approval
//     responses; a Consulted party may update their response multiple times.
//   - declined_post_approval triggers the WS4 post-approval decline email
//     (D-466) to the gate approver and Phil.
//
// Source: D-459, D-460, D-466, spec Contract 29 WS2.

'use strict';

const { supabase }                  = require('../db');
const { getPhil }                   = require('./helpers/phil');
const { sendGateNotificationEmail } = require('./helpers/notification-email');

const VALID_RESPONSES = ['approved', 'declined', 'declined_post_approval'];

const GATE_NAME_DISPLAY = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

/**
 * @param {object} params
 * @param {string} params.gate_record_id
 * @param {string} params.response - 'approved' | 'declined' | 'declined_post_approval'
 * @param {string} [params.notes]
 * @param {string} caller_user_id - from JWT
 */
async function record_consultation_response(params, caller_user_id) {
  const { gate_record_id, response, notes } = params;

  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }
  if (!response) {
    return { success: false, error: 'response is required.' };
  }
  if (!VALID_RESPONSES.includes(response)) {
    return { success: false, error: `response must be one of: ${VALID_RESPONSES.join(', ')}.` };
  }

  // ── Caller must own a consultation row for this gate ──────────────────────
  const { data: consultation, error: consultErr } = await supabase
    .from('gate_consultations')
    .select('id, gate_record_id, consulted_user_id, response')
    .eq('gate_record_id', gate_record_id)
    .eq('consulted_user_id', caller_user_id)
    .maybeSingle();

  if (consultErr) {
    return { success: false, error: `Failed to load consultation: ${consultErr.message}` };
  }
  if (!consultation) {
    return {
      success: false,
      error: 'You are not a consulted party on this gate, so you cannot record a response.'
    };
  }

  // ── Fetch the gate record for status + downstream email context ───────────
  const { data: gate_record, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name, gate_status, approver_user_id, approver_decision_at')
    .eq('gate_record_id', gate_record_id)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gate_record) {
    return { success: false, error: 'Gate record not found.' };
  }

  // ── declined_post_approval only valid once the gate is approved ───────────
  if (response === 'declined_post_approval' && gate_record.gate_status !== 'approved') {
    return {
      success: false,
      error: 'A post-approval decline can only be recorded after the gate has been approved.'
    };
  }

  // ── Update the consultation row ───────────────────────────────────────────
  const { data: updated, error: updateErr } = await supabase
    .from('gate_consultations')
    .update({
      response,
      notes:        notes ?? null,
      responded_at: new Date().toISOString()
    })
    .eq('id', consultation.id)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: `Failed to record response: ${updateErr.message}` };
  }

  const gateNameDisplay = GATE_NAME_DISPLAY[gate_record.gate_name] ?? gate_record.gate_name;

  // ── WS4 (D-466): post-approval decline email to approver + Phil ───────────
  if (response === 'declined_post_approval') {
    const [{ data: cycle }, { data: consultedUser }, phil] = await Promise.all([
      supabase.from('delivery_cycles')
        .select('cycle_title')
        .eq('delivery_cycle_id', gate_record.delivery_cycle_id)
        .is('deleted_at', null)
        .maybeSingle(),
      supabase.from('users')
        .select('display_name')
        .eq('id', caller_user_id)
        .is('deleted_at', null)
        .maybeSingle(),
      getPhil()
    ]);

    const initiativeName    = cycle?.cycle_title ?? 'Initiative';
    const consultedName     = consultedUser?.display_name ?? 'A consulted party';
    const approvedOnDate    = gate_record.approver_decision_at
      ? String(gate_record.approver_decision_at).slice(0, 10)
      : 'an earlier date';

    // Recipients: the approver who approved + Phil (always). Deduped in helper.
    const recipientIds = [...new Set(
      [gate_record.approver_user_id, phil ? phil.id : null].filter(Boolean)
    )];
    let emailRecipients = [];
    if (recipientIds.length > 0) {
      const { data: recipientRows } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', recipientIds)
        .is('deleted_at', null);
      emailRecipients = (recipientRows || [])
        .filter(u => u.email)
        .map(u => ({ email: u.email, display_name: u.display_name }));
    }

    const notesSentence = (notes && notes.trim()) ? ` Notes: ${notes.trim()}` : '';
    if (emailRecipients.length > 0) {
      await sendGateNotificationEmail({
        recipients:       emailRecipients,
        subject:          `${consultedName} recorded a post-approval decline — ${gateNameDisplay} on ${initiativeName}`,
        initiativeName,
        gateNameDisplay,
        contextParagraph: `${consultedName} has recorded a post-approval decline on ${gateNameDisplay} for ` +
                          `${initiativeName}.${notesSentence} This gate was approved on ${approvedOnDate}.`,
        delivery_cycle_id: gate_record.delivery_cycle_id,
        email_type:        'post_approval_decline'
      });
    }
  }

  return { success: true, data: updated };
}

module.exports = { record_consultation_response };
