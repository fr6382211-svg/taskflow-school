# SchoolHub v6 — Smart Insights, Gamification & Real-Time Collaboration

This upgrade focuses on **Dashboard** and **Insights**, integrates them with
existing task/schedule/focus data, adds a rule-based "AI" planning assistant,
gamified achievements, a weekly goal tracker, and a real-time study-buddy
collaboration feature — plus a broader set of motion/animation primitives
used across both pages. No database schema changes are required; every new
feature runs on data that already exists in this project (tasks, schedule,
`focus_sessions`) or is fully client-side.

## New services (`src/services`)
- **`smartAdvisorService.ts`** — rule-based "AI Study Advisor". Scores pending
  tasks by urgency + priority, classifies today's risk level
  (`aman` / `waspada` / `kritis`), and auto-builds a focus-block plan by
  finding free windows in today's schedule and slotting your top-priority
  tasks into them (25/45-minute Pomodoro-style blocks).
- **`achievementService.ts`** — computes a badge/achievement set (Bronze →
  Platinum) from completed-task counts, on-time completions, and your Focus
  streak/minutes (via the existing `focusService`).
- **`goalService.ts`** — lightweight weekly task-completion goal, stored per
  user in `localStorage` (no backend needed), plus a helper to count tasks
  completed since Monday.
- **`presenceService.ts`** — real-time presence + "cheer" broadcast between
  workspace members using **Supabase Realtime** (presence + broadcast
  channels). Nothing is persisted — it's ephemeral, so it needs no new table
  or RLS policy.

## New hooks (`src/hooks`)
- `useFocusStreak.ts` — reusable wrapper around `loadFocusStreak`.
- `usePresence.ts` — reusable wrapper around `presenceService`.

## New UI components
- `components/ui/AnimatedNumber.tsx` — count-up numbers (respects
  `prefers-reduced-motion`).
- `components/ui/Reveal.tsx` — staggered entrance animation wrapper.
- `components/ui/GoalRing.tsx` — animated SVG progress ring.
- `components/dashboard/StudyBuddyPanel.tsx` — shows who else in your
  workspace is online right now (real-time presence) and lets you send a
  one-tap "semangat!" cheer to them, complete with confetti + toast on both
  ends.
- `components/insights/SmartAdvisorCard.tsx` — renders the advisor's plan;
  used in **compact** form on the Dashboard and **full** form on Insights.
- `components/insights/AchievementsShowcase.tsx` — animated badge grid with
  locked/unlocked states and progress bars.
- `components/insights/WeeklyGoalCard.tsx` — editable weekly goal + ring.

## Where it shows up
- **Dashboard**: KPI numbers now animate in, the Streak KPI now reflects your
  real Focus streak (previously it was a proxy from completed-task count),
  a compact **AI Study Advisor** card was added, and a **Study Buddy** panel
  was added to the sidebar.
- **Insights**: metric tiles now animate in with stagger, plus three new
  sections — the full **AI Study Advisor**, **Weekly Goal** ring, and
  **Achievements** showcase — sit above the existing charts.

## Notes / next steps
- The study-buddy "cheer" is intentionally ephemeral (no history/DB table).
  If you want persistent chat/collaboration later, we'd add a small
  `messages` or `nudges` table with RLS scoped by `workspace_id`.
- Weekly goals are stored in `localStorage`, so they're per-device. Moving
  them into the existing `settings` table (see `settingsService.ts`) is a
  natural next step if you want them synced across devices.
- All new animations follow the app's existing reduced-motion convention
  (`@media (prefers-reduced-motion: reduce)` in `index.css`).
