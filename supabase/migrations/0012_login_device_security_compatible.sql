-- FATHUR SCHOOL HUB
-- Production-safe login/device tracking upgrade.
-- Compatible with the existing login_sessions schema that uses:
--   is_current + logout_at
-- instead of a required status column.
-- Idempotent: safe to run after 0008_login_sessions.sql.

create extension if not exists pgcrypto;

-- Add richer device/network metadata without breaking existing columns.
alter table public.login_sessions
  add column if not exists ip_address inet,
  add column if not exists manufacturer text,
  add column if not exists device_model text,
  add column if not exists device_name_exact text,
  add column if not exists os_version text,
  add column if not exists browser_version text,
  add column if not exists client_timezone text,
  add column if not exists screen_width integer,
  add column if not exists screen_height integer,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_reason text;

create index if not exists login_sessions_user_active_idx
  on public.login_sessions(user_id, is_current, logout_at, last_seen_at desc);

create index if not exists login_sessions_ip_idx
  on public.login_sessions(ip_address);

create index if not exists login_sessions_device_model_idx
  on public.login_sessions(device_model);

-- Server-derived request IP.
-- Prefer Cloudflare's connecting IP, then the first forwarded address.
create or replace function public.request_client_ip()
returns inet
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  h json;
  raw_ip text;
begin
  h := coalesce(nullif(current_setting('request.headers', true), '')::json, '{}'::json);

  raw_ip := coalesce(
    nullif(h ->> 'cf-connecting-ip', ''),
    nullif(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), ''),
    nullif(h ->> 'x-real-ip', '')
  );

  if raw_ip is null then
    return null;
  end if;

  begin
    return btrim(raw_ip)::inet;
  exception when invalid_text_representation then
    return null;
  end;
end;
$$;

create or replace function public.request_user_agent()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    (coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json ->> 'user-agent'),
    ''
  );
$$;

-- Register or refresh the exact browser/app installation.
-- The browser supplies device details; IP is captured server-side.
create or replace function public.register_login_session_v2(
  p_device_id text,
  p_device_type text default 'unknown',
  p_manufacturer text default null,
  p_device_model text default null,
  p_device_name_exact text default null,
  p_os text default null,
  p_os_version text default null,
  p_browser text default null,
  p_browser_version text default null,
  p_client_timezone text default null,
  p_screen_width integer default null,
  p_screen_height integer default null
)
returns public.login_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.login_sessions;
  v_ip inet := public.request_client_ip();
  v_ua text := public.request_user_agent();
  v_session_key text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if coalesce(trim(p_device_id), '') = '' then
    raise exception 'device_id_required';
  end if;

  -- Reuse the existing session row for this exact installation.
  select session_key
    into v_session_key
  from public.login_sessions
  where user_id = v_uid
    and session_key = p_device_id
  order by login_at desc
  limit 1;

  if v_session_key is not null then
    update public.login_sessions
    set
      last_seen_at = now(),
      logout_at = null,
      is_current = true,
      device_type = coalesce(nullif(p_device_type, ''), device_type),
      os = coalesce(nullif(p_os, ''), os),
      browser = coalesce(nullif(p_browser, ''), browser),
      device_name = coalesce(nullif(p_device_name_exact, ''), device_name),
      user_agent = coalesce(v_ua, user_agent),
      ip_address = coalesce(v_ip, ip_address),
      manufacturer = coalesce(nullif(p_manufacturer, ''), manufacturer),
      device_model = coalesce(nullif(p_device_model, ''), device_model),
      device_name_exact = coalesce(nullif(p_device_name_exact, ''), device_name_exact),
      os_version = coalesce(nullif(p_os_version, ''), os_version),
      browser_version = coalesce(nullif(p_browser_version, ''), browser_version),
      client_timezone = coalesce(nullif(p_client_timezone, ''), client_timezone),
      screen_width = coalesce(p_screen_width, screen_width),
      screen_height = coalesce(p_screen_height, screen_height),
      revoked_at = null,
      revoked_reason = null
    where user_id = v_uid
      and session_key = p_device_id;
  else
    insert into public.login_sessions (
      user_id,
      session_key,
      login_at,
      last_seen_at,
      logout_at,
      is_current,
      device_type,
      os,
      browser,
      device_name,
      user_agent,
      ip_address,
      manufacturer,
      device_model,
      device_name_exact,
      os_version,
      browser_version,
      client_timezone,
      screen_width,
      screen_height
    ) values (
      v_uid,
      p_device_id,
      now(),
      now(),
      null,
      true,
      coalesce(nullif(p_device_type, ''), 'unknown'),
      coalesce(nullif(p_os, ''), 'Unknown OS'),
      coalesce(nullif(p_browser, ''), 'Browser'),
      coalesce(nullif(p_device_name_exact, ''), 'Perangkat'),
      v_ua,
      v_ip,
      nullif(p_manufacturer, ''),
      nullif(p_device_model, ''),
      nullif(p_device_name_exact, ''),
      nullif(p_os_version, ''),
      nullif(p_browser_version, ''),
      nullif(p_client_timezone, ''),
      p_screen_width,
      p_screen_height
    );
  end if;

  -- Enforce maximum two active installations per user.
  -- The oldest active session is revoked first.
  with ranked as (
    select id,
           row_number() over (
             order by last_seen_at desc, login_at desc, created_at desc
           ) as rn
    from public.login_sessions
    where user_id = v_uid
      and is_current = true
      and logout_at is null
  )
  update public.login_sessions ls
  set
    is_current = false,
    logout_at = now(),
    revoked_at = now(),
    revoked_reason = 'max_two_active_devices'
  from ranked r
  where ls.id = r.id
    and r.rn > 2;

  update public.users
  set last_login_at = now()
  where id = v_uid;

  select * into v_row
  from public.login_sessions
  where user_id = v_uid
    and session_key = p_device_id
  order by login_at desc
  limit 1;

  return v_row;
end;
$$;

-- Heartbeat. The frontend should call this about once per minute while visible.
create or replace function public.touch_login_session_v2(
  p_device_id text
)
returns public.login_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.login_sessions;
  v_ip inet := public.request_client_ip();
  v_ua text := public.request_user_agent();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.login_sessions
  set
    last_seen_at = now(),
    ip_address = coalesce(v_ip, ip_address),
    user_agent = coalesce(v_ua, user_agent)
  where user_id = v_uid
    and session_key = p_device_id
    and is_current = true
    and logout_at is null
  returning * into v_row;

  if v_row.id is null then
    raise exception 'session_revoked_or_not_found';
  end if;

  return v_row;
end;
$$;

-- Mark a normal logout.
create or replace function public.end_login_session_v2(
  p_device_id text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.login_sessions
  set
    is_current = false,
    logout_at = now(),
    revoked_at = null,
    revoked_reason = 'user_signed_out'
  where user_id = auth.uid()
    and session_key = p_device_id
    and logout_at is null;
$$;

-- RLS stays compatible with the existing table.
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

grant select on public.login_sessions to authenticated;
grant execute on function public.register_login_session_v2(
  text,text,text,text,text,text,text,text,text,text,integer,integer
) to authenticated;
grant execute on function public.touch_login_session_v2(text) to authenticated;
grant execute on function public.end_login_session_v2(text) to authenticated;

-- Keep only the newest two active sessions for existing data too.
with ranked as (
  select id,
         row_number() over (
           partition by user_id
           order by last_seen_at desc, login_at desc, created_at desc
         ) as rn
  from public.login_sessions
  where is_current = true
    and logout_at is null
)
update public.login_sessions ls
set
  is_current = false,
  logout_at = coalesce(logout_at, now()),
  revoked_at = coalesce(revoked_at, now()),
  revoked_reason = coalesce(revoked_reason, 'max_two_active_devices_existing_data')
from ranked r
where ls.id = r.id
  and r.rn > 2;
