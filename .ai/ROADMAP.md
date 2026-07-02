# ROADMAP — UI/UX Illustrated Study Room v5.5 Implementation

> **Reference:** `.ai/architecture/ui_architecture.md` (full design spec)
>
> **Rule:** Complete each phase IN ORDER. Do NOT skip ahead. Each phase has verification tests — ALL must pass before proceeding.
>
> **Architecture:** R5.5 Pixel Art Sprite Engine + Per-Object Parallax + Realtime Lighting + GSAP Zoom Transitions + FAB/Radial Navigation
>
> **Last updated:** 2026-07-02

---

## SCOPE — V1.0 vs V2.0

### V1.0 (Phase R0–R9-NEW) — "Shippable Beautiful"

Deliver a complete illustrated lo-fi study room experience with **1 theme (Home)**, an eye-level **inline SVG room scene** (each object drawn as SVG `<g>` groups styled via CSS custom properties), a 2-layer depth system (`.room-base` z-0 + `.module-panel` z-30), GSAP zoom-to-hotspot transitions via `InteractiveRoomEngine.tsx`, FAB + radial arc navigation (`RadialNavMenu.tsx`) on desktop and bottom tab bar on mobile, CSS filter day/night adaptation (`brightness`/`saturate`/`hue-rotate`), per-object CSS animations (lamp flicker, plant sway, coffee steam), Canvas 2D weather effects, a Lottie-animated owl mascot, room widgets, and basic gamification. The room must pass the **Immersion Test**: when all module panels are hidden, the user must feel they are *sitting at* their study desk — NOT looking at a flat background image.

### V2.0 (Future) — "Unlock & Expand"

Additional room themes (Café, Cabin, City, Library, Beach, Nature, Space), extended weather effects, expanded mascot emotions, ambient sound mixer, level-up celebrations, productivity garden, seasonal decorations, responsive/accessibility polish. Listed at the bottom of this document. Only start after V1.0 is stable and tested.

---

## TECHNOLOGY STACK SUMMARY

| Component | Technology | Bundle Size | Purpose |
|-----------|-----------|-------------|---------|
| Room visuals | **Inline SVG elements** — each object is an SVG `<g>` group styled via CSS custom properties (`--sf-room-*`) | ~50-150KB (bundled with JS code) | Perfect scaling on all screens (mobile→4K). No HTTP requests for room art. Per-object animation. Dynamic theming |
| Per-object animation | **CSS `@keyframes`** on SVG `<g>` groups | 0KB (native CSS) | Plant sway, lamp flicker, coffee steam. GPU-accelerated `transform` + `opacity` only |
| Depth + zoom | **2-layer SVG** (`.room-base` z-0 + `.module-panel` z-30) + **GSAP zoom** to hotspot zones | ~30KB (GSAP) | GPU-accelerated zoom transitions, hotspot navigation |
| Lighting (day/night) | **CSS filters** (`brightness`/`saturate`/`hue-rotate`) on SVG container + CSS custom properties | 0KB (native) | Smooth, animatable via CSS transitions |
| Weather (rain, stars, clouds, fireflies) | **HTML5 Canvas 2D** — 1 canvas ONLY inside window bounding box | 0KB (native API) | GPU-accelerated, no DOM bloat |
| Ambient (steam, sway, flicker) | **CSS `@keyframes`** on SVG `<g>` groups | 0KB (native) | Lightest possible, direct SVG element targeting |
| Navigation | **RadialNavMenu.tsx** (FAB + radial arc desktop / bottom tab bar mobile <768px) | 0KB (React component) | Replaced CompactDock |
| HUD overlay | **HudOverlay.tsx** (greeting, clock, profile) | 0KB (React component) | Always-visible room info |
| Module transitions | **ModuleTransition.tsx** + GSAP | ~30KB (shared GSAP) | Focus desk zoom + smart swap animations |
| Mascot "Wise" | **lottie-react** | ~50KB lib + ~20–50KB/animation state | Vector animation, resolution-independent |
| Celebrations (confetti) | **canvas-confetti** | ~6KB | Lightweight, trigger-only |

### Performance Budget

| Metric | Target |
|--------|--------|
| GPU usage idle | ≤3% |
| RAM | ≤80MB total |
| Additional bundle | ≤90KB (GSAP + lottie-react + canvas-confetti) |
| First Contentful Paint | <1.5s (SVG renders instantly as DOM) |
| Weather particles | ≤30 rain, ≤35 stars, ≤12 fireflies (total concurrent ≤40) |
| Animation properties | ONLY `transform` + `opacity` + `filter` |

---

## COMPLETED PHASES (from previous v2.x work)

### ✅ OLD Phase 0 — Design System Foundation — COMPLETE

**Status:** DONE. Core `globals.css` has `--sf-room-*` CSS variables, Google Fonts loaded, room keyframe animations, glassmorphism classes (`.room-glass`, `.room-glass-card`), `/public/assets/` directory structure.

> **Note:** Updated in Phase R0 for v3.0/v4.0 variables. Existing variables kept intact.

### ✅ OLD Phase 2 — Glass Panel Restyling — COMPLETE

**Status:** DONE. `GlassCard.tsx` component exists. Dashboard, Tasks, Insights, Settings pages have glass styling. Greeting system implemented.

> **Known Gaps (to fix in later phases):**
> 1. Greeting not yet using Caveat font
> 2. No stagger fade-in for Dashboard cards
> 3. Dual GlassCard components need consolidation
> 4. Background/Foreground colors need matching to v4.0 palette

### ✅ OLD Phase 1 — Room Layout (3-Layer CSS) — SUPERSEDED by R4.0

**Status:** Was built with inline SVG + CSS gradients. The entire room rendering system was **rebuilt from scratch** in R4.0 using the new 2-layer composite architecture with `InteractiveRoomEngine.tsx`, replacing the old 6-layer sprite-based approach.

---

# PHASE R0 — Design System Updates for v3.0

## ✅ Complete (still valid — CSS variables preserved in R4.0)

**Goal:** Update the existing `globals.css` with v3.0-specific CSS custom properties, new color variables for the expanded room palette (room environment colors, sky keyframe colors, accent colors, pastel glows), and install NPM packages.

All R0 tasks (R0.1–R0.9) are complete and remain valid in R4.0. The CSS variables defined here are actively used by the R4.0 composite architecture, day/night CSS filters, and HUD components.

<details>
<summary>R0 Tasks (click to expand)</summary>

### R0.1 — v3.0 room environment CSS variables in `globals.css`

Added `--sf-room-wall`, `--sf-room-desk`, `--sf-room-lamp`, etc. (17 total) under `:root`.

### R0.2 — Sky/window scene keyframe color variables

Added `--sf-sky-dawn-top` through `--sf-sky-night-bottom` (12 total).

### R0.3 — Accent and pastel glow variables

Added `--sf-accent-primary`, `--sf-glow-lavender`, etc. (12 total).

### R0.4 — Glassmorphism surface variables

Added `--sf-glass-surface-1`, `--sf-glass-bg`, `--sf-glass-blur`, etc. (7 total).

### R0.5 — Dynamic room state CSS variables

Added `--sf-window-light-opacity`, `--sf-lamp-opacity`, `--sf-room-saturation`, `--sf-room-brightness`, etc.

### R0.6 — Room keyframe animations

All keyframes present: `room-breathe`, `room-drift-1`, `room-drift-2`, `room-steam`, `room-sway`, `room-flicker`, `room-fade-in`.

### R0.7 — Caveat font import

Caveat font loaded with `--sf-font-handwriting: 'Caveat', cursive;` CSS variable.

### R0.8 — NPM packages installed

`gsap`, `lottie-react`, `canvas-confetti` in `package.json`.

### R0.9 — Asset directory structure

`/public/assets/rooms/home/`, `/public/assets/mascot/`, `/public/sounds/` created.

</details>

### Verification — Phase R0: ✅ ALL PASSED

---

# PHASE R1 — Asset Generation (OLD: 50-Sprite System)

## ✅ SUPERSEDED — Replaced by R4.0 Phase 1

**Original goal:** Generate 50 individual isometric 3/4 view sprites, process with `process_sprites.py`, organize into `bg/`/`fg/` folders with `sprites.json` v2.0.

> **What replaced it:** R4.0-P1 consolidated the entire room into 2 composite images (`room_base.png` + `desk_zone.png`) with `sprites.json` v3.0 defining hotspot zones rather than individual sprite positions. This reduced HTTP requests from ~50 to 2 and simplified the rendering pipeline.

---

# PHASE R2 — Room Perspective Engine (OLD: Multi-Camera & CSS Perspective)

## ✅ SUPERSEDED — Replaced by R4.0 Phase 2

**Original goal:** Build `RoomPerspective.tsx` with CSS `perspective` + `translateZ` for 6-layer 3D spatial volume, 6 CameraMode presets, GSAP camera transitions, mouse-driven parallax.

> **What replaced it:** R4.0-P2 built `InteractiveRoomEngine.tsx` with a flat 2-layer system (`.room-base` + `.module-panel`), hotspot-based zoom state machine driven by GSAP, and dynamic CSS filter lighting. The 6-layer CSS perspective system was removed entirely.

---

# PHASE R3 — Room Composition & Compact Glass Dock (OLD)

## ✅ SUPERSEDED — Replaced by R4.0 Phases 3–4

**Original goal:** Populate 6-layer room with 50 composite sprites, build `CompactDock.tsx` pill-shaped floating dock, interactive hotspot buttons.

> **What replaced it:** R4.0-P3 refactored the dashboard to use `HudOverlay.tsx` with full-room composite rendering. R4.0-P4 replaced `CompactDock.tsx` with `RadialNavMenu.tsx` (FAB + radial arc on desktop, bottom tab bar on mobile). The hotspot system was reimplemented as part of `InteractiveRoomEngine.tsx` zones.

---

# R4.0 — Room-as-UI Architecture (COMPLETED)

> **Migration:** R3.0 → R4.0 replaced the entire rendering pipeline.
> - **OLD:** Isometric 3/4 view, 6-layer CSS perspective system, 50 sprites, `RoomPerspective.tsx`, `CompactDock.tsx`, `SpriteLoader.ts`, `process_sprites.py`
> - **NEW:** Eye-level composite view, 2-layer system, 2 composite images, `InteractiveRoomEngine.tsx`, `RadialNavMenu.tsx`, `HudOverlay.tsx`, `ModuleTransition.tsx`

## ✅ R4.0-P1 — Composite Sprite Generation

- Generated `room_base.png` (924KB) — full room environment at eye-level view (target: convert to WebP for production)
- Generated `desk_zone.png` (778KB) — desk area detail for focus/module zoom (target: convert to WebP for production)
- Created `sprites.json` v3.0 — defines hotspot zones (clickable regions mapped to routes) instead of individual sprite coordinates
  - ⚠️ Note: sprites.json is reference-only — InteractiveRoomEngine hardcodes hotspot data internally
- Removed dependency on `process_sprites.py` and 50-sprite pipeline

## ✅ R4.0-P2 — InteractiveRoomEngine

- Built `InteractiveRoomEngine.tsx` — core room rendering component
- Hotspot zones: clickable regions overlaid on composite image, mapped to navigation routes
- Zoom state machine: GSAP-driven transitions between full-room view and zoomed-in desk/zone views
- Dynamic lighting: CSS filters (`brightness`/`saturate`/`hue-rotate`) applied to `.room-base` based on time of day

## ✅ R4.0-P3 — Dashboard Full Room + HUD

- Built `HudOverlay.tsx` — always-visible HUD layer with greeting, clock, quick-access info
- Refactored `page.tsx` (dashboard) to render full-room composite as primary view
- Moved `ProfileHero` functionality into Settings page
- Created `/canvas` module route for canvas-based interactions

## ✅ R4.0-P4 — FAB + Radial Menu

- Built `RadialNavMenu.tsx` — floating action button that expands into radial arc menu on desktop
- Deleted `CompactDock.tsx` (pill-shaped bottom dock)
- Preserved `Ctrl+1..6` keyboard shortcuts for quick navigation
- Mobile: bottom tab bar layout for screens <768px

## ✅ R4.0-P5 — Module Transitions

- Built `ModuleTransition.tsx` — handles animated transitions between module panels
- Updated `layout.tsx` to use 2-layer structure (`.room-base` z-0 + `.module-panel` z-30)
- Focus mode: desk zoom via GSAP + smart swap (module panel slides in over zoomed desk area)
- Enter/exit transitions with opacity + transform animations

## ✅ R4.0-P6 — CSS Overhaul

- Added new CSS classes: `.room-base`, `.room-base--dimmed`, `.room-base--focus`, `.room-hotspot`, `.module-panel`, `.fab-button`, `.radial-menu`
- Removed old 6-layer CSS (`.room-perspective`, `.room-layer-sky/bg/light/fg/widgets/ui`) completely from `globals.css`
- Consolidated duplicate definitions of `.room-glass`, `.room-glass-card`, and `.room-hotspot` into clean, single definitions
- Safely kept `.hud-item` styles inline in `HudOverlay.tsx` to maintain lightweight CSS
- Updated z-index strategy: `.room-base` z-0, `.module-panel` z-30, HUD inline z-55, `.radial-menu` z-60
- Cleaned up component imports to use new class names

## ✅ R4.0-P7 — Day/Night Adaptation

- CSS filters on `.room-base` for time-of-day lighting:
  - Morning: `brightness(1.0) saturate(1.1) hue-rotate(0deg)`
  - Afternoon: `brightness(1.05) saturate(1.0) hue-rotate(-5deg)`
  - Sunset: `brightness(0.85) saturate(1.2) hue-rotate(15deg)`
  - Night: `brightness(0.6) saturate(0.7) hue-rotate(-10deg)`
- Driven by inline `useEffect` + `new Date().getHours()` in `InteractiveRoomEngine.tsx` (dedicated `useRoomStore` NOT yet created)
- Smooth transitions between time states via CSS `transition: filter 2s ease`

## ✅ R4.0-P8 — Hover Animations + Mobile

- CSS-only hover effects on hotspot zones (subtle glow, scale, cursor change)
- Mobile responsive layout: bottom tab bar replaces radial menu on screens <768px
- Touch-friendly hotspot sizing (minimum 44×44px tap targets)
- Viewport-aware composite image scaling
- Removed legacy sprite assets (`bg/`, `fg/`, `sky/`, `raw/` directories) completely from `public/assets/rooms/home/`

---

# R5.0 — SVG Room Migration (✅ SUPERSEDED by R5.5)

> **Migration:** R4.0 → R5.0 replaces composite PNG images with inline SVG elements drawn via code.
> - **OLD (R4.0):** 2 composite PNG images (`room_base.png` 924KB + `desk_zone.png` 778KB), no per-object animation, static rendering
> - **NEW (R5.0):** Inline SVG `<g>` groups styled via CSS custom properties, per-object CSS animations, perfect scaling, ~10× smaller
>
> **Reason for migration:**
> - PNG images cannot animate individual room objects (lamp flicker, plant sway, coffee steam)
> - SVGs scale perfectly on all screen sizes (mobile, Retina, 4K) without quality loss
> - SVGs are ~10× smaller (~100KB vs ~1.7MB for 2 PNGs)
> - SVGs enable dynamic theming via CSS variables (future theme switching)
> - SVGs support interactive hover/click effects on individual objects
> - Better for future mobile app deployment (lighter, scalable)

## ✅ R5.0-P1 — Documentation Alignment

- Updated `ui_architecture.md` v4.0 → v5.0 (SVG-based rendering spec)
- Updated `AI_ENTRYPOINT.md` section 7 (SVG Room Rendering enforcement)
- Updated `.cursorrules` (SVG architecture enforcement)
- Updated `DESIGN.md` (SVG-based depth system, asset pipeline, do's/don'ts)
- Updated `current_session.md` (migration status)
- Updated `ROADMAP.md` (this file)

## ❌ R5.0-P2 — SVG Room Scene Creation

Create the SVG room scene as React components:

### R5.0-P2.1 — Create `StudyRoomSVG.tsx`

File: `frontend/src/components/room/svg/StudyRoomSVG.tsx`

- Full room scene drawn as inline `<svg>` with `viewBox="0 0 1920 1080"`
- Each room object is a `<g id="object-group">` with CSS custom property fills
- Objects: wall, floor/desk surface, window (with curtains), bookshelf (with books), desk lamp, plants (2-3), coffee mug, notebook, laptop, clock, corkboard, headphones, pens
- Style: lo-fi illustration, warm cozy colors, simplified geometric shapes
- Viewpoint: eye-level from desk (sitting perspective)
- Colors bound to `--sf-room-*` CSS variables via `fill="var(--sf-room-desk)"` etc.

### R5.0-P2.2 — Create `DeskZoneSVG.tsx`

File: `frontend/src/components/room/svg/DeskZoneSVG.tsx`

- Close-up desk scene for Focus mode
- Higher detail: notebook pages, pen details, steam rising from mug, warm lamp glow
- Same CSS variable theming as StudyRoomSVG

### R5.0-P2.3 — Create reusable SVG object components (optional)

Directory: `frontend/src/components/room/svg/objects/`

- `Desk.tsx`, `Bookshelf.tsx`, `Window.tsx`, `Lamp.tsx`, `Plants.tsx`, `DeskItems.tsx`
- Only create if the main SVG files become too large (>500 lines)

## ❌ R5.0-P3 — InteractiveRoomEngine Refactor

Update `InteractiveRoomEngine.tsx` to use SVG instead of `<img>`:

### R5.0-P3.1 — Replace `<img src="room_base.png">` with `<StudyRoomSVG />`

- Remove `<img>` tag rendering `room_base.png`
- Render `<StudyRoomSVG />` component inside `.room-base` container
- Preserve all existing functionality: zoom state machine, day/night filters, parallax

### R5.0-P3.2 — Replace `<img src="desk_zone.png">` with `<DeskZoneSVG />`

- Smart swap for Focus mode now swaps between `<StudyRoomSVG />` and `<DeskZoneSVG />`

### R5.0-P3.3 — Update hotspot system

- Replace absolute-positioned `<div>` hotspots with SVG `<rect>` elements inside the SVG scene
- Hotspot `<rect>` elements: `fill="transparent"` + `pointer-events="all"`
- Hover effects target specific SVG `<g>` groups: `filter: brightness(1.3)` on `#notebook-group`, etc.

## ❌ R5.0-P4 — CSS Animation Integration

Add per-object CSS animations to SVG elements:

### R5.0-P4.1 — Plant sway

- CSS `@keyframes` targeting `#plant-group` SVG elements
- `transform: rotate(±2°)`, 6s ease-in-out cycle
- `transform-origin` set to plant base

### R5.0-P4.2 — Lamp flicker

- CSS `@keyframes` targeting `#lamp-glow` SVG element
- `opacity: 0.85 → 1.0 → 0.9 → 1.0`, ~3s cycle
- Only active when time > 17h (night mode)

### R5.0-P4.3 — Coffee steam

- SVG `<path>` elements in `#steam-group`
- CSS animation: rise 40px + fade out, 4s stagger between 3 wisps

## ❌ R5.0-P5 — Testing & Cleanup

### R5.0-P5.1 — Visual verification

- Compare SVG room to original PNG room — should have same layout and feel
- Test on multiple screen sizes (mobile, tablet, laptop, 4K)
- Verify day/night CSS filters work on SVG container

### R5.0-P5.2 — Performance verification

- Verify FCP < 1.0s (no image download latency)
- Verify RAM ≤ 60MB
- Verify animations maintain 60fps

### R5.0-P5.3 — Cleanup

- Remove deprecated PNG files: `room_base.png`, `desk_zone.png`
- Remove `sprites.json` (hotspot data now in SVG `<rect>` elements)
- Update any remaining references to PNG files

## Verification Tests — Phase R5.0

- [ ] `StudyRoomSVG` renders full room scene with correct eye-level perspective.
- [ ] All room objects visible: wall, desk, window, bookshelf, lamp, plants, mug, notebook, laptop, clock, corkboard.
- [ ] SVG colors use `--sf-room-*` CSS variables (not hardcoded hex).
- [ ] SVG scales perfectly on mobile (375px), tablet (768px), desktop (1920px), 4K (3840px).
- [ ] Day/night CSS filters work on SVG container (`brightness`, `saturate`, `hue-rotate`).
- [ ] Hotspot clicks navigate to correct routes.
- [ ] Hover effects highlight correct SVG `<g>` groups.
- [ ] Plant sway animation plays smoothly.
- [ ] Lamp flicker animation plays at night.
- [ ] Coffee steam animation plays.
- [ ] `DeskZoneSVG` renders for Focus mode with smart swap.
- [ ] GSAP zoom transitions work on SVG container.
- [ ] Parallax mouse-tracking works on SVG container.
- [ ] FCP < 1.0s (no image download latency).
- [ ] `npm run build` passes.
- [ ] No references to `room_base.png` or `desk_zone.png` in code.

# PHASE R6-NEW — Weather Store & Settings UI (Scope reduced — Lighting/Particles moved to R5.5)

---

# R5.5 — Pixel Art Sprite Room Engine (IN PROGRESS)

> **Migration:** R5.0 (Flat SVG vectors) → R5.5 (Multi-sprite Pixel Art with depth)
> - **OLD (R5.0):** Inline SVG `<g>` groups, flat vector art, basic CSS animations
> - **NEW (R5.5):** 24 individual pixel art PNG/WebP sprites with per-object parallax, real-time lighting, continuous idle animations, particle effects, interactive hover/click
>
> **Key Decisions (Approved 2026-07-01):**
> - **24 transparent PNG sprites** (warm lofi pixel art, AI-generated)
> - **2 separate window sprites:** `window_scene_day.png` + `window_scene_night.png` (runtime swap, crossfade transition)
> - **WebP-first optimization:** Target total ≤500KB (convert PNG → WebP quality 85)
> - **Rendering:** `<img>` tags with `imageRendering: pixelated` (replaces CSS-drawn shapes)
>
> **4 Golden Rules (Non-negotiable):**
> 1. No static objects — every sprite has idle animation
> 2. Per-object parallax — each sprite has depth 0.0-1.0
> 3. Per-object lighting — light/shadow computed per sprite
> 4. Particles for life — at least 1 particle system always running

## ⬜ R5.5-P1 — Sprite Asset Creation

- Generate 24 pixel art sprites (32-bit, detailed, warm lofi style)
- Create transparent PNG sprites for each room object
- 2 window scene variants: day (trees/sky) + night (city/stars)
- Output to `public/assets/rooms/home/sprites/*.png`
- SpriteManifest.ts already exists (300 lines, 23 entries) — needs `src`/`srcNight` fields added

## ⚠️ R5.5-P2 — PixelRoomEngine Core + Per-Object Parallax — PARTIALLY DONE

- ✅ `PixelRoomEngine.tsx` (227 lines) — sky gradient, lighting overlays, vignette, sprite rendering
- ✅ `RoomSprite.tsx` (312 lines) — per-object parallax, brightness filter, click handling
- ✅ `SpriteManifest.ts` (300 lines) — 23 sprite entries with position, depth, animation config
- ✅ `useParallax.ts` (111 lines) — mouse tracking + per-depth offset with lerp smoothing
- ⬜ **NEEDS:** Replace CSS-drawn shapes → PNG `<img>` rendering
- ⬜ **NEEDS:** Add `src: string` and `srcNight?: string` to SpriteConfig interface
- ⬜ **NEEDS:** Remove `colors`, `shape`, `borderRadius` fields from SpriteConfig

## ⚠️ R5.5-P3 — Real-time Lighting System — PARTIALLY DONE

- ✅ `useTimeOfDay.ts` (97 lines) — 6 time slots, window/lamp intensity, auto-update every 60s
- ✅ Per-sprite brightness calculation in PixelRoomEngine (distance-based from lamp/window)
- ✅ Inline volumetric window light + desk lamp glow divs in PixelRoomEngine
- ⬜ **NEEDS:** `LightingLayer.tsx` Canvas implementation (currently returns null stub)
- ⬜ **NEEDS:** Move inline light divs → Canvas-based LightingLayer for better performance

## ⚠️ R5.5-P4 — Idle Animations + Particle System — PARTIALLY DONE

- ✅ `ParticleCanvas.tsx` (79 lines) — render loop, Steam + Dust running
- ✅ `SteamParticles.ts` (82 lines) — fully working, 8 particles, always active
- ✅ `DustParticles.ts` (65 lines) — fully working, 15 particles, daytime only
- ⬜ `FireflyParticles.ts` — stub (interface fixed, TODO implementation)
- ⬜ `RainParticles.ts` — stub (interface fixed, TODO implementation)
- ⬜ `StarParticles.ts` — stub (interface fixed, TODO implementation)
- ⬜ **NEEDS:** CSS `@keyframes` for 6 idle types (wobble, breathe, sway, flicker, wind, flutter)

## ⚠️ R5.5-P5 — Interaction System — PARTIALLY DONE

- ✅ Click → `router.push(clickRoute)` works
- ✅ Hotspot mapping defined in SpriteManifest (laptop→/notes, clock→/focus, bookshelf→/planning, etc.)
- ⬜ **NEEDS:** GSAP zoom-to-hotspot animation before route push
- ⬜ **NEEDS:** Hover glow CSS classes (`.room-sprite:hover`)

## Verification Tests — Phase R5.5

- [ ] 24 sprite PNG/WebP files exist in `public/assets/rooms/home/sprites/`
- [ ] Every sprite has visible idle animation (zero static objects)
- [ ] Mouse movement causes per-object parallax (each sprite moves differently)
- [ ] Desk lamp casts realtime light + shadow on nearby sprites
- [ ] Window light intensity changes with time of day
- [ ] Day/night window scene swap with smooth crossfade
- [ ] Steam particles rise from coffee mug continuously
- [ ] Color grading shifts smoothly across 6 time slots
- [ ] Hover on each interactive sprite shows glow effect
- [ ] Click on laptop navigates to /notes with GSAP zoom
- [ ] Click on bookshelf navigates to /planning
- [ ] Click on clock navigates to /focus
- [ ] Click on corkboard navigates to /tasks
- [ ] 60fps on desktop, ≥30fps on mobile
- [ ] Total sprite payload ≤500KB (WebP)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

**Goal:** Build weather stores and settings UI. Lighting system (AmbientLightLayer), weather canvas (WeatherCanvas), weather effects (Rain/Stars/Clouds/Fireflies), and enhanced CSS ambient effects have been ABSORBED into R5.5-P3 and R5.5-P4. This phase only contains: useRoomStore enhancements, useWeatherStore, and Weather Settings UI page.

> **Note:** R6-NEW.2 (AmbientLightLayer), R6-NEW.3 (WeatherCanvas), R6-NEW.4 (Weather effects), R6-NEW.6 (Enhanced CSS ambient) are now part of R5.5. Remaining scope: R6-NEW.1 (useRoomStore), R6-NEW.5 (useWeatherStore), R6-NEW.7 (Weather Settings UI).

## Tasks

### R6-NEW.1 — Create `useRoomStore.ts` enhancements (Zustand)

Create `useRoomStore.ts` with room state and weather/advanced lighting extensions:

```ts
interface RoomState {
  // Existing (from R4.0)
  currentHour: number;
  timeMode: 'auto' | 'manual';
  manualHour: number | null;

  // Advanced lighting (NEW)
  windowLightIntensity: number;  // 0.0 – 1.0
  lampOn: boolean;
  lampIntensity: number;         // 0.0 – 1.0
  warmth: number;                // 0.0 – 1.0
}
```

### R6-NEW.2 — Create `AmbientLightLayer.tsx` (overlay on `.room-base`)

Render as a `pointer-events: none` overlay above `.room-base`:

- **Volumetric window light:** `radial-gradient` with `mix-blend-mode: soft-light`, driven by `--sf-window-light-opacity`.
- **Desk lamp glow:** `radial-gradient` amber circle, driven by `--sf-lamp-opacity`.
- **3–4 ambient breathing orbs** using `room-breathe` keyframe.

> **Adaptation note:** These overlays sit on top of the SVG room scene. Position the gradients to match the window and lamp `<g>` group positions in `StudyRoomSVG.tsx`.

### R6-NEW.3 — Create `WeatherCanvas.tsx`

A single `<canvas>` element positioned absolutely inside the window region of the SVG room scene:

- Canvas sized to match the window `<g>` group bounding box in `StudyRoomSVG.tsx`.
- `requestAnimationFrame` render loop with `cancelAnimationFrame` when `document.hidden`.

> **Adaptation note:** Since the window is a `<g>` group in the SVG (not a separate image), the canvas position must be calculated from the window group's position within the SVG viewBox.

### R6-NEW.4 — Weather effects (adapted for SVG)

Implement 4 weather effects on the weather canvas:

- **`RainEffect.ts`** — ≤40 drops, streak lines + drip trails on window glass.
- **`StarsEffect.ts`** — ≤50 dots, random opacity twinkling.
- **`CloudsEffect.ts`** — 3 cloud shapes max, drifting left-to-right.
- **`FirefliesEffect.ts`** — ≤15 glow dots, random bezier paths.

### R6-NEW.5 — Create `useWeatherStore.ts` (Zustand)

```ts
interface WeatherState {
  activeEffects: Set<'rain' | 'stars' | 'clouds' | 'fireflies'>;
  autoMode: boolean;
}
```

Weather mix rules:
- ✅ Any weather + any time of day.
- ❌ Fireflies + Rain simultaneously.
- 🔄 Auto 20h–5h → enable Stars.
- 🔄 Auto 6h–18h → enable Clouds.

Persist to `localStorage`.

### R6-NEW.6 — Enhanced CSS ambient effects

Extend the CSS ambient effects from R5.0-P4 with additional detail:

- **Coffee steam** — Enhanced with more natural SVG `<path>` wisps, 3 staggered cycles.
- **Plant sway** — Extended to multiple plant groups with varied timing.
- **Lamp flicker** — Subtle random variation added via CSS `animation-delay`.

> **Note:** Basic plant sway, lamp flicker, and coffee steam are introduced in R5.0-P4. This phase enhances them with additional polish.

### R6-NEW.7 — Weather Settings UI

Add weather section in Settings page:
- 4 toggle buttons: 🌧️ Rain, ⭐ Stars, ☁️ Clouds, 🪲 Fireflies.
- Auto/Manual mode toggle.
- Live preview.

## Verification Tests — Phase R6-NEW

- [ ] Volumetric window light overlay aligns with the window `<g>` group in `StudyRoomSVG.tsx`.
- [ ] Lamp glow overlay aligns with the lamp `<g>` group in the SVG.
- [ ] Canvas element is sized exactly to the window region (not full screen).
- [ ] All 4 weather effects render correctly within the window canvas.
- [ ] Rain + Fireflies simultaneously: fireflies auto-hide.
- [ ] Auto mode: Stars enabled at 22h, Clouds enabled at 10h.
- [ ] Weather preferences persist after page refresh (localStorage).
- [ ] Switching tabs pauses Canvas (`cancelAnimationFrame`).
- [ ] Coffee steam, plant sway, lamp flicker CSS animations work.
- [ ] All particle caps enforced (40 rain / 50 stars / 15 fireflies).
- [ ] `npm run build` passes.

---

# PHASE R7-NEW — Enhanced Focus Experience

**Goal:** Build the immersive Focus mode overlay UI on top of R4.0's existing zoom + smart swap system. Basic Focus zoom into the desk area and module panel transitions are DONE (R4.0-P5). This phase adds the breathing timer, inspirational quote, bell sound, and room immersion behavior.

> **Note:** The camera/zoom engine from old R6 is already handled by `InteractiveRoomEngine.tsx` (R4.0-P2) and `ModuleTransition.tsx` (R4.0-P5). This phase focuses on the *overlay UI* and *completion ceremony*.

## Tasks

### R7-NEW.1 — Create `FocusOverlay.tsx`

File: `frontend/src/components/room/FocusOverlay.tsx`

When Focus is active (timer running), room occupies ~95% and only these UI elements show:
- **Timer** — large, centered, glassmorphism container with breathing indigo glow (CSS `box-shadow` animation, 4s cycle).
- **Quote** — below timer, `Noto Serif` italic, opacity 0.15–0.20. Changes daily from curated list of 20–30 study/curiosity quotes.
- **Mini controls** (pause/stop) — fade out after 5s of no mouse movement, reappear on hover.

### R7-NEW.2 — Focus enter/exit transitions

When Focus activates, use GSAP to:
- Fade out `.hud-item` and `.radial-menu` elements.
- `InteractiveRoomEngine.tsx` zooms into desk zone (already handled by R4.0-P5).
- Show `FocusOverlay.tsx` with delay for cinematic entry.

When Focus exits:
- Fade `FocusOverlay` out, restore HUD and RadialNavMenu.
- `InteractiveRoomEngine` returns to full room view.

### R7-NEW.3 — Timer completion ceremony

When timer reaches zero:
1. Play bell sound (`/public/sounds/bell.mp3`) via `new Audio()`.
2. Room "brightens": GSAP tween CSS filter brightness +0.3 over 1.5s.
3. Wise mascot wakes up (R8-NEW dependency — skip if not done).
4. Show companion bubble: "Pomodoro done! 🎯 Rest 5 min~"

### R7-NEW.4 — Room:UI ratio adaptation per page

| Page | Room % | UI % | Notes |
|------|--------|------|-------|
| Dashboard | ~45% | ~55% | Full room visible, module panels overlay |
| Notes | ~40% | ~60% | Desk area visible, editor center |
| Planning | ~40% | ~60% | Room visible behind planning panel |
| Insights | ~35% | ~65% | Room more muted, data-heavy UI |
| **Focus** | **~95%** | **~5%** | **Immersive, timer only** |
| Settings | ~20% | ~80% | Room very muted |

## Verification Tests — Phase R7-NEW

- [ ] Entering Focus: `InteractiveRoomEngine` zooms into desk, HUD/RadialNav fade out.
- [ ] In Focus: room occupies ~95% of screen, only timer + quote visible.
- [ ] Timer breathes with indigo glow (4s CSS animation cycle).
- [ ] Inspirational quote shows below timer in Noto Serif italic at low opacity.
- [ ] Controls fade out after 5s, reappear on hover.
- [ ] Timer completion: bell sound plays.
- [ ] Timer completion: room brightens smoothly (CSS filter transition).
- [ ] Leaving Focus: zoom out, HUD/RadialNav fade back in.
- [ ] GSAP transitions are smooth at 60fps.
- [ ] `npm run build` passes.

---

# PHASE R8-NEW — Room Widgets

**Goal:** Add interactive room objects as functional UI elements: wall clock, sticky notes, mini chalkboard. These render as HUD-layer elements positioned to align with the SVG room scene `<g>` groups.

**Technology:** CSS + React DOM components styled to look like room objects. NO Canvas, NO external libraries.

## Tasks

### R8-NEW.1 — Create `WallClock.tsx`

File: `frontend/src/components/room/widgets/WallClock.tsx`

- Positioned as a `.hud-item` element (z-index: 50), aligned with the `#clock-group` in the SVG room scene.
- Size: ~45×45px.
- Renders circular clock face with CSS `transform: rotate()` for hour/minute hands.
- Updates every 60 seconds via `setInterval`.
- Styled as warm wooden wall clock matching room palette.

### R8-NEW.2 — Create `StickyNotes.tsx`

File: `frontend/src/components/room/widgets/StickyNotes.tsx`

- 2–3 pastel sticky notes positioned near the wall area in the SVG room scene.
- Content: truncated text from top 2–3 daily reminders (from `useTaskStore`).
- Hover: slight tilt (1–2°) + shadow lift.
- Click: expand to glassmorphism popover with full text.
- Colors from `--sf-glow-*` palette.

### R8-NEW.3 — Create `MiniChalkboard.tsx`

File: `frontend/src/components/room/widgets/MiniChalkboard.tsx`

- Small chalkboard positioned on wall area. Size: ~60×40px.
- Displays streak count in chalk-like font ("🔥 X days" from `useGamificationStore`).
- Placeholder "🔥 —" if R9-NEW is not yet complete.

### R8-NEW.4 — Integrate widgets into HUD layer

Add all three widgets as `.hud-item` elements in the 2-layer system (z-index: 50). Widgets should look like natural parts of the room while being interactive.

## Verification Tests — Phase R8-NEW

- [ ] Wall clock shows correct current time (hour/minute hands).
- [ ] Clock updates every minute.
- [ ] Sticky notes visible with pastel colors, hovering tilts with shadow lift.
- [ ] Clicking sticky note expands to glassmorphism popover.
- [ ] Mini chalkboard displays streak count (or placeholder).
- [ ] Widgets look like natural room objects, not floating UI panels.
- [ ] Widgets don't block main module panel interaction.
- [ ] `npm run build` passes.

---

# PHASE R9-NEW — Mascot "Wise" Owl (Lottie)

**Goal:** Add the Lottie-animated owl mascot "Wise" with 3 emotion states, time-based greetings, companion notification bubbles with anti-spam rules, and per-page emotion behavior. Create `useCompanionStore.ts`.

**Technology:** **lottie-react** (~50KB) for vector animations. Glassmorphism for companion bubbles. NO other animation libraries.

## Tasks

### R9-NEW.1 — Obtain/create Lottie animation files

Source 3 Lottie JSON files:
- `mascot_happy.json` — wave, light jump (~20–50KB)
- `mascot_reading.json` — reading book, page flip (~20–50KB)
- `mascot_sleepy.json` — yawn, head nod (~20–50KB)

Save to `/public/assets/mascot/`.

### R9-NEW.2 — Create `MascotWise.tsx`

File: `frontend/src/components/room/mascot/MascotWise.tsx`

- Position: `fixed`, bottom-right, sitting on desk edge.
- Size: 40–48px.
- z-index: 55 (above `.hud-item` z-50, below `.radial-menu` z-60).
- Loads appropriate Lottie JSON based on `emotion` from `useCompanionStore`.

### R9-NEW.3 — Create `useCompanionStore.ts` (Zustand)

File: `frontend/src/store/useCompanionStore.ts`

```ts
interface CompanionState {
  emotion: 'happy' | 'reading' | 'sleepy';
  lastGreetingDate: string | null;
  lastBubbleTime: number;
  bubbleCount: number;
  currentBubble: BubbleData | null;
}
```

**Anti-spam rules (MANDATORY) in `showBubble()`:**

| Rule | Value |
|------|-------|
| Cooldown between bubbles | ≥ 15 minutes |
| Max bubbles/day | 8–10 (excluding quick toasts) |
| During Focus mode | NO notifications (except timer end) |
| User dismisses bubble | Remember; reduce frequency 20% |
| 23h–7h | Only show if user actively opens app |
| User typing/reading | Wait 5s after user stops before popping |
| First app open of day | ALWAYS show greeting (1 time) |

### R9-NEW.4 — Create `CompanionBubble.tsx`

File: `frontend/src/components/room/mascot/CompanionBubble.tsx`

- Speech bubble above Wise, glassmorphism card with Caveat font.
- Entry: slide-in from right (300ms).
- Click → dismiss.

### R9-NEW.5 — Greeting system

File: `frontend/src/lib/companion/greetings.ts`

Greeting messages by time (Vietnamese-English mix):

| Time | Example Greetings |
|------|-------------------|
| 5–9h | "Dậy sớm ghê! ☀️", "Morning vibes! ☕" |
| 9–12h | "Buổi sáng productive! 💪" |
| 12–17h | "Chiều rồi~ ⏰ Keep going!" |
| 17–21h | "Golden hour! 🌅" |
| 21–5h | "Study night! 🌙 Mình cùng cày nào~" |

### R9-NEW.6 — Behavioral triggers

File: `frontend/src/lib/companion/triggers.ts`

V1.0 — 3 triggers only:
1. **Greeting** — first app open of the day.
2. **Task completion** — "Nice! ✅ Còn [x] nữa!"
3. **Pomodoro completion** — "Pomodoro done! 🎯 Rest 5 min~"

### R9-NEW.7 — Per-page emotion behavior

| Page | Wise Emotion | Behavior |
|------|-------------|----------|
| Dashboard | 😊 Happy | Greeting on first visit |
| Notes | 📖 Reading | Reading book, page flip |
| Planning | 😊 Happy | Idle |
| Focus (timer active) | 😴 Sleepy | NO bubbles during active timer |
| Insights | 📖 Reading | Wearing glasses (V2.0 — use Reading for now) |
| Settings | — | Hidden |

## Verification Tests — Phase R9-NEW

- [ ] Wise owl appears bottom-right, sitting on desk edge (40–48px).
- [ ] Lottie animations play smoothly for all 3 states.
- [ ] First app open of day shows greeting bubble with correct time message.
- [ ] Greeting uses Caveat font.
- [ ] Second open same day does NOT re-trigger greeting.
- [ ] Task completion triggers bubble respecting anti-spam.
- [ ] Rapid task completions: only 1 bubble (15-min cooldown enforced).
- [ ] During active Focus timer: NO companion bubbles.
- [ ] Timer end: Wise shows "Pomodoro done!" bubble.
- [ ] Clicking bubble dismisses it.
- [ ] Emotion changes per page correctly.
- [ ] Wise hidden on Settings page.
- [ ] `npm run build` passes.

---

# PHASE R10-NEW — Gamification (XP + Streak + Levels)

**Goal:** Implement XP tracking, streak counting, and a 5-level progression system. Display on Dashboard via a glass card widget. Streak milestones trigger Wise comment + confetti burst. Create `useGamificationStore.ts`.

**Technology:** Zustand for state. **canvas-confetti** (~6KB) for celebration bursts. CSS animated progress bar. localStorage persistence.

## Tasks

### R10-NEW.1 — Create `useGamificationStore.ts` (Zustand)

File: `frontend/src/store/useGamificationStore.ts`

```ts
interface GamificationState {
  xp: number;
  level: number;           // 1–5
  streak: number;          // consecutive days
  lastActiveDate: string | null;
}
```

XP sources:
- Complete 1 Pomodoro (25min): **+25 XP**
- Complete 1 task: **+15 XP**
- Create note (>100 words): **+10 XP**
- Daily login streak: **+5 × streak_days** (cap +50)
- Complete ALL tasks in a day: **+50 bonus**

Level thresholds: `[0, 100, 300, 600, 1000]` → Levels 1–5.

Persist to `localStorage`.

### R10-NEW.2 — Level titles and badges

| Level | XP Required | Title | Badge |
|-------|------------|-------|-------|
| 1 | 0 | 🌱 Seedling | — |
| 2 | 100 | 📖 Beginner | — |
| 3 | 300 | ✏️ Learner | Weather: Rain unlock |
| 4 | 600 | 📚 Scholar | — |
| 5 | 1000 | 🎓 Dedicated | — |

### R10-NEW.3 — Hook XP triggers into existing stores

- `useTaskStore` → on task complete → `addXP(15, 'task')`.
- `useFocusStore` → on pomodoro complete → `addXP(25, 'pomodoro')`.
- `useNoteStore` → on note create (>100 words) → `addXP(10, 'note')`.

### R10-NEW.4 — XP/Level Dashboard widget

A `GlassCard` on the Dashboard showing:
- Current level badge + title.
- XP progress bar to next level (CSS animated, 500ms transition).
- Streak count with 🔥 icon.
- Total XP number.

### R10-NEW.5 — Streak tracking logic

- On daily first interaction: if `lastActiveDate === yesterday` → `streak++`. If gap > 1 day → `streak = 1`.
- Update `MiniChalkboard.tsx` (R8-NEW.3) to display real streak from this store.

### R10-NEW.6 — Streak milestone celebrations

- Streak 7: Wise comment "🔥 7 ngày liên tiếp! Legend!" + `canvas-confetti` burst.
- Streak 14: "🔥 2 tuần rồi! You're on fire!" + confetti.
- Streak 30: "🔥 30 ngày! Absolute beast! 🏆" + confetti.
- Level up: confetti burst + Wise excited animation.

### R10-NEW.7 — Integrate `canvas-confetti`

```typescript
import confetti from 'canvas-confetti';

function celebrateStreak() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
}
```

## Verification Tests — Phase R10-NEW

- [ ] Completing a pomodoro adds +25 XP.
- [ ] Completing a task adds +15 XP.
- [ ] Creating a note (>100 words) adds +10 XP.
- [ ] XP progress bar animates smoothly.
- [ ] Reaching Level 2 (100 XP) updates display to "📖 Beginner".
- [ ] Streak increments on consecutive daily use.
- [ ] Missing a day resets streak to 1.
- [ ] Streak 7 triggers Wise comment + confetti burst.
- [ ] MiniChalkboard (R7-NEW) displays correct streak number.
- [ ] Level and XP persist after page refresh (localStorage).
- [ ] `canvas-confetti` bursts render and disappear after ~1.5s.
- [ ] `npm run build` passes.

---

# V1.0 COMPLETION CHECKLIST

When ALL V1.0 phases (R0 + R4.0-P1–P8 + R5.0-P1–P5 + R6-NEW–R10-NEW) are done, verify the full experience end-to-end:

- [ ] **Immersion Test:** Hide all module panels → user feels they are *sitting at* their study desk, NOT looking at a flat image.
- [ ] **2-Layer System:** `.room-base` (z-0) renders inline SVG scene correctly with CSS variable theming, `.module-panel` (z-30) overlays with proper glassmorphism.
- [ ] **GSAP Zoom Transitions:** Hotspot clicks trigger smooth GSAP zoom on SVG container.
- [ ] **SVG Scaling:** Room SVG renders perfectly on mobile (375px), tablet (768px), desktop (1920px), 4K (3840px).
- [ ] **FAB + Radial Navigation:** Desktop radial arc menu works, mobile bottom tab bar works (<768px), `Ctrl+1..6` shortcuts work.
- [ ] **Room composition:** 8+ distinct color tones visible (wood browns, plant greens, book reds/blues, lamp amber, cream paper, terracotta mug, sky blues, curtain rose).
- [ ] **Day/Night:** CSS filter adaptation smooth across time of day — no hard scene cuts.
- [ ] **Weather:** Rain, Stars, Clouds, Fireflies — all contained within window canvas region.
- [ ] **Ambient:** Coffee steam, plant sway, lamp flicker — CSS animations on SVG `<g>` groups.
- [ ] **Focus immersive:** Room ~95%, timer breathing glow, quote, bell sound, controls auto-fade.
- [ ] **HUD Overlay:** Greeting, clock, profile info always visible and non-intrusive.
- [ ] **Wise mascot:** 3 Lottie states, greeting system, anti-spam bubbles, per-page emotion.
- [ ] **Room widgets:** Wall clock (real time), sticky notes (reminders), chalkboard (streak).
- [ ] **Gamification:** XP, streak, levels 1–5, confetti celebrations.
- [ ] **Performance:** GPU idle ≤3%, particles capped, Canvas paused when tab hidden.
- [ ] **Build:** `npm run build` passes without errors.
- [ ] **No regressions:** All existing features (Notes, Tasks, Planning, Insights, Settings, Auth) work correctly.

---

# V2.0 — FUTURE ENHANCEMENTS

> These features are designed and documented in `ui_architecture.md` but are NOT part of V1.0. Only start after V1.0 is stable.

- **Room Theme System:** 7 additional switchable themes (Café, Cabin, City, Library, Beach, Nature, Space) with theme picker, CSS variable swapping, and per-theme composite images/desk items.
- **Extended Weather Effects:** Snow, Fog, Falling Leaves, Thunder (auto-enables Rain), intensity control, advanced weather conflict rules.
- **Full Mascot Emotion System:** 3 additional emotions (Excited, Thinking, Missing), idle detection, return-after-absence reactions, day-of-week messages, deadline proximity warnings.
- **Ambient Sound Mixer:** Web Audio API mixer with individual volume channels, presets (Café, Rainy Night, Mountain), theme-linked sound suggestions.
- **Level-Up Celebrations:** Golden overlay, unlock notifications for new themes/weather effects per level.
- **Advanced Gamification:** Level 6–10, daily XP caps, flashcard review XP, all-tasks-done bonus, theme/weather unlocks per level.
- **Productivity Garden:** SVG plant widget that grows with daily study time (6 growth stages).
- **Quick Mood Selector:** Daily mood check with room ambiance adaptation.
- **Study Buddy Silhouettes:** Subtle background figures during Focus mode.
- **Seasonal Decorations:** Christmas tree, Lunar New Year blossoms, date-triggered decorations.
- **Focus Mode Room Variations:** Different room atmospheres per Focus mode (darker for Deep Work, brighter for Zen).
- **Focus Decorative Details:** Dust particles in lamp light, sleeping cat, confetti on all-pomodoros-done.
- **Performance Audit:** Lighthouse ≥85, 60fps audit, lazy-loading for Lottie and audio assets.
- **Responsive Design Pass:** Mobile/tablet/desktop layout adaptations, mascot repositioning, room simplification on small screens.
- **Accessibility Pass:** `aria-labels`, `prefers-reduced-motion` support, color contrast ≥4.5:1, screen reader compatibility.