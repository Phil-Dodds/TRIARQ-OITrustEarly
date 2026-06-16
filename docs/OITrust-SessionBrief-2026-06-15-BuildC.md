<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->
# OITrust Session Brief — 2026-06-15 — Build C (Contract 24)

SESSION TYPE: Spec execution
BUILD SCOPE: Build C — Contract 24
SURFACES IN THIS SESSION:
- Home screen (My Completed Gates card) — GREENFIELD new card
- /initiatives landing page (Recently Approved Gates hub card 9) — MODIFICATION
- /initiatives/gates-approved (Recently Approved Gates view) — GREENFIELD new route
- All Initiatives grid column headers — MODIFICATION (Gate rename + sort)
- Division pickers system-wide — MODIFICATION (grouping + scoping)
- New Initiative form Division field — MODIFICATION
- Edit Initiative panel Division field — MODIFICATION
- gate-record-modal (WIP warning render) — MODIFICATION
- /admin hub (Artifact Types card) — MODIFICATION
- /admin/artifact-types (Artifact Type management screen) — GREENFIELD new route
- submit_gate_for_approval MCP tool — MODIFICATION (suggestion warnings)
- record_gate_decision MCP tool — MODIFICATION (approval warnings)
- list_delivery_cycles MCP tool — MODIFICATION (next_gate computed fields)
- AppComponent bootstrap (maintenance mode screen) — MODIFICATION
- User Management grid sort — MODIFICATION

PRIMARY SPEC: OITrust-Contract24-Spec-2026-06-15.md

---

## Governing Decisions — Contract 24

**D-430 — My Completed Gates Home Card**
Query gate_records where gate_status = 'approved' AND approver_decision_at >= now() - 28 days AND user is assigned DCS/EPO/DOL on initiative. 5 rows max, async per D-346, appended per D-425. Footer → /initiatives/gates-approved Person-filtered to self.

**D-431 — Recently Approved Gates Hub Card 9 + View**
Hub card 9 amends D-396 (8→9 cards). Route /initiatives/gates-approved. Division-scoped. No + New Initiative button (explicit exception). All columns sortable per S-036. D-171 screen key `initiatives.gates-approved`.

**D-432 / S-036 — Grid Column Sort Interaction Standard**
Column header exclusive sort control. ↕ hover only. Click → ascending (↑ bold). Click again → descending (↓). Different column → ascending on new, prior clears. Non-sortable: no icon, default cursor. Sort state persists D-171. Default per screen — not this standard.

**D-433 — Division Picker Hierarchy Grouping**
All flat Division pickers: Trust as non-selectable group label (bold, stone), children indented 16px, alphabetical within group. native `<select>` → `<optgroup>`. Custom pickers → section headers. Audit all Division pickers — flag any requiring component changes as CC-decision.

**D-434 — Gate Column Rename**
All Initiatives grid: "STAGE" column header → "GATE". Content unchanged (condensed Stage Track + stage name text per D-267).

**D-435 — Next Gate Sort**
Next Gate = first gate_record where gate_status != 'approved' in sequence (Brief Review 1 → Go to Build 2 → Go to Deploy 3 → Go to Release 4 → Close Review 5). All approved → null, sorts last. list_delivery_cycles returns next_gate_sort_order (int) + next_gate_target_date (date). Default click → descending (5→1). Sub-sort by next_gate_target_date asc within group; null last. D-171 screen key `initiatives.list`.

**D-436 — Division Assignment Picker Scoping**
Non-Admin: shows My Divisions + descendants only, grouped per D-433. "Show all divisions" link at bottom expands full list. Expansion does not persist. Admin: Recently Used section (last 5 from user_screen_state key `picker.division.recent`) then full list. Picker history: prepend on commit, deduplicate, cap 5, upsert via upsert_user_screen_state MCP.

**D-437 — Artifact Type Admin + Warnings + Seed**
New Admin hub card + route /admin/artifact-types. Standard grid + right panel (S-005, S-018, S-019). No delete — deactivation only. Block deactivation if cycle_artifacts references exist. Gate suggestion warnings: submit_gate_for_approval returns suggestion_warnings array (non-blocking); record_gate_decision shows D-200 Pattern 2 warning (non-blocking). Seed: 38 artifact types replacing current 26. required_at_gate = 'all' is new enum value — schema migration required.

---

## Standing Governing Decisions (always operative)

**D-252 — Greenfield vs. Modification:** MODIFICATION surfaces — read existing component first, produce delta plan only. Full rewrite requires CC-decision.

**D-267 — Gate Column Content:** Condensed Stage Track (5 nodes per S-002) + stage name text. Column renamed to "Gate" per D-434.

**D-171 — Filter and Sort Memory:** Every screen with filter/sort persists state per user per screen via user_screen_state MCP tool. 7-day threshold.

**D-180 — Right-Panel Entity Detail:** All entity taps open in right panel. No full-page replacement without locked exception.

**D-182 — Entity Picker Pattern:** Use EntityPickerComponent for person selection. Scope radios, search, echo section.

**D-183 — Destructive Action Confirmation:** Two-step inline confirmation for irreversible actions. State specific downstream effects.

**D-200 — Three Feedback Patterns Only:** Pattern 1 = field guidance (stone). Pattern 2 = warning (sunray border, non-blocking). Pattern 3 = error (blocks action).

**D-252 — Modification Execution Model:** Read existing component before planning. Delta plan only. Full rewrite requires CC-decision.

**D-312 — Workstream Field Requirement:** Nullability at creation. Gate enforcement is the constraint surface.

**D-345 — Gate Submission Interaction Model:** Full gate submission/approval/return/withdraw flow. submit_gate_for_approval pre-checks per D-174. record_gate_decision advances stage on approval.

**D-346 — Processing Feedback Standard:** Button → present-participle label disabled. List → skeleton rows. Panels load completely before interactive. Async only for hub card headlines and home screen card counts.

**D-380 — user_screen_state via MCP only:** No direct Supabase access to user_screen_state. Always via get_user_screen_state / upsert_user_screen_state MCP tools.

**D-396 — Initiatives Hub Cards (now 9):** D-431 adds card 9. Async headline strips. + New Initiative on each view (except /initiatives/gates-approved — explicit exception).

**D-425 — Home Card Order:** My Initiatives → My Action Queue → My Notifications. New cards append.

**Rule 34 — Rolling AC Conformance Check:** Every CodeClose includes Build C §12 AC table: BUILT / PARTIAL / NOT BUILT with evidence. AC-29 is Build C close blocker.

**S-035 — About Entry at CodeClose:** About Entry block in every CodeClose touching user-facing surfaces. changelog.ts prepend in deploy commit.

**S-036 — Grid Column Sort:** Column header exclusive. ↕ hover, ↑/↓ active. No sort in filter panel. Declared per screen.

---

## AC-29 — BUILD C CLOSE BLOCKER

MaintenanceScreenComponent is not built. Build C cannot close until AC-29 is BUILT. Complete Workstream 9 AC-29 item before declaring Contract 24 done. See spec Workstream 9 for full requirements.

*Pathways OI Trust · Session Brief · Contract 24 · 2026-06-15 · CONFIDENTIAL*
