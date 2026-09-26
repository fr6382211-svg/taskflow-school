# Digital Attendance Security Model

## Trust boundary
Client hanya mengirim:
- authenticated user context dari Supabase session
- attendance session ID
- metode `card` atau `qr`
- QR nonce untuk metode QR
- latitude/longitude/accuracy dari browser

Client tidak menentukan apakah attendance valid.

## Server decision
`check_in_attendance()` menentukan:
1. user authenticated dan active;
2. workspace user cocok dengan workspace session;
3. session aktif dan waktunya valid;
4. QR nonce cocok dan belum expired untuk metode QR;
5. location master aktif;
6. GPS accuracy memenuhi threshold;
7. Haversine distance berada di dalam geofence;
8. user belum memiliki attendance record pada session tersebut;
9. server timestamp menentukan `on_time` atau `late`.

## Abuse controls
- QR nonce berumur pendek dan diputar oleh Admin.
- Unique `(session_id,user_id)` mencegah duplicate check-in.
- Failed/duplicate attempts disimpan untuk observability.
- Direct insert attendance logs ditutup oleh RLS.
- Admin actions dicatat ke audit log.

## Privacy controls
- Raw GPS coordinates tidak dimasukkan ke `attendance_logs`.
- Riwayat menyimpan `location_id`, `distance_m`, dan `accuracy_m`.
- GPS hanya diminta ketika user melakukan attendance action.
- Tidak ada background attendance tracking baru.

## Known web-platform limitation
Browser geolocation tidak menyediakan bukti hardware-level bahwa koordinat tidak sedang di-spoof. Sistem ini memperkuat validasi dengan server-side geofence, accuracy gate, time window, rotating QR, and replay protection, tetapi tidak mengklaim anti-spoofing absolut.
