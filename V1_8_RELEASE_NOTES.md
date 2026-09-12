# TASKFLOW SCHOOL v1.8 — TOTAL UI/UX UPGRADE

- Premium Workspace Studio settings.
- System / Light / Dark theme.
- Accent color selection.
- Compact / Comfortable / Spacious density.
- Animation and reduced-motion controls.
- Toggle live status bar.
- Toggle professional @FATHURR watermark.
- Week-start preference.
- Dark-mode control synchronization in AppShell.
- Settings persistence schema migration `0006_settings_experience.sql`.
- Responsive-safe watermark positioning above mobile navigation/status UI.

## Deploy
1. Run `supabase/migrations/0006_settings_experience.sql` once in Supabase SQL Editor.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel Project Settings.
3. Build with `npm run build`.
