# My Minee — Admin Upload

Admin dapat menambahkan foto dari halaman `/admin/my-minee`.

Alur penyimpanan:
1. Pilih satu atau banyak gambar.
2. Gambar diunggah ke Supabase Storage bucket `my-minee`.
3. Metadata foto dibuat di `public.romantic_gallery`.
4. Jika penulisan metadata gagal setelah upload, file Storage tersebut dihapus kembali agar tidak menjadi orphan.
5. User biasa hanya dapat membaca galeri; operasi insert/update/delete dilindungi `public.is_admin()`.

Foto binary tidak dibundel ke source code aplikasi.
