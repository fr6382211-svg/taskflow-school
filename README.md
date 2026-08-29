# TASKFLOW SCHOOL — Supabase Edition

Production-oriented React + Vite + TypeScript school task management platform using Supabase Auth, Postgres, Realtime, Storage and Edge Functions, deployable on Vercel.

## 1. Install
```bash
npm install
npm run dev
```

## 2. Supabase setup
Create a Supabase project, then open SQL Editor and run `supabase/migrations/0001_taskflow.sql`.
The migration creates the database schema, RLS policies, storage buckets and Realtime publication.

Get the Project URL and Publishable key from the Supabase Connect/API settings, then create `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```
Supabase's current React/Vite guidance uses these variables with `@supabase/supabase-js`.

## 3. Seed schedule
The script requires a service-role key only on your local machine. Never expose that key to Vercel/browser.
```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY npm run seed:schedule
```
It skips seeding if schedule rows already exist.

## 4. Make an admin
```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY npm run set:admin -- your@email.com
```
Then log out/in once so the UI reloads the profile role.

## 5. Deploy Edge Function
Install/login to Supabase CLI, link the project, then:
```bash
supabase functions deploy admin-users
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```
Keep the service role key only as an Edge Function secret. Authenticated Edge Functions should retain JWT verification.

## 6. Vercel
Import the GitHub repository into Vercel. Build command:
```bash
npm run build
```
Output directory:
```text
dist
```
Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables in Vercel. Vite exposes `VITE_*` values to browser code, so use only the Supabase publishable/anon key there; never put a service-role key in frontend variables. Protect exposed tables with RLS.

## 7. Auth
Enable Email provider in Supabase Auth. Set Site URL to the Vercel production URL and add your Vercel/preview URLs under Redirect URLs as appropriate.

## 8. Storage
The migration creates `task-files` and `avatars`. Task uploads are stored at `<user-id>/<uuid>-<filename>` and protected by Storage RLS. Supabase Storage is designed for persistent file storage and can be accessed through the client SDK.

## 9. No application localStorage database
The application does not use localStorage/sessionStorage/IndexedDB for application data. Supabase Auth's official browser client may persist authentication sessions using its managed storage when `persistSession` is enabled; application records remain in Postgres/Storage.

## 10. Main tables
`users`, `subjects`, `teachers`, `schedule`, `tasks`, `notifications`, `announcements`, `settings`, `system_settings`, `audit_logs`, `analytics_events`.

## 11. Production checks
```bash
npm run lint
npm run build
```
Firebase SDK tidak digunakan; seluruh backend aplikasi menggunakan Supabase.

## Vercel deployment note

The production bundle includes `.env.production` containing only the Supabase **publishable** client key and project URL supplied for TASKFLOW SCHOOL. The Supabase database remains protected by RLS. Never place a Supabase secret/service-role key in this file or in any `VITE_*` variable.

If you prefer Vercel-managed environment variables, define `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel Project Settings; Vercel values take precedence over repository environment files.

## Zero-config Vercel frontend

This repository contains a `.env.production` file using only the Supabase project URL and publishable browser key supplied for TASKFLOW SCHOOL. That means the Vite production build can start on Vercel without manually adding frontend environment variables. A publishable key is not a service-role/secret key; database and storage protection still comes from Supabase RLS and Storage policies.

For maximum operational hygiene you may later move these two values into Vercel Environment Variables. Never put Supabase secret/service-role keys into `VITE_*` variables or browser code.

## Google Calendar / Hari Libur

Taskflow menampilkan kalender gabungan: deadline tugas dari Supabase, jadwal sekolah dari Supabase, Sabtu/Minggu sebagai libur mingguan, dan hari libur Indonesia dari public Google Calendar. Default calendar ID adalah `en.indonesian#holiday@group.v.calendar.google.com`. Google Calendar API menggunakan `events.list`; untuk kalender publik, API key dapat digunakan. Untuk kalender pribadi/menulis event ke kalender pengguna, gunakan OAuth dan scope Calendar, bukan API key saja.

Atur:

`VITE_GOOGLE_CALENDAR_API_KEY`

`VITE_GOOGLE_HOLIDAY_CALENDAR_ID`

Sistem menghitung hari sekolah berikutnya dan menampilkan `Masuk sekolah H-N`. Hari Sabtu/Minggu dan hari yang memiliki event libur tidak dihitung.

## Membuat Admin

Akun admin tidak disimpan di source code. Jalankan script trusted berikut dengan Supabase service role key hanya di komputer/server yang aman:

PowerShell:

`$env:SUPABASE_URL="https://PROJECT.supabase.co"`

`$env:SUPABASE_SERVICE_ROLE_KEY="..."`

`$env:ADMIN_EMAIL="..."`

`$env:ADMIN_PASSWORD="..."`

`npm run create:admin`

Jangan masukkan `SUPABASE_SERVICE_ROLE_KEY` ke Vercel/frontend.


## Productivity Upgrade
Versi ini menambahkan Focus Mode, Insight produktivitas berbasis data Supabase, pencarian global, tag tugas, checklist/subtasks, komentar tugas realtime, quick status, dan ekspor kalender `.ics`. Terapkan migration `supabase/migrations/0003_productivity_upgrade.sql` sekali pada project Supabase yang sudah memakai migration 0001 dan 0002. Fitur fokus menyimpan sesi ke tabel `focus_sessions`; checklist ke `task_subtasks`; diskusi ke `task_comments`.
