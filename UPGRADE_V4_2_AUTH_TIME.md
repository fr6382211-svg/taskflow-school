# Fathur School Hub v4.2 — Time + Auth Upgrade

## Dashboard time system
- Removed the generic “Countdown utama” card.
- Top row contains only: Fathur birthday (12 April) and Mazet birthday (30 June).
- Birthday targets automatically roll to the next year after the date/time passes.
- Lower card is now **“Hubungan kita sudah sejauh ini”**, calculated from 2 June 2026 18:55 WIB.
- Both birthday cards and relationship duration update every second.
- Units: months, weeks, days, hours, minutes, seconds.

## Email verification
- Signup always requests confirmation email with redirect to `/auth/confirm`.
- Registration page does not navigate to the dashboard.
- User is shown a dedicated verification state.
- `/auth/confirm` exposes a deliberate **Verifikasi email** button that consumes `token_hash`.
- After successful verification the local Supabase session is closed and the user must log in normally.
- Unverified users are not treated as authenticated by `AuthContext`.

## Password recovery
- Reset request redirects to `/auth/reset-password`.
- The recovery page requires a valid Supabase recovery session.
- User chooses and confirms a new password.
- Recovery session is closed after update.
- User is sent back to normal login instead of being silently kept signed in.

## Production Supabase settings
Set Site URL to:

`https://pelajaranfathur.vercel.app`

Allow these redirect URLs:

`https://pelajaranfathur.vercel.app/auth/confirm`
`https://pelajaranfathur.vercel.app/verify-email`
`https://pelajaranfathur.vercel.app/auth/reset-password`

Recommended confirmation email button:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Verifikasi email saya
</a>
```

Do not expose a Supabase secret/service-role key in the browser.
