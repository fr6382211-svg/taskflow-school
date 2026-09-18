-- TASKFLOW SCHOOL: idempotent default school schedule bootstrap.
-- This is safe to call from the authenticated client only when the schedule is empty.

create or replace function public.ensure_default_schedule()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Serialize concurrent first-run calls so two browsers cannot seed twice.
  perform pg_advisory_xact_lock(hashtext('taskflow-default-schedule-v1'));

  if exists (select 1 from public.schedule limit 1) then
    return 0;
  end if;

  insert into public.subjects(name, teacher, active) values
    ('BAHASA INGGRIS','ENDAH LISTYANI',true),
    ('MATEMATIKA','INDAYATI',true),
    ('BAHASA INDONESIA','EVY AFIATU SA''ADA',true),
    ('BAHASA JAWA','PUTRI WAHYU PRAMUDITA, S.Pd.',true),
    ('PAI','MUH MISBAKHUL MUNIR',true),
    ('BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C',true),
    ('BK','YAYUK KASMAWATI',true),
    ('MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd',true),
    ('SENI DAN BUDAYA','METARANY JUANG M, S.Sn',true),
    ('PENJASKES','EDI PURWANTO',true),
    ('INFORMATIKA','ZAKARIA MUTTAQIN',true),
    ('PRAKARYA','PUJI RAHAYU, S.Pd',true),
    ('SEJARAH','AGUS SUGIANTO',true),
    ('FISIKA','SUTJI RAHAYU',true),
    ('PPKN','BAMBANG PURNOMO',true)
  on conflict (name) do update set teacher = excluded.teacher, active = true;

  insert into public.schedule(day, day_order, start_time, end_time, subject, teacher, type, active) values
    ('Senin',0,'07:00','07:45','UPACARA',null,'ceremony',true),
    ('Senin',0,'07:45','08:30','BAHASA INGGRIS','ENDAH LISTYANI','subject',true),
    ('Senin',0,'08:30','09:15','BAHASA INGGRIS','ENDAH LISTYANI','subject',true),
    ('Senin',0,'09:15','10:00','BAHASA INGGRIS','ENDAH LISTYANI','subject',true),
    ('Senin',0,'10:00','10:15','ISTIRAHAT',null,'break',true),
    ('Senin',0,'10:15','11:00','MATEMATIKA','INDAYATI','subject',true),
    ('Senin',0,'11:00','11:45','MATEMATIKA','INDAYATI','subject',true),
    ('Senin',0,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN',null,'religious_break',true),
    ('Senin',0,'12:30','13:10','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject',true),
    ('Senin',0,'13:10','13:50','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject',true),
    ('Senin',0,'13:50','14:30','BAHASA JAWA','PUTRI WAHYU PRAMUDITA, S.Pd.','subject',true),
    ('Senin',0,'14:30','15:10','BAHASA JAWA','PUTRI WAHYU PRAMUDITA, S.Pd.','subject',true),
    ('Senin',0,'15:10','15:20','ASRI',null,'school_activity',true),
    ('Selasa',1,'07:00','07:45','PAI','MUH MISBAKHUL MUNIR','subject',true),
    ('Selasa',1,'07:45','08:30','PAI','MUH MISBAKHUL MUNIR','subject',true),
    ('Selasa',1,'08:30','09:15','PAI','MUH MISBAKHUL MUNIR','subject',true),
    ('Selasa',1,'09:15','10:00','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject',true),
    ('Selasa',1,'10:00','10:15','ISTIRAHAT',null,'break',true),
    ('Selasa',1,'10:15','11:00','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject',true),
    ('Selasa',1,'11:00','11:45','BK','YAYUK KASMAWATI','subject',true),
    ('Selasa',1,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN',null,'religious_break',true),
    ('Selasa',1,'12:30','13:10','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject',true),
    ('Selasa',1,'13:10','13:50','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject',true),
    ('Selasa',1,'13:50','14:30','SENI DAN BUDAYA','METARANY JUANG M, S.Sn','subject',true),
    ('Selasa',1,'14:30','15:10','SENI DAN BUDAYA','METARANY JUANG M, S.Sn','subject',true),
    ('Selasa',1,'15:10','15:20','ASRI',null,'school_activity',true),
    ('Rabu',2,'07:00','07:45','PENJASKES','EDI PURWANTO','subject',true),
    ('Rabu',2,'07:45','08:30','PENJASKES','EDI PURWANTO','subject',true),
    ('Rabu',2,'08:30','09:15','PENJASKES','EDI PURWANTO','subject',true),
    ('Rabu',2,'09:15','10:00','INFORMATIKA','ZAKARIA MUTTAQIN','subject',true),
    ('Rabu',2,'10:00','10:15','ISTIRAHAT',null,'break',true),
    ('Rabu',2,'10:15','11:00','INFORMATIKA','ZAKARIA MUTTAQIN','subject',true),
    ('Rabu',2,'11:00','11:45','INFORMATIKA','ZAKARIA MUTTAQIN','subject',true),
    ('Rabu',2,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN',null,'religious_break',true),
    ('Rabu',2,'12:30','13:10','MATEMATIKA','INDAYATI','subject',true),
    ('Rabu',2,'13:10','13:50','MATEMATIKA','INDAYATI','subject',true),
    ('Rabu',2,'13:50','14:30','PRAKARYA','PUJI RAHAYU, S.Pd','subject',true),
    ('Rabu',2,'14:30','15:10','PRAKARYA','PUJI RAHAYU, S.Pd','subject',true),
    ('Rabu',2,'15:10','15:20','ASRI',null,'school_activity',true),
    ('Kamis',3,'07:00','07:45','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject',true),
    ('Kamis',3,'07:45','08:30','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject',true),
    ('Kamis',3,'08:30','09:15','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject',true),
    ('Kamis',3,'09:15','10:00','SEJARAH','AGUS SUGIANTO','subject',true),
    ('Kamis',3,'10:00','10:15','ISTIRAHAT',null,'break',true),
    ('Kamis',3,'10:15','11:00','SEJARAH','AGUS SUGIANTO','subject',true),
    ('Kamis',3,'11:00','11:45','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject',true),
    ('Kamis',3,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN',null,'religious_break',true),
    ('Kamis',3,'12:30','13:10','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject',true),
    ('Kamis',3,'13:10','13:50','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject',true),
    ('Kamis',3,'13:50','14:30','FISIKA','SUTJI RAHAYU','subject',true),
    ('Kamis',3,'14:30','15:10','FISIKA','SUTJI RAHAYU','subject',true),
    ('Kamis',3,'15:10','15:20','ASRI',null,'school_activity',true),
    ('Jumat',4,'07:00','07:45','PPKN','BAMBANG PURNOMO','subject',true),
    ('Jumat',4,'07:45','08:30','PPKN','BAMBANG PURNOMO','subject',true),
    ('Jumat',4,'08:30','09:15','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject',true),
    ('Jumat',4,'09:15','10:00','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject',true),
    ('Jumat',4,'10:00','10:15','ISTIRAHAT',null,'break',true),
    ('Jumat',4,'10:15','11:00','FISIKA','SUTJI RAHAYU','subject',true),
    ('Jumat',4,'11:00','11:30','FISIKA','SUTJI RAHAYU','subject',true),
    ('Jumat',4,'11:30','13:00','SHOLAT JUMAT MAKAN ISTIRAHAT',null,'religious_break',true),
    ('Jumat',4,'13:00','13:40','FISIKA','SUTJI RAHAYU','subject',true),
    ('Jumat',4,'13:40','14:20','INFORMATIKA','ZAKARIA MUTTAQIN','subject',true),
    ('Jumat',4,'14:20','15:00','INFORMATIKA','ZAKARIA MUTTAQIN','subject',true),
    ('Jumat',4,'15:00','15:10','ASRI',null,'school_activity',true);

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.ensure_default_schedule() from public;
grant execute on function public.ensure_default_schedule() to authenticated;

-- Apply the default dataset immediately when this migration is run.
insert into public.schedule(day, day_order, start_time, end_time, subject, teacher, type, active)
select v.day, v.day_order, v.start_time::time, v.end_time::time, v.subject, nullif(v.teacher,''), v.type::public.schedule_type, true
from (values
  ('Senin',0,'07:00','07:45','UPACARA','','ceremony'),('Senin',0,'07:45','08:30','BAHASA INGGRIS','ENDAH LISTYANI','subject'),('Senin',0,'08:30','09:15','BAHASA INGGRIS','ENDAH LISTYANI','subject'),('Senin',0,'09:15','10:00','BAHASA INGGRIS','ENDAH LISTYANI','subject'),('Senin',0,'10:00','10:15','ISTIRAHAT','','break'),('Senin',0,'10:15','11:00','MATEMATIKA','INDAYATI','subject'),('Senin',0,'11:00','11:45','MATEMATIKA','INDAYATI','subject'),('Senin',0,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN','','religious_break'),('Senin',0,'12:30','13:10','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject'),('Senin',0,'13:10','13:50','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject'),('Senin',0,'13:50','14:30','BAHASA JAWA','PUTRI WAHYU PRAMUDITA, S.Pd.','subject'),('Senin',0,'14:30','15:10','BAHASA JAWA','PUTRI WAHYU PRAMUDITA, S.Pd.','subject'),('Senin',0,'15:10','15:20','ASRI','','school_activity'),
  ('Selasa',1,'07:00','07:45','PAI','MUH MISBAKHUL MUNIR','subject'),('Selasa',1,'07:45','08:30','PAI','MUH MISBAKHUL MUNIR','subject'),('Selasa',1,'08:30','09:15','PAI','MUH MISBAKHUL MUNIR','subject'),('Selasa',1,'09:15','10:00','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject'),('Selasa',1,'10:00','10:15','ISTIRAHAT','','break'),('Selasa',1,'10:15','11:00','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject'),('Selasa',1,'11:00','11:45','BK','YAYUK KASMAWATI','subject'),('Selasa',1,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN','','religious_break'),('Selasa',1,'12:30','13:10','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject'),('Selasa',1,'13:10','13:50','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject'),('Selasa',1,'13:50','14:30','SENI DAN BUDAYA','METARANY JUANG M, S.Sn','subject'),('Selasa',1,'14:30','15:10','SENI DAN BUDAYA','METARANY JUANG M, S.Sn','subject'),('Selasa',1,'15:10','15:20','ASRI','','school_activity'),
  ('Rabu',2,'07:00','07:45','PENJASKES','EDI PURWANTO','subject'),('Rabu',2,'07:45','08:30','PENJASKES','EDI PURWANTO','subject'),('Rabu',2,'08:30','09:15','PENJASKES','EDI PURWANTO','subject'),('Rabu',2,'09:15','10:00','INFORMATIKA','ZAKARIA MUTTAQIN','subject'),('Rabu',2,'10:00','10:15','ISTIRAHAT','','break'),('Rabu',2,'10:15','11:00','INFORMATIKA','ZAKARIA MUTTAQIN','subject'),('Rabu',2,'11:00','11:45','INFORMATIKA','ZAKARIA MUTTAQIN','subject'),('Rabu',2,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN','','religious_break'),('Rabu',2,'12:30','13:10','MATEMATIKA','INDAYATI','subject'),('Rabu',2,'13:10','13:50','MATEMATIKA','INDAYATI','subject'),('Rabu',2,'13:50','14:30','PRAKARYA','PUJI RAHAYU, S.Pd','subject'),('Rabu',2,'14:30','15:10','PRAKARYA','PUJI RAHAYU, S.Pd','subject'),('Rabu',2,'15:10','15:20','ASRI','','school_activity'),
  ('Kamis',3,'07:00','07:45','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject'),('Kamis',3,'07:45','08:30','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject'),('Kamis',3,'08:30','09:15','BHS INGGRIS TINGKAT LANJUT','ROPIKOHERNA C','subject'),('Kamis',3,'09:15','10:00','SEJARAH','AGUS SUGIANTO','subject'),('Kamis',3,'10:00','10:15','ISTIRAHAT','','break'),('Kamis',3,'10:15','11:00','SEJARAH','AGUS SUGIANTO','subject'),('Kamis',3,'11:00','11:45','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject'),('Kamis',3,'11:45','12:30','ISTIRAHAT SHOLAT MAKAN','','religious_break'),('Kamis',3,'12:30','13:10','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject'),('Kamis',3,'13:10','13:50','MATEMATIKA TINGKAT LANJUT','SUKISNAWATI, S.Pd','subject'),('Kamis',3,'13:50','14:30','FISIKA','SUTJI RAHAYU','subject'),('Kamis',3,'14:30','15:10','FISIKA','SUTJI RAHAYU','subject'),('Kamis',3,'15:10','15:20','ASRI','','school_activity'),
  ('Jumat',4,'07:00','07:45','PPKN','BAMBANG PURNOMO','subject'),('Jumat',4,'07:45','08:30','PPKN','BAMBANG PURNOMO','subject'),('Jumat',4,'08:30','09:15','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject'),('Jumat',4,'09:15','10:00','BAHASA INDONESIA','EVY AFIATU SA''ADA','subject'),('Jumat',4,'10:00','10:15','ISTIRAHAT','','break'),('Jumat',4,'10:15','11:00','FISIKA','SUTJI RAHAYU','subject'),('Jumat',4,'11:00','11:30','FISIKA','SUTJI RAHAYU','subject'),('Jumat',4,'11:30','13:00','SHOLAT JUMAT MAKAN ISTIRAHAT','','religious_break'),('Jumat',4,'13:00','13:40','FISIKA','SUTJI RAHAYU','subject'),('Jumat',4,'13:40','14:20','INFORMATIKA','ZAKARIA MUTTAQIN','subject'),('Jumat',4,'14:20','15:00','INFORMATIKA','ZAKARIA MUTTAQIN','subject'),('Jumat',4,'15:00','15:10','ASRI','','school_activity')
) as v(day,day_order,start_time,end_time,subject,teacher,type)
where not exists (select 1 from public.schedule);

-- Explicit Data API privileges; RLS above remains the authorization boundary.
grant select on public.users, public.subjects, public.teachers, public.schedule, public.tasks, public.notifications, public.announcements, public.settings, public.system_settings, public.audit_logs, public.analytics_events to authenticated;
grant insert, update, delete on public.users, public.subjects, public.teachers, public.schedule, public.tasks, public.notifications, public.announcements, public.settings, public.system_settings, public.audit_logs, public.analytics_events to authenticated;
