-- Fathur School Hub V7.3 / Digital Attendance 2.0 — Physical Access Card
-- Lets a student register the REAL access card they already own (printed/embedded code)
-- and use it, with server-side identity verification, as a check-in method.
-- Additive and rerunnable. Does not touch existing QR/digital-card flow.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------
-- Card registry: one row per physical card, bound to exactly one account.
-- Only a normalized hash of the card code is stored so the raw code
-- never needs to live in the database in plain, guessable form either.
-- -----------------------------------------------------------------
create table if not exists public.attendance_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_code_hash text not null,
  card_last4 text not null,
  label text not null default 'Kartu Akses',
  status text not null default 'active',
  registered_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_cards_status_check check (status in ('active','revoked')),
  constraint attendance_cards_last4_check check (char_length(card_last4) between 2 and 8)
);
create index if not exists attendance_cards_user_idx on public.attendance_cards(user_id) where status = 'active';

-- A given physical card can only be bound to one account while active.
drop index if exists public.attendance_cards_code_active_uq;
create unique index attendance_cards_code_active_uq
  on public.attendance_cards(card_code_hash) where status = 'active';

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

drop trigger if exists trg_attendance_cards_updated_at on public.attendance_cards;
create trigger trg_attendance_cards_updated_at
before update on public.attendance_cards
for each row execute function public.attendance_touch_updated_at();

alter table public.attendance_cards enable row level security;

drop policy if exists attendance_cards_select_own_or_admin on public.attendance_cards;
create policy attendance_cards_select_own_or_admin on public.attendance_cards
for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- No direct client insert/update/delete: registration and revocation flow through RPCs
-- below so the code is hashed server-side and audit-logged consistently.
drop policy if exists attendance_cards_direct_write on public.attendance_cards;

-- -----------------------------------------------------------------
-- Allow the 'physical_card' method on attendance_logs / attendance_attempts.
-- -----------------------------------------------------------------
alter table public.attendance_logs drop constraint if exists attendance_logs_method_check;
alter table public.attendance_logs
  add constraint attendance_logs_method_check
  check (method is null or method in ('card','qr','physical_card','manual','admin'));

alter table public.attendance_attempts drop constraint if exists attendance_attempts_method_check;
alter table public.attendance_attempts
  add constraint attendance_attempts_method_check
  check (method in ('card','qr','physical_card','manual','admin'));

-- -----------------------------------------------------------------
-- Register a real card to the signed-in user's own account.
-- Raw code never leaves this function; only its salted hash + last 4
-- chars (for display, e.g. "**** 4821") are persisted.
-- -----------------------------------------------------------------
drop function if exists public.register_attendance_card(text,text);
create or replace function public.register_attendance_card(p_card_code text, p_label text default 'Kartu Akses')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_card_code,''),'\s+','','g'));
  v_hash text;
  v_id uuid;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if char_length(v_code) < 4 then
    return jsonb_build_object('ok',false,'code','CARD_CODE_TOO_SHORT','message','Kode kartu terlalu pendek. Periksa kembali nomor/ID di kartu kamu.');
  end if;

  v_hash := encode(digest('fathur-card::' || v_code, 'sha256'), 'hex');

  if exists (select 1 from public.attendance_cards c where c.card_code_hash = v_hash and c.status = 'active' and c.user_id <> v_uid) then
    insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
    select u.id,u.email,'attendance.card.register_conflict','attendance_card',null,jsonb_build_object('card_last4',right(v_code,4))
    from public.users u where u.id = v_uid;
    return jsonb_build_object('ok',false,'code','CARD_ALREADY_REGISTERED','message','Kartu ini sudah terdaftar pada akun lain. Hubungi admin jika ini kartumu.');
  end if;

  if exists (select 1 from public.attendance_cards c where c.card_code_hash = v_hash and c.status = 'active' and c.user_id = v_uid) then
    return jsonb_build_object('ok',false,'code','CARD_ALREADY_YOURS','message','Kartu ini sudah terdaftar di akunmu.');
  end if;

  insert into public.attendance_cards(user_id,card_code_hash,card_last4,label,status)
  values (v_uid, v_hash, right(v_code,4), nullif(trim(coalesce(p_label,'')),''), 'active')
  returning id into v_id;

  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'attendance.card.register','attendance_card',v_id::text,jsonb_build_object('card_last4',right(v_code,4),'label',p_label)
  from public.users u where u.id = v_uid;

  return jsonb_build_object('ok',true,'code','CARD_REGISTERED','message','Kartu akses berhasil didaftarkan.','card_id',v_id,'card_last4',right(v_code,4));
end;
$$;
revoke all on function public.register_attendance_card(text,text) from public,anon;
grant execute on function public.register_attendance_card(text,text) to authenticated;

-- -----------------------------------------------------------------
-- List the signed-in user's own registered cards (never returns the raw code/hash).
-- -----------------------------------------------------------------
drop function if exists public.get_my_attendance_cards();
create or replace function public.get_my_attendance_cards()
returns table(id uuid, label text, card_last4 text, status text, registered_at timestamptz)
language sql
security definer
set search_path=public
stable
as $$
  select c.id, c.label, c.card_last4, c.status, c.registered_at
  from public.attendance_cards c
  where c.user_id = auth.uid()
  order by c.registered_at desc;
$$;
revoke all on function public.get_my_attendance_cards() from public,anon;
grant execute on function public.get_my_attendance_cards() to authenticated;

-- -----------------------------------------------------------------
-- Owner or admin can revoke a card (lost card, replaced card, leaver, abuse).
-- -----------------------------------------------------------------
drop function if exists public.revoke_attendance_card(uuid);
create or replace function public.revoke_attendance_card(p_card_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  select user_id into v_owner from public.attendance_cards where id = p_card_id;
  if v_owner is null then raise exception 'card not found'; end if;
  if v_owner <> v_uid and not public.is_admin() then raise exception 'not permitted'; end if;

  update public.attendance_cards
  set status='revoked', revoked_at=now(), revoked_by=v_uid
  where id = p_card_id and status='active';

  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'attendance.card.revoke','attendance_card',p_card_id::text,jsonb_build_object('owner_id',v_owner)
  from public.users u where u.id = v_uid;

  return found;
end;
$$;
revoke all on function public.revoke_attendance_card(uuid) from public,anon;
grant execute on function public.revoke_attendance_card(uuid) to authenticated;

-- -----------------------------------------------------------------
-- Admin visibility: every registered card across the school, for the
-- admin "Digital Cards" screen (lost-card handling, duplicate suspicion, etc).
-- -----------------------------------------------------------------
drop function if exists public.get_all_attendance_cards();
create or replace function public.get_all_attendance_cards()
returns table(id uuid, user_id uuid, user_name text, email text, card_last4 text, label text, status text, registered_at timestamptz, revoked_at timestamptz)
language plpgsql
security definer
set search_path=public
stable
as $$
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  return query
  select c.id, c.user_id, u.name, u.email, c.card_last4, c.label, c.status, c.registered_at, c.revoked_at
  from public.attendance_cards c
  join public.users u on u.id = c.user_id
  order by c.registered_at desc;
end;
$$;
revoke all on function public.get_all_attendance_cards() from public,anon;
grant execute on function public.get_all_attendance_cards() to authenticated;

-- -----------------------------------------------------------------
-- Card-based check-in: the card code must hash-match a card that is
-- ACTIVE and BELONGS TO THE SIGNED-IN USER. This is what makes it a
-- real second factor rather than a bare button tap — someone else's
-- card, a revoked card, or a mistyped code is rejected before the
-- normal session/geofence pipeline even runs.
-- -----------------------------------------------------------------
drop function if exists public.check_in_with_card(uuid,text,double precision,double precision,double precision);
create or replace function public.check_in_with_card(
  p_session_id uuid,
  p_card_code text,
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
  v_code text := upper(regexp_replace(coalesce(p_card_code,''),'\s+','','g'));
  v_hash text;
  v_card public.attendance_cards%rowtype;
begin
  if v_uid is null then raise exception 'unauthenticated'; end if;
  if char_length(v_code) < 4 then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m)
    values(v_uid,p_session_id,'physical_card','rejected','Kode kartu tidak valid',p_accuracy);
    return jsonb_build_object('ok',false,'code','CARD_CODE_INVALID','message','Kode kartu tidak valid.');
  end if;

  v_hash := encode(digest('fathur-card::' || v_code, 'sha256'), 'hex');
  select * into v_card from public.attendance_cards where card_code_hash = v_hash and status = 'active';

  if not found then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m)
    values(v_uid,p_session_id,'physical_card','rejected','Kartu tidak terdaftar/nonaktif',p_accuracy);
    return jsonb_build_object('ok',false,'code','CARD_NOT_REGISTERED','message','Kartu ini belum terdaftar. Daftarkan dulu di menu Absensi → Kartu Akses.');
  end if;

  if v_card.user_id <> v_uid then
    insert into public.attendance_attempts(user_id,session_id,method,result_code,reason,accuracy_m)
    values(v_uid,p_session_id,'physical_card','rejected','Kartu milik akun lain',p_accuracy);
    insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
    select u.id,u.email,'attendance.card.foreign_attempt','attendance_card',v_card.id::text,jsonb_build_object('session_id',p_session_id,'card_owner_id',v_card.user_id)
    from public.users u where u.id = v_uid;
    return jsonb_build_object('ok',false,'code','CARD_NOT_YOURS','message','Kartu ini terdaftar untuk akun lain.');
  end if;

  -- Identity + card ownership confirmed. Hand off to the same server-authoritative
  -- session/schedule/geofence/duplicate pipeline every other method goes through.
  return public.check_in_attendance(p_session_id, 'physical_card', null, p_lat, p_lng, p_accuracy);
end;
$$;
revoke all on function public.check_in_with_card(uuid,text,double precision,double precision,double precision) from public,anon;
grant execute on function public.check_in_with_card(uuid,text,double precision,double precision,double precision) to authenticated;

-- -----------------------------------------------------------------
-- check_in_attendance currently only accepts method in ('card','qr').
-- Widen it so the shared pipeline above can record 'physical_card' too,
-- while leaving every existing call site (qr / digital 'card' tap) untouched.
-- -----------------------------------------------------------------
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
  if p_method not in ('card','qr','physical_card') then raise exception 'invalid attendance method'; end if;
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
    case p_method when 'qr' then 'Digital QR + GPS geofence' when 'physical_card' then 'Kartu Akses Fisik (verified) + GPS geofence' else 'Digital Card + GPS geofence' end,
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
grant execute on function public.check_in_attendance(uuid,text,text,double precision,double precision,double precision) to service_role;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='attendance_cards') then
    alter publication supabase_realtime add table public.attendance_cards;
  end if;
end $$;

-- END 0025
