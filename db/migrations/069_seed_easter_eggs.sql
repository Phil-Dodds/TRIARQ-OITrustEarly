-- 069_seed_easter_eggs.sql
-- Pathways OI Trust — Easter Egg Hunt seed (spec §4, the locked ten)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Ten eggs, season 1, each keyed to a Live/Pilot reachable screen (EE-15).
-- egg_name = feature only (shown once found); location_detail = admin reference.
--
-- Must run after: 068_easter_eggs.sql

INSERT INTO public.easter_eggs (egg_slug, placement_key, egg_name, location_detail, asset_ref, sort_order)
VALUES
  ('home_footer',            'home.landing.footer',               'Home',                       'Bottom of the Home page, below all cards',                         'egg-01', 1),
  ('actions_ack',            'myactions.ack.footer',              'Acknowledge Status Updates', 'My Actions → Acknowledge tab, foot of the list',                   'egg-02', 2),
  ('gates_approved',         'initiatives.gates_approved.footer', 'Recently Approved Gates',    'Initiative Tracking → gates-approved grid, below the last row',    'egg-03', 3),
  ('initiative_guide',       'initiatives.guide.footer',          'Initiative Guide',           'Initiative Tracking → How It Works guide, foot after Outcomes',    'egg-04', 4),
  ('event_log',              'delivery.detail.event_log_footer',  'Event Log',                  'Initiative detail panel (any Initiative), bottom of the Event Log','egg-05', 5),
  ('team_meetings',          'team_meetings.track.footer',        'Team Meetings',              'Team Meetings → any series detail, bottom of the screen',          'egg-06', 6),
  ('initiatives_filter',     'initiatives.filter.footer',         'Filters',                    'Initiative Tracking → inside the Filters slide-in, below Apply',   'egg-07', 7),
  ('about_footer',           'shell.about.footer',                'About',                      'About panel, foot after the build-history list',                   'egg-08', 8),
  ('actions_update',         'myactions.update.footer',           'Update Statuses',            'My Actions → Update Initiative Statuses tab, foot of the list',    'egg-09', 9),
  ('contact_admin',          'shell.contact_admin.footer',        'Contact an Admin',           'Contact an Admin screen, bottom',                                  'egg-10', 10);
