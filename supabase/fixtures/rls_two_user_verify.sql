-- Phase C RLS verification fixture (run against a DB with migrations applied).
-- Uses Clerk-shaped user ids (text), NOT Supabase auth.users UUIDs.
--
-- HOW TO RUN:
--   docker exec -i supabase_db_parallax psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/fixtures/rls_two_user_verify.sql
--
-- Clerk mapping (production app):
--   auth.jwt()->>'sub'  = Clerk user id
--   auth.jwt()->>'role' = 'authenticated'
-- Docs: https://clerk.com/docs/integrations/databases/supabase

begin;

delete from public.condition_logs
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.session_targets
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.sessions
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.mission_targets
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.missions
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.gear_profiles
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.locations
  where user_id in ('user_fixture_a', 'user_fixture_b');
delete from public.user_preferences
  where user_id in ('user_fixture_a', 'user_fixture_b');

insert into public.user_preferences (user_id, default_min_altitude, default_moon_tolerance, units)
values
  ('user_fixture_a', 30, 15, 'metric'),
  ('user_fixture_b', 25, 20, 'imperial');

insert into public.locations (id, user_id, name, lat, lon, bortle, notes)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'user_fixture_a', 'Site A', 37.77, -122.42, 4, 'User A only'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'user_fixture_b', 'Site B', 36.49, -121.18, 3, 'User B only');

insert into public.gear_profiles (
  id, user_id, name, telescope_name, focal_length, aperture, camera_name,
  sensor_preset, mount_type, guiding, is_active
)
values
  (
    '11111111-1111-1111-1111-111111111111', 'user_fixture_a', 'Rig A',
    'SW 72ED', 420, 72, 'ASI533', '1inch', 'equatorial', true, true
  ),
  (
    '22222222-2222-2222-2222-222222222222', 'user_fixture_b', 'Rig B',
    'C8', 2032, 203, 'ASI178', '1inch', 'equatorial', true, true
  );

insert into public.missions (
  id, user_id, name, date_time, location_id, gear_id,
  mission_type, objective, status, phase, log_locked
)
values
  (
    'a1111111-1111-1111-1111-111111111111', 'user_fixture_a', 'Night A',
    now(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'deep_sky', 'deep_integration', 'completed', 'completed', true
  ),
  (
    'b2222222-2222-2222-2222-222222222222', 'user_fixture_b', 'Night B',
    now(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'deep_sky', 'quick_session', 'completed', 'completed', true
  );

insert into public.mission_targets (
  id, mission_id, user_id, catalog_id, target_name, target_type,
  planned_window_start, planned_window_end, score, planned_iso_gain
)
values
  (
    'a3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111', 'user_fixture_a',
    'm42', 'M42', 'nebula', '21:00', '01:00', 94, '800'
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222', 'user_fixture_b',
    'm31', 'M31', 'galaxy', '22:00', '02:00', 80, '400'
  );

insert into public.sessions (
  id, user_id, mission_id, location_id, started_at, ended_at,
  outcome_score, session_software, what_i_learned
)
values
  (
    'a4444444-4444-4444-4444-444444444444', 'user_fixture_a',
    'a1111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    now() - interval '4 hours', now(), 8, 'nina', 'Good tracking'
  ),
  (
    'b4444444-4444-4444-4444-444444444444', 'user_fixture_b',
    'b2222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now() - interval '3 hours', now(), 6, 'asiair', null
  );

insert into public.session_targets (
  id, session_id, user_id, catalog_id, target_name,
  frames_captured, exposure_seconds, iso
)
values
  (
    'a5555555-5555-5555-5555-555555555555',
    'a4444444-4444-4444-4444-444444444444', 'user_fixture_a',
    'm42', 'M42', 45, 120, 800
  ),
  (
    'b5555555-5555-5555-5555-555555555555',
    'b4444444-4444-4444-4444-444444444444', 'user_fixture_b',
    'm31', 'M31', 30, 180, 400
  );

insert into public.condition_logs (
  id, user_id, mission_id, session_id, recorded_at, source, event_type, payload
)
values
  (
    'a6666666-6666-6666-6666-666666666666', 'user_fixture_a',
    'a1111111-1111-1111-1111-111111111111',
    'a4444444-4444-4444-4444-444444444444',
    now() - interval '2 hours', 'manual', null,
    '{"clouds": 10, "seeing": 3}'::jsonb
  ),
  (
    'a6666666-6666-6666-6666-666666666667', 'user_fixture_a',
    'a1111111-1111-1111-1111-111111111111',
    'a4444444-4444-4444-4444-444444444444',
    now() - interval '90 minutes', 'telemetry', 'guiding_started',
    '{"guide_rms": 0.6}'::jsonb
  ),
  (
    'b6666666-6666-6666-6666-666666666666', 'user_fixture_b',
    'b2222222-2222-2222-2222-222222222222',
    'b4444444-4444-4444-4444-444444444444',
    now() - interval '1 hour', 'live', null,
    '{"clouds": 40}'::jsonb
  );

commit;
