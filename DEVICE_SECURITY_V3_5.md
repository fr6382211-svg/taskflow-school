# Fathur School Hub v3.5 — Device Security

- Existing `login_sessions` schema remains compatible with v2/v3.
- Device/network metadata is extended without requiring a `status` column.
- IP is collected server-side by Supabase from request headers when available.
- Device model is best-effort: Chrome User-Agent Client Hints when available, otherwise a model token from the user agent.
- Maximum 2 active devices/sessions per user. The oldest active session is revoked first.
- The frontend must heartbeat the current session and sign the user out locally when the custom session has been revoked.
- No access tokens or refresh tokens are stored in `login_sessions`.
