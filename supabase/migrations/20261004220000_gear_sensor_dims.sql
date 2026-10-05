-- Sensor dimensions + optional optics factor for rig framing.
-- Existing rows keep NULL dims (Unknown framing until user edits).
-- sensor_preset remains for legacy read; new writes may keep a known enum or default.

alter table public.gear_profiles
  add column if not exists sensor_width_mm numeric
    check (sensor_width_mm is null or (sensor_width_mm > 0 and sensor_width_mm <= 50)),
  add column if not exists sensor_height_mm numeric
    check (sensor_height_mm is null or (sensor_height_mm > 0 and sensor_height_mm <= 50)),
  add column if not exists optics_factor numeric
    check (optics_factor is null or optics_factor > 0);

comment on column public.gear_profiles.sensor_width_mm is
  'Sensor active width in mm; required for FOV framing when set with height';
comment on column public.gear_profiles.sensor_height_mm is
  'Sensor active height in mm; required for FOV framing when set with width';
comment on column public.gear_profiles.optics_factor is
  'Optional reducer (<1) or Barlow (>1). Null means use entered focal_length as-is.';
