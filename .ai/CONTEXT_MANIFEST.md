# AI StudyFlow — Context Manifest

> Single routing file for all AI agents. Replaces AI_ENTRYPOINT.md + context_loading.md + SYSTEM_OVERVIEW.md.
> Last updated: 2026-07-02 | R5.5 Pixel Art Sprite Engine active

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14+ (App Router), React, TypeScript, Tailwind CSS v4, Zustand, Lottie, GSAP |
| Backend | FastAPI, Python 3.11+, SQLAlchemy, Pydantic, PostgreSQL, Redis, Celery |
| Infra | Docker Compose, PgBouncer, Ollama (local AI) |

Architecture: Vertically-sliced modular monolith, single-tenant, AI-native context-engineered.

---

## Core Files — ALWAYS LOAD at session start

### Antigravity 2.0 (Project Orchestrator) — 12 files

| # | File | Purpose |
|---|------|---------|
| 1 | `.ai/CONTEXT_MANIFEST.md` | This file — routing |
| 2 | `.agents/AGENTS.md` | Workspace rules |
| 3 | `PRODUCT.md` | Product vision & brand |
| 4 | `DESIGN.md` | Design tokens & visual system |
| 5 | `TEAM_BOUNDARIES.md` | Agent role boundaries (3 agents) |
| 6 | `.ai/memory/current_session.md` | Current session state |
| 7 | `.ai/ROADMAP.md` | Frontend roadmap (R5.5 → R10-NEW) |
| 8 | `backend/docs/JULES_ONBOARDING.md` | Backend roadmap (B1 → B6) |
| 9 | `backend/docs/API_CONTRACTS.md` | API contracts |
| 10 | `backend/docs/DATABASE_SCHEMA.md` | DB schema |
| 11 | `ANTIGRAVITY_PROMPT.md` | Antigravity IDE prompt |
| 12 | `JULES_PROMPT.md` | Jules prompt |

### Antigravity IDE (Frontend Agent) — 7 files

| # | File | Purpose |
|---|------|---------|
| 1 | `.ai/CONTEXT_MANIFEST.md` | This file — routing |
| 2 | `.agents/AGENTS.md` | Workspace rules (auto-loaded) |
| 3 | `.cursorrules` | Governance (auto-loaded) |
| 4 | `PRODUCT.md` | Product vision & brand |
| 5 | `DESIGN.md` | Design tokens & visual system |
| 6 | `TEAM_BOUNDARIES.md` | Agent role boundaries |
| 7 | `.ai/memory/current_session.md` | Current session state |

### Jules (Backend Agent) — 6 files

| # | File | Purpose |
|---|------|---------|
| 1 | `.ai/CONTEXT_MANIFEST.md` | This file — routing |
| 2 | `backend/docs/JULES_ONBOARDING.md` | Jules entrypoint & roadmap |
| 3 | `TEAM_BOUNDARIES.md` | Agent role boundaries |
| 4 | `backend/docs/API_CONTRACTS.md` | API contracts (Jules owns) |
| 5 | `backend/docs/DATABASE_SCHEMA.md` | DB schema (Jules owns) |
| 6 | `PRODUCT.md` | Product vision (READ ONLY) |

---

## On-Demand Files — LOAD BY TASK TYPE

| Task Type | Agent | Additional Files |
|-----------|-------|-----------------|
| Frontend UI | Antigravity | `.ai/architecture/ui_architecture.md`, `.ai/rules/frontend.md`, `frontend/src/components/room/engine/SpriteManifest.ts` |
| Refactor | Antigravity | `.ai/rules/refactor.md`, `.ai/architecture/impact_map.md`, `.ai/architecture/dependencies.md` |
| Bug Fix | Both | `.ai/memory/known_bugs.md`, `.ai/architecture/impact_map.md` |
| New Feature | Antigravity | `.ai/features/FEATURE_BOUNDARIES.md`, target feature dir |
| Session Engine | Antigravity | `.ai/architecture/session_state_machine.md`, `.ai/architecture/offline_sync.md` |
| AI Pipeline | Antigravity | `.ai/architecture/ai_pipeline.md` |
| AI Behavior | Antigravity | `.ai/rules/ai_behavior.md` |
| Database | Jules | `.ai/rules/database.md`, `.ai/workflows/database_safety.md` |
| Backend API | Jules | `.ai/rules/backend.md`, `backend/docs/BACKEND_ARCHITECTURE.md` |
| Testing | Jules | `backend/docs/TESTING_GUIDE.md` |
| Roadmap Check | Both | `.ai/ROADMAP.md`, `.ai/EXECUTION_GUIDE.md` |

---

## Loading Rules

1. **LOAD LESS FIRST** — expand incrementally, never preload aggressively
2. **STOP** loading when task scope is clear
3. **NEVER** scan full repository, load unrelated features, or reload unchanged files
4. **Feature isolation**: load only the target feature from `.ai/features/<name>/`
5. **Memory priority**: `current_session.md` first, `known_bugs.md` only when debugging

## Source of Truth

| Domain | File |
|--------|------|
| Database schema | `backend/docs/DATABASE_SCHEMA.md` |
| API contracts | `backend/docs/API_CONTRACTS.md` |
| Backend architecture | `backend/docs/BACKEND_ARCHITECTURE.md` |
| UI architecture | `.ai/architecture/ui_architecture.md` |
| Feature boundaries | `.ai/features/FEATURE_BOUNDARIES.md` |
| Architecture decisions | `.ai/adr/` |
| Global rules | `.ai/rules/global.md` |
