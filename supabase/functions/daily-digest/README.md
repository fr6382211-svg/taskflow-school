# Daily Digest

Purpose: send a professional 18:00 WIB email containing ALL active tasks due the next day and ALL scheduled lessons for the next day. If there are no tasks, the email explicitly says so and still lists the lessons.

Required Supabase Edge Function secrets:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- APP_URL=https://pelajaranfathur.vercel.app
- CRON_SECRET (recommended)

Schedule the function daily at 18:00 Asia/Jakarta (11:00 UTC) using your Supabase scheduled-function/cron configuration. The function itself is idempotent through daily_email_digest_log.
