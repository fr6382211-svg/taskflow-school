-- TASKFLOW SCHOOL productivity expansion: subtasks, comments, focus sessions, tags.
alter table public.tasks add column if not exists tags text[] not null default '{}';
create index if not exists tasks_tags_gin_idx on public.tasks using gin(tags);

create table if not exists public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists task_subtasks_task_idx on public.task_subtasks(task_id, position);
create trigger task_subtasks_updated before update on public.task_subtasks for each row execute function public.set_updated_at();

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  user_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists task_comments_task_idx on public.task_comments(task_id, created_at desc);
create trigger task_comments_updated before update on public.task_comments for each row execute function public.set_updated_at();

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  minutes integer not null check (minutes between 1 and 240),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists focus_sessions_user_created_idx on public.focus_sessions(user_id, created_at desc);

alter table public.task_subtasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.focus_sessions enable row level security;

create or replace function public.can_access_task(p_task uuid) returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from public.tasks t where t.id=p_task and (t.assigned_to=auth.uid() or t.created_by=auth.uid() or public.is_admin()))
$$;

create policy task_subtasks_access on public.task_subtasks for all to authenticated using(public.can_access_task(task_id) and (user_id=auth.uid() or public.is_admin())) with check(public.can_access_task(task_id) and (user_id=auth.uid() or public.is_admin()));
create policy task_comments_select on public.task_comments for select to authenticated using(public.can_access_task(task_id));
create policy task_comments_insert on public.task_comments for insert to authenticated with check(public.can_access_task(task_id) and user_id=auth.uid());
create policy task_comments_update on public.task_comments for update to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy task_comments_delete on public.task_comments for delete to authenticated using(user_id=auth.uid() or public.is_admin());
create policy focus_sessions_own on public.focus_sessions for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());

grant select,insert,update,delete on public.task_subtasks, public.task_comments, public.focus_sessions to authenticated;

alter publication supabase_realtime add table public.task_subtasks,public.task_comments,public.focus_sessions;
