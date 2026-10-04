-- Remap local-token owner text id → Supabase Auth UUID (as text).
-- Run BEFORE migration 20261004040000_supabase_auth_uid_rls.sql when you
-- have rows owned by user_local_dev (or another NEXT_PUBLIC_PARALLAX_LOCAL_USER_ID).
--
-- Usage (replace NEW_UUID with your Auth user id from the dashboard or:
--   select id, email from auth.users;
-- ):
--
-- Dry-run (counts only):
--   docker exec -i supabase_db_parallax psql -U postgres -d postgres \
--     -v old_id="'user_local_dev'" -v new_id="'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'" \
--     -v dry_run=1 -f - < scripts/remap-local-user.sql
--
-- Apply:
--   docker exec -i supabase_db_parallax psql -U postgres -d postgres \
--     -v old_id="'user_local_dev'" -v new_id="'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'" \
--     -v dry_run=0 -f - < scripts/remap-local-user.sql
--
-- Rollback (swap old/new):
--   same script with old_id=Auth UUID and new_id='user_local_dev' while columns are still text.

\if :{?old_id}
\else
\set old_id '\'user_local_dev\''
\endif

\if :{?new_id}
\else
\echo 'ERROR: set -v new_id="'\''<auth-uuid>'\''"'
\quit
\endif

\if :{?dry_run}
\else
\set dry_run 1
\endif

\echo '=== Remap dry_run=' :dry_run ' old=' :old_id ' new=' :new_id ' ==='

select 'locations' as tbl, count(*) as n from public.locations where user_id = :old_id
union all select 'gear_profiles', count(*) from public.gear_profiles where user_id = :old_id
union all select 'missions', count(*) from public.missions where user_id = :old_id
union all select 'mission_targets', count(*) from public.mission_targets where user_id = :old_id
union all select 'sessions', count(*) from public.sessions where user_id = :old_id
union all select 'session_targets', count(*) from public.session_targets where user_id = :old_id
union all select 'condition_logs', count(*) from public.condition_logs where user_id = :old_id
union all select 'user_preferences', count(*) from public.user_preferences where user_id = :old_id;

\if :dry_run
\echo 'Dry-run only — no updates. Re-run with -v dry_run=0 to apply.'
\else

begin;

create table if not exists public._user_id_remap_log (
  applied_at timestamptz not null default now(),
  old_user_id text not null,
  new_user_id text not null,
  table_name text not null,
  rows_updated integer not null
);

with u as (
  update public.locations set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'locations', count(*) from u;

with u as (
  update public.gear_profiles set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'gear_profiles', count(*) from u;

with u as (
  update public.missions set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'missions', count(*) from u;

with u as (
  update public.mission_targets set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'mission_targets', count(*) from u;

with u as (
  update public.sessions set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'sessions', count(*) from u;

with u as (
  update public.session_targets set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'session_targets', count(*) from u;

with u as (
  update public.condition_logs set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'condition_logs', count(*) from u;

with u as (
  update public.user_preferences set user_id = :new_id where user_id = :old_id returning 1
)
insert into public._user_id_remap_log (old_user_id, new_user_id, table_name, rows_updated)
select :old_id, :new_id, 'user_preferences', count(*) from u;

commit;

\echo 'Apply complete. Latest log:'
select * from public._user_id_remap_log order by applied_at desc limit 20;

\endif
