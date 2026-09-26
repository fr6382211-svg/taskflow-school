# Daily Task + Next-Day Lesson Email — v4.3

## What it sends
At 18:00 WIB every day, the `daily-digest` Supabase Edge Function sends each active user a single email containing:
- every active task due the next day;
- every scheduled lesson for the next day;
- an explicit no-task message when there are no active tasks;
- a button back to `https://pelajaranfathur.vercel.app/`.

The email follows the user's saved `email_notifications` preference and uses `daily_email_digest_log` to avoid duplicate sends for the same user/date.

## Edge Function secrets
Set these in Supabase Edge Function secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (example: `Fathur School Hub <noreply@yourdomain.com>`)
- `APP_URL=https://pelajaranfathur.vercel.app`
- `CRON_SECRET`

Do not put `SUPABASE_SERVICE_ROLE_KEY` in the Vite frontend or `.env` that is shipped to the browser.

## Scheduling
Create a daily schedule for `daily-digest` at 18:00 Asia/Jakarta. If the scheduler accepts UTC cron expressions, use `0 11 * * *`.

The scheduled request should include:
`x-cron-secret: <CRON_SECRET>`

## Email template
The Edge Function already generates the production HTML email. Its copy is intentionally concise and contains the complete next-day task/lesson list.

## Supabase Auth email templates
Keep Supabase Auth templates separate:
- Confirm signup → `/auth/confirm`
- Password recovery → `/auth/reset-password`

Those are authentication emails; `daily-digest` is the application reminder email.
