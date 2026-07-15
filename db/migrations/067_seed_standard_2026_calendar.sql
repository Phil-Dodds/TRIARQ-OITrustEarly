-- 067_seed_standard_2026_calendar.sql
-- Pathways OI Trust — Contract 37 seed (spec §3, Appendix A; D-549/D-550)
-- Phil executes all migrations by hand — never auto-executed by Code.
--
-- Seeds 'TRIARQ Standard 2026' with 18 three-week sprints from Julie's
-- calendar. sprint_id stored as TEXT '2026.01'–'2026.18' — correcting the
-- source spreadsheet's float artifact ('2026.1'). UAT End (+7) and Release
-- Target (+14) spreadsheet columns are deliberately NOT calendar properties —
-- they are per-gate rule offsets (D-549).
--
-- D-550: all root Trusts (parent_division_id IS NULL) get a direct
-- assignment; child divisions stay NULL and inherit via the ancestor walk.
--
-- Must run after: 066_sprint_calendars.sql

WITH cal AS (
    INSERT INTO public.sprint_calendars (calendar_name)
    VALUES ('TRIARQ Standard 2026')
    RETURNING id
)
INSERT INTO public.sprints (calendar_id, sprint_id, start_date, end_date)
SELECT cal.id, s.sprint_id, s.start_date::date, s.end_date::date
FROM cal,
     (VALUES
        ('2026.01', '2025-12-29', '2026-01-16'),
        ('2026.02', '2026-01-19', '2026-02-06'),
        ('2026.03', '2026-02-09', '2026-02-27'),
        ('2026.04', '2026-03-02', '2026-03-20'),
        ('2026.05', '2026-03-23', '2026-04-10'),
        ('2026.06', '2026-04-13', '2026-05-01'),
        ('2026.07', '2026-05-04', '2026-05-22'),
        ('2026.08', '2026-05-25', '2026-06-12'),
        ('2026.09', '2026-06-15', '2026-07-03'),
        ('2026.10', '2026-07-06', '2026-07-24'),
        ('2026.11', '2026-07-27', '2026-08-14'),
        ('2026.12', '2026-08-17', '2026-09-04'),
        ('2026.13', '2026-09-07', '2026-09-25'),
        ('2026.14', '2026-09-28', '2026-10-16'),
        ('2026.15', '2026-10-19', '2026-11-06'),
        ('2026.16', '2026-11-09', '2026-11-27'),
        ('2026.17', '2026-11-30', '2026-12-18'),
        ('2026.18', '2026-12-21', '2027-01-08')
     ) AS s (sprint_id, start_date, end_date);

-- Root Trusts get the standard calendar directly; children inherit via NULL.
UPDATE public.divisions
SET sprint_calendar_id = (
        SELECT id FROM public.sprint_calendars
        WHERE calendar_name = 'TRIARQ Standard 2026' AND deleted_at IS NULL
    )
WHERE parent_division_id IS NULL
  AND deleted_at IS NULL;
