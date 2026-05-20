# context_loading.md
# 🚦 AI StudyFlow — Context Loading System

## PURPOSE

This file defines the official context loading strategy for all AI agents operating inside this repository.

The system is designed to:
- minimize token consumption
- prevent context explosion
- isolate feature domains
- reduce hallucinations
- preserve architecture integrity
- improve execution precision

Context loading is STRICTLY controlled.

The AI MUST load ONLY the minimum required context.

---

# CORE LOADING PRINCIPLE

LOAD LESS FIRST.

Additional context should only be loaded incrementally when truly necessary.

More context does NOT mean better execution.

Excessive context causes:
- hallucinations
- architecture drift
- token waste
- reasoning degradation
- cross-feature contamination

---

# PRIMARY RULES

The AI MUST NEVER:
- scan the full repository
- recursively inspect directories
- read all markdown files
- inspect unrelated features
- load frontend and backend simultaneously without need
- reload unchanged files repeatedly

The AI MUST:
- identify the active task first
- isolate the affected feature
- load only relevant files
- stop loading when sufficient information exists

---

# EXECUTION PRIORITY ORDER

Always follow this loading order.

---

## STEP 1 — RESTORE CURRENT TASK CONTEXT

FIRST READ:
.ai/memory/current_session.md

Determine:
- active task
- active feature
- current implementation phase
- active bugs
- temporary architectural decisions

DO NOT load architecture docs yet.

---

## STEP 2 — IDENTIFY TASK TYPE

Determine task category:

| Task Type | Required Context |
|---|---|
| Bug Fix | Related feature + impact map |
| New Feature | Feature boundaries + contracts |
| Refactor | Refactor rules + dependencies |
| Database Change | Database rules + schema docs |
| API Work | API contracts + backend rules |
| Frontend UI | Frontend rules + target components |
| Session Logic | State machine docs |
| AI Pipeline | AI pipeline architecture |
| Testing | Testing strategy docs |

Load ONLY the required context.

---

## STEP 3 — LOAD MINIMAL CONTEXT

ONLY load:
- affected feature docs
- affected source files
- required architecture files
- required rules

Avoid secondary systems unless explicitly required.

---

## STEP 4 — STOP LOADING

STOP loading more context when:
- task scope is clear
- implementation can begin safely
- architectural constraints are understood
- required dependencies are identified

Do NOT continue reading “just in case”.

---

# FEATURE ISOLATION STRATEGY

Each feature inside:
.ai/features/

is treated as an isolated bounded context.

If working on:
- authentication

ONLY load:
- .ai/features/auth/
- related backend files
- related API contracts
- related database schema if required

DO NOT load:
- session engine
- AI pipeline
- unrelated frontend systems
- unrelated workflows

unless explicitly necessary.

---

# SAFE ARCHITECTURE LOADING

Before loading architecture documents, ask:

1. Is this file necessary?
2. Is current context insufficient?
3. Will loading this improve execution accuracy?

If NO:
DO NOT LOAD IT.

Architecture files are HIGH-COST context.

---

# TASK-SPECIFIC LOADING RULES

## Backend API Tasks

LOAD:
- .ai/rules/backend.md
- .ai/architecture/api_contracts.md
- related feature docs
- affected backend source files

DO NOT LOAD:
- frontend UI components
- unrelated feature systems
- AI pipeline docs

unless required.

---

## Frontend UI Tasks

LOAD:
- .ai/rules/frontend.md
- related frontend components
- target feature docs

DO NOT LOAD:
- backend services
- database internals
- Celery jobs
- AI inference systems

unless required.

---

## Database Tasks

MANDATORY LOAD:
- .ai/rules/database.md
- .ai/workflows/database_safety.md
- .ai/architecture/database_schema.md
- .ai/architecture/impact_map.md

DO NOT LOAD:
- unrelated frontend systems
- unrelated route handlers

---

## Session Engine Tasks

MANDATORY LOAD:
- .ai/architecture/session_state_machine.md
- .ai/architecture/offline_sync.md
- .ai/features/session_engine/

DO NOT LOAD:
- analytics systems
- unrelated auth logic
- unrelated UI modules

unless required.

---

## Refactor Tasks

MANDATORY LOAD:
- .ai/rules/refactor.md
- .ai/architecture/dependencies.md
- .ai/architecture/impact_map.md

Determine:
- blast radius
- dependency chain
- regression risk

Avoid broad rewrites.

---

## AI Pipeline Tasks

LOAD:
- .ai/architecture/ai_pipeline.md
- .ai/features/ai_pipeline/
- related ADR documents

Avoid loading unrelated application logic.

AI systems are HIGH-COMPLEXITY areas.

---

# GLOBAL DENY LIST

NEVER LOAD:
- node_modules/
- package-lock files
- venv/
- __pycache__/
- build artifacts
- .next/
- dist/
- coverage/
- .env files
- .ai/memory/archive/

unless explicitly required by the user.

---

# MEMORY LOADING STRATEGY

## High Priority Memory

Current runtime state:
.ai/memory/current_session.md

Contains:
- active task
- current files
- active bugs
- temporary notes

Prioritize heavily.

---

## Medium Priority Memory

Known recurring issues:
.ai/memory/known_bugs.md

Load ONLY during debugging.

---

## Low Priority Memory

Historical context:
- completed tasks
- archived memory
- old architectural decisions

Load ONLY if necessary.

---

# TOKEN OPTIMIZATION DIRECTIVE

Token efficiency is a SYSTEM REQUIREMENT.

Optimize for:
1. minimal context
2. isolated reasoning
3. architecture stability
4. execution precision

NOT for:
- maximum repository awareness
- exhaustive analysis
- full system loading

---

# FINAL DIRECTIVE

If uncertain:

LOAD LESS FIRST.

Context should be expanded incrementally, not preloaded aggressively.