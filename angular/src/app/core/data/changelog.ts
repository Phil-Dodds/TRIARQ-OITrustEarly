// changelog.ts — Pathways OI Trust
// Typed constant feeding the About Panel (D-426).
// Maintained per S-035: every CodeClose touching a user-facing surface
// prepends one ChangelogEntry here in the deployment commit.
//
// Most-recent-first ordering. Items map 1:1 to UAT Checklist surfaces in
// the matching CodeClose output — one item per surface, not per CC-decision.
// Audience tags: 'Admin' (admin-role users), 'Trio' (DCS/EPO/DOL), 'All'
// (every user). Tag omitted entirely when audience undetermined.

export type ChangelogAudience = 'Admin' | 'Trio' | 'All';

export interface ChangelogItem {
  /** Optional audience tag. Omit when undetermined — no blank placeholder. */
  audience?: ChangelogAudience;
  /** Surface name from the UAT Checklist (e.g. "Initiative Activity view"). */
  surface:   string;
  /** One-line plain English description of what changed. */
  description: string;
}

export interface ChangelogEntry {
  /** ISO date — 'YYYY-MM-DD'. */
  date:          string;
  /** Optional build clock — 'HH:MM UTC'. */
  builtAt?:      string;
  /** Contract label, e.g. "Contract 23 Part 2". */
  contractLabel: string;
  /** Most-recent items first inside each entry too. */
  items:         readonly ChangelogItem[];
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    date:          '2026-06-14',
    builtAt:       '12:13 UTC',
    contractLabel: 'Contract 23 Part 2 — Show Only My Activity',
    items: [
      {
        audience:    'All',
        surface:     'Initiative Activity view',
        description: '"Show Only My Activity" checkbox added to filter feed to your own events.'
      },
      {
        audience:    'All',
        surface:     'My Initiative Activity card',
        description: '"View all activity →" deep-links to /initiatives/activity?mine=1 with filter pre-set.'
      }
    ]
  },
  {
    date:          '2026-06-14',
    builtAt:       '11:59 UTC',
    contractLabel: 'Contract 23 Part 2 — Initiative name always renders',
    items: [
      {
        audience:    'All',
        surface:     'Initiative Activity view',
        description: 'Every activity row now displays its linked Initiative name.'
      },
      {
        audience:    'All',
        surface:     'My Initiative Activity card',
        description: 'Renamed from "My Activity"; shows last 7 events (was 10).'
      }
    ]
  },
  {
    date:          '2026-06-13',
    builtAt:       '21:00 UTC',
    contractLabel: 'Contract 23 Part 2 — Activity feed + actor logging',
    items: [
      {
        audience:    'All',
        surface:     'Initiative Activity view',
        description: 'New /initiatives/activity feed + hub card 8 with last-7-days headline.'
      },
      {
        audience:    'All',
        surface:     'My Initiative Activity card',
        description: 'New home card showing your last 10 initiative events.'
      },
      {
        audience:    'Admin',
        surface:     'User View panel',
        description: 'New "Initiative Activity" zone showing the user\'s last 10 events.'
      },
      {
        audience:    'All',
        surface:     'Milestone target dates',
        description: 'Date changes now logged with actor attribution.'
      }
    ]
  },
  {
    date:          '2026-06-12',
    contractLabel: 'Contract 23 Part 1 — Stage Track + DOL governance',
    items: [
      {
        audience:    'All',
        surface:     'Sidebar',
        description: 'Initiative Tracking and Admin advanced from UAT to Pilot.'
      },
      {
        audience:    'All',
        surface:     'Initiative list grid',
        description: 'Stage column now uses StageTrackComponent (5 gate diamonds + stage name).'
      },
      {
        audience:    'All',
        surface:     'Initiative list grid',
        description: 'Headline column now shows a computed summary per 6-rule priority order.'
      },
      {
        audience:    'Admin',
        surface:     'Division Edit panel',
        description: 'New "Require DOL on Initiatives" toggle (default on).'
      },
      {
        audience:    'All',
        surface:     'New Initiative form',
        description: 'DOL picker hint adapts to selected Division\'s setting.'
      },
      {
        audience:    'All',
        surface:     'Brief Review gate',
        description: 'DOL null check skipped for Divisions with dol_required = false.'
      }
    ]
  }
];
