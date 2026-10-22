-- Gear build sheet: mount class, tracking, cooling, accessories, notes.
-- Keeps mount_type (equatorial|alt-az) and guiding boolean for existing readers.

alter table public.gear_profiles
  add column if not exists mount_class text not null default 'stock'
    constraint gear_profiles_mount_class_check
      check (mount_class in ('stock', 'custom_diy', 'star_tracker')),
  add column if not exists tracking text not null default 'none'
    constraint gear_profiles_tracking_check
      check (tracking in ('none', 'motorized', 'guided')),
  add column if not exists camera_cooled boolean not null default false,
  add column if not exists accessories text[] not null default '{}',
  add column if not exists mount_notes text null;

-- Align tracking with legacy guiding flag for existing rows.
update public.gear_profiles
set tracking = 'guided'
where guiding = true
  and tracking = 'none';

comment on column public.gear_profiles.mount_class is
  'stock kit vs custom/DIY vs star tracker — geometry still uses mount_type';
comment on column public.gear_profiles.tracking is
  'none | motorized | guided; guiding boolean should match guided';
comment on column public.gear_profiles.accessories is
  'Optional tags: focus_mask, flattener_coma, dew_control, filters_owned';
