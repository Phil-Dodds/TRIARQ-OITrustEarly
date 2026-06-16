// sort-state.ts — S-036 Grid Column Sort Standard
// Shared helpers + types for column-header sort interaction across all grids.
//
// S-036 / D-432 / D-435: header is the exclusive sort control.
// Click sortable header → ascending. Click again → descending. Click different
// column → ascending on new column, prior clears. Sort state persists per
// D-171 via ScreenStateService sort_state payload.

export type SortDirection = 'asc' | 'desc';

export interface SortState<TColumn extends string> {
  column:    TColumn;
  direction: SortDirection;
}

/**
 * Apply S-036 toggle semantics: same column flips direction; new column
 * starts ascending (unless `firstClickDirection` overrides — e.g. D-435
 * Gate column defaults to descending on first click).
 */
export function applySortToggle<TColumn extends string>(
  current:              SortState<TColumn> | null,
  column:               TColumn,
  firstClickDirection:  SortDirection = 'asc'
): SortState<TColumn> {
  if (current && current.column === column) {
    return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { column, direction: firstClickDirection };
}

/**
 * Indicator character for header rendering.
 *  - '↕' shown on hover when column is sortable but not the active sort
 *  - '↑' / '↓' shown when this column is the active sort
 * The hover behavior is purely visual — driven by the .oi-sort-th class.
 */
export function sortIndicator<TColumn extends string>(
  state:  SortState<TColumn> | null,
  column: TColumn
): '↑' | '↓' | '' {
  if (!state || state.column !== column) { return ''; }
  return state.direction === 'asc' ? '↑' : '↓';
}

/**
 * String comparator with locale-aware compare. Nulls/empty sort last in both
 * directions (gate sort, dates, optional fields).
 */
export function compareString(
  a:         string | null | undefined,
  b:         string | null | undefined,
  direction: SortDirection
): number {
  const av = a ?? '';
  const bv = b ?? '';
  if (!av && !bv) { return 0; }
  if (!av)        { return 1; }
  if (!bv)        { return -1; }
  const cmp = av.localeCompare(bv);
  return direction === 'asc' ? cmp : -cmp;
}

/**
 * Numeric comparator. Nulls/undefined sort last in both directions.
 * Used for next_gate_sort_order (1–5, null when all approved) per D-435.
 */
export function compareNumber(
  a:         number | null | undefined,
  b:         number | null | undefined,
  direction: SortDirection
): number {
  const aNull = a == null;
  const bNull = b == null;
  if (aNull && bNull) { return 0; }
  if (aNull)          { return 1; }
  if (bNull)          { return -1; }
  const cmp = (a as number) - (b as number);
  return direction === 'asc' ? cmp : -cmp;
}

/**
 * Date comparator. Accepts ISO strings or null. Nulls last in both directions.
 */
export function compareDate(
  a:         string | null | undefined,
  b:         string | null | undefined,
  direction: SortDirection
): number {
  if (!a && !b) { return 0; }
  if (!a)       { return 1; }
  if (!b)       { return -1; }
  const cmp = a.localeCompare(b);
  return direction === 'asc' ? cmp : -cmp;
}
