-- Fathur School Hub v4.3
-- Production activity ledger + daily 18:00 digest support.

create extension if not exists pgcrypto;

create table if not exists public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid references public.login_sessions(id) on delete set null,
  event_type text not null check (event_type in ('login','heartbeat','logout','revoke','ip_change','device_change','security_check')),
  ip_address inet,
  device_id text,
  device_type text,
  manufacturer text,
  device_model text,
  device_name text,
  os text,
  os_version text,
  browser text,
  browser_version text,
  user_agent text,
  client_timezone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists login_activity_user_created_idx
  on public.login_activity(user_id, created_at desc);
create index if not exists login_activity_event_idx
  on public.login_activity(event_type, created_at desc);
create index if not exists login_activity_ip_idx
  on public.login_activity(ip_address);

alter table public.login_activity enable row level security;

drop policy if exists login_activity_self_select on public.login_activity;
create policy login_activity_self_select
  on public.login_activity for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only trusted RPCs write activity records from the browser.
drop policy if exists login_activity_insert on public.login_activity;
create policy login_activity_insert
  on public.login_activity for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert on public.login_activity to authenticated;

create or replace function public.record_login_activity_v2(
  p_event_type text,
  p_session_id uuid default null,
  p_device_id text default null,
  p_device_type text default null,
  p_manufacturer text default null,
  p_device_model text default null,
  p_device_name text default null,
  p_os text default null,
  p_os_version text default null,
  p_browser text default null,
  p_browser_version text default null,
  p_client_timezone text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.login_activity
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ip inet := public.request_client_ip();
  v_ua text := public.request_user_agent();
  v_row public.login_activity;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_event_type not in ('login','heartbeat','logout','revoke','ip_change','device_change','security_check') then
    raise exception 'invalid_activity_event';
  end if;

  insert into public.login_activity(
    user_id, session_id, event_type, ip_address, device_id,
    device_type, manufacturer, device_model, device_name,
    os, os_version, browser, browser_version, user_agent,
    client_timezone, metadata
  ) values (
    v_uid, p_session_id, p_event_type, v_ip, p_device_id,
    p_device_type, p_manufacturer, p_device_model, p_device_name,
    p_os, p_os_version, p_browser, p_browser_version, v_ua,
    p_client_timezone, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.record_login_activity_v2(
  text, uuid, text, text, text, text, text, text, text, text, text, text, jsonb
) to authenticated;

-- Daily digest idempotency: one digest per user/date.
create table if not exists public.daily_email_digest_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  digest_date date not null,
  sent_at timestamptz not null default now(),
  task_count integer not null default 0,
  lesson_count integer not null default 0,
  provider_message_id text,
  unique(user_id, digest_date)
);

create index if not exists daily_email_digest_log_date_idx
  on public.daily_email_digest_log(digest_date, sent_at desc);

alter table public.daily_email_digest_log enable row level security;

drop policy if exists daily_email_digest_log_admin_select on public.daily_email_digest_log;
create policy daily_email_digest_log_admin_select
  on public.daily_email_digest_log for select to authenticated
  using (public.is_admin());

grant select on public.daily_email_digest_log to authenticated;

-- Public helper for the Edge Function (called with service role).
create or replace function public.get_daily_digest_targets(p_target_date date)
returns table (
  user_id uuid,
  name text,
  email text,
  workspace_id text,
  tasks jsonb,
  lesson_date date
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.name,
    u.email,
    coalesce(u.workspace_id, 'fathur'),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'subjectName', t.subject_name,
        'dueDate', t.due_date,
        'dueTime', t.due_time,
        'priority', t.priority,
        'status', t.status
      ) order by t.due_time, t.priority desc, t.created_at
      )
      from public.tasks t
      where t.assigned_to = u.id
        and t.due_date = p_target_date
        and t.status <> 'completed'
    ), '[]'::jsonb),
    p_target_date
  from public.users u
  left join public.settings s on s.user_id = u.id
  where u.status = 'active'
    and u.email is not null
    and coalesce(s.email_notifications, true) = true;
$$;

grant execute on function public.get_daily_digest_targets(date) to service_role;
