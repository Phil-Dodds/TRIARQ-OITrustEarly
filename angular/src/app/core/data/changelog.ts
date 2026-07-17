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
    date:          '2026-07-17',
    builtAt:       '04:00 UTC',
    contractLabel: 'Contract 38 follow-on — Deploy by Quarter for every role',
    items: [
      {
        audience:    'Trio',
        surface:     'Deploy by Quarter (was EPO Deploy by Quarter)',
        description: 'Renamed, and now switchable between EPO, DOL, and DCS views like Next Gates — your choice is remembered. Initiatives without an owner now surface in an Unassigned group (DOL view skips divisions that don\'t require one), and the hub card headline counts Initiatives deploying this quarter.'
      }
    ]
  },
  {
    date:          '2026-07-17',
    builtAt:       '03:15 UTC',
    contractLabel: 'Contract 38 follow-on — review reasons, plain and bold',
    items: [
      {
        audience:    'All',
        surface:     'Review warnings (dashboard + panels)',
        description: 'Shorter, bolder reasons: Escalation · Status Update Overdue · Gate Date Moved +N days · At Risk · Missing Target Date · Missing Deploy Date · and a new Gate Overdue. One bulleted line each, no header sentence, no gate-name clutter.'
      }
    ]
  },
  {
    date:          '2026-07-17',
    builtAt:       '02:30 UTC',
    contractLabel: 'Contract 38 follow-on — dates, Next Gates, and cleaner warnings',
    items: [
      {
        audience:    'Trio',
        surface:     'Next Gates (was EPO Gate Schedule)',
        description: 'Renamed, and now switchable between EPO, DOL, and DCS views (your choice is remembered). A new "No target date" section and subtotal surfaces unplannable work, and an Unassigned group catches initiatives without an owner — except DOL in divisions that don\'t require one.'
      },
      {
        audience:    'All',
        surface:     'Gate tracks + Initiative panel',
        description: 'A next gate with no target date now wears a dashed red halo, and the panel shows an amber pointer to the exact Set date cell. Review warnings everywhere trade the red pills for the same clean banded style as the grid headline, and appear live while you\'re writing a status update.'
      },
      {
        audience:    'All',
        surface:     'Initiatives grid',
        description: 'Cancelled initiatives are hidden by default — reveal them with the new "Include cancelled" checkbox (resets each visit). Team meeting reference panels stop showing completed and cancelled initiatives too.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '19:50 UTC',
    contractLabel: 'Contract 38 follow-on — halo marks the working gate',
    items: [
      {
        audience:    'All',
        surface:     'Gate tracks (grid + panel)',
        description: 'The gate you\'re working toward now wears a halo — slightly larger with a ring in its status color (navy when no status is set). When the gate is submitted for approval the ring turns purple while the diamond keeps YOUR status color, so approvers can spot "submitted and behind" at a glance. Done initiatives show no halo.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '18:15 UTC',
    contractLabel: 'Contract 38 follow-on — one gate color language',
    items: [
      {
        audience:    'All',
        surface:     'Initiatives grid + Initiative panel',
        description: 'Gate diamonds everywhere now show YOUR gate status colors — green on track, amber at risk, red behind, blue only when a gate is approved, and a new purple whenever a gate is submitted for approval. The grid track and the panel track finally match. When a date has passed but the status says otherwise, a small ⚠ appears instead of changing your color.'
      },
      {
        audience:    'All',
        surface:     'Initiatives grid headline',
        description: 'The headline band follows the next gate\'s status color, and the status digest is colored by the gate status at the time it was written — with an "as of [gate]" note once the Initiative moves on, so stale statuses show their age.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '17:15 UTC',
    contractLabel: 'Contract 38 follow-on — Initiatives grid headline upgrade',
    items: [
      {
        audience:    'All',
        surface:     'Initiatives grid',
        description: 'The Headline cell now carries a color band for the next gate\'s state — green on track, amber due soon, red overdue, blue awaiting approval — with darker, easier-to-read text, and a second line showing the latest status update\'s Done and Next. The Tier chip is gone; tier still lives in Filters and the detail view.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '16:30 UTC',
    contractLabel: 'Contract 38 follow-on — Home screen organized',
    items: [
      {
        audience:    'All',
        surface:     'Sidebar',
        description: 'All coming-soon items now live under one collapsible "Coming Soon …" menu below Contact an Admin — the sidebar shows only what works today.'
      },
      {
        audience:    'All',
        surface:     'Home screen',
        description: 'Home cards now share one standard height with content scrolling inside, and the order puts your working cards first — Initiatives, Action Queue, Activity, Completed Gates — with coming-soon cards moved to the bottom.'
      },
      {
        audience:    'All',
        surface:     'Sidebar',
        description: 'Home, My Actions, and Team Meetings graduate from Pilot to Live.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '15:45 UTC',
    contractLabel: 'Contract 38 follow-on — compact egg cards + a curious egg',
    items: [
      {
        audience:    'All',
        surface:     'Home egg cards',
        description: 'My Easter Eggs and the community card now size to their content — the community feed scrolls inside the card instead of stretching the whole row.'
      },
      {
        audience:    'All',
        surface:     'Sidebar',
        description: 'Haven\'t found a single egg yet? Keep an eye on the Home menu — something might dance by now and then. (Just a nudge — the real eggs are hidden in the app.)'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '14:30 UTC',
    contractLabel: 'Contract 38 follow-on — egg hunt leader moved',
    items: [
      {
        audience:    'All',
        surface:     'Egg hunt — community card',
        description: 'The hunt leader now shows at the top of the community card — where the standings belong — instead of on your personal My Easter Eggs card.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '14:00 UTC',
    contractLabel: 'Contract 38 follow-on — news banner out of the way',
    items: [
      {
        audience:    'All',
        surface:     'News banner',
        description: 'The bottom banner no longer covers buttons or content — screens now end above it, panels open over it, and a new × on its right edge hides it in one click (the space comes right back). Bring it back anytime from the small OI Trust tab in the bottom-right corner.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '13:00 UTC',
    contractLabel: 'Contract 38 — Meeting presence + leader-name sections',
    items: [
      {
        audience:    'All',
        surface:     'Team Meeting screen',
        description: 'See who else is on the meeting with you. A "Here now" avatar stack sits by the series name, and a small colored chip appears on whichever section each person is working in — moving as they move.'
      },
      {
        audience:    'All',
        surface:     'Series sections',
        description: 'New meeting series no longer default to "Phil" section names — the escalation and communications sections now carry the series leader\'s own first name.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '18:00 UTC',
    contractLabel: 'News banner reactions',
    items: [
      {
        audience:    'All',
        surface:     'News banner',
        description: 'React to good news on the bottom banner. Hover to pause it, hover an item for a ☺﹢ button, and give it a heart, a clap, or a TRIARQ Q. Reactions show as little counts everyone can see.'
      }
    ]
  },
  {
    date:          '2026-07-16',
    builtAt:       '03:00 UTC',
    contractLabel: 'Activity banner + Easter Egg leaderboard',
    items: [
      {
        audience:    'All',
        surface:     'News banner',
        description: 'A slim banner now scrolls along the bottom of every screen, celebrating recent good news — gates passed, new meetings, eggs found, and new people joining. Hover to pause it.'
      },
      {
        audience:    'All',
        surface:     'My Easter Eggs',
        description: 'The card now shows the current hunt leader — their name, egg count, and most recent egg.'
      },
      {
        audience:    'Admin',
        surface:     'Easter Egg Leaderboard',
        description: 'A new Admin screen ranks everyone by eggs found with a progress bar toward all ten — a quick read on how the hunt is going.'
      }
    ]
  },
  {
    date:          '2026-07-15',
    builtAt:       '12:00 UTC',
    contractLabel: 'Easter Egg Hunt',
    items: [
      {
        audience:    'All',
        surface:     'Easter Egg Hunt',
        description: 'Ten Easter eggs are hidden in quiet corners across OI Trust. Spot one and click to collect it — each is named for where it was hiding. Find all ten for a little celebration (and a note from the OI Trust team).'
      },
      {
        audience:    'All',
        surface:     'Home — My Easter Eggs',
        description: 'A new Home card shows your basket: eggs you\'ve found (with their names) and mystery slots for the ones still hidden. A second card shows recent finds across the team — locations stay secret until you find them yourself.'
      }
    ]
  },
  {
    date:          '2026-07-15',
    builtAt:       '05:00 UTC',
    contractLabel: 'Contract 37 — Sprint Calendars & Gate Date Rules',
    items: [
      {
        audience:    'All',
        surface:     'Gate target date editor',
        description: 'Set gate target dates by sprint: a Date · Sprint · After prior gate toggle, a sprint dropdown with real dates, and a live "Resolves to" preview. The saved date stays a normal calendar date — dashboards and overdue logic are unchanged.'
      },
      {
        audience:    'All',
        surface:     'Gates & Milestone Dates grid',
        description: 'Target dates now show as "Mon DD" with a small rule chip beneath ruled gates (e.g. "Sprint 2026.11 end + 14d"). A warning chip appears when a rule no longer matches the Division\'s calendar — the date itself never moves on its own.'
      },
      {
        audience:    'All',
        surface:     'Cascading date moves',
        description: 'Gates set "After prior gate" follow their anchor: moving an upstream target shows exactly which downstream dates will shift (old → new) before anything saves. Cancel aborts the whole change. Gate approvals never move dates.'
      },
      {
        audience:    'Admin',
        surface:     'Sprint Calendars admin',
        description: 'New Admin screen to manage sprint calendars and their sprints (add, edit, delete). Editing sprint dates asks for confirmation with the number of affected Initiatives.'
      },
      {
        audience:    'Admin',
        surface:     'Division Sprint Calendar assignment',
        description: 'Divisions can inherit a calendar from their parent, pick one directly, or opt out with None (date-only editing for that subtree). Reassignment never moves existing gate dates.'
      }
    ]
  },
  {
    date:          '2026-07-12',
    builtAt:       '23:30 UTC',
    contractLabel: 'Contract 36 — Initiative Status & Date Management',
    items: [
      {
        audience:    'All',
        surface:     'Gate dates',
        description: 'Gate target and actual dates can now be cleared — pick Clear in the date field and Save. Clearing never changes the gate status; clearing the actual date on a Complete gate asks you to confirm first.'
      },
      {
        audience:    'All',
        surface:     'Status updates',
        description: 'Anyone with visibility on an initiative can now save a status update — not just the assigned team. When someone outside the DCS/EPO/DOL team posts one, those three are invited to acknowledge it. The latest update can also be edited for up to 3 days (history keeps every version).'
      },
      {
        audience:    'All',
        surface:     'Initiative Status Dashboard',
        description: 'Rebuilt for running status meetings: Next Gate and Target Date columns, Team column, a merged Updated By (who + how long ago), person filters (EPO/DOL/DCS), two meeting sorts, and Prev/Next in the View Status panel to walk the room initiative by initiative. Changes anyone makes appear live within ~10 seconds.'
      },
      {
        audience:    'All',
        surface:     'View Status panel',
        description: 'Act without leaving the panel — post an update, edit the latest one, or acknowledge with one click. Acknowledgment chips show at a glance who has and hasn\'t seen an externally-authored update.'
      },
      {
        audience:    'All',
        surface:     'My Actions',
        description: 'Tabs renamed to say what you do: Approve Initiative Gates · Update Initiative Statuses · Acknowledge Initiative Status Updates. Completed approvals moved to a "View completed" link inside the first tab.'
      }
    ]
  },
  {
    date:          '2026-07-12',
    contractLabel: 'Contract 33 follow-on — Team Meetings enhancements',
    items: [
      {
        audience:    'All',
        surface:     'Meeting types',
        description: 'Creating a series now starts from a meeting type. Team Meeting sets up the classic agenda (starting with collecting topics from the room so nothing gets missed). Manager / Employee 1:1 sets up a Grove-style one-on-one — the employee owns the agenda, plus sections for early warning signs, coaching, career development, written follow-ups, and a closing "One More Thing…". Or start Blank and build your own.'
      },
      {
        audience:    'All',
        surface:     'Presenter sections',
        description: 'Give each participant their own section for action items, escalations, blockers, and accomplishments — one click adds a section for every participant, or toggle them per person. When you add an initiative from the reference panel, it lands in that presenter’s section automatically.'
      },
      {
        audience:    'All',
        surface:     'Pull from last meeting',
        description: 'One button pulls everything from the last meeting into this one — bullets, notes, all sections at once (or use the small ⟲ on a single section). Items already carried over are skipped automatically, so pulling twice never duplicates.'
      },
      {
        audience:    'All',
        surface:     'Drag and drop',
        description: 'Drag any bullet from one section to another — grab the item, drop it where the conversation says it belongs.'
      },
      {
        audience:    'All',
        surface:     'Meeting cadence',
        description: 'Set a rhythm for the series — weekly, bi-weekly, tri-weekly, or monthly on a chosen day (or a simple every-N-days). New meetings suggest the right date automatically and the title fills itself in; you can always pick a different date.'
      },
      {
        audience:    'All',
        surface:     'Initiative Reference panel',
        description: 'The panel now focuses on the people in your meeting: participants appear with all their initiatives across every role. Untick "Show only initiatives for meeting participants" to browse everyone by DCS, DOL, or EPO. Your view choices — filter, people type, expanded rows — are remembered for your next meeting in the series.'
      },
      {
        audience:    'All',
        surface:     'Quality touches',
        description: 'Bullet note boxes now invite you in with a light tint when empty, turn white as you type, and grow with your text. New series open straight into setup with invites available at creation. Who added each bullet shows as small initials in multi-person meetings.'
      }
    ]
  },
  {
    date:          '2026-07-07',
    contractLabel: 'Contract 33 — Team Meetings',
    items: [
      {
        audience:    'All',
        surface:     'Team Meetings',
        description: 'A new home for recurring team meetings. Team Meetings helps you plan a meeting agenda and take notes as you go — organized into sections you choose, with bullets, per-item notes, and a discussion notes area under each section. Open it from the sidebar.'
      },
      {
        audience:    'All',
        surface:     'Meeting series',
        description: 'Anyone can create a meeting series — a named sequence of related meetings (like a weekly team check-in) with its own participants and agenda sections. Make a series private and invite people directly (paste names straight from Outlook), or make it public so anyone in the company can find and join it under "Search Public Meetings to Join."'
      },
      {
        audience:    'All',
        surface:     'Collaborative notes',
        description: 'Meeting participants see and update the same meeting together. Add bullets and notes during the meeting and everyone’s screen stays in sync — great for a shared agenda on the conference room screen while people contribute from their own laptops.'
      },
      {
        audience:    'All',
        surface:     'Carry forward',
        description: 'Unfinished items don’t get lost. Open last meeting and carry any bullet forward to this week’s meeting with one click — the item keeps its history across meetings.'
      },
      {
        audience:    'All',
        surface:     'Initiative Reference panel',
        description: 'While planning, browse initiatives by DCS, DOL, or EPO and check them straight into the agenda. Each agenda item shows the assigned person and the next gate with its target date, and taps through to the full initiative detail.'
      },
      {
        audience:    'All',
        surface:     'Share link',
        description: 'Every series has a share link you can paste into an Outlook invite — clicking it takes participants straight to the latest meeting in the series.'
      }
    ]
  },
  {
    date:          '2026-06-30',
    builtAt:       '17:10 UTC',
    contractLabel: 'Contract 32 follow-on — Navigation restructure',
    items: [
      {
        audience:    'All',
        surface:     'My Actions',
        description: 'My Actions now has four tabs: Approve Initiative Gates, Initiative Gate Approvals Completed, Updates Due, and Needs Acknowledgment. The sidebar badge on My Actions counts all three actionable tabs together. The separate "My Initiative Status" sidebar item has been removed — its Updates Due and Needs Acknowledgment views live here now.'
      },
      {
        audience:    'All',
        surface:     'Initiative Tracking',
        description: 'The Initiative Status Dashboard is now a card on the Initiative Tracking page (with a "needs review" headline) instead of a separate sidebar item.'
      }
    ]
  },
  {
    date:          '2026-06-30',
    builtAt:       '14:48 UTC',
    contractLabel: 'Contract 32 — Initiative Status Updates',
    items: [
      {
        audience:    'Trio',
        surface:     'My Initiative Status screen',
        description: 'A new My Initiative Status page (sidebar, under My Actions) with two tabs: Updates Due — initiatives where you are the DOL/DCS/EPO and a status update is overdue for the division’s meeting cadence; and Needs Acknowledgment — recent updates by a teammate awaiting your one-click acknowledgment. A Refresh Status button recomputes overdue state on demand and shows when it last ran.'
      },
      {
        audience:    'All',
        surface:     'Initiative Status Dashboard',
        description: 'A new Initiative Status Dashboard (sidebar, under Initiative Tracking) showing every initiative you can see with its latest status, confidence, escalation flag, and a Needs Review reason column (overdue, escalation, gate-date slip, or At Risk). Filter by Division, toggle Needs Review only, and open any initiative’s status or full detail.'
      },
      {
        audience:    'Trio',
        surface:     'Initiative Status Update panel',
        description: 'On an initiative’s detail view, Update Status (trio only) opens a panel to record what was accomplished, the plan, blockers, an escalation flag, and gate confidence — confidence writes through to the gate status. View Status History shows every past update with acknowledgments, and a Current Status section summarizes the latest one.'
      },
      {
        audience:    'Admin',
        surface:     'Division — Initiative Update Cycle',
        description: 'The Division admin panel gains an Initiative Update Cycle section to set how often each division’s initiatives need a status update (weekly, every three weeks, or monthly) with a plain-English preview. Divisions without their own setting inherit from their parent.'
      }
    ]
  },
  {
    date:          '2026-06-22',
    contractLabel: 'Contract 31 — API Keys & Public Initiative MCP',
    items: [
      {
        audience:    'Admin',
        surface:     'Admin — API Keys (Phil only)',
        description: 'New API Keys screen (/admin/api-keys) to issue and manage keys that let an executive’s Claude Desktop read Initiative data through the new public Initiative MCP. Creating a key shows it once — copy it before closing. Each key has Setup Instructions (a ready-to-paste Claude Desktop config), can be edited, inactivated (two-step), or reactivated, and the grid filters by Active / Inactive / All.'
      }
    ]
  },
  {
    date:          '2026-06-21',
    contractLabel: 'Contract 30 — My Actions, Gate Return, Grid & Division Leader',
    items: [
      {
        audience:    'All',
        surface:     'My Actions screen',
        description: 'A new My Actions page (in the sidebar, with a pending-count badge) has two tabs: Open — every gate awaiting your approval or review, each with an Approve / Deny action; and Completed — the actions you have already taken (approvals, returns, and consult responses). Both are filterable by Gate and Division, sortable, and default to the last 21 days. Opening an item and exiting returns you to the same tab.'
      },
      {
        audience:    'All',
        surface:     'Home — My Action Queue card',
        description: 'The home card now shows your 7 most recent actions with a "View all →" link to My Actions, and a small amber ○ / red ✕ marker when a consulted party is still pending or has declined.'
      },
      {
        audience:    'All',
        surface:     'Initiative grid',
        description: 'New subtitle; the Division column now shows the short Division name; and the Workstream name appears in the Team column only while a Workstream filter is active — saving row height otherwise.'
      },
      {
        audience:    'All',
        surface:     'Gate return',
        description: 'When an approver returns a gate it now shows a hollow orange diamond on the Stage Track, and the initiative stays in its current stage (it no longer slips back). Re-submitting clears the prior return notes from the active panel and re-notifies the approver.'
      },
      {
        audience:    'Admin',
        surface:     'Division Management — Division Leader',
        description: 'The Division panel now shows a Division Leader. Phil can set, change, or clear the leader from the Edit panel; everyone else sees it read-only.'
      }
    ]
  },
  {
    date:          '2026-06-20',
    contractLabel: 'Contract 29 — Gate Approval, Consultation, and Notification',
    items: [
      {
        audience:    'Trio',
        surface:     'Initiative Edit panel — Other Consulted / Other Informed',
        description: 'Two new multi-person pickers let you add anyone (any user, not just a role) as a standing Other Consulted or Other Informed party on the initiative. Other Consulted parties are pulled into every gate submission for review.'
      },
      {
        audience:    'All',
        surface:     'Initiative Detail — Identity zone',
        description: 'Two new read-only rows, Other Consulted and Other Informed, show the extra people attached to the initiative beyond the DCS/EPO/DOL. Each row is hidden when no one is set.'
      },
      {
        audience:    'All',
        surface:     'Gate Record Modal — Consulted section',
        description: 'When a gate is submitted, a Consulted section lists the DCS/EPO/DOL plus any Other Consulted, each with their response (Approved / Declined / Pending) and a summary line. You can record or change your own response — including a post-approval decline after a gate is already approved — and add notes.'
      },
      {
        audience:    'Trio',
        surface:     'Gate Record Modal — submission confirmation',
        description: 'After submitting a gate for approval, a confirmation shows who it routed to: "Submitted for approval by [approver]."'
      },
      {
        audience:    'All',
        surface:     'Action Queue — consultation items',
        description: 'Consultation requests now appear in your Action Queue as "Review requested: [Gate] — [Initiative]". After the gate is approved, an unanswered request relabels to "Gate approved — your review still welcome", renders muted, does not add to your badge count, and can be dismissed.'
      },
      {
        audience:    'Admin',
        surface:     'Admin — Gate Approvers (Phil only)',
        description: 'New Gate Approvers screen (/admin/gate-approvers) to assign the accountable approver for each Division and gate. At submission the approver resolves in order: configured approver → Division owner → Phil. Phil approving a gate routed to someone else converts that person to a consulted reviewer.'
      },
      {
        audience:    'All',
        surface:     'Email notifications',
        description: 'Gate submissions email the assigned approver and all consulted parties; a post-approval decline emails the approver and Phil. Notifications are sent from OITrust@triarqhealth.com.'
      }
    ]
  },
  {
    date:          '2026-06-17',
    contractLabel: 'Contract 28 — Gate Skip Flow and Status Revert Fix',
    items: [
      {
        audience:    'Trio',
        surface:     'Initiative Detail — Stage Track gate diamond',
        description: 'Hollow Oravive diamond renders when a gate is in the new Skipped state. Tooltip in full mode shows "Skipped — [date]". The connector treats Skipped like Complete so the track reads as continuous.'
      },
      {
        audience:    'Trio',
        surface:     'Initiative Detail — Gate Detail Sub-Panel (skip flow)',
        description: 'Submitting a gate that has unapproved predecessors opens a Skip & Submit interstitial listing the gates that will be marked Skipped. Submitting Go to Deploy with unapproved predecessors opens a separate Close-only blocked dialog — Deploy can never be skipped. The skip interstitial only commits when the user confirms; cancel leaves all state unchanged.'
      },
      {
        audience:    'Trio',
        surface:     'Initiative Detail — Gate Detail Sub-Panel (skipped state)',
        description: 'Clicking a Skipped gate diamond opens a sub-panel showing a Skipped badge with no Submit, Approve, or Return buttons. A Backdate affordance lets you record the actual completion date for gates completed outside OI Trust; confirming clears the Skipped state and marks the gate as complete with no formal approval.'
      },
      {
        audience:    'Trio',
        surface:     'Initiative Detail — Milestone status dropdown',
        description: 'Changing the status on a gate with a recorded actual date now opens an inline confirmation panel ("You are reverting a completed gate. This will be logged.") with Continue and Cancel. Cancel restores the previous value with no MCP call. No free-text reason field is ever shown — the system logs the revert event automatically.'
      },
      {
        audience:    'All',
        surface:     'Activity Feed and Initiative Activity view',
        description: 'Three new event types appear in activity feeds and are filterable in the cross-Initiative view: Gate skipped, Gate backdated, and Milestone status reverted. Skipped gates are also excluded from Recently Approved Gates and the My Completed Gates home card.'
      },
      {
        audience:    'All',
        surface:     'Dashboard status dot',
        description: 'The Initiative status dot walkback now treats Skipped gates as transparent — the next gate in the chain drives the dot. An Initiative with every gate skipped except Deploy derives the dot from Deploy alone.'
      }
    ]
  },
  {
    date:          '2026-06-17',
    contractLabel: 'Contract 27 — Roadmap Planning Mode',
    items: [
      {
        audience:    'Admin',
        surface:     'Administration — Deploy Roadmap Baselines',
        description: 'New Admin screen at /admin/deploy-baselines for managing dated baseline snapshots. Add, edit inline, and remove baselines with a five-second confirmation window. Each baseline labels a freeze date so the Deploy by Quarter views can compare planned vs. actual deployments against it.'
      },
      {
        audience:    'All',
        surface:     'EPO Deploy by Quarter',
        description: 'Quarter Pivot Control in the header lets you anchor a different reference quarter — chevrons step ±1 quarter, the label updates, and section bucketing follows. Resets to the actual calendar quarter on every load.'
      },
      {
        audience:    'All',
        surface:     'EPO Deploy by Quarter — Baseline selector',
        description: 'Pick a baseline from the dropdown to compare Prior Quarter planned vs. actual deployments. ✓ marks Initiatives that shipped as planned, ✕ marks misses, and ✚ marks deployments that were not planned as of the baseline.'
      },
      {
        audience:    'All',
        surface:     'Deploy Gate by Quarter (Workstream)',
        description: 'Same Quarter Pivot Control and Baseline selector available on the Workstream-organized Deploy view. Selection is per-view and not persisted across reloads.'
      }
    ]
  },
  {
    date:          '2026-06-16',
    contractLabel: 'Contract 25 Part 2 follow-on — Edit + Remove on Initiative artifacts',
    items: [
      {
        audience:    'All',
        surface:     'Initiative Detail — Artifacts zone',
        description: 'Filled artifact rows now show Edit and Remove actions. Edit opens an inline form to change the title and URL. Remove uses a two-step confirm to soft-delete the link.'
      },
      {
        audience:    'All',
        surface:     'Initiative Detail — Artifacts zone',
        description: 'Legacy ad-hoc attachments that were saved without a gate now appear in the Unscheduled group so they can be edited or removed.'
      }
    ]
  },
  {
    date:          '2026-06-16',
    contractLabel: 'Contract 25 Part 2 follow-on — Ad-hoc artifact attach fix',
    items: [
      {
        audience:    'All',
        surface:     'Initiative Detail — Artifacts zone',
        description: 'The "+ Attach Document" button now saves successfully and the artifact renders inside the gate group it was attached from. Title field carries through as the artifact label. Migration 042 required.'
      }
    ]
  },
  {
    date:          '2026-06-16',
    contractLabel: 'Contract 25 Part 2 — Stage → Gate swap (D-438 Amendment 1)',
    items: [
      {
        audience:    'Admin',
        surface:     'Initiative Artifact Types admin',
        description: 'Renamed from "Artifact Types". Stage column / field / filter removed — gate is the single organizing concept. Sort defaults to Primary Gate ascending. Migration 041 required.'
      },
      {
        audience:    'All',
        surface:     'Initiative Detail — Artifacts zone',
        description: 'Artifact slots now group by primary gate (Brief Review → Close Review) with an Unscheduled group last when populated. Empty groups suppressed. Attach action remains available on every slot.'
      }
    ]
  },
  {
    date:          '2026-06-16',
    contractLabel: 'Contract 25 — Primary Gate model + Activity filter panel + cross-surface chips',
    items: [
      {
        audience:    'Admin',
        surface:     'Artifact Types admin',
        description: 'Suggested Before Gate replaced with Primary Gate plus Gate Warning behavior. Migration 040 required.'
      },
      {
        audience:    'Trio',
        surface:     'Gate submission and approval warnings',
        description: 'Suggested-artifact warnings now follow Primary Gate plus propagation (primary only or primary and subsequent).'
      },
      {
        audience:    'All',
        surface:     'Initiative Activity view',
        description: 'New filter panel — Division, Person, Event type, Date range — with active chip bar and Show Only My Activity preserved.'
      },
      {
        audience:    'All',
        surface:     'Recently Approved Gates view',
        description: 'Initiative chips now open the Initiative detail panel beside the grid instead of routing to the full page.'
      }
    ]
  },
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
