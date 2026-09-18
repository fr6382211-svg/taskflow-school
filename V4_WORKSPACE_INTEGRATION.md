# Fathur School Hub v4 — Workspace & Integrated Time System

## Workspace binding
- Registration requires exactly one workspace: Fathur or Mazet.
- Normal users do not switch workspace after registration.
- Admins can switch their own workspace from Profile.
- Mazet schedule comes from `src/data/mazetSchedule.json`.

## Dashboard time system
- Realtime WIB clock.
- Fathur birthday countdown: 12 April.
- Mazet birthday countdown: 30 June.
- The next occurrence is calculated automatically each year.
- Elapsed timer starts at 2 June 2026, 18:55 WIB.
- All show months, weeks, days, hours, minutes, seconds.

## Smart task deadlines
- Subject selection can automatically set the deadline to the next scheduled meeting.
- Manual deadline remains available.
- Task attachment limit is 50 MB.
- Task upload accepts common academic documents, images, text/CSV, and archive formats.

## Production auth
Run migration `0013_workspace_binding.sql` after the earlier migrations.
Use the production Supabase site URL/redirect configuration; do not hard-code localhost URLs.
