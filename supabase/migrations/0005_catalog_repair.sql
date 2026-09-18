-- TASKFLOW SCHOOL v1.5: keep subject/teacher catalogs synchronized with the school schedule.
-- Safe and idempotent: only fills missing records and does not duplicate existing names.

insert into public.subjects (name, teacher, active)
select distinct s.subject, nullif(s.teacher, ''), true
from public.schedule s
where s.active = true
  and s.type = 'subject'
  and trim(s.subject) <> ''
on conflict (name) do update
set teacher = coalesce(public.subjects.teacher, excluded.teacher),
    active = true;

insert into public.teachers (name, subject, active)
select distinct s.teacher, s.subject, true
from public.schedule s
where s.active = true
  and s.type = 'subject'
  and nullif(trim(s.teacher), '') is not null
on conflict do nothing;

create index if not exists subjects_active_name_idx
  on public.subjects(active, name);

create index if not exists teachers_active_name_idx
  on public.teachers(active, name);
