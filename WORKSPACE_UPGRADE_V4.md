# Fathur School Hub — Workspace Upgrade v4

## Workspace
- `fathur`: schedule berasal dari Supabase / schedule.json sekolah.
- `mazet`: schedule berasal dari `src/data/mazetSchedule.json` (input jadwal kuliah yang diberikan).
- Login menyediakan pilihan Fathur / Mazet dan menyimpan `preferred_workspace` di Supabase Auth user metadata.
- Task baru diberi tag `workspace:fathur` atau `workspace:mazet`; task tanpa tag lama diperlakukan sebagai Fathur agar kompatibel dengan data lama.

## Smart deadline
Pada form tugas tersedia mode otomatis. Setelah mata pelajaran dipilih, sistem mencari jadwal mata pelajaran berikutnya dan menetapkan deadline default ke tanggal kemunculan berikutnya pada `23:59 WIB`. Mode manual tetap tersedia.

## Global clocks
Dashboard menampilkan: timer sejak `2 Juni 2026 18:55 WIB`, countdown ulang tahun Mazet `30 Juni`, dan countdown ulang tahun Fathur `12 April`. Target ulang tahun otomatis berpindah ke tahun berikutnya setelah waktunya lewat.

## Source data Mazet
`src/data/mazetSchedule.json` adalah salinan sumber `jadwal_kuliah_maya.json` yang diberikan. Terdapat 9 slot kuliah aktif: Senin, Selasa, Kamis, Jumat, dan Sabtu; Rabu kosong.
