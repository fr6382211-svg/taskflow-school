-- Fathur SchoolHub V7.2 Chat 2.0
-- Durable 1:1/group chat, edits, pinning, read receipts, attachments and safe conversation creation.

alter table public.messages
  add column if not exists edited_at timestamptz,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists attachment_path text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size bigint,
  add column if not exists mention_user_ids uuid[] not null default '{}';

create index if not exists messages_conversation_pinned_idx on public.messages(conversation_id,is_pinned,created_at desc);
create index if not exists messages_attachment_idx on public.messages(attachment_path) where attachment_path is not null;
create index if not exists messages_mentions_gin_idx on public.messages using gin(mention_user_ids);

alter table public.conversations
  add column if not exists kind text not null default 'group' check(kind in ('direct','group','workspace')),
  add column if not exists avatar_url text,
  add column if not exists archived_at timestamptz;

create index if not exists conversations_kind_idx on public.conversations(workspace_id,kind,updated_at desc);

-- Private attachment bucket. Object access is granted through conversation membership, never anonymous users.
insert into storage.buckets(id,name,public)
values('chat-attachments','chat-attachments',false)
on conflict(id) do nothing;

create or replace function public.create_conversation_with_members(
  p_workspace_id text,
  p_kind text,
  p_title text,
  p_member_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_workspace text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if p_workspace_id not in ('fathur','mazet') then raise exception 'invalid workspace'; end if;
  if p_kind not in ('direct','group','workspace') then raise exception 'invalid conversation kind'; end if;

  select workspace_id into v_workspace from public.users where id=auth.uid();
  if not public.is_admin() and v_workspace is distinct from p_workspace_id then
    raise exception 'workspace access denied';
  end if;

  insert into public.conversations(workspace_id,kind,title,is_group,created_by)
  values(p_workspace_id,p_kind,nullif(trim(p_title),''),p_kind <> 'direct',auth.uid())
  returning id into v_id;

  if p_kind = 'workspace' then
    insert into public.conversation_members(conversation_id,user_id)
    select v_id, u.id from public.users u
    where u.status='active' and u.workspace_id=p_workspace_id on conflict do nothing;
  else
    insert into public.conversation_members(conversation_id,user_id)
    select v_id, u.id
    from public.users u
    where u.id = any(array_append(coalesce(p_member_ids,'{}'::uuid[]),auth.uid()))
      and u.status = 'active'
      and (public.is_admin() or u.workspace_id = p_workspace_id)
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_conversation_with_members(text,text,text,uuid[]) to authenticated;

-- Allow a member to see/send chat attachments through a signed URL.
drop policy if exists chat_attachments_insert on storage.objects;
create policy chat_attachments_insert on storage.objects
for insert to authenticated
with check(
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = split_part(name,'/',1)::uuid
      and cm.user_id = auth.uid()
  )
);

drop policy if exists chat_attachments_select on storage.objects;
create policy chat_attachments_select on storage.objects
for select to authenticated
using(
  bucket_id = 'chat-attachments'
  and (
    public.is_admin()
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = split_part(name,'/',1)::uuid
        and cm.user_id = auth.uid()
    )
  )
);

drop policy if exists chat_attachments_delete on storage.objects;
create policy chat_attachments_delete on storage.objects
for delete to authenticated
using(
  bucket_id = 'chat-attachments'
  and ((owner_id = auth.uid()) or public.is_admin())
);

-- Broaden message policies to allow pin/edit state only to authors/admins while members can still read.
drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
for update to authenticated
using(sender_id=auth.uid() or public.is_admin())
with check(sender_id=auth.uid() or public.is_admin());

-- Immutable reaction rows remain keyed by (message,user,reaction).
-- Read receipts are intentionally writable only by the reader.

drop policy if exists reads_own on public.message_reads;
create policy reads_own on public.message_reads
for all to authenticated
using(user_id=auth.uid() or public.is_admin())
with check(user_id=auth.uid() or public.is_admin());

-- Realtime coverage is already enabled by migration 0022; this migration only extends message columns and policies.
