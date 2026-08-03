# Schema Summary — Contract 42 / 43 / 44

docs/schema-summary.md | 2026-08-02 | CONFIDENTIAL

Produced under **D-623** (Code produces a schema summary at close) and
**ARCH-34** (the live database must be rebuildable from the repository).
Contract 42 §6 asked for both in one pass; this file is that pass.

**Method.** Column names below are read from the **live schema**, not from
`build-c-spec.md`. The live inventory came from the Supabase PostgREST OpenAPI
document (`GET /rest/v1/`, service role) on 2026-08-02, diffed against every
`CREATE TABLE` / `CREATE FUNCTION` statement in `db/migrations/*.sql` on
`master`. Read-only throughout — no migration was executed (Rule 48 / D-622).

---

## 1. ARCH-34 reconciliation — orphaned objects

**Live tables and views: 66. Orphans: exactly one.**

| Object | Status |
|---|---|
| `public.system_config` | **Was orphaned.** Created by no migration on `master`. Closed by this contract — migration `095_system_config_rescued.sql` is now committed. |

Nothing else. Every other live table traces to a `CREATE TABLE` on `master`.

**Live RPC functions: 7. Orphans: zero.**

`nth_weekday_of_month`, `refresh_initiative_status_overdue`,
`resolve_division_status_config`, `search_document_embeddings`,
`status_update_chain_root_saved_at`, `user_division_ids`, `user_is_admin` —
all created by committed migrations. (`set_updated_at` and the `auth` helper
are migration-defined but not PostgREST-exposed; not orphans.)

**The concern behind Contract 42 §6 — "`system_config` was found by accident
because two later migrations happened to touch it; nothing rules out others
that were never referenced again" — is now closed by enumeration rather than
by inference. There were no others.** A fresh environment can be rebuilt from
`db/migrations/` once 095 is on `master`, which this contract does.

Caveat, stated rather than buried: PostgREST exposes the `public` schema only.
Objects in other schemas, and indexes, triggers, constraints and policies, are
outside this diff. Tables and exposed functions are covered in full.

---

## 2. Migration 095 disposition

**Answer: no execution required. Do not run it against production.**

Reasoning, in the order it was established:

1. The rescue note *inferred* the table already existed, from the fact that
   migrations 031 and 053 both `ALTER` it and both succeeded.
2. This contract *confirmed* it directly. `public.system_config` is live and
   holds exactly one row — `id 062ae879-4e78-426e-afc0-6acde802cb2e`,
   `maintenance_mode = false`, `updated_at 2026-04-07`, carrying 053's
   `status_refresh_last_run`. The original 027 was run by hand at Build C time.
3. Both statements in the file are guarded — `CREATE TABLE IF NOT EXISTS` and
   an `INSERT … WHERE NOT EXISTS`. Against production both are no-ops.

The file is committed for **rebuild completeness**, not as a pending change.
That distinction is the whole point of ARCH-34: the repository must be able to
recreate the database even where the database no longer needs the repository.

One change was made to the rescued file beyond its own flagged seed guard: an
`ENABLE ROW LEVEL SECURITY` statement, to satisfy Rule 38. It is idempotent and
does not take policy ownership away from 031.

---

## 3. Tables touched this session

Per D-623, each table named in a CC-decision, with its **actual** live columns.

### `system_config` — Contract 42 (read + write)

```
id, maintenance_mode, maintenance_message, updated_at, updated_by,
status_refresh_last_run
```

- Primary key is `id` (uuid). Not `system_config_id`.
- `updated_by` is **text**, not uuid and not an FK. `set_maintenance_mode`
  writes the caller's uuid into it as a string.
- `status_refresh_last_run` belongs to migration 053 and to an unrelated
  feature. Maintenance mode neither reads nor writes it.
- Exactly one row. Both tools depend on that: `get_maintenance_mode` reads with
  `.limit(1).single()`, and `set_maintenance_mode` issues an unfiltered
  `UPDATE`. A second row would make the flag nondeterministic — which is why
  095's seed is guarded.

### `divisions` — Contract 43 (read)

```
id, parent_division_id, division_name, division_level, division_type_label,
owner_user_id, created_by, created_at, updated_at, deleted_at,
display_name_short, active_status, dol_required, sprint_calendar_id,
sprint_calendar_none, jira_epic_required
```

- `owner_user_id` is the Division Leader. `parent_division_id` is the ancestor
  chain `isLeadershipForCycle` walks.
- The derived `owns_division` field added to `list_users` this contract is
  computed from `owner_user_id`. **No column was added** — D-613 explicitly
  rejects a stored `is_division_leader` flag.

### `users` — Contracts 42, 43, 44 (read)

```
id, email, display_name, allow_both_admin_and_functional_roles, is_active,
created_at, updated_at, deleted_at, is_admin, is_dcs, is_epo, is_dol, is_ce,
is_super_admin, last_login_at, trusted_dcs, is_initiative_executive
```

- Primary key is `id`. There is no `user_id` column on this table — relevant to
  any future `manager_user_id` FK (D-638, Contract 45), which must reference
  `users(id)`, **not** `users(user_id)` as the Contract 45 spec text states.
  Flagged for Design; not resolved here.
- The admin gate on both maintenance tools reads `is_admin` + `is_active`.

### `gate_records` — Contracts 43, 44 (read)

Columns used: `gate_record_id` (PK), `delivery_cycle_id`, `gate_name`,
`gate_status`, `approver_user_id`, `submitted_at`, `submitted_by_user_id`,
`approver_notes`, `approver_decision_at`, `deleted_at`.

- `approver_user_id` is **NULL on every Level 1 gate** — L1 is consensus and has
  no single approver. This is the root cause of the Contract 44 V1 finding.

### `delivery_cycles` — Contract 43 (read)

Columns used: `delivery_cycle_id` (PK — **not** `id`), `cycle_title`,
`division_id`, `assigned_dcs_user_id`, `assigned_epo_user_id`,
`assigned_dol_user_id`, `baseline_level`, `set_level`, `deleted_at`.

### No schema changes

**No table was created, altered, or dropped by Contracts 42, 43, or 44.**
Migration 095 is a commit of an already-applied object. Contract 45 (`users
.manager_user_id`, `notification_queue`) is the next schema-touching work and
did not run this session.

---

*TRIARQ Health | Pathways OI Trust | CONFIDENTIAL | 2026-08-02*
