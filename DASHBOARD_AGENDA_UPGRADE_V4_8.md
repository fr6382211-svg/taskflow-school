# Dashboard Agenda Upgrade v4.8

## Changes
- Removed the `TIME NOW` title and the separate realtime clock block from the relationship/time panel.
- The time panel now focuses on the two birthday countdowns and the relationship duration.
- Tomorrow subjects are deduplicated by subject name and show only the subjects that actually have a session on the next calendar day.
- Academic Timeline merges adjacent/overlapping sessions for the same subject into one subject block, preserving the earliest start and latest end.
- Timeline subject cards no longer repeat teacher/room metadata when the requested dashboard view is subject-first.
- Current/next class detection continues to use the real Asia/Jakarta clock for the active day.
