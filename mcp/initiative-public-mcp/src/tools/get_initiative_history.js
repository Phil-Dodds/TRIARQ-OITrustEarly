// get_initiative_history.js
// Pathways OI Trust — initiative-public-mcp (Contract 31, D-473).
//
// Event log for a single Initiative, newest first. event_type mapped to a
// human-readable label (unknown types pass through). Excluded: email_sent
// events (filtered out), and the event_metadata / actor_user_id /
// delivery_cycle_id fields (never in the response — spec §WS3.5). gate_name is
// derived server-side from event_metadata but the metadata itself is not returned.

'use strict';

const { eventLabel, EXCLUDED_EVENT_TYPES } = require('../helpers/format-helpers');

/**
 * @param {object} supabase - service-role client
 * @param {string} initiative_id
 * @returns {Promise<Array<object>|null>} null when the Initiative is not found (→ 404)
 */
async function getInitiativeHistory(supabase, initiative_id) {
  if (!initiative_id) { throw new Error('initiative_id is required'); }

  // 404 when the Initiative does not exist / is deleted.
  const { data: cycle, error: cycleErr } = await supabase
    .from('delivery_cycles')
    .select('delivery_cycle_id')
    .eq('delivery_cycle_id', initiative_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (cycleErr) { throw new Error(`Failed to fetch Initiative: ${cycleErr.message}`); }
  if (!cycle) { return null; }

  // Append-only table — no deleted_at filter. Resolve actor names separately.
  const { data: events, error } = await supabase
    .from('cycle_event_log')
    .select('event_type, event_description, actor_user_id, event_metadata, created_at')
    .eq('delivery_cycle_id', initiative_id)
    .order('created_at', { ascending: false });

  if (error) { throw new Error(`Failed to fetch history: ${error.message}`); }

  const visible = (events || []).filter(e => !EXCLUDED_EVENT_TYPES.has(e.event_type));

  const actorIds = [...new Set(visible.map(e => e.actor_user_id).filter(Boolean))];
  const actorMap = new Map();
  if (actorIds.length) {
    const { data } = await supabase.from('users').select('id, display_name').in('id', actorIds).is('deleted_at', null);
    (data || []).forEach(u => actorMap.set(u.id, u.display_name));
  }

  // Whitelist output — no event_metadata, no actor_user_id, no delivery_cycle_id.
  return visible.map(e => ({
    event_type:          eventLabel(e.event_type),
    actor_display_name:  e.actor_user_id ? (actorMap.get(e.actor_user_id) ?? null) : null,
    event_description:   e.event_description,
    occurred_at:         e.created_at,
    gate_name:           e.event_metadata?.gate_name ?? null
  }));
}

module.exports = { getInitiativeHistory };
