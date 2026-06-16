// division-grouping.ts — D-433 Division Picker Hierarchy Grouping
// Shared helpers for grouping Divisions by parent Trust on every flat
// Division selection control system-wide.
//
// Per D-433: Trust = group label (non-selectable, bold). Service Line and
// Functional Team Divisions render 16px indented under their Trust. Sort
// within group: alphabetical by display_name.
//
// Applies to: native <select> dropdowns (use <optgroup>), EntityPicker
// Division rows (section headers), and any other flat Division selection
// control. Does NOT apply to D-417 hierarchical tree pickers or filter
// panels with existing My Divisions radio options.

import { Division } from '../types/database';

/** Single group: a Trust (level 1 Division) plus its descendant Divisions. */
export interface DivisionTrustGroup {
  trust:     Division;
  /** Trust + Service Line + Functional Team Divisions belonging to this Trust.
   *  Sorted alphabetically by division_name. */
  children:  Division[];
}

/** Empty bucket for "orphan" Divisions whose parent Trust is not in the input. */
const ORPHAN_TRUST_ID = '__orphan__';

/**
 * Group an arbitrary set of Divisions by their root Trust (level 1).
 * Walks `parent_division_id` chains to discover each Division's root Trust.
 * Divisions whose root Trust is NOT in the input land in an unlabelled
 * "Other" group at the end (rare; defends against bad input).
 *
 * Children are sorted alphabetically within each group; groups are sorted
 * alphabetically by Trust display name. Trusts that match the input but
 * have no children still appear (selectable as the Trust itself).
 */
export function groupDivisionsByTrust(divisions: Division[]): DivisionTrustGroup[] {
  if (!divisions || divisions.length === 0) { return []; }

  const byId = new Map<string, Division>();
  for (const d of divisions) { byId.set(d.id, d); }

  /** Walk parent chain to root Trust id; returns own id if at level 1. */
  const rootIdOf = (d: Division): string => {
    let cursor: Division | undefined = d;
    while (cursor && cursor.parent_division_id) {
      const parent = byId.get(cursor.parent_division_id);
      if (!parent) { return ORPHAN_TRUST_ID; }
      cursor = parent;
    }
    return cursor ? cursor.id : ORPHAN_TRUST_ID;
  };

  const groups = new Map<string, DivisionTrustGroup>();
  for (const d of divisions) {
    const rootId = rootIdOf(d);
    const trust  = byId.get(rootId);
    if (!trust && rootId !== ORPHAN_TRUST_ID) { continue; }
    const key    = rootId;
    let group    = groups.get(key);
    if (!group) {
      group = { trust: trust ?? d, children: [] };
      groups.set(key, group);
    }
    group.children.push(d);
  }

  // Sort children within each group; sort groups by Trust display name.
  const sortDivisions = (a: Division, b: Division) =>
    a.division_name.localeCompare(b.division_name);
  const list = Array.from(groups.values());
  for (const g of list) { g.children.sort(sortDivisions); }
  list.sort((a, b) => sortDivisions(a.trust, b.trust));
  return list;
}

/**
 * Render-helper: indent level used by templates for non-Trust rows.
 * D-433 specifies 16px indent for Service Line and Functional Team rows.
 */
export const D433_CHILD_INDENT_PX = 16;
