# Fathur School Hub v2.0

Unified school productivity platform for Muhammad Fathur Rahman • SMAN 2 Tuban.

This release combines TaskFlow School (Supabase) with TimeBox Media / Watch Party (Firebase Realtime Database) in one Vite application.

## Backends
- TaskFlow: Supabase Auth/Postgres/Storage/Realtime
- TimeBox: Firebase Auth + Realtime Database
- YouTube search uses the bundled client API key in `src/lib/youtube.ts` (restrict the key by HTTP referrer in Google Cloud).

## Routes
- `/dashboard` TaskFlow dashboard
- `/tasks`, `/schedule`, `/calendar`, `/focus`, `/insights`, `/settings`, etc.
- `/timebox` unified TimeBox clock/schedule/media workspace
- `/remote` and `/join` public Watch Party remote

## Build
`npm install`
`npm run build`

No Firebase environment variables are required because the TimeBox Firebase Web App configuration is embedded in `src/lib/firebase.ts` as provided for this project.
## Workspace Upgrade v4

This build adds dual workspace login and separation:
- **Fathur**: existing school schedule / Supabase schedule source.
- **Mazet**: dedicated college workspace powered by `jadwal_kuliah_maya.json` (9 lecture slots, including Saturday).
- Login lets the user choose Fathur or Mazet before authenticating. Preferred workspace is saved in Supabase Auth user metadata.
- Tasks are partitioned by workspace tag (`workspace:fathur` / `workspace:mazet`) while legacy untagged tasks remain visible in Fathur for backward compatibility.
- Smart Deadline automatically targets the next scheduled occurrence of the selected subject at **23:59 WIB**; manual date/time is still available.
- Dashboard adds a live timer since **2 June 2026 18:55 WIB** and birthday countdowns for **Mazet: 30 June** and **Fathur: 12 April**, automatically rolling to the next year after the target passes.

See `WORKSPACE_UPGRADE_V4.md` and `supabase_workspace_tags.sql` for implementation and optional data cleanup.
