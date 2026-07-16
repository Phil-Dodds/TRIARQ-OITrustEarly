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
// Scroll/window rule (Phil, 2026-07-16): each category surfaces only its last
// WINDOW_DAYS of activity, most-recent PER_SOURCE, merged newest-first, capped
// MAX_ITEMS. If nothing falls in the window the feed is empty and the banner
// goes quiet — that's acceptable. Windows are PER-CATEGORY so different event
// types can use different freshness (e.g. logins, when added, will use a ~30
// MINUTE window instead of days — see WINDOW_MINUTES hook below).

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

// Per-category freshness. Days for the current sources; minutes reserved for
// future short-lived events (logins → ~30 min so "just logged in" stays true).
const WINDOW_DAYS = { gate: 14, meeting: 14, egg: 14, user: 14, status: 14, ack: 14 };
// const WINDOW_MINUTES = { login: 30 };  // when logins are added
const cutoffDays = (days) => new Date(Date.now() - days * 86400000).toISOString();

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
      .select('id, delivery_cycle_id, event_metadata, created_at')
      .eq('event_type', 'gate_approved')
      .gte('created_at', cutoffDays(WINDOW_DAYS.gate))
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    const titleById = await titlesFor((approvals || []).map(a => a.delivery_cycle_id));
    for (const a of approvals || []) {
      const title = titleById[a.delivery_cycle_id];
      const gate = GATE_LABELS[a.event_metadata?.gate_name] || 'a';
      if (title) {
        items.push({ kind: 'gate', news_item_key: `gate:${a.id}`, text: `${title} passed its ${gate} gate`, occurred_at: a.created_at });
      }
    }
  } catch (e) { /* one source failing must not sink the feed */ }

  // 2. New meetings → "[Creator] created a new meeting"
  try {
    const { data: meetings } = await supabase
      .from('team_meetings')
      .select('id, title, created_at, created_by, users:created_by(display_name)')
      .is('deleted_at', null)
      .gte('created_at', cutoffDays(WINDOW_DAYS.meeting))
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const m of meetings || []) {
      const who = m.users?.display_name || 'Someone';
      items.push({ kind: 'meeting', news_item_key: `meeting:${m.id}`, text: `${who} created a new meeting`, occurred_at: m.created_at });
    }
  } catch (e) { /* ignore */ }

  // 3. Egg finds → "[Name] found an egg" (+ egg image)
  try {
    const { data: finds } = await supabase
      .from('user_egg_finds')
      .select('id, found_at, users:user_id(display_name), easter_eggs:egg_id(asset_ref)')
      .is('deleted_at', null)
      .gte('found_at', cutoffDays(WINDOW_DAYS.egg))
      .order('found_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const f of finds || []) {
      const who = f.users?.display_name || 'Someone';
      items.push({ kind: 'egg', news_item_key: `egg:${f.id}`, text: `${who} found an egg`, asset_ref: f.easter_eggs?.asset_ref || null, occurred_at: f.found_at });
    }
  } catch (e) { /* ignore */ }

  // 4. New users → "[Name] joined OI Trust"
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, created_at')
      .is('deleted_at', null)
      .gte('created_at', cutoffDays(WINDOW_DAYS.user))
      .order('created_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const u of users || []) {
      items.push({ kind: 'user', news_item_key: `user:${u.id}`, text: `${u.display_name} joined OI Trust`, occurred_at: u.created_at });
    }
  } catch (e) { /* ignore */ }

  // 5. Status updates → "[Name] posted a status update on [Initiative]"
  try {
    const { data: updates } = await supabase
      .from('initiative_status_updates')
      .select('id, initiative_id, saved_at, users:saved_by(display_name)')
      .gte('saved_at', cutoffDays(WINDOW_DAYS.status))
      .order('saved_at', { ascending: false })
      .limit(PER_SOURCE);
    const titleById = await titlesFor((updates || []).map(u => u.initiative_id));
    for (const u of updates || []) {
      const who = u.users?.display_name || 'Someone';
      const title = titleById[u.initiative_id];
      items.push({
        kind: 'status',
        news_item_key: `status:${u.id}`,
        text: title ? `${who} posted a status update on ${title}` : `${who} posted a status update`,
        occurred_at: u.saved_at
      });
    }
  } catch (e) { /* ignore */ }

  // 6. Status acknowledgements → "[Name] acknowledged a status update"
  try {
    const { data: acks } = await supabase
      .from('initiative_status_acknowledgments')
      .select('id, acknowledged_at, users:acknowledged_by(display_name)')
      .gte('acknowledged_at', cutoffDays(WINDOW_DAYS.ack))
      .order('acknowledged_at', { ascending: false })
      .limit(PER_SOURCE);
    for (const a of acks || []) {
      const who = a.users?.display_name || 'Someone';
      items.push({ kind: 'ack', news_item_key: `ack:${a.id}`, text: `${who} acknowledged a status update`, occurred_at: a.acknowledged_at });
    }
  } catch (e) { /* ignore */ }

  items.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : a.occurred_at > b.occurred_at ? -1 : 0));
  const shown = items.slice(0, MAX_ITEMS);

  // Fold in reactions (heart/clap/triarq) for the shown items — per-emoji count
  // + whether the caller reacted. One query over all shown keys.
  try {
    const keys = shown.map(i => i.news_item_key).filter(Boolean);
    if (keys.length) {
      const { data: reactions } = await supabase
        .from('news_banner_reactions')
        .select('news_item_key, emoji, user_id')
        .in('news_item_key', keys)
        .is('deleted_at', null);
      const byKey = new Map();
      for (const r of reactions || []) {
        if (!byKey.has(r.news_item_key)) byKey.set(r.news_item_key, {});
        const m = byKey.get(r.news_item_key);
        if (!m[r.emoji]) m[r.emoji] = { count: 0, mine: false };
        m[r.emoji].count += 1;
        if (r.user_id === caller_user_id) m[r.emoji].mine = true;
      }
      for (const item of shown) {
        const m = byKey.get(item.news_item_key);
        item.reactions = m
          ? Object.entries(m).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
          : [];
      }
    } else {
      for (const item of shown) item.reactions = [];
    }
  } catch (e) {
    for (const item of shown) item.reactions = [];
  }

  return { success: true, data: { items: shown } };
}

const VALID_EMOJI = ['heart', 'clap', 'triarq'];

// Toggle the caller's reaction on a news item. Adds if absent, soft-removes if
// present. Returns { reacted } for the resulting state.
async function toggle_news_banner_reaction(params, caller_user_id) {
  if (!caller_user_id) return { success: false, error: 'Not signed in.' };
  const { news_item_key, emoji } = params;
  if (!news_item_key) return { success: false, error: 'news_item_key is required.' };
  if (!VALID_EMOJI.includes(emoji)) {
    return { success: false, error: `emoji must be one of: ${VALID_EMOJI.join(', ')}.` };
  }

  const { data: existing } = await supabase
    .from('news_banner_reactions')
    .select('id')
    .eq('news_item_key', news_item_key).eq('emoji', emoji).eq('user_id', caller_user_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('news_banner_reactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', existing.id);
    return { success: true, data: { news_item_key, emoji, reacted: false } };
  }

  const { error: insErr } = await supabase
    .from('news_banner_reactions')
    .insert({ news_item_key, emoji, user_id: caller_user_id });
  if (insErr && String(insErr.code) !== '23505') {
    return { success: false, error: `Could not save reaction: ${insErr.message}` };
  }
  return { success: true, data: { news_item_key, emoji, reacted: true } };
}

module.exports = { get_news_ticker, toggle_news_banner_reaction };
