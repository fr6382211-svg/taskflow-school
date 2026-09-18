-- Fathur SchoolHub v7.1: durable collaboration chat + notification preferences.
alter table public.notifications add column if not exists idempotency_key text;
create unique index if not exists notifications_user_idempotency_idx on public.notifications(user_id,idempotency_key) where idempotency_key is not null;
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null check (workspace_id in ('fathur','mazet')),
  title text,
  is_group boolean not null default false,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_workspace_updated_idx on public.conversations(workspace_id,updated_at desc);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id,user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id,conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  reply_to uuid references public.messages(id) on delete set null,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at asc);
create index if not exists messages_sender_created_idx on public.messages(sender_id,created_at desc);

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key(message_id,user_id)
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null check(length(trim(reaction)) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key(message_id,user_id,reaction)
);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check(type in ('deadline','task','comment','mention','focus','announcement','security','system','calendar','achievement'));

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  deadline boolean not null default true,
  task boolean not null default true,
  comment boolean not null default true,
  mention boolean not null default true,
  focus boolean not null default true,
  announcement boolean not null default true,
  security boolean not null default true,
  system boolean not null default true,
  calendar boolean not null default true,
  achievement boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.can_access_conversation(p_conversation uuid) returns boolean
language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.conversation_members where conversation_id=p_conversation and user_id=auth.uid()) or public.is_admin()
$$;

create or replace function public.touch_conversation_updated() returns trigger language plpgsql as $$
begin update public.conversations set updated_at=now() where id=new.conversation_id; return new; end $$;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert or update on public.messages for each row execute function public.touch_conversation_updated();

drop trigger if exists conversations_updated on public.conversations;
create trigger conversations_updated before update on public.conversations for each row execute function public.set_updated_at();
drop trigger if exists notification_preferences_updated on public.notification_preferences;
create trigger notification_preferences_updated before update on public.notification_preferences for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.message_reactions enable row level security;
alter table public.notification_preferences enable row level security;

create policy conversations_select on public.conversations for select to authenticated using(public.can_access_conversation(id));
create policy conversations_insert on public.conversations for insert to authenticated with check(created_by=auth.uid() or public.is_admin());
create policy conversations_update on public.conversations for update to authenticated using(created_by=auth.uid() or public.is_admin()) with check(created_by=auth.uid() or public.is_admin());
create policy conversations_delete on public.conversations for delete to authenticated using(created_by=auth.uid() or public.is_admin());

create policy members_select on public.conversation_members for select to authenticated using(user_id=auth.uid() or public.can_access_conversation(conversation_id));
create policy members_insert on public.conversation_members for insert to authenticated with check(user_id=auth.uid() or public.is_admin());
create policy members_update_own_read on public.conversation_members for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy members_delete on public.conversation_members for delete to authenticated using(user_id=auth.uid() or public.is_admin());

create policy messages_select on public.messages for select to authenticated using(public.can_access_conversation(conversation_id));
create policy messages_insert on public.messages for insert to authenticated with check(sender_id=auth.uid() and public.can_access_conversation(conversation_id));
create policy messages_update_own on public.messages for update to authenticated using(sender_id=auth.uid() or public.is_admin()) with check(sender_id=auth.uid() or public.is_admin());
create policy messages_delete_own on public.messages for delete to authenticated using(sender_id=auth.uid() or public.is_admin());

create policy reads_own on public.message_reads for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy reactions_read on public.message_reactions for select to authenticated using(exists(select 1 from public.messages m where m.id=message_id and public.can_access_conversation(m.conversation_id)));
create policy reactions_write on public.message_reactions for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());

create policy notification_prefs_self on public.notification_preferences for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());

insert into public.notification_preferences(user_id)
select id from public.users on conflict(user_id) do nothing;

alter publication supabase_realtime add table public.conversations, public.conversation_members, public.messages, public.message_reads, public.message_reactions, public.notification_preferences;
