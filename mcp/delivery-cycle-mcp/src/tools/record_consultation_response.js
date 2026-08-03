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
const { enqueueNotifications } = require('./helpers/notification-queue');
const { GATE_NAME_DISPLAY } = require('./helpers/gates');
// Contract G5 (D-557): L1 consensus — consulted responses carry gate force.
const { isL1ConsensusGate, trioIdsOf, getL1CollectedState, clearGateApprovals } = require('./helpers/l1-consensus');
const { applyGateApprovalTransition } = require('./record_gate_decision');
// Contract G6 (D-565): conditions hold gates; returns clear them.
// Phil ruling 2026-07-26: condition auto-clear on return retired (durable conditions).
const { countOpenConditions } = require('./helpers/gate-conditions');
// Contract GA-1 (D-579): consulted assessment rides with an approving response.
const { validateOrError: validateAssessmentOrError, saveAssessment, clearActiveAssessments } = require('./helpers/gate-assessments');

const VALID_RESPONSES = ['approved', 'declined', 'declined_post_approval'];

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

  // ── Contract GA-1 (D-579): consulted self-assessment ───────────────────────
  // Collected with an APPROVING consultation response only — declines carry
  // their note instead (GA-1 §3). Items: stakeholders + gate subs; N/A freely.
  // Validated before the response writes; saved after (non-fatal).
  let consultedAssessmentItems = null;
  if (response === 'approved') {
    const v = validateAssessmentOrError(gate_record.gate_name, 'consulted', params.assessment ?? []);
    if (!v.ok) {
      return { success: false, error: `Cannot record your response — ${v.error}` };
    }
    consultedAssessmentItems = v.items;
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

  // GA-1: persist the consulted assessment (non-fatal after the response write).
  if (consultedAssessmentItems) {
    const savedAssessment = await saveAssessment({
      delivery_cycle_id: gate_record.delivery_cycle_id, gate_key: gate_record.gate_name,
      respondent_user_id: caller_user_id, respondent_role: 'consulted',
      items: consultedAssessmentItems
    });
    if (savedAssessment.error) {
      console.error(JSON.stringify({
        tool_name: 'record_consultation_response', step: 'save_consulted_assessment',
        gate_record_id, error: savedAssessment.error
      }));
    }
  }

  // ── Contract G6 (D-565, S-B5): consultation_required conditions targeting
  // this consultation auto-resolve the moment the party approves. Non-fatal.
  if (response === 'approved') {
    const { error: autoResolveErr } = await supabase
      .from('gate_conditions')
      .update({
        condition_status:    'resolved',
        resolved_at:         new Date().toISOString(),
        resolved_by_user_id: caller_user_id,
        resolution_note:     'Auto-resolved — the required consultation was approved (S-B5).'
      })
      .eq('target_consultation_id', consultation.id)
      .eq('condition_status', 'open');
    if (autoResolveErr) {
      console.error(JSON.stringify({
        tool_name: 'record_consultation_response', step: 'condition_auto_resolve',
        consultation_id: consultation.id, error: autoResolveErr.message
      }));
    }
  }

  // ── Contract G5 (D-557): Level 1 consensus hooks ───────────────────────────
  // On an awaiting L1 gate a consulted response carries gate force:
  //   - declined → returns the gate ENTIRELY (S-A4 — consulted return = trio
  //     return semantics); all collected approvals cleared (ruling 1).
  //   - approved → the gate passes the instant this was the last collected
  //     party (AC #6) via the shared approval transition.
  if (gate_record.gate_status === 'awaiting_approval') {
    const { data: cycle } = await supabase
      .from('delivery_cycles')
      .select('delivery_cycle_id, cycle_title, current_lifecycle_stage, workstream_id, assigned_dcs_user_id, assigned_epo_user_id, assigned_dol_user_id, baseline_level, set_level')
      .eq('delivery_cycle_id', gate_record.delivery_cycle_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (cycle && isL1ConsensusGate(cycle, gate_record)) {
      const { data: responder } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', caller_user_id)
        .is('deleted_at', null)
        .maybeSingle();
      const responderName = responder?.display_name ?? 'A consulted party';

      if (response === 'declined') {
        const { error: returnErr } = await supabase
          .from('gate_records')
          .update({
            gate_status:          'returned',
            approver_decision_at: new Date().toISOString(),
            approver_notes:       notes ?? null
          })
          .eq('gate_record_id', gate_record.gate_record_id);
        if (returnErr) {
          return { success: false, error: `Response recorded but the gate return failed: ${returnErr.message}` };
        }

        const { data: returnEvent } = await supabase
          .from('cycle_event_log')
          .insert({
            delivery_cycle_id: gate_record.delivery_cycle_id,
            event_type:        'gate_returned',
            event_description: `${responderName} declined their consultation on ${gateNameDisplay} — Level 1 consulted return returns the gate entirely (S-A4).`,
            actor_user_id:     caller_user_id,
            event_metadata:    { gate_name: gate_record.gate_name, l1_consensus: true, consulted_return: true }
          })
          .select('event_id')
          .single();

        await clearGateApprovals(gate_record.gate_record_id, returnEvent?.event_id ?? null);
        // Phil ruling 2026-07-26: conditions are durable — no auto-clear on return.
        // GA-1 §5: the consulted return stamps the attempt's assessments too.
        await clearActiveAssessments(gate_record.delivery_cycle_id, gate_record.gate_name, returnEvent?.event_id ?? null);

        // S-A2/S-A4: trio notified.
        const trioIds = trioIdsOf(cycle).filter(id => id !== caller_user_id);
        if (trioIds.length > 0) {
          const { data: trioRows } = await supabase
            .from('users')
            .select('id, display_name, email')
            .in('id', trioIds)
            .is('deleted_at', null);
          // Contract 45 (D-642): queued. IMMEDIATE — the trio must realign and
          // resubmit, which is the D-641 waiting-on test.
          const recipients = (trioRows || []).filter(u => u.email)
            .map(u => ({ user_id: u.id, email: u.email, display_name: u.display_name,
                         delivery_class: 'immediate' }));
          if (recipients.length > 0) {
            await enqueueNotifications({
              event_type:      'l1_gate_returned',
              recipients,
              subject:         `${cycle.cycle_title} — ${gateNameDisplay} returned by a consulted party`,
              initiativeName:  cycle.cycle_title,
              gateNameDisplay,
              headline:        `${responderName} declined their consultation on ${gateNameDisplay} for ${cycle.cycle_title}.`,
              detail:          `At Level 1 a consulted return returns the gate entirely — all collected approvals were cleared.${notes?.trim() ? ` Notes: ${notes.trim()}` : ''}`,
              initiative_id:   gate_record.delivery_cycle_id,
              gate_record_id:  gate_record.gate_record_id,
              actor_user_id:   caller_user_id
            });
          }
        }

        return { success: true, data: { ...updated, l1_gate_returned: true } };
      }

      if (response === 'approved') {
        const state = await getL1CollectedState(gate_record.gate_record_id, cycle);
        // G6: open conditions hold the gate even at full collection.
        const openConditions = await countOpenConditions(gate_record.gate_record_id);
        if (!state.error && state.allCollected && openConditions.count === 0) {
          const transition = await applyGateApprovalTransition({
            delivery_cycle_id: gate_record.delivery_cycle_id,
            gate_name:         gate_record.gate_name,
            gate_record, cycle,
            actor_user_id:     caller_user_id,
            actorDisplayName:  responderName,
            approver_user_id_for_record: null,
            approver_notes:    null
          });
          if (transition.error) {
            return { success: false, error: `Response recorded but the gate approval failed: ${transition.error}` };
          }
          return { success: true, data: { ...updated, l1_gate_approved: true, ...transition.data } };
        }
      }
    }
  }

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
      // Contract 45 (D-642): IMMEDIATE — D-466 made this loud on purpose; a
      // decline arriving after approval needs the approver's attention now.
      emailRecipients = (recipientRows || [])
        .filter(u => u.email)
        .map(u => ({ user_id: u.id, email: u.email, display_name: u.display_name,
                     delivery_class: 'immediate' }));
    }

    const notesSentence = (notes && notes.trim()) ? ` Notes: ${notes.trim()}` : '';
    if (emailRecipients.length > 0) {
      await enqueueNotifications({
        event_type:      'post_approval_decline',
        recipients:      emailRecipients,
        subject:         `${consultedName} recorded a post-approval decline — ${gateNameDisplay} on ${initiativeName}`,
        initiativeName,
        gateNameDisplay,
        headline:        `${consultedName} has recorded a post-approval decline on ${gateNameDisplay} for ${initiativeName}.`,
        detail:          `${notesSentence.trim()} This gate was approved on ${approvedOnDate}.`.trim(),
        initiative_id:   gate_record.delivery_cycle_id,
        gate_record_id:  gate_record.gate_record_id,
        actor_user_id:   caller_user_id
      });
    }
  }

  return { success: true, data: updated };
}

module.exports = { record_consultation_response };
