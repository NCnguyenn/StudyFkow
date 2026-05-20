# AI_ENTRYPOINT.md
# 🧠 AI StudyFlow — AI Runtime Entrypoint System

## PURPOSE

This file is the central runtime controller for all AI agents operating inside this repository.

It defines:
- execution flow
- context loading order
- architectural safety rules
- memory restoration
- feature isolation
- token optimization strategy

This repository uses an AI-native architecture designed for:
- long-term maintainability
- scalable development
- safe AI-assisted coding
- context isolation
- minimal token consumption

DO NOT randomly scan the repository.

DO NOT load unnecessary context.

Operate strictly on a NEED-TO-KNOW basis.

---

# INITIALIZATION SEQUENCE

At the start of EVERY new task:

## Step 1 — Restore Runtime Memory

READ:
.ai/memory/current_session.md

Understand:
- active tasks
- ongoing implementations
- active bugs
- unfinished refactors
- temporary architecture decisions

---

## Step 2 — Load Context Rules

READ:
.ai/context_loading.md

Determine:
- affected feature
- required architectural scope
- allowed context files
- forbidden context areas

---

## Step 3 — Assess System Impact

IF the task modifies:
- shared logic
- architecture
- APIs
- database
- session engine
- synchronization flow

READ:
.ai/architecture/impact_map.md

Analyze:
- dependency chain
- affected modules
- risk level
- regression probability

---

# CONTEXT ROUTING MAP

Use this routing map instead of scanning the repository.

---

## 📖 High-Level System Knowledge

Project overview:
.ai/SYSTEM_OVERVIEW.md

Current roadmap:
.ai/ROADMAP.md

Execution strategy:
.ai/EXECUTION_GUIDE.md

---

## 🏗️ Architecture Context

Database schema:
.ai/architecture/database_schema.md

API contracts:
.ai/architecture/api_contracts.md

Session engine:
.ai/architecture/session_state_machine.md

Offline synchronization:
.ai/architecture/offline_sync.md

AI pipeline:
.ai/architecture/ai_pipeline.md

Dependencies:
.ai/architecture/dependencies.md

Impact analysis:
.ai/architecture/impact_map.md

---

## 📜 Rules & Engineering Standards

Global rules:
.ai/rules/global.md

Backend rules:
.ai/rules/backend.md

Frontend rules:
.ai/rules/frontend.md

Database rules:
.ai/rules/database.md

AI behavior rules:
.ai/rules/ai_behavior.md

Refactor safety:
.ai/rules/refactor.md

---

## 🧩 Feature Contexts

Feature boundaries:
.ai/features/FEATURE_BOUNDARIES.md

Load ONLY the target feature context.

Never load unrelated features unless explicitly required.

---

## ⚙️ Standard Workflows

Feature creation:
.ai/workflows/feature_creation.md

Bug fixing:
.ai/workflows/bug_fixing.md

API creation:
.ai/workflows/api_creation.md

Database safety:
.ai/workflows/database_safety.md

Refactor flow:
.ai/workflows/refactor_flow.md

---

## 💾 Runtime Memory

Current session:
.ai/memory/current_session.md

Known bugs:
.ai/memory/known_bugs.md

Completed tasks:
.ai/memory/completed_tasks.md

---

## 🏛️ Architecture Decisions

ADR directory:
.ai/adr/

Never override documented architectural decisions.

---

# CORE EXECUTION RULES

## 1. Minimal Context Loading

ALWAYS:
- load the minimum required context
- stop reading once sufficient information is obtained
- isolate reasoning to affected modules

NEVER:
- scan the full repository
- read unrelated features
- inspect entire frontend/backend trees
- reload unchanged contexts repeatedly

---

## 2. Feature Isolation Enforcement

Each feature is treated as an isolated subsystem.

DO NOT:
- leak business logic across domains
- create hidden dependencies
- bypass API contracts
- duplicate business logic
- couple unrelated modules

Preserve modular architecture at all times.

---

## 3. Architecture Safety

Before modifying core systems:

MANDATORY:
- analyze dependency impact
- validate API compatibility
- preserve database integrity
- preserve state machine integrity
- preserve offline synchronization safety

Shared systems are HIGH-RISK areas.

Proceed cautiously.

---

## 4. Safe Refactoring

Before any refactor:

READ:
- .ai/rules/refactor.md
- .ai/architecture/impact_map.md

Avoid:
- broad rewrites
- architecture drift
- unnecessary replacements
- hidden regressions

Prefer:
- extension over replacement
- composition over duplication
- isolated modifications

---

## 5. Database Protection Rules

Database operations are CRITICAL operations.

Before modifying:
- schema
- migrations
- indexes
- constraints
- relationships

READ:
- .ai/rules/database.md
- .ai/workflows/database_safety.md
- .ai/architecture/database_schema.md

Never generate destructive migrations without explicit confirmation.

---

## 6. Session Engine Protection

The session engine is a critical subsystem.

Before modifying:
- timers
- session lifecycle
- heartbeat logic
- pause/resume logic
- offline recovery
- synchronization behavior

READ:
- .ai/architecture/session_state_machine.md
- .ai/architecture/offline_sync.md

Preserve:
- idempotency
- duration accuracy
- recovery consistency
- synchronization safety

---

# EXECUTION FLOW

For every implementation task:

1. Restore memory
2. Load context rules
3. Identify affected feature
4. Load minimal required context
5. Check architecture impact
6. Execute safely
7. Validate compatibility
8. Update memory and logs

---

# TASK COMPLETION PROTOCOL

After task completion:

UPDATE:
- .ai/memory/current_session.md
- .ai/memory/completed_tasks.md
- .ai/logs/ai_changes.md

IF architecture changed:
- update ADRs
- update dependencies map
- update impact map

---

# AI OPERATIONAL BEHAVIOR

You are NOT a generic code generator.

Operate like:
- a senior software architect
- a production-grade engineer
- a systems engineer
- an infrastructure-aware developer

Prioritize:
1. Stability
2. Architecture consistency
3. Data integrity
4. Maintainability
5. Scalability
6. Token efficiency
7. Developer experience

Never sacrifice long-term architecture for short-term speed.

---

# FINAL DIRECTIVE

This repository follows AI-first engineering principles.

Context corruption is considered a critical system failure.

Stay localized.
Stay modular.
Stay dependency-safe.
Stay architecture-aware.