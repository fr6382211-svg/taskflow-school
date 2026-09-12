# Login & Device History

This release records successful logins in Supabase in `public.login_sessions` and updates `public.users.last_login_at`.

## Apply migration

Run the SQL migration:

`supabase/migrations/0008_login_sessions.sql`

You can run it from the Supabase SQL Editor or through your existing migration workflow.

## What is recorded

- Login time
- Last activity time
- Mobile / tablet / desktop classification
- Operating system
- Browser
- User agent
- Whether the session is currently active
- Logout time (when the app performs a normal logout)

The browser does not send an IP address to Supabase from this feature. IP logging, if needed later, should be implemented server-side rather than trusting browser input.
