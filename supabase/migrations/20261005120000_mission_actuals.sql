-- Actual capture times and session target results for observing logs.

alter table public.mission_targets
  add column if not exists actual_start_at timestamptz,
  add column if not exists actual_end_at timestamptz;

comment on column public.mission_targets.actual_start_at is
  'User-recorded actual imaging start (timestamptz). Null = not recorded.';
comment on column public.mission_targets.actual_end_at is
  'User-recorded actual imaging end (timestamptz).';

alter table public.session_targets
  add column if not exists actual_start_at timestamptz,
  add column if not exists actual_end_at timestamptz,
  add column if not exists result text;

alter table public.session_targets
  drop constraint if exists session_targets_result_check;

alter table public.session_targets
  add constraint session_targets_result_check
  check (
    result is null
    or result in ('success', 'partial', 'failed', 'skipped')
  );

comment on column public.session_targets.actual_start_at is
  'Copied from mission target actual start on Save Log.';
comment on column public.session_targets.actual_end_at is
  'Copied from mission target actual end on Save Log.';
comment on column public.session_targets.result is
  'Per-target outcome: success | partial | failed | skipped.';
