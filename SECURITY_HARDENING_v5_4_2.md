# Security Hardening Pass — v5.4.2

Audit menyeluruh terhadap kode sumber, database policy (RLS), dan edge
functions. Berikut temuan dan perbaikan yang sudah diterapkan langsung di
kode ini, disusun dari yang paling kritis.

## 🔴 KRITIS — Privilege escalation di tabel `users` (SUDAH DIPERBAIKI)

**File baru:** `supabase/migrations/0020_security_hardening_role_escalation_fix.sql`

Policy lama `users_self_update` mengizinkan user meng-update baris miliknya
sendiri (`id = auth.uid()`) tanpa membatasi kolom apa yang boleh diubah.
Karena `role` dan `status` ada di baris yang sama, **user biasa bisa
menjalankan**:

```js
supabase.from('users').update({ role: 'admin', status: 'active' }).eq('id', myId)
```

...dan langsung menjadi admin. Ini lubang keamanan paling serius di sistem.

Perbaikan (dua lapis):
1. **Trigger** `guard_users_role_status` — menolak perubahan `role`/`status`
   kecuali pelakunya sudah admin aktif (atau berasal dari service-role,
   yaitu edge function server-side).
2. **RLS policy diperketat** — `WITH CHECK` sekarang membandingkan nilai
   `role`/`status` baru dengan nilai lama di database, bukan cuma memeriksa
   kepemilikan baris.
3. **Audit log otomatis** — setiap perubahan role/status seorang user kini
   tercatat di `audit_logs` (siapa mengubah, dari apa ke apa).

➡️ **Wajib jalankan migration ini** (`supabase db push` / lewat dashboard)
sebelum deploy ulang.

## 🟠 Edge function `admin-users` — diperkuat

- CORS diubah dari `Access-Control-Allow-Origin: *` menjadi origin yang
  eksplisit lewat secret `ALLOWED_ORIGIN` (fallback ke `APP_URL`).
- Validasi `uid` (harus UUID valid) sebelum dipakai di query.
- Admin tidak lagi bisa mengubah role/menghapus akunnya sendiri lewat
  endpoint ini (mencegah kunci-diri-sendiri secara tidak sengaja atau lewat
  sesi yang dibajak).
- Rate limit sederhana per user (20 request/menit per instance) untuk
  memperlambat penyalahgunaan.
- Setiap aksi admin (`set_role`, `delete_user`) sekarang ditulis ke
  `audit_logs`.

**Aksi manual:** set secret `ALLOWED_ORIGIN` di Supabase (Project Settings →
Edge Functions → Secrets), contoh: `https://pelajaranfathur.vercel.app`.

## 🟠 Edge function `daily-digest` — fail closed

Sebelumnya, jika secret `CRON_SECRET` belum di-set, fungsi ini bisa dipicu
siapa saja tanpa autentikasi (karena `verify_jwt = false` di
`config.toml`, sengaja dibuat begitu supaya cron eksternal bisa
memanggilnya). Sekarang: **tanpa `CRON_SECRET`, semua request ditolak**
(fail closed, bukan fail open).

**Aksi manual:** pastikan `CRON_SECRET` sudah di-set sebagai secret, dan
cron job/scheduler mengirim header `x-cron-secret` yang sama.

## 🟡 HTTP security headers (SUDAH DITAMBAHKAN)

`vercel.json` sekarang mengirim:
`Content-Security-Policy`, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security` (HSTS), dan
`frame-ancestors 'none'` (anti clickjacking).

CSP dibuat mengizinkan domain yang memang dipakai app ini (Supabase,
Firebase RTDB, YouTube, Google APIs, Last.fm). Jika menambah integrasi baru
yang memanggil domain lain, tambahkan domain itu ke `connect-src`/`frame-src`
di `vercel.json` atau embed-nya akan diblokir browser.

## 🟡 Kredensial ter-hardcode di source (fallback build)

- `src/lib/supabase.ts` menyimpan fallback URL + publishable key project
  Supabase asli agar build tidak gagal saat env var belum di-set (fitur
  sengaja dari versi sebelumnya, lihat `BUILD_FIX_V5_4_1_1.md`). Publishable
  key memang didesain untuk publik (bukan rahasia) **selama RLS benar** —
  dan celah RLS yang membuatnya berbahaya sudah ditutup di atas. Sekarang
  ditambahkan `console.warn` di runtime kalau fallback ini yang terpakai,
  supaya ketahuan kalau sebuah deployment lupa set env var-nya sendiri.
- `src/lib/firebase.ts` berisi Firebase Web config (apiKey publik dari
  Firebase juga bukan rahasia by design). Keamanan sebenarnya ada di
  **Firebase Realtime Database security rules**, yang tidak ada di
  repo ini (dikonfigurasi lewat Firebase Console).

**Aksi manual (di luar kode, tidak bisa saya lakukan dari sini):**
1. Di Firebase Console → Realtime Database → Rules: pastikan rules
   menolak read/write default (`".read": false, ".write": false`) dan hanya
   mengizinkan path yang memang perlu, dengan `auth != null`.
2. Di Google Cloud Console: restrict `VITE_GOOGLE_MAPS_API_KEY` dan
   `VITE_GOOGLE_CALENDAR_API_KEY` supaya hanya bisa dipakai dari domain
   Vercel App-mu (HTTP referrer restriction) — README sudah menyarankan ini
   untuk YouTube key, saran yang sama berlaku untuk semua key Google lain.
3. Di Supabase → Authentication → Settings: aktifkan "Leaked password
   protection" dan pertimbangkan mengaktifkan MFA opsional untuk akun admin.

## 🟡 YouTube API key disimpan di localStorage (tidak diubah — catatan penting)

`src/lib/apiKeyStore.ts` menyimpan API key YouTube milik host secara utuh di
`localStorage` browser (hanya versi masked yang dipublikasikan ke Firebase).
Ini bukan bug baru dan **tidak saya ubah** karena memperbaikinya dengan benar
butuh membangun proxy server-side baru (edge function) dan mengubah alur
`searchYouTubeVideos`/`TvSearchModal`/`TvSettingsModal` sekaligus — perubahan
besar yang berisiko merusak fitur watch-party kalau dikerjakan tanpa bisa
saya build & test di sini. Mitigasi yang **sudah cukup** untuk kasus
pemakaian pribadi/keluarga seperti app ini: restrict key tersebut di Google
Cloud Console by HTTP referrer (poin di atas) — dengan begitu key yang bocor
tidak bisa dipakai dari domain lain.

## Ringkasan file yang berubah

| File | Perubahan |
|---|---|
| `supabase/migrations/0020_security_hardening_role_escalation_fix.sql` | **Baru** — tutup celah privilege escalation |
| `supabase/functions/admin-users/index.ts` | CORS ketat, validasi input, rate limit, audit log, guard aksi ke diri sendiri |
| `supabase/functions/daily-digest/index.ts` | Fail closed tanpa `CRON_SECRET` |
| `vercel.json` | Security headers + CSP |
| `src/lib/supabase.ts` | Warning runtime saat pakai fallback credentials |

## Checklist deploy

- [ ] Jalankan migration `0020_...sql` di Supabase (production!)
- [ ] Set secret `ALLOWED_ORIGIN` untuk edge function `admin-users`
- [ ] Pastikan secret `CRON_SECRET` sudah ada & scheduler mengirim header yang sama
- [ ] Set `VITE_SUPABASE_URL` & `VITE_SUPABASE_PUBLISHABLE_KEY` di Vercel env (project sendiri, bukan fallback)
- [ ] Review Firebase Realtime Database rules
- [ ] Restrict semua Google API key (Maps, Calendar, YouTube) by HTTP referrer
- [ ] Aktifkan leaked-password protection di Supabase Auth
