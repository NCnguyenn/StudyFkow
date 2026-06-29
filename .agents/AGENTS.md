# AI StudyFlow — Agent Instructions

## Workflow (3 bước)

1. **NẠP**: Đọc `.ai/CONTEXT_MANIFEST.md` → Core files → `current_session.md` + `ROADMAP.md` → xác định phase & task tiếp theo → đọc on-demand files cho task đó.
2. **CODE**: Thực hiện task. Production-ready, không placeholder.
3. **VERIFY**: `cd frontend && npx tsc --noEmit` → cập nhật `current_session.md`.

## File-Scoped Commands

| Task | Command |
|------|---------|
| Frontend dev | `cd frontend && npm run dev` |
| Frontend typecheck | `cd frontend && npx tsc --noEmit` |
| Frontend build | `cd frontend && npm run build` |
| Backend dev | `cd backend && uvicorn main:app --reload --port 8000` |
| Backend test | `cd backend && python -m pytest` |

## Commit Attribution

AI commits MUST include:
```
Co-Authored-By: Antigravity <noreply@google.com>
```

## Key Conventions

- **Plan → Execute → Verify**: Draft plan for non-trivial changes. Write production-ready code (no placeholders). Verify visually or with tests before claiming done.
- **Feature Isolation**: No cross-feature imports. Each vertical slice is isolated.
- **Token Conservation**: Load minimum context per `.ai/CONTEXT_MANIFEST.md`. Never scan full workspace.
- **Backend is Jules' domain**: Antigravity NEVER modifies `backend/`. Jules NEVER modifies `frontend/` or `.ai/`.
- **API Contract sync point**: `backend/docs/API_CONTRACTS.md` — Jules writes, Antigravity reads.

## Forbidden Technologies

- `pixi.js`, `three.js`, `react-three-fiber` — No WebGL
- `framer-motion` — Use CSS `@keyframes` + GSAP
- Composite PNG/WebP for room base — Use inline SVG
- Paid APIs or assets — 100% free only

## Frontend UI Rules

- 2-Layer SVG: `.room-base` (z-0) + `.module-panel` (z-30) + HUD (z-55) + `.radial-menu` (z-60)
- Glassmorphism: `.room-glass` classes with `backdrop-filter` blur
- Room colors: 8-10 harmonious tones (wood browns, plant greens, sky blues, lamp amber). No monochrome.
- SVG objects: `<g>` groups styled via `--sf-room-*` CSS custom properties. No PNG images.
- Performance: Rain ≤30, Stars ≤35, Clouds ×3, Fireflies ≤12. Target 60fps, FCP <1.5s, RAM ≤80MB.

## Architecture Safety

- NEVER modify existing Zustand stores — only ADD new ones
- NEVER break drag-and-drop hooks or timer/focus engine logic
- KEEP all existing `--sf-*` CSS variables in `globals.css` — only ADD new ones
- Before modifying shared systems: load `.ai/architecture/impact_map.md`

## API Reference (READ ONLY for Antigravity)

- `backend/docs/API_CONTRACTS.md`
- `backend/docs/DATABASE_SCHEMA.md`
