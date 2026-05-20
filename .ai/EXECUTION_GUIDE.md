# EXECUTION_GUIDE.md
# 🎯 AI StudyFlow — Execution Guide

## PURPOSE

This document defines the official operational workflow for all AI agents working inside the AI StudyFlow repository.

The primary goals are:
- preserve architecture stability
- enforce safe execution
- minimize token usage
- isolate feature contexts
- prevent dangerous refactors
- reduce hallucinations
- ensure maintainable incremental development

This document defines HOW AI agents must operate.

---

# 1. MANDATORY EXECUTION ORDER

Before performing ANY task, AI agents MUST follow this exact sequence:

1. Read `.cursorrules`
2. Read `.ai/AI_ENTRYPOINT.md`
3. Read `.ai/context_loading.md`
4. Read `.ai/memory/current_session.md`
5. Determine current roadmap phase
6. Load ONLY required context
7. Check feature boundaries
8. Check impact map if modifying existing systems
9. Execute in the smallest safe scope possible

Failure to follow execution order is considered a critical architecture violation.

---

# 2. PHASE EXECUTION LOCKING

AI agents MUST respect roadmap sequencing.

LOCKED phases MUST NOT be implemented prematurely.

Example:
- AI insight systems MUST NOT be implemented before analytics maturity
- analytics systems MUST NOT be implemented before session engine stability
- LLM systems MUST NOT be implemented before sufficient historical data exists

Roadmap discipline is mandatory.

Reference:
- `.ai/ROADMAP.md`

---

# 3. TASK CLAIMING PROTOCOL

Before starting implementation:

Update:
- `.ai/memory/current_session.md`

Include:
- active task
- affected files
- feature scope
- implementation status

This acts as short-term operational memory.

---

# 4. CONTEXT LOADING PHILOSOPHY

The repository uses selective context loading.

AI agents MUST NEVER:
- load entire repository blindly
- scan unrelated features
- inspect unnecessary files
- perform repository-wide analysis without reason

Goals:
- lower token usage
- safer reasoning
- isolated execution
- reduced hallucinations

The preferred workflow is:

small task
→ isolated context
→ targeted execution
→ minimal blast radius

---

# 5. DEVELOPMENT STRATEGY

The system evolves incrementally.

Required architectural progression:

1. infrastructure
2. backend foundation
3. session engine
4. analytics
5. AI systems
6. optimization

Never skip foundational layers.

Stable architecture is more important than implementation speed.

---

# 6. GOLDEN ENGINEERING RULES

## Rule 1 — Backend Authority

The backend is the single source of truth.

The frontend MUST NEVER:
- calculate authoritative durations
- generate trusted timestamps
- bypass validation
- modify analytics directly

Critical calculations belong to the backend.

---

## Rule 2 — Feature Isolation

Each feature must remain isolated.

Changes inside one feature should NOT require modifications across unrelated systems.

If implementation requires touching many unrelated files:

STOP and reassess architecture boundaries.

---

## Rule 3 — Minimal Safe Refactoring

Never perform massive refactors during normal feature implementation.

Refactoring rules:
- isolate changes
- validate dependencies
- preserve contracts
- update documentation
- update impact maps

Small safe refactors are preferred.

---

## Rule 4 — Stability Before Optimization

Never optimize prematurely.

Priority order:

1. correctness
2. stability
3. maintainability
4. observability
5. optimization

---

# 7. STANDARD FEATURE IMPLEMENTATION FLOW

When creating new features:

---

## Step 1 — Load Context

Read:
- FEATURE_BOUNDARIES.md
- relevant architecture files
- relevant rules
- target feature context

---

## Step 2 — Define Scope

Determine:
- responsibilities
- boundaries
- dependencies
- risks
- blast radius

---

## Step 3 — Backend First

Backend responsibilities:
- business logic
- validation
- persistence
- calculations
- synchronization

---

## Step 4 — Frontend Integration

Frontend responsibilities:
- UI rendering
- local state handling
- optimistic updates
- API communication

---

## Step 5 — Validation & Testing

Required:
- unit tests
- integration tests
- edge-case validation

---

## Step 6 — Documentation Updates

Update:
- completed_tasks.md
- ai_changes.md
- architecture docs if affected
- ADR files if architecture changed

Documentation is part of the system architecture.

---

# 8. STANDARD BUG FIXING FLOW

Before fixing bugs:

1. reproduce issue
2. identify root cause
3. analyze dependencies
4. inspect impact map
5. fix smallest safe scope
6. validate architecture consistency
7. update known_bugs.md if needed

Never patch symptoms blindly.

Root-cause analysis is mandatory.

---

# 9. DATABASE SAFETY RULES

Database modifications are HIGH RISK operations.

Before modifying schema:

MANDATORY:
1. read database rules
2. analyze migration impact
3. verify backward compatibility
4. preserve production safety

NEVER:
- drop critical columns casually
- rename tables without migration planning
- generate destructive migrations blindly

Reference:
- `.ai/workflows/database_safety.md`

---

# 10. SESSION ENGINE SAFETY

The Session Engine is the most critical subsystem.

Any modifications require:
- state validation
- synchronization review
- heartbeat validation
- offline recovery validation
- duration accuracy verification

Critical rules:
- backend-authoritative timing only
- UTC timestamps only
- backend duration calculations only

---

# 11. OFFLINE SYNCHRONIZATION RULES

Offline mode must prioritize:

1. user continuity
2. eventual consistency
3. safe reconciliation
4. duplicate prevention

Frontend local state is temporary.

Backend remains authoritative.

---

# 12. AI PIPELINE SAFETY

AI systems must evolve incrementally.

Required progression:

1. rule-based intelligence
2. statistical intelligence
3. LLM intelligence

Advanced AI systems MUST NOT activate before sufficient reliable data exists.

---

# 13. TOKEN OPTIMIZATION STRATEGY

To minimize token usage:

AI agents SHOULD:
- load minimal context
- avoid large-file scanning
- isolate execution scope
- reuse known context
- avoid repeated file loading

More context is NOT always better.

Excessive context:
- increases hallucinations
- reduces reasoning precision
- increases architecture drift

---

# 14. DOCUMENTATION DISCIPLINE

After major implementation work:

Update relevant:
- roadmap
- architecture docs
- dependency maps
- impact maps
- completed tasks
- AI change logs

Documentation maintenance is mandatory.

---

# 15. CHANGE TRACKING RULES

All significant AI-generated changes must be logged.

Required log information:
- date
- modified files
- purpose
- affected systems
- migration impact
- rollback considerations

Reference:
- `.ai/logs/ai_changes.md`

---

# 16. REFACTOR SAFETY PROTOCOL

Before refactoring:

1. identify dependencies
2. identify affected systems
3. inspect impact_map.md
4. isolate blast radius
5. preserve contracts
6. verify backward compatibility

If blast radius is unclear:

DO NOT REFACTOR.

---

# 17. SCALABILITY PHILOSOPHY

The architecture must support future:
- mobile apps
- desktop apps
- local AI inference
- AI agents
- analytics expansion
- vector search
- multi-device synchronization

Avoid tightly coupled systems.

---

# 18. FINAL OPERATIONAL PRINCIPLE

The repository must remain:

- modular
- explainable
- maintainable
- scalable
- AI-readable
- token-efficient
- safe to extend
- safe to refactor

Every implementation decision must support these goals.

---

# FINAL DIRECTIVE

AI agents are expected to behave like:
- senior software architects
- production backend engineers
- systems engineers

NOT generic code generators.