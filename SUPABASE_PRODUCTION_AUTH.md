# Supabase Production Auth — Fathur School Hub

Production URL:

`https://pelajaranfathur.vercel.app`

## Required Auth URL configuration

Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://pelajaranfathur.vercel.app`
- Additional Redirect URLs:
  - `https://pelajaranfathur.vercel.app/auth/confirm`
  - `https://pelajaranfathur.vercel.app/verify-email`
  - `https://pelajaranfathur.vercel.app/auth/reset-password`

The redirect URLs must be present in the Supabase allow-list for the `redirectTo` / `emailRedirectTo` values to work in production. Supabase uses the Site URL as the default redirect when an explicit redirect is not supplied.

## Confirm signup template

Enable **Confirm email** in Authentication settings.

Recommended Confirm signup email template link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Verifikasi email saya
</a>
```

The app intentionally does not auto-login after verification. The verification page consumes the token, closes the recovery/verification session locally, and sends the user back to `/login`.

## Password recovery template

The password-reset request uses:

`https://pelajaranfathur.vercel.app/auth/reset-password`

The reset page requires a valid Supabase recovery session, lets the user choose a new password, closes the recovery session, and then requires a normal login.

## Important

Do not put the Supabase secret/service-role key into this frontend. Use only the publishable/anon key in browser code. Server-side administrative operations must stay on trusted server/Edge Function environments.
