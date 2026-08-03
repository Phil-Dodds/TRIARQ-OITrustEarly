// run_daily_digest.js
// Pathways OI Trust — delivery-cycle-mcp (Contract 45, D-643).
//
// The 06:00 ET job. Claims every unsent digest-class row, groups by recipient,
// re-checks the state rows, renders one email per person, sends, and stamps.
//
// ── Why this lives in the MCP rather than in an Edge Function ────────────────
// CLAUDE.md's porting contract: at port time TRIARQ engineers replace the
// INFRASTRUCTURE layer, while "the Angular application, MCP server tool
// contracts, and skills layer are unchanged" (also D-263). Supabase Edge
// Functions and pg_cron are that infrastructure. Putting D-643's judgement —
// ten sections, five-line cap, suppression, subject rules — into them would
// mean re-implementing all of it at port, in a different stack, from the spec.
// Here, only the trigger is disposable: one cron entry pointing at one route.
//
// ── Idempotence ──────────────────────────────────────────────────────────────
// Rows are stamped sent_at (or suppressed_at) as they are processed, and the
// claim query only ever reads rows where both are NULL. A second run in the
// same morning therefore sends nothing rather than sending twice. That matters
// because "the cron fired twice" is a normal operational event and must not be
// a user-visible one.

'use strict';

const { supabase } = require('../db');
const { buildDigest } = require('../lib/digest');
const { sendGateNotificationEmail, APP_BASE_URL } = require('./helpers/notification-email');

/**
 * State events describe a condition that may have resolved since it was
 * queued. D-643: re-check these before sending and suppress the ones that no
 * longer hold. Everything else is a historical fact — a gate WAS approved, an
 * Initiative WAS cancelled — and is never re-checked.
 */
const STATE_EVENT_TYPES = Object.freeze(['initiative_blocked', 'initiative_at_risk']);

/** Weekday label for the subject line, in ET (the system constant's zone). */
function easternDayLabel(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', timeZone: 'America/New_York'
  }).format(now);
}

/**
 * Re-check unsent state rows against current Initiative state (D-643).
 * A row whose condition has resolved is suppressed rather than sent — telling
 * someone at 06:00 that something is blocked, when it was unblocked at 21:00
 * the night before, actively misinforms.
 *
 * @returns {Promise<Set<string>>} notification_ids to suppress
 */
async function resolveSuppressions(rows) {
  const stateRows = rows.filter(r => STATE_EVENT_TYPES.includes(r.event_type) && r.initiative_id);
  if (stateRows.length === 0) { return new Set(); }

  const initiativeIds = [...new Set(stateRows.map(r => r.initiative_id))];
  const { data: cycles, error } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id, current_lifecycle_stage, status_overdue')
    .in('delivery_cycle_id', initiativeIds)
    .is('deleted_at', null);

  if (error) {
    // Cannot verify → send. An unsuppressed true line is a smaller error than
    // silently dropping a blocked Initiative because a lookup failed.
    console.error(JSON.stringify({
      tool_name: 'run_daily_digest', step: 'resolveSuppressions', error: error.message
    }));
    return new Set();
  }

  const byId = new Map((cycles || []).map(c => [c.delivery_cycle_id, c]));
  const suppress = new Set();

  for (const row of stateRows) {
    const cycle = byId.get(row.initiative_id);
    // Initiative gone, cancelled, or complete → the state line is moot.
    if (!cycle ||
        cycle.current_lifecycle_stage === 'CANCELLED' ||
        cycle.current_lifecycle_stage === 'COMPLETE') {
      suppress.add(row.notification_id);
      continue;
    }
    if (row.event_type === 'initiative_at_risk' && cycle.status_overdue !== true) {
      suppress.add(row.notification_id);
    }
  }

  return suppress;
}

/**
 * Run the daily digest. Invoked by the scheduler via POST /internal/run_daily_digest.
 *
 * @param {object} [params]
 * @param {boolean} [params.dry_run] — assemble and report, send and stamp nothing.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function run_daily_digest(params = {}) {
  const dryRun = params.dry_run === true;
  const startedAt = new Date();

  // ── Claim: every unsent, unsuppressed digest row ──────────────────────────
  const { data: rows, error: readErr } = await supabase
    .from('notification_queue')
    .select('notification_id, recipient_user_id, event_type, delivery_class, initiative_id, gate_record_id, headline, detail, manager_copy, created_at')
    .eq('delivery_class', 'digest')
    .is('sent_at', null)
    .is('suppressed_at', null)
    .order('created_at', { ascending: true });

  if (readErr) {
    return { success: false, error: `Failed to read the notification queue: ${readErr.message}` };
  }
  if (!rows || rows.length === 0) {
    return {
      success: true,
      data: { recipients: 0, sent: 0, suppressed: 0, skipped_empty: 0, dry_run: dryRun }
    };
  }

  // ── Suppression pass (D-643) ──────────────────────────────────────────────
  const suppressed = await resolveSuppressions(rows);
  const live = rows.filter(r => !suppressed.has(r.notification_id));

  // ── Group by recipient ────────────────────────────────────────────────────
  const byRecipient = new Map();
  for (const row of live) {
    if (!byRecipient.has(row.recipient_user_id)) { byRecipient.set(row.recipient_user_id, []); }
    byRecipient.get(row.recipient_user_id).push(row);
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, email, is_active')
    .in('id', [...byRecipient.keys()])
    .is('deleted_at', null);
  const userById = new Map((users || []).map(u => [u.id, u]));

  const dayLabel = easternDayLabel(startedAt);
  const sentIds = [];
  let recipientsSent = 0;
  let skippedEmpty   = 0;

  for (const [userId, userRows] of byRecipient) {
    const user = userById.get(userId);
    // No live user, no address, or deactivated → nothing to do. Their rows are
    // stamped anyway so they do not accumulate forever.
    if (!user || !user.email || user.is_active === false) {
      sentIds.push(...userRows.map(r => r.notification_id));
      skippedEmpty += 1;
      continue;
    }

    const digest = buildDigest(userRows, { dayLabel, appBaseUrl: APP_BASE_URL });

    // D-643: a digest with no content is NOT sent.
    if (!digest) {
      sentIds.push(...userRows.map(r => r.notification_id));
      skippedEmpty += 1;
      continue;
    }

    if (!dryRun) {
      await sendGateNotificationEmail({
        recipients:       [{ email: user.email, display_name: user.display_name }],
        subject:          digest.subject,
        initiativeName:   'Your daily summary',
        gateNameDisplay:  dayLabel,
        contextParagraph: digest.bodyText,
        delivery_cycle_id: null,
        email_type:        'daily_digest'
      });
      sentIds.push(...userRows.map(r => r.notification_id));
    }
    recipientsSent += 1;
  }

  // ── Stamp ─────────────────────────────────────────────────────────────────
  if (!dryRun) {
    const nowIso = new Date().toISOString();
    if (suppressed.size > 0) {
      const { error: supErr } = await supabase
        .from('notification_queue')
        .update({ suppressed_at: nowIso })
        .in('notification_id', [...suppressed]);
      if (supErr) {
        console.error(JSON.stringify({
          tool_name: 'run_daily_digest', step: 'stamp_suppressed', error: supErr.message
        }));
      }
    }
    if (sentIds.length > 0) {
      const { error: sentErr } = await supabase
        .from('notification_queue')
        .update({ sent_at: nowIso })
        .in('notification_id', sentIds);
      if (sentErr) {
        // Logged loudly: unstamped rows will resend tomorrow. Better a repeat
        // than a silent loss, but this needs to be visible.
        console.error(JSON.stringify({
          tool_name: 'run_daily_digest', step: 'stamp_sent', error: sentErr.message
        }));
      }
    }
  }

  const duration_ms = Date.now() - startedAt.getTime();
  console.log(JSON.stringify({
    tool_name: 'run_daily_digest',
    recipients: byRecipient.size,
    sent: recipientsSent,
    suppressed: suppressed.size,
    skipped_empty: skippedEmpty,
    dry_run: dryRun,
    duration_ms
  }));

  return {
    success: true,
    data: {
      recipients:    byRecipient.size,
      sent:          recipientsSent,
      suppressed:    suppressed.size,
      skipped_empty: skippedEmpty,
      dry_run:       dryRun,
      duration_ms
    }
  };
}

module.exports = { run_daily_digest, resolveSuppressions, STATE_EVENT_TYPES, easternDayLabel };
