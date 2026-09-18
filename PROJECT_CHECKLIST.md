# TASKFLOW SCHOOL — Build Audit

- [x] React + TypeScript + Vite
- [x] Tailwind CSS integration via `@tailwindcss/vite`
- [x] Firebase Auth modular SDK
- [x] Firestore
- [x] Firebase Storage
- [x] Firebase Analytics event wrapper
- [x] Custom Claims role architecture
- [x] Firestore + Storage Rules
- [x] Task CRUD + file upload + progress
- [x] Deadline countdown + overdue helper
- [x] Schedule Firestore seed (64 slots)
- [x] Subjects seed from schedule
- [x] Notifications listener + admin management
- [x] Monthly calendar
- [x] Profile + Firebase-backed preferences
- [x] Admin users/tasks/schedule/subjects/teachers/announcements/notifications/analytics/audit/settings
- [x] Responsive/mobile navigation
- [x] Loading / empty / error / success UI patterns
- [x] No browser storage database (`localStorage`, `sessionStorage`, `IndexedDB`)
- [x] No fake login / hardcoded admin email / dummy task dataset
- [x] Cloud Functions for trusted role/status/delete operations and deadline engine

Verification performed in this environment:
- TypeScript/TSX parser check: 57 files, 0 parse diagnostics.
- Schedule seed slot count: 64.
- Browser-storage forbidden-pattern scan: no application usage found.

Full `npm run build` could not be executed here because package installation repeatedly timed out before dependencies were present. Run `npm install` (root + `functions`) in a networked development environment, then `npm run lint` and `npm run build`.


## No Billing mode
- Firebase Storage client dihapus dari aplikasi utama.
- Cloud Functions tidak dibutuhkan untuk menjalankan frontend.
- Upload file dinonaktifkan dengan UI yang jelas.
- Admin role awal tetap dapat dibuat dengan `scripts/setAdmin.ts` dari lingkungan tepercaya.
- Vercel deploy hanya membutuhkan frontend build + VITE_* variables.


## Admin Center V3
- Operations Center
- User/role/status management
- Task/subtask/comment moderation
- Schedule/catalog/content management
- Focus session moderation
- Notifications/broadcast
- Sessions/devices/security
- Storage/data workspace
- System health/settings
- Audit logs/analytics
