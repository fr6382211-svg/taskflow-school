-- TASKFLOW v2: multi-device login/session visibility.
-- Safe to run repeatedly.

create table if not exists public.login_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_key text not null,
  login_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  logout_at timestamptz,
  is_current boolean not null default true,
  device_type text not null default 'unknown' check (device_type in ('mobile','tablet','desktop','unknown')),
  os text not null default 'Unknown OS',
  browser text not null default 'Browser',
  device_name text not null default 'Perangkat',
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists login_sessions_user_login_idx
  on public.login_sessions(user_id, login_at desc);
create index if not exists login_sessions_user_current_idx
  on public.login_sessions(user_id, is_current);

alter table public.login_sessions enable row level security;

drop policy if exists login_sessions_select_own on public.login_sessions;
create policy login_sessions_select_own
  on public.login_sessions for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists login_sessions_insert_own on public.login_sessions;
create policy login_sessions_insert_own
  on public.login_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists login_sessions_update_own on public.login_sessions;
create policy login_sessions_update_own
  on public.login_sessions for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update on public.login_sessions to authenticated;
