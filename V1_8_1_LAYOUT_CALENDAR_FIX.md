# TASKFLOW v1.8.1 — Layout & School Agenda Fix

- Settings redesigned into a single clean column; no right-side settings panel.
- Settings save errors now expose the Supabase error code/message in the UI toast.
- Added `0007_settings_hardening.sql` to guarantee all settings columns exist.
- Schedule and school-day logic use Asia/Jakarta rather than browser local weekday.
- After 16:00 on a weekday, dashboard/schedule automatically surfaces the next valid school day.
- Weekend and Google holiday dates are skipped when selecting the next school agenda.
- Dashboard is now single-flow on mobile and desktop, with a focused two-column lower section only where useful.
- Google Holiday integration continues to use `events.list` date filtering.
