-- Timed night schedule columns (authoritative when present).
-- planned_window_* remain usable-window HH:MM labels for legacy Capturing copy.

alter table public.mission_targets
  add column if not exists scheduled_start_at timestamptz,
  add column if not exists scheduled_end_at timestamptz,
  add column if not exists planned_imaging_minutes integer;

alter table public.mission_targets
  drop constraint if exists mission_targets_planned_imaging_minutes_positive;

alter table public.mission_targets
  add constraint mission_targets_planned_imaging_minutes_positive
  check (planned_imaging_minutes is null or planned_imaging_minutes > 0);

alter table public.missions
  add column if not exists transition_minutes integer;

alter table public.missions
  drop constraint if exists missions_transition_minutes_range;

alter table public.missions
  add constraint missions_transition_minutes_range
  check (
    transition_minutes is null
    or (transition_minutes >= 5 and transition_minutes <= 45)
  );

comment on column public.mission_targets.scheduled_start_at is
  'Authoritative scheduled imaging start (timestamptz). Null = no timed schedule.';
comment on column public.mission_targets.scheduled_end_at is
  'Authoritative scheduled imaging end (timestamptz).';
comment on column public.mission_targets.planned_imaging_minutes is
  'On-target imaging minutes for the scheduled segment.';
comment on column public.missions.transition_minutes is
  'Gap between scheduled targets in minutes; null treated as 15 when reading.';
