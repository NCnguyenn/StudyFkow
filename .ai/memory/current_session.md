# 🧠 AI StudyFlow — Current Session Memory

> **Format:** This file records the active AI engineering session context.
> It is overwritten at the START of each new session and updated throughout.
> AI agents MUST read this file at the beginning of every task.

---

## SESSION METADATA

```
Session Start : 2026-06-27T20:38:00+07:00
Last Updated  : 2026-06-29T19:00:00+07:00
Active Agent  : Antigravity
Session Focus : Architecture Migration — R4.0 Composite PNG → R5.0 Inline SVG Room Rendering
```

---

## CURRENT STATUS

**R5.0 "SVG Room" architecture migration IN PROGRESS.**

The room rendering system is being migrated from R4.0 (2 composite PNG images: `room_base.png` + `desk_zone.png`) to R5.0 (inline SVG elements drawn via code, styled with CSS custom properties, animated with CSS transforms).

Reason for migration:
- Composite PNG images cannot support per-object animations (lamp flicker, plant sway, etc.)
- SVGs scale perfectly on all screen sizes (mobile, Retina, 4K)
- SVGs are much smaller (~50-150KB total vs ~1.7MB for 2 PNGs)
- SVGs enable dynamic theming via CSS variables
- SVGs support interactive hover/click effects on individual objects
- Better for future mobile app deployment (lighter, scalable)

Migration status:
1. ✅ Documentation alignment (updating all .md files to R5.0 spec)
2. ❌ SVG room scene creation (draw room objects as inline SVG)
3. ❌ InteractiveRoomEngine refactor (swap <img> for inline <svg>)
4. ❌ CSS animation integration (per-object animations)
5. ❌ Testing & verification

---

## KEY DESIGN DECISIONS (R4.0 — Room-as-UI)

| # | Decision | Details |
|---|----------|---------|
| 1 | **Room Philosophy:** Room objects = UI elements | Each room object IS a navigation target. Click notebook → Notes, click clock → Focus, etc. |
| 2 | **Assets:** Inline SVG elements | Room objects drawn as SVG `<g>` groups in code. NO external image files. Each object styled via `--sf-room-*` CSS variables. Supports per-object animation, hover effects, and theme switching. |
| 3 | **Layer System:** 2-layer SVG | Layer 0: `.room-base` (z-0, inline SVG scene). Layer 1: `.module-panel` (z-30, glassmorphism UI). HUD uses inline z-55 positioning. `.radial-menu` (z-60). |
| 4 | **Viewpoint:** Eye-level (ngang tầm mắt) | NOT isometric. Camera at seated position looking across the room. No ceiling visible. |
| 5 | **Navigation:** FAB + Radial Menu | Bottom-right FAB button → radial arc menu (desktop). Bottom tab bar (mobile <768px). Replaces CompactDock. |
| 6 | **Camera:** Zoom-to-hotspot dynamic | GSAP-driven zoom/pan to hotspot zones. No fixed 6-CameraMode presets. |
| 7 | **Transitions:** Slide + Scale + Blur | Room scales/translates toward object → room dims (opacity 0.3, blur 4px) → module panel slides in. |
| 8 | **Dashboard:** Full room 100% + HUD overlay | HUD shows greeting, time, quick stats. Room interactive with clickable hotspots. |
| 9 | **Focus Mode:** GSAP desk zoom (SVG) | Room zooms into desk area (GSAP scale on `.room-base` SVG). No image swap needed — SVG scales losslessly. |
| 10 | **Day/Night:** CSS filters on `.room-base` | brightness, saturate, hue-rotate driven by `new Date().getHours()`. Calculated in `InteractiveRoomEngine.tsx`. |
| 11 | **Hover:** CSS-only per hotspot | Brighten, glow, pulse overlays. No tooltips. |
| 12 | **Mobile:** Bottom tab bar fallback | `<768px` → hide radial arc, show traditional bottom tabs. Room is decorative background. |

---

## COMPLETED PHASES (R4.0)

### ✅ Phase 1 — Generate Composite Sprites
- Generated `room_base.png` (full room eye-level composite)
- Generated `desk_zone.png` (desk close-up for Focus mode)
- Updated `sprites.json` to v3.0 format (`base` + `hotspots`)

### ✅ Phase 2 — Interactive Room Engine (Core)
- Created `InteractiveRoomEngine.tsx` — hotspot zones + zoom state machine + dynamic lighting (hotspot data hardcoded inside, uses internal `HotspotZone` sub-component)
- Created `RoomHotspot.tsx` — standalone hotspot component (currently UNUSED — `InteractiveRoomEngine` uses its own internal hotspot rendering)
- Created `types/room.ts` — shared type definitions
- Deleted legacy `RoomPerspective.tsx`, `SpriteLoader.ts`, `layers/` subfolder

### ✅ Phase 3 — Dashboard — Full Room + HUD
- Created `HudOverlay.tsx` — greeting, time, quick stats
- Refactored `page.tsx` (Dashboard) — removed ProfileHero/Canvas, added HUD
- Moved ProfileHero → Settings page
- Created `/canvas` module (click laptop → FreeformCanvas)

### ✅ Phase 4 — FAB + Radial Menu
- Created `RadialNavMenu.tsx` — FAB button + radial arc menu
- Deleted `CompactDock.tsx` from layout
- Preserved Ctrl+1..6 keyboard shortcuts

### ✅ Phase 5 — Module Transitions
- Created `ModuleTransition.tsx` — slide + scale + blur
- Refactored `layout.tsx` — new 2-layer layout structure
- Implemented Focus mode desk zoom + smart swap
- Updated Notes/Tasks/Insights pages for glassmorphism panels

### ✅ Phase 6 — CSS Overhaul
- Added new CSS: `.room-base`, `.room-base--dimmed`, `.room-base--focus`, `.room-hotspot`, `.module-panel`, `.fab-button`, `.radial-menu`
- Kept: `.room-glass`, `.room-glass-card`, `.room-vignette`, day/night CSS vars
- Removed old 6-layer CSS (`.room-perspective`, `.room-layer-sky/bg/light/fg/widgets/ui`) completely from `globals.css`
- Consolidated duplicate definitions of `.room-glass`, `.room-glass-card`, and `.room-hotspot` into clean, single definitions
- Safely kept `.hud-item` styles inline in `HudOverlay.tsx` to maintain lightweight CSS

### ✅ Phase 7 — Day/Night Adaptation
- Adapted lighting for composite sprite (CSS filters on `.room-base` driven by actual local hour)
- Integrated sky lighting shifts inside composite base image + ambient overlays

### ✅ Phase 8 — Hover Animations
- Implemented CSS-only hover effects per hotspot zone (brighten, glow, pulse overlays)
- Mobile bottom tab bar fallback (<768px)

---

## IMPLEMENTATION PHASES (R4.0 Complete → R5.0 In Progress)

| Phase | Component | Status |
|-------|-----------|--------|
| **R4.0-P1** | Composite Sprite Generation (2 images) | ✅ Complete |
| **R4.0-P2** | InteractiveRoomEngine + Hotspot Zones | ✅ Complete |
| **R4.0-P3** | Dashboard Full Room + HUD Overlay | ✅ Complete |
| **R4.0-P4** | FAB + Radial Menu Navigation | ✅ Complete |
| **R4.0-P5** | Module Transitions (Slide + Scale + Blur) | ✅ Complete |
| **R4.0-P6** | CSS Overhaul (2-Layer System) | ✅ Complete |
| **R4.0-P7** | Day/Night CSS Filter Adaptation | ✅ Complete |
| **R4.0-P8** | Hover Animations + Mobile Fallback | ✅ Complete |
| **R6-NEW** | Weather & Ambient Effects | ❌ Not started (needs re-scoping for SVG) |
| **R8-NEW** | Room Widgets (Clock, Sticky Notes, Chalkboard) | ❌ Not started |
| **R9-NEW** | Mascot "Wise" Owl (Lottie) | ❌ Not started |
| **R10-NEW** | Gamification (XP, Streak, Levels) | ❌ Not started |

---

## KEY FILES (R4.0)

### Core Room System
- `src/components/room/InteractiveRoomEngine.tsx` — Room composite + hotspot zones + GSAP zoom + dynamic lighting
- `src/types/room.ts` — Shared TypeScript types

### Navigation & Layout
- `src/components/ui/RadialNavMenu.tsx` — FAB + radial arc (desktop) / bottom tab bar (mobile)
- `src/components/room/HudOverlay.tsx` — Greeting, time, quick stats overlay
- `src/components/room/ModuleTransition.tsx` — Module enter/exit transitions
- `src/app/(dashboard)/layout.tsx` — 2-layer layout structure

### Assets
- `src/components/room/svg/` — SVG room scene components (to be created)
- `public/assets/rooms/home/room_base.png` — ⚠️ DEPRECATED in R5.0 (replaced by inline SVG, pending deletion)
- `public/assets/rooms/home/desk_zone.png` — ⚠️ DEPRECATED in R5.0 (replaced by inline SVG, pending deletion)

### Styling
- `src/app/globals.css` — CSS layers, room tokens, glassmorphism, z-index map

---

## ARCHITECTURE STATE

- **Backend:** FastAPI + PostgreSQL + JWT Auth — Stable, NO CHANGES.
- **Frontend:** Next.js App Router + Tailwind CSS v4 + TypeScript.
- **Room System:** Migrating from v4.0 (Composite PNG) → v5.0 (Inline SVG + CSS). Documentation updated. Code migration pending.
- **Stores:** Room-specific stores (`useRoomStore`, `useWeatherStore`, `useCompanionStore`, `useGamificationStore`) NOT yet created. Day/night logic is inline in `InteractiveRoomEngine.tsx`.
- **Build:** Last verified `tsc --noEmit` passed.

---

## SESSION NOTES & SAFETY RULES

- **Backend Safety:** UI redesign does NOT affect backend. API contracts, DB schema, auth flow remain unchanged.
- **CSS Safety:** When editing `globals.css`, preserve ALL existing `--sf-*` variables.
- **Layer System:** 2-layer composite (NOT 6-layer CSS perspective). `.room-base` (z-0) + `.module-panel` (z-30). Dim states: `.room-base--dimmed`, `.room-base--focus`.
- **Performance:** Animations use `transform`/`opacity` only. Weather particles capped at 30.
- **Navigation:** FAB + Radial Menu (desktop). Bottom tab bar (mobile <768px). Ctrl+1..6 shortcuts active.
- **DnD Safety:** Do not modify drag-and-drop hooks.
- **Timer Safety:** Do not modify the timer/focus engine.

---

## HOW TO USE THIS FILE

**When starting a new session:**
1. Read this file first
2. Read `.ai/architecture/ui_architecture.md` (v5.0) for the design spec
3. Check the current implementation phase
4. Begin implementing the next phase

**When ending a session:**
- Update this file with new progress
- Mark completed phases accordingly
