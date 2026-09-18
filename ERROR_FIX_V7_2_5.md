# Fathur SchoolHub V7.2 — 5 Error Fix Patch

Patch ini menutup 5 TypeScript error dari `npm run build`:

1. `AppShell.tsx` union `MenuItem | command item` memakai type guard sebelum `.action`.
2. `chatService.ts` memakai `createNotificationOnce`, sesuai export notification service.
3. `subscribePresence()` memakai signature Supabase Realtime presence `on(..., callback)` yang benar untuk `join`/`leave`.

File yang diubah:
- `src/components/layout/AppShell.tsx`
- `src/services/chatService.ts`

Setelah overwrite dua file ini, jalankan:

```bash
npm run build
```
