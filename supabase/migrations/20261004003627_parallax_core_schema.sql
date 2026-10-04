-- Parallax core schema (Phase C)
-- Auth: Clerk as Supabase third-party provider.
-- RLS uses auth.jwt()->>'sub' (Clerk user id), NOT auth.uid().
-- Docs: https://clerk.com/docs/integrations/databases/supabase

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Current Clerk user id from JWT (null if missing / wrong claim mapping).
create or replace function public.clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt()->>'sub', '');
$$;

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt()->>'sub'),
  name text not null,
  lat double precision not null,
  lon double precision not null,
  bortle smallint not null check (bortle between 1 and 9),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_user_id_required check (user_id is not null and user_id <> '')
);

create index locations_user_id_idx on public.locations (user_id)
  where deleted_at is null;

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;

create policy "locations_select_own"
  on public.locations for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "locations_insert_own"
  on public.locations for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "locations_update_own"
  on public.locations for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "locations_delete_own"
  on public.locations for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- gear_profiles
-- ---------------------------------------------------------------------------

create table public.gear_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt()->>'sub'),
  name text not null,
  telescope_name text not null,
  focal_length numeric not null check (focal_length > 0),
  aperture numeric not null check (aperture > 0),
  camera_name text not null,
  sensor_preset text not null
    check (sensor_preset in ('apsc', 'full_frame', 'm43', '1inch')),
  pixel_size numeric check (pixel_size is null or pixel_size > 0),
  mount_type text not null check (mount_type in ('alt-az', 'equatorial')),
  guiding boolean not null default false,
  is_active boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gear_profiles_user_id_required check (user_id is not null and user_id <> '')
);

create index gear_profiles_user_id_idx on public.gear_profiles (user_id)
  where deleted_at is null;

create trigger gear_profiles_set_updated_at
  before update on public.gear_profiles
  for each row execute function public.set_updated_at();

alter table public.gear_profiles enable row level security;

create policy "gear_profiles_select_own"
  on public.gear_profiles for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "gear_profiles_insert_own"
  on public.gear_profiles for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "gear_profiles_update_own"
  on public.gear_profiles for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "gear_profiles_delete_own"
  on public.gear_profiles for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- missions
-- Persist from Setup onward only (app rule). Planning cancels write nothing.
-- ---------------------------------------------------------------------------

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt()->>'sub'),
  name text not null,
  date_time timestamptz not null,
  location_id uuid not null references public.locations (id),
  gear_id uuid not null references public.gear_profiles (id),
  mission_type text check (mission_type is null or mission_type in ('deep_sky', 'planetary')),
  objective text check (
    objective is null
    or objective in ('deep_integration', 'survey_night', 'quick_session')
  ),
  status text not null
    check (status in ('draft', 'ready', 'in_progress', 'completed', 'cancelled', 'aborted')),
  phase text not null
    check (phase in ('planning', 'setup', 'capturing', 'logging', 'completed')),
  current_target_catalog_id text,
  notes text,
  cancelled_reason text,
  log_locked boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint missions_user_id_required check (user_id is not null and user_id <> '')
);

create index missions_user_id_idx on public.missions (user_id)
  where deleted_at is null;

create trigger missions_set_updated_at
  before update on public.missions
  for each row execute function public.set_updated_at();

alter table public.missions enable row level security;

create policy "missions_select_own"
  on public.missions for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "missions_insert_own"
  on public.missions for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "missions_update_own"
  on public.missions for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "missions_delete_own"
  on public.missions for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- mission_targets (catalog_id = embedded OpenNGC id, no FK)
-- ---------------------------------------------------------------------------

create table public.mission_targets (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  user_id text not null default (auth.jwt()->>'sub'),
  catalog_id text not null,
  target_name text not null,
  target_type text not null,
  planned_window_start text,
  planned_window_end text,
  score numeric not null default 0,
  sequence_index integer,
  role_label text,
  is_fallback boolean not null default false,
  captured boolean not null default false,
  result text check (result is null or result in ('success', 'partial', 'failed')),
  sub_length numeric,
  frames integer,
  notes text,
  planned_iso_gain text,
  altitude_score numeric,
  moon_separation_score numeric,
  rig_framing_score numeric,
  why_included text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_targets_user_id_required check (user_id is not null and user_id <> '')
);

create index mission_targets_mission_id_idx on public.mission_targets (mission_id);
create index mission_targets_user_id_idx on public.mission_targets (user_id);

create trigger mission_targets_set_updated_at
  before update on public.mission_targets
  for each row execute function public.set_updated_at();

alter table public.mission_targets enable row level security;

create policy "mission_targets_select_own"
  on public.mission_targets for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "mission_targets_insert_own"
  on public.mission_targets for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "mission_targets_update_own"
  on public.mission_targets for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "mission_targets_delete_own"
  on public.mission_targets for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- sessions (one per mission for idempotent Save Log upsert)
-- outcome_score: 1–10 (Decision C); display label derived in UI
-- ---------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt()->>'sub'),
  mission_id uuid not null references public.missions (id),
  location_id uuid not null references public.locations (id),
  started_at timestamptz,
  ended_at timestamptz,
  outcome_score smallint not null check (outcome_score between 1 and 10),
  what_i_learned text,
  session_software text
    check (session_software is null or session_software in ('nina', 'asiair', 'ekos')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_user_id_required check (user_id is not null and user_id <> ''),
  constraint sessions_mission_id_unique unique (mission_id)
);

create index sessions_user_id_idx on public.sessions (user_id)
  where deleted_at is null;

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;

create policy "sessions_select_own"
  on public.sessions for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "sessions_insert_own"
  on public.sessions for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "sessions_update_own"
  on public.sessions for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "sessions_delete_own"
  on public.sessions for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- session_targets
-- integration minutes = frames_captured * exposure_seconds / 60 (DERIVED, not stored)
-- ---------------------------------------------------------------------------

create table public.session_targets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id text not null default (auth.jwt()->>'sub'),
  catalog_id text not null,
  target_name text not null,
  frames_captured integer not null default 0 check (frames_captured >= 0),
  exposure_seconds numeric not null check (exposure_seconds > 0),
  iso integer,
  gain numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_targets_user_id_required check (user_id is not null and user_id <> '')
);

create index session_targets_session_id_idx on public.session_targets (session_id);
create index session_targets_user_id_idx on public.session_targets (user_id);

create trigger session_targets_set_updated_at
  before update on public.session_targets
  for each row execute function public.set_updated_at();

alter table public.session_targets enable row level security;

create policy "session_targets_select_own"
  on public.session_targets for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "session_targets_insert_own"
  on public.session_targets for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "session_targets_update_own"
  on public.session_targets for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "session_targets_delete_own"
  on public.session_targets for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- condition_logs (time-series conditions + telemetry events)
-- ---------------------------------------------------------------------------

create table public.condition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt()->>'sub'),
  mission_id uuid references public.missions (id) on delete set null,
  session_id uuid references public.sessions (id) on delete set null,
  recorded_at timestamptz not null,
  source text not null
    check (source in ('forecast', 'live', 'manual', 'telemetry')),
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint condition_logs_user_id_required check (user_id is not null and user_id <> '')
);

create index condition_logs_user_recorded_idx
  on public.condition_logs (user_id, recorded_at desc);
create index condition_logs_mission_id_idx on public.condition_logs (mission_id)
  where mission_id is not null;
create index condition_logs_session_id_idx on public.condition_logs (session_id)
  where session_id is not null;

alter table public.condition_logs enable row level security;

create policy "condition_logs_select_own"
  on public.condition_logs for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "condition_logs_insert_own"
  on public.condition_logs for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "condition_logs_update_own"
  on public.condition_logs for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "condition_logs_delete_own"
  on public.condition_logs for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);

-- ---------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------

create table public.user_preferences (
  user_id text primary key,
  default_min_altitude numeric not null default 30,
  default_moon_tolerance numeric not null default 15,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  updated_at timestamptz not null default now(),
  constraint user_preferences_user_id_required check (user_id is not null and user_id <> '')
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences for select to authenticated
  using ((select public.clerk_user_id()) = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert to authenticated
  with check ((select public.clerk_user_id()) = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update to authenticated
  using ((select public.clerk_user_id()) = user_id)
  with check ((select public.clerk_user_id()) = user_id);

create policy "user_preferences_delete_own"
  on public.user_preferences for delete to authenticated
  using ((select public.clerk_user_id()) = user_id);
