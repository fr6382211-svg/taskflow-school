# TASKFLOW SCHOOL v1.5 — Premium Maintenance Upgrade

- Redesigned task creation flow with searchable subject picker.
- Subject loading now falls back to active schedule entries when `subjects` is empty.
- Selected subject automatically resolves teacher and related class times.
- Added task quick-start presets (Latihan, Proyek, Ujian).
- Improved deadline validation and upload validation UX.
- Premium visual refresh for dark mode, surfaces, shadows, gradients, and motion.
- Added stronger dark-mode coverage across shared cards, badges, and controls.
- Profile page now includes task productivity snapshot and copyable user ID.
- Realtime status bar remains time-aware and schedule-aware.
- Added idempotent catalog repair migration `0005_catalog_repair.sql` to fill subjects/teachers from the active schedule.
- Added `N` keyboard shortcut on Tasks for quick task creation (ignored while typing in form controls).
- Improved dark-mode mappings and interaction polish for task/schedule surfaces.
