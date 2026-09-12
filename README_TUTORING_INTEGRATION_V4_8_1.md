# Fathur Tutoring Schedule Integration v4.8.1

Jadwal les Fathur kelas 12B dari `jadwal_kelas_12b_expanded.json` kini diintegrasikan ke Supabase dan Dashboard.

## Aturan
- Jadwal les hanya untuk workspace Fathur.
- Jadwal bersifat display-only.
- Jadwal tidak membuat tugas.
- Jadwal tidak membuat deadline.
- Dashboard menampilkan Hari Ini + Besok.
- Halaman Schedule menampilkan jadwal les terpisah dari jadwal sekolah.

## Supabase
Jalankan migration:
`supabase/migrations/0018_fathur_tutoring_schedule.sql`

## Build
```powershell
npm install
npm run build
```
