// outlook-import.ts — Pathways OI Trust (Contract 38 f20)
// Parses a dropped Outlook .msg (meeting invite OR email) IN THE BROWSER —
// the file never leaves the machine. Meeting invite (IPM.Appointment):
// name, weekly cadence on the meeting's ET weekday, meeting time (ET),
// To-line = presenters, CC = members. Email (IPM.Note): name + participants
// only (an email has no schedule). One-time meetings still default to a
// weekly cadence per Phil's rule.

import MsgReader from '@kenjiuno/msgreader';
import { MeetingCadence } from '../../../core/types/team-meetings';

export interface OutlookImport {
  kind:          'meeting' | 'email';
  series_name:   string;
  cadence:       MeetingCadence | null;
  meeting_time:  string | null;          // 'HH:MM' Eastern Time
  weekday_label: string | null;
  /** Presenters (To line). */
  presenter_emails: string[];
  /** Everyone to invite (To + CC + sender), deduplicated. */
  invite_emails:    string[];
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function etWallClock(d: Date): { weekday: number; hhmm: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) { parts[p.type] = p.value; }
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts['weekday']);
  return { weekday, hhmm: `${String(Number(parts['hour']) % 24).padStart(2, '0')}:${parts['minute']}` };
}

function cleanSubject(s: string): string {
  return (s || '')
    .replace(/^\s*(re|fw|fwd)\s*:\s*/i, '')
    .replace(/\s*\(Microsoft Teams Meeting\)\s*$/i, '')
    .trim();
}

function smtp(r: { email?: string; smtpAddress?: string }): string | null {
  const e = (r.smtpAddress || '').trim() || (r.email || '').trim();
  // X.500 exchange DNs are not usable addresses — only keep real SMTP.
  return e && e.includes('@') && !e.startsWith('/') ? e.toLowerCase() : null;
}

/** Throws Error with a user-readable message on unusable files. */
export async function parseOutlookDrop(file: File): Promise<OutlookImport> {
  if (!/\.msg$/i.test(file.name)) {
    throw new Error('Drop an Outlook item (.msg) — drag the meeting or email straight from Outlook.');
  }
  const buf = await file.arrayBuffer();
  let data: any;
  try {
    data = new (MsgReader as any)(buf).getFileData();
  } catch {
    throw new Error('Could not read that file as an Outlook item. Re-drag it directly from Outlook.');
  }

  const messageClass: string = data?.messageClass || '';
  const isMeeting = /^IPM\.(Appointment|Schedule\.Meeting)/i.test(messageClass);
  const isEmail   = /^IPM\.Note/i.test(messageClass);
  if (!isMeeting && !isEmail) {
    throw new Error(`That Outlook item type isn't supported (${messageClass || 'unknown'}). Drop a meeting invite or an email.`);
  }

  const series_name = cleanSubject(data.subject || data.normalizedSubject || '');
  if (!series_name) {
    throw new Error('The Outlook item has no subject — add one or type the series name manually.');
  }

  const toEmails = new Set<string>();
  const allEmails = new Set<string>();
  for (const r of data.recipients || []) {
    const e = smtp(r);
    if (!e) { continue; }
    allEmails.add(e);
    if ((r.recipType || 'to').toLowerCase() === 'to') { toEmails.add(e); }
  }
  const sender = (data.creatorSMTPAddress || data.senderEmail || '').toLowerCase();
  if (sender.includes('@') && !sender.startsWith('/')) { allEmails.add(sender); }

  let cadence: MeetingCadence | null = null;
  let meeting_time: string | null = null;
  let weekday_label: string | null = null;
  if (isMeeting) {
    const startRaw = data.apptStartWhole || data.clipStart || null;
    const start = startRaw ? new Date(startRaw) : null;
    if (start && !isNaN(start.getTime())) {
      const et = etWallClock(start);
      cadence       = { type: 'weekly', day_of_week: et.weekday } as MeetingCadence;
      meeting_time  = et.hhmm;
      weekday_label = WEEKDAYS[et.weekday] ?? null;
    }
  }

  return {
    kind: isMeeting ? 'meeting' : 'email',
    series_name,
    cadence,
    meeting_time,
    weekday_label,
    presenter_emails: [...toEmails],
    invite_emails:    [...allEmails]
  };
}
