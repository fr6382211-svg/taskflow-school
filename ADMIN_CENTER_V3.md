# Fathur School Hub — Admin Center V3

Admin Center is a full operational control surface for the data and features already present in the application.

## Modules
- Operations Center
- Users and roles/status
- Tasks
- Task Workspace (subtasks/comments moderation)
- Schedule
- Subjects
- Teachers
- Announcements
- Notifications
- Focus Sessions
- Analytics
- Audit Logs
- Sessions & Devices
- Broadcast Center
- Storage Manager
- Data Workspace / CSV export
- System Health
- System Settings

## Access model
Admin UI is exposed only to accounts that the existing application marks as admin. Backend RLS / Edge Functions remain authoritative.

## Scope
No frontend secret or service-role credential is exposed. The Admin Center uses the existing Supabase/Firebase integrations and the existing database schema.
