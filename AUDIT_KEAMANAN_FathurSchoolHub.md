# Laporan Audit Keamanan — Fathur SchoolHub v5.4.1.1

Ruang lingkup: kode frontend (React/Vite), Supabase (18 migration + 2 edge function), integrasi Firebase RTDB, Google API, dan konfigurasi deploy (Vercel).

**STATUS: SEMUA 9 TEMUAN DI BAWAH INI SUDAH DIPERBAIKI DI KODE** (lihat bagian "Status Perbaikan" di paling bawah untuk detail file yang diubah dan langkah manual yang masih perlu kamu lakukan di dashboard Supabase/Vercel/Firebase/Google Cloud).

Legenda severity: 🔴 Kritis · 🟠 Tinggi · 🟡 Sedang · ⚪ Rendah

---

## 🔴 KRITIS

### 1. Edge function `daily-digest` bisa dipanggil tanpa autentikasi dan membocorkan data
**File:** `supabase/functions/daily-digest/index.ts`, `supabase/config.toml` (`verify_jwt = false`)

- Function ini **tidak** diverifikasi JWT oleh Supabase (`verify_jwt = false`), jadi endpoint-nya publik di internet.
- Satu-satunya pengaman adalah header `x-cron-secret`, tapi kodenya:
  ```ts
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) return ...401
  ```
  Kalau env var `CRON_SECRET` **belum di-set** di Supabase (README menyebutnya "recommended", bukan wajib), pengecekan ini otomatis dilewati — siapa pun bisa memicu function ini kapan saja.
- Response JSON dari function ini mengembalikan **daftar email semua user beserta jumlah tugas mereka** (`results.push({ email: target.email, ... })`). Ini kebocoran PII kalau endpoint dipanggil orang luar.
- Dampak lain: pemicu massal pengiriman email (biaya Resend, spam ke seluruh user), berulang kali dalam sehari kalau attacker mau iseng (walau ada idempotency check per hari, di hari yang sama tetap bisa "dites" berkali-kali dan tetap balikin daftar email).

**Rekomendasi:**
- Jadikan `CRON_SECRET` **wajib** — kalau tidak diset, function harus langsung menolak semua request (fail-closed, bukan fail-open).
- Jangan pernah kembalikan alamat email di response body publik; cukup jumlah terkirim/gagal tanpa PII.
- Pertimbangkan set `verify_jwt = true` dan panggil dari cron menggunakan service-role token, atau tetap `false` tapi wajibkan secret + IP allow-list dari Supabase Cron jika didukung.

---

## 🟠 TINGGI

### 2. Galeri privat "My Minee" bisa dilihat oleh **semua** user yang login, bukan hanya admin
**File:** `supabase/migrations/0011_my_minee_private_and_secure_delete.sql`

```sql
create policy my_minee_auth_read on storage.objects for select
  to authenticated using (bucket_id = 'my-minee');
```
Bucket ini memang sudah diperbaiki dari *public* jadi *private* (bagus), tapi kebijakannya masih `to authenticated` — artinya **setiap akun yang berhasil daftar di aplikasi sekolah ini** (siswa lain, dst.) bisa membuka semua foto pribadi di galeri ini, bukan cuma pemilik/admin.

**Rekomendasi:** ganti policy jadi `using (public.is_admin())` atau ke kolom `created_by = auth.uid()` kalau memang harus per-user, supaya konten pribadi tidak bisa diakses akun lain yang mendaftar di app yang sama.

### 3. Rules Firebase Realtime Database mengandalkan `auth != null`, padahal app pakai **anonymous sign-in**
**File:** `src/lib/firebase.ts` (`signInAnonymously`), `database.firebase.rules.json`

```json
"admins": { ".read": "auth != null" }
```
Karena aplikasi otomatis login anonim ke Firebase (`ensureAnonymousAuth`) untuk fitur Watch Party, syarat `auth != null` nyaris tidak melindungi apa pun — **siapa pun yang buka websitenya** otomatis dapat token anonim dan bisa baca node `admins` (daftar UID admin) serta semua `rooms/*` (termasuk daftar member, nickname, command history).

**Rekomendasi:** Kalau data ini tidak dimaksudkan publik, batasi berdasarkan custom claim/UID spesifik, bukan sekadar "auth != null". Kalau memang untuk watch-party publik, itu OK — tapi pastikan tidak ada info sensitif (email, dsb.) yang ikut tersimpan di node `rooms`.

### 4. Beberapa API key pihak ketiga di-hardcode langsung di source code sebagai fallback
**File:** `src/lib/firebase.ts`, `src/lib/googleCalendar.ts`, `src/lib/supabase.ts`

- Firebase Web config, Google Calendar API key, dan Supabase URL + publishable key semuanya punya nilai **hardcoded** sebagai fallback kalau env var tidak diisi.
- Firebase Web config & Supabase anon/publishable key memang secara desain aman untuk terekspos di client (keamanan sebenarnya ada di Firebase Rules / RLS Supabase) — **asalkan** rules/RLS-nya benar (lihat temuan #2, #3).
- Google Calendar API key: **hanya aman kalau** dibatasi di Google Cloud Console (API restrictions ke "Calendar API" saja + HTTP referrer restriction ke domain app). Karena key ini ikut ter-bundle ke JS build, siapa pun bisa ambil dari `dist/` dan pakai di tempat lain kalau tidak dibatasi.

**Rekomendasi:** Cek Google Cloud Console — pastikan semua API key publik (Calendar, Maps) dibatasi per-domain (HTTP referrer) dan per-API. Hardcoded fallback sebaiknya dihapus total (bukan cuma prefer env var) supaya rotasi key tidak butuh deploy ulang source code baru dan supaya key lama tidak "menempel permanen" di git history.

### 5. CORS edge function dibuka untuk semua origin
**File:** `supabase/functions/admin-users/index.ts`
```ts
const cors = { "Access-Control-Allow-Origin": "*", ... }
```
Endpoint admin ini sebenarnya sudah aman dari sisi otorisasi (cek JWT + role admin), tapi CORS wildcard artinya browser mana pun dari domain mana pun bisa mem-fetch endpoint ini kalau attacker bisa mencuri access token korban (mis. lewat XSS di tempat lain).

**Rekomendasi:** Ganti `*` dengan origin resmi app (`https://pelajaranfathur.vercel.app`).

---

## 🟡 SEDANG

### 6. GRANT tabel terlalu luas, bergantung 100% pada RLS
**File:** `supabase/migrations/0002_default_schedule.sql`
```sql
grant insert, update, delete on public.users, public.subjects, ... to authenticated;
```
RLS saat ini menutupi semua tabel dengan benar (bagus!), tapi karena GRANT level-tabelnya luas, **setiap migration baru di masa depan yang lupa `enable row level security`** langsung jadi lubang besar (read/write bebas untuk semua user login). Ini bukan bug aktif, tapi risiko struktural.

**Rekomendasi:** Buat checklist wajib "RLS + policy" setiap kali bikin tabel baru, atau audit otomatis (query `pg_tables` vs `pg_policies`) sebagai bagian dari CI/CD.

### 7. File `.env.production` ikut terbawa dalam zip/project, tidak ada di `.gitignore`
**File:** `.env.production`, `.gitignore`
`.gitignore` hanya mengecualikan `.env`, `.env.local`, `.env.*.local` — **tidak** termasuk `.env.production`. Isinya saat ini "hanya" Google Maps key + App URL (bukan service role key), tapi ini kebiasaan berbahaya: kalau suatu saat isinya berubah jadi lebih sensitif, otomatis akan ter-commit ke git / ikut ter-zip lagi.

**Rekomendasi:** Tambahkan `.env.production` (dan pola `.env.*`) ke `.gitignore`, simpan env production hanya di dashboard Vercel/Supabase, bukan file lokal yang ikut didistribusikan.

### 8. Tidak ada security header (CSP, X-Frame-Options, dst.) di level deploy
**File:** `vercel.json`
Konfigurasi Vercel saat ini hanya `buildCommand`, `outputDirectory`, `rewrites` — tidak ada `headers` untuk Content-Security-Policy, `X-Frame-Options: DENY`/`SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, atau `Strict-Transport-Security`. Tanpa CSP, dampak dari XSS (kalau ada) jadi jauh lebih besar karena token sesi Supabase disimpan di `localStorage`/`sessionStorage` (lihat `src/lib/supabase.ts`) dan bisa dicuri script asing.

**Rekomendasi:** Tambahkan blok `headers` di `vercel.json` minimal untuk CSP (whitelist domain Supabase, Firebase, Google, YouTube, Resend yang dipakai), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` yang membatasi kamera/mikrofon/geolokasi ke fitur yang memang memakainya saja.

### 9. Password policy minim
**File:** `src/services/authService.ts`
Hanya validasi panjang ≥ 8 karakter, tanpa cek kompleksitas atau leaked-password check.

**Rekomendasi:** Aktifkan fitur *leaked password protection* bawaan Supabase Auth (HaveIBeenPwned check) di dashboard, dan pertimbangkan menaikkan minimum ke 10–12 karakter untuk akun admin.

---

## ⚪ RENDAH

- **API key YouTube tersimpan di `localStorage`** (`src/lib/apiKeyStore.ts`) sebagai plaintext. Cukup aman untuk single-owner/self-hosted, tapi kalau banyak admin memakai browser bersama/publik, key bisa terbaca siapa pun yang akses devtools di device itu.
- Tidak ditemukan penggunaan `dangerouslySetInnerHTML`, `eval`, atau pola injection lain di `src/` — bagus.
- Tidak ditemukan kebocoran `SUPABASE_SERVICE_ROLE_KEY` di kode frontend — semua pemakaian service-role key sudah benar berada di edge functions & script CLI yang membaca dari `process.env`.
- Fungsi `is_admin()` dan `can_access_task()` sudah benar memakai `security definer` + `set search_path=public` — pola yang tepat untuk menghindari privilege-escalation lewat `search_path` hijacking.

---

## Ringkasan Prioritas Perbaikan

| # | Temuan | Severity | Effort perbaikan |
|---|--------|----------|-------------------|
| 1 | `daily-digest` fail-open tanpa `CRON_SECRET`, bocor email di response | 🔴 Kritis | Kecil (5–10 baris) |
| 2 | Galeri "My Minee" bisa dibaca semua user login | 🟠 Tinggi | Kecil (1 policy SQL) |
| 3 | Firebase rules efektif publik (anon auth) | 🟠 Tinggi | Sedang (perlu putuskan model akses) |
| 4 | Hardcoded API key pihak ketiga | 🟠 Tinggi | Kecil (hapus fallback) + cek Google Console |
| 5 | CORS wildcard di edge function admin | 🟠 Tinggi | Kecil (1 baris) |
| 6 | GRANT luas bergantung penuh ke RLS | 🟡 Sedang | Proses/kebiasaan, bukan kode |
| 7 | `.env.production` tidak di-gitignore | 🟡 Sedang | Kecil |
| 8 | Tidak ada security header | 🟡 Sedang | Kecil–sedang |
| 9 | Password policy minim | 🟡 Sedang | Kecil (perlu akses dashboard Supabase) |

---

## Status Perbaikan (sudah dieksekusi di kode)

| # | Temuan | File yang diubah | Langkah manual tambahan yang WAJIB kamu lakukan |
|---|--------|-------------------|--------------------------------------------------|
| 1 | `daily-digest` fail-open | `supabase/functions/daily-digest/index.ts`, `README.md` | **Wajib** set secret `CRON_SECRET` di Supabase (`supabase secrets set CRON_SECRET=...`) — kalau tidak diset, function akan menolak semua request (500) setelah deploy ulang. Pastikan cron job kamu mengirim header `x-cron-secret` dengan nilai yang sama. |
| 2 | Galeri "My Minee" bisa dibaca semua user | `supabase/migrations/0020_security_hardening.sql` (baru) | Jalankan migration ini ke database production (`supabase db push` atau lewat SQL editor). |
| 3 | Firebase rules efektif publik | `database.firebase.rules.json`, `FIREBASE_RULES_SECURITY_NOTE.md` (baru) | Deploy ulang rules: `firebase deploy --only database`, atau paste manual di Firebase Console → Realtime Database → Rules. |
| 4 | Hardcoded API key pihak ketiga | `src/lib/firebase.ts`, `src/lib/googleCalendar.ts`, `.env.example` | **Wajib** tambahkan 8 env var `VITE_FIREBASE_*` baru (lihat `.env.example`) ke Vercel project settings, lalu redeploy — kalau tidak, fitur Watch Party/TV remote akan nonaktif (aman, tapi fitur hilang). Juga cek di Google Cloud Console bahwa API key Calendar & Maps sudah dibatasi (HTTP referrer + API restriction). |
| 5 | CORS wildcard | `supabase/functions/admin-users/index.ts` | Deploy ulang function (`supabase functions deploy admin-users`). Kalau domain app kamu bukan `pelajaranfathur.vercel.app`, set secret `ALLOWED_ORIGIN`. |
| 6 | GRANT luas ke RLS | `supabase/migrations/0020_security_hardening.sql` (baru) | Setelah migration jalan, sesekali jalankan `select * from public.rls_audit();` sebagai admin — harus kosong. Jalankan lagi setiap habis bikin tabel baru. |
| 7 | `.env.production` tidak di-gitignore | `.gitignore` | Tidak ada langkah tambahan — cukup pastikan file `.env.production` lokal kamu tidak lagi ikut ke commit berikutnya. |
| 8 | Tidak ada security header | `vercel.json` | Tidak ada langkah tambahan, otomatis aktif saat deploy ke Vercel berikutnya. Setelah deploy, cek di https://securityheaders.com untuk memastikan tidak ada resource yang ke-block CSP (kalau ada fitur yang tiba-tiba gagal load, kemungkinan perlu menambah domain ke `connect-src`/`frame-src` di `vercel.json`). |
| 9 | Password policy minim | `src/services/authService.ts` | Ini baru pengecekan sisi klien (≥10 karakter, wajib huruf+angka). **Wajib** juga aktifkan proteksi *leaked password* bawaan Supabase di Dashboard → Authentication → Policies, dan idealnya naikkan minimum password di sana juga ke 10. |

**Catatan penting:** perubahan ini sudah divalidasi dengan `npm install && npm run build` di project ini — build **sukses tanpa error**. Tapi migration SQL dan rules Firebase belum saya deploy ke server production kamu (saya tidak punya akses ke situ) — kamu perlu menjalankan langkah "manual" di atas secara berurutan supaya perbaikan ini benar-benar aktif.
