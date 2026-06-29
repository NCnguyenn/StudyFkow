# 🎨 AI StudyFlow — Frontend Engineering Rules

> **Canonical Authority:** This document defines the strict engineering standards for the Next.js frontend. AI agents must comply with these rules.
> **Source of Truth:** `.cursorrules`, `AGENTS.md`, `DESIGN.md`, `.ai/architecture/ui_architecture.md`

---

## 1. NEXT.JS APP ROUTER ARCHITECTURE

- **Server Components by Default:** Use React Server Components (RSC) for data fetching and static rendering.
- **Client Components on Demand:** Only add `'use client'` when hooks (`useState`, `useEffect`), browser APIs, or event listeners are required.
- **Route Handlers:** Keep UI logic in `page.tsx` and layout logic in `layout.tsx`. Use Route Handlers (`route.ts`) strictly for Next.js BFF (Backend-For-Frontend) proxying.
- **TypeScript:** All frontend code must be TypeScript 5+. No `any` types unless explicitly justified.

---

## 2. COMPONENT ARCHITECTURE (Atomic Design)

- **Atoms:** Basic UI elements (Buttons, Inputs, Icons).
- **Molecules:** Simple combinations (Form fields with labels, stat cards).
- **Organisms:** Complex, stateful sections (FlashcardPlayer, SyncStatusIndicator, RoomScene).
- **Pages:** Route entry points that orchestrate Organisms.
- **Colocation:** Components specific to a feature live inside `features/[feature]/ui/`.
- **Room SVG Components:** SVG group components live in `src/components/room/svg/` (e.g., `RoomScene.tsx`, `DeskGroup.tsx`, `BookshelfGroup.tsx`).

---

## 3. STATE MANAGEMENT RULES

- **Global UI State:** Use **Zustand** for all client-side state (themes, active module, sidebar, room state, timer).
- **Server Data:** Use Zustand stores with `fetch` calls for data fetching and caching. This project does NOT use React Query (`@tanstack/react-query`).
- **Local State:** Use `useState`/`useReducer` for strictly localized component state (e.g., form input before submit).
- **Store Naming:** All Zustand stores follow `use[Domain]Store` convention (e.g., `useRoomStore`, `useTimerStore`, `useThemeStore`).

---

## 4. FOLDER STRUCTURE CONVENTIONS

```text
frontend/
├── app/                  # Next.js App Router
├── components/           # Shared UI components (Atoms/Molecules)
│   └── room/
│       └── svg/          # SVG room components (RoomScene, DeskGroup, etc.)
├── features/             # Vertical slices
│   └── [feature_name]/
│       ├── api/          # Fetch wrappers
│       ├── hooks/        # Custom React hooks
│       └── ui/           # Feature-specific Organisms
├── lib/                  # Utilities, Zustand stores
└── public/
    └── assets/
        └── mascot/       # Lottie animation files for "Wise" owl
```

---

## 5. DATA FETCHING STRATEGY

- **Server Components:** Fetch directly via `fetch()` with Next.js caching.
- **Client Components:** Fetch via Zustand store actions using `fetch`. Do not use `useEffect` for data fetching — encapsulate in store actions or custom hooks.
- **Offline-First / Sync Engine:** _(Planned — not yet implemented. Use direct API calls for now.)_
- **API Contracts:** Backend endpoints are defined in `backend/docs/API_CONTRACTS.md` (read-only for frontend agents).

---

## 6. PERFORMANCE RULES (General React)

- **Memoization:** Use `React.memo`, `useMemo`, and `useCallback` only when props are demonstrably causing expensive re-renders. Do not preemptively memoize everything.
- **Lazy Loading:** Use `next/dynamic` for heavy components (e.g., charts, Lottie mascot, weather canvas) that are not immediately visible.
- **Image Optimization:** Use `next/image` for any raster images. Room objects use inline SVG, not images.

---

## 7. TAILWINDCSS USAGE RULES

- **No Inline CSS:** All styling MUST use Tailwind utility classes where possible.
- **Clean Class Strings:** Use `clsx` and `tailwind-merge` (`cn()` utility) to construct dynamic class names safely.
- **Design Tokens:** Follow the configured `tailwind.config.ts` colors and spacing. Do not use arbitrary values (e.g., `w-[31px]`) unless absolutely necessary.
- **Room-Specific CSS:** Room SVG styling, `--sf-room-*` custom properties, glassmorphism classes (`.room-glass`, `.room-glass-card`), and z-index layers are defined in `globals.css`. These coexist with Tailwind — do NOT remove or replace them.

---

## 8. SVG ROOM ARCHITECTURE RULES (R5.0)

The study room is rendered as **inline SVG elements** — NOT composite PNG/WebP images.

- **SVG Structure:** A single `<svg id="room-scene" viewBox="0 0 1920 1080">` contains all room objects as `<g>` groups:
  - `#wall-group`, `#window-group`, `#bookshelf-group`, `#desk-group`, `#plant-group`, `#lamp-group`, `#desk-items-group`
- **CSS Styling:** Each `<g>` group is styled via CSS custom properties (`--sf-room-*`) using `fill` and `stroke`. No hardcoded colors on SVG elements.
- **Hotspot Navigation:** Transparent `<rect>` overlays (`class="room-hotspot"`) sit on top of room objects. Each hotspot maps to a route:

  | Room Object | Route | Hotspot ID |
  |-------------|-------|------------|
  | Notebook | `/notes` | `#hotspot-notes` |
  | Clock | `/focus` | `#hotspot-focus` |
  | Corkboard | `/tasks` | `#hotspot-planner` |
  | Laptop | `/canvas` | `#hotspot-canvas` |
  | Bookshelf | `/insights` | `#hotspot-insights` |

- **Depth:** SVG painter's algorithm (back-to-front element ordering) + CSS `z-index` on groups.
- **Day/Night:** CSS `filter` (`brightness`, `saturate`, `hue-rotate`) on the `#room-scene` container. NO image swaps or scene cuts.
- **Dim States:**
  - `.room-base--dimmed` → `opacity: 0.3; filter: blur(4px)` (module panel active)
  - `.room-base--focus` → `opacity: 0.7; filter: brightness(0.8)` (focus mode)
- **Zoom Camera:** GSAP `gsap.to()` with `scale` + `transformOrigin` for module enter/exit transitions.
- **Multi-Color Palette:** Room must use 8–10 harmonious tones (wood browns, plant greens, book reds, lamp amber, sky blues, cream). NEVER monochrome.

---

## 9. Z-INDEX STRATEGY

All layers are strictly ordered. Do not create new z-index values outside this table without architecture review.

| Layer | CSS Class / Element | z-index | Contents |
|-------|---------------------|---------|----------|
| Room Base | `.room-base` / `#room-scene` | **0** | Inline SVG scene + hotspot overlays |
| Room Hotspots | `.room-hotspot` | **5** | Transparent click targets on SVG objects |
| Room Vignette | `.room-vignette` | **6** | Atmospheric depth overlay |
| Module Panel | `.module-panel` | **30** | Glassmorphism UI panel for active module |
| HUD Overlay | `.hud-item` | **55** | Greeting, clock, quick stats |
| Navigation | `.fab-button`, `.radial-menu` | **60** | FAB + radial arc menu (desktop), bottom tab (mobile) |
| UI Overlay | Modals, toasts, mascot | **70+** | Modals, toast notifications, companion bubble |

---

## 10. FORBIDDEN TECHNOLOGIES

DO NOT install or use these packages/approaches:

| Forbidden | Reason | Alternative |
|-----------|--------|-------------|
| `three.js`, `react-three-fiber` | Heavy 3D/WebGL — overkill for 2D room | Inline SVG + CSS |
| `pixi.js` | WebGL 2D renderer — unnecessary overhead | CSS `@keyframes` on SVG |
| `framer-motion` | Conflicts with CSS-first approach | CSS `@keyframes` + GSAP |
| Composite PNG/WebP for room base | Not scalable, not themeable, no per-object interaction | Inline SVG with `<g>` groups |
| Paid APIs or paid assets | Project policy: 100% free tools/assets | Open-source or hand-crafted |
| Old 6-layer CSS perspective system | Dead architecture (`.room-layer-sky/bg/light/fg/widgets`) | 2-Layer SVG system (R5.0) |

---

## 11. PERFORMANCE BUDGET

All implementations must stay within these hard limits (sourced from `DESIGN.md` §14 and `AGENTS.md` §3):

| Metric | Target |
|--------|--------|
| **RAM** | ≤ 80 MB total |
| **GPU usage idle** | ≤ 3% |
| **First Contentful Paint** | < 1.5 s |
| **Additional bundle size** | ≤ 90 KB (GSAP ~30KB + lottie-react ~50KB + canvas-confetti ~6KB) |
| **Animation properties** | ONLY `transform`, `opacity`, `filter` — never continuous `box-shadow` or `background` |
| **Canvas** | Must pause when `document.hidden === true` |

### Weather Particle Caps

| Effect | Max Particles | When Active |
|--------|--------------|-------------|
| 🌧️ Rain | ≤ 30 | User toggle or auto |
| ⭐ Stars | ≤ 35 | 20h–5h auto |
| ☁️ Clouds | × 3 sprites | 6h–18h auto |
| 🪲 Fireflies | ≤ 12 | 20h–5h, NOT during rain |
| **Total concurrent** | **≤ 40** | All effects combined |

---

## 12. ANIMATION RULES

- **CSS `@keyframes` for decorative animations:** Plant sway, lamp flicker, coffee steam, ambient orbs — all on SVG `<g>` groups.
- **GSAP for transitions only:** Zoom-to-hotspot camera, page enter/exit, focus mode transitions.
- **Animate only:** `transform`, `opacity`, and `filter`. NEVER continuously animate `box-shadow`, `background`, or SVG path `d` data.
- **Micro-interactions:** Hover effects use CSS transitions (150–300ms ease). No JS-driven hover animations.
- **Page Transitions (GSAP):**
  - Enter: fade-in + slide-up 12px, 350ms ease-out
  - Cards: stagger delay 60ms between cards
  - Exit: fade-out 200ms
  - Focus enter: camera zoom-out 800ms + UI fade 500ms
  - Focus exit: camera zoom-in 600ms + UI fade-in 400ms

---

## 13. CSS CUSTOM PROPERTIES

- **All room colors** use `--sf-room-*` variables defined in `globals.css`. Never hardcode hex values on SVG elements.
- **Glassmorphism tokens** use `--sf-glass-*` variables (`--sf-glass-bg`, `--sf-glass-blur`, `--sf-glass-border`).
- **Accent colors** use `--sf-accent-*` variables (`--sf-accent-primary`, `--sf-accent-ai`, `--sf-accent-success`, etc.).
- **Day/Night transition:** Driven by CSS filters on the `#room-scene` container (`brightness`, `saturate`, `hue-rotate`), controlled by real-time clock via JS updating CSS custom properties.
- **KEEP existing `--sf-*` variables in `globals.css`** — only ADD new ones. Never remove or rename existing variables.

---

## 14. GLASSMORPHISM RULES

All UI panels that float above the room must use glassmorphism classes:

- **`.room-glass`** — Base glass surface: `background: var(--sf-glass-bg)`, `backdrop-filter: blur(var(--sf-glass-blur)) saturate(var(--sf-glass-saturate))`, `border: 1px solid var(--sf-glass-border)`.
- **`.room-glass-card`** — Interactive glass cards with hover lift (2px) + indigo border glow (250ms ease). Multi-layer diagonal `box-shadow` simulating desk lamp at 45°.
- **`.module-panel`** — Full module container: `backdrop-filter: blur(24px) saturate(140%)`, `border-radius: 24px`, `z-index: 30`.
- **Border:** Always 1px `rgba(255, 255, 255, 0.08)` — subtle separation without harsh lines.
- **Angular Shadows:** Glass panels cast soft diagonal box-shadows from lamp direction (~45°) for 3D depth without WebGL.

---

## 15. ZUSTAND STORE RULES

- **NEVER modify existing Zustand stores.** Only ADD new stores.
- **Naming convention:** `use[Domain]Store` (e.g., `useRoomStore`, `useTimerStore`, `useThemeStore`, `usePlannerStore`).
- **File location:** All stores live in `frontend/lib/` or `frontend/features/[feature]/`.
- **Store structure:** Each store exports a single `create()` call with typed state and actions.
- **No cross-store imports of internal state.** If stores need to communicate, use subscribe or events — never direct reads of another store's internal implementation.
- **Backend is off-limits:** Frontend agents (Antigravity) must NEVER modify backend code (FastAPI, database, API routes). Backend is Jules' domain.
