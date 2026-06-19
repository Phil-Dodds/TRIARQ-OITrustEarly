// supabase/functions/send-notification-email/index.ts
// Pathways OI Trust — Contract 29 WS4 (D-467).
//
// Thin authenticated relay to Resend for transactional gate notification email.
// Called server-to-server from delivery-cycle-mcp via
//   supabase.functions.invoke('send-notification-email', { body: payload }).
//
// The MCP side builds the full TRIARQ-branded html_body (CC-29-6) — this
// function only relays it to the email provider (Resend, CC-29-7). Fire-and-
// forget on the caller's side: a non-2xx here never fails the gate operation.
//
// Environment (set as Supabase secrets — NOT in source):
//   RESEND_API_KEY          — required; Resend API key
//   NOTIFICATION_FROM_EMAIL — optional; verified sender. Defaults below.
//   APP_BASE_URL            — informational; CTA links are pre-built MCP-side.
//
// Deploy:
//   supabase functions deploy send-notification-email
//   supabase secrets set RESEND_API_KEY=... NOTIFICATION_FROM_EMAIL=...

interface EmailPayload {
  to: string[];
  subject: string;
  html_body: string;
  initiative_id?: string | null;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "OI Trust <notifications@pathways-oitrust.triarqhealth.com>";

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

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    // Misconfigured — report but do not crash the caller's flow.
    return json({ success: false, error: "RESEND_API_KEY not configured." }, 500);
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

  const from = Deno.env.get("NOTIFICATION_FROM_EMAIL") || DEFAULT_FROM;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload.subject,
        html: payload.html_body,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ success: false, error: `Resend returned ${res.status}: ${detail}` }, 502);
    }

    const data = await res.json();
    return json({ success: true, id: data?.id ?? null, recipients: to.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ success: false, error: `Email send failed: ${msg}` }, 502);
  }
});
