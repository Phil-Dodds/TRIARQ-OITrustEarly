// delete_roadmap_freeze_date.js
// Pathways OI Trust — delivery-cycle-mcp
// Contract 27 (D-444): remove a Deploy Roadmap Baseline. Admin only.
//
// CC-27-1: Arch-6 (Soft Delete Only) governs the spec's hard-delete intent.
// This tool sets deleted_at = now() rather than issuing DELETE. The partial
// unique index uq_roadmap_freeze_date_active (WHERE deleted_at IS NULL)
// frees the freeze_date for re-use after soft-delete.
//
// Params:
//   freeze_date_id:  required uuid

'use strict';

const { supabase } = require('../db');

async function delete_roadmap_freeze_date(params, caller_user_id) {
  const { data: caller } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', caller_user_id)
    .is('deleted_at', null)
    .single();
  if (caller?.is_admin !== true) {
    return { success: false, error: 'Admin role required to remove roadmap baselines.' };
  }

  const id = typeof params?.freeze_date_id === 'string' ? params.freeze_date_id : '';
  if (!id) {
    return { success: false, error: 'freeze_date_id is required.' };
  }

  const { data, error } = await supabase
    .from('roadmap_freeze_dates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('freeze_date_id', id)
    .is('deleted_at', null)
    .select('freeze_date_id')
    .maybeSingle();

  if (error) {
    return { success: false, error: `Failed to remove roadmap baseline: ${error.message}` };
  }
  if (!data) {
    return { success: false, error: 'Baseline not found or already removed.' };
  }

  return { success: true, data: { deleted: true, freeze_date_id: data.freeze_date_id } };
}

module.exports = { delete_roadmap_freeze_date };
