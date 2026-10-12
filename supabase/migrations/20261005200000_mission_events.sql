-- Append-only observing timeline for missions / sessions.

create table public.mission_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  recorded_at timestamptz not null,
  kind text not null
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
      'note',
      'save_log',
      'correction'
    )),
  source text not null
    check (source in ('user', 'system', 'forecast', 'astronomy', 'manual')),
  catalog_id text,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  corrects_event_id uuid references public.mission_events (id) on delete set null,
  client_event_id uuid,
  created_at timestamptz not null default now(),
  constraint mission_events_user_id_required check (user_id is not null)
);

create unique index mission_events_user_client_event_uidx
  on public.mission_events (user_id, client_event_id)
  where client_event_id is not null;

create index mission_events_mission_recorded_idx
  on public.mission_events (mission_id, recorded_at);

create index mission_events_session_recorded_idx
  on public.mission_events (session_id, recorded_at)
  where session_id is not null;

alter table public.mission_events enable row level security;

create policy "mission_events_select_own"
  on public.mission_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "mission_events_insert_own"
  on public.mission_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Allow attaching session_id after Save Log (and similar metadata-only updates)
create policy "mission_events_update_own"
  on public.mission_events for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.mission_events is
  'Append-only observing timeline. Corrections insert new rows linked via corrects_event_id.';
