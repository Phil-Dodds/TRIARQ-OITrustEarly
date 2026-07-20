// easter_eggs.js — Easter Egg Hunt (spec docs/easter-egg-spec.md §6)
// Hosted on division-mcp (owns users/home domain, EE-09). All JWT-validated by
// middleware; the finder's identity comes from the JWT (caller_user_id), never
// a body param (Arch-5). Soft delete only (Arch-6). Errors return the envelope.
//
// Tools: find_egg, get_my_egg_basket, get_recent_egg_finds (any authenticated);
// list_easter_eggs, upsert_easter_egg, set_easter_egg_active (admin).

'use strict';

const { supabase } = require('../db');

const SEASON = 1; // EE-08: single season this release.

// EE-07 base cc list — env only (Arch-4). Comma-separated emails.
function baseCcList() {
  return (process.env.EASTER_EGG_CELEBRATION_CC || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

async function isAdmin(caller_user_id) {
  if (!caller_user_id) return false;
  const { data } = await supabase
    .from('users').select('is_admin')
    .eq('id', caller_user_id).is('deleted_at', null).maybeSingle();
  return data?.is_admin === true;
}

async function countActiveEggs() {
  const { count } = await supabase
    .from('easter_eggs').select('id', { count: 'exact', head: true })
    .eq('season', SEASON).eq('active_status', true).is('deleted_at', null);
  return count ?? 0;
}

async function countUserFinds(user_id) {
  const { count } = await supabase
    .from('user_egg_finds').select('id', { count: 'exact', head: true })
    .eq('user_id', user_id).is('deleted_at', null);
  return count ?? 0;
}

// Leaderboard aggregation shared by get_egg_leaderboard (full list) and
// get_my_egg_basket (leader summary). One row per ACTIVE user, including users
// with zero finds. Sort: most eggs first; ties broken by whoever added their
// most recent egg last (last_found_at desc); then name.
async function computeLeaderboard() {
  const total_eggs = await countActiveEggs();

  const { data: users } = await supabase
    .from('users').select('id, display_name').is('deleted_at', null);

  const { data: finds } = await supabase
    .from('user_egg_finds')
    .select('user_id, found_at, easter_eggs(asset_ref)')
    .is('deleted_at', null);

  const byUser = new Map();
  for (const u of users || []) {
    byUser.set(u.id, {
      user_id: u.id, display_name: u.display_name,
      found_count: 0, last_found_at: null, last_asset_ref: null
    });
  }
  for (const f of finds || []) {
    const row = byUser.get(f.user_id);
    if (!row) continue; // find by a since-deleted user — skip
    row.found_count += 1;
    if (!row.last_found_at || f.found_at > row.last_found_at) {
      row.last_found_at = f.found_at;
      row.last_asset_ref = f.easter_eggs?.asset_ref ?? row.last_asset_ref;
    }
  }

  const rows = [...byUser.values()].sort((a, b) => {
    if (b.found_count !== a.found_count) return b.found_count - a.found_count;
    const al = a.last_found_at || '', bl = b.last_found_at || '';
    if (al !== bl) return al > bl ? -1 : 1; // most recent last-egg wins the tie
    return (a.display_name || '').localeCompare(b.display_name || '');
  });

  return { rows, total_eggs };
}

// ── find_egg ─────────────────────────────────────────────────────────────────
// Idempotent (EE-06). On the 10th distinct find → achievement + congrats email.
async function find_egg(params, caller_user_id) {
  const { placement_key } = params;
  if (!caller_user_id) return { success: false, error: 'Not signed in.' };
  if (!placement_key) return { success: false, error: 'placement_key is required.' };

  const { data: egg } = await supabase
    .from('easter_eggs')
    .select('id, egg_name, asset_ref, placement_key')
    .eq('season', SEASON).eq('placement_key', placement_key)
    .eq('active_status', true).is('deleted_at', null)
    .maybeSingle();
  if (!egg) return { success: false, error: 'No active egg at this spot.' };

  const total_eggs = await countActiveEggs();

  // Already found? Friendly no-op (EE-06).
  const { data: existing } = await supabase
    .from('user_egg_finds').select('id')
    .eq('user_id', caller_user_id).eq('egg_id', egg.id).is('deleted_at', null)
    .maybeSingle();
  if (existing) {
    const total_found = await countUserFinds(caller_user_id);
    return { success: true, data: {
      egg, already_found: true, newly_found: false,
      total_found, total_eggs, just_completed: false
    }};
  }

  const { error: insErr } = await supabase
    .from('user_egg_finds').insert({ user_id: caller_user_id, egg_id: egg.id });
  if (insErr) {
    // Unique-violation race → treat as already found.
    if (String(insErr.code) === '23505') {
      const total_found = await countUserFinds(caller_user_id);
      return { success: true, data: {
        egg, already_found: true, newly_found: false, total_found, total_eggs, just_completed: false
      }};
    }
    return { success: false, error: `Could not record the find: ${insErr.message}` };
  }

  const total_found = await countUserFinds(caller_user_id);
  let just_completed = false;

  if (total_eggs > 0 && total_found >= total_eggs) {
    // Create the achievement if absent (idempotent on unique(user_id, season)).
    const { data: ach } = await supabase
      .from('user_egg_achievements').select('id, email_sent_at')
      .eq('user_id', caller_user_id).eq('season', SEASON).is('deleted_at', null)
      .maybeSingle();
    if (!ach) {
      const { error: achErr } = await supabase
        .from('user_egg_achievements').insert({ user_id: caller_user_id, season: SEASON });
      if (!achErr) {
        just_completed = true;
        await sendCongratsEmail(caller_user_id).catch(() => {}); // fire-and-forget
      }
    }
  }

  return { success: true, data: {
    egg, newly_found: true, already_found: false, total_found, total_eggs, just_completed
  }};
}

// ── Congrats email (EE-07/EE-16) ─────────────────────────────────────────────
async function sendCongratsEmail(finder_user_id) {
  const { data: finder } = await supabase
    .from('users').select('display_name, email')
    .eq('id', finder_user_id).is('deleted_at', null).maybeSingle();
  if (!finder?.email) return;

  // Finishers club: everyone else who has completed all ten this season.
  const { data: finisherRows } = await supabase
    .from('user_egg_achievements').select('user_id')
    .eq('season', SEASON).is('deleted_at', null);
  const finisherIds = (finisherRows || []).map(r => r.user_id).filter(id => id !== finder_user_id);

  let finisherEmails = [];
  if (finisherIds.length) {
    const { data: fUsers } = await supabase
      .from('users').select('email').in('id', finisherIds).is('deleted_at', null);
    finisherEmails = (fUsers || []).map(u => u.email).filter(Boolean);
  }

  const finderEmail = finder.email.toLowerCase();
  const cc = [...new Set([...baseCcList(), ...finisherEmails.map(e => e.toLowerCase())])]
    .filter(e => e !== finderEmail);

  const displayName = finder.display_name || 'there';
  const subject = 'You found all ten Easter eggs in OI Trust';
  const html_body = buildCongratsHtml(displayName);

  // EE-16: pass to + cc; if the relay ignores cc, also fold everyone into `to`
  // so delivery is guaranteed (intended split recorded in metadata).
  try {
    await supabase.functions.invoke('send-notification-email', {
      // CC-38 f19 fix: the Edge Function previously ignored cc and sent an
      // individual To-copy to every address (Phil bug report 2026-07-20:
      // David received "Congrats Ami" addressed To: David). Edge Function
      // now honors cc — finder in To, club in CC, one message.
      body: {
        to: [finderEmail],
        cc,
        subject,
        html_body
      }
    });
  } catch (e) { /* fire-and-forget */ }

  await supabase
    .from('user_egg_achievements')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('user_id', finder_user_id).eq('season', SEASON).is('deleted_at', null);
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://phil-dodds.github.io/TRIARQ-OITrustEarly';

function buildCongratsHtml(displayName) {
  // Header graphic is a hosted PNG (email clients don't render inline SVG).
  const banner = `${APP_BASE_URL}/assets/images/easter-egg-congrats.png`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:Roboto,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0;"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:560px;">
      <tr><td style="background:#12274A;padding:20px 28px;"><span style="color:#ffffff;font-size:18px;font-weight:700;">Pathways OI Trust</span></td></tr>
      <tr><td style="background:#FBEFD6;text-align:center;padding:8px 0 0 0;">
        <img src="${esc(banner)}" alt="Bunny with a basket of ten eggs" width="320" style="max-width:320px;height:auto;display:inline-block;" />
      </td></tr>
      <tr><td style="padding:24px 28px;text-align:center;">
        <p style="margin:0;font-size:26px;font-weight:700;color:#12274A;">Congrats, ${esc(displayName)}!</p>
        <p style="margin:8px 0 0 0;font-size:16px;color:#5A5A5A;">You found all ten Easter eggs in OI Trust!</p>
        <p style="margin:20px 0 0 0;font-size:13px;color:#9E9E9E;">&mdash; The OI Trust team</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

// ── get_my_egg_basket ────────────────────────────────────────────────────────
async function get_my_egg_basket(params, caller_user_id) {
  if (!caller_user_id) return { success: false, error: 'Not signed in.' };

  const { data: eggs } = await supabase
    .from('easter_eggs')
    .select('id, egg_name, asset_ref, sort_order, placement_key')
    .eq('season', SEASON).eq('active_status', true).is('deleted_at', null)
    .order('sort_order', { ascending: true });
  const activeEggs = eggs || [];

  const { data: finds } = await supabase
    .from('user_egg_finds').select('egg_id, found_at')
    .eq('user_id', caller_user_id).is('deleted_at', null);
  const foundMap = new Map((finds || []).map(f => [f.egg_id, f.found_at]));

  const basket = activeEggs.map(e => ({
    egg_id: e.id,
    asset_ref: e.asset_ref,
    sort_order: e.sort_order,
    // placement_key is safe to expose: the spot glyph is visible in the UI by
    // design. It lets the egg-spot components know which spots are live/found.
    placement_key: e.placement_key,
    found: foundMap.has(e.id),
    // EE-01: name revealed only when this user has found it.
    egg_name: foundMap.has(e.id) ? e.egg_name : null,
    found_at: foundMap.get(e.id) ?? null
  }));

  const total_found = basket.filter(b => b.found).length;

  // Current leader summary for the Home card (any user may see who's ahead).
  const { rows } = await computeLeaderboard();
  const top = (rows || []).find(r => r.found_count > 0) || null;
  const leader = top ? {
    display_name: top.display_name,
    found_count: top.found_count,
    last_asset_ref: top.last_asset_ref,
    is_me: top.user_id === caller_user_id
  } : null;

  return { success: true, data: {
    basket, total_found, total_eggs: activeEggs.length,
    completed: activeEggs.length > 0 && total_found >= activeEggs.length,
    leader
  }};
}

// ── get_egg_leaderboard (admin) ──────────────────────────────────────────────
async function get_egg_leaderboard(params, caller_user_id) {
  if (!(await isAdmin(caller_user_id))) {
    return { success: false, error: 'The Easter Egg leaderboard is Admin-only.' };
  }
  const { rows, total_eggs } = await computeLeaderboard();
  return { success: true, data: { rows, total_eggs } };
}

// ── get_recent_egg_finds ─────────────────────────────────────────────────────
// Cross-user feed. EE-01: others' egg_name/location withheld; revealed only on
// the caller's own rows. Achievement rows announce completion.
async function get_recent_egg_finds(params, caller_user_id) {
  if (!caller_user_id) return { success: false, error: 'Not signed in.' };
  const limit = Math.min(Math.max(Number(params?.limit) || 15, 1), 50);

  const { data: finds } = await supabase
    .from('user_egg_finds')
    .select('user_id, egg_id, found_at, easter_eggs!inner(egg_name, asset_ref), users!inner(display_name)')
    .is('deleted_at', null)
    .order('found_at', { ascending: false })
    .limit(limit);

  const feed = (finds || []).map(f => {
    const isOwn = f.user_id === caller_user_id;
    return {
      kind: 'find',
      display_name: f.users?.display_name ?? 'Someone',
      asset_ref: f.easter_eggs?.asset_ref ?? null,
      is_own: isOwn,
      egg_name: isOwn ? (f.easter_eggs?.egg_name ?? null) : null, // no spoiler for others
      found_at: f.found_at
    };
  });

  const { data: achievements } = await supabase
    .from('user_egg_achievements')
    .select('achieved_at, users!inner(display_name)')
    .eq('season', SEASON).is('deleted_at', null)
    .order('achieved_at', { ascending: false })
    .limit(10);
  const wins = (achievements || []).map(a => ({
    kind: 'achievement',
    display_name: a.users?.display_name ?? 'Someone',
    achieved_at: a.achieved_at
  }));

  return { success: true, data: { finds: feed, achievements: wins } };
}

// ── Admin config ─────────────────────────────────────────────────────────────
async function list_easter_eggs(params, caller_user_id) {
  if (!(await isAdmin(caller_user_id))) {
    return { success: false, error: 'Managing Easter eggs requires Admin role.' };
  }
  const { data, error } = await supabase
    .from('easter_eggs')
    .select('id, egg_slug, placement_key, egg_name, location_detail, asset_ref, sort_order, season, active_status')
    .is('deleted_at', null).order('sort_order', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

async function upsert_easter_egg(params, caller_user_id) {
  if (!(await isAdmin(caller_user_id))) {
    return { success: false, error: 'Managing Easter eggs requires Admin role.' };
  }
  const { egg_id, egg_slug, placement_key, egg_name, location_detail, asset_ref, sort_order, active_status } = params;
  if (egg_id) {
    const updates = {};
    for (const [k, v] of Object.entries({ egg_slug, placement_key, egg_name, location_detail, asset_ref, sort_order, active_status })) {
      if (v !== undefined) updates[k] = v;
    }
    const { data, error } = await supabase
      .from('easter_eggs').update(updates).eq('id', egg_id).is('deleted_at', null).select().single();
    if (error || !data) return { success: false, error: error?.message || 'Egg not found.' };
    return { success: true, data };
  }
  if (!egg_slug || !placement_key || !egg_name || !location_detail || !asset_ref || sort_order === undefined) {
    return { success: false, error: 'egg_slug, placement_key, egg_name, location_detail, asset_ref and sort_order are required.' };
  }
  const { data, error } = await supabase
    .from('easter_eggs')
    .insert({ egg_slug, placement_key, egg_name, location_detail, asset_ref, sort_order, season: SEASON })
    .select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function set_easter_egg_active(params, caller_user_id) {
  if (!(await isAdmin(caller_user_id))) {
    return { success: false, error: 'Managing Easter eggs requires Admin role.' };
  }
  const { egg_id, active } = params;
  if (!egg_id || typeof active !== 'boolean') {
    return { success: false, error: 'egg_id and active (boolean) are required.' };
  }
  const { data, error } = await supabase
    .from('easter_eggs').update({ active_status: active }).eq('id', egg_id).is('deleted_at', null).select().single();
  if (error || !data) return { success: false, error: error?.message || 'Egg not found.' };
  return { success: true, data };
}

module.exports = {
  find_egg, get_my_egg_basket, get_recent_egg_finds, get_egg_leaderboard,
  list_easter_eggs, upsert_easter_egg, set_easter_egg_active
};
