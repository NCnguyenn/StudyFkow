---
name: AI StudyFlow Design System
description: Inline SVG lo-fi study room with CSS layering and modern glassmorphism
colors:
  # ─── Room Environment ───
  room-wall: "#1A1520"
  room-wall-warm: "#2A1F1A"
  room-canvas: "#0D0B14"
  room-desk: "#3A2F22"
  room-desk-highlight: "#6B5744"
  room-desk-edge: "#8B7355"
  room-bookshelf: "#4A3728"
  room-window-frame: "#5C4033"
  room-plant: "#2D5A3D"
  room-plant-light: "#4A8B5C"
  room-mug: "#C75B3A"
  room-book-warm: "#E8634A"
  room-book-cool: "#6B8CAE"
  room-paper: "#FAF6F0"
  room-lamp: "#F5A623"
  room-lamp-halo: "rgba(245,166,35,0.12)"
  room-curtain: "#8B6F6F"
  # ─── UI Glassmorphism Surfaces ───
  glass-surface-1: "#16121F"
  glass-surface-2: "#1E1A2E"
  glass-surface-3: "#2A2540"
  glass-bg: "rgba(22, 18, 36, 0.65)"
  glass-border: "rgba(255, 255, 255, 0.08)"
  # ─── Accent Colors ───
  accent-primary: "#818CF8"
  accent-ai: "#A78BFA"
  accent-success: "#6EE7B7"
  accent-highlight: "#FCD34D"
  accent-alert: "#FDA4AF"
  accent-info: "#7DD3FC"
  # ─── Pastel Glows (tags, categories, sticky notes) ───
  glow-lavender: "rgba(167, 139, 250, 0.12)"
  glow-mint: "rgba(110, 231, 183, 0.12)"
  glow-peach: "rgba(251, 191, 146, 0.12)"
  glow-sky: "rgba(125, 211, 252, 0.12)"
  glow-rose: "rgba(253, 164, 175, 0.12)"
  glow-cream: "rgba(252, 211, 77, 0.12)"
  # ─── Canvas (Light / Dark) ───
  bg-light: "#FAF6F0"
  bg-dark: "#120F16"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 600
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    maxWidth: "65–75ch"
  mono:
    fontFamily: "Fira Code, JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
  handwriting:
    fontFamily: "Caveat, cursive"
    fontWeight: "400-700"
  quote:
    fontFamily: "Noto Serif, serif"
    fontStyle: italic
    fontWeight: 400
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
motion:
  fast: "150ms ease"
  normal: "250ms ease"
  slow: "400ms ease-out"
---

# Design System: AI StudyFlow — Illustrated Study Room v5.0

## 1. Creative North Star

> **"The Cozy Study Sanctuary"**
> Opening AI StudyFlow = **stepping into your second study room**. Not looking AT a picture — SITTING INSIDE an illustrated room.

The interface renders a study room scene (large window, bookshelf, green plants, warm desk lamp, naturally cluttered desk objects) as inline SVG elements styled via CSS custom properties, overlaid with modern glassmorphism UI panels. Room objects are drawn as `<svg>` groups (`<g>`) with `id` attributes for targeted CSS styling and animation. Lighting and atmosphere change smoothly and continuously in real time — no scene cuts, no image swaps. The Focus page transforms into a near-100% immersive experience reminiscent of lofi.co.

**Key Characteristics:**

- **Spatial Volume:** Real 3D-box feeling via inline SVG room objects + CSS animations with z-index layering.
- **Glassmorphism:** Frosted glass panels (`.room-glass`, `.room-glass-card`) with backdrop-filter blur sitting "on the desk" inside the room.
- **Warm Color Register:** 8-10 natural tones — warm wood browns, organic greens, amber lamp glow, dusty curtains, sky blues — never a monochrome dark void.

---

## 2. 5 Pillars of Depth — MANDATORY

Every implementation must achieve all 5 pillars or the depth illusion breaks:

| # | Pillar | Description | Technique |
|---|--------|-------------|-----------|
| 1 | **Spatial Volume** | Room has floor-walls-ceiling forming a 3D box. Eye travels near → far. | SVG elements with CSS `z-index` layering + `perspective` transforms |
| 2 | **Parallax Depth** | Near SVG layers move faster, far SVG layers slower on mouse move / idle sway. | Lightweight JS mouse-tracking (`requestAnimationFrame`) on SVG layer groups |
| 3 | **Consistent Lighting** | Every object reacts to the SAME light source. Shadows all fall in the same direction. | CSS `filter` on SVG container + `radial-gradient` overlays |
| 4 | **Object Occlusion** | Objects overlap in correct depth order: mug in front of books, plant in front of bookshelf. | SVG element ordering (painter's algorithm) + CSS `z-index` |
| 5 | **Atmospheric Perspective** | Far objects → more faded, less contrast, slightly blurred. | `filter: blur(1-2px) saturate(0.8)` on far layers |

---

## 3. 2-Layer SVG Depth System (R5.0)

The room uses a simplified 2-layer SVG architecture. The room scene is a single inline `<svg>` with grouped elements; the UI floats above it as glassmorphism panels.

```
┌──────────────────────────────────────────────────────────┐
│  NAVIGATION                     z-index: 60              │
│  → FAB + Radial Menu                                     │
├──────────────────────────────────────────────────────────┤
│  HUD OVERLAY                    z-index: 55              │
│  → Greeting, clock, stats                                │
├──────────────────────────────────────────────────────────┤
│  Layer 1: MODULE PANEL          z-index: 30              │
│  → Glassmorphism UI panel for active module               │
│  → React DOM components with backdrop-filter              │
│  → pointer-events: auto                                  │
├──────────────────────────────────────────────────────────┤
│  Layer 0: ROOM BASE             z-index: 0               │
│  → Inline SVG scene (<svg> with grouped elements)         │
│  → Each object is a <g> group with id for CSS targeting   │
│    (wall, desk, window, bookshelf, plants, lamp, etc.)    │
│  → CSS filters for day/night (brightness, saturate,       │
│    hue-rotate) on SVG container                           │
│  → Hotspot <rect> overlays with pointer-events for nav    │
│  → GSAP zoom (scale + transformOrigin) on module enter    │
│  → When module active: dim to 0.3 opacity + 4px blur     │
└──────────────────────────────────────────────────────────┘
```

### SVG Room Structure

```html
<svg id="room-scene" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
  <g id="wall-group">…</g>
  <g id="window-group">…</g>
  <g id="bookshelf-group">…</g>
  <g id="desk-group">…</g>
  <g id="plant-group">…</g>
  <g id="lamp-group">…</g>
  <g id="desk-items-group">…</g>
  <!-- Hotspot overlays for navigation -->
  <rect id="hotspot-notes" class="room-hotspot" x="…" y="…" width="…" height="…" />
  <rect id="hotspot-planner" class="room-hotspot" x="…" y="…" width="…" height="…" />
</svg>
```

### CSS Room Layering

```css
#room-scene {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: filter 0.5s ease, opacity 0.5s ease;
}

/* Day/night via CSS filters on SVG container */
#room-scene.night {
  filter: brightness(0.6) saturate(0.8) hue-rotate(-10deg);
}

/* Dim room when module is active */
#room-scene.module-active {
  opacity: 0.3;
  filter: blur(4px);
}

.room-hotspot {
  fill: transparent;
  cursor: pointer;
  pointer-events: all;
}
```

---

## 4. Room Environment Colors

Palette derived from 5 reference images: warm wood browns, deep greens, amber lamp glow, night-sky blues, cream paper tones.

| Element | Hex | CSS Variable |
|---------|-----|-------------|
| Wall (base) | `#1A1520` | `--sf-room-wall` |
| Wall (warm variant) | `#2A1F1A` | `--sf-room-wall-warm` |
| Canvas (deepest bg) | `#0D0B14` | `--sf-room-canvas` |
| Window frame | `#5C4033` | `--sf-room-window-frame` |
| Desk surface | `#2C2318` | `--sf-room-desk` |
| Desk (highlight) | `#6B5744` | `--sf-room-desk-highlight` |
| Desk edge | `#8B7355` | `--sf-room-desk-edge` |
| Bookshelf | `#4A3728` | `--sf-room-bookshelf` |
| Plant foliage | `#2D5A3D` | `--sf-room-plant` |
| Plant (light) | `#4A8B5C` | `--sf-room-plant-light` |
| Coffee / Mug | `#C75B3A` | `--sf-room-mug` |
| Book spines (warm) | `#E8634A` | `--sf-room-book-warm` |
| Book spines (cool) | `#6B8CAE` | `--sf-room-book-cool` |
| Paper / Notebook | `#FAF6F0` | `--sf-room-paper` |
| Lamp light (center) | `#F5A623` | `--sf-room-lamp` |
| Lamp light (halo) | `rgba(245,166,35,0.12)` | `--sf-room-lamp-halo` |
| Curtain | `#8B6F6F` | `--sf-room-curtain` |

### Sky/Window Scene Colors (Smooth Gradient by Time)

| Hour | Sky Top | Sky Bottom | Atmosphere |
|------|---------|------------|------------|
| 5h (Dawn) | `#FFB6C1` | `#FFE4B5` | Soft pink-orange |
| 9h (Morning) | `#87CEEB` | `#E0F0FF` | Clear blue, white clouds |
| 14h (Noon) | `#4A90D9` | `#87CEEB` | Deep blue, bright sun |
| 17h (Sunset) | `#FF6B4A` | `#FFB347` | Golden hour |
| 20h (Twilight) | `#2D1B69` | `#4A2C8A` | Dark purple-blue, lamp turns on |
| 22h (Night) | `#0B1026` | `#1A1540` | Deep night, moon + stars |

Between keyframes → **smooth continuous HSL lerp**, no scene cuts.

---

## 5. Glassmorphism Surface Tokens

UI panels float on the desk, not in front of a backdrop.

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

| Role | Hex | CSS Variable |
|------|-----|-------------|
| Primary | `#818CF8` | `--sf-accent-primary` |
| AI / Secondary | `#A78BFA` | `--sf-accent-ai` |
| Success | `#6EE7B7` | `--sf-accent-success` |
| Highlight | `#FCD34D` | `--sf-accent-highlight` |
| Alert | `#FDA4AF` | `--sf-accent-alert` |
| Info | `#7DD3FC` | `--sf-accent-info` |

### The 10% Color Rule

The Primary Accent (`#818CF8`) is reserved for high-priority interactive elements. It must never occupy more than 10% of any screen surface to preserve the ambient room calm.

---

## 6. Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Greeting & personality | **Caveat** (handwriting) | 400-700 | Greetings, companion bubbles, sticky notes |
| Headings | **Plus Jakarta Sans** | 600-700 | Page titles, section headers |
| Body text | **Inter** | 400-500 | Content, descriptions, labels. Max line 65-75ch. |
| Timer & stats | **Fira Code** | 300-400 | Clock, numbers, code blocks |
| Quotes | **Noto Serif** italic | 400 | Focus mode quotes |

### Hierarchy

- **Display:** Plus Jakarta Sans, 600, `clamp(2rem, 5vw, 3.5rem)` — display titles, main focus stats.
- **Headline / Title:** Plus Jakarta Sans, 600, 1.25rem–1.75rem — section headers, widget cards.
- **Body:** Inter, 400, 1rem, `line-height: 1.5` — paragraph text, editor documents.
- **Label / Mono:** Fira Code, 400, 0.875rem — metadata, stats, code blocks.

---

## 7. Elevation (Physical Spatial Depth)

AI StudyFlow uses a **physical spatial depth model**, not abstract elevation numbers. Depth is defined by SVG element ordering and CSS z-index layering:

| Depth Zone | Contents | CSS / SVG Technique | Shadow Style |
|------------|----------|---------------------|-------------|
| **Room Base (SVG)** | Wall, bookshelves, window, desk, plants, lamp, desk items | Inline `<svg>` with `<g>` groups ordered by painter's algorithm (back-to-front) | SVG `filter: drop-shadow` per group |
| **Ambient Light** | Volumetric light, lamp glow | CSS `radial-gradient` overlays + `filter` on SVG container | None (overlay only) |
| **Module Panel** | Glass cards, panels, sidebar | `.room-glass` + `.room-glass-card`, `z-index: 30` | Multi-layer diagonal box-shadow simulating lamp at 45° |
| **HUD Overlay** | Greeting, clock, stats | `z-index: 55` | Light shadow |
| **Navigation** | FAB, radial menu | `z-index: 60` | Contextual shadow matching room lighting |
| **UI Overlay** | Modals, toasts, mascot bubble | `z-index: 70+` | Heavy shadow for modal lift |

### Glass Card Shadow Vocabulary

```css
/* Multi-layer box-shadow — simulates desk lamp casting angular light */
.room-glass-card {
  box-shadow:
    0 2px 4px rgba(0,0,0,0.3),      /* Contact shadow */
    0 8px 16px rgba(0,0,0,0.2),      /* Mid depth */
    0 24px 48px rgba(0,0,0,0.15),    /* Far ambient */
    8px 12px 24px rgba(0,0,0,0.1);   /* Angular lamp shadow at 45° */
}
```

### Vignette (Atmospheric Depth)

```css
.room-vignette {
  background: radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.35) 100%);
  position: fixed; inset: 0; pointer-events: none;
}
```

### Lighting Overlays

```css
/* Volumetric light from window (daytime) */
.room-light-volumetric {
  background: radial-gradient(
    ellipse at var(--sf-light-x, 50%) var(--sf-light-y, 30%),
    rgba(255, 248, 230, 0.20) 0%, transparent 60%
  );
  mix-blend-mode: soft-light;
  pointer-events: none;
}

/* Desk lamp glow (nighttime) */
.room-lamp-glow {
  background: radial-gradient(
    circle at 80% 85%,
    rgba(245, 166, 35, 0.20) 0%, transparent 50%
  );
  mix-blend-mode: soft-light;
  pointer-events: none;
}
```

---

## 8. Components

### Glass Cards

- **Structure:** Frosted glass backing using `.room-glass` class → `background: var(--sf-room-glass-bg)`, `backdrop-filter: blur(20px) saturate(150%)`.
- **Borders:** 1px `rgba(255, 255, 255, 0.08)` — separates cards from ambient background without harsh lines.
- **Hover:** `.room-glass-card` → 2px lift + indigo border glow (250ms ease).
- **Radius:** `var(--sf-radius-lg)` = 16px.

### Buttons

- **Shape:** Soft rounded corners (`--sf-radius-md: 12px` or `--sf-radius-sm: 6px`).
- **Primary:** Background `--sf-accent-primary` (#818CF8), white text. Hover → `scale(1.02)` + deeper shadow (150ms).
- **Click:** `scale(0.97)` → bounce back to 1.0 (150ms + 100ms).
- **Glass Button:** Transparent bg, `rgba(255,255,255,0.08)` border, glass blur on hover.

### Room Widgets (Functional Room Objects)

| Widget | Room Appearance | Functional Mapping |
|--------|----------------|-------------------|
| Wall Clock | CSS circles + animated hands | Real-time clock display |
| Sticky Notes | Small pastel cards on wall/desk | Daily reminders / quick tasks |
| Mini Chalkboard | Dark rectangle with chalk-style text | Streak counter |

### Sidebar

- **Style:** `.glass-sidebar` — `backdrop-blur-2xl`, semi-transparent.
- **Items:** Indicator bar expands on hover (200ms), bg tint highlight on active.

---

## 9. Ambient Effects & Animations

### CSS Ambient Effects (always running, no Canvas)

SVG elements are directly animated using CSS transforms and opacity on their `<g>` groups:

| Effect | SVG Target | Technique | Details |
|--------|-----------|----------|---------|
| 💡 Desk lamp flicker | `#lamp-glow` | `@keyframes room-flicker` | CSS `opacity: 0.85 → 1.0 → 0.9 → 1.0`, ~3s cycle |
| ☕ Coffee steam | SVG `<path>` elements in `#steam-group` | `@keyframes room-steam` | CSS transform `translateY` + `opacity` fade, 4s stagger |
| 🌿 Plant rustle | `#plant-group` | `@keyframes room-sway` | CSS `transform: rotate(±2°)`, 6s ease-in-out |
| 🌀 Ambient orbs | CSS `::before`/`::after` overlays | `@keyframes room-breathe` + `room-drift` | Blurred gradient orbs, 8s + 45/55s drift |

### Canvas 2D Weather Effects (inside window bbox ONLY)

| Effect | When | Particle Cap |
|--------|------|-------------|
| 🌧️ Rain on glass | User toggle / auto | ≤30 drops |
| ⭐ Twinkling stars | 20h–5h auto | ≤35 dots |
| ☁️ Drifting clouds | 6h–18h auto | 3 sprites |
| 🪲 Fireflies | 20h–5h, NOT during rain | ≤12 dots |

### Weather Mix Rules

- ✅ Any weather + current time of day
- ❌ Fireflies + Rain simultaneously (fireflies hide during rain)
- 🔄 20h–5h → auto-enable Stars
- 🔄 6h–18h → auto-enable Clouds

### Micro-Interactions (Hover)

| Element | Effect | Duration |
|---------|--------|----------|
| Glass card | Lift 2px + indigo border glow | 250ms ease |
| Sidebar item | Indicator bar expand + bg tint | 200ms |
| Button | Scale 1.02 + deeper shadow | 150ms |
| Sticky note (Planner) | Slight tilt 1-2° + shadow lift | 200ms |
| Book spine (Notes) | Book "pulls out" 3px | 200ms |
| Room desk items | Subtle glow | 300ms |

### Page Transitions (GSAP)

```
Enter:   fade-in + slide-up 12px, 350ms, ease-out
Cards:   stagger delay — card_1: 0ms, card_2: 60ms, card_3: 120ms…
Exit:    fade-out 200ms
Focus enter: camera zoom-out 800ms + UI fade 500ms
Focus exit:  camera zoom-in 600ms + UI fade-in 400ms
```

---

## 10. Day/Night Smooth Cycle

Everything transitions smoothly based on `new Date().getHours()` + minutes. No discrete scene switches.

### Elements That Change With Time

| Element | Mechanism |
|---------|-----------|
| Sky color (Canvas) | HSL lerp between 6 keyframes |
| Window light intensity | `--sf-window-light-opacity` transition |
| Desk lamp on/off | Fades in 17h→20h, `--sf-lamp-opacity` |
| Shadow direction | Rotate `--sf-shadow-angle` |
| Wall tone (warm/cool) | `--sf-wall-warmth` → subtle hue-rotate |
| Room saturation | `filter: saturate(var(--sf-room-saturation))` |
| Room brightness | `filter: brightness(var(--sf-room-brightness))` |
| Weather auto-suggest | Night → stars; Morning → clouds |

---

## 11. Room Composition (Layout from Seated Viewpoint)

```
┌──────────────────────────────────────────────────────────────────┐
│ WALL (warm gradient, light grain texture)                        │
│                                                                  │
│  ┌────────────┐   ┌───────────────────────────┐   ┌───────────┐ │
│  │ BOOKSHELF  │   │      LARGE WINDOW         │   │ WALL      │ │
│  │            │   │  ┌─────────────────────┐  │   │ DECOR:    │ │
│  │  (books,   │   │  │    SKY (Canvas 2D)  │  │   │ • Art     │ │
│  │   plants)  │   │  │  → clouds / stars   │  │   │ • Poster  │ │
│  │            │   │  │  → rain / fireflies │  │   │ • Clock   │ │
│  │  🌿 Ivy   │   │  └─────────────────────┘  │   │ • Sticky  │ │
│  └────────────┘   │  Wood frame + curtains     │   └───────────┘ │
│                   └───────────────────────────┘                  │
│                                                                  │
│  🪴 Plant          ☀️ VOLUMETRIC LIGHT              🪴 Plant    │
├──────────────────────────────────────────────────────────────────┤
│  WALNUT DESK SURFACE                                             │
│  📚 Book stack   ┌──────────────────────────┐   💡 DESK LAMP    │
│  📓 Notebook     │    UI GLASSMORPHISM      │   🪴 Small plant  │
│  ☕ Coffee mug   │      PANELS (content)    │   🎧 Headphones   │
│  ✏️ Pens         └──────────────────────────┘   📎 Items        │
├──────────────────────────────────────────────────────────────────┤
│  FOREGROUND DESK EDGE (oak highlight, closest to camera)         │
└──────────────────────────────────────────────────────────────────┘
```

### Room vs UI Ratio Per Page

| Page | Room % | UI % | Room Visibility |
|------|--------|------|-----------------|
| **Dashboard** | **100%** | **0%** (HUD only) | Full room visible, hotspots interactive, HUD overlay |
| Notes | ~20% | ~80% | Room zoomed to notebook, dimmed, glass panel |
| Planning | ~20% | ~80% | Room zoomed to corkboard, dimmed, glass panel |
| Insights | ~20% | ~80% | Room zoomed to bookshelf, dimmed, glass panel |
| **Focus** | **~95%** | **~5%** | **Immersive**: DeskZoneSVG swap, floating timer |
| Canvas | ~20% | ~80% | Room zoomed to laptop, dimmed, glass panel |
| Settings | ~20% | ~80% | Room zoomed to center, dimmed, glass panel |

---

## 12. Adaptive Camera System

| Mode | Camera Position | Technique |
|------|----------------|-----------|
| Normal pages | Default SVG viewBox, full room visible | Default CSS |
| Entering module | Zoom into hotspot area via GSAP `scale` + `transformOrigin` on `#room-scene` | GSAP 800ms `ease-in-out` |
| Entering Focus | Zoom-out + tilt → full room revealed via GSAP scale on SVG container | GSAP 800ms `ease-in-out` |
| Exiting Focus / module | Back to default viewBox scale | GSAP 600ms `ease-out` |

---

## 13. Companion System — "Wise" Owl

- **Personality:** Wise, warm, gently humorous. Uses "mình" (I) / "bạn" (you). Vietnamese + English mix.
- **Size:** 40–48px, fixed bottom-right on desk.
- **Tech:** Lottie animation JSON files.
- **Z-index:** 55 (above foreground, below UI overlay).

### V1.0 Emotion States

| State | Trigger | Animation |
|-------|---------|-----------|
| 😊 Happy | Greeting, task done | Wave, light jump |
| 📖 Reading | User writing / studying | Reading book, page flip |
| 😴 Sleepy | Late night (23h-5h), idle | Yawn, head nod |

### Anti-Spam Rules

| Rule | Value |
|------|-------|
| Cooldown between companion bubbles | ≥ 15 minutes |
| Max bubbles/day | 10 (excluding quick toasts) |
| During Focus mode | NO notifications (except timer end) |
| User is typing/reading | Wait until 5s pause before showing bubble |

---

## 14. Performance Budget

| Metric | Target |
|--------|--------|
| GPU usage idle | ≤3% |
| RAM | ≤80MB total |
| Additional bundle | ≤90KB (GSAP ~30KB + lottie-react ~50KB + canvas-confetti ~6KB) |
| First Contentful Paint | <1.5s |
| Weather particles | Rain ≤30, Stars ≤35, Clouds ×3, Fireflies ≤12 (total concurrent ≤40) |
| Animation properties | ONLY `transform` + `opacity` (never continuous `box-shadow`, `filter`, `background`) |
| Canvas | Pauses when `document.hidden` |

---

## 15. Asset Pipeline

- **Format:** Inline SVG — room objects are code, not image files.
- **Source:** Hand-crafted or AI-assisted SVG illustrations, themed via CSS custom properties (`fill`, `stroke`, CSS filters).
- **Structure:** `src/components/room/svg/` directory with SVG component files (e.g., `RoomScene.tsx`, `DeskGroup.tsx`, `BookshelfGroup.tsx`).
- **Bundling:** No HTTP requests for room art — SVGs are bundled with the application code.
- **Theming:** Day/night and seasonal themes applied via CSS custom properties and filters on the SVG container.
- **Mascot:** Lottie files in `/public/assets/mascot/`.

---

## 16. Do's and Don'ts

### Do's

- ✅ Use inline SVGs themed via CSS variables (`fill`, `stroke`) for all room objects.
- ✅ Use `.room-glass` and `.room-glass-card` classes for all interactive UI cards.
- ✅ Wrap display text with `text-wrap: balance`.
- ✅ Respect the companion owl's cooldown rules.
- ✅ Keep SVG complexity reasonable — use `<g>` groups for logical sections (desk, wall, window, bookshelf).
- ✅ Animate SVG elements using CSS `transform` and `opacity` only — avoid animating SVG path data.
- ✅ Animate ONLY `transform` and `opacity`.
- ✅ Use inline SVG + CSS layering for depth, not WebGL or composite images.
- ✅ Maintain 8-10 ambient tones in the room — wood browns, plant greens, brick reds, lamp ambers, sky blues.
- ✅ Pause Canvas weather animation when `document.hidden`.

### Don'ts

- ❌ Flat pure-black `#000000` or cold blue-gray dark mode voids.
- ❌ Don't use external image files for room objects — use inline SVG.
- ❌ Don't use raster images (PNG/WebP) as room base — inline SVG provides better scalability, animation support, and theme flexibility.
- ❌ Sudden hover transitions — always use smooth CSS easing curves.
- ❌ Pretty static background + floating UI = wallpaper, not a space.
- ❌ Monochrome room palette (single tone only).
- ❌ "AI-generated art" aesthetic (oversaturated neon glow).
- ❌ Heavy 3D (WebGL/Three.js) or composite images for the room — inline SVG + CSS depth is sufficient.
- ❌ Cartoon/game style — too childish, loses professionalism.
- ❌ Decorative objects obscuring UI content — study content takes priority.
- ❌ Framer Motion for room animations — use CSS-first, GSAP only for page transitions.
