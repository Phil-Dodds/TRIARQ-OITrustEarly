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
    date:          '2026-06-15',
    contractLabel: 'WIP zone model — Brief counts in Pre-Build; Post-Deploy renamed Post-Build',
    items: [
      {
        audience:    'All',
        surface:     'EPO WIP Summary view',
        description: 'Brief-stage Initiatives now count in the Pre-Build WIP zone. Previously only Design and Spec counted. EPOs with Brief-stage work will now show up in the default view and may surface as over-limit.'
      },
      {
        audience:    'All',
        surface:     'EPO WIP Summary view',
        description: 'Initiatives on hold now count in the WIP zone they were in before being held — they no longer drop out of the picture.'
      },
      {
        audience:    'All',
        surface:     'EPO WIP Summary view',
        description: 'Help text added near the top of the screen explaining the three zones: Pre-Build (Brief/Design/Spec), Build (Build/Validate/UAT), Post-Build (Pilot/Release/Outcome).'
      },
      {
        audience:    'All',
        surface:     'EPO WIP Summary + EPO WIP Limits + Workstream Summary + Initiative Tracking hub',
        description: 'Third zone label "Post-Deploy" renamed to "Post-Build" everywhere for naming parallelism with Pre-Build and Build.'
      },
      {
        audience:    'Admin',
        surface:     'EPO WIP Limits admin screen',
        description: 'Heads-up: Pre-Build limits may need to be raised now that Brief-stage Initiatives count — defaults remain 3/3/3.'
      }
    ]
  },
  {
    date:          '2026-06-15',
    contractLabel: 'EPO Summary → EPO WIP Summary (rename + clarifier)',
    items: [
      {
        audience:    'All',
        surface:     'Initiative Tracking hub',
        description: '"EPO Summary" card renamed to "EPO WIP Summary." Description updated to note that EPOs whose Initiatives are all in Brief stage carry no WIP and are hidden by default.'
      },
      {
        audience:    'All',
        surface:     'EPO WIP Summary view',
        description: 'Screen title renamed. Subtitle clarifies that the view counts Initiatives in Pre-Build (Design/Spec), Build (Build/Validate/UAT), and Post-Deploy (Pilot/Release/Outcome) zones only — Brief-stage Initiatives are not WIP. Toggle "Include EPOs with no WIP" to see EPOs whose work hasn\'t yet entered any counted zone.'
      }
    ]
  },
  {
    date:          '2026-06-15',
    contractLabel: 'Contract 24 — Sort standard + picker scoping + gates feeds + artifact admin',
    items: [
      {
        audience:    'Admin',
        surface:     'User Management grid',
        description: 'User Name, Last Login, Created, and Invite Status columns are now sortable. Default sort is Last Login descending. Click a column header to sort; click again to flip direction.'
      },
      {
        audience:    'All',
        surface:     'All Initiatives grid',
        description: 'Stage column renamed to Gate and is now sortable. Sort defaults to descending — Initiatives closest to release appear first. Sub-sorted by the next gate target date within each gate.'
      },
      {
        audience:    'All',
        surface:     'Division pickers system-wide',
        description: 'Native Division dropdowns now group Divisions under their parent Trust, alphabetical within each group.'
      },
      {
        audience:    'All',
        surface:     'New Initiative + Edit Initiative panels',
        description: 'Division field is now a picker. Non-Admin users see their assigned Divisions first with a "Show all divisions" expansion. Admin users see a Recently Used section at the top.'
      },
      {
        audience:    'Trio',
        surface:     'Home screen',
        description: 'New "My Completed Gates" card lists gates approved on your Initiatives in the last 4 weeks. "View all" deep-links to the Recently Approved Gates view filtered to you.'
      },
      {
        audience:    'All',
        surface:     'Initiative Tracking hub',
        description: 'New hub card 9 "Recently Approved Gates" with last-28-days headline.'
      },
      {
        audience:    'All',
        surface:     'Recently Approved Gates view',
        description: 'New /initiatives/gates-approved route. Read-only feed of gates approved in the last 28 days across all Initiatives in your Divisions. All columns sortable.'
      },
      {
        audience:    'Admin',
        surface:     'Admin hub',
        description: 'New "Artifact Types" card.'
      },
      {
        audience:    'Admin',
        surface:     'Artifact Types admin screen',
        description: 'New /admin/artifact-types screen. Manage suggested artifact types per lifecycle stage and gate. Deactivation only — no delete; historical attachments are preserved.'
      },
      {
        audience:    'Trio',
        surface:     'Gate Record modal',
        description: 'When you approve a Go to Build or Go to Deploy gate that would push an EPO at or over their WIP limit, an amber WIP warning now appears in the modal. Suggested artifacts that were not attached before approval are also surfaced — both are reminders, not blockers.'
      },
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'Jira sync zone now shows a clear "Not linked" status when no Jira epic is linked, and an "API not yet configured" message when a link is present but sync is dormant.'
      },
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'Edit button added next to a linked Jira epic key — change the key without unlinking first. Pre-populates the input with the current key.'
      },
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'Cancel Initiative now works. The Cancel and Un-cancel buttons were calling MCP endpoints that had never been built — clicking Cancel always failed silently. Both endpoints are now in place; cancelled Initiatives can be restored to their pre-cancel stage from the same panel.'
      }
    ]
  },
  {
    date:          '2026-06-15',
    contractLabel: 'Artifact attach form — focus stays in input',
    items: [
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'Typing in the Artifact Title or External URL field no longer loses focus after one character.'
      }
    ]
  },
  {
    date:          '2026-06-15',
    contractLabel: 'Initiative detail — Jira link, sticky ✕, rename',
    items: [
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'Jira epic link now persists — new link_jira_epic MCP tool creates the jira_links row. Prior build silently dropped the input.'
      },
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: '✕ close button stays visible at the top of the panel while scrolling (was falling off when content was tall).'
      },
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: '"Cycle Artifacts" heading renamed to "Documents/Artifacts".'
      }
    ]
  },
  {
    date:          '2026-06-15',
    contractLabel: 'Initiative detail — Artifact slots now visible (AC #20 fix)',
    items: [
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'All 27 seeded artifact slots now render grouped by stage. Every slot has an Attach button regardless of Initiative state. Bug: prior build never rendered slots when no attachments existed.'
      },
      {
        audience:    'All',
        surface:     'Initiative detail panel',
        description: 'Ad-hoc "+ Attach Document" now works (was sending a sentinel string in place of artifact_type_id; MCP rejected as invalid UUID).'
      }
    ]
  },
  {
    date:          '2026-06-15',
    contractLabel: 'Initiative grid Division filter — children by default',
    items: [
      {
        audience:    'All',
        surface:     'Initiative list grid',
        description: 'Division filter now includes all child divisions by default. Uncheck "Include child divisions" in the filter panel to see only the selected Division.'
      }
    ]
  },
  {
    date:          '2026-06-14',
    builtAt:       '16:29 UTC',
    contractLabel: 'Contract 23 D-426 — About Panel + Build History',
    items: [
      {
        audience:    'All',
        surface:     'Sidebar',
        description: 'New "About" button in the sidebar footer opens a Build History panel.'
      }
    ]
  },
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
