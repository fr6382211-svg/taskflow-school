-- ============================================================
-- RESET SEMUA USER — jalankan manual di Supabase Dashboard
-- (Project kamu -> SQL Editor -> paste -> Run)
--
-- PERINGATAN: ini menghapus SEMUA akun & data yang menempel ke
-- akun (tasks, notes, sessions, dsb ikut terhapus via ON DELETE
-- CASCADE). Setelah dijalankan, semua orang wajib daftar ulang
-- lewat halaman /register.
-- ============================================================

-- 1) Hapus baris di public.users (akan cascade ke tasks, notes,
--    login_sessions, dan tabel lain yang foreign-key ke users.id)
delete from public.users;

-- 2) Hapus akun auth Supabase itu sendiri (wajib pakai service_role,
--    tidak bisa lewat SQL Editor biasa kalau RLS ketat — kalau
--    perintah di bawah gagal karena permission, hapus manual satu
--    per satu lewat Dashboard -> Authentication -> Users -> Delete)
delete from auth.users;

-- 3) (Opsional) kosongkan folder milik user lama di storage buckets
--    supaya tidak menyisakan file yatim. Jalankan per bucket yang
--    relevan (task-files, note-files, avatars, my-minee, dst).
-- delete from storage.objects where bucket_id in ('task-files','note-files','avatars');

-- Setelah ini: buka aplikasi -> halaman /register -> daftarkan ulang
-- akun Fathur, lalu akun Mazet (set role admin manual lewat
-- update public.users set role='admin' where email='...' bila perlu).
