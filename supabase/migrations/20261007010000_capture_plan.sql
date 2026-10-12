-- Capture worksheet: proposed settings separate from actuals; session planned snapshot; timeline kind.

alter table public.mission_targets
  add column if not exists proposed_filter text,
  add column if not exists proposed_sub_length_seconds integer,
  add column if not exists proposed_iso integer,
  add column if not exists proposed_gain integer,
  add column if not exists proposed_integration_minutes integer;

comment on column public.mission_targets.proposed_filter is
  'Proposed filter for capture plan (not actual).';
comment on column public.mission_targets.proposed_sub_length_seconds is
  'Proposed sub-exposure length in seconds.';
comment on column public.mission_targets.proposed_iso is
  'Proposed ISO when camera uses ISO.';
comment on column public.mission_targets.proposed_gain is
  'Proposed gain when camera uses gain.';
comment on column public.mission_targets.proposed_integration_minutes is
  'Desired on-target integration minutes for the plan.';

-- One-time: copy legacy recipe fields into proposed_* when proposed is empty.
update public.mission_targets
set
  proposed_sub_length_seconds = coalesce(
    proposed_sub_length_seconds,
    case when sub_length is not null then round(sub_length)::integer else null end
  ),
  proposed_iso = coalesce(
    proposed_iso,
    case
      when planned_iso_gain ~ '^[0-9]+$' then planned_iso_gain::integer
      else null
    end
  ),
  proposed_integration_minutes = coalesce(
    proposed_integration_minutes,
    case
      when sub_length is not null and frames is not null and sub_length > 0
        then greatest(1, round((frames * sub_length) / 60.0)::integer)
      else null
    end
  )
where proposed_sub_length_seconds is null
   or proposed_iso is null
   or proposed_integration_minutes is null;

alter table public.session_targets
  add column if not exists planned_filter text,
  add column if not exists planned_sub_length_seconds integer,
  add column if not exists planned_iso integer,
  add column if not exists planned_gain integer,
  add column if not exists planned_integration_minutes integer,
  add column if not exists planned_frames integer;

comment on column public.session_targets.planned_filter is
  'Snapshot of proposed filter at Save Log.';
comment on column public.session_targets.planned_frames is
  'Snapshot of derived planned frame count at Save Log.';

-- Expand mission_events.kind check to include capture_plan_updated
alter table public.mission_events
  drop constraint if exists mission_events_kind_check;

alter table public.mission_events
  add constraint mission_events_kind_check
  check (kind in (
    'phase_change',
    'target_added',
    'target_removed',
    'target_reordered',
    'target_completed',
    'target_skipped',
    'schedule_changed',
    'field_reading',
    'actuals_updated',
    'capture_plan_updated',
    'note',
    'save_log',
    'correction'
  ));
