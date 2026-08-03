# Contract 43 — D-613 Rework: All Pending Gates Division Leader Scope
Pathways OI Trust | Section H spec | 2026-08-02 | CONFIDENTIAL

**Decisions governing:** D-613 (LOCKED 2026-07-31). **Connects to:** D-577, D-560, D-601, D-611.
**Size:** Small. Fully specified. No unknowns. May ride alongside Contract 42.

## The problem

A Division Leader who owns a parent division can **approve** gates on initiatives in child divisions — D-577 gave them that authority via an ancestor-chain walk. But All Pending Gates scoped visibility at **owned** divisions only (CC-40-P). They held approval power over work they could not see was waiting.

Separately, the sidebar entry gates on IE / Admin / super_admin, so a Division Leader had no route to the screen at all.

## Scope

### 1. Scope resolution
Change All Pending Gates Division Leader scope from owned-divisions to **`isLeadershipForCycle`** — the same function the approval path already uses. That resolves to: the cycle's own Division Leader, every ancestor Division Leader via full `parent_division_id` walk, Initiative Executives, and Phil.

One scope function, not two. The system already decided who leadership is for a cycle; this screen should ask that question rather than a different one.

### 2. Sidebar entry — derive, do not store
Resolve division ownership at bootstrap from `divisions.owner_user_id` and show the link. Fold the lookup into the existing profile call.

**No `is_division_leader` profile flag.** A stored flag duplicates a fact the `divisions` table already owns and drifts the moment division ownership changes, which would silently cost someone access to their own queue.

### 3. Preserve the Contract 41 filter ordering

⚠️ Contract 41 deliberately placed the `delivery_cycle_id` scope **before** the division filter, so a Division Leader passing a foreign cycle id still gets nothing. **That ordering must survive this rework.** Verify it explicitly after the change.

## Definition of done

- A parent Division Leader sees pending gates across all child divisions.
- A Division Leader sees the All Pending Gates sidebar link without any stored flag.
- A Division Leader passing a `delivery_cycle_id` outside their scope receives nothing.
- No change to IE, Admin, or super_admin behaviour.
