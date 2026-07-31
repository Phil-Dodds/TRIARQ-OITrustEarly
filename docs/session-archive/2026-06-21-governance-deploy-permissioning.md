# Governance Item — Deployment Permissioning & Publish Friction for Code Sessions

**Status:** For Design discussion (no D-number — Design assigns)
**Raised by:** Claude Code session, Contract 29 (2026-06-20)
**Date:** 2026-06-21
**Theme:** Deployment process / Code-session tooling

---

## Issue (one line)

The Angular GitHub Pages publish (a `git push --force`) is gated by the Code permission layer and is repeatedly denied until Phil explicitly approves it per run — and more broadly, the whole deploy path is manual and multi-step, which is slow and error-prone. Design should decide the intended deployment model for Code sessions.

---

## Context — how deployment works today

Per CLAUDE.md v2.7, a Build C deploy is entirely manual and spread across systems:

1. **Migrations** — Code writes the SQL; Phil runs each migration by hand in Supabase (Rule 22).
2. **Edge Functions / secrets** — Phil deploys and sets secrets in the Supabase dashboard.
3. **MCP (Render)** — Code pushes to `master`; Phil manually clicks redeploy in Render (Render does *not* auto-deploy — see memory note).
4. **Angular (GitHub Pages)** — no auto-deploy. The documented procedure is: `npm run build` → copy `dist/.../browser/` to a staging dir *outside* the worktree → add `404.html` + `.nojekyll` → `git init` a throwaway repo → `git push --force origin gh-pages`.

Step 4 is the friction point.

---

## What surfaced this session

During the Contract 29 deploy and its follow-up review-fix and changelog deploys, the gh-pages publish command was **denied by the permission layer on every cold attempt** and only succeeded immediately after Phil typed "publish" as the preceding instruction.

- The denied calls were not code or git errors — the command was correct each time.
- What *was* gated: the `git push --force` deploy script (which also does `rm -rf` + `git init`). What sailed through with no prompt: ordinary `git push origin master` (non-force) and `node scripts/write-version.js`.
- So the differentiator is the **force-push to a remote** — correctly treated as a high-risk, outward-facing, hard-to-reverse operation that requires explicit per-run approval.

Net effect: every Angular publish needs a manual "publish" turn, the operator can't always tell from Code's side whether a prompt is waiting, and the multi-step copy-out-of-worktree dance is easy to get wrong (it also depends on remembering to re-run `write-version.js` so the S-033 update banner fires — missing that ships a stale `version.json`).

---

## Why it matters

- **Speed / interruption** — each publish is a stop-and-approve cycle; a single contract took several publish rounds (initial deploy, review fixes, changelog).
- **Half-deploy risk** — Angular and MCP deploy independently and manually; it's easy to ship one and forget the other (this session, MCP review-fixes still await a Render redeploy after the Angular side was published).
- **Stale-banner risk** — the `version.json` stamp is a manual step inside the publish; forget it and users never get the "new version available" prompt.
- **Ambiguity** — Code cannot see the operator's permission UI, so it can't reliably distinguish "you declined" from "no one clicked yet," which wastes turns.

---

## Options for Design

**A. Keep as-is (manual, gated force-push).** Maximum safety; every publish is a deliberate human act. Cost: the friction above persists. *(Status quo.)*

**B. Allowlist the deploy command in Code settings.** Add a permission allow-rule for the specific gh-pages publish command so it runs without per-run approval. Removes the friction but also removes the human checkpoint on a force-push to the live site.

**C. Wrap deploy in a single guarded script/skill.** One `deploy-angular` script that runs build → `write-version` → copy-out → publish atomically, with a built-in confirmation and a post-publish health/version check. Keeps one explicit approval but eliminates the multi-step/forgot-a-step failure modes (stale `version.json`, wrong working dir).

**D. Real CI/CD.** A GitHub Action builds and deploys `gh-pages` (and triggers Render) on push to `master`, with `version.json` stamped automatically. Removes manual publishing entirely; the human checkpoint moves to merging/pushing. Larger setup; revisits the "no auto-deploy" decision in CLAUDE.md v2.7.

---

## Recommendation (Code's view, for Design to weigh)

Prefer **C** near-term (a guarded one-command deploy that bundles build + version stamp + publish + health check, keeping a single approval), with **D** as the eventual target once the infra layer is owned by TRIARQ engineers at port. **B** only if the team accepts an un-gated force-push to the live site. Keeping the *force-push itself* approval-gated (not blanket-allowlisted) is sensible regardless of which option is chosen.

---

## Related items from this session also bound for Design

(Not part of the deployment decision, but surfaced during Contract 29 and worth Design's attention.)

- **S-035 process gap** — the About Panel changelog entry for Contract 29 was missed in the deploy commit and added as a catch-up. Same retro item recurred at Contract 27 and now Contract 29. Consider whether the "prepend a ChangelogEntry in the deploy commit" step needs a hard gate (e.g., a CodeClose conformance check) rather than relying on memory.
- **Latent RLS bug (security)** — `public.user_is_admin()` still references the dropped `system_role` column (migration 034); RLS policies on ~16 tables error for the anon role, currently masked because the app reads via the service role. Background task spawned; needs a corrective migration.
- **`record_gate_decision` typo** — `decision === 'approve'` should be `'approved'`; D-438 artifact-suggestion warnings never fire on approval. Background task spawned.
- **Dead `division_gate_approvers` table** — Contract 29 added the parallel `gate_approver_configs`; the old unwired table (migration 026) is a cleanup candidate.
- **D-468 Notification primitive — deferred** — emails + Action-Queue relabel shipped this contract; the standing in-app Notification (schema link + list/dismiss tools + card wiring) was routed to a future contract per Phil. Needs a contract.
