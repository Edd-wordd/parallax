-- RLS verification fixture for Supabase Auth (UUID user_id + auth.uid()).
--
-- HOW TO RUN (after migrations):
--   docker exec -i supabase_db_parallax psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
--     < supabase/fixtures/rls_two_user_verify.sql
--
-- Seeds two auth.users and owned rows. Verify with JWT claims (examples at bottom):
--   A sees own rows; B sees zero of A's; missing/wrong sub → zero.

begin;

-- Fixed Auth user ids
-- A: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- B: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

delete from public.condition_logs
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.session_targets
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.sessions
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.mission_targets
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.missions
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.gear_profiles
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.locations
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from public.user_preferences
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );

delete from auth.identities
  where user_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );
delete from auth.users
  where id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  );

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'user-a@example.com',
    crypt('password-a', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'user-b@example.com',
    crypt('password-b', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now(), '', '', '', ''
  );

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    jsonb_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'email', 'user-a@example.com'),
    'email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    jsonb_build_object('sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'email', 'user-b@example.com'),
    'email', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', now(), now(), now()
  );

insert into public.user_preferences (user_id, default_min_altitude, default_moon_tolerance, units)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 30, 15, 'metric'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 25, 20, 'imperial');

insert into public.locations (id, user_id, name, lat, lon, bortle, notes)
values
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Site A', 37.77, -122.42, 4, 'User A only'),
  ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Site B', 36.49, -121.18, 3, 'User B only');

insert into public.gear_profiles (
  id, user_id, name, telescope_name, focal_length, aperture, camera_name,
  sensor_preset, mount_type, guiding, is_active
)
values
  (
    '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Rig A',
    'SW 72ED', 420, 72, 'ASI533', '1inch', 'equatorial', true, true
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Rig B',
    'C8', 2032, 203, 'ASI178', '1inch', 'equatorial', true, true
  );

insert into public.missions (
  id, user_id, name, date_time, location_id, gear_id,
  mission_type, objective, status, phase, log_locked
)
values
  (
    'a1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Night A',
    now(), 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'deep_sky', 'deep_integration', 'completed', 'completed', true
  ),
  (
    'b2222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Night B',
    now(), 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'deep_sky', 'quick_session', 'completed', 'completed', true
  );

insert into public.mission_targets (
  id, mission_id, user_id, catalog_id, target_name, target_type,
  planned_window_start, planned_window_end, score, planned_iso_gain
)
values
  (
    'a3333333-3333-4333-8333-333333333333',
    'a1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'm42', 'M42', 'nebula', '21:00', '01:00', 94, '800'
  ),
  (
    'b3333333-3333-4333-8333-333333333333',
    'b2222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'm31', 'M31', 'galaxy', '22:00', '02:00', 80, '400'
  );

insert into public.sessions (
  id, user_id, mission_id, location_id, started_at, ended_at,
  outcome_score, session_software, what_i_learned
)
values
  (
    'a4444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    now() - interval '4 hours', now(), 8, 'nina', 'Good tracking'
  ),
  (
    'b4444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'b2222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    now() - interval '3 hours', now(), 6, 'asiair', null
  );

insert into public.session_targets (
  id, session_id, user_id, catalog_id, target_name,
  frames_captured, exposure_seconds, iso
)
values
  (
    'a5555555-5555-4555-8555-555555555555',
    'a4444444-4444-4444-8444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'm42', 'M42', 45, 120, 800
  ),
  (
    'b5555555-5555-4555-8555-555555555555',
    'b4444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'm31', 'M31', 30, 180, 400
  );

insert into public.condition_logs (
  id, user_id, mission_id, session_id, recorded_at, source, event_type, payload
)
values
  (
    'a6666666-6666-4666-8666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'a1111111-1111-4111-8111-111111111111',
    'a4444444-4444-4444-8444-444444444444',
    now() - interval '2 hours', 'manual', null,
    '{"clouds": 10, "seeing": 3}'::jsonb
  ),
  (
    'b6666666-6666-4666-8666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'b2222222-2222-4222-8222-222222222222',
    'b4444444-4444-4444-8444-444444444444',
    now() - interval '1 hour', 'live', null,
    '{"clouds": 40}'::jsonb
  );

commit;

-- ---------------------------------------------------------------------------
-- JWT claim simulation examples (run after commit, as postgres):
--
-- User A:
--   select set_config(
--     'request.jwt.claims',
--     '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}',
--     true
--   );
--   set local role authenticated;
--   select count(*) from public.sessions;  -- expect 1
--   select count(*) from public.sessions
--     where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';  -- expect 0
--
-- Wrong / missing sub:
--   select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
--   set local role authenticated;
--   select count(*) from public.sessions;  -- expect 0
-- ---------------------------------------------------------------------------
