-- FATHUR SCHOOL HUB — 0018
-- Fathur Tutoring Schedule (Class 12B), display-only.
-- Source: jadwal_kelas_12b_expanded.json
-- This migration is idempotent and safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.fathur_tutoring_schedule (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'fathur',
  class_name text not null default '12B',
  week_number integer not null,
  day_name text not null,
  schedule_date date not null,
  day_status text not null default 'Ada Kegiatan',
  start_time_label text not null,
  subject_code text not null,
  subject_name text not null,
  activity_type text not null,
  is_display_only boolean not null default true,
  creates_task boolean not null default false,
  source text not null default 'jadwal_kelas_12b_expanded.json',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Repair installations created by earlier versions.
alter table public.fathur_tutoring_schedule
  add column if not exists workspace_id text not null default 'fathur';
alter table public.fathur_tutoring_schedule
  add column if not exists class_name text not null default '12B';
alter table public.fathur_tutoring_schedule
  add column if not exists week_number integer not null default 0;
alter table public.fathur_tutoring_schedule
  add column if not exists day_name text not null default '';
alter table public.fathur_tutoring_schedule
  add column if not exists schedule_date date;
alter table public.fathur_tutoring_schedule
  add column if not exists day_status text not null default 'Ada Kegiatan';
alter table public.fathur_tutoring_schedule
  add column if not exists start_time_label text not null default '';
alter table public.fathur_tutoring_schedule
  add column if not exists subject_code text not null default '';
alter table public.fathur_tutoring_schedule
  add column if not exists subject_name text not null default '';
alter table public.fathur_tutoring_schedule
  add column if not exists activity_type text not null default '';
alter table public.fathur_tutoring_schedule
  add column if not exists is_display_only boolean not null default true;
alter table public.fathur_tutoring_schedule
  add column if not exists creates_task boolean not null default false;
alter table public.fathur_tutoring_schedule
  add column if not exists source text not null default 'jadwal_kelas_12b_expanded.json';

create index if not exists fathur_tutoring_schedule_date_idx
  on public.fathur_tutoring_schedule(schedule_date);

create index if not exists fathur_tutoring_schedule_day_idx
  on public.fathur_tutoring_schedule(day_name, schedule_date);

create index if not exists fathur_tutoring_schedule_subject_idx
  on public.fathur_tutoring_schedule(subject_name, schedule_date);

create index if not exists fathur_tutoring_schedule_workspace_idx
  on public.fathur_tutoring_schedule(workspace_id, schedule_date);

-- Re-import only rows from this JSON source.
delete from public.fathur_tutoring_schedule
where source = 'jadwal_kelas_12b_expanded.json';

insert into public.fathur_tutoring_schedule (
  workspace_id,
  class_name,
  week_number,
  day_name,
  schedule_date,
  day_status,
  start_time_label,
  subject_code,
  subject_name,
  activity_type,
  is_display_only,
  creates_task,
  source
)
values
  ('fathur', '12B', 1, 'Selasa', '2026-09-08', 'Ada Kegiatan', '16.30', 'KIM', 'Kimia', 'Reguler', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 1, 'Selasa', '2026-09-08', 'Ada Kegiatan', '18.30', 'INT TKA SOS', 'Intensif TKA Sosiologi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 1, 'Rabu', '2026-09-09', 'Ada Kegiatan', '16.30', 'MAT', 'Matematika', 'Reguler', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 1, 'Kamis', '2026-09-10', 'Ada Kegiatan', '16.30', 'INT TKA FIS', 'Intensif TKA Fisika', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 1, 'Kamis', '2026-09-10', 'Ada Kegiatan', '18.30', 'GEO', 'Geografi', 'Reguler', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 1, 'Sabtu', '2026-09-12', 'Ada Kegiatan', 'Fleksibel/Full', 'TO NAS TKA', 'Try Out Nasional TKA', 'Try Out', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Senin', '2026-09-14', 'Ada Kegiatan', '18.30', 'INT TKA EKO', 'Intensif TKA Ekonomi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Selasa', '2026-09-15', 'Ada Kegiatan', '16.30', 'INT TKA BIO', 'Intensif TKA Biologi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Selasa', '2026-09-15', 'Ada Kegiatan', '18.30', 'INT TKA SOS', 'Intensif TKA Sosiologi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Rabu', '2026-09-16', 'Ada Kegiatan', '18.30', 'INT TKA BIN', 'Intensif TKA Bahasa Indonesia', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Kamis', '2026-09-17', 'Ada Kegiatan', '16.30', 'INT TKA MAT L', 'Intensif TKA Matematika Lanjut', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Kamis', '2026-09-17', 'Ada Kegiatan', '18.30', 'INT TKA BIG L', 'Intensif TKA Bahasa Inggris Lanjut', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Jumat', '2026-09-18', 'Ada Kegiatan', '16.30', 'INT TKA GEO', 'Intensif TKA Geografi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Jumat', '2026-09-18', 'Ada Kegiatan', '18.30', 'INT TKA KIM', 'Intensif TKA Kimia', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 2, 'Sabtu', '2026-09-19', 'Ada Kegiatan', 'Fleksibel/Full', 'TO NAS SNBT', 'Try Out Nasional SNBT', 'Try Out', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Senin', '2026-09-21', 'Ada Kegiatan', '16.30', 'INT TKA EKO', 'Intensif TKA Ekonomi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Senin', '2026-09-21', 'Ada Kegiatan', '18.30', 'INT TKA BIO', 'Intensif TKA Biologi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Selasa', '2026-09-22', 'Ada Kegiatan', '16.30', 'INT TKA KIM', 'Intensif TKA Kimia', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Rabu', '2026-09-23', 'Ada Kegiatan', '16.30', 'INT TKA GEO', 'Intensif TKA Geografi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Rabu', '2026-09-23', 'Ada Kegiatan', '18.30', 'INT TKA MAT', 'Intensif TKA Matematika', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Kamis', '2026-09-24', 'Ada Kegiatan', '16.30', 'INT TKA FIS', 'Intensif TKA Fisika', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Kamis', '2026-09-24', 'Ada Kegiatan', '18.30', 'INT TKA BIG L', 'Intensif TKA Bahasa Inggris Lanjut', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Jumat', '2026-09-25', 'Ada Kegiatan', '18.30', 'INT TKA BIG', 'Intensif TKA Bahasa Inggris', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 3, 'Sabtu', '2026-09-26', 'Ada Kegiatan', 'Fleksibel/Full', 'TO NAS TKA', 'Try Out Nasional TKA', 'Try Out', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Selasa', '2026-09-29', 'Ada Kegiatan', '16.30', 'INT TKA KIM', 'Intensif TKA Kimia', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Selasa', '2026-09-29', 'Ada Kegiatan', '18.30', 'INT TKA EKO', 'Intensif TKA Ekonomi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Rabu', '2026-09-30', 'Ada Kegiatan', '18.30', 'INT TKA SOS', 'Intensif TKA Sosiologi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Kamis', '2026-10-01', 'Ada Kegiatan', '16.30', 'INT TKA MAT', 'Intensif TKA Matematika', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Kamis', '2026-10-01', 'Ada Kegiatan', '18.30', 'INT TKA BIG', 'Intensif TKA Bahasa Inggris', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Jumat', '2026-10-02', 'Ada Kegiatan', '16.30', 'INT TKA MAT L', 'Intensif TKA Matematika Lanjut', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Jumat', '2026-10-02', 'Ada Kegiatan', '18.30', 'INT TKA BIO', 'Intensif TKA Biologi', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json'),
  ('fathur', '12B', 4, 'Sabtu', '2026-10-03', 'Ada Kegiatan', '12.00', 'INT TKA FIS', 'Intensif TKA Fisika', 'Intensif TKA', true, false, 'jadwal_kelas_12b_expanded.json');

alter table public.fathur_tutoring_schedule
  drop constraint if exists fathur_tutoring_workspace_check;
alter table public.fathur_tutoring_schedule
  drop constraint if exists fathur_tutoring_display_only_check;
alter table public.fathur_tutoring_schedule
  drop constraint if exists fathur_tutoring_no_task_check;

alter table public.fathur_tutoring_schedule
  add constraint fathur_tutoring_workspace_check
  check (workspace_id = 'fathur');

alter table public.fathur_tutoring_schedule
  add constraint fathur_tutoring_display_only_check
  check (is_display_only = true);

alter table public.fathur_tutoring_schedule
  add constraint fathur_tutoring_no_task_check
  check (creates_task = false);

alter table public.fathur_tutoring_schedule enable row level security;

drop policy if exists fathur_tutoring_schedule_select_authenticated
on public.fathur_tutoring_schedule;

create policy fathur_tutoring_schedule_select_authenticated
on public.fathur_tutoring_schedule
for select
using (auth.role() = 'authenticated');

revoke insert, update, delete
on public.fathur_tutoring_schedule
from anon, authenticated;

create or replace view public.fathur_tutoring_upcoming
with (security_invoker = true)
as
select
  id,
  workspace_id,
  class_name,
  week_number,
  day_name,
  schedule_date,
  day_status,
  start_time_label,
  subject_code,
  subject_name,
  activity_type
from public.fathur_tutoring_schedule
where schedule_date >= (timezone('Asia/Jakarta', now()))::date
order by schedule_date asc, start_time_label asc;
