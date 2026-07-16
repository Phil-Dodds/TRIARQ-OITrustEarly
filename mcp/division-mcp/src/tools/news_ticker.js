// news_ticker.js — Bottom news banner feed (positive events).
// Aggregates recent positive activity across domains into a single scrolling
// feed for the app-shell banner. Any authenticated user. Read-only; service
// role reads across tables (RLS bypassed, Arch-1). Each item normalizes to
// { kind, text, asset_ref?, occurred_at }.
//
// Sources: gate approvals, new meetings, egg finds, new users, status updates,
// status acknowledgements. Logins are deferred (users.last_login_at updates on
// every request, so it isn't a clean login signal — needs a session-gap
// heuristic added later).
//
// Scroll/recycle rule (Phil, 2026-07-16): NO hard age window — take the most
// recent PER_SOURCE from each source, merge newest-first, cap MAX_ITEMS. This
// is a rolling "last N" buffer: as new events arrive the oldest fall off, and
// the feed is never empty while any history exists (the banner then loops the
// current set continuously client-side). Trade-off: on a dead-quiet system old
// events can still show — acceptable now; add a soft "prefer recent, backfill"
// rule later if it feels stale.

'use strict';

const { supabase } = require('../db');

const GATE_LABELS = {
  brief_review:  'Brief Review',
  go_to_build:   'Go to Build',
  go_to_deploy:  'Go to Deploy',
  go_to_release: 'Go to Release',
  close_review:  'Close Review'
};

const PER_SOURCE = 12;   // pull up to N recent from each source
const MAX_ITEMS  = 30;   // cap the merged feed

// Resolve delivery_cycle titles for a set of cycle ids.
async function titlesFor(cycleIds) {
  const ids = [...new Set((cycleIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data } = await supabase
    .from('delivery_cycles').select('delivery_cycle_id, cycle_title').in('delivery_cycle_id', ids);
  return Object.fromEntries((data || []).map(c => [c.delivery_cycle_id, c.cycle_title]));
}

async function get_news_ticker(params, caller_user_id) {
  if (!caller_user_id) return { success: false, error: 'Not signed in.' };

  const items = [];

  // 1. Gate approvals → "[Initiative] passed its [Gate] gate"
  try {
    const { data: approvals } = await supabase
      .from('cycle_event_log')
      .select('delivery_cycle_id, event_metadata, created_at')
      .eq('event_type', 'gate_approved')
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    const titleById = await titlesFor((approvals || []).map(a => a.delivery_cycle_id));
    for (const a of approvals || []) {
      const title = titleById[a.delivery_cycle_id];
      const gate = GATE_LABELS[a.event_metadata?.gate_name] || 'a';
      if (title) {
        items.push({ kind: 'gate', text: `${title} passed its ${gate} gate`, occurred_at: a.created_at });
      }
    }
  } catch (e) { /* one source failing must not sink the feed */ }

  // 2. New meetings → "[Creator] created a new meeting"
  try {
    const { data: meetings } = await supabase
      .from('team_meetings')
      .select('title, created_at, created_by, users:created_by(display_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const m of meetings || []) {
      const who = m.users?.display_name || 'Someone';
      items.push({ kind: 'meeting', text: `${who} created a new meeting`, occurred_at: m.created_at });
    }
  } catch (e) { /* ignore */ }

  // 3. Egg finds → "[Name] found an egg" (+ egg image)
  try {
    const { data: finds } = await supabase
      .from('user_egg_finds')
      .select('found_at, users:user_id(display_name), easter_eggs:egg_id(asset_ref)')
      .is('deleted_at', null)
      .order('found_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const f of finds || []) {
      const who = f.users?.display_name || 'Someone';
      items.push({ kind: 'egg', text: `${who} found an egg`, asset_ref: f.easter_eggs?.asset_ref || null, occurred_at: f.found_at });
    }
  } catch (e) { /* ignore */ }

  // 4. New users → "[Name] joined OI Trust"
  try {
    const { data: users } = await supabase
      .from('users')
      .select('display_name, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const u of users || []) {
      items.push({ kind: 'user', text: `${u.display_name} joined OI Trust`, occurred_at: u.created_at });
    }
  } catch (e) { /* ignore */ }

  // 5. Status updates → "[Name] posted a status update on [Initiative]"
  try {
    const { data: updates } = await supabase
      .from('initiative_status_updates')
      .select('initiative_id, saved_at, users:saved_by(display_name)')
      .order('saved_at', { ascending: false })
      .limit(PER_SOURCE);
    const titleById = await titlesFor((updates || []).map(u => u.initiative_id));
    for (const u of updates || []) {
      const who = u.users?.display_name || 'Someone';
      const title = titleById[u.initiative_id];
      items.push({
        kind: 'status',
        text: title ? `${who} posted a status update on ${title}` : `${who} posted a status update`,
        occurred_at: u.saved_at
      });
    }
  } catch (e) { /* ignore */ }

  // 6. Status acknowledgements → "[Name] acknowledged a status update"
  try {
    const { data: acks } = await supabase
      .from('initiative_status_acknowledgments')
      .select('acknowledged_at, users:acknowledged_by(display_name)')
      .order('acknowledged_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const a of acks || []) {
      const who = a.users?.display_name || 'Someone';
      items.push({ kind: 'ack', text: `${who} acknowledged a status update`, occurred_at: a.acknowledged_at });
    }
  } catch (e) { /* ignore */ }

  items.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : a.occurred_at > b.occurred_at ? -1 : 0));
  return { success: true, data: { items: items.slice(0, MAX_ITEMS) } };
}

module.exports = { get_news_ticker };
