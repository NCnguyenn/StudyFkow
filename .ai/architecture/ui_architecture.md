# UI/UX Architecture — Illustrated Lo-fi Study Room v5.0

> **Document Version:** 5.0
> **Last Updated:** 2026-06-27
> **Architecture:** Inline SVG Room Scene + 2-Layer System + GSAP Zoom + Hotspot Navigation + FAB/Radial Menu
> **Status:** Migrating from R4.0 (Composite PNG) → R5.0 (Inline SVG). Documentation updated. Code migration pending.

---

## Vision

Opening AI StudyFlow = **stepping into your second study room**. The interface renders an **eye-level perspective** illustration of a cozy study room (viewed as if you are sitting at the desk looking forward — desk surface, bookshelf, window, wall decor, 30+ integrated objects) with modern glassmorphism UI panels. The entire room is drawn as **inline SVG elements** directly in code — each room object (desk, bookshelf, window, lamp, plants, books, mug) is an SVG `<g>` group styled via CSS custom properties (`--sf-room-*`). This enables **per-object animations** (lamp flicker, plant sway, coffee steam), **perfect scaling** on all screen sizes (mobile, Retina, 4K), and **dynamic theming** (day/night via CSS filters, future theme switching). Room objects are **interactive hotspot zones** (click notebook → Notes, clock → Focus, corkboard → Planner, laptop → Canvas, bookshelf → Insights). Navigation uses a **FAB + Radial Menu** (bottom-right, semi-circle arc, auto-hide) on desktop and a **bottom tab bar** on mobile (<768px). Lighting and atmosphere change **smoothly via CSS filters** (`brightness`, `saturate`, `hue-rotate`) driven by real-time clock — no "scene cuts". A **zoom-to-hotspot dynamic camera** powered by GSAP provides cinematic transitions when the user navigates between modules. The Focus page transforms into a **~95% immersive** experience reminiscent of a lo-fi study stream.

### Design Inspiration

5 reference images (stored at `.ai/references/ui_inspiration/`):

| # | Style | Key Elements |
|---|-------|-------------|
| 1 | Tropical Night | Large window overlooking nature, surrounding greenery, starry sky |
| 2 | Japanese Studio | **Volumetric light** (angled sun rays), rich detail, warm tones |
| 3 | Private Library | Floor-to-ceiling glass windows, bookshelves, a quiet luxurious feel |
| 4 | Creative Night Room | Maximalist wall art, warm desk lamp, glowing laptop, cluttered-but-organized |
| 5 | Rainy Work Corner | Rain on glass, focal desk lamp light, tidy bookshelves, classic lo-fi chill |

### Target Feel

> **Lo-fi / Chill Chill** — Warm, cozy, serene. Like sitting in a real room corner late at night with a cup of coffee, listening to the rain, bathed in warm yellow lamp light. This space makes users want to OPEN THE APP just to "sit" inside it and study — not just for the features.

---

## CRITICAL DESIGN GUARDRAILS

### MANDATORY CRITERIA — "A Space, NOT a Background"

> **Depth Test:**
> If all UI panels are hidden, the user must feel like they are **SITTING INSIDE** a 3D room — NOT looking at a flat painting. When UI is visible, panels must feel like they **SIT ON THE DESK** inside the room, not float in front of a backdrop.

### NEVER DO

| # | Anti-pattern | Why It Fails |
|---|-------------|--------------|
| 1 | **Pretty static background image + floating UI in front** | = Wallpaper. User looks AT the image, doesn't SIT INSIDE the room |
| 2 | **A few small SVG/icons scattered on a dark background** | = Stickers pasted on a black wall. No spatial volume |
| 3 | **Beautiful gradient + blur + glassmorphism (no room)** | = Nice UI effects but the room is still a flat void |
| 4 | **Room visible only at edges/margins of the screen** | = Picture frame, not a space |
| 5 | **Monochrome room palette (single tone only)** | A real room has 8-10 tones: wood browns, leaf greens, brick reds, lamp ambers, sky blues |
| 6 | **"AI-generated art" aesthetic** | Oversaturated, neon glow = destroys the cozy lo-fi feel |
| 7 | **Heavy 3D (WebGL/Three.js) for everything** | Overkill, slow, battery-draining. SVG + CSS is powerful enough |
| 8 | **Cartoon/game style** | Too childish, loses professionalism |
| 9 | **Decorative objects obscuring UI content** | Study content ALWAYS takes priority #1 |

### MUST ACHIEVE — 5 Pillars of Depth (R5.0 SVG Approach)

| # | Pillar | Description | Implementation Technique |
|---|--------|-------------|--------------------------|
| 1 | **Spatial Volume** | The room has real floor-walls-ceiling, forming a 3D box. The eye "travels" from near to far. | SVG elements drawn with eye-level perspective. Wall, floor, ceiling elements use gradients and overlapping shapes to create depth |
| 2 | **Parallax Depth** | Near elements shift slightly faster when the mouse moves, adding a sense of presence | Subtle mouse-tracking on `.room-base` SVG container (`translate3d`, lerp factor 0.03, max ±8px). Optional: separate SVG `<g>` layers with different parallax speeds |
| 3 | **Consistent Lighting** | Every object reacts to the SAME light source. Shadows fall in the same direction | CSS filters (`brightness`, `saturate`, `hue-rotate`) applied uniformly to the SVG container. SVG `<filter>` elements for per-object shadows |
| 4 | **Object Occlusion** | Objects OVERLAP in correct order: mug in front of books, plant in front of bookshelf | SVG painter's algorithm (later elements drawn on top). CSS `z-index` on SVG `<g>` groups where needed |
| 5 | **Atmospheric Perspective** | Far objects → more faded, less contrast, slightly blurred | CSS `filter` on background SVG groups (far wall, bookshelf) + `opacity` reduction for distant elements |

---

## TECHNOLOGY STACK

### Principle: The Right Technology for the Right Job

Don't use a single technology for everything. Each component uses the technology **best suited** for it.

### Core Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Framework** | Next.js (App Router) | 14+ | Already in use, SSR + file routing |
| **Language** | TypeScript | 5+ | Type safety, DX |
| **Styling** | Tailwind CSS | v4 | Already in use, utility-first |
| **State** | Zustand | 4+ | Already in use, lightweight |

### Room Rendering Stack (R5.0 — Inline SVG)

| Component | Technology | Bundle Size | Rationale |
|-----------|-----------|-------------|-----------|
| **Room scene** | **Inline SVG elements** — each object is an SVG `<g>` group styled via CSS custom properties | ~50-150KB (SVG code bundled with JS) | Perfect scaling on all screens (mobile→4K). No HTTP requests for room art. Per-object animation/interaction. Dynamic theming via CSS variables |
| **Per-object animation** | **CSS `@keyframes`** on SVG `<g>` groups | 0KB (native CSS) | Plant sway (`#plant-group`), lamp flicker (`#lamp-glow`), coffee steam (`#steam-group`). GPU-accelerated `transform` + `opacity` only |
| **Depth + Parallax** | **Subtle mouse-tracking on container** (`translate3d`, ±8px) | 0KB (native JS) | No library needed. GPU-accelerated, minimal CPU |
| **Zoom + Camera** | **GSAP** `gsap.to()` with `scale` + `transformOrigin` | ~30KB minified | Smooth, interruptible zoom transitions between hotspots |
| **Lighting (day/night)** | **CSS `filter`** (`brightness`, `saturate`, `hue-rotate`) on SVG container | 0KB (native CSS) | Uniform, animatable, no extra layers. Driven by real-time clock |
| **Module panel entrance** | CSS transitions (`transform`, `opacity`) | 0KB (native CSS) | Slide-up + fade, 400ms cubic-bezier |
| **Mascot "Wise"** | **lottie-react** (or lottie-light) | ~50KB lib + ~20-50KB/animation state | Smooth vector animation at any size |
| **Confetti (celebrations)** | **canvas-confetti** | ~6KB | Lightweight, triggered only when needed |

### NPM Packages to Install

```bash
# Animation — ONLY used for zoom transitions and page transitions
npm install gsap

# Mascot
npm install lottie-react

# Celebrations
npm install canvas-confetti

# DO NOT install: pixi.js, three.js, react-three-fiber, framer-motion (for room)
```

### Performance Budget

| Metric | Target | Solution |
|--------|--------|----------|
| **GPU usage idle** | ≤3% | No `translateZ` layers, no Canvas ticker. CSS filters on inline SVG |
| **RAM** | ≤80MB total | SVG elements are DOM nodes — no large image decoding buffers |
| **Additional bundle** | ≤90KB | GSAP (~30KB) + lottie-react (~50KB) + canvas-confetti (~6KB) |
| **First Contentful Paint** | <1.5s | SVG renders instantly as part of DOM — no image download latency |
| **Weather particles** | Rain ≤30, Stars ≤35, Fireflies ≤12 (total concurrent ≤40) | Canvas 2D within window area, animate only `transform` + `opacity` |
| **Laptop battery** | No significant impact | No WebGL context, no ticker loop, no Canvas animation frame |
| **Low-end devices** | Still functional | DOM-based rendering, graceful degradation. SVG complexity kept reasonable |
| **Animation properties** | ONLY `transform` + `opacity` + `filter` | Avoid continuously animated `box-shadow`, `background`. SVG path data is static |

---

## VISUAL LAYER SYSTEM (R5.0 — 2-Layer SVG)

Replaces the old composite PNG image approach. Two primary layers + two overlay layers:

```
┌──────────────────────────────────────────────────────────────┐
│  NAVIGATION                      z-index: 60                 │
│  → FAB button + Radial arc menu (desktop ≥768px)             │
│  → Bottom tab bar (mobile <768px)                            │
│  → Keyboard shortcuts (1-6)                                  │
│  → pointer-events: auto                                      │
├──────────────────────────────────────────────────────────────┤
│  HUD OVERLAY                     z-index: 55                 │
│  → Greeting text, live clock, quick stats                    │
│  → Semi-transparent, auto-fade after 5s inactivity           │
│  → Only fully visible when on dashboard (no active module)   │
│  → pointer-events: none (pass-through)                       │
├──────────────────────────────────────────────────────────────┤
│  Layer 1: MODULE PANEL            z-index: 30                │
│  → Glassmorphism UI panel for active module                  │
│  → Only visible when a module is active (not on dashboard)   │
│  → Slide-up + fade transition on enter (400ms ease)          │
│  → Dashboard (/) and Focus (/focus) = immersive (no panel)   │
│  → 78vw × 88vh, border-radius 24px                          │
│  → pointer-events: auto (on panel surface)                   │
├──────────────────────────────────────────────────────────────┤
│  Layer 0: ROOM BASE              z-index: 0                  │
│  → Inline SVG scene (<svg> with grouped <g> elements)        │
│  →   #wall-group, #desk-group, #window-group,                │
│  →   #bookshelf-group, #lamp-group, #plant-group, etc.       │
│  → Each <g> styled via CSS custom properties (--sf-room-*)   │
│  → Per-object CSS animations (plant sway, lamp flicker, etc) │
│  → Invisible hotspot <rect> overlays for navigation          │
│  → CSS filters for day/night (brightness, saturate, hue)     │
│  → Vignette overlay for depth                                │
│  → pointer-events on hotspot zones only                      │
│  → GSAP zoom (scale + transformOrigin) on module enter       │
│  → When module active: dim to 0.3 opacity + 4px blur         │
└──────────────────────────────────────────────────────────────┘
```

### CSS Classes

```css
/* ── Layer 0: Room Base ─────────────────────────────────────── */
.room-base {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.room-base--dimmed {
  /* Applied when a non-immersive module is active — dims the room */
  opacity: 0.3;
  filter: blur(4px);
  transition: opacity 500ms ease, filter 500ms ease;
}

.room-base--focus {
  /* Applied during Focus mode — slightly dimmed but still visible */
  opacity: 0.7;
  filter: brightness(0.8);
  transition: opacity 500ms ease, filter 500ms ease;
}

.room-hotspot {
  position: absolute;
  cursor: pointer;
  z-index: 5;
  pointer-events: auto;
  /* Invisible by default, hover effects applied via JS */
}

.room-vignette {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%);
}

/* ── Layer 1: Module Panel ──────────────────────────────────── */
.module-panel {
  z-index: 30;
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  background-color: rgba(22, 18, 36, 0.70);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.45),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 0 1px rgba(255, 255, 255, 0.06);
}

/* ── HUD Overlay ──────────────────────────────────────────────────── */
/* NOTE: .hud-item CSS class is defined here as a target spec.
   Current implementation (HudOverlay.tsx) uses inline styles.
   Migrate to this class when cleaning up Phase 6. */
.hud-item {
  position: fixed;
  z-index: 55;
  pointer-events: none;
}

/* ── Navigation ─────────────────────────────────────────────── */
.fab-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 60;
}

.radial-menu {
  z-index: 60;
}
```

### Optional: Subtle Parallax on Room Base

Mouse-tracking provides a gentle "presence" effect — the room image shifts ±8px on mouse movement with smoothed lerp. This runs only on desktop and is disabled when a module panel is open.

```typescript
// Parallax — runs in InteractiveRoomEngine via useParallax() hook
// Max shift: ±8px horizontal, ±5px vertical
// Lerp factor: 0.03 (very smooth, no jitter)
// Disabled when: activeModule !== null OR window.innerWidth < 768
```

---

## ROOM COMPOSITION — Hotspot Zone Layout

### Primary Viewpoint: Eye-Level (sitting at desk)

Based on the 5 reference images, the room layout from the seated perspective:

```
┌──────────────────────────────────────────────────────────────────┐
│ WALL (warm gradient, light grain texture)                        │
│                                                                  │
│  ┌────────────┐   ┌───────────────────────────┐   ┌───────────┐ │
│  │ BOOKSHELF  │   │      LARGE WINDOW         │   │ WALL      │ │
│  │ 📚         │   │  (sky visible through      │   │ DECOR:    │ │
│  │ (hotspot:  │   │   glass, clouds/stars)     │   │ • 📌Cork- │ │
│  │  /insights)│   │                            │   │   board   │ │
│  │            │   │                            │   │  (hotspot: │ │
│  │ 🌿 Trailing│   │                            │   │   /tasks) │ │
│  │  plant     │   └───────────────────────────┘   │ • 🕐Clock  │ │
│  └────────────┘                                   │  (hotspot: │ │
│                                                   │   /focus)  │ │
│                     ☀️ LIGHT                       └───────────┘ │
│                    (CSS filter-driven)                           │
├──────────────────────────────────────────────────────────────────┤
│  WALNUT DESK SURFACE (gradient: dark → light grain)              │
│                                                                  │
│  📚 Book stack   ┌────────────────────────┐   💡 DESK LAMP      │
│  📓 Notebook     │  💻 LAPTOP             │   (amber glow)      │
│  (hotspot:       │  (hotspot: /canvas)    │   🪴 Small plant    │
│   /notes)        │                        │   🎧 Headphones     │
│  ☕ Coffee mug   └────────────────────────┘   📎 Small items    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  FOREGROUND DESK EDGE (oak highlight, closest to eye)            │
└──────────────────────────────────────────────────────────────────┘
```

### Hotspot Zone Definitions

Interactive SVG `<rect>` elements overlaid on the SVG scene. Each zone maps a room object to a route and defines hover/zoom behavior. The `<rect>` elements are transparent (`fill="transparent"`) with `pointer-events="all"`.

| Hotspot ID | Route | SVG Target `<g>` | Zoom Target (x, y, scale) | Hover Effect | Label |
|------------|-------|-------------------|--------------------------|--------------|-------|
| `notebook` | `/notes` | `#notebook-group` | 55%, 60%, 2.2× | `brighten` (CSS `filter: brightness(1.3)` on `<g>`) | Ghi chú |
| `clock` | `/focus` | `#clock-group` | 50%, 65%, 2.8× | `pulse` (CSS `box-shadow` keyframes) | Focus Timer |
| `corkboard` | `/tasks` | `#corkboard-group` | 80%, 30%, 2.0× | `glow` (CSS `filter: drop-shadow(...)`) | Kế hoạch |
| `laptop` | `/canvas` | `#laptop-group` | 42%, 62%, 2.5× | `brighten` | Canvas |
| `bookshelf` | `/insights` | `#bookshelf-group` | 20%, 40%, 1.8× | `glow` | Thống kê |

### Hover Effects (CSS on SVG `<g>` groups)

| Effect | CSS Implementation |
|--------|-------------------|
| `brighten` | `filter: brightness(1.3)` on the target SVG `<g>` group (300ms transition) |
| `pulse` | CSS `@keyframes` pulsing `filter: drop-shadow(0 0 12px rgba(245,166,35,0.4))` (1.5s cycle) |
| `glow` | `filter: drop-shadow(0 0 20px rgba(129, 140, 248, 0.25))` with 300ms transition |

### SVG Room Scene Components

| Component | Path | Purpose |
|-----------|------|---------|
| `StudyRoomSVG` | `src/components/room/svg/StudyRoomSVG.tsx` | Main SVG scene — full room with all objects as `<g>` groups |
| `DeskZoneSVG` | `src/components/room/svg/DeskZoneSVG.tsx` | Close-up desk scene for Focus mode — lamp, notebook, coffee, cozy details |

> SVG scenes are React components containing inline `<svg>` markup. All colors use CSS custom properties (`--sf-room-*`) via `fill` and `stroke` attributes set to `var(--sf-room-desk)`, etc. This enables instant theme switching and day/night adaptation.
>
> ⚠️ **Legacy assets:** `room_base.png` and `desk_zone.png` in `/public/assets/rooms/home/` are DEPRECATED and will be removed after SVG migration is complete.

---

## InteractiveRoomEngine

> Source: `frontend/src/components/room/InteractiveRoomEngine.tsx`

The core rendering component for the R5.0 "Room-as-UI" architecture. Renders the inline SVG scene, manages interactive hotspot overlays, and orchestrates GSAP zoom transitions when the user navigates between modules.

### Props

```typescript
interface InteractiveRoomEngineProps {
  /** Currently active module route, or null for dashboard (full room). */
  activeModule: string | null;
}
```

### Zoom State Machine

```
         click hotspot / route change
  ┌─────────────────────────────────────────┐
  │                                         ▼
┌──────┐  GSAP zoom-in (0.7s)   ┌──────────────┐
│ IDLE │ ──────────────────────► │ ZOOMING_IN   │
│      │                         │              │
│ Room │                         │ Scale up +   │
│ 1.0× │                         │ shift origin │
│ full │                         └──────┬───────┘
│ opacity                               │
└──┬───┘                               ▼
   ▲                          ┌──────────────┐
   │                          │   ZOOMED     │
   │  GSAP zoom-out (0.7s)    │              │
   │                          │ Room dimmed  │
   │ ◄─────────────────────── │ (0.3 opacity │
   │                          │  + blur 4px) │
   │     ┌──────────────┐     │              │
   │     │ ZOOMING_OUT  │ ◄───│ Module panel │
   │ ◄───│              │     │ visible      │
   │     └──────────────┘     └──────────────┘
   │                                 │
   │    Module→Module: zoom-out      │
   └─── 0.5s → idle → zoom-in 0.7s ─┘
        to new hotspot target
```

### GSAP Transition Details

```typescript
// Zoom-in: Dashboard → Module
gsap.to(roomImageRef.current, {
  scale: hotspot.zoomTarget.scale,           // e.g. 2.2×
  transformOrigin: `${hotspot.zoomTarget.x} ${hotspot.zoomTarget.y}`,
  duration: ZOOM_DURATION,                    // 0.7s
  ease: ZOOM_EASE,                            // 'power2.inOut'
});

// Dim overlay: fades in simultaneously
gsap.to(dimOverlayRef.current, {
  opacity: 0.7,
  duration: DIM_DURATION,                     // 0.5s
  ease: 'power2.out',
});
```

### Dynamic Lighting (CSS Filters)

The room image receives a computed CSS `filter` string based on `new Date().getHours()`:

| Time Range | Brightness | Saturation | Hue Shift | Notes |
|------------|-----------|------------|-----------|-------|
| 6h - 16h (Day) | 1.0 | 1.0 | 0° | Full daylight |
| 16h - 18h (Golden Hour) | 0.9 | 1.15 | -5° | Warm golden tones |
| 18h - 6h (Night) | 0.65 | 0.8 | +8° | Dim, cool-shifted |

When a module is active, an additional brightness reduction is applied to the dimmed room.

---

## RadialNavMenu

> Source: `frontend/src/components/ui/RadialNavMenu.tsx`

Replaces `CompactDock.tsx` as the primary navigation component.

### Desktop Layout (≥768px): FAB + Radial Arc

```
                    ╭ Home ╮
              ╭ Planner ╮   ╭ Focus ╮
         ╭ Notes ╮               ╭ Insights ╮
    ╭ Settings ╮                       ╭ Logout ╮
                    ┌─────────┐
                    │   FAB   │  ← bottom: 24px, right: 24px
                    │  ⊞ / ✕  │
                    └─────────┘
```

### Navigation Items

| # | Name | Route | Icon | Shortcut |
|---|------|-------|------|----------|
| 1 | Home | `/` | `Home` | `1` |
| 2 | Planner | `/tasks` | `CheckSquare` | `2` |
| 3 | Focus | `/focus` | `Timer` | `3` |
| 4 | Notes | `/notes` | `BookOpen` | `4` |
| 5 | Insights | `/insights` | `LineChart` | `5` |
| 6 | Settings | `/settings` | `Settings` | `6` |

### Specs

| Property | Value |
|----------|-------|
| FAB size | 48×48px |
| FAB background | `rgba(22, 18, 36, 0.80)` + `backdrop-filter: blur(16px)` |
| Arc radius | 100px from FAB center |
| Arc spread | 180° (semi-circle above FAB) |
| Item size | 40×40px |
| Open animation | GSAP stagger (50ms per item, `back.out(1.7)` ease) |
| Close animation | GSAP stagger (30ms, reverse, `power2.in`) |
| Auto-hide FAB | After 5s of mouse inactivity |
| Reveal zone | 120×120px from bottom-right corner |
| Backdrop | Full-screen, semi-transparent black (click to close) |

### Mobile Layout (<768px): Bottom Tab Bar

```
┌────────────────────────────────────────────┐
│  🏠    ✅    ⏱️    📖    📊    ⚙️          │
│ Home Planner Focus Notes Insights Settings  │
└────────────────────────────────────────────┘
```

Fixed bottom bar, 56px height, glassmorphism background, always visible. Active tab highlighted with accent color.

---

## HudOverlay

> Source: `frontend/src/components/room/HudOverlay.tsx`

Ambient heads-up display shown when on the dashboard (full room view). Provides at-a-glance information without obstructing the room.

### 4-Corner Layout

```
┌──────────────────────────────────────────────┐
│  "Chào buổi sáng! ☀️"                        │
│  Xin chào, [Name]             [Live Clock]   │
│                                T3, 26/06     │
│                                              │
│                                              │
│                                              │
│                                              │
│  🔥 7 ngày streak              📊 4/9 tasks  │
│  ⏱️ 2h 15m focus today                       │
└──────────────────────────────────────────────┘
```

### Behavior

| Property | Value |
|----------|-------|
| z-index | 55 |
| Visibility | Fully visible on dashboard (`isFullRoom=true`), hidden on modules |
| Auto-fade | After 5s of mouse inactivity → opacity 0.3 |
| Restore | On any mouse movement → opacity 1.0 |
| Transition | `opacity 600ms ease` |
| Pointer events | `none` (pass-through to room hotspots below) |

### Greeting Messages (Time-Based)

| Time Range | Greeting |
|------------|----------|
| 5h - 11h | "Chào buổi sáng! ☀️" |
| 12h - 17h | "Chào buổi chiều! ⏰" |
| 18h - 4h | "Chào buổi tối! 🌙" |

### Quick Stats

| Stat | Source | Display |
|------|--------|---------|
| Streak | `useGamificationStore` | 🔥 `{n}` ngày streak |
| Focus time | `useFocusStore` | ⏱️ `{h}h {m}m` focus today |
| Tasks | `useTaskStore` | 📊 `{done}/{total}` tasks |

---

## ModuleTransition

> Source: `frontend/src/components/room/ModuleTransition.tsx`

Wraps module content (Notes, Tasks, Insights, Settings) inside a centered glassmorphism panel with slide-up entrance animation.

### Transition Types

#### 1. Dashboard → Module (e.g. clicking notebook hotspot → Notes)

```
1. Router navigates to /notes
2. InteractiveRoomEngine: GSAP zooms room toward notebook zone (0.7s)
3. InteractiveRoomEngine: dim overlay fades in (0.5s)
4. ModuleTransition: glass panel slides up from +40px, fades to opacity 1 (400ms)
5. HudOverlay: fades out (immediate, isFullRoom becomes false)
```

#### 2. Module → Dashboard (e.g. navigating back to /)

```
1. Router navigates to /
2. ModuleTransition: panel unmounts (key changes)
3. InteractiveRoomEngine: GSAP zooms room back to scale 1.0 (0.7s)
4. InteractiveRoomEngine: dim overlay fades out (0.5s)
5. HudOverlay: fades in (isFullRoom becomes true)
```

#### 3. Module → Module (e.g. Notes → Tasks)

```
1. Router navigates to /tasks
2. Old ModuleTransition panel unmounts (key changes from '/notes' to '/tasks')
3. InteractiveRoomEngine: zoom out to 1.0 → re-zoom to corkboard target (sequential GSAP)
4. New ModuleTransition panel mounts with slide-up entrance
```

### Immersive Routes (No Panel)

| Route | Behavior |
|-------|----------|
| `/` (Dashboard) | Full room visible, HUD overlay shown, no panel |
| `/focus` | Full room visible (desk_zone swap), timer floats, no panel |

### Panel Specs

| Property | Value |
|----------|-------|
| Width | 78vw |
| Height | 88vh |
| Border radius | 24px |
| Background | `rgba(22, 18, 36, 0.70)` |
| Backdrop filter | `blur(24px) saturate(140%)` |
| Border | `1px solid rgba(255, 255, 255, 0.08)` |
| Box shadow | `0 24px 80px rgba(0,0,0,0.45), 0 8px 32px rgba(0,0,0,0.3)` |
| Enter animation | `translateY(40px) → translateY(0)`, `opacity 0 → 1`, 400ms ease |

---

## Smart Swap Strategy

For Focus mode, the inline SVG scene is swapped from the full room view to a dedicated close-up desk view:

```
Dashboard / Other modules          Focus Mode (/focus)
┌─────────────────────┐           ┌─────────────────────┐
│   <StudyRoomSVG>    │  ──swap── │   <DeskZoneSVG>     │
│   (full room)       │           │   (desk close-up)   │
│   scale: 1.0        │           │   scale: 1.0        │
│                     │           │                     │
│   Desk, window,     │           │   Desk lamp lit,    │
│   bookshelf, wall   │           │   coffee steaming,  │
│   decor all visible │           │   notebook open,    │
│                     │           │   cozy & immersive  │
└─────────────────────┘           └─────────────────────┘
```

### Swap Logic

```typescript
// In InteractiveRoomEngine:
const RoomScene = activeModule === '/focus' ? DeskZoneSVG : StudyRoomSVG;

// Transition:
// 1. GSAP scales current SVG to 0.95 + slight blur (0.3s)
// 2. SVG component swaps
// 3. GSAP scales new SVG from 1.05 to 1.0 (0.5s, ease: 'power2.out')
```

### Focus Mode UI (Immersive ~95%)

When Focus is active:
- **Room:** `<DeskZoneSVG>` fills screen, no dim overlay, night CSS filters applied
- **Timer:** Large glassmorphism timer in center (floating, breathing glow)
- **Quote:** Small italic text below timer (Noto Serif)
- **Controls:** Mini pause/stop — fade out after 5s, reappear on hover
- **Timer end:** Bell sound → room gradually brightens → celebration

---

## Mobile Responsive (<768px)

### Breakpoint Strategy

| Viewport | Room Treatment | Navigation | Module Panel |
|----------|---------------|------------|--------------|
| ≥1024px (Desktop) | Full composite, parallax active, hotspots clickable | FAB + Radial Menu | 78vw × 88vh glass panel |
| 768-1023px (Tablet) | Full composite, parallax disabled, hotspots clickable | FAB + Radial Menu (smaller) | 90vw × 90vh glass panel |
| <768px (Mobile) | Room as decorative fixed background (no hotspots) | Bottom Tab Bar (56px) | Full-screen panel, no glass effect |

### Mobile Specifics

```css
@media (max-width: 767px) {
  .room-base {
    /* Room becomes decorative only */
    pointer-events: none;
    filter: blur(2px) brightness(0.6);
  }

  .room-hotspot {
    display: none; /* Hotspots hidden on mobile */
  }

  .module-panel {
    /* Full-screen on mobile */
    width: 100vw;
    height: calc(100vh - 56px); /* account for tab bar */
    border-radius: 0;
    backdrop-filter: none;
    background-color: var(--sf-glass-surface-1);
  }

  .hud-item {
    display: none; /* HUD hidden on mobile */
  }
}
```

---

## DAY/NIGHT SMOOTH CYCLE (R4.0 — CSS Filters)

### Implementation Change from v3.1

| v3.1 (Old) | v4.0 (New) |
|------------|------------|
| Layered CSS overlays (`radial-gradient`, `mix-blend-mode`) on separate DOM layers | Single CSS `filter` string on the composite `<img>` element |
| Per-layer lighting adjustments | Uniform filter applied to entire image |
| JavaScript lerp between 6 keyframe objects | `getFilterString()` helper computes filter based on `Date.getHours()` |
| Canvas 2D sky scene within window | Sky baked into composite image; CSS filters shift its appearance |

### Filter Computation

```typescript
function getFilterString(activeModule: string | null, hour: number): string {
  const isNight = hour >= 18 || hour < 6;
  const isGoldenHour = hour >= 16 && hour < 18;

  let brightness = 1;
  let saturation = 1;
  let hueShift = 0;

  if (isNight) {
    brightness = 0.65;
    saturation = 0.8;
    hueShift = 8;
  } else if (isGoldenHour) {
    brightness = 0.9;
    saturation = 1.15;
    hueShift = -5;
  }

  // Reduce brightness further when room is dimmed for a module
  if (activeModule && activeModule !== '/focus') {
    brightness *= 0.6;
  }

  return `brightness(${brightness}) saturate(${saturation}) hue-rotate(${hueShift}deg)`;
}
```

### Elements That Change With Time

| Element | How It Changes |
|---------|----------------|
| Room composite brightness | CSS `filter: brightness(...)` — dimmer at night |
| Room composite saturation | CSS `filter: saturate(...)` — less vivid at night |
| Room composite hue | CSS `filter: hue-rotate(...)` — warmer at golden hour, cooler at night |
| HUD greeting text | Changes based on `getHours()` ranges |
| Focus mode atmosphere | Night filters applied to `<DeskZoneSVG>` for cozy immersion |

---

## COLOR PALETTE

### Room Environment Colors

Palette derived from the 5 reference images: warm wood browns, deep greens, amber lamp glow, night-sky blues, cream paper tones.

| Element | Color | Hex | CSS Variable |
|---------|-------|-----|-------------|
| Wall (base) | Warm Dark Plum | `#1A1520` | `--sf-room-wall` |
| Wall (warm variant) | Deep Mocha | `#2A1F1A` | `--sf-room-wall-warm` |
| Canvas (deepest bg) | Night Black | `#0D0B14` | `--sf-room-canvas` |
| Window frame | Warm Wood | `#5C4033` | `--sf-room-window-frame` |
| Desk surface | Rich Walnut | `#3A2F22` | `--sf-room-desk` |
| Desk (highlight) | Light Oak | `#6B5744` | `--sf-room-desk-highlight` |
| Desk edge | Warm Oak | `#8B7355` | `--sf-room-desk-edge` |
| Bookshelf | Dark Mahogany | `#4A3728` | `--sf-room-bookshelf` |
| Plant foliage | Deep Forest | `#2D5A3D` | `--sf-room-plant` |
| Plant (light) | Leaf Green | `#4A8B5C` | `--sf-room-plant-light` |
| Coffee/Mug | Terracotta | `#C75B3A` | `--sf-room-mug` |
| Book spines (warm) | Coral Red | `#E8634A` | `--sf-room-book-warm` |
| Book spines (cool) | Dusty Blue | `#6B8CAE` | `--sf-room-book-cool` |
| Paper/Notebook | Cream | `#FAF6F0` | `--sf-room-paper` |
| Lamp light (center) | Warm Amber | `#F5A623` | `--sf-room-lamp` |
| Lamp light (halo) | Soft Gold | `rgba(245,166,35,0.12)` | `--sf-room-lamp-halo` |
| Curtain | Dusty Rose | `#8B6F6F` | `--sf-room-curtain` |

### UI Surface Colors (Glassmorphism)

```css
--sf-glass-surface-1: #16121F;                          /* panels */
--sf-glass-surface-2: #1E1A2E;                          /* cards */
--sf-glass-surface-3: #2A2540;                          /* elevated */
--sf-glass-bg: rgba(22, 18, 36, 0.65);                  /* glass background */
--sf-glass-blur: 20px;                                  /* backdrop-filter blur */
--sf-glass-saturate: 150%;                               /* backdrop-filter saturate */
--sf-glass-border: rgba(255, 255, 255, 0.08);           /* subtle border */
```

### Accent Colors

| Role | Color | Hex | CSS Variable |
|------|-------|-----|-------------|
| Primary | Indigo Soft | `#818CF8` | `--sf-accent-primary` |
| AI/Secondary | Lavender | `#A78BFA` | `--sf-accent-ai` |
| Success | Mint | `#6EE7B7` | `--sf-accent-success` |
| Highlight | Amber Warm | `#FCD34D` | `--sf-accent-highlight` |
| Alert | Rose Pastel | `#FDA4AF` | `--sf-accent-alert` |
| Info | Sky Soft | `#7DD3FC` | `--sf-accent-info` |

### Pastel Glows (categories, tags, sticky notes)

```css
--sf-glow-lavender: rgba(167, 139, 250, 0.12);
--sf-glow-mint:     rgba(110, 231, 183, 0.12);
--sf-glow-peach:    rgba(251, 191, 146, 0.12);
--sf-glow-sky:      rgba(125, 211, 252, 0.12);
--sf-glow-rose:     rgba(253, 164, 175, 0.12);
--sf-glow-cream:    rgba(252, 211, 77, 0.12);
```

---

## MODULE-SPECIFIC DESIGN

### Room vs UI Ratio Per Page

| Page | Room % | UI % | Room Behavior |
|------|--------|------|---------------|
| **Dashboard** | **100%** | **0%** (HUD only) | Full room visible, hotspots interactive, HUD overlay |
| **Notes** | ~20% | ~80% | Room zoomed to notebook, dimmed, glass panel covers center |
| **Planning** | ~20% | ~80% | Room zoomed to corkboard, dimmed, glass panel covers center |
| **Insights** | ~20% | ~80% | Room zoomed to bookshelf, dimmed, glass panel covers center |
| **Focus** | **~95%** | **~5%** | `<DeskZoneSVG>` swap, immersive, only floating timer |
| **Canvas** | ~20% | ~80% | Room zoomed to laptop, dimmed, glass panel covers center |
| **Settings** | ~20% | ~80% | Room zoomed to center, dimmed, glass panel covers center |

### Dashboard — "The Room" (Full Immersion)

- **Room:** 100% visible. All hotspot zones active. HUD overlay shows greeting + stats.
- **Interaction:** Click any hotspot → zoom + navigate to that module.
- **Greeting:** Handwriting font (Caveat), HUD top-left, changes based on real time.
- **Cards:** No cards on dashboard — the room IS the interface. Navigation happens via hotspots or FAB.

### Notes — "Reading & Writing Corner"

- **Room:** Zoomed to notebook area. Room dimmed at edges.
- **Panel:** 3-column layout (Folder tree | Editor | AI sidebar).
- **Editor background:** `#FAF6F0` (cream paper feel).

### Planning — "Corkboard on Wall"

- **Room:** Zoomed to corkboard area (upper-right wall).
- **Panel:** Kanban + Calendar strip layout.
- **Task cards:** Styled as pastel sticky notes. Drag-and-drop: card lifts + deeper shadow; drop = slight bounce.

### Focus Mode — "Late Night in the Room" (IMMERSIVE)

- **Concept:** Entering Focus = room swaps to `<DeskZoneSVG>` (close-up desk), no panel.
- **Room 100%:** Desk lamp lit, coffee mug, plants, cozy atmosphere via night CSS filters.
- **UI:** Only:
  - Large timer in center (glassmorphism, breathing glow)
  - Small quote below the timer (font: Noto Serif italic)
  - Mini controls (pause/stop) — fade out after 5s, reappear on hover
- **Timer end:** Bell sound → room gradually brightens → celebration
- **Inspired by:** lofi.co — interactive illustrated room, immersive feel.

### Insights — "Data Corner"

- **Room:** Zoomed to bookshelf area (left side).
- **Panel:** Charts, stats, AI insights layout.

### Settings — "Behind the Scenes"

- **Room:** Zoomed to center, dimmed.
- **Panel:** Full settings UI.

---

## COMPANION SYSTEM — "WISE" OWL (Planned)

### Identity

- Personality: Wise, warm, gently humorous. Uses "mình" (I), calls user "bạn" (you). Natural Vietnamese + English accents.
- Size: 40-48px, fixed bottom-right on desk.
- Tech: **Lottie** animation JSON files (~20-50KB per state).
- Z-index: 55 (above room base, below radial menu).

### V1.0 Emotion States (3 states)

| State | Trigger | Animation |
|-------|---------|-----------|
| 😊 Happy | Greeting, task done, congrats | Wave, light jump |
| 📖 Reading | User writing/studying | Reading book, page flip |
| 😴 Sleepy | Late night (23h-5h), idle | Yawn, head nod |

> **V2.0:** Add 🎉 Excited, 🤔 Thinking, 😢 Missing.

### Anti-Spam Rules (MANDATORY)

| Rule | Value |
|------|-------|
| Cooldown between companion bubbles | **≥ 15 minutes** |
| Max bubbles/day | **8-10** (excluding quick toasts) |
| During Focus mode | **NO notifications** (except timer end) |
| User dismisses bubble | Remember; reduce frequency by 20% |
| 23h-7h | Only show when user actively opens app |
| User is typing/reading | DO NOT pop bubble — wait until user pauses for 5s |
| First app open of the day | ALWAYS show greeting (once) |

---

## ROOM WIDGETS (Planned)

Room objects that display live data integrated into the composite image:

| Widget | Room Object | Data Source | Rendering |
|--------|-------------|-------------|-----------|
| Wall Clock | Clock on wall | `new Date()` | CSS-animated SVG hands overlaid on hotspot bounds |
| Sticky Notes | Corkboard area | Daily reminders from task store | Small DOM elements positioned within corkboard hotspot |
| Mini Chalkboard | Wall area | Streak counter | SVG text overlay |

> These are overlaid on top of the composite image at specific coordinates, blending with the illustration.

---

## MICRO-INTERACTIONS & ANIMATIONS

### Hover Effects

| Element | Effect | Duration |
|---------|--------|----------|
| Glass card | Lift 2px + indigo border glow | 250ms ease |
| FAB button | Scale 1.08 + brighter glow | 200ms |
| Radial menu item | Scale 1.15 + tooltip label | 150ms |
| Room hotspot | Effect per type (brighten/pulse/glow) | 300ms |
| Button click | Scale 0.97 → bounce back 1.0 | 150ms+100ms |

### Page Transitions

```
Dashboard → Module:
  1. GSAP zoom room to hotspot target (0.7s, power2.inOut)
  2. Dim overlay fades in (0.5s, power2.out)
  3. Module panel slides up 40px + fades in (400ms, cubic-bezier)

Module → Dashboard:
  1. Module panel unmounts
  2. GSAP zoom room back to 1.0 (0.7s, power2.inOut)
  3. Dim overlay fades out (0.5s)

Focus enter:
  1. Room image swaps to desk_zone (0.3s crossfade)
  2. Night filters applied

Focus exit:
  1. Room image swaps back to room_base (0.3s crossfade)
  2. Filters restored to current time-of-day
```

### Task Completion Celebration

```
1. Checkbox ✓ draw animation (SVG path, 300ms)
2. Text strike-through sweep left→right (200ms)
3. Card flash green border (200ms)
4. Card shrink + slide to Done column (400ms, spring ease)
5. Quick toast "✅ Nice!" (auto-hide 3s)
6. If ALL done → confetti burst 1.5s (canvas-confetti) + Wise excited
```

---

## REACT COMPONENT ARCHITECTURE (R4.0)

### Room Components

```
components/room/
├── InteractiveRoomEngine.tsx    # Core: composite image + hotspots + GSAP zoom (hardcoded hotspot data)
├── ModuleTransition.tsx         # Glass panel wrapper with slide animation
├── HudOverlay.tsx               # Greeting, clock, stats (dashboard only, uses inline styles)
├── GlassCard.tsx                # Glassmorphism card using .room-glass classes
├── QuickToast.tsx               # Toast notification
├── RoomHotspot.tsx              # Standalone hotspot component (⚠️ currently unused — Engine has internal HotspotZone)
├── widgets/                     # [PLANNED — R7-NEW]
│   ├── WallClock.tsx            # Wall clock overlay (= real time)
│   ├── StickyNotes.tsx          # Sticky notes overlay (= daily reminders)
│   └── MiniChalkboard.tsx       # Small chalkboard (= streak counter)
├── mascot/                      # [PLANNED — R8-NEW]
│   ├── MascotWise.tsx           # Lottie mascot component
│   └── CompanionBubble.tsx      # Notification bubble
└── FocusOverlay.tsx             # [PLANNED — R6-NEW] Focus mode: timer + quote + controls

components/ui/
├── RadialNavMenu.tsx            # FAB + radial arc menu + mobile tab bar (18.8KB, 511 lines)
├── GlassCard.tsx                # ⚠️ SEPARATE from room/GlassCard — uses glass-panel/glass-lite classes
└── GlobalSearchModal.tsx        # Cmd+K search palette
```

### Zustand Stores

```
stores/                              # EXISTING
├── useAppStore.ts               # App state: isZenMode, soulColor, liteMode
├── useFocusStore.ts             # Focus/timer state, session lifecycle
├── useFreeformStore.ts          # Canvas/widget positions (12.6KB)
├── useNoteStore.ts              # Notes state (11.2KB)
├── useTaskStore.ts              # Tasks state (7.5KB)
├── useSubjectStore.ts           # Subjects state (4.9KB)
└── useEditorBlockStore.ts       # Block editor state (746B)

stores/                              # [PLANNED — NOT YET CREATED]
├── useRoomStore.ts              # Room state: current hour, lighting filter, theme
├── useWeatherStore.ts           # Weather toggles (R5-NEW)
├── useCompanionStore.ts         # Wise mascot state, notification queue (R8-NEW)
└── useGamificationStore.ts      # XP, level, streak (R9-NEW)
```

> ⚠️ **Current state:** Day/night lighting logic runs inline in `InteractiveRoomEngine.tsx` via `useEffect` + `new Date().getHours()`. The dedicated `useRoomStore` should be created when implementing R5-NEW to centralize room state.

### Integration: Layout Structure

```tsx
// (dashboard)/layout.tsx — v4.0 Room-as-UI Architecture
export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const activeModule = getActiveModule(pathname);

  return (
    <div className="flex h-screen overflow-hidden text-slate-100 relative">
      {/* Layer 0: Room Composite + Interactive Hotspots */}
      <InteractiveRoomEngine activeModule={activeModule} />

      {/* Layer 1: Module UI Panel */}
      <ModuleTransition module={activeModule ?? '/'}>
        <main className="w-full h-full overflow-y-auto overflow-x-hidden">
          <div className="h-full relative z-10">{children}</div>
        </main>
      </ModuleTransition>

      {/* Cmd+K Search Palette */}
      <GlobalSearchModal />

      {/* HUD Overlay — greeting, time, stats (dashboard only) */}
      <HudOverlay isFullRoom={activeModule === null} />

      {/* Radial Nav Menu — replaces CompactDock */}
      <RadialNavMenu />

      {/* Global Floating Chat — Second Brain */}
      <FloatingChat />
    </div>
  );
}
```

---

## ASSET PIPELINE (R5.0 — Inline SVG)

### SVG Room Creation Workflow

```
Workflow for creating study room assets (v5.0 Inline SVG):

1. DESIGN: Create SVG room scene as React component
   - Style: lo-fi illustration, warm cozy colors, simplified shapes
   - Viewpoint: EYE-LEVEL from desk (sitting perspective)
   - Lighting: warm, cozy — expressed via CSS gradients + filters
   - Components:
     a. StudyRoomSVG.tsx  (full room: wall, desk, window, bookshelf, plants, lamp, books, mug)
     b. DeskZoneSVG.tsx   (close-up desk: lamp lit, notebook, coffee, cozy immersive)

2. STRUCTURE: Organize SVG as logical <g> groups
   - Each room object = one <g id="object-group">
   - Colors = CSS custom properties (fill="var(--sf-room-desk)")
   - Interactive objects get additional hotspot <rect> overlays
   - Keep path complexity reasonable (prefer simple shapes over ultra-detailed paths)

3. ORGANIZE: SVG components in source code
   src/components/room/svg/
   ├── StudyRoomSVG.tsx     (full room scene component)
   ├── DeskZoneSVG.tsx      (focus mode desk scene component)
   ├── objects/             (reusable SVG object components)
   │   ├── Desk.tsx
   │   ├── Bookshelf.tsx
   │   ├── Window.tsx
   │   ├── Lamp.tsx
   │   ├── Plants.tsx
   │   └── DeskItems.tsx    (notebook, mug, pens, headphones)
   └── effects/             (SVG-based ambient effects)
       ├── CoffeeSteam.tsx
       └── LampGlow.tsx

4. LOAD: Instant, zero HTTP requests
   - SVG is part of the React component tree
   - Renders immediately with the DOM — no image download latency
   - ~50-150KB total SVG content (vs ~1.7MB for 2 PNG images)
   - Scales perfectly on all screen sizes without quality loss
```

### Free Resource Sources

| Source | URL | What to Get | Used For |
|--------|-----|-------------|----------|
| **SVG Editors** (⭐ Primary) | Figma, Inkscape, or hand-coded | Room SVG scenes | All room objects |
| **AI-assisted SVG** | Claude/Gemini code generation | SVG path data for complex shapes | Bookshelf, plants, desk details |
| **LottieFiles** | lottiefiles.com | Owl mascot animations | Mascot "Wise" states |
| **canvas-confetti** | npmjs.com/package/canvas-confetti | Confetti burst | Level-up, all-tasks-done |
| **Pixabay Audio** | pixabay.com/sound-effects | Bell ding, notification chime | Timer end (V2.0: ambient sounds) |
| **Google Fonts** | fonts.google.com | Caveat, Plus Jakarta Sans, Inter, Fira Code, Noto Serif | Typography |

---

## TYPOGRAPHY

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Greeting & personality | **Caveat** (handwriting) | 400-700 | HUD greetings, companion bubbles, personal touches |
| Headings | **Plus Jakarta Sans** | 600-700 | Page titles, section headers |
| Body text | **Inter** | 400-500 | Content, descriptions, labels |
| Timer & stats | **Fira Code** | 300-400 | Clock, numbers, code blocks |
| Quotes | **Noto Serif** italic | 400 | Focus mode quotes |

---

## GAMIFICATION: XP + LEVEL + STREAK (Planned)

### XP Sources (V1.0)

| Action | XP | Daily Cap |
|--------|-----|-----------|
| Complete 1 Pomodoro (25min) | +25 | Unlimited |
| Complete 1 task | +15 | Max 20 tasks/day |
| Create note (>100 words) | +10 | Max 10 notes/day |
| Daily login streak | +5 × streak_days | Max +50 (streak 10+) |
| Complete ALL tasks in a day | +50 bonus | 1/day |

### Level Progression (1-5 for V1.0)

| Level | XP Required | Title | Unlock |
|-------|------------|-------|--------|
| 1 | 0 | 🌱 Seedling | — (start) |
| 2 | 100 | 📖 Beginner | — |
| 3 | 300 | ✏️ Learner | Weather: Rain |
| 4 | 600 | 📚 Scholar | — |
| 5 | 1000 | 🎓 Dedicated | — |

> **V2.0:** Level 6-10, theme unlocking, Wise costumes.

---

## V1.0 IMPLEMENTATION SCOPE

### V1.0 Includes (R5.0 Architecture — per ROADMAP R4-NEW through R10-NEW)

- Room rendering: 2 inline SVG scenes (`<StudyRoomSVG>` + `<DeskZoneSVG>`) + GSAP zoom + CSS filters
- 1 room theme: Home Study Room
- Day/Night: CSS filter-based (brightness, saturate, hue-rotate)
- Interactive hotspot navigation (5 zones)
- FAB + Radial Menu (desktop) / Bottom Tab Bar (mobile)
- HUD Overlay: greeting, clock, stats
- ModuleTransition: glassmorphism panel with slide animation
- Smart Swap: `<StudyRoomSVG>` ↔ `<DeskZoneSVG>` for Focus mode
- Glassmorphism UI panels per module
- Focus immersive mode: `<DeskZoneSVG>` + timer + quote
- Greeting system (time-based, Vietnamese-English)
- Weather effects: Rain, Stars, Clouds, Fireflies (Canvas 2D within window area) — R6-NEW
- Ambient effects: Coffee steam, plant sway, lamp flicker (CSS keyframes) — R6-NEW
- Ambient sound mixer (Web Audio API) — R7-NEW
- Room Widgets: wall clock, sticky notes, chalkboard — R8-NEW
- Mascot "Wise" (Lottie, 3 emotion states) — R9-NEW
- Gamification: XP + Streak + Level 1-5 — R10-NEW
- Notification system (Toast, Bubble, Celebration) — R10-NEW

### V2.0 (Future)

- 7 additional room themes (Café, Cabin, City, Library, Beach, Nature, Space)
- Level-up celebrations, theme unlocking
- Mascot "Wise" expanded emotions (🎉 Excited, 🤔 Thinking, 😢 Missing)
- Full responsive + accessibility pass

---

## VISUAL REFERENCES

| Reference | URL | What to Learn |
|-----------|-----|---------------|
| **Lofi.co** (⭐ Gold standard) | lofi.co | Interactive illustrated room, day/night, weather, clickable objects |
| **Google Magenta Lofi Player** | github.com/magenta/lofi-player | SVG room layering, component decomposition |
| **Pomofocus** | pomofocus.io | Clean pomodoro UI balance |
| **Lofi Study (React)** | github.com/Divya2163/lofi-study | React + Tailwind lo-fi study app |
| **Lofi Focus** | github.com/henriquepx/lofi | React lofi with pomodoro |

> We are NOT cloning lofi.co. Our app has MANY more features (Notes, Planner, AI, Canvas). The room is a CONTEXT WRAPPER, not the primary content. Use references for visual quality inspiration only.

---

## CSS IMPLEMENTATION RULES

1. All theme colors MUST use CSS Custom Properties with the `--sf-` prefix (e.g., `--sf-room-wall`, `--sf-glass-bg`).
2. DO NOT hardcode colors in Tailwind classes or inline styles for theme-dependent values.
3. SVG room components → `src/components/room/svg/`. NO image files for room rendering.
4. Sound files → `/public/sounds/` (V2.0).
5. Lottie mascot files → `/public/assets/mascot/`.
6. Animations prioritize CSS-first on SVG `<g>` groups. GSAP only for zoom transitions. Framer Motion NOT used for room.
7. SVG elements MUST use CSS custom properties for `fill` and `stroke` (e.g., `fill: var(--sf-room-desk)`).
8. Room animations ONLY animate `transform`, `opacity`, and `filter`. DO NOT continuously animate SVG path data or `box-shadow`.
9. Hotspot zones use `pointer-events: auto` on individual SVG `<rect>` elements, NOT on the entire SVG scene.
10. Mobile (<768px) disables hotspots, parallax, and HUD — uses bottom tab bar for navigation.
11. Keep SVG complexity reasonable — use `<g>` groups for logical sections. Prefer simple geometric shapes over ultra-detailed paths.

---

## DECISION LOG

| # | Decision | Rationale | Alternatives Considered |
|---|---------|-----------|------------------------|
| 1 | **Inline SVG** (not composite PNG images) | Per-object animation support (lamp flicker, plant sway). Perfect scaling on all screens (mobile→4K). ~10× smaller file size (~100KB vs ~1.7MB). Dynamic theming via CSS variables. No HTTP requests for room art | 2 composite PNGs (no animation, large files, no per-object interaction), 50 individual sprites (complex), PixiJS (heavy) |
| 2 | **Eye-level perspective** (not isometric 3/4) | Feels more intimate — like actually sitting at the desk. Matches the "sitting inside" depth test | Isometric 3/4 (more panoramic but less immersive), top-down (no depth) |
| 3 | **GSAP zoom** (not CSS perspective + translateZ) | Simpler, more reliable zoom-to-hotspot transitions. No need for 6-layer perspective management | CSS perspective (complex, fragile), CSS transform (less smooth) |
| 4 | **CSS filters for day/night** (not layered overlays) | Single uniform filter on the SVG container. No extra DOM layers for lighting | Separate gradient overlays (extra DOM, complex stacking), Canvas (heavy) |
| 5 | **FAB + Radial Menu** (not Compact Dock) | Less screen real estate used. Auto-hides completely. More visually interesting. Keyboard shortcuts for power users | CompactDock (always visible, takes space), Sidebar (breaks room) |
| 6 | **SVG hotspot `<rect>`** (not image map or sprite click targets) | Transparent SVG rectangles overlaid on scene objects. Can target specific `<g>` groups for hover effects | Image map (inflexible), per-sprite events (requires individual sprites) |
| 7 | **Separate DeskZoneSVG for Focus** (not zoom on same SVG) | Dedicated SVG scene for desk close-up provides higher detail and unique ambient effects (steam, cozy lighting) | Zoom main SVG (loses detail at 2.8×), CSS viewBox crop (limited) |
| 8 | **ModuleTransition glass panel** (not full-page modules) | Room stays visible (dimmed) behind the panel, maintaining spatial context | Full-page modules (lose room context), sidebar layout (breaks room) |
| 9 | **HUD Overlay** (not embedded in room) | Floating, auto-fading HUD keeps the room clean. Stats visible at a glance | Stats in room objects (hard to read), permanent overlay (clutters) |
| 10 | Room applied across entire app (not just Focus) | Consistent identity. User stays in one familiar space | Room only in Focus (inconsistent) |
| 11 | Default = Home Study Room | Most familiar to students | Café (cool but not "home") |
| 12 | Vietnamese-English mix for companion | Natural for Gen Z Vietnamese users | Full Vietnamese (stiff), Full English (unfamiliar) |
| 13 | ALL 100% free tools/assets | Students = low budget, self-hosted | Paid APIs (cost, dependency) |
| 14 | **Interactive hotspot objects** | Clicking room objects (notebook→Notes, clock→Focus, corkboard→Planner, laptop→Canvas, bookshelf→Insights) increases immersion | Text-only nav (lacks room feel), no object interaction (wasted opportunity) |
| 15 | **SVG over PNG** (R5.0 migration) | PNG composite cannot animate individual objects. SVG enables plant sway, lamp flicker, coffee steam, hover glow effects. Future mobile app deployment benefits from smaller + scalable SVG | Keeping PNG (no animation, 1.7MB, no per-object interaction) |
