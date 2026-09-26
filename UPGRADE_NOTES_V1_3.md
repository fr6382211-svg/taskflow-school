# TASKFLOW SCHOOL v1.3 — UX & Reliability Upgrade

## User-facing improvements
- Refined Login / Register / Forgot Password presentation and validation.
- Command palette with Ctrl/Cmd + K.
- More useful mobile navigation.
- Toast feedback for task/profile/settings actions.
- Live schedule clock refresh every 30 seconds.
- Calendar now surfaces schedule markers, task deadlines, weekend and Google holiday states.
- Safer task deadline and upload validation.
- Dedicated 404 page.
- Focus Mode, Insights, Global Search, Notifications, Admin pages and existing workspace features preserved.

## Reliability fixes
- Realtime callbacks are registered before subscribe and channels are cleaned up.
- Schedule sorting no longer mutates source arrays.
- Google holiday multi-day mapping is stable for Asia/Jakarta date keys.
- Auth initialization always exits loading via finally and shows actionable runtime errors.
- Registration uses an 8-character minimum consistently with login UX.

## Deployment
- Vercel build command: `npm run build`
- Output: `dist`
- Node: `22.x`
- Supabase: Auth + Postgres + Realtime + Storage

## Security
- Never ship Supabase service/secret keys to the browser.
- Keep Storage buckets/private policies aligned with the SQL migrations.
- Use RLS as the enforcement layer; UI role visibility is not security.
