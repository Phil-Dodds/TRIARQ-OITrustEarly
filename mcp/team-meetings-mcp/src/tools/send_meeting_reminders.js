// send_meeting_reminders.js
// Pathways OI Trust — team-meetings-mcp (Contract 38 follow-on 19)
//
// Presenter prep reminders. Invoked every 30 minutes by pg_cron via pg_net
// (migration 078) through the /internal/send_meeting_reminders endpoint —
// key-authorized, NOT JWT (machine-to-machine; CC-decision, deliberate Arch-5
// carve-out mirroring the internal-key pattern reserved for MCP server auth).
//
// Per run, for every live track with meeting_time + reminder_lead_minutes set:
//   1. Window check in Eastern Time: now ∈ [meeting_time − lead, meeting_time)
//      for today's or tomorrow's occurrence (long leads cross midnight).
//   2. Presenters = distinct presenter_user_id on the track's template
//      sections (the meeting-series presenter configuration).
//   3. Skip a presenter when they have a presence row on that date's meeting
//      instance (they already opened/prepped it — Phil: "entered the meeting
//      once"). No meeting instance yet → nobody prepped → everyone reminded.
//   4. One-and-done via team_meeting_reminder_log UNIQUE(track, date, user):
//      the row is written whether or not delivery succeeded, so a flaky mail
//      relay never turns into repeated nag emails.
//
// Email: meeting name (track name), normal time (ET), URL (meeting instance
// when it exists, otherwise the track's latest-meeting redirect), and the
// track's leader-editable reminder_note.

'use strict';

const { supabase } = require('../db');

const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  'https://phil-dodds.github.io/TRIARQ-OITrustEarly';

const DEEP_NAVY = '#12274A';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 'HH:MM[:SS]' → minutes of day, or null. */
function timeToMinutes(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t ?? ''));
  if (!m) { return null; }
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Eastern Time wall-clock parts for a Date. */
function etParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const p = {};
  for (const part of fmt.formatToParts(date)) { p[part.type] = part.value; }
  return {
    dateStr: `${p.year}-${p.month}-${p.day}`,
    minutes: (Number(p.hour) % 24) * 60 + Number(p.minute)
  };
}

/** ET date string N days after the given ET date string. */
function addDaysEt(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00Z`);   // noon UTC avoids DST edges
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatTimeEt(t) {
  const mins = timeToMinutes(t);
  if (mins === null) { return String(t); }
  const h24 = Math.floor(mins / 60), m = mins % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'} ET`;
}

/**
 * Which occurrence (ET date string) is inside its reminder window right now?
 * Checks today and tomorrow — a long lead (e.g. 24h) opens tomorrow's window
 * before today ends. Returns null when no occurrence is in-window.
 */
function occurrenceInWindow(nowEt, meetingMinutes, leadMinutes) {
  // Today's occurrence: window [meeting − lead, meeting) measured same-day.
  if (nowEt.minutes >= meetingMinutes - leadMinutes && nowEt.minutes < meetingMinutes) {
    return nowEt.dateStr;
  }
  // Tomorrow's occurrence: minutes-until = (1440 − now) + meeting.
  const untilTomorrow = (1440 - nowEt.minutes) + meetingMinutes;
  if (untilTomorrow <= leadMinutes) {
    return addDaysEt(nowEt.dateStr, 1);
  }
  return null;
}

function buildReminderHtml({ trackName, timeLabel, note, url }) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:560px;">
        <tr><td style="background:${DEEP_NAVY};padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;">Pathways OI Trust</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 4px 0;font-size:13px;color:#5A5A5A;text-transform:uppercase;letter-spacing:.04em;">
            Meeting reminder
          </p>
          <h2 style="margin:0 0 8px 0;font-size:22px;color:${DEEP_NAVY};font-weight:700;">
            ${esc(trackName)}
          </h2>
          <p style="margin:0 0 16px 0;font-size:15px;color:#1a1a1a;">${esc(timeLabel)}</p>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#1a1a1a;">${esc(note)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td
            style="background:${DEEP_NAVY};border-radius:5px;">
            <a href="${esc(url)}" style="display:inline-block;padding:10px 22px;color:#ffffff;
               font-size:14px;font-weight:600;text-decoration:none;">Open the meeting</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#5A5A5A;">
            TRIARQ Health &middot; OI Trust &middot; This is an automated notification.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Run one reminder sweep. Never throws; returns a summary for the cron log.
 * @param {Date} [now] — injectable for tests.
 */
async function send_meeting_reminders(now = new Date()) {
  const nowEt = etParts(now);
  const summary = { tracks_in_window: 0, reminders_sent: 0, skipped_presence: 0, skipped_already_sent: 0, errors: [] };

  const { data: tracks, error: trackErr } = await supabase
    .from('team_meeting_tracks')
    .select('track_id, track_name, meeting_time, reminder_lead_minutes, reminder_note')
    .not('meeting_time', 'is', null)
    .not('reminder_lead_minutes', 'is', null)
    .is('deleted_at', null)
    .is('purged_at', null);
  if (trackErr) { summary.errors.push(`tracks: ${trackErr.message}`); return summary; }

  for (const track of tracks || []) {
    const meetingMinutes = timeToMinutes(track.meeting_time);
    if (meetingMinutes === null) { continue; }
    const targetDate = occurrenceInWindow(nowEt, meetingMinutes, track.reminder_lead_minutes);
    if (!targetDate) { continue; }
    summary.tracks_in_window += 1;

    // Presenter configuration for the meeting series.
    const { data: sections } = await supabase
      .from('team_meeting_track_sections')
      .select('presenter_user_id')
      .eq('track_id', track.track_id)
      .not('presenter_user_id', 'is', null)
      .is('deleted_at', null);
    const presenterIds = [...new Set((sections || []).map(s => s.presenter_user_id))];
    if (presenterIds.length === 0) { continue; }

    // That date's meeting instance, if it exists.
    const { data: meeting } = await supabase
      .from('team_meetings')
      .select('id')
      .eq('track_id', track.track_id)
      .eq('meeting_date', targetDate)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    // Skip 1 — already sent (one-and-done).
    const { data: sentRows } = await supabase
      .from('team_meeting_reminder_log')
      .select('user_id')
      .eq('track_id', track.track_id)
      .eq('meeting_date', targetDate);
    const alreadySent = new Set((sentRows || []).map(r => r.user_id));

    // Skip 2 — presenter already opened this meeting instance (presence row).
    let entered = new Set();
    if (meeting?.id) {
      const { data: presenceRows } = await supabase
        .from('team_meeting_presence')
        .select('user_id')
        .eq('meeting_id', meeting.id)
        .in('user_id', presenterIds);
      entered = new Set((presenceRows || []).map(r => r.user_id));
    }

    const dueIds = presenterIds.filter(id => {
      if (alreadySent.has(id)) { summary.skipped_already_sent += 1; return false; }
      if (entered.has(id))     { summary.skipped_presence += 1;     return false; }
      return true;
    });
    if (dueIds.length === 0) { continue; }

    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', dueIds)
      .is('deleted_at', null);

    const url = meeting?.id
      ? `${APP_BASE_URL}/team-meetings/${meeting.id}`
      : `${APP_BASE_URL}/team-meetings/track/${track.track_id}/latest`;
    const timeLabel = `${targetDate} · ${formatTimeEt(track.meeting_time)}`;
    const note      = track.reminder_note || 'Please review and prep.';

    for (const u of users || []) {
      let deliveryError = null;
      let relayResponse = null;
      if (u.email) {
        try {
          const { data, error } = await supabase.functions.invoke('send-notification-email', {
            body: {
              to:        [u.email.trim().toLowerCase()],
              subject:   `Reminder: ${track.track_name} — ${formatTimeEt(track.meeting_time)}`,
              html_body: buildReminderHtml({ trackName: track.track_name, timeLabel, note, url }),
              initiative_id: null
            }
          });
          if (error) { deliveryError = error.message || String(error); }
          relayResponse = data ?? null;
        } catch (e) {
          deliveryError = e?.message ?? String(e);
        }
      } else {
        deliveryError = 'no email address on user record';
      }

      // CC-38 f19 instrumentation (Phil report: reminders not received while
      // relay reported success): one log line per send with the recipient
      // address and the Edge Function's exact response — visible in Render.
      console.log(JSON.stringify({
        tool_name: 'send_meeting_reminders', step: 'send',
        track_id: track.track_id, meeting_date: targetDate,
        recipient: u.email ?? '(none)', delivery_error: deliveryError,
        relay_response: relayResponse
      }));

      // Log regardless of delivery outcome — one-and-done, never re-nag.
      const { error: logErr } = await supabase
        .from('team_meeting_reminder_log')
        .insert({
          track_id:       track.track_id,
          meeting_id:     meeting?.id ?? null,
          meeting_date:   targetDate,
          user_id:        u.id,
          delivery_error: deliveryError
        });
      if (logErr) { summary.errors.push(`log ${track.track_id}/${u.id}: ${logErr.message}`); continue; }
      if (!deliveryError) { summary.reminders_sent += 1; }
      else { summary.errors.push(`send ${u.id}: ${deliveryError}`); }
    }
  }

  return summary;
}

module.exports = { send_meeting_reminders, occurrenceInWindow, timeToMinutes };
