# TASKFLOW SCHOOL v1.4

## UX & Theme
- Premium layered dark mode with stronger contrast and glass surfaces.
- Persistent theme switch from the main header, stored in Supabase settings.
- Responsive profile dropdown and mobile-safe navigation.
- Improved profile page with avatar upload, identity stats, and account/security information.

## Realtime / Schedule
- Bottom live status bar shows Indonesian date/time, current school day, active lesson and interval progress.
- RGB gradient flow animates left-to-right.
- Progress follows the active lesson; outside lessons it follows the current 60-minute clock interval.
- Weekend and Google holiday states are surfaced in the status bar.

## Data
- `supabase/migrations/0004_ui_profile_upgrade.sql` adds `users.photo_path` and additional settings flags.
