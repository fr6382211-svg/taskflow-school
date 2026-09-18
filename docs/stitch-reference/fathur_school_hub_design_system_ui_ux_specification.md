# Fathur School Hub — 2026 SaaS Product Architecture & UI/UX Design System Specification

**Product**: Fathur School Hub  
**Founder / Student**: Muhammad Fathur Rahman (SMAN 2 Tuban)  
**Target Category**: High-Performance Student Productivity Workspace & Media Hub (Hybrid SaaS: Linear precision + Raycast ergonomics + Apple typography + Arc media fluidity)

---

## PART A: Top 10 Real-World Benchmark References

1. **Linear** (`linear.app`) — Precision keyboard-first issue tracker, 1px borders, subtle 4% alpha surface elevation, high data density, zero bloat, micro-interactions, monochromatic gray spectrum with neon indigo accent.
2. **Raycast** (`raycast.com`) — Command palette gold standard (`⌘K`), compact metadata tags, monospaced shortcuts, hyper-crisp keyboard ergonomics, high-contrast HUD cards.
3. **Vercel / Next.js Dashboard** (`vercel.com`) — Clean tabular grids, monospaced git-like timestamps, status indicator dots with glow pills, stark monochrome contrast with clean semantic tags.
4. **Notion** (`notion.so`) — Flexible nested blocks, frictionless breadcrumb navigation, calendar-to-list timeline projections, fluid drag/drop ergonomics.
5. **Arc Browser by The Browser Company** (`arc.net`) — Collapsible vertical sidecars, media player mini-docks with live audio visualizers, tactile space switching, delightful ambient background tints.
6. **Apple macOS Sonoma / iPadOS System UI** (`apple.com`) — Widget hierarchy, SF Pro Display / SF Mono system harmony, legible clock typography with optical sizing, pristine border radiuses with inset inner glow.
7. **Stripe Dashboard** (`dashboard.stripe.com`) — Industrial-grade multi-column analytics, filter pill strips, contextual drawers, drill-down panels, fail-safe session & device security management.
8. **Framer** (`framer.com`) — High-precision canvas controls, fluid panel resizing, dark mode surface elevation tokens (`bg-surface-0` to `bg-surface-3`), clean spring-based physics.
9. **Cron / Notion Calendar** — TimeBox-style modern scheduling, real-time schedule conflict resolution, dual-time indicator needles, hotkey quick-slots.
10. **Spotify Web & Discord Audio UI** — Media queue persistence, synchronized playback rooms ("Listen Along" / "Watch Party"), low-latency WebRTC remote session indicators, QR handshake modals.

---

## PART B: Comparative Design Matrix

| Benchmark | Information Density | Surface Elevation | Typography Rhythm | Navigation Model | Best Element to Adopt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear** | Ultra-High (Compact) | 1px border lines, subtle 3% dark fills | Inter + SF Mono for metadata | Collapsible Icon + Label Rail | Status pills, filter bars, keyboard shortcuts |
| **Raycast** | Extreme (HUD) | Floating translucent modal layers | Geist Mono + Variable Sans | Global Command Palette (`⌘K`) | Quick action palette, media remote overlay |
| **Vercel** | High (Tabular) | Zero drop-shadow, stark border lines | Geist Sans + Geist Mono | Top header tabs + sub-navigation | Device/Session security log & analytics |
| **Arc** | Medium (Dynamic) | Soft muted tonal backdrops | System sans with playful accents | Vertical split sidebar with mini-dock | Bottom-pinned MediaBox player dock |
| **Apple** | Balanced | Layered frosted glass with high contrast | SF Pro (Display & Text), dynamic numerals | Adaptive responsive split-view | TimeBox typography, digital widget cards |
| **Stripe** | Very High | Crisp white/dark cards, 2px focus rings | Inter / Camphor | Deep nested multi-level sidebar | Account security, active device audit trail |

---

## PART C: Recommended Design Direction: "Academic Velocity"

### The Core Vision
Ditch the cartoonish, gradient-heavy, slow "gamified student portal" aesthetic. Treat high school academics, competitive exams, and extracurricular schedules at SMAN 2 Tuban with the same seriousness, speed, and elegance that top Silicon Valley engineers get in Linear and Raycast.

- **Primary Canvas**: Dark-first default (Zinc 950 base) with an equally rigorous, high-contrast light mode (Zinc 50 / Slate 100).
- **Surface Elevation**: Layered border borders (`1px solid rgba(255,255,255,0.08)`) with progressive darkness/lightness steps rather than heavy muddy drop-shadows.
- **Accent Identity**: Electric Royal Indigo (`#4F46E5` / `#6366F1`) paired with Emerald Green (`#10B981`) for active focus/sessions and Crimson (`#F43F5E`) for critical deadlines.
- **Media & Focus Continuity**: Dedicated persistent docks that never obstruct navigation; floating picture-in-picture mode for YouTube MediaBox and synchronized room status for Watch Parties.

---

## PART D: Design System Tokens & Specifications

### 1. Color Tokens

```css
:root {
  /* Surface & Canvas - Dark Mode (Default) */
  --bg-canvas: #090A0F;            /* Deep obsidian canvas */
  --bg-surface-1: #11131A;         /* Primary container/card background */
  --bg-surface-2: #181B26;         /* Hover state, nested input fields */
  --bg-surface-3: #222634;         /* Elevated popovers, command palette */
  
  /* Border & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-strong: rgba(255, 255, 255, 0.14);
  --border-focus: #6366F1;
  
  /* Typography Colors */
  --text-primary: #F8FAFC;         /* 98% white */
  --text-secondary: #94A3B8;       /* Slate 400 */
  --text-tertiary: #64748B;        /* Slate 500 */
  --text-disabled: #334155;        /* Slate 700 */
  
  /* Brand & Status Accents */
  --brand-primary: #6366F1;        /* Electric Indigo */
  --brand-primary-hover: #4F46E5;
  --brand-subtle: rgba(99, 102, 241, 0.12);
  
  --status-success: #10B981;       /* Emerald */
  --status-success-subtle: rgba(16, 185, 129, 0.12);
  --status-warning: #F59E0B;       /* Amber */
  --status-danger: #EF4444;        /* Rose/Red */
  --status-info: #0EA5E9;          /* Sky Blue */

  /* Light Mode Overrides */
  --light-bg-canvas: #F8FAFC;
  --light-bg-surface-1: #FFFFFF;
  --light-bg-surface-2: #F1F5F9;
  --light-border-subtle: rgba(0, 0, 0, 0.08);
  --light-text-primary: #0F172A;
  --light-text-secondary: #475569;
}
```

### 2. Typography Scale

* **Primary Sans**: `Inter` / `Plus Jakarta Sans` / `Geist Sans`
* **Monospace & Numerals**: `JetBrains Mono` / `Geist Mono` (for Clock, TimeBox, Timers, Deadlines, Hotkeys)

| Token | Font Size | Line Height | Tracking | Weight | Target Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-2xl` | 56px / 3.5rem | 1.05 | -0.035em | 700 Bold | TimeBox Hero Clock Numeral |
| `heading-xl` | 28px / 1.75rem | 1.2 | -0.025em | 600 SemiBold | Primary Dashboard Page Headers |
| `heading-lg` | 20px / 1.25rem | 1.3 | -0.02em | 600 SemiBold | Card Titles, Section Groups |
| `heading-md` | 16px / 1.0rem | 1.4 | -0.015em | 600 SemiBold | Modal Headers, Tab Labels |
| `body-base` | 14px / 0.875rem | 1.5 | -0.005em | 400 Regular | Default text, task descriptions |
| `body-sm` | 13px / 0.8125rem| 1.45 | 0 | 400 / 500 | Metadata, timestamps, badge labels |
| `caption-xs` | 11px / 0.6875rem| 1.4 | +0.02em | 500 SemiBold | Eyebrow badges, shortcut keys |
| `mono-clock` | 44px / 2.75rem | 1.0 | -0.02em | 600 SemiBold | Digital Timer, Live Stopwatches |

### 3. Spacing, Radius & Shadows

* **Spacing Grid**: Strict 4px scale (`4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px`).
* **Corner Radius**:
  * Outer card frames: `12px` (`rounded-xl`)
  * Buttons, inputs, filter pills: `8px` (`rounded-lg`)
  * Badges & Avatars: `9999px` (`rounded-full`)
  * TimeBox HUD container: `16px` (`rounded-2xl`)
* **Shadow Hierarchy**:
  * `elevation-subtle`: `0 1px 2px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`
  * `elevation-popover`: `0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 2px 6px -1px rgba(0, 0, 0, 0.4)`
  * `glow-focus`: `0 0 0 2px #090A0F, 0 0 0 4px #6366F1`

---

## PART E: Complete Dashboard Layout & Wireframe Specifications

### Desktop Architecture (1440px / 1920px)

```
+-------------------------------------------------------------------------------------------------------------------------+
| [Fathur School Hub Logo]  SMAN 2 Tuban | [Search / ⌘K Command Palette] | [Focus: ON 25m] [WatchParty: 3] [Bell: 2] [User] |
+-----------+------------------------------------------------------------------------------+------------------------------+
| SIDEBAR   | MAIN DASHBOARD CONTENT AREA                                                  | UTILITY & MEDIA RAIL         |
|           |                                                                              |                              |
| • Dashboard| [Greeting: "Good morning, Muhammad Fathur"] [Tuban, ID: 07:14 AM]            | [ TIMEBOX WIDGET ]           |
| • Schedule|                                                                              | 07:14:28 AM • GMT+7          |
| • Tasks   | [Metric 1: 4 Due Today] [Metric 2: 94% Focus Score] [Metric 3: Math UTS in 3d]| Target: SMAN 2 Tuban Schedule|
| • TimeBox |                                                                              | [Mode: Study] [Break: 5m]    |
| • MediaBox| ---------------------------------------------------------------------------- | ---------------------------- |
| • Parties | [ TODAY'S ACADEMIC TIMELINE & CLASS BLOCKS ]                                 | [ YOUTUBE MEDIABOX ]         |
| • Analytics| 07:30 - 09:00 : Physics (Lab Fisika 2) - Bpk. Hendro                          | [Video Thumbnail: Lo-Fi Study]|
| • Settings| 09:15 - 10:45 : Matematika Peminatan (R. 12) - Ibu Sri                        | Track: Lofi Girl 24/7        |
|           | 11:00 - 12:30 : Bahasa Indonesia (R. 12)                                     | [⏮] [⏯] [⏭] [Vol: 72%]      |
|           |                                                                              | Party: SMAN2-Fathur-Study    |
|           | ---------------------------------------------------------------------------- | ---------------------------- |
| [Collapse]| [ ACTIVE TASK SPRINT WITH DEADLINES ]       [ PRODUCTIVITY ANALYTICS ]       | [ REMOTE CONTROL / QR ]      |
|           | [x] Fisika Laporan Bab 4 - High [Today 5pm] | Weekly Focus Target: 34/40 hrs | "Control from Phone"         |
|           | [ ] Kimia Stoikiometri Quiz - Med [Tomorrow] | Streak: 12 Days 🔥            | [Scan QR to Sync Mobile]     |
|           | [ ] Buat Slide Sejarah Indo - SMAN2 [Friday]| [Mini Bar Chart: Mon-Sun]      | 2 Devices Paired             |
+-----------+------------------------------------------------------------------------------+------------------------------+
```

### Mobile Layout Architecture (360px - 430px)
* **Header**: Compact sticky bar with Hub mark, TimeBox status pill, Notification bell, and User avatar.
* **Vertical Cascade**:
  1. Sticky Top Bar: Hub logo + TimeBox mini indicator (`07:14 AM`) + Command Trigger.
  2. Quick Overview Card: Greeting, today's top academic commitment, active focus status.
  3. Dynamic Segmented Switcher: `[Overview] | [Schedule] | [Tasks] | [MediaBox]`.
  4. TimeBox Full Focus Card (preserves original digital clock structure).
  5. Schedule Strip with vertical time-line markers.
  6. Sticky Bottom Player Pill (MediaBox player mini-bar with playback toggle and Watch Party badge).
  7. Mobile Bottom Navigation: `Home`, `Schedule`, `Tasks`, `TimeBox`, `More`.

---

## PART F: Component Deep Dive Specifications

### 1. TimeBox Digital Clock Specification
* **Visual Identity**: Monospaced LED/OLED inspired display embedded within a satin matte anodized container.
* **Layout Elements**:
  * Large digital readout: `HH:MM:SS` with togglable 24h / 12h format and local timezone (`WIB / GMT+7`).
  * Secondary indicators: Active academic period (`Period 2 of 6: 09:15 - 10:45`), countdown remaining (`31m 14s`).
  * Action controls: One-click "Start Pomodoro Sprint", "Exam Countdown Anchor", "Class Bell Sync".
  * Mobile adaptation: Stacks vertically; clock maintains optical sizing with a fluid `min(14vw, 48px)` typography rule so it never overflows 360px screens.

### 2. MediaBox & Watch Party Architecture
* **Integrated YouTube Player**: Minimal custom wrapper over YouTube IFrame API preventing external algorithmic distraction.
* **Watch Party Protocol**:
  * Room generation with join code (e.g., `SMAN2-TUBAN-FATHUR-88`).
  * Peer state synchronization: Play/Pause/Seek synchronized within `<150ms`.
  * Participant grid: Compact avatar pills with live "listening/watching" audio waveforms.
  * Mobile Remote Control: Generates a signed dynamic QR code enabling a student's smartphone to act as a physical trackpad and playback remote for the desktop screen without switching browser tabs.

### 3. Account, Security & Device History
* **Active Session Table**:
  * Real-time list: Device Type (e.g., `MacBook Air 15" - Tuban, ID`, `iPhone 15 - Telkomsel Cellular`), Browser, IP Address, and Last Active timestamp.
  * Action: Instant "Revoke Session" and "Kill All Other Devices" button with two-factor re-authentication modal.
* **Login History Audit Log**: Chronological audit trail showing success/failure states, timestamp, and geolocated map pins.

---

## PART G: React + TypeScript + Tailwind CSS Implementation Blueprint

```tsx
// Example Production Component Token Hierarchy
export interface TaskItem {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
}

// Tailwind Class Architecture:
// Cards: bg-zinc-900/70 border border-white/10 rounded-xl p-4 backdrop-blur-md
// Headers: font-sans font-semibold tracking-tight text-zinc-100
// Clocks/Numbers: font-mono tracking-tight tabular-nums
```
