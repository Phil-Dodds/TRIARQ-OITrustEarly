// create_roadmap_freeze_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Contract 27 (D-444): create a Deploy Roadmap Baseline. Admin only.
//
// Params:
//   freeze_date:   required ISO date string YYYY-MM-DD
//   freeze_label:  required non-empty string, ≤100 chars
//
// Uniqueness on freeze_date is enforced by partial unique index
// uq_roadmap_freeze_date_active (active rows only — soft-deleted dates can
// be re-used). On collision the tool returns a structured DUPLICATE_DATE
// error carrying the conflicting row so the UI can surface it inline.

'use strict';

const { supabase } = require('../db');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(s) {
  if (typeof s !== 'string' || !ISO_DATE_RE.test(s)) { return false; }
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) { return false; }
  return d.toISOString().slice(0, 10) === s;
}

async function create_roadmap_freeze_date(params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Admin role required to create roadmap baselines.' };
  }

  const freezeDate  = typeof params?.freeze_date === 'string' ? params.freeze_date.trim() : '';
  const freezeLabel = typeof params?.freeze_label === 'string' ? params.freeze_label.trim() : '';

  if (!freezeDate) {
    return { success: false, error: 'freeze_date is required (YYYY-MM-DD).' };
  }
  if (!isValidISODate(freezeDate)) {
    return { success: false, error: 'freeze_date must be a valid ISO date (YYYY-MM-DD).' };
  }
  if (!freezeLabel) {
    return { success: false, error: 'freeze_label is required.' };
  }
  if (freezeLabel.length > 100) {
    return { success: false, error: 'freeze_label must be 100 characters or fewer.' };
  }

  // Preflight duplicate check on active rows so we can return the conflicting
  // label in the structured error. The partial unique index is still the
  // authority — a race that slips past this check returns 23505 below.
  const { data: existing, error: lookupErr } = await supabase
    .from('roadmap_freeze_dates')
    .select('freeze_date_id, freeze_label, freeze_date')
    .eq('freeze_date', freezeDate)
    .is('deleted_at', null)
    .maybeSingle();
  if (lookupErr) {
    return { success: false, error: `Failed to check for existing baseline: ${lookupErr.message}` };
  }
  if (existing) {
    return {
      success: false,
      error:   `A baseline already exists for ${freezeDate} — ${existing.freeze_label}`,
      data:    { code: 'DUPLICATE_DATE', existing }
    };
  }

  const { data, error } = await supabase
    .from('roadmap_freeze_dates')
    .insert({
      freeze_date:        freezeDate,
      freeze_label:       freezeLabel,
      created_by_user_id: caller_user_id
    })
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
        error:   `A baseline already exists for ${freezeDate}`,
        data:    { code: 'DUPLICATE_DATE' }
      };
    }
    return { success: false, error: `Failed to create roadmap baseline: ${error.message}` };
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

module.exports = { create_roadmap_freeze_date };
