// notification-email.js
// Pathways OI Trust — delivery-cycle-mcp shared helper (Contract 29 WS4).
//
// Transactional email for gate events (D-466, D-467). Fire-and-forget: the
// calling gate tool is NEVER blocked or failed by email delivery. Every send
// attempt is logged to cycle_event_log (event_type 'email_sent') regardless of
// delivery outcome, per spec WS4 Infrastructure.
//
// CC-decision (CC-29-6): the TRIARQ-branded html_body is built HERE (MCP side),
//   matching the literal EmailPayload interface { to, subject, html_body,
//   initiative_id }. The send-notification-email Edge Function is a thin
//   authenticated relay to Resend (reads RESEND_API_KEY). APP_BASE_URL is read
//   MCP-side (Render env) to build the CTA link; initiative_id is forwarded for
//   the Edge Function's own logging. Single template location, testable in MCP.
//
// CC-decision (CC-29-7, AMENDED 2026-06-19): email provider is Microsoft 365 SMTP
//   (was Resend). The send-notification-email Edge Function relays via the existing
//   O365 SMTP account (OITrust@triarqhealth.com). This MCP side is provider-agnostic
//   — it only invokes the function; the SMTP credentials live in the function's secrets.

'use strict';

const { supabase } = require('../../db');

// Base URL for CTA links. Render env. Falls back to the GitHub Pages app root.
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  'https://phil-dodds.github.io/TRIARQ-OITrustEarly';

// Brand tokens (mirrors triarq.tokens.v1.css — inlined because email clients
// strip <style>/external CSS; all styling must be inline).
const DEEP_NAVY = '#12274A';
const ORAVIVE   = '#E96127';

/**
 * Escape a string for safe interpolation into HTML email content.
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the TRIARQ-branded HTML email body.
 *
 * @param {object} args
 * @param {string} args.initiativeName
 * @param {string} args.gateNameDisplay
 * @param {string} args.contextParagraph - plain text; escaped here
 * @param {string|null} args.initiativeId - drives CTA link; CTA omitted if null
 * @returns {string} full HTML document
 */
function buildHtmlBody({ initiativeName, gateNameDisplay, contextParagraph, initiativeId }) {
  const ctaHref = initiativeId
    ? `${APP_BASE_URL}/initiatives/${encodeURIComponent(initiativeId)}`
    : null;

  const ctaButton = ctaHref
    ? `<tr><td style="padding:24px 0 8px 0;">
         <a href="${esc(ctaHref)}"
            style="background:${ORAVIVE};color:#ffffff;text-decoration:none;
                   display:inline-block;padding:12px 28px;border-radius:999px;
                   font-family:Roboto,Arial,sans-serif;font-weight:600;font-size:15px;">
           View Initiative
         </a>
       </td></tr>`
    : '';

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Roboto,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:${DEEP_NAVY};padding:20px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;">Pathways OI Trust</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 4px 0;font-size:13px;color:#5A5A5A;text-transform:uppercase;letter-spacing:.04em;">
              ${esc(gateNameDisplay)}
            </p>
            <h2 style="margin:0 0 16px 0;font-size:22px;color:${DEEP_NAVY};font-weight:700;">
              ${esc(initiativeName)}
            </h2>
            <p style="margin:0;font-size:15px;line-height:1.5;color:#1a1a1a;">
              ${esc(contextParagraph)}
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">${ctaButton}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#5A5A5A;">
              TRIARQ Health &middot; OI Trust &middot; This is an automated notification.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send a gate notification email and log the attempt. Never throws — gate
 * operations must not fail on email delivery (spec WS4 Structural Health note).
 *
 * @param {object} args
 * @param {Array<{email: string, display_name?: string}>} args.recipients
 * @param {string} args.subject
 * @param {string} args.initiativeName
 * @param {string} args.gateNameDisplay
 * @param {string} args.contextParagraph
 * @param {string} args.delivery_cycle_id - for event log + CTA link
 * @param {string} args.email_type        - 'gate_submission' | 'post_approval_decline'
 * @returns {Promise<{attempted: boolean, recipients_count: number, error: string|null}>}
 */
async function sendGateNotificationEmail({
  recipients,
  subject,
  initiativeName,
  gateNameDisplay,
  contextParagraph,
  delivery_cycle_id,
  email_type
}) {
  // Deduplicate + drop recipients with no email address.
  const seen = new Set();
  const to = [];
  for (const r of recipients || []) {
    const email = r && typeof r.email === 'string' ? r.email.trim().toLowerCase() : '';
    if (email && !seen.has(email)) { seen.add(email); to.push(email); }
  }

  if (to.length === 0) {
    return { attempted: false, recipients_count: 0, error: 'No valid recipients.' };
  }

  const html_body = buildHtmlBody({
    initiativeName,
    gateNameDisplay,
    contextParagraph,
    initiativeId: delivery_cycle_id || null
  });

  let sendError = null;
  try {
    const { error } = await supabase.functions.invoke('send-notification-email', {
      body: { to, subject, html_body, initiative_id: delivery_cycle_id || null }
    });
    if (error) { sendError = error.message || String(error); }
  } catch (e) {
    // Resend/Edge Function unavailable — fail silently. Gate op is unaffected.
    sendError = e && e.message ? e.message : String(e);
  }

  // Log the send ATTEMPT regardless of delivery outcome (spec WS4).
  try {
    await supabase.from('cycle_event_log').insert({
      delivery_cycle_id,
      event_type:        'email_sent',
      event_description: `Notification email (${email_type}) sent to ${to.length} recipient(s).`,
      actor_user_id:     null,
      event_metadata:    {
        recipients_count: to.length,
        email_type,
        delivery_error:   sendError
      }
    });
  } catch (logErr) {
    console.error(JSON.stringify({
      helper: 'sendGateNotificationEmail',
      step:   'log_email_sent',
      error:  logErr && logErr.message ? logErr.message : String(logErr)
    }));
  }

  return { attempted: true, recipients_count: to.length, error: sendError };
}

module.exports = { sendGateNotificationEmail, buildHtmlBody, APP_BASE_URL };
