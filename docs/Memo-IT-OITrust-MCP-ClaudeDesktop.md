# MEMO — IT: Connect OI Trust to Claude Desktop (Path A)

**To:** IT Manager
**From:** OI Trust build team (Phil Dodds, EVP Performance & Governance)
**Date:** 2026-06-22
**Re:** Enabling leaders to query OI Trust Initiative data from Claude Desktop
**Action:** Implement for a 2–5 person pilot, then expand

---

## What you're setting up

A read-only connection that lets a named leader ask Claude — in plain language — about OI Trust **Initiatives** (delivery governance data): what's in flight, what stage each is in, what gate is next, and each Initiative's history. Claude reaches OI Trust through a hosted MCP server. It can **only read**; it cannot change anything, and it never returns email addresses, internal IDs, or private notes.

This memo covers the **Claude Desktop** path, which is live and working today. (A future org-wide connector inside claude.ai is a separate effort — see the Design memo; it is **not** required for this.)

---

## Per-user prerequisites

- **Claude Desktop** installed (macOS or Windows), signed in.
- **Node.js** installed (provides `npx`, which launches the connector bridge). If a user doesn't have it: install the current LTS from nodejs.org.
- **An OI Trust API key** for that person — Phil issues it (see "Issuing keys" below). Keys start with `oitrust_`.

---

## Setup steps (do this once per user)

1. **Get the key.** Phil creates the user's key in OI Trust → **Admin → API Keys**, and uses the key's **Setup Instructions** button to produce a ready-to-paste config block containing the live server URL. The raw key is shown **once** — copy it then.
2. **Open the Claude Desktop config.** In Claude Desktop: **Settings → Developer → Edit Config**. This opens `claude_desktop_config.json`.
3. **Paste the block** under `mcpServers` (merge if the user already has other servers):

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

4. **Insert the key.** Replace `oitrust_XXXXX` with the user's actual key.
5. **Save and fully restart Claude Desktop.**
6. **Test.** Ask: *"What OI Trust initiatives are in the Build stage?"* Claude should call the connector and answer. Also try: *"Show me the history of [an initiative name]."*

---

## Security and key handling

- **One key per person.** Never share a key between users — each person's key is their identity and is logged on every call.
- **The key is a secret.** It lives only in that user's local `claude_desktop_config.json`. Don't email it around or paste it into chats.
- **Revocation is instant.** If a key leaks or a person leaves, tell Phil — he **inactivates** it in Admin → API Keys and the key stops working on the next call. A replacement can be issued immediately.
- **No data risk surface beyond reads.** The server exposes only list/get/history tools — no create, update, delete, or export-of-personal-data. Responses exclude emails, user IDs, and consultation notes by design.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| First query hangs ~30–50s | The server is on a free tier and "wakes" on first use after idle. Subsequent calls are fast. |
| "Unauthorized" / no data | Key is wrong, mistyped, or was inactivated. Confirm the `Bearer oitrust_…` value; ask Phil to verify/reissue. |
| `npx`/command not found | Node.js isn't installed for that user — install LTS from nodejs.org, restart Claude Desktop. |
| Connector not listed in Claude | Config JSON is malformed (often a missing comma when merging) or Claude wasn't fully restarted. |
| Health check | Open `https://oi-trust-initiative-public-mcp.onrender.com/health` in a browser — expect `{"status":"ok",...}`. |

---

## Issuing keys (Phil)

OI Trust → **Admin → API Keys → + Add Key**: enter a Display Name (your label for the key) and the User Label (the person it's for) → **Save** → copy the one-time key → hand it to the user with this memo. Manage/inactivate/reactivate from the same screen.

---

## Pilot then expand

Start with 2–5 leaders. Confirm each gets data and no personal fields appear. Spot-check the inactivate→401→reactivate cycle with one key. Then roll out to the broader leadership group.

**Questions / key requests:** Phil Dodds.

*Pathways OI Trust · CONFIDENTIAL · 2026-06-22*
