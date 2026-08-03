// notification-queue.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (Contract 45, D-642).
//
// Every notification trigger writes a `notification_queue` row through here.
// MCP tools stop invoking `send-notification-email` directly (D-642).
//
// ── Why a queue at all ───────────────────────────────────────────────────────
// Two reasons, both structural rather than architectural tidiness:
//   1. Awareness traffic can be batched into one 06:00 digest (D-643) instead
//      of arriving one email at a time.
//   2. A manager can be told about their reports' work (D-638 fan-out) without
//      every trigger site knowing the org chart.
//
// ── Headlines render at WRITE time ───────────────────────────────────────────
// The event's facts are true when it happens. Re-deriving a headline at 06:00
// risks describing a state that has since changed — "waiting 9 days on Sabrina"
// when Sabrina approved it overnight. This is the D-463 stored-at-submission
// pattern applied to messages. Callers therefore pass finished text, not ids to
// resolve later.
//
// ── Classification (D-641) is decided by the CALLER ──────────────────────────
// The rule is "if the recipient appears in the gate's D-565(4) waiting-on line,
// immediate; if they are an awareness party, digest." `computeWaitingOnBatch`
// returns a rendered line and a state, not the set of user ids it names, so
// this helper cannot re-derive membership without duplicating that logic and
// letting the two drift. The call site already knows why it is addressing each
// person — approver, trio, consulted, informed — so it states the class.
//
// The four loud exceptions are NOT left to the caller: they are forced
// immediate here, from a single list, because "never suppressible" is exactly
// the property that must not depend on remembering to pass a flag.

'use strict';

const { supabase } = require('../../db');
const { sendGateNotificationEmail } = require('./notification-email');

/**
 * The four loud exceptions (D-641). Always immediate regardless of what the
 * caller asks for, never preference-suppressible (D-644), and never fanned out
 * to a manager (D-642) — each is person-specific, addressed to someone whose
 * own instrument was overridden. A manager copy would be gossip, not awareness.
 */
const LOUD_EVENT_TYPES = Object.freeze([
  'oversight_cleared',                      // D-561
  'governance_level_lowered',               // D-562
  'ie_override',                            // D-560
  'approved_over_returned_consultation'     // D-569
]);

const IMMEDIATE = 'immediate';
const DIGEST    = 'digest';

/** True when this event type is one of the four that can never be batched. */
function isLoudEvent(event_type) {
  return LOUD_EVENT_TYPES.includes(event_type);
}

/**
 * Resolve managers for a set of recipients, for the D-642 fan-out.
 * One query for the whole batch — the fan-out fires on every trigger, so a
 * per-recipient lookup would multiply every notification write.
 *
 * @param {string[]} userIds
 * @returns {Promise<Map<string,string>>} report user id → manager user id
 */
async function resolveManagers(userIds) {
  const out = new Map();
  if (userIds.length === 0) { return out; }

  const { data, error } = await supabase
    .from('users')
    .select('id, manager_user_id')
    .in('id', userIds)
    .not('manager_user_id', 'is', null)
    .is('deleted_at', null);

  if (error) {
    // Non-fatal: fan-out is awareness, and losing it must never cost the
    // primary notification. Logged, not thrown.
    console.error(JSON.stringify({
      helper: 'notification-queue', step: 'resolveManagers', error: error.message
    }));
    return out;
  }

  for (const row of data || []) { out.set(row.id, row.manager_user_id); }
  return out;
}

/**
 * Write queue rows for one event and dispatch the immediate ones.
 *
 * Fire-and-forget in the same sense as the D-467 sender: the governance action
 * that triggered it has already succeeded and must never fail on notification
 * delivery. Errors are logged and swallowed.
 *
 * @param {object}   args
 * @param {string}   args.event_type
 * @param {Array<{user_id: string, email?: string|null, display_name?: string|null,
 *                delivery_class?: 'immediate'|'digest', headline?: string}>} args.recipients
 *          delivery_class defaults to 'digest' — the safer default, since an
 *          awareness message wrongly sent immediately is noise, whereas the
 *          blocking class is always stated explicitly by its call site.
 * @param {string}   args.headline        default headline; per-recipient overrides win
 * @param {string}   [args.detail]        reason / note / condition text
 * @param {string}   [args.initiative_id]
 * @param {string}   [args.gate_record_id]
 * @param {string}   [args.actor_user_id]
 * @param {string}   [args.initiativeName]  for the immediate email body
 * @param {string}   [args.gateNameDisplay] for the immediate email body
 * @param {string}   [args.subject]         for the immediate email
 * @param {boolean}  [args.fanOutToManagers=true]
 * @returns {Promise<{queued: number, immediate: number, fannedOut: number}>}
 */
async function enqueueNotifications({
  event_type,
  recipients,
  headline,
  detail            = null,
  initiative_id     = null,
  gate_record_id    = null,
  actor_user_id     = null,
  initiativeName    = '',
  gateNameDisplay   = '',
  subject           = '',
  fanOutToManagers  = true
}) {
  const result = { queued: 0, immediate: 0, fannedOut: 0 };

  // Deduplicate by user id — a trio member who is also Consulted is one person
  // and gets one row. Where the same person appears twice with different
  // classes, immediate wins: the stronger obligation governs.
  const byUser = new Map();
  for (const r of recipients || []) {
    if (!r || !r.user_id) { continue; }
    const existing = byUser.get(r.user_id);
    const cls = isLoudEvent(event_type)
      ? IMMEDIATE
      : (r.delivery_class === IMMEDIATE ? IMMEDIATE : DIGEST);
    if (!existing) {
      byUser.set(r.user_id, { ...r, delivery_class: cls });
    } else if (cls === IMMEDIATE) {
      byUser.set(r.user_id, { ...existing, ...r, delivery_class: IMMEDIATE });
    }
  }

  const primaries = [...byUser.values()];
  if (primaries.length === 0) { return result; }

  const rows = primaries.map(r => ({
    recipient_user_id: r.user_id,
    event_type,
    delivery_class:    r.delivery_class,
    initiative_id,
    gate_record_id,
    actor_user_id,
    headline:          r.headline || headline,
    detail
  }));

  // ── Manager fan-out (D-642) ────────────────────────────────────────────────
  // Parallel DIGEST rows, manager-framed. Never for the loud four. Never
  // immediate — a manager's copy is awareness by definition, so it batches
  // even when the report's own copy did not.
  if (fanOutToManagers && !isLoudEvent(event_type)) {
    const managers = await resolveManagers(primaries.map(r => r.user_id));
    for (const r of primaries) {
      const managerId = managers.get(r.user_id);
      if (!managerId || managerId === r.user_id) { continue; }
      // Do not fan out to someone already receiving this event directly.
      if (byUser.has(managerId)) { continue; }
      const who = r.display_name || 'A team member';
      rows.push({
        recipient_user_id: managerId,
        event_type,
        delivery_class:    DIGEST,
        initiative_id,
        gate_record_id,
        actor_user_id,
        headline:          `${who} — ${r.headline || headline}`,
        detail
      });
      result.fannedOut += 1;
    }
  }

  const { data: written, error: writeErr } = await supabase
    .from('notification_queue')
    .insert(rows)
    .select('notification_id, recipient_user_id, delivery_class');

  if (writeErr) {
    // Log and CARRY ON to the immediate dispatch below. Before Contract 45 the
    // email went out with no queue involved at all, so returning here would let
    // a queue-table problem silence a blocking notification — a regression
    // introduced by the plumbing rather than by any decision. The digest rows
    // are lost in this case, which is the lesser failure: they are awareness,
    // and the queue error is in the log.
    console.error(JSON.stringify({
      helper: 'notification-queue', step: 'insert', event_type, error: writeErr.message
    }));
  }
  result.queued = (written || []).length;

  // ── Dispatch the immediate class now (D-642) ───────────────────────────────
  // Same D-467 Edge Function, same template, same CTA — the queue changed where
  // the decision is made, not how the mail is sent.
  const immediateRecipients = primaries
    .filter(r => r.delivery_class === IMMEDIATE && r.email)
    .map(r => ({ email: r.email, display_name: r.display_name }));

  if (immediateRecipients.length > 0) {
    await sendGateNotificationEmail({
      recipients:       immediateRecipients,
      subject:          subject || headline,
      initiativeName,
      gateNameDisplay,
      contextParagraph: detail ? `${headline} ${detail}` : headline,
      delivery_cycle_id: initiative_id,
      email_type:        event_type
    });
    result.immediate = immediateRecipients.length;

    // Stamp only the rows that actually went out. Digest rows stay unsent
    // until the 06:00 job claims them.
    const sentIds = (written || [])
      .filter(w => w.delivery_class === IMMEDIATE)
      .map(w => w.notification_id);
    if (sentIds.length > 0) {
      const { error: stampErr } = await supabase
        .from('notification_queue')
        .update({ sent_at: new Date().toISOString() })
        .in('notification_id', sentIds);
      if (stampErr) {
        console.error(JSON.stringify({
          helper: 'notification-queue', step: 'stamp_sent', error: stampErr.message
        }));
      }
    }
  }

  return result;
}

module.exports = {
  enqueueNotifications,
  isLoudEvent,
  LOUD_EVENT_TYPES,
  IMMEDIATE,
  DIGEST
};
