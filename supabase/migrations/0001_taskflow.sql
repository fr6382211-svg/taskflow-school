create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.app_role as enum ('user','admin');
create type public.user_status as enum ('active','disabled');
create type public.task_status as enum ('pending','in_progress','submitted','completed','overdue');
create type public.task_priority as enum ('low','medium','high','urgent');
create type public.schedule_type as enum ('subject','break','ceremony','religious_break','school_activity');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Pengguna',
  email text not null,
  photo_url text,
  role public.app_role not null default 'user',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(), name text not null unique, teacher text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.teachers (
  id uuid primary key default gen_random_uuid(), name text not null, email text, subject text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.schedule (
  id uuid primary key default gen_random_uuid(), day text not null check (day in ('Senin','Selasa','Rabu','Kamis','Jumat')),
  day_order smallint not null check(day_order between 0 and 4), start_time time not null, end_time time not null, subject text not null,
  teacher text, type public.schedule_type not null default 'subject', active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (start_time < end_time)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
  subject_id uuid references public.subjects(id) on delete set null, subject_name text not null, teacher_name text not null default '',
  created_by uuid not null references public.users(id) on delete cascade, created_by_name text not null default '',
  assigned_to uuid not null references public.users(id) on delete cascade, due_date date not null, due_time time not null,
  due_at timestamptz not null, status public.task_status not null default 'pending', priority public.task_priority not null default 'medium',
  file_url text, file_name text, file_type text, file_size bigint, storage_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz,
  submission_status text default 'not_submitted', notes text
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title text not null, message text not null, type text not null check(type in ('deadline','task','system','announcement','security')),
  read boolean not null default false, created_at timestamptz not null default now(), action_url text
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null, body text not null, priority text not null default 'medium' check(priority in ('low','medium','high')),
  created_by uuid not null references public.users(id) on delete restrict, created_at timestamptz not null default now(), expires_at timestamptz, active boolean not null default true
);
create table public.settings (
  user_id uuid primary key references public.users(id) on delete cascade, email_notifications boolean not null default true,
  deadline_reminder boolean not null default true, dark_mode boolean not null default false, compact_mode boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.system_settings (
  id smallint primary key default 1 check(id=1), maintenance_mode boolean not null default false, allow_registration boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id) on delete set null, user_email text not null default '', action text not null,
  target_type text, target_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id) on delete set null, event_name text not null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger users_updated before update on public.users for each row execute function public.set_updated_at();
create trigger subjects_updated before update on public.subjects for each row execute function public.set_updated_at();
create trigger teachers_updated before update on public.teachers for each row execute function public.set_updated_at();
create trigger schedule_updated before update on public.schedule for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();
create trigger settings_updated before update on public.settings for each row execute function public.set_updated_at();
create trigger system_settings_updated before update on public.system_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.users(id,name,email) values(new.id,coalesce(new.raw_user_meta_data->>'name','Pengguna'),new.email) on conflict(id) do update set name=excluded.name,email=excluded.email; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql security definer set search_path=public stable as $$ select exists(select 1 from public.users where id=auth.uid() and role='admin' and status='active') $$;

create index tasks_assigned_due_idx on public.tasks(assigned_to,due_date,due_time);
create index tasks_created_due_idx on public.tasks(created_by,due_date);
create index tasks_status_idx on public.tasks(status);
create index tasks_subject_due_idx on public.tasks(subject_id,due_date);
create index notifications_user_created_idx on public.notifications(user_id,created_at desc);
create index audit_created_idx on public.audit_logs(created_at desc);
create index analytics_created_idx on public.analytics_events(created_at desc);
create index users_search_idx on public.users using gin ((name || ' ' || email) gin_trgm_ops);

alter table public.users enable row level security;
alter table public.subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.schedule enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.settings enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.analytics_events enable row level security;

create policy users_self_or_admin_select on public.users for select using (id=auth.uid() or public.is_admin());
create policy users_self_update on public.users for update using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());
create policy subjects_read on public.subjects for select to authenticated using(true);
create policy subjects_admin_write on public.subjects for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy teachers_read on public.teachers for select to authenticated using(true);
create policy teachers_admin_write on public.teachers for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy schedule_read on public.schedule for select to authenticated using(true);
create policy schedule_admin_write on public.schedule for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy tasks_own_or_admin_select on public.tasks for select to authenticated using(assigned_to=auth.uid() or created_by=auth.uid() or public.is_admin());
create policy tasks_own_insert on public.tasks for insert to authenticated with check(created_by=auth.uid() and assigned_to=auth.uid());
create policy tasks_own_update on public.tasks for update to authenticated using(created_by=auth.uid() or assigned_to=auth.uid() or public.is_admin()) with check(created_by=auth.uid() or assigned_to=auth.uid() or public.is_admin());
create policy tasks_own_delete on public.tasks for delete to authenticated using(created_by=auth.uid() or assigned_to=auth.uid() or public.is_admin());
create policy notifications_own on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy notifications_own_update on public.notifications for update to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy notifications_admin_write on public.notifications for insert to authenticated with check(public.is_admin());
create policy notifications_admin_delete on public.notifications for delete to authenticated using(public.is_admin());
create policy announcements_read on public.announcements for select to authenticated using(active=true or public.is_admin());
create policy announcements_admin_write on public.announcements for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy settings_self on public.settings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy system_settings_admin on public.system_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy audit_admin_select on public.audit_logs for select to authenticated using(public.is_admin());
create policy audit_self_insert on public.audit_logs for insert to authenticated with check(user_id=auth.uid());
create policy analytics_self_insert on public.analytics_events for insert to authenticated with check(user_id=auth.uid());
create policy analytics_admin_select on public.analytics_events for select to authenticated using(public.is_admin());

insert into public.system_settings(id) values(1) on conflict(id) do nothing;

insert into storage.buckets(id,name,public) values('task-files','task-files',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('avatars','avatars',true) on conflict(id) do nothing;
create policy storage_task_read on storage.objects for select to authenticated using(bucket_id='task-files' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
create policy storage_task_insert on storage.objects for insert to authenticated with check(bucket_id='task-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_task_update on storage.objects for update to authenticated using(bucket_id='task-files' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='task-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_task_delete on storage.objects for delete to authenticated using(bucket_id='task-files' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
create policy storage_avatar_read on storage.objects for select to authenticated using(bucket_id='avatars' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
create policy storage_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_avatar_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));

-- Enables Realtime for tables the UI subscribes to.
alter publication supabase_realtime add table public.users,public.tasks,public.schedule,public.notifications,public.announcements,public.settings;
