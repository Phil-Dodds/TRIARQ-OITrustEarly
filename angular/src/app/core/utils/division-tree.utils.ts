// division-tree.utils.ts — Pathways OI Trust (Contract 38 follow-on 18)
// Orders a flat Division list as a tree for filter option lists: parents
// first (alphabetical), each followed by its children (alphabetical),
// recursively. A division whose parent is NOT in the supplied list renders at
// top level (depth 0) — so a user linked only to a child sees it un-indented,
// while a user linked to both parent and child sees the child indented.

import { Division } from '../types/database';

export interface DivisionTreeOption {
  division: Division;
  /** 0 = top level within the supplied list; +1 per ancestor also present. */
  depth: number;
}

export function orderDivisionsAsTree(divisions: Division[]): DivisionTreeOption[] {
  const byId = new Map(divisions.map(d => [d.id, d]));
  const childrenOf = new Map<string, Division[]>();
  const roots: Division[] = [];

  for (const d of divisions) {
    const parentInList = d.parent_division_id && byId.has(d.parent_division_id);
    if (parentInList) {
      const list = childrenOf.get(d.parent_division_id!) ?? [];
      list.push(d);
      childrenOf.set(d.parent_division_id!, list);
    } else {
      roots.push(d);
    }
  }

  const byName = (a: Division, b: Division) => a.division_name.localeCompare(b.division_name);
  const out: DivisionTreeOption[] = [];
  const walk = (nodes: Division[], depth: number) => {
    for (const d of [...nodes].sort(byName)) {
      out.push({ division: d, depth });
      const kids = childrenOf.get(d.id);
      if (kids?.length) { walk(kids, depth + 1); }
    }
  };
  walk(roots, 0);
  return out;
}
