# TASKFLOW SCHOOL — Supabase Deployment Checklist

## Supabase
1. Create a Supabase project.
2. Authentication → Providers → Email: enable Email/Password.
3. SQL Editor → run `supabase/migrations/0001_taskflow.sql`.
4. Storage should show buckets `task-files` (private) and `avatars` (public).
5. Auth URL Configuration → Site URL = your Vercel URL.
6. Add Redirect URLs for your Vercel production URL and local `http://localhost:5173`.
7. Copy Project URL and Publishable key.

## Local
Create `.env.local`:
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

Then:
`npm install`
`npm run build`

## Seed schedule
Get a service-role key only for your local terminal.
PowerShell:
`$env:SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"`
`$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"`
`npm run seed:schedule`

## Admin setup
Register an account in the web app, then locally:
`$env:SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"`
`$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"`
`npm run set:admin -- your@email.com`

## Edge Function
Install/link Supabase CLI, then:
`supabase functions deploy admin-users`
`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`

## Vercel
Import the repo and set:
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put `SUPABASE_SERVICE_ROLE_KEY` in Vercel frontend variables.
