# OITrust Session Brief — Build C Contract 15
<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->
2026-05-08 | Pathways OI Trust | Build C

## Active contract
Contract 15 — Bug fixes (B-91/B-92/B-97/B-101/B-102/B-103/B-105) + D-308 compliance for Gate Schedule and Deploy Gate by Quarter.

---

## Governing decisions for this contract

**D-93** — MCP-Only Database Access. Angular never queries Supabase directly except system_config.maintenance_mode. All data access via MCP tools with JWT validation.

**D-140** — Blocked Action UX Standard. Tell user what is blocked and what would need to change. Never silent failures or raw error strings.

**D-180 / S-018** — Right-Panel Entity Detail Pattern / List → View Pattern. Every named entity opens its detail in a right panel. Originating screen remains visible and navigable. No navigation away from the list route. One panel slot.

**D-183** — Destructive and Irreversible Action Confirmation. Two-step confirmation inline before irreversible actions. Applies to gate approval, stage regression.

**D-200** — UI Feedback Standard — Three Patterns Only. Pattern 1: field guidance (stone gray). Pattern 2: warning (sunray left border). Pattern 3: error (field border + message below). No fourth pattern.

**D-205** — User-Controlled Milestone Status Philosophy. User sets all five milestone statuses freely. Alert icon ⚠ shown on divergence: (A) status=complete but no approval record or no actual_date; (B) status not complete/behind AND target_date < today.

**D-308 / S-005** — List → View Navigation Pattern / Universal Entity Detail Pattern. Tappable row opens right panel View. List stays visible. No edit from list row entry point. Full-row tap always present.

**D-355** — Gate Record Modal Pattern. Gate interactions in MatDialog centered overlay. Trigger: gate diamond click only. Active stage circle is non-interactive. Dismiss: ×, Cancel, backdrop, Escape — all close without action, zero reload.

**D-360** — Stage Track Free Transition Model. Gate-blocked stages: default cursor, "Requires [Gate Name] approval" tooltip. Free-transition next stage: pointer cursor, "Advance to [STAGE]" tooltip, click triggers inline confirm. All other future stages: non-interactive, no tooltip (suppress null — do not render "Null" string). Active stage: non-interactive, no tooltip.

**D-367** — Verify Inputs Before Executable Actions. Before any SQL, file operation, or executable action against live state — confirm required facts are in context. Ask first if not.

**S-006** — Entity Detail Navigation Stack. Back = pop. No surface opens without a clear back path. Panel opens to right of originating surface.

**S-018** — List → View Pattern. Tap row → right panel View state. List interactive behind panel (no scrim). One panel slot. No save/submit/destructive action in View.

**S-019** — View → Edit Pattern. Edit button in View panel header opens Edit in same slot. Scrim covers list. Dirty-state check on ESC/Cancel/scrim.

**ARCH-25** — StageTrackComponent. Presentation-only. Gate diamonds emit `(gateClicked)`. Stage nodes non-interactive. Gate diamond is sole Gate Record Modal trigger (D-355/D-360 — active stage circle trigger removed).

**D-353** — RLS enabled schema-wide. MCP uses service role (bypasses RLS). Angular uses anon key (constrained by policy set).
