# Build C Visual and Layout Standards
Pathways OI Trust | Build C | April 2026 | CONFIDENTIAL
<!-- SECTION-H: passthrough to for-ClaudeCode.zip — do not edit -->

---

## Purpose

This document translates the prototype slides into precise layout rules, spacing standards, and visual treatment requirements for every Build C surface. The prototype images (BuildC-Screen1 through Screen4) are included in this zip — view them alongside this document.

The prototype is the visual target. Where this document and the prototype disagree, raise it. Where this document is silent, match the prototype. Where both are silent, apply the system-wide layout rules in Section 1.

---

## 1. System-Wide Layout Rules

These apply to every screen and component in the application.

### 1.1 Shell Structure

```
┌─────────────────────────────────────────────────────┐
│ Top Nav Bar (full width, Deep Navy #12274A, 64px h) │
├──────────────┬──────────────────────────────────────┤
│ Left Sidebar │ Main Content Area                    │
│ 200px wide   │ flex-1, light gray bg (#F5F5F5)      │
│ Dark (#1a2f4e│                                      │
│ )            │                                      │
└──────────────┴──────────────────────────────────────┘
```

- Top nav: Deep Navy background, white text, Roboto Medium 16px. Active nav item has Vital Blue (#0071AF) underline indicator. User avatar circle top right (40px, primary color background, white initials).
- Left sidebar: slightly lighter than Deep Navy — `#1a2f4e`. White text for nav items, 14px Roboto Regular. Active item: left border 3px Oravive (#E96127), background `rgba(255,255,255,0.08)`. Nav item height: 44px. Icon + label inline, 16px gap. Sidebar never collapses on desktop.
- Main content: light gray background `#F5F5F5`. Content starts below the top nav.

### 1.2 Page Header Zone

Every main content page opens with a header zone:

```
Page Title (h4 — 28px Roboto Bold, #1E1E1E)          [Primary Action Button →]
Subtitle / description (14px Roboto Regular, #5A5A5A, italic in prototype)
```

- Page title left-aligned, 24px top padding, 0px bottom padding.
- Subtitle immediately below, 4px gap from title.
- Primary action button (e.g. "+ New Cycle", "+ New Workstream"): right-aligned, same vertical center as title. Background `--triarq-color-primary` (#257099), white text, Roboto Medium 14px, border-radius 5px, padding 10px 20px.
- 16px gap between header zone and first content element below it.

### 1.3 Content Cards and Tables

- White background cards: background `#FFFFFF`, border-radius 8px, box-shadow `0 1px 3px rgba(0,0,0,0.08)`.
- Table header row: Deep Navy background (#12274A), white text, Roboto Medium 13px, uppercase, 12px vertical padding.
- Table rows: white background, 1px bottom border `#E8E8E8`, 16px vertical padding. Row height approximately 72px for rows with sub-content (tier badge + headline), 56px for simple rows.
- Row hover: background `#F0F4F8`.
- Selected/active row: background `#E8F0FE`, left border 3px `--triarq-color-primary`.

### 1.4 Right Panel

- Width: 60% of viewport on wide screens (≥1280px). 100% on narrow.
- Left edge: thin 1px border `#E0E0E0`.
- Background: white.
- Panel header: Deep Navy background, white text. Cycle title in h5 (24px Roboto Bold). Stage badge and Tier badge top right of header, inline.
- Panel body: 24px padding all sides.
- Left list panel (when right panel is open): 40% width, shows condensed list. Selected item highlighted as above.

### 1.5 Typography Scale (D-151)

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title (h4) | 28px | Bold | #1E1E1E |
| Panel title (h5) | 24px | Bold | white (on dark) / #1E1E1E (on light) |
| Section label | 20px | SemiBold | #1E1E1E |
| Body / row content | 14px | Regular | #262626 |
| Secondary / metadata | 13px | Regular | #5A5A5A |
| Field label | 13px | Medium | #5A5A5A |
| Caption / note | 12px | Regular | #5A5A5A |

All text: Roboto. Never Gill Sans or Lato in the Angular application.

### 1.6 Spacing Scale

Use multiples of 4px. Common values:
- 4px — between inline elements (icon + label)
- 8px — between a label and its value
- 12px — between form fields within a group
- 16px — between distinct content sections within a panel
- 24px — panel body padding; between major sections on a page
- 32px — between page-level sections

### 1.7 Badges and Pills

**Stage badge** (on dashboard row and panel header):
- Background: `--triarq-color-primary` (#257099)
- Text: white, Roboto Medium 12px, uppercase
- Border-radius: 4px (not pill — this is a status badge, not a tag)
- Padding: 3px 8px

**Tier badge**:
- Tier 1: light blue background `#E3F2FD`, text `#1565C0`
- Tier 2: light teal background `#E0F2F1`, text `#00695C`
- Tier 3: light orange background `#FFF3E0`, text `#E65100`
- Border-radius: 4px, padding 3px 8px, Roboto Medium 12px

**Active/Inactive status pill**:
- Active: green border `#2E7D32`, green text `#2E7D32`, white background, border 1.5px
- Inactive: gray border `#9E9E9E`, gray text `#757575`, white background
- Border-radius: radius-pill (999px), padding 4px 12px

**Gate status text** (not a badge — plain text, right-aligned):
- Complete: `--triarq-color-primary` (#257099), bold
- Pending: `--triarq-color-sunray` (#F2A620), bold
- Not Started: #9E9E9E, regular

---

## 2. Dashboard Screen (Screen 1)

**Reference:** BuildC-Screen1-Dashboard.jpg

### 2.1 Workstream Filter Bar

Immediately below the page header description text:
- Pill-style filter buttons in a horizontal row
- "All Workstreams" default selected: filled Deep Navy background, white text
- Other workstreams: white background, Deep Navy border 1.5px, Deep Navy text
- Border-radius: radius-pill (999px)
- Padding: 8px 20px, Roboto Medium 13px
- 8px gap between pills
- 16px gap below filter bar before table header

### 2.2 Dashboard Table

Column widths (approximate, based on prototype):
- Avatar circle: 40px fixed
- Cycle Name (title + tier badge): ~28% of remaining width
- Headline Status: ~25%
- Lifecycle Stage (Stage Track condensed): ~18%
- Pilot Start Date: ~12%
- Release Start Date: ~12%

**Cycle Name cell:**
- Cycle title: 14px Roboto SemiBold, #1E1E1E
- Tier badge immediately below title, 4px gap

**Headline Status cell:**
- Normal: 14px Roboto Regular #262626
- Overdue: Oravive (#E96127), same size
- Pending/awaiting: Sunray (#F2A620), same size

**Stage Track condensed** (in Lifecycle Stage cell):
- "Sta" label + current stage name as text above the track (13px, #5A5A5A)
- 5 diamond nodes in a horizontal row, 24px each
- Complete gates: filled `--triarq-color-primary`
- Current/pending gate: filled Sunray (#F2A620)
- Overdue gate: filled Oravive (#E96127)
- Upcoming gates: outline only, #D0D0D0
- 8px gap between diamonds

**Avatar circle** (leftmost column):
- 40px diameter
- Colors vary by workstream — use workstream's assigned color or generate from name hash
- White 2-letter initials, Roboto Medium 14px

### 2.3 Row Spacing

- Row height: ~88px (accommodates title + tier badge + comfortable padding)
- 16px vertical padding top and bottom of row content
- Horizontal padding: 16px left of avatar, 16px right of last column

---

## 3. Cycle Detail View — Right Panel (Screen 2)

**Reference:** BuildC-Screen2-CycleDetail.jpg

### 3.1 Panel Header

- Full-width Deep Navy background, 64px height
- Cycle title: Roboto Bold 20px, white, left-aligned with 20px left padding
- Stage badge and Tier badge: right side, 20px right padding, vertically centered
- Stage badge: `--triarq-color-primary` background as described in 1.7
- Tier badge: as described in 1.7

### 3.2 Stage Track (Full Mode)

Immediately below panel header, light gray background zone (~80px height):
- 10 stage nodes (circles, 28px diameter) + 5 gate nodes (diamonds, 24px) between them
- Horizontal connecting line, 2px, fills with `--triarq-color-primary` up to current stage
- Stage labels below each node: 10px Roboto Regular, #5A5A5A, centered
- Gate labels above each diamond: 10px Roboto Regular, #5A5A5A, centered (two lines e.g. "Brief\nReview")
- Current stage node: filled `--triarq-color-primary`, 2px white ring inside border
- Complete stage nodes: filled `--triarq-color-primary`, checkmark icon
- Pending gate diamond: filled Sunray (#F2A620)
- Upcoming nodes/diamonds: white fill, `#D0D0D0` border
- 20px horizontal padding each side of track
- 12px padding above and below track within its zone

### 3.3 Outcome Statement Zone

Below Stage Track, 16px top gap:
- Section label "OUTCOME STATEMENT": 11px Roboto Medium, uppercase, letter-spacing 1px, #5A5A5A
- When populated: amber bordered box (border 1.5px `--triarq-color-sunray`, background `#FFFBF0`, border-radius 6px, 12px padding). Text: 14px Roboto Regular Italic, #262626.
- When null: same box with amber warning text — "No Outcome Statement set. Required before Brief Review gate." Text Sunray color, italic.

### 3.4 Identity Fields Zone

Below Outcome Statement, 16px gap. Two-column grid:

| Left column | Right column |
|-------------|--------------|
| Domain Strategist | Capability Builder |
| Delivery Workstream | Jira Epic Link |
| Division Assignment | Tier Classification |

- Field label: 13px Roboto Medium, #5A5A5A
- Field value: 14px Roboto Regular, #1E1E1E
- 8px gap between label and value
- 20px gap between rows in the grid
- Named entity values (DS, CB, Workstream, Division): tappable — render as subtle link color (`--triarq-color-primary`), underline on hover. Opens entity detail in same right panel slot.

### 3.5 Gates and Milestone Dates Section

Section header bar: Deep Navy background, white text "GATES & MILESTONE DATES", 13px Roboto Medium uppercase, 12px padding, letter-spacing 1px.

Each gate row (5 rows):
- Diamond icon (20px) in gate's status color: primary (complete), sunray (pending), gray (not started)
- Gate name: 14px Roboto SemiBold, #1E1E1E
- Milestone date label: 13px #5A5A5A
- Target date: 14px #262626
- Actual date: 14px #262626 (or "—" in #9E9E9E if not set)
- Status text: right-aligned, colored as per 1.7
- Row: 16px vertical padding, 1px bottom border #E8E8E8

---

## 4. Gate Approval Screen (Screen 3)

**Reference:** BuildC-Screen3-GateApproval.jpg

### 4.1 Queue Cards (Left Panel)

Each pending gate renders as a card:
- White background, border-radius 8px, box-shadow as per 1.3
- 16px padding all sides
- Gate diamond icon (28px) + gate name badge (Sunray background, white text, same badge style as stage badge) — inline, top of card
- Cycle title: 16px Roboto Bold, #1E1E1E, below gate name, 8px gap
- Metadata: 13px #5A5A5A — "Division · Tier · [status summary]"
- Target date: 13px #5A5A5A
- "Review" button: right-aligned, `--triarq-color-primary` background, white text, 36px height, border-radius 5px
- Selected card: left border 3px `--triarq-color-primary`, background `#F0F4FF`
- 12px gap between cards

### 4.2 Gate Detail Panel (Right)

- Panel header: Deep Navy, "Gate Detail — [Gate Name]", white Roboto Bold 18px
- Cycle name below header: 16px Roboto Bold #1E1E1E, with gate diamond icon inline
- Checklist items: each as a row with green filled circle checkmark (20px) + item text 14px #262626
  - 1px bottom border #E8E8E8, 14px vertical padding
  - All-green when all items verified
- Approve button: full-width, Deep Navy background (#12274A), white text, Roboto Bold 15px, checkmark icon left, 14px height, border-radius 6px. Text: "✓ Approve — Lifecycle stage advances to [NEXT STAGE] automatically"
- Return button: full-width, white background, Oravive border 1.5px, Oravive text (#E96127), same size. Text: "↩ Return to Submitter with feedback"
- 12px gap between buttons
- Footnote: 12px italic #5A5A5A below Return button

---

## 5. Workstream Registry Screen (Screen 4)

**Reference:** BuildC-Screen4-WorkstreamRegistry.jpg

### 5.1 Table Layout

Column widths (approximate):
- Avatar circle: 56px fixed (two-letter initials, larger than dashboard — 44px diameter)
- Workstream Name: ~30%
- Home Division: ~20%
- Workstream Lead: ~15%
- Active Cycle Count: ~12% — value in `--triarq-color-primary`, Roboto Medium (e.g. "3 active")
- Active Status: ~13% — pill badge as per 1.7

Row height: ~72px. Avatar circle colored per workstream, white initials, Roboto Medium 16px.

### 5.2 Inactive Workstream Warning Band

Full-width band below the inactive workstream row:
- Background: `#FFF8E1` (very light amber)
- Left border: 4px solid Sunray (#F2A620)
- Padding: 12px 20px
- Primary text: Roboto Bold 14px, Sunray (#F2A620) — "Inactive workstream — gate advancement blocked on all assigned cycles."
- Secondary text: Roboto Regular 13px, #5A5A5A — "Reassign active cycles to a different workstream before any gate can be approved. No grace period."

---

## 6. Create Cycle Form — Right Panel (supplement to CorrectionSpec)

**Reference:** No prototype slide exists for the create form specifically. Apply the panel layout rules from Section 1.4 and the following.**

### 6.1 Form Layout Within Right Panel

- Panel header: Deep Navy, "New Delivery Cycle", white Roboto Bold 20px. No badges in header.
- Body: 24px padding all sides.
- Form fields stack vertically, 16px gap between each field.
- Field label above input: 13px Roboto Medium, #5A5A5A. Required indicator: asterisk (*) in Oravive (#E96127) immediately after label.
- Input fields: white background, 1.5px border #D0D0D0, border-radius 5px, 10px padding, 14px Roboto Regular, full width of panel body. Focus state: border `--triarq-color-primary`, box-shadow `0 0 0 3px rgba(37,112,153,0.15)`.
- Dropdown: same as input, chevron icon right side.
- Radio group (Tier Classification): horizontal layout. Each option: radio circle + label inline, 24px gap between options.
- Textarea (Outcome Statement): min-height 80px, same border treatment as inputs. Resize vertical only.
- Amber inline warning (below Outcome Statement): `#FFF8E1` background, `#F2A620` left border 3px, 10px padding, 12px Roboto Regular italic, #5A5A5A text. Full width.
- Gate requirement notes (below DS, CB, Jira fields): 12px Roboto Regular italic, #9E9E9E. No border — plain text.

### 6.2 Form Footer

- 24px gap above footer from last field.
- 1px top border #E8E8E8.
- Two buttons right-aligned, 12px gap between them:
  - Cancel: white background, #D0D0D0 border, #5A5A5A text, Roboto Medium 14px, border-radius 5px, padding 10px 20px.
  - Create Delivery Cycle: `--triarq-color-primary` background, white text, Roboto Medium 14px, border-radius 5px, padding 10px 24px.

---

## 7. How to Use This Document

1. Read this document alongside the four prototype images before implementing any Build C screen.
2. For each surface: match the layout rules first, then apply the design tokens, then verify against the prototype image visually.
3. Where you make a deliberate deviation from these rules (e.g. because a layout rule conflicts with a working implementation decision): record it as a CC-decision before session close.
4. Where the prototype and this document conflict: this document takes precedence for spacing and token values; the prototype takes precedence for proportions and visual hierarchy that this document doesn't explicitly specify.

---

*Pathways OI Trust · Empower | Optimize | Partner · CONFIDENTIAL · April 2026*
