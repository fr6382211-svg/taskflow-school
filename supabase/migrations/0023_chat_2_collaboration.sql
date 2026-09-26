-- Fathur SchoolHub V7.2 Chat 2.0
-- V23 FIXED: safe re-run, correct owner_id text/uuid comparison,
-- and defensive conversation-id parsing for storage policies.

alter table public.messages
  add column if not exists edited_at timestamptz,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists attachment_path text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size bigint,
  add column if not exists mention_user_ids uuid[] not null default '{}';

create index if not exists messages_conversation_pinned_idx
  on public.messages(conversation_id, is_pinned, created_at desc);

create index if not exists messages_attachment_idx
  on public.messages(attachment_path)
  where attachment_path is not null;

create index if not exists messages_mentions_gin_idx
  on public.messages using gin(mention_user_ids);

alter table public.conversations
  add column if not exists kind text not null default 'group',
  add column if not exists avatar_url text,
  add column if not exists archived_at timestamptz;

-- Safe check constraint creation without duplicate-constraint errors.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and conname = 'conversations_kind_check'
  ) then
    alter table public.conversations
      add constraint conversations_kind_check
      check (kind in ('direct','group','workspace'));
  end if;
end $$;

create index if not exists conversations_kind_idx
  on public.conversations(workspace_id, kind, updated_at desc);

-- Private attachment bucket.
insert into storage.buckets(id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

create or replace function public.create_conversation_with_members(
  p_workspace_id text,
  p_kind text,
  p_title text,
  p_member_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_workspace text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  if p_workspace_id not in ('fathur','mazet') then
    raise exception 'invalid workspace';
  end if;

  if p_kind not in ('direct','group','workspace') then
    raise exception 'invalid conversation kind';
  end if;

  select workspace_id
    into v_workspace
  from public.users
  where id = auth.uid();

  if not public.is_admin()
     and v_workspace is distinct from p_workspace_id then
    raise exception 'workspace access denied';
  end if;

  insert into public.conversations(
    workspace_id,
    kind,
    title,
    is_group,
    created_by
  )
  values(
    p_workspace_id,
    p_kind,
    nullif(trim(p_title), ''),
    p_kind <> 'direct',
    auth.uid()
  )
  returning id into v_id;

  if p_kind = 'workspace' then
    insert into public.conversation_members(conversation_id, user_id)
    select v_id, u.id
    from public.users u
    where u.status = 'active'
      and u.workspace_id = p_workspace_id
    on conflict do nothing;
  else
    insert into public.conversation_members(conversation_id, user_id)
    select v_id, u.id
    from public.users u
    where u.id = any(
      array_append(coalesce(p_member_ids, '{}'::uuid[]), auth.uid())
    )
      and u.status = 'active'
      and (public.is_admin() or u.workspace_id = p_workspace_id)
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_conversation_with_members(text, text, text, uuid[])
to authenticated;

-- ------------------------------------------------------------------
-- Storage policies
-- Object names are expected as: <conversation_uuid>/<filename>
-- We validate the first path segment before casting it to uuid.
-- ------------------------------------------------------------------

drop policy if exists chat_attachments_insert on storage.objects;
create policy chat_attachments_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'chat-attachments'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = split_part(name, '/', 1)::uuid
      and cm.user_id = auth.uid()
  )
);

drop policy if exists chat_attachments_select on storage.objects;
create policy chat_attachments_select on storage.objects
for select to authenticated
using (
  bucket_id = 'chat-attachments'
  and (
    public.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
      )
    )
  )
);

drop policy if exists chat_attachments_delete on storage.objects;
create policy chat_attachments_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'chat-attachments'
  and (
    owner_id = auth.uid()::text
    or public.is_admin()
  )
);

-- Message update: author or admin.
drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
for update to authenticated
using (
  sender_id = auth.uid()
  or public.is_admin()
)
with check (
  sender_id = auth.uid()
  or public.is_admin()
);

-- Read receipts are writable only by the reader/admin.
drop policy if exists reads_own on public.message_reads;
create policy reads_own on public.message_reads
for all to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
)
with check (
  user_id = auth.uid()
  or public.is_admin()
);

-- Realtime coverage is handled by the existing Chat 2.0 realtime migration.
