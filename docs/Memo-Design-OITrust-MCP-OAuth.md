# MEMO — Design: Add OAuth to initiative-public-mcp (Path B)

**To:** Design Session
**From:** Code (Contract 31 close)
**Date:** 2026-06-22
**Re:** Enabling the Claude **Enterprise org connector** to authenticate against `initiative-public-mcp`
**Action requested:** Spec a follow-on contract; assign D-numbers

---

## Why this exists

Contract 31 (D-473/474/475) shipped `initiative-public-mcp` with **static API-key auth** (`Authorization: Bearer oitrust_…`). That works for the **Claude Desktop** path because Desktop's config supports a custom header.

It does **not** work for the **Claude Enterprise org connector** added in claude.ai (**Org settings → Connectors → Add → Custom → Web**). That admin UI accepts only a **remote MCP URL + optional OAuth** (Client ID/Secret). There is **no field for a static API key**. Connected as-is, the server returns **401** on every call.

**Conclusion:** to let an Enterprise Owner add OI Trust once at the org level (and have each user connect via their own identity), the server must support **OAuth** per the MCP authorization spec. This was never in Contract 31's scope (the spec specified only the Desktop config block), so it is genuinely new work — not a bug.

---

## First Principles framing (for the spec session)

- **Context:** execs want OI Trust as an org-managed connector in claude.ai, not a per-machine Desktop config.
- **Question:** what is the smallest change that lets claude.ai's OAuth-only connector authenticate a user and resolve their access?
- **Reduce:** the tool logic, field exclusions, and read-only posture are done and unchanged. Only the **auth layer** changes.
- **Simplify:** decide one identity source and one token model; don't rebuild the tools.
- **Automate:** dynamic client registration so the Owner doesn't hand-manage client secrets per connector.

---

## What OAuth-for-MCP actually requires

Claude's remote connector follows the MCP authorization spec (OAuth 2.1). The server must, at minimum, expose:

1. **Protected-resource metadata** (RFC 9728) at a well-known path, pointing to the authorization server.
2. **Authorization-server metadata** (RFC 8414) — `/.well-known/oauth-authorization-server`.
3. **Dynamic client registration** (RFC 7591) so Claude can self-register a client (avoids manually pasting Client ID/Secret).
4. **Authorization endpoint** + **token endpoint** with **PKCE**.
5. **Bearer-token validation** on `/mcp` (replacing, or sitting alongside, the current `oitrust_` check).

The server can either **be** the authorization server, or **delegate** to an external IdP and act only as the resource server.

---

## Decisions Design needs to make (assign D-numbers)

1. **Identity source.** Options: (a) reuse **Supabase Auth** (users already exist there with `is_*` role flags) as the IdP; (b) stand up a minimal OAuth authorization server in the MCP service; (c) a third-party IdP. Recommendation to debate: (a) — OAuth identity then maps to a `users` row, reusing existing role/Division data.
2. **Identity → scope mapping.** Today every API key is scope `all` (all Divisions). With OAuth carrying a real user identity, should the connector enforce **per-user Division scoping** (the reserved `scope_type='divisions'` path)? This is the natural moment to turn Phase-2 scoping on.
3. **Dual-auth or replace.** Keep the static `oitrust_` bearer path for Claude Desktop **and** add OAuth for the org connector (recommended — Desktop users shouldn't break), or migrate everyone to OAuth.
4. **Token lifetime / refresh** policy and revocation story (how does Admin → API Keys, or a new admin surface, revoke an OAuth grant?).
5. **Client registration** trust: open dynamic registration vs. pre-registered Claude client.

---

## Constraints to preserve (do not regress)

- **Read-only** server; the three tools and their inputs are unchanged.
- **Field exclusions** stay exactly as built (no emails, UUIDs, security fields, consultation notes).
- **Desktop bearer path keeps working** if dual-auth is chosen.
- **No PHI/PII** introduced.
- Hosting unchanged (Render); note free-tier cold-start when testing OAuth round-trips.

---

## Draft acceptance criteria (for the eventual contract)

1. An Enterprise Owner can add OI Trust via **Org settings → Connectors → Add → Custom → Web** using the MCP URL and complete OAuth without manually managing a static key.
2. A user **Connects** the connector, completes the OAuth sign-in, and the connector resolves their OI Trust identity.
3. Tool calls succeed for an authenticated user and return the same shaped, exclusion-safe data as today.
4. An unauthenticated or revoked session is rejected (401/invalid token).
5. (If chosen) a user sees only Initiatives within their Division scope.
6. Desktop bearer-key users are unaffected (if dual-auth).

---

## Effort / risk note

- Auth-layer addition is **moderate** — OAuth metadata + endpoints + PKCE + token validation, plus the identity→scope mapping. The data/tool layer is untouched, which contains the risk.
- Main risk is **identity mapping** (decision #2) and **revocation UX** (#4) — both are design choices, not coding unknowns.
- Suggest spiking the OAuth handshake against a claude.ai test connector early, because cold-start + the multi-redirect flow are the most failure-prone parts.

---

## Open questions back to Design

- Is per-Division scoping in scope for this contract, or a later one?
- Is Supabase Auth acceptable as the OAuth IdP, or does Enterprise governance require a specific IdP?
- Should Desktop bearer keys remain indefinitely, or sunset after OAuth lands?

*Pathways OI Trust · CONFIDENTIAL · 2026-06-22 · Source: Contract 31 close*
