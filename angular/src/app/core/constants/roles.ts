// Central role and entity display-name constants.
// Source of truth for system_role values, role display labels, and entity
// display names. Path B per D-393 — all consumers import from here so the
// rename surface is bounded to this file (plus DB schema and property
// accesses on typed interfaces).
//
// Governing decisions: D-389, D-390, D-391, D-392, D-393.

export const SYSTEM_ROLES = {
  PHIL: 'phil',
  DCS: 'dcs',
  EPO: 'epo',
  DOL: 'dol',
  CE: 'ce',
  ADMIN: 'admin',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const ALL_SYSTEM_ROLES: SystemRole[] = [
  SYSTEM_ROLES.PHIL,
  SYSTEM_ROLES.DCS,
  SYSTEM_ROLES.EPO,
  SYSTEM_ROLES.DOL,
  SYSTEM_ROLES.CE,
  SYSTEM_ROLES.ADMIN,
];

export const ROLE_DISPLAY_NAMES: Record<SystemRole, string> = {
  phil: 'Phil',
  dcs: 'Domain Capability Strategist',
  epo: 'Engineering Product Owner',
  dol: 'Domain Outcome Lead',
  ce: 'Context Engineer',
  admin: 'Admin',
};

export const ROLE_ABBREVIATIONS: Record<SystemRole, string> = {
  phil: 'Phil',
  dcs: 'DCS',
  epo: 'EPO',
  dol: 'DOL',
  ce: 'CE',
  admin: 'Admin',
};

// Contract 19 (D-394, migration 033): boolean role flag column names.
// Maps a SystemRole value to its boolean column on public.users.
// Used by pickers and role filters to switch from system_role equality to boolean flag checks.
export type RoleFlag = 'is_phil' | 'is_dcs' | 'is_epo' | 'is_dol' | 'is_ce' | 'is_admin';

// Note: there is no is_phil column. CC-19-01 collapsed 'phil' into is_admin.
// userRoleToFlag returns 'is_admin' for 'phil' input so callers that pass legacy
// SystemRole values continue to resolve to the correct flag during transition.
export function userRoleToFlag(role: SystemRole): Exclude<RoleFlag, 'is_phil'> {
  switch (role) {
    case 'dcs':   return 'is_dcs';
    case 'epo':   return 'is_epo';
    case 'dol':   return 'is_dol';
    case 'ce':    return 'is_ce';
    case 'admin': return 'is_admin';
    case 'phil':  return 'is_admin';
  }
}

// All five active role flags — used to render checkbox/toggle sets in Admin Users.
export const ALL_ROLE_FLAGS: Exclude<RoleFlag, 'is_phil'>[] = [
  'is_admin', 'is_dcs', 'is_epo', 'is_dol', 'is_ce'
];

// Display label for each role flag. Mirrors ROLE_ABBREVIATIONS but keyed by flag.
export const ROLE_FLAG_ABBREVIATIONS: Record<Exclude<RoleFlag, 'is_phil'>, string> = {
  is_admin: 'Admin',
  is_dcs:   'DCS',
  is_epo:   'EPO',
  is_dol:   'DOL',
  is_ce:    'CE',
};

export const ROLE_FLAG_DISPLAY_NAMES: Record<Exclude<RoleFlag, 'is_phil'>, string> = {
  is_admin: 'Admin',
  is_dcs:   'Domain Capability Strategist',
  is_epo:   'Engineering Product Owner',
  is_dol:   'Domain Outcome Lead',
  is_ce:    'Context Engineer',
};

// Entity display names (D-392 — Delivery Cycle → Initiative).
// DB table delivery_cycles retained unchanged; display strings only.
export const ENTITY_DISPLAY_NAMES = {
  INITIATIVE_SINGULAR: 'Initiative',
  INITIATIVE_PLURAL: 'Initiatives',
} as const;
