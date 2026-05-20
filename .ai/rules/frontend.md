# 🎨 AI StudyFlow — Frontend Engineering Rules

> **Canonical Authority:** This document defines the strict engineering standards for the Next.js frontend. AI agents must comply with these rules.

## 1. NEXT.JS APP ROUTER ARCHITECTURE
- **Server Components by Default:** Use React Server Components (RSC) for data fetching and static rendering.
- **Client Components on Demand:** Only add `'use client'` when hooks (`useState`, `useEffect`), browser APIs, or event listeners are required.
- **Route Handlers:** Keep UI logic in `page.tsx` and layout logic in `layout.tsx`. Use Route Handlers (`route.ts`) strictly for Next.js BFF (Backend-For-Frontend) proxying.

## 2. COMPONENT ARCHITECTURE (Atomic Design)
- **Atoms:** Basic UI elements (Buttons, Inputs).
- **Molecules:** Simple combinations (Form fields with labels).
- **Organisms:** Complex, stateful sections (FlashcardPlayer, SyncStatusIndicator).
- **Pages:** Route entry points that orchestrate Organisms.
- **Colocation:** Components specific to a feature live inside `features/[feature]/ui/`.

## 3. STATE MANAGEMENT RULES
- **Server State:** Use React Query (`@tanstack/react-query`) for all server data fetching, caching, and offline-first persistence synchronization.
- **Global UI State:** Use Zustand for global client state (e.g., UI themes, open modals, sidebar toggles).
- **Local State:** Use `useState`/`useReducer` for strictly localized component state (e.g., form input before submit).

## 4. FOLDER STRUCTURE CONVENTIONS
```text
frontend/
├── app/                  # Next.js App Router
├── components/           # Shared UI components (Atoms/Molecules)
├── features/             # Vertical slices
│   └── [feature_name]/
│       ├── api/          # React Query hooks and fetch wrappers
│       ├── hooks/        # Custom React hooks
│       └── ui/           # Feature-specific Organisms
└── lib/                  # Utilities, Zustand stores, Sync Engine
```

## 5. DATA FETCHING STRATEGY
- **Server Components:** Fetch directly via `fetch()` with Next.js caching.
- **Client Components:** Fetch via React Query. Do not use `useEffect` for data fetching.
- **Offline-First:** All mutations must go through the Sync Engine outbox queue. Do not call backend write endpoints directly from UI components.

## 6. PERFORMANCE RULES
- **Memoization:** Use `React.memo`, `useMemo`, and `useCallback` only when props are demonstrably causing expensive re-renders. Do not preemptively memoize everything.
- **Lazy Loading:** Use `next/dynamic` for heavy components (e.g., charts, heavy animations) that are not immediately visible.

## 7. TAILWINDCSS USAGE RULES
- **No Inline CSS:** All styling MUST use Tailwind utility classes.
- **Clean Class Strings:** Use `clsx` and `tailwind-merge` (`cn()` utility) to construct dynamic class names safely.
- **Design Tokens:** Follow the configured `tailwind.config.ts` colors and spacing. Do not use arbitrary values (e.g., `w-[31px]`) unless absolutely necessary.
