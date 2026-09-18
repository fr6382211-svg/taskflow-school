-- Fathur School Hub v4: bind account to exactly one workspace at registration.
-- Registration stores the choice in auth metadata; this trigger copies it into public.users.
-- Existing accounts default to Fathur unless already assigned to Mazet.

alter table public.users
  add column if not exists workspace_id text;

update public.users
set workspace_id = coalesce(nullif(workspace_id, ''), 'fathur')
where workspace_id is null or workspace_id = '';

alter table public.users
  alter column workspace_id set default 'fathur';

alter table public.users
  drop constraint if exists users_workspace_id_check;

alter table public.users
  add constraint users_workspace_id_check
  check (workspace_id in ('fathur', 'mazet'));

create index if not exists users_workspace_id_idx
  on public.users(workspace_id);

-- Preserve the existing user-creation trigger while copying the workspace selected at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  selected_workspace text;
begin
  selected_workspace := case
    when new.raw_user_meta_data->>'preferred_workspace' = 'mazet' then 'mazet'
    else 'fathur'
  end;

  insert into public.users(
    id,
    name,
    email,
    workspace_id
  )
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Pengguna'),
    new.email,
    selected_workspace
  )
  on conflict(id) do update
  set
    name = excluded.name,
    email = excluded.email,
    workspace_id = coalesce(public.users.workspace_id, excluded.workspace_id);

  return new;
end;
$$;

-- Existing trigger name is retained.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
