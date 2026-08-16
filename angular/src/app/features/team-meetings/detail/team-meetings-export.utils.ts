// team-meetings-export.utils.ts
// Pathways OI Trust — Meeting Collab export (2026-08-13).
//
// Turns a loaded TeamMeeting into one Markdown string, for pasting into an
// email or an AI prompt. Markdown because it is the only format that serves
// both consumers unchanged: it reads as plain text in an email body and it is
// the native input format for a model. A .docx would lose the prompt case, a
// .csv would flatten the hierarchy the meeting exists to express.
//
// Pure functions over data the detail component already holds — no service, no
// MCP call, no new JWT surface.
//
// ARCH-3: this emits CONTENT ONLY. No instruction, framing, or prompt preamble
// belongs in this file — prompt text lives in /skills/. If the export is ever
// asked to lead with something like "Summarise this meeting for an executive",
// that string comes from the skills layer, not from here.

import { TeamMeeting, TeamMeetingBullet, TeamMeetingSection } from '../../../core/types/team-meetings';

/** Rule 4: attribution is shown only when the author is not the presenter. */
function attribution(bullet: TeamMeetingBullet, section: TeamMeetingSection): string {
  const author = bullet.created_by_display_name?.trim();
  if (!author || author === section.title.trim()) { return ''; }
  return ` — ${author}`;
}

/** Rule 5: Initiatives render as name + stage. Never a UUID. */
function initiativeSuffix(bullet: TeamMeetingBullet): string {
  if (!bullet.initiative) { return ''; }
  const { name, stage } = bullet.initiative;
  return stage ? ` [${name} (${stage})]` : ` [${name}]`;
}

/**
 * A bullet's note is free text and may be several lines — the meeting UI shows
 * it as a block under the headline. Each line is indented to the bullet's own
 * depth so Markdown keeps it with its parent rather than starting a new item.
 */
function noteLines(bullet: TeamMeetingBullet, pad: string): string[] {
  const note = bullet.bullet_note?.trim();
  if (!note) { return []; }
  return note.split(/\r?\n/).map(line => `${pad}  ${line.trim()}`);
}

function renderBullet(bullet: TeamMeetingBullet, section: TeamMeetingSection): string[] {
  // Flat indent model (CC-38 f22): 0 = bullet, 1 = sub-bullet.
  const pad  = '  '.repeat(Math.max(0, bullet.indent_level ?? 0));
  const head = `${pad}- **${bullet.text.trim()}**${initiativeSuffix(bullet)}${attribution(bullet, section)}`;
  return [head, ...noteLines(bullet, pad)];
}

/**
 * Date-only strings must not be parsed as UTC and re-rendered in local time —
 * that shifts a meeting into the previous day for anyone west of Greenwich.
 * Split and construct locally instead.
 */
function formatMeetingDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) { return iso; }
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function renderSection(section: TeamMeetingSection): string[] {
  const bullets = [...section.bullets]
    .filter(b => !b.pending && b.text?.trim())          // ghost rows are not content
    .sort((a, b) => a.sort_order - b.sort_order);
  const notes = section.notes?.notes_text?.trim() ?? '';

  // Rule 3: an empty section is omitted. The export is for repurposing, not
  // for reporting who filed nothing.
  if (bullets.length === 0 && !notes) { return []; }

  const out: string[] = [`## ${section.title.trim()}`];
  if (section.sub_label?.trim()) { out.push(`_${section.sub_label.trim()}_`); }
  out.push('');

  for (const bullet of bullets) { out.push(...renderBullet(bullet, section)); }

  if (notes) {
    out.push('', '**Notes / comments**', ...notes.split(/\r?\n/).map(l => l.trim()));
  }
  out.push('');
  return out;
}

/**
 * The meeting as Markdown.
 *
 * Rule 2: `collapsed` is deliberately ignored — it is a view state, not
 * content, so a collapsed section still exports.
 */
export function buildMeetingExport(meeting: TeamMeeting): string {
  const sections = [...meeting.sections]
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap(renderSection);

  const header = [
    `# ${meeting.title.trim()}`,
    '',
    [formatMeetingDate(meeting.meeting_date), meeting.track?.track_name?.trim()]
      .filter(Boolean).join(' · '),
    ''
  ];

  return [...header, ...sections].join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** `bi-weekly-successes-and-retros-2026-08-14.md` */
export function meetingExportFilename(meeting: TeamMeeting): string {
  const slug = meeting.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'meeting';
  return `${slug}-${meeting.meeting_date.slice(0, 10)}.md`;
}
