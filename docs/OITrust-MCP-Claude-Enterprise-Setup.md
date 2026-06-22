# OI Trust MCP — Claude Setup Guide for IT

**Audience:** IT manager / Claude Enterprise Owner
**System:** Pathways OI Trust — Public Initiative MCP (`initiative-public-mcp`)
**Date:** 2026-06-22
**Status:** Production (read-only)

---

## What this connects

A **read-only** MCP server that lets a leader ask Claude about OI Trust **Initiatives** (delivery-cycle governance data) in plain language. It exposes three tools and nothing else:

| Tool | What it returns |
|---|---|
| `list_initiatives` | All Initiatives with optional filters (Division, Workstream, lifecycle stage, tier, gate status, next gate) |
| `get_initiative` | One Initiative in full — milestones, gates, artifacts, consultation summary |
| `get_initiative_history` | The event log for one Initiative |

**There are no create, update, or delete tools.** The server cannot change any data. Responses deliberately exclude email addresses, user UUIDs, security fields, and individual consultation notes.

| Fact | Value |
|---|---|
| Remote MCP URL | `https://oi-trust-initiative-public-mcp.onrender.com/mcp` |
| Transport | Streamable HTTP (real MCP protocol) |
| Authentication | Static API key — `Authorization: Bearer oitrust_…` |
| Data sensitivity | Initiative governance metadata only. No PHI/PII. No email/UUID in responses. |
| Hosting | Render (free tier — first request after idle can take ~50s to wake) |
| Key lifecycle | Issued, inactivated, and reactivated by Phil from OI Trust → Admin → **API Keys** |

---

## ⚠️ Read first — which connection path applies

The server authenticates with a **static API key** in the `Authorization` header. That determines the setup path:

| Path | Supported today? | Why |
|---|---|---|
| **A. Claude Desktop, per user** (`mcp-remote`) | ✅ **Yes — use this now** | Claude Desktop's config supports a custom `--header`, so the `oitrust_` key can be supplied directly. This is what the OI Trust app's built-in "Setup Instructions" produce. |
| **B. Claude Enterprise org connector** (claude.ai admin) | ⚠️ **Not yet** | The "Add custom connector" UI accepts only a URL + optional **OAuth** (Client ID/Secret). There is **no field for a static API key.** Connected as-is, the server returns **401** on every call. |

**Bottom line:** to pilot today, use **Path A (Claude Desktop)**. To use the **org-level connector in claude.ai (Path B)**, the server must first be given **OAuth support** — a small follow-on build. Section 4 documents Path B so the runbook is ready once OAuth is added.

---

## Path A — Claude Desktop (works today, recommended for pilot)

Per user, on their own machine:

1. In OI Trust, Phil opens **Admin → API Keys → + Add Key**, enters the user's name, and Saves. The `oitrust_…` key is shown **once** — copy it.
2. The key's **Setup Instructions** button produces the exact config block. It looks like:

   ```json
   {
     "mcpServers": {
       "oi-trust": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-remote",
           "https://oi-trust-initiative-public-mcp.onrender.com/mcp",
           "--header",
           "Authorization: Bearer oitrust_XXXXX"
         ]
       }
     }
   }
   ```

3. The user opens **Claude Desktop → Settings → Developer → Edit Config** (`claude_desktop_config.json`), pastes the block under `mcpServers`, replaces `oitrust_XXXXX` with their key, saves, and **restarts Claude Desktop**.
4. Test: ask Claude *"What OI Trust initiatives are in the Build stage?"* — it should call `list_initiatives`.

**Key handling:** the `oitrust_` key is a secret. It lives only in the user's local config file. If a key is lost or a person leaves, Phil **inactivates** it in Admin → API Keys (the key stops working immediately) and issues a new one.

---

## Path B — Claude Enterprise org connector (requires OAuth on the server — not yet built)

> **Prerequisite:** `initiative-public-mcp` must support OAuth (Client ID/Secret + authorization + token endpoints). It currently uses static bearer keys only. Until that is added, the steps below will connect but fail authentication (401). Track this as a follow-on contract.

Once OAuth exists, an Enterprise **Owner** adds the connector org-wide:

1. **Organization settings → Connectors → Add.**
2. Hover **Custom → Web.**
3. Enter the remote MCP URL: `https://oi-trust-initiative-public-mcp.onrender.com/mcp`
4. Open **Advanced settings**, enter the **OAuth Client ID** and **OAuth Client Secret**.
5. Click **Add.**

Then **each user** enables it:

6. **Customize → Connectors →** find the **Custom**-labelled OI Trust connector → **Connect** → complete the OAuth sign-in.
7. In a conversation: **+** (lower-left) → **Connectors** → toggle on **OI Trust** for that chat.
8. Test: *"Use the OI Trust connector to list the initiatives I can access."*

> Note: Anthropic custom connectors are beta and cannot be edited in place — to change the URL or credentials, **remove and re-add**. Servers behind a VPN/firewall won't connect unless Anthropic's IP ranges are allow-listed; ours is public, so no allow-listing is needed.

---

## Tool-permission posture (already enforced server-side)

The recommended Enterprise defaults map cleanly onto this server because it is read-only by construction:

| Tool type | This server | Action needed |
|---|---|---|
| Read-only search/list/get | All three tools | Enable for pilot users |
| Create/update | **None exist** | — |
| Delete/destructive | **None exist** | — |
| Admin-level | **None exposed** (key admin is in the OI Trust app, not the MCP) | — |
| Broad export | `list_initiatives` returns a list, but no emails/UUIDs/notes | Low data-loss risk; review for your policy |

No tool can take an action or mutate data, so "Allow always" is low-risk here. There is nothing destructive to disable.

---

## Pilot plan

1. Phil issues keys to 2–5 named leaders (Admin → API Keys).
2. Those users set up **Path A (Desktop)** and run read-only prompts.
3. Confirm responses contain Initiative data and **no** emails/UUIDs.
4. Phil inactivates one test key → confirm that user's next call returns 401 → reactivate → confirm it works again.
5. Review the server's request logs in Render (each call logs the tool and timing).
6. Document approved prompts; roll out to more leaders.

---

## Governance checklist

| Area | Control (current state) |
|---|---|
| Ownership | Business owner: Phil (EVP). Technical owner: OI Trust build team. |
| Authentication | Static bearer API key per user (Path A). OAuth required for Path B (not built). No shared keys — one key per person. |
| Authorization | Phase 1: every key sees all Divisions. Per-Division scoping is reserved (scope_type column) for a later phase. |
| Logging | Render logs each MCP request (tool, duration). `api_keys.last_used_at` records last use per key. |
| Least privilege | Read-only server; three tools; no write/delete/admin/export-of-PII. |
| Human approval | N/A — no actions are possible. |
| Data protection | No PHI/PII; emails, UUIDs, and consultation notes excluded from all responses by design. |
| Prompt-injection | Server returns governance data only; treat any free-text fields (titles, outcome statements) as untrusted content as usual. |
| Change control | New/changed tools ship via OI Trust contracts; review before enabling. |
| Incident response | Phil inactivates a key from Admin → API Keys (immediate), or the whole connector can be removed in Render / claude.ai. |

---

## Quick reference

- **MCP URL:** `https://oi-trust-initiative-public-mcp.onrender.com/mcp`
- **Health check (no auth):** `https://oi-trust-initiative-public-mcp.onrender.com/health` → `{"status":"ok",...}`
- **Issue / revoke keys:** OI Trust → Admin → API Keys (Phil only)
- **Works today:** Claude Desktop (Path A). **Needs OAuth:** claude.ai org connector (Path B).

*Pathways OI Trust · CONFIDENTIAL · 2026-06-22*
