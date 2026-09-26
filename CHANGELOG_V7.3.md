# Fathur SchoolHub V7.3 — Digital Attendance 2.0

## Added
- Digital Attendance Card dengan one-tap check-in.
- Admin-created attendance sessions untuk workspace Fathur/Mazet.
- QR attendance dinamis dengan server-side nonce rotation.
- Geofence server-side untuk Sekolah dan Tempat Les.
- GPS accuracy gate.
- One-check-in-per-user-per-session.
- Server-side on-time / late calculation.
- Attendance attempts audit untuk accepted/rejected/duplicate.
- Admin live roster melalui Supabase Realtime.
- Session finalization yang membuat user aktif yang belum check-in menjadi absent.
- Permission override Admin melalui RPC.
- Attendance analytics event.
- Attendance admin audit events.
- QR camera scanner menggunakan BarcodeDetector jika browser mendukung.
- Manual QR payload fallback untuk browser tanpa BarcodeDetector.

## Security
- Attendance write tidak diberikan secara langsung melalui RLS.
- User melakukan check-in melalui SECURITY DEFINER RPC yang melakukan validasi workspace, session, waktu, QR nonce, dan geofence.
- QR nonce hanya dapat dibaca melalui Admin policy; user biasa mendapatkan session metadata tanpa nonce.
- Attendance history menyimpan distance + accuracy, bukan GPS coordinates mentah.
- Browser location spoofing tetap tidak dapat dijamin 100% oleh web platform.

## Locations
- School attendance geofence mengikuti master location School.
- Tutoring attendance geofence mengikuti master location Tutoring.

## Routing
- User: `/attendance`
- Admin: `/admin/attendance`

## Database
- `supabase/migrations/0024_digital_attendance.sql`
