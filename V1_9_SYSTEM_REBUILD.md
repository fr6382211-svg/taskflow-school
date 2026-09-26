# TASKFLOW SCHOOL v1.9 — System Rebuild

- Centralized navigation: no duplicate desktop/mobile bottom navigation.
- Cleaner app shell with utility actions only in the header.
- Settings persistence uses Supabase upsert on `user_id`.
- Theme, accent, density, motion, live bar, watermark and notification preferences are synchronized via `taskflow:settings-changed`.
- School calendar logic uses Asia/Jakarta consistently.
- After 16:00 WIB, the active school agenda moves to the next valid school day.
- Saturday, Sunday and Google Calendar holidays are skipped.
- Schedule normalization in TaskForm no longer uses nullable map + type predicate.
- Realtime status bar uses Jakarta time.
