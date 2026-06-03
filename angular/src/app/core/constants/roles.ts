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

// Entity display names (D-392 — Delivery Cycle → Initiative).
// DB table delivery_cycles retained unchanged; display strings only.
export const ENTITY_DISPLAY_NAMES = {
  INITIATIVE_SINGULAR: 'Initiative',
  INITIATIVE_PLURAL: 'Initiatives',
} as const;
