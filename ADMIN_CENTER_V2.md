# Admin Center v2

The admin area now includes a dedicated **Sessions & Devices** page at `/admin/sessions`.

It reads real data from `public.login_sessions` and `public.users`, shows current/active sessions, device type, OS, browser, login/last-active time, and allows an admin to revoke a session by marking it logged out.

Existing admin areas remain available: users, tasks, schedule, subjects, teachers, announcements, notifications, analytics, audit logs, and system settings.

The admin route is protected by the existing `AdminRoute` guard and the database's admin policies.
