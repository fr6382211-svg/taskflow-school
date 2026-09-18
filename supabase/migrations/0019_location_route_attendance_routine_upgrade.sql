-- ============================================================
-- FATHUR SCHOOL HUB — MIGRATION 0019
-- ROUTES, JOURNEYS, ATTENDANCE & ROUTINE INTELLIGENCE
-- ============================================================
-- Safe additive migration. Existing tables/data are preserved.
-- This migration does not modify the Tasks system.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- ROUTE RULES
-- ------------------------------------------------------------

create table if not exists public.location_routes (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null,

  origin_location text not null,
  destination_location text not null,

  departure_time time not null,
  arrival_deadline time not null,

  reminder_before_minutes integer not null default 0,
  no_movement_after_minutes integer not null default 5,
  grace_period_minutes integer not null default 5,

  active_days smallint[] not null
    default '{1,2,3,4,5}',

  enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint location_routes_times_check
    check (arrival_deadline >= departure_time),

  constraint location_routes_reminder_check
    check (reminder_before_minutes between 0 and 180),

  constraint location_routes_nomovement_check
    check (no_movement_after_minutes between 1 and 60),

  constraint location_routes_grace_check
    check (grace_period_minutes between 0 and 60)
);

create index if not exists location_routes_user_active_idx
on public.location_routes(user_id, enabled);

-- ------------------------------------------------------------
-- LIVE / COMPLETED JOURNEYS
-- ------------------------------------------------------------

create table if not exists public.location_journeys (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  route_id uuid
    references public.location_routes(id)
    on delete set null,

  origin_location text not null,
  destination_location text not null,

  status text not null default 'scheduled',

  started_at timestamptz,
  departed_at timestamptz,
  arrived_at timestamptz,

  estimated_arrival timestamptz,

  scheduled_departure timestamptz,
  arrival_deadline timestamptz,

  delay_minutes integer not null default 0,

  confidence numeric(5,4),

  manual_override boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint location_journeys_status_check
    check (
      status in (
        'scheduled',
        'reminder',
        'not_moving',
        'departed',
        'traveling',
        'arriving',
        'arrived_on_time',
        'arrived_late',
        'late',
        'not_arrived',
        'cancelled'
      )
    ),

  constraint location_journeys_confidence_check
    check (
      confidence is null
      or confidence between 0 and 1
    ),

  constraint location_journeys_delay_check
    check (delay_minutes >= 0)
);

create index if not exists location_journeys_user_time_idx
on public.location_journeys(user_id, created_at desc);

create index if not exists location_journeys_user_status_idx
on public.location_journeys(user_id, status, created_at desc);

-- ------------------------------------------------------------
-- ATTENDANCE / ARRIVAL RECORDS
-- ------------------------------------------------------------

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  journey_id uuid
    references public.location_journeys(id)
    on delete set null,

  route_id uuid
    references public.location_routes(id)
    on delete set null,

  scheduled_time timestamptz,
  actual_arrival timestamptz,

  status text not null default 'scheduled',

  delay_minutes integer not null default 0,

  confidence numeric(5,4),

  evidence text,

  created_at timestamptz not null default now(),

  constraint attendance_logs_status_check
    check (
      status in (
        'scheduled',
        'on_time',
        'late',
        'not_arrived',
        'location_unknown',
        'manual_override',
        'cancelled'
      )
    ),

  constraint attendance_logs_delay_check
    check (delay_minutes >= 0),

  constraint attendance_logs_confidence_check
    check (
      confidence is null
      or confidence between 0 and 1
    )
);

create index if not exists attendance_logs_user_time_idx
on public.attendance_logs(user_id, scheduled_time desc);

-- ------------------------------------------------------------
-- ROUTINE PATTERNS
-- ------------------------------------------------------------

create table if not exists public.routine_patterns (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  day_of_week smallint not null,
  origin_location text not null,
  destination_location text not null,

  usual_departure time,
  usual_arrival time,

  sample_count integer not null default 0,
  confidence numeric(5,4) not null default 0,

  last_observed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (
    user_id,
    day_of_week,
    origin_location,
    destination_location
  ),

  constraint routine_patterns_day_check
    check (day_of_week between 0 and 6),

  constraint routine_patterns_sample_check
    check (sample_count >= 0),

  constraint routine_patterns_confidence_check
    check (confidence between 0 and 1)
);

create index if not exists routine_patterns_user_day_idx
on public.routine_patterns(user_id, day_of_week);

-- ------------------------------------------------------------
-- TRACKING SESSIONS / PERMISSION AUDIT
-- ------------------------------------------------------------

create table if not exists public.location_tracking_sessions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  mode text not null default 'auto',

  started_at timestamptz not null default now(),
  stopped_at timestamptz,

  permission_state text,
  user_agent text,

  last_latitude double precision,
  last_longitude double precision,
  last_accuracy_m double precision,
  last_seen_at timestamptz,

  created_at timestamptz not null default now(),

  constraint tracking_session_mode_check
    check (
      mode in ('auto','manual','paused')
    )
);

create index if not exists tracking_sessions_user_time_idx
on public.location_tracking_sessions(user_id, started_at desc);

-- ------------------------------------------------------------
-- UPDATED AT
-- ------------------------------------------------------------

create or replace function public.location_upgrade_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_location_routes_updated_at
on public.location_routes;

create trigger trg_location_routes_updated_at
before update on public.location_routes
for each row
execute function public.location_upgrade_touch_updated_at();

drop trigger if exists trg_location_journeys_updated_at
on public.location_journeys;

create trigger trg_location_journeys_updated_at
before update on public.location_journeys
for each row
execute function public.location_upgrade_touch_updated_at();

drop trigger if exists trg_routine_patterns_updated_at
on public.routine_patterns;

create trigger trg_routine_patterns_updated_at
before update on public.routine_patterns
for each row
execute function public.location_upgrade_touch_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.location_routes enable row level security;
alter table public.location_journeys enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.routine_patterns enable row level security;
alter table public.location_tracking_sessions enable row level security;

drop policy if exists location_routes_select_own
on public.location_routes;

create policy location_routes_select_own
on public.location_routes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists location_routes_insert_own
on public.location_routes;

create policy location_routes_insert_own
on public.location_routes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists location_routes_update_own
on public.location_routes;

create policy location_routes_update_own
on public.location_routes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists location_routes_delete_own
on public.location_routes;

create policy location_routes_delete_own
on public.location_routes
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists location_journeys_select_own
on public.location_journeys;

create policy location_journeys_select_own
on public.location_journeys
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists location_journeys_insert_own
on public.location_journeys;

create policy location_journeys_insert_own
on public.location_journeys
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists location_journeys_update_own
on public.location_journeys;

create policy location_journeys_update_own
on public.location_journeys
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists attendance_logs_select_own
on public.attendance_logs;

create policy attendance_logs_select_own
on public.attendance_logs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists attendance_logs_insert_own
on public.attendance_logs;

create policy attendance_logs_insert_own
on public.attendance_logs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists routine_patterns_select_own
on public.routine_patterns;

create policy routine_patterns_select_own
on public.routine_patterns
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists routine_patterns_insert_own
on public.routine_patterns;

create policy routine_patterns_insert_own
on public.routine_patterns
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists routine_patterns_update_own
on public.routine_patterns;

create policy routine_patterns_update_own
on public.routine_patterns
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists tracking_sessions_select_own
on public.location_tracking_sessions;

create policy tracking_sessions_select_own
on public.location_tracking_sessions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists tracking_sessions_insert_own
on public.location_tracking_sessions;

create policy tracking_sessions_insert_own
on public.location_tracking_sessions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists tracking_sessions_update_own
on public.location_tracking_sessions;

create policy tracking_sessions_update_own
on public.location_tracking_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- HELPER: RECORD ARRIVAL / ATTENDANCE
-- ------------------------------------------------------------

create or replace function public.record_location_attendance(
  p_journey_id uuid,
  p_status text,
  p_actual_arrival timestamptz,
  p_delay_minutes integer default 0,
  p_confidence numeric default null,
  p_evidence text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_route_id uuid;
  v_scheduled timestamptz;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select
    route_id,
    arrival_deadline
  into
    v_route_id,
    v_scheduled
  from public.location_journeys
  where id = p_journey_id
    and user_id = v_user_id;

  if not found then
    raise exception 'journey_not_found';
  end if;

  insert into public.attendance_logs (
    user_id,
    journey_id,
    route_id,
    scheduled_time,
    actual_arrival,
    status,
    delay_minutes,
    confidence,
    evidence
  )
  values (
    v_user_id,
    p_journey_id,
    v_route_id,
    v_scheduled,
    p_actual_arrival,
    p_status,
    greatest(0, coalesce(p_delay_minutes, 0)),
    p_confidence,
    p_evidence
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all
on function public.record_location_attendance(
  uuid,
  text,
  timestamptz,
  integer,
  numeric,
  text
)
from public, anon;

grant execute
on function public.record_location_attendance(
  uuid,
  text,
  timestamptz,
  integer,
  numeric,
  text
)
to authenticated;

-- ------------------------------------------------------------
-- RETENTION
-- ------------------------------------------------------------

create or replace function public.cleanup_location_operational_history()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.location_journeys
  where created_at < now() - interval '180 days';

  delete from public.attendance_logs
  where created_at < now() - interval '365 days';

  delete from public.location_tracking_sessions
  where created_at < now() - interval '90 days';
end;
$$;

revoke all
on function public.cleanup_location_operational_history()
from public, anon, authenticated;

grant execute
on function public.cleanup_location_operational_history()
to service_role;

-- ============================================================
-- END 0019
-- ============================================================
