# Fathur School Hub v7 — Supabase Integrated Intelligence

## Prinsip
Tidak ada data bisnis baru yang disimpan di localStorage. Target mingguan, kolaborasi, dan insight snapshot sekarang tersimpan di Supabase. Realtime dipakai sebagai transport, Supabase tetap menjadi source of truth.

### Integrasi silang
- Tasks → completion/overdue → Insights/Goals/Advisor.
- Focus Sessions → streak/minutes → Insights/Achievements/Advisor.
- Schedule → free windows → Smart Advisor.
- Location Intelligence → context/journey → dashboard/attendance.
- Workspace → tasks/schedule/collaboration → satu scope Fathur/Mazet.
- Study Buddy → Supabase Realtime + collaboration_events.
- Insights → snapshot tersimpan untuk histori analitik.

## Perbandingan fitur

| Area | Lama | v7 Baru |
|---|---|---|
| Weekly Goal | localStorage | Supabase `weekly_goals` + RLS |
| Study Buddy | ephemeral presence/broadcast | Realtime + histori `collaboration_events` |
| Insights | dihitung saat halaman dibuka | dihitung + disimpan sebagai `insight_snapshots` |
| Focus | statistik/streak | tetap, sekaligus menjadi input Advisor/Achievements/Insights |
| Tasks | data cloud | terhubung ke Goal, Advisor, Insights, Schedule |
| Schedule | data cloud | menjadi constraint Smart Advisor + context engine |
| Location | event/journey cloud | menjadi context/route/attendance intelligence |
| Workspace | scope Fathur/Mazet | menjadi scope bersama Tasks/Schedule/Collab/Insights |
| Local app data | beberapa fitur memakai localStorage | data bisnis baru cloud-first; local storage hanya auth persistence browser |
| AI/Advisor | rule-based runtime | rule-based + snapshot histori Supabase |
| Analytics | event telemetry | telemetry + insight history |

## Migration
Jalankan `supabase/migrations/0021_integrated_intelligence.sql` setelah migration 0020.
