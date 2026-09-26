# Fathur SchoolHub V7.1 — Integrated Chat / Offline / PWA

V7.1 memperluas V7 tanpa menghapus modul existing.

## Baru
- Mobile navigation model Dashboard / Tasks / Calendar / Focus / More.
- Chat workspace persisted in Supabase: conversations, members, messages, reads, reactions.
- Realtime task chat-style collaboration foundation via Supabase Postgres changes.
- Offline state: ONLINE / OFFLINE / SYNCING / DEGRADED.
- IndexedDB hanya untuk offline cache / pending mutations, bukan source of truth.
- Ctrl/Cmd+K palette sekarang memiliki commands selain navigasi.
- PWA manifest + service worker + installable shell.
- Notification preference table untuk future notification routing.

## Tidak diubah
Taskflow, Focus, Schedule, Calendar, Insights, Location Intelligence, My Minee, Admin Center, TimeBox, MediaBox, Watch Party, tutoring schedule, auth, dan existing Supabase migrations tetap dipertahankan.

## Security
Tidak ada service-role / secret key ditambahkan ke frontend. Chat memakai RLS dan keanggotaan conversation. Offline queue hanya menyimpan mutation payload yang diperlukan untuk retry.

## AI Study Coach
`src/services/studyAdvisorProvider.ts` menambahkan provider abstraction `StudyAdvisorProvider`, deterministic `RuleBasedProvider`, dan optional `AIProvider`. Frontend hanya mengenal `VITE_AI_GATEWAY_URL`; secret AI berada pada Supabase Edge Function environment. Bila gateway tidak tersedia/gagal, sistem otomatis kembali ke rule engine deterministic.
