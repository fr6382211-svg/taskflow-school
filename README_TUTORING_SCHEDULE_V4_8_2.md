# Fathur Tutoring Schedule v4.8.2

Perbaikan utama:
- SQL 0018 diperbaiki agar INSERT memiliki 13 target kolom dan 13 nilai.
- `workspace_id` selalu `fathur` dan `class_name` selalu `12B`.
- Jadwal les bersifat display-only dan tidak membuat task/deadline.
- Frontend membaca Supabase bila tersedia.
- Jika Supabase belum tersinkron/terblokir sementara, frontend menggunakan data JSON terintegrasi agar dashboard tidak blank.
- Sumber data ditampilkan di panel dashboard.

Install database:
1. Supabase -> SQL Editor.
2. Jalankan `supabase/migrations/0018_fathur_tutoring_schedule.sql` penuh.
3. Pastikan tabel `public.fathur_tutoring_schedule` memiliki data.
4. Build frontend dengan `npm install` lalu `npm run build`.
