-- Fathur School Hub — Kartu Digital (Digital ID Card)
-- Admin-only issued identity card, permanent record per user, deletable only by admin.
-- Additive and rerunnable.

create extension if not exists pgcrypto;

create table if not exists public.digital_id_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  workspace_id text not null default 'fathur',
  card_number text not null,
  full_name text not null,
  id_number text,
  role_label text not null default 'Siswa',
  class_label text,
  photo_url text,
  issued_at timestamptz not null default now(),
  issued_by uuid references public.users(id) on delete set null,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint digital_id_cards_status_check check (status in ('active','revoked')),
  constraint digital_id_cards_card_number_check check (char_length(card_number) between 3 and 40)
);

-- One active card per user at a time (permanent unless admin deletes/revokes it).
drop index if exists public.digital_id_cards_user_active_uq;
create unique index digital_id_cards_user_active_uq
  on public.digital_id_cards(user_id) where status = 'active';

create index if not exists digital_id_cards_workspace_idx on public.digital_id_cards(workspace_id);

create or replace function public.digital_id_cards_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_digital_id_cards_updated_at on public.digital_id_cards;
create trigger trg_digital_id_cards_updated_at
before update on public.digital_id_cards
for each row execute function public.digital_id_cards_touch_updated_at();

alter table public.digital_id_cards enable row level security;

-- Read: the card's owner can see their own card; admin can see all.
drop policy if exists digital_id_cards_select_own_or_admin on public.digital_id_cards;
create policy digital_id_cards_select_own_or_admin on public.digital_id_cards
for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- No direct client write: create/delete only through the admin-checked RPCs below,
-- so every issuance/removal is validated and audit-logged consistently.
drop policy if exists digital_id_cards_direct_write on public.digital_id_cards;

-- -----------------------------------------------------------------
-- Admin: issue a permanent digital ID card for a user.
-- If the user already has an active card, it is replaced (old one revoked)
-- rather than allowing two active cards for the same person.
-- -----------------------------------------------------------------
drop function if exists public.admin_issue_digital_card(uuid,text,text,text,text,text,text);
create or replace function public.admin_issue_digital_card(
  p_user_id uuid,
  p_card_number text,
  p_full_name text,
  p_id_number text default null,
  p_role_label text default 'Siswa',
  p_class_label text default null,
  p_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_admin uuid := auth.uid();
  v_workspace text;
  v_id uuid;
begin
  if v_admin is null then raise exception 'unauthenticated'; end if;
  if not public.is_admin() then raise exception 'admin required'; end if;
  if p_user_id is null then raise exception 'user_id required'; end if;
  if coalesce(trim(p_full_name),'') = '' then raise exception 'full_name required'; end if;
  if coalesce(trim(p_card_number),'') = '' then raise exception 'card_number required'; end if;

  select workspace_id into v_workspace from public.users where id = p_user_id;
  if v_workspace is null then raise exception 'user not found'; end if;

  -- Revoke any existing active card for this user before issuing a new one.
  update public.digital_id_cards
  set status = 'revoked', updated_at = now()
  where user_id = p_user_id and status = 'active';

  insert into public.digital_id_cards(
    user_id, workspace_id, card_number, full_name, id_number, role_label, class_label, photo_url, issued_by, status
  ) values (
    p_user_id, v_workspace, trim(p_card_number), trim(p_full_name), nullif(trim(coalesce(p_id_number,'')),''),
    coalesce(nullif(trim(p_role_label),''),'Siswa'), nullif(trim(coalesce(p_class_label,'')),''),
    nullif(trim(coalesce(p_photo_url,'')),''), v_admin, 'active'
  ) returning id into v_id;

  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'digital_card.issue','digital_id_card',v_id::text,jsonb_build_object('target_user_id',p_user_id,'card_number',p_card_number)
  from public.users u where u.id = v_admin;

  return jsonb_build_object('ok',true,'card_id',v_id);
end;
$$;
revoke all on function public.admin_issue_digital_card(uuid,text,text,text,text,text,text) from public,anon;
grant execute on function public.admin_issue_digital_card(uuid,text,text,text,text,text,text) to authenticated;

-- -----------------------------------------------------------------
-- Admin: permanently delete a digital ID card.
-- -----------------------------------------------------------------
drop function if exists public.admin_delete_digital_card(uuid);
create or replace function public.admin_delete_digital_card(p_card_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_admin uuid := auth.uid();
  v_owner uuid;
begin
  if v_admin is null then raise exception 'unauthenticated'; end if;
  if not public.is_admin() then raise exception 'admin required'; end if;

  select user_id into v_owner from public.digital_id_cards where id = p_card_id;
  if v_owner is null then raise exception 'card not found'; end if;

  delete from public.digital_id_cards where id = p_card_id;

  insert into public.audit_logs(user_id,user_email,action,target_type,target_id,metadata)
  select u.id,u.email,'digital_card.delete','digital_id_card',p_card_id::text,jsonb_build_object('owner_id',v_owner)
  from public.users u where u.id = v_admin;

  return found;
end;
$$;
revoke all on function public.admin_delete_digital_card(uuid) from public,anon;
grant execute on function public.admin_delete_digital_card(uuid) to authenticated;

-- -----------------------------------------------------------------
-- Admin: list every issued card (active + revoked) across the school.
-- -----------------------------------------------------------------
drop function if exists public.admin_list_digital_cards();
create or replace function public.admin_list_digital_cards()
returns table(
  id uuid, user_id uuid, user_name text, user_email text, workspace_id text,
  card_number text, full_name text, id_number text, role_label text, class_label text,
  photo_url text, status text, issued_at timestamptz, issued_by_name text
)
language plpgsql
security definer
set search_path=public
stable
as $$
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  return query
  select c.id, c.user_id, u.name, u.email, c.workspace_id, c.card_number, c.full_name, c.id_number,
         c.role_label, c.class_label, c.photo_url, c.status, c.issued_at, i.name
  from public.digital_id_cards c
  join public.users u on u.id = c.user_id
  left join public.users i on i.id = c.issued_by
  order by c.issued_at desc;
end;
$$;
revoke all on function public.admin_list_digital_cards() from public,anon;
grant execute on function public.admin_list_digital_cards() to authenticated;

-- -----------------------------------------------------------------
-- The signed-in user's own active digital card, for the Dashboard.
-- -----------------------------------------------------------------
drop function if exists public.get_my_digital_card();
create or replace function public.get_my_digital_card()
returns table(
  id uuid, card_number text, full_name text, id_number text, role_label text,
  class_label text, photo_url text, workspace_id text, issued_at timestamptz, status text
)
language sql
security definer
set search_path=public
stable
as $$
  select c.id, c.card_number, c.full_name, c.id_number, c.role_label, c.class_label,
         c.photo_url, c.workspace_id, c.issued_at, c.status
  from public.digital_id_cards c
  where c.user_id = auth.uid() and c.status = 'active'
  order by c.issued_at desc
  limit 1;
$$;
revoke all on function public.get_my_digital_card() from public,anon;
grant execute on function public.get_my_digital_card() to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='digital_id_cards') then
    alter publication supabase_realtime add table public.digital_id_cards;
  end if;
end $$;

-- END 0026
