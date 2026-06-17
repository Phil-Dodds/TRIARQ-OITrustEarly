// list_roadmap_freeze_dates.js
// Pathways OI Trust — delivery-cycle-mcp
// Contract 27 (D-444): list active Deploy Roadmap Baselines.
//
// Open to any authenticated JWT — EPO Deploy and Workstream Deploy views
// call this for the baseline selector (D-446). Admin role NOT required.
//
// Returns rows ordered freeze_date DESC (most recent first), filtered to
// deleted_at IS NULL per Arch-6 soft-delete (CC-27-1).

'use strict';

const { supabase } = require('../db');

async function list_roadmap_freeze_dates(_params, _caller_user_id) {
  const { data, error } = await supabase
    .from('roadmap_freeze_dates')
    .select(`
      freeze_date_id,
      freeze_date,
      freeze_label,
      created_at,
      created_by_user_id,
      created_by:users!roadmap_freeze_dates_created_by_user_id_fkey ( display_name )
    `)
    .is('deleted_at', null)
    .order('freeze_date', { ascending: false });

  if (error) {
    return { success: false, error: `Failed to list roadmap baselines: ${error.message}` };
  }

  const rows = (data || []).map(r => ({
    freeze_date_id:          r.freeze_date_id,
    freeze_date:             r.freeze_date,
    freeze_label:            r.freeze_label,
    created_at:              r.created_at,
    created_by_user_id:      r.created_by_user_id,
    created_by_display_name: r.created_by?.display_name ?? null
  }));

  return { success: true, data: rows };
}

module.exports = { list_roadmap_freeze_dates };
