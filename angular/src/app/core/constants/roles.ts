// Central role identifier constants.
// SystemRole values are role-name strings, NOT database column references —
// the public.users.system_role column was retired in migration 034. The
// identifiers remain useful for picker @Input typing (the user-picker accepts
// a "which role am I picking" value) and for translating to the boolean flag.
//
// Governing decisions: D-389, D-390, D-391, D-392, D-393, D-394.

export const SYSTEM_ROLES = {
  DCS: 'dcs',
  EPO: 'epo',
  DOL: 'dol',
  CE: 'ce',
  ADMIN: 'admin',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const ROLE_DISPLAY_NAMES: Record<SystemRole, string> = {
  dcs: 'Domain Capability Strategist',
  epo: 'Engineering Product Owner',
  dol: 'Domain Outcome Lead',
  ce: 'Context Engineer',
  admin: 'Admin',
};

// Boolean role flag column names on public.users. Maps a SystemRole to its flag.
// is_phil is intentionally absent — CC-19-01 collapsed 'phil' into is_admin.
export type RoleFlag = 'is_admin' | 'is_dcs' | 'is_epo' | 'is_dol' | 'is_ce';

export function userRoleToFlag(role: SystemRole): RoleFlag {
  switch (role) {
    case 'dcs':   return 'is_dcs';
    case 'epo':   return 'is_epo';
    case 'dol':   return 'is_dol';
    case 'ce':    return 'is_ce';
    case 'admin': return 'is_admin';
  }
}

// All five active role flags — used to render checkbox/toggle sets in Admin Users.
export const ALL_ROLE_FLAGS: RoleFlag[] = [
  'is_admin', 'is_dcs', 'is_epo', 'is_dol', 'is_ce'
];

export const ROLE_FLAG_ABBREVIATIONS: Record<RoleFlag, string> = {
  is_admin: 'Admin',
  is_dcs:   'DCS',
  is_epo:   'EPO',
  is_dol:   'DOL',
  is_ce:    'CE',
};

export const ROLE_FLAG_DISPLAY_NAMES: Record<RoleFlag, string> = {
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
