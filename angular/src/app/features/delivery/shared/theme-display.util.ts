// theme-display.util.ts — Pathways OI Trust
// D-488: standard Initiative name-cell prefix. When a Roadmap Theme is set the
// name renders "[Theme Name] · [Initiative Name]" (middle-dot separator,
// matching the existing inline-count convention). No theme → unprefixed name,
// no dangling separator.
//
// CC: D-488 assumed a shared name-cell component; none exists — this helper is
// the shared implementation, applied per grid. New grids should import it.

export function themedTitle(cycle: { cycle_title: string; roadmap_theme_name?: string | null }): string {
  return cycle.roadmap_theme_name
    ? `${cycle.roadmap_theme_name} · ${cycle.cycle_title}`
    : cycle.cycle_title;
}
