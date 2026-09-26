# Catatan perubahan `database.firebase.rules.json`

**Perubahan:** node `admins` tidak lagi punya `.read` (sebelumnya `"auth != null"`).

**Kenapa:** aplikasi login ke Firebase secara *anonim* (`ensureAnonymousAuth` di
`src/lib/firebase.ts`) untuk fitur Watch Party. Karena itu, syarat `auth != null`
nyaris tidak melindungi apa pun — setiap pengunjung situs otomatis dapat token
anonim dan sebelumnya bisa membaca seluruh daftar UID admin di node `admins`.

Aturan `.write` pada node yang sama (`root.child('admins/' + auth.uid).exists()`)
tetap berjalan normal setelah `.read` dihapus, karena Firebase Realtime Database
mengevaluasi referensi `root.child(...)` di sisi server dengan akses penuh —
tidak butuh client punya izin baca eksplisit ke path itu.

**Deploy:** jalankan `firebase deploy --only database` (atau upload manual lewat
Firebase Console → Realtime Database → Rules) setelah perubahan ini di-review.

**Belum diubah (perlu keputusan produk):** node `rooms/*` masih `".read": "auth != null"`,
jadi tetap bisa dibaca semua pengunjung anonim. Ini dibiarkan karena tampaknya
memang fitur watch-party publik (siapa saja join room lewat link). Kalau room
seharusnya privat, perlu skema akses baru (mis. room password / invite token)
yang tidak dibahas dalam audit ini.
