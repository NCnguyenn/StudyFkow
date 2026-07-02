# 🧠 AI StudyFlow — Current Session Memory

> **Format:** This file records the active AI engineering session context.
> It is overwritten at the START of each new session and updated throughout.
> AI agents MUST read this file at the beginning of every task.

---

## SESSION METADATA

```
Session Start : 2026-07-02T12:00:00+07:00
Last Updated  : 2026-07-02T14:15:00+07:00
Active Agent  : Antigravity
Session Focus : R5.5 Complete — Ready for R6 Weather Store + Settings UI
```

---

## CURRENT STATUS

**R5.5 (Pixel Art Sprite Room Engine) COMPLETED — successfully migrated to multi-sprite PNG/WebP pixel art engine.**

The engine now features:
1. 24 individual pixel art sprites with decoupled transform architecture and WebP optimization
2. Runtime day/night window swapping via `useTimeOfDay`
3. High-performance zero-re-render mouse parallax
4. Real-time volumetric lighting and flicker via `LightingLayer.tsx`
5. 5 environment-aware particle systems (`Steam`, `Dust`, `Rain`, `Stars`, `Fireflies`)
6. Interactive hover highlights and GSAP cinematic zoom-to-hotspot transition

### Key Decisions (Approved 2026-07-01)

| # | Decision | Details |
|---|----------|---------|
| 1 | **Sprite format:** Pixel Art PNGs | 24 individual transparent PNG files, AI-generated, warm lofi pixel art style |
| 2 | **Night window:** 2 separate sprites | `window_scene_day.png` + `window_scene_night.png`, runtime swap via `useTimeOfDay` |
| 3 | **Optimization:** WebP-first | Convert PNGs → WebP (quality 85), target total ≤500KB |
| 4 | **Rendering:** `<img>` tags | Replace CSS-drawn shapes with PNG sprite images |

---

## IMPLEMENTATION PHASES (R5.5)

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| **R5.5-P1** | Sprite Asset Creation (24 PNGs) & Manifest | ✅ **Done** | 24 transparent placeholder PNGs generated in `public/assets/rooms/home/sprites/`, `SpriteManifest.ts` refactored with `src`/`srcNight` |
| **R5.5-P2** | PixelRoomEngine Core + Parallax | ✅ **Done** | `RoomSprite.tsx` migrated to `<img>` tags (pixelated rendering). High-performance zero-re-render parallax implemented using requestAnimationFrame in `PixelRoomEngine.tsx`. Legacy fields removed. |
| **R5.5-P3** | Real-time Lighting System | ✅ **Done** | Implemented Canvas-based `LightingLayer.tsx` using game development loop patterns (`requestAnimationFrame`, delta time clamping, lerped targets, battery-saving tab visibility check). Draws dynamic volumetric window rays, warm desk lamp glow with realistic flicker, and mood vignette. Integrated into `PixelRoomEngine.tsx`. |
| **R5.5-P4** | Idle Animations + Particles | ✅ **Done** | Added 6 smooth CSS keyframes and selectors in `globals.css` (.sprite-idle-* and .anim-*). Configured `animation` optional property on `SpriteConfig` and bound dynamic values to inner sprite containers in `RoomSprite.tsx`. Implemented high-performance Firefly, Rain, and Star canvas particle systems under strict count limits, rendering based on environmental states (time of day / weather). |
| **R5.5-P5** | Interaction System (Hover/Click/Zoom) | ✅ **Done** | Added interactive hover filters (brightness + glow drop-shadow) to `RoomSprite.tsx`. Integrated cinematic GSAP zoom timeline in `PixelRoomEngine.tsx` that animates `transformOrigin` and `scale` to 2.5x with fade-in overlay before executing delayed route navigation. |
| **R6-NEW** | Weather Store + Settings UI | ⚠️ **Next** | |
| **R7-NEW** | Focus Experience | ⬜ Not started | |
| **R8-NEW** | Room Widgets | ⬜ Not started | |
| **R9-NEW** | Mascot "Wise" Owl | ⬜ Not started | |
| **R10-NEW** | Gamification (XP, Streak, Levels) | ⬜ Not started | |

---

## KEY DESIGN DECISIONS (R5.5 — Pixel Art Sprite Room Engine)

| # | Decision | Details |
|---|----------|---------|
| 1 | **Room Philosophy:** Room objects = UI elements | Each room object IS a navigation target. Click notebook → Notes, click clock → Focus, etc. |
| 2 | **Assets:** Multi-sprite Pixel Art PNGs | 24 individual transparent PNG/WebP sprites. Each sprite positioned by code via `SpriteManifest.ts`. Per-object parallax, idle animation, realtime lighting. |
| 3 | **Layer System:** 8 z-layers | Layer 0: Sky Canvas (code-drawn gradient). Layers 1-4: Sprite layers by depth. Layer 5: LightingLayer (Canvas). Layer 6: ParticleCanvas. Layer 7: HUD + `.module-panel` (z-30) + `.radial-menu` (z-60). |
| 4 | **Viewpoint:** Eye-level (ngang tầm mắt) | NOT isometric. Camera at seated position looking across the room. No ceiling visible. |
| 5 | **Navigation:** FAB + Radial Menu | Bottom-right FAB button → radial arc menu (desktop). Bottom tab bar (mobile <768px). |
| 6 | **Camera:** Zoom-to-hotspot dynamic | GSAP-driven zoom/pan to hotspot sprites. |
| 7 | **Transitions:** Slide + Scale + Blur | Room scales/translates toward sprite → room dims (opacity 0.3, blur 4px) → module panel slides in. |
| 8 | **Dashboard:** Full room 100% + HUD overlay | HUD shows greeting, time, quick stats. Room interactive with clickable sprite hotspots. |
| 9 | **Day/Night:** 2 separate window sprites | `window_scene_day.png` (6h-17h) + `window_scene_night.png` (18h-5h). Crossfade 60s transitions. |
| 10 | **Hover:** Per-sprite effects | brightness(1.2) + glow + drop-shadow. |
| 11 | **Mobile:** Bottom tab bar fallback | `<768px` → hide radial arc, show traditional bottom tabs. Room is decorative background. |
| 12 | **4 Golden Rules** | (1) No static objects — every sprite has idle animation (2) Per-object parallax (3) Per-object lighting (4) Particles for life — always running |

---

## COMPLETED PHASES (R4.0)

### ✅ Phase 1-8 — All R4.0 phases completed (Room-as-UI Architecture)

---

## ✅ R5.0 — SVG Room Migration (SUPERSEDED by R5.5)

All 5 phases completed but architecture replaced by R5.5 Pixel Art Sprite Engine.

---

## KEY FILES (R5.5)

### Core Room System
- `src/components/room/engine/PixelRoomEngine.tsx` — Main engine rendering all sprites
- `src/components/room/engine/RoomSprite.tsx` — Individual sprite component (currently CSS-drawn, will be PNG)
- `src/components/room/engine/SpriteManifest.ts` — Sprite config (position, depth, animation)
- `src/components/room/engine/LightingLayer.tsx` — Realtime lighting Canvas overlay (stub)
- `src/components/room/engine/ParticleCanvas.tsx` — Particle effects Canvas overlay (Steam+Dust working)
- `src/hooks/useParallax.ts` — Mouse parallax per-object hook (working)
- `src/hooks/useTimeOfDay.ts` — Time-based lighting parameters (working)

### Particle Systems
- `src/components/room/engine/particles/SteamParticles.ts` — ✅ Working (8 particles, always active)
- `src/components/room/engine/particles/DustParticles.ts` — ✅ Working (15 particles, daytime)
- `src/components/room/engine/particles/FireflyParticles.ts` — ⬜ Stub (night only)
- `src/components/room/engine/particles/RainParticles.ts` — ⬜ Stub (weather toggle)
- `src/components/room/engine/particles/StarParticles.ts` — ⬜ Stub (night only)

### Navigation & Layout
- `src/components/ui/RadialNavMenu.tsx` — FAB + radial arc (desktop) / bottom tab bar (mobile)
- `src/components/room/HudOverlay.tsx` — Greeting, time, quick stats overlay
- `src/components/room/ModuleTransition.tsx` — Module enter/exit transitions
- `src/app/(dashboard)/layout.tsx` — 2-layer layout structure

### Assets
- `public/assets/rooms/home/sprites/*.png` — Individual pixel art sprite files (24 transparent PNGs created)

### Styling
- `src/app/globals.css` — CSS layers, room tokens, glassmorphism, z-index map. NOTE: Sprite idle `@keyframes` NOT YET ADDED.

---

## ARCHITECTURE STATE

- **Backend:** FastAPI + PostgreSQL + JWT Auth — Stable. **Phase B1 (Bug Fixes) & Phase B2 (Full Test Coverage) completed and merged.**
- **Frontend:** Next.js App Router + Tailwind CSS v4 + TypeScript.
- **Room System:** R5.5 Pixel Art Sprite Engine — CSS-drawn shapes working, migrating to PNG sprites.
- **Stores:** Room-specific stores (`useRoomStore`, `useWeatherStore`, `useCompanionStore`, `useGamificationStore`) NOT yet created. Day/night logic in `useTimeOfDay.ts` hook.
- **Build:** Last verified `tsc --noEmit` passed.
- **Forbidden:** `framer-motion` removed from package.json (2026-07-02).

---

## SESSION NOTES & SAFETY RULES

- **Backend Safety:** UI redesign does NOT affect backend. API contracts, DB schema, auth flow remain unchanged.
- **CSS Safety:** When editing `globals.css`, preserve ALL existing `--sf-*` variables.
- **Layer System:** Multi-sprite engine (8 z-layers). `.pixel-room-engine` (z-0) + `.module-panel` (z-30). Dim states for zoom transitions.
- **Performance:** Idle animations use `transform`/`opacity` only. Particles capped per type (Steam ≤8, Rain ≤30, Dust ≤15, Fireflies ≤12, Stars ≤35).
- **Navigation:** FAB + Radial Menu (desktop). Bottom tab bar (mobile <768px). Ctrl+1..6 shortcuts active.
- **DnD Safety:** Do not modify drag-and-drop hooks.
- **Timer Safety:** Do not modify the timer/focus engine.
- **4 Golden Rules:** (1) No static objects (2) Per-object parallax (3) Per-object lighting (4) Particles for life
- **GlassCard:** Two separate components exist — `ui/GlassCard.tsx` (named export, glass-panel) and `room/GlassCard.tsx` (default export, room-glass). Both are intentional.

---

## HOW TO USE THIS FILE

**When starting a new session:**
1. Read this file first
2. Read `.ai/architecture/ui_architecture.md` for the design spec
3. Check the current implementation phase
4. Begin implementing the next phase

**When ending a session:**
- Update this file with new progress
- Mark completed phases accordingly
