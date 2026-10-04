-- Phase Auth: switch from Clerk-shaped text user_id + clerk_user_id()
-- to native Supabase Auth UUID user_id + auth.uid().
--
-- BEFORE applying on a DB with local-token rows:
--   1. Create a Supabase Auth user (sign-up).
--   2. Run scripts/remap-local-user.sql (dry-run, then apply) to rewrite
--      user_local_dev → that Auth UUID (as text).
--   3. Then apply this migration (or supabase db reset for a clean slate).
--
-- Rows whose user_id is not a valid UUID are deleted (old fixtures).

-- ---------------------------------------------------------------------------
-- Drop Clerk-era RLS policies
-- ---------------------------------------------------------------------------

drop policy if exists "locations_select_own" on public.locations;
drop policy if exists "locations_insert_own" on public.locations;
drop policy if exists "locations_update_own" on public.locations;
drop policy if exists "locations_delete_own" on public.locations;

drop policy if exists "gear_profiles_select_own" on public.gear_profiles;
drop policy if exists "gear_profiles_insert_own" on public.gear_profiles;
drop policy if exists "gear_profiles_update_own" on public.gear_profiles;
drop policy if exists "gear_profiles_delete_own" on public.gear_profiles;

drop policy if exists "missions_select_own" on public.missions;
drop policy if exists "missions_insert_own" on public.missions;
drop policy if exists "missions_update_own" on public.missions;
drop policy if exists "missions_delete_own" on public.missions;

drop policy if exists "mission_targets_select_own" on public.mission_targets;
drop policy if exists "mission_targets_insert_own" on public.mission_targets;
drop policy if exists "mission_targets_update_own" on public.mission_targets;
drop policy if exists "mission_targets_delete_own" on public.mission_targets;

drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_update_own" on public.sessions;
drop policy if exists "sessions_delete_own" on public.sessions;

drop policy if exists "session_targets_select_own" on public.session_targets;
drop policy if exists "session_targets_insert_own" on public.session_targets;
drop policy if exists "session_targets_update_own" on public.session_targets;
drop policy if exists "session_targets_delete_own" on public.session_targets;

drop policy if exists "condition_logs_select_own" on public.condition_logs;
drop policy if exists "condition_logs_insert_own" on public.condition_logs;
drop policy if exists "condition_logs_update_own" on public.condition_logs;
drop policy if exists "condition_logs_delete_own" on public.condition_logs;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
drop policy if exists "user_preferences_insert_own" on public.user_preferences;
drop policy if exists "user_preferences_update_own" on public.user_preferences;
drop policy if exists "user_preferences_delete_own" on public.user_preferences;

drop function if exists public.clerk_user_id();

-- ---------------------------------------------------------------------------
-- Remove non-UUID owners (unmapped local-token / old fixtures)
-- ---------------------------------------------------------------------------

delete from public.condition_logs
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.session_targets
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.sessions
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.mission_targets
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.missions
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.gear_profiles
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.locations
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
delete from public.user_preferences
  where user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ---------------------------------------------------------------------------
-- Convert user_id text → uuid; default auth.uid()
-- ---------------------------------------------------------------------------

alter table public.locations
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists locations_user_id_required,
  add constraint locations_user_id_required check (user_id is not null);

alter table public.gear_profiles
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists gear_profiles_user_id_required,
  add constraint gear_profiles_user_id_required check (user_id is not null);

alter table public.missions
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists missions_user_id_required,
  add constraint missions_user_id_required check (user_id is not null);

alter table public.mission_targets
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists mission_targets_user_id_required,
  add constraint mission_targets_user_id_required check (user_id is not null);

alter table public.sessions
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists sessions_user_id_required,
  add constraint sessions_user_id_required check (user_id is not null);

alter table public.session_targets
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists session_targets_user_id_required,
  add constraint session_targets_user_id_required check (user_id is not null);

alter table public.condition_logs
  alter column user_id drop default,
  alter column user_id type uuid using user_id::uuid,
  alter column user_id set default auth.uid(),
  drop constraint if exists condition_logs_user_id_required,
  add constraint condition_logs_user_id_required check (user_id is not null);

alter table public.user_preferences
  alter column user_id type uuid using user_id::uuid,
  drop constraint if exists user_preferences_user_id_required,
  add constraint user_preferences_user_id_required check (user_id is not null);

-- ---------------------------------------------------------------------------
-- RLS: auth.uid() = user_id
-- ---------------------------------------------------------------------------

create policy "locations_select_own"
  on public.locations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "locations_insert_own"
  on public.locations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "locations_update_own"
  on public.locations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "locations_delete_own"
  on public.locations for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "gear_profiles_select_own"
  on public.gear_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "gear_profiles_insert_own"
  on public.gear_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "gear_profiles_update_own"
  on public.gear_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "gear_profiles_delete_own"
  on public.gear_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "missions_select_own"
  on public.missions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "missions_insert_own"
  on public.missions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "missions_update_own"
  on public.missions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "missions_delete_own"
  on public.missions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "mission_targets_select_own"
  on public.mission_targets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "mission_targets_insert_own"
  on public.mission_targets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "mission_targets_update_own"
  on public.mission_targets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "mission_targets_delete_own"
  on public.mission_targets for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "sessions_select_own"
  on public.sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "sessions_insert_own"
  on public.sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "sessions_update_own"
  on public.sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "sessions_delete_own"
  on public.sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "session_targets_select_own"
  on public.session_targets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "session_targets_insert_own"
  on public.session_targets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "session_targets_update_own"
  on public.session_targets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "session_targets_delete_own"
  on public.session_targets for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "condition_logs_select_own"
  on public.condition_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "condition_logs_insert_own"
  on public.condition_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "condition_logs_update_own"
  on public.condition_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "condition_logs_delete_own"
  on public.condition_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_preferences_select_own"
  on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_preferences_insert_own"
  on public.user_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "user_preferences_update_own"
  on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "user_preferences_delete_own"
  on public.user_preferences for delete to authenticated
  using ((select auth.uid()) = user_id);
