-- Location & Routine Intelligence foundation
create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('home','school','tutoring')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_meters integer not null check (radius_meters > 0 and radius_meters <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists locations_user_type_unique
  on public.locations(user_id, type);

create table if not exists public.location_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy double precision,
  speed double precision,
  heading double precision,
  recorded_at timestamptz not null default now(),
  detected_location text,
  previous_location text,
  destination text,
  status text,
  confidence numeric(5,4),
  created_at timestamptz not null default now()
);

create index if not exists location_events_user_time_idx
  on public.location_events(user_id, recorded_at desc);

create table if not exists public.location_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  location_type text,
  previous_location text,
  next_location text,
  status text,
  confidence numeric(5,4),
  created_at timestamptz not null default now()
);

create index if not exists location_history_user_started_idx
  on public.location_history(user_id, started_at desc);

create table if not exists public.user_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  from_location text not null,
  to_location text not null,
  usual_start_time time,
  usual_duration_minutes integer,
  frequency integer not null default 0,
  confidence numeric(5,4) not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, day_of_week, from_location, to_location)
);

create table if not exists public.location_tracking_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tracking_mode text not null default 'auto' check (tracking_mode in ('auto','manual','paused')),
  retention_days integer not null default 30 check (retention_days between 1 and 3650),
  updated_at timestamptz not null default now()
);

alter table public.locations enable row level security;
alter table public.location_events enable row level security;
alter table public.location_history enable row level security;
alter table public.user_routines enable row level security;
alter table public.location_tracking_preferences enable row level security;

create policy if not exists locations_select_own on public.locations
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists locations_insert_own on public.locations
for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy if not exists locations_update_own on public.locations
for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy if not exists locations_delete_own on public.locations
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists location_events_select_own on public.location_events
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists location_events_insert_own on public.location_events
for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy if not exists location_events_delete_own on public.location_events
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists location_history_select_own on public.location_history
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists location_history_insert_own on public.location_history
for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy if not exists location_history_delete_own on public.location_history
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists routines_select_own on public.user_routines
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists routines_insert_own on public.user_routines
for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy if not exists routines_update_own on public.user_routines
for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy if not exists routines_delete_own on public.user_routines
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists tracking_preferences_select_own on public.location_tracking_preferences
for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy if not exists tracking_preferences_insert_own on public.location_tracking_preferences
for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

create policy if not exists tracking_preferences_update_own on public.location_tracking_preferences
for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

insert into public.location_tracking_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
