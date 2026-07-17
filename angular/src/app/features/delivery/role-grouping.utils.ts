// role-grouping.utils.ts — shared person-role pivot (CC-38-40/45).
// Second consumer (Deploy by Quarter) triggered the S-031 extraction from
// Next Gates: one definition of the EPO | DOL | DCS grouping vocabulary.

import { DeliveryCycle } from '../../core/types/database';

export type PersonRole = 'epo' | 'dol' | 'dcs';

export const PERSON_ROLES: PersonRole[] = ['epo', 'dol', 'dcs'];

export const ROLE_FIELDS: Record<PersonRole, { id: keyof DeliveryCycle; name: keyof DeliveryCycle; label: string }> = {
  epo: { id: 'assigned_epo_user_id', name: 'assigned_epo_display_name', label: 'EPO' },
  dol: { id: 'assigned_dol_user_id', name: 'assigned_dol_display_name', label: 'DOL' },
  dcs: { id: 'assigned_dcs_user_id', name: 'assigned_dcs_display_name', label: 'DCS' }
};

export const UNASSIGNED_ID = '__unassigned__';

export function isPersonRole(value: unknown): value is PersonRole {
  return value === 'epo' || value === 'dol' || value === 'dcs';
}

/** The cycle's person for a role; null id = unassigned (caller decides the
 *  Unassigned/DOL-exemption policy). */
export function personFor(cycle: DeliveryCycle, role: PersonRole): { id: string | null; name: string | null } {
  const f = ROLE_FIELDS[role];
  return {
    id:   (cycle[f.id]   as string | null) ?? null,
    name: (cycle[f.name] as string | null) ?? null
  };
}
