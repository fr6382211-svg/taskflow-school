-- Fathur School Hub v7: cloud-first intelligence and collaboration layer
create extension if not exists pgcrypto;

create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  target integer not null default 10 check (target between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table if not exists public.collaboration_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null check (workspace_id in ('fathur','mazet')),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('cheer','presence_join','presence_activity','presence_leave')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id text not null check (workspace_id in ('fathur','mazet')),
  risk_level text not null check (risk_level in ('aman','waspada','kritis')),
  total_tasks integer not null default 0,
  completed_tasks integer not null default 0,
  overdue_tasks integer not null default 0,
  focus_minutes integer not null default 0,
  current_streak integer not null default 0,
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists weekly_goals_user_week_idx on public.weekly_goals(user_id, week_start desc);
create index if not exists collaboration_events_workspace_time_idx on public.collaboration_events(workspace_id, created_at desc);
create index if not exists collaboration_events_user_time_idx on public.collaboration_events(user_id, created_at desc);
create index if not exists insight_snapshots_user_time_idx on public.insight_snapshots(user_id, created_at desc);

create or replace function public.v7_touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_weekly_goals_updated_at on public.weekly_goals;
create trigger trg_weekly_goals_updated_at before update on public.weekly_goals for each row execute function public.v7_touch_updated_at();

alter table public.weekly_goals enable row level security;
alter table public.collaboration_events enable row level security;
alter table public.insight_snapshots enable row level security;

drop policy if exists weekly_goals_select_own on public.weekly_goals;
create policy weekly_goals_select_own on public.weekly_goals for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists weekly_goals_insert_own on public.weekly_goals;
create policy weekly_goals_insert_own on public.weekly_goals for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists weekly_goals_update_own on public.weekly_goals;
create policy weekly_goals_update_own on public.weekly_goals for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists weekly_goals_delete_own on public.weekly_goals;
create policy weekly_goals_delete_own on public.weekly_goals for delete to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists collaboration_events_select_workspace on public.collaboration_events;
create policy collaboration_events_select_workspace on public.collaboration_events for select to authenticated using (user_id = auth.uid() or public.is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.workspace_id = collaboration_events.workspace_id));
drop policy if exists collaboration_events_insert_own on public.collaboration_events;
create policy collaboration_events_insert_own on public.collaboration_events for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

-- Events are immutable from the client after insertion.
drop policy if exists collaboration_events_update_none on public.collaboration_events;
create policy collaboration_events_update_none on public.collaboration_events for update to authenticated using (false) with check (false);
drop policy if exists collaboration_events_delete_admin on public.collaboration_events;
create policy collaboration_events_delete_admin on public.collaboration_events for delete to authenticated using (public.is_admin());

drop policy if exists insight_snapshots_select_own on public.insight_snapshots;
create policy insight_snapshots_select_own on public.insight_snapshots for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists insight_snapshots_insert_own on public.insight_snapshots;
create policy insight_snapshots_insert_own on public.insight_snapshots for insert to authenticated with check (user_id = auth.uid() or public.is_admin());
drop policy if exists insight_snapshots_delete_own on public.insight_snapshots;
create policy insight_snapshots_delete_own on public.insight_snapshots for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Seed one goal row for existing accounts for the current week.
insert into public.weekly_goals (user_id, week_start, target)
select id, date_trunc('week', now())::date, 10 from auth.users
on conflict (user_id, week_start) do nothing;
