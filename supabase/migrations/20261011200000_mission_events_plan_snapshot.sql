-- Allow plan snapshot / mission started timeline events

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
    'plan_snapshot',
    'mission_started',
    'note',
    'save_log',
    'correction'
  ));
