// gate_thread.js
// Pathways OI Trust — delivery-cycle-mcp — Contract G1 (D-565)
// Gate thread: add_gate_thread_message, list_gate_thread.
// Append-only chronological thread per gate record. Submission-note-as-opening-
// message and thread UI land in G6 — G1 ships the primitive.

'use strict';

const { supabase } = require('../db');

/**
 * Append a message to a gate's thread. Any active user may post.
 * @param {string} params.gate_record_id
 * @param {string} params.text — message body
 */
async function add_gate_thread_message(params, caller_user_id) {
  const { gate_record_id, text } = params;
  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }
  if (!text || !String(text).trim()) {
    return { success: false, error: 'Message text is required.' };
  }

  const { data: gateRecord, error: gateErr } = await supabase
    .from('gate_records')
    .select('gate_record_id, delivery_cycle_id, gate_name')
    .eq('gate_record_id', gate_record_id)
    .is('deleted_at', null)
    .single();

  if (gateErr || !gateRecord) {
    return { success: false, error: 'Gate record not found.' };
  }

  const { data: message, error: insertErr } = await supabase
    .from('gate_thread_messages')
    .insert({
      gate_record_id,
      user_id:      caller_user_id,
      message_text: String(text).trim()
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: `Failed to add thread message: ${insertErr.message}` };
  }

  return { success: true, data: message };
}

/**
 * List a gate's thread, chronological, authors resolved.
 * @param {string} params.gate_record_id
 */
async function list_gate_thread(params, caller_user_id) {
  const { gate_record_id } = params;
  if (!gate_record_id) {
    return { success: false, error: 'gate_record_id is required.' };
  }

  const { data: messages, error: messagesErr } = await supabase
    .from('gate_thread_messages')
    .select('*')
    .eq('gate_record_id', gate_record_id)
    .order('created_at', { ascending: true });

  if (messagesErr) {
    return { success: false, error: `Failed to list gate thread: ${messagesErr.message}` };
  }

  const userIds = [...new Set((messages || []).map(m => m.user_id))];
  const userMap = {};
  if (userIds.length) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);
    for (const u of users || []) { userMap[u.id] = u.display_name; }
  }

  return {
    success: true,
    data: {
      gate_thread_messages: (messages || []).map(m => ({
        ...m,
        author_display_name: userMap[m.user_id] || null
      }))
    }
  };
}

module.exports = { add_gate_thread_message, list_gate_thread };
