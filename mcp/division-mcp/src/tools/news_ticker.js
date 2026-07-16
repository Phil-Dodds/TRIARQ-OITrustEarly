// news_ticker.js — Bottom news banner feed (positive events).
// Aggregates recent positive activity across domains into a single scrolling
// feed for the app-shell banner. Any authenticated user. Read-only; service
// role reads across tables (RLS bypassed, Arch-1). Each item normalizes to
// { kind, text, asset_ref?, occurred_at }.
//
// v1 sources: gate approvals, new meetings, egg finds, new users. Logins are
// deferred (users.last_login_at updates on every request, so it isn't a clean
// login signal — needs a session-gap heuristic added later).

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
const WINDOW_DAYS = 45;  // only surface reasonably fresh events

async function get_news_ticker(params, caller_user_id) {
  if (!caller_user_id) return { success: false, error: 'Not signed in.' };

  const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
  const items = [];

  // 1. Gate approvals → "[Initiative] passed its [Gate] gate"
  try {
    const { data: approvals } = await supabase
      .from('cycle_event_log')
      .select('delivery_cycle_id, event_metadata, created_at')
      .eq('event_type', 'gate_approved')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    const cycleIds = [...new Set((approvals || []).map(a => a.delivery_cycle_id).filter(Boolean))];
    let titleById = {};
    if (cycleIds.length) {
      const { data: cycles } = await supabase
        .from('delivery_cycles').select('delivery_cycle_id, cycle_title')
        .in('delivery_cycle_id', cycleIds);
      titleById = Object.fromEntries((cycles || []).map(c => [c.delivery_cycle_id, c.cycle_title]));
    }
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
      .gte('created_at', sinceIso)
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
      .gte('found_at', sinceIso)
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
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const u of users || []) {
      items.push({ kind: 'user', text: `${u.display_name} joined OI Trust`, occurred_at: u.created_at });
    }
  } catch (e) { /* ignore */ }

  items.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : a.occurred_at > b.occurred_at ? -1 : 0));
  return { success: true, data: { items: items.slice(0, MAX_ITEMS) } };
}

module.exports = { get_news_ticker };
