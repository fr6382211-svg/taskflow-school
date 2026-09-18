# Fathur School Hub v5.2 — Context Intelligence Upgrade

This release preserves the existing School Hub functionality and adds a deeper context-aware location layer.

## Included
- LocationContextEngine
- Geofence + movement + heading + distance trend
- Schedule-aware destination inference
- Five-minute no-movement detection
- Late-risk prediction using ETA
- Actual arrival status based on geofence evidence
- Grace-period aware state fields
- Location uncertainty state
- Route/journey/attendance/routine database foundation
- Location event persistence with authenticated user_id
- Tutoring context integration
- Premium context animations with reduced-motion fallback

## Database
Run:
- `0016_location_routine_intelligence_upgrade.sql`
- `0017_activity_login_email_upgrade.sql` if not already applied
- `0019_location_route_attendance_routine_upgrade.sql`

The 0019 migration is additive and does not alter the Tasks system.

## Priority
Verified current location > Geofence > Movement > Schedule > Route > Routine > Prediction.
