---
name: Academic Velocity
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
  bg-canvas: '#090A0F'
  bg-surface-1: '#11131A'
  bg-surface-2: '#181B26'
  bg-surface-3: '#222634'
  border-subtle: rgba(255, 255, 255, 0.07)
  border-strong: rgba(255, 255, 255, 0.14)
  text-primary: '#F8FAFC'
  text-secondary: '#94A3B8'
  text-tertiary: '#64748B'
  text-disabled: '#334155'
  brand-hover: '#4F46E5'
  brand-subtle: rgba(99, 102, 241, 0.12)
  status-warning: '#F59E0B'
  status-info: '#0EA5E9'
  status-success-subtle: rgba(16, 185, 129, 0.12)
typography:
  display-2xl:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.035em
  mono-clock:
    fontFamily: JetBrains Mono
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  mono-clock-mobile:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  caption-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 15px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-1: 0.25rem
  space-2: 0.5rem
  space-3: 0.75rem
  space-4: 1rem
  space-5: 1.25rem
  space-6: 1.5rem
  space-8: 2rem
  space-12: 3rem
  sidebar-width: 16rem
  media-dock-width: 22rem
  gutter-desktop: 1.5rem
  gutter-mobile: 1rem
---

## Brand & Style

The design system establishes a high-performance, keyboard-first environment for intense academic focus, collaboration, and multi-stream execution. It abandons traditional, condescending educational software paradigms—avoiding decorative badges, whimsical illustrations, and juvenile gamification—in favor of the hyper-tuned ergonomic precision of engineering environments like Linear, the command-line agility of Raycast, and the spatial media fluidity of Arc.

### Personality & Emotional Response
- **Surgical Precision:** Every control, border, and metric is exact. The interface prioritizes high information density without visual clutter, engendering feelings of mastery, speed, and cognitive calm.
- **Academic Velocity:** Fast navigation, zero input friction, and instantaneous keyboard access allow students and power users to enter a deep state of flow.
- **Tactile Obsidian Depth:** Surfaces present an ultra-dark obsidian foundation punctuated by crisp 1-pixel hairline borders and luminous electric indigo highlights that guide the eye directly to active contexts.

### Design Movement & Aesthetic Form
The system synthesizes **Dark Modernism** and **Tactile Utility**:
- Layered monochromatic obsidian fills establish depth through precise tonal luminance steps rather than heavy blurry drop shadows.
- Micro-hairline borders (`1px solid rgba(255, 255, 255, 0.07)`) and subtle internal top-edge reflections define structural hierarchy.
- Highly functional monospace metrics and compact interactive elements mirror developer dashboards, optimized for high data throughput and persistent session management.

## Colors

The design system is engineered dark-first around a deep obsidian spectrum. Depth is generated through calibrated lightness tiers rather than elevation offsets.

### Canvas & Surface Architecture
- **Obsidian Canvas (`#090A0F`):** The absolute foundational background. Used for full-bleed page surfaces and deep negative space.
- **Surface Level 1 (`#11131A`):** The primary container fill for cards, workspace panels, and segmented list modules.
- **Surface Level 2 (`#181B26`):** Applied to nested inputs, inactive buttons, segmented control trays, and interactive hover states.
- **Surface Level 3 (`#222634`):** The highest elevation layer, reserved for floating popovers, dropdown flyouts, and the Command Palette (`⌘K`) modal.

### Chroma & Semantic Indicators
- **Electric Indigo (`#6366F1`):** Primary brand accelerator. Designates active routes, primary action triggers, multi-select ranges, and focus indicators. Paired with `brand-subtle` (`rgba(99, 102, 241, 0.12)`) for high-contrast contextual backings.
- **Emerald Focus (`#10B981`):** Applied exclusively to active study blocks, active pomodoro cycles, live status indicators, and positive academic streaks.
- **Rose Deadline (`#EF4444`):** Communicates urgency, past-due assignments, terminal errors, and destructive actions.
- **Amber Warning (`#F59E0B`):** Reserved for upcoming critical deadlines (&lt; 24h) and pending synchronizations.
- **Sky Info (`#0EA5E9`):** Metadata chips, information flyouts, and system-level notices.

### Text & Hairline Tokens
- **Text Primary (`#F8FAFC`):** Pure readability for headlines and active data values (98% luminance).
- **Text Secondary (`#94A3B8`):** Informative body copy, secondary metadata, and table column headers.
- **Text Tertiary (`#64748B`):** Timestamps, passive hotkey reminders, and inactive states.
- **Hairlines:** Surface separation relies on strict 1px alpha borders: `border-subtle` (`rgba(255, 255, 255, 0.07)`) for grid dividers and inactive cards; `border-strong` (`rgba(255, 255, 255, 0.14)`) for focused card zones and elevated overlays.

## Typography

The typography system pairs clean, modern sans-serif precision with strict monospace data rendering.

### Hierarchy & Letter Spacing Formula
Tracking scales inversely with type size. As type becomes larger, negative tracking is tightened to maintain optical cohesion:
- Display headings utilize compact negative tracking (`-0.035em` to `-0.015em`) to produce a sharp, cohesive silhouette.
- Body sizes (`14px` and `13px`) feature neutral tracking for maximum reading stamina across long assignment briefs and study materials.
- Micro-labels and keyboard shortcuts (`caption-xs`) enforce positive tracking (`+0.02em`) to ensure legibility when rendered in all-caps or inside translucent keys.

### Tabular Setting & Monospace Rules
- All numeric interfaces—including the TimeBox HUD, countdown clocks, stopwatch intervals, analytics percentages, and security session IDs—must employ `JetBrains Mono` with the CSS property `font-variant-numeric: tabular-nums`.
- This eliminates horizontal jitter when numbers increment rapidly in real-time clocks and focus trackers.
- For mobile screen widths below 430px, the primary digital clock scales dynamically via `min(14vw, 44px)` to prevent viewport overflow while maintaining prominent visibility.

## Layout & Spacing

The layout is built upon a strict **4px modular grid rhythm** and a **3-column desktop application shell**.

### Application Shell Structure
- **Left Navigation Rail (`256px` / `16rem`):** Fixed-width, collapsible sidebar containing high-level workspace routes, class schedules, and command shortcuts.
- **Center Canvas (Flexible):** Main content feed for Tasks, Study Modules, and HUD overviews. Max-width bounded at `1120px` to prevent excessive line lengths.
- **Right Utility & Media Rail (`352px` / `22rem`):** Persistent spatial dock housing the TimeBox clock, docked PiP YouTube player, watch party streams, and active participant presence.
- **Command Palette Layer (`⌘K`):** Centered floating overlay with a fixed width of `640px` and a top offset of `18vh`.

### Responsive Breakpoints & Reflow Rules
- **Desktop (`≥1280px`):** Full 3-column configuration with persistent sidebars and media dock.
- **Tablet (`768px – 1279px`):** The right utility rail collapses into an expandable drawer or bottom-docked mini-player (`64px` height). The main canvas expands to fill the remaining area.
- **Mobile (`360px – 767px`):** Reflows into a single vertical cascade:
  - Top persistent status bar with compact TimeBox pill.
  - Core scrollable viewport padded at `16px` (`space-4`).
  - Fixed bottom navigation bar (`64px` height) with haptic-ready trigger zones.
  - Full-screen sheet modals replace popovers and the command palette.

## Elevation & Depth

Visual hierarchy is communicated through **Tonal Layering** and **Hairline Inset Illumination** rather than diffused dropshadows. In ultra-dark interfaces, black drop shadows disappear; therefore, edge contrast and surface lightness values establish spatial layering.

### Surface Tiers & Insets
- **Tier 0 (Canvas):** `#090A0F`. Absolute depth plane.
- **Tier 1 (Cards & Modules):** `#11131A` bounded by a `1px` border of `rgba(255, 255, 255, 0.07)`. Includes an internal top-edge highlight:
  `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.4)`
- **Tier 2 (Interactive Elements & Drawers):** `#181B26` with `1px solid rgba(255, 255, 255, 0.10)`.
- **Tier 3 (Floating Overlays & Modals):** `#222634` elevated with a compound edge and occlusion shadow:
  `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 4px 12px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`
  `backdrop-filter: blur(16px)`

### Focus Rings (`glow-focus`)
To guarantee accessibility and high responsiveness, keyboard focus never relies on subtle outline shifts. It uses a high-contrast double ring:
`box-shadow: 0 0 0 2px #090A0F, 0 0 0 4px #6366F1`

## Shapes

The design system maintains a consistent radius curve that softens structural boundaries while preserving a clean, technical silhouette.

### Radius System
- **`rounded-lg` (`8px`):** Standard for atomic controls: buttons, input fields, dropdown items, filter chips, and keyboard shortcut tokens (`<kbd>`).
- **`rounded-xl` (`12px`):** Default for primary task cards, dashboard modules, media panels, and code blocks.
- **`rounded-2xl` (`16px`):** Used exclusively for macro containers: the TimeBox HUD container, floating `⌘K` palette, and modal dialogs.
- **`rounded-full` (`9999px`):** Applied to status badges, timer progress rings, participant video avatars, and audio visualizer pills.

### Border Strokes
All geometric boundaries employ a sharp `1px` structural stroke. Under no circumstances are heavy 2px or 3px border strokes applied to resting cards.

## Components

### 1. Buttons & Triggers
- **Primary CTA:** Solid Electric Indigo fill (`#6366F1`), white text (`#F8FAFC`), `8px` corner radius, `px-3.5 py-1.5`, `font-size: 13px`, `font-weight: 500`. Hover: `#4F46E5`. Active: scale `0.98`.
- **Secondary / Ghost:** Transparent fill, `1px solid rgba(255, 255, 255, 0.07)`, text `#94A3B8`. Hover: background `#181B26`, text `#F8FAFC`.
- **Command Hotkey Trigger:** Combines standard text with a right-aligned `<kbd>` component: background `#222634`, border `1px solid rgba(255, 255, 255, 0.12)`, font family `JetBrains Mono`, text size `11px`.

### 2. Task Card (Linear-Style Density)
- **Container:** Background `#11131A`, border `1px solid rgba(255, 255, 255, 0.07)`, radius `8px`, internal padding `10px 14px`.
- **Layout:** Flex row aligning priority indicator, custom square checkbox (`16px`), title (`13px`, `#F8FAFC`), tag badges, and right-aligned due date.
- **Hover / Selected State:** Background shifts to `#181B26`; left edge reveals a `2px` vertical strip colored according to priority (Urgent: `#EF4444`, High: `#F59E0B`, Low: `#64748B`).

### 3. TimeBox HUD & Clocks
- **Container:** Background `#11131A` with a top-inset specular line, `16px` radius, padding `20px`.
- **Clock Display:** Large centered `JetBrains Mono` display (`44px`, tabular numbers, `-0.02em` tracking). Includes an active status indicator pill (`#10B981` with subtle pulse animation).
- **Controls:** Micro-segmented pill buttons for Pomodoro / Short Break / Long Break presets with smooth state transitions.

### 4. MediaBox & Watch Party Dock (Arc-Style)
- **Container:** Border `1px solid rgba(255, 255, 255, 0.10)`, background `rgba(17, 19, 26, 0.85)`, `backdrop-filter: blur(12px)`.
- **Video Surface:** 16:9 responsive frame with nested controls that reveal on hover.
- **Participant Bar:** Clustered avatars with overlapping `-space-2` layout. Active speakers show an animated 3-bar green audio visualizer waveform (`#10B981`).
- **Sync Status:** Real-time badge indicating latency (`<150ms`) using `JetBrains Mono` `11px`.

### 5. Input Fields & Search
- **Container:** Height `36px`, background `#181B26`, border `1px solid rgba(255, 255, 255, 0.07)`, radius `8px`, text `#F8FAFC`, placeholder `#64748B`.
- **Focus:** Border shifts to `#6366F1` with an outer glow `0 0 0 2px rgba(99, 102, 241, 0.20)`.

### 6. Security & Remote Control HUD
- **Dynamic Mobile QR Handshake:** Bounded `#181B26` box with sharp `8px` corner radius, displaying a high-contrast inverted QR code paired with a copyable 6-character session code in `JetBrains Mono` (`14px`, tracking `0.1em`).
- **Audit Logs:** Compact tabular view with monospace timestamps (`#64748B`), action names (`#F8FAFC`), and IP/Device tokens with an emerald dot status indicator.