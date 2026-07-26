// gate_coaching_links.js — Contract GA-1 (D-579)
// Per-gate "Full best practices" link config. Read is open to any
// authenticated caller (the link renders on assessment screens); writes are
// Admin-only. Blank/NULL url = link hidden. No admin UI in v1 (CC-GA1 lean) —
// admins set the URL via this tool.

'use strict';

const { supabase } = require('../db');

const GATE_KEYS = ['brief_review', 'go_to_build', 'go_to_deploy', 'go_to_release', 'close_review'];

/** List all five per-gate link rows. */
async function list_gate_coaching_links(_params, _caller_user_id) {
  const { data, error } = await supabase
    .from('gate_coaching_links')
    .select('gate_key, url, updated_at');
  if (error) { return { success: false, error: error.message }; }
  return { success: true, data: { links: data ?? [] } };
}

/**
 * @param {object} params
 * @param {string} params.gate_key — one of the five canonical gates
 * @param {string|null} params.url — http(s) URL, or null/'' to hide the link
 * @param {string} caller_user_id - from JWT (must be Admin)
 */
async function set_gate_coaching_link(params, caller_user_id) {
  const { gate_key } = params;
  const url = (typeof params.url === 'string' && params.url.trim()) ? params.url.trim() : null;

  if (!gate_key || !GATE_KEYS.includes(gate_key)) {
    return { success: false, error: `gate_key must be one of: ${GATE_KEYS.join(', ')}.` };
  }
  if (url !== null && !/^https?:\/\//i.test(url)) {
    return { success: false, error: 'url must start with http:// or https:// (or be blank to hide the link).' };
  }

  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Only an Admin can set a gate best-practices link.' };
  }

  const { data, error } = await supabase
    .from('gate_coaching_links')
    .update({ url, updated_at: new Date().toISOString() })
    .eq('gate_key', gate_key)
    .select()
    .single();
  if (error) { return { success: false, error: error.message }; }
  return { success: true, data };
}

module.exports = { list_gate_coaching_links, set_gate_coaching_link };
