// supabase/functions/send-notification-email/index.ts
// Pathways OI Trust — Contract 29 WS4 (D-467).
//
// Thin relay that sends transactional gate-notification email through the
// existing Microsoft 365 SMTP account (OITrust@triarqhealth.com) — the same
// account/relay that already sends user invites. Called server-to-server from
// delivery-cycle-mcp via supabase.functions.invoke('send-notification-email').
//
// The MCP side builds the full TRIARQ-branded html_body (CC-29-6); this function
// only relays it. Fire-and-forget on the caller's side: a non-2xx here never
// fails the gate operation.
//
// CC-29-7 (AMENDED 2026-06-19): provider = Microsoft 365 SMTP (was Resend).
// CC-29-7b (2026-06-20): SMTP client = nodemailer (npm:). denomailer failed the
//   O365 STARTTLS handshake with "invalid cmd"; nodemailer handles O365's
//   EHLO→STARTTLS→AUTH flow correctly. Edge runtime is Deno 2.1.4 → npm: imports
//   are supported.
//
// Secrets (Supabase Dashboard → Edge Functions → Secrets):
//   SMTP_HOST                — smtp.office365.com
//   SMTP_PORT                — 587 (STARTTLS)
//   SMTP_USERNAME            — OITrust@triarqhealth.com
//   SMTP_PASSWORD            — mailbox app password (same one invites use)
//   NOTIFICATION_FROM_EMAIL  — "OI Trust <OITrust@triarqhealth.com>"
//                              (must be the authenticated mailbox for O365)

import nodemailer from "npm:nodemailer@6.9.16";

interface EmailPayload {
  to: string[];
  subject: string;
  html_body: string;
  initiative_id?: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? "587");
  const username = Deno.env.get("SMTP_USERNAME");
  const password = Deno.env.get("SMTP_PASSWORD");
  const from = Deno.env.get("NOTIFICATION_FROM_EMAIL") || username || "";

  if (!host || !username || !password) {
    return json(
      { success: false, error: "SMTP not configured (SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD)." },
      500,
    );
  }

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const to = Array.isArray(payload?.to)
    ? payload.to.filter((e) => typeof e === "string" && e.includes("@"))
    : [];
  if (to.length === 0) {
    return json({ success: false, error: "No valid recipients." }, 400);
  }
  if (!payload.subject || !payload.html_body) {
    return json({ success: false, error: "subject and html_body are required." }, 400);
  }

  // O365: port 587 + secure:false → STARTTLS; requireTLS forces the upgrade.
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,     // implicit TLS only on 465; 587 uses STARTTLS
    requireTLS: port !== 465,
    auth: { user: username, pass: password },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
  });

  try {
    // Send individually so one bad address does not drop the batch and so
    // recipients are not disclosed to each other (no shared To/CC header).
    const results = await Promise.allSettled(
      to.map((addr) =>
        transporter.sendMail({
          from,
          to: addr,
          subject: payload.subject,
          html: payload.html_body,
        })
      ),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;
    if (sent === 0) {
      const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      const msg = firstErr ? String(firstErr.reason) : "unknown error";
      return json({ success: false, error: `All sends failed: ${msg}` }, 502);
    }
    return json({ success: true, sent, failed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ success: false, error: `SMTP send failed: ${msg}` }, 502);
  }
});
