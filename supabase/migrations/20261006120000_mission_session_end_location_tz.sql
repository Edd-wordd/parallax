-- Persist mission session end; optional site IANA timezone.

alter table public.missions
  add column if not exists session_end_at timestamptz;

update public.missions
set session_end_at = date_time + interval '6 hours'
where session_end_at is null;

alter table public.missions
  alter column session_end_at set not null;

alter table public.missions
  drop constraint if exists missions_session_end_after_start;

alter table public.missions
  add constraint missions_session_end_after_start
  check (session_end_at > date_time);

comment on column public.missions.session_end_at is
  'Exclusive end of observing session window (timestamptz).';

alter table public.locations
  add column if not exists timezone text;

alter table public.locations
  drop constraint if exists locations_timezone_nonempty;

alter table public.locations
  add constraint locations_timezone_nonempty
  check (timezone is null or length(trim(timezone)) > 0);

comment on column public.locations.timezone is
  'Optional IANA timezone for site civil time (e.g. America/Denver). Null = use device TZ.';
