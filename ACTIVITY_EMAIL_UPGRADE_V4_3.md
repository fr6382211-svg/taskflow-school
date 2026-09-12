# Fathur School Hub v4.3 — Activity + Agenda Email Upgrade

## Dashboard agenda
- `Today` is only used when the selected agenda date is the actual Jakarta calendar date.
- After the day is over, the next school day is labeled `Besok` or `N hari lagi`.
- The active class is calculated from current WIB time and its start/end time.
- The next class replaces the current class after the current period ends.
- The timeline keeps previous classes visible but no longer labels the first period as `Now`.

## Login/device activity
`login_activity` is an append-only ledger for login, heartbeat, logout, revoke, IP change, device change and security checks.

## Daily 18:00 email
The `daily-digest` Edge Function sends tomorrow's full task + lesson digest. It uses `daily_email_digest_log` for idempotency.

Email delivery requires a transactional email provider such as Resend configured as Edge Function secrets. Supabase Auth's email configuration is still used for authentication emails; this function is for application task/agenda digest emails.
