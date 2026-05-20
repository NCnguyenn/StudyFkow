# SYSTEM_OVERVIEW.md
# 🌍 AI StudyFlow — System Overview

## 1. PROJECT IDENTITY

AI StudyFlow is an AI-powered, behavior-driven productivity and learning platform designed for students and knowledge workers.

Unlike traditional productivity apps that only track completed tasks, AI StudyFlow focuses on understanding HOW users study, work, and maintain focus over time.

The system converts raw session activity into:
- behavioral patterns
- productivity insights
- focus analytics
- AI-generated recommendations
- long-term learning intelligence

The platform is designed for:
- deep work tracking
- long-term productivity analysis
- offline-first reliability
- AI-assisted self-improvement

---

# 2. CORE SYSTEM PHILOSOPHY

The platform prioritizes:

1. Data accuracy
2. Backend authority
3. Stable architecture
4. Feature isolation
5. Incremental scalability
6. Token-efficient AI workflows

The system assumes:
- client devices are unreliable
- internet connections may fail
- frontend state can become inconsistent
- timestamps from clients cannot be trusted

Critical calculations MUST be validated by the backend.

---

# 3. HIGH-LEVEL ARCHITECTURE

Architecture style:
- vertically sliced modular monolith
- single-tenant architecture
- AI-native context-engineered repository

Frontend and backend are separated logically while maintaining isolated feature boundaries.

The repository is optimized for:
- safe AI-assisted development
- minimal context loading
- dependency-aware refactoring
- long-term maintainability

---

# 4. CORE TECHNOLOGY STACK

## Frontend

- Next.js (App Router)
- React
- TypeScript (Strict Mode)
- TailwindCSS
- Shadcn/ui
- Zustand / Context API

Responsibilities:
- UI rendering
- local timer management
- offline recovery
- optimistic updates
- API communication

---

## Backend

- FastAPI
- Python 3.11+
- SQLAlchemy
- Pydantic
- PostgreSQL
- Redis
- Celery

Responsibilities:
- business logic
- authentication
- synchronization
- session validation
- analytics
- AI orchestration
- duration calculation
- state management

---

## Infrastructure

- Docker Compose
- Redis
- PgBouncer
- Nginx (future)
- local AI inference support (Ollama)

---

# 5. CORE SYSTEM DOMAINS

## 5.1 Authentication System

Responsibilities:
- user authentication
- JWT handling
- refresh token rotation
- timezone management
- session security

---

## 5.2 Task & Timeline System

Responsibilities:
- task scheduling
- study planning
- productivity tracking
- session linking
- timeline visualization

This system represents planned user behavior.

---

## 5.3 Session Engine (Critical Subsystem)

The session engine is the HEART of the platform.

Responsibilities:
- session lifecycle management
- heartbeat validation
- pause/resume handling
- offline synchronization
- orphan recovery
- accurate duration calculation

Core states:
- PENDING
- ACTIVE
- PAUSED
- COMPLETED
- INTERRUPTED
- ERROR

The integrity of this subsystem is critical.

---

## 5.4 AI Pipeline

The AI system uses a layered architecture.

### Layer 1 — Rule-Based Intelligence

Simple deterministic behavioral analysis.

Examples:
- missed study streaks
- insufficient focus duration
- inactivity detection

---

### Layer 2 — Statistical Intelligence

Pattern-based productivity analysis.

Examples:
- peak focus hours
- consistency scoring
- interruption patterns

Requires sufficient session history.

---

### Layer 3 — LLM Intelligence

Advanced personalized recommendations generated from long-term behavioral patterns.

Examples:
- study habit coaching
- adaptive productivity suggestions
- personalized focus analysis

Requires validated historical data.

---

# 6. OFFLINE-FIRST DESIGN

The platform must continue functioning during:
- unstable internet
- temporary API failure
- reconnect events
- browser refresh
- intermittent synchronization

Frontend maintains temporary local state and synchronizes safely later.

Offline recovery consistency is a core requirement.

---

# 7. TIME & DATA INTEGRITY RULES

Critical system rules:

- all timestamps use UTC
- PostgreSQL uses TIMESTAMPTZ
- backend is source of truth
- client clocks are never trusted
- session durations are calculated on backend
- timezone values must use valid IANA timezone strings

Data integrity has higher priority than UI responsiveness.

---

# 8. ENGINEERING PRINCIPLES

The repository follows these principles:

- modular architecture
- isolated feature boundaries
- dependency-aware refactoring
- token-efficient AI workflows
- explicit architecture documentation
- safe migrations
- auditability
- backend authority
- incremental scalability

The system is optimized for long-term AI maintainability.

---

# 9. AI SAFETY & MAINTAINABILITY GOALS

The architecture is intentionally designed to:
- reduce hallucinations
- minimize unnecessary context loading
- prevent unsafe refactors
- isolate feature impact
- simplify upgrades
- support multi-AI workflows
- preserve architectural consistency

AI agents must behave as architecture-aware engineers.

---

# 10. LONG-TERM EXPANSION GOALS

Planned future capabilities include:
- AI study coach
- adaptive scheduling
- smart focus recommendations
- spaced repetition systems
- AI-generated summaries
- advanced analytics dashboards
- multi-device synchronization
- local-first AI inference
- AI memory systems

The architecture must remain scalable for future AI expansion.

---

# 11. SOURCE OF TRUTH

This file provides ONLY high-level system understanding.

For implementation details:

Database schemas:
- architecture/database_schema.md

API contracts:
- architecture/api_contracts.md

Feature logic:
- features/<feature_name>/

Rules:
- rules/

Workflows:
- workflows/

Architecture decisions:
- adr/

AI agents MUST NOT invent architecture outside documented specifications.