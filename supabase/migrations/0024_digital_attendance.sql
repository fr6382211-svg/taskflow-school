-- Fathur School Hub V7.3 / Digital Attendance 2.0
-- Secure digital card + rotating admin QR + school/less geofence + audit + realtime.
-- Additive and rerunnable. Existing attendance history is preserved.

create extension if not exists pgcrypto;

create table if not exists public.attendance_locations (
  id text primary key,
  label text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_m integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_locations_radius_check check (radius_m between 50 and 1000)
);

insert into public.attendance_locations(id,label,latitude,longitude,radius_m,active)
values
  ('school','Sekolah',-6.900682597550797,112.04823280837307,400,true),
  ('tutoring','Tempat Les',-6.902286975850672,112.05698734436636,200,true)
on conflict(id) do update set
  label=excluded.label,
  latitude=excluded.latitude,
  longitude=excluded.longitude,
  radius_m=excluded.radius_m,
  active=excluded.active,
  updated_at=now();

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  location_id text not null references public.attendance_locations(id) on delete restrict,
  title text not null,
  session_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  late_after_minutes integer not null default 10,
  qr_nonce text not null default gen_random_uuid()::text,
  qr_expires_at timestamptz not null default now() + interval '60 seconds',
  enabled boolean not null default true,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_sessions_workspace_check check (workspace_id in ('fathur','mazet')),
  constraint attendance_sessions_time_check check (ends_at > starts_at),
  constraint attendance_sessions_late_check check (late_after_minutes between 0 and 120)
);
create index if not exists attendance_sessions_workspace_time_idx on public.attendance_sessions(workspace_id,starts_at desc);
create index if not exists attendance_sessions_location_time_idx on public.attendance_sessions(location_id,starts_at desc);

alter table public.attendance_logs add column if not exists session_id uuid references public.attendance_sessions(id) on delete set null;
alter table public.attendance_logs add column if not exists method text;
alter table public.attendance_logs add column if not exists location_id text references public.attendance_locations(id) on delete set null;
alter table public.attendance_logs add column if not exists distance_m double precision;
alter table public.attendance_logs add column if not exists accuracy_m double precision;
alter table public.attendance_logs add column if not exists verified_at timestamptz;
alter table public.attendance_logs add column if not exists verification_status text;
alter table public.attendance_logs add column if not exists note text;

alter table public.attendance_logs drop constraint if exists attendance_logs_status_check;
alter table public.attendance_logs
  add constraint attendance_logs_status_check
  check (status in ('scheduled','on_time','late','not_arrived','location_unknown','manual_override','cancelled','present','absent','permission'));

alter table public.attendance_logs drop constraint if exists attendance_logs_method_check;
alter table public.attendance_logs
  add constraint attendance_logs_method_check
  check (method is null or method in ('card','qr','manual','admin'));

alter table public.attendance_logs drop constraint if exists attendance_logs_verification_check;
alter table public.attendance_logs
  add constraint attendance_logs_verification_check
  check (verification_status is null or verification_status in ('verified','rejected'));

drop index if exists public.attendance_logs_session_user_uq;
create unique index attendance_logs_session_user_uq
  on public.attendance_logs(session_id,user_id);
create index if not exists attendance_logs_session_time_idx on public.attendance_logs(session_id,scheduled_time desc);
create index if not exists attendance_logs_location_idx on public.attendance_logs(location_id,scheduled_time desc);

create table if not exists public.attendance_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid references public.attendance_sessions(id) on delete set null,
  method text not null,
  result_code text not null,
  reason text,
  distance_m double precision,
  accuracy_m double precision,
  created_at timestamptz not null default now(),
  constraint attendance_attempts_method_check check (method in ('card','qr','manual','admin'))
);
create index if not exists attendance_attempts_user_time_idx on public.attendance_attempts(user_id,created_at desc);
create index if not exists attendance_attempts_session_time_idx on public.attendance_attempts(session_id,created_at desc);

-- -----------------------------------------------------------------
-- Safe updated_at trigger
-- -----------------------------------------------------------------
create or replace function public.attendance_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

drop trigger if exists trg_attendance_locations_updated_at on public.attendance_locations;
create trigger trg_attendance_locations_updated_at
before update on public.attendance_locations
for each row execute function public.attendance_touch_updated_at();

drop trigger if exists trg_attendance_sessions_updated_at on public.attendance_sessions;
create trigger trg_attendance_sessions_updated_at
before update on public.attendance_sessions
for each row execute function public.attendance_touch_updated_at();

-- -----------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------
alter table public.attendance_locations enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.attendance_attempts enable row level security;

drop policy if exists attendance_locations_read on public.attendance_locations;
create policy attendance_locations_read on public.attendance_locations
for select to authenticated using (active=true or public.is_admin());

drop policy if exists attendance_locations_admin_write on public.attendance_locations;
create policy attendance_locations_admin_write on public.attendance_locations
for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists attendance_sessions_admin_all on public.attendance_sessions;
create policy attendance_sessions_admin_all on public.attendance_sessions
for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists attendance_logs_select_own_or_admin on public.attendance_logs;
create policy attendance_logs_select_own_or_admin on public.attendance_logs
for select to authenticated using(user_id=auth.uid() or public.is_admin());

drop policy if exists attendance_logs_admin_update on public.attendance_logs;
create policy attendance_logs_admin_update on public.attendance_logs
for update to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists attendance_logs_admin_delete on public.attendance_logs;
create policy attendance_logs_admin_delete on public.attendance_logs
for delete to authenticated using(public.is_admin());

drop policy if exists attendance_attempts_own_or_admin on public.attendance_attempts;
create policy attendance_attempts_own_or_admin on public.attendance_attempts
for select to authenticated using(user_id=auth.uid() or public.is_admin());

-- No direct client inserts into attendance_logs/attempts. All check-in writes flow through RPCs.
drop policy if exists attendance_logs_direct_insert on public.attendance_logs;
drop policy if exists attendance_attempts_direct_insert on public.attendance_attempts;

-- -----------------------------------------------------------------
-- Safe session listing: nonce is never exposed to normal users.
-- -----------------------------------------------------------------
drop function if exists public.get_open_attendance_sessions();
create or replace function public.get_open_attendance_sessions()
returns table(
  id uuid,
  workspace_id text,
  location_id text,
  location_label text,
  title text,
  session_date date,
  starts_at timestamptz,
  ends_at timestamptz,
  late_after_minutes integer
)
language plpgsql
security definer
set search_path=public
stable
as $$
declare
  v_workspace text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select u.workspace_id into v_workspace from public.users u where u.id=auth.uid();
  return query
  select s.id,s.workspace_id,s.location_id,l.label,s.title,s.session_date,s.starts_at,s.ends_at,s.late_after_minutes
  from public.attendance_sessions s
  join public.attendance_locations l on l.id=s.location_id
  where s.enabled=true
    and l.active=true
    and s.workspace_id=v_workspace
    and s.ends_at >= now() - interval '30 minutes'
    and s.starts_at <= now() + interval '5 minutes'
  order by s.starts_at asc;
end;
$$;
revoke all on function public.get_open_attendance_sessions() from public,anon;
grant execute on function public.get_open_attendance_sessions() to authenticated;

-- -----------------------------------------------------------------
-- Server-side geofence + QR nonce + one-checkin-per-session.
-- Client sends location, server decides validity; no client-side trust.
-- -----------------------------------------------------------------
drop function if exists public.check_in_attendance(uuid,text,text,double precision,double precision,double precision);
create or replace function public.check_in_attendance(
  p_session_id uuid,
  p_method text,
  p_qr_nonce text,
  p_lat double precision,
  p_lng double precision,
  p_accuracy double precision
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_workspace text;
  v_session public.attendance_sessions%rowtype;
  v_location public.attendance_locations%rowtype;
  v_distance double precision;
  v_status text;
  v_existing public.attendance_logs%rowtype;
  v_now timestamptz := now();
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if p_method not in ('card','qr') then raise exception 'invalid attendance method'; end if;
  if p_lat is null or p_lng is null then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','GPS position missing',p_accuracy);
    return jsonb_build_object('ok',false,'code','LOCATION_REQUIRED','message','Lokasi GPS diperlukan.');
  end if;
  if p_accuracy is null or p_accuracy <= 0 or p_accuracy > 120 then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','GPS accuracy terlalu rendah',p_accuracy);
    return jsonb_build_object('ok',false,'code','LOW_ACCURACY','message','Akurasi GPS belum cukup baik. Pindah ke area terbuka dan coba lagi.');
  end if;

  select u.workspace_id into v_workspace from public.users u where u.id=v_uid and u.status='active';
  if v_workspace is null then raise exception 'user unavailable'; end if;

  select * into v_session from public.attendance_sessions s where s.id=p_session_id and s.enabled=true for share;
  if not found then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','Sesi attendance tidak ditemukan',p_accuracy);
    return jsonb_build_object('ok',false,'code','SESSION_NOT_FOUND','message','Sesi attendance tidak ditemukan.');
  end if;
  if v_session.workspace_id is distinct from v_workspace then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','Workspace mismatch',p_accuracy);
    return jsonb_build_object('ok',false,'code','WORKSPACE_DENIED','message','Sesi attendance bukan untuk workspace akun ini.');
  end if;
  if v_now < v_session.starts_at - interval '5 minutes' or v_now > v_session.ends_at then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','Di luar waktu sesi',p_accuracy);
    return jsonb_build_object('ok',false,'code','SESSION_CLOSED','message','Sesi attendance belum dibuka atau sudah ditutup.');
  end if;

  if p_method='qr' then
    if p_qr_nonce is null or p_qr_nonce is distinct from v_session.qr_nonce or v_session.qr_expires_at < v_now then
      insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','QR nonce expired atau tidak valid',p_accuracy);
      return jsonb_build_object('ok',false,'code','QR_EXPIRED','message','QR sudah berubah/expired. Scan QR terbaru dari Admin.');
    end if;
  end if;

  select * into v_location from public.attendance_locations l where l.id=v_session.location_id and l.active=true;
  if not found then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m) values(v_uid,p_session_id,p_method,'rejected','Lokasi attendance tidak aktif',p_accuracy);
    return jsonb_build_object('ok',false,'code','LOCATION_DISABLED','message','Lokasi attendance sedang tidak aktif.');
  end if;

  -- Haversine distance in meters.
  v_distance := 2 * 6371000 * asin(sqrt(
    power(sin(radians(p_lat - v_location.latitude)/2),2) +
    cos(radians(p_lat)) * cos(radians(v_location.latitude)) *
    power(sin(radians(p_lng - v_location.longitude)/2),2)
  ));

  if v_distance > v_location.radius_m then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,distance_m,accuracy_m)
    values(v_uid,p_session_id,p_method,'rejected','Di luar geofence attendance',v_distance,p_accuracy);
    return jsonb_build_object('ok',false,'code','OUTSIDE_GEOFENCE','message',format('Kamu masih %.0f m dari %s.',v_distance,v_location.label),'distance_m',round(v_distance::numeric,1),'required_radius_m',v_location.radius_m);
  end if;

  select * into v_existing from public.attendance_logs a where a.session_id=p_session_id and a.user_id=v_uid limit 1;
  if found then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,distance_m,accuracy_m)
    values(v_uid,p_session_id,p_method,'duplicate','Attendance sudah tercatat',v_distance,p_accuracy);
    return jsonb_build_object('ok',true,'code','ALREADY_CHECKED_IN','message','Attendance sudah tercatat.', 'attendance_id',v_existing.id, 'status',v_existing.status);
  end if;

  v_status := case when v_now <= v_session.starts_at + make_interval(mins=>v_session.late_after_minutes) then 'on_time' else 'late' end;

  insert into public.attendance_logs(
    user_id,session_id,scheduled_time,actual_arrival,status,delay_minutes,confidence,evidence,
    method,location_id,distance_m,accuracy_m,verified_at,verification_status,note
  ) values(
    v_uid,p_session_id,v_session.starts_at,v_now,v_status,
    greatest(0,extract(epoch from (v_now - (v_session.starts_at + make_interval(mins=>v_session.late_after_minutes))))::integer/60),
    greatest(0,least(1,1-(p_accuracy/120))),
    case when p_method='qr' then 'Digital QR + GPS geofence' else 'Digital Card + GPS geofence' end,
    p_method,v_session.location_id,v_distance,p_accuracy,v_now,'verified',null
  ) returning id into v_existing.id;

  insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,distance_m,accuracy_m)
  values(v_uid,p_session_id,p_method,'accepted','Check-in berhasil',v_distance,p_accuracy);

  insert into public.analytics_events(user_id,event_name,metadata)
  values(v_uid,'attendance.check_in',jsonb_build_object(
    'session_id',p_session_id,
    'method',p_method,
    'location_id',v_session.location_id,
    'status',v_status,
    'distance_m',round(v_distance::numeric,1),
    'accuracy_m',round(p_accuracy::numeric,1)
  ));

  return jsonb_build_object('ok',true,'code','CHECKED_IN','message',case when v_status='late' then 'Attendance tercatat, tetapi kamu terlambat.' else 'Attendance berhasil dicatat.' end,'attendance_id',v_existing.id,'status',v_status,'distance_m',round(v_distance::numeric,1),'accuracy_m',round(p_accuracy::numeric,1));
end;
$$;
revoke all on function public.check_in_attendance(uuid,text,text,double precision,double precision,double precision) from public,anon;
grant execute on function public.check_in_attendance(uuid,text,text,double precision,double precision,double precision) to authenticated;

-- -----------------------------------------------------------------
-- Admin QR rotation: short lived nonce, no secret exposed to browser users.
-- -----------------------------------------------------------------
drop function if exists public.rotate_attendance_qr(uuid);
create or replace function public.rotate_attendance_qr(p_session_id uuid)
returns table(qr_nonce text,qr_expires_at timestamptz)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_now timestamptz := now();
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  update public.attendance_sessions
  set qr_nonce=gen_random_uuid()::text,
      qr_expires_at=v_now + interval '45 seconds',
      updated_at=v_now
  where id=p_session_id and enabled=true;
  if not found then raise exception 'attendance session not found'; end if;
  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'attendance.qr.rotate','attendance_session',p_session_id::text,jsonb_build_object('qr_expires_at',s.qr_expires_at)
  from public.users u join public.attendance_sessions s on s.id=p_session_id where u.id=auth.uid();
  return query select s.qr_nonce,s.qr_expires_at from public.attendance_sessions s where s.id=p_session_id;
end;
$$;
revoke all on function public.rotate_attendance_qr(uuid) from public,anon;
grant execute on function public.rotate_attendance_qr(uuid) to authenticated;

-- -----------------------------------------------------------------
-- Admin session finalization: unrecorded active users become absent.
-- -----------------------------------------------------------------
drop function if exists public.finalize_attendance_session(uuid);
create or replace function public.finalize_attendance_session(p_session_id uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_workspace text;
  v_starts timestamptz;
  v_location text;
  v_count integer := 0;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  select workspace_id,starts_at,location_id into v_workspace,v_starts,v_location from public.attendance_sessions where id=p_session_id;
  if v_workspace is null then raise exception 'attendance session not found'; end if;
  insert into public.attendance_logs(user_id,session_id,scheduled_time,actual_arrival,status,delay_minutes,evidence,method,location_id,verification_status,note)
  select u.id,p_session_id,v_starts,null,'absent',0,'Auto-finalized by admin','admin',v_location,'verified','Tidak ada check-in sampai sesi ditutup'
  from public.users u
  where u.workspace_id=v_workspace and u.status='active'
    and not exists(select 1 from public.attendance_logs a where a.session_id=p_session_id and a.user_id=u.id)
  on conflict (session_id,user_id) do nothing;
  get diagnostics v_count = row_count;
  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'attendance.session.finalize','attendance_session',p_session_id::text,jsonb_build_object('absent_count',v_count)
  from public.users u where u.id=auth.uid();
  return v_count;
end;
$$;
revoke all on function public.finalize_attendance_session(uuid) from public,anon;
grant execute on function public.finalize_attendance_session(uuid) to authenticated;

-- -----------------------------------------------------------------
-- Admin permission override without erasing evidence trail.
-- -----------------------------------------------------------------
drop function if exists public.set_attendance_permission(uuid,uuid,text);
create or replace function public.set_attendance_permission(p_session_id uuid,p_user_id uuid,p_note text default null)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_workspace text;
  v_location text;
  v_starts timestamptz;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  select workspace_id,location_id,starts_at into v_workspace,v_location,v_starts from public.attendance_sessions where id=p_session_id;
  if v_workspace is null then raise exception 'attendance session not found'; end if;
  if not exists(select 1 from public.users where id=p_user_id and workspace_id=v_workspace and status='active') then raise exception 'user not in workspace'; end if;
  insert into public.attendance_logs(user_id,session_id,scheduled_time,actual_arrival,status,delay_minutes,evidence,method,location_id,verification_status,note)
  values(p_user_id,p_session_id,v_starts,null,'permission',0,'Admin permission override','admin',v_location,'verified',nullif(trim(coalesce(p_note,'')),''))
  on conflict(session_id,user_id) do update set status='permission',evidence='Admin permission override',method='admin',verification_status='verified',note=excluded.note
  returning id into v_id;
  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'attendance.permission.override','attendance_log',v_id::text,jsonb_build_object('session_id',p_session_id,'target_user_id',p_user_id,'note',p_note)
  from public.users u where u.id=auth.uid();
  return v_id;
end;
$$;
revoke all on function public.set_attendance_permission(uuid,uuid,text) from public,anon;
grant execute on function public.set_attendance_permission(uuid,uuid,text) to authenticated;



-- -----------------------------------------------------------------
-- Admin live roster: includes users who have not checked in yet.
-- -----------------------------------------------------------------
drop function if exists public.get_attendance_admin_roster(uuid);
create or replace function public.get_attendance_admin_roster(p_session_id uuid)
returns table(
  user_id uuid,
  user_name text,
  email text,
  status text,
  actual_arrival timestamptz,
  method text,
  distance_m double precision,
  accuracy_m double precision,
  note text
)
language plpgsql
security definer
set search_path=public
stable
as $$
declare
  v_workspace text;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  select s.workspace_id into v_workspace from public.attendance_sessions s where s.id=p_session_id;
  if v_workspace is null then raise exception 'attendance session not found'; end if;
  return query
  select
    u.id,
    u.name,
    u.email,
    coalesce(a.status,'not_arrived')::text,
    a.actual_arrival,
    a.method,
    a.distance_m,
    a.accuracy_m,
    a.note
  from public.users u
  left join public.attendance_logs a
    on a.session_id=p_session_id
   and a.user_id=u.id
  where u.workspace_id=v_workspace
    and u.status='active'
  order by
    case when a.status is null then 1 else 0 end,
    a.actual_arrival asc nulls last,
    u.name asc;
end;
$$;
revoke all on function public.get_attendance_admin_roster(uuid) from public,anon;
grant execute on function public.get_attendance_admin_roster(uuid) to authenticated;

-- -----------------------------------------------------------------
-- Realtime coverage. Idempotent via pg_publication_tables lookup.
-- -----------------------------------------------------------------
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='attendance_sessions') then
    alter publication supabase_realtime add table public.attendance_sessions;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='attendance_logs') then
    alter publication supabase_realtime add table public.attendance_logs;
  end if;
end $$;

-- Keep raw GPS coordinates out of attendance_logs: only distance + accuracy are retained.
-- The master geofence coordinates remain in attendance_locations for server-side verification.

-- END 0024
