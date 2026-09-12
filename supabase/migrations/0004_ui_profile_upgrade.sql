-- TASKFLOW v1.4 UI/profile support. Safe to rerun.
alter table public.users add column if not exists photo_path text;

-- Optional future preferences stored alongside existing settings.
alter table public.settings add column if not exists reduced_motion boolean not null default false;
alter table public.settings add column if not exists week_starts_monday boolean not null default true;

create index if not exists users_role_status_idx on public.users(role, status);
