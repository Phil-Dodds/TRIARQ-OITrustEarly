// update_roadmap_freeze_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Contract 27 (D-444): update a Deploy Roadmap Baseline. Admin only.
//
// Params:
//   freeze_date_id:  required uuid
//   freeze_date?:    ISO date string YYYY-MM-DD
//   freeze_label?:   non-empty string ≤100 chars
//
// At least one of freeze_date / freeze_label must be supplied. Uniqueness on
// freeze_date is enforced by partial unique index uq_roadmap_freeze_date_active.

'use strict';

const { supabase } = require('../db');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(s) {
  if (typeof s !== 'string' || !ISO_DATE_RE.test(s)) { return false; }
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) { return false; }
  return d.toISOString().slice(0, 10) === s;
}

async function update_roadmap_freeze_date(params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Admin role required to update roadmap baselines.' };
  }

  const id = typeof params?.freeze_date_id === 'string' ? params.freeze_date_id : '';
  if (!id) {
    return { success: false, error: 'freeze_date_id is required.' };
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(params, 'freeze_date')) {
    const d = typeof params.freeze_date === 'string' ? params.freeze_date.trim() : '';
    if (!isValidISODate(d)) {
      return { success: false, error: 'freeze_date must be a valid ISO date (YYYY-MM-DD).' };
    }
    updates.freeze_date = d;
  }

  if (Object.prototype.hasOwnProperty.call(params, 'freeze_label')) {
    const lbl = typeof params.freeze_label === 'string' ? params.freeze_label.trim() : '';
    if (!lbl) {
      return { success: false, error: 'freeze_label cannot be empty.' };
    }
    if (lbl.length > 100) {
      return { success: false, error: 'freeze_label must be 100 characters or fewer.' };
    }
    updates.freeze_label = lbl;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'Provide freeze_date and/or freeze_label.' };
  }

  // Preflight: when changing freeze_date, surface duplicate-with-existing-label
  // inline so the UI can show "A baseline already exists for X — Label".
  if (updates.freeze_date) {
    const { data: existing, error: lookupErr } = await supabase
      .from('roadmap_freeze_dates')
      .select('freeze_date_id, freeze_label, freeze_date')
      .eq('freeze_date', updates.freeze_date)
      .is('deleted_at', null)
      .neq('freeze_date_id', id)
      .maybeSingle();
    if (lookupErr) {
      return { success: false, error: `Failed to check for existing baseline: ${lookupErr.message}` };
    }
    if (existing) {
      return {
        success: false,
        error:   `A baseline already exists for ${updates.freeze_date} — ${existing.freeze_label}`,
        data:    { code: 'DUPLICATE_DATE', existing }
      };
    }
  }

  const { data, error } = await supabase
    .from('roadmap_freeze_dates')
    .update(updates)
    .eq('freeze_date_id', id)
    .is('deleted_at', null)
    .select(`
      freeze_date_id,
      freeze_date,
      freeze_label,
      created_at,
      created_by_user_id,
      created_by:users!roadmap_freeze_dates_created_by_user_id_fkey ( display_name )
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error:   `A baseline already exists for ${updates.freeze_date ?? ''}`,
        data:    { code: 'DUPLICATE_DATE' }
      };
    }
    return { success: false, error: `Failed to update roadmap baseline: ${error.message}` };
  }

  return {
    success: true,
    data: {
      freeze_date_id:          data.freeze_date_id,
      freeze_date:             data.freeze_date,
      freeze_label:            data.freeze_label,
      created_at:              data.created_at,
      created_by_user_id:      data.created_by_user_id,
      created_by_display_name: data.created_by?.display_name ?? null
    }
  };
}

module.exports = { update_roadmap_freeze_date };
