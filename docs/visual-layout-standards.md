Build C Visual and Layout Standards
Pathways OI Trust | Build C | April 2026 | CONFIDENTIAL
<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

---
Purpose
This document translates the prototype slides into precise layout rules, spacing standards, and visual treatment requirements for every Build C surface.
The prototype is the visual target. Where this document and the prototype disagree, raise it. Where this document is silent, match the prototype. Where both are silent, apply the system-wide layout rules in Section 1.

---
1. System-Wide Layout Rules

1.1 Shell Structure
Top nav: Deep Navy background (#12274A), white text, Roboto Medium 16px. 64px height.
Left sidebar: #1a2f4e. White text, 14px Roboto Regular. Active item: left border 3px Oravive (#E96127), background rgba(255,255,255,0.08). Nav item height: 44px.
Main content: light gray background #F5F5F5.

1.2 Page Header Zone
Page title: h4, 28px Roboto Bold, #1E1E1E, left-aligned, 24px top padding.
Subtitle: 14px Roboto Regular, #5A5A5A, italic. 4px gap from title.
Primary action button: right-aligned, --triarq-color-primary (#257099), white text, Roboto Medium 14px, border-radius 5px, padding 10px 20px.
16px gap between header zone and first content element.

1.3 Content Cards and Tables
White background cards: background #FFFFFF, border-radius 8px, box-shadow 0 1px 3px rgba(0,0,0,0.08).
Table header row: Deep Navy background (#12274A), white text, Roboto Medium 13px, uppercase, 12px vertical padding.
Table rows: white background, 1px bottom border #E8E8E8, 16px vertical padding. Row height ~72px simple / ~88px with sub-content.
Row hover: background #F0F4F8.
Selected/active row: background #E8F0FE, left border 3px --triarq-color-primary.

1.4 Right Panel
Width: 60% of viewport on wide screens (>=1280px). 100% on narrow.
Left edge: thin 1px border #E0E0E0.
Background: white.
Panel header: Deep Navy background, white text. Cycle title h5 (24px Roboto Bold). Stage badge and Tier badge top right, inline.
Panel body: 24px padding all sides.

1.5 Typography Scale
Page title (h4): 28px Bold #1E1E1E
Panel title (h5): 24px Bold white (on dark) / #1E1E1E (on light)
Section label: 20px SemiBold #1E1E1E
Body / row content: 14px Regular #262626
Secondary / metadata: 13px Regular #5A5A5A
Field label: 13px Medium #5A5A5A
Caption / note: 12px Regular #5A5A5A
All text: Roboto. Never Gill Sans or Lato in the Angular application.

1.6 Spacing Scale (multiples of 4px)
4px — between inline elements
8px — between label and value
12px — between form fields within a group
16px — between distinct content sections within a panel
24px — panel body padding; between major sections
32px — between page-level sections

1.7 Badges and Pills
Stage badge: background --triarq-color-primary (#257099), white text, Roboto Medium 12px uppercase, border-radius 4px, padding 3px 8px.
Tier badge: Tier 1: #E3F2FD bg / #1565C0 text. Tier 2: #E0F2F1 bg / #00695C text. Tier 3: #FFF3E0 bg / #E65100 text. Border-radius 4px, padding 3px 8px, Roboto Medium 12px.
Active/Inactive pill: Active: green border #2E7D32, green text, white bg, border 1.5px. Inactive: gray border #9E9E9E, gray text. Border-radius 999px, padding 4px 12px.
Gate status text (not a badge — plain text, right-aligned): Complete: --triarq-color-primary bold. Pending: --triarq-color-sunray (#F2A620) bold. Not Started: #9E9E9E regular.

---
2. Dashboard Screen

2.1 Workstream Filter Bar
Pill-style filter buttons. "All Workstreams" selected: filled Deep Navy, white text. Others: white bg, Deep Navy border 1.5px. Border-radius 999px. Padding 8px 20px, Roboto Medium 13px. 8px gap between pills. 16px gap below bar before table header.

2.2 Dashboard Table Column Widths (approximate)
Avatar circle: 40px fixed
Cycle Name (title + tier badge): ~28%
Headline Status: ~25%
Lifecycle Stage (Stage Track condensed): ~18%
Pilot Start Date: ~12%
Release Start Date: ~12%

Cycle Name cell: title 14px Roboto SemiBold #1E1E1E. Tier badge below, 4px gap.
Stage Track condensed: "Sta" label + stage name above track (13px #5A5A5A). 5 diamond nodes 24px. Complete: filled primary. Current/pending: filled Sunray. Overdue: filled Oravive. Upcoming: outline #D0D0D0. 8px gap between diamonds.
Avatar: 40px diameter, workstream color, white 2-letter initials, Roboto Medium 14px.

2.3 Row Spacing
Row height ~88px. 16px vertical padding top and bottom. 16px horizontal padding.

---
3. Cycle Detail View — Right Panel

3.1 Panel Header
Full-width Deep Navy, 64px height. Cycle title: Roboto Bold 20px, white, left-aligned, 20px left padding. Stage badge and Tier badge: right side, 20px right padding, vertically centered. Badge sizing per 1.7.

3.2 Stage Track (Full Mode)
Light gray background zone, ~80px height. 10 stage nodes (circles 28px) + 5 gate diamonds (24px). Horizontal connecting line 2px fills with primary up to current stage. Stage labels below nodes: 10px Roboto Regular #5A5A5A centered. Gate labels above diamonds: 10px Roboto Regular #5A5A5A centered, two lines. Current stage: filled primary, 2px white inner ring. Complete: filled primary, checkmark. Pending gate: filled Sunray. Upcoming: white fill #D0D0D0 border. 20px horizontal padding each side. 12px padding above and below within zone. NO horizontal scroll — compress node spacing to fit.

3.3 Outcome Statement Zone
Section label "OUTCOME STATEMENT": 11px Roboto Medium uppercase letter-spacing 1px #5A5A5A.
When populated: border 1.5px --triarq-color-sunray (#F2A620), background #FFFBF0, border-radius 6px, 12px padding. Text: 14px Roboto Regular Italic #262626.
When null: same box. Warning text: "No Outcome Statement set. Required before Brief Review gate." Sunray color, italic.
This is a nudge, not an error. Use Sunray (#F2A620) only — not Oravive.

3.4 Identity Fields Zone
Two-column grid. Left: Domain Strategist / Delivery Workstream / Division Assignment. Right: Capability Builder / Jira Epic Link / Tier Classification. Field label: 13px Roboto Medium #5A5A5A. Value: 14px Roboto Regular #1E1E1E. 8px label-value gap. 20px between rows. Named entities: tappable, primary color, underline on hover.

3.5 Gates and Milestone Dates Section
Section header bar: Deep Navy bg, white text "GATES & MILESTONE DATES", 13px Roboto Medium uppercase, 12px padding, letter-spacing 1px.
Each gate row: Diamond icon 20px in gate status color. Gate name: 14px Roboto SemiBold #1E1E1E. Milestone date label: 13px #5A5A5A. Target date: 14px #262626 (user-editable). Actual date: 14px #262626 or "—" in #9E9E9E (system-set, not editable). Status text: right-aligned, colored per 1.7. Row: 16px vertical padding, 1px bottom border #E8E8E8.
Gate status is display-only — no dropdown. Status derived from date state model.

---
4. Gate Approval Screen

4.1 Queue Cards
White bg, border-radius 8px, box-shadow per 1.3. 16px padding. Gate diamond 28px + gate name badge (Sunray bg, white text) inline. Cycle title: 16px Roboto Bold #1E1E1E, 8px below. Metadata: 13px #5A5A5A. "Review" button: primary bg, white text, 36px height, border-radius 5px. Selected: left border 3px primary, bg #F0F4FF. 12px gap between cards.

4.2 Gate Detail Panel
Header: Deep Navy, gate name, white Roboto Bold 18px. Approve button: full-width, Deep Navy bg, white text, Roboto Bold 15px, checkmark icon, border-radius 6px. Return button: full-width, white bg, Oravive border 1.5px, Oravive text. 12px gap between buttons.

---
5. Workstream Registry Screen

5.1 Table Layout
Avatar: 56px fixed (44px diameter). Workstream Name ~30%. Home Division ~20%. Workstream Lead ~15%. Active Cycle Count ~12% (primary color, Roboto Medium). Active Status ~13% (pill badge per 1.7). Row height ~72px.

5.2 Inactive Workstream Warning Band
Full-width band. Background #FFF8E1. Left border 4px solid Sunray. Padding 12px 20px. Primary text: Roboto Bold 14px Sunray — "Inactive workstream — gate advancement blocked on all assigned cycles." Secondary text: 13px #5A5A5A.

---
6. Create Cycle Form — Right Panel

6.1 Form Layout
Panel header: Deep Navy, "New Delivery Cycle", white Roboto Bold 20px. Body: 24px padding. Fields stack vertically, 16px gap. Label above input: 13px Roboto Medium #5A5A5A. Required: asterisk (*) in Oravive. Inputs: white bg, 1.5px border #D0D0D0, border-radius 5px, 10px padding, 14px Roboto Regular, full width. Focus: border primary, box-shadow 0 0 0 3px rgba(37,112,153,0.15). Amber inline warning: #FFF8E1 bg, #F2A620 left border 3px, 10px padding, 12px Roboto Regular italic.

6.2 Form Footer
24px gap above. 1px top border #E8E8E8. Two buttons right-aligned, 12px gap. Cancel: white bg, #D0D0D0 border, #5A5A5A text, border-radius 5px, padding 10px 20px. Create: primary bg, white text, border-radius 5px, padding 10px 24px.

---
7. How to Use This Document
Read alongside the four prototype images before implementing any Build C screen. Match layout rules first, then design tokens, then verify against prototype. Deviations: record as CC-decision.
Where prototype and this document conflict: this document takes precedence for spacing and token values; prototype takes precedence for proportions and visual hierarchy not explicitly specified here.

---
Pathways OI Trust · Empower | Optimize | Partner · CONFIDENTIAL · April 2026
