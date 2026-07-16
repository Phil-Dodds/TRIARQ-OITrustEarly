// easter-egg.constants.ts — Easter Egg Hunt (spec §4)
// Placement keys as named constants (Rule 4) — declared once, referenced by the
// <app-egg-spot> placed on each screen and matched to the seeded easter_eggs
// rows. Never construct these at runtime.

export const EGG_KEYS = {
  HOME_FOOTER:              'home.landing.footer',
  ACTIONS_ACK_FOOTER:       'myactions.ack.footer',
  GATES_APPROVED_FOOTER:    'initiatives.gates_approved.footer',
  INITIATIVE_GUIDE_FOOTER:  'initiatives.guide.footer',
  EVENT_LOG_FOOTER:         'delivery.detail.event_log_footer',
  TEAM_MEETINGS_FOOTER:     'team_meetings.track.footer',
  FILTERS_FOOTER:           'initiatives.filter.footer',
  ABOUT_FOOTER:             'shell.about.footer',
  ACTIONS_UPDATE_FOOTER:    'myactions.update.footer',
  CONTACT_ADMIN_FOOTER:     'shell.contact_admin.footer'
} as const;

export type EggPlacementKey = typeof EGG_KEYS[keyof typeof EGG_KEYS];
